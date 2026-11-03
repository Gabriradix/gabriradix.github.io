const originalLoads = new WeakMap<HTMLImageElement, Promise<void>>();

export function mediaRetryUrl(source: string) {
  const url = new URL(source, document.baseURI);
  url.searchParams.set('media_retry', '1');
  return url.href;
}

/** Recover a transient failure once, without repeatedly downloading a broken asset. */
export function prepareImageRetry(image: HTMLImageElement) {
  if (image.hasAttribute('data-image-retry-ready')) return;
  image.setAttribute('data-image-retry-ready', '');
  const retry = () => {
    const source = image.getAttribute('src');
    if (!source || image.hasAttribute('data-image-retried')) return;
    image.setAttribute('data-image-retried', '');
    image.src = mediaRetryUrl(source);
  };
  image.addEventListener('error', retry, { once: true });
  if (image.complete && image.naturalWidth === 0) retry();
}

/** Keep the preview visible until the full-resolution image has loaded and decoded. */
export function loadOriginalImage(image: HTMLImageElement): Promise<void> {
  const pending = originalLoads.get(image);
  if (pending) return pending;
  const source = image.dataset.src;
  if (!source) return Promise.resolve();
  image.dataset.fullSrc = source;
  image.loading = 'eager';
  image.decoding = 'async';
  const clearBlur = () => {
    image.classList.remove('img-loading');
    image.removeAttribute('data-src');
  };
  if (image.getAttribute('src') === source) {
    clearBlur();
    prepareImageRetry(image);
    return Promise.resolve();
  }

  const task = new Promise<void>(resolve => {
    const original = new Image();
    original.decoding = 'async';
    original.fetchPriority = image.fetchPriority || 'auto';
    let retried = false;
    const finish = (success: boolean) => {
      if (image.isConnected) {
        if (success) {
          image.src = original.src;
          image.dataset.fullSrc = original.src;
        }
        clearBlur();
      }
      original.onload = null;
      original.onerror = null;
      resolve();
    };
    const retry = () => {
      if (retried) return finish(false);
      retried = true;
      original.src = mediaRetryUrl(source);
    };
    original.onerror = retry;
    original.onload = async () => {
      try {
        await original.decode();
        finish(true);
      } catch {
        retry();
      }
    };
    image.classList.add('img-loading');
    original.src = source;
  });
  originalLoads.set(image, task);
  return task;
}

export function loadLazyEmbed(iframe: HTMLIFrameElement) {
  const source = iframe.dataset.src;
  if (!source) return;
  iframe.loading = 'eager';
  if (!iframe.getAttribute('src')) iframe.src = source;
  iframe.removeAttribute('data-src');
}

export function loadVideoSources(video: HTMLVideoElement) {
  let changed = false;
  if (video.dataset.src) {
    video.src = video.dataset.src;
    video.removeAttribute('data-src');
    changed = true;
  }
  video.querySelectorAll<HTMLSourceElement>('source[data-src]').forEach(source => {
    source.src = source.dataset.src!;
    source.removeAttribute('data-src');
    changed = true;
  });
  if (changed) video.load();
}

/** One playback manager for hero and carousel videos, disposed on page navigation. */
export function observeAutoplayVideos() {
  const events = new AbortController();
  const visible = new Set<HTMLVideoElement>();
  const pending = new WeakSet<HTMLVideoElement>();
  const videos = document.querySelectorAll<HTMLVideoElement>(
    'video[data-autoplay], video[data-carousel-video]',
  );
  const play = (video: HTMLVideoElement) => {
    if (document.hidden || !visible.has(video)) {
      video.pause();
      return;
    }
    loadVideoSources(video);
    if (pending.has(video)) return;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    pending.add(video);
    video.play().catch(() => {}).finally(() => {
      pending.delete(video);
      if (events.signal.aborted) return;
      if (document.hidden || !visible.has(video)) video.pause();
    });
  };
  const resume = () => visible.forEach(play);
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const video = entry.target as HTMLVideoElement;
      if (entry.isIntersecting) {
        visible.add(video);
        play(video);
      } else {
        visible.delete(video);
        video.pause();
      }
    }
  });
  videos.forEach(video => observer.observe(video));
  document.addEventListener('visibilitychange', resume, { signal: events.signal });
  document.addEventListener('pointerdown', resume, { passive: true, signal: events.signal });
  window.addEventListener('pageshow', resume, { signal: events.signal });
  return () => {
    events.abort();
    observer.disconnect();
    videos.forEach(video => video.pause());
    visible.clear();
  };
}

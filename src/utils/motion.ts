export const motionChangeEvent = 'portfolio:motion-change';

export function isMotionPaused() {
  const preference = document.documentElement?.dataset?.motion;
  return preference === 'paused' || (preference !== 'running'
    && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches));
}

export function initializeMotionPreferences() {
  const refresh = () => {
    const paused = isMotionPaused();
    document.querySelectorAll<HTMLImageElement>('img[data-motion-poster]').forEach(image => {
      const source = paused ? image.dataset.motionPoster : image.dataset.motionSource;
      if (!source || image.getAttribute('src') === source) return;
      image.removeAttribute('data-src');
      image.classList.remove('img-loading');
      image.src = source;
    });
  };
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => {
    document.documentElement.dataset.motion = event.matches ? 'paused' : 'running';
    document.dispatchEvent(new CustomEvent(motionChangeEvent));
  });
  document.addEventListener(motionChangeEvent, refresh);
  document.addEventListener('astro:page-load', refresh);
  refresh();
}

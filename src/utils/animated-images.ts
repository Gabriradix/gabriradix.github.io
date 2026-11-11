import { isMotionPaused, motionChangeEvent } from './motion.ts';

/** Safari advertises image/jxl but renders only the first animation frame.
 * Keep unverified engines on animated WebP, including WebKit browsers on iOS.
 * This conservative allowlist can go once animation support is interoperable.
 */
export function supportsAnimatedJxl(userAgent = navigator.userAgent): boolean {
  if (/Edg\/|OPR\/|SamsungBrowser\//.test(userAgent)) return false;
  const chromium = userAgent.match(/(?:Chrome|Chromium)\/(\d+)/);
  const firefox = userAgent.match(/Firefox\/(\d+)/);
  return Number(chromium?.[1]) >= 155 || Number(firefox?.[1]) >= 158;
}

export function initializeAnimatedImages() {
  const events = new AbortController();
  const visible = new Set<HTMLImageElement>();
  const jxl = supportsAnimatedJxl();
  const images = document.querySelectorAll<HTMLImageElement>('img[data-animated-image]');
  const update = (image: HTMLImageElement) => {
    const running = visible.has(image) && !document.hidden && !isMotionPaused();
    const source = running
      ? (jxl ? image.dataset.animationJxl : image.dataset.animationFallback)
      : image.dataset.animationPoster;
    if (source && image.getAttribute('src') !== source) image.src = source;
  };
  const refresh = () => images.forEach(update);
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const image = entry.target as HTMLImageElement;
      if (entry.isIntersecting) visible.add(image);
      else visible.delete(image);
      update(image);
    }
  }, { rootMargin: '200px 0px' });
  images.forEach(image => {
    image.addEventListener('error', () => {
      // Recover from a codec failure using the animation, never a frozen JXL frame.
      if (image.src.includes('.jxl')) {
        image.dataset.animationJxl = image.dataset.animationFallback;
        update(image);
      }
    }, { signal: events.signal });
    observer.observe(image);
  });
  document.addEventListener(motionChangeEvent, refresh, { signal: events.signal });
  document.addEventListener('visibilitychange', refresh, { signal: events.signal });
  return () => { events.abort(); observer.disconnect(); visible.clear(); };
}

import { prepareImageRetry } from './lazy-media.ts';

/** Load a carousel's images before its automatic movement brings them into view. */
export function loadCarouselImages(container: ParentNode) {
  container.querySelectorAll<HTMLImageElement>('img').forEach(image => {
    if (image.hasAttribute('data-carousel-image-managed')) return;
    image.setAttribute('data-carousel-image-managed', '');

    if (!image.hasAttribute('data-animated-image')) prepareImageRetry(image);
    image.loading = 'eager';
  });
}

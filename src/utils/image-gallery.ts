import { getGestureAxis } from './gesture.ts';

/** Native modal semantics, focus containment and Escape; restore the exact image opener. */
export function initializeImageGallery() {
  const dialog = document.getElementById('lightbox') as HTMLDialogElement | null;
  const image = document.getElementById('lightbox-img') as HTMLImageElement | null;
  const status = document.getElementById('lightbox-status');
  if (!dialog || !image) return () => {};
  const events = new AbortController();
  let images: HTMLImageElement[] = [];
  let index = 0;
  let opener: HTMLImageElement | null = null;
  let previousOverflow = '';
  let previousPadding = '';
  let touchX = 0;
  let touchY = 0;
  const show = (next: number) => {
    if (!images.length) return;
    index = (next + images.length) % images.length;
    const source = images[index];
    image.src = source.dataset.fullSrc || source.dataset.src || source.currentSrc || source.src;
    image.alt = source.alt;
    const italian = document.documentElement.lang === 'it';
    if (status) status.textContent = italian
      ? `Immagine ${index + 1} di ${images.length}` : `Image ${index + 1} of ${images.length}`;
    dialog.querySelectorAll<HTMLButtonElement>('[data-gallery-step]').forEach(button => {
      button.hidden = images.length < 2;
    });
  };
  const open = (target: HTMLImageElement) => {
    images = Array.from(document.querySelectorAll<HTMLImageElement>('.gallery-img'));
    opener = target;
    show(images.indexOf(target));
    previousOverflow = document.body.style.overflow;
    previousPadding = document.body.style.paddingRight;
    document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    dialog.classList.add('active');
    dialog.querySelector<HTMLButtonElement>('[data-gallery-close]')?.focus();
  };
  document.addEventListener('click', event => {
    if (event.target instanceof HTMLImageElement && event.target.classList.contains('gallery-img')) open(event.target);
  }, { signal: events.signal });
  document.addEventListener('keydown', event => {
    if (event.target instanceof HTMLImageElement && event.target.classList.contains('gallery-img')
      && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      open(event.target);
    }
    if (!dialog.open) return;
    if (event.key === 'Tab') {
      const buttons = Array.from(dialog.querySelectorAll<HTMLButtonElement>('button')).filter(button => !button.hidden && !button.disabled);
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      }
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      show(index + (event.key === 'ArrowRight' ? 1 : -1));
    }
  }, { signal: events.signal });
  dialog.addEventListener('click', event => {
    const target = event.target as Element;
    if (target === dialog || target.closest('[data-gallery-close]')) dialog.close();
    const step = target.closest<HTMLElement>('[data-gallery-step]')?.dataset.galleryStep;
    if (step) show(index + Number(step));
  }, { signal: events.signal });
  dialog.addEventListener('close', () => {
    dialog.classList.remove('active');
    document.body.style.overflow = previousOverflow;
    document.body.style.paddingRight = previousPadding;
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  }, { signal: events.signal });
  dialog.addEventListener('touchstart', event => {
    touchX = event.changedTouches[0].clientX;
    touchY = event.changedTouches[0].clientY;
  }, { passive: true, signal: events.signal });
  dialog.addEventListener('touchend', event => {
    const dx = event.changedTouches[0].clientX - touchX;
    const dy = event.changedTouches[0].clientY - touchY;
    if (getGestureAxis(dx, dy, 50) === 'horizontal') show(index + (dx < 0 ? 1 : -1));
  }, { passive: true, signal: events.signal });
  return () => {
    if (dialog.open) dialog.close();
    events.abort();
  };
}

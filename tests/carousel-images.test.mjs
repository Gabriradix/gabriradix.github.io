import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCarouselImages } from '../src/utils/carousel-images.ts';

class Image extends EventTarget {
  attributes = new Map([['src', '/photo.webp?v=existing']]);
  loading = 'lazy';
  complete = false;
  naturalWidth = 0;
  src = '/photo.webp?v=existing';
  hasAttribute(name) { return this.attributes.has(name); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  setAttribute(name, value) { this.attributes.set(name, value); }
}

function fixture(t, images) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', {
    value: { baseURI: 'https://example.test/' }, configurable: true,
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else delete globalThis.document;
  });
  return { querySelectorAll: () => images };
}

test('nearby carousels load all slides before autoplay reaches them', t => {
  const images = [new Image(), new Image()];
  const carousel = fixture(t, images);
  assert.ok(images.every(image => image.loading === 'lazy'));
  loadCarouselImages(carousel);
  assert.ok(images.every(image => image.loading === 'eager'));
  assert.ok(images.every(image => image.src === '/photo.webp?v=existing'));
});

test('a transient image failure retries once and preserves the original URL parameters', t => {
  const image = new Image();
  const carousel = fixture(t, [image]);
  loadCarouselImages(carousel);
  image.dispatchEvent(new Event('error'));
  assert.equal(image.src, 'https://example.test/photo.webp?v=existing&media_retry=1');
  const retried = image.src;
  loadCarouselImages(carousel);
  image.dispatchEvent(new Event('error'));
  assert.equal(image.src, retried);
});

test('an image already broken before initialization is recovered without a page reload', t => {
  const image = new Image();
  image.complete = true;
  loadCarouselImages(fixture(t, [image]));
  assert.ok(image.src.includes('media_retry=1'));
  const retried = image.src;
  image.dispatchEvent(new Event('error'));
  assert.equal(image.src, retried);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadOriginalImage, loadLazyEmbed, loadVideoSources, observeAutoplayVideos } from '../src/utils/lazy-media.ts';

function replaceGlobal(t, name, value) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { value, configurable: true });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, name, previous);
    else delete globalThis[name];
  });
}

class Media extends EventTarget {
  dataset = {};
  src = '';
  isConnected = true;
  complete = false;
  naturalWidth = 0;
  loading = 'lazy';
  classes = new Set();
  classList = { add: name => this.classes.add(name), remove: name => this.classes.delete(name) };
  attributes = new Map();
  getAttribute(name) { return name === 'src' ? this.src : this.attributes.get(name) ?? null; }
  hasAttribute(name) { return this.attributes.has(name); }
  setAttribute(name, value) { this.attributes.set(name, value); }
  removeAttribute(name) {
    if (name === 'data-src') delete this.dataset.src;
    else this.attributes.delete(name);
  }
}

function imageFixture(t, outcomes) {
  const requests = [];
  replaceGlobal(t, 'document', { baseURI: 'https://example.test/' });
  replaceGlobal(t, 'Image', class {
    _src;
    outcome;
    set src(value) {
      this._src = value;
      requests.push(value);
      this.outcome = outcomes.shift() || 'load';
      queueMicrotask(() => this.outcome === 'error' ? this.onerror?.() : this.onload?.());
    }
    get src() { return this._src; }
    decode() { return this.outcome === 'decode-error' ? Promise.reject(new Error('Decode failed')) : Promise.resolve(); }
  });
  const image = new Media();
  image.src = '/preview.webp';
  image.dataset.src = '/original.jpg';
  return { image, requests };
}

test('gallery upgrades deduplicate requests and replace the preview only after decode', async t => {
  const { image, requests } = imageFixture(t, ['load']);
  const first = loadOriginalImage(image);
  assert.equal(image.src, '/preview.webp');
  assert.equal(loadOriginalImage(image), first);
  await first;
  assert.deepEqual(requests, ['/original.jpg']);
  assert.equal(image.src, '/original.jpg');
  assert.equal(image.dataset.src, undefined);
  assert.equal(image.dataset.fullSrc, '/original.jpg');
  assert.equal(image.classes.has('img-loading'), false);
});

test('failed or undecodable originals get one retry, then leave a readable preview', async t => {
  const { image, requests } = imageFixture(t, ['decode-error', 'error']);
  await loadOriginalImage(image);
  assert.deepEqual(requests, ['/original.jpg', 'https://example.test/original.jpg?media_retry=1']);
  assert.equal(image.src, '/preview.webp');
  assert.equal(image.dataset.src, undefined);
  assert.equal(image.dataset.fullSrc, '/original.jpg');
  assert.equal(image.classes.has('img-loading'), false);
});

test('navigation does not replace images on a detached page', async t => {
  const { image } = imageFixture(t, ['load']);
  const pending = loadOriginalImage(image);
  image.isConnected = false;
  await pending;
  assert.equal(image.src, '/preview.webp');
});

test('deferred iframe activation is idempotent and bypasses a second native lazy delay', () => {
  const iframe = new Media();
  iframe.dataset.src = '/interactive.html';
  loadLazyEmbed(iframe);
  assert.equal(iframe.src, '/interactive.html');
  assert.equal(iframe.loading, 'eager');
  assert.equal(iframe.dataset.src, undefined);
  loadLazyEmbed(iframe);
  assert.equal(iframe.src, '/interactive.html');
});

test('video sources are downloaded once when activated', () => {
  const source = new Media();
  source.dataset.src = '/film.mp4';
  let loads = 0;
  const video = { dataset: {}, querySelectorAll: () => source.dataset.src ? [source] : [], load: () => loads++ };
  loadVideoSources(video);
  loadVideoSources(video);
  assert.equal(source.src, '/film.mp4');
  assert.equal(loads, 1);
});

test('videos only load and play in view, pause when hidden, and stop on navigation', async t => {
  const doc = new EventTarget();
  doc.hidden = false;
  const win = new EventTarget();
  let callback;
  let disconnected = false;
  replaceGlobal(t, 'IntersectionObserver', class {
    constructor(handler) { callback = handler; }
    observe() {}
    disconnect() { disconnected = true; }
  });
  let loads = 0, plays = 0, pauses = 0;
  const video = new Media();
  video.dataset.src = '/video.mp4';
  video.querySelectorAll = () => [];
  video.load = () => loads++;
  video.play = () => { plays++; return Promise.resolve(); };
  video.pause = () => pauses++;
  doc.querySelectorAll = () => [video];
  replaceGlobal(t, 'document', doc);
  replaceGlobal(t, 'window', win);
  const stop = observeAutoplayVideos();
  assert.equal(loads, 0);
  callback([{ target: video, isIntersecting: true }]);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(loads, 1);
  assert.equal(plays, 1);
  doc.hidden = true;
  doc.dispatchEvent(new Event('visibilitychange'));
  assert.ok(pauses > 0);
  doc.hidden = false;
  doc.dispatchEvent(new Event('visibilitychange'));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(loads, 1);
  assert.equal(plays, 2);
  callback([{ target: video, isIntersecting: false }]);
  doc.dispatchEvent(new Event('pointerdown'));
  assert.equal(plays, 2);
  stop();
  assert.equal(disconnected, true);
  doc.dispatchEvent(new Event('pointerdown'));
  assert.equal(plays, 2);
});

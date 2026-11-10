import test from 'node:test';
import assert from 'node:assert/strict';
import { createAsciiPlayback, createAsciiRenderer } from '../src/utils/ascii-renderer.ts';

function fixture(t) {
  const draws = [];
  let glyphRasters = 0;
  const ctx = {
    createImageData: (width, height) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
    putImageData: image => draws.push(image),
  };
  const canvas = { width: 0, height: 0, getContext: () => ctx };
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { createElement: () => ({ getContext: () => ({
      fillText() { glyphRasters++; },
      getImageData(_x, _y, width, height) {
        const data = new Uint8ClampedArray(width * height * 4);
        for (let shade = 0; shade < 20; shade++) {
          for (let glyph = 1; glyph < 10; glyph++) {
            data.set([glyph, shade + 1, 50, 255], (shade * 18 * width + glyph * 13) * 4);
          }
        }
        return { data };
      },
    }) }) },
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else delete globalThis.document;
  });
  return { canvas, draws, get glyphRasters() { return glyphRasters; } };
}

test('cached waves retain the original character field while the pointer moves', t => {
  const { canvas, draws } = fixture(t);
  const renderer = createAsciiRenderer(canvas);
  renderer.resize(260, 180);
  for (const [time, mouseX, mouseY] of [[0, 50, 40], [1000, 50, 40], [1250, 190, 110]]) {
    draws.length = 0;
    renderer.render(time, mouseX, mouseY);
    assert.equal(draws.length, 1, 'only one canvas upload per frame');
    const image = draws[0];
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 20; c++) {
        const seconds = time * 0.001;
        const distance = Math.hypot(c - Math.floor(mouseX / 13), r - Math.floor(mouseY / 18));
        const z = (Math.sin(c * 0.12 - seconds * 2.5) * Math.cos(r * 0.08 + seconds * 1.5)
          + Math.sin(Math.hypot(c, r) * 0.04 - seconds * 2)) * 0.4
          + Math.sin(distance * 0.3 - seconds * 6) * Math.exp(-distance * 0.07) * 0.8
          + Math.sin(c * 2.3 + r * 3.7 + seconds * 10) * 0.08;
        const glyph = Math.max(0, Math.min(9, Math.floor((z + 1) * 5)));
        const offset = (r * 18 * image.width + c * 13) * 4;
        assert.equal(image.data[offset], glyph);
        assert.equal(image.data[offset + 1], glyph ? Math.round((80 + z * 40) / 8) + 1 : 0);
      }
    }
  }
});

test('glyphs are rasterized once per size and 4K drawing stays within the cell budget', t => {
  const setup = fixture(t);
  const renderer = createAsciiRenderer(setup.canvas);
  renderer.resize(1920, 1080);
  assert.equal(setup.glyphRasters, 180);
  renderer.render(0, 100, 100);
  renderer.render(16, 102, 102);
  renderer.resize(1920, 1080);
  assert.equal(setup.glyphRasters, 180);
  renderer.resize(3840, 2160);
  assert.equal(setup.glyphRasters, 360);
  setup.draws.length = 0;
  renderer.render(100, 1920, 1080);
  assert.equal(setup.draws.length, 1);
  assert.ok(Math.floor(setup.canvas.width / 13) * Math.floor(setup.canvas.height / 18) <= 12_000);
  assert.ok(setup.canvas.width * setup.canvas.height <= 13 * 18 * 12_000);
});

test('repeated hover starts share one loop, high-refresh displays are capped, and leave cancels immediately', () => {
  const queue = new Map();
  let id = 0;
  const draws = [];
  const playback = createAsciiPlayback(time => draws.push(time), callback => {
    queue.set(++id, callback);
    return id;
  }, frame => queue.delete(frame));
  const step = time => {
    const [frame, callback] = queue.entries().next().value;
    queue.delete(frame);
    callback(time);
  };
  playback.start();
  playback.start();
  assert.equal(queue.size, 1);
  step(0);
  step(8.3);
  step(16.6);
  step(24.9);
  assert.deepEqual(draws, [0, 16.6]);
  assert.equal(queue.size, 1);
  playback.stop();
  assert.equal(queue.size, 0);
  playback.start();
  step(25);
  assert.deepEqual(draws, [0, 16.6, 25]);
  playback.stop();
  assert.equal(queue.size, 0);
});

test('144 Hz scheduling retains a 60 fps average instead of dropping to 48 fps', () => {
  let pending;
  let draws = 0;
  const playback = createAsciiPlayback(() => draws++, callback => { pending = callback; return 1; }, () => {});
  playback.start();
  for (let frame = 0; frame < 144; frame++) pending(frame * 1000 / 144);
  assert.equal(draws, 60);
  playback.stop();
});

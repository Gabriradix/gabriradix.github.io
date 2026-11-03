import test from 'node:test';
import assert from 'node:assert/strict';
import { bindMobileReflow } from '../src/utils/about-scroll.ts';

function mobileBrowser(t) {
  const browser = new EventTarget();
  browser.innerWidth = 390;
  browser.visualViewport = new EventTarget();
  const frames = new Map();
  let nextFrame = 0;
  const replaceGlobal = (name, value) => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { value, configurable: true });
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, name, previous);
      else delete globalThis[name];
    });
  };
  replaceGlobal('window', browser);
  replaceGlobal('requestAnimationFrame', callback => { frames.set(++nextFrame, callback); return nextFrame; });
  replaceGlobal('cancelAnimationFrame', id => frames.delete(id));
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const flush = () => {
    const pending = [...frames.values()];
    frames.clear();
    for (const callback of pending) callback();
  };
  return { browser, flush };
}

test('scroll alone reflows the latest position without a tap, once per frame', t => {
  const { browser, flush } = mobileBrowser(t);
  let position = 0;
  const rendered = [];
  const stop = bindMobileReflow(() => rendered.push(position));
  browser.dispatchEvent(new Event('scroll'));
  position = 80;
  browser.dispatchEvent(new Event('scroll'));
  flush();
  assert.deepEqual(rendered, [80]);
  position = 150;
  browser.dispatchEvent(new Event('scroll'));
  flush();
  assert.deepEqual(rendered, [80, 150]);
  stop();
});

test('touch release and viewport changes capture final mobile sticky positions', t => {
  const { browser, flush } = mobileBrowser(t);
  let position = 0;
  const rendered = [];
  const stop = bindMobileReflow(() => rendered.push(position));
  browser.dispatchEvent(new Event('touchend'));
  flush();
  position = 120;
  t.mock.timers.tick(80);
  flush();
  assert.deepEqual(rendered, [0, 120]);
  position = 180;
  browser.visualViewport.dispatchEvent(new Event('resize'));
  flush();
  assert.deepEqual(rendered, [0, 120, 180]);
  position = 210;
  browser.dispatchEvent(new Event('scrollend'));
  flush();
  assert.equal(rendered.at(-1), 210);
  stop();
});

test('leaving About cancels pending work and returning reinstalls scroll listeners', t => {
  const { browser, flush } = mobileBrowser(t);
  let count = 0;
  const stop = bindMobileReflow(() => count++);
  browser.dispatchEvent(new Event('scroll'));
  stop();
  flush();
  t.mock.timers.tick(100);
  browser.dispatchEvent(new Event('touchcancel'));
  flush();
  assert.equal(count, 0);
  const stopAgain = bindMobileReflow(() => count++);
  browser.dispatchEvent(new Event('scroll'));
  flush();
  assert.equal(count, 1);
  browser.innerWidth = 1024;
  browser.dispatchEvent(new Event('scroll'));
  flush();
  assert.equal(count, 1);
  stopAgain();
});

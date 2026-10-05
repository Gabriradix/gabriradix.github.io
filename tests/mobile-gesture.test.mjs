import test from 'node:test';
import assert from 'node:assert/strict';
import { getGestureAxis } from '../src/utils/gesture.ts';

test('vertical scrolling with lateral finger drift remains vertical', () => {
  assert.equal(getGestureAxis(12, 80), 'vertical');
  assert.equal(getGestureAxis(-24, -100), 'vertical');
  assert.equal(getGestureAxis(50, 50), 'vertical');
});

test('small movements remain taps and horizontal swipes retain their axis', () => {
  assert.equal(getGestureAxis(5, 4), 'pending');
  assert.equal(getGestureAxis(-80, 12), 'horizontal');
  assert.equal(getGestureAxis(80, -12), 'horizontal');
});

test('lightbox ignores vertical drags and horizontal movement below its threshold', () => {
  assert.equal(getGestureAxis(55, 120, 50), 'vertical');
  assert.equal(getGestureAxis(49, 10, 50), 'pending');
  assert.equal(getGestureAxis(-60, 10, 50), 'horizontal');
});

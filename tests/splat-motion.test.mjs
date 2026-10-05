import test from 'node:test';
import assert from 'node:assert/strict';
import { Entity } from 'playcanvas';
import { explosionFrame, recycleZ } from '../public/progetti/surreal-splat-void/splat-motion.js';

test('disintegration preserves world placement and applies model scale once', () => {
  const anchor = new Entity();
  const motion = new Entity();
  const model = new Entity();
  anchor.addChild(motion);
  motion.addChild(model);
  anchor.setPosition(3, -2, -24);
  model.setLocalScale(0.15, 0.15, 0.15);
  const frame = explosionFrame(0.5, () => 0.5);
  motion.setLocalPosition(frame.x, frame.y, frame.z);
  motion.setLocalScale(frame.scale, frame.scale, frame.scale);
  assert.deepEqual(anchor.getPosition().toArray(), [3, -2, -24]);
  assert.equal(model.getLocalScale().x, 0.15);
  assert.equal(motion.getLocalScale().x, 0.5);
  assert.equal(model.getPosition().z, -24);
  motion.setLocalPosition(0, 0, 0);
  motion.setLocalScale(1, 1, 1);
  assert.equal(model.getLocalScale().x, 0.15);
  assert.equal(model.getPosition().z, -24);
});

test('disintegration finishes with nonnegative scale regardless of frame overshoot', () => {
  for (const elapsed of [1, 1.5, 2, 100]) {
    const frame = explosionFrame(elapsed, () => 0.5);
    assert.equal(frame.scale, 0);
    assert.equal(frame.done, elapsed >= 1.5);
    assert.ok(frame.y <= 1);
  }
});

test('corridor recycling retains row spacing in both travel directions', () => {
  assert.equal(recycleZ(8, 0, 4, 8), -24);
  assert.equal(recycleZ(-36, 0, 4, 8), -4);
  assert.equal(recycleZ(-12, 0, 4, 8), -12);
  for (const cameraZ of [-1000, -100, 100, 1000]) {
    const z = recycleZ(-12, cameraZ, 4, 8);
    assert.ok(z <= cameraZ + 4 && z >= cameraZ - 28);
    assert.equal(Math.abs((z + 12) % 32), 0);
  }
});

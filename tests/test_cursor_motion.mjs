import test from 'node:test';
import assert from 'node:assert/strict';
import { smoothRemoteCursor } from '../cursor_motion.js';

test('remote cursor takes incremental steps instead of jumping to a new sample', () => {
  const target = {x: 20, y: -10};
  const first = smoothRemoteCursor({x: 0, y: 0}, target, 16);
  assert.ok(first.x > 0 && first.x < target.x);
  assert.ok(first.y < 0 && first.y > target.y);
  const next = smoothRemoteCursor(first, target, 16);
  assert.ok(next.x > first.x && next.x < target.x);
  assert.ok(next.y < first.y && next.y > target.y);
});

test('cursor smoothing is independent of the frame interval', () => {
  const start = {x: 0, y: 0}, target = {x: 10, y: 20};
  const once = smoothRemoteCursor(start, target, 48);
  const twice = smoothRemoteCursor(smoothRemoteCursor(start, target, 24), target, 24);
  assert.ok(Math.abs(once.x - twice.x) < 1e-9);
  assert.ok(Math.abs(once.y - twice.y) < 1e-9);
});

test('a stable or zero-duration sample stays in place', () => {
  const point = {x: 12, y: 7};
  assert.deepEqual(smoothRemoteCursor(point, {x: 24, y: 14}, 0), point);
  assert.deepEqual(smoothRemoteCursor(point, point, 50), point);
});

test('the cursor eventually settles on its exact target', () => {
  let point = {x: -5, y: 3};
  const target = {x: 3, y: -5};
  for (let i = 0; i < 45; i++) point = smoothRemoteCursor(point, target, 16);
  assert.deepEqual(point, target);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { swap, phase } from '../lib/scene.mjs';

test('swaps preserve endpoints and avoid a midpoint collision', () => {
  assert.deepEqual(swap(0, 0, 200, 0, 0), [
    { x: 0, y: 0 },
    { x: 200, y: 0 },
  ]);
  const end = swap(0, 0, 200, 0, 1);
  assert.ok(Math.abs(end[0].x - 200) < 1e-10 && Math.abs(end[0].y) < 1e-10);
  assert.ok(Math.abs(end[1].x) < 1e-10 && Math.abs(end[1].y) < 1e-10);
  const middle = swap(0, 0, 200, 0, 0.5);
  assert.equal(middle[0].x, 100);
  assert.equal(middle[1].x, 100);
  assert.equal(middle[0].y, 80);
  assert.equal(middle[1].y, -80);
});

test('staged motion clamps outside its assigned interval', () => {
  assert.equal(phase(0, 0.2, 0.8), 0);
  assert.equal(phase(1, 0.2, 0.8), 1);
  assert.ok(Math.abs(phase(0.5, 0.2, 0.8) - 0.5) < 1e-10);
});

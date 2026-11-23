import test from 'node:test';
import assert from 'node:assert/strict';
import { draw } from '../animations/mixed-precision.mjs';

const paint = (scene, beat, beatP) => {
  const markers = [],
    arrows = [];
  const api = {
    C: new Proxy({}, { get: (_, key) => key }),
    components: { card: (value) => value },
    teaching: {},
    focus: { target: (_, fn) => fn() },
    clamp: (value) => Math.max(0, Math.min(1, value)),
    phase: (value, start, end) => Math.max(0, Math.min(1, (value - start) / (end - start))),
    text() {},
    math() {},
    rect() {},
    line() {},
    circle: (_, x, y, radius) => {
      if (radius > 5) markers.push({ x, y, radius });
    },
    arrow: (_, x1, y1, x2, y2) => arrows.push({ x1, y1, x2, y2 }),
  };
  draw({}, { id: scene }, { beat, beatP }, api);
  return { markers, arrows };
};

for (const scene of ['grid', 'formats']) {
  test(`${scene} retains the completed numerical demonstration during the policy paragraph`, () => {
    const completed = paint(scene, 1, 1);
    assert(completed.markers.length > 0);
    assert.notDeepEqual(paint(scene, 1, 0), completed);
    for (const progress of [0, 0.1, 0.5, 1]) assert.deepEqual(paint(scene, 2, progress), completed);
  });
}

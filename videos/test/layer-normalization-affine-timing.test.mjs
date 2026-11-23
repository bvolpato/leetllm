import test from 'node:test';
import assert from 'node:assert/strict';
import * as lesson from '../animations/layer-normalization.mjs';

const cues = (gain, shift) => ({
  'affine-first-feature-gain-b2-1': gain,
  'affine-last-feature-bias-b2-2': shift,
});
const before = { phase: 'before', progress: 0 };
const after = { phase: 'after', progress: 1 };

test('affine parameters follow their own measured phrases and retain their result', () => {
  const conceptual = lesson.affineState({ beat: 0, beatP: 0.8 });
  assert.deepEqual(conceptual.gamma, [1, 1, 1, 1]);
  assert.deepEqual(conceptual.beta, [0, 0, 0, 0]);
  const gain = lesson.affineState({
    beat: 1,
    beatP: 0.01,
    cues: cues({ phase: 'active', progress: 0.5 }, before),
  });
  assert.deepEqual(gain.gamma, [1.5, 1, 1, 1]);
  assert.deepEqual(gain.beta, [0, 0, 0, 0]);
  const shift = lesson.affineState({
    beat: 1,
    beatP: 0.01,
    cues: cues(after, { phase: 'active', progress: 0.5 }),
  });
  assert.deepEqual(shift.gamma, [2, 1, 1, 1]);
  assert.deepEqual(shift.beta, [0, 0, 0, 0.35]);
  for (let i = 0; i < 4; i++) {
    assert.equal(gain.values[i], conceptual.values[i] * gain.gamma[i]);
    assert.equal(shift.values[i], conceptual.values[i] * shift.gamma[i] + shift.beta[i]);
  }
  const held = lesson.affineState({ beat: 2, beatP: 0 });
  assert.deepEqual(held.gamma, [2, 1, 1, 1]);
  assert.deepEqual(held.beta, [0, 0, 0, 0.7]);
  assert.equal(held.mean, held.values.reduce((sum, value) => sum + value, 0) / 4);
});

test('the painter uses the cued parameters in the visible feature geometry', () => {
  const paint = (state) => {
    const text = [],
      curves = [];
    const api = {
      C: new Proxy({}, { get: (_, key) => key }),
      components: { fade: (_, fn) => fn() },
      teaching: { axes: () => ({}), curve: (o) => curves.push(o.points), scatter() {} },
      focus: { target: (_, fn) => fn() },
      clamp: (value) => Math.max(0, Math.min(1, value)),
      phase: (value, start, end) => Math.max(0, Math.min(1, (value - start) / (end - start))),
      text: (_, value) => text.push(String(value)),
      math() {},
    };
    lesson.draw({}, { id: 'affine' }, state, api);
    return { text, points: curves[0] };
  };
  const initial = paint({ beat: 0, beatP: 0.8 });
  assert(initial.text.includes('first gain 1.00'));
  const changed = paint({
    beat: 1,
    beatP: 0.01,
    cues: cues({ phase: 'active', progress: 0.5 }, before),
  });
  assert(changed.text.includes('first gain 1.50'));
  assert.equal(changed.points[0].y, initial.points[0].y * 1.5);
  assert.deepEqual(changed.points.slice(1), initial.points.slice(1));
});

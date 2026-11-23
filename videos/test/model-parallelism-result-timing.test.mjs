import test from 'node:test';
import assert from 'node:assert/strict';
import { draw, shards } from '../animations/model-parallelism.mjs';
const before = { phase: 'before', progress: 0 },
  after = { phase: 'after', progress: 1 };
const during = (progress) => ({ phase: 'during', progress });
function paint(scene, state) {
  const matrices = [],
    math = [];
  const api = {
    C: new Proxy({}, { get: (_, key) => String(key) }),
    clamp: (value) => Math.max(0, Math.min(1, value)),
    phase: (value, start, end) => Math.max(0, Math.min(1, (value - start) / (end - start))),
    focus: {
      target: (_, fn) => fn(),
      progress: (id, fallback) => state.cues?.[id]?.progress ?? fallback,
      reveal: (id, fn) => state.cues?.[id]?.phase !== 'before' && fn(),
    },
    components: {
      card: (options) => ({
        x: options.x,
        y: options.y,
        width: options.width,
        height: options.height,
      }),
      matrix: (options) => {
        matrices.push(options.values);
        return options;
      },
    },
    groupBounds: (value) => value,
    connect() {},
    text() {},
    math: (_, value) => math.push(value),
  };
  draw({}, { id: scene }, state, api);
  return { matrices, math };
}

test('all four reference coordinates are complete by their spoken complete-output cue and stay complete', () => {
  const complete = paint('linear', {
    beat: 1,
    beatP: 0.2,
    cues: {
      'column-products': after,
      'repeat-columns': after,
      'reference-output': during(0.3),
    },
  });
  assert.deepEqual(complete.matrices.at(-1), [shards().y]);
  for (const beatP of [0, 0.3, 1])
    assert.deepEqual(paint('linear', { beat: 2, beatP }).matrices.at(-1), [shards().y]);
});

test('the paired projection sum is painted at the summation clause before the later boundary discussion', () => {
  const sum = paint('pair', {
    beat: 1,
    beatP: 0.1,
    cues: {
      'contracted-contributions': after,
      'sum-contraction': during(0.5),
      'contraction-boundary': before,
    },
  });
  assert(sum.math.includes('[1,4]+[16,1]=[17,5]'));
});

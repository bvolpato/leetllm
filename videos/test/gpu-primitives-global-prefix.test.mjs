import test from 'node:test';
import assert from 'node:assert/strict';
import {
  freshPrefixSnapshot,
  blellochTrace,
  hierarchyCounts,
  ATTENTION,
} from '../animations/gpu-primitives.mjs';

const phase = (value) => ({ phase: value, progress: value === 'after' ? 1 : 0 });
test('the fresh odd-row outcome waits for its spoken answer and reduction clauses', () => {
  const held = {
    'fresh-offset-five': phase('after'),
    'fresh-odd-row-step-2': phase('before'),
    'fresh-reduction': phase('before'),
  };
  const question = freshPrefixSnapshot(0, 0.999);
  assert.equal(question.output, null);
  assert.equal(question.total, null);
  const offset = freshPrefixSnapshot(1, 0.999, held);
  assert.equal(offset.offsetShown, true);
  assert.equal(offset.output, null);
  assert.equal(offset.total, null);
  const scan = freshPrefixSnapshot(1, 0.999, { ...held, 'fresh-odd-row-step-2': phase('after') });
  assert.deepEqual(scan.output, [0, 2, -1, 4, 5, 3, 7]);
  assert.equal(scan.output.length, 7, 'the padded identity is not an observed output');
  assert.equal(scan.total, null);
  const completed = freshPrefixSnapshot(1, 0.999, {
    ...held,
    'fresh-odd-row-step-2': phase('after'),
    'fresh-reduction': phase('after'),
  });
  assert.equal(completed.total, 13);
});
test('the root identity preserves a separately saved total through both down-sweep phases', () => {
  const { states, total } = blellochTrace([2, -5, 8, 3]);
  assert.equal(total, 8);
  assert.equal(states[3].values.at(-1), 0);
  assert.deepEqual(states.at(-1).values, [0, 2, -3, 5]);
});
test('a single tail input grows the recursive metadata hierarchy', () => {
  assert.deepEqual(hierarchyCounts(64, 8), [8, 1]);
  assert.deepEqual(hierarchyCounts(65, 8), [9, 2, 1]);
});
test('rescaling both weighted accumulator and denominator matches the direct four-logit output', () => {
  const logits = [2, 1, 4, 0],
    values = [
      [1, 0],
      [1, 0],
      [0, 1],
      [0, 1],
    ],
    mass = logits.map((x) => Math.exp(x - 4)),
    d = mass.reduce((a, b) => a + b, 0);
  for (let coordinate = 0; coordinate < 2; coordinate++) {
    const direct = mass.reduce((sum, m, i) => sum + m * values[i][coordinate], 0) / d;
    assert(Math.abs(ATTENTION.output[coordinate] - direct) < 1e-12);
  }
  const wrongOldUnscaled = (1 + Math.exp(-1)) / d;
  assert(wrongOldUnscaled > 1, 'unscaled old weighted mass violates the normalized output');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { repeatEstimates, wilson, candidateGate } from '../animations/agent-evaluation.mjs';

test('fixed-protocol estimators agree with independent enumeration and retain the task unit', () => {
  const outcomes = [true, false, true, true, false, true];
  const subsets = [];
  for (let a = 0; a < outcomes.length; a++) {
    for (let b = a + 1; b < outcomes.length; b++) subsets.push([outcomes[a], outcomes[b]]);
  }
  const result = repeatEstimates(6, 4, 2);
  assert.equal(result.all, subsets.filter((s) => s.every(Boolean)).length / subsets.length);
  assert.equal(result.any, subsets.filter((s) => s.some(Boolean)).length / subsets.length);
  assert.equal(repeatEstimates(3, 0, 3).all, 0);
  assert.equal(repeatEstimates(3, 3, 3).all, 1);
  assert.equal((repeatEstimates(3, 3, 3).all + repeatEstimates(3, 0, 3).all) / 2, 0.5);
  for (const args of [
    [0, 0, 1],
    [3, 4, 1],
    [3, 2, 4],
    [3, 1.5, 1],
    [3, 2, 0],
  ]) {
    assert.throws(() => repeatEstimates(...args));
  }
});

test('Wilson lower endpoint remains below one for all passing cases', () => {
  const interval = wilson(25, 25);
  assert(Math.abs(interval.lower - 25 / (25 + 1.96 ** 2)) < 1e-12);
  assert(Math.abs(interval.upper - 1) < 1e-12);
  const low = wilson(2, 3);
  assert(Math.abs(low.lower - 0.2076549551264879) < 1e-12);
  assert(Math.abs(low.upper - 0.9385096847238394) < 1e-12);
  assert(wilson(27, 30).lower < 0.85);
  assert.throws(() => wilson(2, 1));
  assert.throws(() => wilson(0, 0));
});

test('release rejects invalid evidence before thresholds and preserves independent hard gates', () => {
  const valid = { runs: 3, passes: 3, critical: 0, allThree: 0.97, cpst: 0.061 };
  assert.equal(candidateGate(valid).allowed, true);
  for (const delta of [
    { allThree: NaN },
    { cpst: Infinity },
    { runs: true },
    { passes: 4 },
    { critical: -1 },
    { critical: 4 },
    { cpst: -0.01 },
    { allThree: 1.1 },
  ]) {
    assert.equal(candidateGate({ ...valid, ...delta }).valid, false);
  }
  for (const delta of [{ passes: 2 }, { critical: 1 }, { allThree: 0.94 }, { cpst: 0.081 }]) {
    const result = candidateGate({ ...valid, ...delta });
    assert.equal(result.valid, true);
    assert.equal(result.allowed, false);
    assert.equal(result.checks.filter(Boolean).length, 3);
  }
});

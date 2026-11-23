import test from 'node:test';
import assert from 'node:assert/strict';
import {
  firstAdaptiveMovement,
  trainingMemory,
  consumedCursorPlan,
  trainingFreshState,
  tokenReduction,
  adamScaleProposal,
  durableSaveState,
} from '../animations/training-run-operations.mjs';

test('fresh adaptive movement preserves sign and its bound including zero and tiny gradients', () => {
  for (const g of [-1e300, -1, -1e-30, 0, 1e-30, 1, 1e300]) {
    const d = firstAdaptiveMovement(g, 0.002, 1e-8);
    assert(Number.isFinite(d));
    assert(Math.abs(d) <= 0.002);
    assert.equal(Math.sign(d), Math.sign(g));
  }
  assert(Math.abs(firstAdaptiveMovement(1e-9, 0.002, 1e-8) - 0.00018181818181818183) < 1e-15);
});
test('prefetch cannot advance the saved consumed restart coordinate', () => {
  assert.deepEqual(consumedCursorPlan(8, 12), { consumed: 8, prefetched: 12, resume: 8, ahead: 4 });
  assert.equal(consumedCursorPlan(8, 1000).resume, 8);
  assert.equal(consumedCursorPlan(0, 0).resume, 0);
  assert.throws(() => consumedCursorPlan(8, 7));
});
test('a fitting ideal base is not a claim that all training state fits', () => {
  const small = trainingMemory(8e9, 16, 24),
    large = trainingMemory(70e9, 4, 24),
    more = trainingMemory(70e9, 4, 48);
  assert(small.baseFits);
  assert(!large.baseFits);
  assert(more.baseFits);
  assert(!more.fullTrainingFitKnown);
  assert.equal(more.remainderGiB, 48 - more.baseGiB);
});
test('fresh restore answers remain independently hidden until their own voice cues', () => {
  const ids = [
      'fresh-cost',
      'fresh-fails',
      'fresh-retain',
      'fresh-restore-step-2',
      'fresh-range',
      'fresh-restore-step-3',
    ],
    cues = Object.fromEntries(ids.map((id) => [id, { phase: 'before', progress: 0 }]));
  for (const beat of [0, 1]) {
    const s = trainingFreshState({ beat, beatP: 1, cues });
    for (const k of ['cost', 'failed', 'retained', 'count', 'range', 'owner'])
      assert.equal(s[k], false);
  }
  cues['fresh-cost'] = { phase: 'during', progress: 0.1 };
  assert(!trainingFreshState({ beat: 1, beatP: 1, cues }).cost);
  assert(!trainingFreshState({ beat: 1, beatP: 1, cues }).count);
  cues['fresh-cost'] = { phase: 'after', progress: 1 };
  assert(trainingFreshState({ beat: 1, beatP: 1, cues }).cost);
  cues['fresh-retain'] = { phase: 'after', progress: 1 };
  assert(trainingFreshState({ beat: 1, beatP: 1, cues }).retained);
  assert(!trainingFreshState({ beat: 1, beatP: 1, cues }).count);
  assert(!trainingFreshState({ beat: 2, beatP: 1, cues }).owner);
  cues['fresh-restore-step-3'] = { phase: 'during', progress: 0.99 };
  assert(!trainingFreshState({ beat: 2, beatP: 1, cues }).owner);
  cues['fresh-restore-step-3'] = { phase: 'after', progress: 1 };
  assert(trainingFreshState({ beat: 2, beatP: 1, cues }).owner);
});
test('the pooled token result waits for the actual reduction phrase to finish', () => {
  const cues = { 'tokens-b2-1': { phase: 'during', progress: 0.8 } };
  assert(!tokenReduction({ beat: 1, beatP: 1, cues }).resultReady);
  cues['tokens-b2-1'] = { phase: 'after', progress: 1 };
  assert(tokenReduction({ beat: 1, beatP: 1, cues }).resultReady);
});
test('the conditional Adam proposal changes all coupled terms and rejects invalid coefficients', () => {
  const initial = { rate: 0.001, beta1: 0.9, beta2: 0.999, epsilon: 1e-8 },
    scaled = adamScaleProposal(initial, 4);
  assert.equal(scaled.rate, 0.002);
  assert(Math.abs(scaled.beta1 - 0.6) < 1e-15);
  assert(Math.abs(scaled.beta2 - 0.996) < 1e-15);
  assert.equal(scaled.epsilon, 5e-9);
  assert.throws(() => adamScaleProposal(initial, 12), /coefficients/);
});
test('the separate interrupted upload branch retains the previous complete recovery point', () => {
  const cues = { 'durable-failed-upload': { phase: 'before', progress: 0 } };
  assert.equal(durableSaveState({ cues }, 109).recoveryPoint, 1840);
  assert.equal(durableSaveState({ cues }, 110).recoveryPoint, 1841);
  cues['durable-failed-upload'] = { phase: 'during', progress: 0.01 };
  const failed = durableSaveState({ cues }, 120);
  assert(failed.failed);
  assert(!failed.published);
  assert.equal(failed.clock, 85);
  assert.equal(failed.recoveryPoint, 1840);
});

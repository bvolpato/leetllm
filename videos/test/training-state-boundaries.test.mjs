import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loopMomentum,
  loopMicrobatch,
  loopClip,
  loopAmpOrder,
  loopAtomicState,
  loopFreshState,
  LOOP_BIGRAM,
  oneTrainingStep,
} from '../animations/training-loop.mjs';
const near = (a, b) => assert(Math.abs(a - b) < 1e-11, `${a} versus ${b}`);
const before = { phase: 'before', progress: 0 },
  after = { phase: 'after', progress: 1 };

test('a missing gradient preserves the saved optimizer state while an explicit zero can move the weight', () => {
  const missing = loopMomentum(3, null, 0.5, 0.2, 2),
    zero = loopMomentum(3, 0, 0.5, 0.2, 2);
  assert.deepEqual(missing, { weight: 2, buffer: 3 });
  near(zero.weight, 1.7);
  near(zero.buffer, 1.5);
  const restored = loopMomentum(1, -1),
    fresh = loopMomentum(0, -1);
  assert(restored.weight < fresh.weight);
  near(restored.weight, 0.91);
  near(fresh.weight, 1);
});
test('effective microbatch denominators recover the same three-row gradient', () => {
  const rows = [
      [0.5, 0.5],
      [0.5, 0.5],
      [1, 0.5],
    ],
    full = [0, 1].map((d) => rows.reduce((s, row) => s + row[d], 0) / 3),
    weighted = loopMicrobatch(),
    wrong = loopMicrobatch(true);
  assert.deepEqual(weighted.gradient, full);
  near(
    weighted.contributions.flat().reduce((s, v) => s + v, 0),
    full[0] + full[1],
  );
  assert.notDeepEqual(wrong.gradient, full);
  near(wrong.gradient[0], 0.75);
});
test('global clipping scales all coordinates together and reports the original norm', () => {
  const r = loopClip([5, 12], 6.5);
  assert.equal(r.norm, 13);
  assert.deepEqual(r.gradient, [2.5, 6]);
  near(r.storedNorm, 6.5);
  near(r.gradient[0] / r.gradient[1], 5 / 12);
  assert.deepEqual(loopClip([1, 2], 5).gradient, [1, 2]);
  const amp = loopAmpOrder();
  near(amp.wrongNorm, 0.25);
  near(amp.correctNorm, 2);
  near(amp.correctNorm / amp.wrongNorm, amp.scale);
});
test('a controlled staging failure retains the old complete live file and does not prove durability', () => {
  const old = loopAtomicState(0, 0.99, {
      'loop-file-replace': before,
      'atomic-checkpoint-beat-0': before,
    }),
    replaced = loopAtomicState(0, 0, { 'loop-file-replace': after }),
    synced = loopAtomicState(1, 0, { 'loop-directory-sync': after }),
    failed = loopAtomicState(2, 0.99);
  assert.equal(old.live, 'old complete bytes');
  assert.equal(replaced.live, 'new complete bytes');
  assert.equal(replaced.directorySynced, false);
  assert.deepEqual(replaced.stagedCells, []);
  assert.equal(replaced.stagingNameExists, false);
  assert.equal(replaced.fileSynced, true);
  assert.equal(synced.directorySynced, true);
  assert.equal(failed.live, 'old complete bytes');
  assert.equal(failed.powerLossTested, false);
  assert.deepEqual(
    old,
    loopAtomicState(0, 0, { 'loop-file-replace': before, 'atomic-checkpoint-beat-0': before }),
  );
});
test('the actual character-model reconstruction retains the complete populations and selected earlier state', () => {
  assert.equal(LOOP_BIGRAM.trainPairs, 108);
  assert.equal(LOOP_BIGRAM.validationPairs, 75);
  assert.equal(LOOP_BIGRAM.unseen, 24);
  assert.equal(LOOP_BIGRAM.chars.length, 21);
  assert.equal(
    LOOP_BIGRAM.counts.flat().reduce((a, b) => a + b, 0),
    108,
  );
  near(LOOP_BIGRAM.history[0].train, Math.log(21));
  assert.equal(LOOP_BIGRAM.bestStep, 111);
  assert.equal(LOOP_BIGRAM.history[111].validation, LOOP_BIGRAM.bestLoss);
  assert(LOOP_BIGRAM.history[1000].validation > LOOP_BIGRAM.bestLoss);
  assert(LOOP_BIGRAM.history[1000].train > LOOP_BIGRAM.floor);
  assert(LOOP_BIGRAM.floor > 1);
});
test('the fresh stale-gradient prediction is earned after separate sum,update and route cues', () => {
  const hidden = loopFreshState(0, 0.99);
  assert.equal(hidden.sumVisible, false);
  assert.equal(hidden.updateVisible, false);
  assert.equal(hidden.probabilityVisible, false);
  const cues = { 'loop-stale-sum': after, 'loop-stale-update': before, 'loop-bad-route': before },
    sum = loopFreshState(1, 0.99, cues);
  assert.equal(sum.sumVisible, true);
  assert.equal(sum.updateVisible, false);
  assert.equal(sum.probabilityVisible, false);
  const bad = loopFreshState(1, 0, {
      'loop-stale-sum': after,
      'loop-stale-update': after,
      'loop-bad-route': after,
    }),
    fixed = loopFreshState(2, 0, { 'loop-clear-stale': after, 'loop-fixed-route': after });
  assert.deepEqual(bad.current, fixed.current);
  assert.deepEqual(fixed.old, [
    [0, 0],
    [0, 0],
  ]);
  assert.deepEqual(fixed.weights, oneTrainingStep().updated);
  near(bad.probabilities[1], 1 / (1 + Math.exp(0.5)));
  near(fixed.probabilities[1], 1 / (1 + Math.exp(-0.5)));
  assert(bad.probabilities[1] < 0.5 && fixed.probabilities[1] > 0.5);
  assert.deepEqual(sum, loopFreshState(1, 0, cues));
});

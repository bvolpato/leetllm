import { arithmeticEvaluation, categoricalUpdate, groupStatistics } from './arithmetic.mjs';
import { arithmeticCheck } from './construction.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.equal(14 * 12, 168);
  assert.equal(arithmeticCheck(0, 8.2624 / 12.55).gathering, false);
  assert.equal(arithmeticCheck(0, 8.2625 / 12.55).gathering, true);
  const gathering = arithmeticCheck(0, 8.65 / 12.55);
  assert(gathering.gather > 0 && gathering.gather < 1);
  assert.equal(gathering.resultVisible, false);
  assert.equal(arithmeticCheck(0, 9.0375 / 12.55).gather, 1);
  assert.equal(arithmeticCheck(0, 9.5374 / 12.55).resultVisible, false);
  assert.equal(arithmeticCheck(0, 9.5375 / 12.55).resultVisible, true);
  for (const beat of [0, 1, 2]) {
    const checked = arithmeticCheck(beat, beat ? 0 : 10.1625 / 12.55);
    assert.equal(checked.total, 14 * 12);
    assert.deepEqual(
      checked.parts.map((part) => part.value),
      [120, 48],
    );
    assert.equal(checked.gather, 1);
    assert.equal(checked.resultVisible, true);
  }
  const stats = groupStatistics([1, 0, 1, 0]);
  assert.equal(stats.mean, 0.5);
  assert.equal(stats.std, 0.5);
  assert.deepEqual(stats.advantages, [1, -1, 1, -1]);
  assert.deepEqual(groupStatistics([1, 1, 1, 1]).advantages, [0, 0, 0, 0]);
  assert.deepEqual(groupStatistics([0, 0, 0, 0]).advantages, [0, 0, 0, 0]);
  const update = categoricalUpdate();
  assert(Math.abs(update.probabilities.reduce((sum, value) => sum + value, 0) - 1) < 1e-12);
  assert(Math.abs(update.rewardedMass - 0.6224593312018546) < 1e-12);
  for (const step of [0, 0.25, 0.5, 0.75, 1]) {
    const current = categoricalUpdate(stats.advantages, step);
    assert(Math.abs(current.probabilities.reduce((a, v) => a + v, 0) - 1) < 1e-12);
    assert.equal(current.rewardedMass, current.probabilities[0] + current.probabilities[2]);
    assert(current.probabilities[0] >= 0.25 && current.probabilities[1] <= 0.25);
  }
  const evaluation = arithmeticEvaluation();
  assert.equal(evaluation.training.initialReward, 0);
  assert.equal(evaluation.training.reward, 1);
  assert.deepEqual(
    evaluation.heldOut.map((row) => [row.expected, row.policyAnswer, row.reward]),
    [
      [156, 168, 0],
      [154, 168, 0],
    ],
  );
  assert.equal(evaluation.heldOutAccuracy, 0);
  assert.deepEqual(evaluation.checkerChallenge, {
    worked: {
      answer: 168,
      reward: 1,
    },
    unsupportedGuess: {
      answer: 168,
      reward: 1,
    },
  });
  return true;
}

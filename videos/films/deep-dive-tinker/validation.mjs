import {
  ACTION_MASK,
  INPUTS,
  SAMPLE_ADVANTAGES,
  SAMPLE_FIXTURE,
  SAMPLE_LOGPROBS,
  TARGETS,
  TARGET_WEIGHTS,
} from './fixtures.mjs';
import { ADVANTAGES, REWARDS, clamp, rewardMean, sharedCreditUpdate } from './arithmetic.mjs';
import { groupCreditConstruction } from './construction.mjs';
import { sampleModel, trajectoryTrace } from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  const tied = groupCreditConstruction({
    beatP: 0,
    cues: {
      'group-credit-tied-rewards': {
        phase: 'during',
      },
      'group-credit-shared-update': {
        progress: 1,
      },
    },
  });
  assert.deepEqual(tied.advantages, [0, 0, 0, 0]);
  assert.equal(tied.gradient, 0);
  assert.deepEqual(tied.logits, [0, 0, 0, 0]);
  assert.deepEqual(tied.probabilities, [0.25, 0.25, 0.25, 0.25]);
  const normalized = sampleModel('sft', {
    beat: 2,
    beatP: 0.5,
  });
  assert.equal(normalized.weightSum, 2);
  assert.deepEqual(normalized.scaled, [0, 0.5, 0.5]);
  assert.equal(
    normalized.scaled.reduce((a, b) => a + b, 0),
    1,
  );
  assert.equal(trajectoryTrace(0, 0).tokens[1], null);
  assert.deepEqual(trajectoryTrace(0, 1).tokens, [11, 20, 21]);
  const update = sharedCreditUpdate(1);
  assert(Math.abs(update.probabilities.reduce((a, b) => a + b, 0) - 1) < 1e-12);
  assert(update.probabilities[0] > 0.25 && update.probabilities[1] < 0.25);
  assert.deepEqual(sharedCreditUpdate(1, [0, 0, 0, 0]).probabilities, [0.25, 0.25, 0.25, 0.25]);
  assert.deepEqual(REWARDS, [1, 0, 1, 0]);
  assert.equal(rewardMean, 0.5);
  assert.deepEqual(ADVANTAGES, [0.5, -0.5, 0.5, -0.5]);
  assert.deepEqual(INPUTS, [10, 11, 20]);
  assert.deepEqual(TARGETS, [11, 20, 21]);
  assert.deepEqual(TARGET_WEIGHTS, [0, 1, 1]);
  assert.equal(TARGETS[1], 20);
  assert.deepEqual(SAMPLE_LOGPROBS, [0, -0.4, -0.8]);
  assert.deepEqual(SAMPLE_ADVANTAGES, [0, 0.5, 0.5]);
  assert.deepEqual(ACTION_MASK, [0, 1, 1]);
  for (let beat = 0; beat < 3; beat += 1) {
    const opening = sampleModel('opening', {
      beat,
      beatP: 0.5,
    });
    assert.equal(opening.trainerVersion, 2);
    assert.equal(opening.samplerVersion, 1);
    assert.equal(opening.stale, true);
  }
  assert.equal(
    sampleModel('trajectory-datum', {
      beat: 2,
      beatP: 1,
    }).aligned,
    true,
  );
  const groupEarly = sampleModel('group-credit', {
    beat: 0,
    beatP: 0.5,
  });
  const groupEnd = sampleModel('group-credit', {
    beat: 0,
    beatP: 0.98,
  });
  const groupCredit = sampleModel('group-credit', {
    beat: 1,
    beatP: 0.02,
  });
  assert.equal(groupEarly.shown, 3);
  assert.equal(groupEarly.showMean, false);
  assert.equal(groupEnd.showMean, true);
  assert.deepEqual(groupCredit.advantages, [0.5, -0.5, 0.5, -0.5]);
  assert.equal(groupCredit.showMean, true);
  assert.equal(
    sampleModel('lora-path', {
      beat: 0,
      beatP: 0.98,
    }).rank,
    2,
  );
  assert.equal(
    sampleModel('lora-path', {
      beat: 1,
      beatP: 0.02,
    }).rank,
    4,
  );
  assert.equal(
    sampleModel('lora-path', {
      beat: 2,
      beatP: 0.02,
    }).rank,
    4,
  );
  assert.equal(
    sampleModel('clock', {
      beat: 2,
      beatP: 1,
    }).time,
    3,
  );
  const snapshotBefore = sampleModel('snapshots', {
    beat: 0,
    beatP: 0.98,
  });
  const snapshotStart = sampleModel('snapshots', {
    beat: 1,
    beatP: 0.12,
  });
  const snapshotMid = sampleModel('snapshots', {
    beat: 1,
    beatP: 0.5,
  });
  const snapshotEnd = sampleModel('snapshots', {
    beat: 1,
    beatP: 0.98,
  });
  assert.equal(snapshotBefore.saved, false);
  assert.equal(snapshotBefore.samplerVersion, 1);
  assert.equal(snapshotStart.saved, true);
  assert.ok(snapshotStart.transfer < snapshotMid.transfer);
  assert.ok(snapshotMid.transfer < snapshotEnd.transfer);
  assert.equal(snapshotEnd.samplerVersion, 2);
  assert.equal(snapshotEnd.clientAttached, false);
  const responseStart = sampleModel('snapshots', {
    beat: 2,
    beatP: 0.12,
  });
  const responseMiddle = sampleModel('snapshots', {
    beat: 2,
    beatP: 0.5,
  });
  const responseEnd = sampleModel('snapshots', {
    beat: 2,
    beatP: 0.98,
  });
  assert.equal(responseStart.clientAttached, true);
  assert.equal(responseStart.responseVisible, false);
  assert.equal(responseMiddle.responseVisible, true);
  assert.equal(responseMiddle.innerVisible, true);
  assert.equal(responseMiddle.resultVisible, false);
  assert.equal(responseEnd.inner, 3);
  assert.equal(responseEnd.result, 2);
  assert.equal(responseEnd.graderVisible, true);
  assert.equal(responseEnd.passed, true);
  assert.equal(clamp(3, 0, 2), SAMPLE_FIXTURE.expected);
  assert.throws(() => {
    const invalid = TARGETS.slice(1);
    if (invalid.length !== SAMPLE_LOGPROBS.length) throw new RangeError('unaligned RL fields');
  }, /unaligned RL fields/);
  return true;
}

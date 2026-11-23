import { finalUnmasked, rewardEnsemble, sigmoid, softplus, stablePairLoss } from './arithmetic.mjs';
import {
  REWARD_FITS,
  headScore,
  proxyOptimizationProgress,
  replayApproval,
  rewardFreshScreen,
} from './model.mjs';
import {
  CONTROLLED_PAIRS,
  FINAL_RULE_FIXTURE,
  SUPPORT_SCREEN,
  TRAINING_PAIRS,
} from './fixtures.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  validateRewardExpansion();
  const phase = (progress) => ({
    phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
    progress,
  });
  for (const [a, b, c, expected] of [
    [0, 0, 0, 0],
    [1, 0, 0, 0.6],
    [1, 1, 0, 0.8],
    [1, 1, 1, 1],
  ])
    assert.equal(
      proxyOptimizationProgress({
        cues: {
          'optimization-first-phase': phase(a),
          'fresh-policy-evaluation-b3-1': phase(b),
          'fresh-policy-evaluation-b3-2': phase(c),
        },
      }),
      expected,
    );
  for (const margin of [-2, 0, 1.1, 2]) {
    assert(Math.abs(softplus(-margin) + Math.log(sigmoid(margin))) < 1e-12);
    const h = 1e-5,
      numerical = (softplus(-(margin + h)) - softplus(-(margin - h))) / (2 * h);
    assert(Math.abs(numerical - (sigmoid(margin) - 1)) < 1e-9);
    assert(Math.abs(1.8 + 10 - (0.7 + 10) - 1.1) < 1e-12);
  }
  const brier = (q) => [1, 1, 1, 0].reduce((s, y) => s + (q - y) ** 2, 0) / 4;
  assert.equal(brier(0.75), 0.1875);
  assert(Math.abs(brier(0.99) - 0.2451) < 1e-12);
  assert.equal((4 * 3) / 2, 6);
  assert(-1 - 0.0269 - (-2 - 0.0538) > 1);
  return true;
}
export function validateRewardExpansion() {
  assert.equal(stablePairLoss(-1000), 1000);
  assert.equal(stablePairLoss(1000), 0);
  assert.equal(stablePairLoss(0), Math.log(2));
  assert.equal(finalUnmasked([1, 1, 0]), 1);
  assert.equal(finalUnmasked([0, 1, 1]), 2);
  assert.throws(() => finalUnmasked([0, 0]), /empty/);
  assert(Math.abs(REWARD_FITS.confounded.weights[0] - 1.6294) < 0.001);
  assert(Math.abs(REWARD_FITS.balanced.weights[0] - 2.6667) < 0.001);
  assert.equal(REWARD_FITS.balanced.weights[1], 0);
  for (const [name, fit] of Object.entries(REWARD_FITS)) {
    const ordered = ([a, d]) => headScore(fit.weights, a) > headScore(fit.weights, d);
    assert(TRAINING_PAIRS[name].every(ordered));
    assert.deepEqual(
      CONTROLLED_PAIRS.map(ordered),
      name === 'balanced' ? [true, true, true] : [false, false, true],
    );
  }
  const { verbose, revised } = FINAL_RULE_FIXTURE;
  assert.deepEqual(
    replayApproval(verbose).map((s) => s.passes),
    [false, true, true],
  );
  const revision = replayApproval(revised);
  assert.deepEqual(
    revision.map((s) => s.grantNow),
    [false, false, true],
  );
  assert(revision.every((s) => s.passes));
  assert(replayApproval(revised, false).every((s) => s.passes && !s.grantNow));
  assert.equal(
    SUPPORT_SCREEN.agreements.filter(Boolean).length / SUPPORT_SCREEN.agreements.length,
    0.75,
  );
  assert.equal(rewardEnsemble(SUPPORT_SCREEN.memberScores).aggregate, 5);
  assert(!SUPPORT_SCREEN.sections.includes(SUPPORT_SCREEN.citedSection));
  assert.deepEqual(rewardEnsemble([2, 4, 6]), {
    mean: 4,
    sd: 2,
    aggregate: 2,
  });
  assert.deepEqual(rewardEnsemble([5, 5, 5]), {
    mean: 5,
    sd: 0,
    aggregate: 5,
  });
  const held = Object.fromEntries(
    ['fresh-pair-result', 'fresh-ensemble-result', 'fresh-source-result'].map((id) => [
      id,
      {
        phase: 'before',
      },
    ]),
  );
  assert.deepEqual(
    rewardFreshScreen({
      beat: 1,
      beatP: 1,
      cues: held,
    }),
    {
      pair: false,
      ensemble: false,
      source: false,
      hold: false,
    },
  );
  return true;
}

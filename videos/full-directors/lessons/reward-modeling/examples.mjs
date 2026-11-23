import assert from 'node:assert/strict';
import {
  finalUnmasked,
  rewardEnsemble,
  rewardHeadFit,
  sigmoid,
  stablePairLoss,
} from '../../../films/reward-modeling/arithmetic.mjs';
import {
  CONTROLLED_PAIRS,
  FINAL_RULE_FIXTURE,
  LIKELIHOOD_FIXTURE,
  SUPPORT_SCREEN,
  TRAINING_PAIRS,
} from '../../../films/reward-modeling/fixtures.mjs';
import { replayApproval } from '../../../films/reward-modeling/model.mjs';
export {
  finalUnmasked,
  rewardEnsemble,
  sigmoid,
  stablePairLoss,
  CONTROLLED_PAIRS,
  FINAL_RULE_FIXTURE,
  LIKELIHOOD_FIXTURE,
  SUPPORT_SCREEN,
};
export const sum = (xs) => xs.reduce((a, b) => a + b, 0);
export const dotProduct = (a, b) => sum(a.map((x, i) => x * b[i]));
export const weights = [0.5, 1],
  hidden = [
    [2, 0.8],
    [1, 0.2],
  ];
export const scores = hidden.map((v) => dotProduct(v, weights));
export const rankScores = [...scores, 1.1];
export const pads = [
  { name: 'token 0', v: [1, 0], mask: 1 },
  { name: 'token 1', v: [2, 3], mask: 1 },
  { name: 'PAD', v: [99, 99], mask: 0 },
];
export function readout(left) {
  const tokens = left ? [pads[2], ...pads.slice(0, 2)] : pads;
  const index = finalUnmasked(tokens.map((t) => t.mask));
  return { tokens, index, vector: tokens[index].v, score: dotProduct(tokens[index].v, weights) };
}
export const distinctIds = [
  [316, 942, 128, 421],
  [316, 942, 128, 905],
];
// Toy final-token representations for the shared prefix and the two full replies.
const lastTokenVectors = new Map([[128, [1, 0]], [421, hidden[0]], [905, hidden[1]]]);
export const cutInputs = distinctIds.map((row) => {
  const ids = row.slice(0, 3);
  const mask = ids.map(() => 1);
  const vector = lastTokenVectors.get(ids[finalUnmasked(mask)]);
  return { ids, mask, vector, score: dotProduct(weights, vector) };
});
export const cutGap = cutInputs[0].score - cutInputs[1].score;
export const lengths = [
  [1024, 1024],
  [1008, 1025],
  [1030, 1000],
];
export const keptLength = (p) => p.every((v) => v <= 1024);
export const pairs = ['AB', 'AC', 'AD', 'BC', 'BD', 'CD'];
export const countPairs = (k) => (k * (k - 1)) / 2;
export const tally = [1, 1, 1, 0];
// These are supplied forecasts from two hypothetical fits on the same training data.
export const weakFits = [{ margin: 0.5, p: 0.9 }, { margin: 0, p: 0.75 }].map((fit) => {
  const lossA = -Math.log(fit.p);
  const lossB = -Math.log1p(-fit.p);
  const meanLoss = sum(tally.map((aWon) => aWon ? lossA : lossB)) / tally.length;
  return { ...fit, lossA, lossB, meanLoss };
});
export const perVote = (p) => tally.map((y) => (p - y) ** 2);
export const brier = (p) => sum(perVote(p)) / tally.length;
export const gradientStep = (w, eta, h) => {
  const [a, b] = h.map((x) => x * w),
    margin = a - b,
    grad = (sigmoid(margin) - 1) * (h[0] - h[1]);
  const next = w - eta * grad;
  return { grad, next, a: next * h[0], b: next * h[1] };
};
const initialWeight = -1;
const learningRate = 0.1;
const stepFeatures = [1, 2];
export const sharedStep = {
  initialWeight,
  learningRate,
  features: stepFeatures,
  before: stepFeatures.map((value) => initialWeight * value),
  ...gradientStep(initialWeight, learningRate, stepFeatures),
};
export const trainWords = [
  [
    ['I’ll wait for your approval.', 'Access is enabled.'],
    ['I’ll await approval. Access will stay blocked.', 'I’ve already enabled admin access.'],
  ],
  [
    ['I’ll wait for your approval.', 'Access is enabled.'],
    ['I’ll await approval.', 'I’ve already enabled admin access.'],
  ],
];
export const reviewText = 'Wait for approval.',
  grantText = 'Admin enabled now.',
  extra = 'I’ll request approval afterward.';
export const features = (s, wait) => [Number(wait), (s.split(/\s+/u).length - 3) / 2];
export const training = trainWords.map((rows) =>
  rows.map(([a, b]) => [features(a, true), features(b, false)]),
);
export const fits = training.map((rows) =>
  rewardHeadFit(rows.map(([a, b]) => a.map((v, i) => v - b[i]))),
);
export const scorePair = (w, pair) => pair.map((v) => dotProduct(w, v));
export const testWins = (w) =>
  CONTROLLED_PAIRS.map((pair) => {
    const [a, d] = scorePair(w, pair);
    return a > d;
  });
export const reversalLengths = CONTROLLED_PAIRS[0].map((features) => features[1]);
export const lengthCases = [0, 3, 6].map((b) => {
  const logit = b - 1; // The training pair has a length gap of one and alpha of one.
  return {
    b,
    logit,
    loss: stablePairLoss(logit),
    test: reversalLengths.map((length) => b * length),
  };
});
export const screen = (data) => {
  const count = data.agreements.filter(Boolean).length;
  return {
    count,
    p: count / data.agreements.length,
    pass: count / data.agreements.length >= data.floor,
    ensemble: rewardEnsemble(data.memberScores),
    sourcePass: data.sections.includes(data.citedSection),
  };
};
export function accessTrace(answer, approves = true) {
  let granted = false;
  return replayApproval(answer, approves).map((s) => {
    granted ||= s.grantNow;
    return { ...s, granted };
  });
}
export const traces = [FINAL_RULE_FIXTURE.verbose, FINAL_RULE_FIXTURE.revised].map((a) =>
  accessTrace(a),
);
export const product = (xs) => xs.reduce((a, b) => a * b, 1);
export const rawMargin = scores[0] - scores[1];
export const candidateForecast = ([a, b]) => ({
  gap: a - b,
  p: sigmoid(a - b),
  loss: stablePairLoss(a - b),
});
export const lossSettings = [rawMargin, -2, 2];
export const marginTarget = (m, p) => m + Math.log(p / (1 - p));
export const centered = (a, b, gamma) => gamma * (a + b) ** 2;
export const sourceCheck = (a, b) => ({ got: 5, want: a + b, passes: 5 === a + b });
export const staticAccuracy = 0.92,
  freshAccuracy = 0.64,
  freshFloor = 0.8;
export function checkExamples() {
  assert.deepEqual(
    LIKELIHOOD_FIXTURE.answers.map((a) => product(a.probabilities)),
    [0.1, 0.2],
  );
  assert.deepEqual(scores, [1.8, 0.7]);
  assert.deepEqual(rankScores, [1.8, 0.7, 1.1]);
  assert.equal(Math.max(...rankScores), rankScores[0]);
  assert.deepEqual(cutInputs[0], cutInputs[1]);
  assert.deepEqual(cutInputs[0].ids, [316, 942, 128]);
  assert.deepEqual(cutInputs[0].mask, [1, 1, 1]);
  assert.equal(cutInputs[0].score, 0.5);
  assert.equal(cutGap, 0);
  assert.equal(stablePairLoss(cutGap), Math.log(2));
  const [chosen, rejected] = cutInputs;
  const pairGradient = chosen.vector.map((v, i) => (sigmoid(cutGap) - 1) * (v - rejected.vector[i]));
  assert(pairGradient.every((v) => v === 0));
  assert.deepEqual(distinctIds.map((ids) => dotProduct(weights, lastTokenVectors.get(ids.at(-1)))), scores);
  assert.deepEqual(lengths.map(keptLength), [true, false, false]);
  assert.equal(countPairs(4), pairs.length);
  assert.equal(countPairs(9) / countPairs(2), 36);
  assert.equal(((3 / 6) * 2) / 3, 1 / 3);
  for (const left of [false, true]) {
    const r = readout(left);
    assert.equal(r.index, left ? 2 : 1);
    assert.deepEqual(r.vector, [2, 3]);
    assert.equal(r.score, 4);
  }
  assert.throws(() => finalUnmasked([0, 0, 0]), /empty/);
  assert.equal(sigmoid(rawMargin).toFixed(4), '0.7503');
  assert.deepEqual(
    lossSettings.map((d) => stablePairLoss(d).toFixed(2)),
    ['0.29', '2.13', '0.13'],
  );
  assert.equal(stablePairLoss(-1000), 1000);
  assert.equal(stablePairLoss(1000), 0);
  assert.equal(marginTarget(1, 0.9).toFixed(3), '3.197');
  assert.deepEqual(weakFits.map(({ margin, p, lossB, meanLoss }) =>
    [margin, p, lossB.toFixed(3), meanLoss.toFixed(3)]), [
    [0.5, 0.90, '2.303', '0.655'],
    [0, 0.75, '1.386', '0.562'],
  ]);
  const { before, grad, next, a, b } = sharedStep;
  const changes = [a - before[0], b - before[1]];
  assert.equal(grad.toFixed(3), '0.269');
  assert.equal(next.toFixed(3), '-1.027');
  assert.deepEqual([a, b, a - b].map((value) => value.toFixed(3)), ['-1.027', '-2.054', '1.027']);
  assert.deepEqual(changes.map((value) => value.toFixed(3)), ['-0.027', '-0.054']);
  assert.equal(changes[1], 2 * changes[0]);
  assert.deepEqual(training, [TRAINING_PAIRS.confounded, TRAINING_PAIRS.balanced]);
  assert.deepEqual(
    [features(reviewText, true), features(grantText + ' ' + extra, false)],
    CONTROLLED_PAIRS[0],
  );
  // Check the regularized gradient that produces the first update of each fit.
  for (const [i, rows] of training.entries()) {
    const diffs = rows.map(([a, b]) => a.map((v, j) => v - b[j]));
    const objective = (w) =>
      sum(diffs.map((d) => stablePairLoss(dotProduct(w, d)))) / diffs.length +
      0.01 * dotProduct(w, w);
    for (let j = 0; j < 2; j++) {
      const epsilon = 0.00001,
        v = [0, 0];
      v[j] = epsilon;
      const numeric = (objective(v) - objective(v.map((x) => -x))) / (2 * epsilon);
      assert(Math.abs(numeric + fits[i].trajectory[1][j] / 0.1) < 1e-8);
    }
    const reloaded = JSON.parse(JSON.stringify(fits[i].weights));
    assert.deepEqual(testWins(reloaded), testWins(fits[i].weights));
    assert(
      rows.every((p) => {
        const [a, b] = scorePair(reloaded, p);
        return a > b;
      }),
    );
  }
  assert.deepEqual(
    fits.map((f) => testWins(f.weights)),
    [
      [false, false, true],
      [true, true, true],
    ],
  );
  assert.deepEqual(
    fits.map((f) => scorePair(f.weights, CONTROLLED_PAIRS[0]).map((x) => x.toFixed(2))),
    [
      ['1.63', '3.26'],
      ['2.67', '0.00'],
    ],
  );
  assert(fits[1].trajectory.every((w) => w[1] === 0));
  assert.equal(candidateForecast(scores.map((x) => x + 10)).gap.toFixed(3), rawMargin.toFixed(3));
  assert.equal(candidateForecast(scores.map((x) => 3 * x)).p.toFixed(4), '0.9644');
  assert.equal(centered(100, -100, 0.01), 0);
  assert.equal(brier(0.75), 0.1875);
  assert.equal(brier(0.99).toFixed(4), '0.2451');
  assert.deepEqual(
    lengthCases.map((v) => v.loss.toFixed(3)),
    ['1.313', '0.127', '0.007'],
  );
  assert.deepEqual(
    lengthCases.map(({ b, logit, test }) => [b, logit, ...test]),
    [
      [0, -1, 0, 0],
      [3, 2, 0, 6],
      [6, 5, 0, 12],
    ],
  );
  assert.deepEqual(rewardEnsemble([2, 4, 6]), { mean: 4, sd: 2, aggregate: 2 });
  assert(staticAccuracy >= freshFloor && freshAccuracy < freshFloor);
  assert(sourceCheck(2, 3).passes && !sourceCheck(4, 4).passes);
  assert.equal(dotProduct([0, 0], readout(false).vector), 0);
  const s = screen(SUPPORT_SCREEN);
  assert.equal(s.p, 0.75);
  assert(!s.pass && !s.sourcePass && s.ensemble.aggregate === 5);
  assert.deepEqual(
    traces[0].map((s) => s.passes),
    [false, true, true],
  );
  assert(traces[1].every((s) => s.passes));
  assert.deepEqual(
    traces[1].map((s) => [s.approved, s.granted]),
    [
      [false, false],
      [true, false],
      [true, true],
    ],
  );
  assert(accessTrace(FINAL_RULE_FIXTURE.revised, false).every((s) => !s.granted));
}

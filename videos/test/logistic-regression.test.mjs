import test from 'node:test';
import assert from 'node:assert/strict';
import {
  boundaryGeometry,
  likelihoodRows,
  fittedWeights,
  training,
  logLoss,
  calibrationAudit,
  isotonicFixture,
  prevalenceFixture,
  rankingMetrics,
  stableDistribution,
  multiclassSnapshot,
  expectedPolicy,
  freshPolicyVisibility,
  penalizedWeights,
  gpFixture,
} from '../animations/logistic-regression.mjs';
const close = (a, b, epsilon = 1e-10) => assert(Math.abs(a - b) < epsilon, `${a} versus ${b}`);
test('orthogonal distance projects to the same threshold and constant models avoid division by zero', () => {
  const g = boundaryGeometry([1, 3, -4], [2, 1], 0.5);
  close(g.distance, 0.6);
  close(1 + 3 * g.projection[0] - 4 * g.projection[1], 0);
  assert.deepEqual(boundaryGeometry([1, 0, 0], [2, 1]).projection, null);
  assert.equal(boundaryGeometry([1, 0, 0], [2, 1]).distance, null);
  assert.throws(() => boundaryGeometry([1, 2], [1], 1));
});
test('selected Bernoulli probabilities reproduce the same mean log loss', () => {
  const rows = likelihoodRows();
  close(
    -Math.log(rows.reduce((p, r) => p * r.selected, 1)) / rows.length,
    rows.reduce((s, r) => s + r.loss, 0) / rows.length,
  );
  for (const r of rows) close(r.selected, r.y ? r.p : 1 - r.p);
  assert.equal(logLoss(-1000, 1), 1000);
});
test('class-conditional repetition preserves AUC while easy negatives change it', () => {
  const repeated = prevalenceFixture('repeat'),
    easy = prevalenceFixture('easy');
  assert.equal(repeated.rows.length, 104);
  assert.equal(repeated.negatives, 100);
  assert.equal(repeated.pairCount, 400);
  close(repeated.auc, 13 / 16);
  assert.equal(easy.pairCount, 416);
  close(easy.auc, 413 / 416);
  close(
    rankingMetrics([
      { p: 0.5, label: 1 },
      { p: 0.5, label: 0 },
    ]).auc,
    0.5,
  );
});
test('calibration statistics retain denominator and tie conventions', () => {
  close(calibrationAudit().ece, 0.138625);
  close(calibrationAudit({ binCount: 8 }).ece, 0.153875);
  const iso = isotonicFixture();
  assert(iso.every((r, i) => !i || r.mapped >= iso[i - 1].mapped));
  assert(iso.some((r, i) => i && r.mapped === iso[i - 1].mapped));
});
test('stable multiclass loss stays finite when target probability underflows', () => {
  const row = stableDistribution([1000, 0, -1000]);
  assert.equal(row.probabilities[2], 0);
  assert.equal(row.lossFor(2), 2000);
  assert.throws(() => stableDistribution([Number.MAX_VALUE, -Number.MAX_VALUE]));
  close(multiclassSnapshot(1000).loss, 0.005544710386468574);
});
test('a penalty changes the optimum for the fixed design, including its explicit intercept', () => {
  const target = [-0.5387420883500977, 0.5143973390190583, -0.13864983197719322];
  penalizedWeights.forEach((w, i) => close(w, target[i], 1e-6));
  assert(Math.abs(fittedWeights[0] - penalizedWeights[0]) > 4);
  const gradient = penalizedWeights.map(
    (w, j) =>
      (training.reduce((s, [a, b, y]) => {
        const z = penalizedWeights[0] + penalizedWeights[1] * a + penalizedWeights[2] * b,
          p = 1 / (1 + Math.exp(-z));
        return s + (p - y) * [1, a, b][j];
      }, 0) +
        w) /
      8,
  );
  gradient.forEach((g) => close(g, 0, 1e-8));
});
test('fresh queue membership, bills and choice are independently withheld at their completed clauses', () => {
  const empty = freshPolicyVisibility();
  assert.deepEqual(empty, {
    ready: [false, false, false],
    bills: [false, false, false],
    selected: false,
  });
  const inProgress = freshPolicyVisibility({
    'lr-new-high-selection': 0.999,
    'lr-new-high-policy': 0.5,
  });
  assert.deepEqual(inProgress, empty);
  const selected = freshPolicyVisibility({ 'lr-new-high-selection': 1 });
  assert.deepEqual(selected.ready, [false, false, true]);
  assert.deepEqual(selected.bills, [false, false, false]);
  assert.equal(selected.selected, false);
  const candidate = expectedPolicy([0.05, 0.18, 0.45, 0.75], 0.3, 12, 108, 2);
  assert.deepEqual(
    candidate.rows.filter((r) => r.review).map((r) => r.id),
    ['N3', 'N4'],
  );
  assert.equal(candidate.cost, 34.44);
  assert.equal(candidate.feasible, true);
  assert.equal(expectedPolicy([0.05, 0.18, 0.45, 0.75], 0.1, 12, 108, 2).feasible, false);
});
test('GP latent and observation uncertainty preserve the stated noise distinction', () => {
  close(gpFixture(0).mean, 2 / 1.04);
  close(gpFixture(0).observationVariance - gpFixture(0).latentVariance, 0.04);
  assert(gpFixture(3).latentVariance > gpFixture(0).latentVariance);
});

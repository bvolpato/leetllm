import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FIT_ROWS,
  forecastWeights,
  featureProducts,
  lateLabelMetrics,
  forecastChapterState,
  quantileCost,
  forecastComparison,
} from '../animations/capstone-demand-forecasting-alerts.mjs';
const loss = (w) =>
  FIT_ROWS.reduce((sum, row) => sum + (row.x.reduce((v, x, i) => v + x * w[i], 0) - row.y) ** 2, 0);
test('the displayed actual calendar fit minimizes its mature-row squared error', () => {
  const baseline = loss(forecastWeights);
  for (let i = 0; i < forecastWeights.length; i++)
    for (const direction of [-1, 1]) {
      const altered = forecastWeights.map((v, j) => v + (i === j ? direction * 0.02 : 0));
      assert(loss(altered) > baseline);
    }
  assert.equal(FIT_ROWS.length, 62);
  assert(Math.abs(featureProducts().forecast - 163.28358208955228) < 1e-10);
  assert.equal(featureProducts([-1], [5]).forecast, 0);
});
test('a late label changes only the observed denominator and the applicable capacity outcome', () => {
  const empty = lateLabelMetrics([]),
    partial = lateLabelMetrics([0, 2]),
    full = lateLabelMetrics([0, 1, 2]);
  assert.equal(empty.mae, null);
  assert.equal(empty.peak, null);
  assert.equal(empty.precision, null);
  assert.equal(partial.mae, (Math.abs(151 - 152) + Math.abs(120 - 120)) / 2);
  assert.equal(partial.pending, 1);
  assert.equal(partial.recall, 1);
  assert.equal(full.mae, (1 + 7 + 0) / 3);
  assert.equal(full.recall, 1 / 2);
  assert.equal(full.precision, 1);
  assert.equal(full.inside, 2);
  assert.equal(full.peak, 0);
});
test('fresh outcomes remain hidden until their distinct narration cues', () => {
  const before = forecastChapterState({
    beat: 1,
    beatP: 0.9,
    cues: { 'forecast-fresh-partial': { phase: 'before', progress: 0 } },
  });
  assert.equal(before.freshPartial, false);
  const arrived = forecastChapterState({
    beat: 2,
    beatP: 0.7,
    cues: {
      'forecast-fresh-arrive': { phase: 'after', progress: 1 },
      'forecast-fresh-mean': { phase: 'before', progress: 0 },
      'forecast-fresh-recall': { phase: 'before', progress: 0 },
    },
  });
  assert.equal(arrived.freshArrived, true);
  assert.equal(arrived.freshMean, false);
  assert.equal(arrived.freshRecall, false);
});
test('asymmetric capacity optimum and local comparison retain their distinct objectives', () => {
  const distribution = [
      [80, 0.6],
      [140, 0.3],
      [220, 0.1],
    ],
    cost = (a) => quantileCost(a, 4, 1, distribution).reduce((s, r) => s + r.term, 0);
  assert.deepEqual([80, 140, 220].map(cost), [128, 68, 108]);
  assert(cost(140) < cost(80));
  assert.equal(forecastComparison().comparisonPass, false);
  const local = forecastComparison(1, 0, 0);
  assert.equal(local.comparisonPass, true);
  assert.equal(local.decision, 'hold');
  assert.equal(local.liveReady, false);
});

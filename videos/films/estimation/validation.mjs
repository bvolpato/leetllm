import {
  bootstrapBins,
  bootstrapSamples,
  coverageIntervals,
  readerPairs,
  sliceModel,
  weeklyQueue,
  weeklySample,
} from './fixtures.mjs';
import {
  biasVarianceState,
  clusterBootstrapModel,
  count,
  message,
  missingLabelBounds,
  scoreStatistic,
  wilson,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.deepEqual(missingLabelBounds(60, 45, 9), {
    selected: 60,
    resolved: 45,
    positive: 9,
    unknown: 15,
    resolvedRate: 0.2,
    low: 0.15,
    high: 0.4,
  });
  assert.deepEqual(missingLabelBounds(100, 80, 16), {
    selected: 100,
    resolved: 80,
    positive: 16,
    unknown: 20,
    resolvedRate: 0.2,
    low: 0.16,
    high: 0.36,
  });
  const clustered = clusterBootstrapModel();
  assert(Math.abs(clustered.campaignMass.reduce((a, v) => a + v, 0) - 1) < 1e-12);
  assert(Math.abs(clustered.rowMass.reduce((a, v) => a + v, 0) - 1) < 1e-12);
  assert.equal(clustered.campaignVariance / clustered.rowVariance, 10);
  assert.deepEqual(clustered.campaignRange, {
    low: 0,
    high: 0.5,
  });
  assert.deepEqual(clustered.rowRange, {
    low: 0.12,
    high: 0.28,
  });
  assert(Math.abs(biasVarianceState().squaredBias - 0.003136) < 1e-12);
  assert(biasVarianceState(10000).mse < biasVarianceState(100).mse);
  assert.equal(biasVarianceState(100).squaredBias, biasVarianceState(10000).squaredBias);
  assert.equal(new Set(weeklySample.map((r) => r.id)).size, 400);
  assert.deepEqual(
    [5, 100, 400].map((n) => count(weeklySample.slice(0, n))),
    [1, 16, 64],
  );
  assert.equal(
    Array.from(
      {
        length: 100000,
      },
      (_, i) => message(i),
    ).filter((r) => r.specialist).length,
    weeklyQueue.specialist,
  );
  assert(Math.abs(wilson(16, 100).low - 0.101) < 0.001);
  assert(Math.abs(wilson(16, 100).high - 0.244) < 0.001);
  assert(Math.abs(wilson(0, 10).high - 0.278) < 0.001);
  for (const n of [10, 20]) {
    const bound = wilson(0, n);
    assert(Math.abs(bound.low) < 1e-12);
    assert(Math.abs(bound.high - 1.96 ** 2 / (n + 1.96 ** 2)) < 1e-12);
  }
  assert.equal((100 * wilson(0, 20).high).toFixed(1), '16.1');
  assert.equal(readerPairs.filter(({ a, b }) => a === b).length / readerPairs.length, 0.75);
  assert.equal(wilson(0, 10).low, 0);
  assert.equal(wilson(10, 10).high, 1);
  const interval = wilson(16, 100);
  for (const p of [interval.low, interval.high])
    assert(Math.abs(scoreStatistic(16, 100, p) - 1.96) < 1e-10);
  assert(wilson(64, 400).high < 0.2);
  assert(wilson(64, 400).low < 0.18 && wilson(64, 400).high > 0.18);
  assert.equal(
    sliceModel.reduce((n, r) => n + r.expected, 0),
    176,
  );
  assert.equal(bootstrapSamples[0][0], bootstrapSamples[0][1]);
  assert(weeklySample[bootstrapSamples[0][0]].specialist);
  assert.equal(
    bootstrapBins.reduce((a, n) => a + n, 0),
    400,
  );
  assert.equal(coverageIntervals.length, 24);
  assert(coverageIntervals.every((r) => r.n === 100));
  assert.equal(coverageIntervals.filter((r) => !r.covers).length, 2);
  return true;
}

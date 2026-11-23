import {
  canaryPass,
  delayedCostCohort,
  delayedErrorCostLimit,
  delayedErrorCostPer1000,
  deployed,
  dueDomain,
  finalReleaseAction,
  fn,
  fp,
  mature,
  parity,
  paritySweep,
  predictionRows,
  psi,
  psiTerms,
  requests,
  tp,
} from './fixtures.mjs';
import {
  driftBars,
  driftSnapshot,
  parityBars,
  releaseReadout,
  visibleParityCases,
} from './construction.mjs';
import assert from 'node:assert/strict';
import { confusion, requestContract } from './model.mjs';
import { releaseWindow } from './release-cost.mjs';
export function validateModel() {
  assert.deepEqual(requests.slice(4).map(requestContract), ['freshness', 'pass']);
  const historical = confusion(mature, 0.5);
  const replay = confusion(mature, 0.8);
  assert.deepEqual([historical.tp, historical.fp, historical.fn, historical.cost], [2, 1, 0, 2]);
  assert.deepEqual([replay.tp, replay.fp, replay.fn, replay.cost], [1, 0, 1, 10]);
  const changedDecisions = mature.filter((row) => row.score >= 0.5 !== row.score >= 0.8);
  assert.deepEqual(
    changedDecisions.map((row) => row.id),
    ['p-003', 'p-004'],
  );
  const windows = [800, 600].map((n) => releaseWindow(n, n, 8, 2));
  assert.deepEqual(
    windows.map((w) => [w.raw, w.perThousand, w.receipt.alias]),
    [
      [36, 45, 'v4'],
      [36, 60, 'v3'],
    ],
  );
  assert.equal(
    driftSnapshot({
      beat: 0,
      beatP: 0.1,
    }).indices.length,
    0,
  );
  assert.deepEqual(
    driftSnapshot({
      beat: 0,
      beatP: 0.5,
    }).indices,
    [0],
  );
  assert.deepEqual(
    driftSnapshot({
      beat: 0,
      beatP: 0.9,
    }).indices,
    [0, 1],
  );
  assert.deepEqual(
    driftSnapshot({
      beat: 1,
      beatP: 0.3,
    }).indices,
    [0, 1, 2],
  );
  assert.equal(
    driftSnapshot({
      beat: 1,
      beatP: 0.5,
    }).value,
    psi,
  );
  for (const beatP of [0, 0.5, 0.99])
    assert.equal(
      driftSnapshot({
        beat: 2,
        beatP,
      }).complete,
      true,
    );
  assert.equal(requests.filter((row) => row.backlog !== null && row.age <= 60).length, 4);
  assert.deepEqual(
    requests.map((row) => row.heartbeatHours),
    [2, 8, 20, 26, 6, 30],
  );
  assert.deepEqual(
    requests.find((row) => row.id === 's-100'),
    {
      id: 's-100',
      age: 10,
      backlog: 18,
      heartbeatHours: 2,
      score: 0.18,
    },
  );
  assert.deepEqual(
    requests.find((row) => row.id === 's-104'),
    {
      id: 's-104',
      age: 180,
      backlog: 22,
      heartbeatHours: 6,
      score: 0.52,
    },
  );
  assert.deepEqual(deployed, {
    model: 'job-risk-v3',
    featureContract: 'features-v3',
    threshold: 0.5,
  });
  assert.ok(Math.abs(psi - 0.37031) < 0.001);
  assert.ok(Math.abs(psiTerms[3] - 0.207944) < 0.001);
  assert.equal(mature.length, 5);
  assert.equal(predictionRows.filter((row) => row.dueHours > 0).length, 1);
  assert.deepEqual(dueDomain, [-5, 1]);
  assert.ok(predictionRows.every((row) => row.threshold === deployed.threshold));
  assert.deepEqual(
    predictionRows.map((row) => row.arrivalHours),
    [-1, -1, -1, -1, 1, null],
  );
  assert.ok(dueDomain[0] <= 0 && dueDomain[1] >= 0);
  assert.equal(tp, 2);
  assert.equal(fp, 1);
  assert.equal(fn, 0);
  assert.equal(tp / (tp + fp), 2 / 3);
  assert.equal(tp / (tp + fn), 1);
  assert.equal(2 * fp + 10 * fn, 2);
  assert.equal(parity.training, 0.4);
  assert.equal(parity.serving, 0.2);
  for (const progress of [0, 0.01, 0.12, 0.5, 0.88, 1]) {
    const bins = driftBars((index) => (index ? progress : 1));
    for (const bin of bins) {
      assert.equal(bin.reference.height / 640, bin.reference.share);
      assert.equal(bin.current.height / 640, bin.current.share);
    }
    assert.equal(bins[2].current.height / bins[2].reference.height, 25 / 15);
    const bars = parityBars((index) => (index ? progress : 1));
    for (const bar of bars) {
      assert.equal(bar.width / 460, bar.numerator / bar.denominator);
    }
    assert.equal(bars[0].width / bars[1].width, 2);
    assert.equal(bars[1].opacity, progress);
  }
  assert.deepEqual(
    paritySweep.map((row) => [
      row.trainingCapacity,
      row.servingCapacity,
      row.training,
      row.serving,
    ]),
    [
      [50, 100, 0.4, 0.2],
      [100, 100, 0.2, 0.2],
      [200, 100, 0.1, 0.2],
    ],
  );
  assert.deepEqual(
    visibleParityCases(0).map((row) => row.trainingCapacity),
    [50],
  );
  assert.deepEqual(
    visibleParityCases(0.5).map((row) => row.trainingCapacity),
    [50, 100],
  );
  assert.deepEqual(
    visibleParityCases(1).map((row) => row.trainingCapacity),
    [50, 100, 200],
  );
  assert.equal(delayedErrorCostPer1000, 80);
  assert.equal(
    delayedCostCohort.missedDeadlines * delayedCostCohort.missCost +
      delayedCostCohort.falseAlerts * delayedCostCohort.reviewCost,
    40,
  );
  assert.ok(canaryPass);
  assert.equal(finalReleaseAction, 'rollback');
  assert.ok(delayedErrorCostPer1000 > delayedErrorCostLimit);
  const released = releaseReadout(2, 0.9);
  assert.equal(released.rows, 500);
  assert.equal(released.misses, 2);
  assert.equal(released.falseReviews, 10);
  assert.equal(released.costPer1000, 80);
  assert.equal(released.action, finalReleaseAction);
  assert.equal(releaseReadout(1, 1).action, null);
  assert.equal(releaseReadout(2, 0.5).action, null);
  const passedCanary = releaseReadout(2, 0, {
    canaryComplete: true,
    wider: true,
    cohortVisible: true,
    cohortProgress: 0.5,
  });
  assert.equal(passedCanary.observed, true);
  assert.equal(passedCanary.wider, true);
  assert.equal(passedCanary.rows, 500);
  assert.equal(passedCanary.misses, 1);
  assert.equal(passedCanary.falseReviews, 6);
  assert.equal(passedCanary.complete, false);
  const finalReadout = releaseReadout(2, 0, {
    canaryComplete: true,
    wider: true,
    cohortVisible: true,
    cohortProgress: 1,
    rollbackVisible: true,
  });
  assert.equal(finalReadout.misses, 2);
  assert.equal(finalReadout.falseReviews, 10);
  assert.equal(finalReadout.costPer1000, 80);
  assert.equal(finalReadout.action, 'rollback');
  return true;
}

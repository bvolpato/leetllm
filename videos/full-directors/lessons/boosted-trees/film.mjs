import assert from 'node:assert/strict';
import { stage } from './studio.mjs';
import {
  opening,
  calendar,
  eligible,
  residual,
  classification,
  classLeaves,
  curvature,
  histogram,
  transfer,
  growth,
  sampling,
  delayReading,
  weight,
  partition,
  nextLeaf,
  weightedDraw,
  orderedStats,
} from './fitting.mjs';
import {
  risk,
  economics,
  rounds,
  selection,
  threshold,
  boundary,
  holdout,
  support,
  sliceStress,
  stored,
  printed,
  rounded,
  boundaryRows,
  riskCost,
  crossing,
  brier,
  sliceRows,
  charges,
  toyBill,
} from './policy.mjs';
import {
  attribution,
  serving,
  release,
  credit,
  finalLogit,
  requestTime,
  probes,
  queue,
  rank,
} from './release.mjs';
import {
  RESIDUALS,
  UPDATED_DELAY,
  LEAF_CORRECTIONS,
  selectedApril,
  evaluateAprilThreshold,
  allAlertApril,
} from '../../../films/boosted-trees/model.mjs';
import {
  MONTHS,
  APRIL_TREE_TRACE,
  MAY_EVIDENCE,
  STAGE_SERIES,
} from '../../../films/boosted-trees/fixtures.mjs';
import {
  MSE,
  sigmoid,
  splitConstruction,
  sliceResult,
} from '../../../films/boosted-trees/arithmetic.mjs';

const chapters = [
  opening,
  calendar,
  eligible,
  residual,
  classification,
  curvature,
  histogram,
  transfer,
  growth,
  sampling,
  risk,
  economics,
  rounds,
  selection,
  threshold,
  boundary,
  holdout,
  support,
  sliceStress,
  attribution,
  serving,
  release,
];
const darkChapters = new Set([1, 4, 7, 9, 11, 12, 15, 17, 20, 22]);
function draw(ctx, clock) {
  const i = clock.beat.chapterIndex;
  chapters[i](stage(ctx, clock, darkChapters.has(i + 1)));
}
function check() {
  const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} differs from ${b}`);
  assert.deepEqual([delayReading(0), delayReading(0.5), delayReading(1)], [6, 7.75, 9.5]);
  assert.deepEqual(
    MONTHS.map((m) => [m.rows, m.misses]),
    [
      [360, 119],
      [140, 58],
      [140, 55],
    ],
  );
  assert.deepEqual(RESIDUALS, [-4, 2, 14]);
  assert.deepEqual(LEAF_CORRECTIONS, [-1, 14]);
  assert.deepEqual(UPDATED_DELAY, [5.75, 5.75, 9.5]);
  close(8 - UPDATED_DELAY[1], 2.25);
  close(MSE(UPDATED_DELAY), 43.125);
  assert.deepEqual(classLeaves, [
    { label: 0, jobs: 1, gradient: 0.5, curvature: 0.25, fullMove: -2, halfStep: -1 },
    { label: 1, jobs: 2, gradient: -0.5, curvature: 0.25, fullMove: 2, halfStep: 1 },
  ]);
  assert.deepEqual(classLeaves.map((leaf) => sigmoid(leaf.halfStep).toFixed(3)), ['0.269', '0.731']);
  close(weight(-0.99, 0.0099, 0), 100);
  close(weight(-0.99, 0.0099, 1), 0.99 / 1.0099);
  const h = splitConstruction();
  assert.equal(h.best.cut, 2);
  close(h.best.gain, 2 / 3);
  close(h.cuts[0].gain, 6 / 35);
  assert.equal(partition(0.2).best, null);
  const alt = partition(0.1).best;
  assert.equal(alt.cut, 1);
  close(alt.leftWeight, 0.4);
  close(alt.rightWeight, -2 / 7);
  const alerts = [1, 2, 3, 4].filter(
    (i) => sigmoid((i <= alt.cut ? alt.leftWeight : alt.rightWeight) / 4) >= 0.52,
  );
  assert.deepEqual(alerts, [1]);
  assert.deepEqual([nextLeaf(false).id, nextLeaf(true).id], ['A', 'B']);
  assert.deepEqual(weightedDraw, [-1.5, 1, -0.2, 0, -0.6, 0]);
  assert.deepEqual(orderedStats, [0.5, 0.75, 0.5]);
  close(riskCost(0.08, 60, true), 7.36);
  close(riskCost(0.08, 60, false), 4.8);
  close(riskCost(0.08, 150, false), 12);
  for (const m of [60, 150]) close(riskCost(crossing(m), m, true), riskCost(crossing(m), m, false));
  close(brier, 0.22);
  assert.equal(STAGE_SERIES.length, 160);
  assert.deepEqual(
    [0.2, 0.6, 0.9, 1].map((t) => toyBill(t).cost),
    [8, 4, 10, 20],
  );
  assert.equal(STAGE_SERIES.reduce((a, r) => (r.validation < a.validation ? r : a)).round, 50);
  assert.equal(stored, 0.06266686815353625);
  assert.equal(printed, 0.062667);
  assert.deepEqual(
    boundaryRows.map((r) => [r.id, r.label, r.priority]),
    [
      [71, 0, true],
      [96, 1, true],
      [118, 0, true],
      [136, 0, true],
    ],
  );
  for (const [r, expected] of [
    [selectedApril, [58, 71, 0, 11, 568]],
    [rounded, [57, 68, 1, 14, 694]],
    [allAlertApril, [58, 82, 0, 0, 656]],
  ])
    assert.deepEqual([r.tp, r.fp, r.fn, r.tn, r.cost], expected);
  assert.equal(evaluateAprilThreshold(0.15).cost, 1316);
  for (const r of MAY_EVIDENCE)
    assert.equal(
      charges(r).reduce((a, x) => a + x, 0),
      r.cost,
    );
  assert.deepEqual(
    MAY_EVIDENCE.map((r) => r.tp + r.fp),
    [128, 140, 81],
  );
  assert.deepEqual(
    sliceRows(true).map((r) => [r.caught, r.positives, r.passed]),
    [
      [26, 36, false],
      [20, 31, false],
    ],
  );
  assert.deepEqual(
    sliceRows(false).map((r) => r.passed),
    [true, true],
  );
  assert.equal(sliceResult(0, 0, 0.9).recall, null);
  assert.equal(sliceResult(9, 9, 0.9).passed, false);
  assert.equal(sliceResult(10, 9, 0.9).passed, true);
  assert.deepEqual(credit, { base: 0, A: 3, B: 2, output: 5 });
  close(finalLogit, -0.32);
  let raw = APRIL_TREE_TRACE.initialLogit;
  for (const s of APRIL_TREE_TRACE.stages) {
    raw += s.delta;
    close(raw, s.raw);
    close(sigmoid(raw), s.probability);
  }
  close(sigmoid(raw), probes[0].score);
  assert.deepEqual([requestTime(2), requestTime(1)], [20, 19]);
  assert.equal(probes[1].score, stored);
  assert.ok(probes[0].score > stored);
  assert.deepEqual(
    queue(true).map((r) => r.id),
    [0, 96],
  );
  assert.deepEqual(
    queue(false).map((r) => r.id),
    [0],
  );
  assert.equal(rank(queue(true))[0].id, 0);
  return true;
}
export default { title: 'Build the Tree, Freeze the Policy, Check the Release', draw, check };

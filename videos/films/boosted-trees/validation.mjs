import {
  MSE,
  policyCost,
  sigmoid,
  sliceResult,
  splitConstruction,
  twoFeatureCredits,
} from './arithmetic.mjs';
import {
  APRIL_SCORED_ROWS,
  APRIL_TREE_TRACE,
  CLASS_FIXTURE,
  DELAY_FIXTURE,
  MAY_EVIDENCE,
  MAY_POLICY,
  STAGE_SERIES,
  coarseBoundaries,
} from './fixtures.mjs';
import { TRACKS, establishedProgress, roundSnapshot, thresholdSnapshot } from './construction.mjs';
import { copiedApril, reportCutoff, tiedJobs } from './boundary-replay.mjs';
import {
  APRIL_BOUNDARIES,
  APRIL_POLICY,
  BASELINE_DECISIONS,
  CLASS_ROWS,
  LEAF_CORRECTIONS,
  RESIDUALS,
  SNAPSHOTS,
  UPDATED_DELAY,
  allAlertApril,
  classificationTreeStep,
  evaluateAprilThreshold,
  searchAprilThresholds,
  selectedApril,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  validateSplitConstruction();
  assert.deepEqual(
    classificationTreeStep().leaves.map((leaf) => leaf.value),
    [-2, 2],
  );
  assert.deepEqual(
    classificationTreeStep().logits,
    CLASS_ROWS.map((row) => row.logitAfterIllustration),
  );
  assert.equal(
    establishedProgress({
      beat: 1,
      beatP: 0,
    }),
    1,
  );
  assert.equal(
    establishedProgress(
      {
        beat: 2,
        beatP: 0,
      },
      1,
    ),
    1,
  );
  assert.equal(
    establishedProgress(
      {
        beat: 0,
        beatP: 1,
      },
      1,
    ),
    0,
  );
  assert.deepEqual(RESIDUALS, [-4, 2, 14]);
  assert.deepEqual(LEAF_CORRECTIONS, [-1, 14]);
  assert.deepEqual(UPDATED_DELAY, [5.75, 5.75, 9.5]);
  assert.equal(MSE(DELAY_FIXTURE.initial), 72);
  assert.equal(MSE(UPDATED_DELAY), 43.125);
  assert.equal(CLASS_FIXTURE.initialLogit, 0);
  assert(CLASS_ROWS.every((row) => row.probability === sigmoid(CLASS_FIXTURE.initialLogit)));
  assert.deepEqual(
    CLASS_ROWS.map((row) => row.gradient),
    CLASS_ROWS.map((row) => row.probability - row.label),
  );
  assert.deepEqual(
    CLASS_ROWS.map((row) => row.gradient),
    [0.5, -0.5, -0.5],
  );
  assert.deepEqual(
    CLASS_ROWS.map((row) => row.logitAfterIllustration),
    [-1, 1, 1],
  );
  assert.deepEqual(
    BASELINE_DECISIONS.map((row) => row.action),
    ['leave alone', 'alert'],
  );
  assert.equal(
    policyCost({
      falseAlarms: 71,
    }),
    568,
  );
  assert.equal(
    policyCost({
      falseAlarms: 82,
    }),
    656,
  );
  assert.equal(
    policyCost({
      falseAlarms: 73,
    }),
    584,
  );
  assert.equal(
    policyCost({
      falseAlarms: 85,
    }),
    680,
  );
  assert.equal(searchAprilThresholds(coarseBoundaries).cost, 1316);
  assert.equal(APRIL_SCORED_ROWS.length, 140);
  assert.equal(APRIL_BOUNDARIES.length, 108);
  assert.equal(selectedApril.threshold, 0.06266686815353625);
  assert.equal(reportCutoff, 0.062667);
  assert.deepEqual(
    tiedJobs.map(({ id }) => id),
    [71, 96, 118, 136],
  );
  assert(tiedJobs.every(({ priority }) => priority));
  assert.deepEqual(
    tiedJobs.filter(({ label }) => label).map(({ id }) => id),
    [96],
  );
  assert.deepEqual(
    copiedApril.outcomes
      .filter((row, i) => row.alert !== selectedApril.outcomes[i].alert)
      .map(({ id }) => id),
    tiedJobs.map(({ id }) => id),
  );
  assert.deepEqual([copiedApril.fp, copiedApril.priorityMisses, copiedApril.cost], [68, 1, 694]);
  assert.deepEqual(
    [selectedApril.tp, selectedApril.fp, selectedApril.fn, selectedApril.tn, selectedApril.cost],
    [58, 71, 0, 11, 568],
  );
  assert.deepEqual(
    coarseBoundaries.map((value) => evaluateAprilThreshold(value).cost),
    [1316, 1884, 1912, 2038, 2604],
  );
  const noAlerts = evaluateAprilThreshold(1 + Number.EPSILON);
  assert.deepEqual([noAlerts.alerts, noAlerts.fn, noAlerts.cost], [0, 58, 6450]);
  assert.deepEqual([allAlertApril.alerts, allAlertApril.fn, allAlertApril.cost], [140, 0, 656]);
  const exactRow = APRIL_SCORED_ROWS.find((row) => row.score === selectedApril.threshold);
  assert(
    evaluateAprilThreshold(exactRow.score).outcomes.find((row) => row.id === exactRow.id).alert,
  );
  assert(
    !evaluateAprilThreshold(exactRow.score + Number.EPSILON).outcomes.find(
      (row) => row.id === exactRow.id,
    ).alert,
  );
  assert.throws(() => evaluateAprilThreshold(NaN), TypeError);
  assert.throws(
    () =>
      evaluateAprilThreshold(0.5, [
        {
          id: 1,
          score: NaN,
          label: 1,
          priority: true,
        },
      ]),
    TypeError,
  );
  assert.throws(
    () =>
      evaluateAprilThreshold(0.5, [
        {
          id: 1,
          score: 0.5,
          label: 1,
          priority: 'false',
        },
      ]),
    TypeError,
  );
  for (const beat of [0, 1, 2])
    for (let index = 0; index <= 100; index += 1) {
      const state = thresholdSnapshot(beat, index / 100);
      assert.equal(state.tp + state.fp + state.fn + state.tn, APRIL_SCORED_ROWS.length);
      assert.equal(
        state.cost,
        state.fp * 8 + state.standardMisses * 60 + state.priorityMisses * 150,
      );
      assert.equal(
        state.histogram.reduce(
          (sum, bin) => sum + bin.cleanAlert + bin.cleanQuiet + bin.missAlert + bin.missQuiet,
          0,
        ),
        140,
      );
      assert.equal(
        state.histogram.reduce((sum, bin) => sum + bin.cleanAlert + bin.missAlert, 0),
        state.alerts,
      );
      assert(state.outcomes.every((row) => row.alert === row.score >= state.threshold));
    }
  for (let index = 1; index < APRIL_BOUNDARIES.length; index += 1)
    assert(
      evaluateAprilThreshold(APRIL_BOUNDARIES[index]).alerts <=
        evaluateAprilThreshold(APRIL_BOUNDARIES[index - 1]).alerts,
    );
  assert.equal(thresholdSnapshot(1, 0.02).cost, 568);
  assert.equal(thresholdSnapshot(2, 0.5).cost, 656);
  assert.equal(APRIL_POLICY.allAlertFalseAlarms - APRIL_POLICY.falseAlarms, 11);
  assert.equal(MAY_POLICY.selected.caught / MAY_POLICY.selected.misses, 1);
  assert.equal(roundSnapshot(0, 0.5).points.length, 1);
  assert.equal(roundSnapshot(1, 0.1).chosen, null);
  assert.deepEqual(
    roundSnapshot(1, 0.5).points.map((v) => v.round),
    [1, 50],
  );
  assert.deepEqual(
    roundSnapshot(2, 0.5).points.map((v) => v.round),
    [1, 50, 160],
  );
  assert.deepEqual(
    SNAPSHOTS.baseline.map((row) => row.focus),
    ['standard', 'standard', 'priority', 'priority'],
  );
  assert.ok(MAY_POLICY.priority.positives >= MAY_POLICY.minimumSlicePositives);
  assert.ok(MAY_POLICY.largeModel.positives >= MAY_POLICY.minimumSlicePositives);
  for (const [sceneId, snapshots] of Object.entries(SNAPSHOTS)) {
    for (let beat = 0; beat < snapshots.length; beat += 1) {
      assert.deepEqual(
        TRACKS[sceneId].sample({
          beat,
          beatP: 0,
        }).snapshot,
        snapshots[beat],
      );
      assert.deepEqual(
        TRACKS[sceneId].sample({
          beat,
          beatP: 0.5,
        }).snapshot,
        snapshots[beat],
      );
      if (beat + 1 < snapshots.length)
        assert.deepEqual(
          TRACKS[sceneId].sample({
            beat,
            beatP: 1,
          }).snapshot,
          snapshots[beat + 1],
        );
    }
  }
  return true;
}
export function validateSplitConstruction() {
  assert.equal(STAGE_SERIES.length, 160);
  assert.equal(STAGE_SERIES.reduce((a, b) => (a.validation <= b.validation ? a : b)).round, 50);
  assert(
    Math.abs(
      APRIL_TREE_TRACE.stages.reduce((n, r) => n + r.delta, APRIL_TREE_TRACE.initialLogit) -
        APRIL_TREE_TRACE.stages.at(-1).raw,
    ) < 1e-12,
  );
  assert(
    Math.abs(sigmoid(APRIL_TREE_TRACE.stages.at(-1).raw) - APRIL_TREE_TRACE.finalScore) < 1e-12,
  );
  MAY_EVIDENCE.forEach((r) => {
    assert.equal(r.tp + r.fp + r.fn + r.tn, 140);
    assert.equal(r.fnStandard + r.fnPriority, r.fn);
    assert.equal(r.cost, r.fp * 8 + r.fnStandard * 60 + r.fnPriority * 150);
  });
  const m = splitConstruction();
  assert.deepEqual(
    m.rows.map((r) => r.g),
    [-0.5, -0.5, 0.5, 0.5],
  );
  assert.equal(m.best.cut, 2);
  assert(Math.abs(m.cuts[0].gain - 6 / 35) < 1e-12);
  assert(Math.abs(m.cuts[1].gain - 2 / 3) < 1e-12);
  assert.equal(splitConstruction([1, 0, 1, 0], 1, 0.2).best, null);
  const f = splitConstruction([1, 0, 1, 0], 1, 0.1);
  assert.equal(f.best.cut, 1);
  assert(Math.abs(f.best.gain - 1 / 14) < 1e-12);
  assert.deepEqual(
    f.rows.map(
      (r, i) => sigmoid(0.25 * (i === 0 ? f.best.leftWeight : f.best.rightWeight)) >= 0.52,
    ),
    [true, false, false, false],
  );
  assert.equal(sliceResult(0, 0, 0.9).passed, false);
  assert.equal(sliceResult(9, 9, 0.9).passed, false);
  assert.equal(sliceResult(20, 18, 0.9).passed, true);
  assert.deepEqual(twoFeatureCredits([0, 2, 1, 5]), {
    base: 0,
    A: 3,
    B: 2,
    output: 5,
  });
  return true;
}

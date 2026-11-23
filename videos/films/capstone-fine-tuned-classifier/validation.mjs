import { softmax } from './arithmetic.mjs';
import { articleSelectionRows, GATE_CASES, rows } from './fixtures.mjs';
import {
  actualModelComparison,
  backpropagationStep,
  counts,
  costCutoff,
  evaluateGate,
  fallback,
  guardedLoss,
  maskedMean,
  reviewLoss,
  temperature,
  thresholdCounts,
  trainHead,
} from './model.mjs';
import {
  freshIntake,
  representationSnapshot,
  sampleModel,
  thresholdSnapshot,
  trainingFrame,
} from './construction.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.deepEqual(representationSnapshot(0, 0.9).pooled, [1, 1]);
  assert.deepEqual(representationSnapshot(1, 0.9).logits, [2, 1]);
  assert.deepEqual(representationSnapshot(1, 0.9).probabilities, softmax([2, 1]));
  assert.equal(thresholdSnapshot(0, 10 / 17.886).threshold, 0.5);
  assert(thresholdSnapshot(0, 12 / 17.886).threshold < 0.5);
  assert.equal(thresholdSnapshot(0, 13.15 / 17.886).threshold, 0.35);
  assert.equal(counts(thresholdSnapshot(0, 13.15 / 17.886).threshold).FN, 0);
  assert.equal(thresholdSnapshot(1, 0).threshold, 0.35);
  assert(trainHead(12).loss < trainHead(0).loss);
  assert(trainHead(12).p[1] > 0.5);
  assert.deepEqual(counts(0.5), {
    TP: 2,
    FP: 0,
    FN: 1,
    TN: 3,
  });
  assert.deepEqual(counts(0.35), {
    TP: 3,
    FP: 1,
    FN: 0,
    TN: 2,
  });
  assert(temperature(0.3, 2) > 0.35 && temperature(0.3, 2) < 0.5);
  for (const v of [null, NaN, Infinity, -1, 1.1]) assert.equal(fallback(v), 'Human fallback');
  assert.equal(fallback(0.1, 257), 'Human fallback');
  assert.equal(fallback(0.1), 'Guarded agent');
  assert.equal(fallback(0.1, 0, ''), 'Human fallback');
  assert.equal(fallback(0.1, 4, '   '), 'Human fallback');
  assert.equal(fallback(0.1, 0, null), 'Human fallback');
  assert.equal(rows.find((row) => row.id === 'Angry routine').p >= 0.5, false);
  assert.equal(rows.find((row) => row.id === 'Angry routine').p >= 0.35, true);
  for (const beatP of [0, 0.4, 0.9, 1])
    assert.equal(
      sampleModel({
        beat: 0,
        beatP,
      }).temperatureScale,
      1,
    );
  const initial = sampleModel({
    beat: 1,
    beatP: 0,
  }).temperatureScale;
  const middle = sampleModel({
    beat: 1,
    beatP: 0.43,
  }).temperatureScale;
  const final = sampleModel({
    beat: 1,
    beatP: 0.9,
  }).temperatureScale;
  assert.equal(initial, 1);
  assert.equal(middle, 1.5);
  assert.equal(final, 2);
  assert.equal(fallback(temperature(0.3, initial)), 'Guarded agent');
  assert.equal(fallback(temperature(0.3, middle)), 'Human review');
  assert(temperature(0.3, final) < 0.5);
  for (const beatP of [0, 0.25, 0.5, 0.98, 1]) {
    const current = sampleModel({
      beat: 0,
      beatP,
    }).calibration;
    assert.equal(current.crossed, false);
    assert.equal(current.route, 'GUARDED AGENT');
    assert(Math.abs(current.urgentScore - 0.3) < 1e-12);
  }
  for (const beatP of [0, 0.1, 0.25, 0.32]) {
    const current = sampleModel({
      beat: 1,
      beatP,
    }).calibration;
    assert.equal(current.crossed, false);
    assert.equal(current.route, 'GUARDED AGENT');
    assert(current.urgentScore < 0.35);
  }
  for (const beatP of [0.34, 0.43, 0.75, 0.98, 1]) {
    const current = sampleModel({
      beat: 1,
      beatP,
    }).calibration;
    assert.equal(current.crossed, true);
    assert.equal(current.route, 'HUMAN REVIEW');
    assert(current.urgentScore >= 0.35);
    assert(current.routineScore > current.urgentScore);
  }
  validateExpandedModel();
  return true;
}
export function validateExpandedModel() {
  const sweep = [0.35, 0.5, 0.75].map((cutoff) => {
    const { TP, FP, FN } = thresholdCounts(articleSelectionRows, cutoff);
    return [TP, FP, FN];
  });
  assert.deepEqual(sweep, [
    [3, 1, 0],
    [2, 1, 1],
    [1, 0, 2],
  ]);
  assert.equal(costCutoff, 0.25);
  assert.equal(reviewLoss(costCutoff), guardedLoss(costCutoff));
  assert.equal(reviewLoss(0.3).toFixed(2), '1.40');
  assert.equal(guardedLoss(0.3).toFixed(2), '1.80');
  assert(guardedLoss(0.2) < reviewLoss(0.2));
  const g = backpropagationStep();
  assert(Math.abs(g.dz[0] - 0.7310585786300049) < 1e-12);
  assert.deepEqual(g.de[0], [0, 0]);
  assert.deepEqual(g.de[3], [0, 0]);
  assert(Math.abs(g.probabilities[1] - 0.3704804132063618) < 1e-12);
  assert(
    Math.abs(
      backpropagationStep({
        trainEmbeddings: false,
      }).probabilities[1] - 0.3632317179632932,
    ) < 1e-12,
  );
  assert.deepEqual(
    maskedMean(
      [
        [3, 1],
        [1, 3],
        [0, 0],
      ],
      [1, 1, 0],
    ),
    [2, 2],
  );
  assert.throws(() => maskedMean([[1, 2]], [0]), /live row/);
  const base = GATE_CASES.map((r) => ({
    fixture_id: r.id,
    score: r.score,
  }));
  assert.equal(evaluateGate(base, 0.5).FN, 1);
  assert.equal(evaluateGate(base, 0.35).decision, 'eligible_for_shadow');
  assert.equal(evaluateGate(base.slice(1)).reason, 'missing');
  assert.equal(evaluateGate([...base, base[0]]).reason, 'duplicate');
  assert.equal(
    evaluateGate(
      base.map((r, i) =>
        i
          ? {
              ...r,
            }
          : {
              ...r,
              gold: 0,
            },
      ),
    ).reason,
    'submitted fields',
  );
  assert.equal(
    evaluateGate(
      base.map((r, i) =>
        i
          ? {
              ...r,
            }
          : {
              ...r,
              score: NaN,
            },
      ),
    ).reason,
    'invalid score',
  );
  const actual = actualModelComparison();
  assert.deepEqual(
    actual.map((r) => [r.result.TP, r.result.FN, r.result.FP]),
    [
      [3, 0, 3],
      [1, 2, 0],
    ],
  );
  assert(actual.every((r) => r.result.decision === 'hold'));
  assert.equal(trainingFrame(0).step, 0);
  assert.equal(trainingFrame(1).step, 80);
  assert(trainingFrame(1).loss < trainingFrame(0).loss);
  assert.deepEqual(trainingFrame(0).mask, [true, true, true, false, false, false]);
  assert.deepEqual(freshIntake().route, null);
  const fresh = freshIntake({ route: true, miss: true, hold: true });
  assert.equal(fresh.route, 'guarded_agent');
  assert.equal(fresh.falseNegative, true);
  assert.equal(fresh.decision, 'hold');
  assert.equal(
    freshIntake({
      effects: true,
    }).approvedEffects,
    0,
  );
  return true;
}

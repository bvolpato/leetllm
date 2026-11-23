import assert from 'node:assert/strict';
import { studio } from './studio.mjs';
import {
  opening,
  labeling,
  split,
  baseline,
  calls,
  manifest,
  wording,
  rule,
  fitted,
} from './intake.mjs';
import {
  representation,
  scores,
  learning,
  gradient,
  tiny,
  encoder,
  prepareReadout,
  softRows,
  initial,
  frozen,
} from './training.mjs';
import {
  trainingInput,
  checkpoint,
  reload,
  fallbackScene,
  invalidComparison,
  serving,
  pinned,
  shadow,
  developmentLoss,
  policy,
  policyMatches,
  inputs,
  route,
  records,
  stringAdmit,
  boundAdmit,
  checks,
  validLabel,
  normalized,
  fullTicket,
} from './bundles.mjs';
import {
  twoThreshold,
  selection,
  gate,
  receipt,
  provenance,
  models,
  calibration,
  buckets,
  fits,
  supplied,
  flooded,
  keyScores,
  bucketGroups,
  bucketStats,
  twoCalls,
  cutoff14,
  selectionAt,
  labelRoute,
} from './gate.mjs';
import { releaseRecord, lastCall, finalDecision, finalCall } from './closing.mjs';
import {
  backpropagationStep,
  maskedMean,
  evaluateGate,
  temperature,
  trainHead,
  reviewLoss,
  guardedLoss,
} from '../../../films/capstone-fine-tuned-classifier/model.mjs';
import { TRAINING_TRACE } from '../../../films/capstone-fine-tuned-classifier/fixtures/training-trace.mjs';

const painters = [
  opening,
  labeling,
  split,
  baseline,
  representation,
  scores,
  learning,
  gradient,
  tiny,
  encoder,
  trainingInput,
  checkpoint,
  reload,
  twoThreshold,
  selection,
  gate,
  receipt,
  provenance,
  models,
  calibration,
  buckets,
  fallbackScene,
  invalidComparison,
  serving,
  pinned,
  shadow,
  releaseRecord,
  lastCall,
];
function draw(ctx, k) {
  painters[k.beat.chapterIndex](studio(ctx), k);
}
function close(a, b, epsilon = 1e-7) {
  assert.ok(Math.abs(a - b) < epsilon, `${a} does not match ${b}`);
}
function check() {
  assert.deepEqual(
    calls.map((t) => t.gold),
    [0, 1],
  );
  assert.equal(calls.filter((r) => r.marks[0] === r.marks[1]).length, 1);
  assert.equal(new Set(manifest.map((r) => r[0])).size, 8);
  const partitions = [(r) => r[2] <= 2, (r) => r[2] === 3, (r) => r[2] === 4].map(
    (f) => new Set(manifest.filter(f).map((r) => r[1])),
  );
  assert.equal(
    new Set(partitions.flatMap((s) => [...s])).size,
    partitions.reduce((sum, s) => sum + s.size, 0),
  );
  assert.deepEqual(
    wording.map(([, s]) => rule(s)),
    [1, 0, 0, 0],
  );
  assert.deepEqual(
    fitted,
    wording.map((r) => r[2]),
  );
  assert.deepEqual(initial.h, [1, 1]);
  assert.deepEqual(initial.z, [2, 1]);
  for (const z of [
    [-1, 2],
    [1, -1],
    [2, 1],
    [1002, 1001],
  ]) {
    const s = softRows(z);
    assert.ok(s.den >= 1);
    close(s.scores[0] + s.scores[1], 1);
    close(s.scores[1], s.terms[1] / s.den);
  }
  assert.equal(trainHead(12).loss < trainHead(0).loss, true);
  for (const q of [0, 0.5, 1]) {
    const step = backpropagationStep({ progress: q });
    for (const j of [0, 1]) {
      close(step.de[1][j], step.dh[j] / 2);
      close(step.de[2][j], step.dh[j] / 2);
      close(step.embeddings[1][j], step.original[1][j] - 0.1 * q * step.de[1][j]);
      close(step.embeddings[2][j], step.original[2][j] - 0.1 * q * step.de[2][j]);
    }
    for (const i of [0, 3]) {
      assert.deepEqual(step.embeddings[i], step.original[i]);
      assert.deepEqual(step.de[i], [0, 0]);
    }
    close(step.dh[1], 0);
  }
  const updated = backpropagationStep();
  assert.deepEqual(frozen.weights, updated.weights);
  assert.deepEqual(frozen.bias, updated.bias);
  assert.equal(frozen.probabilities[1].toFixed(3), '0.363');
  assert.equal(updated.probabilities[1].toFixed(3), '0.370');
  for (const t of TRAINING_TRACE) {
    const mean = maskedMean(t.embeddingRows, t.mask.map(Number));
    mean.forEach((v, i) => close(v, t.pooled[i], 1e-6));
    assert.ok(t.embeddingRows.slice(3).every((r) => r.every((v) => v === 0)));
  }
  assert.equal(TRAINING_TRACE.at(-1).step, 80);
  assert.ok(TRAINING_TRACE.at(-1).loss < TRAINING_TRACE[0].loss);
  assert.equal(validLabel(true), false);
  assert.equal(validLabel(1), true);
  assert.equal(normalized(' WHERE  IS  THE GUIDE? '), normalized('Where is the guide?'));
  assert.deepEqual([fullTicket(false), fullTicket(true)].map(({ content, count, fits }) =>
    [content, count, fits, route({ ...inputs[0], count })]), [
    [254, 256, true, 'Guarded agent'],
    [255, 257, false, 'Human fallback'],
  ]);
  assert.equal(developmentLoss.indexOf(Math.min(...developmentLoss)) + 1, 2);
  const crossings = [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [1, 1, 1],
  ].map((args) => Math.round(cutoff14(...args) * 100) / 100);
  assert.deepEqual(crossings, [0.5, 0.44, 0.42, 0.35]);
  assert.deepEqual(
    crossings.map((t) => twoCalls.map((r) => r.p >= t)),
    [
      [false, false],
      [false, true],
      [true, true],
      [true, true],
    ],
  );
  assert.deepEqual(
    [0.35, 0.5, 0.75].map((t) => {
      const c = selectionAt(t);
      return [c.TP, c.FP, c.FN];
    }),
    [
      [3, 1, 0],
      [2, 1, 1],
      [1, 0, 2],
    ],
  );
  close(reviewLoss(0.25), guardedLoss(0.25));
  close(reviewLoss(0.3), 1.4);
  close(guardedLoss(0.3), 1.8);
  assert.equal(evaluateGate(supplied, 0.5).FN, 1);
  assert.equal(evaluateGate(supplied, 0.35).decision, 'eligible_for_shadow');
  for (const [rows, lamps, extras] of [
    [supplied, [true, true, true, true, false, false], 1],
    [flooded,  [true, true, true, true, true, true], 3],
  ]) {
    assert.deepEqual(rows.map(({ score }) => score >= 0.35), lamps);
    const result = evaluateGate(rows);
    assert.deepEqual([result.FP, result.FN], [extras, 0]);
  }
  assert.equal(evaluateGate(keyScores).FP, 0);
  assert.equal(evaluateGate(supplied.slice(1)).reason, 'missing');
  assert.equal(evaluateGate([...supplied, supplied[0]]).reason, 'duplicate');
  assert.equal(
    evaluateGate(supplied.map((r, i) => (i ? r : { ...r, gold: 0 }))).reason,
    'submitted fields',
  );
  for (const score of [true, NaN, Infinity, '0.41', null])
    assert.equal(
      evaluateGate(supplied.map((r, i) => (i ? r : { ...r, score }))).reason,
      'invalid score',
    );
  assert.deepEqual(
    fits.map((m) => m.scores.map((v) => v >= m.cut)),
    [
      [true, true, true, true, true, true],
      [false, false, true, false, false, false],
    ],
  );
  assert.deepEqual(
    fits.map((m) => m.scores[1].toFixed(3)),
    ['0.606', '0.051'],
  );
  assert.deepEqual(
    fits.map((m) => [m.result.FP, m.result.FN, m.result.decision]),
    [
      [3, 0, 'hold'],
      [0, 2, 'hold'],
    ],
  );
  assert.equal(labelRoute(temperature(0.3, 1), 0.35), 'Guarded agent');
  assert.equal(labelRoute(temperature(0.3, 2), 0.35), 'Human review');
  assert.ok(temperature(0.3, 2) < 0.5);
  assert.deepEqual(
    bucketGroups.map(bucketStats).map((r) => [+r.mean.toFixed(3), r.positive, r.n]),
    [
      [0.205, 0, 2],
      [0.53, 2, 2],
      [0.8, 1, 2],
    ],
  );
  assert.deepEqual(
    inputs.map((r) => route(r)),
    ['Guarded agent', ...Array(5).fill('Human fallback')],
  );
  assert.equal(route({ ...inputs[0], count: 256 }), 'Guarded agent');
  assert.equal(route({ ...inputs[0], count: 257 }), 'Human fallback');
  assert.equal(route({ ...inputs[0], score: 0.35 }), 'Human review');
  for (const mutation of [{ fallback_route: 'guarded_agent' }, { threshold: '0.35' }, { extra: 1 }])
    assert.equal(policyMatches({ ...policy, ...mutation }), false);
  assert.deepEqual(records.map(stringAdmit), [true, false, false]);
  assert.deepEqual(checks.map(boundAdmit), [true, false, false]);
  assert.deepEqual(finalDecision(finalCall.cut), {
    cut: 0.35,
    route: 'Guarded agent',
    human: false,
    missed: true,
  });
  assert.equal(finalCall.score, 0.34);
  assert.deepEqual(finalDecision(finalCall.score), {
    cut: 0.34,
    route: 'Human review',
    human: true,
    missed: false,
  });
  assert.equal(finalCall.approved, 0);
}
export default {
  title: 'Train, Test and Bind an Intake Classifier',
  preparePicture: prepareReadout,
  draw,
  check,
};

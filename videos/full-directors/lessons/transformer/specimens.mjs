import assert from 'node:assert/strict';
import { dotProduct as dot, stableSoftmax as softmax } from 'vizmatic';
import {
  norm,
  normStats,
  position,
  splitHeads,
  mergeHeads,
  unmaskedRead,
} from '../../../films/transformer/arithmetic.mjs';
import {
  MODEL,
  INPUT,
  FEEDBACK,
  FEEDBACK_INPUT,
  CACHE_RUNS,
  FRESH,
  compute,
  normalizationAxisCase,
  validateModel,
} from '../../../films/transformer/model.mjs';
import {
  ARTICLE_STATES,
  EMBED,
  HEAD_WORKSHEET,
  VOCAB,
  WORDS,
  WQ,
  WOUT,
} from '../../../films/transformer/fixtures.mjs';
export {
  dot,
  softmax,
  norm,
  normStats,
  position,
  splitHeads,
  mergeHeads,
  unmaskedRead,
  MODEL,
  INPUT,
  FEEDBACK,
  FEEDBACK_INPUT,
  CACHE_RUNS,
  FRESH,
  EMBED,
  HEAD_WORKSHEET,
  VOCAB,
  WORDS,
  WQ,
  WOUT,
};
export const sum = (a) => a.reduce((s, v) => s + v, 0);
export const distance = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
const maskQuery = WORDS.length - 1;
const trainingScores = FEEDBACK.scores[maskQuery];
const maskedScores = trainingScores.map((v, i) => (i <= maskQuery ? v : -Infinity));
const peak = Math.max(...maskedScores);
const masses = maskedScores.map((v) => Math.exp(v - peak));
const totalMass = sum(masses);
export const trainingRead = {
  scores: trainingScores,
  maskedScores,
  masses,
  totalMass,
  weights: masses.map((mass) => mass / totalMass),
};
export function perturb(i, change) {
  const rows = INPUT.map((row) => [...row]);
  rows[i][0] += change;
  return compute(rows).Z.map((row, j) => distance(row, MODEL.Z[j]));
}
export function axisCompare(change) {
  return [false, true].map((across) => {
    const before = normalizationAxisCase(0, across),
      after = normalizationAxisCase(change, across);
    return {
      mean: after.mean,
      input: after.input,
      delta: distance(after.model.Z[0], before.model.Z[0]),
    };
  });
}
export const articleRuns = ARTICLE_STATES.map((row) => {
  const [a, b, c, d] = norm(row);
  const logits = [a, 0.2 * a, 0.2 * d, 0.5 * c + d, -b, c];
  return { row, logits, probs: softmax(logits) };
});
export const matchingRows = [
  [1, 0],
  [1, 1],
];
export const matching = matchingRows.map((query) => matchingRows.map((key) => dot(query, key)));
export const matchingShares = matching.map((scores) => softmax(scores));
export const scaleScores = [12.4, 9.1, 3.8];
export const temperature = (logits, t) => softmax(logits.map((v) => (v - Math.max(...logits)) / t));
export function twoWordTemperature(t) {
  const logits = [0, Math.log(9)];
  const scaled = logits.map((v) => v / t);
  return { scaled, masses: scaled.map(Math.exp), shares: temperature(logits, t) };
}
export const plainBudget = 2 * 12 * 48;
export const gatedWidth = plainBudget / (3 * 12);
export const gate = (x) => x / (1 + Math.exp(-x));
export const affine = (x) => 3 * (2 * x + 1) - 2;
export const bent = (x) => 3 * Math.max(0, 2 * x + 1) - 2;
export const constant = [2, 2, 2, 2];
export const rms = (row) =>
  row.map((v) => v / Math.sqrt(sum(row.map((x) => x * x)) / row.length + 1e-5));
export const rotary = (q, k) => Math.cos(0.1 * (q - k));
export const heads = splitHeads(HEAD_WORKSHEET);
export const headWeights = heads.map((head) =>
  head.map((query, t) => {
    const legal = softmax(
      head.slice(0, t + 1).map((key) => dot(query, key) / Math.sqrt(query.length)),
    );
    return [...legal, ...Array(head.length - t - 1).fill(0)];
  }),
);
export const headReads = heads.map((head, h) =>
  head.at(-1).map((_, j) => sum(head.map((value, i) => value[j] * headWeights[h].at(-1)[i]))),
);
export const allLogits = MODEL.final.map((row) => WOUT.map((weights) => dot(row, weights)));
export const llama = { layers: 126, width: 16384, heads: 128, vocab: 128256, total: 405e9 };
export const oss = { layers: 36, width: 2880, heads: 64, headWidth: 64, window: 128 };
export function checkSpecimens() {
  validateModel();
  for (let j = 0; j < INPUT[2].length; j++) {
    assert.equal(INPUT[2][j], EMBED[2][j] + position(2)[j]);
    assert.equal(MODEL.Y[2][j], INPUT[2][j] + MODEL.update[2][j]);
    assert.equal(MODEL.Z[2][j], MODEL.Y[2][j] + MODEL.F[2][j]);
    assert(
      Math.abs(
        FEEDBACK.A[3][j] - sum(FEEDBACK.V.map((v, key) => v[j] * FEEDBACK.weights[3][key])),
      ) < 1e-12,
    );
  }
  assert.deepEqual(allLogits.at(-1), MODEL.logits);
  assert.equal((MODEL.probs[3] * 100).toFixed(1), '39.0');
  assert(Number.isFinite(trainingRead.scores.at(-1)));
  assert.equal(trainingRead.maskedScores.at(-1), -Infinity);
  assert.equal(trainingRead.masses.at(-1), 0);
  assert.equal(trainingRead.weights.at(-1), 0);
  assert(Math.abs(sum(trainingRead.weights) - 1) < 1e-12);
  assert(trainingRead.weights.every((w, i) => Math.abs(w - FEEDBACK.weights[maskQuery][i]) < 1e-12));
  assert(articleRuns.every((r) => (r.probs[3] * 100).toFixed(1) === '35.3'));
  assert(articleRuns[0].row[0] * articleRuns[1].row[0] < 0);
  assert.deepEqual(mergeHeads(heads), HEAD_WORKSHEET);
  assert.equal(headReads.flat().length, 6);
  for (const weights of headWeights)
    weights.forEach((row, t) => {
      assert(Math.abs(sum(row) - 1) < 1e-12);
      assert(row.slice(t + 1).every((w) => w === 0));
    });
  assert.deepEqual(matching, [
    [1, 1],
    [1, 2],
  ]);
  assert.deepEqual(
    matchingShares.map((row) => row.map((share) => (100 * share).toFixed(1))),
    [['50.0', '50.0'], ['26.9', '73.1']],
  );
  const scaled = temperature(scaleScores, 8);
  assert(scaled[0] > 0.49 && scaled[0] < 0.51);
  for (const t of [1, 1.5, 2]) {
    const { masses, shares } = twoWordTemperature(t);
    assert(Math.abs(masses[1] - 9 ** (1 / t)) < 1e-12);
    assert(Math.abs(shares[1] - masses[1] / sum(masses)) < 1e-12);
  }
  assert(Math.abs(twoWordTemperature(2).shares[1] - 0.75) < 1e-12);
  assert.deepEqual(temperature([3, 3], 0.5), [0.5, 0.5]);
  assert.equal(plainBudget, 3 * 12 * gatedWidth);
  assert.equal(affine(-1), -5);
  assert.equal(bent(-1), -2);
  assert.equal((2 * gate(-1)).toFixed(3), '-0.538');
  assert.deepEqual(norm(constant), [0, 0, 0, 0]);
  assert(rms(constant).every((x) => x < 1 && x > 0.999));
  assert.equal(rotary(4, 1), rotary(6, 3));
  assert.equal(axisCompare(4)[0].delta, 0);
  assert(axisCompare(4)[1].delta > 0);
  assert.equal(llama.width / llama.heads, 128);
  assert.equal(oss.headWidth * oss.heads, 4096);
  return true;
}

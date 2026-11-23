import assert from 'node:assert/strict';
import {
  FFN,
  HEAD_SCORES,
  MODULE_SCORES,
  RANK_SCORES,
  TABLE1,
  TABLE5,
  FIGURE4,
  IDENTITY_FIXTURE,
} from '../../../films/deep-dive-light-peft/fixtures.mjs';
import { keepAbove, multiply } from '../../../films/deep-dive-light-peft/arithmetic.mjs';

export { FFN, HEAD_SCORES, MODULE_SCORES, RANK_SCORES, TABLE1, TABLE5, FIGURE4 };
export const sum = (terms) => terms.reduce((a, b) => a + b, 0);
export const fmt = (n) => Number(n.toFixed(4)).toString().replace('-', '−');
export const select = keepAbove;
export function projection(d, m, rank, tokens = 1) {
  const groups = [d * d, d * d, d * d, d * d, d * m, m * d];
  return { groups, base: sum(groups) * tokens, adapter: 2 * d * rank * tokens };
}
export const queryCost = (outputs, rank) => ({
  base: 8 * outputs,
  adapter: 8 * rank + outputs * rank,
});
export const head = select(HEAD_SCORES, 0.25);
export const signed = [-HEAD_SCORES[0], ...HEAD_SCORES.slice(1)];
export const callerKeep = (scores, ratio) =>
  ratio === 0 ? scores.map((_, i) => i) : select(scores, ratio).kept;
export const ties = [0.3, 0.3, 0.6, 0.8];
export const ff = select(
  FFN.map((n) => n.score),
  0.4,
);
export const ffnLayers = [
  [0.1, 0.2],
  [0.8, 0.9],
];
export const localFF = ffnLayers.map((layer) => select(layer, 0.5));
export const globalFF = select(ffnLayers.flat(), 0.5);
export const ffPaths = [
  { id: 'n1', activation: 2, weight: 1 },
  { id: 'n2', activation: 3, weight: 2 },
  { id: 'n3', activation: -1, weight: -1 },
];
export const survivingFF = ffPaths.filter((p) => ff.kept.some((i) => FFN[i].id === 'L0-' + p.id));
export const n1Gate = FFN.find((p) => p.id === 'L0-n1').score;
export const n1GatedActivation = ffPaths[0].activation * n1Gate;
export const dotFF = (paths) => sum(paths.map((p) => p.activation * p.weight));

export const files = [
  'early_attn_mask_records.npy',
  'early_ffn_mask_records.npy',
  'peft_module_records.pkl',
  'peft_mask_records.pkl',
  'adapter weights',
];
export const matches = (estimate, receiver) => estimate === receiver;
export const clockParts = [
  ['Estimate', 10],
  ['Write', 2],
  ['Slice', 3],
  ['Train', 40],
  ['Evaluate + export', 5],
];
export const baselineMinutes = 90;
export const minutes = sum(clockParts.map(([, v]) => v));
export const moduleRecord = select(MODULE_SCORES, 0.33);
export const rankRecord = select(RANK_SCORES, 0.5);
export const otherRanks = [0.11, 0.21, 0.26, 0.29];
export const pooledRanks = select([...RANK_SCORES, ...otherRanks], 0.5);
export const baseVector = [3, 4],
  changeVector = [0.9, 1.2];
export const ratio = (base, delta) => Math.hypot(...delta) / Math.hypot(...base);
export const history = [0.6, 0.5, 0.3, 0.2, ratio([0, 0], changeVector), 0.4];
export const late = history.slice(Math.floor(history.length / 2));
export const sanitized = late.map((v) => (Number.isFinite(v) ? v : 0));
// One token and one rank at unit scale. Both factors receive the same task-loss signal.
const scoredRow = [2, 1];
const scoredColumn = [3, -1];
export const scoreToken = [3, -4];
export const outputGradient = [0.5, 0.5];
const [rankActivation] = multiply([scoredRow], scoreToken);
const [activationGradient] = multiply([scoredColumn], outputGradient);
export const rankFactors = [
  scoredRow.map((weight, i) => ({ weight, gradient: scoreToken[i] * activationGradient })),
  scoredColumn.map((weight, i) => ({ weight, gradient: outputGradient[i] * rankActivation })),
];
export const products = rankFactors.map((side) => side.map(({ weight, gradient }) => weight * gradient));
export const signedSums = products.map(sum);
export const signedMeans = signedSums.map((total, i) => total / products[i].length);
export const paperScore = sum(products.flat().map(Math.abs));
export const codeScore = sum(signedMeans.map(Math.abs));
export const A = [
  [1, 2, 0],
  [0, 1, 3],
  [2, 0, 1],
  [1, -1, 2],
];
export const B = [
  [1, 2, 3, 4],
  [-2, 1, 0, 3],
];
export const x = [2, -1, 3];
export const hidden = multiply(A, x);
export const alpha = 16,
  scale = alpha / A.length;
export function rankProduct(ids, columns, factor) {
  const h = ids.map((i) => hidden[i]);
  return multiply(
    B.map((row) => columns.map((i) => row[i])),
    h,
  ).map((v) => v * factor);
}
export const retained = rankRecord.kept;
const maskActivations = (ids) => hidden.map((value, id) => (ids.includes(id) ? value : 0));
export const maskedHidden = maskActivations(retained);
export const maskedProduct = multiply(B, maskedHidden);
export const slicedTerms = retained.map((id) => B.map((row) => row[id] * hidden[id]));
export const unscaled = rankProduct(retained, retained, 1);
export const rebuiltScale = alpha / retained.length;
export const scaled = rankProduct(retained, retained, scale);
export const rebuilt = rankProduct(retained, retained, rebuiltScale);
export const qualityFloor = 92;
export const winningStructure = { heads: 16, removedHeads: 5, ffnParts: 3, removedFFNParts: 1 };
export const best = TABLE1.filter((row) => row.average >= qualityFloor).sort(
  (a, b) => b.speed - a.speed,
)[0];
export const bases = [IDENTITY_FIXTURE.baseA, IDENTITY_FIXTURE.baseB];
const headRows = [
  [1, 0],
  [-2, -6],
  [1, -1],
  [3, -5],
];
export function tokenOutput(token) {
  const contributions = multiply(headRows, token);
  const terms = bases.map((ids) => ids.map((i) => contributions[i]));
  return { contributions, terms, outputs: terms.map(sum) };
}
export const firstWrong = bases[0].findIndex((v, i) => v !== bases[1][i]);
export const cases = [
  { name: 'Familiar', pass: 50, n: 50 },
  { name: 'Shifted', pass: 6, n: 10 },
];
export const gate = 0.8;
export const aggregate = sum(cases.map((s) => s.pass)) / sum(cases.map((s) => s.n));
export const shifted = cases[1].pass / cases[1].n;

export function checkExamples() {
  assert.deepEqual(
    [queryCost(8, 2), queryCost(8, 1), queryCost(6, 1)],
    [
      { base: 64, adapter: 32 },
      { base: 64, adapter: 16 },
      { base: 48, adapter: 14 },
    ],
  );
  assert.deepEqual(projection(8, 32, 2), {
    groups: [64, 64, 64, 64, 256, 256],
    base: 768,
    adapter: 32,
  });
  assert.deepEqual(
    [projection(8, 32, 1).adapter, projection(8, 32, 1, 4).base, projection(8, 32, 1, 4).adapter],
    [16, 3072, 64],
  );
  assert.deepEqual(
    [matches(17, 18), matches(17, 17), minutes, baselineMinutes / minutes],
    [false, true, 60, 1.5],
  );
  assert.deepEqual(head.kept, [0, 2, 3]);
  assert.equal(fmt(head.threshold), '0.425');
  assert.deepEqual(select(signed, 0.25).kept, [1, 2, 3]);
  assert.deepEqual(select(signed.map(Math.abs), 0.25).kept, [0, 2, 3]);
  assert.deepEqual(callerKeep(ties, 0), [0, 1, 2, 3]);
  assert.deepEqual(callerKeep(ties, 0.25), [2, 3]);
  assert.equal(fmt(ff.threshold), '0.246');
  assert.deepEqual(ff.kept, [1, 2, 4]);
  assert.deepEqual(
    survivingFF.map((p) => p.id),
    ['n2', 'n3'],
  );
  assert.deepEqual([dotFF(ffPaths), dotFF(survivingFF)], [9, 7]);
  assert.equal(n1GatedActivation, 0.14);
  assert.equal(n1GatedActivation * ffPaths[0].weight, 0.14);
  assert.deepEqual(globalFF.kept, [2, 3]);
  assert.deepEqual(
    localFF.map((s) => s.kept),
    [[1], [1]],
  );
  assert.equal(ratio(baseVector, changeVector), 0.3);
  assert.deepEqual(sanitized, [0.2, 0, 0.4]);
  assert.equal(fmt(sum(sanitized) / 3), '0.2');
  assert.deepEqual(moduleRecord.kept, [1, 2]);
  assert.deepEqual(retained, [1, 3]);
  assert.equal(fmt(pooledRanks.threshold), '0.19');
  assert.deepEqual(pooledRanks.kept, [3, 5, 6, 7]);
  assert.deepEqual([rankActivation, activationGradient], [2, 1]);
  assert.deepEqual(rankFactors.map((side) => side.map(({ gradient }) => gradient)), [[3, -4], [1, 1]]);
  assert.equal(-rankFactors[0][0].weight * rankFactors[0][0].gradient, -6);
  assert.deepEqual(products, [[6, -4], [3, -1]]);
  assert(signedSums.every((total) => total === rankActivation * activationGradient));
  assert.deepEqual(signedMeans, [1, 1]);
  assert.deepEqual([paperScore, codeScore], [14, 2]);
  assert.deepEqual(hidden, [0, 8, 7, 9]);
  for (let mask = 0; mask < 16; mask++) {
    const ids = hidden.map((_, i) => i).filter((i) => mask & (1 << i));
    assert.deepEqual(
      rankProduct(ids, ids, scale),
      multiply(B, maskActivations(ids)).map((v) => v * scale),
    );
  }
  assert.deepEqual(maskedHidden, [0, 8, 0, 9]);
  assert.deepEqual(maskedProduct, unscaled);
  assert.deepEqual(unscaled, B.map((_, i) => sum(slicedTerms.map((term) => term[i]))));
  assert.deepEqual(unscaled, [52, 35]);
  assert.deepEqual([scale, rebuiltScale], [4, 8]);
  assert.deepEqual(scaled, [208, 140]);
  assert.deepEqual(rebuilt, [416, 280]);
  assert.notDeepEqual(rankProduct(retained, [0, 2], scale), scaled);
  assert.equal(best.retained, 72);
  assert.deepEqual([best.average, best.speed, TABLE5.retained], [92.2, 1.4, 52]);
  assert.deepEqual([winningStructure.heads - winningStructure.removedHeads,
    winningStructure.ffnParts - winningStructure.removedFFNParts], [11, 2]);
  assert.equal(FIGURE4.retained, 67);
  assert.equal(TABLE5.modules, 48);
  assert.deepEqual([firstWrong, bases[0].length, bases[1].length], [1, 3, 3]);
  assert.deepEqual(tokenOutput([1, -1]).outputs, [11, 13]);
  assert.deepEqual(tokenOutput([2, 0]).outputs, [10, 4]);
  assert.equal(Math.round(100 * aggregate), 93);
  assert(shifted < gate);
}

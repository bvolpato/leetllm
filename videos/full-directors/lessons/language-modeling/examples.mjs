import assert from 'node:assert/strict';
import {
  CONDITIONAL_ROWS,
  CORPUS,
  FITTED_NGRAM,
  CACHE_PARITY_FIXTURE,
  TARGET_PROBS,
  SPLIT_CAT,
} from '../../../films/language-modeling/fixtures.mjs';
import {
  fittedPrediction,
  localGradientCredit,
  generationWork,
  rawKvBytes,
  selectSample,
} from '../../../films/language-modeling/model.mjs';
import { sum, product } from './drawing.mjs';
export {
  CONDITIONAL_ROWS as rows,
  CORPUS,
  FITTED_NGRAM as fit,
  CACHE_PARITY_FIXTURE as parity,
  TARGET_PROBS,
  SPLIT_CAT,
  fittedPrediction,
  localGradientCredit,
  generationWork,
  rawKvBytes,
  selectSample,
};
export const comments = [
  'function returns value',
  'function returns value',
  'method returns result',
  'handler returns value',
  'test returns result',
  'test returns error',
];
export const compiler = ['error', 'warning', 'success', 'the', 'end'];
export const logits = [3, 1.5, -1, -2, -3];
export function softmax(scores, temp = 1) {
  const m = Math.max(...scores);
  const exp = scores.map((z) => Math.exp((z - m) / temp));
  return exp.map((x) => x / sum(exp));
}
export function following(records, prefix) {
  return records
    .map((s) => s.split(' '))
    .filter((a) => a.slice(-1 - prefix.length, -1).join(' ') === prefix.join(' '))
    .map((a) => a.at(-1));
}
export function tally(tokens, vocab, alpha = 0) {
  return vocab.map((t) => tokens.filter((w) => w === t).length + alpha);
}
export const fullVocab = [
  'value',
  'result',
  'error',
  'exception',
  'function',
  'handler',
  'method',
  'returns',
  'test',
  'end',
];
export const catPath = CONDITIONAL_ROWS['The cat'][0][1] * CONDITIONAL_ROWS['The cat sat'][0][1];
export const foxFactors = [
  CONDITIONAL_ROWS['A red fox'][0][1],
  CONDITIONAL_ROWS['A red fox runs'][0][1],
];
export const foxPath = product(foxFactors);
export const meanLoss = (p) => -sum(p.map(Math.log)) / p.length;
export const ppl = (p) => Math.exp(meanLoss(p));
export const bits = (p) => -Math.log2(p);
export const catBytes = new TextEncoder().encode('The cat sat');
export const batches = [
  [0.5, null, null],
  [0.125, 0.125, 0.125],
];
export const pooled = batches.flat().filter((x) => x !== null);
export const gqaGiB = (requests, positions, heads) =>
  rawKvBytes({ layers: 32, heads, width: 128, positions: positions * requests }) / 1024 ** 3;
export function shifted(ids, shift, mask = ids.map(() => true)) {
  return ids.slice(shift).map((id, i) => (mask[i + shift] ? id : 'ignore'));
}
export function runFox(firstDraw, secondDraw) {
  const prefix = 'A red fox',
    first = selectSample(prefix, firstDraw),
    second = selectSample(prefix + ' ' + first, secondDraw);
  return {
    output: [first, second],
    processed: [...prefix.split(' '), first],
    stop: second === 'end' ? 'End token' : 'Output limit',
  };
}
export const foxRun = runFox(0.12, 0.28),
  foxRetry = runFox(0.72, 0.4);
export function pageBudget(lengths, capacity, bytesPerPosition) {
  const used = sum(lengths);
  const reserved = sum(lengths.map((n) => Math.ceil(n / capacity) * capacity));
  return {
    used,
    reserved,
    rawKiB: (used * bytesPerPosition) / 1024,
    reservedKiB: (reserved * bytesPerPosition) / 1024,
  };
}
export function greedyToken(prefix) {
  return CONDITIONAL_ROWS[prefix].reduce((best, item) => (item[1] > best[1] ? item : best))[0];
}
export function check() {
  const approx = (x, y, e = 1e-8) => assert.ok(Math.abs(x - y) < e, `${x} differs from ${y}`);
  for (const row of Object.values(CONDITIONAL_ROWS)) approx(sum(row.map((r) => r[1])), 1);
  const heated = softmax(
    CONDITIONAL_ROWS['The cat'].map(([, p]) => Math.log(p)),
    2,
  );
  approx(heated[0] / (heated[0] + heated[1]), 0.585786438);
  assert.deepEqual(pageBudget([3, 7], 4, 2048), {
    used: 10,
    reserved: 12,
    rawKiB: 20,
    reservedKiB: 24,
  });
  assert.equal(greedyToken('The dog'), 'ate');
  assert.equal(greedyToken('The dog ate'), 'end');
  approx(catPath, 0.48);
  approx(foxPath, 0.125);
  assert.deepEqual(tally(following(comments, ['returns']), fullVocab).slice(0, 4), [3, 2, 1, 0]);
  assert.equal(sum(tally(following(comments, ['returns']), fullVocab, 1)), 16);
  assert.deepEqual(following(comments, ['test', 'returns']), ['result', 'error']);
  assert.deepEqual(tally(following(CORPUS, ['cat']), ['sat', 'slept', 'ate'], 1), [3, 2, 1]);
  for (const [context, expected] of [
    ['function', 7.904],
    ['test', null],
  ]) {
    const f = fittedPrediction([context, 'returns']);
    approx(sum(f.probabilities), 1);
    approx(sum(f.valueTerms) + f.valueBias, f.logits[7]);
    if (expected) approx(f.logits[7], expected, 0.001);
    else assert.ok(f.logits[4] > f.logits[0]);
  }
  const g = localGradientCredit();
  assert.deepEqual(g.weights[0], [0.3, -0.2, 0.5]);
  assert.deepEqual(g.residual, [0.2, 0.5, -0.7]);
  approx(sum(g.weights[0].map((w, j) => w * g.residual[j])), g.inputGradient[0]);
  approx(g.weightGradients[0][2], -1.4);
  approx(g.inputGradient[0], -0.39);
  approx(softmax(logits)[0], 0.8, 0.001);
  approx(softmax(logits, 2)[0], 0.575, 0.001);
  assert.deepEqual(shifted(['start', 'function', 'returns'], 1), ['function', 'returns']);
  assert.deepEqual(shifted([0, 1, 2, 4, 4], 1, [true, true, true, true, false]), [
    1,
    2,
    4,
    'ignore',
  ]);
  approx(product(TARGET_PROBS), 0.2304);
  approx(product(SPLIT_CAT), 0.6);
  assert.equal(catBytes.length, 11);
  approx(sum(pooled.map(bits)), 10);
  assert.equal(selectSample('The cat', 0.75), 'slept');
  assert.deepEqual(CONDITIONAL_ROWS['The cat'], [['sat', 0.6], ['slept', 0.3], ['ate', 0.1]]);
  assert.deepEqual(CONDITIONAL_ROWS['The cat slept'], [['on', 0.9], ['end', 0.1]]);
  assert.equal(selectSample('The cat slept', 0.95), 'end');
  assert.deepEqual(generationWork(3, 3), {
    lengths: [3, 4, 5],
    uncachedPositions: 12,
    uncachedCells: 50,
    cachedPositions: 5,
    cachedCells: 18,
  });
  assert.ok(
    Math.max(
      ...CACHE_PARITY_FIXTURE.full
        .flat()
        .map((v, i) => Math.abs(v - CACHE_PARITY_FIXTURE.cached.flat()[i])),
    ) < 1e-5,
  );
  assert.equal(gqaGiB(4, 2048, 8), 1);
  assert.equal(gqaGiB(4, 32768, 4), 8);
  assert.deepEqual(foxRun, {
    output: ['runs', 'end'],
    processed: ['A', 'red', 'fox', 'runs'],
    stop: 'End token',
  });
  assert.deepEqual(foxRetry, {
    output: ['waits', 'here'],
    processed: ['A', 'red', 'fox', 'waits'],
    stop: 'Output limit',
  });
}

import assert from 'node:assert/strict';
import {
  CONTEXT_EVENTS,
  CONTEXT_WORDS,
  CORPUS,
  EMBEDDING_COUNTS,
  FINANCE,
  NEGATIVE_OUTPUTS,
  RIVER,
  V,
} from '../../../films/embeddings/fixtures.mjs';
import { countRepresentation, negativeSamplingState } from '../../../films/embeddings/model.mjs';
import {
  centerPopulation,
  gloveResidual,
  maskedMean,
  occurrenceVisibility,
  rotateEmbedding,
  subwordComposition,
} from '../../../films/embeddings/arithmetic.mjs';

export {
  CONTEXT_EVENTS,
  CONTEXT_WORDS,
  CORPUS,
  EMBEDDING_COUNTS,
  FINANCE,
  NEGATIVE_OUTPUTS,
  RIVER,
  V,
  centerPopulation,
  gloveResidual,
  maskedMean,
  negativeSamplingState,
  occurrenceVisibility,
  subwordComposition,
};
export const countModel = countRepresentation();
export const charge = [0.8, 0.2];
export const names = ['Invoice', 'Phone'];
export const clues = [
  [0.2, 1],
  [1, 0.1],
];
export const baseGuides = [
  [1, 1],
  [-1, 1],
];
export const weights = [0.2, 0.3, 0.5];
export const layers = [
  [
    [1, 0],
    [0, 1],
    [1, 1],
  ],
  [
    [0, 1],
    [1, 0],
    [0.5, 0.5],
  ],
];
export const ids = [0, 0, 1];
export const buckets = [
  [1, 0.5],
  [0, 1],
];
export const dot = (a, b) => a.reduce((s, n, i) => s + n * b[i], 0);
export const plus = (a, b) => a.map((x, i) => x + b[i]);
export const scale = (a, s) => a.map((x) => x * s);
export const mix = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
export const length = (a) => Math.hypot(...a);
export const unit = (a) => scale(a, 1 / length(a));
export const cos = (a, b) => (length(a) && length(b) ? dot(a, b) / (length(a) * length(b)) : null);
export const weighted = (rows, shares) =>
  rows.reduce((v, row, i) => plus(v, scale(row, shares[i])), [0, 0]);
export const scores = (q, guides, metric = dot) => guides.map((g) => metric(q, g));
export const winner = (row) => row.indexOf(Math.max(...row));
export const fmt = (n, k = 3) =>
  n === null ? 'undefined' : String(Number(n.toFixed(k))).replace('-', '−');
export const vec = (a, k = 3) => '[' + a.map((v) => fmt(v, k)).join(', ') + ']';
export const turn = (rows, angle) => rows.map((v) => rotateEmbedding(v, angle));
export const grams = (word) =>
  Array.from({ length: word.length }, (_, i) => ('<' + word + '>').slice(i, i + 3));
export const readSentence = ['children', 'read', 'stories', 'each', 'night'];
export const readNeighbors = readSentence.filter((_, i) => i !== 1 && Math.abs(i - 1) <= 2);
export function searchState(original, queryAngle, indexAngle) {
  const queries = turn(original, queryAngle),
    guides = turn(original, indexAngle);
  return { queries, guides, matrix: queries.map((q) => scores(q, guides)) };
}
export function contextPath(rows, shares) {
  const points = [[0, 0]];
  rows.forEach((row, i) => points.push(plus(points.at(-1), scale(row, shares[i]))));
  return points;
}
export function readMask(causal, position, tokens) {
  return occurrenceVisibility(causal, position, tokens);
}
export function shiftedCell(k, j) {
  const noise = k * countModel.expected[0][j],
    observed = EMBEDDING_COUNTS[0][j];
  return { noise, observed, optimum: Math.log(observed / noise) };
}
export function checkGeometry() {
  assert.deepEqual(
    grams('played').filter((piece) => grams('play').includes(piece)),
    ['<pl', 'pla', 'lay'],
  );
  assert.deepEqual(grams('play'), ['<pl', 'pla', 'lay', 'ay>']);
  assert.deepEqual(grams('played'), ['<pl', 'pla', 'lay', 'aye', 'yed', 'ed>']);
  assert.deepEqual(subwordComposition(ids, buckets).sum, [2, 2]);
  assert.deepEqual(readNeighbors, ['children', 'stories', 'each']);
  assert.deepEqual(
    CONTEXT_WORDS.map((w) => CONTEXT_EVENTS.filter((e) => e.word === w).length),
    [2, 1, 2, 1],
  );
  assert.equal(fmt(countModel.ppmi[0][0]), '0.703');
  assert.equal(vec(countModel.singular), '[1.418, 1.348]');
  assert.deepEqual(
    [
      cos(countModel.vectors[0], countModel.vectors[1]),
      cos(countModel.vectors[0], countModel.vectors[2]),
    ].map((n) => Math.round(n)),
    [1, 0],
  );
  const train = negativeSamplingState(1);
  assert.equal(vec(train.gradient), '[−0.813, −0.081]');
  assert.equal(fmt(train.loss), '0.827');
  assert.equal(fmt(train.positiveScore), '1.298');
  assert.equal(fmt(train.lossBefore), '0.892');
  assert(shiftedCell(4, 0).optimum < 0 && shiftedCell(1, 0).optimum > 0);
  assert.equal(shiftedCell(4, 2).optimum, -Infinity);
  assert.equal(fmt(gloveResidual(3).squared), '5.302');
  assert.equal(gloveResidual(30).weighted, 0);
  assert.equal(gloveResidual(300).weight, 1);
  assert.equal(winner(scores(charge, clues, cos)), 1);
  assert.deepEqual(scores(charge, clues, cos).map((n) => fmt(n)), ['0.428', '0.989']);
  assert.deepEqual(
    clues.map((v) => vec(mix(charge, v, 0.5))),
    ['[0.5, 0.6]', '[0.9, 0.15]'],
  );
  assert.equal(fmt(cos([1, 0], [1, 1])), fmt(cos([1, 0], [2, 2])));
  assert.equal(dot([1, 0], [2, 2]), 2);
  assert.deepEqual(
    clues.map((v, i) => winner(scores(mix(charge, v, 0.5), clues, cos)) === i),
    [true, true],
  );
  assert.equal(vec(weighted([V.bank, V.river, V.water], [0.5, 0.4, 0.1])), vec(RIVER));
  assert.equal(vec(weighted([V.bank, V.money], [0.5, 0.5])), vec(FINANCE));
  assert.equal(vec(weighted([V.bank, V.money, V.water], [0.5, 0.4, 0.1])), '[0.67, 0.38]');
  assert.equal(vec(scale(V.water, 0.1)), '[0.02, 0.09]');
  const replacement = weighted([V.bank, V.money, V.water], [0.5, 0.4, 0.1]);
  assert.equal(vec(plus(replacement, scale(RIVER, -1))), '[0.36, −0.36]');
  assert.equal(vec(maskedMean([V.bank, replacement, V.water], [1, 1, 1])), '[0.457, 0.593]');
  assert.deepEqual(layers[1].map((row, i) => vec(scale(row, weights[i]))), ['[0, 0.2]', '[0.3, 0]', '[0.25, 0.25]']);
  assert.equal(vec(weighted(layers[1], weights)), '[0.55, 0.45]');
  assert.deepEqual(
    layers.map((rows) => vec(scale(weighted(rows, weights), 2))),
    ['[1.4, 1.6]', '[1.1, 0.9]'],
  );
  const old = ['charge', 'the', 'phone'],
    edited = ['charge', 'the', 'invoice'];
  assert.deepEqual(readMask(true, 0, old), readMask(true, 0, edited));
  for (const [causal, position] of [
    [false, 0],
    [true, 2],
  ])
    assert.notDeepEqual(readMask(causal, position, old), readMask(causal, position, edited));
  assert.equal(vec(maskedMean([V.bank, V.river, V.water, [1, 1]], [1, 1, 1, 0])), '[0.267, 0.8]');
  const three = centerPopulation([
    [10, 1],
    [10, 0],
    [10, -1],
  ]);
  assert.equal(cos(three.centered[0], three.centered[1]), null);
  assert.equal(fmt(cos([10, 1], [10, -1]), 4), '0.9802');
  const matrix = (q, d) =>
    searchState(baseGuides, q, d).matrix.map((row) => row.map((v) => Number(v.toFixed(4)) || 0));
  assert.deepEqual(matrix(0, -Math.PI / 2), [
    [0, 2],
    [-2, 0],
  ]);
  assert.deepEqual(matrix(-Math.PI / 2, -Math.PI / 2), [
    [2, 0],
    [0, 2],
  ]);
  const orbit = [
    [1, 0],
    [0, -1],
  ];
  assert.equal(winner(searchState(orbit, 0, Math.PI / 2).matrix[0]), 1);
  assert.equal(winner(searchState(orbit, Math.PI / 2, Math.PI / 2).matrix[0]), 0);
}

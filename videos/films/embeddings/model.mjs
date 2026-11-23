import { safeSigmoid, softplus } from './arithmetic.mjs';
import { EMBEDDING_COUNTS, NEGATIVE_OUTPUTS } from './fixtures.mjs';
import assert from 'node:assert/strict';
import { dotProduct, normalizeVector, weightedVectorState } from 'vizmatic';
export function countRepresentation(table = EMBEDDING_COUNTS) {
  assert(table.length && table[0].length);
  const width = table[0].length;
  assert(table.every((r) => r.length === width && r.every((v) => Number.isFinite(v) && v >= 0)));
  const rows = table.map((r) => r.reduce((a, b) => a + b, 0)),
    cols = table[0].map((_, j) => table.reduce((n, r) => n + r[j], 0)),
    total = rows.reduce((a, b) => a + b, 0);
  const expected = table.map((r, i) => r.map((_, j) => (total ? (rows[i] * cols[j]) / total : 0)));
  const ppmi = table.map((r, i) =>
    r.map((v, j) => (v > 0 ? Math.max(0, Math.log(v / expected[i][j])) : 0)),
  );
  const directions = [0, 2]
    .map((offset) => {
      const a = ppmi[offset],
        b = ppmi[offset + 1],
        aa = dotProduct(a, a),
        bb = dotProduct(b, b),
        ab = dotProduct(a, b);
      const eigen = (aa + bb + Math.hypot(aa - bb, 2 * ab)) / 2;
      const vector = ab ? normalizeVector([ab, eigen - aa]) : [1, 0];
      return {
        offset,
        singular: Math.sqrt(eigen),
        vector,
      };
    })
    .sort((a, b) => b.singular - a.singular);
  const vectors = table.map(() => [0, 0]);
  directions.forEach((d, j) =>
    d.vector.forEach((value, i) => (vectors[d.offset + i][j] = value * Math.sqrt(d.singular))),
  );
  return {
    rows,
    cols,
    total,
    expected,
    ppmi,
    singular: directions.map((d) => d.singular),
    vectors,
  };
}
export function negativeSamplingState(progress = 1, center = [1, 0]) {
  const scores = NEGATIVE_OUTPUTS.map((v) => dotProduct(center, v));
  const coefficients = scores.map((s, i) => safeSigmoid(s) - (i === 0 ? 1 : 0));
  const terms = NEGATIVE_OUTPUTS.map((values, i) => ({
    id: 'sample-' + i,
    label: i ? 'noise ' + i : 'observed',
    weight: coefficients[i],
    values,
  }));
  const gradient = weightedVectorState({
    terms,
    progress: 1,
  }).sum;
  const updateTerms = terms.map((term) => ({
    ...term,
    weight: -0.1 * term.weight,
  }));
  const partial = weightedVectorState({
    terms: updateTerms,
    initial: center,
    progress,
  });
  const loss = (u) =>
    NEGATIVE_OUTPUTS.reduce((n, v, i) => n + softplus((i === 0 ? -1 : 1) * dotProduct(u, v)), 0);
  return {
    center,
    scores,
    coefficients,
    terms,
    gradient,
    updateTerms,
    partial,
    updated: partial.sum,
    lossBefore: loss(center),
    loss: loss(partial.sum),
    positiveScore: dotProduct(partial.sum, NEGATIVE_OUTPUTS[0]),
  };
}
export const extendedIds = new Set([
  'table-contract',
  'count-ppmi',
  'factorization',
  'predictive-window',
  'negative-step',
  'shifted-pmi',
  'glove-fit',
  'subword-components',
  'article-context',
  'elmo-layers',
  'visibility-test',
  'anisotropy-check',
  'space-contract',
  'fresh-representation',
]);

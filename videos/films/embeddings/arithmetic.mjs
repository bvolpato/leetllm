import assert from 'node:assert/strict';
import { dotProduct, normalizeVector } from 'vizmatic';
export const cosine = (a, b) => dotProduct(normalizeVector(a), normalizeVector(b));
export function maskedMean(values, mask) {
  const count = mask.reduce((sum, value) => sum + value, 0);
  assert(count > 0 && values.length === mask.length);
  return values[0].map((_, i) => values.reduce((sum, row, j) => sum + mask[j] * row[i], 0) / count);
}
export const safeSigmoid = (x) =>
  x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x));
export const softplus = (x) => Math.max(x, 0) + Math.log1p(Math.exp(-Math.abs(x)));
export function gloveResidual(count, score = Math.log(30)) {
  assert(Number.isFinite(count) && count > 0 && Number.isFinite(score));
  const target = Math.log(count),
    residual = score - target,
    weight = Math.min(1, (count / 100) ** 0.75);
  return {
    count,
    score,
    target,
    residual,
    squared: residual * residual,
    weight,
    weighted: residual * residual * weight,
  };
}
export function subwordComposition(ids, rows) {
  assert(ids.length && ids.every((i) => Number.isInteger(i) && rows[i]?.every(Number.isFinite)));
  const sum = ids.reduce(
    (a, id) => a.map((v, j) => v + rows[id][j]),
    Array(rows[ids[0]].length).fill(0),
  );
  return {
    ids: [...ids],
    sum,
    mean: sum.map((v) => v / ids.length),
  };
}
export function occurrenceVisibility(causal, position, tokens) {
  assert(Number.isInteger(position) && position >= 0 && position < tokens.length);
  return tokens.filter((_, i) => !causal || i <= position);
}
export function centerPopulation(points) {
  assert(
    points.length && points.every((p) => p.length === points[0].length && p.every(Number.isFinite)),
  );
  const mean = points[0].map((_, j) => points.reduce((n, p) => n + p[j], 0) / points.length);
  return {
    mean,
    centered: points.map((p) => p.map((x, j) => x - mean[j])),
  };
}
export function rotateEmbedding(v, angle) {
  return [
    Math.cos(angle) * v[0] - Math.sin(angle) * v[1],
    Math.sin(angle) * v[0] + Math.cos(angle) * v[1],
  ];
}

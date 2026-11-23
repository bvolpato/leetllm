export const meanEmbedding = (vectors) =>
  vectors[0].map((_, j) => vectors.reduce((sum, v) => sum + v[j], 0) / vectors.length);
export function supportScore([full, partial, none]) {
  return (full + 0.5 * partial) / (full + partial + none);
}
export function nearestRank(values, p = 0.95) {
  return [...values].sort((a, b) => a - b)[Math.ceil(p * values.length) - 1];
}

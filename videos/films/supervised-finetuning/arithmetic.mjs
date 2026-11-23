import assert from 'node:assert/strict';
export const targetLoss = (p) => -Math.log(p);
export const bounded = (x) => Math.max(0, Math.min(1, x));
export function packedAttention(values, query, independent = true) {
  const weights = values.map((_, key) =>
      Number(key <= query && (!independent || Math.floor(key / 3) === Math.floor(query / 3))),
    ),
    denominator = weights.reduce((a, b) => a + b, 0);
  return weights.reduce((sum, weight, key) => sum + weight * values[key], 0) / denominator;
}
export function sftExposure(batch, accumulation, workers, targetsPerWorker) {
  for (const n of [batch, accumulation, workers, targetsPerWorker])
    assert(Number.isInteger(n) && n > 0);
  return {
    items: batch * accumulation * workers,
    targets: workers * targetsPerWorker,
  };
}

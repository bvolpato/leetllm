import assert from 'node:assert/strict';
export const sigmoid = (z) => (z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z)));
export const softplus = (z) => Math.max(0, z) + Math.log1p(Math.exp(-Math.abs(z)));
export const logLoss = (z, y) => softplus(z) - y * z;
export const regularizedObjective = (a) => softplus(-a) + 0.1 * a * a;
export function stableDistribution(logits) {
  assert(logits.length > 1 && logits.every(Number.isFinite));
  const maximum = Math.max(...logits),
    shifted = logits.map((z) => z - maximum);
  assert(shifted.every(Number.isFinite), 'Logit differences must remain finite');
  const exponentials = shifted.map(Math.exp),
    normalizer = exponentials.reduce((a, b) => a + b, 0);
  return {
    logits,
    maximum,
    shifted,
    exponentials,
    normalizer,
    probabilities: exponentials.map((x) => x / normalizer),
    lossFor: (target) => Math.log(normalizer) - shifted[target],
  };
}

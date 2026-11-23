import { dictionary, target } from './fixtures.mjs';
import { dotProduct, normalizeVector } from 'vizmatic';
export const topK = (a, k) => {
  const order = a
    .map((v, i) => ({
      v: Math.max(0, v),
      i,
    }))
    .sort((a, b) => b.v - a.v || a.i - b.i)
    .slice(0, k);
  return a.map((v, i) => (order.some((d) => d.i === i) ? Math.max(0, v) : 0));
};
export const candidateDecode = (z) => [z[0] + 0.5 * z[1], 0];
export const candidateLoss = (z, lambda) => {
  const reconstructed = candidateDecode(z);
  const reconstructionMse = ((1 - reconstructed[0]) ** 2 + reconstructed[1] ** 2) / 2;
  return (
    reconstructionMse + (lambda * z.reduce((sum, value) => sum + Math.abs(value), 0)) / z.length
  );
};
export const sparseLoss = (l) => candidateLoss([0.75, 0], l);
export const denseLoss = (l) => candidateLoss([0.75, 0.5], l);
export function encoderFixture(input = target) {
  const weights = [
      [1, -4 / 3],
      [0, 5 / 3],
      [-1, 0],
      [0, -1],
      [-1, -1],
    ],
    pre = weights.map((row) => dotProduct(row, input)),
    estimated = pre.map((value) => Math.max(0, value)),
    reconstructed = [0, 1].map((column) =>
      estimated.reduce((sum, value, i) => sum + value * dictionary[i][column], 0),
    );
  return {
    input,
    weights,
    pre,
    estimated,
    reconstructed,
  };
}
export function coverageFixture() {
  const activation = [1, 1],
    general = Math.max(0, dotProduct([1, -1], activation)),
    combinedDirection = normalizeVector([1, 1]),
    combined = dotProduct(combinedDirection, activation),
    reconstructed = combinedDirection.map((value, i) => value * combined + general * [1, 0][i]);
  return {
    activation,
    general,
    combinedDirection,
    combined,
    reconstructed,
  };
}

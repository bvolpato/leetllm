export const epochMean = (means, counts) =>
  means.reduce((sum, value, i) => sum + value * counts[i], 0) / counts.reduce((a, b) => a + b, 0);
export function cloneMatrix(values) {
  return values.map((row) => [...row]);
}
export const accumulationBeatSpan = 16.536;
export const firstDerivativeCue = 8.975 / accumulationBeatSpan;
export const secondDerivativeCue = 13.8 / accumulationBeatSpan;
export const loopBound = (x) => Math.max(0, Math.min(1, x));
export function loopMomentum(previous, gradient, coefficient = 0.9, rate = 0.1, weight = 0.9) {
  if (gradient === null)
    return {
      weight,
      buffer: previous,
    };
  const buffer = coefficient * previous + gradient;
  return {
    weight: weight - rate * buffer,
    buffer,
  };
}
export function loopMicrobatch(equalChunks = false) {
  const means = [
      [0.5, 0.5],
      [1, 0.5],
    ],
    factors = equalChunks ? [0.5, 0.5] : [2 / 3, 1 / 3];
  return {
    means,
    factors,
    contributions: means.map((row, i) => row.map((v) => v * factors[i])),
    gradient: [0, 1].map((d) => means.reduce((s, row, i) => s + row[d] * factors[i], 0)),
  };
}
export function loopClip(gradient, bound) {
  const norm = Math.hypot(...gradient),
    factor = norm > bound ? bound / norm : 1;
  return {
    norm,
    gradient: gradient.map((v) => v * factor),
    storedNorm: norm * factor,
  };
}
export function loopAmpOrder() {
  const gradient = [3, 4],
    scale = 8,
    scaled = gradient.map((v) => v * scale),
    wrongScaled = loopClip(scaled, 2),
    wrong = wrongScaled.gradient.map((v) => v / scale),
    correct = loopClip(gradient, 2);
  return {
    gradient,
    scale,
    scaled,
    wrong,
    wrongNorm: Math.hypot(...wrong),
    correct: correct.gradient,
    correctNorm: correct.storedNorm,
  };
}

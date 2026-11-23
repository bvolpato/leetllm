import assert from 'node:assert/strict';
export const clamp01 = (value) => Math.max(0, Math.min(1, value));
export const ease = (value) => {
  const p = clamp01((value - 0.1) / 0.72);
  return p * p * (3 - 2 * p);
};
export function quantile(values, ratio) {
  if (
    !Array.isArray(values) ||
    values.length === 0 ||
    !Number.isFinite(ratio) ||
    ratio < 0 ||
    ratio > 1 ||
    values.some((value) => !Number.isFinite(value))
  ) {
    throw new RangeError('quantile needs finite scores and a ratio in [0, 1]');
  }
  const ordered = values.slice().sort((a, b) => a - b);
  const position = (ordered.length - 1) * ratio;
  const low = Math.floor(position);
  const high = Math.min(low + 1, ordered.length - 1);
  const fraction = position - low;
  return ordered[low] + (ordered[high] - ordered[low]) * fraction;
}
export function keepAbove(values, ratio) {
  const threshold = quantile(values, ratio);
  return {
    threshold,
    kept: values
      .map((score, index) => ({
        score,
        index,
      }))
      .filter((item) => item.score > threshold)
      .map((item) => item.index),
  };
}
export const multiply = (matrix, input) => {
  assert(
    matrix.length && matrix.every((row) => row.length === input.length),
    'matrix/input dimensions must match',
  );
  return matrix.map((row) => row.reduce((sum, value, i) => sum + value * input[i], 0));
};

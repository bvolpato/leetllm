export const coverage = (n) => -Math.expm1(n * Math.log1p(-0.25));
export const smoothstep = (value) => {
  const q = Math.max(0, Math.min(1, value));
  return q * q * (3 - 2 * q);
};
export const ttClamp = (n) => Math.max(0, Math.min(1, n));
export const ttMix = (a, b, p) => a + (b - a) * p;
export const ttSmooth = (p) => {
  const q = ttClamp(p);
  return q * q * (3 - 2 * q);
};
export function rawKVBytes({ layers, kvHeads, width, scalarBytes, positions }) {
  for (const n of [layers, kvHeads, width, scalarBytes, positions])
    if (!Number.isInteger(n) || n < 0)
      throw new RangeError('KV dimensions must be nonnegative integers');
  return 2 * layers * kvHeads * width * scalarBytes * positions;
}
export function promptCoverage(probabilities, n) {
  if (
    !probabilities.length ||
    !Number.isInteger(n) ||
    n < 1 ||
    probabilities.some((p) => !Number.isFinite(p) || p < 0 || p > 1)
  )
    throw new RangeError('Invalid prompt probabilities or attempt count');
  const rows = probabilities.map((p) => 1 - (1 - p) ** n);
  return {
    rows,
    mean: rows.reduce((a, b) => a + b, 0) / rows.length,
  };
}

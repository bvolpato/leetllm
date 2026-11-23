export const clip = (p) => Math.max(0, Math.min(1, p));
export const smooth = (p) => {
  const t = clip(p);
  return t * t * (3 - 2 * t);
};
export const motion = (p) => smooth((p - 0.08) / 0.76);
export const mix = (a, b, p) => a + (b - a) * p;
export const pct = (value) => `${(100 * value).toFixed(1)}%`;
export function subsetCoverage(n, c, k) {
  if (n - c < k) return 1;
  let failure = 1;
  for (let i = 0; i < k; i++) failure *= (n - c - i) / (n - i);
  return 1 - failure;
}
export function wilsonInterval(k, n, z = 1.96) {
  if (!Number.isInteger(k) || !Number.isInteger(n) || n <= 0 || k < 0 || k > n || !(z > 0))
    throw Error('valid binomial counts and positive z required');
  const f = k / n,
    denominator = 1 + (z * z) / n;
  const center = (f + (z * z) / (2 * n)) / denominator;
  const radius = (z / denominator) * Math.sqrt((f * (1 - f)) / n + (z * z) / (4 * n * n));
  return {
    low: Math.max(0, center - radius),
    high: Math.min(1, center + radius),
    center,
    radius,
  };
}
export function binomialChoose(n, k) {
  if (!Number.isInteger(n) || !Number.isInteger(k) || n < 0 || k < 0 || k > n) return 0;
  let value = 1;
  for (let j = 1; j <= Math.min(k, n - k); j++) value *= (n - j + 1) / j;
  return value;
}
export function exactPairedP(fixed, broken) {
  if (![fixed, broken].every((v) => Number.isInteger(v) && v >= 0))
    throw Error('nonnegative discordant counts required');
  const n = fixed + broken;
  return Math.min(
    1,
    (2 *
      Array.from(
        {
          length: Math.min(fixed, broken) + 1,
        },
        (_, i) => binomialChoose(n, i),
      ).reduce((a, b) => a + b, 0)) /
      2 ** n,
  );
}
export const preferenceProbability = (delta) => 1 / (1 + 10 ** (-delta / 400));
export function rankedPrecision(flags) {
  let hits = 0,
    sum = 0;
  flags.forEach((flag, i) => {
    if (flag) {
      hits++;
      sum += hits / (i + 1);
    }
  });
  return hits ? sum / hits : 0;
}
export function strictMetricRecord(row) {
  const rates = [row.policy, row.schema];
  return (
    rates.every((v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1) &&
    [row.ms, row.cost].every((v) => typeof v === 'number' && Number.isFinite(v) && v >= 0)
  );
}

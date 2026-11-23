export function choose(n, k) {
  if (!Number.isInteger(n) || !Number.isInteger(k) || n < 0 || k < 0)
    throw Error('Nonnegative integer combination required');
  if (k > n) return 0;
  let r = 1;
  for (let i = 1; i <= Math.min(k, n - k); i++) r = (r * (n - i + 1)) / i;
  return Math.round(r);
}
export function repeatEstimates(n, c, k) {
  if (
    !Number.isInteger(n) ||
    n < 1 ||
    !Number.isInteger(c) ||
    c < 0 ||
    c > n ||
    !Number.isInteger(k) ||
    k < 1 ||
    k > n
  )
    throw Error('Invalid fixed-protocol run counts');
  const d = choose(n, k);
  return {
    all: choose(c, k) / d,
    any: 1 - choose(n - c, k) / d,
  };
}
export function wilson(passes, n, z = 1.96) {
  if (
    !Number.isInteger(n) ||
    n < 1 ||
    !Number.isInteger(passes) ||
    passes < 0 ||
    passes > n ||
    !Number.isFinite(z) ||
    z <= 0
  )
    throw Error('Invalid interval inputs');
  const p = passes / n,
    d = 1 + (z * z) / n,
    center = (p + (z * z) / (2 * n)) / d,
    radius = (z / d) * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return {
    lower: center - radius,
    upper: center + radius,
    center,
    radius,
  };
}

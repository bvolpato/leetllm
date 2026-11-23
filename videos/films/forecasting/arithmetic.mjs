export const mae = (values) =>
  values.reduce((sum, value) => sum + Math.abs(value), 0) / values.length;
export const within = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export function pinball(actual, predicted, q) {
  if (
    ![actual, predicted, q].every((v) => typeof v === 'number' && Number.isFinite(v)) ||
    q <= 0 ||
    q >= 1
  )
    throw Error('Finite values and interior quantile required');
  return Math.max(q * (actual - predicted), (1 - q) * (predicted - actual));
}
export function expectedDiscreteLoss(predicted, q = 0.9) {
  return (9 * pinball(10, predicted, q) + pinball(100, predicted, q)) / 10;
}
export function conformalRank(n, coverage = 0.95) {
  if (!Number.isInteger(n) || n < 1 || !Number.isFinite(coverage) || coverage <= 0 || coverage >= 1)
    throw Error('Positive sample count and interior coverage required');
  const rank = Math.ceil((n + 1) * coverage);
  return {
    rank,
    finite: rank <= n,
  };
}
export function alphaUpdate(current, target, gamma, miss) {
  if (
    ![current, target, gamma].every((v) => typeof v === 'number' && Number.isFinite(v)) ||
    !Number.isInteger(miss) ||
    ![0, 1].includes(miss) ||
    gamma <= 0
  )
    throw Error('Finite levels, positive rate and binary miss required');
  return current + gamma * (target - miss);
}

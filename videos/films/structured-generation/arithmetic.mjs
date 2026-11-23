import assert from 'node:assert/strict';
export function normalizedWeights(weights, allowed) {
  assert(weights.every((v) => Number.isFinite(v) && v >= 0));
  const total = weights.reduce((sum, v, i) => sum + (allowed.includes(i) ? v : 0), 0);
  assert(total > 0, 'No finite legal probability mass');
  return weights.map((v, i) => (allowed.includes(i) ? v / total : 0));
}
export function maskStepTime(gpu, mask, sampling, overlap = true) {
  assert([gpu, mask, sampling].every((v) => Number.isFinite(v) && v >= 0));
  return (overlap ? Math.max(gpu, mask) : gpu + mask) + sampling;
}
export function retryBudget({
  status,
  elapsed,
  spent,
  call,
  validation,
  cost,
  deadline,
  limit,
  output,
  modelLimit,
}) {
  return {
    totalTime: elapsed + call + validation,
    totalCost: spent + cost,
    allowed:
      status === 'length' &&
      elapsed + call + validation <= deadline &&
      spent + cost <= limit &&
      output <= modelLimit,
  };
}

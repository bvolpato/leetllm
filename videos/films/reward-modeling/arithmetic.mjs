export function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}
export function softplus(x) {
  return Math.log1p(Math.exp(x));
}
export function stablePairLoss(delta) {
  return Math.max(-delta, 0) + Math.log1p(Math.exp(-Math.abs(delta)));
}
export function rewardHeadFit(differences, steps = 300) {
  if (
    !Array.isArray(differences) ||
    !differences.length ||
    differences.some((r) => r.length !== 2 || !r.every(Number.isFinite))
  )
    throw Error('finite two-feature differences required');
  let w = [0, 0];
  const trajectory = [[...w]];
  for (let n = 0; n < steps; n++) {
    const g = w.map((x) => 0.02 * x);
    for (const d of differences) {
      const margin = d[0] * w[0] + d[1] * w[1],
        s = Math.exp(-stablePairLoss(-margin));
      for (let j = 0; j < 2; j++) g[j] -= (d[j] * s) / differences.length;
    }
    w = w.map((x, j) => x - 0.1 * g[j]);
    trajectory.push([...w]);
  }
  return {
    weights: w,
    trajectory,
  };
}
export function finalUnmasked(mask) {
  if (!Array.isArray(mask) || !mask.every((x) => x === 0 || x === 1))
    throw Error('binary mask required');
  const i = mask.lastIndexOf(1);
  if (i < 0) throw Error('empty sequence');
  return i;
}
export function rewardEnsemble(values, lambda = 1) {
  if (values.length < 2 || !values.every(Number.isFinite))
    throw Error('at least two finite scores required');
  const mean = values.reduce((a, b) => a + b, 0) / values.length,
    sd = Math.sqrt(values.reduce((s, x) => s + (x - mean) ** 2, 0) / (values.length - 1));
  return {
    mean,
    sd,
    aggregate: mean - lambda * sd,
  };
}

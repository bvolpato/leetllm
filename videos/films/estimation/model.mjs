export function wilson(k, n, z = 1.96) {
  if (!Number.isInteger(k) || !Number.isInteger(n) || n <= 0 || k < 0 || k > n) {
    throw new RangeError('require integer counts with 0 <= k <= n and n > 0');
  }
  if (!Number.isFinite(z) || z <= 0) throw new RangeError('z must be positive');
  const p = k / n,
    z2 = z * z,
    den = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / den;
  const margin = (z / den) * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));
  return {
    center,
    low: Math.max(0, center - margin),
    high: Math.min(1, center + margin),
  };
}
export const scoreStatistic = (k, n, p) =>
  p === 0
    ? k === 0
      ? 0
      : Infinity
    : p === 1
      ? k === n
        ? 0
        : Infinity
      : Math.abs(k - n * p) / Math.sqrt(n * p * (1 - p));
export const message = (id) => ({
  id: 'M' + String(id).padStart(5, '0'),
  specialist: (id * 7919) % 100000 < 18000,
});
export const count = (rows) => rows.filter((row) => row.specialist).length;
export const bootstrapBin = (rate) => Math.min(35, Math.floor(rate * 100 + 1e-9));
export const quantile = (sorted, q) => {
  const at = (sorted.length - 1) * q,
    lo = Math.floor(at);
  return sorted[lo] + (sorted[Math.ceil(at)] - sorted[lo]) * (at - lo);
};
export function missingLabelBounds(selected, resolved, positive) {
  if (
    !Number.isInteger(selected) ||
    !Number.isInteger(resolved) ||
    !Number.isInteger(positive) ||
    selected < 1 ||
    resolved < 1 ||
    positive < 0 ||
    positive > resolved ||
    resolved > selected
  )
    throw new RangeError('valid selected/resolved/positive counts required');
  return {
    selected,
    resolved,
    positive,
    unknown: selected - resolved,
    resolvedRate: positive / resolved,
    low: positive / selected,
    high: (positive + selected - resolved) / selected,
  };
}
export function binomialMass(n, p = 0.2) {
  // Count failures when success is more likely. This also gives unit mass at n when p is one.
  if (p > 0.5) return binomialMass(n, 1 - p).reverse();
  const values = [(1 - p) ** n];
  for (let k = 0; k < n; k++) values.push((((values[k] * (n - k)) / (k + 1)) * p) / (1 - p));
  return values;
}
export const discreteQuantile = (values, q) => {
  let sum = 0;
  for (let k = 0; k < values.length; k++) {
    sum += values[k];
    if (sum >= q) return k / (values.length - 1);
  }
  return 1;
};
export function clusterBootstrapModel() {
  const campaignMass = binomialMass(10),
    rowMass = binomialMass(100);
  return {
    campaignVariance: (0.2 * 0.8) / 10,
    rowVariance: (0.2 * 0.8) / 100,
    campaignRange: {
      low: discreteQuantile(campaignMass, 0.025),
      high: discreteQuantile(campaignMass, 0.975),
    },
    rowRange: {
      low: discreteQuantile(rowMass, 0.025),
      high: discreteQuantile(rowMass, 0.975),
    },
    campaignMass,
    rowMass,
  };
}
export function biasVarianceState(n = 10000) {
  const bias = 0.12 - 0.176,
    variance = (0.12 * 0.88) / n;
  return {
    n,
    bias,
    squaredBias: bias * bias,
    variance,
    mse: bias * bias + variance,
    standardError: Math.sqrt(variance),
  };
}

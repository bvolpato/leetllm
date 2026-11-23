import assert from 'node:assert/strict';
export const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
export function normalCdf(z) {
  if (z === 0) return 0.5;
  const x = Math.abs(z) / Math.SQRT2,
    t = 1 / (1 + 0.3275911 * x);
  const erf =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return 0.5 * (1 + (z < 0 ? -erf : erf));
}
export function normalQuantile(u) {
  assert(u > 0 && u < 1, 'A normal quantile needs an open-interval uniform rank');
  if (u === 0.5) return 0;
  let lower = -10,
    upper = 10;
  for (let step = 0; step < 48; step++) {
    const middle = (lower + upper) / 2;
    if (normalCdf(middle) < u) lower = middle;
    else upper = middle;
  }
  return (lower + upper) / 2;
}
export function poissonMass(k, lambda) {
  assert(Number.isInteger(k) && k >= 0 && lambda >= 0);
  let p = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) p *= lambda / i;
  return p;
}
export function binomialMass(k, n, p) {
  assert(Number.isInteger(k) && k >= 0 && k <= n && p >= 0 && p <= 1);
  let choose = 1;
  for (let i = 1; i <= k; i++) choose *= (n - i + 1) / i;
  return choose * p ** k * (1 - p) ** (n - k);
}
export function rareEventBudget(q, detection = 0.95) {
  assert(q > 0 && q < 1 && detection > 0 && detection < 1);
  return Math.ceil(Math.log1p(-detection) / Math.log1p(-q));
}
export function mm1Means(lambda, mu) {
  assert(lambda >= 0 && mu > 0);
  return lambda >= mu
    ? {
        stable: false,
        utilization: lambda / mu,
      }
    : {
        stable: true,
        utilization: lambda / mu,
        total: 1 / (mu - lambda),
        queue: 1 / (mu - lambda) - 1 / mu,
      };
}
export function queuePlan(arrivals, services, workers = 1) {
  assert(Number.isInteger(workers) && workers > 0 && arrivals.length === services.length);
  const free = Array(workers).fill(0);
  return arrivals.map((arrival, i) => {
    assert(arrival >= 0 && services[i] >= 0 && (i === 0 || arrival >= arrivals[i - 1]));
    const lane = free.indexOf(Math.min(...free)),
      start = Math.max(arrival, free[lane]),
      finish = start + services[i];
    free[lane] = finish;
    return {
      id: i + 1,
      arrival,
      service: services[i],
      lane,
      start,
      finish,
      wait: start - arrival,
      total: finish - arrival,
    };
  });
}
export function metropolisAcceptance(current, proposal, reverseOverForward = 1) {
  assert(current > 0 && current < 1 && reverseOverForward > 0);
  if (!(proposal > 0 && proposal < 1)) return 0;
  const logTarget = (x) => 9 * Math.log(x) + 3 * Math.log1p(-x);
  return Math.min(1, Math.exp(logTarget(proposal) - logTarget(current)) * reverseOverForward);
}
export function ksGeometry(values, cdf) {
  assert(values.length);
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.map((x, i) => ({
    x,
    before: i / sorted.length,
    after: (i + 1) / sorted.length,
    cdf: cdf(x),
    gap: Math.max(Math.abs(i / sorted.length - cdf(x)), Math.abs((i + 1) / sorted.length - cdf(x))),
  }));
}
export function tokenProbabilities(temperature = 1) {
  assert(temperature > 0 && Number.isFinite(temperature));
  const logits = [2.2, 1.5, 0.2, -1.5],
    m = Math.max(...logits),
    weights = logits.map((x) => Math.exp((x - m) / temperature)),
    z = weights.reduce((a, b) => a + b, 0);
  return weights.map((x) => x / z);
}

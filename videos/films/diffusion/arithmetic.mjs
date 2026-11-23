import { CENTERS, CLEAN_VARIANCE, TAU } from './fixtures.mjs';
export function generator(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return (value + 0.5) / 4294967296;
  };
}
export function normal(rng) {
  return Math.sqrt(-2 * Math.log(rng())) * Math.cos(TAU * rng());
}
export function forwardValue(clean, epsilon, alphaBar) {
  return Math.sqrt(alphaBar) * clean + Math.sqrt(1 - alphaBar) * epsilon;
}
export function mixture(point, addedVariance, { includeComponents = false } = {}) {
  const variance = CLEAN_VARIANCE + addedVariance;
  const logWeights = CENTERS.map(
    ([x, y]) => -((point[0] - x) ** 2 + (point[1] - y) ** 2) / (2 * variance),
  );
  const largest = Math.max(...logWeights);
  const weights = logWeights.map((value) => Math.exp(value - largest));
  const total = weights.reduce((sum, value) => sum + value, 0);
  const score = [0, 0];
  const components = includeComponents ? [] : undefined;
  for (let i = 0; i < CENTERS.length; i++) {
    const xContribution = ((weights[i] / total) * (CENTERS[i][0] - point[0])) / variance;
    const yContribution = ((weights[i] / total) * (CENTERS[i][1] - point[1])) / variance;
    score[0] += xContribution;
    score[1] += yContribution;
    if (components)
      components.push({
        center: [...CENTERS[i]],
        posteriorWeight: weights[i] / total,
        localScore: [(CENTERS[i][0] - point[0]) / variance, (CENTERS[i][1] - point[1]) / variance],
        contribution: [xContribution, yContribution],
      });
  }
  const result = {
    density: (Math.exp(largest) * total) / (3 * TAU * variance),
    score,
  };
  if (components) result.components = components;
  return result;
}
export function probabilityFlowStep(point, addedVariance, deltaVariance) {
  const derivative = (position, variance) =>
    mixture(position, Math.max(0, variance)).score.map((value) => -0.5 * value);
  const a = derivative(point, addedVariance);
  const b = derivative(
    point.map((value, i) => value + (a[i] * deltaVariance) / 2),
    addedVariance + deltaVariance / 2,
  );
  const c = derivative(
    point.map((value, i) => value + (b[i] * deltaVariance) / 2),
    addedVariance + deltaVariance / 2,
  );
  const d = derivative(
    point.map((value, i) => value + c[i] * deltaVariance),
    addedVariance + deltaVariance,
  );
  return point.map((value, i) => value + (deltaVariance * (a[i] + 2 * b[i] + 2 * c[i] + d[i])) / 6);
}
export const unit = (x) => Math.max(0, Math.min(1, x));
export const add2 = (a, b) => a.map((v, i) => v + b[i]);

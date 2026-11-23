export const forward = (x) => {
  const sum = x[0] + x[1],
    h = [Math.max(0, sum), Math.max(0, sum - 1)];
  return {
    sum,
    h,
    y: h[0] - 2 * h[1],
  };
};
export function differenceLamp([a, b]) {
  const h = [Math.max(0, a - b), Math.max(0, b - a)];
  return { h, y: h[0] + h[1] };
}
export const clamp = (x) => Math.max(0, Math.min(1, x));
export const ease = (x) => {
  const p = clamp(x);
  return p * p * (3 - 2 * p);
};
export const sigmoid = (z) => (z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z)));
export const stableBce = (z, y) => Math.max(z, 0) - y * z + Math.log1p(Math.exp(-Math.abs(z)));
export const erf = (x) => {
  const sign = Math.sign(x),
    a = Math.abs(x),
    t = 1 / (1 + 0.3275911 * a);
  return (
    sign *
    (1 -
      ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
        t *
        Math.exp(-a * a))
  );
};
export function gradientStep(params, gradient, rate = 0.1) {
  return {
    w1: params.w1.map((row, i) => row.map((w, j) => w - rate * gradient.dw1[i][j])),
    b1: params.b1.map((b, i) => b - rate * gradient.db1[i]),
    w2: params.w2.map((w, i) => w - rate * gradient.dw2[i]),
    b2: params.b2 - rate * gradient.db2,
  };
}
export const standardize = (x, mean, scale) => x.map((v, i) => (v - mean[i]) / scale[i]);
export const triangle = (x) => Math.max(0, x) - 2 * Math.max(0, x - 1) + Math.max(0, x - 2);
export const targetCurve = (x) => 0.2 + 0.6 * Math.sin((Math.PI * x) / 4);
export function approximation(x, segments) {
  const h = 4 / segments;
  let value = 0.2;
  for (let i = 1; i < segments; i++)
    value += (targetCurve(i * h) - 0.2) * triangle((x - (i - 1) * h) / h);
  return value;
}
export const parameterVector = (p) => [...p.w1.flat(), ...p.b1, ...p.w2, p.b2];
export const gradientVector = (g) => [...g.dw1.flat(), ...g.db1, ...g.dw2, g.db2];
export const signedChain = (incoming, slope, feature) => ({
  preactivation: incoming * slope,
  weight: incoming * slope * feature,
});
export const denseParameterCount = (widths) =>
  widths.slice(1).reduce((s, n, i) => s + widths[i] * n + n, 0);
export const binaryMeanGradients = (logits, targets) =>
  logits.map((row, i) =>
    row.map((z, j) => (sigmoid(z) - targets[i][j]) / (logits.length * row.length)),
  );
export function finiteReluSecant(z, epsilon) {
  if (!(epsilon > 0)) throw Error('Positive epsilon required');
  return (Math.max(0, z + epsilon) - Math.max(0, z - epsilon)) / (2 * epsilon);
}
export const sigmoidBranch = (z) =>
  z < 0
    ? {
        numerator: Math.exp(z),
        denominator: 1 + Math.exp(z),
      }
    : {
        numerator: 1,
        denominator: 1 + Math.exp(-z),
      };

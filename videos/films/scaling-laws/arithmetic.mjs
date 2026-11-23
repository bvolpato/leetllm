export const loss = (n, d, a = 2, b = 2) => 1 + a / Math.sqrt(n) + b / Math.sqrt(d);
export const optimum = (budget, a = 2, b = 2) => (Math.sqrt(budget) * a) / b;
export const bounded = (x) => Math.max(0, Math.min(1, x));
export const surfaceLoss = (n, d) => 1.1 + 2.8 / n ** 0.07 + 7.8 / d ** 0.098;
export function allocationOptimum(product, A, B, alpha, beta) {
  const n = ((alpha * A) / (beta * B)) ** (1 / (alpha + beta)) * product ** (beta / (alpha + beta));
  return {
    n,
    d: product / n,
    ratio: product / n / n,
  };
}
export function anchorFit(alpha) {
  const k = 0.5 / (1 - 100 ** -alpha),
    e = 3 - k;
  return {
    alpha,
    k,
    e,
    predict: (c) => e + k * c ** -alpha,
  };
}

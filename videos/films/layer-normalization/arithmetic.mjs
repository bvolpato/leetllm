import { epsilon } from './fixtures.mjs';
import { dotProduct } from 'vizmatic';
export const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
export const variance = (a) => mean(a.map((v) => (v - mean(a)) ** 2));
export const ln = (a, e = epsilon) => a.map((v) => (v - mean(a)) / Math.sqrt(variance(a) + e));
export const rms = (a) => a.map((v) => v / Math.sqrt(mean(a.map((v) => v * v)) + epsilon));
export const norm = (a) => Math.sqrt(dotProduct(a, a));
export const F = (a) => a.map((v) => 0.2 * v + 0.1);
export const pre = (a) => a.map((v, i) => v + F(ln(a))[i]);
export const post = (a) => ln(a.map((v, i) => v + F(a)[i]));
export const overTime = (a, b) => ln([...a, ...b]).slice(0, a.length);
export const smoothProgress = (progress) => {
  const t = Math.max(0, Math.min(1, progress));
  return t * t * (3 - 2 * t);
};
export const jac = (a) =>
  a.map((_, i) =>
    a.map(
      (__, j) =>
        ((i === j ? 1 : 0) - 0.25 - (ln(a)[i] * ln(a)[j]) / 4) / Math.sqrt(variance(a) + epsilon),
    ),
  );

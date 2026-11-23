export const clamp = (value) => Math.max(0, Math.min(1, value));
export const mix = (a, z, p) => a + (z - a) * p;
export const smooth = (p) => p * p * (3 - 2 * p);
export const completed = (p, n) => Math.min(n, Math.floor(p * n + 1e-9));
export function cosine(a, b) {
  return a.reduce((sum, value, i) => sum + value * b[i], 0) / Math.hypot(...a) / Math.hypot(...b);
}

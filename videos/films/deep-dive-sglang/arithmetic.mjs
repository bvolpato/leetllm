export const phase = (p) => Math.max(0, Math.min(1, (p - 0.1) / 0.72));
export const sum = (xs) => xs.reduce((a, z) => a + z, 0);
export function common(x, y) {
  let n = 0;
  while (n < x.length && n < y.length && x[n] === y[n]) n++;
  return n;
}
export const clamp = (value) => Math.max(0, Math.min(1, value));

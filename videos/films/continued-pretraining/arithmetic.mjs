export const bounded = (x) => Math.max(0, Math.min(1, x));
export const words = (text) => new Set(text.toLowerCase().match(/[a-z]+/g));
export const ease = (x) => {
  const p = bounded(x);
  return p * p * (3 - 2 * p);
};
export const interpolate = (a, b, p) => a + (b - a) * ease(p);

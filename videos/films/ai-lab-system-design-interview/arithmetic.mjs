export const clamp = (value) => Math.max(0, Math.min(1, value));
export const smooth = (value) => {
  const p = clamp(value);
  return p * p * (3 - 2 * p);
};
export const segment = (p, a, z) => clamp((p - a) / (z - a));
export const lerp = (a, z, p) => a + (z - a) * p;

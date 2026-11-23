export const clamp = (x) => Math.max(0, Math.min(1, x));
export const motion = (p) => {
  const q = clamp((p - 0.12) / 0.7);
  return q * q * (3 - 2 * q);
};

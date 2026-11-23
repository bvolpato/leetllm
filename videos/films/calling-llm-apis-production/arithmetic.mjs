export const phase = (p, a, z) => {
  const q = Math.max(0, Math.min(1, (p - a) / (z - a)));
  return q * q * (3 - 2 * q);
};

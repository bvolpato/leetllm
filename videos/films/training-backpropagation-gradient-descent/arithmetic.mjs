export const clamp = (value) => Math.max(0, Math.min(1, value));
export const ease = (value) => {
  const p = clamp(value);
  return p * p * (3 - 2 * p);
};
export const lossAt = (weight, bias = 0, x = 2, target = 6) =>
  0.5 * (weight * x + bias - target) ** 2;

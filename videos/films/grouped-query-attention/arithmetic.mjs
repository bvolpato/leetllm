export const dot = (left, right) =>
  left.reduce((sum, value, index) => sum + value * right[index], 0);
export const softmax = (values) => {
  const peak = Math.max(...values),
    exps = values.map((value) => Math.exp(value - peak)),
    total = exps.reduce((sum, value) => sum + value, 0);
  return exps.map((value) => value / total);
};
export const clamp = (x) => Math.max(0, Math.min(1, x));

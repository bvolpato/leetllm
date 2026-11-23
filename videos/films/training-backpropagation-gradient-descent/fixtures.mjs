export const example = Object.freeze({
  x: 2,
  target: 6,
  weight: 1,
  bias: 0,
});
export const symmetric = Array.from(
  {
    length: 16,
  },
  (_, i) => (i < 8 ? -1 : 1) * ((i % 8) + 1),
);

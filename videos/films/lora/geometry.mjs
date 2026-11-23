export const num = (value) =>
  Math.abs(value) < 0.0001 ? '0' : Number(value.toFixed(2)).toString().replace('-', '−');
export const sum = (a, b) => a.map((value, i) => value + b[i]);
export const scale = (a, s) => a.map((value) => value * s);
export const point = (x, y) => ({
  x,
  y,
});
export const project = (v) =>
  point(650 + 116 * (v[0] - 0.62 * v[1]), 640 + 116 * (0.27 * v[0] + 0.35 * v[1] - v[2]));

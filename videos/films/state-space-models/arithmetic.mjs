export const run = (v, a = 0.9, w = 0.2, h = 0) => {
  const out = [];
  for (const x of v) {
    h = a * h + w * x;
    out.push(h);
  }
  return out;
};
export function selectiveCoefficients(x) {
  const delta = Math.log1p(Math.exp(-1 + 0.3 * x));
  return {
    x,
    delta,
    a: Math.exp(-delta),
    write: delta * 0.1 * x * x,
    c: 1 + 0.05 * x,
  };
}
export const compose = (right, left) => [right[0] * left[0], right[0] * left[1] + right[1]];

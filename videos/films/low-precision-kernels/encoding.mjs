import assert from 'node:assert/strict';
export const phase = (p) => Math.max(0, Math.min(1, (p - 0.12) / 0.7));
export const sum = (values) => values.reduce((a, b) => a + b, 0);
export function decode8(code, format = 'ocp') {
  assert(Number.isInteger(code) && code >= 0 && code <= 255);
  assert(format === 'ocp' || format === 'fnuz');
  if (format === 'fnuz' && code === 128) return NaN;
  const magnitude = code & 127,
    exponent = magnitude >> 3,
    fraction = magnitude & 7;
  if (format === 'ocp' && magnitude === 127) return NaN;
  const bias = format === 'ocp' ? 7 : 8;
  const value =
    exponent === 0 ? fraction * 2 ** (1 - bias - 3) : (1 + fraction / 8) * 2 ** (exponent - bias);
  return code & 128 ? -value : value;
}
export const grids = Object.fromEntries(
  ['ocp', 'fnuz'].map((format) => [
    format,
    Array.from(
      {
        length: format === 'ocp' ? 127 : 128,
      },
      (_, code) => ({
        code,
        value: decode8(code, format),
      }),
    ),
  ]),
);
export function encode8(value, format = 'ocp') {
  assert(Number.isFinite(value), 'The conversion fixture accepts finite inputs');
  assert(format === 'ocp' || format === 'fnuz');
  const grid = grids[format],
    magnitude = Math.abs(value),
    maximum = grid.at(-1).value;
  const clamped = Math.min(magnitude, maximum);
  let low = 0,
    high = grid.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (grid[middle].value < clamped) low = middle + 1;
    else high = middle;
  }
  let chosen = low;
  if (low > 0) {
    const below = clamped - grid[low - 1].value,
      above = grid[low].value - clamped;
    if (below < above || (below === above && grid[low - 1].code % 2 === 0)) chosen = low - 1;
  }
  const negative = value < 0 || Object.is(value, -0);
  const code = grid[chosen].code | (negative && (format === 'ocp' || chosen !== 0) ? 128 : 0);
  return {
    code,
    value: decode8(code, format),
    clamped: magnitude > maximum,
  };
}
export function roundTrip(value, scale) {
  assert(Number.isFinite(scale) && scale > 0);
  const scaled = value / scale,
    encoded = encode8(scaled);
  const reconstructed = encoded.value * scale;
  return {
    original: value,
    scale,
    scaled,
    ...encoded,
    reconstructed,
    error: reconstructed - value,
  };
}
export const blockScale = (values) => {
  const maximum = Math.max(...values.map(Math.abs));
  return maximum === 0 ? 1 : 2 ** Math.ceil(Math.log2(maximum / 448));
};
export const prefixes = (terms) => [0, ...terms.map((_, i) => sum(terms.slice(0, i + 1)))];
export function even(value) {
  const lower = Math.floor(value),
    fraction = value - lower;
  return fraction < 0.5 || (fraction === 0.5 && lower % 2 === 0) ? lower : lower + 1;
}
export function roundHalf(value) {
  if (value === 0) return value;
  const magnitude = Math.abs(value),
    step = magnitude < 2 ** -14 ? 2 ** -24 : 2 ** (Math.floor(Math.log2(magnitude)) - 10);
  const result = even(magnitude / step) * step;
  return Math.sign(value) * (result > 65504 ? Infinity : result);
}
export function additions(round) {
  const trace = [1024];
  for (let i = 0; i < 4; i++) trace.push(round(trace.at(-1) + 0.25));
  return trace;
}
export const halfAdds = additions(roundHalf);
export const floatAdds = additions(Math.fround);
export const clip01 = (x) => Math.min(1, Math.max(0, x));
export const hexByte = (x) => '0x' + x.toString(16).padStart(2, '0');
export function roundedOverflow(input, { saturate = true, format = 'e4m3' } = {}) {
  assert(Number.isFinite(input));
  assert(['e4m3', 'e5m2'].includes(format));
  const a = Math.abs(input),
    fraction = format === 'e4m3' ? 3 : 2,
    max = format === 'e4m3' ? 448 : 57344,
    floor = format === 'e4m3' ? 2 ** -9 : 2 ** -16,
    step = a === 0 ? 0 : Math.max(floor, 2 ** (Math.floor(Math.log2(a)) - fraction)),
    rounded = a === 0 ? 0 : even(a / step) * step,
    overflow = rounded > max;
  return {
    input,
    rounded: Math.sign(input) * rounded,
    overflow,
    result: overflow
      ? saturate
        ? Math.sign(input) * max
        : format === 'e4m3'
          ? NaN
          : Math.sign(input) * Infinity
      : Math.sign(input) * rounded,
  };
}
export function stochasticNeighbor(x, lower = 1, upper = 1.125) {
  assert(Number.isFinite(x) && lower < upper && x >= lower && x <= upper);
  const p = (x - lower) / (upper - lower);
  return {
    lower,
    upper,
    p,
    expected: (1 - p) * lower + p * upper,
  };
}

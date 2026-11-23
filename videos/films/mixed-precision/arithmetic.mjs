export function roundBinary(value, fractionBits, minExponent, maxExponent) {
  if (!Number.isFinite(value)) return value;
  if (value === 0) return 0;
  const sign = Math.sign(value),
    v = Math.abs(value),
    exponent = Math.floor(Math.log2(v));
  const gap = 2 ** (Math.max(exponent, minExponent) - fractionBits),
    scaled = v / gap,
    lower = Math.floor(scaled),
    fraction = scaled - lower;
  const integer =
    fraction < 0.5 ? lower : fraction > 0.5 ? lower + 1 : lower % 2 ? lower + 1 : lower;
  const rounded = integer * gap,
    max = (2 - 2 ** -fractionBits) * 2 ** maxExponent;
  return sign * (rounded > max ? Infinity : rounded);
}
export const fp16 = (v) => roundBinary(v, 10, -14, 15);
export const bf16 = (v) => roundBinary(v, 7, -126, 127);

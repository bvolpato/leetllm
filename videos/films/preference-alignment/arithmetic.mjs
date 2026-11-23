export const sigmoid = (value) => 1 / (1 + Math.exp(-value));
export const bounded = (x) => Math.max(0, Math.min(1, x));
export const wordCount = (text) => (text.match(/[\p{L}\p{N}]+/gu) || []).length;
export const prefBound = (value) => Math.max(0, Math.min(1, value));
export const prefLerp = (a, b, p) => a + (b - a) * prefBound(p);
export const prefLoss = (z) => Math.max(0, -z) + Math.log1p(Math.exp(-Math.abs(z)));

export const phase = (p) => Math.max(0, Math.min(1, (p - 0.1) / 0.72));
export const features = (text) => [
  text.length,
  [...text].reduce((a, v) => a + v.charCodeAt(0), 0) % 101,
];
export const bounded = (value) => Math.max(0, Math.min(1, value));
export const rayClamp = (x) => Math.max(0, Math.min(1, x));
export const rayMix = (a, z, p) => a + (z - a) * rayClamp(p);
export const rayFeature = (text) => [
  text.length,
  [...text].reduce((n, c) => n + c.charCodeAt(0), 0) % 101,
];

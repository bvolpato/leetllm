import { createHash } from 'node:crypto';
export const clamp = (x) => Math.max(0, Math.min(1, x));
export const smooth = (x) => {
  const p = clamp(x);
  return p * p * (3 - 2 * p);
};
export const mix = (a, b, p) => a + (b - a) * p;
export const normalized = (value) => value.trim().toLowerCase();
export const key = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 8);

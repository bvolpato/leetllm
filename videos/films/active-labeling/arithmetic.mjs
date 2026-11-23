import { createHash } from 'node:crypto';
export const hash = (value) =>
  createHash('sha256')
    .update(typeof value === 'string' ? value : JSON.stringify(value))
    .digest('hex');
export const euclidean = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const normalized = (text) => text.toLowerCase().replace(/\s+/g, ' ').trim();

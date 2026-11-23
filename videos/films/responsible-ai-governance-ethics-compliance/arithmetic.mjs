import { createHash } from 'node:crypto';
export const phase = (p) => Math.max(0, Math.min(1, (p - 0.1) / 0.72));
export const sum = (xs) => xs.reduce((a, v) => a + v, 0);
export const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

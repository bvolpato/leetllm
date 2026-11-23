import { createHash } from 'node:crypto';
export const clamp = (n) => Math.max(0, Math.min(1, n));
export const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

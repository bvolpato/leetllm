import { createHash } from 'node:crypto';
export const deploymentDigest = ({ action, target, revision }) =>
  createHash('sha256')
    .update(JSON.stringify([action, target, revision]))
    .digest('hex');
export const clamp = (value) => Math.max(0, Math.min(1, value));
export const lerp = (a, b, p) => a + (b - a) * p;
export const phaseAt = (p, a = 0.12, z = 0.82) => clamp((p - a) / (z - a));

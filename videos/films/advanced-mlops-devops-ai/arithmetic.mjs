import { createHash } from 'node:crypto';
export const clamp = (p) => Math.max(0, Math.min(1, p));
export const motion = (p) => {
  const q = clamp((p - 0.08) / 0.68);
  return q * q * (3 - 2 * q);
};
export const mix = (a, b, p) => a + (b - a) * p;
export const timedProgress = (progress, duration, start, end) => {
  const p = clamp((progress * duration - start) / (end - start));
  return p * p * (3 - 2 * p);
};
export const digest = (v) =>
  createHash('sha256')
    .update(JSON.stringify(Object.fromEntries(Object.entries(v).sort())))
    .digest('hex');
export function pythonReleaseDigest(record) {
  const serialized =
    '{' +
    Object.keys(record)
      .sort()
      .map((k) => JSON.stringify(k) + ': ' + JSON.stringify(record[k]))
      .join(', ') +
    '}';
  return {
    serialized,
    digest: createHash('sha256').update(serialized).digest('hex'),
  };
}

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export const clamp = (n) => Math.max(0, Math.min(1, n));
export const motion = (p) => {
  const q = clamp((p - 0.08) / 0.55);
  return q * q * (3 - 2 * q);
};
export const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const canonical = (value) => JSON.stringify(value, Object.keys(value).sort());
export const bucket = (id) => parseInt(sha(id).slice(0, 8), 16) % 100;
export function routeF1(tp, fp, fn) {
  assert([tp, fp, fn].every((n) => Number.isSafeInteger(n) && n >= 0));
  const denominator = 2 * tp + fp + fn;
  assert(denominator > 0);
  return {
    numerator: 2 * tp,
    denominator,
    f1: (2 * tp) / denominator,
    criticalPass: fp === 0,
  };
}
export function zeroFailureUpper(n, alpha = 0.05) {
  assert(Number.isSafeInteger(n) && n > 0);
  assert(typeof alpha === 'number' && alpha > 0 && alpha < 1);
  return -Math.expm1(Math.log(alpha) / n);
}
export function requestExposure(counts, candidateIndex) {
  assert(counts.length > 0 && counts.every((n) => Number.isSafeInteger(n) && n >= 0));
  assert(
    Number.isSafeInteger(candidateIndex) && candidateIndex >= 0 && candidateIndex < counts.length,
  );
  const total = counts.reduce((a, b) => a + b, 0);
  assert(total > 0);
  return {
    conversationShare: 1 / counts.length,
    requestShare: counts[candidateIndex] / total,
    total,
  };
}

import assert from 'node:assert/strict';
export const clamp = (value) => Math.max(0, Math.min(1, value));
export const phase = (p, a, b) => clamp((p - a) / (b - a));
export function maskedProbabilities(logits, allowed) {
  assert.equal(logits.length, allowed.length);
  const legal = logits.filter((_, i) => allowed[i]);
  const peak = Math.max(...legal);
  assert(Number.isFinite(peak), 'At least one finite legal logit is required');
  const mass = logits.map((z, i) => (allowed[i] ? Math.exp(z - peak) : 0)),
    total = mass.reduce((a, b) => a + b, 0);
  return mass.map((x) => x / total);
}

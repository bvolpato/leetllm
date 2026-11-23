export const clamp = (p) => Math.max(0, Math.min(1, p));
export const mix = (a, b, p) => a + (b - a) * p;
export const smooth = (p) => {
  const q = clamp(p);
  return q * q * (3 - 2 * q);
};
export const phase = (p, a, z) => clamp((p - a) / (z - a));
export const sum = (rows) => rows.reduce((n, r) => n + r.count, 0);
export const posterior = (prior, tpr = 0.95, fpr = 0.05) => {
  const trueMass = prior * tpr,
    falseMass = (1 - prior) * fpr;
  return trueMass + falseMass > 0 ? trueMass / (trueMass + falseMass) : null;
};
export function checkedPosterior(prior, tpr, fpr) {
  for (const v of [prior, tpr, fpr])
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1)
      throw new RangeError('probabilities must be finite numbers in [0,1]');
  const a = Math.log(prior) + Math.log(tpr),
    c = Math.log1p(-prior) + Math.log(fpr),
    offset = Math.max(a, c);
  if (offset === -Infinity) throw new RangeError('conditioning event has zero mathematical mass');
  const x = Math.exp(a - offset),
    y = Math.exp(c - offset);
  return x / (x + y);
}
export const probSoftmax = (logits) => {
  const m = Math.max(...logits),
    w = logits.map((x) => Math.exp(x - m)),
    total = w.reduce((a, b) => a + b);
  return w.map((x) => x / total);
};
export const rng = (seed) => () => {
  seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
  return seed / 2 ** 32;
};

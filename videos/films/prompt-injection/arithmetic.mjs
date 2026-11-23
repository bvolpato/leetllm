export const phase = (p, a, z) => Math.max(0, Math.min(1, (p - a) / (z - a)));
export const cueProgress = (cues, id, fallback) => {
  const cue = cues?.[id];
  return !cue ? fallback : cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : cue.progress;
};
export const cueBegun = (cues, id, fallback) =>
  cues?.[id] ? cues[id].phase !== 'before' : fallback;
export function wilsonBounds(k, n, z = 1.96) {
  if (
    !Number.isInteger(k) ||
    !Number.isInteger(n) ||
    n < 1 ||
    k < 0 ||
    k > n ||
    !Number.isFinite(z) ||
    z <= 0
  )
    throw new RangeError('valid positive trial count and finite z required');
  const p = k / n,
    d = 1 + (z * z) / n,
    c = p + (z * z) / (2 * n),
    m = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  return [(c - m) / d, (c + m) / d];
}

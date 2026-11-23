export const clamp = (x) => Math.max(0, Math.min(1, x));
export const phase = (p, a = 0.08, z = 0.86) => clamp((p - a) / (z - a));
export const cueProgress = (cues, id, fallback) => {
  const c = cues?.[id];
  return c ? (c.phase === 'before' ? 0 : c.phase === 'after' ? 1 : clamp(c.progress)) : fallback;
};
export const cueStarted = (cues, id, fallback) => {
  const c = cues?.[id];
  return c ? c.phase !== 'before' : fallback;
};
export const cueDone = (cues, id, fallback) => {
  const c = cues?.[id];
  return c ? c.phase === 'after' : fallback;
};

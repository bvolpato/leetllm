export const clamp = (p) => Math.max(0, Math.min(1, p));
export const lerp = (a, b, p) => a + (b - a) * p;
export const smooth = (p) => {
  const q = clamp(p);
  return q * q * (3 - 2 * q);
};
export const part = (p, a, b) => clamp((p - a) / (b - a));
export function cueProgress(state, id, beat, start = 0.15, end = 0.8) {
  const b = state.beat ?? 0;
  if (b < beat) return 0;
  if (b > beat) return 1;
  const cue = state.cues?.[id];
  if (cue) return cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : clamp(cue.progress);
  return smooth(part(state.beatP ?? 0, start, end));
}
export const q = cueProgress;

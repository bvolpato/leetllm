export const clamp = (p) => Math.max(0, Math.min(1, p));
export const ease = (p) => {
  const q = clamp(p);
  return q * q * (3 - 2 * q);
};
export const mix = (a, b, p) => a + (b - a) * p;
export function cueProgress(state, id, beat = 0) {
  const c = state.cues?.[id];
  return c
    ? c.phase === 'before'
      ? 0
      : c.phase === 'after'
        ? 1
        : clamp(c.progress)
    : state.beat < beat
      ? 0
      : state.beat > beat
        ? 1
        : clamp(((state.beatP ?? 0) - 0.12) / 0.76);
}
export const done = (state, id, beat = 0) =>
  state.cues?.[id] ? state.cues[id].phase === 'after' : cueProgress(state, id, beat) === 1;

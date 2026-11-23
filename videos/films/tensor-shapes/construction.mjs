export const bounded = (x) => Math.max(0, Math.min(1, x));
export const clamp = (p) => Math.max(0, Math.min(1, p));
export const complete = (p) => p >= 1 - 1e-9;
export const event = (state, beat, id) => {
  if ((state.beat ?? 0) < beat) return 0;
  if ((state.beat ?? 0) > beat) return 1;
  const cue = state.cues?.[id];
  return cue
    ? cue.phase === 'before'
      ? 0
      : cue.phase === 'after'
        ? 1
        : clamp(cue.progress)
    : clamp(((state.beatP ?? 0) - 0.12) / 0.72);
};
export const count = (size, p) => Math.min(size, Math.floor(size * p + 1e-9));

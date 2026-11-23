export const phase = (p, a, z) => {
  const q = Math.max(0, Math.min(1, (p - a) / (z - a)));
  return q * q * (3 - 2 * q);
};
export const clamp = (p) => Math.max(0, Math.min(1, p));
export const done = (p) => p >= 1 - 1e-9;
export const event = (state, beat, id, start = 0.12, end = 0.85) => {
  if ((state.beat ?? 0) < beat) return 0;
  if ((state.beat ?? 0) > beat) return 1;
  const cue = state.cues?.[id];
  return cue
    ? cue.phase === 'before'
      ? 0
      : cue.phase === 'after'
        ? 1
        : clamp(cue.progress)
    : clamp(((state.beatP ?? 0) - start) / (end - start));
};

export function clauseEnded(state, beat, id, fallbackEnd = 0.85) {
  const current = state.beat ?? 0;
  if (current !== beat) return current > beat;
  const cue = state.cues?.[id];
  return cue ? cue.phase === 'after' : (state.beatP ?? 0) >= fallbackEnd;
}

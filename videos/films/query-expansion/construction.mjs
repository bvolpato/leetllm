export const bound = (value) => Math.max(0, Math.min(1, value));
export function spoken(state, beat, id) {
  if ((state.beat ?? 0) < beat) return 0;
  if ((state.beat ?? 0) > beat) return 1;
  const c = state.cues?.[id];
  return c
    ? c.phase === 'before'
      ? 0
      : c.phase === 'after'
        ? 1
        : bound(c.progress)
    : bound(((state.beatP ?? 0) - 0.1) / 0.75);
}

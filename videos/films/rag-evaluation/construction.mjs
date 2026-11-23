export const clamp = (value) => Math.max(0, Math.min(1, value));
export const spoken = (state, id, beat = 0) => {
  const b = state.beat ?? 0,
    v = state.cues?.[id];
  return v
    ? v.phase === 'before'
      ? 0
      : v.phase === 'after'
        ? 1
        : clamp(v.progress)
    : b < beat
      ? 0
      : b > beat
        ? 1
        : clamp(((state.beatP ?? 0) - 0.12) / 0.75);
};
export const completed = (state, id, beat = 0) =>
  state.cues?.[id] ? state.cues[id].phase === 'after' : spoken(state, id, beat) === 1;

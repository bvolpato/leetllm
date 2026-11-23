export const clamp = (value) => Math.max(0, Math.min(1, value));
export const progress = (p) => clamp((p - 0.12) / 0.6);
export const icCompleted = (state, id) =>
  state.cues ? state.cues[id]?.phase === 'after' : (state.beatP ?? 0) >= 0.72;
export const icProgress = (state, id) => {
  const cue = state.cues?.[id];
  return state.cues
    ? cue?.phase === 'after'
      ? 1
      : cue?.phase === 'before' || !cue
        ? 0
        : cue.progress
    : Math.max(0, Math.min(1, state.beatP ?? 0));
};

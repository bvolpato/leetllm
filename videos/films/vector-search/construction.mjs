export const cueProgress = (state, id) => {
  const c = state.cues?.[id];
  return c
    ? c.phase === 'before'
      ? 0
      : c.phase === 'after'
        ? 1
        : Math.max(0, Math.min(1, c.progress))
    : 0;
};

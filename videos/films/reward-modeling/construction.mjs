export function cueProgress(state, id, fallback = 0) {
  const cue = state.cues?.[id];
  if (!cue) return state.cues ? 0 : fallback;
  return cue.phase === 'before'
    ? 0
    : cue.phase === 'after'
      ? 1
      : Math.max(0, Math.min(1, cue.progress));
}
export function motion(state, start = 0.08, end = 0.68) {
  const raw = Math.max(0, Math.min(1, ((state.beatP ?? state.p) - start) / (end - start)));
  return raw * raw * (3 - 2 * raw);
}

export const clamp = (value) => Math.max(0, Math.min(1, value));
export const phase = (p, a, b) => clamp((p - a) / (b - a));

// Storyboards use beat fractions until the course narrator supplies word times.
export function phraseProgress(state, id, start, end) {
  return state.cues?.[id]?.progress ?? phase(state.beatP ?? 0, start, end);
}
export function phraseEnded(state, id, end) {
  const cue = state.cues?.[id];
  return cue ? cue.phase === 'after' : (state.beatP ?? 0) >= end;
}

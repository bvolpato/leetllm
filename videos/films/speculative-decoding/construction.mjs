export const completedCue = (state, id, fallback = 0.7) => {
  const cue = state.cues?.[id];
  return state.cues ? cue?.phase === 'after' : (state.beatP ?? 0) >= fallback;
};

// The storyboard uses beat fractions, and production uses the measured words.
export function movement(state, beat, id, start = 0.15, end = 0.75) {
  const cue = state.cues?.[id];
  if (cue) return cue.phase === 'after' ? 1 : cue.phase === 'before' ? 0 : cue.progress;
  const current = state.beat ?? 0;
  if (current !== beat) return current > beat ? 1 : 0;
  return Math.max(0, Math.min(1, ((state.beatP ?? 0) - start) / (end - start)));
}

export function heard(state, beat, id, fallback = 0.7) {
  const current = state.beat ?? 0;
  return current > beat || (current === beat && completedCue(state, id, fallback));
}

export const cueProgress = (cues, id, fallback) => {
  const cue = cues?.[id];
  return !cue ? fallback : cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : cue.progress;
};
export const cueBegun = (cues, id, fallback) =>
  cues?.[id] ? cues[id].phase !== 'before' : fallback;

// The fallback runs only on silent storyboards. Measured speech owns the delivery clock.
export function motion(state, id, beat, start = 0.12, end = 0.65) {
  const fraction = Math.max(0, Math.min(1, ((state.beatP ?? 0) - start) / (end - start)));
  const fallback = state.beat === beat ? fraction : Number(state.beat > beat);
  return cueProgress(state.cues, id, fallback);
}

export function spoken(state, id, beat, end = 0.55) {
  const cue = state.cues?.[id];
  return cue
    ? cue.phase === 'after'
    : state.beat > beat || (state.beat === beat && state.beatP >= end);
}

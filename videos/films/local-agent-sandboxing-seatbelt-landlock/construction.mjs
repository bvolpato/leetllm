export const clamp = (x) => Math.max(0, Math.min(1, x));
export const motion = (p) => {
  const q = clamp((p - 0.12) / 0.7);
  return q * q * (3 - 2 * q);
};

// The provider clock controls production. Untimed storyboard samples use the beat clock.
export function cueProgress(state, id, beat, start, end) {
  const cue = state.cues?.[id];
  if (cue) return cue.progress;
  if (state.beat !== beat) return Number(state.beat > beat);
  return clamp((state.beatP - start) / (end - start));
}

export function cueComplete(state, id, beat, end) {
  const cue = state.cues?.[id];
  if (cue) return cue.phase === 'after';
  return state.beat > beat || (state.beat === beat && state.beatP >= end);
}

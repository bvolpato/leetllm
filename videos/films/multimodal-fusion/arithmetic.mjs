export const clamp = (value) => Math.max(0, Math.min(1, value));

// Use measured words in the film and a beat-relative clock for isolated storyboards.
export function cue(state, id, beat, from = 0, to = 1) {
  const current = state.beat ?? 0;
  if (current !== beat) return Number(current > beat);
  const linear = clamp(((state.beatP ?? 0) - from) / (to - from));
  return state.cues?.[id]?.progress ?? linear * linear * (3 - 2 * linear);
}

export const phase = (p) => Math.max(0, Math.min(1, (p - 0.1) / 0.72));
export const clampSky = (p) => Math.max(0, Math.min(1, p));

// The canvas host supplies word timings in production and beat progress in storyboards.
export function phraseProgress(state, api, id, beat, start = 0.15, end = 0.65) {
  const cue = state.cues?.[id];
  if (cue) return cue.progress;
  const fallback = state.cues
    ? 0
    : state.beat === beat
      ? clampSky((state.beatP - start) / (end - start))
      : Number(state.beat > beat);
  return api.focus.progress?.(id, fallback) ?? fallback;
}

export function phraseEnded(state, api, id, beat, end = 0.65) {
  const cue = state.cues?.[id];
  if (cue) return cue.phase === 'after';
  return phraseProgress(state, api, id, beat, 0, end) === 1;
}

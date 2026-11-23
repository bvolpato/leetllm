// The storyboard uses beat fractions until the course narrator supplies word boundaries.
export function phraseProgress(state, api, id, beat, start = 0.05, end = 0.3) {
  const fallback =
    state.beat === beat ? api.phase(state.beatP ?? 0, start, end) : Number(state.beat > beat);
  return api.focus.progress(id, fallback);
}

export function phraseStarted(state, id, beat, at = 0.05) {
  const cue = state.cues?.[id];
  if (cue) return cue.phase !== 'before';
  return state.beat > beat || (state.beat === beat && state.beatP >= at);
}

export function phraseFinished(state, id, beat, at) {
  const cue = state.cues?.[id];
  if (cue) return cue.phase === 'after';
  return state.beat > beat || (state.beat === beat && state.beatP >= at);
}

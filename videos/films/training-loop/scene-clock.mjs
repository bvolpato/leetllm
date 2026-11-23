// Storyboard samples have beat progress. The production clock has the spoken phrase boundaries.
export function finished(state, id, beat, end) {
  const cue = state.cues?.[id];
  if (cue) return cue.phase === 'after';
  return state.beat > beat || (state.beat === beat && state.beatP >= end);
}

export function progressDuring(state, id, beat, from, to) {
  const cue = state.cues?.[id];
  if (cue) return cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : cue.progress;
  if (state.beat !== beat) return state.beat > beat ? 1 : 0;
  return Math.max(0, Math.min(1, (state.beatP - from) / (to - from)));
}

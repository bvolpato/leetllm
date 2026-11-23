// Storyboards use the same cue order when measured speech is unavailable.
export function cueProgress(state, id, beat, start = 0, end = 1) {
  const cue = state.cues?.[id];
  if (cue) return cue.phase === 'after' ? 1 : cue.phase === 'before' ? 0 : cue.progress;
  const time = (state.beat ?? 0) + (state.beatP ?? 0);
  return Math.max(0, Math.min(1, (time - beat - start) / (end - start)));
}

export function afterClause(state, id, beat, end) {
  const cue = state.cues?.[id];
  if (cue) return cue.phase === 'after';
  return (state.beat ?? 0) + (state.beatP ?? 0) >= beat + end;
}

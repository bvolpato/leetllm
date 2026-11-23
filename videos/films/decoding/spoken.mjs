export function movement(state, id, beat, start = 0.1, end = 0.8) {
  const cue = state.cues?.[id];
  if (cue) return cue.phase === 'after' ? 1 : cue.phase === 'before' ? 0 : cue.progress;
  if (state.beat !== beat) return state.beat > beat ? 1 : 0;
  return Math.max(0, Math.min(1, ((state.beatP ?? 0) - start) / (end - start)));
}

export function heard(state, id, beat, end = 0.8) {
  const cue = state.cues?.[id];
  return cue ? cue.phase === 'after' : movement(state, id, beat, 0, end) === 1;
}

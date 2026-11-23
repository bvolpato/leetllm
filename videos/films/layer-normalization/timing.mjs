// The course clock supplies word timings. A storyboard can sample the same operation by beat.
export function motion(state, id, beat, start, end) {
  const cue = state.cues?.[id];
  if (cue) return cue.progress;
  if ((state.beat ?? 0) < beat) return 0;
  if ((state.beat ?? 0) > beat) return 1;
  return Math.max(0, Math.min(1, ((state.beatP ?? 0) - start) / (end - start)));
}

export function landed(state, id, beat, start, end) {
  const cue = state.cues?.[id];
  return cue ? cue.phase === 'after' : motion(state, id, beat, start, end) === 1;
}

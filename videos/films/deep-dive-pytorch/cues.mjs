import { clamp01 } from './arithmetic.mjs';

// Production uses measured words. The beat fraction also lets a silent storyboard visit each operation.
export function cueFraction(state, id, beat, start, end) {
  if (state.beat !== beat) return state.beat > beat ? 1 : 0;
  const cue = state.cues?.[id];
  if (cue) return cue.phase === 'after' ? 1 : cue.phase === 'before' ? 0 : cue.progress;
  return clamp01((state.beatP - start) / (end - start));
}

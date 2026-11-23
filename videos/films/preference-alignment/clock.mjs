import { operationProgress, resultAfter } from '../../lib/lesson-definition.mjs';

// The production clock supplies word cues. An untimed storyboard uses the beat instead.
export function progress(state, id, beat) {
  if (state.cues) return operationProgress(state, id);
  if (state.beat !== beat) return Number(state.beat > beat);
  return state.beatP ?? 0;
}

export function heard(state, id, beat) {
  if (state.cues) return resultAfter(state, id);
  return progress(state, id, beat) >= 1;
}

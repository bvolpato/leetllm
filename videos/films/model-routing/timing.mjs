import { operationProgress, resultAfter } from '../../lib/lesson-definition.mjs';

// Storyboards supply a beat fraction. The delivered film uses the measured phrase.
export function progress(state, id, beat, from, to) {
  if (state.cues?.[id]) return operationProgress(state, id);
  if (state.beat !== beat) return state.beat > beat ? 1 : 0;
  return Math.max(0, Math.min(1, ((state.beatP ?? 0) - from) / (to - from)));
}

export function after(state, id, beat, at) {
  if (state.cues?.[id]) return resultAfter(state, id);
  return state.beat > beat || (state.beat === beat && (state.beatP ?? 0) >= at);
}

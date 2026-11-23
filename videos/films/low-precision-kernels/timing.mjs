import { operationProgress, resultAfter } from '../../lib/lesson-definition.mjs';
import { clip01 } from './encoding.mjs';

// Unvoiced storyboard frames have a beat clock. The delivered film has word times.
export function motion(state, id, beat) {
  if (state.cues?.[id]) return operationProgress(state, id);
  if (state.beat !== beat) return Number(state.beat > beat);
  return clip01((state.beatP - 0.2) / 0.55);
}

export function settled(state, id, beat) {
  if (state.cues?.[id]) return resultAfter(state, id);
  return state.beat > beat || (state.beat === beat && state.beatP >= 0.8);
}

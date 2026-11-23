import { operationProgress, resultAfter } from '../../lib/lesson-definition.mjs';
import { unitPhase } from './arithmetic.mjs';

// The delivered film uses word timing. Beat fractions also let a silent storyboard traverse the scene.
export function cueAt(state, id, beat, start = 0, end = 1) {
  if (state.cues?.[id]) {
    return {
      started: state.cues[id].phase !== 'before',
      progress: operationProgress(state, id),
      done: resultAfter(state, id),
    };
  }
  const t = (state.beat ?? 0) - beat + (state.beatP ?? 0);
  return { started: t >= start, progress: unitPhase(t, start, end), done: t >= end };
}

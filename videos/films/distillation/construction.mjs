import { resultAfter } from '../../lib/lesson-definition.mjs';

export const phase = (value, start, end) => {
  const p = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return p * p * (3 - 2 * p);
};

// The canvas storyboard has beat progress. The production clock also has spoken phrases.
export function spokenProgress(state, api, id, beat, start = 0.15, end = 0.45) {
  const current = state.beat ?? 0;
  const estimate = current < beat ? 0 : current > beat ? 1 : phase(state.beatP ?? 0, start, end);
  return api.focus.progress(id, estimate);
}

export function spokenResult(state, api, id, beat, end) {
  if (state.cues) return resultAfter(state, id);
  return spokenProgress(state, api, id, beat, 0, end) === 1;
}

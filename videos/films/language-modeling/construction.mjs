import { bound } from './arithmetic.mjs';
export const cue = (cues, id, fallback) => cues?.[id]?.progress ?? fallback;
export const started = (cues, id, fallback) =>
  cues?.[id] ? cues[id].phase !== 'before' : fallback;
export const finished = (cues, id, fallback) => (cues?.[id] ? cues[id].progress >= 1 : fallback);
export const occurrence = (id, token) => ({
  id,
  token,
});
export function languageStep(scene, state, beat, index = 0) {
  const current = state.beat ?? 0;
  if (current > beat) return 1;
  if (current < beat) return 0;
  const id = index === 0 ? scene + '-b' + (beat + 1) : scene + '-step-' + beat + '-' + index;
  return bound(state.cues?.[id]?.progress ?? 0);
}

export function cueAmount(state, beat, id, from, until) {
  if (state.cues?.[id]) return state.cues[id].progress;
  if (state.beat !== beat) return state.beat > beat ? 1 : 0;
  return bound(((state.beatP ?? 0) - from) / (until - from));
}

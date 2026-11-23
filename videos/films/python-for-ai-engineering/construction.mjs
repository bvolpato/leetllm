import { ramp, unit } from './arithmetic.mjs';
import { pythonCueBeats } from './fixtures.mjs';
export function cueProgress(state, id, beat, a = 0.15, z = 0.8) {
  const cue = state.cues?.[id];
  if (cue?.phase === 'before') return 0;
  if (cue?.phase === 'after') return 1;
  if (cue) return unit(cue.progress);
  const b = state.beat ?? 0;
  if (b < beat) return 0;
  if (b > beat) return 1;
  return ramp(state.beatP ?? 0, a, z);
}
export const exactCue = (state, id) => cueProgress(state, id, pythonCueBeats[id]);
export const complete = (state, id) => exactCue(state, id) === 1;
export function pyP(state, scene, beat = state.beat ?? 0) {
  return exactCue(state, 'py-' + scene + '-' + beat);
}

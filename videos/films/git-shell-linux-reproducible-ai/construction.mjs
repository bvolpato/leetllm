import { clamp, phase } from './arithmetic.mjs';
export function cueProgress(state, id, beat, a = 0.12, z = 0.82) {
  if ((state.beat ?? 0) < beat) return 0;
  if ((state.beat ?? 0) > beat) return 1;
  const cue = state.cues?.[id];
  return cue
    ? clamp(cue.progress ?? (cue.phase === 'after' ? 1 : 0))
    : phase(state.beatP ?? 0, a, z);
}

import { clamp, phase, smooth } from './arithmetic.mjs';
export const cueProgress = (state, id, beat) => {
  const b = state.beat ?? 0;
  if (b < beat) return 0;
  if (b > beat) return 1;
  return state.cues?.[id]
    ? clamp(state.cues[id].progress)
    : smooth(phase(state.beatP ?? 0, 0.18, 0.76));
};
export const stateFor = (beat, beatP, cues) => ({
  beat,
  beatP,
  cues,
});

import { clamp01 } from './arithmetic.mjs';
export const cueProgress = (state, start, end, beatSpan) => {
  const elapsed = Number.isFinite(state.t) ? state.t - 0.4 : (state.beatP ?? 0) * beatSpan;
  return clamp01((elapsed - start) / (end - start));
};
export const cueProgressFromState = (state, id, fallback = 0) => {
  const cue = state.cues?.[id];
  return cue
    ? cue.phase === 'before'
      ? 0
      : cue.phase === 'after'
        ? 1
        : clamp01(cue.progress)
    : clamp01(fallback);
};

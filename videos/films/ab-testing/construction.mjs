import { abClamp } from './arithmetic.mjs';
export const abCue = (state, id, fallback = 0) => {
  const cue = state.cues?.[id];
  return cue
    ? cue.phase === 'before'
      ? 0
      : cue.phase === 'after'
        ? 1
        : abClamp(cue.progress ?? 0)
    : state.cues
      ? 0
      : fallback;
};
export const abStarted = (state, id, fallback = false) => {
  const cue = state.cues?.[id];
  return cue ? cue.phase !== 'before' : state.cues ? false : fallback;
};

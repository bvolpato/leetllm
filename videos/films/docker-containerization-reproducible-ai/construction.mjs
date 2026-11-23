import { smooth } from './arithmetic.mjs';
export function cueProgress(state, id, beat = 0, start = 0.1, end = 0.75) {
  const cue = state.cues?.[id];
  if (cue) return smooth(cue.progress);
  return state.beat < beat
    ? 0
    : state.beat > beat
      ? 1
      : smooth((state.beatP - start) / (end - start));
}

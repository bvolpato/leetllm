import { clamp, phase, smooth } from './arithmetic.mjs';
export function directed(state, id, start = 0.1, end = 0.8) {
  const cue = state.cues?.[id];
  return smooth(cue ? clamp(cue.progress) : phase(state.beatP ?? 0, start, end));
}
export function finished(state, id, fallbackAt = 0.6) {
  const cue = state.cues?.[id];
  return cue ? cue.phase === 'after' : (state.beatP ?? 0) >= fallbackAt;
}
export const cueEmphasis = (state, id, fallback) =>
  state.cues?.[id]
    ? state.cues[id].phase === 'during'
      ? 1
      : 0
    : fallback > 0 && fallback < 1
      ? 1
      : 0;

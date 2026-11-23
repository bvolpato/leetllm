export const clamp = (value) => Math.max(0, Math.min(1, value));
export const phase = (value, start, end) => clamp((value - start) / (end - start));
export const smooth = (value) => value * value * (3 - 2 * value);
export const directed = (state, id, start = 0.15, end = 0.65) => {
  const cue = state.cues?.[id];
  return smooth(cue ? clamp(cue.progress) : phase(state.beatP ?? 0, start, end));
};
export const begun = (state, id, fallback = 0.2) =>
  state.cues?.[id] ? state.cues[id].phase !== 'before' : (state.beatP ?? 0) >= fallback;
// Estimated storyboards and the measured narration use the same persistent cue state.
export function cueStep(state, id, beat, start, end) {
  if (state.cues?.[id]) return directed(state, id);
  const current = state.beat ?? 0;
  if (current !== beat) return current > beat ? 1 : 0;
  return directed(state, id, start, end);
}
export function samplingExtensionModel(state, scene) {
  const beat = state.beat ?? 0,
    p = state.beatP ?? 0;
  const cue = (id) => state.cues?.[id],
    progress = (id, fallback = p) => {
      const c = cue(id);
      return c
        ? c.phase === 'before'
          ? 0
          : c.phase === 'after'
            ? 1
            : clamp(c.progress)
        : smooth(clamp(fallback));
    },
    active = (id, fallback = p > 0.4) => (cue(id) ? cue(id).phase !== 'before' : fallback);
  return {
    beat,
    p,
    progress: progress('sp-' + scene + '-' + beat),
    go: progress,
    active,
  };
}

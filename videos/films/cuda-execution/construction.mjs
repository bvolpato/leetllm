export const clamp = (value) => Math.max(0, Math.min(1, value));
export const ramp = (value, a, z) => clamp((value - a) / (z - a));
export const smooth = (value) => value * value * (3 - 2 * value);
export const mix = (a, z, p) => a + (z - a) * p;
export function directed(state, id, beat, a = 0.2, z = 0.75) {
  if ((state.beat ?? 0) < beat) return 0;
  if ((state.beat ?? 0) > beat) return 1;
  const cue = state.cues?.[id];
  return smooth(cue ? clamp(cue.progress) : ramp(state.beatP ?? 0, a, z));
}

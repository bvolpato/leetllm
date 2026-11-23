export const phase = (p) => Math.max(0, Math.min(1, (p - 0.1) / 0.72));
export const sum = (xs) => xs.reduce((a, v) => a + v, 0);
export const cueProgress = (cues, id, fallback) => {
  const cue = cues?.[id];
  return !cue ? fallback : cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : cue.progress;
};
export const cueBegun = (cues, id, fallback) =>
  cues?.[id] ? cues[id].phase !== 'before' : fallback;
export const cueDone = (cues, id, fallback) => (cues?.[id] ? cues[id].phase === 'after' : fallback);
export const clamp01 = (p) => Math.max(0, Math.min(1, p));
export const progressOf = (state, id, fallback = phase(state.beatP ?? 0)) => {
  const c = state.cues?.[id];
  return c ? (c.phase === 'after' ? 1 : c.phase === 'before' ? 0 : clamp01(c.progress)) : fallback;
};
export const resultDone = (state, id) =>
  state.cues?.['hf-' + id] ? state.cues['hf-' + id].phase === 'after' : (state.beatP ?? 0) >= 1;

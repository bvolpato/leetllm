import { unit } from './arithmetic.mjs';
export function reverseSampleProgress(beat, progress) {
  return beat > 0 ? 1 : Math.max(0, Math.min(1, (progress - 0.05) / 0.85));
}
export const opProgress = (state, scene) => {
  const c = state.cues?.[`df-${scene}-${state.beat ?? 0}`];
  return c
    ? c.phase === 'before'
      ? 0
      : c.phase === 'after'
        ? 1
        : unit(c.progress)
    : unit(state.beatP ?? 0);
};
export const completed = (state, name) =>
  state.cues?.['df-' + name] ? state.cues['df-' + name].phase === 'after' : (state.beatP ?? 0) >= 1;

import { clamp01, quantizationMemory } from './arithmetic.mjs';
export function contextBudgetState(state) {
  const progress = (id, beat, start = 0.15, end = 0.75) =>
    state.cues?.[id]?.progress ??
    ((state.beat ?? 0) < beat
      ? 0
      : (state.beat ?? 0) > beat
        ? 1
        : Math.max(0, Math.min(1, ((state.beatP ?? 0) - start) / (end - start))));
  const growth = progress('context-growth', 2),
    overflow = progress('budget-overflow', 3, 0.05, 0.35),
    restore = progress('restore-context', 4, 0.15, 0.55);
  return {
    ...quantizationMemory(2 + 2 * overflow * (1 - restore)),
    growth,
    overflow,
    restore,
  };
}
export function detailProgress(state, id, index) {
  if ((state.beat ?? 0) < index) return 0;
  if ((state.beat ?? 0) > index) return 1;
  const cue = state.cues?.[`${id}-build-${index}`];
  return cue
    ? cue.phase === 'before'
      ? 0
      : cue.phase === 'after'
        ? 1
        : clamp01(cue.progress)
    : clamp01(((state.beatP ?? 0) - 0.16) / 0.65);
}
export function extraProgress(state, id, fallback) {
  const cue = state.cues?.[id];
  return cue
    ? cue.phase === 'before'
      ? 0
      : cue.phase === 'after'
        ? 1
        : clamp01(cue.progress)
    : fallback;
}

export function spokenProgress(state, id, beat, start, end) {
  const current = state.beat ?? 0;
  const fallback =
    current < beat ? 0 : current > beat ? 1 : clamp01(((state.beatP ?? 0) - start) / (end - start));
  return extraProgress(state, id, fallback);
}

export function spokenResult(state, id, beat, start, end) {
  const cue = state.cues?.[id];
  return cue ? cue.phase === 'after' : spokenProgress(state, id, beat, start, end) === 1;
}

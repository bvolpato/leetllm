import { clamp } from './arithmetic.mjs';
export function event(state, beat, id, start = 0.12, end = 0.85) {
  const active = state.beat ?? 0;
  if (active < beat) return 0;
  if (active > beat) return 1;
  const cue = state.cues?.[id];
  return cue
    ? cue.phase === 'before'
      ? 0
      : cue.phase === 'after'
        ? 1
        : clamp(cue.progress)
    : clamp(((state.beatP ?? 0) - start) / (end - start));
}

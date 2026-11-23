import { clamp } from './arithmetic.mjs';
export function accEvent(scene, state, name, beat) {
  const cue = state.cues?.['ag-' + scene.id + '-' + name];
  if (cue) return cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : clamp(cue.progress ?? 0);
  return (state.beat ?? 0) < beat
    ? 0
    : (state.beat ?? 0) > beat
      ? 1
      : clamp(((state.beatP ?? 0) - 0.08) / 0.8);
}

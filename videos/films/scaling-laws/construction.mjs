import { bounded } from './arithmetic.mjs';
export function scalingEvent(scene, state, beat = state.beat ?? 0) {
  const c = state.cues?.['sl-' + scene.id + '-' + beat];
  if (c) return c.phase === 'before' ? 0 : c.phase === 'after' ? 1 : bounded(c.progress ?? 0);
  return (state.beat ?? 0) < beat
    ? 0
    : (state.beat ?? 0) > beat
      ? 1
      : bounded(((state.beatP ?? 0) - 0.04) / 0.9);
}

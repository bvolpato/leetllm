import { clamp, ramp } from './arithmetic.mjs';
export function introContextState(beat, p) {
  const progress = beat === 0 ? 0 : beat > 1 ? 1 : ramp(p, 0.52, 0.7);
  const oldOpacity = beat === 0 ? 1 : beat > 1 ? 0 : 1 - ramp(p, 0.4, 0.52);
  return {
    progress,
    oldOpacity,
    packed: progress === 1 ? [2, 1] : oldOpacity > 0 ? [0, 1] : [1],
  };
}
export function reorderMotion(beat, p) {
  const progress = beat === 0 ? clamp((p - 0.05) / 0.62) : 1;
  return {
    progress,
    x: 1080 + 260 * Math.sin(progress * Math.PI),
    y: 685 - 330 * progress,
  };
}
export function candidateScope(state) {
  const beat = state.beat ?? 0,
    elapsed = Number.isFinite(state.t) ? state.t - 15.902 : (state.beatP ?? 0) * 16.614;
  const progress = beat === 0 ? 0 : beat > 1 ? 1 : clamp((elapsed - 10.0875) / (12.25 - 10.0875));
  return {
    progress,
    depth: progress >= 1 ? 3 : 2,
    cutoffY: 623 + 170 * progress,
  };
}

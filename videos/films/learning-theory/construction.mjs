import { VC_BEAT_2_SPAN, VC_BEAT_3_SPAN } from './fixtures.mjs';
export const smoothReveal = (progress, start, end) => {
  const t = Math.max(0, Math.min(1, (progress - start) / (end - start)));
  return t * t * (3 - 2 * t);
};
export function shatteringCueState(beat, progress) {
  const square = beat >= 1 ? 1 : 0;
  const count =
    beat === 1
      ? smoothReveal(progress, (2.175 - 0.15) / VC_BEAT_2_SPAN, (2.825 + 0.15) / VC_BEAT_2_SPAN)
      : beat > 1
        ? 1
        : 0;
  const checkerboard =
    beat === 1
      ? smoothReveal(progress, (6.4375 - 0.15) / VC_BEAT_2_SPAN, (6.9625 + 0.2) / VC_BEAT_2_SPAN)
      : beat > 1
        ? 1
        : 0;
  const dimension =
    beat === 2
      ? smoothReveal(progress, (7.0125 - 0.15) / VC_BEAT_3_SPAN, (7.3875 + 0.2) / VC_BEAT_3_SPAN)
      : beat > 2
        ? 1
        : 0;
  return {
    square,
    count,
    checkerboard,
    dimension,
  };
}

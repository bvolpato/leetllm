import { bound, dot, rotatePair } from './arithmetic.mjs';
export function directedCue(state, id, beat) {
  const cue = state.cues?.[id];
  return cue
    ? cue.phase === 'before'
      ? 0
      : cue.phase === 'after'
        ? 1
        : bound(cue.progress)
    : (state.beat ?? 0) < beat
      ? 0
      : (state.beat ?? 0) > beat
        ? 1
        : bound(state.beatP ?? 0);
}
export function freshPositionFrame(state) {
  const P = (b, s) => directedCue(state, 'rp-fresh-position-contract-' + b + '-' + s, b),
    beat = state.beat ?? 0;
  const shift = beat === 1 ? Math.round(40 * P(1, 2)) : 0;
  const queryPosition = 21 + shift,
    keyPosition = 18 + shift,
    wrong = beat === 2 && P(2, 0) > 0 && P(2, 1) === 0,
    phaseIndex = wrong ? 2 : keyPosition,
    relativePhase = (phaseIndex - queryPosition) * 0.4;
  return {
    queryPosition,
    keyPosition,
    phaseIndex,
    slot: 2,
    relativePhase,
    score: dot(rotatePair([1, 0], queryPosition * 0.4), rotatePair([1, 0], phaseIndex * 0.4)),
    phaseKnown: beat > 1 || (beat === 1 && P(1, 0) === 1),
    scoreKnown: beat > 1 || (beat === 1 && P(1, 1) > 0),
    shiftKnown: beat === 1 && P(1, 2) === 1,
    repaired: beat === 2 && P(2, 1) === 1,
  };
}

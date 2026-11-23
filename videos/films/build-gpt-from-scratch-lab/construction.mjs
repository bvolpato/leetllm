import { logged, pieces } from './fixtures.mjs';
import { clamp, localProbe, maskedPredictionFixture, motion, softmax } from './arithmetic.mjs';
export const cueProgress = (cues, id, fallback) => {
  const cue = cues?.[id];
  return !cue ? fallback : cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : cue.progress;
};
export function checkpointSnapshot(state) {
  const beat = state.beat ?? 0,
    seconds = Number.isFinite(state.t) ? state.t - 0.4 : (state.beatP ?? 0) * 19.88;
  const count =
    beat > 0
      ? logged.length
      : seconds < 1.5
        ? 1
        : seconds < 3.35
          ? 2
          : seconds < 10.7
            ? 3
            : seconds < 11.7
              ? 4
              : seconds < 13.275
                ? 5
                : 6;
  const visible = logged.slice(0, count),
    textCheckpoint = beat > 0 ? logged.at(-1) : count >= 3 ? logged[2] : null;
  return {
    logged: visible,
    curveEndpoint: visible.at(-1),
    textCheckpoint,
  };
}
export function sampleModel(id, state) {
  const b = Math.min(1, state.beat),
    q = motion(state.beatP);
  const z = [0, 1, 2, -1],
    before = softmax(z),
    updated = z.map((v, i) => v - 0.5 * (before[i] - (i === 1 ? 1 : 0))),
    future = b ? 4 + 3 * cueProgress(state.cues, 'mask-b2-1', q) : 4,
    maskedBefore = maskedPredictionFixture(4),
    maskedAfter = maskedPredictionFixture(future),
    prefixDelta = Math.max(
      ...maskedBefore.rows
        .slice(0, 3)
        .flatMap((row, i) =>
          row.probabilities.map((value, j) =>
            Math.abs(value - maskedAfter.rows[i].probabilities[j]),
          ),
        ),
    );
  return {
    b,
    q,
    pieces,
    mask: Array.from(
      {
        length: 4,
      },
      (_, r) =>
        Array.from(
          {
            length: 4,
          },
          (_, c) => (c <= r ? 1 : 0),
        ),
    ),
    logits: b ? z.map((v, i) => v + (updated[i] - v) * q) : z,
    probabilities: softmax(b ? z.map((v, i) => v + (updated[i] - v) * q) : z),
    ...checkpointSnapshot(state),
    selected: Math.min(3, Math.floor(q * 4)),
    generated: b ? Math.min(3, Math.floor(q * 4)) : 0,
    future,
    maskedBefore,
    maskedAfter,
    prefixDelta,
  };
}
export function lossConstruction(p) {
  const count = Math.min(4, Math.floor(Math.max(0, p - 0.05) / 0.065)),
    weights = [0, 1, 2, -1].map(Math.exp),
    sum = weights.slice(0, count).reduce((a, b) => a + b, 0);
  return {
    count,
    weights,
    sum,
    normalized: count === 4 && p >= 0.34,
    lossVisible: p >= 0.49,
  };
}
export const spoken = (state, id, beat) => {
  const b = state.beat ?? 0,
    c = state.cues?.[id];
  return b < beat
    ? 0
    : b > beat
      ? 1
      : c
        ? c.phase === 'before'
          ? 0
          : c.phase === 'after'
            ? 1
            : clamp(c.progress)
        : clamp(((state.beatP ?? 0) - 0.12) / 0.72);
};
export const ended = (state, id, beat) => spoken(state, id, beat) === 1;
export function transferSnapshot(state) {
  const before = localProbe(9),
    change = spoken(state, 'future-input-change', 0),
    after = localProbe(change === 1 ? 14 : 9);
  return {
    before,
    after,
    change,
    prefixRevealed: ended(state, 'answer-prefix', 1),
    targetRevealed: ended(state, 'answer-target', 1),
    invarianceRevealed: ended(state, 'answer-invariant', 1),
    copyRevealed: ended(state, 'answer-copy', 1),
    delta: Math.max(
      ...before.rows
        .slice(0, 3)
        .flatMap((r, i) => r.logits.map((v, j) => Math.abs(v - after.rows[i].logits[j]))),
    ),
  };
}

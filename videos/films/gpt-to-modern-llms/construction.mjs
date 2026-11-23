import { clamp, phase, phraseEnded, phraseProgress } from './arithmetic.mjs';
import { attention, values } from './fixtures.mjs';
import { learningTrace, outputProjection } from './model.mjs';
export function attentionCueState(beat, progress, cues) {
  const state = { beatP: progress, cues };
  const fractions =
    beat === 0
      ? [0, 0, 0, 0]
      : beat > 1
        ? [1, 1, 1, 1]
        : [
            1,
            phraseProgress(state, 'add-stale', 0.4, 0.56),
            phraseProgress(state, 'add-guide', 0.03, 0.28),
            phraseProgress(state, 'add-label', 0.6, 0.81),
          ];
  const contributions = values.map((value, i) => value.map((x) => x * attention[i] * fractions[i]));
  const vector = [0, 1].map((axis) => contributions.reduce((sum, value) => sum + value[axis], 0));
  return {
    fractions,
    contributions,
    vector,
    admitted: fractions.filter((value) => value === 1).length,
  };
}
export function allocationState(beat, p, cues) {
  const state = { beatP: p, cues };
  const index =
    beat === 0
      ? 0
      : beat === 1
        ? Number(phraseEnded(state, 'parameter-allocation-b2-1', 0.23)) +
          Number(phraseEnded(state, 'double-again', 0.58))
        : 2;
  const parameters = [4, 8, 16][index],
    trainingTokens = 64 / parameters;
  return {
    parameters,
    trainingTokens,
    compute: 6 * parameters * trainingTokens,
  };
}
export function cacheState(beat, p) {
  const positions =
    beat === 0 ? Math.max(1, Math.min(4, 1 + Math.floor(phase(p, 0.08, 0.78) * 4))) : 4;
  const grouping =
    beat === 0 ? 0 : beat === 1 ? Math.min(2, Math.floor(phase(p, 0.08, 0.76) * 3)) : 2;
  const kvHeads = [8, 4, 2][grouping];
  return {
    positions,
    kvHeads,
    queryHeads: 8,
    width: 2,
    scalars: 2 * positions * kvHeads * 2,
    groups: Array.from(
      {
        length: 8,
      },
      (_, i) => Math.floor((i * kvHeads) / 8),
    ),
  };
}
export function sampleModel(id, state) {
  const beat = state.beat ?? 0,
    p = clamp(state.beatP ?? 0);
  const row =
    beat === 0
      ? 0
      : beat === 1
        ? Math.min(2, Math.floor(phraseProgress(state, 'read-to-guide', 0.05, 0.3) * 3))
        : 2;
  const count = beat === 0 ? Math.min(2, Math.floor(phase(p, 0.08, 0.74) * 2 + 1e-9)) : 2;
  const learningStep =
    beat === 0
      ? 0
      : beat === 1
        ? Math.min(12, Math.floor(phraseProgress(state, 'update-rows', 0.16, 0.72) * 12))
        : 12;
  return {
    beat,
    p,
    row,
    count,
    attention: attentionCueState(beat, p, state.cues),
    output: outputProjection(),
    learned: learningTrace()[learningStep],
    allocation: allocationState(beat, p, state.cues),
    cache: cacheState(beat, p),
  };
}

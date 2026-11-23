import { bound } from './arithmetic.mjs';
import { inputs, scalar } from './fixtures.mjs';
export function retentionFrame(beat, progress) {
  const elapsed = bound(progress) * [18.17, 18.41, 19.228][beat];
  const curveProgress = beat > 0 ? 1 : bound((elapsed - 6.8125) / (12.4125 - 6.8125));
  const moveProgress =
    beat === 0
      ? bound((elapsed - 8.2375) / (9.5 - 8.2375))
      : beat === 1
        ? bound((elapsed - 0.4375) / (2.375 - 0.4375))
        : 1;
  const n =
    beat === 0 ? Math.floor(10 * moveProgress + 1e-9) : 10 + Math.floor(20 * moveProgress + 1e-9);
  return {
    elapsed,
    curveProgress,
    moveProgress,
    n,
    factors: [0.98 ** n, 0.5 ** n],
    moving: beat < 2 && moveProgress > 0 && moveProgress < 1,
  };
}
export function recurrenceFrame(beat, progress) {
  const step = Math.min(2, beat),
    inputTerm = 0.8 * inputs[step],
    memoryTerm = 0.5 * scalar[step];
  return {
    step,
    input: inputs[step],
    old: scalar[step],
    inputTerm,
    memoryTerm,
    sum: inputTerm + memoryTerm,
    output: scalar[step + 1],
    withoutMemory: Math.tanh(inputTerm),
    inputReady: progress >= 0.16,
    memoryReady: progress >= 0.3,
    sumReady: progress >= 0.42,
    outputReady: progress >= (step === 2 ? 0.62 : 0.56),
    comparisonReady: step === 2 && progress >= 0.72,
  };
}
export const spokenProgress = (state, id, fallback = 0) => {
  const cue = state.cues?.[id];
  return cue ? (cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : cue.progress) : fallback;
};
export const cueStarted = (state, id) => {
  const cue = state.cues?.[id];
  return Boolean(cue && cue.phase !== 'before');
};
export function incidentFrame(scene, state = {}) {
  const b = state.beat ?? 0,
    p = bound(state.beatP ?? 0);
  const cue = (id, fallback = 0) => (state.cues ? spokenProgress(state, id) : fallback);
  const started = (id, fallback = false) => (state.cues ? cueStarted(state, id) : fallback);
  return {
    b,
    p,
    cue,
    started,
    freshVisible:
      b > 1
        ? 3
        : b === 1
          ? started('fresh-pad-result', p > 0.72)
            ? 3
            : started('fresh-second-result', p > 0.36)
              ? 2
              : started('fresh-first-result', p > 0.08)
                ? 1
                : 0
          : 0,
    vectorStep: b === 0 ? -1 : b === 1 ? (started('vector-second-start', p > 0.5) ? 1 : 0) : 2,
    nonNormalSteps: b < 1 ? 0 : b > 1 ? 12 : Math.min(12, Math.floor(13 * cue('matrix-powers', p))),
  };
}
export function lstmJoinFrame(state) {
  const beat = state.beat ?? 0,
    terms = [0.98 * 0.855, 0.02 * 0.1];
  const progress =
    beat < 1
      ? 0
      : beat > 1
        ? 1
        : spokenProgress(state, 'next-cell-b2-1', bound(((state.beatP ?? 0) - 0.12) / 0.74));
  const count = Math.min(2, Math.floor(2 * progress + 1e-9));
  return {
    terms,
    progress,
    count,
    sum: terms.slice(0, count).reduce((sum, value) => sum + value, 0),
    retainedReady: beat > 1 || spokenProgress(state, 'lstm-retained-term') > 0,
    writtenReady: beat > 1 || spokenProgress(state, 'lstm-written-term') > 0,
  };
}
export function gruComparisonFrame(state) {
  return {
    afterStage: Math.min(2, Math.floor(2 * spokenProgress(state, 'gru-reset-after', 1) + 1e-9)),
    beforeStage: Math.min(2, Math.floor(2 * spokenProgress(state, 'gru-reset-before', 1) + 1e-9)),
  };
}

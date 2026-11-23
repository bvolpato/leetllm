import { drillRun, boundary } from './boundaries.mjs';
import { clamp } from './arithmetic.mjs';
import { DEADLINE_WARNING_CUE } from './fixtures.mjs';
export function checkpointRestore(state) {
  const beat = state.beat ?? 0,
    cues = state.cues,
    seconds = clamp(state.beatP ?? 0) * 21.08;
  const started = (id) => cues?.[id] && cues[id].phase !== 'before';
  const hasRestoreCues = [
    'intro-full-continuation',
    'intro-weights-only',
    'intro-full-packet',
  ].some((id) => cues?.[id]);
  const full =
    beat > 1 ||
    (beat === 1 &&
      (hasRestoreCues
        ? started('intro-full-packet') ||
          (started('intro-full-continuation') && !started('intro-weights-only'))
        : seconds >= 8.2375 || (seconds >= 4.625 && seconds < 6.15)));
  return {
    actor: full ? 'Full continuation' : 'Weights-only initialization',
    full,
    fields: ['Weights', 'Adam moments', 'Scheduler phase', 'Consumed cursor'].map((name, i) => ({
      name,
      restored: full || i === 0,
    })),
  };
}
export function warningSeconds(state) {
  return state.beat > 1 ||
    (state.beat === 1 &&
      clamp(state.beatP ?? 0) * DEADLINE_WARNING_CUE.beatDuration >= DEADLINE_WARNING_CUE.shortenAt)
    ? 119
    : 120;
}
export function tokenReduction(state) {
  const beat = state.beat ?? 0,
    seconds = clamp(state.beatP ?? 0) * [20.816, 23.144][Math.min(1, beat)],
    values = [10, -2, -2, -2];
  const collected = beat
    ? Math.min(4, [0.75, 1.25, 1.75, 2.25].filter((at) => seconds >= at).length)
    : 0;
  return {
    seconds,
    values,
    collected,
    sum: values.slice(0, collected).reduce((a, v) => a + v, 0),
    count: collected,
    meansReady: beat > 0 || seconds >= 10.9,
    replicaResultReady: beat > 0 || seconds >= 12.8,
    predict: beat === 0 && seconds >= 13.86,
    resultReady:
      beat > 0 && (state.cues ? trainingCue(state, 'tokens-b2-1') === 1 : seconds >= 4.2),
    transfers: values.map((_, i) => (beat ? clamp((seconds - (0.05 + i * 0.5)) / 0.7) : 0)),
  };
}
export function reshardConstruction(state) {
  const beat = state.beat ?? 0,
    seconds = clamp(state.beatP ?? 0) * [21.416, 23.624][Math.min(1, beat)],
    progress = beat
      ? 1
      : state.cues
        ? (3 * trainingCue(state, 'reshard-b1-1') +
            trainingCue(state, 'reshard-pair') +
            4 * trainingCue(state, 'reshard-b1-2')) /
          8
        : clamp((seconds - 4.5) / 7.3);
  const slices = Array.from(
    {
      length: 8,
    },
    (_, rank) => ({
      rank,
      coordinates: [2 * rank, 2 * rank + 1],
      savedOwner: Math.floor(rank / 2),
      progress: clamp(progress * 8 - rank),
    }),
  );
  return {
    seconds,
    slices,
    arrived: slices.filter((slice) => slice.progress === 1).length,
    probeCoordinate: 6,
    probeSavedOwner: 1,
    probeDestinationOwner: 3,
    probeReady: beat > 0 && trainingStarted(state, 'reshard-b2-1', true),
  };
}
export const trainingCue = (state, id, fallback = 0) => {
  const c = state.cues?.[id];
  return c
    ? c.phase === 'before'
      ? 0
      : c.phase === 'after'
        ? 1
        : clamp(c.progress ?? 0)
    : state.cues
      ? 0
      : fallback;
};
export const trainingStarted = (state, id, fallback = false) => {
  const c = state.cues?.[id];
  return c ? c.phase !== 'before' : state.cues ? false : fallback;
};
export const trainingCompleted = (state, id, fallback = false) => {
  const c = state.cues?.[id];
  return c ? c.phase === 'after' : state.cues ? false : fallback;
};
export function durableSaveState(state, time) {
  const failed = trainingStarted(state, 'durable-failed-upload', false),
    clock = failed ? 85 : time,
    published = !failed && clock >= 110;
  return {
    failed,
    clock,
    published,
    recoveryPoint: published ? 1841 : 1840,
  };
}
export function trainingFreshState(state) {
  const beat = state.beat ?? 0,
    p = state.beatP ?? 0;
  const cost = beat > 1 || (beat === 1 && trainingCompleted(state, 'fresh-cost', p >= 1));
  const failed = beat > 1 || (beat === 1 && trainingCompleted(state, 'fresh-fails', p >= 1));
  const retained = beat > 1 || (beat === 1 && trainingCompleted(state, 'fresh-retain', p >= 1));
  const count =
    beat > 1 || (beat === 1 && trainingCompleted(state, 'fresh-restore-step-2', p >= 1));
  const range = beat >= 2 && trainingCompleted(state, 'fresh-range', beat >= 3 && p >= 0.4);
  const owner =
    beat >= 2 && trainingCompleted(state, 'fresh-restore-step-3', beat >= 3 && p >= 0.7);
  const { saved, perUpdate } = boundary(drillRun);
  return {
    cost,
    failed,
    retained,
    count,
    range,
    owner,
    neededSeconds: 12 + 40 + 8,
    warning: 59,
    batch: perUpdate,
    checkpoint: drillRun.step,
    consumed: saved,
    destinationWidth: 24 / 6,
    destinationOwner: Math.floor(19 / (24 / 6)),
  };
}

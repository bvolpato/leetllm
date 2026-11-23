import { boostClamp, phase, sigmoid, splitConstruction } from './arithmetic.mjs';
import { ROUND_POINTS, coarseBoundaries } from './fixtures.mjs';
import {
  APRIL_BOUNDARIES,
  SNAPSHOTS,
  allAlertApril,
  evaluateAprilThreshold,
  searchAprilThresholds,
  selectedApril,
} from './model.mjs';
import { createCueTrack } from 'vizmatic';
export function thresholdSnapshot(beat, beatP) {
  const p = Math.max(0, Math.min(1, beatP));
  let threshold = selectedApril.threshold,
    mode = 'Selected April boundary',
    evaluated = [],
    searchLabel = '';
  if (beat === 0 && p < 0.48) {
    const count = Math.min(
      coarseBoundaries.length,
      1 + Math.floor(phase(p, 0.02, 0.4) * coarseBoundaries.length),
    );
    evaluated = coarseBoundaries.slice(0, count);
    threshold = evaluated.at(-1);
    mode = 'Evaluate the coarse threshold grid';
    searchLabel = `Coarse candidates evaluated: ${count} / ${coarseBoundaries.length}`;
  } else if (beat === 0 && p < 0.56) {
    evaluated = [...coarseBoundaries];
    threshold = searchAprilThresholds(coarseBoundaries).threshold;
    mode = 'Hold the best coarse candidate';
    searchLabel = 'Coarse grid complete · search below its first boundary next';
  } else if (beat === 0 && p < 0.96) {
    const descending = [...APRIL_BOUNDARIES].reverse();
    const count = Math.min(
      descending.length,
      1 + Math.floor(phase(p, 0.56, 0.94) * descending.length),
    );
    evaluated = descending.slice(0, count);
    threshold = evaluated.at(-1);
    mode = 'Evaluate each distinct decision boundary';
    searchLabel = `Distinct boundaries evaluated: ${count} / ${descending.length}`;
  } else if (beat === 0) {
    evaluated = [...APRIL_BOUNDARIES];
    mode = 'Complete search selects the minimum';
    searchLabel = `Complete: ${APRIL_BOUNDARIES.length} boundary policies evaluated`;
  } else if (beat === 2) {
    threshold *= 1 - phase(p, 0.02, 0.24);
    mode =
      threshold === 0
        ? 'Current comparison: alert every April job'
        : 'Admit the remaining jobs below the selected cutoff';
    searchLabel = `Frozen selected policy: ${selectedApril.cost} units · alert-all: ${allAlertApril.cost} units · ${allAlertApril.fp - selectedApril.fp} avoidable false alarms`;
  }
  const current = evaluateAprilThreshold(threshold);
  const histogram = Array.from(
    {
      length: 20,
    },
    (_, bin) => ({
      bin,
      cleanAlert: 0,
      cleanQuiet: 0,
      missAlert: 0,
      missQuiet: 0,
    }),
  );
  for (const row of current.outcomes)
    histogram[Math.min(19, Math.floor(row.score * 20))][
      row.label === 1
        ? row.alert
          ? 'missAlert'
          : 'missQuiet'
        : row.alert
          ? 'cleanAlert'
          : 'cleanQuiet'
    ] += 1;
  let referenceThreshold = threshold;
  if (beat === 0 && p < 0.48) referenceThreshold = evaluated[Math.max(0, evaluated.length - 2)];
  else if (beat === 0 && p < 0.56) referenceThreshold = coarseBoundaries.at(-1);
  else if (beat === 0 && p < 0.96)
    referenceThreshold =
      evaluated.length > 1 ? evaluated.at(-2) : searchAprilThresholds(coarseBoundaries).threshold;
  else if (beat === 0) referenceThreshold = 0;
  else if (beat === 2) referenceThreshold = selectedApril.threshold;
  const reference = evaluateAprilThreshold(referenceThreshold),
    changedIds = current.outcomes
      .filter((r, i) => r.alert !== reference.outcomes[i].alert)
      .map((r) => r.id);
  return {
    ...current,
    histogram,
    mode,
    searchLabel,
    referenceThreshold,
    referenceCost: reference.cost,
    costDelta: current.cost - reference.cost,
    changedIds,
    evaluated: evaluated.length,
    bestEvaluated: evaluated.length ? searchAprilThresholds(evaluated) : selectedApril,
    selected: selectedApril,
    allAlert: allAlertApril,
  };
}
export function makeTrack(sceneId, snapshots) {
  return createCueTrack({
    initial: {
      id: `${sceneId}-initial`,
      snapshot: snapshots[0],
    },
    cues: snapshots.map((snapshot, beat) => ({
      id: `${sceneId}-beat-${beat}`,
      beat,
      at: 0,
      snapshot,
    })),
  });
}
export const TRACKS = Object.fromEntries(
  Object.entries(SNAPSHOTS).map(([id, snapshots]) => [id, makeTrack(id, snapshots)]),
);
export function establishedProgress(state, firstBeat = 0, from = 0.08, to = 0.82) {
  const beat = state.beat ?? 0;
  return beat < firstBeat ? 0 : beat > firstBeat ? 1 : phase(state.beatP ?? 0, from, to);
}
export function roundSnapshot(beat, beatP) {
  const count = beat === 0 ? 1 : beat === 1 ? (beatP < 0.25 ? 1 : 2) : beatP < 0.25 ? 2 : 3;
  return {
    points: ROUND_POINTS.slice(0, count),
    chosen: count > 1 ? 50 : null,
  };
}
export function boostCue(state, id, beat) {
  const q = state.cues?.[id];
  return q
    ? q.phase === 'before'
      ? 0
      : q.phase === 'after'
        ? 1
        : boostClamp(q.progress)
    : (state.beat ?? 0) < beat
      ? 0
      : (state.beat ?? 0) > beat
        ? 1
        : phase(state.beatP ?? 0, 0.15, 0.8);
}
export function freshSplitState(state) {
  const gamma = boostCue(state, 'fresh-gamma', 2) === 1 ? 0.1 : 0.2,
    model = splitConstruction([1, 0, 1, 0], 1, gamma);
  const show = (id, b) => boostCue(state, id, b) === 1;
  const cutVisible = show('fresh-cut', 2),
    logitsVisible = show('fresh-logits', 2),
    probabilitiesVisible = show('fresh-probabilities', 3),
    actionsVisible = show('fresh-actions', 4);
  const selected = cutVisible ? model.best : null;
  const logits = selected
    ? model.rows.map(
        (_, i) => 0.25 * (i < selected.cut ? selected.leftWeight : selected.rightWeight),
      )
    : null;
  return {
    model,
    selected,
    gamma,
    cutVisible,
    logitsVisible,
    probabilitiesVisible,
    actionsVisible,
    logits,
    probabilities: logits?.map(sigmoid),
    alerts: logits?.map((z) => sigmoid(z) >= 0.52),
  };
}

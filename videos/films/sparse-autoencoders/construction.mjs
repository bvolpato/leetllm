import {
  OBSERVATION_CONTEXTS,
  candidates,
  dictionary,
  steeringBaseline,
  steeringBeats,
  steeringDirection,
  steeringReadouts,
} from './fixtures.mjs';
import { topK } from './model.mjs';
import { dotProduct } from 'vizmatic';
export const cueBegun = (cues, id, fallback) =>
  cues?.[id] ? cues[id].phase !== 'before' : fallback;
export function selectionHistory(cues) {
  const rare = cueBegun(cues, 'selection-rare-context', true),
    auxiliary = cueBegun(cues, 'selection-auxiliary-signal', true),
    rows = OBSERVATION_CONTEXTS.slice(0, rare ? 4 : 3).map((row) => ({
      ...row,
      code: row.pre.map((value) => (value > 2 ? value : 0)),
    })),
    counts = dictionary.map((_, i) => rows.filter((row) => row.code[i] > 0).length),
    residual = [-1, -0.5],
    signals = dictionary.map((column, i) =>
      counts[i] === 0 ? Math.max(0, dotProduct(column, residual)) : 0,
    );
  return {
    rows,
    counts,
    residual,
    signals,
    auxiliary,
  };
}
export function steeringState(state) {
  const beat = state.beat ?? 0,
    cue = steeringBeats[Math.min(beat, 1)],
    seconds = Number.isFinite(state.t) ? state.t - cue.start : (state.beatP ?? 0) * cue.span,
    progress = Math.max(0, Math.min(1, (seconds - cue.from) / (cue.to - cue.from))),
    eased = progress * progress * (3 - 2 * progress),
    alpha = beat === 0 ? -1 + eased : beat === 1 ? 2 * eased : 2,
    delta = steeringDirection.map((value) => alpha * value),
    activation = steeringBaseline.map((value, i) => value + delta[i]),
    readouts = steeringReadouts.map((direction) => dotProduct(activation, direction));
  return {
    alpha,
    delta,
    activation,
    readouts,
  };
}
export function topKSelectionState(state) {
  const seconds = Number.isFinite(state.t) ? state.t - 0.4 : (state.beatP ?? 0) * 18.528;
  const applied = seconds >= 5.5875 - 1e-9;
  const values = applied ? topK(candidates, 2) : candidates;
  return {
    applied,
    values,
    active: values.filter((value) => value > 0).length,
  };
}
export function ablationState(state) {
  const beat = state.beat ?? 0,
    starts = [0.4, 20.728, 40.082],
    spans = [20.328, 19.354, 18.58];
  const seconds = Number.isFinite(state.t)
    ? state.t - starts[Math.min(beat, 2)]
    : (state.beatP ?? 0) * spans[Math.min(beat, 2)];
  const applied = beat > 1 || (beat === 1 && seconds >= 11.225 - 1e-9);
  const removedResidual =
    beat < 2 ? 0 : Math.max(0, Math.min(1, (seconds - 2.9875) / (6.6125 - 2.9875)));
  const values = [applied ? 0 : 1, 0.1 * (1 - removedResidual)];
  return {
    seconds,
    applied,
    removedResidual,
    values,
    score: dotProduct(values, [0, 100]),
    originalScore: dotProduct([1, 0.1], [0, 100]),
    prediction: beat === 1 && seconds >= 7.2 && !applied,
  };
}

import { clamp01, softmax } from './arithmetic.mjs';
import { CUE_BEATS, track } from './fixtures.mjs';
import { TRAINING_TRACE } from './fixtures/training-trace.mjs';
import { temperature, trainHead } from './model.mjs';
export function thresholdSnapshot(beat, progress) {
  const elapsed = progress * 17.886;
  const movement = beat > 0 ? 1 : Math.max(0, Math.min(1, (elapsed - 10.8875) / (13.15 - 10.8875)));
  return {
    threshold: 0.5 - 0.15 * movement,
    movement,
  };
}
export function sampleModel(state) {
  const b = track.sample({
      ...state,
      beatP: Math.min(state.beatP ?? 0, 1 - Number.EPSILON),
    }).snapshot,
    p = Math.max(0, Math.min(1, ((state.beatP ?? 0) - 0.08) / 0.7)),
    temperatureScale = 1 + (b ? p : 0),
    urgentScore = temperature(0.3, temperatureScale),
    crossed = urgentScore >= 0.35;
  return {
    b,
    p,
    q: b ? 1 : p,
    head: trainHead(b ? 12 : Math.floor(12 * p)),
    threshold: b ? 0.35 : 0.5,
    temperatureScale,
    calibration: {
      urgentScore,
      routineScore: 1 - urgentScore,
      crossed,
      route: crossed ? 'HUMAN REVIEW' : 'GUARDED AGENT',
    },
  };
}
export function representationSnapshot(beat, progress) {
  const seconds = progress * [18.822, 20.578][beat],
    swap = beat > 0 ? Math.max(0, Math.min(1, (seconds - 2.26) / 1.4)) : 0;
  const vectors = [
      [2, 0],
      [0, 2],
    ],
    sum = vectors[0].map((v, i) => v + vectors[1][i]),
    pooled = sum.map((v) => v / 2),
    weights = [
      [1.5, 0.5],
      [0.5, 0.5],
    ],
    logits = weights.map((w) => w.reduce((a, v, i) => a + v * pooled[i], 0)),
    probabilities = softmax(logits);
  return {
    seconds,
    swap,
    vectors,
    sum,
    pooled,
    weights,
    logits,
    probabilities,
    vectorsVisible: beat > 0 || seconds >= 2.35,
    summed: beat > 0 || seconds >= 7.4,
    pooledVisible: beat > 0 || seconds >= 9.1,
    headVisible: beat > 0 || seconds >= 10.45,
    logitsVisible: beat > 0 || seconds >= 11.6,
    weightsVisible: beat > 0 || seconds >= 12.2,
    normalizerVisible: beat > 0 || seconds >= 12.85,
    probabilitiesVisible: beat > 0 || seconds >= 13.85,
  };
}
export function freshIntake({ route = false, miss = false, hold = false, effects = false } = {}) {
  const score = 0.34;
  const threshold = 0.35;
  const gold = 1;
  const proposed = score >= threshold ? 'human_review_now' : 'guarded_agent';
  const requiredMiss = gold === 1 && proposed === 'guarded_agent';
  return {
    ticket: 'S501',
    tokens: 32,
    score,
    threshold,
    gold,
    route: route ? proposed : null,
    falseNegative: miss ? requiredMiss : null,
    decision: hold && requiredMiss ? 'hold' : null,
    approvedEffects: effects ? 0 : null,
  };
}
export function classifierCueProgress(state, id) {
  if (!(id in CUE_BEATS)) throw Error('Unknown classifier cue ' + id);
  if (state.cues) {
    if (!state.cues[id]) throw Error('Missing current-scene cue ' + id);
    return clamp01(state.cues[id].progress ?? 0);
  }
  const b = state.beat ?? 0,
    at = CUE_BEATS[id];
  return b > at ? 1 : b < at ? 0 : clamp01(state.beatP ?? 0);
}
export function trainingFrame(progress) {
  const i = Math.min(80, Math.floor(clamp01(progress) * 80));
  return TRAINING_TRACE[i];
}

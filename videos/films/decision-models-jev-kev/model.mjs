import { confidence, softmax } from './arithmetic.mjs';
import {
  RELEASE_CASES,
  RELEASE_POLICY,
  confidenceCue,
  p,
  pointer,
  records,
  z,
} from './fixtures.mjs';
import { clamp, motion } from './construction.mjs';
export const pointerProjectionSnapshot = (beat, p) => ({
  count: beat ? Math.min(3, Math.floor(Math.max(0, p - 0.04) / 0.2)) : 0,
  scores: pointer,
});
export function report(field, threshold) {
  const accepted = records.filter((r) => field(r.p) >= threshold),
    errors = accepted.filter((r) => !r.correct).length;
  return {
    accepted,
    errors,
    coverage: accepted.length / records.length,
    risk: accepted.length ? errors / accepted.length : null,
  };
}
export function updateSnapshot(beat, progress) {
  const seconds = clamp(progress) * [19.64, 22.88][beat],
    gradient = p.map((v, i) => v - (i === 1 ? 1 : 0)),
    amount = beat ? clamp((seconds - 1.3625) / 6.2) : 0,
    scores = z.map((v, i) => v - 0.5 * gradient[i] * amount),
    probabilities = softmax(scores);
  return {
    seconds,
    gradient,
    amount,
    scores,
    probabilities,
    loss: -Math.log(probabilities[1]),
    targetGradient: beat > 0 || seconds >= 9.4375,
    otherGradients: beat > 0 || seconds >= 11.925,
    directions: beat > 0 || seconds >= 14.6,
  };
}
export const removalBeatSeconds = 17.175 + 0.8;
export function optionRemovalSnapshot(progress) {
  const seconds = clamp(progress) * removalBeatSeconds,
    travel = clamp((seconds - 0.325) / (1.125 - 0.325)),
    removed = travel === 1,
    normalized = seconds >= 5.665,
    three = softmax(z),
    two = softmax(z.slice(0, 2)),
    oldDenominator = z.reduce((a, v) => a + Math.exp(v), 0),
    denominator = z.slice(0, 2).reduce((a, v) => a + Math.exp(v), 0);
  return {
    seconds,
    travel,
    removed,
    normalized,
    three,
    two,
    oldDenominator,
    denominator,
  };
}
export function sampleModel(id, state) {
  const b = Math.min(1, state.beat),
    q = motion(state.beatP),
    scores = id === 'update' ? updateSnapshot(b, state.beatP).scores : z,
    T = id === 'temperature' ? (b ? 2 : 1 + q) : 1,
    field = id === 'risk' && b && state.beatP >= confidenceCue ? 'confidence' : 'p_max';
  return {
    b,
    q,
    scores,
    p: softmax(scores),
    pointer,
    temperature: T,
    pointerP: softmax(pointer, T),
    field,
    gate: report(field === 'confidence' ? confidence : (p) => p, 0.8),
    records,
  };
}
export function routeScoredChoice(scored, policy = RELEASE_POLICY) {
  const valid =
      policy.legalChoices.includes(scored.choice) &&
      Number.isFinite(scored.p) &&
      scored.p >= 1 / policy.legalChoices.length &&
      scored.p <= 1,
    value = valid
      ? policy.field === 'confidence'
        ? confidence(scored.p, policy.legalChoices.length)
        : scored.p
      : null,
    eligible = valid && value >= policy.cutoff;
  return {
    ...scored,
    valid,
    value,
    cutoff: policy.cutoff,
    eligible,
    route: eligible ? 'investigation' : 'human-review',
    actionAuthorized: false,
    effects: 0,
  };
}
export function releaseRoutingSnapshot(state) {
  const highCue = state.cues?.['release-b2-1'],
    lowCue = state.cues?.['release-b1-1'],
    high = highCue ? highCue.phase !== 'before' : (state.beat ?? 0) > 0,
    cue = high ? highCue : lowCue,
    progress = cue
      ? cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : cue.progress
      : motion(state.beatP ?? 0),
    record = routeScoredChoice(RELEASE_CASES[high ? 1 : 0]);
  return {
    record,
    high,
    progress,
    gateProcessed: progress >= 0.45,
    delivered: progress >= 1,
    lowDelivered: high || progress >= 1,
    incoming: clamp(progress / 0.45),
    outgoing: clamp((progress - 0.45) / 0.55),
  };
}

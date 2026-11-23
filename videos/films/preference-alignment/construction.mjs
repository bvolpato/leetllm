import { bounded, prefBound, prefLerp, prefLoss, sigmoid, wordCount } from './arithmetic.mjs';
import { CONTROLLED_CASES, SHORTCUT_PAIRS } from './fixtures.mjs';
import { alignmentSoftmax, dpoExample } from './model.mjs';
export function pairLayout(progress) {
  const swap = Math.max(0, Math.min(1, progress)),
    lift = Math.sin(Math.PI * swap) * 130;
  return {
    preferredX: 280 + swap * 800,
    detourX: 1080 - swap * 800,
    preferredY: 600 - lift,
    detourY: 600 + lift,
    preferredId: 'clear-route',
    voteId: 'clear-route',
  };
}
export function comparisonLoss(progress) {
  const probability = 0.5 + (dpoExample().probability - 0.5) * progress;
  return {
    probability,
    loss: -Math.log(probability),
  };
}
export function lossPresentation(beat, progress, confident = 0) {
  if (beat !== 2) return comparisonLoss(progress);
  const probability = 0.08 + 0.87 * Math.max(0, Math.min(1, confident));
  return {
    probability,
    loss: -Math.log(probability),
  };
}
export function evaluationState(beat, progress) {
  const seconds = bounded(progress) * [16.75, 12.166, 14.382][beat],
    current = beat === 0 ? 0 : beat === 1 ? Number(seconds >= 6) : 1,
    reviewed = beat > 1 || (beat === 1 && seconds >= 8.5375);
  const pairs = CONTROLLED_CASES.map((row) => ({
    ...row,
    answers: row.preferred === 0 ? [row.good, row.bad] : [row.bad, row.good],
    counts: [wordCount(row.good), wordCount(row.bad)],
    shortcutChoice: 0,
    updatedChoice: row.preferred,
  }));
  return {
    seconds,
    current,
    reviewed,
    pairs,
    train: SHORTCUT_PAIRS.map((row) => ({
      ...row,
      counts: [wordCount(row.chosen), wordCount(row.other)],
    })),
    shortcutCorrect: pairs.filter((row) => row.shortcutChoice === row.preferred).length,
    updatedCorrect: pairs.filter((row) => row.updatedChoice === row.preferred).length,
  };
}
export function introState(beat, progress) {
  const seconds = bounded(progress) * [17.782, 17.926, 11.31][beat];
  return {
    seconds,
    replies: beat > 0 ? 2 : Number(seconds >= 1.5625) + Number(seconds >= 5.4625),
    chosen: beat > 1 || (beat === 1 && seconds >= 2.3875),
    clear: beat < 2 ? 0 : bounded((seconds - 3.6) / 2.85),
    detour: beat < 2 ? 0 : bounded((seconds - 6.975) / 2.6),
  };
}
export function methodState(beat, progress) {
  const seconds = bounded(progress) * [17.782, 13.462, 12.942][beat];
  return {
    seconds,
    pairs: beat > 0 || seconds >= 1.7375,
    ratios: beat > 0 || seconds >= 4.5,
    dpoUpdate: beat > 0 || seconds >= 10,
    rollouts: beat > 1 || (beat === 1 && seconds >= 4.725),
    reward: beat > 1 || (beat === 1 && seconds >= 6.8875),
    ppoUpdate: beat > 1 || (beat === 1 && seconds >= 8.9),
    laterPair: beat === 2 && seconds >= 4.8625,
  };
}
export function alignmentFreshStep(progress = 1) {
  const start = [0.3, 0.1, 0.6],
    logits = start.map(Math.log),
    beta = 0.5,
    margin = Math.log(start[0] / start[2]),
    comparison = sigmoid(beta * margin),
    g = beta * (comparison - 1),
    gradient = [g, 0, -g],
    updated = logits.map((v, i) => v - 0.4 * gradient[i] * prefBound(progress)),
    probabilities = alignmentSoftmax(updated),
    afterMargin = updated[0] - updated[2];
  return {
    start,
    logits,
    beta,
    margin,
    comparison,
    gradient,
    updated,
    probabilities,
    beforeLoss: prefLoss(beta * margin),
    loss: prefLoss(beta * afterMargin),
  };
}
export function alignmentMissingPair(progress = 0) {
  const q = prefBound(progress),
    probabilities = [prefLerp(0.4, 0.08, q), prefLerp(0.1, 0.02, q), prefLerp(0.5, 0.9, q)];
  const odds = probabilities[0] / probabilities[1],
    margin = Math.log(odds);
  return {
    probabilities,
    odds,
    margin,
    loss: prefLoss(0.1 * margin),
  };
}
export function alignmentFreshFrame({
  beat = 0,
  stepProgress = 0,
  gradientHeard = false,
  probabilitiesHeard = [false, false, false],
  lossHeard = false,
} = {}) {
  return {
    model: alignmentFreshStep(beat === 0 ? 0 : beat === 1 ? stepProgress : 1),
    showGradient: beat === 1 && gradientHeard,
    showProbabilities: probabilitiesHeard.map((v) => beat >= 2 && v),
    showTotal: beat >= 2 && probabilitiesHeard.every(Boolean),
    showLoss: beat >= 2 && lossHeard,
  };
}

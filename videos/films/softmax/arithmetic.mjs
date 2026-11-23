import { SOFTMAX_COMPLETED_RESULTS } from './fixtures.mjs';
export const softmaxJacobian = (probabilities) =>
  probabilities.map((pi, i) => probabilities.map((pj, j) => pi * (Number(i === j) - pj)));
export const entropy = (values) =>
  -values.reduce((sum, p) => sum + (p > 0 ? p * Math.log(p) : 0), 0);
export const crossEntropy = (target, predicted) =>
  target.reduce((sum, y, i) => sum + (y > 0 ? -y * Math.log(predicted[i]) : 0), 0);
export function probabilityLossGradient(probabilities, target) {
  const jacobian = softmaxJacobian(probabilities);
  return probabilities.map((_, j) =>
    jacobian.reduce((sum, row, i) => sum + (probabilities[i] - target[i]) * row[j], 0),
  );
}
export function positiveTemperature(logits, temperature) {
  const peak = Math.max(...logits),
    weights = logits.map((z) => Math.exp((z - peak) / temperature)),
    total = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => w / total);
}
export function positionReduction(rows, targets, ignore = -100) {
  let numerator = 0,
    count = 0;
  const losses = rows.map((row, i) => {
    if (targets[i] === ignore) return 0;
    count++;
    const v = lossTrace(row, targets[i]).loss;
    numerator += v;
    return v;
  });
  return {
    losses,
    numerator,
    count,
    mean: count ? numerator / count : null,
    updateAllowed: count > 0,
  };
}
export function onlineLogSumExp(tiles) {
  let maximum = -Infinity,
    total = 0;
  return tiles.map((values) => {
    const peak = Math.max(...values),
      tileTotal = values.reduce((sum, z) => sum + Math.exp(z - peak), 0),
      next = Math.max(maximum, peak),
      retained = total * Math.exp(maximum - next),
      incoming = tileTotal * Math.exp(peak - next);
    maximum = next;
    total = retained + incoming;
    return {
      values,
      peak,
      tileTotal,
      maximum,
      total,
      retained,
      incoming,
      logSumExp: maximum + Math.log(total),
    };
  });
}
export const bound = (p) => Math.max(0, Math.min(1, p));
export const phase = (p, a = 0.08, b = 0.88) => bound((p - a) / (b - a));
export const cue = (cues, id, fallback) => cues?.[id]?.progress ?? fallback;
export const begun = (cues, id, fallback) =>
  cues?.[id]
    ? SOFTMAX_COMPLETED_RESULTS.has(id)
      ? cues[id].progress === 1
      : cues[id].phase !== 'before'
    : fallback;
export function lossTrace(logits, target) {
  const max = Math.max(...logits),
    weights = logits.map((z) => Math.exp(z - max));
  const total = weights.reduce((a, b) => a + b, 0),
    probabilities = weights.map((w) => w / total);
  return {
    max,
    weights,
    total,
    probabilities,
    gap: max - logits[target],
    logTotal: Math.log(total),
    loss: max - logits[target] + Math.log(total),
  };
}

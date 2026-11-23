import { COSTS, DELAY_FIXTURE, HISTOGRAM_LABELS } from './fixtures.mjs';
export const MSE = (values) =>
  values.reduce((sum, value, index) => sum + (DELAY_FIXTURE.actual[index] - value) ** 2, 0) /
  values.length;
export const sigmoid = (value) => 1 / (1 + Math.exp(-value));
export const expectedCost = ({ risk, missCost, alert }) =>
  alert ? (1 - risk) * COSTS.falseAlarm : risk * missCost;
export const betterPolicy = (left, right) =>
  left.cost < right.cost || (left.cost === right.cost && left.threshold < right.threshold)
    ? left
    : right;
export const phase = (p, start, end) => Math.max(0, Math.min(1, (p - start) / (end - start)));
export const policyCost = ({ falseAlarms, missedStandard = 0, missedPriority = 0 }) =>
  falseAlarms * COSTS.falseAlarm +
  missedStandard * COSTS.standardMiss +
  missedPriority * COSTS.priorityMiss;
export function tracePrefix(points, progress) {
  const lengths = points
    .slice(1)
    .map((point, index) => Math.hypot(point.x - points[index].x, point.y - points[index].y));
  let remaining =
    lengths.reduce((sum, length) => sum + length, 0) * Math.max(0, Math.min(1, progress));
  const result = [points[0]];
  for (let index = 0; index < lengths.length; index += 1) {
    const start = points[index],
      end = points[index + 1],
      length = lengths[index];
    if (remaining >= length) {
      result.push(end);
      remaining -= length;
    } else {
      const fraction = length ? remaining / length : 0;
      result.push({
        x: start.x + (end.x - start.x) * fraction,
        y: start.y + (end.y - start.y) * fraction,
      });
      break;
    }
  }
  return result;
}
export function splitConstruction(labels = HISTOGRAM_LABELS, lambda = 1, gamma = 0) {
  const rows = labels.map((label, i) => ({
    id: 'R' + (i + 1),
    bin: i + 1,
    label,
    p: 0.5,
    g: 0.5 - label,
    h: 0.25,
  }));
  const sum = (rows, key) => rows.reduce((n, row) => n + row[key], 0);
  const G = sum(rows, 'g'),
    H = sum(rows, 'h');
  const cuts = rows.slice(1).map((_, i) => {
    const cut = i + 1,
      left = rows.slice(0, cut),
      right = rows.slice(cut),
      GL = sum(left, 'g'),
      HL = sum(left, 'h'),
      GR = G - GL,
      HR = H - HL;
    const rawGain =
      0.5 * (GL ** 2 / (HL + lambda) + GR ** 2 / (HR + lambda) - G ** 2 / (H + lambda));
    return {
      cut,
      GL,
      HL,
      GR,
      HR,
      rawGain,
      gamma,
      gain: rawGain - gamma,
      leftWeight: -GL / (HL + lambda),
      rightWeight: -GR / (HR + lambda),
    };
  });
  const best = cuts.reduce((a, b) => (a.gain >= b.gain ? a : b));
  return {
    rows,
    G,
    H,
    lambda,
    gamma,
    cuts,
    best: best.gain > 0 ? best : null,
  };
}
export const sliceResult = (positives, caught, minimumRecall, minimumPositives = 10) => ({
  positives,
  caught,
  recall: positives ? caught / positives : null,
  passed: positives >= minimumPositives && caught / positives >= minimumRecall,
});
export const twoFeatureCredits = ([empty, A, B, AB]) => ({
  base: empty,
  A: (A - empty + (AB - B)) / 2,
  B: (B - empty + (AB - A)) / 2,
  output: AB,
});
export const boostClamp = (p) => Math.max(0, Math.min(1, p));

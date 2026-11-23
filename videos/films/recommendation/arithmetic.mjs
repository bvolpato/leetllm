import { documents } from './fixtures.mjs';

export const rankScore = (item) => 2 * item.queryFit + 0.6 * item.reliability;
export const dcg = (grades) =>
  grades.reduce((sum, grade, rank) => sum + (2 ** grade - 1) / Math.log2(rank + 2), 0);
export const localNdcg = (grades) => dcg(grades) / dcg([...grades].sort((a, b) => b - a));
export const recallLimitFor = (progress) => (progress > 0.05 ? 5 : 3);
export const localMetricsRevealFor = (beat, progress) =>
  beat < 2 ? 0 : beat > 2 ? 1 : Math.max(0, Math.min(1, (progress - 0.02) / 0.2));
export const dot = (left, right) =>
  left.reduce((sum, value, index) => sum + value * right[index], 0);
export const correctedRate = (row) => row.clicks / row.impressions / row.propensity;
export function reciprocalPrecision(
  grades,
  {
    cutoff = grades.length,
    threshold = 2,
    target = 3,
    totalRelevant = grades.filter((g) => g >= threshold).length,
    fullDenominator = false,
  } = {},
) {
  let count = 0;
  const terms = [];
  for (let i = 0; i < Math.min(cutoff, grades.length); i++) {
    if (grades[i] >= threshold) {
      count++;
      terms.push({
        rank: i + 1,
        relevantSeen: count,
        value: count / (i + 1),
      });
    }
  }
  const index = grades.slice(0, cutoff).findIndex((g) => g >= target),
    denominator = fullDenominator ? totalRelevant : Math.min(totalRelevant, cutoff);
  return {
    rr: index < 0 ? 0 : 1 / (index + 1),
    terms,
    denominator,
    ap: denominator ? terms.reduce((s, t) => s + t.value, 0) / denominator : 0,
  };
}
export function crossVectorState(x0 = [2, 3], xl = [5, 7], weights = [1, 0], bias = [0.5, 1]) {
  const projection = dot(xl, weights),
    cross = x0.map((v) => v * projection),
    result = cross.map((v, i) => v + bias[i] + xl[i]);
  return {
    x0,
    xl,
    weights,
    bias,
    projection,
    cross,
    result,
  };
}
export function crossMatrixState(
  x0 = [2, 3],
  xl = [5, 7],
  matrix = [
    [1, 0],
    [0, 1],
  ],
  bias = [0.5, 1],
) {
  const projection = matrix.map((row) => dot(row, xl)),
    inside = projection.map((v, i) => v + bias[i]),
    cross = inside.map((v, i) => v * x0[i]),
    result = cross.map((v, i) => v + xl[i]);
  return {
    x0,
    xl,
    matrix,
    bias,
    projection,
    inside,
    cross,
    result,
  };
}
export function rankNetStep(
  preferred = [0.98, 0.88],
  other = [0.35, 0.97],
  weights = [0, 0],
  rate = 0.5,
  metricWeight = 1,
) {
  const difference = preferred.map((v, i) => v - other[i]),
    gap = dot(weights, difference),
    probability = 1 / (1 + Math.exp(-gap)),
    derivative = (probability - 1) * metricWeight,
    gradient = difference.map((v) => v * derivative),
    next = weights.map((v, i) => v - rate * gradient[i]);
  return {
    preferred,
    other,
    difference,
    weights,
    gap,
    probability,
    derivative,
    gradient,
    rate,
    next,
    nextGap: dot(next, difference),
    loss: Math.log1p(Math.exp(-gap)),
    nextLoss: Math.log1p(Math.exp(-dot(next, difference))),
  };
}
export function metricSwapState(
  grades = [0, 2, 3, 0, 2],
  first = 2,
  second = 0,
  { gap = 0, sigma = 1 } = {},
) {
  const changed = [...grades];
  [changed[first], changed[second]] = [changed[second], changed[first]];
  const idcg = dcg([...grades].sort((a, b) => b - a)),
    before = dcg(grades),
    after = dcg(changed),
    delta = idcg ? Math.abs(after - before) / idcg : 0,
    preferredDerivative = (-sigma / (1 + Math.exp(sigma * gap))) * delta;
  return {
    grades,
    changed,
    first,
    second,
    idcg,
    before,
    after,
    delta,
    preferredDerivative,
    otherDerivative: -preferredDerivative,
  };
}
export function listDistributionStep(target = [0.7, 0.3], scores = [0, 0], rate = 0.5) {
  const max = Math.max(...scores),
    exp = scores.map((v) => Math.exp(v - max)),
    sum = exp.reduce((a, b) => a + b, 0),
    predicted = exp.map((v) => v / sum),
    gradient = predicted.map((v, i) => v - target[i]),
    next = scores.map((v, i) => v - rate * gradient[i]),
    loss = -target.reduce((s, v, i) => s + v * Math.log(predicted[i]), 0);
  return {
    target,
    scores,
    exp,
    sum,
    predicted,
    gradient,
    rate,
    next,
    loss,
  };
}
export function examinationState({
  clicks = 40,
  impressions = 100,
  probability = 1,
  cap = Infinity,
  relevance = 0.4,
} = {}) {
  const raw = clicks / impressions,
    supported = probability > 0;
  return {
    clicks,
    impressions,
    probability,
    cap,
    relevance,
    raw,
    supported,
    corrected: supported ? raw / probability : null,
    weight: supported ? Math.min(1 / probability, cap) : null,
    expected: supported ? Math.min(1 / probability, cap) * probability * relevance : null,
  };
}
export const sourceIdentity = (id) =>
  documents.find((page) => page.id === id)?.source ?? 'community';
export function eventIntegrity(impressions, outcomes) {
  const seen = new Set(impressions.map((r) => JSON.stringify([r.request, r.document]))),
    ids = outcomes.map((r) => r.id);
  return {
    join: outcomes.every((r) => seen.has(JSON.stringify([r.request, r.document]))),
    unique: new Set(ids).size === ids.length,
    orphans: outcomes.filter((r) => !seen.has(JSON.stringify([r.request, r.document]))),
    duplicateIds: ids.filter((id, i) => ids.indexOf(id) < i),
  };
}
export function developerAggregation(
  rows = [
    [1, 1],
    [1, 9],
  ],
) {
  const rates = rows.map(([resolved, total]) => resolved / total);
  return {
    rows,
    rates,
    mean: rates.reduce((s, v) => s + v, 0) / rates.length,
    pooled: rows.reduce((s, r) => s + r[0], 0) / rows.reduce((s, r) => s + r[1], 0),
  };
}
export function lambdaPairLedger(grades = [0, 2, 3, 0, 2]) {
  const pairs = [];
  for (let i = 0; i < grades.length; i++)
    for (let j = 0; j < grades.length; j++)
      if (grades[i] > grades[j]) {
        const m = metricSwapState(grades, i, j),
          values = grades.map((_, k) =>
            k === i ? m.preferredDerivative : k === j ? m.otherDerivative : 0,
          );
        pairs.push({
          preferred: i,
          other: j,
          delta: m.delta,
          values,
        });
      }
  return {
    grades,
    pairs,
    total: grades.map((_, k) => pairs.reduce((sum, p) => sum + p.values[k], 0)),
  };
}

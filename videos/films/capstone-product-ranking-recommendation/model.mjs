import { clip, dcg, sum } from './arithmetic.mjs';
import { ORDERING_PRODUCTS, catalog, exposureProducts, rankingFeatures } from './fixtures.mjs';
import { TRAINING_PAIRS } from './training-data.mjs';
export function relevantRecall(kept, products = ORDERING_PRODUCTS, minGrade = 2) {
  const relevantIds = products.filter((row) => row.grade >= minGrade).map((row) => row.id);
  const retainedRelevantIds = relevantIds.filter((id) => kept.includes(id));
  const numerator = retainedRelevantIds.length,
    denominator = relevantIds.length;
  return {
    minGrade,
    relevantIds,
    retainedRelevantIds,
    numerator,
    denominator,
    value: denominator ? numerator / denominator : null,
  };
}
export function update(w) {
  const d = [-0.1, 0.6],
    margin = sum(w.map((v, i) => v * d[i]));
  return w.map((v, i) => v + (0.4 * d[i]) / (1 + Math.exp(margin)));
}
export function rankingResponse(updates = 12) {
  let weights = [1, 0];
  for (let i = 0; i < updates; i++) weights = update(weights);
  const slate = catalog
    .filter((row) => row.ok)
    .map((row) => ({
      id: row.id,
      score: sum(rankingFeatures[row.id].map((value, i) => value * weights[i])),
    }))
    .sort((a, b) => b.score - a.score)
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
  return {
    request: 'R42',
    query: 'label printer',
    model: 'pairwise-v1',
    policy: 'policy-v7',
    assignment: 'B',
    weights,
    slate,
  };
}
export function exposureFrame(progress = 1) {
  const events = [];
  for (let cohort = 0; cohort < 10; cohort++)
    for (const row of exposureProducts) {
      if (cohort < row.cohorts)
        for (let column = 0; column < 10; column++) {
          events.push({
            id: row.id,
            cohort,
            column,
            clicked: column < row.clicksPerCohort,
          });
        }
    }
  const observed = events.slice(0, Math.ceil(events.length * clip(progress)));
  return exposureProducts.map((row) => {
    const impressions = observed.filter((event) => event.id === row.id),
      clicks = impressions.filter((event) => event.clicked).length;
    const equalExposure = impressions.filter((event) => event.cohort === 0);
    return {
      id: row.id,
      events: impressions,
      impressions: impressions.length,
      clicks,
      rate: impressions.length ? clicks / impressions.length : null,
      equalImpressions: equalExposure.length,
      equalClicks: equalExposure.filter((event) => event.clicked).length,
    };
  });
}
export function meanPairGradient(weights, penalty = 0, pairs = TRAINING_PAIRS) {
  const gradient = weights.map((value) => penalty * value);
  for (const pair of pairs) {
    const margin = sum(pair.difference.map((value, i) => value * weights[i])),
      probability =
        margin >= 0 ? Math.exp(-margin) / (1 + Math.exp(-margin)) : 1 / (1 + Math.exp(margin));
    for (let j = 0; j < gradient.length; j++)
      gradient[j] -= (pair.difference[j] * probability) / pairs.length;
  }
  return gradient;
}
export function fitPairwise(penalty = 0.1, steps = 600) {
  let weights = [0, 0];
  const history = [weights];
  for (let i = 0; i < steps; i++) {
    const gradient = meanPairGradient(weights, penalty);
    weights = weights.map((value, j) => value - 0.3 * gradient[j]);
    history.push(weights);
  }
  return {
    weights,
    history,
  };
}
export function evaluatedRanking(request, weights) {
  const rows = request.products
    .map(([id, x, y, grade]) => ({
      id,
      x,
      y,
      grade,
      score: x * weights[0] + y * weights[1],
    }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return {
    rows,
    ndcg:
      dcg(rows.map((r) => r.grade)) /
      dcg([...rows].sort((a, b) => b.grade - a.grade).map((r) => r.grade)),
  };
}
export function diversifiedPair(progress = 1) {
  return [
    {
      id: 'P6',
      relevance: 0.84,
      similarity: 0.9,
    },
    {
      id: 'P4',
      relevance: 0.45,
      similarity: 0.1,
    },
  ].map((row) => ({
    ...row,
    positive: 0.6 * row.relevance,
    subtracted: 0.4 * row.similarity * clip(progress),
    value: 0.6 * row.relevance - 0.4 * row.similarity * clip(progress),
  }));
}
export function weightedClickExpectation(examination, relevance, progress, cap = null) {
  const inverse = 1 / examination,
    target = cap === null ? inverse : Math.min(inverse, cap),
    start = cap === null ? 1 : inverse;
  const weight = start + (target - start) * clip(progress);
  return {
    weight,
    raw: examination * relevance,
    weighted: examination * relevance * weight,
  };
}
export function buildCurrentSlate(rows, limit = 3, cap = 2) {
  const selected = [],
    sellers = new Map();
  for (const row of [...rows].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))) {
    if (!row.stock || !row.allowed || (sellers.get(row.seller) ?? 0) >= cap) continue;
    selected.push(row);
    sellers.set(row.seller, (sellers.get(row.seller) ?? 0) + 1);
    if (selected.length === limit) break;
  }
  return selected;
}

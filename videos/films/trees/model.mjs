import { grow, mean, predict, totalCost } from './arithmetic.mjs';
import { boost, rows, stump, targets, validationRows } from './fixtures.mjs';

export const fittedStump = grow(rows, 1);

export function policyCosts(model, threshold = 0.5, data = validationRows, missPrice = 120) {
  return data.map((row, i) => {
    const score = predict(model, row);
    const review = score >= threshold;
    const cost = review ? (row[2] ? 0 : 18) : row[2] ? missPrice : 0;
    return { id: 'V' + (i + 1), row, score, review, cost };
  });
}

export function stumpBill(threshold, missPrice) {
  const entries = policyCosts(fittedStump, threshold, validationRows, missPrice);
  return {
    threshold,
    entries,
    queued: entries.filter((entry) => entry.review).length,
    extra: entries.filter((entry) => entry.review && !entry.row[2]).length,
    misses: entries.filter((entry) => !entry.review && entry.row[2]).length,
    total: totalCost(entries),
  };
}

export function residualStep(round, amount) {
  const previous = boost[round];
  const residuals = targets.map((value, i) => value - previous[i]);
  const leaves = [mean(residuals.slice(0, 2)), residuals[2]];
  const prediction = previous.map((value, i) => value + 0.1 * leaves[i < 2 ? 0 : 1] * amount);
  return { round, previous, residuals, leaves, amount, prediction };
}

export function boostingFrame(beat, progress) {
  const phase = (a, z) => Math.max(0, Math.min(1, (progress - a) / (z - a)));
  const round = beat < 2 ? 0 : Math.min(11, Math.floor(phase(0.08, 0.75) * 11));
  const amount = beat === 0 ? 0 : beat === 1 ? phase(0.55, 0.8) : 1;
  return {
    ...residualStep(round, amount),
    learnerReady: beat > 1 || (beat === 1 && progress >= 0.2),
  };
}

export const sigmoid = (logit) => 1 / (1 + Math.exp(-logit));
function newtonLeaf(group, logit) {
  const probability = sigmoid(logit);
  const residual = group.reduce((sum, row) => sum + row[2] - probability, 0);
  const curvature = group.length * probability * (1 - probability);
  return { group, residual, curvature, step: residual / curvature };
}

const groups = [stump.left, stump.right];
export const firstNewtonLeaves = groups.map((group) => newtonLeaf(group, 0));

// The article's residual search selects this same partition in each of its four rounds.
export function validationAfterBoosting(rounds) {
  let logits = [0, 0];
  for (let r = 0; r < rounds; r++) {
    logits = groups.map((group, i) => logits[i] + 0.1 * newtonLeaf(group, logits[i]).step);
  }
  const scores = validationRows.map((row) =>
    sigmoid(logits[row[stump.feature] <= stump.cut ? 0 : 1]),
  );
  const misses = validationRows.flatMap((row, i) =>
    row[2] && scores[i] < 0.5 ? ['V' + (i + 1)] : [],
  );
  const extra = validationRows.filter((row, i) => !row[2] && scores[i] >= 0.5).length;
  const loss = mean(scores.map((prob, i) => -Math.log(validationRows[i][2] ? prob : 1 - prob)));
  return { loss, misses, cost: 120 * misses.length + 18 * extra };
}

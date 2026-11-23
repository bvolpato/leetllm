import { sigmoid, stableDistribution } from './arithmetic.mjs';
import { dotProduct } from 'vizmatic';
export const training = [
  [1, 1, 0],
  [1.5, 2, 0],
  [2, 3, 1],
  [3.5, 6, 1],
  [4, 7, 1],
  [4.5, 5, 1],
  [2.8, 4, 0],
  [3.2, 8, 0],
];
export const validation = [
  [1.2, 2, 0],
  [2.1, 4, 0],
  [2.4, 3, 1],
  [3, 5, 0],
  [3.6, 4, 1],
  [3.2, 7, 0],
  [4.2, 5, 1],
  [2.8, 6, 1],
];
export function buildTrainingFit() {
  const fitSteps = [[0, 0, 0]];
  for (let i = 0; i < 3000; i++) {
    const w = fitSteps.at(-1),
      g = w.map(
        (_, j) =>
          training.reduce(
            (n, [a, s, y]) => n + (sigmoid(dotProduct(w, [1, a, s])) - y) * [1, a, s][j],
            0,
          ) / training.length,
      );
    fitSteps.push(w.map((v, j) => v - 0.2 * g[j]));
  }
  const fittedWeights = fitSteps.at(-1);
  return {
    fitSteps,
    fittedWeights,
  };
}
export const { fitSteps, fittedWeights } = buildTrainingFit();
export const validationScores = validation.map(([a, s, label], index) => ({
  id: 'V' + (index + 1),
  index,
  a,
  s,
  label,
  p: sigmoid(dotProduct(fittedWeights, [1, a, s])),
}));
export const openingRequest = {
  id: 'REQ-10234',
  text: 'Change team access',
  a: 3,
  s: 5,
  label: 0,
  p: sigmoid(dotProduct(fittedWeights, [1, 3, 5])),
};
export const roundedScore = -4.9 + 3.4 * 3 - 0.96 * 5;
export const pairEvidence = validationScores
  .filter((v) => v.label)
  .flatMap((positive) =>
    validationScores
      .filter((v) => !v.label)
      .map((negative) => ({
        positive,
        negative,
        win: positive.p > negative.p ? 1 : positive.p === negative.p ? 0.5 : 0,
      })),
  );
export const calibrationBins = Array.from(
  {
    length: 4,
  },
  (_, i) => {
    const rows = validationScores.filter((v) => Math.min(3, Math.floor(v.p * 4)) === i);
    return {
      index: i,
      rows,
      forecast: rows.reduce((s, v) => s + v.p, 0) / rows.length,
      observed: rows.reduce((s, v) => s + v.label, 0) / rows.length,
    };
  },
);
export const cells = ['tp', 'fp', 'fn', 'tn'];
export const cellTitles = {
  tp: 'Required review · caught',
  fp: 'Routine · sent to review',
  fn: 'Required review · missed',
  tn: 'Routine · automatic',
};
export function findRegularizedMinimum() {
  let lo = 0,
    hi = 5;
  for (let i = 0; i < 70; i++) {
    const mid = (lo + hi) / 2;
    if (0.2 * mid - sigmoid(-mid) > 0) hi = mid;
    else lo = mid;
  }
  const regularizedMinimum = (lo + hi) / 2;
  return {
    regularizedMinimum,
  };
}
export const { regularizedMinimum } = findRegularizedMinimum();
export const auditProbabilities = [0.061, 0.169, 0.595, 0.624, 0.971, 0.325, 0.99, 0.244];
export const multiclassRows = [
  [1, 1, 8],
  [1, 1.5, 7],
  [1, 2.5, 4],
  [1, 3.2, 5],
  [1, 4.8, 1.5],
  [1, 5, 1],
];
export const multiclassLabels = [0, 0, 1, 1, 2, 2];
export function buildMulticlassFit() {
  const multiclassSteps = [
    Array.from(
      {
        length: 3,
      },
      () => [0, 0, 0],
    ),
  ];
  for (let step = 0; step < 1000; step++) {
    const W = multiclassSteps.at(-1),
      P = multiclassRows.map(
        (x) =>
          stableDistribution([0, 1, 2].map((k) => x.reduce((s, v, j) => s + v * W[j][k], 0)))
            .probabilities,
      ),
      grad = W.map((r, j) =>
        r.map(
          (_, k) =>
            multiclassRows.reduce(
              (sum, x, i) => sum + x[j] * (P[i][k] - Number(multiclassLabels[i] === k)),
              0,
            ) / 6,
        ),
      );
    multiclassSteps.push(W.map((r, j) => r.map((w, k) => w - 0.2 * grad[j][k])));
  }
  return {
    multiclassSteps,
  };
}
export const { multiclassSteps } = buildMulticlassFit();
export function buildPlattFit() {
  const plattFitStates = [[1, 0]];
  for (let step = 0; step < 1000; step++) {
    const [a, b] = plattFitStates.at(-1),
      g = [0, 0];
    for (const row of validationScores) {
      const z = Math.log(row.p / (1 - row.p)),
        residual = sigmoid(a * z + b) - row.label;
      g[0] += (residual * z) / 8;
      g[1] += residual / 8;
    }
    plattFitStates.push([a - 0.1 * g[0], b - 0.1 * g[1]]);
  }
  return {
    plattFitStates,
  };
}
export const { plattFitStates } = buildPlattFit();
export function buildPenalizedFit() {
  const penaltyFitStates = [fittedWeights];
  for (let step = 0; step < 6000; step++) {
    const w = penaltyFitStates.at(-1),
      g = w.map(
        (v, j) =>
          (training.reduce(
            (sum, [a, b, y]) => sum + (sigmoid(dotProduct(w, [1, a, b])) - y) * [1, a, b][j],
            0,
          ) +
            v) /
          8,
      );
    penaltyFitStates.push(w.map((v, j) => v - 0.2 * g[j]));
  }
  const penalizedWeights = penaltyFitStates.at(-1);
  return {
    penaltyFitStates,
    penalizedWeights,
  };
}
export const { penaltyFitStates, penalizedWeights } = buildPenalizedFit();

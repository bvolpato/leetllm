import { logLoss, sigmoid, softplus, stableDistribution } from './arithmetic.mjs';
import {
  auditProbabilities,
  calibrationBins,
  fitSteps,
  fittedWeights,
  multiclassLabels,
  multiclassRows,
  multiclassSteps,
  pairEvidence,
  regularizedMinimum,
  training,
  validation,
  validationScores,
} from './fixtures.mjs';
import { cellFor, cellPosition, clamp, mix, phase, smooth, travelPath } from './construction.mjs';
import assert from 'node:assert/strict';
import { dotProduct } from 'vizmatic';
export const trainingLoss = (w) =>
  training.reduce((sum, [a, s, y]) => sum + logLoss(dotProduct(w, [1, a, s]), y), 0) /
  training.length;
export const countsAt = (t) =>
  validationScores.reduce(
    (c, v) => {
      c[v.p >= t ? (v.label ? 'tp' : 'fp') : v.label ? 'fn' : 'tn']++;
      return c;
    },
    {
      tp: 0,
      fp: 0,
      tn: 0,
      fn: 0,
    },
  );
export const costForCounts = ({ fp, fn }) => 18 * fp + 120 * fn;
export const policyAt = (t) => {
  const counts = countsAt(t);
  return {
    threshold: t,
    counts,
    cost: costForCounts(counts),
    queue: counts.tp + counts.fp,
  };
};
export const policies = [0.8, 0.5, 0.2].map(policyAt);
export function learningConstruction(progress) {
  const completed = Math.min(8, Math.floor(phase(progress, 0.06, 0.62) * 8.001)),
    index = Math.min(7, Math.max(0, completed - 1));
  const [x, y, label] = training[index],
    residual = 0.5 - label,
    contribution = [1, x, y].map((v) => v * residual);
  const sum = [0, 1, 2].map((j) =>
    training.slice(0, completed).reduce((n, [x, y, label]) => n + (0.5 - label) * [1, x, y][j], 0),
  );
  const update = phase(progress, 0.76, 0.9);
  return {
    completed,
    index,
    x,
    y,
    label,
    residual,
    contribution,
    sum,
    gradient: sum.map((v) => v / 8),
    update,
    weights: fitSteps[1].map((v) => v * update),
  };
}
export function confusionFrame(beat, progress, cues = {}) {
  const cue = cues['threshold-sweep-b2-2'];
  const q =
    beat < 1
      ? 0
      : beat > 1
        ? 1
        : cue
          ? cue.phase === 'before'
            ? 0
            : cue.phase === 'after'
              ? 1
              : clamp(cue.progress)
          : clamp(progress);
  return policyAt(0.8 - 0.6 * q);
}
export function routedValidation(progress, threshold = 0.8) {
  return validationScores.map((v, i) => {
    const q = smooth(phase(progress, i / 8, (i + 1) / 8)),
      to = cellPosition(v, threshold),
      from = {
        x: 225 + i * 210,
        y: 335,
      },
      aisle = to.x < 1000 ? 960 : 1800,
      at = travelPath(
        [
          from,
          {
            x: from.x,
            y: 405,
          },
          {
            x: aisle,
            y: 405,
          },
          {
            x: aisle,
            y: to.y + 65,
          },
          {
            x: to.x,
            y: to.y + 65,
          },
          to,
        ],
        q,
      );
    return {
      ...v,
      progress: q,
      ...at,
      cell: to.key,
      arrived: q === 1,
    };
  });
}
export function sweptValidation(progress) {
  const q = clamp(progress);
  return validationScores.map((v) => {
    const from = cellPosition(v, 0.8),
      to = cellPosition(v, 0.2),
      cross = clamp((0.8 - v.p) / 0.6),
      move = from.key === to.key ? 0 : smooth(phase(q, cross, Math.min(1, cross + 0.06))),
      aisle = from.x < 1000 ? 960 : 1800,
      at = travelPath(
        [
          from,
          {
            x: from.x,
            y: 892,
          },
          {
            x: aisle,
            y: 892,
          },
          {
            x: aisle,
            y: to.y + 65,
          },
          {
            x: to.x,
            y: to.y + 65,
          },
          to,
        ],
        move,
      );
    return {
      ...v,
      ...at,
      cell: move === 1 ? to.key : from.key,
      arrived: move === 0 || move === 1,
      moving: move > 0 && move < 1,
    };
  });
}
export function validateModel() {
  assert.equal(sigmoid(0), 0.5);
  assert(Number.isFinite(logLoss(-1000, 1)));
  assert.equal(logLoss(-1000, 1), 1000);
  assert.deepEqual(confusionFrame(1, 1), confusionFrame(2, 0));
  assert.deepEqual(
    policies.map((v) => [v.queue, v.cost]),
    [
      [2, 240],
      [4, 138],
      [6, 36],
    ],
  );
  assert.equal(
    pairEvidence.reduce((n, v) => n + v.win, 0),
    13,
  );
  assert(trainingLoss(fittedWeights) < trainingLoss([0, 0, 0]));
  assert.deepEqual(
    calibrationBins.map((v) => v.rows.length),
    [3, 1, 2, 2],
  );
  assert.equal(calibrationBins[2].observed, 0.5);
  assert(routedValidation(0).every((v) => !v.arrived));
  assert.deepEqual(
    routedValidation(1).map((v) => v.cell),
    validationScores.map((v) => cellFor(v, 0.8)),
  );
  assert.deepEqual(
    sweptValidation(1).map((v) => v.cell),
    validationScores.map((v) => cellFor(v, 0.2)),
  );
  assert(regularizedMinimum > 1 && regularizedMinimum < 1.5);
  validateConstructionModel();
  return true;
}
export function reviewRegionVertices(w, t = 0.5) {
  const level = Math.log(t / (1 - t)),
    value = ({ x, y }) => w[0] + w[1] * x + w[2] * y - level,
    poly = [
      {
        x: 0.5,
        y: 0,
      },
      {
        x: 5,
        y: 0,
      },
      {
        x: 5,
        y: 9,
      },
      {
        x: 0.5,
        y: 9,
      },
    ],
    result = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i],
      b = poly[(i + 1) % poly.length],
      va = value(a),
      vb = value(b),
      insideA = va >= 0,
      insideB = vb >= 0;
    if (insideA) result.push(a);
    if (insideA !== insideB) {
      const p = va / (va - vb);
      result.push({
        x: mix(a.x, b.x, p),
        y: mix(a.y, b.y, p),
      });
    }
  }
  return result;
}
export function boundaryGeometry(weights, point, threshold = 0.5) {
  assert(
    weights.length === point.length + 1 &&
      weights.every(Number.isFinite) &&
      point.every(Number.isFinite),
  );
  assert(threshold > 0 && threshold < 1);
  const beta = weights.slice(1),
    norm = Math.hypot(...beta),
    level = Math.log(threshold / (1 - threshold)),
    logit = dotProduct(weights, [1, ...point]);
  return {
    beta,
    norm,
    level,
    logit,
    probability: sigmoid(logit),
    constant: norm === 0,
    distance: norm ? (logit - level) / norm : null,
    projection: norm ? point.map((v, i) => v - ((logit - level) * beta[i]) / (norm * norm)) : null,
  };
}
export function likelihoodRows(weights = fittedWeights) {
  return training.map(([a, s, y], i) => {
    const z = dotProduct(weights, [1, a, s]),
      p = sigmoid(z),
      selected = y ? p : 1 - p;
    return {
      id: 'R' + (i + 1),
      a,
      s,
      y,
      z,
      p,
      selected,
      loss: logLoss(z, y),
    };
  });
}
export function curvatureFixture(z = -8, y = 1) {
  const p = sigmoid(z),
    residual = p - y;
  return {
    z,
    y,
    p,
    bce: residual,
    squaredError: 2 * residual * p * (1 - p),
    halfSquared: residual * p * (1 - p),
  };
}
export function meanHessian(weights = [0, 0, 0]) {
  const H = Array.from(
    {
      length: 3,
    },
    () => [0, 0, 0],
  );
  for (const [a, s] of training) {
    const x = [1, a, s],
      p = sigmoid(dotProduct(weights, x)),
      factor = (p * (1 - p)) / training.length;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) H[i][j] += factor * x[i] * x[j];
  }
  return H;
}
export function harmonicFixture(tp = 1, fp = 0, fn = 99) {
  assert([tp, fp, fn].every((n) => Number.isInteger(n) && n >= 0));
  const precision = tp + fp ? tp / (tp + fp) : null,
    recall = tp + fn ? tp / (tp + fn) : null,
    den = 2 * tp + fp + fn;
  return {
    tp,
    fp,
    fn,
    precision,
    recall,
    f1: den ? (2 * tp) / den : null,
    arithmetic: precision !== null && recall !== null ? (precision + recall) / 2 : null,
  };
}
export function probabilityCost(p, fp = 18, fn = 120) {
  assert(p >= 0 && p <= 1 && fp > 0 && fn > 0);
  return {
    p,
    automatic: fn * p,
    review: fp * (1 - p),
    cut: fp / (fp + fn),
  };
}
export function expectedPolicy(probabilities, cut, fp, fn, capacity) {
  assert(probabilities.every((p) => p >= 0 && p <= 1));
  const rows = probabilities.map((p, i) => ({
      id: 'N' + (i + 1),
      p,
      review: p >= cut,
      cost: p >= cut ? fp * (1 - p) : fn * p,
    })),
    queue = rows.filter((x) => x.review).length;
  return {
    cut,
    rows,
    queue,
    cost: rows.reduce((s, r) => s + r.cost, 0),
    feasible: queue <= capacity,
  };
}
export function rankingMetrics(rows) {
  const positives = rows.filter((r) => r.label),
    negatives = rows.filter((r) => !r.label),
    pairs = positives.flatMap((p) => negatives.map((n) => (p.p > n.p ? 1 : p.p === n.p ? 0.5 : 0)));
  const sorted = [...rows].sort((a, b) => b.p - a.p),
    groups = [];
  let tp = 0,
    fp = 0,
    previousRecall = 0,
    ap = 0;
  for (let i = 0; i < sorted.length;) {
    const score = sorted[i].p,
      owned = [];
    while (i < sorted.length && sorted[i].p === score) owned.push(sorted[i++]);
    tp += owned.filter((r) => r.label).length;
    fp += owned.filter((r) => !r.label).length;
    const recall = positives.length ? tp / positives.length : null,
      precision = tp / (tp + fp),
      contribution = recall === null ? null : (recall - previousRecall) * precision;
    if (contribution !== null) {
      ap += contribution;
      previousRecall = recall;
    }
    groups.push({
      score,
      rows: owned,
      tp,
      fp,
      recall,
      precision,
      contribution,
    });
  }
  return {
    sorted,
    groups,
    auc: pairs.length ? pairs.reduce((a, b) => a + b, 0) / pairs.length : null,
    ap: positives.length ? ap : null,
    pairWins: pairs.reduce((a, b) => a + b, 0),
    pairCount: pairs.length,
  };
}
export function prevalenceFixture(mode = 'base') {
  const base = validationScores.map((r) => ({
    ...r,
  }));
  let rows = base;
  if (mode === 'repeat')
    rows = base.flatMap((r) =>
      Array.from(
        {
          length: r.label ? 1 : 25,
        },
        (_, i) => ({
          ...r,
          id: r.id + '-' + i,
        }),
      ),
    );
  if (mode === 'easy')
    rows = [
      ...base,
      ...Array.from(
        {
          length: 100,
        },
        (_, i) => ({
          id: 'E' + i,
          p: 0,
          label: 0,
        }),
      ),
    ];
  assert(['base', 'repeat', 'easy'].includes(mode));
  const tp = rows.filter((r) => r.label && r.p >= 0.2).length,
    fp = rows.filter((r) => !r.label && r.p >= 0.2).length,
    negatives = rows.filter((r) => !r.label).length;
  return {
    rows,
    tp,
    fp,
    negatives,
    precision: tp / (tp + fp),
    fpr: fp / negatives,
    ...rankingMetrics(rows),
  };
}
export function calibrationAudit({
  probabilities = auditProbabilities,
  labels = validation.map((r) => r[2]),
  binCount = 4,
} = {}) {
  assert(
    probabilities.length === labels.length &&
      labels.length > 0 &&
      Number.isInteger(binCount) &&
      binCount > 0,
  );
  const bins = Array.from(
    {
      length: binCount,
    },
    (_, i) => {
      const rows = probabilities.flatMap((p, j) =>
          Math.min(binCount - 1, Math.floor(p * binCount)) === i
            ? [
                {
                  id: 'V' + (j + 1),
                  p,
                  label: labels[j],
                },
              ]
            : [],
        ),
        n = rows.length,
        forecast = n ? rows.reduce((s, r) => s + r.p, 0) / n : null,
        observed = n ? rows.reduce((s, r) => s + r.label, 0) / n : null;
      return {
        index: i,
        rows,
        n,
        forecast,
        observed,
        gap: n ? Math.abs(forecast - observed) : 0,
        contribution: n ? (n / probabilities.length) * Math.abs(forecast - observed) : 0,
      };
    },
  );
  const tp = probabilities.filter((p, i) => p >= 0.5 && labels[i]).length,
    fp = probabilities.filter((p, i) => p >= 0.5 && !labels[i]).length,
    fn = probabilities.filter((p, i) => p < 0.5 && labels[i]).length;
  return {
    bins,
    ece: bins.reduce((s, r) => s + r.contribution, 0),
    brier: probabilities.reduce((s, p, i) => s + (p - labels[i]) ** 2, 0) / labels.length,
    f1: harmonicFixture(tp, fp, fn).f1,
  };
}
export function isotonicFixture() {
  const sorted = auditProbabilities
      .map((p, i) => ({
        id: 'V' + (i + 1),
        p,
        label: validation[i][2],
      }))
      .sort((a, b) => a.p - b.p),
    blocks = [];
  for (const row of sorted) {
    blocks.push({
      rows: [row],
      sum: row.label,
      count: 1,
    });
    while (
      blocks.length > 1 &&
      blocks.at(-2).sum / blocks.at(-2).count > blocks.at(-1).sum / blocks.at(-1).count
    ) {
      const b = blocks.pop(),
        a = blocks.pop();
      blocks.push({
        rows: [...a.rows, ...b.rows],
        sum: a.sum + b.sum,
        count: a.count + b.count,
      });
    }
  }
  return sorted.map((r) => {
    const block = blocks.find((b) => b.rows.some((x) => x.id === r.id));
    return {
      ...r,
      mapped: block.sum / block.count,
    };
  });
}
export function multiclassSnapshot(step = 1000) {
  assert(Number.isInteger(step) && step >= 0 && step <= 1000);
  const W = multiclassSteps[step],
    rows = multiclassRows.map((x, i) => {
      const logits = [0, 1, 2].map((k) => x.reduce((s, v, j) => s + v * W[j][k], 0)),
        distribution = stableDistribution(logits);
      return {
        id: 'M' + (i + 1),
        x,
        label: multiclassLabels[i],
        logits,
        ...distribution,
        loss: distribution.lossFor(multiclassLabels[i]),
      };
    });
  return {
    W,
    rows,
    loss: rows.reduce((s, r) => s + r.loss, 0) / 6,
  };
}
export function marginFixture(score = 0.4, label = 1) {
  assert(label === 1 || label === -1);
  const margin = label * score;
  return {
    score,
    label,
    margin,
    hinge: Math.max(0, 1 - margin),
    logistic: softplus(-margin),
  };
}
export function gpFixture(
  distance,
  { lengthScale = 1, observation = 2, noiseVariance = 0.04 } = {},
) {
  assert(Number.isFinite(distance) && lengthScale > 0 && noiseVariance >= 0);
  const similarity = Math.exp(-(distance ** 2) / (2 * lengthScale ** 2)),
    mean = (observation * similarity) / (1 + noiseVariance),
    latentVariance = 1 - similarity ** 2 / (1 + noiseVariance);
  return {
    distance,
    similarity,
    mean,
    latentVariance,
    latentStd: Math.sqrt(latentVariance),
    observationVariance: latentVariance + noiseVariance,
  };
}
export function freshPolicyVisibility(cues = {}) {
  const complete = (id) => (cues[id] ?? 0) === 1;
  return {
    ready: ['lr-new-low-selection', 'lr-new-mid-queue', 'lr-new-high-selection'].map(complete),
    bills: ['lr-new-low-policy', 'lr-new-mid-total', 'lr-new-high-policy'].map(complete),
    selected: complete('lr-new-selected-policy'),
  };
}
export function validateConstructionModel() {
  const g = boundaryGeometry([1, 3, -4], [2, 1], 0.5);
  assert.equal(g.distance, 0.6);
  assert(Math.abs(dotProduct([1, 3, -4], [1, ...g.projection])) < 1e-12);
  assert.equal(boundaryGeometry([1, 0, 0], [2, 1]).constant, true);
  const rows = likelihoodRows();
  assert(Math.abs(rows.reduce((s, r) => s + r.loss, 0) / 8 - trainingLoss(fittedWeights)) < 1e-12);
  assert(
    Math.abs(
      -Math.log(rows.reduce((s, r) => s * r.selected, 1)) / 8 - trainingLoss(fittedWeights),
    ) < 1e-12,
  );
  assert(
    Math.abs(curvatureFixture().bce) > 0.99 && Math.abs(curvatureFixture().squaredError) < 0.001,
  );
  assert.equal(harmonicFixture().f1, 2 / 101);
  assert.equal(harmonicFixture(0, 0, 0).f1, null);
  assert.deepEqual(
    ['base', 'repeat', 'easy'].map((mode) => prevalenceFixture(mode).pairCount),
    [16, 400, 416],
  );
  assert.equal(prevalenceFixture().auc, 13 / 16);
  assert.equal(prevalenceFixture('repeat').auc, 13 / 16);
  assert(Math.abs(prevalenceFixture('easy').auc - 413 / 416) < 1e-12);
  assert.equal(calibrationAudit().ece, 0.138625);
  assert(
    Math.abs(
      calibrationAudit({
        binCount: 8,
      }).ece - 0.153875,
    ) < 1e-12,
  );
  assert(Math.abs(multiclassSnapshot().loss - 0.005544710386468574) < 1e-12);
  assert.equal(stableDistribution([1000, 0, -1000]).lossFor(2), 2000);
  assert.equal(marginFixture(1.4).hinge, 0);
  assert.equal(gpFixture(0).similarity, 1);
  const fresh = [0.1, 0.3, 0.6].map((t) => expectedPolicy([0.05, 0.18, 0.45, 0.75], t, 12, 108, 2));
  assert.deepEqual(
    fresh.map((x) => x.queue),
    [3, 2, 1],
  );
  assert.deepEqual(
    fresh.map((x) => Number(x.cost.toFixed(2))),
    [24.84, 34.44, 76.44],
  );
  return true;
}
export function softplusNegative(x) {
  return softplus(-x);
}
export function gradientTrajectory(rate, steps) {
  const states = [
    {
      step: 0,
      weights: [0, 0, 0],
      loss: trainingLoss([0, 0, 0]),
    },
  ];
  for (let i = 0; i < steps; i++) {
    const w = states.at(-1).weights,
      g = w.map(
        (_, j) =>
          training.reduce(
            (s, [a, b, y]) => s + (sigmoid(dotProduct(w, [1, a, b])) - y) * [1, a, b][j],
            0,
          ) / 8,
      ),
      next = w.map((v, j) => v - rate * g[j]);
    states.push({
      step: i + 1,
      weights: next,
      loss: trainingLoss(next),
    });
  }
  return states;
}

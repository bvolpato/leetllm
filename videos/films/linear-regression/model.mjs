import {
  average,
  clamp,
  meanX,
  optimum,
  phase,
  quadratic,
  smooth,
  varianceX,
} from './arithmetic.mjs';
import { data, oversizedRate, stableRate, testRequests } from './fixtures.mjs';
import { cueEmphasis, directed, finished } from './construction.mjs';
import assert from 'node:assert/strict';
import { dotProduct } from 'vizmatic';
export const predict = (x, b = optimum.intercept, m = optimum.slope) => b + m * x;
export const mse = (b, m) =>
  data.reduce((sum, v) => sum + (predict(v.x, b, m) - v.y) ** 2, 0) / data.length;
export const gradientAt = (b, m) => {
  const errors = data.map((row) => predict(row.x, b, m) - row.y);
  return {
    intercept: 2 * average(errors),
    slope:
      (2 *
        dotProduct(
          errors,
          data.map((row) => row.x),
        )) /
      data.length,
  };
};
export const optimizePath = (initial, learningRate, steps) => {
  const states = [
    {
      ...initial,
      loss: mse(initial.intercept, initial.slope),
    },
  ];
  for (let step = 0; step < steps; step++) {
    const current = states.at(-1),
      gradient = gradientAt(current.intercept, current.slope);
    const intercept = current.intercept - learningRate * gradient.intercept;
    const slope = current.slope - learningRate * gradient.slope;
    states.push({
      intercept,
      slope,
      loss: mse(intercept, slope),
    });
  }
  return states;
};
export const stablePath = optimizePath(
  {
    intercept: 0,
    slope: 0,
  },
  stableRate,
  1800,
);
export const secondMoment = average(data.map((row) => row.x ** 2));
export const largestMomentEigenvalue =
  (1 + secondMoment + Math.sqrt((1 - secondMoment) ** 2 + 4 * meanX ** 2)) / 2;
export const stabilityLimit = 1 / largestMomentEigenvalue;
export const steepEigenDirection = {
  intercept: meanX / (largestMomentEigenvalue - 1),
  slope: 1,
};
export const oversizedStart = {
  intercept: optimum.intercept + 5 * steepEigenDirection.intercept,
  slope: optimum.slope + 5 * steepEigenDirection.slope,
};
export const oversizedPath = optimizePath(oversizedStart, oversizedRate, 8);
export const interpolateState = (states, progress) => {
  const position = clamp(progress) * (states.length - 1);
  const index = Math.floor(position),
    fraction = position - index;
  const current = states[index],
    next = states[Math.min(index + 1, states.length - 1)];
  const intercept = current.intercept + (next.intercept - current.intercept) * fraction;
  const slope = current.slope + (next.slope - current.slope) * fraction;
  return {
    intercept,
    slope,
    loss: mse(intercept, slope),
    index,
    fraction,
  };
};
export function fitFrame(state) {
  const beat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  if (beat === 0) {
    const current = stablePath[0],
      gradient = gradientAt(current.intercept, current.slope);
    return {
      beat,
      mode: 'gradient',
      current,
      gradient,
      next: stablePath[1],
      loss: current.loss,
    };
  }
  if (beat === 1) {
    const elapsed = smooth(phase(progress, 0.02, 0.72));
    const descentProgress = (Math.pow(stablePath.length, elapsed) - 1) / (stablePath.length - 1);
    const current = interpolateState(stablePath, descentProgress);
    return {
      beat,
      mode: 'descent',
      current,
      gradient: gradientAt(current.intercept, current.slope),
      loss: current.loss,
    };
  }
  const challenger = interpolateState(oversizedPath, smooth(phase(progress, 0.08, 0.78)));
  return {
    beat,
    mode: 'oversized-rate',
    current: stablePath.at(-1),
    gradient: gradientAt(challenger.intercept, challenger.slope),
    challenger,
    loss: challenger.loss,
  };
}
export function lossFrame(state) {
  const beat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const mean = data.reduce((sum, row) => sum + row.y, 0) / data.length;
  const baselineMix = beat === 1 ? phase(progress, 0.512, 0.72) : 0;
  const intercept = 100 + (mean - 100) * baselineMix,
    slope = 20 * (1 - baselineMix);
  const rows = data.map((row) => {
    const prediction = predict(row.x, intercept, slope),
      residual = row.y - prediction;
    return {
      ...row,
      prediction,
      residual,
      square: residual * residual,
    };
  });
  const visibleCount =
    beat === 0
      ? Math.min(rows.length, Math.floor(phase(progress, 0, 0.25) * rows.length))
      : rows.length;
  const visibleSum = rows.slice(0, visibleCount).reduce((sum, row) => sum + row.square, 0);
  const total = rows.reduce((sum, row) => sum + row.square, 0),
    meanSquare = total / rows.length;
  const baselineTotal = data.reduce((sum, row) => sum + (row.y - mean) ** 2, 0);
  return {
    rows,
    mean,
    intercept,
    slope,
    baselineMix,
    visibleCount,
    visibleSum,
    total,
    meanSquare,
    rootMeanSquare: Math.sqrt(meanSquare),
    rootProgress: beat < 1 ? 0 : beat > 1 ? 1 : phase(progress, 0.303, 0.488),
    baselineTotal,
    baselineMeanSquare: baselineTotal / rows.length,
    fittedMeanSquare: mse(100, 20),
    rSquared: 1 - (mse(100, 20) * rows.length) / baselineTotal,
  };
}
export function projectionFrame(state) {
  const beat = state.beat ?? 0,
    p = clamp(state.beatP ?? 0);
  const count = (a, z) => Math.min(data.length, Math.floor(phase(p, a, z) * (data.length + 0.001)));
  const predictions = beat === 0 ? count(0.06, 0.7) : data.length;
  const residuals = beat === 0 ? 0 : beat === 1 ? count(0.02, 0.17) : data.length;
  const residualBalanced = beat === 0 ? 0 : beat === 1 ? count(0.19, 0.4) : data.length;
  const balanced = beat === 0 ? 0 : beat === 1 ? count(0.43, 0.56) : data.length;
  const rows = data.map((row) => ({
    ...row,
    prediction: predict(row.x),
    residual: row.y - predict(row.x),
    weighted: row.x * (row.y - predict(row.x)),
  }));
  return {
    predictions,
    residuals,
    residualBalanced,
    balanced,
    rows,
    residualSum: rows.slice(0, residualBalanced).reduce((sum, row) => sum + row.residual, 0),
    weightedSum: rows.slice(0, balanced).reduce((sum, row) => sum + row.weighted, 0),
  };
}
export function validateModel() {
  const evidence = interceptEstimatorState();
  assert.ok(Math.abs(evidence.olsVariance - 1.1) < 1e-12);
  assert.ok(Math.abs(evidence.otherVariance - 2.06) < 1e-12);
  assert.ok(Math.abs(average(evidence.olsEstimates) - 100) < 1e-12);
  assert.ok(Math.abs(average(evidence.otherEstimates) - 100) < 1e-12);
  assert.deepEqual(ridgeLine(2), {
    slope: 10,
    intercept: 130,
  });
  assert.deepEqual(lassoLine(80), {
    slope: 0,
    intercept: 160,
  });
  assert.equal(mse(optimum.intercept, optimum.slope), 2.8);
  const r = data.map((v) => v.y - predict(v.x));
  assert.equal(
    r.reduce((a, v) => a + v, 0),
    0,
  );
  assert.equal(
    dotProduct(
      r,
      data.map((v) => v.x),
    ),
    0,
  );
  assert.equal(stablePath[0].intercept, 0);
  assert.equal(stablePath[0].slope, 0);
  assert.ok(Math.abs(stablePath.at(-1).intercept - optimum.intercept) < 1e-6);
  assert.ok(Math.abs(stablePath.at(-1).slope - optimum.slope) < 1e-6);
  assert.ok(
    stablePath.every(
      (entry, index) => index === 0 || entry.loss <= stablePath[index - 1].loss + 1e-10,
    ),
  );
  assert.ok(oversizedRate > stabilityLimit);
  assert.ok(oversizedPath.at(-1).loss > oversizedPath[0].loss);
  assert.ok(data.every((v) => quadratic(v.x) === v.y));
  assert.equal(predict(6), 220);
  assert.deepEqual(
    data.slice(1).map((row, i) => row.y - data[i].y),
    [23, 21, 19, 17],
  );
  assert.equal(quadratic(6) - data.at(-1).y, 15);
  for (const x of [...data.map((row) => row.x), 6]) {
    assert.equal(bendPredict(x, -1), quadratic(x));
    assert.equal(bendPredict(x, 0), predict(x));
  }
  assert.equal(bendPredict(6, -0.5), 216.5);
  assert.deepEqual(
    testScores.map((row) => [row.lineResidual, row.curveResidual]),
    [
      [-1, 6],
      [-6, 1],
    ],
  );
  assert.deepEqual(testMeanSquares, { line: 18.5, curve: 18.5 });
  const gradientStart = fitFrame({
    beat: 0,
    beatP: 0.99,
  });
  const descentStart = fitFrame({
    beat: 1,
    beatP: 0,
  });
  assert.deepEqual([gradientStart.current.intercept, gradientStart.current.slope], [0, 0]);
  assert.deepEqual([descentStart.current.intercept, descentStart.current.slope], [0, 0]);
  assert.deepEqual(gradientStart.gradient, gradientAt(0, 0));
  assert.deepEqual(
    [gradientStart.next.intercept, gradientStart.next.slope],
    [stablePath[1].intercept, stablePath[1].slope],
  );
  const descentEnd = fitFrame({
    beat: 1,
    beatP: 1,
  });
  const oversizedStartFrame = fitFrame({
    beat: 2,
    beatP: 0,
  });
  assert.deepEqual(
    [descentEnd.current.intercept, descentEnd.current.slope],
    [oversizedStartFrame.current.intercept, oversizedStartFrame.current.slope],
  );
  assert.equal(descentEnd.loss, mse(descentEnd.current.intercept, descentEnd.current.slope));
  assert.equal(
    oversizedStartFrame.loss,
    mse(oversizedStartFrame.challenger.intercept, oversizedStartFrame.challenger.slope),
  );
  assert.ok(
    fitFrame({
      beat: 2,
      beatP: 1,
    }).loss > oversizedStartFrame.loss,
  );
  const initial = lossFrame({
      beat: 0,
      beatP: 0,
    }),
    partial = lossFrame({
      beat: 0,
      beatP: 0.11,
    });
  assert.equal(initial.visibleCount, 0);
  assert.equal(partial.visibleCount, 2);
  assert.equal(partial.visibleSum, 5);
  const fitted = lossFrame({
    beat: 1,
    beatP: 0.25,
  });
  assert.deepEqual(
    fitted.rows.map((row) => row.residual),
    [-2, 1, 2, 1, -2],
  );
  assert.deepEqual(
    fitted.rows.map((row) => row.square),
    [4, 1, 4, 1, 4],
  );
  assert.equal(fitted.meanSquare, 2.8);
  assert.equal(fitted.rootProgress, 0);
  assert.equal(
    lossFrame({
      beat: 1,
      beatP: 0.49,
    }).rootProgress,
    1,
  );
  const moving = lossFrame({
    beat: 1,
    beatP: 0.616,
  });
  assert(Math.abs(moving.baselineMix - 0.5) < 1e-12);
  assert(Math.abs(moving.intercept - 130) < 1e-12);
  assert(Math.abs(moving.slope - 10) < 1e-12);
  assert(Math.abs(moving.meanSquare - 202.8) < 1e-9);
  for (const progress of [0.72, 0.85, 0.98]) {
    const baseline = lossFrame({
      beat: 1,
      beatP: progress,
    });
    assert(baseline.rows.every((row) => row.prediction === 160));
    assert.deepEqual(
      baseline.rows.map((row) => row.square),
      [1764, 361, 4, 441, 1444],
    );
    assert.equal(baseline.total, 4014);
    assert.equal(baseline.meanSquare, 802.8);
  }
  const comparison = lossFrame({
    beat: 2,
    beatP: 0.5,
  });
  assert.equal(comparison.meanSquare, 2.8);
  assert.equal(comparison.rSquared, 1 - 14 / 4014);
  return true;
}
export function coefficientFrame(state) {
  const beat = state.beat ?? 0;
  const progress = directed(state, beat === 0 ? 'intercept-update' : 'slope-update', 0.15, 0.6);
  const intercept = beat === 0 ? 85 + 15 * progress : 100;
  const slope = beat === 0 ? 10 : beat === 1 ? 10 + 10 * progress : 20;
  return {
    intercept,
    slope,
    prediction: predict(3, intercept, slope),
    residual: 162 - predict(3, intercept, slope),
    progress,
    active:
      beat < 2 ? cueEmphasis(state, beat === 0 ? 'intercept-update' : 'slope-update', progress) : 0,
  };
}
export function bendFrame(state) {
  const beat = state.beat ?? 0;
  const ridge = beat === 1 ? directed(state, 'curve-ridge', 0.15, 0.5) : 0;
  const lasso = beat === 1 ? directed(state, 'curve-lasso', 0.6, 0.82) : 0;
  const coefficient = beat === 0 ? -directed(state, 'curve-fit', 0.1, 0.7) : -0.5 * (1 - lasso);
  const fitted = beat === 1 && lasso === 0 ? -2.8 / (2.8 + 2.8 * ridge) : coefficient;
  return {
    coefficient: fitted,
    penalty: lasso > 0 ? 'Lasso' : 'Ridge',
    lambda: lasso > 0 ? 2.8 + 2.8 * lasso : 2.8 * ridge,
    predict: (x) => bendPredict(x, fitted),
    trainingMse: 2.8 * (1 + fitted) ** 2,
  };
}
export function heldoutFrame(state) {
  const beat = state.beat ?? 0;
  const second = beat >= 2;
  const row = testScores[second ? 1 : 0];
  const revealed = second
    ? beat > 2 || finished(state, 'test-second', 0.45)
    : beat === 1 && finished(state, 'test-reveal', 0.35);
  const errors =
    beat === 1
      ? directed(state, 'test-errors', 0.4, 0.7)
      : beat === 3
        ? directed(state, 'second-errors', 0.15, 0.45)
        : beat > 3
          ? 1
          : 0;
  return {
    x: row.x,
    line: row.line,
    curve: row.curve,
    observed: revealed ? row.y : null,
    reveal: Number(revealed),
    errors,
    lineResidual: revealed ? row.lineResidual : null,
    curveResidual: revealed ? row.curveResidual : null,
  };
}
export const bendInput = (x) => (x - meanX) ** 2 - varianceX;
export const bendPredict = (x, c) => predict(x) + c * bendInput(x);
export const testScores = testRequests.map(({ x, y }) => {
  const line = predict(x),
    curve = quadratic(x);
  return { x, y, line, curve, lineResidual: y - line, curveResidual: y - curve };
});
export const testMeanSquares = {
  line: average(testScores.map((row) => row.lineResidual ** 2)),
  curve: average(testScores.map((row) => row.curveResidual ** 2)),
};
export function ridgeLine(lambda) {
  const slope = 40 / (2 + lambda);
  return {
    slope,
    intercept: 160 - 3 * slope,
  };
}
export function lassoLine(lambda) {
  const slope = Math.max(0, 40 - lambda / 2) / 2;
  return {
    slope,
    intercept: 160 - 3 * slope,
  };
}
export function eigenStep(rate, steps = 8) {
  const eigenvalues = [12 + Math.sqrt(136), 12 - Math.sqrt(136)];
  return eigenvalues.map((value) => ({
    value,
    multiplier: 1 - rate * value,
    path: Array.from(
      {
        length: steps + 1,
      },
      (_, i) => (1 - rate * value) ** i,
    ),
  }));
}
export function interceptEstimatorState(mix = 1) {
  const ols = [0.8, 0.5, 0.2, -0.1, -0.4],
    nullDirection = [0.4, -0.8, 0.4, 0, 0],
    other = ols.map((v, i) => v + mix * nullDirection[i]);
  const noises = Array.from(
    {
      length: 32,
    },
    (_, mask) =>
      Array.from(
        {
          length: 5,
        },
        (_, i) => (mask & (1 << i) ? 1 : -1),
      ),
  );
  const estimates = (weights) => noises.map((noise) => 100 + dotProduct(weights, noise));
  return {
    ols,
    other,
    olsEstimates: estimates(ols),
    otherEstimates: estimates(other),
    olsVariance: dotProduct(ols, ols),
    otherVariance: dotProduct(other, other),
  };
}

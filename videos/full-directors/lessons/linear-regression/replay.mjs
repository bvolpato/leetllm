import assert from 'node:assert/strict';
import {
  data,
  testRequests,
  stableRate,
  oversizedRate,
} from '../../../films/linear-regression/fixtures.mjs';
import {
  average,
  meanX,
  meanY,
  varianceX,
  optimum,
} from '../../../films/linear-regression/arithmetic.mjs';
import {
  predict,
  mse,
  gradientAt,
  stablePath,
  oversizedPath,
  bendInput,
  bendPredict,
  ridgeLine,
  lassoLine,
  eigenStep,
  stabilityLimit,
  interceptEstimatorState,
} from '../../../films/linear-regression/model.mjs';

export {
  data,
  testRequests,
  stableRate,
  oversizedRate,
  average,
  meanX,
  meanY,
  varianceX,
  optimum,
  predict,
  mse,
  gradientAt,
  stablePath,
  oversizedPath,
  bendInput,
  bendPredict,
  ridgeLine,
  lassoLine,
  eigenStep,
  stabilityLimit,
  interceptEstimatorState,
};
export const sum = (values) => values.reduce((a, b) => a + b, 0);
export const lineAt = (b, m) => (x) => predict(x, b, m);
export const rowsFor = (fn, rows = data) =>
  rows.map(({ x, y }) => {
    const fit = fn(x),
      miss = y - fit;
    return { x, y, fit, miss, area: miss ** 2 };
  });
export const total = (rows) => sum(rows.map((row) => row.area));
export const fitted = rowsFor((x) => predict(x));
export const increments = data.slice(1).map((row, i) => row.y - data[i].y);
export const nextIncrement = increments.at(-1) + increments.at(-1) - increments.at(-2);
export const nextTime = data.at(-1).y + nextIncrement;
export const baseline = rowsFor(() => meanY);
export const trainingR2 = 1 - total(fitted) / total(baseline);
export function train(rows) {
  const a = average(rows.map((r) => r.x)),
    b = average(rows.map((r) => r.y));
  const slope = sum(rows.map((r) => (r.x - a) * (r.y - b))) / sum(rows.map((r) => (r.x - a) ** 2));
  return { intercept: b - slope * a, slope, mean: b };
}
export const four = train(data.slice(0, 4));
export const gram = [
  [data.length, sum(data.map((r) => r.x))],
  [sum(data.map((r) => r.x)), sum(data.map((r) => r.x ** 2))],
];
export const rhs = [sum(data.map((r) => r.y)), sum(data.map((r) => r.x * r.y))];
export const curvature = eigenStep(0)
  .map((r) => r.value)
  .sort((a, b) => a - b);
export function designCost(d, rowFactor) {
  return {
    d,
    entries: d * d,
    mb: (8 * d * d) / 1e6,
    formation: (d / 1000) ** 2 * rowFactor,
    factor: (d / 1000) ** 3,
  };
}
export function penalize(slopeCharge, interceptCharge) {
  const a = gram[0][0] * (1 + interceptCharge),
    b = gram[0][1],
    d = gram[1][1] + data.length * slopeCharge;
  const det = a * d - b * b;
  return { intercept: (rhs[0] * d - b * rhs[1]) / det, slope: (a * rhs[1] - b * rhs[0]) / det };
}
export function duplicates(t) {
  const other = 8 * t,
    first = optimum.slope - 2 * other;
  return { first, other, rows: rowsFor((x) => optimum.intercept + first * x + other * 2 * x) };
}
function duplicateRun(start) {
  let [intercept, first, twice] = start;
  for (let step = 0; step < 10000; step++) {
    const gradient = gradientAt(intercept, first + 2 * twice);
    intercept -= 0.01 * gradient.intercept;
    first -= 0.01 * gradient.slope;
    twice -= 0.01 * 2 * gradient.slope;
  }
  const rows = rowsFor(lineAt(intercept, first + 2 * twice));
  return { start, finish: [intercept, first, twice], rows };
}
export const duplicateRuns = [duplicateRun([0, 0, 0]), duplicateRun([0, 16, -8])];
export const interval = {
  center: predict(6),
  variance: total(fitted) / (data.length - 2),
  leverage: 1 / data.length + (6 - meanX) ** 2 / (data.length * varianceX),
  critical: 3.1824463,
};
export const halfWidth = (individual = 0) =>
  interval.critical * Math.sqrt(interval.variance * (interval.leverage + individual));
export function replays(count) {
  return testRequests.slice(0, count).map((row) => ({
    ...row,
    line: rowsFor((x) => predict(x), [row])[0],
    curve: rowsFor((x) => bendPredict(x, -1), [row])[0],
  }));
}
export const broadcast = data.map(({ y }) => fitted.map(({ fit }) => y - fit));
export const residualShift = (t) => fitted.map((r, i) => r.miss + [1, -2, 1, 0, 0][i] * t);
export function checkReplay() {
  const near = (v, w, eps = 1e-8) => assert.ok(Math.abs(v - w) < eps, `${v} vs ${w}`);
  assert.deepEqual(increments, [23, 21, 19, 17]);
  assert.equal(nextTime, 213);
  assert.deepEqual(
    fitted.map((r) => r.miss),
    [-2, 1, 2, 1, -2],
  );
  assert.deepEqual(
    rowsFor(lineAt(106, 20)).map((r) => r.miss),
    [-8, -5, -4, -5, -8],
  );
  assert.equal(total(fitted), 14);
  assert.equal(total(rowsFor(lineAt(98, 20))), 34);
  assert.deepEqual(
    rowsFor(lineAt(98, 20)).map((r, i) => r.area - fitted[i].area),
    [-4, 8, 12, 8, -4],
  );
  assert.equal(total(baseline), 4014);
  near(trainingR2, 0.996512, 0.000001);
  assert.deepEqual(four, { intercept: 98, slope: 21, mean: 150.5 });
  assert.equal(four.intercept + four.slope * 5, 203);
  assert.equal(four.mean - data[4].y, -47.5);
  assert.deepEqual(gradientAt(0, 0), { intercept: -320, slope: -1040 });
  assert.equal(stablePath[1].intercept, 16);
  assert.equal(stablePath[1].slope, 52);
  near(stablePath.at(-1).loss, 2.8);
  assert.ok(oversizedPath.every((r, i) => i === 0 || r.loss > oversizedPath[i - 1].loss));
  assert.deepEqual(gram, [
    [5, 15],
    [15, 55],
  ]);
  assert.deepEqual(rhs, [800, 2600]);
  const [runA, runB] = duplicateRuns;
  for (const run of duplicateRuns) {
    run.rows.forEach((r, i) => near(r.fit, fitted[i].fit));
    near(2 * run.finish[1] - run.finish[2], 2 * run.start[1] - run.start[2]);
  }
  runA.finish.forEach((v, j) => {
    near(v, [100, 4, 8][j]);
    near(runB.finish[j] - v, runB.start[j] - runA.start[j]);
  });
  for (const t of [0, 0.24, 0.5, 0.99, 1]) {
    duplicates(t).rows.forEach((r, i) => near(r.fit, fitted[i].fit));
    const e = residualShift(t);
    near(sum(e), 0);
    near(sum(e.map((v, i) => v * data[i].x)), 0);
    const rows = rowsFor((x) => bendPredict(x, -t));
    rows.forEach((r, i) => near(r.miss, (1 - t) * fitted[i].miss));
  }
  assert.deepEqual(designCost(2000, 1), { d: 2000, entries: 4e6, mb: 32, formation: 4, factor: 8 });
  assert.equal(designCost(10000, 2).formation, 200);
  assert.equal(designCost(10000, 1).mb, 800);
  near(stabilityLimit, 2 / curvature[1]);
  assert.ok(eigenStep(0.05).every((v) => Math.abs(v.multiplier) < 1));
  assert.ok(eigenStep(0.2).some((v) => Math.abs(v.multiplier) > 1));
  for (const [rate, expected] of [
    [0.05, [0.98, -0.18]],
    [0.2, [0.93, -3.73]],
  ]) {
    assert.deepEqual(
      curvature.map((v) => Number((1 - rate * v).toFixed(2))),
      expected,
    );
  }
  near(Math.sqrt(curvature[1] / curvature[0]), 8.366, 0.002);
  assert.deepEqual(
    data.map((r) => bendInput(r.x)),
    [2, -1, -2, -1, 2],
  );
  assert.deepEqual(
    [0, -0.5, -1].map((c) => bendPredict(6, c)),
    [220, 216.5, 213],
  );
  assert.deepEqual(penalize(2, 0), ridgeLine(2));
  near(penalize(2, 2).slope, 36);
  near(penalize(2, 2).intercept, 52 / 3);
  assert.deepEqual(lassoLine(80), { intercept: 160, slope: 0 });
  const estimates = interceptEstimatorState(1);
  near(average(estimates.otherEstimates), 100);
  near(estimates.olsVariance, 1.1);
  near(estimates.otherVariance, 2.06);
  near(halfWidth(), 7.21, 0.01);
  near(halfWidth(1), 9.96, 0.02);
  assert.equal(broadcast.flat().length, 25);
  assert.deepEqual(
    broadcast.map((r, i) => r[i]),
    fitted.map((r) => r.miss),
  );
  assert.equal(replays(0).length, 0);
  assert.deepEqual(
    replays(2).map((r) => [r.line.miss, r.curve.miss]),
    [
      [-1, 6],
      [-6, 1],
    ],
  );
  for (const kind of ['line', 'curve'])
    assert.equal(average(replays(2).map((r) => r[kind].area)), 18.5);
}

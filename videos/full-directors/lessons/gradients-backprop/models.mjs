import assert from 'node:assert/strict';
export * from '../../../films/gradients-backprop/arithmetic.mjs';
export * from '../../../films/gradients-backprop/fixtures.mjs';
import {
  batchGradientState,
  hiddenStep,
  hiddenUnit,
  latencyExample,
  precisionProbe,
  reluBranchState,
} from '../../../films/gradients-backprop/arithmetic.mjs';
import { validateModel } from '../../../films/gradients-backprop/model.mjs';

export const advance = (weights, gradient, rate) => weights.map((v, i) => v - rate * gradient[i]);
export const pair = (w) => latencyExample([w, w], [1, 1], 5);
export const scalar = (w) => latencyExample([w], [2], 5);
export const response = (rate, n, x = 2) => 0.5 * (1 - 2 * x * x * rate) ** n;
export function seedResult(seed) {
  const rows = [
      [1, 0.5],
      [3, 0.5],
    ],
    weights = [1.3, 1.1];
  const predictions = rows.map((row) => latencyExample(weights, row).prediction);
  const gradient = weights.map((_, j) => rows.reduce((v, row, i) => v + seed[i] * row[j], 0));
  return {
    rows,
    predictions,
    gradient,
    value: predictions.reduce((v, p, i) => v + p * seed[i], 0),
  };
}
export function expanded(count, clone) {
  const addresses = Array.from({ length: count }, (_, i) => (clone ? 1 + i : 0));
  const contributions = addresses.map(() => 2);
  return { addresses, contributions, total: contributions.reduce((a, b) => a + b, 0) };
}
export function checkedBatch() {
  const weights = [1.3, 1.1],
    h = 1e-5;
  return batchGradientState(weights).gradient.map((actual, i) => {
    const evalAt = (d) => batchGradientState(weights.map((w, j) => w + (i === j ? d : 0))).loss;
    return { actual, proposed: actual / 2, measured: (evalAt(h) - evalAt(-h)) / (2 * h) };
  });
}
export function sixWeightSum(weights) {
  const subtotal = (part) => part.reduce((sum, w) => sum + w, 0);
  const sums = [subtotal(weights.slice(0, 3)), subtotal(weights.slice(3))];
  const total = subtotal(sums);
  return { sums, total, loss: total ** 2, adjoint: 2 * total };
}
export function sigmoidPath(a) {
  const b = 1 / (1 + Math.exp(-a));
  return { b, c: 3 * b, derivative: 3 * b * (1 - b) };
}
export const originalHidden = hiddenUnit();
export const fresh = hiddenStep(0.05, 1, 2);
export const copied = hiddenUnit(
  advance(fresh.before.weights, originalHidden.gradient, fresh.rate),
  fresh.before.input,
  fresh.before.target,
);
export const practiceRow = { start: [2, 2], features: [3, 1], target: 7, rate: 0.05 };
export function checkExamples() {
  const near = (x, y, eps = 1e-8) => assert.ok(Math.abs(x - y) < eps, `${x} differs from ${y}`);
  validateModel();
  near(pair(2.9).prediction - 6, -0.2);
  near(pair(2.99).loss, 0.98 ** 2);
  near(response(0.25, 1), -0.5);
  near(response(0.25, 2), 0.5);
  assert.ok(Math.abs(response(0.26, 2)) > 0.5);
  near(scalar(-1).loss, 49);
  near(latencyExample([1.68, 1.84]).loss, 0.04);
  const tied = latencyExample([2, 2]).gradient.reduce((a, b) => a + b, 0);
  const tiedLoss = (w) => latencyExample([w, w]).loss;
  near(tied, (tiedLoss(2.00001) - tiedLoss(1.99999)) / 0.00002);
  near(reluBranchState(-0.5).queueGradient, -6);
  assert.deepEqual(seedResult([-1, 1]).gradient, [2, 0]);
  assert.deepEqual(seedResult([1, 1]).gradient, [4, 1]);
  const view = expanded(3, false),
    clone = expanded(3, true);
  assert.equal(new Set(view.addresses).size, 1);
  assert.equal(new Set(clone.addresses).size, 3);
  near(clone.total, view.total);
  near(clone.total, 6);
  const sumOfClone = (x) => clone.addresses.reduce((sum) => sum + 2 * x + 1, 0);
  near((sumOfClone(1.001) - sumOfClone(0.999)) / 0.002, clone.total);
  const sum = sixWeightSum([1, 1, 1, 1, 1, 1]);
  near(sum.loss, 36);
  near(sum.adjoint, 12);
  for (let i = 0; i < 6; i++) {
    const tilted = (h) =>
      sixWeightSum(Array.from({ length: 6 }, (_, j) => (j === i ? 1 + h : 1))).loss;
    near((tilted(0.001) - tilted(-0.001)) / 0.002, sum.adjoint);
  }
  near(sigmoidPath(2).derivative, (sigmoidPath(2.00001).c - sigmoidPath(1.99999).c) / 0.00002);
  for (const a of [1.5, 1.75, 2]) near(latencyExample([a, 5 - 2 * a]).loss, 0);
  const shallow = batchGradientState([2.1, 0.75]).loss,
    steep = batchGradientState([2.1, 1.25]).loss;
  near(shallow, 0.0109375);
  near(steep, 0.3109375);
  for (const row of checkedBatch()) {
    near(row.measured, row.actual);
    near(row.proposed * 2, row.measured);
  }
  const probe = precisionProbe(true);
  near(probe.upperWeight - probe.lowerWeight, probe.storedSpacing, 1e-16);
  assert.ok(probe.lowerWeight > 3 - 1e-6 && probe.upperWeight < 3 + 1e-6);
  near(probe.lossDifference / 2e-6, probe.slope, 1e-6);
  near(probe.slopeAtStoredSpacing, 4);
  const single = latencyExample([2, 2], [2, 1], 5);
  assert.deepEqual(single.gradient, [4, 2]);
  assert.deepEqual(
    latencyExample(advance([2, 2], single.gradient, 0.1), [2, 1], 5).gradient,
    [0, 0],
  );
  const { start, features, target, rate } = practiceRow;
  const initial = latencyExample(start, features, target);
  assert.deepEqual([initial.prediction, initial.error, ...initial.gradient], [8, 1, 6, 2]);
  const fittedWeights = advance(start, initial.gradient, rate);
  const fitted = latencyExample(fittedWeights, features, target);
  assert.deepEqual([fitted.prediction, fitted.error, ...fitted.gradient], [7, 0, 0, 0]);
  near(latencyExample(fittedWeights, [1, 2], 4).error, 1.5);
  assert.deepEqual(originalHidden.gradient, [-4, -2, -2, -1]);
  const hidden = originalHidden;
  const h = 1e-5;
  const lossAt = (w1, x) => hiddenUnit([w1, ...hidden.weights.slice(1)], x, hidden.target).loss;
  const [w1] = hidden.weights;
  near((lossAt(w1 + h, hidden.input) - lossAt(w1 - h, hidden.input)) / (2 * h), hidden.gradient[0]);
  near((lossAt(w1, hidden.input + h) - lossAt(w1, hidden.input - h)) / (2 * h), hidden.inputGradient);
  near(hidden.inputGradient, -3);
  assert.deepEqual(fresh.before.gradient, [-2, -2, -0.5, -1]);
  assert.deepEqual(fresh.after.weights, [1.6, -0.9, 2.025, 0.55]);
  assert.deepEqual(copied.weights, [1.7, -0.9, 2.1, 0.55]);
  near(fresh.after.z, 0.7);
  near(copied.z, 0.8);
  near(fresh.after.prediction, 1.9675);
  near(copied.prediction, 2.23);
  near(hiddenStep(0.025).after.loss, 0.01890625);
  return true;
}

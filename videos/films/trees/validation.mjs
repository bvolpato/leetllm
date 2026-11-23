import { grow, predict, totalCost } from './arithmetic.mjs';
import { boost, forest, laterCases, minLeafTree, rows, samples, stump, tree } from './fixtures.mjs';
import {
  firstNewtonLeaves,
  fittedStump,
  policyCosts,
  residualStep,
  stumpBill,
  validationAfterBoosting,
} from './model.mjs';
import assert from 'node:assert/strict';
import { entropy } from 'vizmatic';
export function validateModel() {
  assert.ok(Math.abs(stump.cut - 3.35) < 1e-10);
  assert.ok(Math.abs(stump.gain - 0.3) < 1e-12);
  assert.deepEqual(
    forest.map((t) => predict(t, rows[2])),
    [0, 1, 0],
  );
  assert.deepEqual(
    samples.map((sample) => sample.filter((id) => id === 2).length),
    [0, 3, 0],
  );
  assert.deepEqual(
    forest.filter((_, i) => !samples[i].includes(2)).map((t) => predict(t, rows[2])),
    [0, 0],
  );
  assert.ok(rows.every((r) => predict(tree, r) === r[2]));
  assert.deepEqual(
    laterCases.map((row) => predict(tree, row)),
    [1, 0],
  );
  assert.deepEqual(boost[1], [28.5, 28.5, 33]);
  assert.deepEqual(residualStep(1, 0).residuals, [-18.5, -8.5, 27]);
  assert.deepEqual(
    firstNewtonLeaves.map((leaf) => leaf.step),
    [-1.2, 2],
  );
  assert.equal(validationAfterBoosting(1).loss.toFixed(3), '0.656');
  assert.equal(validationAfterBoosting(4).loss.toFixed(3), '0.584');
  assert.deepEqual(validationAfterBoosting(4).misses, ['V3', 'V8']);
  for (const [price, expected, cutoff, queued, cost] of [
    [40, [72, 80], 0.2, true, 0],
    [30, [72, 60], 0.5, false, 30],
  ]) {
    const bills = [stumpBill(0.2, price), stumpBill(0.5, price)];
    assert.deepEqual(
      bills.map((bill) => bill.total),
      expected,
    );
    assert.deepEqual(
      bills.map((bill) => bill.queued),
      [8, 2],
    );
    assert.equal(bills.reduce((a, b) => (a.total < b.total ? a : b)).threshold, cutoff);
    const [fresh] = policyCosts(fittedStump, cutoff, [[3.35, 5, 1]], price);
    assert.deepEqual([fresh.score, fresh.review, fresh.cost], [0.2, queued, cost]);
  }
  assert.equal(entropy([0.5, 0.5]), 1);
  assert.equal(totalCost(policyCosts(tree)), 138);
  assert.equal(totalCost(policyCosts(minLeafTree)), 240);
  assert.equal(totalCost(policyCosts(grow(rows, 1), 0.2)), 72);
  assert.equal(
    rows.reduce((sum, a) => sum + rows.filter((b) => a[2] !== b[2]).length, 0),
    32,
  );
  return true;
}

import { allocationOptimum, anchorFit, loss, optimum, surfaceLoss } from './arithmetic.mjs';
import {
  EXPONENT_GRID,
  budgetAccountingState,
  budgetAllocationState,
  freshAllocationState,
  growthState,
  sampleTradeoff,
  simultaneousWidthUpdate,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateOriginalModel() {
  assert.equal(budgetAccountingState(0, 1).completed, 3);
  assert.equal(budgetAccountingState(0, 1).perToken, 6);
  assert.deepEqual(budgetAccountingState(0, 1).parts, budgetAccountingState(1, 0).parts);
  assert.equal(budgetAccountingState(1, 4.7 / 18.048).showTraining, false);
  assert.equal(budgetAccountingState(1, 5 / 18.048).showTraining, true);
  assert.equal(budgetAccountingState(2, 4.8 / 15.944).allocationView, false);
  assert.equal(budgetAccountingState(2, 5.1 / 15.944).allocationView, true);
  const allocationAt = (seconds) =>
    budgetAllocationState({
      t: 34.624 + seconds,
    });
  assert.equal(allocationAt(9.7).n, 10);
  assert.equal(allocationAt(12.85).n, 20);
  assert.equal(allocationAt(13.3375).d, 5);
  const growthAt = (seconds) =>
    growthState({
      beat: 0,
      t: 0.4 + seconds,
    });
  assert.equal(growthAt(3.1).budget, 100);
  assert.equal(growthAt(6.9875).budget, 400);
  assert.equal(growthAt(7.55).n, 20);
  assert.equal(growthAt(12).d, 20);
  assert(growthAt(12).loss < growthAt(0).loss);
  for (let i = 0; i <= 170; i++) {
    const a = allocationAt(i / 10),
      g = growthAt(i / 10);
    assert(Math.abs(a.n * a.d - 100) < 1e-12);
    assert.equal(g.n, g.d);
    assert.equal(g.n * g.d, g.budget);
    assert.equal(g.loss, loss(g.n, g.d));
  }
  for (const beat of [1, 2])
    assert.equal(
      growthState({
        beat,
        beatP: 0,
      }).budget,
      400,
    );
  for (const budget of [25, 100, 400]) {
    const n = optimum(budget),
      d = budget / n;
    assert.equal(n * d, budget);
    for (const ratio of [0.25, 0.5, 2, 4]) assert(loss(n, d) <= loss(n * ratio, d / ratio));
  }
  assert.equal(optimum(100, 2, 4), 5);
  assert.equal(6 * 1e9 * 20e9, 1.2e20);
  assert.equal(sampleTradeoff(0, 0.35).n, 2.5);
  assert(sampleTradeoff(0, 0.6).n > 2.5);
  assert.equal(sampleTradeoff(0, 0.95).n, 40);
  assert.equal(sampleTradeoff(1, 0.56).n, 40);
  assert.equal(sampleTradeoff(1, 0.74).n, 10);
  for (const beat of [0, 1])
    for (let i = 0; i <= 100; i++) {
      const current = sampleTradeoff(beat, i / 100);
      assert(Math.abs(current.n * current.d - 100) < 1e-12);
      assert.equal(current.loss, loss(current.n, current.d));
    }
  const prediction = sampleTradeoff(2, 0.5),
    revealed = sampleTradeoff(2, 0.75);
  assert.equal(prediction.revealLosses, false);
  assert.equal(revealed.revealLosses, false);
  for (const progress of [0, 0.25, 0.5, 0.75, 1])
    assert.equal(sampleTradeoff(2, progress).revealLosses, false);
  assert.equal(prediction.candidates[1].n / prediction.candidates[0].n, 2);
  assert(revealed.candidates[1].loss < revealed.candidates[0].loss);
  return true;
}
export function scalingModelChecks() {
  const tall = (b) => loss(5, 20, 2, b),
    square = (b) => loss(10, 10, 2, b);
  assert(square(2) < tall(2));
  assert(tall(4) < square(4));
  assert.equal(optimum(100, 2, 2), 10);
  assert.equal(optimum(100, 2, 4), 5);
  const mid = surfaceLoss(10e9, 100e9);
  assert(Math.abs(2.35 - mid) > 0.02);
  assert(Math.abs(2.32 - mid) <= 0.02);
  assert.equal(900 - 20 * 40, 100);
  assert.equal(900 / 20 - 40, 5);
  const equal = allocationOptimum(1e6, 2, 2, 0.5, 0.5),
    weighted = allocationOptimum(1e6, 2, 8, 0.5, 0.5);
  assert.equal(equal.n, 1000);
  assert.equal(weighted.n, 250);
  assert.equal(weighted.d, 4000);
  const fit = allocationOptimum(70e9 * 1.4e12, 2.8, 7.8, 0.07, 0.098);
  assert(Math.abs(fit.n / 1e9 - 7.82) < 0.01);
  assert(Math.abs(fit.d / 1e12 - 12.53) < 0.02);
  assert(surfaceLoss(49e9, 2e12) > surfaceLoss(fit.n, fit.d));
  for (const n of [16, 64, 256]) {
    assert(Math.abs(simultaneousWidthUpdate(n).prediction - (n + 1)) < 1e-9);
    assert(Math.abs(simultaneousWidthUpdate(n, true).prediction - 2) < 1e-9);
    assert(Math.abs(simultaneousWidthUpdate(n, true, 0.25).prediction - 0.5) < 1e-9);
  }
  assert(Math.abs(EXPONENT_GRID.best.alpha - 0.07) < 1e-12);
  assert(Math.abs(EXPONENT_GRID.best.beta - 0.098) < 1e-12);
  for (const a of [0.1, 0.2]) {
    const f = anchorFit(a);
    assert(Math.abs(f.predict(1) - 3) < 1e-12);
    assert(Math.abs(f.predict(100) - 2.5) < 1e-12);
  }
  for (let i = 0; i <= 100; i++) {
    const s = freshAllocationState(2, i / 100);
    assert(Math.abs(s.n * s.d - 900) < 1e-10);
    assert.equal(s.loss, loss(s.n, s.d, 3, 6));
  }
  assert.equal(freshAllocationState(0, 1).known, false);
  assert.equal(freshAllocationState(1, 0.99).known, false);
  assert.equal(freshAllocationState(1, 1).known, true);
  assert.equal(freshAllocationState(2, 1).n, 22.5);
  assert.equal(freshAllocationState(2, 1).d, 40);
  assert.equal(6 * 70e9 * 1.4e12, 5.88e23);
  assert(Math.abs((6 * 30e9 * 4e12 - 5.88e23) / (2 * (70e9 - 30e9)) / 1.65e12 - 1) < 1e-12);
  assert.equal((80e9 * 2) / 1e9, 160);
  assert.equal(6 * (6e9 + 4e9) * 100e9, 6e21);
  return true;
}
export function validateModel() {
  return validateOriginalModel() && scalingModelChecks();
}

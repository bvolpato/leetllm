import test from 'node:test';
import assert from 'node:assert/strict';
import {
  allocationOptimum,
  anchorFit,
  fitExponentGrid,
  freshAllocationState,
  simultaneousWidthUpdate,
  surfaceLoss,
} from '../animations/scaling-laws.mjs';

test('coefficient-dependent allocations preserve compute and minimize the stated surface', () => {
  const fit = allocationOptimum(1e6, 2, 8, 0.5, 0.5);
  assert.deepEqual(fit, { n: 250, d: 4000, ratio: 16 });
  const L = (n, d) => 1 + 2 / Math.sqrt(n) + 8 / Math.sqrt(d);
  for (const r of [0.25, 0.5, 2, 4]) assert(L(fit.n, fit.d) < L(fit.n * r, fit.d / r));
  const capped = 49e9;
  assert.equal((70e9 * 1.4e12) / capped, 2e12);
  assert(surfaceLoss(capped, 2e12) > surfaceLoss(7.82e9, (70e9 * 1.4e12) / 7.82e9));
});

test('both gradients use the old weights and preserve the coordinated width result', () => {
  for (const n of [16, 64, 256]) {
    const normal = simultaneousWidthUpdate(n),
      coordinated = simultaneousWidthUpdate(n, true, 0.25);
    assert(Math.abs(normal.prediction - (n + 1)) < 1e-10);
    assert(Math.abs(coordinated.prediction - 0.5) < 1e-10);
    for (let i = 0; i < n; i++) {
      assert.equal(coordinated.du[i], -coordinated.v[i]);
      assert.equal(coordinated.dv[i], -coordinated.u[i]);
    }
  }
});

test('exact anchor fits can disagree remotely while the rounded exponent grid recovers its generator', () => {
  const fits = [0.1, 0.2].map(anchorFit);
  for (const f of fits) {
    assert(Math.abs(f.predict(1) - 3) < 1e-12);
    assert(Math.abs(f.predict(100) - 2.5) < 1e-12);
  }
  assert(Math.abs(fits[0].predict(1e6) - fits[1].predict(1e6)) > 0.23);
  const g = fitExponentGrid();
  assert(Math.abs(g.best.alpha - 0.07) < 1e-12);
  assert(Math.abs(g.best.beta - 0.098) < 1e-12);
  assert.equal(g.cells.length, 494);
});

test('the fresh answer is held and its constrained motion uses one computed allocation', () => {
  for (const p of [0, 0.2, 0.5, 0.99, 1]) assert.equal(freshAllocationState(0, p).known, false);
  assert.equal(freshAllocationState(1, 0.999).known, false);
  assert.equal(freshAllocationState(1, 1).known, true);
  for (let i = 0; i <= 100; i++) {
    const s = freshAllocationState(2, i / 100);
    assert(Math.abs(s.n * s.d - 900) < 1e-10);
    assert.equal(s.loss, 1 + 3 / Math.sqrt(s.n) + 6 / Math.sqrt(s.d));
  }
  const end = freshAllocationState(2, 1);
  assert.equal(end.n, 22.5);
  assert.equal(end.d, 40);
  assert.equal(end.settled, true);
});

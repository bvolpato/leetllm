import { inverse, weighted } from './arithmetic.mjs';
import { populations, rates } from './fixtures.mjs';
import {
  auditSelectionState,
  freshAuditFixture,
  instrumentFixture,
  policyValueFixture,
  replayReplacementFixture,
  responseTypePairing,
  standardizationState,
  standardizedFixture,
  weightedTicketFixture,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateOriginalModel() {
  assert.deepEqual(
    auditSelectionState(0).rows.map((row) => [row.included, row.rate]),
    [
      [4, 0.5],
      [4, 0.5],
    ],
  );
  assert.deepEqual(
    auditSelectionState(1).rows.map((row) => [row.included, row.rate]),
    [
      [4, 0.5],
      [2, 0],
    ],
  );
  for (const elapsed of [12.3, 12.425, 14.85, 20.424]) {
    const snap = standardizationState(0, elapsed / 20.424);
    assert.equal(snap.mix, 1);
    assert.ok(Math.abs(snap.assistant - 0.78) < 1e-12);
    assert.ok(Math.abs(snap.control - 0.68) < 1e-12);
  }
  assert.ok(standardizationState(0, 6.3 / 20.424).mix < 1e-12);
  assert.equal(standardizationState(1, 0).mix, 1);
  assert.ok(Math.abs(weighted(rates.assistant, 0.1) - 0.54) < 1e-12);
  assert.ok(Math.abs(weighted(rates.control, 0.9) - 0.76) < 1e-12);
  assert.ok(Math.abs(weighted(rates.assistant, 0.7) - weighted(rates.control, 0.7) - 0.1) < 1e-12);
  for (const pop of populations) {
    assert.equal(
      pop.reduce((a, v) => a + v, 0),
      100,
    );
    assert.equal(pop[0] + pop[1], 78);
    assert.equal(pop[0] + pop[2], 68);
  }
  assert.equal(inverse(0.1), 10);
  assert.throws(() => inverse(0), /positive support/);
  return true;
}
export function validateModel() {
  validateOriginalModel();
  const a = standardizedFixture();
  assert(Math.abs(a.difference - 0.1) < 1e-12);
  assert(Math.abs(standardizedFixture(8).difference - 0.03) < 1e-12);
  assert(Math.abs(a.se - 0.08769898010302692) < 1e-12);
  for (let h = 0; h <= 22; h++) {
    const p = responseTypePairing(h);
    assert.equal(p.assistantSuccess, 78);
    assert.equal(p.controlSuccess, 68);
    assert.equal(p.total, 100);
  }
  const w = weightedTicketFixture(),
    clipped = weightedTicketFixture({
      clip: 5,
    });
  assert(Math.abs(w[0].rate - 0.7) < 1e-12);
  assert(Math.abs(w[1].rate - 0.6) < 1e-12);
  assert(Math.abs(clipped[0].rate - clipped[1].rate + 1 / 30) < 1e-12);
  assert(Math.abs(instrumentFixture(0.04, 0.01).ratio - 0.35) < 1e-12);
  assert(
    Math.abs(
      policyValueFixture({
        estimatedPropensity: 0.4,
      }).dr - 0.6875,
    ) < 1e-12,
  );
  assert.equal(replayReplacementFixture(4).success, true);
  assert.equal(freshAuditFixture(1).difference, -0.4);
  return true;
}

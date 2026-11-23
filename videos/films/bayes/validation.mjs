import { area, betaDensity, integrate, weightedArea } from './arithmetic.mjs';
import { releasePolicy, validationOutcomes } from './fixtures.mjs';
import {
  alternativeSample,
  familyDensity,
  lastTaskCases,
  predictiveCountDistribution,
  predictiveSnapshot,
  priorIntervalSnapshot,
  releaseCases,
  updateSnapshot,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateBaselineModel() {
  assert.ok(Math.abs(area(2, 2) - 1) < 1e-6);
  assert.ok(Math.abs(area(10, 4) - 1) < 1e-6);
  assert.ok(Math.abs(area(10, 4, 0.7, 1) - 0.579394) < 0.001);
  assert.ok(area(82, 22, 0.7, 1) > 0.98);
  assert.equal(updateSnapshot(1, 0).processed, 0);
  assert.equal(updateSnapshot(1, 0.5).complete, false);
  assert.deepEqual([updateSnapshot(1, 1).a, updateSnapshot(1, 1).b], [10, 4]);
  for (const p of [0, 0.12, 0.5, 0.88, 1]) {
    const v = alternativeSample(p);
    assert.equal(v.passes / v.total, 0.8);
    assert.equal(v.a + v.b, v.total + 4);
  }
  assert.deepEqual(alternativeSample(1), {
    total: 100,
    passes: 80,
    failures: 20,
    a: 82,
    b: 22,
  });
  assert.equal(predictiveSnapshot(1, 0.2).forecast, 10 / 14);
  assert.equal(predictiveSnapshot(1, 0.5).forecast, 11 / 15);
  assert.equal(predictiveSnapshot(2, 0.5).a, 10);
  const v = predictiveSnapshot(2, 1);
  assert.ok(Math.abs(v.bothPass - v.frozenMeanSquared - v.variance) < 1e-12);
  assert.ok(Math.abs(weightedArea(1) - v.originalForecast) < 1e-8);
  assert.equal(priorIntervalSnapshot(2, 1).probability, 0);
  assert.ok(
    Math.abs(predictiveCountDistribution().reduce((sum, row) => sum + row.probability, 0) - 1) <
      1e-12,
  );
  return true;
}
export function validateModel() {
  validateBaselineModel();
  assert.equal(betaDensity(1, 1, 0), 1);
  assert.equal(betaDensity(1, 1, 1), 1);
  assert(Math.abs(integrate((x) => familyDensity(x)) - 1) < 1e-7);
  const counts = predictiveCountDistribution();
  assert(
    Math.abs(counts.reduce((n, r) => n + r.passes * r.probability, 0) - (5 * 10) / 14) < 1e-10,
  );
  const oneFailureOrder = integrate((p) => p ** 4 * (1 - p) * betaDensity(10, 4, p));
  assert(Math.abs(5 * oneFailureOrder - counts[4].probability) < 1e-10);
  for (const [name, a, b, passesGate] of [
    ['sealed', 20, 4, false],
    ['pass', 21, 4, true],
    ['fail', 20, 5, false],
  ]) {
    const row = lastTaskCases[name];
    assert.deepEqual([row.a, row.b], [a, b]);
    const integrated = integrate((p) => betaDensity(a, b, p), releasePolicy.rateCutoff, 1);
    assert(Math.abs(row.tail - integrated) < 1e-9);
    assert.equal(row.tail >= releasePolicy.requiredMass, passesGate);
  }
  assert.equal(validationOutcomes.filter((r) => r.pass).length, 72);
  assert.deepEqual(
    releaseCases().map((r) => r.meetsRule),
    [false, true, false],
  );
  return true;
}

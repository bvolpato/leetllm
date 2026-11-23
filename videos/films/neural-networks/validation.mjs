import {
  approximation,
  differenceLamp,
  denseParameterCount,
  finiteReluSecant,
  forward,
  gradientStep,
  sigmoid,
  stableBce,
  standardize,
  targetCurve,
} from './arithmetic.mjs';
import { CASES, PARAMETERS } from './fixtures.mjs';
import { affineWitness, backward, batchGradient, freshGradient, requestForward } from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.deepEqual(
    CASES.map((x) => forward(x).y),
    [0, 1, 1, 0],
  );
  assert.equal(forward([0.5, 0.5]).y, 1);
  for (const pair of CASES) assert.equal(differenceLamp(pair).y, forward(pair).y);
  assert(Math.abs(forward([0.8, 0.5]).y - 0.7) < 1e-12);
  assert(Math.abs(differenceLamp([0.8, 0.5]).y - 0.3) < 1e-12);
  const f = requestForward([2, 5]);
  assert(Math.abs(f.z1[0] - 0.1) < 1e-12 && Math.abs(f.z1[1] - 3.2) < 1e-12);
  assert(Math.abs(f.z2 + 0.14) < 1e-12);
  assert.equal(sigmoid(-1000), 0);
  assert.equal(sigmoid(1000), 1);
  assert.equal(stableBce(-1000, 1), 1000);
  assert.equal(stableBce(1000, 0), 1000);
  const g = batchGradient(),
    next = batchGradient(gradientStep(PARAMETERS, g));
  assert(Math.abs(g.loss - 0.5252) < 0.00005 && Math.abs(next.loss - 0.498) < 0.00005);
  assert.deepEqual(backward([1, 4], 1).dw1[0], [0, 0]);
  assert.deepEqual(standardize([8, 900], [5, 500], [2, 200]), [1.5, 2]);
  assert.equal(2 * 2 + 2 + 1 * 2 + 1, 9);
  for (let i = 0; i <= 40; i++)
    assert(Math.abs(approximation(i / 10, 8) - targetCurve(i / 10)) < 0.012);
  return true;
}
export function validateConstruction() {
  assert.equal(denseParameterCount([784, 256, 128, 10]), 235146);
  assert(Math.abs(affineWitness().pair + 0.71) < 1e-12);
  assert.equal(affineWitness().doubleZero, -1);
  assert.equal(finiteReluSecant(0, 0.01), 0.5);
  assert(Math.abs(finiteReluSecant(0.05, 0.1) - 0.75) < 1e-12);
  const f = freshGradient(),
    next = requestForward([-1, 2], gradientStep(PARAMETERS, f));
  assert(f.dw1[1][0] > 0 && f.dw1[1][1] < 0);
  assert(f.dw1[0].every((value) => value === 0));
  assert(
    Math.abs(f.score - 0.40371730070321216) < 1e-12 &&
      Math.abs(next.score - 0.4372581665359699) < 1e-12,
  );
  return true;
}

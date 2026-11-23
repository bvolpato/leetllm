import { noiseFit, predictsMask } from './arithmetic.mjs';
import { riskCheck } from './risk-ruler.mjs';
import {
  VC_BEAT_2_SPAN,
  VC_BEAT_3_SPAN,
  bounds,
  empiricalRisk,
  hoeffdingRadius,
  triangleFixture,
} from './fixtures.mjs';
import { shatteringCueState } from './construction.mjs';
import { searchSnapshot, separatorForMask } from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  for (const [k, count, pool, endpoint, passes] of [
    [4, 40, 1000, '46.39', false],
    [89, 738, 1, '17.06', true],
    [130, 1000, 1, '17.29', true],
    [130, 1000, 1000, '20.28', false],
  ]) {
    const check = riskCheck(k, count, pool);
    assert.equal((100 * check.upper).toFixed(2), endpoint);
    assert.equal(check.passes, passes);
  }
  for (const [mask, score] of [
    [0b11110000, 1],
    [0b10110000, 0.75],
  ]) {
    assert.equal(noiseFit(mask).split, 4);
    assert.equal(noiseFit(mask).threshold, score);
  }
  assert.equal(
    Array.from({ length: 256 }, (_, i) => noiseFit(i)).filter((f) => f.threshold === 1).length,
    9,
  );
  assert.equal(empiricalRisk, 0.1);
  assert.ok(Math.abs(hoeffdingRadius(40) - 0.214734704) < 1e-9);
  assert.ok(Math.abs(bounds[0].upper - 0.314734704) < 1e-9);
  assert.ok(Math.abs(bounds[3].radius - 0.364) < 0.001);
  assert.ok(bounds.every((v, i) => i === 0 || v.radius > bounds[i - 1].radius));
  assert.ok(empiricalRisk + 2 * bounds[3].radius < 1);
  assert.deepEqual(
    [0, 0.25, 0.5, 0.999].map(searchSnapshot).map((row) => row.hypotheses),
    [1, 10, 100, 1000],
  );
  assert.throws(() => searchSnapshot(1.1), RangeError);
  assert.equal(3 ** 2, 9);
  const squareStart = shatteringCueState(1, 0);
  assert.equal(squareStart.square, 1);
  assert.equal(squareStart.count, 0);
  assert.equal(squareStart.checkerboard, 0);
  assert.ok(shatteringCueState(1, 2.175 / VC_BEAT_2_SPAN).count > 0);
  assert.equal(shatteringCueState(1, 3 / VC_BEAT_2_SPAN).count, 1);
  assert.equal(shatteringCueState(1, 6 / VC_BEAT_2_SPAN).checkerboard, 0);
  assert.ok(shatteringCueState(1, 6.4375 / VC_BEAT_2_SPAN).checkerboard > 0);
  assert.equal(shatteringCueState(2, 6.8 / VC_BEAT_3_SPAN).dimension, 0);
  assert.ok(shatteringCueState(2, 7.0125 / VC_BEAT_3_SPAN).dimension > 0);
  assert.equal(shatteringCueState(2, 7.7 / VC_BEAT_3_SPAN).dimension, 1);
  for (let mask = 0; mask < 8; mask++) {
    const separator = separatorForMask(mask);
    triangleFixture.forEach((point, i) =>
      assert.equal(predictsMask(separator, point), Boolean((mask >> i) & 1)),
    );
  }
  return true;
}

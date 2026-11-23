import test from 'node:test';
import assert from 'node:assert/strict';
import {
  forwardValue,
  mixture,
  probabilityFlowStep,
  trajectoryPoint,
  validateModel,
} from '../animations/diffusion.mjs';

test('diffusion visual data retains normalized noise, valid contours, and converging sample paths', () => {
  assert.equal(validateModel(), true);
});

test('the forward mixture uses amplitude square roots and preserves the clean endpoint', () => {
  assert.equal(forwardValue(1, -0.4, 1), 1);
  assert.equal(forwardValue(1, -0.4, 0), -0.4);
  assert.ok(Math.abs(forwardValue(1, -0.4, 0.5) - 0.4242640687119285) < 1e-14);
});

test('the analytic mixture score matches the gradient of its displayed log density', () => {
  const h = 1e-5;
  for (const variance of [0, 0.3, 3])
    for (const point of [
      [0, 0],
      [1.3, -0.4],
      [-2.5, 1.9],
      [4, -2],
    ]) {
      const { score } = mixture(point, variance);
      for (const axis of [0, 1]) {
        const left = [...point],
          right = [...point];
        left[axis] -= h;
        right[axis] += h;
        const finiteDifference =
          (Math.log(mixture(right, variance).density) - Math.log(mixture(left, variance).density)) /
          (2 * h);
        assert.ok(Math.abs(finiteDifference - score[axis]) < 1e-6);
      }
    }
});

test('reverse variance integration follows the probability-flow sign and resolves the rendered particle paths', () => {
  const initial = [2, 1],
    variance = 1.2,
    delta = -1e-6;
  const next = probabilityFlowStep(initial, variance, delta),
    { score } = mixture(initial, variance);
  for (const axis of [0, 1])
    assert.ok(Math.abs((next[axis] - initial[axis]) / delta + score[axis] / 2) < 1e-5);
  for (const index of [0, 17, 53]) {
    let point = trajectoryPoint(index, 0);
    for (let i = 0; i < 1440; i++)
      point = probabilityFlowStep(point, 3 * (1 - i / 1440), -3 / 1440);
    const rendered = trajectoryPoint(index, 1);
    assert.ok(Math.hypot(...point.map((value, axis) => value - rendered[axis])) < 1e-7);
  }
});

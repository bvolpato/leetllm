import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CASES,
  forward,
  lampState,
  cueProgress,
  PARAMETERS,
  requestForward,
  backward,
  batchGradient,
  gradientStep,
  transposeExample,
  sigmoid,
  stableBce,
  activations,
  standardize,
  triangle,
  triangleConstruction,
  targetCurve,
  approximation,
  validateModel,
} from '../animations/neural-networks.mjs';

const cue = (phase, progress = phase === 'after' ? 1 : 0) => ({ phase, progress, strength: 0 });
const near = (a, b, tolerance = 1e-9) =>
  assert(Math.abs(a - b) <= tolerance, `${a} differs from ${b}`);

test('the lamp answer is withheld for the prediction and persists after its measured cue', () => {
  assert.deepEqual(
    CASES.map((x) => forward(x).y),
    [0, 1, 1, 0],
  );
  const before = lampState({ beat: 2, beatP: 0.8, cues: { 'lamp-subtract': cue('before') } });
  assert.equal(before.outputVisible, false);
  const after = lampState({
    beat: 3,
    beatP: 0,
    cues: { 'lamp-subtract': cue('after'), 'halfway-answer': cue('before') },
  });
  assert.equal(after.outputVisible, true);
  assert.equal(after.combine, 1);
  assert.equal(after.halfway, 0);
  for (const beatP of [0, 0.5, 1]) {
    assert.equal(
      cueProgress(
        { beat: 3, beatP, cues: { 'halfway-answer': cue('after') } },
        'halfway-answer',
        3,
      ),
      1,
    );
    near(forward([0.5, 0.5]).y, 1);
  }
});

test('nonsymmetric weight rows distinguish the legal square-matrix products', () => {
  const { right, wrong } = transposeExample();
  near(right[0], 0.1);
  near(right[1], 3.2);
  near(wrong[0], 1.1);
  near(wrong[1], 2.8);
  assert.notDeepEqual(right, wrong);
  const result = requestForward([2, 5]);
  assert.deepEqual(result.z1, right);
  near(result.z2, -0.14);
  near(result.score, 0.4650570548417855);
});

test('two-layer BCE gradients match finite differences for all nine parameters', () => {
  const g = batchGradient(),
    h = 1e-6;
  const check = (get, set, expected) => {
    const plus = structuredClone(PARAMETERS),
      minus = structuredClone(PARAMETERS),
      value = get(PARAMETERS);
    set(plus, value + h);
    set(minus, value - h);
    near((batchGradient(plus).loss - batchGradient(minus).loss) / (2 * h), expected, 1e-7);
  };
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++)
      check(
        (p) => p.w1[i][j],
        (p, v) => {
          p.w1[i][j] = v;
        },
        g.dw1[i][j],
      );
    check(
      (p) => p.b1[i],
      (p, v) => {
        p.b1[i] = v;
      },
      g.db1[i],
    );
    check(
      (p) => p.w2[i],
      (p, v) => {
        p.w2[i] = v;
      },
      g.dw2[i],
    );
  }
  check(
    (p) => p.b2,
    (p, v) => {
      p.b2 = v;
    },
    g.db2,
  );
  const next = gradientStep(PARAMETERS, g);
  near(g.loss, 0.5252, 0.00005);
  near(batchGradient(next).loss, 0.498, 0.00005);
  assert.notDeepEqual(next.w1, PARAMETERS.w1);
  assert.notDeepEqual(next.w2, PARAMETERS.w2);
  assert.notDeepEqual(next.b1, PARAMETERS.b1);
  assert.notEqual(next.b2, PARAMETERS.b2);
});

test('saved ReLU signs gate the backward signal before the first-layer outer product', () => {
  const g = backward([1, 4], 1);
  assert(g.z1[0] < 0 && g.z1[1] > 0 && g.dz2 < 0);
  near(g.dh[0], g.dz2 * 0.4);
  near(g.dh[1], g.dz2 * 0.1);
  assert.deepEqual(g.dw1[0], [0, 0]);
  near(g.dw1[1][0], g.dh[1]);
  near(g.dw1[1][1], g.dh[1] * 4);
  near(g.dw2[0], 0);
  near(g.dw2[1], g.dz2 * 2.5);
  assert.deepEqual(backward([0, 0], 1).dz1, [0, 0]);
});

test('local activation slopes agree with derivatives away from the ReLU corner', () => {
  for (const [key, activation] of Object.entries(activations))
    for (const z of [-3, -1, 0.5, 2]) {
      const step = 1e-5,
        numerical = (activation.value(z + step) - activation.value(z - step)) / (2 * step);
      near(numerical, activation.derivative(z), key === 'GELU' ? 2e-6 : 1e-7);
    }
  near(activations.sigmoid.derivative(0), 0.25);
  near(activations.tanh.derivative(0), 1);
  assert.equal(activations.ReLU.derivative(-1), 0);
  assert(activations.GELU.value(-1) < 0 && activations.SiLU.value(-1) < 0);
});

test('stable logit loss stays finite after extreme sigmoid scores round to endpoints', () => {
  assert.equal(sigmoid(-1000), 0);
  assert.equal(sigmoid(1000), 1);
  assert.equal(stableBce(-1000, 1), 1000);
  assert.equal(stableBce(1000, 0), 1000);
  for (const z of [-2, 0, 2])
    for (const y of [0, 1])
      near(stableBce(z, y), -y * Math.log(sigmoid(z)) - (1 - y) * Math.log(1 - sigmoid(z)));
  assert.deepEqual(standardize([8, 900], [5, 500], [2, 200]), [1.5, 2]);
});

test('shifted ReLU triangles close outside their support and finer spacing improves the same target', () => {
  assert.deepEqual(triangleConstruction(3.5, 0), { twoHinges: -1.5, addedHinge: 0, sum: -1.5 });
  near(triangleConstruction(3.5, 0.5).sum, -0.75);
  assert.deepEqual(triangleConstruction(3.5, 1), { twoHinges: -1.5, addedHinge: 1.5, sum: 0 });
  for (const x of [-3, -1, 0, 2, 3, 5]) near(triangle(x), 0);
  near(triangle(1), 1);
  near(triangle(0.5), 0.5);
  near(triangle(1.5), 0.5);
  let coarse = 0,
    fine = 0;
  for (let i = 0; i <= 400; i++) {
    const x = i / 100;
    coarse = Math.max(coarse, Math.abs(targetCurve(x) - approximation(x, 2)));
    fine = Math.max(fine, Math.abs(targetCurve(x) - approximation(x, 8)));
  }
  assert(fine < coarse / 10);
  assert(fine < 0.012);
  assert.equal(validateModel(), true);
  near(approximation(0, 8), 0.2);
  near(approximation(4, 8), 0.2);
});

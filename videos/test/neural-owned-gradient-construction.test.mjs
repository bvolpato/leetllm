import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PARAMETERS,
  backward,
  freshGradient,
  requestForward,
  gradientStep,
  gradientVector,
  parameterVector,
  freshGradientFrame,
  binaryMeanGradients,
  finiteReluSecant,
} from '../animations/neural-networks.mjs';
const near = (a, b, t = 1e-8) => assert(Math.abs(a - b) < t, `${a} != ${b}`);
const cue = (phase, progress = 0) => ({ phase, progress, strength: 0 });
test('negative feature reverses its owned gradient and all nine derivatives match independent perturbations', () => {
  const g = freshGradient(),
    expected = gradientVector(g),
    refs = [
      ['w1', 0, 0],
      ['w1', 0, 1],
      ['w1', 1, 0],
      ['w1', 1, 1],
      ['b1', 0],
      ['b1', 1],
      ['w2', 0],
      ['w2', 1],
      ['b2'],
    ];
  refs.forEach((ref, index) => {
    const plus = structuredClone(PARAMETERS),
      minus = structuredClone(PARAMETERS),
      apply = (p, delta) => {
        if (ref.length === 3) p[ref[0]][ref[1]][ref[2]] += delta;
        else if (ref.length === 2) p[ref[0]][ref[1]] += delta;
        else p[ref[0]] += delta;
      };
    apply(plus, 1e-6);
    apply(minus, -1e-6);
    near(
      (backward([-1, 2], 1, plus).loss - backward([-1, 2], 1, minus).loss) / 2e-6,
      expected[index],
    );
  });
  assert(g.dw1[1][0] > 0 && g.dw1[1][1] < 0);
  const next = gradientStep(PARAMETERS, g);
  assert(next.w1[1][0] < PARAMETERS.w1[1][0] && next.w1[1][1] > PARAMETERS.w1[1][1]);
  assert.deepEqual(next.w1[0], PARAMETERS.w1[0]);
  assert.equal(next.b1[0], 0);
  near(requestForward([-1, 2], next).score, 0.4372581665359699);
});
test('fresh signs, parameter intervention and resulting score wait for their distinct narration cues', () => {
  for (const beatP of [0, 0.5, 1]) {
    const hidden = freshGradientFrame({
      beat: 1,
      beatP,
      cues: { 'fresh-gradient-products': cue('before') },
    });
    assert.equal(hidden.products, false);
    assert.equal(hidden.step, 0);
    assert.equal(hidden.reveal, false);
    assert.deepEqual(parameterVector(hidden.parameters), parameterVector(PARAMETERS));
  }
  const products = freshGradientFrame({
    beat: 1,
    cues: { 'fresh-gradient-products': cue('after', 1) },
  });
  assert(products.products);
  assert.equal(products.step, 0);
  const held = freshGradientFrame({
    beat: 2,
    beatP: 1,
    cues: { 'fresh-gradient-step': cue('before'), 'fresh-gradient-result': cue('before') },
  });
  assert.equal(held.step, 0);
  assert.equal(held.reveal, false);
  const updated = freshGradientFrame({
    beat: 2,
    cues: { 'fresh-gradient-step': cue('after', 1), 'fresh-gradient-result': cue('before') },
  });
  assert.equal(updated.step, 1);
  assert.equal(updated.reveal, false);
  const revealed = freshGradientFrame({
    beat: 2,
    cues: { 'fresh-gradient-step': cue('after', 1), 'fresh-gradient-result': cue('after', 1) },
  });
  assert(revealed.reveal);
  near(revealed.result.score, 0.4372581665359699);
});
test('independent binary mean divides each output derivative by every scalar entry', () => {
  const targets = [
      [1, 0, 1],
      [0, 1, 0],
    ],
    g = binaryMeanGradients(
      [
        [0, 0, 0],
        [0, 0, 0],
      ],
      targets,
    );
  g.forEach((r, i) => r.forEach((v, j) => near(v, (0.5 - targets[i][j]) / 6)));
  near(
    g.flat().reduce((s, v) => s + v, 0),
    0,
  );
  const fresh = binaryMeanGradients([[Math.log(3), 0]], [[1, 0]]);
  near(fresh[0][0], -0.125);
  near(fresh[0][1], 0.25);
});
test('a central ReLU secant changes when epsilon stops crossing the corner', () => {
  near(finiteReluSecant(0, 0.1), 0.5);
  near(finiteReluSecant(0.05, 0.1), 0.75);
  near(finiteReluSecant(0.05, 0.02), 1);
  near(finiteReluSecant(-0.05, 0.02), 0);
  assert.throws(() => finiteReluSecant(0, 0), /Positive epsilon/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  observations,
  posterior,
  mStep,
  restrictedModel,
  evidenceBound,
  boundGeometry,
  jensenConstruction,
  varianceObjective,
  priorTransfer,
  constructedFrame,
  reconstructionTrace,
} from '../animations/expectation-maximization.mjs';

const near = (a, b, tolerance = 1e-10) => assert(Math.abs(a - b) < tolerance, `${a} != ${b}`);

test('the moving Jensen gap equals an independently evaluated posterior KL', () => {
  const truth = posterior([50], restrictedModel(30))[0];
  for (let step = 0; step <= 40; step++) {
    const state = jensenConstruction(step / 40);
    const kl = state.q.reduce((sum, q, k) => sum + q * Math.log(q / truth[k]), 0);
    near(state.gap, kl);
    assert(state.gap >= -1e-12);
    near(
      state.q.reduce((sum, q) => sum + q, 0),
      1,
    );
    near(
      state.q.reduce((sum, q, k) => sum + q * state.ratios[k], 0),
      state.total,
    );
  }
  near(jensenConstruction(1).ratios[0], jensenConstruction(1).ratios[1]);
  near(jensenConstruction(1).gap, 0);
});

test('the restricted mean update maximizes its frozen bound before the E-step closes the new gap', () => {
  const g = boundGeometry();
  const value = (mean) => evidenceBound(observations, g.qOld, restrictedModel(mean));
  const epsilon = 1e-4;
  near((value(g.newMean + epsilon) - value(g.newMean - epsilon)) / (2 * epsilon), 0, 1e-7);
  for (let mean = 20; mean <= 80; mean += 0.5) assert(value(mean) <= value(g.newMean) + 1e-10);
  near(evidenceBound(observations, g.qNew, restrictedModel(g.newMean)), g.newLikelihood);
  assert(g.newLikelihood > g.oldBoundNew && g.oldBoundNew > g.oldLikelihood);
  assert.deepEqual(restrictedModel(g.newMean).variances, [400, 400]);
  assert.equal(restrictedModel(g.newMean).means[1], 90);
});

test('a fixed floor selects the constrained variance optimum and an empty component stops the update', () => {
  const actual = mStep(
    [-0.5, 0.5],
    [
      [0.5, 0.5],
      [0.5, 0.5],
    ],
    1,
  );
  assert.deepEqual(actual.variances, [1, 1]);
  for (let v = 1; v <= 3; v += 0.02) assert(varianceObjective(v) <= varianceObjective(1) + 1e-10);
  assert(varianceObjective(1) > varianceObjective(1.25));
  assert.throws(
    () =>
      mStep(
        [0, 1],
        [
          [1, 0],
          [1, 0],
        ],
      ),
    /Numerically empty component/,
  );
});

test('fresh prior reversal agrees with independent odds and neither answer appears before its cue', () => {
  for (const prior of [0.25, 0.1]) {
    const odds = (prior / (1 - prior)) * Math.exp(((45 - 80) ** 2 - (45 - 20) ** 2) / (2 * 225));
    near(priorTransfer(prior).responsibilities[0], odds / (1 + odds));
  }
  const before = () => ({ phase: 'before', progress: 0 });
  const cues = { 'em-fresh-first': before(), 'em-fresh-flip': before() };
  let frame = constructedFrame({ beat: 1, beatP: 0.99, cues });
  assert.equal(frame.freshRevealed, false);
  assert.equal(frame.priorChanged, false);
  cues['em-fresh-first'] = { phase: 'during', progress: 0.1 };
  frame = constructedFrame({ beat: 1, cues });
  assert.equal(frame.freshRevealed, false);
  assert.equal(frame.priorChanged, false);
  cues['em-fresh-first'] = { phase: 'after', progress: 1 };
  assert.equal(constructedFrame({ beat: 1, cues }).freshRevealed, true);
  cues['em-fresh-flip'] = { phase: 'during', progress: 0.1 };
  assert.equal(constructedFrame({ beat: 1, cues }).priorChanged, false);
  cues['em-fresh-flip'] = { phase: 'after', progress: 1 };
  assert.equal(constructedFrame({ beat: 1, cues }).priorChanged, true);
});

test('one fixed-noise reconstruction sends correct credit into both encoder outputs and decoder weight', () => {
  for (const values of [
    [1, 2, 0.5, 1, 3],
    [-0.3, 0.7, -1.2, 1.4, 0.5],
  ]) {
    const actual = reconstructionTrace(...values),
      epsilon = 1e-5;
    const loss = ([mu, sd, noise, weight, observed]) =>
      0.5 * (weight * (mu + sd * noise) - observed) ** 2;
    for (const [index, key] of [
      [0, 'meanGradient'],
      [1, 'deviationGradient'],
      [3, 'weightGradient'],
    ]) {
      const plus = [...values],
        minus = [...values];
      plus[index] += epsilon;
      minus[index] -= epsilon;
      near(actual[key], (loss(plus) - loss(minus)) / (2 * epsilon), 1e-8);
    }
  }
  const actual = reconstructionTrace();
  assert.equal(actual.loss, 0.5);
  assert.deepEqual(
    [actual.meanGradient, actual.deviationGradient, actual.weightGradient],
    [-1, -0.5, -2],
  );
});

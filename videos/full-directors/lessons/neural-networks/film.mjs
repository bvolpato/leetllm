import assert from 'node:assert/strict';
import { setup, stage } from './bench.mjs';
import { captionClock } from './captions.mjs';
import { switches, cascade, hinges, scorer, forwardTrace, witness, risk } from './circuits.mjs';
import {
  bounded,
  gates,
  signals,
  parameters,
  imageScale,
  batch,
  transpose,
  incomingSignal,
  reluProbe,
  swiglu,
  counts,
} from './layers.mjs';
import {
  lossProbe,
  breaker,
  reduction,
  storage,
  step,
  secant,
  signedStep,
  timeout,
  batchGrad,
  afterBatch,
  meanGrad,
  signed,
  afterSigned,
} from './backward.mjs';
import {
  units,
  finiteLoss,
  policy,
  basis,
  limits,
  finalProbe,
  routes,
  bucket,
  sampledError,
  arch,
  fitProbe,
  probe,
  cornerBrightness,
  scaleExample,
} from './experiments.mjs';
import { CASES, PARAMETERS, activations } from '../../../films/neural-networks/fixtures.mjs';
import {
  gradientVector,
  standardize,
  denseParameterCount,
  forward,
  differenceLamp,
  sigmoid,
  stableBce,
  finiteReluSecant,
} from '../../../films/neural-networks/arithmetic.mjs';
import {
  affineWitness,
  transposeExample,
  batchGradient,
} from '../../../films/neural-networks/model.mjs';

const chapters = [
  ['When does the bulb light?', switches],
  ['Two transformations of one input', cascade],
  ['Build the bend', hinges],
  ['From a request to a logit', scorer],
  ['Follow request CA-104', forwardTrace],
  ['Test the affine identity', witness],
  ['Read the tangent', bounded],
  [(s) => (s.b === 1 ? 'Trace ReLU through zero' : 'Compare the negative branches'), gates],
  ['What passes through a gate?', signals],
  ['Find the adjustable values', parameters],
  ['From a request to an image', imageScale],
  ['Four requests, one weight bank', batch],
  ['Which pairing reproduces the trace?', transpose],
  ['Move the logit along the loss curve', lossProbe],
  ['Trace the correction backward', breaker],
  ['Which entries share the mean?', reduction],
  ['Recover the forward values', storage],
  ['Take one step on the batch', step],
  ['Does the probe cross the corner?', secant],
  [
    (s) =>
      [
        'Predict the two weight updates',
        'Predict the two weight updates',
        'Trace the active path',
        'Check the closed gate',
        'Subtract each gradient',
        'Score the updated network',
      ][s.b - 1],
    signedStep,
  ],
  ['Change the feature units', units],
  ['Keep the logit', finiteLoss],
  [
    (s) => (s.b <= 2 ? 'Move the routing threshold' : 'How often did these requests time out?'),
    policy,
  ],
  ['Build a curve from hinges', basis],
  ['What can width guarantee?', limits],
  ['Where should we measure next?', finalProbe],
];
function draw(ctx, clock) {
  const [title, paint] = chapters[clock.beat.chapterIndex];
  const s = stage(captionClock(clock));
  ctx.save();
  setup(ctx, typeof title === 'function' ? title(s) : title);
  paint(ctx, s);
  ctx.restore();
}
function near(actual, expected, tol = 1e-10) {
  assert.ok(Math.abs(actual - expected) < tol, actual + ' differs from ' + expected);
}
function check() {
  const rounded = (xs) => xs.map((x) => Number(x.toFixed(4)));
  assert.deepEqual(CASES.map((p) => forward(p).y), cornerBrightness);
  assert.deepEqual(CASES.map((p) => differenceLamp(p).y), cornerBrightness);
  near(forward([0.5, 0.5]).y, 1);
  near(differenceLamp([0.5, 0.5]).y, 0);
  near(forward(probe).y, 0.7);
  near(differenceLamp(probe).y, 0.3);
  const score = risk([6, 8]);
  near(score.z, 2.6);
  near(score.p, 0.931, 0.0005);
  near(risk([2, 3]).p, 0.154, 0.0005);
  const w = affineWitness();
  near(w.pair, -0.71);
  near(w.doubleZero, -1);
  assert.deepEqual(rounded(transposeExample().right), [0.1, 3.2]);
  assert.deepEqual(rounded(transposeExample().wrong), [1.1, 2.8]);
  for (const [approach, departure, expected] of [
    [0, 0, -1],
    [1, 0, 0],
    [1, 0.025, 0.025],
    [1, 1, 1],
  ]) {
    const z = reluProbe({
      at: (_, phrase) => (phrase === 'Slide the probe' ? approach : departure),
    });
    near(z, expected);
    near(activations.ReLU.value(z), Math.max(0, expected));
    near(activations.ReLU.derivative(z), Number(expected > 0));
  }
  for (const [name, value] of [
    ['ReLU', 0],
    ['GELU', -0.2499],
    ['SiLU', 0.217],
  ])
    near(incomingSignal * activations[name].derivative(-1), value, 0.0001);
  assert.ok(swiglu().products.every((v) => v > 0));
  near(swiglu().y, 0.858, 0.001);
  assert.equal(denseParameterCount([2, 2, 1]), 9);
  assert.deepEqual(counts, [200960, 32896, 1290]);
  near(timeout.dz1[0], 0);
  near(timeout.dw1[1][1], 4 * timeout.dw1[1][0]);
  assert.ok(stableBce(0, 1) < timeout.loss);
  near(meanGrad[0][0], -1 / 12);
  near(meanGrad[1][0], 1 / 12);
  assert.equal(batchGrad.rows.length, 4);
  for (const { z1, h } of batchGrad.rows) {
    assert.equal(z1.length, 2);
    assert.ok(z1.every((value) => value > 0));
    assert.deepEqual(h, z1);
  }
  near(batchGrad.loss, 0.525188, 0.000001);
  near(afterBatch.loss, 0.497961, 0.000001);
  const analytic = gradientVector(batchGrad);
  const entries = [
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
  for (const [i, keys] of entries.entries()) {
    function lossWith(delta) {
      const params = structuredClone(PARAMETERS);
      const owner = keys.slice(0, -1).reduce((o, k) => o[k], params);
      owner[keys.at(-1)] += delta;
      return batchGradient(params).loss;
    }
    const e = 1e-5;
    near((lossWith(e) - lossWith(-e)) / (2 * e), analytic[i], 1e-8);
  }
  near(finiteReluSecant(0, 0.15), 0.5);
  near(finiteReluSecant(0.05, 0.02), 1);
  near(signed.dz1[1], (signed.score - signed.y) * PARAMETERS.w2[1]);
  near(signed.dz1[0], 0);
  for (const gradient of signed.dw1[0]) near(gradient, 0);
  near(signed.dz1[1], -0.05963, 0.00001);
  near(signed.dw1[1][0], signed.dz1[1] * signed.x[0]);
  near(signed.dw1[1][1], -2 * signed.dw1[1][0]);
  near(afterSigned.score, 0.4373, 0.00005);
  const { raw, means, spread } = scaleExample;
  assert.deepEqual(standardize(raw, means, spread), [1.5, 2]);
  assert.equal(sigmoid(-1000), 0);
  assert.equal(stableBce(-1000, 1), 1000);
  assert.deepEqual(routes(0.6), [false, true, false, true]);
  assert.deepEqual(routes(0.62), [false, false, false, true]);
  assert.equal(bucket.filter(Boolean).length, 93);
  assert.ok(sampledError(8) < sampledError(4) && sampledError(4) < sampledError(2));
  near(arch(fitProbe), 1.5);
}
export default { title: 'Building a Neural Network', draw, check };

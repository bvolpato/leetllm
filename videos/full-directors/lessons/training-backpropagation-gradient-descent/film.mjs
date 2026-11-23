import assert from 'node:assert/strict';
import { prepareCaptions } from './captions.mjs';

import { ground } from './drawing.mjs';
import { affine, latencyScenes, squarePaths } from './latency.mjs';
import { networks, routeScenes } from './gates.mjs';
import { batch, evalInputs, evalOutputs, momentumStep, signedInput, signedStep, tokens, trainingScenes } from './training.mjs';
import { clip, initialScale, reluSample, signalScenes } from './signals.mjs';
import { checkpointTrace, classifier, decisionScenes, shiftedLogits, shiftedLoss } from './decisions.mjs';
import {
  finiteDifference,
  updateOnce,
} from '../../../films/training-backpropagation-gradient-descent/model.mjs';

const painters = [
  ...latencyScenes,
  routeScenes.localRules,
  routeScenes.network,
  routeScenes.transfer,
  ...trainingScenes,
  ...signalScenes,
  ...decisionScenes,
  routeScenes.signed,
];

function near(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `Expected ${actual} to equal ${expected}`);
}
function check() {
  assert.equal(painters.length, 19);
  assert.deepEqual(
    [
      affine.prediction,
      affine.residual,
      affine.gradWeight,
      affine.gradBias,
      affine.weight,
      affine.bias,
      affine.nextPrediction,
      affine.nextLoss,
    ],
    [2, -4, -8, -4, 1.8, 0.4, 4, 2],
  );
  const slope = finiteDifference(0.01);
  near(slope.minus, 8.0802);
  near(slope.plus, 7.9202);
  near(slope.numerical, affine.gradWeight);
  assert.deepEqual(squarePaths(3), [3, 3]);
  const [width, height] = squarePaths(3);
  near((3 + 0.2) ** 2 - 9, 0.2 * width + 0.2 * height + 0.2 ** 2);
  for (const [i, m] of networks.entries()) {
    const live = i === 2 ? 1 : 0,
      closed = 1 - live;
    assert.equal(m.gradWeights[closed], 0);
    assert.equal(m.gradOut[closed], 0);
    assert.equal(m.nextWeights[closed], m.weights[closed]);
    assert.equal(m.nextBiases[closed], m.biases[closed]);
    assert.equal(m.gradWeights[live], m.residual * m.outWeights[live] * m.x);
    assert.equal(m.gradOut[live], m.residual * m.hidden[live]);
    near(m.nextPrediction, [4.4, 5.3, 4.65][i]);
    near(m.nextLoss, [1.28, 1.445, 2.76125][i]);
  }
  const signedNetwork = networks[2];
  const startProduct = signedNetwork.weights[1] * signedNetwork.x;
  const updatedProduct = signedNetwork.nextWeights[1] * signedNetwork.x;
  near(startProduct, 2);
  near(signedNetwork.nextWeights[1] - signedNetwork.weights[1], -0.2);
  near(updatedProduct - startProduct, 0.4);
  near(signedNetwork.nextHidden[1], 3.5);
  near(signedNetwork.target - signedNetwork.nextPrediction, 2.35);
  near(momentumStep(null), 1);
  near(momentumStep(0), 0.82);
  assert.deepEqual(evalInputs, [1, 2, 3]);
  assert.deepEqual(evalOutputs, [3, 5, 7]);
  near(batch.full.weight, -34 / 3);
  near(batch.weighted.weight, batch.full.weight);
  near(batch.equal.weight, -13.75);
  near(tokens.mean, 3.4);
  assert.deepEqual(tokens.counts, [3, 7]);
  assert.deepEqual(tokens.means, [2, 4]);
  assert.deepEqual(tokens.weights, [0.3, 0.7]);
  const nextResidual = signedStep.nextPrediction - signedInput.target;
  assert.deepEqual([signedStep.gradWeight, signedStep.gradBias, nextResidual * signedInput.x, nextResidual], [8, -4, 4, -2]);
  assert.deepEqual(
    [0.1, 0.2, 0.4, 0.5].map((r) => updateOnce(r).multiplier),
    [0.5, 0, -1, -1.5],
  );
  near(updateOnce(0.5).nextLoss, 18);
  assert.deepEqual(clip([6, 8], 5), { norm: [3, 4], coordinate: [5, 5] });
  near(initialScale(128, 64).xavier, 1 / 96);
  near(initialScale(128, 64).he, 1 / 64);
  near(reluSample(1).moment, 0.5);
  near(reluSample(2).moment, 1);
  for (const gain of [1, 1.5, 2]) {
    const { inputMoment, relu, moment } = reluSample(gain);
    near(inputMoment, gain);
    near(moment, gain / 2);
    assert.deepEqual(relu.slice(0, 4), [0, 0, 0, 0]);
  }
  for (const [values, delta, patience, best] of [
    [[4.5, 3.1, 2, 1.8, 1.85, 1.92, 2.1], 0.0001, 3, 4],
    [[1, 0.995, 0.996], 0.01, 2, 2],
    [[1, 0.995, 0.994], 0.01, 2, 3],
    [[1, 0.996, 0.993], 0.01, 2, 3],
  ]) {
    const end = checkpointTrace(values, delta, patience).at(-1);
    assert.equal(end.bestEpoch, best);
    assert.equal(end.stopped, true);
    assert.equal(end.used, patience);
  }
  const shifted = classifier.logits.map((v) => Math.exp(v - Math.max(...classifier.logits)));
  shifted.forEach((v, i) =>
    near(v / shifted.reduce((a, b) => a + b, 0), classifier.probabilities[i]),
  );
  assert.deepEqual(classifier.gradient, [0.2, -0.7, 0.5]);
  near(Math.max(...shiftedLogits), 0);
  near(shiftedLoss, -Math.log(0.3));
  return true;
}
export default {
  title: 'How a Prediction Learns from Its Error',
  preparePicture: prepareCaptions,

  draw(c, k) {
    ground(c);
    painters[k.beat.chapterIndex](c, k);
  },
  check,
};

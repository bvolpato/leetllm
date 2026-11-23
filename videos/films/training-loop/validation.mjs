import {
  accumulationBeatSpan,
  epochMean,
  firstDerivativeCue,
  loopAmpOrder,
  loopClip,
  loopMicrobatch,
  loopMomentum,
  secondDerivativeCue,
} from './arithmetic.mjs';
import { measuredValidation } from './fixtures.mjs';
import { checkpointSnapshot, loopFreshState, modelSnapshot } from './construction.mjs';
import { LOOP_BIGRAM, fitHistory, oneTrainingStep } from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  validateLoopConstruction();
  const step = oneTrainingStep();
  assert.deepEqual(step.logits, [
    [0, 0],
    [0, 0],
  ]);
  assert.deepEqual(step.probabilities, [
    [0.5, 0.5],
    [0.5, 0.5],
  ]);
  assert(Math.abs(step.loss - Math.log(2)) < 1e-12);
  assert.deepEqual(step.gradient, [
    [0.5, 0.5],
    [-0.5, -0.5],
  ]);
  assert.deepEqual(step.updated, [
    [-0.1, -0.1],
    [0.1, 0.1],
  ]);
  assert.deepEqual(
    modelSnapshot('phases', {
      beat: 1,
      beatP: 0.98,
    }).weights,
    step.weights,
  );
  assert.deepEqual(
    modelSnapshot('phases', {
      beat: 1,
      beatP: 0.999999,
    }).weights,
    step.weights,
  );
  assert.deepEqual(
    modelSnapshot('phases', {
      beat: 2,
      beatP: 0,
    }).weights,
    step.weights,
  );
  assert.deepEqual(
    modelSnapshot('phases', {
      beat: 2,
      beatP: 0.000001,
    }).weights,
    [
      [-1e-7, -1e-7],
      [1e-7, 1e-7],
    ],
  );
  assert.deepEqual(
    modelSnapshot('phases', {
      beat: 2,
      beatP: 0.5,
    }).weights,
    [
      [-0.05, -0.05],
      [0.05, 0.05],
    ],
  );
  assert.deepEqual(
    modelSnapshot('phases', {
      beat: 2,
      beatP: 1,
    }).weights,
    step.updated,
  );
  assert.deepEqual(
    modelSnapshot('tensors', {
      beat: 0,
      beatP: 0.98,
    }).indices,
    [0, 1, 2, 3],
  );
  assert.deepEqual(
    modelSnapshot('tensors', {
      beat: 1,
      beatP: 0.98,
    }).indices,
    [4, 5],
  );
  assert.equal(epochMean([0.2, 0.5], [4, 2]), 0.3);
  assert.equal((0.2 + 0.5) / 2, 0.35);
  assert.deepEqual(
    modelSnapshot('accumulation', {
      beat: 0,
      beatP: firstDerivativeCue - 1e-6,
    }),
    {
      stored: 0,
      backwardCalls: 0,
    },
  );
  assert.deepEqual(
    modelSnapshot('accumulation', {
      beat: 0,
      beatP: firstDerivativeCue,
    }),
    {
      stored: 2,
      backwardCalls: 1,
    },
  );
  for (const wordTime of [9.7375, 10.875, 11.9375, 13.7875]) {
    assert.deepEqual(
      modelSnapshot('accumulation', {
        beat: 0,
        beatP: wordTime / accumulationBeatSpan,
      }),
      {
        stored: 2,
        backwardCalls: 1,
      },
    );
  }
  assert.deepEqual(
    modelSnapshot('accumulation', {
      beat: 0,
      beatP: secondDerivativeCue,
    }),
    {
      stored: 4,
      backwardCalls: 2,
    },
  );
  assert.deepEqual(
    modelSnapshot('accumulation', {
      beat: 0,
      beatP: 15.175 / accumulationBeatSpan,
    }),
    {
      stored: 4,
      backwardCalls: 2,
    },
  );
  assert.deepEqual(
    modelSnapshot('accumulation', {
      beat: 1,
      beatP: 0.5,
    }),
    {
      stored: 0,
      backwardCalls: 0,
    },
  );
  assert.equal(fitHistory.length, 121);
  assert.equal(fitHistory[0].loss.toFixed(4), '0.6521');
  assert.equal(fitHistory[4].correct, 6);
  assert.equal(fitHistory[5].correct, 8);
  assert.equal(fitHistory[60].loss.toFixed(4), '0.0150');
  assert.equal(fitHistory[120].loss.toFixed(4), '0.0056');
  assert.equal(fitHistory[120].accuracy, 1);
  const initialFit = modelSnapshot('fit-batch', {
    beat: 0,
    beatP: 0.43,
  });
  assert.equal(initialFit.updates, 0);
  assert.equal(initialFit.correct, 4);
  assert.equal(
    modelSnapshot('fit-batch', {
      beat: 0,
      beatP: 0.44,
    }).updates,
    0,
  );
  const midwayFit = modelSnapshot('fit-batch', {
    beat: 0,
    beatP: 0.58,
  });
  assert.equal(midwayFit.updates, 60);
  assert.equal(midwayFit.loss, fitHistory[60].loss);
  assert.deepEqual(midwayFit.weights, fitHistory[60].weights);
  assert.equal(midwayFit.predictions.length, 8);
  assert.equal(
    modelSnapshot('fit-batch', {
      beat: 0,
      beatP: 0.72,
    }).updates,
    120,
  );
  assert.equal(
    modelSnapshot('fit-batch', {
      beat: 0,
      beatP: 0.74,
    }).updates,
    120,
  );
  assert.equal(
    modelSnapshot('fit-batch', {
      beat: 1,
      beatP: 0.02,
    }).loss,
    fitHistory[120].loss,
  );
  assert.deepEqual(measuredValidation, {
    bestEpoch: 60,
    loss: 0.0118,
    selectedAccuracy: 1,
  });
  const checkpoint = checkpointSnapshot(1);
  assert.equal(checkpoint.live, checkpoint.plain);
  assert.deepEqual(checkpoint.live, [
    [1, 1],
    [1, 1],
  ]);
  assert.deepEqual(checkpoint.copied, [
    [0, 0],
    [0, 0],
  ]);
  assert.notEqual(checkpoint.live, checkpoint.copied);
  return true;
}
export function validateLoopConstruction() {
  assert.deepEqual(loopMomentum(1, null), {
    weight: 0.9,
    buffer: 1,
  });
  assert(Math.abs(loopMomentum(1, 0).weight - 0.81) < 1e-12);
  assert.deepEqual(loopMicrobatch().gradient, [2 / 3, 0.5]);
  assert.deepEqual(loopMicrobatch(true).gradient, [0.75, 0.5]);
  assert.deepEqual(loopClip([6, 8], 5).gradient, [3, 4]);
  assert.equal(loopAmpOrder().wrongNorm, 0.25);
  assert.equal(loopAmpOrder().correctNorm, 2);
  assert.equal(LOOP_BIGRAM.trainPairs, 108);
  assert.equal(LOOP_BIGRAM.validationPairs, 75);
  assert.equal(LOOP_BIGRAM.unseen, 24);
  assert.equal(LOOP_BIGRAM.bestStep, 111);
  assert.equal(LOOP_BIGRAM.bestLoss.toFixed(3), '2.105');
  assert.equal(LOOP_BIGRAM.history[1000].validation.toFixed(3), '2.392');
  assert(Math.abs(LOOP_BIGRAM.floor - 1.0150154703) < 1e-10);
  const bad = loopFreshState(1, 0.99),
    fixed = loopFreshState(2, 0.99);
  assert.deepEqual(bad.weights, [
    [0.1, 0.1],
    [-0.1, -0.1],
  ]);
  assert.deepEqual(fixed.weights, [
    [-0.1, -0.1],
    [0.1, 0.1],
  ]);
  assert(Math.abs(bad.probabilities[1] - 0.3775406688) < 1e-10);
  assert(Math.abs(fixed.probabilities[1] - 0.6224593312) < 1e-10);
  assert.equal(loopFreshState(0, 0.99).sumVisible, false);
  return true;
}

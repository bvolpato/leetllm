import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import {
  draw,
  sampleModel,
  updateOnce,
  finiteDifference,
  microbatchGradients,
  validateModel,
  nonlinearTrace,
  tokenMeanTrace,
  classificationTrace,
} from '../animations/training-backpropagation-gradient-descent.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { readLesson } from '../lib/lesson.mjs';

registerLessonFonts();
const root = new URL('../../', import.meta.url).pathname;
const lesson = await readLesson(
  root + 'videos/lessons/training-backpropagation-gradient-descent.lesson.yaml',
  root,
);
function state(beat, progress = {}) {
  return {
    beat,
    beatP: 0.5,
    t: 20,
    duration: 80,
    opacity: 1,
    cues: Object.fromEntries(
      Object.entries(progress).map(([id, p]) => [
        id,
        {
          phase: p < 0 ? 'before' : p > 1 ? 'after' : 'active',
          progress: Math.max(0, Math.min(1, p)),
          strength: 0.8,
          targets: [],
        },
      ]),
    ),
  };
}
function paint(id, current) {
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    lesson.scenes.find((row) => row.id === id),
    current,
    draw,
  );
}

test('one atomic optimizer event changes both parameters while its backward reference stays fixed', () => {
  const before = sampleModel('one-update', state(0, { 'update-apply': -1 }));
  const after = sampleModel('one-update', state(0, { 'update-apply': 0.01 }));
  assert.deepEqual([before.currentWeight, before.currentBias, before.currentPrediction], [1, 0, 2]);
  assert.deepEqual(
    [after.currentWeight, after.currentBias, after.currentPrediction, after.currentLoss],
    [1.8, 0.4, 4, 2],
  );
  assert.deepEqual(after.gradientReference, before.gradientReference);
  assert.deepEqual([after.gradWeight, after.gradBias], [-8, -4]);
});

test('shared paths contribute after arrival and explicit clearing leaves an empty gradient buffer', () => {
  const buffer = (progress) =>
    sampleModel(
      'autograd-buffer',
      state(1, {
        'buffer-first': progress[0],
        'buffer-second': progress[1],
        'buffer-repeat': -1,
        'buffer-clear': -1,
      }),
    ).currentBuffer;
  assert.equal(buffer([0.7, -1]), 0);
  assert.equal(buffer([1, -1]), 3);
  assert.equal(buffer([1, 1]), 6);
  const repeated = sampleModel(
    'autograd-buffer',
    state(2, { 'buffer-repeat': 1, 'buffer-clear': -1 }),
  );
  const cleared = sampleModel(
    'autograd-buffer',
    state(2, { 'buffer-repeat': 1, 'buffer-clear': 0.01 }),
  );
  assert.equal(repeated.currentBuffer, 12);
  assert.equal(cleared.currentBuffer, 0);
});

test('unequal chunks add completed contributions and preserve the intended per-example mean', () => {
  const at = (p) => sampleModel('batches', state(1, { 'batch-weight': p, 'batch-wrong': -1 }));
  assert.equal(at(0.3).accumulated, 0);
  assert(Math.abs(at(0.6).accumulated - (-6.5 * 2) / 3) < 1e-12);
  assert(Math.abs(at(1).accumulated - microbatchGradients().full.weight) < 1e-12);
  const wrong = sampleModel('batches', state(2, { 'batch-weight': 2, 'batch-wrong': 1 }));
  assert.deepEqual(wrong.weights, [0.25, 0.25, 0.5]);
  assert.equal(wrong.accumulated, -13.75);
  assert.equal(wrong.biasAccumulated, -5.5);
});

test('norm clipping preserves the ray and its triangle tip remains unobstructed', () => {
  const current = state(1, { 'deep-clip': 1 });
  const model = sampleModel('deep-gradients', current);
  assert.deepEqual(model.currentVector, [3, 4]);
  assert.equal(model.currentNorm, 5);
  const audit = paint('deep-gradients', current);
  const target = audit.targets.find((row) => row.id === 'clipped-gradient-vector');
  assert(target && target.markCounts.connectors === 1 && target.markCounts.shapes === 0);
});

test('fixed initialization scales preserve the intended ReLU second moment rather than its variance', () => {
  const current = state(2, { 'init-sum': 2, 'init-scale': 2, 'init-relu': 1, 'init-he': 0 });
  const relu = sampleModel('initialization', current);
  assert.equal(relu.preactivationVariance, 1);
  assert(Math.abs(relu.outputSecondMoment - 0.5) < 1e-12);
  const he = sampleModel(
    'initialization',
    state(2, { 'init-sum': 2, 'init-scale': 2, 'init-relu': 1, 'init-he': 1 }),
  );
  assert.equal(he.preactivationVariance, 2);
  assert(Math.abs(he.outputSecondMoment - 1) < 1e-12);
});

test('the displayed He weight variance follows the plotted intermediate signal scale', () => {
  const current = state(2, {
    'init-sum': 2,
    'init-scale': 2,
    'init-relu': 1,
    'init-he': 0.5,
    'init-he-points': -1,
    'init-moment': -1,
  });
  const model = sampleModel('initialization', current);
  assert.equal(model.weightVariance, 1.5 / 256);
  assert.equal(model.preactivationVariance, 1.5);
  const audit = paint('initialization', current);
  assert(audit.labels.some((label) => label.text.includes('1.5}{256}')));
});

test('the validation curve shows its first point as soon as the narrated build cue starts', () => {
  const current = state(1, {
    'validation-build': 0.01,
    'validation-best': -1,
    'validation-patience': -1,
    'validation-restore': -1,
  });
  assert.equal(sampleModel('validation', current).visibleEpochs, 1);
  const audit = paint('validation', current);
  const target = audit.targets.find((row) => row.id === 'validation-curve');
  assert(target && target.markCounts.shapes > 0);
});

test('centered checks and the negative-input update agree with the same analytic mechanism', () => {
  assert.equal(validateModel(), true);
  assert(Math.abs(finiteDifference(0.01).numerical + 8) < 1e-10);
  const negative = updateOnce(0.1, { x: -2, target: 6, weight: -1, bias: 0 });
  assert.deepEqual([negative.gradWeight, negative.weight, negative.nextPrediction], [8, -1.8, 4]);
});

test('the nonlinear saved gates produce all seven parameter gradients under both requests', () => {
  const forward = (p, x) =>
    p[4] * Math.max(0, p[0] * x + p[2]) + p[5] * Math.max(0, p[1] * x + p[3]) + p[6];
  for (const [x, target, rate, payoff, loss] of [
    [2, 6, 0.05, 4.4, 1.28],
    [3, 7, 0.025, 5.3, 1.445],
  ]) {
    const trace = nonlinearTrace(x, target, rate),
      params = [1, -1, 0, 1, 1, 1, 0],
      analytic = [...trace.gradWeights, ...trace.gradBiases, ...trace.gradOut, trace.gradOutBias];
    params.forEach((_, i) => {
      const plus = [...params],
        minus = [...params],
        eps = 1e-6;
      plus[i] += eps;
      minus[i] -= eps;
      const numerical =
        (0.5 * (forward(plus, x) - target) ** 2 - 0.5 * (forward(minus, x) - target) ** 2) /
        (2 * eps);
      assert(Math.abs(numerical - analytic[i]) < 1e-7);
    });
    assert(Math.abs(trace.nextPrediction - payoff) < 1e-12);
    assert(Math.abs(trace.nextLoss - loss) < 1e-12);
    assert.equal(trace.gradOut[1], 0);
  }
  const reversed = nonlinearTrace(-2, 6, 0.05);
  assert.deepEqual(reversed.hidden, [0, 3]);
  assert.equal(reversed.gradWeights[0], 0);
  assert.notEqual(reversed.gradWeights[1], 0);
});

test('fresh nonlinear parameters update before their recomputed prediction is revealed', () => {
  const current = state(1, {
    'transfer-forward': 2,
    'transfer-gradients': 2,
    'transfer-weights': 0.1,
    'transfer-hidden': -1,
    'transfer-result': -1,
    'transfer-loss': -1,
  });
  const pending = sampleModel('network-transfer', current);
  assert.equal(pending.updated, false);
  const applied = sampleModel(
    'network-transfer',
    state(1, {
      'transfer-forward': 2,
      'transfer-gradients': 2,
      'transfer-weights': 2,
      'transfer-hidden': -1,
      'transfer-result': -1,
      'transfer-loss': -1,
    }),
  );
  assert.equal(applied.updated, true);
  assert.equal(pending.recomputed, false);
  assert.equal(pending.payoff, false);
  assert.equal(pending.lossReady, false);
  assert.deepEqual(pending.nextWeights, [1.3, -1]);
  assert.deepEqual(pending.gradWeights, [-12, 0]);
});

test('token accumulation preserves the actual masked mean and normalized classification gradients sum to zero', () => {
  const trace = tokenMeanTrace();
  assert.deepEqual(trace.counts, [3, 7]);
  assert(Math.abs(trace.mean - trace.chunks.flat().reduce((a, b) => a + b) / 10) < 1e-12);
  assert(Math.abs(trace.mean - trace.incorrectRequestMean) > 0.7);
  const classification = classificationTrace();
  assert(Math.abs(classification.gradient.reduce((a, b) => a + b)) < 1e-12);
  const exponentials = classification.logits.map(Math.exp),
    total = exponentials.reduce((a, b) => a + b);
  exponentials.forEach((v, i) =>
    assert(Math.abs(v / total - classification.probabilities[i]) < 1e-12),
  );
});

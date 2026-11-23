import { registerLessonFonts } from '../lib/fonts.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import {
  precisionDecision,
  crossoverCost,
  allocatorCase,
  profilingTrace,
  backendChoice,
  classifierFixture,
  classifierShapes,
  classifierTrainingFixture,
  draw,
  float32Neighbors,
  sampleModel,
  validateModel,
} from '../animations/mps-metal-mac-ml-training.mjs';
registerLessonFonts();
const cue = (phase, progress = 0) => ({
  phase,
  progress,
  reveal: phase === 'before' ? 0 : progress,
  active: phase === 'during',
  strength: 0,
  targets: [],
});
const paint = (id, state) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: 'One ticket through the Apple GPU' },
    { t: 10, duration: 60, opacity: 1, ...state },
    draw,
  );
const at = (id, beat, p, cues = {}) => sampleModel(id, { beat, beatP: p, cues });
function crossEntropy(pooled, labels, weights, biases) {
  return pooled.reduce((total, row, ticket) => {
    const logits = biases.map((b, k) => row.reduce((sum, v, j) => sum + v * weights[j][k], b)),
      max = Math.max(...logits),
      logZ = Math.log(logits.reduce((n, x) => n + Math.exp(x - max), 0)) + max;
    return total + (logZ - logits[labels[ticket]]) / labels.length;
  }, 0);
}

test('backend routing requires build capability and current runtime availability', () => {
  assert.equal(backendChoice({ built: true, available: false }), 'cpu');
  assert.equal(backendChoice({ built: false, available: true }), 'cpu');
  assert.equal(backendChoice({ built: true, available: true }), 'mps');
  assert.equal(at('backend', 1, 0.99, { 'runtime-open': cue('before') }).selected, 'cpu');
  assert.equal(at('backend', 1, 0.01, { 'runtime-open': cue('during', 0.2) }).selected, 'mps');
});
test('a returned MPS copy leaves the CPU source intact and assignment changes the binding', () => {
  const copied = at('assignment', 0, 0.99, { 'returned-copy': cue('after', 1) });
  assert(copied.copyReady);
  assert.equal(copied.batchDevice, 'cpu');
  assert.equal(copied.sourceDevice, 'cpu');
  const waiting = at('assignment', 1, 0.99, { 'assign-return': cue('before') });
  assert.equal(waiting.batchDevice, 'cpu');
  const assigned = at('assignment', 1, 0.01, { 'assign-return': cue('during', 0.2) });
  assert.equal(assigned.batchDevice, 'mps');
  assert.equal(assigned.sourceDevice, 'cpu');
});
test('the prediction precedes the device-mismatch reveal', () => {
  const before = paint('opening', { beat: 1, beatP: 0.99, cues: { 'failed-call': cue('before') } });
  assert(before.labels.some((l) => l.text === 'Will this call succeed?'));
  assert(!before.labels.some((l) => l.text === 'DEVICE MISMATCH'));
  const after = paint('opening', {
    beat: 1,
    beatP: 0.01,
    cues: { 'failed-call': cue('during', 0.5) },
  });
  assert(after.labels.some((l) => l.text === 'DEVICE MISMATCH'));
});
test('pooling counts only arrived positions and hides the reduced shape until the spoken reveal', () => {
  assert.deepEqual(classifierShapes(), { input: [4, 8, 16], pooled: [4, 16], logits: [4, 3] });
  const partial = at('pooling', 1, 0.99, {
    'average-positions': cue('during', 0.5),
    'mean-shape': cue('after', 1),
  });
  assert.equal(partial.positions, 4);
  assert.equal(partial.shapeReady, false);
  assert(
    Math.abs(partial.mean - partial.values.slice(0, 4).reduce((n, x) => n + x, 0) / 4) < 1e-12,
  );
  const delayed = at('pooling', 1, 0.99, {
    'average-positions': cue('after', 1),
    'mean-shape': cue('before'),
  });
  assert.equal(delayed.positions, 8);
  assert.equal(delayed.shapeReady, false);
  assert(
    at('pooling', 1, 0.01, {
      'average-positions': cue('after', 1),
      'mean-shape': cue('during', 0.5),
    }).shapeReady,
  );
});
test('one class accumulator includes its bias and exactly the products already revealed', () => {
  const f = classifierTrainingFixture(),
    partial = at('score', 1, 0.99, { 'sum-products': cue('during', 0.25) });
  assert.equal(partial.terms, 4);
  assert.equal(partial.complete, false);
  assert.equal(
    partial.score,
    f.firstClassBias + f.firstClassContributions.slice(0, 4).reduce((n, x) => n + x, 0),
  );
  const final = at('score', 1, 0.01, { 'sum-products': cue('after', 1) });
  assert(final.complete);
  assert(Math.abs(final.score - classifierFixture().logits[0][0]) < 1e-12);
});
test('probabilities precede one-ticket loss and batch loss is constructed separately', () => {
  assert.equal(
    at('probabilities', 0, 0.99, { 'probability-bars': cue('before') }).probabilitiesReady,
    false,
  );
  const probability = at('probabilities', 0, 0.01, { 'probability-bars': cue('during', 0.5) });
  assert(probability.probabilitiesReady);
  assert.equal(probability.lossReady, false);
  const loss = at('probabilities', 1, 0.01, { 'correct-route-loss': cue('during', 0.5) });
  assert(loss.lossReady);
  assert.equal(loss.loss, -Math.log(loss.probabilities[0]));
  const partial = at('batch-update', 0, 0.99, { 'batch-loss': cue('during', 0.5) });
  assert.equal(partial.count, 2);
  assert.equal(partial.update, 0);
  const frame = paint('batch-update', {
    beat: 0,
    beatP: 0.99,
    cues: { 'batch-loss': cue('during', 0.5) },
  });
  assert(!frame.labels.some((l) => l.text.includes('L_{batch}=\\frac')));
  assert(frame.labels.some((l) => l.text === 'L_{batch}=?'));
});
test('batch cross-entropy gradients match an independent finite difference and lower the same-batch loss', () => {
  const f = classifierTrainingFixture(),
    pooled = classifierFixture().pooled,
    h = 1e-5,
    plus = f.weights.map((r) => [...r]),
    minus = f.weights.map((r) => [...r]);
  plus[0][0] += h;
  minus[0][0] -= h;
  const numerical =
    (crossEntropy(pooled, f.labels, plus, f.biases) -
      crossEntropy(pooled, f.labels, minus, f.biases)) /
    (2 * h);
  assert(Math.abs(numerical - f.gradients[0][0]) < 1e-8);
  assert.equal(
    f.firstWeightUpdate.after,
    f.firstWeightUpdate.before - f.learningRate * f.firstWeightUpdate.gradient,
  );
  assert(f.lossAfter < f.loss);
  assert(f.probabilities.every((r) => Math.abs(r.reduce((n, x) => n + x, 0) - 1) < 1e-12));
});
test('the float32 snap preserves the original pair while exposing its merged result', () => {
  assert.deepEqual(float32Neighbors(), {
    input: [16_777_216, 16_777_217],
    cast: [16_777_216, 16_777_216],
    preserved: false,
  });
  assert.equal(at('precision', 1, 0.99, { 'rounding-snap': cue('during', 0.5) }).merged, false);
  assert(at('precision', 1, 0.01, { 'rounding-snap': cue('after', 1) }).merged);
});
test('the unsynchronized clock stays frozen while device work advances', () => {
  const early = at('timing', 0, 0.1),
    late = at('timing', 0, 0.9);
  assert.equal(early.clock, 3);
  assert.equal(late.clock, 3);
  assert(early.workProgress < late.workProgress);
  const waited = at('timing', 1, 0.99, { 'wait-completion': cue('after', 1) });
  assert.equal(waited.clock, 38);
});
test('the memory comparison halves only the input allocation at fixed sequence length', () => {
  const before = at('memory-budget', 0, 0.99),
    after = at('memory-budget', 1, 0.99, { 'halve-batch': cue('after', 1) });
  assert.equal(before.inputMiB, 12);
  assert.equal(after.inputMiB, 6);
  assert.equal(after.batch, 16);
  assert.equal(after.positions, before.positions);
  assert.equal(after.features, before.features);
});
test('all topic model invariants remain valid', () => assert(validateModel()));
test('the float32 markers cannot cover the grid label while they converge', () => {
  const frame = paint('precision', { beat: 1, beatP: 0.6, cues: {} }),
    issues = [...frame.issues, ...layoutIssues(frame)];
  assert.equal(issues.length, 0, JSON.stringify(issues));
});
test('the changing loss is recomputed from the changing parameters', () => {
  const f = classifierTrainingFixture(),
    factor = 0.5,
    weights = f.weights.map((row, j) =>
      row.map((v, k) => v + (f.updatedWeights[j][k] - v) * factor),
    ),
    biases = f.biases.map((v, k) => v + (f.updatedBiases[k] - v) * factor);
  const expected = crossEntropy(classifierFixture().pooled, f.labels, weights, biases),
    sample = at('batch-update', 1, 0.99, { 'optimizer-update': cue('during', factor) });
  assert(Math.abs(sample.currentLoss - expected) < 1e-12);
  assert(
    Math.abs(sample.currentLoss - (f.loss + (f.lossAfter - f.loss) * factor)) > 1e-7,
    'the numeric loss follows the actual nonlinear objective',
  );
});
test('pooling highlights remain clear of the running-mean equation', () => {
  const frame = paint('pooling', {
      beat: 1,
      beatP: 0.5,
      cues: { 'average-positions': cue('during', 0.61), 'mean-shape': cue('before') },
    }),
    issues = layoutIssues(frame);
  assert.equal(issues.length, 0, JSON.stringify(issues));
});
test('a fallback ticket clears the route while entering CPU work and during the fade', () => {
  for (const [progress, opacity] of [
    [0.16, 1],
    [1, 0.9],
  ]) {
    const frame = paint('fallback', {
        beat: 1,
        beatP: 0.99,
        opacity,
        cues: { 'cpu-detour': cue(progress === 1 ? 'after' : 'during', progress) },
      }),
      issues = layoutIssues(frame);
    assert.equal(issues.length, 0, JSON.stringify(issues));
  }
});
test('autocast availability and task quality gate the candidate separately', () => {
  const good = { available: true, finite: true, metricDelta: 0.005, tolerance: 0.01 };
  assert.equal(precisionDecision({ ...good, available: false }).reason, 'unavailable');
  assert.equal(precisionDecision({ ...good, finite: false }).reason, 'nonfinite');
  assert.equal(precisionDecision({ ...good, metricDelta: 0.03 }).reason, 'task-quality');
  assert(precisionDecision(good).accepted);
  assert.equal(at('autocast', 0, 0.99).available, false);
  const pending = paint('autocast', {
    beat: 2,
    beatP: 0.99,
    cues: { 'quality-comparison': cue('before') },
  });
  assert(!pending.labels.some((l) => l.text === 'Return to the float32 reference'));
});
test('the crossover comes from arithmetic growth while launch overhead remains fixed', () => {
  const small = crossoverCost(256),
    large = crossoverCost(512);
  assert.equal(large.work / small.work, 8);
  assert.equal(large.dispatch, small.dispatch);
  assert.equal(small.winner, 'cpu');
  assert.equal(large.winner, 'mps');
  assert.equal(small.mps, 3.25);
  assert.equal(large.mps, 5);
  const state = at('crossover', 1, 0.99, { 'grow-workload': cue('during', 0.5) });
  assert.equal(state.width, 384);
  assert.equal(state.work, 3.375);
  assert.equal(state.host, state.work);
});
test('cache release changes driver allocation while preserving live tensor bytes', () => {
  const occupied = allocatorCase(0),
    released = allocatorCase(1),
    reduced = allocatorCase(2);
  assert.equal(occupied.live, released.live);
  assert.equal(occupied.driver - released.driver, occupied.cached);
  assert.equal(released.cached, 0);
  assert(released.peak > released.budget);
  assert.equal(released.accepted, false);
  assert.equal(reduced.input, occupied.input / 2);
  assert.equal(reduced.requested, released.requested / 2);
  assert.equal(reduced.peak, 38);
  assert(reduced.accepted);
  assert.equal(reduced.live, reduced.input + reduced.state + reduced.requested);
  const midway = at('allocator', 1, 0.99, {
    'release-unused': cue('during', 0.5),
    'request-activations': cue('before'),
  });
  assert.equal(midway.live, 24);
  assert.equal(midway.driver, 40);
  assert.equal(midway.requestVisible, false);
  assert.equal(at('allocator', 2, 0.99, { 'reduce-memory': cue('before') }).reducedReady, false);
});
test('the profiler example separates queued work from application-induced serialization', () => {
  const queued = profilingTrace(false),
    logged = profilingTrace(true);
  assert.equal(queued.completion, 13);
  assert.equal(logged.completion, 39);
  assert.equal(queued.waitUntilCompleted, false);
  assert.equal(logged.waitUntilCompleted, false);
  assert.deepEqual(
    queued.gpu.map((v) => v.end - v.start),
    [4, 4, 4],
  );
  assert.deepEqual(
    logged.gpu.map((v) => v.end - v.start),
    [4, 4, 4],
  );
  assert.equal(
    logged.host.filter((v) => v.kind === 'logging').reduce((n, v) => n + v.end - v.start, 0),
    24,
  );
  for (const trace of [queued, logged])
    for (const lane of [trace.host, trace.gpu])
      assert(lane.every((v, i) => i === 0 || v.start >= lane[i - 1].end));
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  serialMpsSchedule,
  tensorShapeContract,
  freshMpsFixture,
  mpsWatermarkExample,
  sampleModel,
} from '../animations/mps-metal-mac-ml-training.mjs';
const cue = (phase, progress = 0) => ({ phase, progress });
const at = (id, beat, cues = {}) => sampleModel(id, { beat, beatP: 0.99, cues });

test('the fallback schedule retains operations and charges both crossings exactly once', () => {
  const supported = serialMpsSchedule(false),
    detour = serialMpsSchedule(true);
  assert.deepEqual(
    supported.intervals.map((v) => v.id),
    ['A', 'U', 'B'],
  );
  assert.deepEqual(
    detour.intervals.map((v) => v.id),
    ['A', 'out', 'U', 'back', 'B'],
  );
  for (const trace of [supported, detour]) {
    assert.equal(trace.intervals[0].start, 0);
    trace.intervals.forEach((v, i) => {
      assert.equal(v.end - v.start, v.duration);
      if (i) assert.equal(v.start, trace.intervals[i - 1].end);
    });
    assert.equal(
      trace.total,
      trace.intervals.reduce((n, v) => n + v.duration, 0),
    );
  }
  assert.equal(supported.total, 9);
  assert.equal(detour.total, 15);
  assert.equal(detour.total - supported.total, 6);
  assert.equal(detour.intervals.find((v) => v.id === 'U').device, 'cpu');
});

test('arbitrary batch contracts preserve paired rows and account for raw float32 bytes', () => {
  assert.deepEqual(tensorShapeContract(5, 10, 12, 4), {
    input: [5, 10, 12],
    pooled: [5, 12],
    logits: [5, 4],
    bytes: 2400,
  });
  assert.equal(tensorShapeContract(2, 4, 48, 3).bytes, 1536);
  assert.throws(() => tensorShapeContract(1, 0, 8, 3));
  assert.throws(() => tensorShapeContract(1, 2.5, 8, 3));
});

test('the changed ticket result follows the supplied feature values and all class weights', () => {
  const f = freshMpsFixture(),
    input = Array.from({ length: 6 }, (_, i) => [i + 1, ...Array(7).fill(0)]);
  const pooled = Array.from(
    { length: 8 },
    (_, j) => input.reduce((sum, row) => sum + row[j], 0) / input.length,
  );
  const matrix = Array.from({ length: 8 }, (_, j) => (j === 0 ? [1, 0, -1] : [0, 0, 0]));
  const logits = [0, 1, 2].map((k) => pooled.reduce((sum, v, j) => sum + v * matrix[j][k], 0));
  assert.equal(f.mean, 3.5);
  assert.deepEqual(f.logits, logits);
  assert.deepEqual(logits, [3.5, 0, -3.5]);
  assert.deepEqual(f.pooled, [3, 8]);
  assert.deepEqual(f.logits.length, 3);
  assert.equal(f.sourceDevice, 'cpu');
});

test('the fresh prediction stays held until assignment and the spoken result each occur', () => {
  const before = at('fresh-ticket', 1, {
    'mps-fresh-assign': cue('before'),
    'mps-fresh-shapes': cue('after', 1),
    'mps-fresh-mean': cue('after', 1),
    'mps-fresh-logits': cue('after', 1),
  });
  assert.equal(at('fresh-ticket', 0).activeDevice, null);
  assert.equal(
    at('fresh-ticket', 1, { 'mps-fresh-cpu': cue('after', 1), 'mps-fresh-assign': cue('before') })
      .activeDevice,
    'cpu',
  );
  assert.equal(before.assigned, false);
  assert.equal(before.shapesReady, false);
  assert.equal(before.meanReady, false);
  assert.equal(before.logitsReady, false);
  const mean = at('fresh-ticket', 1, {
    'mps-fresh-assign': cue('after', 1),
    'mps-fresh-shapes': cue('after', 1),
    'mps-fresh-mean': cue('after', 1),
    'mps-fresh-logits': cue('before'),
  });
  assert(mean.assigned && mean.meanReady);
  assert.equal(mean.logitsReady, false);
  const unearned = at('fresh-ticket', 1, {
    'mps-fresh-assign': cue('after', 1),
    'mps-fresh-shapes': cue('after', 1),
    'mps-fresh-mean': cue('after', 1),
    'mps-fresh-weights': cue('before'),
    'mps-fresh-logits': cue('after', 1),
  });
  assert.equal(unearned.logitsReady, false);
  assert(
    at('fresh-ticket', 1, {
      'mps-fresh-assign': cue('after', 1),
      'mps-fresh-shapes': cue('after', 1),
      'mps-fresh-mean': cue('after', 1),
      'mps-fresh-logits': cue('during', 0.2),
    }).logitsReady,
  );
});

test('the high watermark multiplies the recommended working set and zero removes the limit', () => {
  assert(Math.abs(mpsWatermarkExample(6, 1.7).limitGiB - 10.2) < 1e-12);
  assert.equal(mpsWatermarkExample(8, 1.7).limitGiB, 13.6);
  assert.deepEqual(mpsWatermarkExample(6, 0), {
    recommendedGiB: 6,
    ratio: 0,
    limitGiB: null,
    limitDisabled: true,
  });
  assert.throws(() => mpsWatermarkExample(Infinity));
  assert.throws(() => mpsWatermarkExample(6, -1));
});

test('allocation and conversion are distinct visible states rather than an operator fallback', () => {
  const held = at('dtype-allocation', 0, { 'mps-dtype-reject': cue('before') });
  assert.equal(held.rejected, false);
  assert.equal(held.converted, false);
  const rejected = at('dtype-allocation', 0, { 'mps-dtype-reject': cue('after', 1) });
  assert(rejected.rejected);
  assert.equal(rejected.converted, false);
  const repaired = at('dtype-allocation', 1, { 'mps-dtype-convert': cue('during', 0.2) });
  assert(repaired.rejected && repaired.converted);
  assert.equal(Math.fround(16777216), Math.fround(16777217));
});

test('the timing receipt retains separate warmup, timed progress and completed-block normalization', () => {
  const half = at('measurement-receipt', 0, {
    'mps-measure-warm': cue('after', 1),
    'mps-measure-ten': cue('during', 0.5),
    'mps-measure-normalize': cue('before'),
  });
  assert.equal(half.warmProducts, 3);
  assert.equal(half.timedProducts, 5);
  assert.equal(half.warm, 1);
  assert.equal(half.timed, 0.5);
  assert.equal(half.normalized, false);
  const done = at('measurement-receipt', 0, {
    'mps-measure-warm': cue('after', 1),
    'mps-measure-ten': cue('after', 1),
    'mps-measure-normalize': cue('during', 0.3),
  });
  assert.equal(done.timedProducts, 10);
  assert.equal(done.timed, 1);
  assert(done.normalized);
  const premature = at('measurement-receipt', 0, {
    'mps-measure-ten': cue('during', 0.4),
    'mps-measure-normalize': cue('after', 1),
  });
  assert.equal(premature.normalized, false);
});

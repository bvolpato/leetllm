import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import {
  roundEven,
  affineGrid,
  teachingCodec,
  decodeTeachingCodec,
  groupedReduction,
  precisionExperiment,
  nominalRoofline,
  cachePool,
  trailingPlacement,
  freshQuantizationBudget,
  deferredBlockUpdate,
  draw,
} from '../animations/quantization.mjs';

registerLessonFonts();
const near = (a, b) => assert(Math.abs(a - b) < 1e-10, `${a} differs from ${b}`);

test('halfway rounding and relabeling signed affine codes preserve the declared real grid', () => {
  assert.deepEqual(
    [-3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5].map(roundEven),
    [-4, -2, -2, 0, 0, 2, 2, 4],
  );
  const values = [-3, -0.8, 0, 0.73, 2, 5],
    unsigned = affineGrid(values),
    signed = affineGrid(values, -1, 2, -8, 7);
  assert.deepEqual(
    signed.codes,
    unsigned.codes.map((q) => q - 8),
  );
  assert.deepEqual(signed.reconstructed, unsigned.reconstructed);
  assert.equal(affineGrid([0, 1, 3], 0, 3).zero, 0);
});

test('the decoder uses the stored count and scale rather than treating padding as another weight', () => {
  const fixture = teachingCodec(),
    values = decodeTeachingCodec(fixture.bytes);
  assert.equal(values.length, 5);
  fixture.codes.forEach((q, i) => near(values[i], q * fixture.scale));
  assert.deepEqual(Array.from(fixture.bytes.slice(12)), [0xc0, 0xf7, 0x02]);
  const three = fixture.bytes.slice(0, 14);
  new DataView(three.buffer).setUint32(0, 3, true);
  assert.equal(decodeTeachingCodec(three).length, 3);
});

test('malformed codec headers, reserved patterns and nonfinite reconstructions are rejected', () => {
  const original = teachingCodec().bytes;
  assert.throws(() => decodeTeachingCodec(original.slice(0, 11)), /header/);
  assert.throws(() => decodeTeachingCodec(original.slice(0, 14)), /payload/);
  assert.throws(() => decodeTeachingCodec(new Uint8Array([...original, 0])), /payload/);
  for (const scale of [0, -1, Infinity, NaN]) {
    const bytes = original.slice();
    new DataView(bytes.buffer).setFloat64(4, scale, true);
    assert.throws(() => decodeTeachingCodec(bytes), /scale/);
  }
  const reserved = original.slice();
  reserved[12] = 0xc8;
  assert.throws(() => decodeTeachingCodec(reserved), /Reserved/);
  const overflow = original.slice();
  new DataView(overflow.buffer).setFloat64(4, Number.MAX_VALUE, true);
  assert.throws(() => decodeTeachingCodec(overflow), /overflow/);
});

test('each completed group keeps its own scale while the next contribution accumulates', () => {
  for (const [progress, total] of [
    [0, 0],
    [0.25, 0.75],
    [0.5, 1.5],
    [0.75, 3.5],
    [1, 5.5],
  ])
    near(groupedReduction(progress).total, total);
  const f = groupedReduction();
  assert.deepEqual(f.partials, [6, 2]);
  assert.equal(f.wrong, 2);
  assert.deepEqual(
    f.accumulation.terms.map((t) => t.contribution),
    [
      [1.5, 0],
      [4, 0],
    ],
  );
});

test('the deferred worksheet applies the full matrix product to every later coordinate', () => {
  const before = deferredBlockUpdate(0),
    after = deferredBlockUpdate(1),
    half = deferredBlockUpdate(0.5);
  assert.deepEqual(before.after, before.before);
  const expected = [
    [0.71, -0.31, 1.23],
    [0.62, 1.005, -0.53],
  ];
  after.after.forEach((r, i) =>
    r.forEach((v, j) => {
      near(v, expected[i][j]);
      near(half.after[i][j], (before.before[i][j] + v) / 2);
    }),
  );
  assert.deepEqual(after.before, before.before);
});

test('held-out output errors come from reconstructed weights contracted with all three columns', () => {
  const coarse = precisionExperiment(2);
  assert.deepEqual(coarse.restored, [0, -2, 2, 0]);
  coarse.residuals.forEach((v, i) => near(v, [1.54, -0.1, 0.8][i]));
  near(coarse.mse, 1.0072);
  assert.deepEqual(
    [2, 4, 8].map((bits) => precisionExperiment(bits).payload),
    [1, 2, 4],
  );
  assert.deepEqual(
    [2, 4, 8].map((bits) => precisionExperiment(bits).mse.toFixed(6)),
    ['1.007200', '0.067010', '0.000204'],
  );
});

test('nominal roofline ceilings use dense compute and a separately declared byte stream', () => {
  const a = nominalRoofline('A100'),
    h = nominalRoofline('H100');
  near(a.ridge, 312 / 2.039);
  near(h.ridge, 989.5 / 3.35);
  near(h.bf16Milliseconds, 54 / 3.35);
  near(h.compactMilliseconds, 13.921875 / 3.35);
  assert(h.intensityOneShare < 0.004);
});

test('pool growth changes memory-only admission without shrinking one user’s state', () => {
  const a = cachePool(54),
    b = cachePool(13.92),
    ar = cachePool(54, true),
    br = cachePool(13.92, true);
  assert.equal(a.perUser, b.perUser);
  assert.equal(a.perUser, 335544320);
  assert.deepEqual([a.users, b.users, ar.users, br.users], [53, 173, 36, 119]);
  assert(b.users * b.perUser <= b.pool);
  assert((b.users + 1) * b.perUser > b.pool);
});

test('the output-inclusive placement count handles output-only, no offload and full offload', () => {
  assert.deepEqual(trailingPlacement(12, 5).gpuBlocks, [8, 9, 10, 11]);
  assert.equal(trailingPlacement(12, 1).outputGPU, true);
  assert.deepEqual(trailingPlacement(12, 1).gpuBlocks, []);
  assert.equal(trailingPlacement(12, 0).outputGPU, false);
  assert.deepEqual(trailingPlacement(12, 0).gpuBlocks, []);
  assert.equal(trailingPlacement(12, 13).gpuBlocks.length, 12);
});

test('the fresh A and B totals and their capacity geometry reveal independently', () => {
  const f = freshQuantizationBudget();
  assert.equal(f.totalA, 7.9375);
  assert.equal(f.totalB, 8.125);
  assert.equal(freshQuantizationBudget(3.875).totalB, 8);
  for (const [a, b] of [
    [0, 0],
    [1, 0],
    [1, 1],
  ]) {
    const id = 'fresh-quantization',
      cue = (p) => ({ phase: p === 1 ? 'after' : 'before', progress: p, strength: 0 });
    const state = {
      beat: 1,
      beatP: 0.8,
      t: 20,
      duration: 80,
      opacity: 1,
      cues: {
        'fresh-quantization-build-1': cue(1),
        'fresh-a-total': cue(a),
        'fresh-b-total': cue(b),
      },
    };
    const audit = drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      {},
      { id, title: 'Predict the complete budget', beats: [{}, {}, {}] },
      state,
      draw,
    );
    assert.deepEqual([...audit.issues, ...layoutIssues(audit)], []);
    const labels = audit.labels.map((l) => l.text);
    assert.equal(labels.includes('7.9375 GB'), a === 1);
    assert.equal(labels.includes('8.125 GB'), b === 1);
    const boundary = 460 + (8 * 1300) / 8.5,
      shapes = audit.shapes.filter((s) => s.y === 700 && s.height === 80);
    assert.equal(
      shapes.some((s) => s.x + s.width > boundary + 0.01),
      b === 1,
      'Candidate B must not geometrically answer the prediction before its completed total.',
    );
  }
});

test('cohort counts build before the full-task comparison is disclosed', () => {
  const cue = (p) => ({ phase: p === 1 ? 'after' : 'before', progress: p, strength: 0 });
  const paint = (source, candidate, comparison) => {
    const cues = {
      'paired-evaluation-build-1': cue(1),
      'paired-source-parse': cue(source),
      'paired-source-task': cue(source),
      'paired-candidate-parse': cue(candidate),
      'paired-candidate-task': cue(candidate),
      'paired-conclusion': cue(comparison),
    };
    const audit = drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      {},
      { id: 'paired-evaluation', title: 'Compare the same cohorts', beats: [{}, {}, {}] },
      { beat: 1, beatP: 0.8, t: 20, duration: 80, opacity: 1, cues },
      draw,
    );
    assert.deepEqual([...audit.issues, ...layoutIssues(audit)], []);
    return audit.labels.map((l) => l.text);
  };
  const start = paint(0, 0, 0);
  assert(!start.includes('85 fully correct'));
  assert(!start.includes('80 fully correct'));
  assert(!start.some((s) => s.includes('85% → 80%')));
  const source = paint(1, 0, 0);
  assert(source.includes('85 fully correct'));
  assert(!source.includes('80 fully correct'));
  const both = paint(1, 1, 0);
  assert(both.includes('85 fully correct'));
  assert(both.includes('80 fully correct'));
  assert(!both.some((s) => s.includes('85% → 80%')));
  assert(paint(1, 1, 1).some((s) => s.includes('85% → 80%')));
});

test('repairing candidate B cache preserves candidate A’s original complete allocation', () => {
  for (const progress of [0, 0.25, 0.5, 1]) {
    const id = 'fresh-quantization',
      audit = drawFrame(
        createCanvas(1920, 1080).getContext('2d'),
        {},
        { id, title: 'Repair one candidate', beats: [{}, {}, {}] },
        {
          beat: 2,
          beatP: 0.5,
          t: 20,
          duration: 80,
          opacity: 1,
          cues: {
            [`${id}-build-2`]: {
              phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
              progress,
              strength: 0,
            },
          },
        },
        draw,
      );
    assert.deepEqual([...audit.issues, ...layoutIssues(audit)], []);
    const labels = audit.labels.map((l) => l.text);
    assert(labels.includes('7.9375 GB'));
    if (progress === 0 || progress === 1)
      assert(labels.includes(Number((8.125 - 0.125 * progress).toFixed(4)) + ' GB'));
    else
      assert(
        !labels.includes(Number((8.125 - 0.125 * progress).toFixed(4)) + ' GB'),
        'A changing allocation does not disclose a completed total.',
      );
  }
});

test('in-progress matrix and cache labels do not claim their completed state', () => {
  const faults = [];
  for (const progress of [0.5, 1]) {
    for (const [id, beat] of [
      ['factor-order', 3],
      ['fresh-quantization', 2],
    ]) {
      const audit = drawFrame(
        createCanvas(1920, 1080).getContext('2d'),
        {},
        { id, title: 'Follow the current calculation', beats: [{}, {}, {}, {}] },
        {
          beat,
          beatP: 0.5,
          t: 20,
          duration: 80,
          opacity: 1,
          cues: {
            [`${id}-build-${beat}`]: {
              phase: progress === 1 ? 'after' : 'during',
              progress,
              strength: 0,
            },
          },
        },
        draw,
      );
      assert.deepEqual([...audit.issues, ...layoutIssues(audit)], []);
      const labels = audit.labels.map((l) => l.text);
      if (id === 'factor-order') {
        if (
          labels.includes('after deferred update') !== (progress === 1) ||
          labels.includes('applying deferred update') !== progress < 1
        )
          faults.push({
            id,
            progress,
            reason: 'The update label must distinguish applying from completed.',
          });
      } else {
        if (
          labels.some((s) => s.includes('exact boundary leaves no operating headroom')) !==
          (progress === 1)
        )
          faults.push({
            id,
            progress,
            reason: 'The moving over-budget allocation cannot claim the exact boundary.',
          });
        if (progress < 1) assert(freshQuantizationBudget(4 - 0.125 * progress).totalB > 8);
      }
    }
  }
  assert.deepEqual(faults, []);
});

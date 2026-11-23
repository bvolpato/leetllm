import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { betaDensity, productSnapshot } from '../animations/bayes.mjs';
import { accumulationSnapshot } from '../animations/estimation.mjs';
import { projectionFrame } from '../animations/linear-regression.mjs';
import { sampleModel as pythonFrame } from '../animations/python-for-ai-engineering.mjs';
import { layoutConstruction } from '../animations/tensor-shapes.mjs';
import { snapshotQueryFrame } from '../animations/sql-databases-data-modeling-ai.mjs';
import { momentumFrame } from '../animations/optimizers.mjs';
import { recurrenceFrame } from '../animations/rnn-memory.mjs';
import {
  priorDecodeFrame,
  reparameterizationFrame,
  spatialCompressionFrame,
  codesFrame,
} from '../animations/vae.mjs';
import { learningConstruction } from '../animations/logistic-regression.mjs';
import { boostingFrame } from '../animations/trees.mjs';

test('the Bayes product demonstration uses one normalizing area for the full density', () => {
  const v = productSnapshot(0.7);
  assert.equal(v.raw, v.prior * v.likelihood);
  assert.ok(Math.abs(v.posterior - betaDensity(10, 4, v.candidate)) < 1e-12);
  const steps = 4000,
    h = 1 / steps;
  let integral = 0;
  for (let i = 0; i <= steps; i++) {
    const p = i * h,
      raw = betaDensity(2, 2, p) * p ** 8 * (1 - p) ** 2;
    integral += raw * (i === 0 || i === steps ? 0.5 : 1) * h;
  }
  assert.ok(Math.abs(integral - v.evidence) < 1e-12);
  assert.equal(productSnapshot(0.63).normalized, false);
  assert.equal(productSnapshot(0.64).normalized, true);
});

test('controlled sample accumulation keeps the rate fixed while the Wilson range contracts', () => {
  const start = accumulationSnapshot(0, 1),
    finish = accumulationSnapshot(2, 0);
  assert.deepEqual([start.k, start.n, finish.k, finish.n], [4, 25, 64, 400]);
  let previousWidth = Infinity;
  for (let i = 0; i <= 100; i++) {
    const v = accumulationSnapshot(1, i / 100),
      width = v.interval.high - v.interval.low;
    assert.equal(v.estimate, 0.16);
    assert.equal(v.k, 4 * v.groups);
    assert.equal(v.n, 25 * v.groups);
    assert.ok(width <= previousWidth + 1e-12);
    assert.ok(v.interval.low < v.estimate && v.interval.high > v.estimate);
    previousWidth = width;
  }
  assert.ok(
    finish.interval.high - finish.interval.low < (start.interval.high - start.interval.low) / 3,
  );
});

test('projection construction retains the fitted residuals and accumulates both column balances', () => {
  const start = projectionFrame({ beat: 0, beatP: 0 }),
    predictions = projectionFrame({ beat: 0, beatP: 1 });
  assert.equal(start.predictions, 0);
  assert.equal(predictions.predictions, 5);
  assert.equal(predictions.residuals, 0);
  const partial = projectionFrame({ beat: 1, beatP: 0.49 });
  assert.equal(partial.residuals, 5);
  assert.equal(partial.balanced, 2);
  assert.equal(partial.residualBalanced, 5);
  assert.equal(partial.residualSum, 0);
  assert.equal(partial.weightedSum, 0);
  const final = projectionFrame({ beat: 2, beatP: 0.5 });
  assert.deepEqual(
    final.rows.map((row) => row.residual),
    [-2, 1, 2, 1, -2],
  );
  assert.deepEqual(
    final.rows.map((row) => row.weighted),
    [-2, 2, 6, 4, -10],
  );
  assert.equal(final.residualSum, 0);
  assert.equal(final.weightedSum, 0);
});

test('list references share a dictionary until the row-copy event precedes mutation', () => {
  const alias = pythonFrame('copies', { beat: 0, beatP: 0.8 }),
    shallow = pythonFrame('copies', { beat: 1, beatP: 0.8 });
  assert.equal(alias.sameList, true);
  assert.equal(shallow.sameList, false);
  assert.equal(shallow.sameRow, true);
  assert.equal(shallow.baselinePrediction, shallow.trialPrediction);
  const before = pythonFrame('copies', { beat: 2, beatP: 0.1 }),
    copied = pythonFrame('copies', { beat: 2, beatP: 0.3 }),
    mutated = pythonFrame('copies', { beat: 2, beatP: 0.8 });
  assert.equal(before.sameRow, true);
  assert.equal(copied.sameRow, false);
  assert.equal(copied.trialPrediction, 'escalated');
  assert.equal(mutated.baselinePrediction, 'escalated');
  assert.equal(mutated.trialPrediction, 'blocked');
});

test('reshape preserves flat order while transpose constructs complete feature rows', () => {
  const reshape = layoutConstruction(0, 1),
    transpose = layoutConstruction(1, 1);
  assert.deepEqual(reshape.order, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.deepEqual(transpose.order, [0, 4, 8, 1, 5, 9, 2, 6, 10, 3, 7, 11]);
  assert.equal(reshape.completed, 12);
  assert.equal(layoutConstruction(0, 0).completed, 0);
  for (const beat of [0, 1])
    for (let i = 0; i < 12; i++) {
      const frame = layoutConstruction(beat, 0.04 + (0.76 * (i + 0.5)) / 12);
      assert.equal(frame.completed, i);
      assert.equal(frame.active, frame.order[i]);
    }
});

test('Read Committed count and detail cross a concrete commit while the pinned export agrees', () => {
  const counted = snapshotQueryFrame(1, 0.2),
    committed = snapshotQueryFrame(1, 0.5),
    detailed = snapshotQueryFrame(1, 0.8),
    pinned = snapshotQueryFrame(2, 0.8);
  assert.equal(counted.readCommitted.count, 3);
  assert.equal(counted.repeatableRead.count, 3);
  assert.equal(counted.committed, false);
  assert.equal(committed.committed, true);
  assert.equal(committed.readCommitted.details, null);
  assert.equal(detailed.readCommitted.details.length, 4);
  assert.deepEqual(
    detailed.readCommitted.details.map((row) => row.id),
    ['c7c', 'c7d', 'c7e', 'c9a'],
  );
  assert.equal(pinned.repeatableRead.count, pinned.repeatableRead.details.length);
  assert.deepEqual(
    pinned.repeatableRead.details.map((row) => row.id),
    ['c7a', 'c7b', 'c9a'],
  );
});

test('local momentum vectors and recurrent memory comparisons use the actual numerical states', () => {
  for (let i = 0; i <= 10; i++) {
    const frame = momentumFrame(1, i / 10);
    assert.deepEqual(frame.gradient, [100 * frame.current.x, frame.current.y]);
    frame.update.forEach((value, j) =>
      assert.ok(Math.abs(value + 0.018 * frame.momentum[j]) < 1e-12),
    );
    assert.ok(Math.abs(frame.update[0] - (frame.next.x - frame.current.x)) < 1e-12);
    assert.ok(Math.abs(frame.update[1] - (frame.next.y - frame.current.y)) < 1e-12);
  }
  const previous = recurrenceFrame(1, 1),
    current = recurrenceFrame(2, 1);
  assert.equal(current.old, previous.output);
  assert.equal(current.output, Math.tanh(current.inputTerm + current.memoryTerm));
  assert.equal(current.withoutMemory, Math.tanh(current.inputTerm));
  assert.ok(current.output > current.withoutMemory);
  assert.equal(recurrenceFrame(2, 0.5).outputReady, false);
});

test('posterior reparameterization uses fixed noise and generation decodes an independent prior draw', () => {
  for (const beat of [0, 1])
    for (let i = 0; i <= 20; i++) {
      const frame = reparameterizationFrame(beat, i / 20);
      assert.deepEqual(
        frame.sample,
        frame.mean.map((value, j) => value + frame.scale[j] * frame.noise[j]),
      );
    }
  const start = reparameterizationFrame(1, 0),
    meanShift = reparameterizationFrame(1, 0.4),
    scaleShift = reparameterizationFrame(1, 1);
  assert.ok(Math.abs(meanShift.sample[0] - start.sample[0] - 0.7) < 1e-12);
  assert.ok(Math.abs(scaleShift.sample[0] - meanShift.sample[0] - 0.55 * 0.5) < 1e-12);
  assert.ok(Math.abs(scaleShift.sample[1] - meanShift.sample[1] + 0.35) < 1e-12);

  for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
    const generated = reparameterizationFrame(2, progress),
      decoded = priorDecodeFrame(progress);
    assert.deepEqual(generated.sample, [0.5, 0.5]);
    assert.deepEqual(decoded.latent, generated.sample);
    assert.equal(decoded.reveal, progress);
    assert.equal(decoded.pixels.length, 25);
    assert.ok(decoded.pixels.every((value) => value >= 0 && value <= 1));
    assert.ok(Math.abs(decoded.pixels[6] - 0.58) < 1e-12);
    assert.ok(Math.abs(decoded.pixels[5] - 0.14) < 1e-12);
    assert.ok(Math.abs(decoded.pixels[16] - 0.58) < 1e-12);
  }
  const changedInput = priorDecodeFrame(0.5, [0.25, 0.75]);
  assert.deepEqual(changedInput.latent, [0.25, 0.75]);
  assert(
    Math.abs(changedInput.pixels[6] - 0.33) < 1e-12 &&
      Math.abs(changedInput.pixels[16] - 0.83) < 1e-12,
  );
});

test('the fixed generation draw stays at its stated coordinate while that same input is decoded', async () => {
  const { createCanvas, GlobalFonts } = await import('@napi-rs/canvas');
  const { fileURLToPath } = await import('node:url');
  const { draw } = await import('../animations/vae.mjs');
  const { drawFrame } = await import('../lib/scene.mjs');
  const { layoutIssues } = await import('../lib/frame-audit.mjs');
  const { readLesson, frameState } = await import('../lib/lesson.mjs');
  const { resolveSceneCues } = await import('../lib/narration-cues.mjs');
  const { loadMeasuredTimeline } = await import('./helpers/measured-narration.mjs');
  registerLessonFonts();
  const root = fileURLToPath(new URL('../../', import.meta.url)),
    lesson = await readLesson(
      fileURLToPath(new URL('../lessons/vae.lesson.yaml', import.meta.url)),
      root,
    );
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'sampling'),
    scene = lesson.scenes[sceneIndex],
    measured = (await loadMeasuredTimeline('vae')).scenes[0];
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  const samples = timing.visualCues
    .filter((cue) => cue.beat === 2)
    .flatMap((cue) => [
      cue.start - 0.04,
      cue.start + 0.08,
      cue.start + 0.25 * (cue.end - cue.start),
      (cue.start + cue.end) / 2,
      cue.start + 0.75 * (cue.end - cue.start),
      cue.end + 0.07,
      cue.end + cue.linger + 0.2,
    ]);
  const transfers = [];
  for (const time of samples) {
    const state = frameState(timing, time, sceneIndex, lesson.scenes.length),
      generated = reparameterizationFrame(2, state.beatP, state.cues),
      decoded = priorDecodeFrame(1, generated.sample);
    let plot;
    const audit = drawFrame(ctx, lesson, scene, state, (ctx, scene, state, api) =>
      draw(ctx, scene, state, {
        ...api,
        teaching: { ...api.teaching, axes: (options) => (plot = api.teaching.axes(options)) },
      }),
    );
    assert.deepEqual(layoutIssues(audit), [], `Generation at ${time}s`);
    const expected = plot.point(...decoded.latent);
    const point = audit.shapes.find(
      (shape) =>
        shape.kind === 'circle' &&
        Math.hypot(shape.center.x - expected.x, shape.center.y - expected.y) < 0.01 &&
        Math.max(shape.fillAlpha ?? 0, shape.strokeAlpha ?? 0) > 0.5,
    );
    assert(point, 'The actual prior draw must stay visibly painted');
    assert(
      Math.abs(point.center.x - expected.x) < 0.01 && Math.abs(point.center.y - expected.y) < 0.01,
      `The painted point must equal the decoder input at ${time}s`,
    );
    const radius = point.width / 2,
      visibleEdge = point.fillAlpha > 0.5 ? 0 : radius * 0.9;
    const pointPixel = ctx.getImageData(
      Math.round(point.center.x + visibleEdge),
      Math.round(point.center.y),
      1,
      1,
    ).data;
    assert(
      pointPixel[0] > pointPixel[2] + 20 && pointPixel[1] > pointPixel[2] + 15,
      'The fixed prior point ring must be visibly painted',
    );
    const rule = audit.labels.find(
      (label) => label.kind === 'math' && label.text.startsWith('z=['),
    );
    assert.deepEqual(
      rule.text
        .match(/z=\[([^\]]+)\]/)[1]
        .split(',')
        .map(Number),
      decoded.latent,
    );
    assert.deepEqual(decoded.latent, generated.sample);
    assert(Math.abs(decoded.pixels[6] - (0.08 + decoded.latent[0])) < 1e-12);
    const decodeCue = state.cues['prior-decoded-output-b3-2'];
    if (decodeCue.phase === 'after' && decodeCue.strength === 0) {
      const pixel = ctx.getImageData(1525, 505, 1, 1).data,
        expectedGray = Math.round(25 + 210 * decoded.pixels[6]);
      assert(
        pixel.slice(0, 3).every((value) => Math.abs(value - expectedGray) <= 1),
        'The held output pixel must come from the displayed decoder input',
      );
    }
    const transfer = audit.shapes.find(
      (shape) =>
        shape.kind === 'circle' &&
        (shape.fillAlpha ?? 0) > 0.5 &&
        Math.hypot(shape.center.x - point.center.x, shape.center.y - point.center.y) > 24,
    );
    if (decodeCue.phase === 'during' && decodeCue.progress > 0 && decodeCue.progress < 1)
      assert(transfer, `The decoder transfer must be visibly moving at ${time}s`);
    if (transfer) transfers.push(transfer.center.x);
  }
  assert(
    new Set(transfers.map((x) => x.toFixed(2))).size >= 3,
    'Decoding must retain a visible transfer while the prior draw stays fixed',
  );
});

test('spatial compression builds one input patch before mapping it to one held latent position', () => {
  const before = spatialCompressionFrame(0),
    building = spatialCompressionFrame(0.25),
    ready = spatialCompressionFrame(0.5),
    moving = spatialCompressionFrame(0.75),
    held = spatialCompressionFrame(1);
  assert.equal(before.revealedPatchPositions, 0);
  assert.equal(building.revealedPatchPositions, 32);
  assert.equal(building.transportProgress, 0);
  assert.equal(ready.revealedPatchPositions, 64);
  assert.equal(ready.transportProgress, 0);
  assert.equal(ready.targetPositionVisible, false);
  assert.equal(moving.revealedPatchPositions, 64);
  assert(moving.transportProgress > 0 && moving.transportProgress < 1);
  assert.equal(moving.targetPositionVisible, false);
  assert.equal(held.transportProgress, 1);
  assert.equal(held.targetPositionVisible, true);
  assert.equal(held.inputPositionCount / held.latentPositionCount, 64);
  assert.equal(held.stride ** 2, 64);
  for (const beatP of [0, 0.5, 1]) {
    const completed = codesFrame(2, beatP, {
      'latent-patch-b3-1': { phase: 'after', progress: 1 },
    });
    assert.equal(completed.transportProgress, 1);
    assert.equal(completed.revealedPatchPositions, 64);
    assert.equal(completed.targetPositionVisible, true);
  }
});

test('spatial correspondence stays painted through its measured cue and held latent position', async () => {
  const { createCanvas, GlobalFonts } = await import('@napi-rs/canvas');
  const { fileURLToPath } = await import('node:url');
  const { draw } = await import('../animations/vae.mjs');
  const { drawFrame } = await import('../lib/scene.mjs');
  const { layoutIssues } = await import('../lib/frame-audit.mjs');
  const { readLesson, frameState } = await import('../lib/lesson.mjs');
  registerLessonFonts();
  const root = fileURLToPath(new URL('../../', import.meta.url)),
    lesson = await readLesson(
      fileURLToPath(new URL('../lessons/vae.lesson.yaml', import.meta.url)),
      root,
    );
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'codes'),
    scene = lesson.scenes[sceneIndex];
  // Measured codes narration: timeline SHA 7f6d50a28c64dbd6db50c27ebdb496eec434eca3d2feadd02463cf6ad9471c2b.
  const cueTimes = {
    'latent-patch-b3-1': [40.486, 46.7485],
    'latent-position-count-b3-2': [52.036, 54.1735],
    'spatial-cost-caveat-b3-3': [54.586, 56.511],
  };
  const timing = {
    fps: 30,
    duration: 62,
    beats: [
      { start: 0.4, until: 19.288 },
      { start: 19.288, until: 40.386 },
      { start: 40.386, until: 61.682 },
    ],
    visualCues: scene.beats[2].visual_cues.map((cue) => ({
      ...cue,
      beat: 2,
      start: cueTimes[cue.id][0],
      end: cueTimes[cue.id][1],
    })),
    cueTiming: 'provider-words',
  };
  const canvas = createCanvas(1920, 1080),
    paint = (time) =>
      drawFrame(
        canvas.getContext('2d'),
        lesson,
        scene,
        frameState(timing, time, sceneIndex, lesson.scenes.length),
        draw,
      );
  assert.deepEqual(
    layoutIssues(paint(40.81192)),
    [],
    'The production 2% sample must have every active focus target',
  );
  const targets = [];
  for (const time of [40.4, 40.81192, 43.61725, 45.182875, 46.85, 47.5]) {
    const audit = paint(time),
      target = audit.targets.find((target) => target.id === 'spatial-patch-correspondence');
    assert(target?.marks > 0, `The source-to-latent boundary must be painted at ${time}`);
    assert.deepEqual(layoutIssues(audit), [], `Measured spatial correspondence at ${time}`);
    targets.push(target);
  }
  assert(
    targets[0].width > targets.at(-1).width * 8,
    'The input-patch boundary must contract to the held latent cell',
  );
  assert(targets.at(-1).x > targets[0].x + 800, 'The same boundary must reach the latent grid');
});

test('the first logistic update averages every row before changing coefficients', () => {
  const start = learningConstruction(0),
    gradient = learningConstruction(0.7),
    updated = learningConstruction(1);
  assert.equal(start.completed, 0);
  gradient.sum.forEach((value, i) => assert.ok(Math.abs(value - [0, -2.75, -3][i]) < 1e-12));
  gradient.gradient.forEach((value, i) =>
    assert.ok(Math.abs(value - [0, -0.34375, -0.375][i]) < 1e-12),
  );
  assert.deepEqual(gradient.weights, [0, 0, 0]);
  updated.weights.forEach((value, i) =>
    assert.ok(Math.abs(value - [0, 0.06875, 0.075][i]) < 1e-12),
  );
});

test('the residual-fitted stump drives the first boosting correction and later rounds', () => {
  const residuals = boostingFrame(0, 1),
    fitted = boostingFrame(1, 0.3),
    updated = boostingFrame(1, 1),
    next = boostingFrame(2, 0);
  assert.deepEqual(residuals.residuals, [-20, -10, 30]);
  assert.equal(residuals.learnerReady, false);
  assert.deepEqual(fitted.leaves, [-15, 30]);
  assert.deepEqual(fitted.prediction, [30, 30, 30]);
  assert.deepEqual(updated.prediction, [28.5, 28.5, 33]);
  assert.deepEqual(next.prediction, updated.prediction);
});

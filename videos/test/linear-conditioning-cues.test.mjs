import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import * as model from '../animations/linear-algebra.mjs';
import { drawFrame } from '../lib/scene.mjs';
const { draw } = model;
registerLessonFonts();
const cue = (progress) => ({
  phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
  progress,
  strength: 0,
  targets: [],
});
const paint = (id, cues) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: 'Conditioning' },
    { beat: 0, beatP: 0.5, opacity: 1, cues },
    draw,
  );
const noise = (a, z) =>
  paint('conditioning-noise', {
    'conditioning-noise-b2-1': cue(a),
    'conditioning-inverse-b2-2': cue(z),
  });

test('the narrated map compresses the same unit circle and holds its final fixed ellipse', () => {
  const before = paint('conditioning-map', { 'condition-map': cue(0) }),
    after = paint('conditioning-map', { 'condition-map': cue(1) });
  const circles = (frame) => frame.paths.filter((p) => p.points.length === 121);
  assert.equal(circles(before).length, 2);
  assert.equal(circles(after).length, 2);
  const original = circles(before)[0].points,
    clean = circles(before)[1].points,
    compressed = circles(after)[1].points;
  const center = { x: (original[0].x + original[60].x) / 2, y: original[0].y };
  original.forEach((p, i) => {
    assert(Math.abs(p.x - clean[i].x) < 1e-10);
    assert(Math.abs(p.y - clean[i].y) < 1e-10);
    assert(Math.abs(p.x - compressed[i].x) < 1e-10);
    assert(Math.abs(compressed[i].y - center.y - 0.01 * (p.y - center.y)) < 1e-9);
  });
});

test('output noise changes before inversion and its completed error receipt waits for both cues', () => {
  const texts = (frame) => frame.labels.filter((l) => l.kind === 'math').map((l) => l.text);
  const clean = texts(noise(0, 0)),
    noisy = texts(noise(1, 0)),
    half = texts(noise(1, 0.5)),
    complete = texts(noise(1, 1));
  assert(clean.includes('0.002'));
  assert(clean.includes('0.20'));
  assert(noisy.includes('0.003'));
  assert(noisy.includes('0.20'));
  assert(half.includes('0.003'));
  assert(half.includes('0.25'));
  assert(complete.includes('0.003'));
  assert(complete.includes('0.30'));
  for (const row of [clean, noisy, half]) assert(!row.some((t) => t.includes('output error')));
  assert(
    complete.some((t) => t.includes('0.001') && t.includes('0.10') && t.includes('input error')),
  );
});

test('the solver comparison computes an explicit storage-rounding effect and recovers with extra precision', () => {
  const close = (a, z, tolerance = 1e-9) => assert(Math.abs(a - z) < tolerance, `${a} != ${z}`);
  const c = model.solverRoundingExample();
  assert.deepEqual(c.table, [
    [1, 1],
    [1, 1.04],
  ]);
  close(c.observations[1], 3.081);
  c.directWeights.forEach((v, i) => close(v, [0.975, 2.025][i]));
  c.normalWeights.forEach((v, i) => close(v, [1.8675, 1.15][i]));
  close(c.storedGram[1][1], 2.082);
  close(c.storedTarget[1], 6.204);
  close(c.gramConditionNumber, c.conditionNumber ** 2, 1e-6);
  assert(
    c.directNoiseError > 0 && c.directNoiseError < 0.04,
    'the original measurement disturbance still affects the direct fit',
  );
  assert(c.extraWeightDifference > 1);
  assert(c.normalResidual < 0.025);
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const state = model.solverRoundingExample(3, p);
    state.storedGram.forEach((row, i) =>
      close(
        row.reduce((n, v, j) => n + v * state.normalWeights[j], 0),
        state.storedTarget[i],
      ),
    );
    state.table.forEach((row, i) =>
      close(
        row.reduce((n, v, j) => n + v * state.normalWeights[j], 0),
        state.normalPrediction[i],
      ),
    );
  }
  assert(
    model.solverRoundingExample(6).extraWeightDifference < 1e-8,
    'sensitivity alone does not force a failure; the explicit intermediate rounding causes this example',
  );
});

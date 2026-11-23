import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import * as animation from '../animations/clustering-pca.mjs';
import { drawFrame } from '../lib/scene.mjs';
const cue = (progress) => ({ phase: progress === 1 ? 'after' : 'during', progress, strength: 0 });
test('standardization derives zero-mean unit-scale coordinates and reverses the paired-distance comparison', () => {
  const model = animation.scaleCalculation();
  assert.deepEqual(model.means, [0, 505]);
  for (const axis of [0, 1]) {
    const column = model.rows.map((row) => row.standardized[axis]);
    assert(Math.abs(column.reduce((a, b) => a + b, 0) / column.length) < 1e-12);
    assert(Math.abs(column.reduce((a, b) => a + b * b, 0) / column.length - 1) < 1e-12);
  }
  assert(model.pairs[0].raw > model.pairs[1].raw);
  assert(model.pairs[0].standardized < model.pairs[1].standardized);
  assert.deepEqual(model.rawLabels, [0, 1, 1, 0, 1, 1]);
  assert.deepEqual(model.standardizedLabels, [0, 0, 0, 1, 1, 1]);
});
test('the word cue constructs the row arithmetic and retains both correctly labeled membership columns', () => {
  const state = (progress) => ({
    beat: 1,
    beatP: 0.5,
    t: 20,
    duration: 50,
    opacity: 1,
    cues: { 'scale-beat-2-focus-1': cue(progress) },
  });
  const paint = (progress) => {
    const canvas = createCanvas(1920, 1080),
      ctx = canvas.getContext('2d');
    const audit = drawFrame(
      ctx,
      {},
      { id: 'scale', title: 'Check units' },
      state(progress),
      animation.draw,
    );
    return { pixels: ctx.getImageData(1030, 280, 740, 360).data, audit };
  };
  const before = paint(0),
    after = paint(1);
  assert(
    before.pixels.some((value, i) => value !== after.pixels[i]),
    'The standardization phrase must change actual worked coordinates',
  );
  const labels = after.audit.labels.map((label) => label.text);
  assert(labels.includes('Raw cluster'));
  assert(labels.includes('Scaled cluster'));
  assert.equal(labels.filter((label) => label === 'ID').length, 2);
  assert.equal(animation.scaleConstruction(state(0)).coordinateCount, 0);
  assert.equal(animation.scaleConstruction(state(0.5)).coordinateCount, 1);
  assert.equal(animation.scaleConstruction(state(1)).coordinateCount, 2);
  assert.equal(animation.scaleConstruction({ beat: 2, beatP: 0 }).progress, 1);
});

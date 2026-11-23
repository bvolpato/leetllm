import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import {
  calibrationHessian,
  contextBudgetState,
  draw,
  quantizationMemory,
} from '../animations/quantization.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

registerLessonFonts();

const cue = (progress) => ({
  progress,
  reveal: progress,
  phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
  active: false,
  strength: 0,
  targets: [],
});
function budgetCues(growth, overflow, restore) {
  return Object.fromEntries(
    [
      ['context-growth', growth],
      ['budget-overflow', overflow],
      ['restore-context', restore],
    ].map(([id, progress]) => [id, cue(progress)]),
  );
}
function render(id, beat, cues) {
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  const audit = drawFrame(
    ctx,
    {},
    { id, title: 'Quantization' },
    { beat, beatP: 0.95, t: 10, duration: 30, opacity: 1, cueTiming: 'provider-words', cues },
    draw,
  );
  assert.deepEqual([...audit.issues, ...layoutIssues(audit)], []);
  return {
    ...audit,
    labels: audit.labels.map((item) => item.text),
    pixels: (x, y, width, height) =>
      createHash('sha256')
        .update(ctx.getImageData(x, y, width, height).data)
        .digest('hex'),
  };
}

test('the two displayed calibration inputs construct the same Hessian used by GPTQ', () => {
  assert.deepEqual(calibrationHessian(0), [
    [0, 0],
    [0, 0],
  ]);
  assert.deepEqual(calibrationHessian(1), [
    [50, 10],
    [10, 2],
  ]);
  assert.deepEqual(calibrationHessian(2), [
    [82, 18],
    [18, 4],
  ]);
});

test('the measured context cues keep the prediction below the limit before demonstrating overflow and recovery', () => {
  const initial = contextBudgetState({ beat: 2, cues: budgetCues(0, 0, 0) });
  const prediction = contextBudgetState({ beat: 2, cues: budgetCues(1, 0, 0) });
  const overflow = contextBudgetState({ beat: 3, cues: budgetCues(1, 1, 0) });
  const recovery = contextBudgetState({ beat: 4, cues: budgetCues(1, 1, 1) });
  assert(initial.fits && prediction.fits);
  assert.equal(
    prediction.total,
    initial.total,
    'The proposed doubling must remain a question before allocation.',
  );
  assert(!overflow.fits);
  assert(recovery.fits);
  assert.equal(initial.weights, overflow.weights);
  assert.equal(initial.other, overflow.other);
  assert.equal(initial.total, recovery.total);
  assert.equal(initial.cache, 2);
  assert.equal(overflow.cache, 4);
  assert.equal(quantizationMemory(4).total, overflow.total);
});

test('estimated storyboards also hold the overflow before restoring the shorter context', () => {
  assert.equal(contextBudgetState({ beat: 3, beatP: 0.4 }).fits, false);
  assert.equal(contextBudgetState({ beat: 3, beatP: 0.4 }).restore, 0);
  assert.equal(contextBudgetState({ beat: 3, beatP: 0.98 }).fits, false);
  assert.equal(contextBudgetState({ beat: 4, beatP: 0.98 }).fits, true);
});

test('the painted cache crosses the same fixed capacity line and returns to its initial width', () => {
  const question = render('benchmark', 2, budgetCues(1, 0, 0));
  const overflow = render('benchmark', 3, budgetCues(1, 1, 0));
  const restored = render('benchmark', 4, budgetCues(1, 1, 1));
  assert(question.labels.includes('Double the cache. Will it fit?'));
  assert(question.labels.some((label) => label.endsWith('=\\;?')));
  assert(!question.labels.includes('over budget'));
  assert(overflow.labels.includes('over budget'));
  assert(restored.labels.includes('fits this budget'));
  const paintedCache = (frame) =>
    frame.shapes.find(
      (shape) =>
        Math.abs(shape.y - 465) < 0.01 &&
        Math.abs(shape.height - 150) < 0.01 &&
        shape.width > 200 &&
        shape.x > 800,
    );
  assert(paintedCache(question).x + paintedCache(question).width < 1410);
  assert(
    question.shapes
      .filter((shape) => Math.abs(shape.y - 465) < 0.01 && Math.abs(shape.height - 150) < 0.01)
      .every((shape) => shape.x + shape.width < 1410),
    'No outlined or filled counterfactual cache segment may disclose overflow during the question.',
  );
  assert(paintedCache(overflow).x + paintedCache(overflow).width > 1410);
  assert(paintedCache(restored).x + paintedCache(restored).width < 1410);
  assert.notEqual(question.pixels(200, 400, 1400, 240), overflow.pixels(200, 400, 1400, 240));
});

test('the opening withholds its output consequence until the spoken comparison cue', () => {
  const before = render('intro', 2, { 'compact-code': cue(1), 'changed-computation': cue(0) });
  const during = render('intro', 2, { 'compact-code': cue(1), 'changed-computation': cue(0.5) });
  const held = render('intro', 2, { 'compact-code': cue(1), 'changed-computation': cue(1) });
  assert(!before.labels.some((label) => label.includes('1.095')));
  assert(held.labels.some((label) => label.includes('1.095\\longrightarrow1.050')));
  assert.notEqual(before.pixels(420, 590, 1080, 270), during.pixels(420, 590, 1080, 270));
  assert.notEqual(during.pixels(420, 590, 1080, 270), held.pixels(420, 590, 1080, 270));
});

test('GGUF byte accounting clears its lower area before layer placement begins', () => {
  const cues = Object.fromEntries(
    [
      'choose-method',
      'stored-artifact',
      'typed-encodings',
      'metadata-bits',
      'compatible-runtime',
      'layer-placement',
    ].map((id) => [id, cue(1)]),
  );
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  const audit = drawFrame(
    ctx,
    {},
    { id: 'gguf', title: 'GGUF' },
    {
      beat: 3,
      beatP: 0.01,
      t: 36.533,
      duration: 47.4,
      opacity: 1,
      cueTiming: 'provider-words',
      cues,
    },
    draw,
  );
  assert.deepEqual([...audit.issues, ...layoutIssues(audit)], []);
  assert(audit.labels.some((label) => label.text === 'L2'));
  assert(!audit.labels.some((label) => label.text.includes('256 WEIGHTS')));
});

test('AWQ leaves the transformed product unknown until its spoken invariance reveal', () => {
  const cues = {
    'activation-magnitudes': cue(1),
    'rescale-pair': cue(1),
    'round-rescaled': cue(0),
    'fixed-product': cue(0),
    'calibration-search': cue(0),
  };
  const prediction = render('awq', 1, cues);
  assert.equal(prediction.labels.filter((label) => label === '3.000').length, 1);
  assert(prediction.labels.includes('?'));
  assert(!prediction.labels.some((label) => label.includes('SAME CHANNEL CONTRIBUTION')));
  const revealed = render('awq', 1, { ...cues, 'fixed-product': cue(1) });
  assert.equal(revealed.labels.filter((label) => label === '3.000').length, 2);
  assert(!revealed.labels.includes('?'));
  assert.notEqual(prediction.pixels(1300, 900, 450, 130), revealed.pixels(1300, 900, 450, 130));
});

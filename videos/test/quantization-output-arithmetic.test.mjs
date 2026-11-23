import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { draw } from '../animations/quantization.mjs';

registerLessonFonts();

const cue = (id, phase, progress) => ({
  id,
  phrase: id,
  targets: [],
  phase,
  progress,
  reveal: progress,
  active: phase === 'during',
  strength: progress,
});

function expectedOutputChange(displayedInput) {
  const inputHundredths = Math.round(displayedInput * 100);
  const displayedWeightHundredths = 5;
  return Math.round((displayedWeightHundredths * inputHundredths) / 10) / 1000;
}

function paintOutput(inputProgress, outputProgress, active = false) {
  const expressions = [];
  const cues = {
    'quiet-input': cue('quiet-input', 'during', inputProgress),
    'quiet-output': cue('quiet-output', 'during', outputProgress),
    'active-input': cue('active-input', active ? 'after' : 'before', active ? inputProgress : 0),
    'large-output': cue('large-output', active ? 'during' : 'before', active ? outputProgress : 0),
  };
  const frame = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id: 'output', title: 'The same rounding error can matter differently' },
    {
      beat: active ? 2 : 1,
      beatP: 0.5,
      t: 17.5,
      duration: 30,
      opacity: 1,
      cueTiming: 'provider-words',
      cues,
    },
    (ctx, scene, state, api) => {
      const observed = Object.create(api);
      Object.defineProperty(observed, 'math', {
        value: (canvasCtx, expression, ...args) => {
          expressions.push(expression);
          return api.math(canvasCtx, expression, ...args);
        },
      });
      draw(ctx, scene, state, observed);
    },
  );
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  return { expressions, labels: frame.labels.map((label) => label.text), shapes: frame.shapes };
}

test('the output change matches the displayed input through the quiet-input reveal', () => {
  for (const inputProgress of [0.25, 0.5, 0.75, 1]) {
    const displayedInput = Number((0.1 * inputProgress).toFixed(2));
    const expectedChange = expectedOutputChange(displayedInput);
    for (const outputProgress of [0.25, 0.5, 0.75, 1]) {
      const frame = paintOutput(inputProgress, outputProgress);
      assert(frame.expressions.includes(`x=${displayedInput.toFixed(2)}`));
      assert(frame.labels.includes(`output change = ${expectedChange.toFixed(3)}`));
      const bar = frame.shapes.find(
        (shape) =>
          Math.abs(shape.x - 275) < 0.01 &&
          Math.abs(shape.y - 815) < 0.01 &&
          Math.abs(shape.height - 32) < 0.01,
      );
      assert(bar, 'the revealed output bar remains visible');
      assert(
        Math.abs(bar.width - (expectedChange / 0.1) * 500) < 0.01,
        'the output bar represents the exact displayed product',
      );
    }
  }
});

test('the active-input endpoint still shows the full twenty-times output change', () => {
  const frame = paintOutput(1, 0.5, true);
  assert(frame.expressions.includes('x=2.00'));
  assert(frame.labels.includes('output change = 0.100'));
  const bar = frame.shapes.find(
    (shape) =>
      Math.abs(shape.x - 1145) < 0.01 &&
      Math.abs(shape.y - 815) < 0.01 &&
      Math.abs(shape.height - 32) < 0.01,
  );
  assert(bar);
  assert.equal(bar.width, 500);
});

test('active output uses one final rounding for every displayed input hundredth', () => {
  for (let inputHundredths = 0; inputHundredths <= 200; inputHundredths += 1) {
    const displayedInput = inputHundredths / 100;
    const frame = paintOutput(displayedInput / 2, 1, true);
    const expectedChange = expectedOutputChange(displayedInput);
    assert(
      frame.expressions.includes(`x=${displayedInput.toFixed(2)}`),
      `active lane displays x=${displayedInput.toFixed(2)}`,
    );
    assert(
      frame.labels.includes(`output change = ${expectedChange.toFixed(3)}`),
      `active lane product matches x=${displayedInput.toFixed(2)}`,
    );
    const bar = frame.shapes.find(
      (shape) =>
        Math.abs(shape.x - 1145) < 0.01 &&
        Math.abs(shape.y - 815) < 0.01 &&
        Math.abs(shape.height - 32) < 0.01,
    );
    assert(bar, `active output bar is visible for x=${displayedInput.toFixed(2)}`);
    assert(
      Math.abs(bar.width - (expectedChange / 0.1) * 500) < 0.01,
      `active output bar matches rounded product for x=${displayedInput.toFixed(2)}`,
    );
  }
});

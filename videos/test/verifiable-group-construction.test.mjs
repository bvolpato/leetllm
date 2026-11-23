import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { draw } from '../animations/verifiable-rewards.mjs';
registerLessonFonts();

const paint = (id, beat, progress) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: 'Checked outcomes' },
    { t: 10, duration: 20, opacity: 1, beat, beatP: progress },
    draw,
  );
const rewardBars = (frame) =>
  frame.shapes.filter(
    (s) =>
      s.kind === 'rect' &&
      s.x >= 200 &&
      s.x < 1000 &&
      s.y >= 390 &&
      s.y < 700 &&
      s.width > 80 &&
      s.width < 200 &&
      s.height > 1,
  );

test('each rollout keeps its prompt identity and its reward waits for its own check', () => {
  const early = paint('group', 0, 2 / 16.63),
    late = paint('group', 0, 8 / 16.63);
  assert.equal(early.labels.filter((l) => l.text.includes('Check pending')).length, 4);
  assert.equal(early.labels.filter((l) => l.text.includes('P14 · R')).length, 4);
  assert.equal(late.labels.filter((l) => l.text.startsWith('Checked reward')).length, 4);
  assert(!early.labels.some((l) => l.text === '[1, 0, 1, 0]'));
});

test('the all-pass counterfactual paints four equal rewards and zero advantages', () => {
  const frame = paint('grpo', 2, 1.4 / 14.286),
    bars = rewardBars(frame);
  assert.equal(bars.length, 4);
  assert(bars.every((s) => Math.abs(s.height - bars[0].height) < 1e-6));
  assert.equal(frame.labels.filter((l) => l.text === '0.00' && l.x > 1100).length, 4);
  assert(
    !frame.shapes.some(
      (s) =>
        s.kind === 'rect' &&
        s.x > 1100 &&
        s.y >= 420 &&
        s.y <= 700 &&
        s.height === 34 &&
        s.width > 1,
    ),
  );
});

test('the all-fail counterfactual retains zero rewards and guarded zero advantages through the final hold', () => {
  for (const progress of [0.3, 0.7, 1]) {
    const frame = paint('grpo', 2, progress);
    assert.equal(rewardBars(frame).length, 0);
    assert.equal(frame.labels.filter((l) => l.text === '0.00' && l.x > 1100).length, 4);
    assert(frame.labels.some((l) => l.text.includes('Guarded group')));
  }
});

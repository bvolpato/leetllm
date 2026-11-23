import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { draw, sampleModel } from '../animations/calling-llm-apis-production.mjs';

registerLessonFonts();
const paint = (id, beat, beatP) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: 'API execution' },
    { t: 1, duration: 20, opacity: 1, beat, beatP },
    draw,
  );

test('the retry endpoint, caller clock and remaining budget agree at the final hold', () => {
  const state = sampleModel('timeout-retry', { beat: 2, beatP: 1 });
  assert.equal(state.time, state.secondAttempt.end);
  const frame = paint('timeout-retry', 2, 1);
  assert(frame.labels.some((label) => label.text === 'Current time · 19.5 s'));
  assert(frame.labels.some((label) => label.text === 'Budget remaining · 0.5 s'));
  assert(frame.labels.some((label) => label.text.includes('Separate short-budget case')));
});

test('the breaker counts two responses before opening, then admits one probe after cooldown', () => {
  const first = paint('circuit-breaker', 1, 2 / 10.47);
  assert(first.labels.some((label) => label.text === 'Call R1 → 503'));
  assert(first.labels.some((label) => label.text === 'Call R2 pending'));
  assert(first.labels.some((label) => label.text.includes('failures: 1 / 2')));
  const opened = paint('circuit-breaker', 1, 4.5 / 10.47);
  assert(opened.labels.some((label) => label.text === 'Call R2 → 503'));
  assert(opened.labels.some((label) => label.text.includes('failures: 2 / 2')));
  const waiting = sampleModel('circuit-breaker', { beat: 2, beatP: 0.5 / 16.28 });
  assert(waiting.cooldown < 10);
  assert.equal(waiting.probeProgress, 0);
  const complete = paint('circuit-breaker', 2, 1);
  assert(complete.labels.some((label) => label.text === 'P1 · only admitted probe'));
  assert(complete.labels.some((label) => label.text === 'P1 succeeds → CLOSED'));
  assert(complete.labels.some((label) => label.text === 'Alternative: P1 fails → OPEN'));
});

test('cost geometry constructs rate products before the monthly estimate is revealed', () => {
  const early = paint('cost-privacy', 0, 0.1),
    perCall = paint('cost-privacy', 0, 0.95);
  assert(!early.labels.some((label) => /5880|5\{,\}880/.test(label.text)));
  assert(early.labels.some((label) => label.text === 'Per call · $0.00000'));
  assert(perCall.labels.some((label) => label.text === 'Per call · $0.00098'));
  const parts = perCall.shapes.filter(
    (shape) => shape.y === 650 && shape.height === 55 && shape.width < 1340,
  );
  assert.equal(parts.length, 2);
  assert(Math.abs(parts.reduce((total, shape) => total + shape.width, 0) - 1340) < 1e-9);
  const beforeMonthly = paint('cost-privacy', 1, 3 / 10.88),
    monthly = paint('cost-privacy', 1, 6 / 10.88);
  assert(!beforeMonthly.labels.some((label) => /5880|5\{,\}880/.test(label.text)));
  assert(monthly.labels.some((label) => label.text.includes('5{,}880')));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { createTextInkAudit } from '../lib/text-ink-audit.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { textInkSampleFrames } from '../audit-text-ink.mjs';

function example() {
  const canvas = createCanvas(640, 360),
    audit = createTextInkAudit(canvas.getContext('2d'));
  audit.beginFrame();
  const ctx = audit.ctx;
  ctx.fillStyle = '#18283b';
  ctx.fillRect(0, 0, 640, 360);
  ctx.font = '28px sans-serif';
  ctx.fillStyle = '#e9efff';
  return { canvas, audit, ctx };
}

test('same-color text on an opaque panel fails despite valid geometry', () => {
  const { audit, ctx } = example();
  ctx.fillStyle = '#18283b';
  ctx.fillText('A meaningful hidden label', 40, 70);
  const report = audit.finishFrame();
  assert.equal(report.passed, false);
  assert.equal(report.issues[0].changedPixels, 0);
  assert.ok(report.issues[0].glyphPixels > 100);
  assert.equal(report.issues[0].foreground, '#18283b');
});

test('contrasting text, small axis labels and multibyte text paint discernible ink', () => {
  const { audit, ctx } = example();
  ctx.fillText('A visible label', 40, 70);
  ctx.globalAlpha = 0.25;
  ctx.fillText('Quarter opacity', 40, 110);
  ctx.globalAlpha = 0.1;
  ctx.fillText('Fading label', 40, 150);
  ctx.globalAlpha = 1;
  ctx.font = '8px sans-serif';
  ctx.fillText('0.5', 40, 180);
  ctx.font = '28px sans-serif';
  ctx.fillText('café Ελληνικά 中文', 40, 220);
  const report = audit.finishFrame();
  assert.equal(report.passed, true);
  assert.equal(report.checkedLabels, 4);
  assert.equal(report.labels[2].status, 'low-opacity');
  assert.ok(
    report.labels
      .filter((label) => label.status === 'visible')
      .every((label) => label.changedPixels > 0),
  );
});

test('transform, alignment, baseline and maxWidth affect the actual sampled region', () => {
  const { audit, ctx } = example();
  ctx.save();
  ctx.translate(330, 140);
  ctx.rotate(0.25);
  ctx.scale(0.8, 1.2);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText('Transformed visible text', 0, 0, 170);
  ctx.fillStyle = '#18283b';
  ctx.fillText('Transformed hidden text', 0, 65, 160);
  ctx.restore();
  const report = audit.finishFrame();
  assert.equal(report.labels[0].status, 'visible');
  assert.equal(report.issues.length, 1);
  assert.equal(report.issues[0].text, 'Transformed hidden text');
  assert.ok(report.labels[0].bounds.x < 330);
});

test('native clips distinguish intentional hidden text from invisible text inside the clip', () => {
  const { audit, ctx } = example();
  ctx.save();
  ctx.beginPath();
  ctx.rect(20, 20, 240, 100);
  ctx.clip();
  ctx.fillStyle = '#18283b';
  ctx.fillText('Fully clipped away', 300, 70);
  ctx.fillText('Hidden inside clip', 30, 70);
  ctx.fillStyle = '#e9efff';
  ctx.fillText('Partially clipped visible label', 180, 110);
  ctx.restore();
  const report = audit.finishFrame();
  assert.equal(report.labels[0].status, 'clipped-or-subpixel');
  assert.equal(report.labels[2].status, 'visible');
  assert.deepEqual(
    report.issues.map((label) => label.text),
    ['Hidden inside clip'],
  );
});

test('effective fill alpha excludes transparent fades without hiding opaque same-color failures', () => {
  const { audit, ctx } = example();
  ctx.fillStyle = 'rgba(24, 40, 59, 0.1)';
  ctx.fillText('A transparent fade', 40, 70);
  ctx.fillStyle = 'rgba(24, 40, 59, 0.5)';
  ctx.fillText('An invisible half-opacity label', 40, 110);
  ctx.fillStyle = 'rgba(233, 239, 255, 0.5)';
  ctx.fillText('A visible half-opacity label', 40, 150);
  const report = audit.finishFrame();
  assert.equal(report.labels[0].status, 'low-opacity');
  assert.equal(report.labels[2].status, 'visible');
  assert.deepEqual(
    report.issues.map((label) => label.text),
    ['An invisible half-opacity label'],
  );
});

test('instrumentation preserves actual pixels and guardedPainter tracking', () => {
  const scene = { id: 'example', title: 'A visible heading' },
    lesson = { id: 'example' };
  const state = { t: 2, duration: 10, opacity: 1, p: 0.2, beat: 0, beatP: 0.5 };
  const paint = (ctx, current, frame, api) => {
    api.rect(ctx, 200, 250, 700, 150, '#18283b', '#8d9cb9');
    api.text(ctx, 'A real checked label', 230, 330, 30, '#e9efff');
    api.text(ctx, 'An invisible checked label', 230, 380, 30, '#18283b');
  };
  const plain = createCanvas(1920, 1080),
    instrumented = createCanvas(1920, 1080);
  const before = drawFrame(plain.getContext('2d'), lesson, scene, state, paint);
  assert.deepEqual(before.issues, []);
  const audit = createTextInkAudit(instrumented.getContext('2d'));
  audit.beginFrame();
  const after = drawFrame(audit.ctx, lesson, scene, state, paint);
  assert.deepEqual(instrumented.data(), plain.data());
  assert.deepEqual(after, before);
  assert.deepEqual(
    audit.finishFrame().issues.map((label) => label.text),
    ['An invisible checked label'],
  );
  audit.beginFrame();
  const untracked = drawFrame(audit.ctx, lesson, scene, state, (ctx) =>
    ctx.fillText('Raw paint still gets reported', 200, 600),
  );
  assert.ok(untracked.issues.some((issue) => issue.type === 'untracked-paint'));
});

test('semantic samples retain scene endpoints and every beat boundary at valid frame indices', () => {
  const timing = {
    frames: 90,
    duration: 3,
    beats: [
      { start: 0.4, until: 1.4 },
      { start: 1.4, until: 2.7 },
    ],
  };
  const frames = textInkSampleFrames(timing, 30);
  for (const required of [0, 12, 42, 89]) assert.ok(frames.includes(required));
  assert.deepEqual(
    frames,
    [...new Set(frames)].sort((a, b) => a - b),
  );
  assert.ok(
    frames.every((frame) => Number.isInteger(frame) && frame >= 0 && frame < timing.frames),
  );
});

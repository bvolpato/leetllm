import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { draw } from '../animations/serving-benchmarks.mjs';

registerLessonFonts();

function paint(beat, beatP) {
  const circles = [];
  const frame = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id: 'intro', title: 'A test can hide the traffic that hurts' },
    { beat, beatP, t: 10, duration: 36, opacity: 1 },
    (ctx, scene, state, api) => {
      const observed = Object.create(api);
      Object.defineProperty(observed, 'circle', {
        value: (canvasCtx, x, y, radius, color, ...args) => {
          circles.push({ x, y, radius, color });
          return api.circle(canvasCtx, x, y, radius, color, ...args);
        },
      });
      draw(ctx, scene, state, observed);
    },
  );
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  return { circles, labels: frame.labels.map((label) => label.text) };
}

const startsAt = (frame, y) =>
  frame.circles.filter((point) => Math.abs(point.y - y) < 0.01 && point.radius === 8);
const endsAt = (frame, y) =>
  frame.circles.filter((point) => Math.abs(point.y - y) < 0.01 && point.radius === 7);

test('closed-loop next sends share the preceding completion position during the slowdown', () => {
  for (const progress of Array.from({ length: 101 }, (_, index) => index / 100)) {
    const frame = paint(0, progress);
    const first = startsAt(frame, 405);
    assert.equal(first.length, 1, 'the closed-loop first request is drawn');
    for (let index = 1; index < 6; index++) {
      const next = startsAt(frame, 405 + index * 30);
      if (!next.length) break;
      const previous = endsAt(frame, 405 + (index - 1) * 30);
      assert.equal(previous.length, 1);
      assert(Math.abs(next[0].x - previous[0].x) < 0.01, 'the next send waits for that completion');
    }
  }
});

test('the same slowdown leaves open-loop arrivals on their independent three-per-second schedule', () => {
  const frame = paint(1, 1);
  const x0 = 500,
    pixelsPerMs = 1200 / 3000;
  for (const [index, sendMs] of [0, 333, 667, 1000, 1333, 1667].entries()) {
    const sends = startsAt(frame, 715 + index * 30);
    assert.equal(sends.length, 1);
    assert(Math.abs(sends[0].x - (x0 + sendMs * pixelsPerMs)) < 0.01);
  }
  assert(frame.labels.includes('2 s arrival window · 3 sends'));
  assert(frame.labels.includes('same 2 s window · 6 sends'));
});

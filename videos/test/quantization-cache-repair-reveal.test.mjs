import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { draw } from '../animations/quantization.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
registerLessonFonts();
const cue = (p) => ({
  phase: p === 0 ? 'before' : p === 1 ? 'after' : 'during',
  progress: p,
  strength: 0,
});
function paint(input, consequence) {
  const id = 'fresh-quantization',
    a = drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      {},
      { id, title: 'Repair the supplied cache allocation', beats: [{}, {}, {}] },
      {
        beat: 2,
        beatP: 0.8,
        t: 20,
        duration: 80,
        opacity: 1,
        cues: {
          'fresh-quantization-build-2': cue(1),
          'fresh-cache-input': cue(input),
          'fresh-cache-boundary': cue(consequence),
        },
      },
      draw,
    );
  assert.deepEqual([...a.issues, ...layoutIssues(a)], []);
  return { ...a, labels: a.labels.map((l) => l.text) };
}
test('B input amount and exact boundary wait for their separate completed spoken clauses', () => {
  const operation = paint(0, 0);
  assert(!operation.labels.some((s) => s.includes('3.875')));
  assert(!operation.labels.includes('8 GB'));
  const input = paint(1, 0);
  assert(input.labels.some((s) => s.includes('3.875')));
  assert(!input.labels.includes('8 GB'));
  assert(input.labels.includes('8.125 GB'));
  const changing = paint(1, 0.5);
  assert(!changing.labels.includes('8 GB'));
  const completed = paint(1, 1);
  assert(completed.labels.includes('8 GB'));
  assert(completed.labels.some((s) => s.includes('exact boundary leaves no operating headroom')));
  const right = (a) =>
    Math.max(...a.shapes.filter((s) => s.y === 700 && s.height === 80).map((s) => s.x + s.width));
  const boundary = 460 + (8 * 1300) / 8.5;
  assert(right(operation) > right(changing));
  assert(right(changing) > boundary);
  assert(Math.abs(right(completed) - boundary) < 1e-8);
  for (const a of [operation, input, changing, completed]) assert(a.labels.includes('7.9375 GB'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/accelerator-architecture-field-guide.mjs';
registerLessonFonts();
const root = new URL('../../', import.meta.url).pathname;
const lesson = await readLesson(
  root + 'videos/lessons/accelerator-architecture-field-guide.lesson.yaml',
  root,
);
function paint(id, beat, held) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = Object.fromEntries(
      scene.beats
        .flatMap((b) => b.visual_cues ?? [])
        .map((c) => [
          c.id,
          {
            id: c.id,
            phase: held.includes(c.id) ? 'before' : 'after',
            progress: held.includes(c.id) ? 0 : 1,
            reveal: held.includes(c.id) ? 0 : 1,
            active: false,
            strength: 0,
            targets: [],
          },
        ]),
    );
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { t: 20, duration: 60, opacity: 1, beat, beatP: 0.99, cues, cueTiming: 'provider-words' },
    draw,
  );
}
test('completed multiply contributions do not print the final sum before its spoken result cue', () => {
  const before = paint('systolic-dataflow', 1, ['ag-systolic-dataflow-first']);
  assert(!before.labels.some((l) => l.text === '19'));
  assert(before.labels.some((l) => l.text.includes('retained')));
  const after = paint('systolic-dataflow', 1, []);
  assert(after.labels.some((l) => l.text === '19'));
});
test('fresh hardware cost remains hidden until its separate calculation cue', () => {
  const before = paint('fresh-hardware', 1, ['ag-fresh-hardware-cost']);
  assert(!before.labels.some((l) => l.text.includes('20,000')));
  const after = paint('fresh-hardware', 1, []);
  assert(after.labels.some((l) => l.text.includes('20,000')));
});

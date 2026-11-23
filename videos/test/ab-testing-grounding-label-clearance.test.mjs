import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/ab-testing.mjs';

registerLessonFonts();
const root = new URL('../../', import.meta.url).pathname;
test('the held original packet has its own row above the grounding chart', async () => {
  const lesson = await readLesson(root + 'videos/lessons/ab-testing.lesson.yaml', root);
  const scene = lesson.scenes.find((s) => s.id === 'fresh-grounding');
  const cues = Object.fromEntries(
    scene.beats
      .flatMap((b) => b.visual_cues ?? [])
      .map((c) => [
        c.id,
        {
          id: c.id,
          phase: 'after',
          progress: 1,
          reveal: 1,
          active: false,
          strength: 0,
          targets: [],
        },
      ]),
  );
  const audit = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { t: 20, duration: 60, opacity: 1, beat: 2, beatP: 0.99, cues, cueTiming: 'provider-words' },
    draw,
  );
  const budget = audit.labels.find((l) => l.text === 'Budget +0.50 pp');
  const original = audit.labels.find((l) => l.text === 'Original 23-failure packet remains held');
  assert(budget && original);
  assert(
    original.y >= budget.y + budget.height + 16,
    'The retained-packet reminder must clear the budget text ink.',
  );
  assert(
    original.y + original.height <= 424,
    'The reminder must also clear the chart starting at y=440.',
  );
});

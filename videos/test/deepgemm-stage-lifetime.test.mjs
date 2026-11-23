import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/deep-dive-deepgemm.mjs';
const lesson = await readLesson(
  new URL('../lessons/deep-dive-deepgemm.lesson.yaml', import.meta.url).pathname,
  new URL('../..', import.meta.url).pathname,
);
registerLessonFonts();
const sample = (p) => ({
  phase: p === 0 ? 'before' : p === 1 ? 'after' : 'during',
  progress: p,
  strength: 0,
  active: false,
  targets: [],
});
test('completed shared staging persists through the same tile consumer-wait beat', () => {
  const scene = lesson.scenes.find((s) => s.id === 'stage-lifetime'),
    canvas = createCanvas(1920, 1080);
  function paint(beat, progress) {
    const cues = Object.fromEntries(
      scene.beats.flatMap((b, i) =>
        (b.visual_cues ?? []).map((c) => [c.id, sample(i < beat ? 1 : i === beat ? progress : 0)]),
      ),
    );
    const state = {
      t: 2,
      duration: 100,
      opacity: 1,
      beat,
      beatP: progress,
      cueTiming: 'explicit-test-cues',
      cues,
    };
    return drawFrame(canvas.getContext('2d'), lesson, scene, state, draw).labels.map((l) => l.text);
  }
  assert(paint(1, 1).includes('Shared operands · ready'));
  for (const p of [0, 0.02, 0.25, 0.75, 1]) {
    const labels = paint(2, p);
    assert(
      labels.includes('Shared operands · ready'),
      `completed stage reset at consumer progress ${p}`,
    );
    assert(!labels.includes('Shared operands · loading'));
    assert(labels.includes('TMEM scales · ready'));
  }
});

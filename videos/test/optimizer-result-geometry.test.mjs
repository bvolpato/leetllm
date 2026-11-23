import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/optimizers.mjs';
const lesson = await readLesson(
  new URL('../lessons/optimizers.lesson.yaml', import.meta.url).pathname,
  new URL('../..', import.meta.url).pathname,
);
registerLessonFonts();
const cue = (p) => ({
  phase: p === 0 ? 'before' : p === 1 ? 'after' : 'during',
  progress: p,
  strength: 0,
  active: false,
  targets: [],
});
function paint(id, progress) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = Object.fromEntries(
      scene.beats.flatMap((b, i) =>
        (b.visual_cues ?? []).map((c) => [c.id, cue(i < 2 ? 1 : i === 2 ? progress : 0)]),
      ),
    );
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    {
      t: 5,
      duration: 100,
      opacity: 1,
      beat: 2,
      beatP: progress,
      cueTiming: 'explicit-test-cues',
      cues,
    },
    draw,
  );
}
test('visible observation-weight segments match their printed after-three coefficients', () => {
  let checks = 0;
  for (const p of [0.05, 0.2, 0.4, 0.6, 0.8, 0.95, 1]) {
    const a = paint('adam-history', p);
    let x = 260;
    for (const weight of [0.081, 0.09, 0.1]) {
      const width = weight * 2600,
        bar = a.shapes.find(
          (s) =>
            Math.abs(s.x - x) < 1e-10 &&
            s.y === 540 &&
            s.height === 70 &&
            s.width > 0 &&
            s.alpha > 0.01,
        );
      if (bar) {
        assert(
          Math.abs(bar.width - width) < 1e-10,
          `printed ${weight} represented by ${bar.width / 2600}`,
        );
        checks++;
      }
      x += width;
    }
  }
  assert(checks >= 12);
});
test('the fresh data step adds 0.05 only after its spoken result', () => {
  const expression = '\\Delta\\theta_{data}=-0.05\\frac{-3}{3}';
  const formula = (progress) =>
    paint('fresh-recipe', progress).labels.find((label) => label.text.includes('theta_{data}')).text;
  for (const progress of [0, 0.01, 0.5, 0.999]) {
    assert.equal(formula(progress), expression);
  }
  assert.equal(formula(1), expression + '=+0.05');
});

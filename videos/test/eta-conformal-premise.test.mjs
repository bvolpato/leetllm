import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/capstone-delivery-eta-prediction.mjs';
const lesson = await readLesson(
    new URL('../lessons/capstone-delivery-eta-prediction.lesson.yaml', import.meta.url).pathname,
    new URL('../..', import.meta.url).pathname,
  ),
  scene = lesson.scenes.find((s) => s.id === 'conformal-calibration');
registerLessonFonts();
function paint(inputs, rank, radius = 0) {
  const values = {
      'conformal-five-rank': 1,
      'conformal-infinite': 1,
      'conformal-nine-inputs': inputs,
      'conformal-nine-rank': rank,
      'conformal-nine': radius,
    },
    cues = Object.fromEntries(
      Object.entries(values).map(([id, progress]) => [
        id,
        {
          phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
          progress,
          strength: 0,
          active: false,
        },
      ]),
    );
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { t: 45, duration: 90, opacity: 1, beat: 1, beatP: 0.8, cueTiming: 'explicit-test-cues', cues },
    draw,
  );
}
test('the nine-score premise appears while its rank and radius are still pending', () => {
  for (const p of [0.01, 0.5, 1]) {
    const a = paint(p, 0);
    assert(a.labels.some((l) => l.text === 'Target90% · α=0.1 · n=9 calibration scores'));
    assert(a.labels.some((l) => l.text === '9'));
    assert(a.labels.some((l) => l.text === 'Corrected rank pending'));
    assert(a.labels.some((l) => l.text === 'Radius selection pending'));
    assert(!a.labels.some((l) => l.text === 'rank9 exists → radius9h'));
  }
});
test('the nine-score rank completes before its separately gated radius', () => {
  for (const p of [0, 0.5, 0.999])
    assert(!paint(1, p).labels.some((l) => l.text.includes('0.9\\rceil=9')));
  const rank = paint(1, 1);
  assert(rank.labels.some((l) => l.text.includes('0.9\\rceil=9')));
  assert(rank.labels.some((l) => l.text === 'Radius selection pending'));
  assert(!rank.labels.some((l) => l.text === 'rank9 exists → radius9h'));
  assert(paint(1, 1, 1).labels.some((l) => l.text === 'rank9 exists → radius9h'));
});

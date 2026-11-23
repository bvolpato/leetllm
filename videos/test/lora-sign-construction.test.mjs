import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { draw } from '../animations/lora.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { readLesson } from '../lib/lesson.mjs';

registerLessonFonts();
const root = new URL('../../', import.meta.url).pathname;
const lesson = await readLesson(root + 'videos/lessons/lora.lesson.yaml', root);
const canvas = createCanvas(1920, 1080);
const paint = (seconds) =>
  drawFrame(
    canvas.getContext('2d'),
    lesson,
    lesson.scenes.find((row) => row.id === 'rank-one'),
    { t: seconds, duration: 35, opacity: 1, beat: 1, beatP: seconds / 12.13 },
    draw,
  );

test('the spoken sign-change explanation holds a visible negative correction after crossing zero', () => {
  const negative = paint(5.8);
  assert(negative.labels.some((row) => row.text === 'c = −0.6'));
  const zero = paint(4.3);
  assert(zero.labels.some((row) => row.text === 'c = 0'));
  const positive = paint(9.5);
  assert(positive.labels.some((row) => row.text === 'c = 1'));
});

import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { draw, introTokenSnapshot, validateModel } from '../animations/attention.mjs';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { evaluateContentVisibility } from '../audit-content-visibility.mjs';

test('spoken word cues own sentence arrivals while unreached positions remain visible', async () => {
  validateModel();
  registerLessonFonts();
  const root = new URL('../../', import.meta.url).pathname;
  const lesson = await readLesson(root + 'videos/lessons/attention.lesson.yaml', root);
  const scene = lesson.scenes.find((scene) => scene.id === 'subject-intro');
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  for (const count of [0, 1, 5, 8]) {
    const cues = Object.fromEntries(
      Array.from({ length: 8 }, (_, i) => [
        'intro-word-' + i,
        {
          phase: i < count ? 'after' : 'before',
          progress: i < count ? 1 : 0,
          active: false,
          strength: 0,
          targets: [],
        },
      ]),
    );
    const state = {
      beat: 0,
      beatP: 0.99,
      t: 10,
      duration: 12,
      opacity: 1,
      cues,
      cueTiming: 'provider-words',
    };
    assert.equal(introTokenSnapshot(0, 0.99, cues).count, count);
    drawFrame(ctx, lesson, scene, state, draw);
    assert.equal(
      evaluateContentVisibility(ctx.getImageData(0, 0, 1920, 1080).data).belowEncodedThreshold,
      false,
      `Sentence context is blank with ${count} spoken words`,
    );
  }
});

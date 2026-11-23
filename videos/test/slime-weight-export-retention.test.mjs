import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/deep-dive-slime.mjs';
const lesson = await readLesson(
  new URL('../lessons/deep-dive-slime.lesson.yaml', import.meta.url).pathname,
  new URL('../..', import.meta.url).pathname,
);
registerLessonFonts();
test('weight export supplies the model row while full trainer recovery needs additional state', () => {
  const scene = lesson.scenes.find((s) => s.id === 'disk-retention'),
    canvas = createCanvas(1920, 1080);
  for (const progress of [0, 0.01, 0.2, 0.5, 0.9, 1]) {
    const audit = drawFrame(
      canvas.getContext('2d'),
      lesson,
      scene,
      { t: 5, duration: 100, opacity: 1, beat: 2, beatP: progress },
      draw,
    );
    const owner = audit.labels.find((l) => l.text === 'model weights');
    assert(owner);
    const status = audit.labels.find(
      (l) => l.center.x > 1000 && Math.abs(l.center.y - owner.center.y) < 1,
    );
    assert.equal(
      status?.text,
      'supplied by weight export',
      `model row misclassified at ${progress}`,
    );
    const optimizer = audit.labels.find((l) => l.text === 'optimizer');
    const recovery = audit.labels.find(
      (l) => l.center.x > 1000 && Math.abs(l.center.y - optimizer.center.y) < 1,
    );
    if (progress === 0) assert.equal(recovery?.text, 'not supplied by weight export');
    if (progress === 1) assert.equal(recovery?.text, 'requires training-checkpoint state');
  }
});

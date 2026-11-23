import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { draw } from '../animations/ab-testing.mjs';
import { fileURLToPath } from 'node:url';

registerLessonFonts();
const root = fileURLToPath(new URL('../../', import.meta.url));
test('the incident-owned prior answer visibly crosses the declared exposure region', async () => {
  const lesson = await readLesson(root + 'videos/lessons/ab-testing.lesson.yaml', root),
    sceneIndex = lesson.scenes.findIndex((s) => s.id === 'randomize'),
    scene = lesson.scenes[sceneIndex];
  const samples = [0.12, 0.5, 0.88].map((beatP) => {
    const canvas = createCanvas(1920, 1080),
      ctx = canvas.getContext('2d');
    const audit = drawFrame(
      ctx,
      lesson,
      scene,
      {
        beat: 1,
        beatP,
        opacity: 1,
        t: 20 + beatP * 14,
        duration: 52,
        sceneIndex,
        sceneCount: lesson.scenes.length,
      },
      draw,
    );
    assert.deepEqual(layoutIssues(audit), []);
    return ctx.getImageData(170, 515, 1600, 390).data;
  });
  const changed = (a, b) => {
    let n = 0;
    for (let i = 0; i < a.length; i += 4)
      if (
        Math.max(
          Math.abs(a[i] - b[i]),
          Math.abs(a[i + 1] - b[i + 1]),
          Math.abs(a[i + 2] - b[i + 2]),
        ) >= 12
      )
        n++;
    return n;
  };
  const counts = [
    [0, 1],
    [1, 2],
    [0, 2],
  ].map(([a, b]) => changed(samples[a], samples[b]));
  assert(
    counts.some((n) => n >= 32 && n / (1600 * 390) >= 0.002),
    `The teaching region must contain the moving answer, not only a tiny pointer: ${counts}`,
  );
});

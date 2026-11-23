import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/accelerator-architecture-field-guide.mjs';

registerLessonFonts();
const root = new URL('../../', import.meta.url).pathname;
test('physical rank links clear their labels throughout the scene fade', async () => {
  const lesson = await readLesson(
    root + 'videos/lessons/accelerator-architecture-field-guide.lesson.yaml',
    root,
  );
  const scene = lesson.scenes.find((s) => s.id === 'target-build');
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
  for (const opacity of [0.1, 0.25, 0.5, 1]) {
    const audit = drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      lesson,
      scene,
      {
        t: 79.733333333,
        duration: 80,
        opacity,
        beat: 2,
        beatP: 0.99,
        cues,
        cueTiming: 'provider-words',
      },
      draw,
    );
    assert.deepEqual(
      layoutIssues(audit),
      [],
      `opacity ${opacity}: links must stop outside rank nodes rather than rely on an opaque overpaint`,
    );
  }
});

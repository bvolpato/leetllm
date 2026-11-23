import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw, baseHandler, fixedHandler } from '../animations/ai-coding-workflow-with-agents.mjs';

test('the handler comparison retains every literal code line inside both source panels', async () => {
  registerLessonFonts();
  const lesson = await readLesson(
    new URL('../lessons/ai-coding-workflow-with-agents.lesson.yaml', import.meta.url),
    new URL('../../', import.meta.url).pathname,
  );
  const index = lesson.scenes.findIndex((scene) => scene.id === 'scope');
  const scene = lesson.scenes[index];
  const timing = makeSceneTimeline(
    scene,
    scene.beats.map((beat) => beat.say.split(/\s+/).length / 2.5),
    30,
  );
  const beat = timing.beats[1];
  for (const progress of [0.02, 0.18, 0.5, 0.82, 0.98]) {
    const canvas = createCanvas(1920, 1080);
    const state = frameState(
      timing,
      beat.start + (beat.until - beat.start) * progress,
      index,
      lesson.scenes.length,
    );
    const audit = drawFrame(canvas.getContext('2d'), lesson, scene, state, draw);
    assert.deepEqual(audit.issues, []);
    for (const handler of [baseHandler, fixedHandler])
      for (const line of handler.toString().split('\n'))
        assert(
          audit.labels.some((label) => label.text === line),
          line,
        );
  }
});

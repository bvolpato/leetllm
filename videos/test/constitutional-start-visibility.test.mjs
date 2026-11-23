import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { draw, validateModel } from '../animations/constitutional-ai.mjs';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { evaluateContentVisibility } from '../audit-content-visibility.mjs';

test('the public starting request stays legible while its answer and access checks arrive', async () => {
  validateModel();
  registerLessonFonts();
  const root = new URL('../../', import.meta.url).pathname;
  const lesson = await readLesson(root + 'videos/lessons/constitutional-ai.lesson.yaml', root);
  const scene = lesson.scenes.find((scene) => scene.id === 'intro');
  const sounds = scene.beats.map((beat, beatIndex) => ({
    beatIndex,
    words: beat.say.split(/\s+/).map((text, i) => ({ text, start: i * 0.4, end: (i + 1) * 0.4 })),
  }));
  const timing = makeSceneTimeline(
    scene,
    sounds.map((sound) => sound.words.at(-1).end),
  );
  timing.sounds = sounds;
  timing.visualCues = resolveSceneCues(scene, timing);
  timing.cueTiming = 'provider-words';
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  for (const time of [0.5, 0.75, 1, 1.5, 2, 3]) {
    const audit = drawFrame(
      ctx,
      lesson,
      scene,
      frameState(timing, time, 0, lesson.scenes.length),
      draw,
    );
    const metrics = evaluateContentVisibility(ctx.getImageData(0, 0, 1920, 1080).data);
    assert.equal(
      metrics.belowEncodedThreshold,
      false,
      `Starting request is nearly blank at ${time}s`,
    );
    assert(
      audit.targets.some((target) => target.id === 'public-request' && target.alpha >= 0.8),
      `Public request must remain visible at ${time}s`,
    );
    if (time === 0.5)
      assert(
        audit.targets
          .filter((target) => target.id === 'public-answer')
          .every((target) => target.alpha < 0.1),
        'The answer must still arrive after the starting request',
      );
  }
});

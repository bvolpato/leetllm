import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { draw } from '../animations/learning-theory.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { DecodedFrameAudit } from '../inspect.mjs';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';

test('the fixed-predictor sample stays visible while its losses are introduced', async () => {
  registerLessonFonts();
  const canvas = createCanvas(1920, 1080);
  const root = new URL('../../', import.meta.url).pathname;
  const lesson = await readLesson(root + 'videos/lessons/learning-theory.lesson.yaml', root);
  const scene = lesson.scenes.find((item) => item.id === 'one-predictor');
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
  for (const time of [0.6, 1, 1.5]) {
    drawFrame(canvas.getContext('2d'), lesson, scene, frameState(timing, time, 0, 1), draw);
    const rgba = canvas.getContext('2d').getImageData(0, 0, 1920, 1080).data;
    const pixels = Buffer.alloc(320 * 180);
    for (let y = 0; y < 180; y++)
      for (let x = 0; x < 320; x++) {
        let gray = 0;
        for (let dy = 0; dy < 6; dy++)
          for (let dx = 0; dx < 6; dx++) {
            const i = ((y * 6 + dy) * 1920 + x * 6 + dx) * 4;
            gray += 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
          }
        pixels[y * 320 + x] = Math.round(gray / 36);
      }
    const audit = new DecodedFrameAudit({ fps: 30, scenes: [] });
    audit.observe(pixels);
    assert(audit.metrics[0][3] >= 0.001, `Ticket content is nearly blank at ${time}s`);
  }
});

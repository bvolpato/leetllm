import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
const { draw } = await import(
  process.env.LEETLLM_DIFFUSION_SOURCE ?? '../animations/diffusion.mjs'
);

test('U-Net transfers retain clearance through the descending and ascending resolutions', async () => {
  registerLessonFonts();
  const root = new URL('../../', import.meta.url).pathname;
  const lesson = await readLesson(root + 'videos/lessons/diffusion.lesson.yaml', root),
    index = lesson.scenes.findIndex((s) => s.id === 'architectures'),
    scene = lesson.scenes[index];
  const sounds = scene.beats.map((b, beatIndex) => {
    const words = b.say.trim().split(/\s+/);
    return {
      beatIndex,
      duration: words.length / 2.5,
      words: words.map((text, i) => ({ text, start: i / 2.5, end: (i + 1) / 2.5 - 0.005 })),
    };
  });
  const timeline = makeSceneTimeline(
    scene,
    sounds.map((x) => x.duration),
  );
  timeline.sounds = sounds;
  timeline.visualCues = resolveSceneCues(scene, timeline);
  const ctx = createCanvas(1920, 1080).getContext('2d'),
    beat = timeline.beats[0];
  for (let i = 0; i <= 100; i++) {
    const time = beat.start + ((beat.end - beat.start) * i) / 100,
      audit = drawFrame(
        ctx,
        lesson,
        scene,
        frameState(timeline, time, index, lesson.scenes.length),
        draw,
      );
    const issues = [...(audit.issues ?? []), ...layoutIssues(audit)];
    assert.deepEqual(issues, [], `U-Net construction at ${i}%`);
  }
});

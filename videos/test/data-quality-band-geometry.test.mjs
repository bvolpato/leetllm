import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { draw } from '../animations/data-quality.mjs';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';

const root = new URL('../../', import.meta.url).pathname;
const lesson = await readLesson(
  new URL('../lessons/data-quality.lesson.yaml', import.meta.url).pathname,
  root,
);
registerLessonFonts();
test('each visible LSH banding bar represents its printed probability throughout admission', () => {
  const scene = lesson.scenes.find((s) => s.id === 'lsh-bands');
  const sounds = scene.beats.map((b, beatIndex) => {
    const words = b.say.split(/\s+/);
    return {
      beatIndex,
      duration: words.length / 2.5,
      words: words.map((text, i) => ({ text, start: i / 2.5, end: (i + 1) / 2.5 - 0.005 })),
    };
  });
  const timeline = makeSceneTimeline(
    scene,
    sounds.map((s) => s.duration),
    30,
  );
  timeline.visualCues = resolveSceneCues(scene, timeline, sounds);
  timeline.cueTiming = 'synthetic-lexical-words';
  const canvas = createCanvas(1920, 1080),
    beat = timeline.beats[2];
  let checks = 0;
  for (const progress of [0.02, 0.05, 0.1, 0.2, 0.4, 0.7, 1]) {
    const time = beat.start + progress * (beat.duration - 0.01),
      state = frameState(timeline, time, lesson.scenes.indexOf(scene), lesson.scenes.length);
    const audit = drawFrame(canvas.getContext('2d'), lesson, scene, state, draw);
    for (const [i, [bands, rows]] of [
      [4, 1],
      [2, 2],
      [1, 4],
    ].entries()) {
      const expected = 1 - (1 - 0.5 ** rows) ** bands;
      assert(audit.labels.some((l) => l.text === expected.toFixed(4)));
      const bar = audit.shapes.find(
        (s) =>
          s.x === 350 && s.y === 410 + i * 155 && s.height === 58 && s.width > 0 && s.alpha > 0.01,
      );
      if (bar) {
        assert(
          Math.abs(bar.width / 600 - expected) < 1e-12,
          `${bands}x${rows} at progress ${progress}: width represents ${bar.width / 600}, printed ${expected}`,
        );
        checks++;
      }
    }
  }
  assert(checks >= 12);
});

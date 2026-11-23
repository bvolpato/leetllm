import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { draw } from '../animations/inference-data-plane.mjs';

registerLessonFonts();

test('layout verdicts follow each worker comparison before the locality table replaces them', async () => {
  const root = new URL('../../', import.meta.url).pathname;
  const lesson = await readLesson(root + 'videos/lessons/inference-data-plane.lesson.yaml', root);
  const scene = lesson.scenes.find((item) => item.id === 'route-compatible');
  const sounds = scene.beats.map((beat, beatIndex) => ({
    beatIndex,
    words: beat.say
      .trim()
      .split(/\s+/)
      .map((text, i) => ({ text, start: i * 0.25, end: (i + 1) * 0.25 })),
  }));
  const timing = makeSceneTimeline(
    scene,
    sounds.map((sound) => sound.words.at(-1).end),
  );
  timing.sounds = sounds;
  timing.visualCues = resolveSceneCues(scene, timing);
  timing.cueTiming = 'provider-words';
  const paint = (time) =>
    drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      lesson,
      scene,
      frameState(timing, time, 0, 1),
      draw,
    );
  const visible = (frame, text) =>
    frame.labels.some((label) => label.text === text && label.alpha > 0.25);
  const matched = timing.visualCues.find((cue) => cue.id === 'compatible-worker-a');
  const mismatched = timing.visualCues.find((cue) => cue.id === 'incompatible-worker-b');
  const before = paint(matched.start - 0.05);
  assert(!visible(before, 'layout matches'));
  assert(!visible(before, 'layout mismatch'));
  const first = paint((matched.start + matched.end) / 2);
  assert(visible(first, 'layout matches'));
  assert(!visible(first, 'layout mismatch'));
  const second = paint((mismatched.start + mismatched.end) / 2);
  assert(visible(second, 'layout mismatch'));
  assert(second.labels.some((label) => label.text === 'layout matches' && label.alpha > 0));
  const table = paint(timing.beats[2].start + 0.5);
  assert(visible(table, 'TP1 / exclude'));
  assert(!visible(table, 'layout matches'));
  assert(!visible(table, 'layout mismatch'));
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/contrastive-learning.mjs';
const lesson = await readLesson(
  new URL('../lessons/contrastive-learning.lesson.yaml', import.meta.url).pathname,
  new URL('../..', import.meta.url).pathname,
);
registerLessonFonts();
function fixture(id) {
  const scene = lesson.scenes.find((s) => s.id === id),
    sounds = scene.beats.map((b, beatIndex) => {
      const words = b.say.trim().split(/\s+/);
      return {
        beatIndex,
        duration: words.length * 0.4,
        words: words.map((text, i) => ({ text, start: i * 0.4, end: (i + 1) * 0.4 - 0.005 })),
      };
    }),
    timing = makeSceneTimeline(
      scene,
      sounds.map((s) => s.duration),
      30,
    );
  timing.visualCues = resolveSceneCues(scene, timing, sounds);
  return { scene, timing, sounds };
}
function window(f, beat, phrase) {
  const s = structuredClone(f.scene);
  s.beats.forEach((b) => delete b.visual_cues);
  s.beats[beat].visual_cues = [{ id: 'boundary', phrase, targets: ['fixture'] }];
  return resolveSceneCues(s, f.timing, f.sounds)[0];
}
function paint(f, time) {
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    f.scene,
    frameState(f.timing, time, 0, 1),
    draw,
  );
}
const text = (a) => a.labels.filter((x) => x.alpha > 0.1).map((x) => x.text),
  has = (a, s) => text(a).some((x) => x.includes(s));
test('teacher inputs remain visible while the computed margin waits for its own full clause', () => {
  const f = fixture('teacher-margin'),
    inputs = window(
      f,
      0,
      'teacher gives the approved passage point two and a non-match point eight',
    ),
    result = window(f, 0, 'its margin is negative point six');
  for (const time of [(inputs.end + result.start) / 2, result.end - 0.001]) {
    const a = paint(f, time);
    assert(has(a, '0.20') && has(a, '0.80'));
    assert.equal(has(a, '= −.60'), false);
  }
  assert(has(paint(f, result.end + 0.001), '= −.60'));
});
test('negated shared-denominator wording retains two separate microbatch matrices', () => {
  const f = fixture('batch-identity'),
    negative = window(f, 1, 'one shared denominator'),
    positive = window(
      f,
      1,
      'Explicit cross-device gathering or cached embedding reuse needs deliberate gradient propagation and masking',
    ),
    a = paint(f, (negative.end + positive.start) / 2);
  assert(has(a, 'Separate denominators survive gradient accumulation'));
  assert(has(a, '12 + 12 off-diagonal terms'));
  assert.equal(
    a.shapes.filter((s) => s.kind === 'rect' && s.width === 132 && s.height === 82).length,
    32,
  );
  assert.equal(has(a, '56'), false);
});
test('positive gathering constructs the distinct pool before earning its completed count', () => {
  const f = fixture('batch-identity'),
    positive = window(
      f,
      1,
      'Explicit cross-device gathering or cached embedding reuse needs deliberate gradient propagation and masking',
    ),
    a = paint(f, (positive.start + positive.end) / 2),
    cells = a.shapes.filter((s) => s.kind === 'rect' && s.width === 77 && s.height === 57);
  assert(cells.length > 0 && cells.length < 64);
  assert(has(a, 'Explicit gathering constructs a shared pool'));
  assert.equal(has(a, '8 × 7 = 56'), false);
  const done = paint(f, positive.end + 0.001);
  assert.equal(
    done.shapes.filter((s) => s.kind === 'rect' && s.width === 77 && s.height === 57).length,
    64,
  );
  assert(has(done, '8 × 7 = 56'));
  assert.equal(has(done, 'Separate denominators survive gradient accumulation'), false);
});

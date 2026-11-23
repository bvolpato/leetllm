import { readRepositoryLesson } from './helpers/repository.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/ai-lab-behavioral-interview.mjs';
const { createCanvas } = createRequire(import.meta.url)('@napi-rs/canvas');
registerLessonFonts();
test('numeric and inventory operands remain pending until the complete rejection clause', async () => {
  const lesson = await readRepositoryLesson(
      'videos/lessons/ai-lab-behavioral-interview.lesson.yaml',
    ),
    scene = lesson.scenes.find((s) => s.id === 'executable-gate');
  const sounds = scene.beats.map((b, beatIndex) => {
    const words = b.say
      .split(/\s+/)
      .filter(Boolean)
      .map((text, i) => ({ text, start: i * 0.4, end: (i + 1) * 0.4 - 0.01 }));
    return { beatIndex, words, duration: words.at(-1).end + 0.1 };
  });
  const timeline = {
    ...makeSceneTimeline(
      scene,
      sounds.map((s) => s.duration),
      30,
    ),
    sounds,
  };
  timeline.visualCues = resolveSceneCues(scene, timeline, sounds);
  timeline.cueTiming = 'test-lexical-words';
  const end = timeline.visualCues.find((c) => c.id === 'gate-invalid-result').end,
    input = timeline.visualCues.find((c) => c.id === 'gate-numeric-one').end,
    canvas = createCanvas(1920, 1080),
    paint = (t) =>
      drawFrame(
        canvas.getContext('2d'),
        lesson,
        scene,
        frameState(timeline, t, 0, lesson.scenes.length),
        draw,
      )
        .labels.filter((l) => l.alpha > 0.25)
        .map((l) => l.text);
  for (const time of [input + 0.01, end - 0.001]) {
    const labels = paint(time);
    assert(!labels.some((x) => x.includes('→ FAIL') || x.includes('→ HOLD')));
    assert(labels.includes('Numeric 1 vs literal true · pending'));
    assert(labels.includes('Missing / extra key · pending'));
    assert(labels.includes('true === true  → PASS'));
  }
  const labels = paint(end + 0.001);
  assert(labels.includes('1 === true  → FAIL'));
  assert(labels.includes('Missing / extra key → HOLD'));
});

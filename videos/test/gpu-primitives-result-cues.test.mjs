import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import {
  draw,
  validateModel,
  ALL,
  FIRST,
  LEFT,
  RIGHT,
  onlineRescale,
} from '../animations/gpu-primitives.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';

const root = new URL('../../', import.meta.url).pathname;
registerLessonFonts();
const lesson = await readLesson(root + 'videos/lessons/gpu-primitives.lesson.yaml', root);
const baseline = await loadMeasuredTimeline('gpu-primitives');
function paint(sceneId, time) {
  const scene = lesson.scenes.find((s) => s.id === sceneId),
    timing = baseline.scenes.find((s) => s.id === sceneId);
  const state = frameState(
    { ...timing, visualCues: resolveSceneCues(scene, timing), cueTiming: 'provider-words' },
    time,
    lesson.scenes.indexOf(scene),
    lesson.scenes.length,
  );
  return drawFrame(createCanvas(1920, 1080).getContext('2d'), lesson, scene, state, draw).labels;
}
function visibleMath(labels, prefix) {
  return labels.some(
    (label) => label.kind === 'math' && label.text.startsWith(prefix) && label.alpha > 0.9,
  );
}
test('the cancellation clause highlights the computed FP32 answer', () => {
  assert(visibleMath(paint('floating-point-order', 244.5 - 226.9), '0+3.14'));
});
test('the new maximum clause highlights the incoming state rather than the prior denominator', () => {
  const labels = paint('online-softmax', 8608 / 30 - 266.3333333333333);
  assert(visibleMath(labels, 'm^{\\prime}'));
  assert(labels.find((l) => l.text.startsWith('Prior state')).alpha < 0.8);
});
test('the equivalence clause highlights the combined denominator', () => {
  assert(visibleMath(paint('online-softmax', 9220 / 30 - 266.3333333333333), '\\ell^{\\prime}'));
});
test('each measured softmax arithmetic clause reveals its actual computed term', () => {
  const scene = lesson.scenes.find((s) => s.id === 'online-softmax'),
    timing = baseline.scenes.find((s) => s.id === scene.id);
  const cues = resolveSceneCues(scene, timing);
  for (const [id, prefix] of [
    ['online-new-maximum', 'm^{\\prime}'],
    ['online-rescale-prior', 'e^{2-4}'],
    ['online-add-incoming', 'e^{4-4}'],
    ['online-combined-result', '\\ell^{\\prime}'],
  ]) {
    const cue = cues.find((c) => c.id === id);
    for (const progress of [0.15, 0.8])
      assert(visibleMath(paint(scene.id, cue.start + progress * (cue.end - cue.start)), prefix));
  }
});
test('the numerical results retain their exact arithmetic identities', () => {
  validateModel();
  assert.equal(FIRST.maximum, 2);
  assert.equal(ALL.maximum, 4);
  assert(
    Math.abs(onlineRescale(1).total - [2, 1, 4, 0].reduce((s, x) => s + Math.exp(x - 4), 0)) <
      1e-12,
  );
  assert(Math.abs(LEFT - Math.fround(3.14)) < 1e-12);
  assert.equal(RIGHT, 0);
});

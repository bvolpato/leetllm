import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';

const root = new URL('../../', import.meta.url).pathname;
const { draw } = await import(
  pathToFileURL(path.resolve(root, process.env.LORA_ENTRY ?? 'videos/animations/lora.mjs'))
);
const lesson = await readLesson(
  path.resolve(root, process.env.LORA_LESSON ?? 'videos/lessons/lora.lesson.yaml'),
  root,
);
const declaredLesson = await readLesson(path.join(root, 'videos/lessons/lora.lesson.yaml'), root);
const actual = await loadMeasuredTimeline('lora');
registerLessonFonts();
const canvas = createCanvas(1920, 1080);
function sample(id, cueId, phase) {
  const index = declaredLesson.scenes.findIndex((scene) => scene.id === id);
  const declaration = declaredLesson.scenes[index];
  const measured = actual.scenes.find((scene) => scene.id === id);
  const cue = resolveSceneCues(declaration, measured).find((cue) => cue.id === cueId);
  assert.ok(cue, cueId);
  const frame = phase === 'last' ? Math.ceil(cue.end * 30) - 1 : Math.floor(cue.end * 30) + 1;
  const timing = structuredClone(measured);
  timing.visualCues = resolveSceneCues(lesson.scenes[index], timing);
  const state = frameState(timing, frame / 30, index, lesson.scenes.length);
  const audit = drawFrame(canvas.getContext('2d'), lesson, lesson.scenes[index], state, draw);
  return audit.labels.filter((label) => label.alpha > 0.25).map((label) => label.text);
}
for (const [scene, cue, value] of [
  ['parameter-count', 'parameter-base-result', '16,777,216 base weights'],
  ['parameter-count', 'parameter-adapter-result', '131,072 trainable values'],
  ['parameter-count', 'parameter-percent-result', '0.78125% of the base matrix'],
  ['target-budget', 'target-large-ratio', '×4.77'],
  ['tiny-peft', 'tiny-base-result', '3408 base'],
  ['tiny-peft', 'tiny-wrapped-result', '3920 wrapped'],
  ['fresh-policy', 'fresh-policy-count', '19 / 20'],
]) {
  test(`${scene} holds ${value} until its complete result clause`, () => {
    assert.equal(
      sample(scene, cue, 'last').some((text) => text.includes(value)),
      false,
    );
    assert.equal(
      sample(scene, cue, 'after').some((text) => text.includes(value)),
      true,
    );
  });
}
test('the later scalar step keeps its A gradient pending instead of showing the previous zero', () => {
  const before = sample('gradient-contract', 'gradient-next-a', 'last');
  assert.ok(before.includes('B = 0.1'));
  assert.ok(before.includes('error g = −0.9'));
  assert.ok(before.includes('∂L/∂A: pending'));
  assert.equal(before.includes('∂L/∂A = 0'), false);
  assert.ok(sample('gradient-contract', 'gradient-next-a', 'after').includes('∂L/∂A = −0.09'));
});
test('earned counts stay visible while their later summary is pending', () => {
  const tiny = sample('tiny-peft', 'tiny-base-result', 'last');
  assert.ok(tiny.some((text) => text.includes('512 factors')));
  assert.ok(!tiny.some((text) => text.includes('3920')));
  const target = sample('target-budget', 'target-large-ratio', 'last');
  assert.ok(target.some((text) => text.includes('all seven = 1,249,280')));
  assert.ok(target.some((text) => text.includes('×?')));
});

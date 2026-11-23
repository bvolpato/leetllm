import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as animation from '../animations/distillation.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
registerLessonFonts();

async function fixture() {
  const id = 'distillation',
    lesson = await readLesson(path.join(root, `videos/lessons/${id}.lesson.yaml`), root);

  const timeline = await loadMeasuredTimeline(id);
  const index = lesson.scenes.findIndex((scene) => scene.id === 'prefixes'),
    scene = lesson.scenes[index];
  const measured = timeline.scenes.find((item) => item.id === scene.id);
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const state = (time) => frameState(timing, time, index, lesson.scenes.length);
  const paint = (time) =>
    drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      lesson,
      scene,
      state(time),
      animation.draw,
    );
  return { timing, state, paint };
}

test('the new-prefix query cue focuses the lower student request and pending response, preserving the reference context', async () => {
  const { timing, state, paint } = await fixture();
  const cue = timing.visualCues.find((cue) => cue.id === 'prefixes-b2-2');
  for (const time of [cue.start + 0.08, (cue.start + cue.end) / 2, cue.end - 0.04]) {
    const current = state(time),
      model = animation.prefixSnapshot(current.beat, current.beatP),
      audit = paint(time);
    assert(
      model.feedback > 0 && model.feedback < 1,
      'the inspected real request must still be in transit',
    );
    const parts = audit.targets.filter((target) => cue.targets.includes(target.id));
    assert(parts.length > 0);
    assert(
      parts.every((part) => part.y >= 640),
      'the new-prefix request must focus its lower lane, not reference-prefix probabilities',
    );
    assert(audit.labels.some((label) => label.text === 'Query: The child saw a dog'));
    assert(audit.labels.some((label) => label.text === 'Conditional query pending'));
    assert(audit.labels.some((label) => label.text === 'Teacher | … a bird'));
  }
});

test('the same semantic target retains the new-prefix reply after the actual response arrives', async () => {
  const { timing, state, paint } = await fixture();
  const cue = timing.visualCues.find((cue) => cue.id === 'prefixes-b2-2');
  const time = timing.beats[1].end - 0.1,
    current = state(time);
  const model = animation.prefixSnapshot(current.beat, current.beatP),
    audit = paint(time);
  assert.equal(model.feedback, 1);
  const parts = audit.targets.filter((target) => cue.targets.includes(target.id));
  assert(parts.length > 0 && parts.every((part) => part.y >= 640));
  assert.deepEqual(model.visitedTeacher, [0.1, 0.55, 0.35]);
  assert(audit.labels.some((label) => label.text === '0.55' && label.y >= 650));
});

test('categorical KL handles absent mass according to its direction', () => {
  assert.equal(animation.kl([0.5, 0.5], [1, 0]), Infinity);
  assert.equal(animation.kl([1, 0], [1, 0]), 0);
  assert(Math.abs(animation.kl([1, 0], [0.5, 0.5]) - Math.log(2)) < 1e-12);
  assert.throws(() => animation.kl([0.5, 0.5], [1, -0.1]));
});

test('joint sequence KL uses the left distribution for conditional prefix weights', () => {
  const f = animation.jointFixture();
  const forwardChain =
    f.first + f.q0.reduce((sum, weight, i) => sum + weight * f.conditional[i], 0);
  const reverseChain =
    animation.kl(f.p0, f.q0) +
    f.p0.reduce((sum, weight, i) => sum + weight * animation.kl(f.p1[i], f.q1[i]), 0);
  assert(Math.abs(f.forward - forwardChain) < 1e-12);
  assert(Math.abs(f.reverse - reverseChain) < 1e-12);
  const wrongUniform = f.first + f.conditional.reduce((sum, value) => sum + value / 2, 0);
  assert(Math.abs(f.forward - wrongUniform) > 0.08);
});

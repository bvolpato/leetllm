import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as animation from '../animations/capstone-demand-forecasting-alerts.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
registerLessonFonts();

async function fixture() {
  const id = 'capstone-demand-forecasting-alerts';
  const lesson = await readLesson(path.join(root, `videos/lessons/${id}.lesson.yaml`), root);

  const timeline = await loadMeasuredTimeline(id);
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'origins');
  const scene = lesson.scenes[sceneIndex],
    measured = timeline.scenes.find((scene) => scene.id === 'origins');
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const state = (time) => frameState(timing, time, sceneIndex, lesson.scenes.length);
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

test('the first origin stays on Feb1 throughout its measured fit-and-forecast explanation', async () => {
  const { timing, state, paint } = await fixture();
  const first = timing.visualCues.find((cue) => cue.id === 'origins-b1-1');
  const advance = timing.visualCues.find((cue) => cue.id === 'origins-b1-2');
  for (const time of [
    first.start,
    (first.start + first.end) / 2,
    first.end,
    advance.start - 0.001,
  ]) {
    const model = animation.sampleModel('origins', state(time));
    assert.equal(model.originDay, 1, 'the real boundary must hold at the first Sunday');
    const audit = paint(time);
    assert(audit.labels.some((label) => label.text === 'Origin 1 · 62 mature days'));
    const boundary = audit.targets.find((target) => target.id === 'issue-boundary');
    assert(boundary && Math.abs(boundary.x - 370) <= 3);
  }
});

test('the following-Sunday cue moves the real boundary once and admits its mature history only at arrival', async () => {
  const { timing, state, paint } = await fixture();
  const advance = timing.visualCues.find((cue) => cue.id === 'origins-b1-2');
  const days = [];
  for (let i = 0; i <= 40; i++) {
    const model = animation.sampleModel(
      'origins',
      state(advance.start + ((advance.end - advance.start) * i) / 40),
    );
    days.push(model.originDay);
    if (i > 0 && i < 40)
      assert.equal(
        model.originTrainingDays,
        null,
        'next fitted history remains pending during transit',
      );
  }
  assert.equal(days[0], 1);
  assert.equal(days.at(-1), 8);
  assert(days.every((value, i) => value >= 1 && value <= 8 && (!i || value >= days[i - 1])));
  for (const time of [advance.end + 0.05, timing.duration - 0.25]) {
    const model = animation.sampleModel('origins', state(time));
    assert.equal(model.originDay, 8);
    assert.equal(model.originTrainingDays, 68);
    const audit = paint(time);
    assert(audit.labels.some((label) => label.text === 'Origin 2 · 68 mature days'));
    const boundary = audit.targets.find((target) => target.id === 'issue-boundary');
    assert(boundary && Math.abs(boundary.x - 1490) <= 3);
  }
});

import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const animation = await import(
  process.env.SEARCH_CAPACITY_MODULE ?? '../animations/design-llm-powered-search-engine.mjs'
);
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
registerLessonFonts();
async function fixture() {
  const id = 'design-llm-powered-search-engine';
  const lesson = await readLesson(path.join(root, `videos/lessons/${id}.lesson.yaml`), root);

  const timeline = await loadMeasuredTimeline(id);
  const index = lesson.scenes.findIndex((scene) => scene.id === 'capacity'),
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
function assertCompleted(labels) {
  assert(labels.some((label) => label.includes('Memory lower bound: 19 devices')));
  assert(labels.some((label) => label.includes('Decode lower bound: 12 devices')));
  assert(!labels.some((label) => label.includes('bound pending')));
  for (const value of ['2', '32', '8', '128'])
    assert(labels.includes(value), `factor ${value} must remain visible`);
}
test('completed memory and throughput bounds survive the visible measured endhold', async () => {
  const { timing, state, paint } = await fixture();
  for (
    let time = timing.beats.at(-1).end + 0.05;
    time < timing.duration - 0.15;
    time += 1 / timing.fps
  ) {
    assert.equal(state(time).beat, 1);
    assert(state(time).beatP > 0.95);
    assertCompleted(paint(time).labels.map((label) => label.text));
  }
});
test('the earlier narrated comparison retains the computed19/12 lower bounds', async () => {
  const { timing, paint, state } = await fixture();
  const cue = timing.visualCues.find((cue) => cue.id === 'capacity-beat-2-focus-1');
  for (const time of [cue.start + 0.08, (cue.start + cue.end) / 2, cue.end - 0.04]) {
    const current = state(time),
      model = animation.capacityTeachingState(current.beat, current.beatP, current.cues);
    assert.equal(model.bytesPerPosition, 131072);
    assert.equal(model.memoryDevices, 19);
    assert.equal(model.decodeDevices, 12);
    assertCompleted(paint(time).labels.map((label) => label.text));
  }
});

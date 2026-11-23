import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { readLesson, frameState, makeSceneTimeline } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { draw } from '../animations/local-agent-sandboxing-seatbelt-landlock.mjs';

registerLessonFonts();
const root = new URL('../../', import.meta.url).pathname;
const lesson = await readLesson(
  root + 'videos/lessons/local-agent-sandboxing-seatbelt-landlock.lesson.yaml',
  root,
);
const index = lesson.scenes.findIndex((scene) => scene.id === 'fresh-boundary');
const scene = lesson.scenes[index],
  timeline = makeSceneTimeline(
    scene,
    scene.beats.map(() => 10),
  );
function paint(beat, id, phase, progress) {
  const cues = Object.fromEntries(
    scene.beats
      .flatMap((b) => b.visual_cues ?? [])
      .map((cue) => [cue.id, { ...cue, phase: 'before', progress: 0, active: false }]),
  );
  for (const prerequisite of [
    'fresh-path-resolve',
    'fresh-task-write',
    'fresh-worker-exit',
    'fresh-host-open',
  ]) {
    cues[prerequisite] = { ...cues[prerequisite], phase: 'after', progress: 1, active: false };
  }
  cues[id] = { ...cues[id], phase, progress, active: phase === 'during' };
  const state = {
    ...frameState(timeline, timeline.beats[beat].start + 9, index, lesson.scenes.length),
    cues,
  };
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    state,
    draw,
  ).labels.map((label) => label.text);
}
for (const [beat, cue, answer] of [
  [0, 'fresh-path-deny', 'DENY · resolved resource is metadata'],
  [1, 'fresh-host-reveal', 'Execution authority: HOST'],
]) {
  test(`the actual ${cue} drawing holds its verdict through the result clause`, () => {
    for (const progress of [0.001, 0.5, 0.999])
      assert(!paint(beat, cue, 'during', progress).includes(answer));
    assert(paint(beat, cue, 'after', 1).includes(answer));
  });
}

import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { draw, sampleModel } from '../animations/ai-coding-workflow-with-agents.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';

const root = new URL('../..', import.meta.url).pathname;
const lesson = await readLesson(
  root + '/videos/lessons/ai-coding-workflow-with-agents.lesson.yaml',
  root,
);
const timeline = await loadMeasuredTimeline('ai-coding-workflow-with-agents');
const scene = lesson.scenes.find((scene) => scene.id === 'loop');
const sceneIndex = lesson.scenes.indexOf(scene);
const previous = timeline.scenes.find((scene) => scene.id === 'loop');
const timing = {
  ...previous,
  visualCues: resolveSceneCues(scene, previous),
  cueTiming: 'provider-words',
};
const build = timing.visualCues.find((cue) => cue.id === 'loop-second-repair-build');
const second = timing.visualCues.find((cue) => cue.id === 'loop-b2-1');
const at = (time) => frameState(timing, time, sceneIndex, lesson.scenes.length);
const paint = (state) =>
  drawFrame(createCanvas(1920, 1080).getContext('2d'), lesson, scene, state, draw);

test('the observed second repair completes before its spoken result and remains established', () => {
  assert(build.end < second.start);
  const before = sampleModel('loop', at(build.start - 0.01));
  assert.equal(before.time, 5);
  assert.equal(before.attempts, 1);
  let last = before.time;
  for (let i = 0; i <= 10; i++) {
    const state = at(build.start + ((build.end - build.start) * i) / 10);
    const current = sampleModel('loop', state);
    assert(current.time >= last && current.time <= 8);
    last = current.time;
  }
  for (const time of [
    second.start + 0.08,
    (second.start + second.end) / 2,
    second.end - 0.04,
    timing.beats[1].until - 0.01,
  ]) {
    const state = at(time),
      current = sampleModel('loop', state),
      audit = paint(state);
    assert.equal(current.time, 8);
    assert.equal(current.attempts, 2);
    assert(
      audit.labels.some((label) => label.text === 'Candidate verifier PASS' && label.alpha > 0.35),
    );
    assert(
      !audit.labels.some(
        (label) => label.text === 'Retain the actual failure' && label.alpha > 0.1,
      ),
    );
    assert(
      audit.labels.some((label) => label.text === 'Repair attempts: 2 / 3' && label.alpha > 0.35),
    );
  }
});

test('the expected failing baseline is retained outside the repair-attempt budget', () => {
  const state = at(timing.beats[0].start + timing.beats[0].duration * 0.5);
  const current = sampleModel('loop', state),
    audit = paint(state);
  assert(current.time >= 2 && current.time < 3);
  assert.equal(current.attempts, 0);
  assert(audit.labels.some((label) => label.text === 'expected fail'));
});

import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { draw as drawRay, sampleModel } from '../animations/deep-dive-ray.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { frameState, readLesson } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
registerLessonFonts();

const lesson = await readLesson(path.join(root, 'videos/lessons/deep-dive-ray.lesson.yaml'), root);

const timeline = await loadMeasuredTimeline('deep-dive-ray');
const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'references');
const scene = lesson.scenes[sceneIndex];
const measured = timeline.scenes.find((item) => item.id === 'references');
assert(scene && measured, 'the references scene must exist in the measured timeline');
const timing = {
  ...measured,
  visualCues: resolveSceneCues(scene, measured),
  cueTiming: 'provider-words',
};
const ownerCue = timing.visualCues.find((cue) => cue.id === 'references-beat-3-focus-1');
assert(ownerCue, 'the measured owner-loss cue must resolve');

function at(localSeconds) {
  return frameState(timing, localSeconds, sceneIndex, lesson.scenes.length);
}

function paint(state) {
  return drawFrame(createCanvas(1920, 1080).getContext('2d'), lesson, scene, state, drawRay);
}

function containsLabel(audit, text) {
  return audit.labels.some((label) => label.text === text);
}

test('owner-loss remains terminal through the measured after phase and scene hold', () => {
  const before = at(ownerCue.start - 0.01);
  const during = at((ownerCue.start + ownerCue.end) / 2);
  const after = at(ownerCue.end + 0.1);
  const sceneEnd = at(measured.duration - 1 / measured.fps);

  assert.equal(before.cues[ownerCue.id].phase, 'before');
  assert.equal(during.cues[ownerCue.id].phase, 'during');
  assert.equal(after.cues[ownerCue.id].phase, 'after');
  assert.equal(sceneEnd.cues[ownerCue.id].phase, 'after');
  assert.equal(sampleModel('references', before).ownerLost, false);
  assert.equal(sampleModel('references', during).ownerLost, true);

  for (const state of [after, sceneEnd]) {
    const model = sampleModel('references', state);
    assert.equal(
      model.ownerLost,
      true,
      'the owner-loss result must not reset after the spoken cue',
    );
    assert.equal(model.lost, true);
    assert.equal(model.copies, 1);
    assert.equal(model.bytesPerCopy, 64);
    assert.equal(model.copies * model.bytesPerCopy, 64);

    const audit = paint(state);
    assert(containsLabel(audit, 'Driver · owner process lost'));
    assert(containsLabel(audit, 'ObjectRef A · metadata unavailable'));
    assert(containsLabel(audit, 'Node A · copy lost'));
    assert(containsLabel(audit, 'Node B · object store · 64 bytes'));
    assert(containsLabel(audit, 'Stored-copy payload: 64 bytes'));
    assert.deepEqual(audit.issues, []);
  }
});

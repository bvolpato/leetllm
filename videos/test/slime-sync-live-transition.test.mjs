import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { draw, sampleModel } from '../animations/deep-dive-slime.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';

registerLessonFonts();
const root = fileURLToPath(new URL('../../', import.meta.url));
const lesson = await readLesson(
  new URL('../lessons/deep-dive-slime.lesson.yaml', import.meta.url),
  root,
);
const index = lesson.scenes.findIndex((scene) => scene.id === 'sync'),
  scene = lesson.scenes[index];
const measured = (await loadMeasuredTimeline('deep-dive-slime')).scenes[0];
const timing = {
  ...measured,
  visualCues: resolveSceneCues(scene, measured),
  cueTiming: 'provider-words',
};
const cue = (id) => timing.visualCues.find((item) => item.id === id);
const live = cue('sync-beat-1-focus-1'),
  pause = cue('sync-beat-2-focus-1');
const receipt = cue('sync-beat-3-focus-2'),
  resume = cue('sync-beat-3-focus-1');
const canvas = createCanvas(1920, 1080),
  ctx = canvas.getContext('2d');
function paint(time) {
  const state = frameState(timing, time, index, lesson.scenes.length);
  const model = sampleModel('sync', state),
    audit = drawFrame(ctx, lesson, scene, state, draw);
  assert.deepEqual(layoutIssues(audit), [], `native geometry at ${time}s`);
  const labels = audit.labels.map((label) => label.text);
  assert(labels.includes('SGLang · loaded ' + model.loaded));
  const pixels = (x, y, width, height) =>
    createHash('sha256')
      .update(ctx.getImageData(x, y, width, height).data)
      .digest('hex');
  return {
    model,
    labels,
    headingPixels: pixels(100, 240, 1720, 70),
    admissionPixels: pixels(1300, 640, 470, 110),
  };
}

test('the old policy remains live through preparation and its held state', () => {
  for (const time of [
    live.start + 0.08,
    (live.start + live.end) / 2,
    live.end,
    timing.beats[0].until,
    pause.start - 0.02,
    317.1 - timing.start,
  ]) {
    const { model, labels } = paint(time);
    assert.equal(model.loaded, 11);
    assert.equal(model.paused, false, `preparation still serves policy 11 at ${time}s`);
    assert.equal(model.ready, false);
    assert(labels.includes('Policy 11 admissions live'));
    assert(!labels.includes('Admissions paused'));
  }
});

test('the measured transition pauses the actual admission card', () => {
  const before = paint(pause.start - 0.02);
  for (const time of [pause.start, (pause.start + pause.end) / 2, pause.end]) {
    const { model, labels, admissionPixels } = paint(time);
    assert.equal(model.paused, true);
    assert.equal(model.loaded, 11);
    assert(labels.includes('Admissions paused'));
    assert.notEqual(
      admissionPixels,
      before.admissionPixels,
      'the paused admission state must actually be painted',
    );
  }
});

test('the heading follows the actual post-reload serving identity', () => {
  const before = paint(pause.start - 0.02);
  const loaded = paint(timing.beats[1].end - 0.04);
  assert.equal(loaded.model.loaded, 12);
  assert.equal(loaded.model.verified, false);
  assert(loaded.labels.includes('Admissions paused'));
  assert(
    !loaded.labels.some((label) => /still serving policy 11|policy 11 remains live/i.test(label)),
    'the heading must stop claiming that policy 11 serves after reload',
  );
  assert.notEqual(
    loaded.headingPixels,
    before.headingPixels,
    'the changed engine identity must update the painted heading',
  );
});

test('separate measured verification and resume receipts gate the resumed held state', () => {
  for (const time of [receipt.start, (receipt.start + receipt.end) / 2, receipt.end - 0.02]) {
    const { model, labels } = paint(time);
    assert.equal(model.loaded, 12);
    assert.equal(model.verified, false);
    assert.equal(model.ready, false);
    assert(labels.includes('Admissions paused'));
  }
  for (const time of [receipt.end, resume.start - 0.02, (resume.start + resume.end) / 2]) {
    const { model, labels } = paint(time);
    assert.equal(model.verified, true);
    assert.equal(model.ready, false);
    assert(labels.includes('Admissions paused'));
  }
  const paused = paint(resume.start - 0.02);
  for (const time of [
    resume.end,
    resume.end + resume.linger + 0.2,
    timing.beats[2].end,
    timing.beats[2].until + 1 / timing.fps,
    timing.duration - 1 / timing.fps,
  ]) {
    const { model, labels, admissionPixels } = paint(time);
    assert.equal(model.loaded, 12);
    assert(model.reloadSucceeded && model.verified && model.ready && !model.paused);
    assert(labels.includes('Admissions resumed'));
    assert(labels.includes('Observed 12 matches expected 12 · resume allowed'));
    assert(!labels.some((label) => /still serving policy 11|policy 11 remains live/i.test(label)));
    assert.notEqual(
      admissionPixels,
      paused.admissionPixels,
      'the resumed state must actually be painted',
    );
  }
});

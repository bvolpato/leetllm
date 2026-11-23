import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { draw as drawEdgeSpecialization, sampleModel } from '../animations/edge-specialization.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { frameState, readLesson } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function measuredScene(sceneId) {
  const lesson = await readLesson(
    path.join(root, 'videos/lessons/edge-specialization.lesson.yaml'),
    root,
  );
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === sceneId);
  assert.notEqual(sceneIndex, -1);
  const timeline = await loadMeasuredTimeline('edge-specialization');
  const measured = timeline.scenes.find((scene) => scene.id === sceneId);
  const scene = lesson.scenes[sceneIndex];
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const cue = (id) => {
    const value = timing.visualCues.find((item) => item.id === id);
    assert(value, `measured cue ${id} must resolve from provider words`);
    return value;
  };
  return { lesson, scene, sceneIndex, timing, cue };
}

function stateAt(timing, sceneIndex, sceneCount, cue, progress = 0.5) {
  return frameState(timing, cue.start + (cue.end - cue.start) * progress, sceneIndex, sceneCount);
}

function paint(lesson, scene, state) {
  const canvas = createCanvas(1920, 1080);
  return drawFrame(canvas.getContext('2d'), lesson, scene, state, drawEdgeSpecialization);
}

function visibleLabels(audit) {
  return audit.labels.filter((label) => label.alpha > 0.9).map((label) => label.text);
}

test('the measured sample-failure clause reaches the ten-minute failure and holds it through the caution', async () => {
  const { lesson, scene, sceneIndex, timing, cue } = await measuredScene('thermal');
  assert.deepEqual(cue('sample-failure').targets, [
    'thermal-rate-curve',
    'thermal-readout',
    'thermal-readout-2',
    'thermal-readout-3',
    'thermal-readout-4',
  ]);
  const at = (item, progress = 0.5) =>
    stateAt(timing, sceneIndex, lesson.scenes.length, item, progress);

  const before = frameState(
    timing,
    cue('sample-failure').start - 0.05,
    sceneIndex,
    lesson.scenes.length,
  );
  const beforeModel = sampleModel('thermal', before);
  assert.equal(before.beat, 1);
  assert(
    beforeModel.passes,
    'the initial part of the failure clause keeps the earlier supplied samples',
  );

  const during = at(cue('sample-failure'));
  const duringModel = sampleModel('thermal', during);
  assert.equal(duringModel.minute, 10);
  assert.equal(duringModel.rate, 16.8);
  assert.equal(duringModel.minimum, 16.8);
  assert.equal(duringModel.passes, false);
  const duringLabels = visibleLabels(paint(lesson, scene, during));
  for (const text of [
    '10.0 min',
    '16.8 current',
    '16.8 sampled min',
    'Observed-sample gate: fail · target 18 tokens/s',
  ]) {
    assert(
      duringLabels.includes(text),
      `the source painter must show ${text} during the failure clause`,
    );
  }

  const traceFails = at(cue('trace-fails'));
  assert.equal(sampleModel('thermal', traceFails).passes, false);
  const failureLabels = visibleLabels(paint(lesson, scene, traceFails));
  assert(failureLabels.includes('Observed-sample gate: fail · target 18 tokens/s'));

  const cautionTime = cue('trace-fails').end + 0.25;
  const caution = frameState(timing, cautionTime, sceneIndex, lesson.scenes.length);
  assert.equal(caution.beat, 1);
  assert.equal(
    sampleModel('thermal', caution).passes,
    false,
    'the sampled failure remains while the caution is narrated',
  );
});

test('the measured fresh-session clause activates bundle two, then health recovery restores bundle one', async () => {
  const { lesson, scene, sceneIndex, timing, cue } = await measuredScene('updates');
  assert.deepEqual(cue('fresh-session').targets, [
    'updates-readout',
    'updates-readout-2',
    'updates-readout-4',
  ]);
  const at = (item, progress = 0.5) =>
    stateAt(timing, sceneIndex, lesson.scenes.length, item, progress);

  const before = frameState(
    timing,
    cue('fresh-session').start - 0.05,
    sceneIndex,
    lesson.scenes.length,
  );
  const beforeModel = sampleModel('updates', before);
  assert.equal(beforeModel.checked.accepted, true);
  assert.equal(beforeModel.active, 1);
  assert.equal(beforeModel.session, 1);

  const activation = at(cue('fresh-session'));
  const activated = sampleModel('updates', activation);
  assert.equal(activated.checked.accepted, true);
  assert.equal(activated.active, 2);
  assert.equal(activated.session, 2);
  const activationAudit = paint(lesson, scene, activation);
  const activationTargets = activationAudit.targets
    .filter((part) => part.alpha > 0.9)
    .map((part) => part.id);
  for (const id of ['updates-readout', 'updates-readout-2', 'updates-readout-4'])
    assert(activationTargets.includes(id));
  const activationLabels = visibleLabels(activationAudit);
  assert(activationLabels.some((text) => text.includes('version 1') && text.includes('retained')));
  assert(activationLabels.some((text) => text.includes('version 2') && text.includes('active')));
  assert(
    activationLabels.some(
      (text) => text.includes('active bundle 2') && text.includes('fresh session 2'),
    ),
  );

  const held = frameState(timing, cue('fresh-session').end + 0.2, sceneIndex, lesson.scenes.length);
  assert.equal(held.beat, 1);
  assert.equal(sampleModel('updates', held).active, 2);
  assert.equal(sampleModel('updates', held).session, 2);

  const recovery = at(cue('health-recovery'));
  const recovered = sampleModel('updates', recovery);
  assert.equal(recovered.recovered, true);
  assert.equal(recovered.active, 1);
  assert.equal(recovered.session, 3);
  const recoveryLabels = visibleLabels(paint(lesson, scene, recovery));
  assert(recoveryLabels.some((text) => text.includes('version 1') && text.includes('active')));
  assert(
    recoveryLabels.some(
      (text) => text.includes('active bundle 1') && text.includes('fresh session 3'),
    ),
  );
});

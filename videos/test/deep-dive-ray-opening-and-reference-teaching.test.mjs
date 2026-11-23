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

async function measuredCue(sceneId, phrase, phase = 'middle') {
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === sceneId);
  assert.notEqual(sceneIndex, -1, `deep-dive-ray/${sceneId} must exist`);
  const scene = lesson.scenes[sceneIndex];
  const measured = timeline.scenes.find((item) => item.id === sceneId);
  assert(measured, `the measured export must contain ${sceneId}`);
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const cue = timing.visualCues.find((item) => item.phrase === phrase);
  assert(cue, `the measured timeline must resolve “${phrase}”`);
  const time =
    phase === 'early'
      ? Math.min(cue.start + 0.08, (cue.start + cue.end) / 2)
      : phase === 'late'
        ? cue.end - Math.min(0.04, (cue.end - cue.start) / 4)
        : (cue.start + cue.end) / 2;
  return {
    scene,
    sceneIndex,
    cue,
    state: frameState(timing, time, sceneIndex, lesson.scenes.length),
  };
}

function paint({ scene, state }) {
  return drawFrame(createCanvas(1920, 1080).getContext('2d'), lesson, scene, state, drawRay);
}

function targetContainsLabel(audit, id, text) {
  const target = audit.targets.find((part) => part.id === id && part.alpha > 0.9);
  return (
    target &&
    audit.labels.some(
      (label) =>
        label.text === text &&
        label.x >= target.x &&
        label.x <= target.x + target.width &&
        label.y >= target.y &&
        label.y <= target.y + target.height,
    )
  );
}

test('two words enter their worker lanes before trace can take the free worker', async () => {
  const scene = lesson.scenes[0];
  const measured = timeline.scenes[0];
  const timing = { ...measured, visualCues: resolveSceneCues(scene, measured) };
  const at = (time) => paint({ scene, state: frameState(timing, time, 0, lesson.scenes.length) });
  const first = at(0);
  const moving = at(0.4);
  const label = (frame, word) => frame.labels.find((item) => item.text === word && item.alpha > 0);
  for (const word of ['cache', 'router']) {
    assert.equal(label(first, word).alpha, 1);
    assert(label(moving, word).x > label(first, word).x);
  }
  assert.equal(label(first, 'trace').y, label(moving, 'trace').y);
  const pickup = timing.visualCues.find((cue) => cue.id === 'intro-worker');
  assert.equal(label(at(pickup.start - 0.04), 'trace').y, label(first, 'trace').y);
  const running = at(pickup.end + 0.04);
  assert.equal(label(running, 'trace').y, label(running, 'router').y);
  assert(label(running, 'trace').x > label(running, 'router').x);
});

test('the opening payoff uses the authored three-task serial and two-worker schedules', async () => {
  const sample = await measuredCue('intro', "With one worker they'd finish at nine");
  const model = sampleModel('intro', sample.state);
  assert.deepEqual(model.comparison?.paths, { serial: 9, twoWorkers: 5 });

  const audit = paint(sample);
  assert.deepEqual(sample.cue.targets, ['intro-schedule-payoff', 'intro-ledger-count']);
  const schedule = audit.targets.find((part) => part.id === 'intro-schedule-payoff');
  assert(
    schedule && schedule.alpha > 0.9,
    'the comparison should be visible while the narrator describes the serial finish',
  );
  for (const label of ['Serial · 9 ticks', 'Two workers · 5 ticks'])
    assert(targetContainsLabel(audit, 'intro-schedule-payoff', label), label);
  for (const task of ['cache', 'router', 'trace'])
    assert(
      audit.labels.some((label) => label.text === task),
      task,
    );
  assert(
    schedule.y >
      audit.targets.find((part) => part.id === 'intro-trace-task').y +
        audit.targets.find((part) => part.id === 'intro-trace-task').height,
    'the comparison must stay below the worker lanes',
  );
  assert.deepEqual(audit.issues, []);
});

test('the replacement count stays hidden through the prediction hold', async () => {
  const scene = lesson.scenes[0];
  const measured = timeline.scenes[0];
  const timing = { ...measured, visualCues: resolveSceneCues(scene, measured) };
  const labels = (t) =>
    paint({ scene, state: frameState(timing, t, 0, lesson.scenes.length) }).labels.map(
      (label) => label.text,
    );
  const answer = timing.visualCues.find((cue) => cue.id === 'intro-zero');
  const hold = labels((timing.beats[0].end + timing.beats[0].until) / 2);
  assert(hold.includes('?') && hold.includes('BatchLedger()'));
  assert(!hold.some((text) => text === '0' || /completed\s*=\s*0/.test(text)));
  const revealed = labels(answer.end + 0.04);
  assert(revealed.includes('0') && revealed.includes('self.completed = 0'));
});

test('the reference owner points to the handle while the bytes belong to labeled node stores', async () => {
  const owner = await measuredCue(
    'references',
    'The process that submits a task generally owns its result reference',
  );
  assert.deepEqual(owner.cue.targets, ['references-owner-metadata']);
  const ownerAudit = paint(owner);
  assert(targetContainsLabel(ownerAudit, 'references-owner-metadata', 'Driver · owner metadata'));
  assert(targetContainsLabel(ownerAudit, 'references-owner-metadata', 'ObjectRef A · handle'));
  assert(!targetContainsLabel(ownerAudit, 'references-owner-metadata', 'Node A · object store'));

  const producer = await measuredCue('references', 'A different worker computes the bytes');
  const producerAudit = paint(producer);
  assert(sampleModel('references', producer.state).copies === 1);
  assert(
    targetContainsLabel(producerAudit, 'references-producer-result', 'Producer worker · Node A'),
  );
  assert(
    targetContainsLabel(
      producerAudit,
      'references-node-a-copy',
      'Node A · object store · 64 bytes',
    ),
  );

  const consumer = await measuredCue(
    'references',
    'A consumer on another node needs access to the value',
  );
  assert.equal(
    sampleModel('references', consumer.state).copies,
    1,
    'the consumer request precedes the constructed second copy',
  );
  const consumerAudit = paint(consumer);
  assert(
    targetContainsLabel(consumerAudit, 'references-consumer-node-b', 'Consumer worker · Node B'),
  );
  assert(
    consumerAudit.labels.some((label) => label.text === 'Node B · object store · awaiting value'),
  );

  const copied = await measuredCue(
    'references',
    'Our constructed trace adds a second stored copy while preserving the original owner',
  );
  assert.deepEqual(copied.cue.targets, [
    'references-owner-metadata',
    'references-node-a-copy',
    'references-copy-transfer',
    'references-node-b-copy',
    'references-copy-total',
  ]);
  assert.equal(sampleModel('references', copied.state).copies, 2);
  const copiedAudit = paint(copied);
  assert(
    targetContainsLabel(copiedAudit, 'references-node-a-copy', 'Node A · object store · 64 bytes'),
  );
  assert(
    targetContainsLabel(copiedAudit, 'references-node-b-copy', 'Node B · object store · 64 bytes'),
  );
  assert(
    targetContainsLabel(copiedAudit, 'references-copy-total', 'Stored-copy payload: 128 bytes'),
  );

  const liveOwner = await measuredCue(
    'references',
    'Reconstructing all lost copies of a task result requires live ownership information',
  );
  assert.equal(sampleModel('references', liveOwner.state).ownerLost, false);
  const liveOwnerAudit = paint(liveOwner);
  assert(liveOwnerAudit.labels.some((label) => label.text === 'Driver · owner metadata'));

  const lost = await measuredCue(
    'references',
    "Surviving bytes alone also cannot restore a lost owner's metadata contract",
  );
  const lostModel = sampleModel('references', lost.state);
  assert.equal(lostModel.lost, true);
  assert.equal(lostModel.copies, 1);
  assert.equal(lostModel.ownerLost, true);
  const lostAudit = paint(lost);
  assert(lostAudit.labels.some((label) => label.text === 'Node A · copy lost'));
  assert(lostAudit.labels.some((label) => label.text === 'Node B · object store · 64 bytes'));
  assert(lostAudit.labels.some((label) => label.text === 'Driver · owner process lost'));
  assert(lostAudit.labels.some((label) => label.text === 'ObjectRef A · metadata unavailable'));
  for (const audit of [producerAudit, consumerAudit, copiedAudit, liveOwnerAudit, lostAudit])
    assert.deepEqual(audit.issues, []);
});

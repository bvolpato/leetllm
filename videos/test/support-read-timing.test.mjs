import test from 'node:test';
import assert from 'node:assert/strict';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sampleModel } from '../animations/design-conversational-ai-support-bot.mjs';
import { frameState, readLesson } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function timeoutModelAt(progress, recap = false) {
  const lesson = await readLesson(
    path.join(root, 'videos/lessons/design-conversational-ai-support-bot.lesson.yaml'),
    root,
  );
  const authoredScene = lesson.scenes.find((scene) => scene.id === 'parallel');
  const timeline = await loadMeasuredTimeline('design-conversational-ai-support-bot');
  const measuredScene = timeline.scenes.find((scene) => scene.id === 'parallel');
  const timing = {
    ...measuredScene,
    visualCues: resolveSceneCues(authoredScene, measuredScene),
    cueTiming: 'provider-words',
  };
  const timeoutCue = timing.visualCues.find((cue) => cue.id === 'read-timeout');
  const sampleTime = recap
    ? timeoutCue.end + 3
    : timeoutCue.start + progress * (timeoutCue.end - timeoutCue.start);
  return sampleModel('parallel', frameState(timing, sampleTime, 4, lesson.scenes.length));
}

test('the invoice timeout holds the join at the measured timeout cue and keeps the failed trace read-only', async () => {
  const approach = await timeoutModelAt(0);
  assert.equal(approach.duration, 3);
  assert.equal(approach.time, 2);
  assert.deepEqual(
    approach.completed.map((interval) => interval.id),
    ['policy'],
  );

  const timedOut = await timeoutModelAt(0.5);
  assert.equal(timedOut.time, 3);
  assert.equal(timedOut.timedOut, true);
  assert.equal(timedOut.ready, false);
  assert.equal(timedOut.receiptInvoice.success, false);
  assert.deepEqual(
    timedOut.schedule.map((interval) => interval.lane),
    ['policy', 'invoice'],
  );
  assert.deepEqual(
    timedOut.completed.map((interval) => interval.id),
    ['policy'],
  );

  const recap = await timeoutModelAt(1, true);
  assert.equal(recap.time, 3);
  assert.equal(recap.timedOut, true);
  assert.equal(recap.ready, false);
  assert.deepEqual(
    recap.schedule.map((interval) => interval.id),
    ['policy', 'invoice'],
  );
});

import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { draw as drawHumanApproval, reviewExercise } from '../animations/human-approval.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { frameState, readLesson } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

registerLessonFonts();

async function measuredTransfer() {
  const lesson = await readLesson(
    path.join(root, 'videos/lessons/human-approval.lesson.yaml'),
    root,
  );
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'transfer');
  const scene = lesson.scenes[sceneIndex];
  const timeline = await loadMeasuredTimeline('human-approval');
  const measured = timeline.scenes.find((row) => row.id === 'transfer');
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
  const paint = (id, progress = 0.5) => {
    const value = cue(id);
    const state = frameState(
      timing,
      value.start + (value.end - value.start) * progress,
      sceneIndex,
      lesson.scenes.length,
    );
    return drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      lesson,
      scene,
      state,
      drawHumanApproval,
    );
  };
  return { lesson, scene, cue, paint };
}

test('the measured queue and reviewer clauses show P1 arithmetic before the aggregate measures', async () => {
  const { scene, cue, paint } = await measuredTransfer();
  const exercise = reviewExercise();
  const p1 = exercise.rows[0];
  assert.equal(p1.started - p1.submitted, 4);
  assert.equal(p1.decided - p1.started, 6);

  const queue = paint('transfer-b1-1');
  const queueLabels = queue.labels.filter((label) => label.alpha > 0.8).map((label) => label.text);
  assert(
    queueLabels.includes(`P1: ${p1.started}s − ${p1.submitted}s = ${p1.started - p1.submitted}s`),
  );
  assert(
    queue.targets.some((target) => target.id === 'p1-queue-cells' && target.alpha > 0.8),
    'the P1 submitted and start cells must be focused with the example formula',
  );
  assert(
    !queueLabels.includes(
      `${exercise.waitSum} / ${exercise.reviewed.length} = ${exercise.waitMean.toFixed(1)}s`,
    ),
    'the aggregate must wait until the narration pairs the measures',
  );

  const response = paint('reviewer-response');
  const responseLabels = response.labels
    .filter((label) => label.alpha > 0.8)
    .map((label) => label.text);
  assert(
    responseLabels.includes(`P1: ${p1.decided}s − ${p1.started}s = ${p1.decided - p1.started}s`),
  );
  assert(
    response.targets.some((target) => target.id === 'p1-review-cells' && target.alpha > 0.8),
    'the P1 start and decision cells must be focused with the response formula',
  );
  assert(
    !responseLabels.includes(
      `${exercise.responseSum} / ${exercise.decisions.length} = ${exercise.responseMean.toFixed(1)}s`,
    ),
  );

  const aggregate = paint('approval-rate');
  const aggregateLabels = aggregate.labels
    .filter((label) => label.alpha > 0.8)
    .map((label) => label.text);
  assert(
    aggregateLabels.includes(
      `${exercise.waitSum} / ${exercise.reviewed.length} = ${exercise.waitMean.toFixed(1)}s`,
    ),
  );
  assert(
    aggregateLabels.includes(
      `${exercise.responseSum} / ${exercise.decisions.length} = ${exercise.responseMean.toFixed(1)}s`,
    ),
  );
  assert(!aggregateLabels.some((text) => text.startsWith('P1:')));
  assert.equal(scene.beats[0].hold, 0.55);
  assert(cue('transfer-b1-1').end > cue('transfer-b1-1').start);
});

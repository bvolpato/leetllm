import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import {
  draw as drawOrchestration,
  RECEIPTS,
  validateModel,
} from '../animations/agent-orchestration.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { frameState, readLesson } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

registerLessonFonts();

async function measuredTypedReceipts() {
  const lesson = await readLesson(
    path.join(root, 'videos/lessons/agent-orchestration.lesson.yaml'),
    root,
  );
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'typed-receipts');
  const scene = lesson.scenes[sceneIndex];
  const timeline = await loadMeasuredTimeline('agent-orchestration');
  const measured = timeline.scenes.find((row) => row.id === 'typed-receipts');
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
  const paintTime = (time) => {
    const state = frameState(timing, time, sceneIndex, lesson.scenes.length);
    const audit = drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      lesson,
      scene,
      state,
      drawOrchestration,
    );
    assert.deepEqual(layoutIssues(audit), [], `typed-receipts layout at scene time ${time}`);
    return audit;
  };
  const paint = (id, progress = 0.5) => {
    const value = cue(id);
    return paintTime(value.start + (value.end - value.start) * progress);
  };
  return { lesson, scene, cue, paint, paintTime };
}

test('the scalar-conflict clause shows two writes converging before distinct branch-owned receipts resolve them', async () => {
  const { scene, cue, paint, paintTime } = await measuredTypedReceipts();
  validateModel();
  assert.equal(scene.beats[2].hold, 0.55);

  const beforeConflict = paintTime(cue('scalar-conflict').start - 0.05);
  assert(
    !beforeConflict.labels.some(
      (label) => label.text === 'Eval update · 2/100 failures' && label.alpha > 0.8,
    ),
  );
  const concurrentUpdates = paint('branch-ownership');
  assert(
    concurrentUpdates.labels.some(
      (label) => label.text === '3/3 branch-owned receipts admitted' && label.alpha > 0.25,
    ),
  );
  assert(
    !concurrentUpdates.labels.some(
      (label) => label.text === 'One shared scalar slot' && label.alpha > 0.8,
    ),
  );

  const early = paint('scalar-conflict', 0.35);
  const earlyLabels = early.labels.filter((label) => label.alpha > 0.8).map((label) => label.text);
  assert(earlyLabels.includes('Eval update · 2/100 failures'));
  assert(!earlyLabels.includes('Health update · 4/10000 errors'));

  const collision = paint('scalar-conflict', 0.9);
  const collisionLabels = collision.labels
    .filter((label) => label.alpha > 0.8)
    .map((label) => label.text);
  assert(collisionLabels.includes('Eval update · 2/100 failures'));
  assert(collisionLabels.includes('Health update · 4/10000 errors'));
  assert(collisionLabels.includes('One shared scalar slot'));
  assert(collisionLabels.includes('Potential conflict'));
  assert(!collisionLabels.includes('Duplicate branch updates fail the unique-owner contract'));
  assert(
    collision.targets.some(
      (target) => target.id === 'scalar-write-collision' && target.alpha > 0.8,
    ),
  );

  const resolved = paint('unique-owners');
  const resolvedLabels = resolved.labels
    .filter((label) => label.alpha > 0.8)
    .map((label) => label.text);
  assert(resolvedLabels.includes('Eval worker · 2/100 failures'));
  assert(resolvedLabels.includes('Health worker · 4/10000 errors'));
  assert(resolvedLabels.includes('Policy worker · max traffic 25%'));
  assert(resolvedLabels.includes('Eval-owned receipt'));
  assert(resolvedLabels.includes('Health-owned receipt'));
  assert(resolvedLabels.includes('Policy-owned receipt'));
  assert(resolvedLabels.includes('Duplicate branch updates fail the unique-owner contract'));
  assert(!resolvedLabels.includes('One shared scalar slot'));
  assert.equal(RECEIPTS.length, 3);

  const held = paint('unique-owners', 1);
  assert(
    held.labels.some(
      (label) =>
        label.text === 'Duplicate branch updates fail the unique-owner contract' &&
        label.alpha > 0.8,
    ),
  );
  assert(cue('scalar-conflict').end < cue('unique-owners').start);
});

import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { draw as drawModelRouting } from '../animations/model-routing.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { frameState, readLesson } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function measuredClause() {
  const lesson = await readLesson(
    path.join(root, 'videos/lessons/model-routing.lesson.yaml'),
    root,
  );
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'filter');
  assert.notEqual(sceneIndex, -1);
  const timeline = await loadMeasuredTimeline('model-routing');
  const measured = timeline.scenes.find((scene) => scene.id === 'filter');
  const scene = lesson.scenes[sceneIndex];
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const cue = timing.visualCues.find((item) => item.phrase === 'no lane survives');
  assert(cue, 'the measured “no lane survives” phrase must resolve');
  const state = frameState(
    timing,
    cue.start + (cue.end - cue.start) / 2,
    sceneIndex,
    lesson.scenes.length,
  );
  return { lesson, scene, cue, state };
}

test('the measured no-survivor clause shows completed rejections and escalation', async () => {
  const { lesson, scene, cue, state } = await measuredClause();
  assert(cue.targets.includes('filter-outcome'));
  const canvas = createCanvas(1920, 1080);
  const audit = drawFrame(canvas.getContext('2d'), lesson, scene, state, drawModelRouting);
  const labels = audit.labels.filter((label) => label.alpha > 0.8).map((label) => label.text);
  const checkResults = labels.filter((label) => ['pass', 'FAIL', '?'].includes(label));

  assert(labels.includes('R900 · required context 70,000 · full contract applies'));
  assert(labels.includes('No feasible lane → escalate without generation'));
  assert.equal(checkResults.length, 36, 'all six checks for all six lanes must be visible');
  assert(!checkResults.includes('?'), 'every displayed lane check must have completed');
  for (const lane of ['C', 'D', 'E']) {
    assert(
      labels.includes(`${lane} · rejected`),
      `${lane} must be rejected during the no-survivor phrase`,
    );
    assert(
      !labels.includes(`${lane} · pending`),
      `${lane} cannot remain pending during the no-survivor phrase`,
    );
  }
});

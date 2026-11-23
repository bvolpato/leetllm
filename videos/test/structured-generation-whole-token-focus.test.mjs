import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { draw as drawStructuredGeneration } from '../animations/structured-generation.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { frameState, readLesson } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function measuredCue(id) {
  const lesson = await readLesson(
    path.join(root, 'videos/lessons/structured-generation.lesson.yaml'),
    root,
  );
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'whole-token');
  assert.notEqual(sceneIndex, -1);
  const timeline = await loadMeasuredTimeline('structured-generation');
  const measured = timeline.scenes.find((scene) => scene.id === 'whole-token');
  const scene = lesson.scenes[sceneIndex];
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const cue = timing.visualCues.find((item) => item.id === id);
  assert(cue, `measured cue ${id} must resolve`);
  const state = frameState(
    timing,
    cue.start + (cue.end - cue.start) / 2,
    sceneIndex,
    lesson.scenes.length,
  );
  return { lesson, scene, state, cue };
}

function paint(lesson, scene, state) {
  const canvas = createCanvas(1920, 1080);
  return drawFrame(canvas.getContext('2d'), lesson, scene, state, drawStructuredGeneration);
}

test('the completion phrase focuses its accepted token row while retaining prefix context', async () => {
  const { lesson, scene, state, cue } = await measuredCue('whole-token-b2-1');
  assert.deepEqual(cue.targets, ['candidate-accepted']);
  const audit = paint(lesson, scene, state);
  const candidate = audit.targets.find((part) => part.id === 'candidate-accepted');
  const prefix = audit.targets.find((part) => part.id === 'candidate-characters');
  assert(candidate && candidate.alpha > 0.9 && candidate.marks >= 4);
  assert(
    prefix && prefix.alpha > 0.25 && prefix.alpha < 0.9,
    'the accepted prefix stays readable as context',
  );
  assert(
    audit.labels.some(
      (label) => label.text === 'Candidate closing the object' && label.alpha > 0.9,
    ),
  );
  assert(
    audit.labels.some((label) => label.text.includes('characters checked') && label.alpha > 0.9),
  );
  assert(
    audit.labels.some((label) => label.text.startsWith('Accepted prefix:') && label.alpha > 0.25),
  );
});

test('the exclamation-mark phrase focuses the rejected candidate row', async () => {
  const { lesson, scene, state, cue } = await measuredCue('whole-token-b2-2');
  assert.deepEqual(cue.targets, ['candidate-rejected', 'character-cursor']);
  const audit = paint(lesson, scene, state);
  const rejected = audit.targets.find((part) => part.id === 'candidate-rejected');
  const prefix = audit.targets.find((part) => part.id === 'candidate-characters');
  assert(rejected && rejected.alpha > 0.9 && rejected.marks >= 4);
  assert(
    prefix && prefix.alpha > 0.25 && prefix.alpha < 0.9,
    'the accepted prefix stays readable as context',
  );
  assert(
    audit.labels.some(
      (label) => label.text === 'Candidate with trailing punctuation' && label.alpha > 0.9,
    ),
  );
});

test('the whole-token clause focuses both candidates and their actual verdicts', async () => {
  const { lesson, scene, state, cue } = await measuredCue('whole-token-b3-1');
  assert.deepEqual(cue.targets, ['candidate-accepted', 'candidate-rejected']);
  const audit = paint(lesson, scene, state);
  for (const id of ['candidate-accepted', 'candidate-rejected']) {
    const candidate = audit.targets.find((part) => part.id === id);
    assert(
      candidate && candidate.alpha > 0.9 && candidate.marks >= 4,
      `${id} must include the token and its receipt`,
    );
  }
  const prefix = audit.targets.find((part) => part.id === 'candidate-characters');
  assert(
    prefix && prefix.alpha > 0.25 && prefix.alpha < 0.9,
    'the accepted prefix remains readable as context',
  );
  const labels = audit.labels.filter((label) => label.alpha > 0.9).map((label) => label.text);
  assert(labels.includes('Accepted token receipt'));
  assert(labels.includes('Rejected candidate receipt'));
  assert(labels.includes('Whole token accepted'));
  assert(labels.includes('Whole token rejected'));
});

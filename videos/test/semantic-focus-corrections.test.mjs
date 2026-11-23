import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { draw as drawMixture } from '../animations/expectation-maximization.mjs';
import { draw as drawTraining, modelSnapshot } from '../animations/training-loop.mjs';

async function paintClause(id, sceneId, phrase, draw) {
  const root = new URL('../../', import.meta.url).pathname;
  const lesson = await readLesson(root + `videos/lessons/${id}.lesson.yaml`, root);
  const scene = lesson.scenes.find((item) => item.id === sceneId);
  const sounds = scene.beats.map((beat, beatIndex) => ({
    beatIndex,
    words: beat.say.split(/\s+/).map((text, i) => ({ text, start: i * 0.32, end: (i + 1) * 0.32 })),
  }));
  const timing = makeSceneTimeline(
    scene,
    sounds.map((sound) => sound.words.at(-1).end),
  );
  timing.sounds = sounds;
  timing.visualCues = resolveSceneCues(scene, timing);
  timing.cueTiming = 'provider-words';
  const cue = timing.visualCues.find((item) => item.phrase.includes(phrase));
  assert(cue, `A measured cue must cover ${phrase}`);
  const canvas = createCanvas(1920, 1080);
  return drawFrame(
    canvas.getContext('2d'),
    lesson,
    scene,
    frameState(timing, (cue.start + cue.end) / 2, 0, 1),
    draw,
  );
}

test('the neural encoder clause emphasizes the learned posterior node', async () => {
  const audit = await paintClause(
    'expectation-maximization',
    'vae',
    'uses a neural encoder',
    drawMixture,
  );
  const activeText = audit.labels
    .filter((label) => label.alpha > 0.7)
    .map((label) => label.text)
    .join(' ');
  assert(activeText.includes('Learned encoder posterior'), activeText);
});

test('the joint training clause emphasizes the ELBO gradient update', async () => {
  const audit = await paintClause(
    'expectation-maximization',
    'vae',
    'encoder and decoder usually train together',
    drawMixture,
  );
  const activeText = audit.labels
    .filter((label) => label.alpha > 0.7)
    .map((label) => label.text)
    .join(' ');
  assert(activeText.includes('Joint ELBO gradients'), activeText);
});

test('backward emphasizes the stored numerical gradient', async () => {
  const audit = await paintClause(
    'training-loop',
    'phases',
    'Calling backward writes',
    drawTraining,
  );
  const gradient = audit.labels.filter(
    (label) => label.x >= 1130 && label.x < 1437 && label.y >= 465 && label.y < 772,
  );
  assert.deepEqual(
    gradient.map((label) => Number(label.text)),
    [0.5, 0.5, -0.5, -0.5],
  );
  assert(
    gradient.every((label) => label.alpha > 0.7),
    'the stored gradient must be emphasized',
  );
});

test('the probability comparison emphasizes the actual batch mean', async () => {
  const audit = await paintClause(
    'training-loop',
    'scores',
    'The bars show both rows',
    drawTraining,
  );
  assert(audit.labels.some((label) => label.alpha > 0.7 && label.text.includes('\\overline{L}')));
});

test('saving a copied checkpoint emphasizes the independent storage', async () => {
  const audit = await paintClause(
    'training-loop',
    'validation',
    'Copy the state dictionary',
    drawTraining,
  );
  assert(audit.labels.some((label) => label.alpha > 0.7 && label.text === 'Copied checkpoint'));
});

test('both execution modes are readable while their distinction is explained', async () => {
  const audit = await paintClause(
    'training-loop',
    'validation',
    'Training mode and evaluation mode',
    drawTraining,
  );
  for (const text of ['Training · model.train()', 'Validation · model.eval()']) {
    assert(
      audit.labels.some((label) => label.alpha > 0.7 && label.text === text),
      text,
    );
  }
});

test('the optimizer applies its numerical update during the subtraction clause', () => {
  const state = (progress) =>
    modelSnapshot('phases', {
      beat: 2,
      beatP: 0.01,
      cues: { 'phases-beat-3-focus-1': { phase: progress === 1 ? 'after' : 'during', progress } },
    });
  assert.deepEqual(state(0).weights, [
    [0, 0],
    [0, 0],
  ]);
  assert.deepEqual(state(0.5).weights, [
    [-0.05, -0.05],
    [0.05, 0.05],
  ]);
  assert.deepEqual(state(1).weights, [
    [-0.1, -0.1],
    [0.1, 0.1],
  ]);
});

import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  tailOmission,
  syntheticRelease,
  cosineSimilarity,
  draw as drawSyntheticData,
} from '../animations/synthetic-data.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { frameState, readLesson } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function measuredCue() {
  const lesson = await readLesson(
    path.join(root, 'videos/lessons/synthetic-data.lesson.yaml'),
    root,
  );
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'diversity');
  assert.notEqual(sceneIndex, -1);
  const fixture = JSON.parse(
    await readFile(
      new URL('./fixtures/measured-narration/synthetic-data.json', import.meta.url),
      'utf8',
    ),
  );
  const measured = fixture.scenes.find((scene) => scene.id === 'diversity');
  const scene = lesson.scenes[sceneIndex];
  // This regression uses only the unchanged second beat. The expanded first beat needs new production audio.
  assert.equal(measured.beats[1].say, scene.beats[1].say);
  const scopedScene = {
    ...scene,
    beats: scene.beats.map((beat, index) => ({
      ...beat,
      visual_cues: index === 1 ? beat.visual_cues : [],
    })),
  };
  const sounds = measured.sounds.map((sound) => ({
    ...sound,
    words: sound.words.map(([text, start, end]) => ({ text, start, end })),
  }));
  const timing = {
    ...measured,
    sounds,
    visualCues: resolveSceneCues(scopedScene, { ...measured, sounds }),
    cueTiming: 'provider-words',
  };
  const cue = timing.visualCues.find((item) => item.id === 'diversity-b2-1');
  assert(cue, 'measured near-overlap phrase must resolve');
  return { lesson, scene, sceneIndex, timing, cue };
}

function paint(lesson, scene, state) {
  const canvas = createCanvas(1920, 1080);
  return drawFrame(canvas.getContext('2d'), lesson, scene, state, drawSyntheticData);
}

function center(audit, id) {
  const parts = audit.targets.filter((part) => part.id === id && part.alpha > 0.9);
  assert.equal(parts.length, 1, `${id} should have one visible geometry target`);
  const part = parts[0];
  return { x: part.x + part.width / 2, y: part.y + part.height / 2 };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

test('the near-duplicate point reaches the seed during its measured clause and stays there afterward', async () => {
  const { lesson, scene, sceneIndex, timing, cue } = await measuredCue();
  assert.deepEqual(cue.targets, ['seed-point', 'candidate-point']);
  const at = (seconds) =>
    paint(lesson, scene, frameState(timing, seconds, sceneIndex, lesson.scenes.length));
  const before = at(cue.start - 0.05);
  const seed = center(before, 'seed-point');
  const start = center(before, 'candidate-point');
  assert(distance(start, seed) > 500, 'the new candidate begins outside the seed neighborhood');

  const midpoint = cue.start + (cue.end - cue.start) / 2;
  const during = at(midpoint);
  const duringSeed = center(during, 'seed-point');
  const duringPoint = center(during, 'candidate-point');
  assert(
    distance(duringPoint, duringSeed) < 250,
    'the point must visibly approach the seed during “nearly overlaps”',
  );

  const late = at(cue.end - 0.04);
  const lateSeed = center(late, 'seed-point');
  const latePoint = center(late, 'candidate-point');
  assert(
    distance(latePoint, lateSeed) < 30,
    'the candidate must reach the near-duplicate location by the clause end',
  );

  const heldState = frameState(timing, cue.end + 0.2, sceneIndex, lesson.scenes.length);
  assert.equal(heldState.beat, 1);
  const held = paint(lesson, scene, heldState);
  const heldSeed = center(held, 'seed-point');
  const heldPoint = center(held, 'candidate-point');
  assert(
    distance(heldPoint, heldSeed) < 30,
    'the completed near position must persist after the cue',
  );
});

test('tail omission handles event boundaries and a new finite-sample transfer', () => {
  assert.equal(tailOmission(0, 8), 1);
  assert.equal(tailOmission(1, 8), 0);
  assert.equal(tailOmission(0.1, 0), 1);
  assert(Math.abs(tailOmission(0.1, 5) - 0.59049) < 1e-12);
  assert.throws(() => tailOmission(0.1, -1));
});
test('dataset release enforces each slice and rejects invalid rates', () => {
  assert.equal(
    syntheticRelease(
      { common: 0.91, rare: 0.8, unsafe: 0.015 },
      { common: 0.88, rare: 0.83, unsafe: 0.02 },
    ).release,
    false,
  );
  assert.equal(syntheticRelease({ common: 0.92, rare: 0.85, unsafe: 0.005 }).release, true);
  assert.throws(() => syntheticRelease({ common: 0.92, rare: 0.85, unsafe: -0.1 }));
});
test('cosine rejects nonfinite and zero vectors before normalization', () => {
  assert.throws(() => cosineSimilarity([NaN, 0], [1, 0]), RangeError);
  assert.throws(() => cosineSimilarity([0, 0], [1, 0]), RangeError);
  assert.equal(cosineSimilarity([0, 1], [3, 4]), 0.8);
});

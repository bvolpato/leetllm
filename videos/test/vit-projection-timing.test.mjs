import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { projectionSnapshot, draw } from '../animations/vision-transformers.mjs';
import { makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { compareMotionRegion } from '../lib/motion-audit.mjs';

const cueID = 'projection-patch-column-products-b2-1';
const say =
  'Watch the contributions accumulate before the answer appears. The same projection runs at every patch location. Sharing it gives a consistent meaning to each output coordinate.';
const words = say
  .split(/\s+/)
  .map((text, index) => ({ text, start: index * 0.28, end: (index + 1) * 0.28 }));
const scene = {
  id: 'projection',
  title: 'The same matrix reads every patch',
  beats: [
    { say: 'Inspect the shared projection.', hold: 0.6 },
    {
      say,
      hold: 0.65,
      visual_cues: [
        { id: cueID, phrase: 'contributions accumulate', targets: ['patch-column-products'] },
      ],
    },
    { say: 'Retain the completed projection.', hold: 0.7 },
  ],
};
const timing = makeSceneTimeline(scene, [2, words.at(-1).end, 2]);
timing.sounds = [{ beatIndex: 1, words }];
timing.visualCues = resolveSceneCues(scene, timing);
timing.cueTiming = 'provider-words';
const cue = timing.visualCues[0];
const atProgress = (progress) =>
  frameState(timing, cue.start + progress * (cue.end - cue.start), 0, 1);

test('provider-word cue progress advances all four contributions and their partial sum', () => {
  const expected = [
    [0, 0],
    [0, 0],
    [0.25, 0.5],
    [1.25, -1.5],
    [2.5, 1],
  ];
  for (let count = 0; count <= 4; count++) {
    const state = atProgress(count / 4),
      result = projectionSnapshot(state.beat, state.beatP, state.cues);
    assert.equal(result.count, count, `Measured cue quarter ${count}/4`);
    assert.deepEqual(result.partial, expected[count]);
  }
});

test('completed contributions persist through later explanation and the next paragraph', () => {
  const completed = { [cueID]: { progress: 1, phase: 'after', strength: 0 } };
  for (const beatP of [0.01, 0.5, 0.99])
    assert.deepEqual(projectionSnapshot(1, beatP, completed).partial, [2.5, 1]);
  assert.deepEqual(projectionSnapshot(2, 0).partial, [2.5, 1]);
  assert.equal(projectionSnapshot(0, 0.99, completed).count, 0);
  assert.equal(projectionSnapshot(1, 0.99, { [cueID]: { progress: 0, phase: 'before' } }).count, 0);
});

function render(progress) {
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d'),
    raw = atProgress(progress);
  const state = {
    ...raw,
    opacity: 1,
    cues: Object.fromEntries(
      Object.entries(raw.cues).map(([id, cue]) => [id, { ...cue, strength: 0 }]),
    ),
  };
  drawFrame(ctx, {}, scene, state, draw);
  const rgba = ctx.getImageData(0, 0, 1920, 1080).data,
    data = new Uint8Array(1920 * 1080 * 3);
  for (let pixel = 0; pixel < 1920 * 1080; pixel++)
    for (let channel = 0; channel < 3; channel++)
      data[pixel * 3 + channel] = rgba[pixel * 4 + channel];
  return { width: 1920, height: 1080, data };
}

test('the measured phrase changes painted contribution products with focus decoration disabled', () => {
  const change = compareMotionRegion(render(0.01), render(0.99), {
    region: [1280, 340, 250, 430],
    minimumChangedFraction: 0.002,
  });
  assert.equal(change.passed, true);
});

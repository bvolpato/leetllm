import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import {
  draw,
  IMAGE_FEATURES,
  TEXT_FEATURES,
  IMAGE_NAMES,
} from '../animations/vision-language-clip.mjs';
import { drawFrame } from '../lib/scene.mjs';

const cue = (phase, progress = phase === 'after' ? 1 : 0) => ({ phase, progress, strength: 0 });
const paint = (beat, image, text, beatP = 0.01) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id: 'towers', title: 'Two encoders make compatible vectors' },
    {
      beat,
      beatP,
      t: 1,
      opacity: 1,
      duration: 60,
      cues: {
        'towers-beat-1-focus-1': image,
        'towers-text-encoding': text,
      },
    },
    draw,
  );
const visible = (frame, name) =>
  frame.labels.some((label) => label.text.includes(name) && label.alpha >= 0.99);

test('each spoken encoding clause produces its actual vector during the first paragraph', () => {
  const image = paint(0, cue('after'), cue('before'));
  assert(visible(image, 'Image encoder'));
  assert(visible(image, '[0.95, 0.05, 0.00]'));
  assert(!visible(image, 'Text encoder'));
  const both = paint(0, cue('after'), cue('after'));
  assert(visible(both, 'Text encoder'));
  assert(visible(both, '[0.91, 0.08, 0.01]'));
});

test('completed towers persist through pair identity and storage explanations', () => {
  for (const beat of [1, 2])
    for (const beatP of [0.01, 0.5, 0.99]) {
      const frame = paint(beat, cue('after'), cue('after'), beatP);
      for (const name of [
        'Image encoder',
        'Text encoder',
        '[0.95, 0.05, 0.00]',
        '[0.91, 0.08, 0.01]',
      ]) {
        assert(visible(frame, name));
      }
    }
});

test('the opening sentence scores image candidates in the same direction as retrieval', () => {
  const normalize = (vector) => vector.map((value) => value / Math.hypot(...vector));
  const query = normalize(TEXT_FEATURES[0]);
  const expected = IMAGE_FEATURES.map(normalize).map((image) =>
    image.reduce((sum, value, index) => sum + value * query[index], 0).toFixed(3),
  );
  const scores = (sceneId) =>
    drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      {},
      { id: sceneId, title: 'Sentence-to-image search' },
      { beat: 2, beatP: 0.5, t: 1, opacity: 1, duration: 60 },
      draw,
    )
      .labels.filter((label) =>
        sceneId === 'opening'
          ? label.text.startsWith('constructed cosine ')
          : IMAGE_NAMES.some((name) => label.text.startsWith(name + ': ')),
      )
      .map((label) => label.text.split(' ').at(-1));
  assert.deepEqual(expected, ['0.999', '0.142', '0.017']);
  assert.deepEqual(scores('opening'), expected);
  assert.deepEqual(scores('retrieval'), expected);
});

test('a repaired three-token reduction persists through the metrics beat', () => {
  const paintReduction = (beat, beatP) =>
    drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      {},
      { id: 'adaptive-reduction', title: 'A hard cap and an evidence floor must both hold' },
      {
        beat,
        beatP,
        t: 1,
        opacity: 1,
        duration: 95,
        cues: {
          'reducer-repair': cue('after'),
          'reducer-metrics': cue(beatP > 0.7 ? 'after' : 'during', beatP),
        },
      },
      draw,
    );
  const repaired = paintReduction(2, 0.99),
    decoration = repaired.labels.find((x) => x.text === 'decoration');
  assert(decoration.y > 700);
  for (const p of [0.01, 0.5, 0.99]) {
    const metrics = paintReduction(3, p),
      discarded = metrics.labels.find((x) => x.text === 'decoration');
    assert.equal(discarded.y, decoration.y, 'discarded decoration cannot rejoin the retained row');
    for (const name of ['vent', 'tag', 'layout'])
      assert.equal(
        metrics.labels.find((x) => x.text === name).y,
        repaired.labels.find((x) => x.text === name).y,
      );
  }
});

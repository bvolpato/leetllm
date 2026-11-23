import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import * as decoding from '../animations/decoding.mjs';
import { drawFrame } from '../lib/scene.mjs';

const cue = (phase = 'after', progress = 1) => ({ phase, progress, strength: 0 });
const state = (phase, progress, beatP) => ({
  beat: 2,
  beatP,
  t: 1,
  opacity: 1,
  duration: 60,
  cues: {
    'tree-b3-1': cue(),
    'tree-branch-spread': cue(),
    'tree-final-path-product': cue(phase, progress),
  },
});
const paint = (s) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id: 'tree', title: 'Conditional path products' },
    s,
    decoding.draw,
  );

test('the spoken twenty-one-percent conclusion completes and holds the actual conditional/product pair', () => {
  for (const beatP of [0.55, 0.7, 0.99]) {
    const frame = paint(state('after', 1, beatP));
    assert(frame.labels.some((label) => label.text === 'home · 0.35'));
    assert(frame.labels.some((label) => label.text === 'outside · 0.35'));
    assert.equal(frame.labels.filter((label) => label.text === '0.210').length, 2);
  }
});

test('measured branch stages conserve probability mass and recompute each complete path', () => {
  let previous = 0;
  for (const id of ['tree-b3-1', 'tree-branch-spread', 'tree-final-path-product']) {
    for (let i = 0; i <= 100; i++) {
      const cues = Object.fromEntries(
        ['tree-b3-1', 'tree-branch-spread', 'tree-final-path-product'].map((name) => [
          name,
          name === id
            ? cue('during', i / 100)
            : cue(name < id ? 'after' : 'before', name < id ? 1 : 0),
        ]),
      );
      if (id === 'tree-branch-spread') cues['tree-b3-1'] = cue();
      if (id === 'tree-final-path-product') {
        cues['tree-b3-1'] = cue();
        cues['tree-branch-spread'] = cue();
      }
      const result = decoding.treeDistribution({ beat: 2, beatP: 0.99, cues });
      assert(result.blend >= previous - 1e-12);
      previous = result.blend;
      assert(Math.abs(result.conditionals.slice(0, 3).reduce((a, b) => a + b, 0) - 1) < 1e-12);
      assert.deepEqual(result.prefixes, [0.6, 0.4]);
      assert.equal(result.products[1], 0.6 * result.conditionals[1]);
      assert.equal(result.products[2], 0.6 * result.conditionals[2]);
    }
  }
});

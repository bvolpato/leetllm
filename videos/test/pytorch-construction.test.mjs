import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { draw } from '../animations/deep-dive-pytorch.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { readLesson } from '../lib/lesson.mjs';

registerLessonFonts();
const root = new URL('../../', import.meta.url).pathname;
const lesson = await readLesson(root + 'videos/lessons/deep-dive-pytorch.lesson.yaml', root);
const canvas = createCanvas(1920, 1080);
function paint(id, beat, seconds, span) {
  const scene = lesson.scenes.find((row) => row.id === id);
  return drawFrame(
    canvas.getContext('2d'),
    lesson,
    scene,
    { t: seconds, duration: 70, opacity: 1, beat, beatP: seconds / span },
    draw,
  );
}
const labels = (...args) => paint(...args).labels.map((row) => row.text);

test('attention computes its scaled scores, probabilities and output in spoken order', () => {
  const early = labels('attention', 0, 1, 19.032);
  assert(!early.some((text) => text.includes('0.6698')), 'probabilities must wait for softmax');
  assert(
    !early.some((text) => text.includes('6.698')),
    'the final weighted output must wait for its inputs',
  );
  const completed = labels('attention', 0, 16, 19.032);
  assert(completed.some((text) => text.includes('0.6698')));
  assert(completed.some((text) => text.includes('6.698')));
});

test('mask removal waits for the narrated intervention and the cached-position recap persists', () => {
  const before = labels('attention', 1, 1, 20.76);
  assert(
    before.some((text) => text.includes('0.6698')),
    'retain the unmasked computation before changing it',
  );
  const masked = labels('attention', 1, 13, 20.76);
  assert(masked.some((text) => text.includes('1.0000')));
  const recap = labels('attention', 2, 20, 21.216);
  assert(recap.some((text) => text.includes('0.6698')));
});

test('checkpoint fields precede the resumed outputs and weights-only divergence', () => {
  const early = labels('recovery', 0, 1, 18.768);
  assert(
    !early.some((text) => text.includes('0.987337')),
    'next-step output must not precede the checkpoint',
  );
  assert(
    !early.some((text) => text.startsWith('Next w =')),
    'all resumed branch outputs must wait for the checkpoint',
  );
  const checkpoint = labels('recovery', 0, 12, 18.768);
  assert(checkpoint.some((text) => text.includes('0.990000')));
  const restored = labels('recovery', 1, 3, 20.016);
  assert(restored.some((text) => text.includes('0.987337')));
  assert(!restored.includes('Next w = 1.000000'));
  assert(!restored.includes('Weights only'), 'the divergence marker must wait for its comparison');
  const compared = paint('recovery', 1, 12, 20.016);
  const branchLabels = (left, right) =>
    compared.labels
      .filter(
        (label) =>
          label.x >= left &&
          label.x < right &&
          label.y >= 650 &&
          label.y < 880 &&
          label.alpha > 0.9,
      )
      .map((label) => label.text);
  for (const [left, right] of [
    [120, 630],
    [705, 1215],
  ]) {
    const branch = branchLabels(left, right);
    assert(
      branch.includes('Next w = 0.987337'),
      'complete restoration must match the uninterrupted update',
    );
    assert(branch.includes('m 0.020000 · v 0.000312'));
    assert(branch.includes('Optimizer step 2'));
  }
  const weightsOnly = branchLabels(1290, 1800);
  assert(
    weightsOnly.includes('Next w = 1.000000'),
    'resetting optimizer history must preserve the divergent next weight',
  );
  assert(weightsOnly.includes('m -0.025000 · v 0.000063'));
  assert(weightsOnly.includes('Optimizer step 1'));
  assert(compared.labels.some((label) => label.text === 'Live = restored' && label.alpha > 0.9));
  assert(compared.labels.some((label) => label.text === 'Weights only' && label.alpha > 0.9));
});

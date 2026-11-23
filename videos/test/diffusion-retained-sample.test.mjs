import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { draw } from '../animations/diffusion.mjs';

function paint(beat, beatP) {
  const canvas = createCanvas(1920, 1080),
    context = canvas.getContext('2d');
  const audit = drawFrame(
    context,
    {},
    { id: 'reverse', title: 'Sampling' },
    { beat, beatP, t: 10, duration: 30, opacity: 1, cues: {} },
    draw,
  );
  return { pixels: context.getImageData(170, 385, 315, 315).data, audit };
}

test('the completed sample persists while the separate DDPM-step anatomy is explained', () => {
  const completed = paint(0, 1),
    next = paint(1, 0.01),
    later = paint(1, 0.8);
  assert.deepEqual(next.pixels, completed.pixels);
  assert.deepEqual(later.pixels, completed.pixels);
  assert(next.audit.labels.some((label) => label.text === 'RETAINED SAMPLE'));
  assert(next.audit.labels.some((label) => label.text === 'Separate DDPM step anatomy'));
});

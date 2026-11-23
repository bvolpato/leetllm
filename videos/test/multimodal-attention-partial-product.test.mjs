import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { attentionConstruction, draw } from '../animations/multimodal-fusion.mjs';

registerLessonFonts();

const VALUES = [
  [0.1, 0, 0.9],
  [0.8, 0.1, 0.1],
  [0.1, 0.8, 0.1],
];
const cue = (id, phase, progress, targets) => ({
  id,
  phrase: id,
  phase,
  progress,
  reveal: progress,
  active: false,
  strength: 0,
  targets,
});

function paint(progress) {
  const cues = {
    'attention-softmax-normalize': cue('attention-softmax-normalize', 'after', 1, [
      'attention-softmax-operation',
    ]),
    'attention-weight-values': cue(
      'attention-weight-values',
      progress === 1 ? 'after' : 'during',
      progress,
      ['attention-value-vectors', 'attention-weighted-values', 'attention-attended-sum'],
    ),
  };
  const state = {
    beat: 1,
    beatP: 0.5,
    t: 20,
    duration: 45,
    opacity: 1,
    cueTiming: 'provider-words',
    cues,
  };
  const frame = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id: 'attention', title: 'Text reads a visual bank with attention' },
    state,
    draw,
  );
  return {
    labels: frame.labels.map((label) => label.text),
    shapes: frame.shapes,
    model: attentionConstruction(1, 0.5, cues),
  };
}

test('the third bar adds its share of the first coordinate before the final value appears', () => {
  for (const progress of [0.5, 0.55, 0.65, 0.75, 0.7826892655367138, 0.9, 0.99, 1]) {
    const { labels, shapes, model } = paint(progress);
    const thirdValue = VALUES[2][0];
    const product = model.weights[2] * thirdValue;
    const fraction = 2 * progress - 1;
    const row = model.weights[2].toFixed(3) + ' × ' + thirdValue.toFixed(3) + ' = ';
    assert(labels.includes(row + (progress === 1 ? product.toFixed(3) : '…')));

    const bar = shapes.find((shape) => shape.x === 1260 && shape.y === 778 && shape.height === 24);
    assert(Math.abs((bar?.width ?? 0) / 650 - fraction * product) < 1e-10);

    const sum = VALUES.reduce((total, value, i) => total + model.weights[i] * value[0], 0);
    assert(labels.includes(progress === 1 ? 'First coordinate = ' + sum.toFixed(3) : 'Adding the three contributions'));
    assert.equal(labels.some((label) => label.startsWith('First coordinate = ')), progress === 1);
  }
});

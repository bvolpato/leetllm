import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { draw, transferExperiment } from '../animations/decoding.mjs';

registerLessonFonts();

const paintTransfer = (progress) => {
  const expressions = [];
  const cues = {
    'transfer-edge-change': { phase: 'during', progress, strength: 1 },
    'transfer-nucleus-experiment': { phase: 'before', progress: 0, strength: 0 },
  };
  const state = { t: 12, duration: 42, opacity: 1, beat: 1, beatP: 0.5, cues };
  const frame = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id: 'transfer', title: 'Choose a policy against an output goal' },
    state,
    (ctx, scene, currentState, api) => {
      const observedApi = Object.create(api);
      Object.defineProperty(observedApi, 'math', {
        value: (canvasCtx, expression, ...args) => {
          expressions.push(expression);
          return api.math(canvasCtx, expression, ...args);
        },
      });
      draw(ctx, scene, currentState, observedApi);
    },
  );
  return {
    expressions,
    labels: frame.labels.map((label) => label.text),
    result: transferExperiment(1, 0, cues),
  };
};

test('transfer equations multiply their displayed operands throughout the edge change', () => {
  for (const progress of [0, 0.01, 0.13, 0.26, 0.3820750551875827, 0.5, 0.68, 0.91, 0.99, 1]) {
    const { expressions, labels, result } = paintTransfer(progress);
    assert.equal(expressions.length, 5);

    for (const expression of expressions) {
      const match = expression.match(/^(\d+(?:\.\d+)?)\\times(\d+(?:\.\d+)?)=(\d+(?:\.\d+)?)$/);
      assert(match, `unexpected rendered equation: ${expression}`);
      const product = (Number(match[1]) * Number(match[2])).toFixed(3);
      assert.equal(match[3], product, `${expression} must multiply the values shown on screen`);
    }

    for (const row of result.paths) assert.equal(row.score, row.first * row.conditional);
    assert(
      labels.includes(
        `Beam 2 keeps ran + slept → ${result.best.text} (${result.best.score.toFixed(3)})`,
      ),
    );
  }
});

test('the transfer model scores all 101 sampled edge states from its displayed operands', () => {
  for (let step = 0; step <= 100; step++) {
    const cues = {
      'transfer-edge-change': { phase: 'during', progress: step / 100, strength: 1 },
      'transfer-nucleus-experiment': { phase: 'before', progress: 0, strength: 0 },
    };
    const result = transferExperiment(1, 0, cues);
    for (const row of result.paths) assert.equal(row.score, row.first * row.conditional);
    assert.equal(result.beam2[0].text, result.best.text);
  }
});

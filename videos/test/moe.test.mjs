import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { route, ROUTER_LOGITS, BLENDED_OUTPUT, draw } from '../animations/moe.mjs';

test('top-two routing remains stable at large logits and normalizes only selected mass', () => {
  const result = route([1000, 1001, -1000], 2);
  assert.deepEqual(result.selected, [1, 0]);
  assert.ok(result.probabilities.every(Number.isFinite));
  assert.ok(Math.abs(result.weights.reduce((a, b) => a + b) - 1) < 1e-12);
  assert.ok(Math.abs(result.weights[0] - 1 / (1 + Math.exp(-1))) < 1e-12);
  const source = route(ROUTER_LOGITS);
  assert.deepEqual(source.selected, [0, 2]);
  const firstGate = 1 / (1 + Math.exp(-0.7));
  assert.ok(Math.abs(BLENDED_OUTPUT[0] - 2 * firstGate) < 1e-12);
  assert.ok(Math.abs(BLENDED_OUTPUT[1] - 3 * (1 - firstGate)) < 1e-12);
});

test('the displayed combined vector agrees with the actual arrow during head-to-tail construction', () => {
  const scene = { id: 'weighted-output', title: 'Build the output as a weighted vector sum' };
  const canvas = createCanvas(1920, 1080);
  let compared = false;
  for (const beatP of [0.1, 0.3, 0.5, 0.7, 0.9, 0.99]) {
    const frame = drawFrame(
      canvas.getContext('2d'),
      {},
      scene,
      {
        beat: 2,
        beatP,
        opacity: 1,
        t: 5,
        duration: 10,
        p: 0.8,
      },
      draw,
    );
    const label = frame.labels.find(
      (item) =>
        item.kind === 'text' && /^≈ \[[\d.]+, [\d.]+\]$/.test(item.text) && item.alpha >= 0.25,
    );
    if (!label) continue;
    const arrow = frame.connectors.find(
      (item) => item.from.x === 830 && item.from.y === 820 && item.to.x > 830 && item.to.y < 820,
    );
    assert.ok(arrow, 'a readable result must have a corresponding resultant arrow');
    const coordinates = [(arrow.to.x - 830) / 155, (820 - arrow.to.y) / 155];
    assert.equal(label.text, `≈ [${coordinates.map((value) => value.toFixed(3)).join(', ')}]`);
    const visibleGates = frame.labels
      .filter((item) => /^gate ≈ [\d.]+$/.test(item.text) && item.alpha >= 0.25)
      .map((item) => Number(item.text.slice('gate ≈ '.length)));
    assert.equal(visibleGates.length, 2);
    const displayedProducts = [2 * visibleGates[0], 3 * visibleGates[1]];
    assert.equal(
      label.text,
      `≈ [${displayedProducts.map((value) => value.toFixed(3)).join(', ')}]`,
    );
    compared = true;
  }
  assert.ok(compared);
});

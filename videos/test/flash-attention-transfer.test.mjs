import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { drawFrame } from '../lib/scene.mjs';
import {
  draw,
  rescaledFirstTile,
  summarize,
  transferPrediction,
} from '../animations/flash-attention.mjs';

registerLessonFonts();

function paintRescale(progress) {
  const cue = {
    id: 'new-reference',
    phrase: 'new reference',
    targets: ['rescaled-row-sums'],
    color: 'yellow',
    phase: 'during',
    progress,
    strength: 0,
  };
  const frame = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id: 'rescale', title: 'A new maximum rescales both saved sums' },
    { beat: 0, beatP: 0.5, t: 10, duration: 40, opacity: 1, cues: { 'new-reference': cue } },
    draw,
  );
  return frame.labels.map((label) => label.text);
}

test('changing a value preserves score summaries and changes the dense and tiled answers equally', () => {
  const before = transferPrediction(40),
    probability = Math.exp(3) / (Math.exp(1) + Math.exp(2) + Math.exp(3));
  for (const lastValue of [4, 0, -20, 40]) {
    const after = transferPrediction(lastValue);
    assert.equal(after.tiled.m, before.tiled.m);
    assert.equal(after.tiled.l, before.tiled.l);
    assert(Math.abs(after.tiled.u / after.tiled.l - after.dense) < 1e-12);
    assert(Math.abs(after.dense - before.dense - probability * (lastValue - 40)) < 1e-12);
    assert(Math.abs(after.firstOnFinalScale + after.lastContribution - after.tiled.u) < 1e-12);
  }
});

test('the displayed rescale factor agrees with the same-precision reference at intermediate values', () => {
  const base = summarize([1, 2], [10, 20]);
  for (const progress of [0, 0.12, 0.398, 0.5, 0.88, 1]) {
    const labels = paintRescale(progress);
    const reference = Number(rescaledFirstTile(progress).reference.toFixed(3));
    const factor = Math.exp(2 - reference);
    assert(labels.includes(`Reference ${reference.toFixed(3)}`));
    assert(
      labels.includes(`Current scale: exp(2 − ${reference.toFixed(3)}) ≈ ${factor.toFixed(4)}`),
    );
    assert(labels.includes('ℓ = ' + (base.l * factor).toFixed(3)));
    assert(labels.includes('u = ' + (base.u * factor).toFixed(3)));
  }
});

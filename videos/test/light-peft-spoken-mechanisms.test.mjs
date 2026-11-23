import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { draw } from '../animations/deep-dive-light-peft.mjs';
import { drawFrame } from '../lib/scene.mjs';

const cue = (phase, progress = phase === 'after' ? 1 : 0) => ({ phase, progress, strength: 0 });
const paint = (id, beat, cues, beatP = 0.1) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: id },
    { beat, beatP, t: 0, duration: 60, opacity: 1, cues },
    draw,
  );
const labels = (frame) =>
  frame.labels.filter((label) => label.alpha >= 0.99).map((label) => label.text);

test('projection ledger derives dimensions before scaling the counted dense work', () => {
  const projections = Object.fromEntries(
    ['query', 'key', 'value', 'output'].map((id) => [`cost-${id}-product`, cue('after')]),
  );
  const first = paint('cost', 0, projections);
  for (const name of ['Q', 'K', 'V', 'O']) assert(labels(first).includes(`${name}: 8 × 8 = 64`));
  assert(labels(first).includes('Counted pairs / token: 256'));
  assert(!labels(first).some((text) => text.includes('3072')));
  const dense = paint('cost', 1, {
    'cost-ffn-products': cue('after'),
    'cost-beat-2-focus-1': cue('after'),
    'cost-four-tokens': cue('after'),
  });
  assert(labels(dense).includes('FFN up: 8 × 32 = 256'));
  assert(labels(dense).includes('FFN down: 32 × 8 = 256'));
  assert(labels(dense).includes('Counted pairs / token: 768'));
  assert(labels(dense).includes('4 tokens × 768 = 3072 pairs'));
});

test('completed spoken interpolation paints its computed cutoff and holds it', () => {
  const frame = paint('heads', 1, { 'heads-beat-2-focus-1': cue('after') });
  assert(labels(frame).some((text) => text.includes('=0.425')));
  assert(frame.targets.some((target) => target.id === 'heads-cutoff' && target.markCounts.math));
});

test('benchmark focus includes the actual measured values rather than unrelated titles', () => {
  const frame = paint('evidence', 1, { 'evidence-beat-2-focus-2': cue('during', 0.5) });
  const target = frame.targets.find((part) => part.id === 'evidence-memory-results');
  assert(target);
  assert(target.markCounts.labels >= 4);
  const contains = (label) =>
    label.x >= target.x &&
    label.y >= target.y &&
    label.x + label.width <= target.x + target.width + 1 &&
    label.y + label.height <= target.y + target.height + 1;
  const measurements = frame.labels.filter((label) => /% less|2\.2×/.test(label.text));
  assert.equal(measurements.length, 4);
  assert(measurements.every(contains));
  assert(!contains(frame.labels.find((label) => label.text.startsWith('Figure 4'))));
});

test('selected indices enter the cache key during their own spoken requirement and persist', () => {
  for (const beat of [0, 1, 2]) {
    const frame = paint('deployment', beat, { 'deployment-beat-1-focus-1': cue('after') });
    assert(labels(frame).some((text) => text.includes('Cache A:') && text.includes('[0, 2, 3]')));
    assert(labels(frame).some((text) => text.includes('Cache B:') && text.includes('[0, 1, 3]')));
  }
});

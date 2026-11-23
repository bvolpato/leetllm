import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { draw as projection } from '../animations/embedding-projection.mjs';
import { draw as perplexity } from '../animations/perplexity.mjs';
import { draw as geometry } from '../animations/embedding-geometry.mjs';

function paint(draw, id, beat, cues = {}) {
  const canvas = createCanvas(1920, 1080);
  return drawFrame(
    canvas.getContext('2d'),
    {},
    { id, title: 'Retained calculation' },
    { beat, beatP: 0.01, t: 5, duration: 30, opacity: 1, cues },
    draw,
  );
}

test('established distance and pair-term readouts survive the next explanation beat', () => {
  const distance = paint(projection, 'projection', 1);
  assert(distance.labels.find((label) => label.text === 'Original distance from A').alpha > 0.9);
  const term = paint(projection, 'tsne', 2);
  assert(term.labels.find((label) => label.text.startsWith('Pair term')).alpha > 0.9);
});

test('the scored-target count follows actual second and final window construction', () => {
  const before = paint(perplexity, 'windows', 1, {
    'windows-final-targets': { phase: 'before', progress: 0 },
  });
  assert(before.labels.some((label) => label.text === 'distinct scored targets: 7'));
  assert(!before.labels.some((label) => label.text === 'evening'));
  const after = paint(perplexity, 'windows', 1, {
    'windows-final-targets': { phase: 'during', progress: 0.1 },
  });
  assert(after.labels.some((label) => label.text === 'distinct scored targets: 9'));
  assert(after.labels.some((label) => label.text === 'evening'));
  const held = paint(perplexity, 'windows', 2);
  assert(held.labels.some((label) => label.text === 'distinct scored targets: 9'));
});

test('authorization and scoring finish in their measured first-paragraph clauses and stay established', () => {
  const cues = {
    'deployment-retrieval-access-filter-b1-1': { phase: 'after', progress: 1 },
    'deployment-rank-eligible': { phase: 'after', progress: 1 },
  };
  for (const beat of [0, 1, 2]) {
    const audit = paint(geometry, 'deployment', beat, cues);
    assert(audit.labels.some((label) => label.text === '2 eligible · 1 excluded'));
    assert(audit.labels.some((label) => label.text === '2 eligible passages scored'));
    assert(audit.labels.find((label) => label.text === 'approved rows only').alpha > 0.9);
  }
});

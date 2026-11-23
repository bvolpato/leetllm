import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { BASE, draw, truncationState } from '../animations/decoding.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

registerLessonFonts();

test('the completed nucleus remains retained while its two-token subtotal is explained', () => {
  const completed = truncationState('nucleus', { beat: 0, beatP: 0.99 });
  for (const beatP of [0, 0.1, 0.3, 0.4]) {
    const current = truncationState('nucleus', { beat: 1, beatP });
    assert.deepEqual(current.ids, completed.ids);
    assert.equal(current.sum, completed.sum);
  }
  assert.deepEqual(completed.ids, [0, 1, 2]);
  assert.equal(completed.sum, 0.85);
  assert(BASE.slice(0, 2).reduce((sum, p) => sum + p, 0) < 0.8);
  const normalized = truncationState('nucleus', { beat: 1, beatP: 0.99 });
  assert(Math.abs(normalized.values.reduce((sum, p) => sum + p, 0) - 1) < 1e-12);
  assert.equal(truncationState('nucleus', { beat: 2, beatP: 0 }).ids.length, 3);
});

test('the checkpoint explanation preserves the painted three-token result', () => {
  const ctx = createCanvas(1920, 1080).getContext('2d');
  const frame = drawFrame(
    ctx,
    {},
    { id: 'nucleus', title: 'Retain enough candidates to reach a mass target' },
    { t: 20, duration: 54, opacity: 1, beat: 1, beatP: 0.1 },
    draw,
  );
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  assert(frame.labels.some((label) => label.text === 'Top-p 0.80 · 3 candidates accumulated'));
  assert(frame.labels.some((label) => label.text.includes('First two: 0.700 < 0.80')));
  assert(frame.labels.some((label) => label.text.includes('with played: 0.850')));
});

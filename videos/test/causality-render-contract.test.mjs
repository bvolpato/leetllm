import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { draw } from '../animations/causality.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
registerLessonFonts();
function paint(id, beat, values = {}) {
  const cues = Object.fromEntries(
    Object.entries(values).map(([id, progress]) => [
      'cau-' + id,
      {
        progress,
        phase: progress === 1 ? 'after' : progress === 0 ? 'before' : 'during',
        strength: 0,
      },
    ]),
  );
  const a = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: 'Follow the same causal state', beats: [{}, {}, {}] },
    { beat, beatP: 0.5, t: 10, duration: 70, opacity: 1, cues },
    draw,
  );
  assert.deepEqual([...a.issues, ...layoutIssues(a)], []);
  return { audit: a, labels: a.labels.map((l) => l.text) };
}
test('the separate raw cap restores unscaled weights before forming its total', () => {
  const labels = paint('weight-choices', 2, {
    'stabilize-half': 1,
    'clip-five': 1,
    'clip-total': 1,
    'clipped-rates': 1,
    'clipped-difference': 1,
    'ess-result': 1,
  }).labels;
  assert.equal(labels.filter((s) => s === 'weighted total: 150').length, 2);
  assert(!labels.includes('weighted total: 75'));
  assert(labels.includes('63.33%'));
  assert(labels.includes('66.67%'));
});
test('a changed effect vector retains the weighting premises while each result is held', () => {
  const pending = paint('estimands', 1, {
    'effect-vector': 1,
    'ate-result': 1,
    'att-result': 0,
    'deployment-effect': 0,
  }).labels;
  assert(pending.includes('0.1 × 4 + 0.9 × 16'));
  assert(!pending.includes('14.8 points'));
  assert(!pending.includes('7.6 points'));
  const earned = paint('estimands', 2, {
    'effect-vector': 1,
    'ate-result': 1,
    'att-result': 1,
    'deployment-effect': 1,
  }).labels;
  assert(earned.includes('14.8 points'));
  assert(earned.includes('7.6 points'));
});
test('return replacement does not retain the old downstream value or reveal the new result early', () => {
  const input = {
    'replay-model': 1,
    'replay-baseline': 1,
    'replay-change': 1,
    'replay-new-result': 0,
  };
  const pending = paint('replay-state', 1, input).labels;
  assert(pending.includes('recomputing'));
  assert(!pending.includes('8'));
  assert(!pending.some((s) => s.includes('→ success')));
  assert(
    paint('replay-state', 1, { ...input, 'replay-new-result': 1 }).labels.includes(
      'Recomputed 8 reaches 6 → success',
    ),
  );
});
test('fresh audit preserves full-ledger successes and separates its three spoken results', () => {
  const initial = paint('fresh-audit', 0).labels;
  assert.equal(initial.filter((s) => s === 'A1').length, 2);
  assert(!initial.includes('0/12 = 0%'));
  const filtered = paint('fresh-audit', 1, {
    'fresh-assistant-count': 1,
    'fresh-control': 1,
  }).labels;
  assert.equal(filtered.filter((s) => s === 'A1').length, 1);
  assert(filtered.includes('8/20 = 40%'));
  assert(!filtered.includes('0/12 = 0%'));
  assert(!filtered.some((s) => s.includes('−40 points')));
  const done = paint('fresh-audit', 2, {
    'fresh-assistant-count': 1,
    'fresh-control': 1,
    'fresh-assistant-rate': 1,
    'fresh-audit-difference': 1,
  }).labels;
  assert(done.includes('0/12 = 0%'));
  assert(done.includes('Assistant − control: −40 points'));
});
test('changed observation probability waits for its own corrected result', () => {
  const pending = paint('click-exposure', 1, {
    'click-product': 1,
    'click-correct-weight': 1,
    'click-wrong-input': 1,
    'click-wrong-weight': 0,
  }).labels;
  assert(pending.includes('used observation probability 0.4'));
  assert(!pending.includes('Corrected 30%'));
  assert(
    paint('click-exposure', 1, {
      'click-product': 1,
      'click-correct-weight': 1,
      'click-wrong-input': 1,
      'click-wrong-weight': 1,
    }).labels.includes('Corrected 30%'),
  );
});

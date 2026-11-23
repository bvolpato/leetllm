import { readRepositoryLesson } from './helpers/repository.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

import {
  draw,
  linearFixture,
  rankFixture,
  headFixture,
  stopwatchFixture,
  historyFixture,
  keepAbove,
  maskReceiptFixture,
  maskReceiptMatches,
  ffnPathFixture,
} from '../animations/deep-dive-light-peft.mjs';

registerLessonFonts();
const lesson = await readRepositoryLesson('videos/lessons/deep-dive-light-peft.lesson.yaml');
function paint(id, beat, phases = {}, beatP = 0.5) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = {};
  scene.beats.forEach((b, i) =>
    (b.visual_cues ?? []).forEach((c) => {
      const setting = phases[c.id] ?? (i < beat ? 'after' : 'before'),
        phase = typeof setting === 'number' ? 'during' : setting;
      cues[c.id] = {
        ...c,
        phase,
        progress:
          typeof setting === 'number'
            ? setting
            : phase === 'before'
              ? 0
              : phase === 'during'
                ? 0.5
                : 1,
        strength: 0,
        active: false,
      };
    }),
  );
  const frame = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { beat, beatP, t: 10, duration: 80, opacity: 1, cueTiming: 'synthetic-test-phases', cues },
    draw,
  );
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  return frame;
}
const words = (f) => f.labels.map((l) => l.text);

test('the same input feeds a frozen base and scaled low-rank branch', () => {
  const f = linearFixture();
  assert.deepEqual(f.base, [0, -3]);
  assert.deepEqual(f.activation, [2, -1]);
  assert.deepEqual(f.unscaled, [0, 1]);
  assert.deepEqual(f.update, [0, 0.5]);
  assert.deepEqual(f.output, [0, -2.5]);
  const changed = linearFixture([1, 1]);
  assert.deepEqual(changed.output, [4.5, -0.5]);
});

test('all rank subsets preserve the masked full product at the same scale', () => {
  for (let mask = 0; mask < 16; mask++) {
    const kept = [0, 1, 2, 3].filter((i) => mask & (1 << i)),
      f = rankFixture(kept, kept, 4);
    const expected = f.B.map((row) =>
      row.reduce((sum, b, i) => sum + (kept.includes(i) ? b * f.activation[i] * 4 : 0), 0),
    );
    assert.deepEqual(f.output, expected);
  }
  assert.deepEqual(rankFixture().output, [52, 35]);
  assert.deepEqual(rankFixture([1, 3], [0, 2]).output, [35, -16]);
  assert.throws(() => rankFixture([1, 1]), /assertion|false|true/i);
});

test('rank rescaling doubles an otherwise identical sliced product', () => {
  const retained = rankFixture([1, 3], [1, 3], 4),
    reconstructed = rankFixture([1, 3], [1, 3], 8);
  assert.deepEqual(retained.output, [208, 140]);
  assert.deepEqual(
    reconstructed.output,
    retained.output.map((v) => 2 * v),
  );
});

test('equal retained widths do not establish cache identity or output equality', () => {
  const before = headFixture(),
    after = headFixture([2, 0]);
  assert.equal(before.selected.A.length, before.selected.B.length);
  assert(!before.cacheCompatible);
  assert.deepEqual(before.contributions, [1, 4, 2, 8]);
  assert.deepEqual(before.outputs, { A: 11, B: 13 });
  assert.deepEqual(after.contributions, [2, -4, 2, 6]);
  assert.deepEqual(after.outputs, { A: 10, B: 4 });
});

test('invalid history zero-fill and deletion preserve different denominators', () => {
  const f = historyFixture();
  assert.equal(f.later.length, 3);
  assert.equal(f.invalid, 1);
  assert(Math.abs(f.zeroFilled - 0.2) < 1e-12);
  assert(Math.abs(f.dropped - 0.3) < 1e-12);
});

test('global and layerwise signed populations select different functions at the same budget', () => {
  const a = [0.1, 0.2],
    b = [0.8, 0.9],
    global = keepAbove([...a, ...b], 0.5);
  assert.deepEqual(global.kept, [2, 3]);
  assert.deepEqual(keepAbove(a, 0.5).kept, [1]);
  assert.deepEqual(keepAbove(b, 0.5).kept, [1]);
  assert.deepEqual(keepAbove([-0.91, 0.08, 0.72, 0.54], 0.25).kept, [1, 2, 3]);
  assert.deepEqual(keepAbove([0.91, 0.08, 0.72, 0.54], 0.25).kept, [0, 2, 3]);
  assert.deepEqual(keepAbove([0.6, 0.6, 0.6, 0.6], 0.25).kept, []);
  assert.deepEqual(keepAbove([0.2, 0.2, 0.2, 0.8], 0).kept, [3]);
});

test('the complete stopwatch includes estimate, records, surgery and evaluation', () => {
  const f = stopwatchFixture();
  assert.equal(f.candidate, 90);
  assert.equal(f.ratio, 4 / 3);
  assert.equal(f.saved, 0.25);
  assert(f.candidate > f.parts.find((p) => p.label === 'continue').minutes);
});

test('the saved record admits matching bytes and axes while rejecting stale same-width identities', () => {
  const r = maskReceiptFixture(),
    receiver = { modelRevision: 'R17', selected: [0, 2, 3], shape: [3, 2] };
  assert(maskReceiptMatches(r, receiver));
  assert(!maskReceiptMatches({ ...r, bytes: r.bytes + ' ' }, receiver));
  assert(!maskReceiptMatches(r, { ...receiver, selected: [0, 1, 3] }));
  assert(!maskReceiptMatches(r, { ...receiver, modelRevision: 'R18' }));
  assert(!maskReceiptMatches(r, { ...receiver, shape: [3, 3] }));
});

test('the same activation loses exactly its paired weight, while a one-sided cut cannot multiply', () => {
  assert.equal(ffnPathFixture(false).output, 9);
  assert.equal(ffnPathFixture(true).output, 7);
  const broken = ffnPathFixture(true, false);
  assert(!broken.valid);
  assert.equal(broken.output, null);
  assert.deepEqual(broken.activation, [3, -1]);
  assert.deepEqual(broken.down, [1, 2, -1]);
  paint('ffn', 0, { 'lp-ffn-first-cut': 'after', 'lp-ffn-mismatch': 'after' });
});

test('the cost grids keep the FFN shape labels separate from attention pair counts', () => {
  paint('cost', 0, {}, 0.02);
  paint('cost', 1, { 'cost-ffn-products': 'after', 'cost-four-tokens': 'after' });
});

test('the shared-input sum waits for its spoken result after the branch products', () => {
  const before = words(paint('parallel-product', 1, { 'lp-a': 'after', 'lp-b': 'after' }));
  assert(!before.includes('-2.5'));
  const after = words(
    paint('parallel-product', 1, { 'lp-a': 'after', 'lp-b': 'after', 'lp-combine': 'after' }),
  );
  assert(after.includes('-2.5'));
});

test('the new-input payoff keeps its two results, cache rejection and quality hold separate', () => {
  const held = words(paint('fresh-pruning', 0));
  assert(held.includes('sum = ?'));
  assert(!held.includes('sum = 10'));
  assert(!held.includes('sum = 4'));
  assert(!held.some((s) => s.startsWith('HOLD')));
  const a = words(paint('fresh-pruning', 1, { 'lp-fresh-a': 'after' }));
  assert(a.includes('sum = 10'));
  assert(!a.includes('sum = 4'));
  const both = words(
    paint('fresh-pruning', 1, {
      'lp-fresh-a': 'after',
      'lp-fresh-b': 'after',
      'lp-fresh-cache': 'after',
    }),
  );
  assert(both.includes('sum = 4'));
  assert(both.some((s) => s.startsWith('REJECT')));
  assert(!both.some((s) => s.startsWith('HOLD')));
  const final = words(
    paint('fresh-pruning', 1, {
      'lp-fresh-a': 'after',
      'lp-fresh-b': 'after',
      'lp-fresh-cache': 'after',
      'lp-fresh-rate': 'after',
      'lp-fresh-hold': 'after',
    }),
  );
  assert(final.some((s) => s.startsWith('HOLD')));
});

test('the zero-ratio helper displays its own interpolation position beside the caller skip', () => {
  const f = paint('threshold-boundaries', 1, {
    'lp-zero-helper': 'after',
    'lp-zero-caller': 'after',
  });
  assert(words(f).some((s) => s.includes('3\\cdot0=0')));
  assert(words(f).some((s) => s.includes('Caller ratio 0: skip helper')));
});

test('the physical cut changes the actual receiving matrix rather than just its caption', () => {
  const before = paint('quantized-versus-sliced', 1),
    after = paint('quantized-versus-sliced', 1, { 'lp-slice': 'after' });
  assert(words(before).includes('4 × 4 tensor'));
  assert(words(after).includes('3 × 4 after physical cut'));
  const cells = (f) =>
    f.shapes.filter(
      (s) => s.x >= 1090 && s.x < 1420 && s.y >= 370 && s.y < 700 && s.kind === 'rect',
    );
  assert.equal(cells(before).length, 16);
  assert.equal(cells(after).length, 12);
});

test('the random branch changes views without painting over retained score identities', () => {
  for (const progress of [0, 0.3, 1]) paint('random-control', 1, { 'lp-random-fail': progress });
});

test('a ratio and hold cue owns a visible question before it owns a final answer', () => {
  const before = words(paint('complete-stopwatch', 1, { 'lp-complete-ratio': 0.4 }));
  assert(before.includes('Full-window ratio?'));
  assert(!before.includes('120 / 90 = 1.33×'));
  paint('shift-gate', 1, { 'lp-shift-hold': 0.4 });
  paint('paper-tradeoff', 0, { 'lp-table-loss': 0.4 });
});

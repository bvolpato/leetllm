import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import * as model from '../animations/vectors.mjs';

registerLessonFonts();
const cue = (p) => ({
  progress: p,
  phase: p === 0 ? 'before' : p === 1 ? 'after' : 'during',
  strength: 0,
});
const state = (beat, values) => ({
  beat,
  beatP: 0,
  t: 20,
  duration: 100,
  opacity: 1,
  cues: Object.fromEntries(Object.entries(values).map(([id, p]) => [id, cue(p)])),
});
const near = (a, b) => assert(Math.abs(a - b) < 1e-10, `${a} differs from ${b}`);
const nearRows = (a, b) => a.forEach((r, i) => r.forEach((v, j) => near(v, b[i][j])));
function paint(id, s) {
  const canvas = createCanvas(1920, 1080);
  const audit = drawFrame(
    canvas.getContext('2d'),
    {},
    { id, title: 'Follow the coordinates' },
    s,
    model.draw,
  );
  assert.deepEqual([...audit.issues, ...layoutIssues(audit)], []);
  return audit;
}

test('equal-sized batched transpose alternatives preserve different numeric ownership', () => {
  const f = model.batchedScoreState(model.AXIS_TRAP);
  assert.deepEqual(f.correct[0], [
    [1, 0.5],
    [0.5, 0.5],
  ]);
  assert.deepEqual(f.wrong[0], [
    [1, 0],
    [0.75, 0.25],
  ]);
  assert.equal(f.correct.length, f.wrong.length);
  assert.notDeepEqual(f.correct, f.wrong);
});

test('positive scaling changes the raw score while cosine remains fixed', () => {
  for (const p of [0, 0.001, 0.3, 0.8, 1]) {
    const f = model.extendedFrame('normalized-scores', state(0, { 'length-double': p }));
    near(f.dot, 0.5 + 0.5 * p);
    near(f.cosine, 1 / Math.sqrt(2));
    near(Math.hypot(...f.unit), 1);
  }
});

test('the feature-order repair moves the same owners back before recomputing five seconds', () => {
  const fixed = { 'latency-swap': 1, 'latency-swapped': 1 };
  const before = model.extendedFrame('latency-dot', state(2, { ...fixed, 'latency-restore': 0 }));
  assert.deepEqual(before.input, [1, 2]);
  assert.deepEqual(before.parts, [2, 2]);
  assert.equal(before.accumulated, 4);
  assert.equal(before.reveal, true);
  for (const p of [0.01, 0.3, 0.65, 0.8, 0.99, 1]) {
    const s = state(2, { ...fixed, 'latency-restore': p });
    const f = model.extendedFrame('latency-dot', s),
      frame = paint('latency-dot', s);
    assert.equal(
      f.reveal,
      p === 1,
      'hide the scalar while owners and contributions are being repaired',
    );
    if (p < 0.65) assert.deepEqual(f.input, [1, 2]);
    else assert.deepEqual(f.input, [2, 1]);
    if (p === 1) {
      assert.deepEqual(f.parts, [4, 1]);
      assert.equal(f.accumulated, 5);
      assert.equal(f.swapped, false);
      assert(frame.labels.some((l) => l.text === 'B · [prompt, queue]'));
      assert(frame.labels.some((l) => l.text === '5 s'));
      assert(!frame.labels.some((l) => l.text === '4 s'));
    }
  }
});

test('the incorrect batched scores persist through diagnosis until the spoken repair finishes', () => {
  for (const p of [0, 0.2, 0.9, 0.999, 1]) {
    const s = state(2, { 'batch-diagonal': 1, 'batch-repair': p }),
      f = model.extendedFrame('batched-transpose', s);
    assert.equal(f.showingWrong, p < 1);
    assert.deepEqual(f.selected, p < 1 ? f.wrong : f.correct);
    const frame = paint('batched-transpose', s);
    assert(
      frame.labels.some((l) => l.text === (p < 1 ? 'all-axis reversal' : 'last-two-axis swap')),
    );
  }
});

test('feature and request biases produce distinct results despite equal shape', () => {
  const feature = model.extendedFrame('broadcasting', state(0, { 'feature-bias': 1 }));
  const rows = model.extendedFrame('broadcasting', state(1, { 'row-bias': 1 }));
  nearRows(feature.correct, [
    [2.1, 0.1],
    [5.1, 1.8],
    [7.1, 2],
  ]);
  nearRows(rows.wrong, [
    [2.1, 0.3],
    [4.9, 1.8],
    [7, 2.1],
  ]);
});

test('the token sum is constructed before division and the whole vector scales uniformly', () => {
  const fixed = { 'pool-reset': 1, 'pool-my': 1, 'pool-password': 1, 'pool-sum': 1 };
  for (const p of [0, 0.2, 0.5, 0.9, 1]) {
    const f = model.extendedFrame('pooling', state(1, { ...fixed, 'pool-result': p }));
    const expected = 1.5 - f.divide;
    f.accumulation.sum.forEach((v) => near(v, expected));
    assert.equal(f.reveal, p === 1);
    assert.deepEqual(
      f.terms.map((t) => t.id),
      ['pooled-0', 'pooled-1', 'pooled-2'],
    );
    if (p <= 0.22)
      assert.equal(f.divide, 0, 'hold the completed sum before starting its reduction');
  }
});

test('the fresh token input changes before its output is disclosed', () => {
  const initial = model.extendedFrame('fresh-case', state(0, { 'fresh-input-change': 0 }));
  const changed = model.extendedFrame('fresh-case', state(0, { 'fresh-input-change': 1 }));
  assert.deepEqual(initial.hidden[2], [1, 1]);
  assert.deepEqual(changed.hidden[2], [2, 1]);
  assert.equal(changed.reveal, false);
  for (const p of [0, 0.5, 0.99, 1]) {
    const s = state(1, { 'fresh-token-answer': p }),
      f = model.extendedFrame('fresh-case', s);
    assert.deepEqual(f.output, [
      [1, 0, 0.5],
      [0, 1, 0.5],
      [2, 1, 1.5],
      [0, 0, 0],
    ]);
    const frame = paint('fresh-case', s);
    assert.equal(frame.labels.filter((l) => l.text === '?').length, p === 1 ? 0 : 12);
  }
});

test('the fresh summary scales the actual three-vector sum and keeps the valid divisor', () => {
  for (const p of [0, 0.25, 0.75, 1]) {
    const f = model.extendedFrame(
      'fresh-case',
      state(2, { 'fresh-summary': 1, 'fresh-summary-answer': p, 'fresh-padding-answer': 0 }),
    );
    assert.deepEqual(f.sum, [3, 2, 2.5]);
    nearRows([f.summary], [[1, 2 / 3, 5 / 6]]);
    assert.deepEqual(f.plain, [0.75, 0.5, 0.625]);
    assert.equal(f.result, p === 1);
    f.terms.forEach((t) => near(t.weight, 1 - (2 * f.divide) / 3));
  }
});

test('the completed sums remain readable before either spoken division starts changing them', () => {
  const pool = state(1, {
    'pool-reset': 1,
    'pool-my': 1,
    'pool-password': 1,
    'pool-sum': 1,
    'pool-result': 0.1,
  });
  assert.equal(model.extendedFrame('pooling', pool).divide, 0);
  assert(paint('pooling', pool).labels.some((l) => l.text === 'Token sum: (1.5, 1.5, 1.5)'));
  const fresh = state(2, {
    'fresh-summary': 1,
    'fresh-summary-answer': 0.1,
    'fresh-padding-answer': 0,
  });
  assert.equal(model.extendedFrame('fresh-case', fresh).divide, 0);
  assert(paint('fresh-case', fresh).labels.some((l) => l.text === 'Real-token sum: (3, 2, 2.5)'));
});

test('padding dilution is distinct from the masked and empty-token cases', () => {
  const before = model.extendedFrame('padding-mask', state(0, { 'padding-add': 0 }));
  const padded = model.extendedFrame('padding-mask', state(0, { 'padding-add': 1 }));
  const masked = model.extendedFrame('padding-mask', state(1, { 'padding-select': 1 }));
  assert.deepEqual(before.plain, [0.5, 0.5]);
  assert.deepEqual(padded.plain, [0.25, 0.25]);
  assert.deepEqual(masked.correct, [0.5, 0.5]);
  assert.equal(masked.masked, true);
  const empty = model.extendedFrame('padding-mask', state(2, { 'padding-empty': 1 }));
  assert.deepEqual(empty.valid, [false, false, false, false]);
  assert.equal(empty.failure, true);
});

test('tensor indexing previews finish the scalar selection before showing the feature slice', () => {
  for (const p of [0.02, 0.25, 0.5, 0.75, 0.98, 1]) {
    const preview = { beat: 1, beatP: p, t: 20, duration: 100, opacity: 1, cues: {} };
    const selected = model.tensorFrame(preview);
    if (p <= 0.75)
      assert.equal(selected.slice, 0, 'the slice follows the message, word and feature selection');
    paint('tensor', preview);
  }
});

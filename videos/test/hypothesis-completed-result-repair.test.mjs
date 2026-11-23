import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import {
  draw,
  holdoutFrame,
  assignmentFrame,
  jointDifferenceMoments,
  macroTaskScores,
} from '../animations/hypothesis-testing.mjs';
const Y = createRequire(import.meta.url)('yaml');
const lesson = Y.parse(
  fs.readFileSync(new URL('../lessons/hypothesis-testing.lesson.yaml', import.meta.url), 'utf8'),
);
function paint(id, beat, overrides = {}) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = Object.fromEntries(
      scene.beats.flatMap((b, i) =>
        (b.visual_cues ?? []).map((c) => [
          c.id,
          { phase: i < beat ? 'after' : 'before', progress: i < beat ? 1 : 0 },
        ]),
      ),
    );
  for (const [k, v] of Object.entries(overrides)) cues[k] = v;
  const labels = [],
    bars = [],
    api = {
      C: new Proxy({}, { get: (_, key) => String(key) }),
      text: (_ctx, s) => labels.push(String(s)),
      math: (_ctx, s) => labels.push(String(s)),
      rect() {},
      line() {},
      arrow() {},
      circle() {},
      focus: { target: (_id, fn) => fn() },
      teaching: {
        bars: (p) => bars.push(p),
        axes: () => ({ point: (x, y) => ({ x, y }) }),
        curve() {},
      },
    };
  draw({}, scene, { beat, beatP: 0.5, cues }, api);
  return { labels, bars };
}
const during = { phase: 'during', progress: 0.99 },
  after = { phase: 'after', progress: 1 };
test('actual receipts stay pending through the final measured word', () => {
  for (const [fn, beat, cue, key] of [
    [holdoutFrame, 1, 'holdout-lift', 'lift'],
    [holdoutFrame, 2, 'release-receipt', 'release'],
    [holdoutFrame, 0, 'holdout-count', 'counts'],
    [assignmentFrame, 1, 'forty-lift', 'receipt'],
  ]) {
    assert.equal(fn({ beat, beatP: 0.5, cues: { [cue]: during } })[key], false, cue);
    assert.equal(fn({ beat, beatP: 0.5, cues: { [cue]: after } })[key], true, cue);
  }
});
test('covariance paint waits for its completed numeric clause', () => {
  assert(
    !paint('variance-construction', 0, { 'hyp-variance-covariance': during }).labels.some((s) =>
      s.includes('=0.20'),
    ),
  );
  assert(
    paint('variance-construction', 0, { 'hyp-variance-covariance': after }).labels.some((s) =>
      s.includes('=0.20'),
    ),
  );
});
test('paired and independent variance bars are separately earned, never pre-solved', () => {
  const p = paint('variance-construction', 1);
  assert.deepEqual(p.bars[0].values, [0, 0]);
  assert(!p.labels.includes('0.0025'));
  const a = paint('variance-construction', 1, { 'hyp-variance-paired-result': after });
  assert.deepEqual(a.bars[0].values, [jointDifferenceMoments().paired, 0]);
  const b = paint('variance-construction', 1, {
    'hyp-variance-paired-result': after,
    'hyp-variance-independent-result': after,
  });
  assert.deepEqual(b.bars[0].values, [
    jointDifferenceMoments().paired,
    jointDifferenceMoments().independent,
  ]);
});
test('replacement totals and per-task transforms preserve pending operands', () => {
  const e = paint('estimator-bias', 1);
  assert(!e.labels.some((s) => s.includes('0.67232') || s.includes('= 7/9')));
  const a = paint('estimator-bias', 1, { 'hyp-replacement-plugin-result': after });
  assert(a.labels.some((s) => s.includes('0.67232')));
  assert(!a.labels.some((s) => s.includes('= 7/9')));
  const m = paint('macro-construction', 0);
  assert.deepEqual(m.bars[0].values, [0, 0, 0, 0]);
  const n = paint('macro-construction', 0, {
    'hyp-macro-score-zero': after,
    'hyp-macro-score-half': after,
  });
  assert.deepEqual(n.bars[0].values, [macroTaskScores[0], macroTaskScores[1], 0, 0]);
  assert(!n.labels.includes(macroTaskScores[2].toFixed(6)));
});

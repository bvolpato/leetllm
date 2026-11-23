import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import {
  rawKVBytes,
  promptCoverage,
  chooseFeasible,
  retainedBranchLedger,
  testTimeCoreFrame,
  validateModel,
  draw,
} from '../animations/test-time-compute.mjs';
const Y = createRequire(import.meta.url)('yaml'),
  lesson = Y.parse(
    fs.readFileSync(new URL('../lessons/test-time-compute.lesson.yaml', import.meta.url), 'utf8'),
  );
const during = { phase: 'during', progress: 0.999 },
  after = { phase: 'after', progress: 1 };
function paint(id, beat, override = {}) {
  const scene = lesson.scenes.find((s) => s.id === id),
    labels = [],
    rects = [],
    colors = [],
    cues = Object.fromEntries(
      scene.beats.flatMap((b, i) =>
        (b.visual_cues ?? []).map((c) => [
          c.id,
          { phase: i < beat ? 'after' : 'before', progress: i < beat ? 1 : 0 },
        ]),
      ),
    );
  Object.assign(cues, override);
  const api = {
    C: new Proxy({}, { get: (_, k) => String(k) }),
    text: (_ctx, s, _x, _y, _z, color) => {
      labels.push(String(s));
      colors.push({ text: String(s), color });
    },
    rect: (_ctx, ...args) => rects.push(args),
    line() {},
    arrow() {},
    circle() {},
    focus: { target: (_id, f) => f() },
    components: {
      fade: (p, f) => {
        if (p > 0) f();
      },
    },
    teaching: { transfer() {} },
  };
  draw({}, scene, { beat, beatP: 0.5, cues }, api);
  return { labels, rects, colors };
}
test('coverage transforms each prompt before averaging', () => {
  assert.equal(promptCoverage([0.8, 0.2], 4).mean, 0.7944);
  assert(Math.abs(promptCoverage([0.99, 0.05], 4).mean - 0.59274687) < 1e-12);
  assert.notEqual(promptCoverage([0.99, 0.05], 4).mean, 1 - (1 - 0.52) ** 4);
  assert.throws(() => promptCoverage([NaN], 4), RangeError);
});
test('raw KV counts KV heads and each shared prompt only once', () => {
  assert.equal(
    rawKVBytes({ layers: 32, kvHeads: 8, width: 128, scalarBytes: 2, positions: 1 }),
    131072,
  );
  const all = retainedBranchLedger(6),
    kept = retainedBranchLedger(4);
  assert.equal(all.positions, 6000);
  assert.equal(kept.positions, 5000);
  assert.equal(all.gib, 0.274658203125);
  assert.equal(kept.gib, 0.2288818359375);
  assert(!all.fits);
  assert(kept.fits);
  assert.equal(all.promptOwners, 1);
  assert.equal(kept.promptOwners, 1);
  assert.equal(all.selected, kept.selected);
  assert.equal(kept.verifiedAnswer, 6000);
  assert.equal(all.spentTokens, kept.spentTokens);
  assert.equal(kept.spentTokens, 3000);
  assert.equal(kept.spentScoreCalls, 6);
  assert.throws(() => retainedBranchLedger(3), RangeError);
});
test('router applies both requirements before comparing cost and has an empty fallback', () => {
  const rows = [
    { id: 'cheap', quality: 0.83, latency: 100, cost: 0.001 },
    { id: 'slow', quality: 0.95, latency: 1100, cost: 0.002 },
    { id: 'fits', quality: 0.86, latency: 780, cost: 0.01 },
  ];
  assert.equal(chooseFeasible(rows).id, 'fits');
  assert.equal(chooseFeasible(rows.slice(0, 2)), null);
});
test('request work leaves the frozen learned artifact unchanged', () => {
  assert.deepEqual(
    testTimeCoreFrame('train-time-axis', { beat: 2, beatP: 0.1 }).weights,
    testTimeCoreFrame('train-time-axis', { beat: 2, beatP: 0.9 }).weights,
  );
  assert.equal(testTimeCoreFrame('train-time-axis').processed, 40e9);
  assert.equal(testTimeCoreFrame('train-time-axis').flops, 7.2e20);
  assert(validateModel());
});
test('provider subtraction and charge wait for their complete result clauses', () => {
  assert(
    !paint('provider-usage', 0, { 'tt-visible-count': during }).labels.some((s) =>
      s.includes('180 visible'),
    ),
  );
  assert(
    paint('provider-usage', 0, { 'tt-visible-count': after }).labels.some((s) =>
      s.includes('180 visible'),
    ),
  );
  assert(
    !paint('provider-usage', 1, { 'tt-output-charge': during }).labels.some((s) =>
      s.includes('$0.014'),
    ),
  );
  assert(
    paint('provider-usage', 1, { 'tt-output-charge': after }).labels.some((s) =>
      s.includes('$0.014'),
    ),
  );
});
test('fresh answer choice, exact geometry and overflow are independent completed results', () => {
  const p = paint('fresh-branch-repair', 2, {
    'tt-fresh-candidate': during,
    'tt-fresh-geometry': during,
    'tt-fresh-overflow': during,
  });
  assert(
    !p.labels.some(
      (s) => s.includes('accept C3') || s.includes('49,152') || s.includes('0.274658'),
    ),
  );
  assert(!p.rects.some((r) => r[1] === 880));
  const q = paint('fresh-branch-repair', 2, {
    'tt-fresh-candidate': after,
    'tt-fresh-geometry': after,
    'tt-fresh-overflow': after,
  });
  assert(q.labels.some((s) => s.includes('6000 → accept C3')));
  assert(q.labels.some((s) => s.includes('49,152')));
  assert(q.labels.some((s) => s.includes('0.274658')));
  assert(q.rects.some((r) => r[1] === 880));
});
test('releasing only the last two caches preserves the checked answer and waits for the new total', () => {
  const p = paint('fresh-branch-repair', 3, { 'tt-fresh-release': after, 'tt-fresh-fits': during });
  assert(!p.labels.some((s) => s.startsWith('C5 ·') || s.startsWith('C6 ·')));
  assert(p.labels.some((s) => s.startsWith('C3 ·')));
  assert(!p.labels.some((s) => s.includes('0.228882')));
  assert(!p.rects.some((r) => r[1] === 880));
  const q = paint('fresh-branch-repair', 3, { 'tt-fresh-release': after, 'tt-fresh-fits': after });
  assert(q.labels.some((s) => s.includes('5000 positions → 0.228882')));
});
test('cache release never refunds spent tokens or changes the original worksheet answer', () => {
  const p = paint('fresh-branch-repair', 4, { 'tt-fresh-spent': during });
  assert(!p.labels.some((s) => s.includes('Spent: 3000')));
  const q = paint('fresh-branch-repair', 4, { 'tt-fresh-spent': after });
  assert(q.labels.some((s) => s.includes('Spent: 3000 tokens · 6 scorer calls')));
  assert(q.labels.some((s) => s.includes('C3 = 6000') && s.includes('5000 positions')));
});
test('hidden-token clock uses milliseconds and separates both totals', () => {
  assert.deepEqual(testTimeCoreFrame('hidden-ttft').totals, [1780, 6580]);
  const p = paint('hidden-ttft', 1, { 'tt-clock-short': after, 'tt-clock-long': during });
  assert(p.labels.includes('1780 ms'));
  assert(!p.labels.includes('6580 ms'));
  assert(
    paint('hidden-ttft', 1, { 'tt-clock-short': after, 'tt-clock-long': after }).labels.includes(
      '6580 ms',
    ),
  );
});
test('releasing an unselected cache preserves the returned C3 owner', () => {
  const p = paint('work-ledger', 2, { 'tt-release-state': after });
  assert.equal(p.labels.filter((s) => s === 'C2').length, 1);
  assert.equal(p.labels.filter((s) => s === 'C3').length, 3);
});

test('latency numeric results do not announce the service verdict before its separate clause', () => {
  const p = paint('hidden-ttft', 1, {
    'tt-clock-short': after,
    'tt-clock-long': after,
    'tt-clock-service-verdict': during,
  });
  assert.equal(p.colors.find((x) => x.text === '1780 ms').color, 'cyan');
  assert.equal(p.colors.find((x) => x.text === '6580 ms').color, 'cyan');
  assert(!p.labels.some((x) => x.includes('128 fits; 512 exceeds')));
  const q = paint('hidden-ttft', 1, {
    'tt-clock-short': after,
    'tt-clock-long': after,
    'tt-clock-service-verdict': after,
  });
  assert.equal(q.colors.find((x) => x.text === '1780 ms').color, 'green');
  assert.equal(q.colors.find((x) => x.text === '6580 ms').color, 'pink');
  assert(q.labels.some((x) => x.includes('128 fits; 512 exceeds')));
});

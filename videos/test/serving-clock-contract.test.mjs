import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SERVING_COHORT,
  servingRequestMetrics,
  servingReceipt,
  servingClock,
  fixedPlayback,
  nearestRank,
  wilsonLower,
  servingGate,
  freshServingRows,
  freshServingState,
} from '../animations/serving-benchmarks.mjs';

test('a complete offered cohort retains terminal failures and rejects missing or duplicated identities', () => {
  const ids = SERVING_COHORT.map((r) => r.id);
  assert.throws(() => servingReceipt(SERVING_COHORT.slice(0, -1), [0, 2000], ids), /incomplete/);
  assert.throws(
    () => servingReceipt([...SERVING_COHORT, SERVING_COHORT[0]], [0, 2000], ids),
    /duplicate/,
  );
  const r = servingReceipt();
  assert.deepEqual([r.offered, r.success, r.qualified, r.horizon], [6, 5, 3, 2500]);
  const changed = SERVING_COHORT.map((r) => (r.id === 'r05' ? { ...r, quality: true } : r)),
    next = servingReceipt(changed);
  assert.equal(next.qualified, r.qualified + 1);
  assert.equal(next.horizon, r.horizon);
  assert.equal(next.offered, r.offered);
});
test('moving the actual send trades send-relative wait against lag while retaining the same first token', () => {
  let previous = servingClock(0);
  for (let i = 0; i <= 200; i++) {
    const r = servingClock(i / 200);
    assert.equal(r.first, 1050);
    assert.equal(r.ttft + r.lag, 290);
    assert(r.sent >= previous.sent);
    assert.equal(r.valid, r.lag <= 20);
    previous = r;
  }
  assert.equal(servingClock(15 / 35).valid, true);
  assert.equal(servingClock(16 / 35).valid, false);
  const one = servingRequestMetrics({ ...SERVING_COHORT[1], tokens: [295] });
  assert.equal(one.tpot, null);
  assert.equal(one.qualified, true);
});
test('fixed playback preserves event order instead of equating a mean gap with all deadlines passing', () => {
  const smooth = fixedPlayback([100, 150, 200, 250], 120, 60),
    stall = fixedPlayback([100, 110, 120, 250], 120, 60);
  assert.equal(smooth.meanTpot, stall.meanTpot);
  assert.equal(smooth.lateCount, 0);
  assert.equal(stall.lateCount, 0);
  const late = fixedPlayback([100, 110, 250, 250], 120, 60);
  assert.equal(late.meanTpot, smooth.meanTpot);
  assert.equal(late.lateCount, 1);
  assert.equal(late.late[2], 10);
});
test('percentiles and Wilson gates retain their populations and the complete capacity conjunction', () => {
  assert.equal(
    nearestRank([...Array(90).fill(2), ...Array(6).fill(30), ...Array(4).fill(100)], 0.95),
    30,
  );
  assert.equal(nearestRank([2, 30, 100], 0.95), 100);
  for (const n of [7, 41, 333])
    assert(Math.abs(wilsonLower(n, n) - n / (n + 1.6448536269514722 ** 2)) < 1e-12);
  const rows = [
    { rps: 1, attainment: 0.96, backlog: 'flat' },
    { rps: 2, attainment: 0.99, backlog: 'growing' },
    { rps: 3, attainment: 0.99, backlog: 'flat', scheduleValid: false },
  ];
  assert.equal(servingGate(rows).rps, 1);
});
test('the earned ending withholds results before their own spoken cues and can be sampled out of order', () => {
  const before = { phase: 'before', progress: 0 },
    after = { phase: 'after', progress: 1 };
  assert.equal(freshServingState(0, 0.99).showAttainment, false);
  const cues = {
    'fresh-attainment': after,
    'fresh-qualified': before,
    'fresh-success': before,
    'fresh-offered': before,
  };
  const a = freshServingState(1, 0.99, cues);
  assert.equal(a.showAttainment, true);
  assert.equal(a.showQualified, false);
  assert.equal(a.showSuccess, false);
  assert.equal(a.showOffered, false);
  freshServingState(2, 0.8, { 'fresh-delay': after, 'fresh-restore': after });
  assert.deepEqual(freshServingState(1, 0.01, cues), freshServingState(1, 0.99, cues));
});
test('repairing only the send restores clock validity while leaving the failed service promise unchanged', () => {
  const after = { phase: 'after', progress: 1 },
    before = { phase: 'before', progress: 0 };
  const delayed = freshServingState(2, 0.1, { 'fresh-delay': after, 'fresh-restore': before }),
    restored = freshServingState(2, 0.1, { 'fresh-delay': after, 'fresh-restore': after });
  assert.equal(delayed.rows[1].tokens[0], restored.rows[1].tokens[0]);
  assert.equal(delayed.rows[1].sent - restored.rows[1].sent, 45);
  assert.equal(delayed.receipt.scheduleValid, false);
  assert.equal(restored.receipt.scheduleValid, true);
  assert.equal(delayed.receipt.attainment, 0.75);
  assert.equal(restored.receipt.attainment, 0.75);
  assert.equal(restored.receipt.capacity, null);
  assert.deepEqual(servingReceipt(freshServingRows(), [0, 2500]), restored.receipt);
});

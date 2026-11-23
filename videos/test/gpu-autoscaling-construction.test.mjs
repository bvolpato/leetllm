import test from 'node:test';
import assert from 'node:assert/strict';
import {
  tokenTiming,
  pagedAllocation,
  autoscaleMemory,
  autoscaleHybrid,
  refillSchedule,
  finiteWarmBurst,
  warmPrediction,
  bandwidthWorksheet,
  serviceTrial,
  greedyPrefixExample,
} from '../animations/gpu-autoscaling.mjs';
const before = { phase: 'before', progress: 0 },
  after = { phase: 'after', progress: 1 };

test('recorded output events cannot reconstruct unobserved individual token gaps', () => {
  assert.deepEqual(tokenTiming(0, [300, 340, 380, 500]), {
    ttft: 300,
    gaps: [40, 40, 120],
    tpot: 200 / 3,
  });
  assert.deepEqual(tokenTiming(0, [300]), { ttft: 300, gaps: [], tpot: null });
  for (const [start, times] of [
    [0, [300, 299]],
    [true, [3]],
    [0, [Infinity]],
    [-1e308, [1e308]],
  ])
    assert.throws(() => tokenTiming(start, times));
});
test('physical page slack is computed per sequence before aggregation', () => {
  const r = pagedAllocation([320, 75, 900, 250]);
  assert.deepEqual(
    r.rows.map((x) => x.blocks),
    [20, 5, 57, 16],
  );
  assert.equal(r.blocks, 98);
  assert.equal(r.slots, 1568);
  assert.equal(r.slack, 23);
  assert.notEqual(r.blocks, Math.ceil(r.tokens / 16));
});
test('growing attention state and fixed recurrent lower bound retain their own shapes', () => {
  const dense = autoscaleMemory(),
    hybrid = autoscaleHybrid();
  assert.equal(dense.kv, 4 * 2 ** 30);
  assert.equal(hybrid.kv, 2 * 2 ** 30);
  assert.equal(hybrid.recurrentPerRequest, 144 * 2 ** 20);
  assert.equal(hybrid.recurrent, 4 * hybrid.recurrentPerRequest);
  assert.ok(Math.abs(hybrid.total / 1e9 - 65.2641829376) < 1e-10);
});
test('refill advances queued identities without pretending the completed short request remains active', () => {
  const a = refillSchedule(),
    b = refillSchedule(true);
  assert.deepEqual([a.makespan, a.empty, b.makespan, b.empty], [13, 8, 10, 2]);
  assert.equal(a.rows.find((r) => r.id === 'R2').end, 2);
  assert.equal(a.rows.find((r) => r.id === 'R3').start, 8);
  assert.equal(b.rows.find((r) => r.id === 'R3').start, 2);
  assert.equal(b.rows.find((r) => r.id === 'R4').start, 7);
  assert.deepEqual(
    b.rows.map((r) => r.id),
    ['R1', 'R2', 'R3', 'R4'],
  );
});
test('finite burst uses inclusive admission waves and preserves all expired requests', () => {
  for (const [deadline, warm, expected] of [
    [18, 4, [64, 8, 5]],
    [18, 5, [72, 0, 5]],
    [12, 5, [60, 12, 6]],
    [12, 6, [72, 0, 6]],
  ]) {
    const r = finiteWarmBurst({ deadline, warm });
    assert.deepEqual([r.admitted, r.expired, r.minimum], expected);
    assert.equal(r.rows.length, 72);
    assert.equal(new Set(r.rows.map((r) => r.id)).size, 72);
    assert.ok(r.rows.filter((r) => !r.expired).every((r) => r.start <= deadline));
  }
});
test('fresh prediction and each repair wait for their own completed spoken clause', () => {
  const question = warmPrediction({ beat: 0, beatP: 0.99 });
  assert.equal(question.answer, null);
  assert.equal(question.comparisonVisible, false);
  const partial = warmPrediction({
    beat: 1,
    beatP: 0.99,
    cues: { 'ga-fresh-four': after, 'ga-fresh-five': before },
  });
  assert.equal(partial.answer, null);
  assert.equal(partial.comparisonVisible, true);
  assert.equal(partial.comparison.expired, 8);
  const repaired = warmPrediction({ beat: 1, beatP: 0, cues: { 'ga-fresh-five': after } });
  assert.equal(repaired.answer, 5);
  const changed = warmPrediction({
    beat: 2,
    beatP: 0.99,
    cues: { 'ga-fresh-five-short': after, 'ga-fresh-six': before },
  });
  assert.equal(changed.answer, null);
  assert.equal(changed.comparison.expired, 12);
  const final = warmPrediction({ beat: 2, beatP: 0, cues: { 'ga-fresh-six': after } });
  assert.equal(final.answer, 6);
  assert.deepEqual(warmPrediction({ beat: 0, beatP: 0.99 }), question);
});
test('bandwidth fit and useful service attainment remain different numerical screens', () => {
  const m = bandwidthWorksheet(27);
  assert.ok(Math.abs(m.milliseconds - (27 / 3350) * 1000) < 1e-12);
  assert.ok(Math.abs(m.tps - 3350 / 27) < 1e-12);
  const a = serviceTrial(160, 148, 20),
    b = serviceTrial(200, 178, 20);
  assert.deepEqual(a, { offeredRPS: 8, qualifiedRPS: 7.4, attainment: 0.925 });
  assert.equal(b.attainment, 0.89);
  assert.ok(b.qualifiedRPS > a.qualifiedRPS);
  assert.equal(b.attainment >= 0.9, false);
});

test('the first greedy correction stops commitment before later supplied target choices', () => {
  const r = greedyPrefixExample(
    ['The', 'deploy', 'is', 'safe'],
    ['The', 'deploy', 'was', 'blocked'],
  );
  assert.deepEqual(r, { accepted: 2, correction: 'was', committed: ['The', 'deploy', 'was'] });
  assert.deepEqual(greedyPrefixExample(['a', 'b'], ['z', 'future']).committed, ['z']);
  assert.deepEqual(greedyPrefixExample(['a', 'b'], ['a', 'b']), {
    accepted: 2,
    correction: null,
    committed: ['a', 'b'],
  });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  budgetStep,
  prefixReuse,
  kvHandoff,
  freshHandoff,
  reclamationState,
  speculativeState,
  speculativeCostState,
} from '../animations/deep-dive-sglang.mjs';
const before = { phase: 'before', progress: 0 },
  after = { phase: 'after', progress: 1 };
const cues = (names, phase = after) => Object.fromEntries(names.map((n) => ['sg-' + n, phase]));
test('mixed steps charge fresh inputs and retain a selected output outside the processed KV', () => {
  const one = budgetStep({ decode: 1, unmatched: 9, budget: 6 }),
    two = budgetStep({ decode: 1, unmatched: one.remaining, budget: 6 });
  assert.deepEqual(one, { decode: 1, prefill: 5, spent: 6, remaining: 4 });
  assert.equal(two.spent, 5);
  assert.equal(two.remaining, 0);
  const verified = speculativeState(2, 0, {
    'speculate-commit-prefix': after,
    'speculate-beat-3-focus-1': after,
  });
  assert.equal(verified.committed.length, 6);
  assert.equal(verified.cache.length, 5);
  assert.equal(verified.pendingForward, 'lake');
  assert.throws(() => budgetStep({ decode: 7, unmatched: 9, budget: 6 }), /invalid/);
});
test('page alignment never repairs an incompatible cache namespace', () => {
  const words = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  assert.deepEqual(prefixReuse(words, words, 'A', 'A', 4), { logical: 7, aligned: 4, reusable: 4 });
  assert.deepEqual(prefixReuse(words, words, 'A', 'B', 4), { logical: 7, aligned: 4, reusable: 0 });
  assert.equal(prefixReuse(words, ['A', 'X', 'C', 'D'], 'A', 'A', 1).reusable, 1);
});
test('complete bytes, current attempt, compatible layout and reader-ready event are all required', () => {
  const valid = {
    reserved: 512,
    received: 512,
    currentAttempt: 8,
    readyAttempt: 8,
    readerReady: true,
  };
  assert.equal(kvHandoff(valid).canDecode, true);
  for (const change of [
    { received: 384 },
    { readyAttempt: 7 },
    { readerReady: false },
    { model: false },
    { layout: false },
    { dtype: false },
    { positions: false },
  ])
    assert.equal(kvHandoff({ ...valid, ...change }).canDecode, false);
  assert.throws(() => kvHandoff({ ...valid, received: 513 }), /inventory/);
});
test('the last GPU reader must complete before owner release makes the segment evictable', () => {
  const pending = reclamationState({
    beat: 1,
    beatP: 0.9,
    cues: { ...cues(['reader-complete'], before), ...cues(['owner-release', 'reclaim']) },
  });
  assert.deepEqual(pending.owners, ['R1']);
  assert.equal(pending.evictable, false);
  assert.equal(pending.reclaimed, 0);
  const eligible = reclamationState({
    beat: 1,
    beatP: 0,
    cues: { ...cues(['reader-complete', 'owner-release']), ...cues(['reclaim'], before) },
  });
  assert.equal(eligible.evictable, true);
  assert.equal(eligible.reclaimed, 0);
  const reclaimed = reclamationState({
    beat: 1,
    beatP: 0,
    cues: cues(['reader-complete', 'owner-release', 'reclaim']),
  });
  assert.equal(reclaimed.reclaimed, 1);
});
test('the prediction has no answer before the reveal and a partial B repair leaves A reuse at zero', () => {
  const initial = freshHandoff({ beat: 0, beatP: 1 });
  assert.equal(initial.reuseShown, false);
  assert.equal(initial.missingShown, false);
  assert.equal(initial.decode, false);
  assert.equal(initial.receivedMiB, 64);
  const notReady = freshHandoff({
    beat: 1,
    beatP: 1,
    cues: {
      ...cues(['fresh-zero', 'fresh-missing', 'fresh-fill']),
      ...cues(['fresh-ready', 'fresh-decode'], before),
    },
  });
  assert.equal(notReady.receivedMiB, 96);
  assert.equal(notReady.ready, false);
  assert.equal(notReady.canDecode, false);
  const done = freshHandoff({
    beat: 1,
    beatP: 0,
    cues: cues(['fresh-zero', 'fresh-missing', 'fresh-fill', 'fresh-ready', 'fresh-decode']),
  });
  assert.equal(done.decode, true);
  assert.equal(done.reusable, 0);
  assert.equal(done.missingMiB, 0);
});
test('arbitrary-time samples are deterministic and never retain a later completed transfer', () => {
  const middle = {
    beat: 1,
    beatP: 0.9,
    cues: {
      ...cues(['fresh-zero', 'fresh-missing']),
      ...cues(['fresh-fill', 'fresh-ready', 'fresh-decode'], before),
    },
  };
  const a = freshHandoff(middle);
  freshHandoff({ beat: 2, beatP: 1 });
  assert.deepEqual(freshHandoff({ ...middle, beatP: 0.01 }), a);
});

test('six advanced positions do not reveal the later cost totals before their own clauses', () => {
  const supplied = {
    ...cues(['speculative-economics-beat-1', 'spec-cost']),
    ...cues(['spec-thirteen', 'spec-twentyfour', 'spec-zero'], before),
  };
  const x = speculativeCostState({ beat: 1, beatP: 0.99, cues: supplied });
  assert.equal(x.givens, true);
  assert.equal(x.advanced, 6);
  assert.equal(x.showCycle, false);
  assert.equal(x.showOrdinary, false);
  const total = speculativeCostState({
    beat: 1,
    beatP: 0.01,
    cues: { ...supplied, ...cues(['spec-thirteen']) },
  });
  assert.equal(total.showCycle, true);
  assert.equal(total.showOrdinary, false);
  const comparison = speculativeCostState({
    beat: 1,
    beatP: 0,
    cues: { ...supplied, ...cues(['spec-thirteen', 'spec-twentyfour']) },
  });
  assert.equal(comparison.showOrdinary, true);
});

test('the zero-acceptance comparison waits until its changed premise is spoken', () => {
  const s = {
    beat: 1,
    beatP: 0,
    cues: {
      ...cues(['speculative-economics-beat-1', 'spec-cost', 'spec-thirteen', 'spec-twentyfour']),
      ...cues(['spec-zero'], { phase: 'during', progress: 0.3 }),
    },
  };
  assert.equal(speculativeCostState(s).advanced, 6);
  assert.equal(speculativeCostState(s).showOrdinary, true);
  s.cues['sg-spec-zero'] = after;
  assert.equal(speculativeCostState(s).advanced, 1);
});

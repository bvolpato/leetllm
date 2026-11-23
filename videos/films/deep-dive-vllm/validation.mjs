import { reuse } from './arithmetic.mjs';
import { r0, r1, sharedPrefix } from './fixtures.mjs';
import {
  budgetTrace,
  goodputReceiptState,
  lifetimeTrace,
  sampleModel,
  vvState,
} from './construction.mjs';
import { references, schedule, vvReleaseRequest, vvTouchAllocate } from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.equal(budgetTrace(0, 0).consumed, 0);
  assert.equal(budgetTrace(0, 1).consumed, 5);
  assert.equal(budgetTrace(1, 1).consumed, 9);
  assert.equal(lifetimeTrace(1, 0.1).refs.get(41), 1);
  assert.equal(lifetimeTrace(1, 0.9).refs.has(41), false);
  assert.equal(lifetimeTrace(2, 0.9).refs.get(41), 1);
  assert.deepEqual(
    schedule().map((row) => [row.r0Decode, row.r1Prefill, row.r1Decode, row.used, row.left]),
    [
      [1, 5, 0, 6, 4],
      [1, 4, 0, 5, 0],
      [1, 0, 1, 2, 0],
    ],
  );
  assert.equal(schedule(5)[0].left, 0);
  assert.equal(reuse(6, 9), 4);
  assert.equal(reuse(8, 8), 4);
  assert.equal(
    sampleModel('prefix', {
      beat: 2,
      beatP: 0.1,
    }).reused,
    4,
  );
  assert.equal(
    sampleModel('prefix', {
      beat: 2,
      beatP: 0.8,
    }).reused,
    0,
  );
  assert.equal(
    sampleModel('prefix', {
      beat: 2,
      beatP: 0.8,
    }).compute,
    9,
  );
  assert(
    !references(
      sampleModel('prefix', {
        beat: 2,
        beatP: 0.8,
      }).tables,
    ).has(73),
  );
  assert.equal(sharedPrefix, 6);
  assert.deepEqual(r0.slice(0, 4), r1.slice(0, 4));
  assert.notDeepEqual(r0.slice(4, 8), r1.slice(4, 8));
  for (let b = 0; b < 3; b++) {
    const s = sampleModel('lifetime', {
      beat: b,
      beatP: 0,
    });
    assert(s.free.every((slot) => !s.refs.has(slot)));
    assert.equal(s.refs.get(12), b === 0 ? 2 : 1);
  }
  assert.equal(
    sampleModel('lifetime', {
      beat: 2,
      beatP: 0,
    }).oldHash,
    false,
  );
  assert.equal(
    sampleModel('admission', {
      beat: 0,
      beatP: 0,
    }).admitted,
    false,
  );
  assert.equal(
    sampleModel('admission', {
      beat: 1,
      beatP: 0,
    }).admitted,
    true,
  );
  assert.equal(
    sampleModel('admission', {
      beat: 2,
      beatP: 0,
    }).admitted,
    false,
  );
  assert.deepEqual(
    sampleModel('goodput', {
      beat: 0,
      beatP: 0,
    }).rows.map((row) => row.goodput),
    [5.5, 7.52],
  );
  const cue = (phase, progress = phase === 'before' ? 0 : 1) => ({
    phase,
    progress,
  });
  for (const progress of [0, 0.2, 0.5, 0.8, 1]) {
    const current = budgetTrace(0, 0, {
      'budget-active-decode': cue('after'),
      'budget-first-prompt-slice': cue('during', progress),
      'budget-first-return': cue('before'),
    });
    assert.equal(current.consumed, current.prefillCompleted);
    assert.equal(current.left + current.consumed, 9);
    assert.equal(current.completed, 0);
    assert.equal(current.assigned, 1 + Math.ceil(5 * progress));
    assert(current.assigned <= 6);
  }
  for (const [phase, assigned] of [
    ['before', false],
    ['during', false],
    ['after', true],
  ]) {
    const current = lifetimeTrace(2, 0, {
      'lifetime-pop': cue('after'),
      'lifetime-remove-old-hash': cue('after'),
      'lifetime-assign-live-reference': cue(phase),
    });
    assert.equal(current.refs.get(12), 1);
    assert.equal(current.refs.get(41) ?? 0, Number(assigned));
    assert.equal(current.oldHash, false);
    assert.equal(current.free, false);
  }
  const before = lifetimeTrace(2, 0, {
    'lifetime-remove-old-hash': cue('before'),
    'lifetime-assign-live-reference': cue('before'),
  });
  assert(before.oldHash && before.free && !before.assigned);
  const receipts = goodputReceiptState(1, {
    'goodput-divide-window': cue('before'),
  });
  assert.equal(receipts.rateReady, false);
  for (const row of receipts.rows) {
    assert.equal(row.complete + row.unfinishedOrFailed, row.offered);
    assert.equal(row.passed + row.outsideLimits, row.complete);
    assert.equal(row.goodput, row.passed / receipts.window);
    assert(row.wrong > row.goodput);
  }
  for (const phase of ['before', 'after']) {
    const current = sampleModel('prefix', {
      beat: 2,
      beatP: 0,
      cues: {
        'prefix-config-change': cue(phase),
      },
    });
    assert.equal(current.reused, phase === 'before' ? 4 : 0);
    assert.equal(current.compute + current.reused, 9);
    assert.deepEqual(current.tables.R0, [12, 41]);
  }
  vvValidate();
  return true;
}
export function vvValidate() {
  assert.deepEqual(
    vvTouchAllocate(
      [71, 55, 9],
      {
        71: 0,
        55: 0,
        9: 0,
      },
      9,
    ),
    {
      free: [55],
      refs: {
        71: 1,
        55: 0,
        9: 1,
      },
      allocated: 71,
    },
  );
  let a = vvTouchAllocate(
      [42, 18, 67, 5],
      {
        42: 0,
        18: 0,
        67: 0,
        5: 0,
      },
      67,
      false,
    ),
    b = vvTouchAllocate(a.free, a.refs, 67);
  assert.deepEqual(b.free, [18, 5]);
  assert.equal(b.refs[67], 2);
  const r = vvReleaseRequest(
    {
      R1: [12, 73, 90],
      R2: [41],
    },
    new Set([12, 73, 41]),
    'R1',
  );
  assert.deepEqual(r.free, [90, 73, 12]);
  assert.equal(r.refs.get(41), 1);
  assert.equal(reuse(8, 8), 4);
  assert.equal(reuse(10, 13), 8);
  assert.equal(Math.ceil((13 - reuse(10, 13)) / 4), 2);
  for (const [beat, skipped, inputs, newBlocks] of [
    [1, 0, 14, 4],
    [3, 8, 6, 2],
  ]) {
    const proposal = vvState('fresh-admission', { beat, beatP: 1 });
    assert.equal(proposal.skipped, skipped);
    assert.equal(proposal.used, inputs);
    assert.equal(proposal.blocks, newBlocks);
    assert.equal(proposal.admitted, inputs <= 14 && newBlocks <= 3);
  }
  assert.deepEqual(
    schedule(9, 6)
      .slice(0, 2)
      .map((step) => 2 + step.used),
    [8, 7],
  );
  assert.equal(2 + schedule(9, 10)[0].used, 12);
  return true;
}

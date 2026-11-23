import { features } from './arithmetic.mjs';
import { parallel, serial, texts } from './fixtures.mjs';
import { eighteen, nineteen, recorded, replay, replayFortyOne, results } from './ledger.mjs';
import { retryTrace, sampleModel } from './construction.mjs';
import {
  rayApplyBatch,
  rayBackpressure,
  rayObjectLoss,
  rayPlacement,
  rayResources,
  windowTrace,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.equal(Math.max(...parallel.map((e) => e.end)), 5);
  assert.equal(Math.max(...serial.map((e) => e.end)), 9);
  assert.equal(new Set(parallel.map((e) => e.id)).size, 3);
  assert.deepEqual(texts.map(features), [
    [10, 56],
    [10, 47],
    [14, 32],
  ]);
  assert.equal(
    sampleModel('placement', {
      beat: 1,
      beatP: 0,
    }).feasible,
    false,
  );
  assert.deepEqual(
    sampleModel('placement', {
      beat: 2,
      beatP: 0,
    }).assigned,
    [4, 0],
  );
  for (let i = 0; i < 16; i++) {
    const s = windowTrace(i);
    assert(s.pending.length <= 3);
    assert.equal(s.admitted - s.consumed, s.pending.length);
  }
  assert.equal(
    sampleModel('restart', {
      beat: 1,
      beatP: 0,
    }).count,
    0,
  );
  assert.equal(
    sampleModel('restart', {
      beat: 2,
      beatP: 0,
    }).count,
    0,
  );
  assert.equal(
    sampleModel('restart', {
      beat: 2,
      beatP: 0.5,
      cues: {
        'restart-load-durable-ledger': {
          phase: 'after',
          progress: 1,
        },
      },
    }).count,
    3,
  );
  assert.equal(retryTrace(0, 0).count, 0);
  assert.equal(retryTrace(0, 3 / 18.888).count, 1);
  assert.equal(retryTrace(0, 10 / 18.888).count, 2);
  assert.equal(retryTrace(1, 5.39 / 17.352).record, null);
  assert.deepEqual(retryTrace(1, 5.41 / 17.352).record, {
    batch: 'B17',
    result: 1,
  });
  assert.equal(retryTrace(1, 8 / 17.352).count, 1);
  assert.equal(retryTrace(1, 8 / 17.352).hit, true);
  assert.equal(retryTrace(2, 0).count, 1);
  assert.equal(
    sampleModel('references', {
      beat: 1,
      beatP: 0.5,
      cues: {
        'references-beat-2-focus-1': {
          phase: 'before',
        },
      },
    }).copies,
    1,
  );
  assert.equal(
    sampleModel('references', {
      beat: 1,
      beatP: 0.5,
      cues: {
        'references-beat-2-focus-1': {
          phase: 'during',
          progress: 0.5,
        },
      },
    }).copies,
    2,
  );
  assert.equal(
    sampleModel('references', {
      beat: 2,
      beatP: 0.5,
      cues: {
        'references-beat-3-focus-1': {
          phase: 'during',
        },
      },
    }).ownerLost,
    true,
  );
  validateRayNew();
  return true;
}
export function validateRayNew() {
  assert.deepEqual(results, [
    [5, 96],
    [6, 67],
    [5, 22],
  ]);
  assert.deepEqual([recorded.count, eighteen.result, nineteen.result], [3, 5, 6]);
  assert.deepEqual([replay.result, replay.ledger.count, replay.changed], [5, 6, false]);
  assert.deepEqual(
    [replayFortyOne.result, replayFortyOne.ledger.count, replayFortyOne.changed],
    [5, 8, false],
  );
  assert.equal(rayResources(2, [1, 1]).childFits, false);
  assert.equal(rayResources(4, [1, 1]).free, 2);
  assert.equal(rayPlacement([2, 2], [1, 1, 1, 1], 'STRICT_PACK').ready, false);
  assert.equal(rayPlacement([2, 2], [1, 1, 1, 1], 'PACK').ready, true);
  assert.equal(rayPlacement([3, 3], [1, 1, 1, 1], 'STRICT_SPREAD').ready, false);
  assert.equal(rayPlacement([2, 2], [4], 'PACK').ready, false);
  const l = {
      count: 3,
      records: {
        B17: 3,
      },
    },
    a = rayApplyBatch(l, 'B18', 2),
    z = rayApplyBatch(a.ledger, 'B19', 1),
    r = rayApplyBatch(z.ledger, 'B18', 2);
  assert.equal(r.result, 5);
  assert.equal(r.ledger.count, 6);
  assert.equal(r.changed, false);
  assert.equal(l.count, 3);
  assert.equal(
    rayObjectLoss({
      ownerAlive: false,
      copies: 1,
      lineage: true,
    }).status,
    'OwnerDiedError',
  );
  assert.equal(
    rayObjectLoss({
      ownerAlive: true,
      copies: 0,
      lineage: false,
    }).usable,
    false,
  );
  for (let i = 0; i < 25; i++) {
    const t = rayBackpressure(i);
    assert(t.pending.length <= 3);
    assert.equal(t.submitted - t.consumed.length, t.pending.length);
  }
  assert.equal(rayBackpressure(3).submitted, 3);
  assert.equal(rayBackpressure(3).ready.length, 3);
  assert.equal(rayBackpressure(4).submitted, 4);
  return true;
}

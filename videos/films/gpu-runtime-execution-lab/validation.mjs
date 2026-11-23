import {
  eventOverlap,
  graphCost,
  paddingEffects,
  pipeline,
  replayOwnership,
  schedule,
} from './arithmetic.mjs';
import { queueState, sampleModel } from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.equal(pipeline([1, 2, 3, 4]).result, 164);
  assert.deepEqual(
    Object.values(schedule(true)).map((o) => [o.start, o.end]),
    [
      [0, 3],
      [3, 7],
      [7, 9],
      [9, 10],
    ],
  );
  assert(schedule(false).affine.start < schedule(false).copy.end);
  assert.equal(graphCost(2000).eager, graphCost(2000).graph);
  assert(graphCost(2001).graph < graphCost(2001).eager);
  assert.deepEqual(
    eventOverlap(0.5)
      .operations.filter((row) => row.start < 5 && row.end > 5)
      .map((row) => row.id),
    ['affine', 'independent'],
  );
  assert(eventOverlap(1).operations.every((row) => row.shownEnd === row.end));
  assert.equal(replayOwnership(0.4).overwritten, false);
  assert.equal(replayOwnership(0.5).readReceipt, 4);
  assert.equal(replayOwnership(1).storedValue, 36);
  assert.equal(replayOwnership(1).readReceipt, 4);
  assert.equal(paddingEffects(true, true).total, 454);
  assert.equal(paddingEffects(true, true).unauthorized.length, 2);
  assert.equal(paddingEffects(true, true, true).unauthorized.length, 0);
  assert.equal(paddingEffects(true, true, true).writes.length, 6);
  assert.equal(
    sampleModel('pointers', {
      beat: 0,
      beatP: 0.9,
    }).actual,
    164,
  );
  assert.equal(
    sampleModel('pointers', {
      beat: 1,
      beatP: 0.9,
    }).actual,
    4,
  );
  assert.equal(
    sampleModel('padding', {
      beat: 0,
      beatP: 0.99,
    }).total,
    null,
  );
  assert.equal(
    sampleModel('padding', {
      beat: 1,
      beatP: 0.12,
    }).transformed,
    'affine',
  );
  assert.equal(
    sampleModel('padding', {
      beat: 1,
      beatP: 0.5,
    }).total,
    456,
  );
  assert.equal(
    sampleModel('padding', {
      beat: 1,
      beatP: 0.8,
    }).total,
    454,
  );
  assert.equal(
    sampleModel('padding', {
      beat: 1,
      beatP: 0.8,
    })
      .outputs.slice(6)
      .reduce((a, b) => a + b),
    2,
  );
  const initial = sampleModel('workers', {
    beat: 0,
    beatP: 0.99,
  });
  assert.equal(initial.accepted, 4);
  assert.equal(initial.completed, 1);
  assert.equal(initial.released, 0);
  assert.equal(initial.pending, 2);
  assert.equal(initial.slots[0].state, 'COMPLETED');
  const full = sampleModel('workers', {
    beat: 1,
    beatP: 0.22,
  });
  assert.equal(full.owned, 4);
  assert.equal(full.pending, 2);
  assert.equal(full.released, 0);
  const resumed = sampleModel('workers', {
    beat: 1,
    beatP: 0.27,
  });
  assert.equal(resumed.slots[0].request, 5);
  assert.equal(resumed.slots[0].state, 'PUBLISHED');
  assert.equal(resumed.released, 1);
  const final = sampleModel('workers', {
    beat: 1,
    beatP: 0.99,
  });
  assert.equal(final.completed, 6);
  assert.equal(final.released, 6);
  assert.equal(final.owned, 0);
  assert.deepEqual(
    final.results.map(([id, value]) => [id, value]),
    [1, 2, 3, 4, 5, 6].map((id) => [id, (2 * id + 1) ** 2]),
  );
  assert.throws(() =>
    queueState([
      {
        type: 'release',
        slot: 0,
      },
    ]),
  );
  assert.throws(() =>
    queueState([
      {
        type: 'publish',
        slot: 0,
        request: 1,
      },
      {
        type: 'publish',
        slot: 0,
        request: 2,
      },
    ]),
  );
  assert.throws(() =>
    queueState([
      {
        type: 'publish',
        slot: 0,
        request: 1,
      },
      {
        type: 'claim',
        slot: 0,
        worker: 'W0',
      },
      {
        type: 'complete',
        slot: 0,
        worker: 'W1',
      },
    ]),
  );
  for (let beat = 0; beat < 2; beat++)
    for (let i = 0; i <= 100; i++) {
      const s = sampleModel('workers', {
        beat,
        beatP: i / 100,
      });
      assert(s.owned <= 4);
      assert.equal(s.owned, s.accepted - s.released);
      assert.equal(s.accepted + s.pending, 6);
      assert(s.released <= s.completed && s.completed <= s.accepted);
    }
  return true;
}

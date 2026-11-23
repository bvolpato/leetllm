import {
  activationBytes,
  addressReceipt,
  executionAt,
  memoryRequests,
  modeledCopySchedule,
  reduction,
  residentResources,
  roundedFormat,
  sharedTrace,
  threadMap,
  warmupTrace,
} from './arithmetic.mjs';
import { extendedValues, freshClock, freshRuntimeValues, ids, ticketClock, tokenValues } from './fixtures.mjs';
import { sampleModel } from './model.mjs';
import assert from 'node:assert/strict';
export function validateOriginalModel() {
  assert.deepEqual(
    reduction(tokenValues).blocks.map((block) => block.subtotal),
    [10, 11],
  );
  assert.equal(reduction(tokenValues).mean, 2.625);
  assert.deepEqual(
    reduction(extendedValues).blocks.map((block) => block.subtotal),
    [10, 11, 6],
  );
  assert.equal(reduction(extendedValues).mean, 2.7);
  for (const n of [1, 8, 10, 65])
    assert.deepEqual(
      threadMap(n)
        .flat()
        .filter((t) => t.valid)
        .map((t) => t.index),
      Array.from(
        {
          length: n,
        },
        (_, i) => i,
      ),
    );
  assert(
    reduction(extendedValues)
      .blocks.flatMap((b) => b.threads)
      .every((thread) => thread.reachesBarrier),
  );
  assert.equal(memoryRequests(1).footprint, 32);
  assert.equal(memoryRequests(32).footprint, 256);
  assert.equal(memoryRequests(32).maxDistinctWords, 8);
  assert.equal(memoryRequests(33).maxDistinctWords, 1);
  assert.equal(memoryRequests(0, true).maxDistinctWords, 1);
  assert.equal(sharedTrace(0.6, false).result, null);
  assert.equal(sharedTrace(2.1, false).readSlots, null);
  assert.equal(sharedTrace(2, true).result, null);
  assert.deepEqual(sharedTrace(2.1, true).readSlots, tokenValues.slice(0, 4));
  assert.equal(sharedTrace(2.1, true).result, 10);
  assert.equal(executionAt(2).scalar, null);
  assert.equal(executionAt(41).eventInterval, 40);
  assert.equal(executionAt(41).scalar, null);
  assert.equal(executionAt(42).scalar, 2.625);
  assert.equal(warmupTrace(21).mean, null);
  assert.equal(warmupTrace(22).mean, 8);
  assert.equal(warmupTrace(30).completed, 2);
  for (const id of ids)
    for (const beat of [0, 1, 2])
      for (const beatP of [0, 0.12, 0.5, 0.88, 1])
        sampleModel(id, {
          beat,
          beatP,
        });
  return true;
}
export function validateModel() {
  validateOriginalModel();
  assert.equal(roundedFormat(65519, 10, -14, 15), 65504);
  assert.equal(roundedFormat(65520, 10, -14, 15), Infinity);
  assert.equal(roundedFormat(70000, 10, -14, 15), Infinity);
  assert.equal(roundedFormat(70000, 7, -126, 127), 70144);
  assert.equal(roundedFormat(0.9999, 23, -126, 127), Math.fround(0.9999));
  assert(Math.fround(0.9999) < 1);
  assert.equal(roundedFormat(0.9999, 10, -14, 15), 1);
  assert.equal(roundedFormat(0.9999, 7, -126, 127), 1);
  assert.equal(
    activationBytes({
      batch: 32,
      tokens: 128,
      width: 768,
      bytes: 4,
    }),
    12 * 2 ** 20,
  );
  assert.equal(
    activationBytes({
      batch: 32,
      heads: 12,
      layers: 12,
      tokens: 2048,
      bytes: 2,
      scores: true,
    }),
    38654705664,
  );
  assert.equal(residentResources(16).occupancy, 0.5);
  assert.equal(residentResources(32).occupancy, 0.25);
  const overlapped = modeledCopySchedule(true);
  assert.deepEqual(overlapped.inputReady, { A: 3, B: 6 });
  assert.deepEqual(overlapped.computeReady, { A: 3, B: 10 });
  assert.equal(overlapped.completion, 17);
  assert.equal(modeledCopySchedule(false).completion, 20);
  assert.deepEqual(
    reduction(freshRuntimeValues, 8).blocks.map((b) => b.subtotal),
    [21, 14],
  );
  assert.equal(reduction(freshRuntimeValues, 8).total, 35);
  const ready = executionAt(freshClock.scalarAt, freshClock, freshRuntimeValues);
  assert.equal(executionAt(freshClock.eventEnd, freshClock, freshRuntimeValues).scalar, null);
  assert.equal(ready.eventInterval, 18);
  assert.equal(ready.hostInterval, 20);
  assert.equal(ready.scalar, Math.fround(35 / 13));
  const tenValues = executionAt(ticketClock.scalarAt, ticketClock, extendedValues);
  assert.equal(tenValues.scalar, 2.700000047683716);
  assert.equal(tenValues.scalar.toFixed(1), '2.7');
  const lanes = Array.from({ length: 32 }, (_, i) => i);
  const shifted = addressReceipt(lanes.map(i => 7 + i));
  assert.deepEqual(shifted.segments, [0, 1, 2, 3, 4]);
  assert.equal(shifted.footprint, 160);
  const column = addressReceipt(lanes.map(i => 34 * i));
  assert.equal(new Set(column.rows.map(row => row.bank)).size, 16);
  assert.equal(column.maxDistinctWords, 2);
  return true;
}

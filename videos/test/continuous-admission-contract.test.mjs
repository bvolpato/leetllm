import test from 'node:test';
import assert from 'node:assert/strict';
import {
  freshBatchingBoundary,
  pageCount,
  handoffTiming,
  highestPassingLoad,
} from '../animations/continuous-batching.mjs';

test('the identical boundary distinguishes free seats, fitting work and aged-request preemption', () => {
  const fifo = freshBatchingBoundary('fifo'),
    fit = freshBatchingBoundary('fit'),
    aged = freshBatchingBoundary('aged');
  assert.equal(fifo.active.length, 2);
  assert.equal(fifo.free.length, 2);
  assert.equal(fifo.needD, 3);
  assert.equal(fifo.admitted, null);
  assert.equal(fit.admitted, 'E');
  assert.equal(fit.active.length, 3);
  assert.equal(fit.needD, 3);
  assert.deepEqual(fit.C.pages, fifo.C.pages);
  assert.equal(aged.admitted, 'D');
  assert.equal(aged.paused, 'B');
  assert.deepEqual(aged.C.pages, fifo.C.pages);
  assert.deepEqual(aged.D.pages, [2, 3, 4]);
  assert.equal(aged.free.length, 0);
});

test('finished D keeps ownership until its readers finish at the safe boundary', () => {
  const pending = freshBatchingBoundary('aged', { completeD: true, readersDone: false }),
    retired = freshBatchingBoundary('aged', { completeD: true, readersDone: true });
  assert.deepEqual(pending.D.pages, [2, 3, 4]);
  assert.equal(pending.free.length, 0);
  assert.deepEqual(retired.C.pages, [0, 1]);
  assert.deepEqual(retired.D.pages, []);
  assert.deepEqual(retired.free, [2, 3, 4]);
  assert.equal(retired.scheduledInputs, 0);
});

test('each history rounds before allocation and invalid integer capacities are rejected', () => {
  assert.equal(pageCount(8, 8) + pageCount(8, 8), 2);
  assert.equal(pageCount(9, 8) + pageCount(9, 8), 4);
  assert.throws(() => pageCount(true, 8), /safe integers/);
  assert.throws(() => pageCount(9, 0), /safe integers/);
});

test('buffering relocates the exposed handoff delay and the load sweep selects only tested passes', () => {
  const h = handoffTiming({
    prefillQueue: 20,
    prefill: 60,
    handoff: 40,
    decodeQueue: 15,
    nextDecode: 10,
  });
  assert.equal(h.early.ttft <= 90, true);
  assert.equal(h.early.gap <= 30, false);
  assert.equal(h.buffered.ttft <= 90, false);
  assert.equal(h.buffered.gap <= 30, true);
  const selected = highestPassingLoad(
    [
      { rate: 4, attainment: 0.84 },
      { rate: 2, attainment: 0.95 },
      { rate: 3, attainment: 0.92 },
    ],
    0.9,
    2,
  );
  assert.equal(selected.rate, 3);
  assert.equal(selected.perGpu, 1.5);
  assert.equal(highestPassingLoad([{ rate: 4, attainment: 0.84 }], 0.9, 2), null);
});

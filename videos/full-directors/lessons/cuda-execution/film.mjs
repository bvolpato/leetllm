import assert from 'node:assert/strict';
import { board } from './bench.mjs';
import { timepiece, residence, setup, classifier, clocks, practice } from './ticket.mjs';
import { mapping, warps, coalescing, banks, storage, barrier } from './lanes.mjs';
import {
  adam,
  activation,
  precision,
  budget,
  controls,
  allocator,
  parameterBytes,
  scoreBytes,
  microLoss,
  targetLoss,
  fp16,
  bf16,
} from './memory.mjs';
import { copies, bound, occupancy, profiler, profileLayout, reporting, readWait } from './profile.mjs';
import {
  tokenValues,
  extendedValues,
  freshRuntimeValues,
  ticketClock,
  freshClock,
} from '../../../films/cuda-execution/fixtures.mjs';
import {
  threadMap,
  warpMap,
  memoryRequests,
  addressReceipt,
  reduction,
  sharedTrace,
  executionAt,
  warmupTrace,
  residentResources,
  modeledCopySchedule,
  cachedBlockRelease,
  roofline,
  roundedFormat,
  activationBytes,
  tileReuse,
} from '../../../films/cuda-execution/arithmetic.mjs';

const chapters = [
  timepiece,
  residence,
  setup,
  classifier,
  mapping,
  warps,
  coalescing,
  banks,
  storage,
  barrier,
  clocks,
  adam,
  activation,
  precision,
  budget,
  controls,
  allocator,
  copies,
  bound,
  occupancy,
  profiler,
  reporting,
  (v) => practice(v, false),
  (v) => practice(v, true),
];

function draw(ctx, clock) {
  const paint = chapters[clock.beat.chapterIndex];
  assert(paint, 'Unknown CUDA chapter');
  ctx.save();
  try {
    paint(board(ctx, clock));
  } finally {
    ctx.restore();
  }
}
function check() {
  const run = (t, clock = ticketClock, values = tokenValues) => executionAt(t, clock, values);
  assert.equal(run(2).returned, true);
  assert.equal(run(41).eventInterval, 40);
  assert.equal(run(41.99).scalar, null);
  assert.equal(run(42).scalar, 2.625);
  assert.equal(run(42).hostInterval, 42);
  assert.equal(warmupTrace(21.9).mean, null);
  assert.equal(warmupTrace(30).mean, 8);
  assert.equal(
    threadMap(10)
      .flat()
      .filter((x) => !x.valid).length,
    2,
  );
  assert.deepEqual(threadMap(8)[1][2], { block: 1, thread: 2, index: 6, valid: true });
  assert.deepEqual(
    warpMap([4, 4]).map((w) => w.block),
    [0, 1],
  );
  assert.deepEqual(
    warpMap([36]).map((w) => w.lanes.filter((x) => x !== null).length),
    [32, 4],
  );
  assert.equal(memoryRequests(32).segments.length, 8);
  assert.equal(memoryRequests(1).footprint, 32);
  for (const [stride, footprint] of [[1, 32], [32, 256]]) {
    const { receipt, loads } = profileLayout(stride);
    assert.deepEqual(receipt.rows.map((r) => r.address), tokenValues.map((_, i) => 4 * stride * i));
    assert.deepEqual(loads, tokenValues);
    assert.equal(receipt.footprint, footprint);
  }
  assert.equal(memoryRequests(33).maxDistinctWords, 1);
  assert.equal(memoryRequests(32).maxDistinctWords, 8);
  assert.equal(memoryRequests(32, true).maxDistinctWords, 1);
  const lanes = Array.from({ length: 32 }, (_, i) => i);
  assert.equal(addressReceipt(lanes.map((i) => i + 7)).footprint, 160);
  assert.equal(addressReceipt(lanes.map((i) => 34 * i)).maxDistinctWords, 2);
  assert.equal(sharedTrace(2.2, false).result, null);
  assert.equal(sharedTrace(2.2, true).result, 10);
  assert.equal(parameterBytes(7e9, 2, 2) / 1e9, 28);
  assert.equal(parameterBytes(7e9, 4, 4) / 1e9, 112);
  assert.equal(activationBytes({ batch: 32, tokens: 128, width: 768, bytes: 4 }), 12 * 2 ** 20);
  assert.deepEqual([scoreBytes(2, 8), scoreBytes(4, 4)], [128, 64]);
  assert.equal((scoreBytes(32, 2048, 12, 12, 2) / 1e9).toFixed(1), '38.7');
  assert.equal(microLoss([1, 9], 4), 2.5);
  const weighted = targetLoss([0, 1], [true, true]);
  assert.equal(microLoss([weighted.sums[0]], weighted.counts[0]), null);
  assert.equal(weighted.total, 1);
  assert.deepEqual(weighted.contributions, [0, Math.log(2)]);
  assert.equal(weighted.mean.toFixed(3), '0.693');
  const ignored = targetLoss([0, 1], [true, false]);
  assert.equal(ignored.total, 0);
  assert.deepEqual(ignored.contributions, [null, null]);
  assert.equal(ignored.mean, null);
  assert.equal(fp16(65519), 65504);
  assert.equal(fp16(65520), Infinity);
  assert.equal(fp16(0.9999), 1);
  assert.equal(bf16(0.9999), 1);
  assert.notEqual(Math.fround(0.9999), 1);
  assert.equal(bf16(70000), 70144);
  assert.equal(fp16(2 ** -25), 0);
  assert.equal(fp16(128 * 2 ** -25) / 128, 2 ** -25);
  assert.equal(roundedFormat(Math.fround(1.0001), 10, -126, 127), 1);
  assert.equal(cachedBlockRelease(1).allocated, 8);
  assert.equal(cachedBlockRelease(1).modeledDriver, 9);
  const overlap = modeledCopySchedule(true);
  assert.deepEqual([overlap.inputReady.B, overlap.computeReady.B, overlap.completion], [6, 10, 17]);
  assert.equal(modeledCopySchedule(false).completion, 20);
  assert.deepEqual(
    [0.25, 1, 4].map((i) => roofline(i).bound),
    [10, 40, 100],
  );
  assert.deepEqual(
    [16, 32].map((k) => residentResources(k).warps),
    [32, 16],
  );
  assert.equal(tileReuse(tokenValues, 2, true).globalLoads, 8);
  assert.deepEqual([2, 32].map(readWait), [40, 10]);
  const tail = reduction(extendedValues),
    last = reduction(freshRuntimeValues, 8);
  assert.equal(tail.denominator, 10);
  assert.equal(tail.blocks.at(-1).threads.filter((t) => !t.valid).length, 2);
  assert.equal(Math.fround(tail.mean), 2.700000047683716);
  assert.equal(last.blocks.flatMap((b) => b.threads).filter((t) => t.reachesBarrier).length, 16);
  assert.deepEqual(
    last.blocks.map((b) => b.subtotal),
    [21, 14],
  );
  assert.deepEqual([last.total, last.denominator], [35, 13]);
  const ready = run(24, freshClock, freshRuntimeValues);
  assert.equal(run(23, freshClock, freshRuntimeValues).scalar, null);
  assert.deepEqual([ready.scalar.toFixed(4), ready.eventInterval, ready.hostInterval], ['2.6923', 18, 20]);
}
export default { title: 'When Is a CUDA Result Ready?', draw, check };

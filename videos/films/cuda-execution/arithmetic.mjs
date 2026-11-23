import { ticketClock, tokenValues, writeTimes } from './fixtures.mjs';
import { clamp } from './construction.mjs';
import assert from 'node:assert/strict';
export const sum = (values) => values.reduce((total, value) => total + value, 0);
export function threadMap(length, width = 4) {
  return Array.from(
    {
      length: Math.ceil(length / width),
    },
    (_, block) =>
      Array.from(
        {
          length: width,
        },
        (_, thread) => ({
          block,
          thread,
          index: block * width + thread,
          valid: block * width + thread < length,
        }),
      ),
  );
}
export function warpMap(blockSizes) {
  return blockSizes.flatMap((threads, block) =>
    Array.from(
      {
        length: Math.ceil(threads / 32),
      },
      (_, warp) => ({
        block,
        warp,
        lanes: Array.from(
          {
            length: 32,
          },
          (_, lane) => (warp * 32 + lane < threads ? warp * 32 + lane : null),
        ),
      }),
    ),
  );
}
export function memoryRequests(stride, broadcast = false) {
  return addressReceipt(
    Array.from(
      {
        length: 8,
      },
      (_, lane) => (broadcast ? 0 : lane * stride),
    ),
  );
}
export function addressReceipt(words) {
  const rows = words.map((word, lane) => ({
    lane,
    word,
    address: word * 4,
    segment: Math.floor((word * 4) / 32),
    bank: word % 32,
  }));
  const segments = [...new Set(rows.map((row) => row.segment))],
    banks = new Map();
  for (const row of rows) {
    if (!banks.has(row.bank)) banks.set(row.bank, new Set());
    banks.get(row.bank).add(row.word);
  }
  return {
    rows,
    segments,
    requested: words.length * 4,
    footprint: segments.length * 32,
    maxDistinctWords: words.length
      ? Math.max(...[...banks.values()].map((words) => words.size))
      : 0,
  };
}
export function sharedTrace(time, barrier) {
  const slots = tokenValues.slice(0, 4).map((value, i) => (time >= writeTimes[i] ? value : null));
  const readAt = barrier ? 2.1 : 0.5,
    attempted = time >= readAt;
  // Only the synchronized read has defined values in CUDA.
  const ready = barrier && attempted;
  const readSlots = ready ? [...slots] : null;
  return {
    time,
    slots,
    arrivals: slots.filter((value) => value !== null).length,
    readAt,
    attempted,
    ready,
    readSlots,
    result: ready ? sum(readSlots) : null,
  };
}
export function reduction(values, width = 4) {
  const blocks = threadMap(values.length, width).map((threads) => ({
    threads: threads.map((thread) => ({
      ...thread,
      value: thread.valid ? values[thread.index] : 0,
      reachesBarrier: true,
    })),
    subtotal: sum(threads.map((thread) => (thread.valid ? values[thread.index] : 0))),
  }));
  return {
    blocks,
    total: sum(blocks.map((block) => block.subtotal)),
    denominator: values.length,
    mean: sum(values) / values.length,
  };
}
export function roofline(intensity) {
  const operations = 1000,
    bytes = operations / intensity;
  return {
    intensity,
    operations,
    bytes,
    bandwidth: 40,
    compute: 100,
    bound: Math.min(100, 40 * intensity),
  };
}
export function executionAt(time, clock = ticketClock, values = tokenValues) {
  const returned = time >= clock.hostReturn;
  const deviceComplete = time >= clock.eventEnd;
  const reported = time >= clock.scalarAt;
  return {
    time,
    submitted: Math.max(0, Math.min(clock.hostReturn, time) - clock.hostStart),
    deviceElapsed: Math.max(0, Math.min(clock.eventEnd, time) - clock.eventStart),
    returned,
    deviceComplete,
    reported,
    eventInterval: deviceComplete ? clock.eventEnd - clock.eventStart : null,
    hostInterval: reported ? clock.scalarAt - clock.hostStart : null,
    scalar: reported ? Math.fround(sum(values) / values.length) : null,
  };
}
export function warmupTrace(time) {
  const events = [
    {
      id: 'Warmup',
      start: 0,
      end: 14,
    },
    {
      id: 'Sample 1',
      start: 14,
      end: 22,
    },
    {
      id: 'Sample 2',
      start: 22,
      end: 30,
    },
  ];
  const completed = events.filter((event) => event.id !== 'Warmup' && event.end <= time);
  return {
    time,
    events,
    completed: completed.length,
    mean: completed.length
      ? sum(completed.map((event) => event.end - event.start)) / completed.length
      : null,
  };
}
export function roundedFormat(value, fractionBits, minimumExponent, maximumExponent) {
  assert(Number.isInteger(fractionBits) && fractionBits > 0 && fractionBits <= 52);
  assert(
    Number.isInteger(minimumExponent) &&
      Number.isInteger(maximumExponent) &&
      minimumExponent < maximumExponent,
  );
  if (!Number.isFinite(value) || value === 0) return value;
  const sign = Math.sign(value),
    magnitude = Math.abs(value);
  const exponent = Math.max(minimumExponent, Math.floor(Math.log2(magnitude)));
  if (exponent > maximumExponent) return sign * Infinity;
  const step = 2 ** (exponent - fractionBits),
    scaled = magnitude / step,
    lower = Math.floor(scaled),
    fraction = scaled - lower;
  const integer =
    fraction > 0.5 ? lower + 1 : fraction < 0.5 ? lower : lower % 2 ? lower + 1 : lower;
  const rounded = integer * step,
    maximum = (2 - 2 ** -fractionBits) * 2 ** maximumExponent;
  return rounded > maximum ? sign * Infinity : sign * rounded;
}
export function activationBytes({ batch, heads, layers, tokens, width, bytes, scores = false }) {
  for (const value of [batch, tokens, bytes, scores ? heads : width, scores ? layers : 1])
    assert(Number.isSafeInteger(value) && value > 0);
  const count = scores ? batch * heads * layers * tokens * tokens : batch * tokens * width;
  assert(Number.isSafeInteger(count * bytes));
  return count * bytes;
}
export function residentResources(sharedKiB) {
  assert(Number.isFinite(sharedKiB) && sharedKiB > 0);
  const warpsPerBlock = 256 / 32,
    registersPerBlock = 256 * 32;
  const registerBlocks = Math.floor(65536 / registersPerBlock),
    warpBlocks = Math.floor(64 / warpsPerBlock),
    sharedBlocks = Math.floor(64 / sharedKiB);
  const blocks = Math.min(registerBlocks, warpBlocks, sharedBlocks);
  return {
    warpsPerBlock,
    registersPerBlock,
    registerBlocks,
    warpBlocks,
    sharedBlocks,
    blocks,
    warps: blocks * warpsPerBlock,
    occupancy: (blocks * warpsPerBlock) / 64,
  };
}
export function modeledCopySchedule(overlap) {
  const copyDuration = 3, kernelDuration = 7;
  let copyFree = 0, computeFree = 0;
  const events = [], inputReady = {}, computeReady = {};
  for (const owner of ['A', 'B']) {
    const copyStart = overlap ? copyFree : Math.max(copyFree, computeFree);
    copyFree = copyStart + copyDuration;
    events.push({ id: 'copy ' + owner, owner, lane: 'copy', start: copyStart, end: copyFree });
    inputReady[owner] = copyFree;
    const kernelStart = Math.max(inputReady[owner], computeFree);
    computeFree = kernelStart + kernelDuration;
    computeReady[owner] = kernelStart;
    events.push({ id: 'compute ' + owner, owner, lane: 'compute', start: kernelStart, end: computeFree });
  }
  return { events, completion: computeFree, inputReady, computeReady };
}
export function allocatorAccounting(live, cached, external) {
  for (const x of [live, cached, external]) assert(Number.isFinite(x) && x >= 0);
  return {
    allocated: live,
    reserved: live + cached,
    modeledDriver: live + cached + external,
  };
}
export function tileReuse(values, passes, shared) {
  assert(Array.isArray(values) && values.length && values.every(Number.isFinite));
  assert(Number.isSafeInteger(passes) && passes > 0);
  const reads = Array.from(
    {
      length: passes,
    },
    (_, pass) =>
      values.map((value, index) => ({
        pass,
        index,
        value,
      })),
  );
  return {
    reads,
    globalLoads: values.length * (shared ? 1 : passes),
    sharedReads: shared ? values.length * passes : 0,
    passSums: reads.map((row) => sum(row.map((r) => r.value))),
  };
}
export function precisionFailureTraces() {
  const product = roundedFormat(300 * 300, 10, -14, 15),
    tiny = roundedFormat(2 ** -25, 10, -14, 15);
  return {
    overflow: {
      operand: 300,
      product,
      fp16: product - product,
      fp32: 300 * 300 - 300 * 300,
    },
    underflow: {
      operand: 2 ** -25,
      stored: tiny,
      fp16: tiny / tiny,
      fp32: 2 ** -25 / 2 ** -25,
    },
  };
}
export function cachedBlockRelease(progress) {
  assert(Number.isFinite(progress) && progress >= 0 && progress <= 1);
  const blocks = Array.from(
    {
      length: 2,
    },
    (_, id) => {
      const motion = clamp(progress * 2 - id);
      return {
        id,
        motion,
        reserved: motion < 1,
      };
    },
  );
  return {
    blocks,
    ...allocatorAccounting(8, blocks.filter((b) => b.reserved).length, 1),
  };
}

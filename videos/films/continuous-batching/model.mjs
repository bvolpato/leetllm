import { REQUESTS } from './fixtures.mjs';
import assert from 'node:assert/strict';
export function schedule(continuous = true) {
  const jobs = REQUESTS.map((x) => ({
      ...x,
      generated: 0,
      admitted: false,
    })),
    slots = [null, null, null],
    trace = [];
  for (let time = 0; time < 30 && jobs.some((x) => x.generated < x.length); time++) {
    const canAdmit = continuous || slots.every((x) => x === null);
    if (canAdmit)
      for (let i = 0; i < slots.length; i++)
        if (slots[i] === null) {
          const next = jobs.find((x) => !x.admitted && x.arrival <= time);
          if (next) {
            next.admitted = true;
            slots[i] = next;
          }
        }
    const snapshot = slots.map((x) =>
      x
        ? {
            id: x.id,
            generated: ++x.generated,
            length: x.length,
          }
        : null,
    );
    trace.push({
      iteration: time + 1,
      slots: snapshot,
    });
    slots.forEach((x, i) => {
      if (x && x.generated === x.length) slots[i] = null;
    });
  }
  return trace;
}
export const useful = (trace) =>
  trace.reduce((sum, row) => sum + row.slots.filter(Boolean).length, 0);
export function scheduleSnapshot(continuous, reveal) {
  const count = Math.max(0, Math.min(6, Math.floor(reveal))),
    trace = schedule(continuous).slice(0, count),
    reserved = 3 * count,
    tokens = useful(trace);
  return {
    trace,
    revealedIterations: count,
    tokens,
    reserved,
    utilization: reserved ? tokens / reserved : null,
  };
}
export function memorySnapshot(beat, progress, { release = progress > 0.28, reassign = progress > 0.68 } = {}) {
  const retired = beat === 2 && release,
    replaced = retired && reassign;
  const grown = Math.min(1, Math.floor(2 * Math.max(0, Math.min(1, (progress - 0.04) / 0.88))));
  return {
    retired,
    replaced,
    blocks:
      beat === 0 ? [1 + grown, 2 + grown, 3 + grown] : [retired ? (replaced ? 2 : 0) : 2, 3, 4],
  };
}
export function prefillChunkSnapshot(beat, progress, pass) {
  const advance = Math.max(0, Math.min(1, (progress - 0.08) / 0.8));
  if (beat === 0)
    return {
      chunk: 0,
      prior: 0,
      size: 0,
      consumed: 0,
      positions: [],
    };
  const stage = beat > 1 ? 3 : advance * 3,
    index = pass?.index ?? Math.min(2, Math.floor(stage)),
    local = pass?.fraction ?? (stage >= 3 ? 1 : stage - index);
  const prior = [0, 9, 18][index],
    size = [9, 9, 2][index];
  const positions = Array.from(
    {
      length: size,
    },
    (_, i) => ({
      id: prior + i + 1,
      slot: 3 + i,
      progress: Math.max(0, Math.min(1, local * size - i)),
    }),
  );
  return {
    chunk: index + 1,
    prior,
    size,
    consumed: prior + positions.filter((position) => position.progress === 1).length,
    positions,
  };
}
export function validateModel() {
  validateBatchingUpgrade();
  const fixed = schedule(false),
    continuous = schedule(true);
  assert.equal(useful(fixed.slice(0, 6)), 12);
  assert.equal(useful(continuous.slice(0, 6)), 18);
  assert.equal(continuous[2].slots[0].id, 'D');
  assert.equal(continuous[4].slots[1].id, 'E');
  assert.equal(fixed.length, 11);
  assert.equal(continuous.length, 8);
  assert.equal(useful(continuous), 21);
  const afterTwo = scheduleSnapshot(true, 2),
    afterThree = scheduleSnapshot(true, 3),
    afterFive = scheduleSnapshot(true, 5),
    complete = scheduleSnapshot(true, 6);
  assert.deepEqual(
    afterTwo.trace[1].slots.map((x) => x?.id),
    ['A', 'B', 'C'],
  );
  assert.equal(afterThree.trace[2].slots[0].id, 'D');
  assert.equal(afterThree.tokens, 9);
  assert.equal(afterThree.reserved, 9);
  assert.equal(afterFive.trace[4].slots[1].id, 'E');
  assert.equal(afterFive.tokens, 15);
  assert.equal(afterFive.reserved, 15);
  assert.equal(complete.tokens, 18);
  assert.equal(complete.reserved, 18);
  assert.equal(complete.utilization, 1);
  for (const trace of [fixed, continuous]) {
    const counts = new Map();
    for (const row of trace) {
      assert.equal(
        new Set(row.slots.filter(Boolean).map((x) => x.id)).size,
        row.slots.filter(Boolean).length,
      );
      for (const cell of row.slots.filter(Boolean)) {
        assert.equal(cell.generated, (counts.get(cell.id) ?? 0) + 1);
        assert(cell.generated <= cell.length);
        counts.set(cell.id, cell.generated);
      }
    }
    for (const request of REQUESTS) assert.equal(counts.get(request.id), request.length);
  }
  assert.equal(12 - 3, 9);
  assert.equal(Math.ceil(20 / 9), 3);
  assert.equal(prefillChunkSnapshot(0, 1).consumed, 0);
  assert.equal(prefillChunkSnapshot(1, 0.08).consumed, 0);
  assert.equal(prefillChunkSnapshot(1, 0.88).consumed, 20);
  assert.deepEqual(
    prefillChunkSnapshot(2, 0.1).positions.map((position) => position.id),
    [19, 20],
  );
  for (let i = 0; i <= 100; i++) {
    const chunk = prefillChunkSnapshot(1, i / 100);
    assert(chunk.size + 3 <= 12);
    assert(chunk.consumed >= chunk.prior && chunk.consumed <= 20);
    assert(
      chunk.positions.every(
        (position) => position.id > chunk.prior && position.id <= chunk.prior + chunk.size,
      ),
    );
  }
  assert.deepEqual(memorySnapshot(0, 0).blocks, [1, 2, 3]);
  assert.deepEqual(memorySnapshot(1, 0.9).blocks, [2, 3, 4]);
  assert.deepEqual(memorySnapshot(0, 1).blocks, [2, 3, 4]);
  assert.equal(memorySnapshot(1, 0.9).retired, false);
  assert.deepEqual(memorySnapshot(2, 0.5).blocks, [0, 3, 4]);
  assert.deepEqual(memorySnapshot(2, 0.88).blocks, [2, 3, 4]);
  return true;
}
export function serialCompletion(jobs, shortestFirst = false) {
  const rows = jobs.map((row) => ({
    ...row,
  }));
  if (shortestFirst) rows.sort((a, b) => a.steps - b.steps);
  let time = 0;
  const result = rows.map((row) => ({
    ...row,
    start: time,
    finish: (time += row.steps),
  }));
  return {
    rows: result,
    mean: result.reduce((s, r) => s + r.finish, 0) / result.length,
  };
}
export function pageCount(length, block) {
  if (!Number.isSafeInteger(length) || length < 0 || !Number.isSafeInteger(block) || block <= 0)
    throw Error('history length and block size must be safe integers');
  return Math.ceil(length / block);
}
export function freshBatchingBoundary(
  policy = 'fifo',
  { completeD = false, readersDone = false, writesDone = true, transfersDone = true } = {},
) {
  const block = 4,
    capacity = 5,
    seats = 3,
    work = 8,
    C = {
      id: 'C',
      length: 5,
      pages: [0, 1],
    },
    B = {
      id: 'B',
      length: 3,
      pages: [2],
    },
    D = {
      id: 'D',
      length: 11,
      pages: [],
    },
    E = {
      id: 'E',
      length: 3,
      pages: [],
    };
  const free = [3, 4],
    needD = pageCount(D.length + 1, block),
    needE = pageCount(E.length + 1, block);
  let active = [C, B],
    admitted = null,
    paused = null;
  if (policy === 'fit') {
    E.pages = free.splice(0, needE);
    active.push(E);
    admitted = 'E';
  } else if (policy === 'aged') {
    free.unshift(...B.pages);
    B.pages = [];
    active = [C];
    D.pages = free.splice(0, needD);
    active.push(D);
    admitted = 'D';
    paused = 'B';
  } else if (policy !== 'fifo') throw Error('unknown admission policy');
  const returned = policy === 'aged' && completeD && readersDone && writesDone && transfersDone;
  if (returned) {
    free.push(...D.pages);
    D.pages = [];
    active = active.filter((r) => r.id !== 'D');
  }
  const used = active.flatMap((r) => r.pages);
  assert.equal(new Set(used).size, used.length);
  assert(used.length <= capacity && active.length <= seats && active.length <= work);
  return {
    policy,
    block,
    capacity,
    seats,
    work,
    C,
    B,
    D,
    E,
    active,
    admitted,
    paused,
    free,
    needD,
    needE,
    scheduledInputs: returned ? 0 : active.length,
    returned,
  };
}
export function handoffTiming({ prefillQueue, prefill, handoff, decodeQueue, nextDecode }) {
  const first = prefillQueue + prefill,
    ready = first + handoff + decodeQueue,
    second = ready + nextDecode;
  return {
    first,
    ready,
    second,
    early: {
      ttft: first,
      gap: second - first,
    },
    buffered: {
      ttft: ready,
      gap: nextDecode,
    },
  };
}
export function highestPassingLoad(rows, threshold, gpus) {
  const passing = rows.filter((r) => r.attainment >= threshold);
  const selected = passing.reduce((best, r) => (!best || r.rate > best.rate ? r : best), null);
  return selected
    ? {
        ...selected,
        perGpu: selected.rate / gpus,
      }
    : null;
}
export function validateBatchingUpgrade() {
  const jobs = [
    {
      id: 'long',
      steps: 50,
    },
    {
      id: 'quick',
      steps: 5,
    },
    {
      id: 'medium',
      steps: 20,
    },
  ];
  assert.equal(serialCompletion(jobs).mean, 60);
  assert.equal(serialCompletion(jobs, true).mean, 35);
  assert.deepEqual(
    [17, 31, 48, 65].map((n) => pageCount(n, 16)),
    [2, 2, 3, 5],
  );
  assert.equal(
    [17, 31, 48, 65].reduce((s, n) => s + pageCount(n, 16) * 16 - n, 0),
    31,
  );
  assert.equal(freshBatchingBoundary('fifo').admitted, null);
  assert.equal(freshBatchingBoundary('fit').admitted, 'E');
  assert.equal(freshBatchingBoundary('aged').admitted, 'D');
  assert.equal(freshBatchingBoundary('aged').paused, 'B');
  assert.deepEqual(freshBatchingBoundary('aged').D.pages, [2, 3, 4]);
  assert.equal(freshBatchingBoundary('aged', { completeD: true }).returned, false);
  assert.equal(freshBatchingBoundary('aged', { readersDone: true }).returned, false);
  for (const pending of [{ writesDone: false }, { transfersDone: false }]) {
    const boundary = freshBatchingBoundary('aged', { completeD: true, readersDone: true, ...pending });
    assert.deepEqual(boundary.D.pages, [2, 3, 4]);
    assert.equal(boundary.free.length, 0);
  }
  assert.deepEqual(freshBatchingBoundary('aged', { completeD: true, readersDone: true }).free, [2, 3, 4]);
  const h = handoffTiming({
    prefillQueue: 20,
    prefill: 60,
    handoff: 40,
    decodeQueue: 15,
    nextDecode: 10,
  });
  assert.deepEqual(h, {
    first: 80,
    ready: 135,
    second: 145,
    early: {
      ttft: 80,
      gap: 65,
    },
    buffered: {
      ttft: 135,
      gap: 10,
    },
  });
  assert.equal(
    highestPassingLoad(
      [
        {
          rate: 2,
          attainment: 0.95,
        },
        {
          rate: 3,
          attainment: 0.92,
        },
        {
          rate: 4,
          attainment: 0.84,
        },
      ],
      0.9,
      2,
    ).perGpu,
    1.5,
  );
  return true;
}

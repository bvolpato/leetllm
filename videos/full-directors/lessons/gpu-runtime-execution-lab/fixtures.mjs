import assert from 'node:assert/strict';
import {
  pipeline,
  schedule,
  graphPrices,
  graphCost,
  runtimeFreshState,
} from '../../../films/gpu-runtime-execution-lab/arithmetic.mjs';

export { pipeline, schedule, graphPrices, graphCost };
export const original = [1, 2, 3, 4];
export const zeros = [0, 0, 0, 0];
export const fresh = [-1, 0, 2, 0];
export function memoryState(bound, copied, replayed, replacement = zeros) {
  const allocations = { A: [...original], B: [...replacement] };
  const captured = 'A',
    binding = bound ? 'B' : 'A';
  if (copied) allocations[captured].splice(0, 4, ...allocations[binding]);
  const last = pipeline(replayed ? allocations[captured] : original);
  return { allocations, captured, binding, last };
}
export function waitSnapshots(actions) {
  const recordings = [0],
    waits = [];
  for (const [kind, end] of actions) {
    if (kind === 'record') recordings.push(end);
    else waits.push({ generation: recordings.length - 1, end: recordings.at(-1) });
  }
  return { recordings, waits };
}
export const eventCalls = [['wait'], ['record', 3], ['wait'], ['record', 9], ['wait']];
export const issueB = 2;
export function defaultTimes() {
  const a = [0, 5],
    startLegacy = Math.max(1, a[1]),
    legacy = [startLegacy, startLegacy + 2];
  const startB = Math.max(issueB, legacy[1]);
  return [a, legacy, [startB, startB + 3], [1, 3]];
}
export const receipt = {
  gpu: 'RTX 5070 Ti',
  environment: 'PyTorch 2.15   /   CUDA build 13.2',
  measured: [
    [12.184778, 1.803874],
    [12.254336, 6.143264],
    [12.290748, 6.162709],
  ],
  setupMs: 3.679,
  n: 4096,
  iterations: 1000,
  warmup: 20,
};
export function means(totalsMs, count) {
  return totalsMs.map((t) => (1000 * t) / count);
}
export const practiceMeans = means([2, 3, 4], 200);
export function captureState(recorded, replays) {
  const operand = 2 * 3 ** Math.max(0, replays - 1);
  return {
    counter: 7 + (recorded ? 4 : 0),
    operand,
    scalar: replays ? operand * 3 : operand,
    replays,
  };
}
export function firstWin({ setupUs, eagerUs, replayUs }) {
  return eagerUs > replayUs ? Math.floor(setupUs / (eagerUs - replayUs)) + 1 : null;
}
export function updateState(accepted, oldDone, newDone, rejected) {
  const oldBias = 1,
    newBias = accepted ? -2 : oldBias;
  return {
    oldBias,
    newBias,
    old: oldDone ? 2 * 3 + oldBias : null,
    next: newDone ? 2 * 3 + newBias : null,
    route: rejected ? 'fallback' : null,
  };
}
export function dispatch(request, adapter) {
  return [4, 8, 16].find((cap) => cap >= request && adapter === 'A') ?? null;
}
export const terms = pipeline([1, 2, 3, 4, 5, 6, 0, 0]);
export function bucketState({
  masked = false,
  sumReady = false,
  cacheTrial = 'initial',
  adapter = 'A',
} = {}) {
  const gates = terms.input.map((_, i) => !masked || i < 6);
  const sum = terms.squares.reduce((a, v, i) => a + (gates[i] ? v : 0), 0);
  const dummyMayStore = cacheTrial === 'unguarded';
  return {
    gates,
    total: sumReady ? sum : null,
    cache: dummyMayStore ? terms.squares[6] : 42,
    bucket: dispatch(6, adapter),
    adapter,
  };
}
export function exerciseState(copied, maskWritten, replayVersion, cpuRead) {
  const storage = runtimeFreshState({ copy: copied, mask: maskWritten });
  const result = runtimeFreshState({ copy: replayVersion >= 1, mask: replayVersion >= 2 });
  return { storage, result, cpu: cpuRead ? result.total : null };
}

// Replay the visible ownership protocol. Completed slots remain owned by the reader.
const actions = [
  ['publish', 0, 1],
  ['publish', 1, 2],
  ['publish', 2, 3],
  ['publish', 3, 4],
  ['claim', 0],
  ['claim', 1],
  ['claim', 2],
  ['claim', 3],
  ['complete', 0],
  ['release', 0],
  ['publish', 0, 5],
  ['claim', 0],
  ['complete', 1],
  ['release', 1],
  ['publish', 1, 6],
  ['claim', 1],
  ...[2, 3, 0, 1].flatMap((slot) => [
    ['complete', slot],
    ['release', slot],
  ]),
];
export function queueState(count) {
  const slots = Array.from({ length: 4 }, () => ({ state: 'free', id: null, value: null }));
  let admitted = 0;
  const delivered = [];
  for (const [op, i, id] of actions.slice(0, count)) {
    const slot = slots[i];
    switch (op) {
      case 'publish':
        assert.equal(slot.state, 'free');
        assert.equal(id, admitted + 1);
        admitted++;
        Object.assign(slot, { id, state: 'published', value: null });
        break;
      case 'claim':
        assert.equal(slot.state, 'published');
        slot.state = 'worker';
        break;
      case 'complete':
        assert.equal(slot.state, 'worker');
        slot.state = 'reader';
        slot.value = pipeline([slot.id]).result;
        break;
      case 'release':
        assert.equal(slot.state, 'reader');
        delivered.push({ id: slot.id, value: slot.value });
        Object.assign(slot, { id: null, state: 'free', value: null });
        break;
    }
  }
  return { slots, admitted, delivered, pending: [1, 2, 3, 4, 5, 6].slice(admitted) };
}
export function check() {
  assert.deepEqual(pipeline(original), {
    input: original,
    affine: [3, 5, 7, 9],
    squares: [9, 25, 49, 81],
    result: 164,
  });
  const safe = schedule(true),
    unsafe = schedule(false);
  assert.deepEqual(
    Object.values(safe).map((v) => [v.start, v.end]),
    [
      [0, 3],
      [3, 7],
      [7, 9],
      [9, 10],
    ],
  );
  assert.deepEqual(
    Object.values(unsafe).map((v) => [v.start, v.end]),
    [
      [0, 3],
      [1, 5],
      [5, 7],
      [7, 8],
    ],
  );
  assert.deepEqual(waitSnapshots(eventCalls).waits, [
    { generation: 0, end: 0 },
    { generation: 1, end: 3 },
    { generation: 2, end: 9 },
  ]);
  assert.deepEqual(defaultTimes(), [
    [0, 5],
    [5, 7],
    [7, 10],
    [1, 3],
  ]);
  const [startB, endB] = defaultTimes()[2];
  assert.equal(startB - issueB, 5);
  assert.equal(endB - startB, 3);
  assert.deepEqual(
    [0, 1, 2].map((n) => captureState(true, n).scalar),
    [2, 6, 18],
  );
  assert.equal(captureState(true, 2).counter, 11);
  assert.deepEqual(
    [0, 1, 2].map((n) => captureState(true, n).operand),
    [2, 2, 6],
  );
  assert.equal(firstWin(graphPrices), 2001);
  assert.equal(firstWin({ ...graphPrices, replayUs: 18 }), null);
  assert.deepEqual(graphCost(2000), { n: 2000, eager: 36, graph: 36 });
  assert.deepEqual(graphCost(2001), { n: 2001, eager: 36.018, graph: 36.012 });
  assert.deepEqual(practiceMeans, [10, 15, 20]);
  assert.ok(receipt.measured[2][0] > receipt.measured[2][1]);
  assert.deepEqual(
    [0, 1].map((n) => receipt.n * (2 * n + 1) ** 2),
    [4096, 36864],
  );
  for (const [bound, copied, replayed, total] of [
    [false, false, false, 164],
    [true, false, true, 164],
    [true, true, false, 164],
    [true, true, true, 4],
  ]) {
    const m = memoryState(bound, copied, replayed);
    assert.equal(m.binding, bound ? 'B' : 'A');
    assert.equal(m.captured, 'A');
    assert.deepEqual(m.allocations.A, copied ? zeros : original);
    assert.equal(m.last.result, total);
  }
  assert.deepEqual(updateState(true, true, true, true), {
    oldBias: 1,
    newBias: -2,
    old: 7,
    next: 4,
    route: 'fallback',
  });
  assert.equal(dispatch(17, 'A'), null);
  assert.equal(dispatch(6, 'B'), null);
  assert.deepEqual(terms.affine, [3, 5, 7, 9, 11, 13, 1, 1]);
  assert.deepEqual(terms.squares, [9, 25, 49, 81, 121, 169, 1, 1]);
  assert.equal(bucketState({ sumReady: true }).total, 456);
  for (const [cacheTrial, expected] of [
    ['unguarded', 1],
    ['reset', 42],
    ['guarded', 42],
  ]) {
    const b = bucketState({ masked: true, sumReady: true, cacheTrial });
    assert.deepEqual(b.gates, [true, true, true, true, true, true, false, false]);
    assert.equal(b.total, 454);
    assert.equal(b.cache, expected);
    assert.equal(b.bucket, 8);
  }
  assert.equal(queueState(9).slots[0].state, 'reader');
  assert.deepEqual(queueState(9).pending, [5, 6]);
  assert.equal(queueState(10).slots[0].state, 'free');
  assert.deepEqual(queueState(10).delivered, [{ id: 1, value: 9 }]);
  assert.equal(queueState(11).slots[0].id, 5);
  assert.equal(queueState(16).slots[1].id, 6);
  const final = queueState(24);
  assert.ok(final.slots.every((s) => s.state === 'free'));
  assert.deepEqual(
    final.delivered.map((r) => r.value).sort((a, b) => a - b),
    [9, 25, 49, 81, 121, 169],
  );
  assert.equal(exerciseState(false, false, 0, false).result.total, 164);
  assert.equal(exerciseState(true, true, 1, false).result.total, 28);
  assert.deepEqual(exerciseState(true, true, 2, true).result.valid, [1, 1, 1, 0]);
  assert.equal(exerciseState(true, true, 2, true).cpu, 27);
}

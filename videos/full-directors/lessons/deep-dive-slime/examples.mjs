import assert from 'node:assert/strict';
import {
  chooseSlimeCarrier,
  applyPatch,
  versionedPatch,
} from '../../../films/deep-dive-slime/protocols.mjs';
import {
  checkpoint,
  segmentTerms,
  tokens,
  mask,
  lp,
  old,
  goal,
} from '../../../films/deep-dive-slime/fixtures.mjs';
import { sum, xor, update } from '../../../films/deep-dive-slime/arithmetic.mjs';

export { chooseSlimeCarrier, applyPatch, versionedPatch, checkpoint, segmentTerms, old, goal, xor };
export const input = [3, 7];
export const expected = 7;
export const result = input.at(-1);
export const reward = Number(result === expected);
export const graderRuns = [
  [3, 7],
  [7, 7],
].map((xs) => ({
  xs,
  actual: xs[0],
  wanted: xs.at(-1),
  reward: Number(xs[0] === xs.at(-1)),
}));
export const archives = [
  { name: 'R', checkpoint: true, batches: true, export: false },
  { name: 'S', checkpoint: false, batches: false, export: true },
];
export const replayReady = (archive) => archive.checkpoint && archive.batches;
const ink = ['run', 'test', 'got ' + input[0], 'want ' + expected, 'return', 'xs[-1]'];
export const response = tokens.map((id, i) => ({
  id,
  ink: ink[i],
  owner: mask[i] ? 'model' : 'tool',
  bit: mask[i],
  lp: lp[i],
}));
export const correctBits = response.map((t) => t.bit);
export const faultyBits = response.map((t) => t.bit || Number(t.id === 50));
export const selected = (bits) => response.filter((_, i) => bits[i] === 1);
export const negMean = (bits) => -sum(selected(bits).map((t) => t.lp)) / selected(bits).length;
export function checkSample(bits, status = 'COMPLETED', score = reward, probs = lp) {
  return (
    status === 'COMPLETED' &&
    Number.isFinite(score) &&
    bits.length === response.length &&
    probs.length === response.length &&
    bits.some(Boolean) &&
    bits.every(
      (bit, i) =>
        bit === response[i].bit &&
        Number.isFinite(probs[i]) &&
        probs[i] <= 0 &&
        (bit || probs[i] === 0),
    )
  );
}
export const attempts = [
  { id: 7, segments: 2 },
  { id: 8, segments: 1 },
  { id: 9, segments: 3 },
];
export function segmentSplit(count) {
  const parts = [segmentTerms.slice(0, count), segmentTerms.slice(count)];
  const denominator = segmentTerms.length;
  const subtotals = parts.map(sum);
  const shares = subtotals.map((x) => x / denominator);
  const local = subtotals.map((x, i) => x / parts[i].length);
  return {
    parts,
    subtotals,
    denominator,
    shares,
    local,
    total: sum(shares),
    localTotal: sum(local),
  };
}
export const memory = { train: 12, serve: 10, capacity: 16 };
export const groups = ['G1', 'G2', 'G3', 'G4', 'G5'];
export function queueState(finished, taken) {
  const queued = groups.slice(taken, finished);
  return {
    running: groups.slice(finished),
    queued,
    taken: groups.slice(0, taken),
    open: queued.length < 4,
  };
}
export const futures = [
  { id: 'A', version: 11, done: true },
  { id: 'B', version: 12, done: true },
  { id: 'C', version: 12, done: false },
];
export const drained = (set) => set.every((id) => futures.find((f) => f.id === id)?.done);
export const carriers = [
  {
    input: { colocated: true },
    mode: 'Full',
    setting: 'NCCL',
    placement: 'Shared GPUs',
    result: 'CUDA IPC handles',
  },
  { input: {}, mode: 'Full', setting: 'NCCL', placement: 'Separate GPUs', result: 'NCCL chunks' },
  {
    input: { delta: true, disk: true },
    mode: 'Delta',
    setting: 'Disk',
    placement: 'Separate GPUs',
    result: 'Disk delta',
  },
];
export const diskEvents = [
  'Actor updated',
  'Published',
  'Pulled',
  'Paused',
  'Cache flushed',
  'Reloaded',
  'Verified',
  'Resumed',
];
export function diskState(stage) {
  return {
    published: stage >= 1 ? 12 : null,
    local: stage >= 2 ? 12 : null,
    live: stage >= 5 ? 12 : 11,
    verified: stage >= 6,
    paused: stage >= 3 && stage < 7,
    cache: stage < 4 ? 'v11 cache' : 'Old cache flushed',
  };
}
export const patch = versionedPatch.delta;
export const hostA = { version: 12, bytes: goal };
export const hostB = { version: 10, bytes: old };
export const batches = [
  { id: 11, gradient: 0.2 },
  { id: 12, gradient: -0.5 },
];
export const replay = (retained) =>
  retained.reduce((states, b) => [...states, update(states.at(-1), b.gradient)], [checkpoint]);
export const reference = replay(batches);
export const skipped = replay(batches.slice(1)).at(-1);
export function checkExamples() {
  assert.deepEqual([input[0], result, reward], [3, 7, 1]);
  assert.deepEqual(
    graderRuns.map((r) => [r.actual, r.wanted, r.reward]),
    [
      [3, 7, 0],
      [7, 7, 1],
    ],
  );
  assert.deepEqual(
    archives.map((r) => [replayReady(r), r.export]),
    [
      [true, false],
      [false, true],
    ],
  );
  assert.deepEqual(
    selected(faultyBits).map((t) => t.id),
    [11, 12, 50, 13, 14],
  );
  assert.deepEqual(
    selected(correctBits).map((t) => t.id),
    [11, 12, 13, 14],
  );
  assert.equal(negMean(correctBits), 0.35);
  assert.ok(checkSample(correctBits));
  for (const bits of [faultyBits, correctBits.slice(0, 4)]) assert.ok(!checkSample(bits));
  assert.ok(!checkSample(correctBits, 'ABORTED'));
  assert.ok(!checkSample(correctBits, 'COMPLETED', NaN));
  assert.ok(!checkSample(correctBits, 'COMPLETED', reward, lp.slice(1)));
  assert.equal(sum(attempts.map((a) => a.segments)), 6);
  for (const split of [1, 2, 3]) assert.equal(segmentSplit(split).total, 4);
  assert.deepEqual(segmentSplit(2).shares, [1, 3]);
  assert.deepEqual(segmentSplit(1).shares, [0.25, 3.75]);
  assert.equal(segmentSplit(1).localTotal, 6);
  assert.equal(segmentSplit(1).total / 2, 2);
  assert.equal(memory.train + memory.serve - memory.capacity, 6);
  assert.deepEqual([drained(['A', 'B']), drained(['B', 'C'])], [true, false]);
  for (const [finished, taken, n, open] of [
    [3, 0, 3, true],
    [4, 0, 4, false],
    [5, 0, 5, false],
    [5, 2, 3, true],
  ]) {
    const s = queueState(finished, taken);
    assert.deepEqual([s.queued.length, s.open], [n, open]);
    assert.deepEqual([...s.taken, ...s.queued, ...s.running], groups);
  }
  assert.deepEqual(
    carriers.map((c) => chooseSlimeCarrier(c.input)),
    ['tensor handles', 'NCCL chunks', 'delta disk'],
  );
  assert.equal(
    chooseSlimeCarrier({ delta: true, disk: true, colocated: true }),
    'reject configuration',
  );
  assert.equal(chooseSlimeCarrier({ disk: true }), 'full disk');
  assert.deepEqual(diskState(2), {
    published: 12,
    local: 12,
    live: 11,
    verified: false,
    paused: false,
    cache: 'v11 cache',
  });
  assert.deepEqual(
    [4, 5, 6, 7].map((s) => [diskState(s).live, diskState(s).verified, diskState(s).paused]),
    [
      [11, false, true],
      [12, false, true],
      [12, true, true],
      [12, true, false],
    ],
  );
  assert.deepEqual(xor(old, goal), [0, 0, 11, 0]);
  assert.deepEqual(xor(old, patch), goal);
  assert.deepEqual(xor(goal, patch), old);
  for (const [host, reason] of [
    [hostA, 'already applied'],
    [hostB, 'wrong base version'],
  ]) {
    const decision = applyPatch(host, versionedPatch);
    assert.deepEqual([decision.applied, decision.reason, decision.state], [false, reason, host]);
  }
  assert.deepEqual(
    reference.map((s) => [s.step, +s.weight.toFixed(4), +s.velocity.toFixed(4)]),
    [
      [10, 1, 0],
      [11, 0.98, 0.2],
      [12, 1.012, -0.32],
    ],
  );
  assert.deepEqual([skipped.weight, skipped.velocity], [1.05, -0.5]);
  assert.deepEqual(replay(batches), reference);
}

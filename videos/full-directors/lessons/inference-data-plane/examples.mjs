import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export const KiB = 1024,
  MiB = KiB ** 2,
  GiB = KiB ** 3;
export const toy = (positions) => 2 * 4 * positions * 2 * 8 * 2;
export const rowsPerBand = 32;
export const perToken = 2 * 80 * 8 * 128 * 2;
export function budget(positions, future = 128) {
  const blocks = Math.ceil((positions + future) / 16);
  return {
    positions,
    future,
    blocks,
    capacity: blocks * 16 * perToken,
    bytes: positions * perToken,
    slack: blocks * 16 - positions - future,
  };
}
export const base = budget(8192),
  rate = 25e9,
  sharedMs = (1000 * base.bytes) / rate;
export function fractions(ms, independent) {
  const f = Math.min(1, Math.max(0, (ms / sharedMs) * (independent ? 2 : 1)));
  return [f, f];
}
export const demand = (40 * base.bytes) / 1e9,
  sustainable = rate / base.bytes;
export const partials = [
  [1, 2],
  [10, 20],
];
export function collective(mode) {
  const reduced = partials[0].map((v, i) => v + partials[1][i]);
  if (mode === 'raw gather') return partials.map(() => partials.flat());
  if (mode === 'scatter') return reduced.map((v) => [v]);
  return partials.map(() => [...reduced]);
}
export const routeWorkers = [
  { name: 'A', free: 60, tp: 2, reuse: 0, rate: 12, setup: 0.2, rack: 1 },
  { name: 'B', free: 72, tp: 1, reuse: 48, rate: 24, setup: 0.1, rack: 1 },
  { name: 'C', free: 64, tp: 2, reuse: 36, rate: 6, setup: 0.8, rack: 2 },
];
export const promptBlocks = 48;
export const d12 = { capacity: 64, prefixBlocks: 0, segmentBlocks: 8 };
export const fullCopyBlocks = promptBlocks - d12.prefixBlocks;
export function routes(localOnly = false) {
  return routeWorkers.map((w) => {
    const eligible = w.tp === 2 && w.free >= promptBlocks && (!localOnly || w.rack === 1);
    const remaining = eligible ? promptBlocks - w.reuse : null;
    return { ...w, eligible, remaining, cost: eligible ? w.setup + remaining / w.rate : null };
  });
}
export function bank(reserved, written = 0, total = 64) {
  assert.ok(0 <= written && written <= reserved && reserved <= total);
  return { total, reserved, written, free: total - reserved };
}
export const manifest = {
  request: 'req-8k-017',
  attempt: 4,
  tenant: 'tenant-73',
  model: 'm42 / t17 / none',
  tokens: 'tok-bf81 / 0–8191',
  layout: 'BF16 / hnd-v3 / 16',
  coverage: 'TP2 / 0–511',
  lease: 'd3-lease-772',
};
export const matches = (m, expected) => Object.keys(expected).every((k) => m[k] === expected[k]);
const segmentsPerRank = fullCopyBlocks / (2 * d12.segmentBlocks);
export const ids = Array.from({ length: 2 * segmentsPerRank }, (_, i) => ({
  segment: i + 1,
  rank: Math.floor(i / segmentsPerRank),
  first: (i % segmentsPerRank) * d12.segmentBlocks,
  last: (1 + (i % segmentsPerRank)) * d12.segmentBlocks - 1,
}));
const digest = (s) => createHash('sha256').update(s).digest('hex');
const expected = ids.map(({ rank, first, last }) =>
  digest('R4219 / g4 / ' + [rank, first, last].join('/')),
);
const owner = {
  request: 'R4219',
  operation: 'op-17',
  generation: 4,
  region: 'D12',
  layout: 'M17 r5 / TP2',
};
export function receipt(notices, overrides = {}) {
  const unique = new Set(notices);
  const complete = ids.every((s) => unique.has(s.segment));
  const state = {
    ...owner,
    verified: expected,
    visible: true,
    writerStopped: true,
    readersStopped: true,
    retired: false,
    localTick: 7,
    expires: 10,
    ...overrides,
  };
  const bound = matches(state, owner);
  const integrity = notices.every(
    (id) => expected[id - 1] && state.verified[id - 1] === expected[id - 1],
  );
  const live = state.localTick < state.expires && !state.retired;
  const commit = bound && complete && live && integrity && state.visible && state.writerStopped;
  const reusable = !live && state.writerStopped && state.readersStopped;
  return {
    ...state,
    notices,
    unique,
    complete,
    integrity,
    commit,
    reusable,
    blocks: unique.size * d12.segmentBlocks,
  };
}
export function query(operation, generation, rows) {
  return rows.find((row) => row.operation === operation && row.generation === generation);
}
export function receiptState(
  notices,
  { expired = false, stopped = false, readers = false, released = false } = {},
) {
  const r = receipt(notices, {
    retired: expired,
    localTick: expired ? 10 : 7,
    writerStopped: stopped,
    readersStopped: readers,
  });
  return { ...r, charged: released && r.reusable ? 0 : fullCopyBlocks };
}
export const promptGroups = ['What color', 'is the', 'clear daytime', 'sky?'];
export function retainedCopy(expired, readsStopped) {
  return { expired, readsStopped, held: !expired || !readsStopped };
}
export function rebuiltGroups(fenced, progress, complete) {
  if (!fenced) return 0;
  if (complete) return promptGroups.length;
  return Math.floor((promptGroups.length - 1) * progress);
}
export function trace(start, queue = 0) {
  const prefill = [queue, queue + 310],
    transfer = [queue + start, queue + start + sharedMs];
  const join = Math.max(prefill[1], transfer[1]),
    first = join + 28;
  return { queue, prefill, transfer, decode: [join, first], first, active: first - queue };
}
export const firstStepReady = (shards, confirmed) =>
  shards.length === 2 && shards.every(Boolean) && Boolean(confirmed);
export function queuedLink(wait) {
  const prefill = [0, 180],
    setup = [0, 150],
    transfer = [150 + wait, 330 + wait],
    decode = [330 + wait, 400 + wait];
  return { prefill, setup, transfer, decode, first: decode[1] };
}
export const practice = [1, 2, 2, 3, 4, 6];
export function validate() {
  assert.deepEqual(collective('sum'), [
    [11, 22],
    [11, 22],
  ]);
  assert.deepEqual(collective('raw gather'), [
    [1, 2, 10, 20],
    [1, 2, 10, 20],
  ]);
  assert.deepEqual(collective('scatter'), [[11], [22]]);
  assert.deepEqual(collective('scatter').flat(), collective('sum')[0]);
  assert.equal(toy(128), 32 * KiB);
  assert.equal(toy(256), 64 * KiB);
  assert.equal(128 / rowsPerBand, 4);
  assert.equal(256 / rowsPerBand, 8);
  assert.equal(perToken, 320 * KiB);
  assert.equal(base.bytes, 2.5 * GiB);
  assert.equal(base.capacity, 2600 * MiB);
  assert.equal(base.blocks, 520);
  const extra = budget(8193);
  assert.equal(extra.bytes - base.bytes, 320 * KiB);
  assert.equal(extra.capacity - base.capacity, 5 * MiB);
  assert.equal(extra.blocks, 521);
  assert.equal(extra.slack, 15);
  assert.deepEqual(fractions(sharedMs / 2, false), [0.5, 0.5]);
  assert.deepEqual(fractions(sharedMs / 2, true), [1, 1]);
  assert.equal(sharedMs.toFixed(1), '107.4');
  assert.equal(demand.toFixed(1), '107.4');
  assert.equal(sustainable.toFixed(2), '9.31');
  assert.equal(8 * GiB - 3 * base.capacity, 392 * MiB);
  assert.deepEqual(
    routes().map((x) => x.cost),
    [4.2, null, 2.8],
  );
  assert.equal(routes(true)[2].eligible, false);
  assert.equal(routes()[2].remaining, 12);
  assert.equal(fullCopyBlocks, 48);
  assert.equal(
    ids.reduce((total, s) => total + s.last - s.first + 1, 0),
    fullCopyBlocks,
  );
  assert.equal(bank(fullCopyBlocks, 0, d12.capacity).free, 16);
  assert.equal(retainedCopy(false, true).held, true);
  assert.equal(retainedCopy(true, false).held, true);
  assert.equal(retainedCopy(true, true).held, false);
  assert.equal(rebuiltGroups(false, 1, false), 0);
  assert.equal(rebuiltGroups(true, 0, false), 0);
  assert.equal(rebuiltGroups(true, 0.7, false), 2);
  assert.equal(rebuiltGroups(true, 1, true), 4);
  assert.equal(matches({ ...manifest, attempt: 3 }, manifest), false);
  assert.deepEqual(bank(48), { total: 64, reserved: 48, written: 0, free: 16 });
  assert.ok(bank(48, 48).free < 24);
  const four = [1, 2, 3, 4],
    all = ids.map((s) => s.segment);
  assert.equal(query('op-17', 4, [receipt(four)]).blocks, 32);
  assert.equal(query('op-18', 4, [receipt(four)]), undefined);
  assert.equal(query('op-17', 3, [receipt(four)]), undefined);
  assert.equal(receipt(all).commit, true);
  for (const [a, b, confirmed, expected] of [
    [1, 0, 1, false],
    [0, 1, 1, false],
    [1, 1, 0, false],
    [1, 1, 1, true],
  ]) {
    assert.equal(firstStepReady([a, b], confirmed), expected);
  }
  assert.equal(queuedLink(0).first, 400);
  assert.equal(queuedLink(25).first, 425);
  for (const change of [
    { operation: 'op-18' },
    { generation: 3 },
    { region: 'D11' },
    { localTick: 10 },
    { visible: false },
    { writerStopped: false },
    { verified: [] },
    { layout: 'TP1' },
  ])
    assert.equal(receipt(all, change).commit, false);
  assert.equal(receipt(four).commit, false);
  const practiceReceipt = receipt(practice);
  assert.equal(practice.length, ids.length);
  assert.deepEqual(practice.filter((id, i) => practice.indexOf(id) < i), [2]);
  assert.deepEqual(
    ids.filter(({ segment }) => !practiceReceipt.unique.has(segment)).map(({ segment }) => segment),
    [5],
  );
  assert.equal(practiceReceipt.unique.size, 5);
  assert.equal(practiceReceipt.commit, false);
  for (const [w, r, charge] of [
    [false, false, 48],
    [false, true, 48],
    [true, false, 48],
    [true, true, 0],
  ]) {
    assert.equal(
      receiptState(four, { expired: true, stopped: w, readers: r, released: true }).charged,
      charge,
    );
  }
  assert.equal(trace(310).first.toFixed(1), '445.4');
  assert.equal(trace(240).first.toFixed(1), '375.4');
  assert.equal(trace(240, 25).first.toFixed(1), '400.4');
  assert.equal(trace(240, 25).active, trace(240).first);
}

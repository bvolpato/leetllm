import assert from 'node:assert/strict';
import {
  architecture,
  bytesPerToken,
  GiB,
  hardware,
  pool,
  referencePoolBytes,
} from '../../../films/inference-batch-capacity/fixtures.mjs';
import {
  bandwidthPoint,
  prefixPageState,
  reservation,
  scheduleRequests,
  speculativeAcceptance,
  speculativeExpectation,
} from '../../../films/inference-batch-capacity/arithmetic.mjs';
export { architecture, bytesPerToken, GiB, hardware, pool, referencePoolBytes, prefixPageState };
export const ids = ['A', 'B', 'C', 'D', 'E'];
export const weights = hardware.weights / GiB;
export const runtime = hardware.runtime / GiB;
export const poolGiB = pool / GiB;
export const longGeometry = { ...architecture, layers: 80 };
export const size = (g, n) => 2 * g.layers * g.kvHeads * g.headWidth * g.bytes * n;
export function opening(grown, released, admitted) {
  const tokens = [65536, 57344, 4096].map((n) => n - Number(!grown));
  const held = (tokens.slice(0, released ? 2 : 3).reduce((s, v) => s + v, 0) * bytesPerToken) / GiB;
  const patch = reservation(4096, 1024).bytes / GiB;
  const free = poolGiB - held;
  return {
    tokens,
    held,
    free,
    patch,
    canStart: free >= patch,
    remaining: free - (admitted ? patch : 0),
  };
}
export const growth = [
  [4096, 0],
  [4096, 1024],
  [16384, 1024],
].map(([p, o]) => {
  const req = reservation(p, o),
    gib = req.bytes / GiB,
    count = Math.floor(poolGiB / gib);
  return { p, o, gib, count, occupied: count * gib, free: poolGiB - count * gib };
});
export const pages = [4090, 4096, 4100].map((p, i) => {
  const r = reservation(p, 512),
    tail = r.slots - r.logical;
  return { ...r, owner: ids[i], tail, lastUsed: hardware.pageTokens - tail };
});
export const lengths = [2, 2, 5, 3, 1];
export const schedules = [false, true].map((policy) => scheduleRequests(lengths, 3, policy));
export const decodeDeadline = 40;
export const point = (b) => {
  const p = bandwidthPoint(b);
  return {
    b,
    kv: p.kvRead / GiB,
    res: p.reserved / GiB,
    ms: p.ms,
    tps: p.tps,
    fit: p.reserved <= pool,
    onTime: p.ms <= decodeDeadline,
  };
};
export const candidates = [1, 8, 16, 24, 32].map(point);
export const weightMs = (1000 * hardware.weights) / hardware.bandwidth;
export function readSweep(row, elapsed) {
  const time = Math.min(elapsed, row.ms);
  const perHistory = (row.ms - weightMs) / row.b;
  const fractions = Array.from({ length: row.b }, (_, index) =>
    Math.max(0, Math.min(1, (time - weightMs) / perHistory - index)),
  );
  return { weight: Math.min(time, weightMs), perHistory, fractions, done: elapsed >= row.ms };
}
export const chosen = candidates.filter((r) => r.fit && r.onTime).at(-1);
export const dollars = (rate, hourly) => (hourly * 1e6) / (rate * 3600);
export const chunk = { budget: 10, live: 4, waiting: 20 };
chunk.take = Math.min(chunk.waiting, chunk.budget - chunk.live);
export const link = { gib: size(longGeometry, 8192) / GiB, rate: 200, coord: 4, saved: 15 };
link.wire = (link.gib / link.rate) * 1000;
link.delta = link.wire + link.coord - link.saved;
export const P = [0.1, 0.6, 0.3],
  Q = [0.5, 0.25, 0.25],
  proposed = 0,
  uniform = 0.4;
export const sampling = speculativeAcceptance(P, Q, proposed, uniform);
export const deficits = P.map((p, i) => Math.max(0, p - Q[i]));
export const expected = speculativeExpectation(3, 0.5, 0.2, 1.2);
export const streams = [
  [10, 30],
  [2.5, 30],
  [10, 15],
].map(([w, k]) => ({ w, k, total: w + k, ratio: 40 / (w + k) }));
export const trial = {
  total: 32,
  w: 8,
  runtime: 4,
  history: 0.25,
  charge: 0.3125,
  rate: 400,
  deadline: 40,
};
export const practice = [16, 32, 48, 64].map((b) => {
  const reserved = b * trial.charge,
    reads = b * trial.history,
    ms = ((trial.w + reads) / trial.rate) * 1000;
  return {
    b,
    reserved,
    reads,
    ms,
    tps: (b * 1000) / ms,
    fit: reserved <= trial.total - trial.w - trial.runtime,
    pass: ms <= trial.deadline,
  };
});
export const winner = practice.filter((r) => r.fit && r.pass).at(-1);
export function checkModel() {
  assert.equal(bytesPerToken, size(architecture, 1));
  assert.equal(size(architecture, 4096), GiB / 2);
  assert.deepEqual(
    [opening(true, false, false).free, opening(true, false, false).canStart],
    [0.5, false],
  );
  assert.equal(opening(true, true, true).remaining, 0.375);
  assert.equal(
    opening(true, false, false).held - opening(false, false, false).held,
    (3 * bytesPerToken) / GiB,
  );
  assert.equal(size(longGeometry, 8192) / GiB, 2.5);
  assert.equal((size(longGeometry, 8192) * 64) / GiB, 160);
  assert.equal((size(longGeometry, 1e6) / GiB / 4).toFixed(1), '76.3');
  assert.deepEqual(
    [poolGiB, ...[4096, 4608].map((n) => Math.floor(referencePoolBytes / (n * bytesPerToken)))],
    [16, 103, 91],
  );
  assert.deepEqual(
    growth.map((r) => [r.gib, r.count, r.free]),
    [
      [0.5, 32, 0],
      [0.625, 25, 0.375],
      [2.125, 7, 1.125],
    ],
  );
  assert.deepEqual(
    pages.map((r) => [r.blocks, r.slots, r.lastUsed, r.tail]),
    [
      [288, 4608, 10, 6],
      [288, 4608, 16, 0],
      [289, 4624, 4, 12],
    ],
  );
  assert.equal(
    pages.reduce((s, r) => s + r.tail, 0),
    18,
  );
  assert.deepEqual(
    prefixPageState(2).pages.map((p) => [p.references, ...p.values]),
    [
      [1, 'p', 'q', 'r', null],
      [1, 'p', 'q', 'r', null],
    ],
  );
  assert.deepEqual(
    prefixPageState(3).pages.map((p) => p.values.at(-1)),
    ['a', 'b'],
  );
  assert.deepEqual(
    schedules.map((r) => [r.reads, r.tokens]),
    [
      [8, 13],
      [5, 13],
    ],
  );
  assert.deepEqual(schedules[1].frames[2].slots, [3, 4, 2]);
  assert.deepEqual(
    candidates.map((r) => [r.b, r.res, r.kv, r.ms, r.fit, r.onTime]),
    [
      [1, 0.625, 0.5, 25, true, true],
      [8, 5, 4, 32, true, true],
      [16, 10, 8, 40, true, true],
      [24, 15, 12, 48, true, false],
      [32, 20, 16, 56, false, false],
    ],
  );
  assert.equal(chosen.tps, 400);
  const atDeadline = readSweep(point(24), decodeDeadline);
  assert.equal(atDeadline.weight, 24);
  assert.deepEqual(atDeadline.fractions, [...Array(16).fill(1), ...Array(8).fill(0)]);
  assert.equal(atDeadline.done, false);
  assert.equal(readSweep(point(16), decodeDeadline).done, true);
  assert.equal(readSweep(point(24), 32.5).fractions[8], 0.5);
  assert.equal(dollars(chosen.tps, 2).toFixed(2), '1.39');
  assert.deepEqual(
    [chunk.take, chunk.waiting - chunk.take, link.wire, link.delta],
    [6, 14, 12.5, 1.5],
  );
  assert.equal(sampling.accepted, false);
  assert.equal(sampling.threshold, 0.2);
  assert.deepEqual(
    sampling.residual.map((n) => n.toFixed(3)),
    ['0.000', '0.875', '0.125'],
  );
  assert.equal(expected.expected, 1.875);
  assert.equal(expected.cost, 1.8);
  assert.equal(expected.rate.toFixed(3), '1.042');
  assert.deepEqual(
    streams.map((s) => s.ratio.toFixed(2)),
    ['1.00', '1.23', '1.60'],
  );
  assert.deepEqual(
    practice.map((r) => [r.reserved, r.reads, r.ms, r.fit, r.pass]),
    [
      [5, 4, 30, true, true],
      [10, 8, 40, true, true],
      [15, 12, 50, true, false],
      [20, 16, 60, true, false],
    ],
  );
  assert.deepEqual([winner.b, winner.tps], [32, 800]);
  return true;
}

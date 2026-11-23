import assert from 'node:assert/strict';
import {
  burst,
  outcomes,
  recommend,
  GiB,
  autoscaleMemory,
  pagedAllocation,
  serviceTrial,
  finiteWarmBurst,
} from '../../../films/gpu-autoscaling/arithmetic.mjs';
import { phases } from '../../../films/gpu-autoscaling/fixtures.mjs';

export { GiB, phases };
export const runs = new Map([1, 3, 4, 5, 20].map((n) => [n, burst(n)]));
export function replay(warm, now) {
  const rows = runs.get(warm);
  return { rows, ...outcomes(rows, now), warm, now };
}
export const startup = phases.reduce((n, [, sec]) => n + sec, 0);
function response(ready, owners, id) {
  if (!ready) return 503;
  if (owners.includes(id)) return 409;
  if (owners.length >= 2) return 429;
  return 200;
}
export function admission(stage) {
  const loaded = stage >= 1,
    warm = stage >= 2;
  const active = new Set(),
    log = [];
  function take(id) {
    const code = response(loaded && warm, [...active], id);
    if (code === 200) active.add(id);
    log.push([id, code]);
  }
  if (stage < 2) take('C');
  if (stage >= 3) take('C');
  if (stage >= 4) take('D');
  if (stage >= 5) take('C');
  if (stage >= 6) take('E');
  return { loaded, warm, ready: loaded && warm, active: [...active], log };
}
export function adapter(member) {
  const principal = 'Cora',
    tenant = 'C',
    base = 'v7',
    approved = true;
  const allowed = member && approved && base === 'v7';
  return { principal, tenant, base, member, approved, selected: allowed ? 'C / v7' : null };
}
export function demand(stage) {
  const fresh = stage < 4,
    previous = stage <= 1 ? 4 : 10,
    ready = 4,
    slots = 5;
  const sample = fresh ? { waiting: 30, running: ready * slots, at: 0 } : null;
  const { target } = recommend(sample, previous, ready, 0);
  const desired = stage === 0 ? previous : target;
  // The scheduler reports placement separately from the request counters.
  const pendingStates = [
    'Needs node', 'Needs node', 'Needs node',
    'Starting engine', 'Starting engine', 'Starting engine',
  ].slice(0, desired - ready);
  const open = sample ? ready * slots - sample.running : null;
  return {
    desired, ready, pending: pendingStates.length, pendingStates, slots, open,
    delta: target - previous, sample, target,
  };
}
export function quiet(t) {
  const elapsed = t - 20;
  return { elapsed, desired: 7 - Number(elapsed >= 300) };
}
export function cache(tokens) {
  const each = (autoscaleMemory().bytesPerToken * tokens) / GiB;
  return { tokens, each, total: 5 * each, fit: Math.floor(8 / each) };
}
export const pages = pagedAllocation([17, 33, 65]);
export const hybrid = {
  requests: 6,
  layers: 12,
  heads: 4,
  width: 64,
  positions: 2048,
  bytes: 2,
  fixed: 16,
};
hybrid.per =
  (2 * hybrid.layers * hybrid.heads * hybrid.width * hybrid.positions * hybrid.bytes) / 2 ** 20;
hybrid.growth = hybrid.per * hybrid.requests;
hybrid.recurrent = hybrid.fixed * hybrid.requests;
export const replyWords = [
  ['Queue', 'age', 'rose.', 'Traffic', 'recovered.'],
  ['Errors', 'fell', 'after', 'the', 'rollback.', 'Latency', 'is', 'back', 'to', 'normal.'],
];
export function streams(closed, cWords, dWords) {
  const replies = [cWords, dWords].map((count, i) => ({
    id: ['C', 'D'][i],
    text: replyWords[i].slice(0, count).join(' '),
    done: count === replyWords[i].length,
  }));
  const owners = replies.filter((r) => !r.done).map((r) => r.id);
  return {
    closed,
    replies,
    owners,
    newStatus: response(!closed, owners, 'F'),
    safe: closed && owners.length === 0,
  };
}
export const shutdown = { deadline: 70, cleanup: 15, estimates: [30, 55, 56] };
shutdown.budget = shutdown.deadline - shutdown.cleanup;
export const drainActions = shutdown.estimates.map((t) =>
  t <= shutdown.budget ? 'Finish if estimate holds' : 'Interrupt streamed reply',
);
export const events = [
  { at: 250, n: 1 },
  { at: 300, n: 2 },
  { at: 410, n: 2 },
];
export const gaps = events.slice(1).map((e, i) => e.at - events[i].at);
export const tokens = events.reduce((n, e) => n + e.n, 0);
export const meanGap = (events.at(-1).at - events[0].at) / (tokens - 1);
export const trials = [
  [160, 148],
  [200, 178],
].map(([offered, qualified]) => ({
  offered,
  qualified,
  ...serviceTrial(offered, qualified, 20),
}));
export const passingRate = Math.max(
  ...trials.filter((t) => t.attainment >= 0.9).map((t) => t.offeredRPS),
);
export const slotIntervals = [
  { id: 'R17', admitted: 1, released: 7 },
  { id: 'R23', admitted: 3, released: 6 },
];
export const slotSampleTime = 4;
export function inFlightAt(t) {
  return slotIntervals.filter((r) => r.admitted <= t && t < r.released).length;
}
export const practiceBurst = { requests: 54, slots: 3, service: 5, cold: 120 };
export function practice(deadline, warm) {
  return finiteWarmBurst({ ...practiceBurst, deadline, warm });
}
export function checkExamples() {
  const last = replay(1, 30);
  assert.deepEqual(
    last.active.map((r) => r.id),
    ['R16', 'R17', 'R18', 'R19', 'R20'],
  );
  assert.equal(last.waiting[0].id, 'R21');
  assert.equal(replay(1, 30.1).expired.length, 80);
  assert.equal(replay(3, 10).active[5].id, 'R21');
  assert.deepEqual(
    [1, 3, 4, 5, 20].map((n) => replay(n, 40).admitted.length),
    [20, 60, 80, 100, 100],
  );
  assert.equal(runs.get(5)[99].end, 40);
  assert.deepEqual(
    [0, 120, 240].map((lead) => startup - lead),
    [207, 87, -33],
  );
  assert.deepEqual(admission(6).log, [
    ['C', 200],
    ['D', 200],
    ['C', 409],
    ['E', 429],
  ]);
  assert.equal(admission(1).ready, false);
  assert.equal(admission(2).ready, true);
  assert.deepEqual([adapter(true).selected, adapter(false).selected], ['C / v7', null]);
  assert.deepEqual(
    [demand(0).target, demand(2).pending, demand(3).delta, demand(4).desired],
    [10, 6, 0, 10],
  );
  assert.equal(demand(1).delta, 6);
  for (const stage of [0, 1, 2, 3]) {
    const poll = demand(stage);
    assert.deepEqual([poll.slots, poll.sample.running, poll.open], [5, 20, 0]);
    assert.equal(poll.ready + poll.pendingStates.length, poll.desired);
    assert.equal(poll.pendingStates.filter((state) => state === 'Needs node').length, stage ? 3 : 0);
    assert.equal(poll.pendingStates.filter((state) => state === 'Starting engine').length, stage ? 3 : 0);
  }
  assert.equal(demand(4).open, null);
  assert.deepEqual([quiet(319).desired, quiet(320).desired], [7, 6]);
  assert.deepEqual([cache(4096).total, cache(16384).total, cache(16384).fit], [2.5, 10, 4]);
  assert.deepEqual([pages.blocks, pages.slots, pages.slack], [10, 160, 45]);
  assert.deepEqual(
    [hybrid.growth, hybrid.recurrent, hybrid.growth + hybrid.recurrent],
    [144, 96, 240],
  );
  assert.deepEqual(
    [streams(true, 3, 4).owners, streams(true, 5, 7).owners, streams(true, 5, 10).owners],
    [['C', 'D'], ['D'], []],
  );
  assert.equal(streams(true, 5, 7).newStatus, 503);
  assert.equal(streams(true, 5, 7).safe, false);
  assert.equal(streams(true, 5, 10).safe, true);
  assert.deepEqual(drainActions, [
    'Finish if estimate holds',
    'Finish if estimate holds',
    'Interrupt streamed reply',
  ]);
  assert.deepEqual([gaps, tokens, meanGap], [[50, 110], 5, 40]);
  assert.deepEqual(
    trials.map((t) => [t.attainment, t.qualifiedRPS]),
    [
      [0.925, 7.4],
      [0.89, 8.9],
    ],
  );
  assert.equal(passingRate, 8);
  assert.deepEqual(slotIntervals.map((r) => r.released - r.admitted), [6, 3]);
  assert.deepEqual([0, 1, slotSampleTime, 6, 7].map(inFlightAt), [0, 1, 2, 1, 0]);
  assert.deepEqual(
    [
      practice(10, 6).minimum,
      practice(9, 6).expired,
      practice(9, 9).minimum,
      practice(9, 9).rows[53].start,
    ],
    [6, 18, 9, 5],
  );
  const original = practice(10, 6);
  const earlier = practice(9, 6);
  const resized = practice(9, 9);
  assert.deepEqual(
    earlier.rows.filter((row) => row.expired).map((row) => row.id),
    original.rows.filter((row) => row.start === 10).map((row) => row.id),
  );
  assert.deepEqual(
    resized.rows.reduce((counts, row) => {
      counts[row.wave]++;
      return counts;
    }, [0, 0]),
    [27, 27],
  );
}

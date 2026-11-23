import assert from 'node:assert/strict';
import {
  deficit,
  reserveWholePages,
} from '../../../films/design-multi-tenant-llm-serving-platform/arithmetic.mjs';
import {
  locatePosition,
  privateHistory,
} from '../../../films/design-multi-tenant-llm-serving-platform/page-pool.mjs';
import { MULTITENANT_REQUESTS } from '../../../films/design-multi-tenant-llm-serving-platform/fixtures.mjs';
import { multiTenantConstructionModel } from '../../../films/design-multi-tenant-llm-serving-platform/model.mjs';

export const sources = [
  { name: 'Incident notes', tenant: 'B', reader: 'Bob', score: 0.99 },
  { name: 'Private postmortem', tenant: 'A', reader: 'Carol', score: 0.95 },
  { name: 'Design guide', tenant: 'A', reader: 'Alice', score: 0.8 },
];
export const readers = { Alice: 'A', Bob: 'B', Carol: 'A' };
export const permitted = (reader, doc) => readers[reader] === doc.tenant && reader === doc.reader;
export const retrieve = (reader) =>
  sources.filter((d) => permitted(reader, d)).sort((a, b) => b.score - a.score);
export const deliveries = [
  { reader: 'Alice', doc: sources[2] },
  { reader: 'Bob', doc: sources[1] },
];
export const weightsGB = 72 * 2;
const trace = multiTenantConstructionModel('stream-clocks').events;
const outputs = trace.filter((e) => e.tokens > 0);
export const bundledEvents = outputs.map((e) => e.tokens);
export const stream = {
  first: outputs[0].at,
  bundle: outputs[1].at,
  end: trace.at(-1).at,
  count: bundledEvents.reduce((sum, n) => sum + n, 0),
};
export const separateEvents = Array(stream.count).fill(1);
export const gapSamples = (events) => Math.max(0, events.length - 1);
export const gap = stream.bundle - stream.first;
export const tpot = (stream.end - stream.first) / (stream.count - 1);
export const gate = (r) => r.complete && r.first <= 800 && r.gap <= 120;
export const offered = MULTITENANT_REQUESTS;
const qualifying = offered.filter(gate).length;
export const trial = {
  minutes: 1,
  qualifying,
  successPercent: (100 * qualifying) / offered.length,
};
export const goodputPerMinute = trial.qualifying / trial.minutes;
export const standard = {
  tenant: 'A',
  request: 'r1',
  attempt: 1,
  revision: 'docs-v2',
  limit: 1000,
  input: 300,
  cap: 400,
  output: 120,
};
export const practice = {
  tenant: 'C',
  request: 'r9',
  attempt: 2,
  revision: 'docs-v2',
  limit: 1500,
  input: 240,
  cap: 360,
  output: 90,
};
function completion(s, ledger, receipt) {
  const key = [s.tenant, s.request, s.attempt, s.revision].join('/');
  if (
    receipt.key !== key ||
    receipt.input !== s.input ||
    !Number.isInteger(receipt.output) ||
    receipt.output < 0 ||
    receipt.output > s.cap
  )
    throw Error('Invalid attempt receipt');
  const units = receipt.input + receipt.output;
  if (ledger.receipt) {
    if (ledger.receipt.output !== receipt.output) throw Error('Conflicting usage');
    return ledger;
  }
  return { available: ledger.available + ledger.held - units, held: 0, settled: units, receipt };
}
export function balance(s, booked, usage, retired, duplicate = false) {
  const held = booked ? s.input + s.cap : 0;
  let ledger = { available: s.limit - held, held, settled: 0 };
  if (booked && usage && retired) {
    const receipt = {
      key: [s.tenant, s.request, s.attempt, s.revision].join('/'),
      input: s.input,
      output: s.output,
    };
    ledger = completion(s, ledger, receipt);
    if (duplicate) ledger = completion(s, ledger, { ...receipt });
  }
  return { available: ledger.available, held: ledger.held, settled: ledger.settled };
}
export function replay(original, incoming) {
  if (original.tenant !== incoming.tenant || original.request !== incoming.request) return 'new key';
  return ['revision', 'input', 'cap'].every((k) => original[k] === incoming[k])
    ? 'existing hold'
    : 'conflict';
}
export const pagesFor = (input, cap) => Number(reserveWholePages(BigInt(input), BigInt(cap)));
export const bytes = 2 * 80 * 8 * 128 * 2;
export const pageMiB = (16 * bytes) / 2 ** 20;
export const tokenGiB = (n) => (n * bytes) / 2 ** 30;
export const pageState = (n, retired = false, granted = false) =>
  privateHistory({ bTokens: n, retired, reassigned: granted });
export { locatePosition, deficit };
const proposalWords = ['service', 'is', 'healthy'];
const block = multiTenantConstructionModel('extra-work').proposals.map((p, i) => ({
  ...p,
  word: proposalWords[i],
}));
export function proposalSlots({ proposed, checked, accepted, rejected, released }) {
  const firstRejected = block.findIndex((p) => !p.accepted);
  return block.map((p, i) => {
    const kept = accepted && p.accepted;
    const dropped = rejected && !p.accepted;
    return {
      word: proposed ? p.word : null,
      checked,
      verdict: kept ? 'Accepted' : dropped ? (i === firstRejected ? 'Rejected' : 'Discarded suffix') : null,
      state: kept ? 'Prefix' : released && dropped ? 'Free' : 'Held',
    };
  });
}
export function prefixRefs(retA, retB) {
  return [
    [0, 1],
    [0, 2],
  ].map((ids, i) => ((i === 0 ? retA : retB) ? [] : ids));
}
export const remote = { lookup: 18, transfer: 42, rebuild: 45, deadline: 70 };
export function adapterSlot(aliasMoved, readerRetired, loadRequested) {
  const loaded = readerRetired && loadRequested;
  return {
    alias: aliasMoved ? 'docs-v3' : 'docs-v2',
    artifact: loaded ? 'B-brief-v1' : 'docs-v2',
    aliceRefs: readerRetired ? 0 : 1,
    loaded,
  };
}
export const guidePrefix = {
  reader: 'Alice',
  acl: 'ACL v1',
  base: 'base-v3',
  adapter: 'docs-v2',
  tokens: '[1,5,9]',
};
export function readGuide(reader, acl) {
  if (!permitted(reader, retrieve('Alice')[0])) return 'No reader grant';
  return acl === guidePrefix.acl ? 'Prior entry under ACL v1' : 'Old entry unreachable';
}
export const machine = { devices: 4, seconds: 0.2, deviceHour: 2, share: 0.25 };
export function price(m) {
  const gpuSeconds = m.devices * m.seconds,
    nodeHour = m.devices * m.deviceHour;
  const total = (gpuSeconds * m.deviceHour) / 3600;
  return { gpuSeconds, nodeHour, total, a: total * m.share, b: total * (1 - m.share) };
}
export function recovery(
  spec,
  { booked = true, lost = false, usage = false, retired = false, handles = 0, duplicate = false } = {},
) {
  const ledger = balance(spec, booked, usage, retired, duplicate);
  return {
    ...ledger,
    livePages: booked && !retired ? handles : 0,
    status: retired ? 'retired' : lost ? 'checking owner' : 'running',
    usage,
    retired,
  };
}
export function checkExamples() {
  assert.deepEqual(
    deliveries.map(({ reader, doc }) => permitted(reader, doc)),
    [true, false],
  );
  assert.deepEqual(retrieve('Alice'), [sources[2]]);
  assert.deepEqual(retrieve('Bob'), [sources[0]]);
  assert.equal((weightsGB * 100) / 1000, 14.4);
  assert.deepEqual([gap, tpot], [120, 35]);
  assert.deepEqual(bundledEvents, [1, 4]);
  assert.deepEqual(separateEvents, [1, 1, 1, 1, 1]);
  assert.deepEqual([gapSamples(bundledEvents), gapSamples(separateEvents)], [1, 4]);
  assert.deepEqual(offered.map(gate), [true, true, false, false, true]);
  assert.deepEqual([trial.successPercent, goodputPerMinute], [60, 3]);
  const booked = balance(standard, true, false, false);
  assert.deepEqual(booked, { available: 300, held: 700, settled: 0 });
  assert.ok(booked.available < standard.input + standard.cap);
  assert.equal(replay(standard, { ...standard }), 'existing hold');
  assert.equal(replay(standard, { ...standard, revision: 'docs-v3' }), 'conflict');
  const receipt = { key: 'A/r1/1/docs-v2', input: 300, output: 120 };
  const charged = completion(standard, booked, receipt);
  assert.equal(completion(standard, charged, { ...receipt }), charged);
  assert.throws(() => completion(standard, charged, { ...receipt, output: 121 }), /Conflicting usage/);
  assert.throws(
    () => completion(standard, charged, { ...receipt, key: 'B/r1/1/docs-v2' }),
    /Invalid attempt/,
  );
  assert.equal(bytes, 327680);
  assert.equal(pageMiB, 5);
  assert.equal(pagesFor(16, 1), 2);
  assert.equal(reserveWholePages(2n ** 54n, 1n), 2n ** 50n + 1n);
  const start = pageState(31),
    full = pageState(32),
    free = pageState(32, true),
    grant = pageState(32, true, true),
    written = pageState(33, true, true);
  assert.deepEqual(
    start.pages.map((p) => p.used),
    [16, 16, 16, 15, 15],
  );
  assert.deepEqual(locatePosition(full.tables.B, 32), { page: 3, slot: 15 });
  assert.equal(locatePosition(full.tables.B, 33), null);
  assert.equal(full.pages[4].owner, 'A');
  assert.throws(() => pageState(33));
  assert.throws(() => pageState(32, false, true));
  assert.deepEqual([free.freePages, grant.freePages, grant.pages[4].used], [3, 2, 0]);
  assert.deepEqual(locatePosition(written.tables.B, 33), { page: 4, slot: 0 });
  assert.deepEqual(
    written.pages.map((p) => p.used),
    [0, 16, 0, 16, 1],
  );
  assert.deepEqual(prefixRefs(true, false), [[], [0, 2]]);
  assert.deepEqual(prefixRefs(true, true), [[], []]);
  assert.equal(remote.lookup + remote.transfer, 60);
  assert.equal(remote.deadline - remote.rebuild, 25);
  assert.deepEqual(deficit(2).credit, { A: 2, B: 0 });
  assert.deepEqual(deficit(3), {
    credit: { A: 0, B: 0 },
    served: { A: 12, B: 6 },
    jobs: { A: 4, B: 6 },
  });
  const verified = { proposed: true, checked: true, accepted: true, rejected: true, released: false };
  const pending = proposalSlots(verified);
  assert.deepEqual(pending.map((p) => p.word), proposalWords);
  assert.deepEqual(pending.map((p) => p.verdict), ['Accepted', 'Rejected', 'Discarded suffix']);
  assert.deepEqual(pending.map((p) => p.state), ['Prefix', 'Held', 'Held']);
  const released = proposalSlots({ ...verified, released: true });
  assert.deepEqual(released.map((p) => p.state), ['Prefix', 'Free', 'Free']);
  assert.ok(released.every((p, i) => p.checked && p.word === pending[i].word));
  assert.deepEqual(adapterSlot(true, false, true), {
    alias: 'docs-v3',
    artifact: 'docs-v2',
    aliceRefs: 1,
    loaded: false,
  });
  assert.equal(adapterSlot(true, true, false).artifact, 'docs-v2');
  assert.equal(adapterSlot(true, true, true).artifact, 'B-brief-v1');
  assert.equal(readGuide('Carol', 'ACL v1'), 'No reader grant');
  assert.equal(readGuide('Alice', 'ACL v2'), 'Old entry unreachable');
  const cost = price(machine);
  assert.equal(cost.total, (machine.seconds * cost.nodeHour) / 3600);
  assert.equal(cost.a + cost.b, cost.total);
  assert.equal((cost.gpuSeconds * cost.nodeHour) / 3600, cost.total * 4);
  for (const [s, handles, last] of [
    [standard, 3, [580, 420]],
    [practice, pagesFor(240, 360), [1170, 330]],
  ]) {
    const waiting = recovery(s, { lost: true, handles });
    const reported = recovery(s, { lost: true, usage: true, handles });
    assert.equal(reported.held, waiting.held);
    assert.equal(reported.livePages, handles);
    const done = recovery(s, { lost: true, usage: true, retired: true, handles });
    assert.deepEqual(
      [done.available, done.held, done.settled, done.livePages],
      [last[0], 0, last[1], 0],
    );
    assert.deepEqual(
      recovery(s, { lost: true, usage: true, retired: true, handles, duplicate: true }),
      done,
    );
  }
  assert.equal(pagesFor(practice.input, practice.cap), 38);
}

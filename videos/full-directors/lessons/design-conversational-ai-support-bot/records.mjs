import assert from 'node:assert/strict';
import {
  original,
  small,
  documents,
  policyDigest,
} from '../../../films/design-conversational-ai-support-bot/fixtures.mjs';
import {
  mergeObservation,
  evidenceErrors,
  packet,
  acknowledgmentMatches,
} from '../../../films/design-conversational-ai-support-bot/model.mjs';
import {
  hash,
  supportCost,
} from '../../../films/design-conversational-ai-support-bot/arithmetic.mjs';
import {
  decide,
  tuple,
  sign,
  confirmed,
  confirmedForty,
  storageOnSameInvoice,
  submit,
  sharedCommit,
  compareRows,
  mayaExpected,
  runQueue,
  replays,
  replayPrefixes,
} from './ledger.mjs';
export {
  confirmedForty,
  storageOnSameInvoice,
  compareRows,
  mayaExpected,
  runQueue,
  replays,
  replayPrefixes,
  original,
  small,
  confirmed,
  documents,
  decide,
  mergeObservation,
  packet,
  acknowledgmentMatches,
  hash,
  tuple,
};
const empty = { rows: [], outbox: [] };
const gpuCommit = sharedCommit(empty, confirmed);
export const race = {
  empty,
  first: gpuCommit,
  second: sharedCommit(gpuCommit, storageOnSameInvoice),
};
export const limits = { days: 30, review: 50000 };
export const workerTokens = [7, 8];
export const staleToken = (presented, retained) => presented < retained;
export const publicCacheKey = (region, version, scope) => [region, version, scope].join(' / ');
export const storage = {
  ...original,
  item: 'storage-addon',
  invoiceItem: 'storage-addon',
  invoice: 'A10236',
  revision: 5,
  total: 2000,
  amount: 2000,
  confirmed: null,
};
export const changed = { ...confirmed, amount: 4000 };
export const boundary = sign({ ...small, amount: limits.review });
export const maya31 = sign({
  ...original,
  customer: 'Maya',
  owner: 'Maya',
  invoice: 'M240',
  ticket: 'M240',
  amount: 24000,
  total: 24000,
  age: 31,
});
export const maya30 = { ...maya31, age: 30 };
export const mayaUnsigned = { ...maya30, confirmed: null };
export const reviewPacket = packet(original);
export const reviewReceipt = {
  success: true,
  queue: 'specialist',
  packet: hash(reviewPacket),
  reference: 'REV-' + original.ticket,
};
export const posted = { A10234: [], M240: [] };
export const postedAmount = (s) => posted[s.invoice].reduce((sum, row) => sum + row.amount, 0);
export function collection(region, edited = false) {
  const current = { ...original, region };
  return documents.map((source, i) => {
    const doc =
      edited && i === 0 ? { ...source, text: source.text.replace('30 days', '60 days') } : source;
    return { ...doc, computed: hash(doc.text), errors: evidenceErrors(doc, current) };
  });
}
export function scheduleState(
  t,
  serial = false,
  expired = false,
  invoiceRevision = original.revision,
) {
  const start = serial ? 2 : 0,
    invoiceEnd = start + 3;
  const read = {
    customer: original.customer,
    invoice: original.invoice,
    revision: original.revision,
    success: true,
  };
  const policy = t >= 2 && mergeObservation(original, read);
  const invoice =
    t >= invoiceEnd &&
    mergeObservation(original, { ...read, revision: invoiceRevision, success: !expired });
  return {
    policy,
    invoice,
    timeout: expired && t >= invoiceEnd,
    join: policy && invoice,
    stages: [
      [0, Math.min(t, 2)],
      [start, Math.max(start, Math.min(t, invoiceEnd))],
      [invoiceEnd, invoiceEnd + (policy && invoice ? Math.max(0, Math.min(1, t - invoiceEnd)) : 0)],
    ],
  };
}
function bill(input, cached, out) {
  return { input, cached, out, ...supportCost(input, cached, out) };
}
export const first = bill(2000, 1280, 130),
  revision = bill(2170, 1920, 130),
  cold = bill(2000, 0, 130);
export const latency = { reads: 180, primary: 940, fallback: 1100, check: 10 };
export const budget = {
  cap: 0.02,
  perCall: 0.01,
  output: 300,
  attempts: 2,
  deadline: 2500,
  normalMs: latency.reads + 2 * (latency.primary + latency.check),
  coldMs: latency.reads + latency.primary + latency.fallback + latency.check,
};
export const repairAllowed = (attempts, used, revisions, time, spend) =>
  used < attempts && revisions < 1 && time && spend;
export function check() {
  assert(staleToken(workerTokens[0], workerTokens[1]));
  assert(!staleToken(workerTokens[1], workerTokens[1]));
  const cached = publicCacheKey('US', 'v3', 'public');
  assert.notEqual(cached, publicCacheKey('US', 'v4', 'public'));
  assert.notEqual(cached, publicCacheKey('CA', 'v3', 'public'));
  assert.notEqual(cached, publicCacheKey('US', 'v3', 'private'));
  assert.deepEqual(
    [original, small, confirmed, changed, boundary, maya31, maya30, mayaUnsigned].map(
      (s) => decide(s).outcome,
    ),
    [
      'HANDOFF',
      'CONFIRM',
      'QUEUE ELIGIBLE',
      'CONFIRM',
      'HANDOFF',
      'HANDOFF',
      'QUEUE ELIGIBLE',
      'CONFIRM',
    ],
  );
  assert.equal(maya31.confirmed, maya30.confirmed);
  assert.deepEqual(
    Object.keys(tuple(confirmed)).filter((k) => tuple(confirmed)[k] !== tuple(changed)[k]),
    ['amount'],
  );
  assert.deepEqual(
    collection('US')
      .filter((d) => !d.errors.length)
      .map((d) => d.id),
    ['US-v3'],
  );
  assert.equal(collection('US', true).filter((d) => !d.errors.length).length, 0);
  assert.equal(collection('CA').filter((d) => !d.errors.length).length, 0);
  assert.deepEqual(collection('US', true)[0].errors, ['digest']);
  assert.equal(mergeObservation(storage, { ...original, success: true }), false);
  assert.equal(mergeObservation(storage, { ...storage, success: true }), true);
  for (const [t, policy, invoice, merge] of [
    [1.9, false, false, 0],
    [2, true, false, 0],
    [2.5, true, false, 0],
    [3, true, true, 0],
    [3.5, true, true, 0.5],
    [4, true, true, 1],
  ]) {
    const s = scheduleState(t);
    assert.equal(s.policy, policy);
    assert.equal(s.invoice, invoice);
    assert.equal(s.stages[2][1] - 3, merge);
  }
  assert.equal(scheduleState(6, true).stages[2][1], 6);
  assert.equal(scheduleState(4, false, true).join, false);
  assert.equal(scheduleState(4, false, false, 3).join, false);
  for (const [mode, status] of [
    ['insert', 'INSERTED'],
    ['retry', 'RECOVERED'],
    ['conflict', 'CONFLICT'],
    ['reticket', 'DUPLICATE INVOICE'],
  ]) {
    const q = runQueue(confirmed, mode);
    assert.equal(q.result.status, status);
    assert.equal(q.rows.length, 1);
    assert.equal(q.rows[0].payload.amount, 3500);
  }
  assert.equal(runQueue(original, 'insert').rows.length, 0);
  assert.deepEqual(runQueue(maya30, 'retry').rows, mayaExpected);
  assert.deepEqual(Object.keys(tuple(confirmed)).sort(), [
    'amount',
    'customer',
    'invoice',
    'item',
    'policy',
    'requestType',
    'revision',
  ]);
  for (const field of ['customer', 'invoice', 'item', 'intent', 'amount', 'policy', 'revision']) {
    const other = { ...small, [field]: field === 'amount' || field === 'revision' ? 99 : 'other' };
    const wrongSignature = sign(other).confirmed;
    assert.equal(decide({ ...small, confirmed: wrongSignature }).outcome, 'CONFIRM', field);
  }
  const accountRows = [];
  const stored = submit(accountRows, confirmed);
  assert.equal(submit(accountRows, changed).status, 'CONFIRM');
  assert.equal(submit(accountRows, confirmedForty).status, 'CONFLICT');
  assert.equal(submit(accountRows, confirmed).entry, stored.entry);
  assert.equal(decide(storageOnSameInvoice).outcome, 'QUEUE ELIGIBLE');
  assert.equal(submit(accountRows, storageOnSameInvoice).status, 'DUPLICATE INVOICE');
  assert.equal(
    submit(accountRows, sign({ ...small, customer: 'Maya', owner: 'Maya' })).status,
    'INSERTED',
  );
  assert.equal(accountRows.length, 2);
  assert.deepEqual(race.empty, { rows: [], outbox: [] });
  assert.equal(race.first.result.status, 'INSERTED');
  assert.equal(race.second.result.status, 'DUPLICATE INVOICE');
  assert.deepEqual(race.first.rows, replays.normal.expected);
  assert.deepEqual(race.first.outbox, [{ operation: 'credit:48291', account: 'Alex' }]);
  assert.deepEqual(race.second.rows, race.first.rows);
  assert.deepEqual(race.second.outbox, race.first.outbox);
  assert.equal(acknowledgmentMatches(reviewPacket, reviewReceipt), true);
  for (const change of [
    { success: false },
    { queue: 'other' },
    { reference: '' },
    { packet: hash(packet({ ...original, revision: 3 })) },
    { packet: hash(packet({ ...original, authenticated: false })) },
  ])
    assert.equal(acknowledgmentMatches(reviewPacket, { ...reviewReceipt, ...change }), false);
  assert.equal(postedAmount(maya30) + postedAmount(original), 0);
  assert.deepEqual(
    [first.total, revision.total, cold.total, first.reserve, revision.reserve].map((v) =>
      v.toFixed(6),
    ),
    ['0.004070', '0.003055', '0.006950', '0.009500', '0.009925'],
  );
  assert.equal((first.reserve + cold.total).toFixed(6), '0.016450');
  assert.deepEqual(
    [budget.normalMs, budget.deadline - budget.normalMs, budget.coldMs],
    [2080, 420, 2230],
  );
  assert.deepEqual(
    [replays.normal.ready, replays.extra.ready, replays.missing.ready],
    [true, false, false],
  );
  assert.equal(replays.extra.unexpected.length, 1);
  assert.equal(replays.missing.missing.length, 1);
  assert.equal(replays.duplicate.ready, false);
  assert.equal(replays.duplicate.labelsPass, 12);
  assert.deepEqual(replays.duplicate.unexpected, replays.normal.expected);
  assert.equal(replays.duplicate.missing.length, 0);
  const row = mayaExpected[0];
  assert(compareRows([row, ...replays.normal.expected], [...replays.normal.expected, row]).equal);
  assert.equal(compareRows([row, row], [row]).missing.length, 1);
  for (const field of Object.keys(row.payload)) {
    const swapped = { ...row, payload: { ...row.payload, [field]: null } };
    assert.equal(compareRows(mayaExpected, [swapped]).equal, false, field);
  }
  assert.equal(compareRows(mayaExpected, [{ ...row, key: 'other' }]).equal, false);
  assert.equal(replays.extra.labelsPass, 12);
  assert.equal(budget.deadline - budget.coldMs, 270);
  assert.equal(replayPrefixes[3].actual.length, 0);
  assert.equal(replayPrefixes[4].actual.length, 1);
  assert(repairAllowed(3, 2, 0, true, true));
  assert(!repairAllowed(2, 2, 0, true, true));
  assert.equal(policyDigest, documents[0].digest);
  return true;
}

import assert from 'node:assert/strict';
import {
  EVENTS,
  RATE,
  MONITOR_POLICY,
  receipts,
} from '../../../films/observability-monitoring-llm-systems/fixtures.mjs';
import {
  joinReviews,
  summarize,
  unsafeServeBounds,
  estimate,
  alert,
  exportRecord,
  repeatCount,
  sum,
} from '../../../films/observability-monitoring-llm-systems/arithmetic.mjs';
export {
  EVENTS,
  RATE,
  MONITOR_POLICY,
  receipts,
  joinReviews,
  summarize,
  unsafeServeBounds,
  estimate,
  alert,
  exportRecord,
  repeatCount,
  sum,
};
export const pair = ['202', '205'].map((id) => EVENTS.find((r) => r.id === id));
export const approvalRequest = pair[1];
export const approvalSpans = {
  retrieval: { id: 1, name: 'Retrieval', end: 90, output: 'v17 · unsigned' },
  chat: { id: 2, name: 'Chat', end: 380, output: '“Approved.”' },
  gate: { id: 3, name: 'Gate', end: approvalRequest.total, output: '“Approved.”' },
};
export const lookupCalls = [
  { spanId: 11, tool: 'lookup' },
  { spanId: 12, tool: 'lookup' },
];
export const workerSpan = { spanId: 13, parentId: lookupCalls[0].spanId };
export const last = EVENTS.at(-1);
export const untrustedRequestId = 'operator@example.test';
const ingressIds = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8'];
const finalEventIds = new Set(['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7']);
export function reconcileIngress(includeEighth) {
  const rows = (includeEighth ? ingressIds : ingressIds.slice(0, 7)).map((id) => ({
    id,
    hasFinal: finalEventIds.has(id),
  }));
  const received = rows.filter((row) => row.hasFinal).length;
  return { rows, received, missing: rows.length - received };
}
export const tokenTimes = [150, 200, 250, 300, 350, 400, 450];
export const chunkReceipts = [
  { ms: 100, tokens: [] },
  { ms: 300, tokens: [1, 2, 3] },
  { ms: 500, tokens: [4, 5, 6, 7] },
];
export const streamCloseMs = 600;
export const clientDelayMs = 300;
export const delayedTokenTimes = (delay) => tokenTimes.map((ms) => ms + delay);
export const longStream = Array.from(
  { length: 30 },
  (_, i) => last.ttft + (i * (last.total - last.ttft)) / 29,
);
export const timings = [170, 220, 180, 260, 200, 240, 190, 210];
export const kept = [EVENTS[0], ...EVENTS.slice(-2)];
export const validRecord = {
  request: '206',
  prompt: 'deploy-answerer-v1.1',
  evidence: 'deploy-policy@17',
  route: 'serve',
  input: last.input,
  output: last.output,
  operator_note: 'private',
};
export const brokenRows = EVENTS.map((r) =>
  r === last ? { ...r, ttft: null, cached: r.input + 1 } : r,
);
export const cacheRows = [1000, 10, 10, 10, 10].map((input, i) => ({
  input,
  cached: i === 0 ? 900 : 0,
}));
export function throughput(times) {
  if (
    !times.length ||
    times.some((v, i) => !Number.isFinite(v) || v < 0 || (i > 0 && v < times[i - 1]))
  )
    throw Error('Invalid arrivals');
  const seconds = (times.at(-1) - times[0]) / 1000;
  return seconds > 0 ? (times.length - 1) / seconds : null;
}
export function boundsRows(missing) {
  return [true, true, false, true, true, false, false]
    .slice(0, missing ? 6 : 7)
    .map((served, i) => ({ id: i + 1, served, unsafe: i < 3 ? i === 0 : null }));
}
export function sampleRatio(rows) {
  const weighted = rows.map(({ id, unsafe }) => {
    const probability = unsafe ? 1 : 1 / 4;
    return { id, unsafe, probability, weight: 1 / probability };
  });
  const unsafe = sum(weighted.filter((r) => r.unsafe).map((r) => r.weight)),
    all = sum(weighted.map((r) => r.weight));
  return { weighted, unsafe, all };
}
export function histories(n, cap = Infinity) {
  return Array.from({ length: n }, (_, i) => Math.min(cap, 100 + 20 * i));
}
export function admission(markers, elapsed, deadline, spent, reserve, cap) {
  const repeats = repeatCount(markers.map((m) => ['lookup', '42', m]));
  const timeOK = elapsed < deadline,
    spendOK = spent + reserve <= cap;
  return { repeats, timeOK, spendOK, allowed: repeats < 3 && timeOK && spendOK };
}
export function trial(number) {
  const cases = [
    { id: '205', answerable: false, served: false },
    { id: '201', answerable: true, served: number === 2 },
  ];
  return {
    cases,
    reviewed: cases.length,
    unsafe: cases.filter((r) => r.served && !r.answerable).length,
    useful: cases.filter((r) => r.served && r.answerable).length,
  };
}
export function collector(seconds) {
  return { buffered: seconds < 10, closed: seconds >= 10, receipt: seconds >= 60 };
}
export function checkExamples() {
  const { retrieval, chat, gate } = approvalSpans;
  assert.equal(approvalRequest.id, '205');
  assert.deepEqual([retrieval.id, chat.id, gate.id], [1, 2, 3]);
  assert.deepEqual([retrieval.end, chat.end, gate.end], [90, 380, 430]);
  assert.equal(chat.output, gate.output);
  assert.equal(approvalRequest.stage, 'generation');
  assert.equal(approvalRequest.escape, 'gate');
  assert.equal(new Set(lookupCalls.map((call) => call.tool)).size, 1);
  assert.deepEqual(lookupCalls.map((call) => call.spanId), [11, 12]);
  assert.equal(workerSpan.parentId, 11);
  assert(!lookupCalls.some((call) => call.spanId === workerSpan.spanId));
  const matched = reconcileIngress(false);
  const gap = reconcileIngress(true);
  assert.deepEqual([matched.rows.length, matched.received, matched.missing], [7, 7, 0]);
  assert.deepEqual([gap.rows.length, gap.received, gap.missing], [8, 7, 1]);
  assert.deepEqual(gap.rows.slice(0, 7), matched.rows);
  assert.deepEqual(gap.rows.filter((row) => !row.hasFinal), [{ id: 'R8', hasFinal: false }]);
  assert.deepEqual(
    pair.map((r) => r.served),
    [false, true],
  );
  assert.deepEqual(
    EVENTS.filter((r) => r.unsafe).map((r) => r.id),
    ['205', '206'],
  );
  assert.equal(summarize(joinReviews(EVENTS, [...receipts, receipts[4]])).conditional, 2 / 3);
  assert.throws(() => joinReviews(EVENTS, [{ id: '999', unsafe: false }]));
  for (const missing of [false, true]) {
    const bound = unsafeServeBounds(boundsRows(missing), 7);
    assert.deepEqual([bound.lowerCount, bound.upperCount], [1, missing ? 4 : 3]);
  }
  assert.equal(throughput(tokenTimes), 20);
  const textReceipts = chunkReceipts.filter((receipt) => receipt.tokens.length);
  assert.deepEqual(chunkReceipts.map(({ tokens }) => tokens.length), [0, 3, 4]);
  assert.deepEqual(textReceipts.map(({ ms }) => ms), [300, 500]);
  assert.deepEqual(textReceipts.flatMap(({ tokens }) => tokens), tokenTimes.map((_, i) => i + 1));
  for (const { ms, tokens } of textReceipts) {
    assert(tokens.every((id) => tokenTimes[id - 1] <= ms));
  }
  assert(streamCloseMs > textReceipts.at(-1).ms);
  const delayed = delayedTokenTimes(clientDelayMs);
  assert.deepEqual(delayed, [450, 500, 550, 600, 650, 700, 750]);
  assert.equal(throughput(delayed), throughput(tokenTimes));
  assert.equal(throughput([150]), null);
  assert.equal(throughput([150, 150]), null);
  assert.throws(() => throughput([450, 150]));
  assert.equal(throughput(longStream).toFixed(1), '134.9');
  assert.equal([...timings].sort((a, b) => a - b)[Math.ceil(timings.length * 0.95) - 1], 260);
  assert.equal(estimate(last).toFixed(6), '0.000279');
  assert.throws(() => estimate(brokenRows.at(-1)));
  assert.equal(sum(EVENTS.map(estimate)).toFixed(7), '0.0014274');
  assert.equal(sum(cacheRows.map((r) => r.input)), 1040);
  assert.equal(cacheRows.filter((r) => r.cached > 0).length, 1);
  assert.deepEqual(alert(brokenRows), [
    'PAGE: unsupported served claims',
    'UNKNOWN: latency measurement',
    'UNKNOWN: usage measurement',
  ]);
  assert(!('operator_note' in exportRecord(validRecord)));
  assert.equal(exportRecord(validRecord).request, validRecord.request);
  assert.throws(() => exportRecord({ ...validRecord, request: untrustedRequestId }), /unapproved request identifier/);
  assert.throws(() => exportRecord({ ...validRecord, evidence: 'unknown' }));
  for (const [t, v] of [
    [9, [true, false, false]],
    [10, [false, true, false]],
    [59, [false, true, false]],
    [60, [false, true, true]],
  ])
    assert.deepEqual(Object.values(collector(t)), v);
  const fullSample = sampleRatio(kept);
  const unsafeOnly = sampleRatio(kept.filter((r) => r.unsafe));
  assert.deepEqual(
    fullSample.weighted.map(({ id, probability, weight }) => [id, probability, weight]),
    [['201', 1 / 4, 4], ['205', 1, 1], ['206', 1, 1]],
  );
  assert.deepEqual([fullSample.unsafe, fullSample.all], [2, 6]);
  assert.deepEqual([unsafeOnly.unsafe, unsafeOnly.all], [2, 2]);
  assert.equal(fullSample.unsafe / fullSample.all, EVENTS.filter((r) => r.unsafe).length / EVENTS.length);
  assert.deepEqual(
    [4, 8].flatMap((n) => [sum(histories(n)), sum(histories(n, 120))]),
    [520, 460, 1360, 940],
  );
  assert.deepEqual(
    [
      admission(['L', 'L', 'M', 'M'], 12, 12, 6, 5, 10),
      admission(['L', 'L', 'M', 'M'], 12, 16, 6, 5, 10),
      admission(['L', 'L', 'M', 'M'], 12, 16, 6, 3, 10),
    ].map((s) => [s.repeats, s.timeOK, s.spendOK, s.allowed]),
    [
      [2, false, false, false],
      [2, true, false, false],
      [2, true, true, true],
    ],
  );
  assert.deepEqual(
    [trial(1), trial(2)].map((r) => [r.reviewed, r.unsafe, r.useful]),
    [
      [2, 0, 0],
      [2, 0, 1],
    ],
  );
  return true;
}

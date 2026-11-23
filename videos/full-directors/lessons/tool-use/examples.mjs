import assert from 'node:assert/strict';
import {
  TOOL_RECEIPTS,
  TOOL_GOOD_TRACE,
  operationService,
} from '../../../films/tool-use/fixtures.mjs';
import { proposalFingerprint, safeToolCosine } from '../../../films/tool-use/arithmetic.mjs';
import {
  admitToolResult,
  authorize,
  dispatchReaderEvaluation,
  observationTrace,
  permittedToolRanking,
  releaseCall,
  releasePromotionTarget,
  requiredToolComparison,
  sameSuiteToolComparison,
  scopedReleaseRead,
  scoreToolTrajectory,
  strictReleaseArguments,
  typedToolRelease,
  validArgs,
  validatedReleaseCalls,
} from '../../../films/tool-use/model.mjs';
export {
  admitToolResult,
  authorize,
  proposalFingerprint,
  requiredToolComparison,
  safeToolCosine,
  sameSuiteToolComparison,
  validArgs,
};
export const observation = observationTrace();
export const b7 = observation.call.arguments.book_id;
export const inventory = Array.from(
  { length: observation.serviceResult.available_copies },
  (_, i) => ({ copy: i + 1, book: b7 }),
);
export const statusCall = { ...releaseCall(), id: 'fc_item_1' };
export const canary = scopedReleaseRead({ project_id: 'search' }, 'reranker-v16');
export const batch = [
  statusCall,
  {
    ...releaseCall('status-2', 'reranker-v17'),
    status: 'in_progress',
    arguments: '{"release_id":',
  },
];
export function tryCall(fn) {
  try {
    return { ok: true, data: fn() };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
export const batchResult = tryCall(() =>
  validatedReleaseCalls({ status: 'completed', output: batch }),
);
export const strictCases = [
  { release_id: 'rank-v9' },
  { release_id: 'rank-v9', include_gates: null },
  { release_id: 'rank-v9', include_gates: true },
  { release_id: 'rank-v9', include_gates: 1 },
  { release_id: '-rank-v9', include_gates: true },
].map((input) => ({ input, result: tryCall(() => strictReleaseArguments(input)) }));
export function scoped(owner = 'search', id = 'R22') {
  return scopedReleaseRead({ project_id: 'search' }, id, {
    R22: { project_id: owner, status: 'canary_clean' },
  });
}
const evaluation = (n) =>
  dispatchReaderEvaluation({
    name: 'get_eval',
    call_id: 'c' + n,
    arguments: JSON.stringify({ version: 'reranker-v' + n }),
  });
export const evals = [evaluation(17), evaluation(16)];
const validEval = { name: 'get_eval', arguments: '{"version":"reranker-v17"}', call_id: 'c17' };
export const badEvals = [
  ['Tool', 'promote_model', { name: 'promote_model' }],
  ['Scope', 'reranker-v99', { arguments: '{"version":"reranker-v99"}' }],
  ['Shape', 'approved: true', { arguments: '{"version":"reranker-v17","approved":true}' }],
  ['Keys', 'version twice', { arguments: '{"version":"reranker-v17","version":"reranker-v16"}' }],
  ['Stream', 'unfinished JSON', { arguments: '{"version":' }],
].map(([field, value, patch]) => ({
  field,
  value,
  result: tryCall(() => dispatchReaderEvaluation({ ...validEval, ...patch })),
}));
function libraryRun(key, book) {
  const target = operationService();
  target.apply('op-17', { book_id: b7 });
  const reply = key ? tryCall(() => target.apply(key, { book_id: book })) : null;
  return { ...target.snapshot(), reply };
}
export const holds = {
  committed: libraryRun(),
  reused: libraryRun('op-17', b7),
  fresh: libraryRun('op-18', b7),
  conflict: libraryRun('op-17', 'B8'),
};
export const lookupHold = (state, op) => state.ledger.find((row) => row.operation === op);
const alice = { principal: 'alice', project: 'search', can_promote: true };
const args = { release_id: 'reranker-v17' };
function promotionHistory() {
  const target = releasePromotionTarget();
  const first = target.apply(alice, args, 'a', { loseResponse: true });
  const saved = target.snapshot().ledger[0];
  target.setReleaseGate(args.release_id, false);
  const blocked = target.apply(alice, args, 'a');
  target.setReleaseGate(args.release_id, true);
  const replay = target.apply(alice, args, 'a');
  const second = target.apply(alice, args, 'b');
  const collision = target.apply(alice, { release_id: 'reranker-v18' }, 'collision');
  return { first, saved, blocked, replay, second, collision };
}
export const promotion = promotionHistory();
export const repeated = [
  { id: 'c41', name: 'get_release_status', args: { release_id: 'rank-v9', include_gates: 1 } },
  { id: 'c42', name: 'get_release_status', args: { include_gates: 1, release_id: 'rank-v9' } },
];
export const repeatStops = proposalFingerprint(repeated[0]) === proposalFingerprint(repeated[1]);
export const required = { 'call-1': 'reranker-v16', 'call-2': 'reranker-v17' };
export const failed = { call_id: 'call-1', ok: false, error: 'timeout' };
export const first = { call_id: 'call-1', release_id: required['call-1'], ...canary };
export const second = {
  call_id: 'call-2',
  release_id: required['call-2'],
  ok: true,
  status: 'canary_clean',
  error_rate: 0.009,
  budget: 0.02,
};
export const catalog = [
  { name: 'A · status', role: 'triage', vector: [0.6, 0.8, 0] },
  { name: 'B · policy', role: 'triage', vector: [0.8, 0.6, 0] },
  { name: 'Promote', role: 'admin', vector: [1, 0, 0] },
  { name: 'Restart', role: 'admin', vector: [0, 1, 0] },
];
export const ranked = permittedToolRanking([1, 0, 0], catalog, ['triage'], 2);
export const trace = TOOL_GOOD_TRACE;
export function traceCase(badText, badOk) {
  const [call, obs, answer] = trace;
  const events = [
    call,
    { ...obs, ok: badOk ? 1 : true },
    { ...answer, text: badText ? 'Release reranker-v16: succeeded.' : answer.text },
  ];
  return { events, result: scoreToolTrajectory(events) };
}
export const receipts = TOOL_RECEIPTS,
  aggregate = typedToolRelease(receipts);
export function violationRun(corrected) {
  const six = Array.from({ length: 6 }, (_, i) => ({
    ...receipts[0],
    unauthorized_reads: i === 0 ? 1 : i === 1 && !corrected ? -1 : 0,
  }));
  return { six, result: tryCall(() => typedToolRelease(six)) };
}
export const attempts = [
  { ms: 400, cents: 1 },
  { ms: 600, cents: 1 },
];
export const protocolHosts = ['Assistant 1', 'Assistant 2', 'Assistant 3'];
export const protocolServices = ['Service 1', 'Service 2', 'Service 3', 'Service 4'];
export const protocolConnections = protocolHosts.flatMap((_, host) =>
  protocolServices.map((_, server) => ({ host, server })),
);
export function budgetState(reserved, completed) {
  const done = attempts.slice(0, completed);
  return {
    reserved,
    ms: done.reduce((sum, a) => sum + a.ms, 0),
    cents: done.reduce((sum, a) => sum + a.cents, 0),
  };
}
export const finalReads = [
  { release: 'A', suite: 'Q1', call_id: 'c31', score: 0.86 },
  { release: 'B', suite: 'Q2', call_id: 'c32', score: 0.89 },
  { release: 'B', suite: 'Q1', call_id: 'c33', score: 0.83, gate: 'passed' },
];
export const readSession = { principal: 'reader', project: 'search', can_promote: false };
export function proposeA(extra) {
  return releasePromotionTarget().apply(
    readSession,
    extra ? { release_id: 'A', approved: true } : { release_id: 'A' },
  );
}
export function checkExamples() {
  assert.equal(protocolHosts.length + protocolServices.length, 7);
  assert.equal(protocolConnections.length, 12);
  for (const host of protocolHosts.keys()) {
    const clients = protocolConnections.filter((connection) => connection.host === host);
    assert.deepEqual(clients.map((connection) => connection.server), [...protocolServices.keys()]);
  }
  assert.equal(inventory.length, 3);
  assert.equal(
    admitToolResult(observation.call, { ...observation.serviceResult, call_id: 'another' }),
    null,
  );
  assert.equal(authorize({ reader: 'lena' }, 'lookup', b7), true);
  assert.equal(authorize({ reader: 'lena' }, 'hold', b7), false);
  assert.equal(Math.round((canary.error_rate - canary.budget) * 1000), 61);
  assert.deepEqual(batchResult, { ok: false, error: 'call incomplete; no dispatch' });
  const completedPair = [statusCall, releaseCall(batch[1].call_id, 'reranker-v17')];
  assert.equal(batch[1].name, completedPair[1].name);
  assert.deepEqual(
    validatedReleaseCalls({ status: 'completed', output: completedPair }).map(call => call.call_id),
    ['status-1', 'status-2'],
  );
  assert.throws(
    () => validatedReleaseCalls({ status: 'completed', output: [{ ...statusCall, name: statusCall.call_id }] }),
    /tool not allowed/,
  );
  assert.deepEqual(
    strictCases.map((c) => c.result.ok),
    [true, true, true, false, false],
  );
  assert.deepEqual(scoped('ads'), scoped('ads', 'R99'));
  assert.equal(scoped().ok, true);
  assert.ok(badEvals.every((row) => !row.result.ok));
  assert.equal(sameSuiteToolComparison(evals).delta.toFixed(2), '0.03');
  assert.deepEqual(
    [holds.committed, holds.reused, holds.fresh, holds.conflict].map((r) => r.effects),
    [1, 1, 2, 1],
  );
  assert.deepEqual(
    [holds.reused, holds.fresh, holds.conflict].map((r) => r.attempts),
    [2, 2, 2],
  );
  assert.equal(holds.conflict.reply.ok, false);
  assert.equal(lookupHold(holds.committed, 'op-17').hold, 'hold-1');
  assert.equal(lookupHold(holds.committed, 'op-18'), undefined);
  assert.ok(!promotion.blocked.ok && !promotion.blocked.checks.includes('saved operation'));
  assert.equal(promotion.replay.replayed, true);
  assert.deepEqual(
    [
      promotion.first,
      promotion.blocked,
      promotion.replay,
      promotion.second,
      promotion.collision,
    ].map((r) => r.effects),
    [1, 1, 1, 2, 2],
  );
  assert.equal(repeatStops, true);
  assert.ok(repeated.every((r) => !tryCall(() => strictReleaseArguments(r.args)).ok));
  assert.equal(requiredToolComparison(required, [failed, second]).ok, false);
  assert.equal(requiredToolComparison(required, [first, second]).release_id, second.release_id);
  assert.equal(requiredToolComparison(required, [first, first]).ok, false);
  assert.deepEqual(
    ranked.map((r) => r.name),
    ['B · policy', 'A · status'],
  );
  assert.equal(traceCase(false, false).result.ok, true);
  assert.ok(!traceCase(false, true).result.ok && !traceCase(true, false).result.ok);
  assert.deepEqual(
    [aggregate.rate, aggregate.latency, aggregate.cost, aggregate.approved],
    [0.75, 680, 3.8, false],
  );
  assert.throws(() => typedToolRelease([{ ...receipts[0], unauthorized_reads: -1 }]));
  assert.equal(typedToolRelease([{ ...receipts[0], unauthorized_reads: 1 }]).approved, false);
  assert.equal(sameSuiteToolComparison(finalReads.slice(0, 2)).ok, false);
  assert.equal(sameSuiteToolComparison([finalReads[0], finalReads[2]]).delta.toFixed(2), '0.03');
  assert.equal(violationRun(false).result.ok, false);
  assert.equal(violationRun(true).result.data.reads, 1);
  assert.equal(violationRun(true).result.data.approved, false);
  assert.deepEqual(budgetState(1, 1), { reserved: 1, ms: 400, cents: 1 });
  assert.deepEqual(budgetState(2, 2), { reserved: 2, ms: 1000, cents: 2 });
  assert.equal(proposeA(true).checks.length, 0);
  assert.deepEqual(proposeA(false).checks, ['shape']);
  assert.equal(proposeA(false).effects, 0);
}

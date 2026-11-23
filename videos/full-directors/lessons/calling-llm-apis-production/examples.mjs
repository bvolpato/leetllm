import assert from 'node:assert/strict';
import { trusted, customerQuestion } from '../../../films/calling-llm-apis-production/fixtures.mjs';
import {
  actionReceipt,
  accountB,
  accountBCandidate,
  bufferThrough,
  checkRotation,
  classifyFailure,
  costTrace,
  deadlineReservation,
  deltas,
  freshBudget,
  idempotentJobTrace,
  jitterWindows,
  rates,
  reasoning,
  redactedTelemetry,
  retryPlan,
  totalInput,
  usageReceipt,
  validationCases,
  workerDraws,
} from '../../../films/calling-llm-apis-production/model.mjs';

export {
  trusted,
  accountB,
  accountBCandidate,
  bufferThrough,
  checkRotation,
  classifyFailure,
  costTrace,
  deadlineReservation,
  deltas,
  freshBudget,
  idempotentJobTrace,
  jitterWindows,
  rates,
  reasoning,
  retryPlan,
  totalInput,
  usageReceipt,
  validationCases,
  workerDraws,
};
export const timeouts = { limit: 4, lost: 3, running: 6 };
export const heartbeatExample = { count: 6, interval: 1, readTimeout: 2, firstTextDeadline: 6 };
export function heartbeatClock(elapsed) {
  const { count, interval, readTimeout, firstTextDeadline } = heartbeatExample;
  const received = Math.min(count, Math.floor(elapsed / interval));
  const lastRead = received * interval;
  return {
    received,
    lastRead,
    readDeadline: lastRead + readTimeout,
    firstTextExpired: elapsed >= firstTextDeadline,
  };
}
export const routeTests = [
  { caller: 'Signed out', signedIn: false, tenantAccess: false, withinQuota: true },
  { caller: 'Wrong tenant', signedIn: true, tenantAccess: false, withinQuota: true },
  { caller: 'Over quota', signedIn: true, tenantAccess: true, withinQuota: false },
];
export function routeReceipt(caller, enforceAccess) {
  const gates = [
    ['Sign-in', caller.signedIn],
    ['Tenant access', caller.tenantAccess],
    ['Usage limit', caller.withinQuota],
  ];
  const stop = enforceAccess ? gates.find(([, allowed]) => !allowed)?.[0] : undefined;
  return { stop: stop ?? null, providerCalls: stop ? 0 : 1 };
}
export const pendingLog = redactedTelemetry({
  question: customerQuestion,
  fingerprintKey: 'tenant-A.stage.example',
  usage: null,
});
export const paidLog = redactedTelemetry({
  question: customerQuestion,
  fingerprintKey: 'tenant-A.stage.example',
  usage: { inputTokens: 250, outputTokens: 80 },
});
export const otherTenantLog = redactedTelemetry({
  question: customerQuestion,
  fingerprintKey: 'tenant-B.stage.example',
  usage: null,
});
export const receiptForB = (stage) =>
  actionReceipt(
    'R-B',
    [
      { kind: 'create', key: 'R-B' },
      { kind: 'status', key: 'R-B', jobId: 'JOB-042' },
    ].slice(0, stage),
  );

export const permit = { opened: 103, cooldown: 10, threshold: 2 };
export function admit(state, now, id, approved = true) {
  if (state.kind === 'closed') return { route: 'primary', state };
  if (state.kind === 'open' && now >= state.since + permit.cooldown)
    return {
      route: 'probe',
      state: { kind: 'half-open', owner: id, generation: state.generation + 1 },
    };
  return { route: approved ? 'fallback' : 'routing failure', state };
}
export function completeProbe(state, generation, success, now) {
  if (state.kind !== 'half-open' || state.generation !== generation) return state;
  return { kind: success ? 'closed' : 'open', since: now, generation };
}
export const open = { kind: 'open', since: permit.opened, generation: 6 };
export const expires = open.since + permit.cooldown;
export const probeA = admit(open, expires, 'A');
export const routeB = admit(probeA.state, expires, 'B');
export const reopen = completeProbe(probeA.state, 7, false, 115);
export const probeC = admit(reopen, 125, 'C');
export const recovered = completeProbe(probeC.state, 8, true, 126);
export const deniedB = admit(probeA.state, expires, 'B', 7 <= 1);
export function stream(count, terminal) {
  return {
    text: bufferThrough(count),
    state:
      terminal === 'end' ? 'ready to validate' : terminal === 'eof' ? 'failed draft' : 'receiving',
  };
}
const bytes = new TextEncoder().encode('data: café\n\n');
export const wireReads = [bytes.slice(0, -3), bytes.slice(-3)];
export function decodeReads(count) {
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let data = '';
  for (const part of wireReads.slice(0, count)) data += decoder.decode(part, { stream: true });
  return { data, event: data.endsWith('\n\n') ? data.slice(6, -2) : null };
}
export const batchRows = [
  { id: 'C', value: 'completed' },
  { id: 'A', value: 'expired' },
  { id: 'B', value: 'completed' },
];
export const joinedBatch = new Map(batchRows.map((r) => [r.id, r.value]));
export const callCases = validationCases();
export const wrongAccount = (stale, ageDays) =>
  checkRotation(callCases[2].value, { ...trusted, stale, ageDays });
export const lookupCases = [
  { account: 'acct_10234', candidate: callCases[0] },
  { account: 'unknown' },
].map((row) => ({
  ...row,
  called: Boolean(row.candidate),
  status: row.candidate?.result.status ?? 'lookup_failed',
}));

export function checkExamples() {
  assert.ok(timeouts.lost < timeouts.limit && timeouts.running > timeouts.limit);
  const { count, interval, firstTextDeadline } = heartbeatExample;
  assert.equal(interval, 1);
  assert.equal(count * interval, firstTextDeadline);
  for (let second = 0; second <= firstTextDeadline; second++) {
    const clock = heartbeatClock(second);
    assert.equal(clock.received, second);
    assert.equal(clock.lastRead, second);
    assert.equal(clock.readDeadline, second + 2);
    assert.equal(clock.firstTextExpired, second === 6);
    if (second < firstTextDeadline) assert.ok(clock.readDeadline > second + interval);
  }
  assert.deepEqual(heartbeatClock(firstTextDeadline - 0.01), {
    received: 5,
    lastRead: 5,
    readDeadline: 7,
    firstTextExpired: false,
  });
  assert.deepEqual(routeReceipt(routeTests[0], false), { stop: null, providerCalls: 1 });
  assert.deepEqual(routeTests.map((caller) => routeReceipt(caller, true)), [
    { stop: 'Sign-in', providerCalls: 0 },
    { stop: 'Tenant access', providerCalls: 0 },
    { stop: 'Usage limit', providerCalls: 0 },
  ]);
  assert.deepEqual(
    callCases.map((c) => c.result.status),
    ['fact_mismatch', 'policy_mismatch', 'accepted'],
  );
  assert.equal(wrongAccount(true, 30).status, 'accepted');
  assert.equal(wrongAccount(false, 45).status, 'fact_mismatch');
  assert.equal(wrongAccount(true, 29).status, 'fact_mismatch');
  assert.equal(
    checkRotation({ ...callCases[2].value, minimum_key_age_days: true }).status,
    'invalid_threshold',
  );
  assert.equal(lookupCases.filter((c) => c.called).length, 1);
  assert.deepEqual(
    [classifyFailure(429, 'rate_limit'), classifyFailure(429, 'credit_balance_exhausted')],
    ['bounded_retry', 'fix_quota'],
  );
  assert.equal(retryPlan().secondAttempt.end, 19.5);
  assert.deepEqual([retryPlan().deadline, retryPlan().firstAttempt.end,
    retryPlan().remainingAfterFirst, retryPlan().remainingAfterWait], [20, 14, 6, 3.5]);
  assert.deepEqual(
    [deadlineReservation(6).admitted, deadlineReservation(5.5).admitted],
    [true, false],
  );
  assert.deepEqual(
    jitterWindows(true).map((x) => x.wait),
    [0.5, 1],
  );
  assert.deepEqual(
    jitterWindows(false).map((x) => x.wait),
    [2, 3.5],
  );
  assert.equal(admit(open, 112.99, 'A').route, 'fallback');
  assert.deepEqual(
    [probeA.state.owner, routeB.route, deniedB.route, probeC.state.owner, recovered.kind],
    ['A', 'fallback', 'routing failure', 'C', 'closed'],
  );
  assert.equal(completeProbe(probeC.state, 7, true, 127), probeC.state);
  const repeated = idempotentJobTrace(2);
  assert.ok(repeated.safe && repeated.jobs === 1 && !repeated.retry.created);
  assert.deepEqual(
    [decodeReads(1).data, decodeReads(1).event, decodeReads(2).event],
    ['data: caf', null, 'café'],
  );
  assert.deepEqual(
    deltas.map((_, i) => stream(i + 1).text.length),
    [8, 19, 31, 41],
  );
  assert.equal(stream(4, 'eof').text, stream(4, 'end').text);
  assert.equal(stream(4, 'eof').state, 'failed draft');
  assert.equal(stream(4, 'end').state, 'ready to validate');
  assert.equal(costTrace().monthlyCost.toFixed(0), '5880');
  assert.deepEqual(
    [usageReceipt(1200), usageReceipt(1600)].map((r) => [r.ordinary, r.visible, r.cost.toFixed(5)]),
    [
      [700, 120, '0.00345'],
      [300, 120, '0.00285'],
    ],
  );
  assert.equal(pendingLog.estimatedCost, null);
  assert.equal(pendingLog.questionFingerprint.length, 32);
  assert.equal(paidLog.questionFingerprint, pendingLog.questionFingerprint);
  assert.notEqual(paidLog.questionFingerprint, otherTenantLog.questionFingerprint);
  assert.deepEqual(
    ['A', 'B', 'C'].map((id) => joinedBatch.get(id)),
    ['expired', 'completed', 'completed'],
  );
  assert.equal(checkRotation(accountBCandidate, accountB).status, 'policy_mismatch');
  assert.ok(!freshBudget.admitted && freshBudget.required.toFixed(1) === '4.2');
  assert.deepEqual(
    [receiptForB(0), receiptForB(1), receiptForB(2)],
    [
      { writes: 0, jobId: null },
      { writes: 1, jobId: null },
      { writes: 1, jobId: 'JOB-042' },
    ],
  );
  return true;
}

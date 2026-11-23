import assert from 'node:assert/strict';
import {
  sources,
  allocations,
  tools,
  CONTEXT_REQUIRED,
  CONTEXT_FRESH,
  CONTEXT_RELEASE_CASES,
} from '../../../films/context-engineering/fixtures.mjs';
import {
  findings,
  completeToolIntersection,
  selectTools,
  evaluatePacket,
} from '../../../films/context-engineering/model.mjs';
import {
  contextPrefixExample,
  requiredPacking,
  pruneContextResults,
  contextRelease,
} from '../../../films/context-engineering/arithmetic.mjs';
import {
  contextFreshResumeFixture,
  contextResumeFixture,
  completeResume,
  contextOperationLedger,
  hash,
  originalArtifact,
  originalInputs,
  receipt,
  verifyReceipt,
} from '../../../films/context-engineering/recovery.mjs';
import { recheckCollection } from '../../../films/context-engineering/construction.mjs';
import { verifyHandoff } from '../../../films/context-engineering/handoff.mjs';
import { inspectStatusEnvelope } from '../../../films/context-engineering/stages/strict-handoff.mjs';

export {
  sources,
  allocations,
  tools,
  findings,
  completeToolIntersection,
  selectTools,
  requiredPacking,
  CONTEXT_REQUIRED,
  CONTEXT_FRESH,
  contextResumeFixture,
  completeResume,
  hash,
};
export const trace = sources['trace-17'],
  lock = sources['lock-check'];
export const scoped = { trace: lock.trace, at: lock.at, locked: lock.locked, source: 'lock-check' };
export const notes = JSON.parse(
  JSON.stringify([
    {
      source: 'trace-17',
      trace: trace.trace,
      at: trace.at,
      status: trace.status,
      path: trace.path,
    },
    scoped,
  ]),
);
export const prefix = [contextPrefixExample(false), contextPrefixExample(true)];
export const probe = { front: 10, middle: 7, n: 12, combined: 5, bothN: 8 };
export const colorsForAllocation = [
  '#187069',
  '#548b99',
  '#a6c690',
  '#8d9290',
  '#be8751',
  '#b85844',
];
export const pruned = pruneContextResults(
  [true, false, true, true].map((recorded, i) => ({
    id: 'call-' + i,
    source: 'S' + i,
    raw: 'raw output ' + i,
    finding: 'checked observation',
    recorded,
  })),
  2,
);
export const handoffs = [
  { claim: 'callback failed', source: 'trace-17' },
  { claim: 'callback failed', source: 'missing' },
  { claim: 'trace succeeded', source: 'trace-17' },
].map((item) => {
  const envelope = verifyHandoff(JSON.stringify(item));
  const record = envelope.known ? sources[item.source] : undefined;
  const support =
    !!record &&
    record.path === '/callback' &&
    (item.claim === 'callback failed' ? record.status >= 400 : record.status < 400);
  return { ...envelope, record, support, accepted: envelope.known && support };
});
export const envelopes = [
  inspectStatusEnvelope(200),
  inspectStatusEnvelope(200, 2),
  inspectStatusEnvelope(403),
];
export const alloc = (removed = []) =>
  allocations.reduce((n, a, i) => n + (removed.includes(i) ? 0 : a.units), 0);
export const standardPack = requiredPacking(CONTEXT_REQUIRED, 3000);
export const finalPack = requiredPacking(CONTEXT_FRESH, 2600);
export const ownership = {
  routes: { '/callback': 'Identity' },
  directory: { Identity: 'Access team' },
  costs: [300, 300],
};
export const skillUnits = [6 * 80, 2200, 400, 120];
const incidentIntents = new Set(['investigate canary', 'roll back']);
export const skillRequests = [
  { task: 'Canary investigation', intent: 'investigate canary' },
  { task: 'Vacation policy', intent: 'summarize policy' },
  { task: 'Rollback request', intent: 'roll back' },
].map((request) => ({
  ...request,
  procedure: incidentIntents.has(request.intent) ? 'incident-triage' : null,
}));
const permissions = ['read'];
const rollbackPermission = 'write';
const evidence = envelopes[2];
export const rollbackHandoff = {
  procedure: skillRequests[2].procedure,
  evidence,
  accepted: evidence.receipt.accepted && evidence.supported,
  permissions,
  required: rollbackPermission,
  permitted: permissions.includes(rollbackPermission),
};
export const checkedLock = findings().find((finding) => finding.source === scoped.source);
export const smallReceipts = [0, 1, 2].map((i) => {
  const artifact = i === 2 ? originalArtifact + ' changed' : originalArtifact;
  const inputs = { deploy: i === 1 ? JSON.stringify({ revision: 8 }) : originalInputs.deploy };
  return {
    artifact: hash(artifact),
    deploy: hash(inputs.deploy),
    saved: receipt,
    result: verifyReceipt(artifact, inputs),
  };
});
export const ledger = contextOperationLedger([
  { key: 'K17', fence: 12, confirmed: false },
  { key: 'K17', fence: 12, confirmed: false },
  { key: 'K18', fence: 11, confirmed: false },
]);
export const readers = [
  evaluatePacket(['D0', 'D1', 'D2', 'D4']),
  evaluatePacket(['D0', 'D1', 'D2', 'D3', 'D5']),
];
export const trials = [
  CONTEXT_RELEASE_CASES,
  CONTEXT_RELEASE_CASES.map((r) => (r.critical ? { ...r, curated: true } : r)),
].map((rows) => ({ rows, ...contextRelease(rows) }));
export const negativeRoll = {
  'trace-17': trace,
  'trace-18': { trace: 'R18', at: 101, status: 401, path: '/callback' },
};
export const savedFinding = (source) => ({
  finding: 'The callback failed.',
  ...(source ? { source } : {}),
});
export const recover = (note) => negativeRoll[JSON.parse(JSON.stringify(note)).source];
export function restart(revised, issue, contradiction = false) {
  const f = contextFreshResumeFixture();
  if (revised)
    f.files['trace.json'] = JSON.stringify({
      trace: 'R17',
      revision: 2,
      status: contradiction ? 200 : 403,
    });
  const issued = issue && recheckCollection(f);
  const cert = f.receipts['collect-receipt'];
  let ready = null;
  try {
    ready = completeResume(f.tasks, f.files, f.receipts).next;
  } catch (error) {
    if (!error.message.startsWith('input changed')) throw error;
  }
  return {
    files: f.files,
    report: JSON.parse(f.files['report.json']),
    trace: JSON.parse(f.files['trace.json']),
    role: JSON.parse(f.files['authorization.json']).role,
    saved: { 'report.json': cert.sha256, ...cert.inputSha256 },
    issued,
    ready,
  };
}
export const restarts = [restart(false, false), restart(true, false), restart(true, true)];
export function checkExamples() {
  assert.deepEqual(
    [trace.trace, trace.at, trace.status, trace.path],
    [lock.trace, lock.at, 403, '/callback'],
  );
  const [statusNote, lockNote] = notes;
  assert.deepEqual(sources[statusNote.source], {
    trace: statusNote.trace, at: statusNote.at, status: statusNote.status, path: statusNote.path,
  });
  assert.deepEqual(lockNote, scoped);
  assert.equal(sources[lockNote.source].locked, false);
  assert.equal(lock.locked, false);
  assert.equal(findings({ ...sources, 'lock-check': { ...lock, at: 101 } }).length, 1);
  assert.equal((100 * (probe.front - probe.middle)) / probe.n, 25);
  assert.equal((100 * probe.combined) / probe.bothN, 62.5);
  assert.deepEqual(selectTools('investigate'), ['deploy_lookup', 'trace_lookup']);
  assert.deepEqual(
    completeToolIntersection(
      'investigate',
      tools.filter((id) => id !== 'trace_lookup'),
    ),
    ['deploy_lookup', 'runbook_search'],
  );
  assert.deepEqual(completeToolIntersection('unknown'), []);
  assert.deepEqual(
    prefix.map((p) => [p.common, p.first.length, p.second.length]),
    [
      [96, 364, 364],
      [352, 364, 364],
    ],
  );
  assert.deepEqual(
    [alloc(), alloc([3]), alloc([3, 4]), alloc([3, 4, 5])],
    [12436, 4236, 3466, 3346],
  );
  assert.deepEqual(
    pruned.rows.filter((r) => r.replaced).map((r) => r.id),
    ['call-0'],
  );
  assert.deepEqual(
    handoffs.map((r) => r.accepted),
    [true, false, false],
  );
  assert.deepEqual(handoffs.map((r) => r.record), [trace, undefined, trace]);
  for (const e of [envelopes[0], envelopes[2]]) {
    assert.deepEqual(e.receipt.item.source_ids, ['trace-17']);
    assert.deepEqual(e.record, sources[e.receipt.item.source_ids[0]]);
  }
  assert.deepEqual(
    envelopes.map((e) => [e.receipt.bytes, e.receipt.decoded, e.supported]),
    [
      [1599, true, false],
      [1601, false, null],
      [1599, true, true],
    ],
  );
  assert.equal(standardPack.used, 2400);
  assert.equal(4096 - 420 - 180 - 1024 - standardPack.used, 72);
  assert.throws(
    () =>
      requiredPacking(
        CONTEXT_REQUIRED.map((r) => (r.id === 'old export' ? { ...r, required: true } : r)),
        3000,
      ),
    /does not fit/,
  );
  assert.equal(ownership.directory[ownership.routes[trace.path]], 'Access team');
  assert.deepEqual(skillRequests.map((r) => r.procedure), ['incident-triage', null, 'incident-triage']);
  assert.equal(rollbackHandoff.evidence.receipt.item.claim, 'HTTP ' + trace.status);
  assert.equal(rollbackHandoff.evidence.record, trace);
  assert.equal(rollbackHandoff.accepted, true);
  assert.deepEqual(rollbackHandoff.permissions, ['read']);
  assert.equal(rollbackHandoff.required, 'write');
  assert.equal(rollbackHandoff.permitted, false);
  assert.equal(checkedLock.source, lockNote.source);
  for (const other of [{ ...lock, trace: 'R18' }, { ...lock, at: 101 }, { ...lock, locked: true }]) {
    assert.equal(findings({ ...sources, 'lock-check': other }).some((f) => f.source === checkedLock.source), false);
  }
  assert.equal(
    skillUnits.reduce((a, b) => a + b),
    3200,
  );
  assert.deepEqual(
    smallReceipts.map((r) => [r.result.artifactMatch, r.result.inputMatch]),
    [
      [true, true],
      [true, false],
      [false, true],
    ],
  );
  const f = contextResumeFixture();
  assert.equal(completeResume(f.tasks, f.files, f.receipts).next, 'verify cause');
  f.tasks[0].inputs.push('authorization.json');
  assert.throws(() => completeResume(f.tasks, f.files, f.receipts), /input set differs/);
  assert.deepEqual(
    ledger.map((l) => l.status),
    ['unknown; reconcile', 'already pending; reconcile', 'stale fence'],
  );
  assert.deepEqual(
    readers.map((r) => [r.score, r.criticalPass]),
    [
      [4, true],
      [5, false],
    ],
  );
  assert.deepEqual(
    trials.map((t) => [t.raw, t.curated, t.approved]),
    [
      [7, 8, false],
      [7, 9, true],
    ],
  );
  assert.equal(recover(savedFinding()), undefined);
  assert.equal(recover(savedFinding('trace-17')).status, 403);
  assert.equal(recover(savedFinding('trace-18')).status, 401);
  assert.deepEqual(
    finalPack.events.map((e) => e.used),
    [200, 700, 1000, 1000, 2200],
  );
  assert.deepEqual(
    restarts.map((r) => r.ready),
    ['verify cause', null, 'verify cause'],
  );
  assert.equal(restarts[0].files['report.json'], restarts[2].files['report.json']);
  assert.deepEqual(
    restarts.map((r) => Object.keys(r.saved).filter((id) => r.saved[id] !== hash(r.files[id]))),
    [[], ['trace.json'], []],
  );
  assert.equal(restart(true, true, true).issued, false);
}

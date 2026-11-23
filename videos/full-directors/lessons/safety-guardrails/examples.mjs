import assert from 'node:assert/strict';
import {
  approvalFixture,
  articleActionHash,
  claimAgreement,
  confusionMetrics,
  deploymentContract,
  prevalenceCounts,
  redactContact,
  requiredCheck,
  routeRequest,
  safetyBudget,
  streamTripwire,
  validateDetectorResult,
} from '../../../films/safety-guardrails/model.mjs';

export const manual = { service: 'payment-service', command: 'make test', liveBuild: 41, nextBuild: 42 };
export const requests = [
  { name: 'Unit tests', kind: 'unit-test-command', label: 'safe', score: 0.91 },
  { name: 'Deploy build 42', kind: 'production-deploy', label: 'safe', score: 0.91 },
  { name: 'Restricted key', kind: 'secret-export', label: 'injection', score: 0.91 },
];
export const sharedInputReadings = { topic: 'Pass', personalData: 'No findings' };
export function inputVerdict(result, threshold) {
  if (!validateDetectorResult(result)) return 'Hold';
  return result.label === 'injection' && result.score >= threshold ? 'Block' : 'Continue';
}
export const routes = requests.map((row) =>
  routeRequest(row.kind, { injectionBlocked: inputVerdict(row, 0.8) === 'Block' }),
);
export const grant = deploymentContract('mismatch');
export const textRule = 'refund complete';
export const fareRecord = { status: 'Request received', paid: null };
export const drafts = [
  { text: '“Refund complete” is a status label.', needsReview: false },
  { text: 'Your fare has been paid back.', needsReview: true },
].map((row) => ({ ...row, held: row.text.toLowerCase().includes(textRule) }));
export const history = approvalFixture([
  {},
  {},
  { artifact: 'b' },
  { operation: 'deploy-op-43' },
  { now: 900 },
]).outcomes;
export const hashes = ['a', 'b'].map(articleActionHash);
export const claims = [
  ['2 hours', 'Manager'],
  ['2 hours', 'Weekly'],
  ['2 hours', 'Manager', 'Weekly'],
];
export const agreement = claimAgreement(claims);
export const runbook = {
  id: 'RB-12',
  version: 4,
  scope: 'Engineering',
  window: 30,
  requiresManager: true,
  schedule: null,
  sufficient: null,
  canPublish: false,
};
function compareRunbookField(value, claimedValue) {
  if (value === null) return 'Neutral';
  return value === claimedValue ? 'Supported' : 'Contradicted';
}
export const evidence = [
  ['2-hour window', compareRunbookField(runbook.window, 120)],
  ['Approval required', compareRunbookField(runbook.requiresManager, true)],
  ['Approval alone suffices', compareRunbookField(runbook.sufficient, true)],
  ['Weekly rotation', compareRunbookField(runbook.schedule, 'weekly')],
];
function reload(previous, revision, entries) {
  const thresholds = entries.filter(([name]) => name === 'trigger');
  if (entries.length !== 1 || thresholds.length !== 1) return previous;
  const threshold = thresholds[0][1];
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) return previous;
  return Object.freeze({ revision, threshold });
}
export const oldPolicy = Object.freeze({ revision: 7, threshold: 0.8 });
export const duplicate = [
  ['trigger', 0.6],
  ['trigger', 0.95],
];
export const retained = reload(oldPolicy, 8, duplicate);
export const newPolicy = reload(retained, 8, [['trigger', 0.99]]);
export const record = {
  issue: 'INC-2048',
  task: 'Contact the owner',
  name: 'Mara Vale',
  email: 'mara@example.org',
  phone: '+1-202-555-0146',
};
export function exportRecord(local) {
  return {
    issue: local.issue,
    task: local.task,
    email: redactContact(local.email),
    phone: redactContact(local.phone),
  };
}
export const remote = exportRecord(record);
export const budget = safetyBudget();
export const inputs = { injection: 12, redaction: 8, remoteDuration: 10 };
inputs.remoteFinish = inputs.redaction + inputs.remoteDuration;
inputs.end = Math.max(inputs.remoteFinish, inputs.injection);
export const chunks = ['BL', 'UE'],
  marker = 'BLUE';
export const scans = streamTripwire(chunks, marker);
export const deadline = { input: 25, generation: 80, review: 30, limit: 120 };
deadline.draft = deadline.input + deadline.generation;
deadline.earliest = deadline.draft + deadline.review;
export const metrics = confusionMetrics(),
  shifted = prevalenceCounts();
export const reply = 'Refund request received.',
  fallback = 'Review unavailable. Try again.';
export function lookup(trace, reviewMs, exportProposed = false) {
  const limit = 50;
  const outcome = reviewMs > limit ? 'timeout' : 'pass';
  const elapsed = Math.min(reviewMs, limit);
  const released = requiredCheck(outcome).release;
  const effect = exportProposed ? routeRequest('secret-export').effect : 'none';
  return {
    privateDraft: reply,
    message: released ? reply : fallback,
    effects: 0,
    reviewMs,
    limit,
    receipt: {
      trace,
      policy: 8,
      detector: 'reply-v3',
      outcome,
      elapsed,
      delivery: released ? 'Reviewed reply' : 'Fallback',
      action: exportProposed ? 'Export ' + effect : 'No proposal',
    },
  };
}
export const lookups = [lookup('Q4-21', 18), lookup('Q4-22', 70, true), lookup('Q4-23', 18)];

export function check() {
  assert.deepEqual(
    requests.map((row) => inputVerdict(row, 0.8)),
    ['Continue', 'Continue', 'Block'],
  );
  assert.equal(inputVerdict({ label: 'injection', score: 0.8 }, 0.8), 'Block');
  for (const score of [undefined, true, NaN, Infinity, -1, 1.1])
    assert.equal(inputVerdict({ label: 'safe', score }, 0.8), 'Hold');
  assert.deepEqual(
    routes.map((row) => row.effect),
    ['none', 'approval-required', 'denied'],
  );
  assert.equal(routes[2].generation, 'skipped');
  const passedInput = routeRequest(requests[2].kind, { injectionBlocked: false });
  assert.equal(passedInput.input, 'continue');
  assert.equal(passedInput.effect, 'denied');
  assert.equal(grant.actor.id, 'actor-17');
  assert.equal(grant.approval.actor, 'actor-99');
  assert.equal(grant.decision.admitted, false);
  assert.equal(grant.schema, true);
  assert.equal(grant.effects, 0);
  assert.deepEqual(
    drafts.map((x) => [x.needsReview, x.held]),
    [
      [false, true],
      [true, false],
    ],
  );
  assert.equal(fareRecord.paid, null);
  assert.equal(deploymentContract('match').effects, 1);
  assert.equal(deploymentContract('timeout').effects, 0);
  assert.notEqual(hashes[0], hashes[1]);
  assert.deepEqual(
    history.map((row) => row.result),
    [
      'executed',
      'already executed',
      'deny: approved action changed',
      'deny: approval already used',
      'deny: approval expired',
    ],
  );
  assert.deepEqual(
    history.map((row) => row.count),
    [1, 1, 1, 1, 1],
  );
  assert.equal(agreement.score, 1 / 3);
  assert.deepEqual(agreement.intersection, ['2 hours']);
  assert.deepEqual(evidence, [
    ['2-hour window', 'Contradicted'],
    ['Approval required', 'Supported'],
    ['Approval alone suffices', 'Neutral'],
    ['Weekly rotation', 'Neutral'],
  ]);
  assert.equal(runbook.canPublish, false);
  assert.equal(retained, oldPolicy);
  assert.equal(inputVerdict(requests[2], retained.threshold), 'Block');
  assert.equal(inputVerdict(requests[2], newPolicy.threshold), 'Continue');
  assert.deepEqual(remote, {
    issue: 'INC-2048',
    task: 'Contact the owner',
    email: '[EMAIL]',
    phone: '[PHONE]',
  });
  assert.equal(exportRecord({ ...record, name: 'Different person', extra: 'private' }).name, undefined);
  assert.equal(budget.responseTotal, 3000);
  assert.equal(inputs.remoteFinish, 18);
  assert.equal(inputs.end, 18);
  for (let split = 1; split < marker.length; split++) {
    const parts = [marker.slice(0, split), marker.slice(split)];
    assert(parts.every((part) => !part.includes(marker)));
    assert(streamTripwire(parts, marker).at(-1).found);
  }
  assert.equal(scans[1].joined, marker);
  assert.equal(deadline.draft, 105);
  assert.equal(deadline.limit - deadline.draft, 15);
  assert.equal(deadline.earliest, 135);
  assert.equal(metrics.fpr, 0.01);
  assert.equal(metrics.fnr, 0.1);
  assert.equal((100 * metrics.blockedPrecision).toFixed(1), '47.4');
  assert.deepEqual([shifted.falsePositive, shifted.truePositive, shifted.falsePerTrue], [999, 90, 11.1]);
  assert.deepEqual(
    lookups.map((x) => x.message),
    [reply, fallback, reply],
  );
  assert.deepEqual(
    lookups.map((x) => x.receipt.elapsed),
    [18, 50, 18],
  );
  assert.deepEqual(
    lookups.map((x) => x.effects),
    [0, 0, 0],
  );
  assert.equal(lookups[1].receipt.action, 'Export denied');
  assert(!JSON.stringify(lookups[1].receipt).includes(reply));
}

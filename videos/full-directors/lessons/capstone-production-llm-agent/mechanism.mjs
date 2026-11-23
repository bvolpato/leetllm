import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import {
  composedRepairFixture,
  execute,
  operation,
  operationBinding,
  packet,
  packetBinding,
  plannerFacts,
  reviewed,
  traceBudgetFixture,
} from '../../../films/capstone-production-llm-agent/model.mjs';

export const lab = JSON.parse(readFileSync(new URL('./lab.json', import.meta.url), 'utf8'));
export const evidence = lab.evidence;
export const policyId = evidence.citations[0];
export const clauses = evidence.answer.match(/[^.]+\./g).map((s) => s.trim());
export const altered = { ...evidence, answer: clauses[0] + ' Manager approval is optional.' };
export const approvedEvidence = (response) => isDeepStrictEqual(response, evidence);
export const op = operation;
export const review = reviewed;
export const saved = packet;
export const repair = composedRepairFixture();
export const prefix = (hash) => hash.slice(0, 8);

export function admit(ticket) {
  if (ticket.bundle_version !== 'intake_bundle_v2') return 'Stale bundle';
  if (ticket.route !== 'guarded_agent') return 'Human review';
  return lab.grants.includes(ticket.account_id) ? 'Admitted' : 'Outside grant';
}

const schemas = {
  lookup_account: ['account_id'],
  get_policy_evidence: ['question'],
  draft_reply: [],
  request_human_approval: ['reason'],
};
export const lookup = { action: 'lookup_account', args: { account_id: 'A301' } };
export const extra = { action: 'draft_reply', args: {}, approved: true };
export const restore = { action: 'restore_access', args: { scope: packet.scope } };
export function inspectProposal(proposal, facts = plannerFacts(0)) {
  if (!isDeepStrictEqual(Object.keys(proposal).sort(), ['action', 'args']))
    return 'Envelope rejected';
  const keys = schemas[proposal.action];
  if (!keys) return 'Tool blocked';
  if (
    !proposal.args ||
    !isDeepStrictEqual(Object.keys(proposal.args).sort(), keys) ||
    Object.values(proposal.args).some((v) => typeof v !== 'string' || !v.trim() || v.length > 1600)
  )
    return 'Invalid arguments';
  if (proposal.action === 'lookup_account' && proposal.args.account_id !== packet.account)
    return 'Outside grant';
  if (proposal.action === 'get_policy_evidence' && proposal.args.question !== evidence.question)
    return 'Different question';
  if (proposal.action === 'draft_reply' && !(facts.policy && facts.account))
    return 'Missing observations';
  return 'Allow';
}

export function matchingFields(stored) {
  return [stored.account, stored.scope, stored.expiresAt];
}
export function expiryAt(now, edited = false) {
  const effects = new Set([op]);
  const stored = edited ? { ...saved, expiresAt: 2300 } : saved;
  return {
    now,
    stored,
    digest: packetBinding(stored),
    verdict: execute({ effects, stored, now }),
    count: effects.size,
  };
}
const ledger = new Set();
export const attempts = [true, false, false].map((fail, i) => {
  const result = execute({ effects: ledger, fail, now: 1001 + i });
  return { result, count: ledger.size, row: [...ledger][0] };
});

export function budget(which) {
  const data = traceBudgetFixture(which === 'extra');
  const events =
    which === 'equal'
      ? [180, 220, 340, 160].map((tokens, i) => ({ tokens, ms: [200, 280, 400, 320][i] }))
      : data.events;
  const totals = [
    events.length,
    events.reduce((s, e) => s + e.tokens, 0),
    events.reduce((s, e) => s + e.ms, 0),
  ];
  const limits = [data.limits.events, data.limits.tokens, data.limits.ms];
  return { events, totals, limits, ok: totals.every((n, i) => n <= limits[i]) };
}
export const baseReport = lab.report;
export function recordedPath({ actions, reason }) {
  if (!actions.length) return 'No planner actions';
  const names = {
    get_policy_evidence: 'Policy',
    lookup_account: 'account',
    draft_reply: 'draft',
    request_human_approval: reason === 'no_approved_evidence' ? 'handoff' : 'review',
  };
  return actions.map((action) => names[action] ?? action).join(' · ');
}

export function audit(change = 'original') {
  const report = structuredClone(baseReport);
  const rows = report.rows;
  if (change === 'duplicate') rows[5] = structuredClone(rows[2]);
  if (change === 'extra') rows[4].passed = true;
  if (change === 'executed') rows[4].executed[0] = true;
  if (change === 'boolean') rows[5].restore_count = true;
  if (change === 'candidate') report.agent_version = 'other-agent';
  const inventory = baseReport.rows.every(
    (r) => rows.filter((x) => x.episode === r.episode).length === 1,
  );
  const invalid = rows.find(
    (r) =>
      !isDeepStrictEqual(
        r,
        baseReport.rows.find((expected) => expected.episode === r.episode),
      ),
  );
  let verdict = 'Fixture suite pass';
  if (report.agent_version !== baseReport.agent_version) verdict = 'Hold · candidate';
  else if (!inventory) verdict = 'Hold · episode coverage';
  else if (invalid) verdict = 'Hold · invalid row';
  return { rows, verdict };
}

export function checkMechanism() {
  assert.equal(lab.packet.operation_id, op);
  assert.equal(lab.approval.packet_digest, review);
  assert.equal(lab.packet.draft, plannerFacts(3).draft);
  assert.equal(approvedEvidence(altered), false);
  assert.equal(approvedEvidence(structuredClone(evidence)), true);
  assert.deepEqual(lab.tickets.map(admit), ['Admitted', 'Human review', 'Stale bundle']);
  assert.deepEqual(
    [lookup, extra, restore].map((p) => inspectProposal(p)),
    ['Outside grant', 'Envelope rejected', 'Tool blocked'],
  );
  assert.equal(inspectProposal({ action: 'draft_reply', args: {} }), 'Missing observations');
  assert.equal(inspectProposal({ action: 'draft_reply', args: {} }, plannerFacts(2)), 'Allow');
  assert.deepEqual(matchingFields(saved), [
    lab.packet.account_id,
    lab.packet.scope,
    lab.packet.expires_at,
  ]);
  assert.equal(packetBinding(saved), review);
  assert.deepEqual(
    attempts.map((a) => [a.result, a.count]),
    [
      ['Transaction rolled back', 0],
      ['Local effect committed', 1],
      ['Duplicate ignored', 1],
    ],
  );
  assert.equal(expiryAt(1299).verdict, 'Duplicate ignored');
  assert.equal(expiryAt(1300).verdict, 'BLOCK: expired');
  assert.equal(expiryAt(1300).count, 1);
  assert.notEqual(expiryAt(1301, true).digest, review);
  assert.equal(operationBinding(expiryAt(1301, true).stored), op);
  assert.equal(expiryAt(1301, true).verdict, 'BLOCK: packet changed');
  assert.deepEqual(
    repair.steps.map((s) => [s.storedExpiry, s.currentVerified, s.result, s.effects]),
    [
      [2400, false, 'BLOCK: packet changed', 0],
      [2300, false, 'BLOCK: stale preconditions', 0],
      [2300, true, 'Local effect committed', 1],
      [2300, true, 'Duplicate ignored', 1],
    ],
  );
  assert.deepEqual(
    ['base', 'extra', 'equal'].map((s) => [budget(s).totals, budget(s).ok]),
    [
      [[4, 570, 530], true],
      [[5, 1070, 1480], false],
      [[4, 900, 1200], true],
    ],
  );
  const base = budget('base');
  const extraCall = budget('extra');
  assert.deepEqual(extraCall.events.slice(0, -1), base.events);
  assert.deepEqual(extraCall.limits, base.limits);
  assert.deepEqual(budget('equal').limits, base.limits);
  assert.ok(extraCall.totals.every((total, i) => total > base.limits[i]));
  assert.deepEqual(
    audit().rows.map((r) => r.restore_count),
    [0, 0, 0, 0, 0, 1],
  );
  assert.equal(audit('duplicate').rows.length, 6);
  const replay = audit().rows.find((r) => r.episode === 'approval_replay');
  assert.deepEqual(
    [recordedPath(replay), replay.executed, replay.reason, replay.restore_count],
    ['No planner actions', [], 'duplicate_ignored', 1],
  );
  assert.deepEqual(audit('duplicate').rows[5], audit().rows[2]);
  assert.equal(audit('duplicate').verdict, 'Hold · episode coverage');
  for (const change of ['extra', 'executed', 'boolean'])
    assert.equal(audit(change).verdict, 'Hold · invalid row');
  assert.equal(audit('candidate').verdict, 'Hold · candidate');
  return true;
}

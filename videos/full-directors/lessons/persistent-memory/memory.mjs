import assert from 'node:assert/strict';

export const request = 'Same failure. Continue.';
export const project = { tenant: 'Billing', user: 'Ada', repo: 'webhook' };
export const branch = 'agent/billing-event-78291';
export const commands = ['pnpm test', 'pnpm test --run billing', 'pnpm test --run invoices'];
export const events = [
  { id: '78291', invoices: ['A', 'B'], days: 1, similarity: 0.9, importance: 0.8 },
  { id: '71402', invoices: ['C', 'C'], days: 14, similarity: 0.95, importance: 0.3 },
];
export const duplicate = events.find((e) => new Set(e.invoices).size > 1);

export function promptFrom({ event, checkout, profile } = {}) {
  return { request, event, checkout, verifier: profile, priorTurns: [] };
}

export const turns = [
  { id: 'T1', speaker: 'Ada', text: 'FACT: event=billing_event_78291' },
  { id: 'T2', speaker: 'Assistant', text: "I'll inspect webhook.ts" },
  { id: 'T3', speaker: 'Ada', text: 'Replay returned two invoices' },
  { id: 'T4', speaker: 'Ada', text: 'FACT: rollout must stay canary-only' },
  { id: 'T5', speaker: 'Ada', text: 'Which test was failing again?' },
];
export function windowAt(count) {
  const consumed = turns.slice(0, count);
  const overflow = consumed.slice(0, Math.max(0, count - 3));
  return {
    raw: consumed.slice(-3),
    summary: overflow
      .filter((turn) => turn.text.startsWith('FACT:'))
      .map(({ id, text }) => ({ id, text: text.slice(6) })),
    retainedIds: overflow.map((turn) => turn.id),
  };
}
export const originals = [
  'Replay failed',
  'Inspect webhook.ts',
  'Approval covers canary only',
  'Check owners',
  'Inspect tests',
  'Count invoices',
  'Replay again',
  'Save output',
];
export const batches = [originals.slice(0, 4), originals.slice(4)];
export const reviewer = { group: 0, index: 2 };
export const claim = { source: 'merge after CI', extracted: 'merge now' };

export const rankWeights = [0.5, 0.3, 0.2];
export function signals(e) {
  return [e.similarity, 2 ** (-e.days / 7), e.importance];
}
export function contributions(e) {
  return signals(e).map((x, i) => x * rankWeights[i]);
}
export function total(e, n = 3) {
  return contributions(e)
    .slice(0, n)
    .reduce((a, b) => a + b, 0);
}
export const reads = 1_000_000;
export const frequencyScore = rankWeights[2] * Math.log1p(reads);

const base = { ...project, version: 1, copy: 1, grant: true, expired: false, superseded: false };
export const records = [
  { ...base, name: 'Replay 78291', mark: '0.90', event: events[0] },
  { ...base, name: 'Replay 71402', mark: '0.95', event: events[1] },
  { ...base, name: 'Private incident', mark: '0.99', tenant: 'Payments' },
  { ...base, name: 'Old command', mark: 'v1 / v2', superseded: true, version: 2 },
  { ...base, name: 'Past review', mark: 'Expired', expired: true },
  { ...base, name: 'Private note', mark: 'Revoked', grant: false },
];
export function exclusion(r, scope) {
  if (!scope || scope.tenant !== r.tenant || scope.user !== r.user || scope.repo !== r.repo)
    return 'Outside scope';
  if (!r.grant) return 'Grant revoked';
  if (r.expired) return 'Expired';
  if (r.superseded || r.version !== r.copy) return 'Superseded';
  return '';
}
export function allowed(scope) {
  return records.filter((r) => !exclusion(r, scope));
}

export const pref = {
  ...project,
  source: 'Ada’s statement',
  field: 'verification_command',
  value: commands[1],
  retention: 90,
};
export const approval = { ...pref, field: 'merge_approved', value: 'true' };
export function admit(r, session) {
  return (
    session?.user === r.user &&
    session.tenant === r.tenant &&
    session.repo === r.repo &&
    r.source === 'Ada’s statement' &&
    ['verification_command', 'preferred_package_manager'].includes(r.field) &&
    r.value.trim().length > 0 &&
    r.value.length <= 500 &&
    Number.isInteger(r.retention) &&
    r.retention >= 1 &&
    r.retention <= 365
  );
}
export function queueAt(copied, folded) {
  const ids = turns.map((turn) => turn.id);
  return {
    queue: folded ? ['Σ', ...ids.slice(3)] : ids,
    archive: copied ? [{ ...turns[2] }] : [],
    recall: turns,
    summaryLinks: folded ? ids.slice(0, 3) : [],
  };
}
export function followSummaryLink(state, id) {
  if (state.summaryLinks.includes(id)) return state.recall.find((turn) => turn.id === id);
}
export function queueBudget(folded) {
  const window = 1000,
    fixed = 300,
    queue = folded ? 300 : 600;
  return { window, fixed, queue, free: window - fixed - queue };
}

const profile = { ...project, id: 't3', version: 1, grant: true, expires: 200, tombstone: false };
export function indexRead(source, copy, now, session) {
  const active =
    source.grant &&
    !source.tombstone &&
    now < source.expires &&
    source.user === session?.user &&
    source.tenant === session.tenant &&
    source.repo === session.repo;
  const matches =
    source.id === copy.id &&
    source.version === copy.version &&
    source.tenant === copy.tenant &&
    source.repo === copy.repo;
  return { active, matches, value: active && matches ? source.value : null };
}
export function versions({
  update = false,
  refresh = false,
  deleted = false,
  restored = false,
  grant = true,
  now = 102,
} = {}) {
  const source = {
    ...profile,
    grant,
    tombstone: deleted,
    version: restored ? 4 : deleted ? 3 : update ? 2 : 1,
    value: deleted ? null : commands[update ? 1 : 0],
  };
  const copy = {
    ...project,
    id: 't3',
    version: restored ? 4 : refresh ? 2 : 1,
    value: commands[refresh ? 1 : 0],
  };
  return { source, copy, ...indexRead(source, copy, now, project) };
}

export const pending = { repo: 'billing/webhook', rev: 'c89a1f', key: 'M17', pr: 191 };
export function recover(checkpoint, observation, auth) {
  if (!observation || ['key', 'repo', 'rev'].some((k) => observation[k] !== checkpoint[k]))
    return 'Reconcile again';
  if (observation.outcome === 'committed') return 'Record receipt';
  if (observation.outcome !== 'uncommitted') return 'Reconcile again';
  if (auth !== 'current') return 'Wait for approval';
  return observation.sameKeySafe ? 'Retry with ' + checkpoint.key : 'Reconcile again';
}
export const receipt = { ...pending, outcome: 'committed' };
export const uncommitted = { ...pending, outcome: 'uncommitted', sameKeySafe: true };

export function verify() {
  assert.equal(duplicate.id, '78291');
  assert.deepEqual(promptFrom().priorTurns, []);
  assert.equal(promptFrom().verifier, undefined);
  assert.equal(promptFrom({ event: duplicate }).event.invoices.join(' → '), 'A → B');
  assert.equal(promptFrom({ checkout: branch, profile: commands[1] }).verifier, commands[1]);
  assert.deepEqual(
    windowAt(3).raw.map((turn) => turn.id),
    ['T1', 'T2', 'T3'],
  );
  assert.deepEqual(windowAt(4).summary, [{ id: 'T1', text: 'event=billing_event_78291' }]);
  assert.deepEqual(windowAt(4).raw.map((turn) => turn.id), ['T2', 'T3', 'T4']);
  assert.deepEqual(windowAt(4).raw[0], { id: 'T2', speaker: 'Assistant', text: "I'll inspect webhook.ts" });
  assert.deepEqual(windowAt(5).summary, windowAt(4).summary);
  assert.deepEqual(windowAt(5).raw, turns.slice(2));
  assert.deepEqual(windowAt(5).retainedIds, ['T1', 'T2']);
  assert.equal(batches[reviewer.group][reviewer.index], 'Approval covers canary only');
  assert.equal(claim.source.includes('after CI'), true);
  assert.equal(claim.extracted.includes('after CI'), false);
  assert.deepEqual(
    events.map((e) => total(e).toFixed(3)),
    ['0.882', '0.610'],
  );
  assert(total(events[0], 1) < total(events[1], 1) && total(events[0], 2) > total(events[1], 2));
  assert.equal(frequencyScore.toFixed(3), '2.763');
  assert.deepEqual(
    allowed(project).map((r) => r.event),
    events,
  );
  assert.deepEqual(allowed(null), []);
  assert.deepEqual(
    allowed({ ...project, tenant: 'Payments' }).map((r) => r.name),
    ['Private incident'],
  );
  assert.deepEqual(allowed({ ...project, repo: 'other' }), []);
  assert.equal(admit(pref, project), true);
  for (const bad of [
    approval,
    { ...pref, user: 'Ian' },
    { ...pref, source: 'unsourced' },
    { ...pref, value: ' ' },
    { ...pref, value: 'x'.repeat(501) },
    { ...pref, retention: 0 },
  ])
    assert.equal(admit(bad, project), false);
  const beforeFold = queueAt(true, false);
  assert.equal(beforeFold.queue.length, 5);
  assert.deepEqual(beforeFold.recall.map((turn) => turn.id), beforeFold.queue);
  assert.equal(followSummaryLink(beforeFold, 'T2'), undefined);
  const afterFold = queueAt(true, true);
  assert.deepEqual(afterFold.queue, ['Σ', 'T4', 'T5']);
  assert.deepEqual(afterFold.summaryLinks, ['T1', 'T2', 'T3']);
  assert.deepEqual(afterFold.archive, [turns[2]]);
  assert.deepEqual(afterFold.recall, beforeFold.recall);
  assert.deepEqual(followSummaryLink(afterFold, 'T2'), windowAt(4).raw[0]);
  assert.deepEqual(followSummaryLink(queueAt(false, true), 'T2'), windowAt(4).raw[0]);
  assert.equal(followSummaryLink(afterFold, 'T4'), undefined);
  assert.deepEqual([queueBudget(false).free, queueBudget(true).free], [100, 400]);
  const matched = versions({ update: true, refresh: true });
  assert.equal(versions().value, commands[0]);
  assert.equal(versions({ update: true }).value, null);
  assert.equal(matched.value, commands[1]);
  for (const change of [{ deleted: true }, { grant: false }, { now: 200 }]) {
    const blocked = versions({ update: true, refresh: true, ...change });
    assert.deepEqual([blocked.active, blocked.value], [false, null]);
  }
  assert.equal(versions({ update: true, refresh: true, now: 199 }).value, commands[1]);
  assert.equal(indexRead(matched.source, { ...matched.copy, id: 't4' }, 102, project).value, null);
  const current = { ...profile, version: 3, value: commands[2] };
  assert.equal(
    indexRead(current, { ...current, version: 2, value: commands[1] }, 103, project).value,
    null,
  );
  assert.equal(indexRead(current, current, 103, project).value, commands[2]);
  assert.equal(indexRead(current, { ...current, tenant: 'Payments' }, 103, project).value, null);
  assert.equal(recover(pending, receipt, 'expired'), 'Record receipt');
  assert.equal(recover(pending, uncommitted, 'expired'), 'Wait for approval');
  assert.equal(recover(pending, uncommitted, 'current'), 'Retry with M17');
  for (const missing of [null, { ...receipt, rev: 'other' }, { ...receipt, outcome: 'unknown' }])
    assert.equal(recover(pending, missing, 'current'), 'Reconcile again');
}

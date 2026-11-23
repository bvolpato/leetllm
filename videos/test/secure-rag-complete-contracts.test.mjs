import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SECURE_SOURCES,
  sourceRecord,
  secureEligibility,
  reportAdmission,
  snapshotAdmission,
  reconcileChunks,
  taskScopeCheck,
  localOutputCheck,
  freshSecureState,
} from '../animations/secure-rag.mjs';
const principal = {
  id: 'analyst',
  tenant: 'A',
  groups: ['operations'],
  departments: ['operations'],
  roles: [],
};
test('mandatory tenant, literal deletion and half-open time gates precede every alternative grant', () => {
  const row = sourceRecord(SECURE_SOURCES[1]);
  assert(secureEligibility(row, principal));
  for (const delta of [
    { tenant: 'B', grant: 'tenant' },
    { deleted: 0, grant: 'tenant' },
    { deleted: true },
    { start: 101 },
    { end: 100 },
    { end: '101' },
    { start: undefined },
  ])
    assert(!secureEligibility({ ...row, ...delta }, principal));
  assert(secureEligibility({ ...row, start: 100, end: 101 }, principal));
  const missing = { ...row };
  delete missing.end;
  assert(!secureEligibility(missing, principal));
  assert(secureEligibility({ ...row, grant: null }, principal));
  assert(!secureEligibility({ ...row, grant: null, department: null }, principal));
});
test('reconciliation updates both tenant chunks monotonically and leaves foreign chunks unchanged', () => {
  const rows = ['A', 'A', 'B', 'B'].map((tenant, i) => ({
    tenant,
    id: i,
    revision: 1,
    groups: ['operations'],
    deleted: false,
  }));
  const revoked = reconcileChunks(rows, 'A', 2, []);
  assert.equal(revoked.updated, 2);
  assert.deepEqual(
    revoked.rows.map((r) => r.revision),
    [2, 2, 1, 1],
  );
  assert.equal(reconcileChunks(revoked.rows, 'A', 1, ['operations']).updated, 0);
  assert.equal(reconcileChunks(revoked.rows, 'A', 2, []).updated, 0);
  const removed = reconcileChunks(revoked.rows, 'A', 3, [], true);
  assert.deepEqual(
    removed.rows.map((r) => r.deleted),
    [true, true, false, false],
  );
  const restored = reconcileChunks(removed.rows, 'A', 4, ['security'], false);
  assert.deepEqual(
    restored.rows.map((r) => r.deleted),
    [false, false, false, false],
  );
  assert.equal(rows[0].revision, 1);
});
test('snapshot equality and age boundaries reject both supposedly newer and retimestamped old versions', () => {
  assert(snapshotAdmission({ version: 42, fetched: 700 }, 42, 1000, 300).allowed);
  for (const s of [
    { version: 41, fetched: 1000 },
    { version: 43, fetched: 1000 },
    { version: 42, fetched: 699 },
    { version: 42, fetched: 1001 },
  ])
    assert(!snapshotAdmission(s, 42, 1000, 300).allowed);
});
test('failed task binding does not burn nonce; successful first use, replay and expiry are distinct', () => {
  const scope = {
      tenant: 'A',
      user: 'analyst',
      query: 'Q',
      audience: 'retrieval',
      expiry: 100,
      nonce: 'n7',
    },
    request = { tenant: 'A', user: 'analyst', query: 'Q', audience: 'retrieval' },
    used = new Set();
  assert(!taskScopeCheck(scope, { ...request, query: 'other' }, 99, used));
  assert.equal(used.size, 0);
  assert(taskScopeCheck(scope, request, 99, used));
  assert(!taskScopeCheck(scope, request, 99, used));
  assert(!taskScopeCheck(scope, request, 100, new Set()));
  assert(!taskScopeCheck(scope, request, 99, new Set(), { integrity: false }));
});
test('complete report manifests require every current source, revision and grant', () => {
  const rows = SECURE_SOURCES.map(sourceRecord),
    refs = rows.slice(0, 3).map((r) => ({ tenant: r.tenant, id: r.id, revision: r.revision })),
    both = { ...principal, groups: ['operations', 'security'] };
  assert(reportAdmission(refs, rows, both));
  assert(!reportAdmission(refs, rows, principal));
  assert(!reportAdmission([], rows, both));
  assert(!reportAdmission([...refs, { tenant: 'B', id: 'FAQ', revision: 3 }], rows, both));
  assert(
    !reportAdmission(
      refs,
      rows.map((r) => (r.id === 'key' ? { ...r, grant: null } : r)),
      both,
    ),
  );
});
test('uncited revoked context blocks whole draft, while local membership checks retain their semantic blind spot', () => {
  const text = '[confidential] Invented claim99. demo@example.com [source:FAQ]';
  assert(!localOutputCheck(text, ['FAQ', 'key'], ['FAQ']).allow);
  const out = localOutputCheck(text, ['FAQ'], ['FAQ']);
  assert(out.allow);
  assert(out.text.includes('[REDACTED_EMAIL]'));
  assert.equal(out.semanticSupportChecked, false);
  assert(!localOutputCheck('[restricted] Fact. [source:FAQ]', ['FAQ'], ['FAQ']).allow);
  assert(!localOutputCheck('Fact. [source:invented]', ['FAQ'], ['FAQ']).allow);
});
test('fresh composed repair preserves old manifests and admits only the performed current two-source replacement', () => {
  const s = freshSecureState();
  assert.deepEqual(s.allowed, ['checklist', 'key']);
  assert.equal(s.current.find((r) => r.id === 'key').revision, 7);
  assert.deepEqual(s.oldReport, [
    { tenant: 'A', id: 'checklist', revision: 1 },
    { tenant: 'A', id: 'FAQ', revision: 3 },
  ]);
  assert(!s.oldReportAllowed);
  assert(!s.oldDraftAllowed);
  assert(s.replacementAllowed);
  assert(
    !reportAdmission([{ ...s.oldReport[0], revision: 2 }, s.oldReport[1]], s.current, s.principal),
  );
  assert(
    !reportAdmission(
      s.oldReport,
      s.current.map((r) => (r.id === 'FAQ' ? { ...r, grant: 'operations' } : r)),
      s.principal,
    ),
  );
});

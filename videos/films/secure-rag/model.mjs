import { authorize, freshSecureState, retrieve } from './arithmetic.mjs';
import { CANDIDATES, POLICY, PRINCIPAL, RECALL_CUES } from './fixtures.mjs';
import { derivedScopeState, filterConstructionState, recallComparison } from './construction.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  const releaseCase = freshSecureState();
  assert.equal(releaseCase.oldReportAllowed, false);
  assert.equal(releaseCase.oldOutput.reason, 'revoked context');
  assert.equal(releaseCase.proposedOutput.allow, true);
  assert.equal(releaseCase.proposedQuoteMatches, false);
  assert.equal(releaseCase.release, true);
  assert.equal(derivedScopeState(2, 1).localAllowed, true);
  assert.equal(derivedScopeState(2, 1).foreignAllowed, false);
  assert.equal(derivedScopeState(2, 1).foreignDenied, true);
  assert.deepEqual(
    filterConstructionState(0, 1).eligible.map((x) => x.id),
    ['R7', 'R6'],
  );
  assert.deepEqual(
    filterConstructionState(1, 1).ranked.map((x) => x.id),
    ['R6', 'R7'],
  );
  for (let i = 0; i <= 100; i++) {
    const current = filterConstructionState(0, i / 100);
    assert(current.eligible.every((record) => authorize(record)));
    assert.equal(current.evaluated.length, current.inspected);
  }
  assert.deepEqual(
    retrieve().map((record) => record.id),
    ['R6', 'R7'],
  );
  assert.equal(retrieve(CANDIDATES, PRINCIPAL, POLICY, 5).length, 0);
  assert.deepEqual(
    retrieve(CANDIDATES, PRINCIPAL, POLICY, 6).map((record) => record.id),
    ['R6'],
  );
  assert.equal(
    retrieve(CANDIDATES, PRINCIPAL, {
      ...POLICY,
      groups: [],
    }).length,
    0,
  );
  for (const change of [
    {
      deleted: true,
    },
    {
      valid: false,
    },
    {
      revision: 43,
    },
  ])
    assert.equal(
      retrieve(CANDIDATES, PRINCIPAL, {
        ...POLICY,
        ...change,
      }).length,
      0,
    );
  assert.equal(retrieve(CANDIDATES, null).length, 0);
  assert.equal(retrieve(CANDIDATES, PRINCIPAL, null).length, 0);
  assert.ok(
    !authorize({
      ...CANDIDATES[5],
      tenant: 'B',
    }),
  );
  assert.ok(
    !authorize({
      ...CANDIDATES[5],
      policyRevision: 41,
    }),
  );
  assert.ok(!authorize(CANDIDATES[1])); // A request mentioning security cannot change server membership.
  const chunks = [41, 41, 41];
  for (let index = 0; index < chunks.length; index++) {
    chunks[index] = Math.max(chunks[index], 42);
    assert.ok(chunks.slice(0, index + 1).every((version) => version === 42));
  }
  assert.ok(chunks.every((version) => version === 42));
  assert.ok(
    !authorize(CANDIDATES[5], PRINCIPAL, {
      ...POLICY,
      groups: [],
    }),
  );
  for (const beatP of [0, 0.5, 1]) {
    const current = recallComparison({
      beat: 0,
      beatP,
    });
    assert.equal(current.inspected, 0);
    assert.equal(current.exactOpacity, 0);
    assert.equal(current.boundedOpacity, 0);
  }
  const at = (seconds) =>
    recallComparison({
      beat: 1,
      beatP: seconds / RECALL_CUES.duration,
    });
  assert.equal(at(3).exactOpacity, 1);
  assert.equal(at(4.199).boundedOpacity, 0);
  assert.deepEqual(at(8.299).bounded, []);
  assert.equal(at(8.299).inspected, 5);
  assert.deepEqual(
    at(8.3).bounded.map((record) => record.id),
    ['R6'],
  );
  assert.equal(at(8.3).inspected, 6);
  const held = recallComparison({
    beat: 2,
    beatP: 0.5,
  });
  assert.deepEqual(
    held.bounded.map((record) => record.id),
    ['R6'],
  );
  assert.equal(held.inspected, 6);
  for (let i = 0; i <= 100; i++) {
    const current = at((i * RECALL_CUES.duration) / 100);
    assert(current.bounded.every((record) => authorize(record)));
    assert.deepEqual(current.bounded, retrieve(CANDIDATES, PRINCIPAL, POLICY, current.inspected));
  }
  return true;
}

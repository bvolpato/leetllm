import {
  governingRecall,
  halfOpenCurrent,
  isCurrent,
  sourceHash,
  unknownSourceLabels,
} from './arithmetic.mjs';
import { CORPUS, EVAL_DATE, PARENTS, REQUIRED_RAG_GATES, ROTATION_RULE } from './fixtures.mjs';
import { eligibilityFrame, scopeSnapshot, versionFilterFrame } from './construction.mjs';
import {
  completeRequestBudget,
  currentAuthorityDecision,
  filteredRecallFixture,
  injectionFixture,
  packParents,
  parentAdmission,
  parentPackingFixture,
  ragReleaseGate,
  releaseCases,
  requestPath,
  serialRequestTrace,
  toyTargetTokens,
  versionedBundle,
  zeroScoreFixture,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateOriginalModel() {
  const fixture = parentPackingFixture();
  assert.equal(fixture.hits.length, 3);
  assert.equal(fixture.packed.length, 2);
  assert.equal(new Set(fixture.packed.map((x) => x.parentId)).size, 2);
  assert.equal(
    fixture.budget.parts.reduce((n, p) => n + p.tokens, 0),
    fixture.budget.total,
  );
  assert(fixture.budget.fits);
  assert.equal(fixture.budget.reservedOutput + fixture.budget.limit, 1024);
  const child = fixture.hits[0].record,
    parent = PARENTS[child.parentId];
  assert(parentAdmission(child, parent, fixture.run.caller).accepted);
  assert.equal(
    parentAdmission(child, parent, fixture.run.caller, '2026-03-31').checks.effective,
    false,
  );
  assert.equal(
    parentAdmission(
      child,
      {
        ...parent,
        to: '2026-05-26',
      },
      fixture.run.caller,
    ).accepted,
    false,
  );
  assert(
    toyTargetTokens(completeRequestBudget(fixture.packed).rendered).length >
      toyTargetTokens(fixture.packed.map((x) => x.text).join('')).length,
  );
  const run = requestPath();
  assert.equal(versionFilterFrame(1, 1).currentProgress, 0);
  assert.equal(versionFilterFrame(2, 3.35 / 12.574).currentProgress, 1);
  assert.equal(versionFilterFrame(2, 5.25 / 12.574).historicalProgress, 1);
  assert.equal(eligibilityFrame(0, 1).outcomeVisible, false);
  assert.equal(eligibilityFrame(1, 3.8 / 10.83).agePass, true);
  assert.equal(eligibilityFrame(1, 7.7 / 10.83).staleDays, 15);
  assert.equal(eligibilityFrame(1, 7.7 / 10.83).agePass, false);
  assert.equal(isCurrent(CORPUS.find((record) => record.id === 'eu-key-v1')), false);
  assert.equal(versionedBundle().expiredKeyPresent, true);
  assert.equal(versionedBundle().sourceHash, sourceHash(ROTATION_RULE));
  assert.equal(run.candidates[0].record.id, 'eu-key-v2');
  assert.deepEqual(
    run.hits.map((hit) => hit.score),
    [7, 2],
  );
  assert(!run.candidates.some((hit) => hit.record.id === 'restricted-admin'));
  assert.equal(
    run.hits.some((hit) => hit.record.id === 'eu-session-v1'),
    true,
  );
  assert.equal(
    CORPUS.find((record) => record.id === 'eu-session-v1').text,
    'Idle browser sessions expire after 30 days of inactivity.',
  );
  assert.equal(run.packed[0].parentId, 'eu-access-v2');
  assert.equal(run.answer.decision, 'eligible');
  assert.deepEqual(run.answer.cited, ['E1']);
  const mismatch = packParents(run.hits, run.caller, EVAL_DATE, 400, {
    ...PARENTS,
    'eu-access-v2': {
      ...PARENTS['eu-access-v2'],
      version: 'eu-access/2025-01-01',
    },
  });
  assert.equal(
    mismatch.some((item) => item.parentId === 'eu-access-v2'),
    false,
  );
  assert.equal(injectionFixture().answer.decision, 'abstain');
  const cases = releaseCases();
  assert.deepEqual(
    cases.map((test) => test.result.decision),
    ['eligible', 'ineligible', 'abstain', 'eligible'],
  );
  assert(!cases[3].result.text.includes('limit 14'));
  assert.equal(scopeSnapshot(0, 0.12).inspected.length, 0);
  assert.equal(scopeSnapshot(0, 0.5).inspected.length, 3);
  assert.deepEqual(
    scopeSnapshot(0, 0.5).admitted.map((record) => record.id),
    ['eu-key-v2'],
  );
  const complete = scopeSnapshot(0, 0.88);
  assert.equal(complete.inspected.length, 5);
  assert.deepEqual(
    complete.admitted.map((record) => record.id),
    requestPath().candidates.map((hit) => hit.record.id),
  );
  assert.equal(
    complete.decisions.find((row) => row.id === 'restricted-admin').status,
    'ACL denied',
  );
  assert.deepEqual(scopeSnapshot(1, 0).decisions, complete.decisions);
}
export function validateModel() {
  validateOriginalModel();
  assert.equal(
    halfOpenCurrent(
      {
        start: 0,
        end: 20,
      },
      20,
    ),
    false,
  );
  assert.equal(
    halfOpenCurrent(
      {
        start: 20,
        end: null,
      },
      20,
    ),
    true,
  );
  const f = filteredRecallFixture();
  assert.equal(f.redacted.length, 1);
  assert.equal(f.allowed.length, 3);
  const z = zeroScoreFixture();
  assert(z.hits.every((h) => h.score === 0));
  assert.equal(z.answer.decision, 'eligible');
  assert.deepEqual(unknownSourceLabels('Approve [E7].', ['E1', 'E2']), ['E7']);
  assert.deepEqual(unknownSourceLabels('Approve [E2].', ['E1', 'E2']), []);
  const exact = Array.from(
    {
      length: 10,
    },
    (_, i) => 'P' + (i + 1),
  );
  assert.deepEqual(governingRecall(exact, [...exact.slice(0, 8), 'P11', 'P12'], ['P9']), {
    ann: 0.8,
    task: 0,
  });
  const trace = serialRequestTrace();
  assert.equal(trace.stages[3].end, 341);
  assert.equal(trace.completion, 751);
  assert.equal(trace.traceComplete, 754);
  assert.equal(
    trace.localPassingStages.reduce((a, b) => a + b, 0),
    1050,
  );
  assert(Math.abs(0.95 ** 5 - 0.7737809375) < 1e-12);
  assert.equal(ragReleaseGate({}), false);
  const all = Object.fromEntries(REQUIRED_RAG_GATES.map((k) => [k, true]));
  assert(ragReleaseGate(all));
  assert.equal(
    ragReleaseGate({
      ...all,
      lifecycle: 1,
    }),
    false,
  );
  assert.equal(
    currentAuthorityDecision({
      deleted: true,
    }),
    'abstain',
  );
  assert.equal(
    currentAuthorityDecision({
      staleDays: 16,
    }),
    'ineligible',
  );
  return true;
}

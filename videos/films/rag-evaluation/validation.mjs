import { rankPrecision } from './arithmetic.mjs';
import { POLICY_ID } from './fixtures.mjs';
import {
  abstentionOutcome,
  admissiblePolicy,
  aggregationSnapshot,
  citationSnapshot,
  evidenceSnapshot,
  metrics,
  omissionSnapshot,
  policyEvaluation,
  policyFixture,
  policyVariants,
  sliceGate,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validatePolicyModel() {
  assert.equal(rankPrecision([true, false, false]), 1);
  assert.equal(rankPrecision([false, false, true]), 1 / 3);
  const f = policyFixture(),
    results = policyVariants();
  results.forEach((v) => assert.equal(v.result.firstFailure, v.expected));
  assert.equal(results.slice(0, 6).filter((v) => v.result.release).length, 1);
  assert.deepEqual(
    [
      results[1].result.faithfulness,
      results[1].result.citationCoverage,
      results[1].result.citationSupport,
      results[1].result.completeness,
    ],
    [0.5, 1, 0.5, 1 / 3],
  );
  const duplicate = [
    ...f.complete.slice(0, 2),
    {
      ...f.complete[1],
      id: 'rollback-plan',
    },
  ];
  assert.equal(policyEvaluation(f.trace, duplicate, f).completeness, 2 / 3);
  const unknown = [
    {
      id: 'approval',
      text: 'Approval from the incident commander is mandatory.',
      citation: POLICY_ID,
    },
  ];
  assert.equal(policyEvaluation(f.trace, unknown, f).firstFailure, 'claim review');
  const changed = policyFixture();
  changed.records[POLICY_ID].text = 'Edited under unchanged version';
  assert.equal(admissiblePolicy(changed.trace, changed), false);
  const forbidden = structuredClone(f.trace);
  forbidden.candidates.push('restricted-breakglass-note');
  assert.equal(admissiblePolicy(forbidden, f), false);
  assert.equal(sliceGate().overall, 0.6);
  assert.equal(sliceGate().pass, false);
  assert.equal(sliceGate([]).pass, false);
  assert.deepEqual(abstentionOutcome(true, false, 'bounded-abstention'), {
    safe: true,
    evidencePath: false,
    taskSuccess: false,
  });
  const fresh = policyFixture(true),
    partial = policyEvaluation(fresh.trace, fresh.complete.slice(0, 3), fresh);
  assert.equal(partial.firstFailure, 'answer completeness');
  assert.equal(partial.faithfulness, 1);
  assert.equal(partial.completeness, 0.75);
  assert.equal(policyEvaluation(fresh.trace, fresh.complete, fresh).release, true);
  return true;
}
export function validateEvaluationBuild() {
  assert.deepEqual(omissionSnapshot(0, 0).ids, []);
  assert.deepEqual(omissionSnapshot(0, 0.2).ids, ['closed']);
  assert.deepEqual(omissionSnapshot(0, 0.9).ids, ['closed', 'box']);
  assert.equal(omissionSnapshot(1, 0.1).completeness, 2 / 3);
  assert.equal(omissionSnapshot(2, 0.1).faithfulness, null);
  assert.equal(omissionSnapshot(2, 0.8).completeness, 1 / 3);
  const empty = aggregationSnapshot(0, 0),
    partial = aggregationSnapshot(0, 0.5),
    full = aggregationSnapshot(0, 0.9);
  assert.equal(empty.pooled, null);
  assert(partial.observed.length > 0 && partial.observed.length < 10);
  assert.equal(partial.pooled, 1);
  assert.equal(full.pooled, 0.9);
  assert.equal(aggregationSnapshot(1, 0.1).mean, null);
  assert.equal(aggregationSnapshot(1, 0.9).mean, 0.5);
  assert.equal(aggregationSnapshot(2, 0.8).emptyCase, true);
  assert.equal(aggregationSnapshot(2, 0.8).observed.length, 10);
}
export function validateModel() {
  validateEvaluationBuild();
  validatePolicyModel();
  assert.equal(metrics(['box', 'instant']).faithfulness, 0.5);
  assert.equal(metrics(['closed', 'box']).faithfulness, 1);
  assert.equal(metrics(['closed', 'box']).completeness, 2 / 3);
  assert.equal(metrics(['closed', 'box', 'next']).completeness, 1);
  assert.equal(metrics(['closed'], ['B']).faithfulness, 1);
  assert.equal(metrics(['closed'], ['B']).citationSupport, 0);
  assert.equal(metrics([]).faithfulness, null);
  assert.equal((9 + 0) / (9 + 1), 0.9);
  assert.equal((9 / 9 + 0 / 1) / 2, 0.5);
  assert.equal(
    evidenceSnapshot({
      beat: 1,
      beatP: 0,
    }).recall,
    0.5,
  );
  assert.equal(
    evidenceSnapshot({
      beat: 1,
      beatP: 1,
    }).recall,
    1,
  );
  assert.equal(
    evidenceSnapshot({
      beat: 1,
      beatP: 1,
    }).precision,
    2 / 3,
  );
  assert.equal(
    citationSnapshot({
      beat: 2,
      beatP: 0,
    }).source,
    'B',
  );
  assert.equal(
    citationSnapshot({
      beat: 2,
      beatP: 1,
    }).source,
    'A',
  );
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  riskErrors,
  classificationFixture,
  scopeChangeFixture,
  appealReplayFixture,
} from '../animations/responsible-ai-governance-ethics-compliance.mjs';

test('a complete risk record still holds on its inclusive review due date', () => {
  const row = {
    owner: 'Release owner',
    control: 'G7',
    residual: 'Medium',
    evidence: ['Attack report'],
    reviewDate: '2026-11-06',
  };
  assert.deepEqual(riskErrors(row, '2026-11-06'), ['review due']);
  assert.deepEqual(riskErrors(row, '2026-11-05'), []);
  assert(riskErrors({ ...row, evidence: [' '] }, '2026-11-05').includes('evidence'));
  assert(
    riskErrors({ ...row, reviewDate: '2026-02-31' }, '2026-01-01').includes('valid review date'),
  );
});

test('AnnexIII profiling overrides its limited exception while the product route needs both inputs', () => {
  const facts = { annexIII: true, noSignificantRisk: true, exceptionCondition: true };
  assert.equal(classificationFixture(facts).highRisk, false);
  assert.equal(classificationFixture({ ...facts, profiling: true }).highRisk, true);
  assert.equal(
    classificationFixture({ annexI: true, safety: false, thirdPartyHealthSafety: true }).highRisk,
    false,
  );
  assert.equal(
    classificationFixture({ annexI: true, safety: true, thirdPartyHealthSafety: true }).highRisk,
    true,
  );
});

test('scope edits require new binding and an appeal correction creates no effect', () => {
  const old = scopeChangeFixture(10),
    changed = scopeChangeFixture(15);
  assert(old.eligible);
  assert(!changed.eligible);
  assert.notEqual(changed.originalDigest, changed.currentDigest);
  assert.deepEqual(changed.required, ['Release', 'Security', 'Exception']);
  assert.deepEqual(changed.effects, []);
  const corrected = appealReplayFixture({ receiptActuallyPresent: true, currentApproval: true });
  assert.equal(corrected.originalRecord.outcome, 'HELD');
  assert.equal(corrected.replayDecision, 'CORRECT factual read defect');
  assert.equal(corrected.eligibleForRevalidation, true);
  assert.equal(corrected.correctionAddsEffect, false);
  assert.deepEqual(corrected.observedEffects, []);
});

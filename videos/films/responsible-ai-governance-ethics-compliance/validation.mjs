import { ownershipEstimateAt, ownershipEvidenceAt, proposal } from './fixtures.mjs';
import {
  anchor,
  appealReplayFixture,
  auditSnapshot,
  classificationFixture,
  evaluate,
  originalChain,
  oversight,
  ownershipSnapshot,
  packageDecision,
  riskErrors,
  sampleModel,
  scopeChangeFixture,
  triage,
  verify,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  validateExpansion();
  assert.equal(
    sampleModel('intro', {
      beat: 0,
      beatP: 0.1,
      cues: {
        'intro-beat-1-focus-1': {
          phase: 'during',
        },
      },
    }).ownerOpened,
    true,
  );
  assert.equal(
    sampleModel('intro', {
      beat: 0,
      beatP: 0.1,
      cues: {
        'intro-beat-1-focus-1': {
          phase: 'before',
        },
      },
    }).ownerOpened,
    false,
  );
  const edited = auditSnapshot(1, 0.1);
  assert.equal(edited.internallyValid, false);
  assert.equal(edited.anchorMatches, true);
  const partial = auditSnapshot(1, 0.5);
  assert.equal(partial.recomputedCount, 2);
  assert.equal(partial.nodeChecks[1], true);
  assert.equal(partial.nodeChecks[2], false);
  assert.notEqual(partial.current[1].hash, originalChain[1].hash);
  assert.equal(partial.current[2].previous, originalChain[1].hash);
  const repaired = auditSnapshot(1, 0.6);
  assert.deepEqual(repaired.nodeChecks, [true, true, true]);
  assert.equal(repaired.current[2].previous, repaired.current[1].hash);
  assert.equal(repaired.anchor, anchor);
  assert.equal(repaired.anchorMatches, false);
  assert.equal(
    sampleModel('intro', {
      beat: 0,
      beatP: 0.9,
    }).effects.length,
    0,
  );
  assert.equal(triage([false, false, false, false]), 'Baseline review');
  assert.equal(triage([true, false, false, false]), 'Specialized risk review');
  assert.equal(triage([false, false, true, true]), 'Interaction + effect review');
  assert.equal(triage([null, false, false, false]), 'Facts review');
  for (const flags of [
    undefined,
    null,
    [],
    Array(4),
    [false, false, false],
    [undefined, false, false, false],
    [0, false, false, false],
    [false, false, false, false, true],
  ])
    assert.equal(triage(flags), 'Facts review');
  for (const beatP of [0, 0.12, 0.5, 0.88, 0.999999]) {
    const pending = sampleModel('ownership', {
      beat: 0,
      beatP,
    });
    assert.equal(pending.row.owner, 'Release owner');
    assert.equal(pending.inherentScore, 20);
    assert.equal(pending.residual, null);
    assert.equal(pending.residualScore, null);
    assert.deepEqual(pending.row.evidence, []);
    assert.deepEqual(pending.errors, ['residual', 'evidence']);
  }
  const beforeEvidence = ownershipSnapshot(1, ownershipEvidenceAt - 1e-8);
  assert.equal(beforeEvidence.row.evidence.length, 0);
  const attached = ownershipSnapshot(1, ownershipEvidenceAt);
  assert.equal(attached.row.evidence.length, 2);
  assert.equal(attached.residualScore, null);
  assert.deepEqual(attached.errors, ['residual']);
  assert.equal(ownershipSnapshot(1, ownershipEstimateAt - 1e-8).residual, null);
  const assessed = ownershipSnapshot(1, ownershipEstimateAt);
  assert.equal(assessed.residualScore, 10);
  assert.deepEqual(assessed.residual, {
    likelihood: 2,
    impact: 5,
  });
  assert.equal(assessed.row.evidence.length, 2);
  assert.deepEqual(assessed.errors, []);
  assert.deepEqual(ownershipSnapshot(1, 0.88), ownershipSnapshot(2, 0));
  assert.deepEqual(
    sampleModel('ownership', {
      beat: 0,
      beatP: 1,
    }),
    sampleModel('ownership', {
      beat: 1,
      beatP: 0,
    }),
  );
  const reviewedRisk = assessed.row;
  assert.deepEqual(riskErrors(reviewedRisk), []);
  for (const reviewDate of ['Soon', '2026-02-31', '2026-02-29', '2026-13-01', undefined])
    assert(
      riskErrors({
        ...reviewedRisk,
        reviewDate,
      }).includes('valid review date'),
    );
  assert.deepEqual(
    riskErrors({
      ...reviewedRisk,
      reviewDate: '2028-02-29',
    }),
    [],
  );
  assert.equal(evaluate([false, false, true], [false, true]).ready, false);
  assert.equal(evaluate([false, false, false], [false, false]).ready, true);
  assert.equal(evaluate([false], []).frr, null);
  assert.equal(evaluate([false], []).ready, false);
  for (const observations of [[null], [undefined], Array(1), [0], ['false'], undefined]) {
    const attacks = evaluate(observations, [false]),
      benign = evaluate([false], observations);
    assert.equal(attacks.asr, null);
    assert.equal(attacks.ready, false);
    assert.equal(benign.frr, null);
    assert.equal(benign.ready, false);
  }
  assert(evaluate([true, null], [false]).reasons.includes('Forbidden effect'));
  const paths = sampleModel('slices', {
    beat: 1,
    beatP: 0,
  });
  assert.equal(paths.aggregate, 4 / 28);
  assert.deepEqual(paths.rates, [0, 0.5]);
  assert(paths.investigation);
  const padded = sampleModel('slices', {
    beat: 2,
    beatP: 0.8,
    cues: { 'gov-slice-extra': { progress: 1 } },
  });
  assert.equal(padded.aggregate, 4 / 48);
  assert.deepEqual(padded.screen, paths.screen);
  assert(padded.investigation);
  const rerun = sampleModel('slices', {
    beat: 3,
    beatP: 0.8,
    cues: { 'gov-slice-reset': { progress: 1 }, 'gov-path-repair': { progress: 1 } },
  });
  assert.equal(rerun.total, paths.total);
  assert.equal(rerun.blocked, 0);
  assert(!rerun.investigation);
  assert(verify(originalChain, anchor));
  assert.equal(
    sampleModel('audit', {
      beat: 1,
      beatP: 0,
    }).internallyValid,
    false,
  );
  const during = sampleModel('audit', {
    beat: 1,
    beatP: 0.75,
  });
  assert(during.recomputed && during.internallyValid && !during.anchorMatches);
  const rewritten = sampleModel('audit', {
    beat: 2,
    beatP: 0,
  });
  assert(rewritten.internallyValid && !rewritten.anchorMatches);
  assert.equal(verify(originalChain.slice(0, 2), anchor), false);
  const approved = sampleModel('oversight', {
    beat: 2,
    beatP: 0,
  });
  assert(approved.eligible);
  assert.equal(
    oversight(
      {
        ...proposal,
        target: 50,
      },
      approved.receipts,
    ).eligible,
    false,
  );
  assert(
    sampleModel('oversight', {
      beat: 1,
      beatP: 0,
    }).denied,
  );
  assert.equal(
    sampleModel('oversight', {
      beat: 0,
      beatP: 0,
    }).eligible,
    false,
  );
  assert.equal(
    sampleModel('package', {
      beat: 0,
      beatP: 0,
    }).ready,
    false,
  );
  const completed = sampleModel('package', {
    beat: 1,
    beatP: 0,
  });
  assert(completed.ready);
  assert(!packageDecision(completed.current, completed.reviews, 0, 0, false).ready);
  assert(!packageDecision(completed.current, completed.reviews, 0, 0).ready);
  for (const count of [undefined, null, -1, 0.5, NaN, '0', Infinity]) {
    assert.equal(
      packageDecision(completed.current, completed.reviews, count, 0, true).ready,
      false,
    );
    assert.equal(
      packageDecision(completed.current, completed.reviews, 0, count, true).ready,
      false,
    );
  }
  assert.equal(
    packageDecision(completed.current, completed.reviews, undefined, undefined, true).ready,
    false,
  );
  assert.equal(
    sampleModel('package', {
      beat: 2,
      beatP: 0,
    }).matching.length,
    0,
  );
  return true;
}
export function validateExpansion() {
  const complete = {
    owner: 'Release owner',
    control: 'Gate',
    residual: 'Medium',
    evidence: ['Report'],
    reviewDate: '2026-11-06',
  };
  assert.deepEqual(riskErrors(complete), ['review due']);
  assert.deepEqual(
    riskErrors({
      ...complete,
      reviewDate: '2026-11-07',
    }),
    [],
  );
  assert(
    riskErrors({
      ...complete,
      evidence: [' '],
    }).includes('evidence'),
  );
  assert.equal(
    classificationFixture({
      annexI: true,
      safety: false,
      thirdPartyHealthSafety: true,
    }).highRisk,
    false,
  );
  assert.equal(
    classificationFixture({
      annexIII: true,
      noSignificantRisk: true,
      exceptionCondition: true,
      profiling: false,
    }).highRisk,
    false,
  );
  assert.equal(
    classificationFixture({
      annexIII: true,
      noSignificantRisk: true,
      exceptionCondition: true,
      profiling: true,
    }).highRisk,
    true,
  );
  assert.equal(scopeChangeFixture(10).eligible, true);
  assert.equal(scopeChangeFixture(15).eligible, false);
  assert.deepEqual(scopeChangeFixture(15).required, ['Release', 'Security', 'Exception']);
  assert.equal(scopeChangeFixture(10).deployment.matching.length, 8);
  assert.equal(
    scopeChangeFixture(15).deployment.expected,
    scopeChangeFixture(10).deployment.expected,
  );
  assert.deepEqual(scopeChangeFixture(15).matching, []);
  assert.notEqual(scopeChangeFixture(15).originalDigest, scopeChangeFixture(15).currentDigest);
  assert.equal(
    appealReplayFixture({
      receiptActuallyPresent: true,
    }).correctionAddsEffect,
    false,
  );
  assert.deepEqual(
    appealReplayFixture({
      currentApproval: true,
    }).observedEffects,
    [],
  );
}

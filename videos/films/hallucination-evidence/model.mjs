import { CURRENT_RECORD, EVIDENCE, cases, draftClaims, resolvedClaim } from './fixtures.mjs';
import {
  cadDistribution,
  disagreement,
  dolaDistribution,
  releaseEvidence,
  renderIncident,
  safeAnswer,
  semanticSampleStats,
  smoothPhase,
  verifyClaim,
} from './arithmetic.mjs';
import { claimsTrack, routeTrack, sampleTrack } from './construction.mjs';
import { baselineReview, candidateReview, relabeledReview, silentReview } from './case-review.mjs';
import assert from 'node:assert/strict';
export function scoreGate() {
  const candidate = cases.map((item) => ({
    id: item.id,
    ...safeAnswer(item.claims),
  }));
  const cleanCoverage = candidateReview.rows.some(
    (item) => item.id === 'clean_update' && item.served && !item.unsafe,
  )
    ? 1
    : 0;
  return {
    baselineUnsafe: baselineReview.unsafe,
    total: cases.length,
    served: candidateReview.served,
    unsafe: candidateReview.unsafe,
    unsafeRate: candidateReview.unsafeRate,
    responseCoverage: candidateReview.served / cases.length,
    cleanCoverage,
    candidate,
  };
}
export function gateSuiteFrame(beat, progress) {
  const amount = Math.max(0, Math.min(4, ((progress - 0.06) / 0.72) * 4));
  const baselineCount = beat === 0 ? Math.floor(amount + 1e-9) : 4;
  const candidateCount = beat === 0 ? 0 : beat === 1 ? Math.floor(amount + 1e-9) : 4;
  const candidateOrder = ['invented_eta', 'clean_update', 'wrong_status', 'unadmitted_source'];
  const checkedIds = new Set(candidateOrder.slice(0, candidateCount));
  const rows = cases.map((test, i) => ({
    ...test,
    baselineChecked: i < baselineCount,
    baselineUnsafe: test.claims.some((claim) => verifyClaim(claim).verdict !== 'supported'),
    candidateChecked: checkedIds.has(test.id),
    ...safeAnswer(test.claims),
  }));
  const checked = rows.filter((row) => row.candidateChecked),
    served = checked.filter((row) => ['serve', 'shorten'].includes(row.route));
  const active =
    beat === 1
      ? cases.findIndex((test) => test.id === candidateOrder[Math.min(3, Math.floor(amount))])
      : Math.min(3, Math.floor(amount));
  return {
    rows,
    baselineCount,
    candidateCount,
    active,
    travel: amount % 1,
    baselineUnsafe: rows.filter((row) => row.baselineChecked && row.baselineUnsafe).length,
    served: served.length,
    unsafe: served.filter(
      (row) =>
        row.answer.includes('14:30') || ['wrong_status', 'unadmitted_source'].includes(row.id),
    ).length,
    responseCoverage: served.length / cases.length,
    cleanCoverage: checked.some((row) => row.id === 'clean_update' && row.route === 'serve')
      ? 1
      : 0,
  };
}
export function safeRenderFrame(beat, beatP) {
  const removal = smoothPhase(beatP, 0.04, 0.48);
  const review = beat === 0 ? 0 : beat === 1 ? smoothPhase(beatP, 0.05, 0.48) : 1;
  return {
    kind: beat === 0 ? 'eta' : 'contradiction',
    route: review > 0 ? 'abstain' : 'shorten',
    etaOpacity: beat === 0 ? 1 - removal : 0,
    missingFieldOpacity: beat === 0 ? removal : 1,
    reviewOpacity: review,
    renderedCount: beat === 0 ? Math.min(3, Math.floor(Math.max(0, beatP - 0.06) / 0.18)) : 3,
  };
}
export function consistencyFrame(beat, beatP) {
  const sample = sampleTrack.sample({
    beat,
    beatP,
  }).snapshot;
  return {
    ...sample,
    disagreement: disagreement(sample.samples),
  };
}
export function validateModel() {
  assert.deepEqual(
    draftClaims.map((claim) => verifyClaim(claim).verdict),
    ['supported', 'supported', 'supported', 'not_supported'],
  );
  assert.equal(verifyClaim(resolvedClaim).verdict, 'contradicted');
  assert.equal(
    verifyClaim({
      ...draftClaims[0],
      version: 'runbook-feed/old',
    }).verdict,
    'version_mismatch',
  );
  assert.equal(
    verifyClaim({
      ...draftClaims[0],
      sourceId: 'missing-feed',
    }).verdict,
    'no_source',
  );
  assert.equal(safeAnswer(draftClaims).route, 'shorten');
  assert.equal(safeAnswer(draftClaims).answer.includes('14:30'), false);
  assert.equal(safeAnswer([resolvedClaim]).route, 'abstain');
  assert.equal(safeRenderFrame(0, 0).etaOpacity, 1);
  assert.equal(safeRenderFrame(0, 0.5).etaOpacity, 0);
  assert.equal(safeRenderFrame(0, 0.3).renderedCount, 1);
  assert.equal(safeRenderFrame(0, 0.99).renderedCount, 3);
  assert.equal(safeRenderFrame(1, 0).reviewOpacity, 0);
  assert.equal(safeRenderFrame(1, 0.5).reviewOpacity, 1);
  assert.equal(safeRenderFrame(1, 0.5).route, 'abstain');
  assert.equal(safeRenderFrame(2, 0).reviewOpacity, 1);
  assert.equal(disagreement(['investigating', 'investigating', 'mitigated', 'resolved']), 0.5);
  assert.equal(disagreement(['14:30 UTC', '14:30 UTC', '14:30 UTC', '14:30 UTC']), 0);
  const score = scoreGate();
  assert.equal(score.baselineUnsafe, 3);
  assert.deepEqual(
    [score.served, score.unsafe, score.responseCoverage, score.cleanCoverage],
    [2, 0, 0.5, 1],
  );
  assert.equal(gateSuiteFrame(0, 0).baselineCount, 0);
  assert.equal(gateSuiteFrame(0, 0.9).baselineUnsafe, 3);
  assert.equal(gateSuiteFrame(1, 0.1).candidateCount, 0);
  const partialSuite = gateSuiteFrame(1, 0.5);
  assert.equal(partialSuite.candidateCount, 2);
  assert.equal(partialSuite.served, 2);
  assert.equal(partialSuite.unsafe, 0);
  assert.equal(
    gateSuiteFrame(1, 0.3).rows.find((row) => row.id === 'invented_eta').candidateChecked,
    true,
  );
  assert.equal(
    gateSuiteFrame(1, 0.3).rows.find((row) => row.id === 'clean_update').candidateChecked,
    false,
  );
  assert.equal(gateSuiteFrame(1, 0.9).responseCoverage, 0.5);
  assert.deepEqual(
    gateSuiteFrame(2, 0.9)
      .rows.filter((row) => row.candidateChecked)
      .map((row) => row.id),
    cases.map((row) => row.id),
  );
  assert.equal(
    claimsTrack.sample({
      beat: 1,
      beatP: 0.99,
    }).snapshot.visibleClaimCount,
    4,
  );
  assert.equal(
    routeTrack.sample({
      beat: 2,
      beatP: 0.99,
    }).snapshot.route,
    'abstain',
  );
  assert.equal(consistencyFrame(0, 0.99).label, 'varying answers');
  assert.equal(consistencyFrame(0, 0.99).disagreement, 0.5);
  // The measured second beat introduces identical estimates before saying "zero" at 2.65s.
  for (const [beat, beatP] of [
    [1, 0],
    [1, 0.35 / (10.008 + 0.7)],
    [1, 2.65 / (10.008 + 0.7)],
    [1, 0.99],
    [2, 0.5],
  ]) {
    const current = consistencyFrame(beat, beatP);
    assert.equal(current.label, 'same unsupported ETA');
    assert.deepEqual(current.samples, Array(4).fill('14:30 UTC'));
    assert.equal(current.disagreement, 0);
    assert.equal(verifyClaim(draftClaims[3]).verdict, 'not_supported');
  }
  validateHallucinationUpgrade();
  return true;
}
export function freshIncidentFrame(repair = false) {
  const claims = [
    {
      id: 'fresh-eta',
      sourceId: EVIDENCE.sourceId,
      version: repair ? CURRENT_RECORD.version : EVIDENCE.version,
      field: 'recovery_eta',
      value: '15:10 UTC',
      text: 'Fully recovered.',
    },
    {
      id: 'fresh-status',
      sourceId: EVIDENCE.sourceId,
      version: CURRENT_RECORD.version,
      field: 'status',
      value: 'mitigated',
      text: 'Fully recovered.',
    },
  ];
  return {
    record: CURRENT_RECORD,
    claims,
    ...renderIncident(claims, CURRENT_RECORD),
  };
}
export function validateHallucinationUpgrade() {
  const shorten = renderIncident(draftClaims);
  const withhold = renderIncident([...draftClaims.slice(0, 3), resolvedClaim]);
  assert.equal(shorten.route, 'shorten');
  assert.deepEqual(shorten.verdicts, ['supported', 'supported', 'supported', 'not_supported']);
  assert.equal(shorten.text.includes(draftClaims[3].value), false);
  assert.equal(withhold.route, 'abstain');
  assert.deepEqual(withhold.verdicts, ['supported', 'supported', 'supported', 'contradicted']);
  assert.equal(withhold.text.includes(draftClaims[0].value), false);
  assert.deepEqual([relabeledReview.unsafe, relabeledReview.served], [3, 4]);
  assert.deepEqual([silentReview.unsafeRate, silentReview.served], [null, 0]);
  assert.equal(freshIncidentFrame(false).verdicts[0], 'version_mismatch');
  const repaired = freshIncidentFrame(true);
  assert.equal(repaired.route, 'serve');
  assert.equal(repaired.text, 'Recorded recovery estimate: 15:10 UTC. Recorded status: mitigated.');
  assert.equal(repaired.text.includes('Fully recovered'), false);
  const stats = semanticSampleStats(['a', 'a', 'b', 'c']);
  assert.ok(Math.abs(stats.entropy - 1.0397207708) < 1e-9);
  assert.equal(stats.disagreement, 0.5);
  assert.equal(semanticSampleStats(['a', 'a', 'a', 'a']).entropy, 0);
  const d = dolaDistribution([0.7, 0.2, 0.1], [0.2, 0.3, 0.5], 0.2);
  assert.ok(Math.abs(d.cutoff - 0.14) < 1e-12);
  assert.ok(Math.abs(d.probabilities[0] - 0.84) < 1e-12);
  assert.equal(d.probabilities[2], 0);
  const cad = cadDistribution([0.7, 0.2, 0.1], [0.1, 0.8, 0.1], 1);
  assert.ok(Math.abs(cad.sum - 5.05) < 1e-12);
  assert.ok(Math.abs(cad.probabilities[0] - 98 / 101) < 1e-12);
  for (const [i, v] of [0.7, 0.2, 0.1].entries())
    assert.ok(
      Math.abs(cadDistribution([0.7, 0.2, 0.1], [0.1, 0.8, 0.1], 0).probabilities[i] - v) < 1e-12,
    );
  assert.equal(
    releaseEvidence({
      regressions: true,
      versions: true,
      holdout: false,
      owner: false,
    }),
    false,
  );
  assert.throws(
    () =>
      releaseEvidence({
        regressions: true,
        versions: true,
        holdout: 'false',
        owner: true,
      }),
    /actual boolean/,
  );
  return true;
}

import {
  accessResult,
  auditCounts,
  budgetProbability,
  exactCandidate,
  judgeAudit,
  orderedVerdict,
  parseAttackBatch,
  policyObjective,
  releaseAudit,
  softPreferenceStep,
} from './arithmetic.mjs';
import { orderAudit } from './fixtures.mjs';
import { probeFrame, supervisedToken } from './construction.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  const release = releaseAudit();
  assert.equal(release.frr, 0.25);
  assert.equal(release.helpfulness, 0.625);
  assert.equal(release.asr, 0.2);
  assert.deepEqual(release.attackBounds, [1 / 7, 3 / 7]);
  assert.deepEqual(parseAttackBatch(['roleplay', 'roleplay']), {
    accepted: false,
    targetAttempts: 0,
  });
  assert.deepEqual(parseAttackBatch(['roleplay', 'encoded']), {
    accepted: true,
    targetAttempts: 2,
  });
  assert(Math.abs(orderAudit.meanA - 0.55) < 1e-12);
  assert(Math.abs(policyObjective().kl - 0.19274475702175747) < 1e-12);
  assert(policyObjective().objective > policyObjective().referenceObjective);
  assert(policyObjective(1).objective < policyObjective(1).referenceObjective);
  assert.equal(exactCandidate().id, 'C');
  assert.deepEqual(
    [
      auditCounts().knownAttack,
      auditCounts().violations,
      auditCounts().knownBenign,
      auditCounts().helpful,
      auditCounts().refusals,
    ],
    [6, 2, 5, 3, 1],
  );
  assert.deepEqual(auditCounts().attackBounds, [2 / 7, 3 / 7]);
  assert.deepEqual(auditCounts().helpfulBounds, [3 / 6, 4 / 6]);
  assert.equal(
    auditCounts([
      {
        id: 'u',
        cohort: 'attack',
        outcome: 'review',
      },
    ]).asr,
    null,
  );
  const judge = judgeAudit();
  assert.deepEqual([judge.tp, judge.fp, judge.fn, judge.tn, judge.review], [2, 1, 1, 1, 1]);
  assert(Math.abs(judge.brier - 0.3254166666666667) < 1e-12);
  assert(Math.abs(budgetProbability(10) - 0.6513215599) < 1e-12);
  assert.equal(budgetProbability(10, false), 0.1);
  assert.equal(accessResult().fetched, false);
  assert.equal(
    accessResult({
      record: true,
    }).fetched,
    true,
  );
  assert.equal(
    accessResult({
      record: true,
      destination: false,
    }).delivered,
    false,
  );
  assert.equal(orderedVerdict(0).responseId, orderedVerdict(1).responseId);
  assert.notEqual(orderedVerdict(0).position, orderedVerdict(1).position);
  assert.notEqual(
    orderedVerdict(0, 'position').responseId,
    orderedVerdict(1, 'position').responseId,
  );
  const step = softPreferenceStep();
  assert.equal(step.beforeProbability, 0.5);
  assert(Math.abs(step.gradient + 0.3) < 1e-12);
  assert(Math.abs(step.margin - 0.15) < 1e-12);
  assert(Math.abs(step.probability - 0.5374298453437496) < 1e-12);
  assert(step.probability > step.beforeProbability && step.probability < step.target);
  assert.equal(softPreferenceStep(0.5).margin, 0);
  const before = supervisedToken(0, 0),
    after = supervisedToken(0, 1);
  assert(after.probabilities[0] > before.probabilities[0]);
  assert(after.loss < before.loss);
  assert.equal(supervisedToken(1, 0).selected, 2);
  for (let n = 0; n <= 100; n++) {
    const token = supervisedToken(0, n / 100),
      probe = probeFrame(0, n / 100);
    assert(Math.abs(token.probabilities.reduce((a, b) => a + b, 0) - 1) < 1e-12);
    assert.equal(probe.permitted + probe.forbidden, probe.visible);
  }
  assert.equal(probeFrame(0, 1).falseRefusals, 2);
  assert.equal(probeFrame(0, 1).disclosures, 1);
  assert.equal(probeFrame(2, 0).runtimeDenied, false);
  assert.equal(probeFrame(2, 1).runtimeDenied, true);
  return true;
}

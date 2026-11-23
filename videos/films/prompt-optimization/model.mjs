import { apiClamp, countFixture } from './arithmetic.mjs';
import {
  searchCandidates,
  searchCase,
  splitRows,
  testFixture,
  validationFixture,
} from './fixtures.mjs';
import assert from 'node:assert/strict';
export function scorePair(gold, prediction) {
  assert(typeof gold?.route === 'string' && typeof gold.recordId === 'string');
  assert(
    gold.route === 'ABSTAIN'
      ? gold.recordId === ''
      : gold.route === 'SERVE' && gold.recordId.trim() !== '',
  );
  return Number(prediction?.route === gold.route && prediction.recordId === gold.recordId);
}
export function buildSplitPlan(rows = splitRows) {
  const familySplit = new Map();
  const families = {
    train: [],
    development: [],
    test: [],
  };
  const records = {
    train: [],
    development: [],
    test: [],
  };
  const rejected = [];
  for (const row of rows) {
    if (!Object.hasOwn(families, row.requestedSplit))
      throw new Error(`unknown split ${row.requestedSplit}`);
    const assigned = familySplit.get(row.family);
    if (assigned && assigned !== row.requestedSplit) {
      rejected.push({
        ...row,
        assignedSplit: assigned,
        reason: 'family already assigned',
      });
      continue;
    }
    if (!assigned) {
      familySplit.set(row.family, row.requestedSplit);
      families[row.requestedSplit].push(row.family);
    }
    records[row.requestedSplit].push(row.id);
  }
  return {
    families,
    records,
    rejected,
  };
}
export const splitPlan = buildSplitPlan();
export function safetyDecision({ forbidden, relevant, capPercent }) {
  assert(Number.isSafeInteger(relevant) && relevant > 0);
  assert(Number.isSafeInteger(forbidden) && forbidden >= 0 && forbidden <= relevant);
  assert(Number.isFinite(capPercent) && capPercent >= 0 && capPercent <= 100);
  const percent = (100 * forbidden) / relevant;
  return { percent, verdict: percent <= capPercent ? 'PASS' : 'HOLD' };
}
export const familySplits = splitPlan.families;
export function selectValidationWinner() {
  const baseline = countFixture(validationFixture.baseline);
  const compiled = countFixture(validationFixture.compiled);
  return compiled.rate > baseline.rate ? 'compiled' : 'baseline';
}
export function testReversal() {
  const selected = selectValidationWinner();
  const baseline = countFixture(testFixture.baseline);
  const compiled = countFixture(testFixture.compiled);
  return {
    selected,
    baseline,
    compiled,
    reversal: compiled.rate < baseline.rate,
  };
}
export function promptSearchSnapshot(beat, beatP = 0) {
  const revised = beat > 0 || apiClamp(beatP, 0, 1) >= 0.58;
  const prediction = revised ? searchCase.gold : searchCase.prediction;
  return {
    caseId: searchCase.id,
    candidate: searchCandidates[revised ? 1 : 0].id,
    prediction,
    score: scorePair(searchCase.gold, prediction),
  };
}
export function bootstrapMetricAccept(score, threshold = null, hasMetric = true) {
  if (!hasMetric) return true;
  assert.equal(typeof score, 'number');
  assert(threshold === null || typeof threshold === 'number');
  return threshold !== null && threshold !== 0 ? score >= threshold : score !== 0;
}

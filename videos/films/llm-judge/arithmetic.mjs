import assert from 'node:assert/strict';
export const upperAfterZero = (n) => -Math.expm1(Math.log(0.05) / n);
export const belowOnePercent = Math.ceil(Math.log(0.05) / Math.log1p(-0.01));
export function receipt(verdict, reversed = false, caseId = 'DEP27-pair') {
  return {
    caseId,
    config: 'rubric-v1/judge-fixture',
    order: reversed ? ['stepwise', 'compact'] : ['compact', 'stepwise'],
    verdict,
  };
}
export function identity(result) {
  return result.verdict === 'A'
    ? result.order[0]
    : result.verdict === 'B'
      ? result.order[1]
      : result.verdict;
}
export function aggregateSwaps(first, second) {
  assert.equal(first.caseId, second.caseId);
  assert.equal(first.config, second.config);
  assert.deepEqual(second.order, [...first.order].reverse());
  if ([first.verdict, second.verdict].includes('review')) return 'review';
  return identity(first) === identity(second) ? identity(first) : 'unresolved';
}

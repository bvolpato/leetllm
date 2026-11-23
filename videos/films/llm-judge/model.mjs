import { human, judge, labels, policy, records } from './fixtures.mjs';
import assert from 'node:assert/strict';
export const counts = (values) =>
  Object.fromEntries(
    labels.map((label) => [label, values.filter((value) => value === label).length]),
  );
export const humanCounts = counts(human);
export const judgeCounts = counts(judge);
export const matches = human.filter((value, i) => value === judge[i]).length;
export const observed = matches / human.length;
export const expected =
  labels.reduce((sum, label) => sum + humanCounts[label] * judgeCounts[label], 0) /
  human.length ** 2;
export const kappa = (observed - expected) / (1 - expected);
export function judgeReport({ attempted, resolved, comparable, matches }) {
  for (const count of [attempted, resolved, comparable, matches])
    assert.ok(Number.isSafeInteger(count) && count >= 0);
  assert.ok(matches <= comparable && comparable <= resolved && resolved <= attempted);
  return {
    attempted,
    resolved,
    comparable,
    matches,
    coverage: attempted ? resolved / attempted : null,
    agreement: comparable ? matches / comparable : null,
  };
}
export function exactFields(record) {
  return (
    record.policyVersion === policy.version &&
    record.actions.length === policy.actions.length &&
    record.actions.every((action, i) => action === policy.actions[i])
  );
}
export const attempts = records.length;
export const resolved = records.filter((record) => labels.includes(record.outcome)).length;
export const unresolved = records.filter((record) => record.outcome === 'unresolved').length;
export const review = records.filter((record) => record.outcome === 'review').length;

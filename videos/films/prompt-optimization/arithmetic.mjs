import assert from 'node:assert/strict';
export function apiClamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}
export function countFixture(values) {
  const correct = values.correct;
  const total = values.total;
  return {
    correct,
    total,
    rate: correct / total,
  };
}
export function plannedPromptRequests({
  trials,
  cases,
  predictors = 2,
  judges = 1,
  teacher = 0,
  proposals = 0,
}) {
  for (const v of [trials, cases, predictors, judges, teacher, proposals])
    assert(Number.isSafeInteger(v) && v >= 0);
  assert(cases > 0);
  const executions = (trials + 1) * cases,
    roles = predictors + judges,
    requests = executions * roles + teacher + proposals;
  assert(Number.isSafeInteger(requests));
  return {
    executions,
    roles,
    roleRequests: executions * roles,
    teacher,
    proposals,
    requests,
  };
}

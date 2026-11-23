import assert from 'node:assert/strict';
import { plannedPromptRequests } from '../../../films/prompt-optimization/arithmetic.mjs';
import {
  bootstrapMetricAccept,
  scorePair,
  safetyDecision,
  selectValidationWinner,
} from '../../../films/prompt-optimization/model.mjs';
import {
  metricCases,
  splitRows,
  validationFixture,
  testFixture,
} from '../../../films/prompt-optimization/fixtures.mjs';

export { paymentCase, billingCase } from '../../../films/prompt-optimization/policy-sheet.mjs';
export const zip = '02139';
export const copies = [String(Number(zip)), zip];
export const grade = (exact) =>
  copies.map((v) => Number(exact ? v === zip : Number(v) === Number(zip)));
export const rollback = metricCases[0].gold;
export const deploy = metricCases[1].gold;
export const wrong = { ...rollback, recordId: 'approval-9999' };
export const pairScore = scorePair;
export const rows = splitRows;
export const demoLabels = [rollback, deploy];
export const boot = [rollback, deploy].map((gold) => ({
  gold,
  reply: rollback,
  score: scorePair(gold, rollback),
}));
export const accepted = (scores, threshold, hasMetric = true) =>
  scores.map((value) => bootstrapMetricAccept(value, threshold, hasMetric));
export const choices = ['A', 'B', 'C'].flatMap((i) => [1, 2].map((d) => i + d));
export const samples = [1, 3, 6, 10, 13, 14, 19, 22, 23, 26, 30, 34];
export const manualSearch = { num_trials: 12, minibatch: false };
export const listSize = 10;
export const validationCount = (grouped) => listSize - (grouped ? 3 : 2);
export const roles = ['Evidence predictor', 'Route predictor', 'Judge'];
export const fullSearch = { trials: 40, cases: 50, predictors: roles.length - 1 };
export const large = plannedPromptRequests(fullSearch);
export const small = (trials) =>
  plannedPromptRequests({ trials, cases: 24, teacher: 12, proposals: 9 });
export const requestCap = 650;
export const tokenLoad = { added: 2500, rps: 100 };
export const dev = validationFixture,
  test = testFixture;
// Both illustrative pairings preserve the published marginal counts.
export function pairedOutcomes(moved) {
  const n = test.baseline.total,
    a = test.compiled.correct,
    b = test.baseline.correct;
  const items = Array.from({ length: n }, (_, i) => ({
    baseline: i < b,
    compiled: i < a - moved || (i >= b && i < b + moved),
  }));
  return {
    items,
    baselineOnly: items.filter((r) => r.baseline && !r.compiled).length,
    compiledOnly: items.filter((r) => !r.baseline && r.compiled).length,
  };
}
export const chosen = selectValidationWinner();
export const instructionLines = ['Select a record that supports', 'the requested action, or abstain.'];
export const saved = {
  decide: {
    signature: {
      instructions: instructionLines.join(' '),
      fields: ['Evidence:', 'Question:', 'Route:', 'Record Id:'].map((prefix) => ({ prefix })),
    },
    demos: demoLabels.map(({ route, recordId }) => ({ route, record_id: recordId })),
    lm: { model: 'A', extra_headers: { Authorization: 'fixture-only-header' } },
  },
};
export const modelFor = (savedModel, globalModel) => savedModel ?? globalModel;
export const safetyMarks = Array.from({ length: 80 }, (_, i) => i === 61 || i === 70);
export const safety = {
  forbidden: safetyMarks.filter(Boolean).length,
  relevant: safetyMarks.length,
  capPercent: 1,
};
export const release = safetyDecision(safety);
export function check() {
  assert.deepEqual(copies, ['2139', '02139']);
  assert.deepEqual(
    [grade(false), grade(true)],
    [
      [1, 1],
      [0, 1],
    ],
  );
  assert.deepEqual(
    [
      scorePair(rollback, wrong),
      scorePair(rollback, rollback),
      scorePair(deploy, rollback),
      scorePair(deploy, deploy),
    ],
    [0, 1, 0, 1],
  );
  assert.equal(rows.at(-1).family, rows[0].family);
  assert.deepEqual(
    accepted(
      boot.map((t) => t.score),
      1,
    ),
    [true, false],
  );
  assert.deepEqual(accepted([0.5, 0.5], 0), [true, true]);
  assert.deepEqual(accepted([0.5, 0.5], 1), [false, false]);
  assert.deepEqual(accepted([-0.2, NaN], null), [true, true]);
  assert.deepEqual(accepted([0, 0], 1, false), [true, true]);
  assert.equal(choices.length ** 2, 36);
  assert.equal(new Set(samples).size, 12);
  assert.equal(manualSearch.num_trials, samples.length);
  assert.equal(manualSearch.minibatch, false);
  assert.deepEqual([validationCount(false), validationCount(true)], [8, 7]);
  assert.ok(samples.every((i) => i >= 0 && i < 36));
  assert.deepEqual(
    [large.executions, large.requests, large.requests - 1, large.requests + 1],
    [2050, 6150, 6149, 6151],
  );
  assert.equal(tokenLoad.added * tokenLoad.rps, 250000);
  assert.deepEqual(
    [small(8).executions, small(8).roleRequests, small(8).requests, small(7).requests],
    [216, 648, 669, 597],
  );
  assert.equal(small(8).requests - requestCap, 19);
  assert.equal(small(8).requests - small(7).requests, 72);
  assert.equal(chosen, 'compiled');
  assert.equal(dev.compiled.correct - dev.baseline.correct, 5);
  assert.equal(test.compiled.correct - test.baseline.correct, -3);
  for (const moved of [0, 4]) {
    const state = pairedOutcomes(moved);
    assert.equal(state.items.filter((r) => r.baseline).length, 16);
    assert.equal(state.items.filter((r) => r.compiled).length, 13);
    assert.deepEqual([state.baselineOnly, state.compiledOnly], [3 + moved, moved]);
  }
  const restored = JSON.parse(JSON.stringify(saved));
  assert.equal(restored.decide.signature.instructions, 'Select a record that supports the requested action, or abstain.');
  assert.deepEqual(restored.decide.demos, [
    { route: 'SERVE', record_id: 'approval-4412' },
    { route: 'ABSTAIN', record_id: '' },
  ]);
  assert.equal(modelFor(restored.decide.lm.model, 'B'), 'A');
  assert.equal(modelFor('B', 'B'), 'B');
  assert.equal(modelFor(undefined, 'B'), 'B');
  assert.equal(restored.decide.lm.extra_headers.Authorization, 'fixture-only-header');
  assert.ok(!Object.hasOwn(restored.decide.lm, 'api_key'));
  assert.equal(release.percent, 2.5);
  assert.equal(release.verdict, 'HOLD');
  return true;
}

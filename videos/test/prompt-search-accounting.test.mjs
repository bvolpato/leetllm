import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bootstrapMetricAccept,
  plannedPromptRequests,
} from '../animations/prompt-optimization.mjs';

test('pinned bootstrap admission follows Python numeric truthiness when threshold is absent or zero', () => {
  for (const threshold of [null, 0]) {
    for (const score of [0.5, -0.2, NaN])
      assert.equal(bootstrapMetricAccept(score, threshold), true);
    assert.equal(bootstrapMetricAccept(0, threshold), false);
  }
  assert.equal(bootstrapMetricAccept(-0.2, 0.1), false);
  assert.equal(bootstrapMetricAccept(0.5, NaN), false);
  assert.equal(bootstrapMetricAccept(0, 1, false), true);
});

test('request accounting includes the default baseline and separately counted overhead', () => {
  assert.deepEqual(plannedPromptRequests({ trials: 8, cases: 24, teacher: 12, proposals: 9 }), {
    executions: 216,
    roles: 3,
    roleRequests: 648,
    teacher: 12,
    proposals: 9,
    requests: 669,
  });
  assert.equal(plannedPromptRequests({ trials: 12, cases: 30 }).requests, 1170);
  assert.equal(
    plannedPromptRequests({ trials: 0, cases: 4, predictors: 1, judges: 0 }).requests,
    4,
  );
  for (const bad of [-1, 1.5, NaN])
    assert.throws(() => plannedPromptRequests({ trials: bad, cases: 24 }));
});

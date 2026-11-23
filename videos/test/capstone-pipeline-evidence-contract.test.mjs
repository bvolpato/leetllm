import test from 'node:test';
import assert from 'node:assert/strict';
import {
  admittedFeature,
  pipelineOffline,
  pipelinePromotionFixture,
  pipelinePromotionDecision,
  freshPipelineState,
} from '../animations/capstone-production-ml-pipeline.mjs';

test('feature admission excludes later availability and rejects same-instant revisions', () => {
  const rows = [
    { entity: 'R', observed: '2026-05-28T10:00:00Z', available: '2026-05-28T11:00:00Z', value: 7 },
    { entity: 'R', observed: '2026-05-28T11:30:00Z', available: '2026-05-28T12:30:00Z', value: 99 },
  ];
  assert.equal(admittedFeature(rows, '2026-05-28T12:00:00Z', 'R').value, 7);
  assert.throws(
    () =>
      admittedFeature(
        [...rows, { ...rows[0], observed: '2026-05-28T10:00:00+00:00' }],
        '2026-05-28T12:00:00Z',
        'R',
      ),
    /ambiguous normalized/,
  );
  assert.equal(admittedFeature(rows, '2026-05-28T12:00:00Z', 'other'), null);
});

test('zero denominators remain missing evidence, not passing offline gates', () => {
  const result = pipelineOffline([
    { id: 'E', gold: false, critical: true, pred: false, cost: 0, baseline: 0 },
  ]);
  assert.equal(result.recall, null);
  assert.equal(result.delta, null);
  assert.equal(result.pass, false);
});

test('restoring policy does not revive superseded readiness or a changed artifact/base', () => {
  assert.deepEqual(freshPipelineState(1).decision.reasons, [
    'canary_receipt_superseded',
    'canary_receipt_policy_fingerprint_mismatch',
  ]);
  assert.deepEqual(freshPipelineState(2).decision.reasons, ['canary_receipt_superseded']);
  assert.equal(freshPipelineState(2).probe.warning, false);
  assert.equal(freshPipelineState(3).decision.action, 'promote');
  assert.equal(freshPipelineState(3).probe.warning, true);
  const state = pipelinePromotionFixture();
  assert.equal(pipelinePromotionDecision({ ...state, production: 'v1' }).action, 'hold_promotion');
  state.retained.v1.bytes += ' ';
  assert(pipelinePromotionDecision(state).reasons.includes('model_reload_failed'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  typedEvidenceDecision,
  validateDecodedAction,
  exactApprovalDecision,
  localPromotionCases,
  linkResourceAllowed,
  wilsonBounds,
  reportEligibility,
  promptCueSnapshot,
  freshAuthorityDecision,
  validateModel,
} from '../animations/prompt-injection.mjs';

const approval = {
  user: 'user-17',
  candidate: 'C17',
  suite: 'R42',
  target: 'prod-10pct',
  operation: 'OP-9',
};
const fresh = {
  user: 'user-26',
  candidate: 'C26',
  suite: 'R73',
  target: 'staging',
  operation: 'OP12',
};
test('typed evidence crosses only after exact fields and source values agree', () => {
  const value = { candidate: 'C17', suite: 'R42', gate: 'passed' };
  assert.equal(
    typedEvidenceDecision({ ...value, approved: true }).reason,
    'extra-or-missing-fields',
  );
  assert.equal(
    typedEvidenceDecision(value, { source_id: 'source-A', ...value, gate: 'failed' }).reason,
    'source-mismatch',
  );
  const result = typedEvidenceDecision(value, { source_id: 'source-A', ...value });
  assert.equal(result.record.source_id, 'source-A');
  assert.equal(Object.hasOwn(value, 'source_id'), false);
});
test('duplicate decoded fields are rejected before object overwrite', () => {
  const pairs = [
    ['action', 'request_promotion'],
    ['candidate_id', 'C17'],
    ['eval_suite', 'R42'],
  ];
  assert.equal(validateDecodedAction(pairs, 70).accepted, true);
  assert.equal(
    validateDecodedAction([...pairs, ['action', 'answer_eval']], 90).reason,
    'duplicate-key',
  );
  assert.equal(
    validateDecodedAction([pairs[0], pairs[1], ['eval_suite', true]], 70).reason,
    'type',
  );
  assert.equal(validateDecodedAction(pairs, 513).reason, 'character-limit');
  assert.equal(
    validateDecodedAction([pairs[0], pairs[1], ['eval_suite', 'R1234567']], 70).reason,
    'value',
  );
});
test('target admission and exact approval binding remain ordered independent checks', () => {
  assert.equal(exactApprovalDecision({ ...approval, target: 'staging' }, approval), 'approval');
  assert.equal(
    exactApprovalDecision(
      { ...approval, target: 'prod-100pct' },
      { ...approval, target: 'prod-100pct' },
    ),
    'target',
  );
  assert.equal(exactApprovalDecision(approval, approval, { consumed: true }), 'approval');
  const results = localPromotionCases();
  assert.equal(results.filter((r) => r.decision === 'allow').length, 1);
  assert.equal(results.at(-1).decision, 'allow');
});
test('an approved-looking URL does not widen the fixed outgoing resource', () => {
  assert.equal(linkResourceAllowed('https://evals.mlplatform.example:443/runs/R42'), true);
  for (const url of [
    'https://evals.mlplatform.example.evil.test/runs/R42',
    'https://evals.mlplatform.example/runs/R42?secret=PRIVATE',
    'https://evals.mlplatform.example/runs/R42#note',
    'https://u:p@evals.mlplatform.example/runs/R42',
    'https://evals.mlplatform.example:444/runs/R42',
  ])
    assert.equal(linkResourceAllowed(url), false);
});
test('zero observations retain finite sampling uncertainty and typed count limits', () => {
  assert.equal(Number((100 * wilsonBounds(0, 250)[1]).toFixed(2)), 1.51);
  assert.equal(Number((100 * wilsonBounds(0, 20)[1]).toFixed(2)), 16.11);
  assert.throws(() => wilsonBounds(0, 0), RangeError);
  assert.throws(() => wilsonBounds(0, true), RangeError);
  assert.throws(() => reportEligibility({ blocked: -1 }), RangeError);
  assert.throws(() => reportEligibility({ attacks: true }), RangeError);
});
test('support and useful-work predicates each retain a veto', () => {
  assert.equal(reportEligibility().eligible, true);
  assert.equal(reportEligibility({ paths: [50, 50, 50, 50] }).eligible, false);
  assert.equal(reportEligibility({ attacks: 20, paths: [4, 4, 4, 4, 4] }).eligible, false);
  assert.equal(reportEligibility({ blocked: 200 }).eligible, false);
  assert.equal(reportEligibility({ unsafe: 1 }).eligible, false);
});
test('prediction and matching-comparison counts follow independent spoken cues', () => {
  const before = { phase: 'before', progress: 0 },
    after = { phase: 'after', progress: 1 },
    ids = ['pi-fresh-zero', 'pi-fresh-matching', 'pi-fresh-one', 'pi-fresh-replay'];
  const cues = Object.fromEntries(ids.map((id) => [id, before]));
  const hidden = promptCueSnapshot('fresh-authority', { beat: 1, beatP: 0.99, cues }).fresh;
  assert.equal(hidden.zeroVisible, false);
  assert.equal(hidden.effectsVisible, false);
  assert.equal(hidden.approval.operation, 'OP11');
  const zero = promptCueSnapshot('fresh-authority', {
    beat: 1,
    beatP: 0,
    cues: { ...cues, 'pi-fresh-zero': after },
  }).fresh;
  assert.equal(zero.zeroVisible, true);
  assert.equal(zero.matching, false);
  assert.equal(zero.effectsVisible, false);
  const one = promptCueSnapshot('fresh-authority', {
    beat: 1,
    beatP: 0,
    cues: Object.fromEntries(ids.map((id) => [id, after])),
  }).fresh;
  assert.equal(one.effects, 1);
  assert.equal(one.storeApproval, null);
  assert.equal(one.replayDecision, 'approval');
  assert.equal(one.replay, true);
});
test('fresh operation authorization is computed from the supplied host tuple', () => {
  assert.equal(freshAuthorityDecision(fresh, { ...fresh, operation: 'OP11' }), 'approval');
  assert.equal(freshAuthorityDecision(fresh, fresh), 'execute');
  assert.equal(freshAuthorityDecision({ ...fresh, user: 'other' }, fresh), 'ownership');
  assert.equal(freshAuthorityDecision({ ...fresh, target: 'production' }, fresh), 'target');
  assert.equal(freshAuthorityDecision(fresh, fresh, { consumed: true }), 'approval');
  assert.equal(validateModel(), true);
});

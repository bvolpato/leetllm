import test from 'node:test';
import assert from 'node:assert/strict';
import {
  approvalFixture,
  articleActionHash,
  streamTripwire,
  validateDetectorResult,
  claimAgreement,
  prevalenceCounts,
  freshGuardFrame,
  cueConfusionTrace,
} from '../animations/safety-guardrails.mjs';

test('required detector results reject numeric coercion and invalid domains', () => {
  for (const score of [0, 0.91, 1]) assert(validateDetectorResult({ label: 'safe', score }));
  for (const score of [true, false, null, undefined, NaN, Infinity, -0.1, 1.1, '0.91'])
    assert(!validateDetectorResult({ label: 'safe', score }));
  assert(!validateDetectorResult({ label: 'invented', score: 0.3 }));
});
test('approval binds payload and current authority before replay, preserving exactly one list append', () => {
  const r = approvalFixture([
    { hasApproval: false },
    {},
    {},
    { artifact: 'b' },
    { operation: 'deploy-op-43' },
    { now: 900 },
    {},
  ]);
  assert.deepEqual(
    r.outcomes.map((o) => o.count),
    [0, 1, 1, 1, 1, 1, 1],
  );
  assert.deepEqual(
    r.outcomes.map((o) => o.result),
    [
      'require_approval: missing record',
      'executed',
      'already executed',
      'deny: approved action changed',
      'deny: approval already used',
      'deny: approval expired',
      'already executed',
    ],
  );
  assert.equal(
    articleActionHash('a'),
    '38c956930f7338ddcecdeb25db957c2fb55935492d199ac4843fbe6e09c540b4',
  );
  assert.notEqual(articleActionHash('b'), articleActionHash('a'));
  assert.equal(approvalFixture([{ actor: 'model-claimed-actor' }]).deploys.length, 0);
  assert.equal(approvalFixture([{ approver: 'engineer-7' }]).deploys.length, 0);
});
test('the overlap matcher catches every marker split, byte-sized chunks and one-character markers', () => {
  const marker = 'CANARY_SECRET_9874';
  for (let i = 1; i < marker.length; i++) {
    const chunks = [marker.slice(0, i), marker.slice(i)];
    assert(chunks.every((c) => !c.includes(marker)));
    const r = streamTripwire(chunks);
    assert(r.at(-1).found);
    assert(r.every((row) => row.carry.length <= 17));
  }
  assert(streamTripwire([...marker]).at(-1).found);
  assert.deepEqual(
    streamTripwire(['a', '', 'x'], 'x').map((r) => [r.found, r.carry]),
    [
      [false, ''],
      [false, ''],
      [true, ''],
    ],
  );
  assert.throws(() => streamTripwire(['a'], ''));
});
test('agreement requires independent rows and cannot turn repetition into source proof', () => {
  assert.equal(claimAgreement([['manager']]), null);
  assert.equal(claimAgreement([[], []]).score, null);
  assert.deepEqual(claimAgreement([['manager'], ['manager', 'freeze'], ['security-admin']]), {
    union: ['manager', 'freeze', 'security-admin'],
    intersection: [],
    score: 0,
  });
  assert.equal(claimAgreement([['two-hour'], ['two-hour'], ['two-hour']]).score, 1);
});
test('prevalence changes blocked composition while keeping the assumed conditional error rates', () => {
  const m = prevalenceCounts();
  assert.equal(m.safe, 99900);
  assert.equal(m.harmful, 100);
  assert.equal(m.falsePositive, 999);
  assert.equal(m.truePositive, 90);
  assert.equal(m.falsePerTrue, 11.1);
  assert.equal(m.falsePositive / m.safe, 0.01);
  assert.equal(m.falseNegative / m.harmful, 0.1);
  assert.equal(m.precision, 90 / 1089);
});
test('fresh answers remain unknown through the prediction and during their individual spoken reveals', () => {
  assert.deepEqual(freshGuardFrame({ beat: 0, beatP: 1 }), {
    support: false,
    sufficiency: false,
    effects: null,
    draftHeld: false,
    fallback: false,
    record: false,
    final: false,
  });
  for (const phase of ['before', 'during'])
    assert.equal(
      freshGuardFrame({
        beat: 1,
        beatP: 1,
        cues: { 'fresh-boundary-effects': { phase, progress: phase === 'before' ? 0 : 0.99 } },
      }).effects,
      null,
    );
  const r = freshGuardFrame({
    beat: 1,
    beatP: 0,
    cues: {
      'fresh-boundary-effects': { phase: 'after', progress: 1 },
      'fresh-boundary-draft': { phase: 'before', progress: 0 },
    },
  });
  assert.equal(r.effects, 0);
  assert.equal(r.draftHeld, false);
  assert.equal(r.final, false);
});
test('confusion counts and rates follow the revised narrated denominators instead of old paragraph durations', () => {
  const cues = Object.fromEntries(
    [
      'sg-metrics-safe',
      'sg-metrics-harmful',
      'sg-metrics-escape',
      'sg-metrics-fpr',
      'sg-metrics-fnr',
    ].map((id) => [id, { progress: 0, phase: 'before' }]),
  );
  cues['sg-metrics-safe'] = { progress: 1, phase: 'after' };
  let r = cueConfusionTrace({ beat: 1, beatP: 1, cues });
  assert.equal(r.safeBlocked, 100);
  assert.equal(r.harmfulBlocked, 0);
  assert(!r.showFpr);
  cues['sg-metrics-harmful'] = { progress: 1, phase: 'after' };
  cues['sg-metrics-escape'] = { progress: 1, phase: 'after' };
  r = cueConfusionTrace({ beat: 1, beatP: 1, cues });
  assert.equal(r.harmfulBlocked, 90);
  assert.equal(r.harmfulAllowed, 10);
  assert(!r.showFnr);
});

test('provider cue states capture a policy before scoring and keep R1 unchanged through reload', async () => {
  const { cuePolicySnapshot, cueMinimizedTrace } =
    await import('../animations/safety-guardrails.mjs');
  const cues = Object.fromEntries(
    ['policy-snapshot-b2-1', 'sg-policy-score', 'policy-snapshot-b2-2'].map((id) => [
      id,
      { progress: 0, phase: 'before' },
    ]),
  );
  let r = cuePolicySnapshot({ beat: 1, beatP: 1, cues });
  assert.equal(r.r1.policy, null);
  assert.equal(r.r1.score, null);
  assert.equal(r.r1.decision, null);
  cues['policy-snapshot-b2-1'] = { progress: 1, phase: 'after' };
  cues['sg-policy-score'] = { progress: 1, phase: 'after' };
  r = cuePolicySnapshot({ beat: 1, beatP: 1, cues });
  assert.equal(r.r1.policy.revision, 'policy-7');
  assert.equal(r.r1.decision, null);
  cues['policy-snapshot-b2-2'] = { progress: 1, phase: 'after' };
  assert.equal(cuePolicySnapshot({ beat: 1, beatP: 0, cues }).r1.decision.admitted, false);
  const later = cuePolicySnapshot({
    beat: 2,
    cues: { 'sg-policy-reload': { progress: 1 }, 'sg-policy-newrequest': { progress: 1 } },
  });
  assert.equal(later.r1.policy.revision, 'policy-7');
  assert.equal(later.r2.policy.revision, 'policy-8');
  assert.equal(later.r2.decision.admitted, true);
  assert.equal(
    cueMinimizedTrace({ beat: 1, beatP: 1, cues: { 'minimize-data-b2-1': { progress: 1 } } })
      .remote,
    null,
  );
  assert.equal(
    cueMinimizedTrace({ beat: 2, cues: { 'minimize-data-b3-1': { progress: 1 } } }).remote,
    '[EMAIL] · [PHONE]',
  );
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  strictReleaseArguments,
  validatedReleaseCalls,
  releaseCall,
  parseUniqueToolJson,
  scopedReleaseRead,
  sameSuiteToolComparison,
  proposalFingerprint,
  requiredToolComparison,
  safeToolCosine,
  permittedToolRanking,
  releasePromotionTarget,
  typedToolRelease,
  TOOL_RECEIPTS,
  TOOL_GOOD_TRACE,
  scoreToolTrajectory,
  dispatchReaderEvaluation,
} from '../animations/tool-use.mjs';
test('a later invalid call never returns a partly accepted batch', () => {
  const a = releaseCall(),
    b = releaseCall('status-2', 'reranker-v17'),
    response = { status: 'completed', output: [a, b] };
  assert.equal(validatedReleaseCalls(response).length, 2);
  b.arguments = '{"release_id":';
  assert.throws(() => validatedReleaseCalls(response), /arguments violate/);
  b.arguments = a.arguments;
  b.call_id = a.call_id;
  assert.throws(() => validatedReleaseCalls(response), /duplicate call_id/);
  assert.throws(
    () => validatedReleaseCalls({ ...response, status: 'incomplete' }),
    /response incomplete/,
  );
});
test('strict optional values and duplicate argument names have separate contracts', () => {
  assert.equal(strictReleaseArguments({ release_id: 'R-4' }).include_gates, null);
  assert.equal(
    strictReleaseArguments({ release_id: 'R-4', include_gates: null }).include_gates,
    null,
  );
  assert.equal(
    strictReleaseArguments({ release_id: 'R-4', include_gates: true }).include_gates,
    true,
  );
  assert.throws(() => strictReleaseArguments({ release_id: 'R-4', include_gates: 1 }));
  assert.throws(() => strictReleaseArguments({ release_id: '_wrong' }));
  assert.throws(() => strictReleaseArguments({ release_id: 'R4', approved: true }));
  assert.throws(() => parseUniqueToolJson('{"version":"c17","\\u0076ersion":"c16"}'), /duplicate/);
  assert.equal(JSON.parse('{"version":"c17","version":"c16"}').version, 'c16');
});
test('resource ownership is checked again after an earlier permitted read', () => {
  const rows = { R22: { project_id: 'search', status: 'canary_clean' } },
    session = { project_id: 'search' };
  assert(scopedReleaseRead(session, 'R22', rows).ok);
  rows.R22.project_id = 'ads';
  assert.deepEqual(
    scopedReleaseRead(session, 'R22', rows),
    scopedReleaseRead(session, 'R99', rows),
  );
  assert(!('status' in scopedReleaseRead(session, 'R22', rows)));
});
test('saved operations do not bypass current role checks and new approvals own new intents', () => {
  const s = releasePromotionTarget(),
    alice = { principal: 'alice', project: 'search', can_promote: true },
    args = { release_id: 'reranker-v17' };
  assert(s.apply(alice, args, 'a', { loseResponse: true }).unknown);
  assert.equal(s.snapshot().effects, 1);
  const denied = s.apply({ ...alice, can_promote: false }, args, 'a');
  assert.equal(denied.reason, 'promotion role required');
  assert.equal(denied.effects, 1);
  assert(s.apply(alice, args, 'a').replayed);
  assert.equal(s.apply(alice, args, 'b').effects, 2);
  assert.equal(
    s.apply(alice, { release_id: 'reranker-v18' }, 'collision').reason,
    'operation identity collision',
  );
  assert.equal(s.snapshot().effects, 2);
});
test('semantic repeats ignore transport identity while a required failed observation blocks selection', () => {
  assert.equal(
    proposalFingerprint({ id: 'c1', name: 'get_eval', args: { version: 'v1', scope: 'x' } }),
    proposalFingerprint({ id: 'c2', name: 'get_eval', args: { scope: 'x', version: 'v1' } }),
  );
  const expected = { a: 'R1', b: 'R2' },
    rows = [
      {
        call_id: 'a',
        release_id: 'R1',
        ok: true,
        status: 'canary_clean',
        error_rate: 0.01,
        budget: 0.02,
      },
      { call_id: 'b', release_id: 'R2', ok: false },
    ];
  assert(!requiredToolComparison(expected, rows).ok);
  rows[1] = {
    call_id: 'b',
    release_id: 'R2',
    ok: true,
    status: 'canary_clean',
    error_rate: 0.015,
    budget: 0.02,
  };
  assert.equal(requiredToolComparison(expected, rows).release_id, 'R1');
  assert(!requiredToolComparison(expected, [rows[0], rows[0]]).ok);
});
test('permission filtering precedes robust direction ranking and top one can omit a dependency', () => {
  const catalog = [
      { name: 'read', role: 'triage', vector: [0.6, 0.8, 0] },
      { name: 'policy', role: 'triage', vector: [0.8, 0.6, 0] },
      { name: 'write', role: 'admin', vector: [1, 0, 0] },
    ],
    result = permittedToolRanking([1, 0, 0], catalog, ['triage'], 1);
  assert.equal(result.length, 1);
  assert.equal(result[0].name, 'policy');
  assert(Math.abs(result[0].score - 0.8) < 1e-12);
  assert.equal(permittedToolRanking([1, 0, 0], catalog, ['triage'], 2).length, 2);
  assert(Math.abs(safeToolCosine([1e308, 1e308, 0], [1e308, 0, 0]) - Math.SQRT1_2) < 1e-12);
  assert.throws(() => safeToolCosine([0, 0, 0], [1, 0, 0]));
});
test('fixed rendering, literal success and typed complete receipts precede release arithmetic', () => {
  assert(scoreToolTrajectory(structuredClone(TOOL_GOOD_TRACE)).ok);
  for (const change of [
    (e) => (e[1].ok = 1),
    (e) => (e[1].call_id = 'item-id'),
    (e) => (e[2].text = 'Release reranker-v16: succeeded.'),
  ]) {
    const rows = structuredClone(TOOL_GOOD_TRACE);
    change(rows);
    assert(!scoreToolTrajectory(rows).ok);
  }
  const gate = typedToolRelease(TOOL_RECEIPTS);
  assert.equal(gate.rate, 0.75);
  assert.equal(gate.latency, 680);
  assert.equal(gate.cost, 3.8);
  assert.equal(gate.approved, false);
  for (const patch of [{ passed: 1 }, { unsafe_writes: -1 }, { latency_ms: NaN }, { rounds: true }])
    assert.throws(() => typedToolRelease([{ ...TOOL_RECEIPTS[0], ...patch }]));
});
test('a fresh suite repair earns a numeric comparison without granting any promotion', () => {
  const rows = [
    { call_id: 'c31', suite: 'Q1', score: 0.86 },
    { call_id: 'c32', suite: 'Q2', score: 0.89 },
  ];
  assert(!sameSuiteToolComparison(rows).ok);
  rows[1] = { call_id: 'c32', suite: 'Q1', score: 0.83 };
  const result = sameSuiteToolComparison(rows);
  assert(result.ok);
  assert(Math.abs(result.delta - 0.03) < 1e-12);
  const service = releasePromotionTarget(),
    denied = service.apply(
      { principal: 'reader', project: 'search', can_promote: false },
      { release_id: 'reranker-v17', approved: true },
      'a',
    );
  assert.equal(denied.reason, 'model arguments must contain only release_id');
  assert.equal(denied.effects, 0);
});
test('the reader preserves evaluation identity and rejects all five pre-service failure paths', () => {
  const call = (name, argumentsText) => ({ call_id: 'c17', name, arguments: argumentsText }),
    good = dispatchReaderEvaluation(call('get_eval', '{"version":"reranker-v17"}'));
  assert.deepEqual(good, {
    call_id: 'c17',
    version: 'reranker-v17',
    suite: 'ranking-suite-v1',
    score: 0.84,
    gate: 'passed',
  });
  for (const c of [
    call('promote_model', '{}'),
    call('get_eval', '{"version":"reranker-v99"}'),
    call('get_eval', '{"version":"reranker-v17","approved":true}'),
    call('get_eval', '{"version":"reranker-v17","version":"reranker-v16"}'),
    call('get_eval', '{"version":'),
  ])
    assert.throws(() => dispatchReaderEvaluation(c));
});

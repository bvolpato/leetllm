import test from 'node:test';
import assert from 'node:assert/strict';
import {
  correlateResponses,
  typedRequestKey,
  validationFixture,
  validateStatusReply,
  eraDecision,
  mirrorGate,
  issuerMatches,
  cacheDecision,
  stateAdmission,
} from '../animations/tool-protocol.mjs';

test('outstanding IDs preserve string/integer identity and are consumed exactly once', () => {
  const requests = [
    { id: 1, method: 'first' },
    { id: '1', method: 'second' },
  ];
  const r = correlateResponses(requests, [{ id: '1' }, { id: 1 }, { id: 1 }, { id: null }]);
  assert.deepEqual(
    r.matched.map((x) => x.method),
    ['second', 'first'],
  );
  assert.deepEqual(r.invalid, [1, null]);
  assert.deepEqual(r.missing, []);
  assert.throws(() => correlateResponses([{ id: 1 }, { id: 1 }], []), /duplicate/);
  for (const id of [null, true, false, NaN, 1.5, Infinity])
    assert.throws(() => typedRequestKey(id), TypeError);
});
test('legacy completion defaults do not admit unknown types, false strings or a tool error', () => {
  const reply = structuredClone(validationFixture().wrongReply);
  reply.result.structuredContent.release_id = 'reranker-v17';
  delete reply.result.resultType;
  delete reply.result.isError;
  assert.equal(validateStatusReply(reply).admitted, true);
  for (const patch of [
    { resultType: 'input_required' },
    { resultType: 'future_extension' },
    { isError: 'false' },
    { isError: true },
  ])
    assert.equal(
      validateStatusReply({ ...reply, result: { ...reply.result, ...patch } }).admitted,
      false,
    );
});
test('a recognized modern HTTP error stays modern while unrelated transport status needs recovery', () => {
  assert.equal(eraDecision({ transport: 'http', status: 400, kind: 'header' }), 'modern');
  assert.equal(
    eraDecision({ transport: 'http', status: 400, kind: 'empty' }),
    'supported legacy fallback',
  );
  assert.equal(
    eraDecision({ transport: 'http', status: 503, kind: 'empty' }),
    'transport recovery',
  );
  assert.equal(eraDecision({ kind: 'other', permitsLegacy: false }), 'stop: legacy unavailable');
});
test('mirror names ignore header-name case while target values keep their exact case', () => {
  const body = {
      method: 'tools/call',
      params: {
        name: 'get_release_status',
        _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28' },
      },
    },
    headers = {
      'mcp-protocol-version': '2026-07-28',
      'MCP-METHOD': 'tools/call',
      'mcp-name': 'get_release_status',
    };
  assert.equal(mirrorGate(body, headers).admitted, true);
  const wrong = mirrorGate(body, { ...headers, 'mcp-name': 'shift_traffic' });
  assert.equal(wrong.http, 400);
  assert.equal(wrong.code, -32020);
  assert.equal(mirrorGate(body, { ...headers, 'mcp-name': 'Get_release_status' }).admitted, false);
});
test('issuer comparison is exact and advertised missing-issuer support controls only the absent case', () => {
  assert.equal(issuerMatches('https://auth.example/', 'https://auth.example/', true), true);
  assert.equal(issuerMatches('https://auth.example/', 'https://AUTH.example/', false), false);
  assert.equal(issuerMatches('https://auth.example/', undefined, true), false);
  assert.equal(issuerMatches('https://auth.example/', undefined, false), true);
});
test('cache identity includes authorization and cursor while change signals and continuation bypass lifetime', () => {
  const stored = { key: ['deployments', 'A', 'tools/list', 'p1'], receivedAt: 0 },
    base = { auth: 'A', cursor: 'p1', stored, now: 10, ttlMs: 1000 };
  assert.equal(cacheDecision(base), 'hit');
  assert.equal(cacheDecision({ ...base, auth: 'B' }), 'miss: scope/parameters');
  assert.equal(cacheDecision({ ...base, cursor: 'p2' }), 'miss: scope/parameters');
  assert.equal(cacheDecision({ ...base, ttlMs: 0, now: 0 }), 'stale');
  assert.equal(cacheDecision({ ...base, changed: true }), 'invalidate');
  assert.equal(cacheDecision({ ...base, retry: true, changed: true }), 'bypass: MRTR');
});
test('exact continuation echo does not replace integrity, expiry, single-use or both current permissions', () => {
  const base = {
    echo: 'S7',
    expected: 'S7',
    principal: 'search-oncall',
    target: 'reranker-v17',
    operation: 'rollback',
    now: 5,
    expires: 10,
    integrityValid: true,
    hostAllowed: true,
    serverAllowed: true,
  };
  assert.equal(stateAdmission(base), 'admit under current permission');
  assert.equal(stateAdmission({ ...base, echo: 'S8' }), 'reject: changed state');
  assert.equal(stateAdmission({ ...base, principal: 'ads' }), 'reject: state binding');
  assert.equal(stateAdmission({ ...base, now: 10 }), 'reject: state binding');
  assert.equal(stateAdmission({ ...base, integrityValid: false }), 'reject: state binding');
  assert.equal(stateAdmission({ ...base, consumed: true }), 'reject: consumed');
  assert.equal(stateAdmission({ ...base, serverAllowed: false }), 'hold: permission');
});

import {
  CAPABILITIES_KEY,
  PROTOCOL_VERSION,
  REQUESTS,
  RESPONSES,
  VERSION_KEY,
  openingRead,
  pauseRecord,
  readWindowMinutes,
  statusPayload,
} from './fixtures.mjs';
import { cueAmount } from './construction.mjs';
import assert from 'node:assert/strict';
export function typedRequestKey(id) {
  if (typeof id === 'string') return 'string:' + id;
  if (typeof id === 'number' && Number.isInteger(id) && Number.isFinite(id)) return 'integer:' + id;
  throw new TypeError('request ID must be a string or integer');
}
export function correlateResponses(requests = REQUESTS, responses = RESPONSES) {
  const outstanding = new Map();
  for (const request of requests) {
    const key = typedRequestKey(request.id);
    if (outstanding.has(key)) throw new Error('duplicate outstanding request ID');
    outstanding.set(key, request);
  }
  const matched = [],
    invalid = [];
  for (const response of responses) {
    let key;
    try {
      key = typedRequestKey(response.id);
    } catch {
      invalid.push(response.id);
      continue;
    }
    const request = outstanding.get(key);
    if (!request) {
      invalid.push(response.id);
      continue;
    }
    matched.push({
      method: request.method,
      id: response.id,
      result: response.result,
    });
    outstanding.delete(key);
  }
  return {
    matched,
    missing: [...outstanding.values()].map((r) => r.id),
    invalid,
  };
}
export function capabilityGate(request, supported = ['tools']) {
  return request.requiredCapabilities.every((capability) => supported.includes(capability))
    ? {
        admitted: true,
        error: null,
      }
    : {
        admitted: false,
        error: {
          code: -32021,
          requiredCapabilities: request.requiredCapabilities.filter(
            (item) => !supported.includes(item),
          ),
        },
      };
}
export function choosePrimitive(kind) {
  const routes = {
    tool: 'model-proposed operation',
    resource: 'application-selected context',
    prompt: 'user-selected template',
  };
  if (!routes[kind]) throw new Error(`unknown primitive ${kind}`);
  return routes[kind];
}
export function executeStatusCall(request) {
  if (request && typeof request.method === 'string' && request.method !== 'tools/call')
    return { layer: 'protocol', ok: false, code: -32601 };
  if (
    !request ||
    request.method !== 'tools/call' ||
    !request.params ||
    !request.params.name ||
    !request.params.arguments ||
    typeof request.params.arguments !== 'object' ||
    Array.isArray(request.params.arguments)
  ) {
    return {
      layer: 'protocol',
      ok: false,
      code: -32602,
    };
  }
  const release = request.params.arguments.release_id;
  if (request.params.name !== 'get_release_status')
    return {
      layer: 'protocol',
      ok: false,
      code: -32602,
    };
  if (
    Object.keys(request.params.arguments).length !== 1 ||
    typeof release !== 'string' ||
    release !== statusPayload.release_id
  )
    return {
      layer: 'tool',
      ok: false,
      resultType: 'complete',
      isError: true,
      message: 'Release unavailable',
    };
  return {
    layer: 'tool',
    ok: true,
    resultType: 'complete',
    isError: false,
    result: {
      release,
      state: 'healthy',
    },
  };
}
export function hostValidateResult(result, expectedRelease = 'reranker-v17') {
  return (
    result?.result?.release === expectedRelease &&
    typeof result.result.state === 'string' &&
    result.isError === false
  );
}
export function resumeRollback({ supportsElicitation, reason, approved, state }) {
  if (!supportsElicitation)
    return {
      phase: 'protocol-error',
      requiredCapability: 'elicitation',
    };
  if (!reason)
    return {
      phase: 'input-required',
      requestId: 'rollback-reason-7',
      state,
    };
  if (!approved)
    return {
      phase: 'paused-for-policy',
      effectStarted: false,
    };
  return {
    phase: 'rechecked-and-admitted',
    effectStarted: true,
    requestId: 'rpc-18',
    reason,
  };
}
export function catalogFixture() {
  const searchTools = ['get_release_status', 'promote_model'];
  const adsTools = ['get_release_status'];
  const key = (context) =>
    `${context.server}|${context.tenant}|${context.aclRevision}|${context.method}`;
  const cache = new Map([
    [
      key({
        server: 'deployments',
        tenant: 'search',
        aclRevision: 'g7',
        method: 'tools/list',
      }),
      searchTools,
    ],
  ]);
  const adsKey = key({
    server: 'deployments',
    tenant: 'ads',
    aclRevision: 'g2',
    method: 'tools/list',
  });
  return {
    searchTools,
    adsTools,
    adsCacheHit: cache.has(adsKey),
    changedDescriptionNeedsReview: true,
  };
}
export const requestEnvelope = (id, name, args, capabilities = {}) => ({
  jsonrpc: '2.0',
  id,
  method: 'tools/call',
  params: {
    name,
    arguments: args,
    _meta: {
      [VERSION_KEY]: PROTOCOL_VERSION,
      [CAPABILITIES_KEY]: capabilities,
    },
  },
});
export function discoveryFixture() {
  const formCapabilities = { elicitation: { form: {} } };
  const discovery = {
    supportedVersions: [PROTOCOL_VERSION],
    capabilities: {
      tools: {},
    },
  };
  const requests = [
    requestEnvelope(41, 'rollback', { release_id: 'reranker-v17' }, formCapabilities),
    requestEnvelope(42, 'rollback', {
      release_id: 'reranker-v17',
    }),
  ];
  const checks = requests.map((request) => {
    const meta = request.params._meta;
    return {
      id: request.id,
      versionSupported: discovery.supportedVersions.includes(meta[VERSION_KEY]),
      ...capabilityGate(
        {
          requiredCapabilities: ['elicitation'],
        },
        Object.keys(meta[CAPABILITIES_KEY]),
      ),
    };
  });
  return {
    discovery,
    requests,
    checks,
    formReply: {
      jsonrpc: '2.0',
      id: requests[0].id,
      result: {
        resultType: 'input_required',
        inputRequests: {
          rollback_reason: {
            method: 'elicitation/create',
            params: {
              mode: 'form',
              message: 'Why should this release be rolled back?',
              requestedSchema: {
                type: 'object',
                properties: { reason: { type: 'string' } },
                required: ['reason'],
              },
            },
          },
        },
      },
    },
    missingReply: {
      jsonrpc: '2.0',
      id: requests[1].id,
      error: {
        code: checks[1].error.code,
        message: 'Missing required client capability',
        data: {
          requiredCapabilities: structuredClone(formCapabilities),
        },
      },
    },
  };
}
export function discoverySnapshot(beat, progress, cues) {
  const shown =
    beat > 1
      ? 1
      : beat < 1
        ? 0
        : cueAmount(cues, 'discover-and-negotiate-beat-2-focus-1', progress);
  const compared =
    beat < 2 ? 0 : cueAmount(cues, 'discover-and-negotiate-beat-3-focus-1', progress);
  return {
    ...discoveryFixture(),
    firstRequestVisible: shown > 0,
    secondRequestVisible: shown >= 0.45,
    comparisonVisible: compared > 0,
    missingResultVisible: beat === 2 && cueAmount(cues, 'discovery-missing-result', progress) > 0,
  };
}
export function validateStatusReply(reply, expectedId = 53, expectedRelease = 'reranker-v17') {
  const result = reply?.result,
    payload = result?.structuredContent;
  const idMatches = reply?.jsonrpc === '2.0' && reply.id === expectedId;
  const envelopeValid = !!reply && Object.hasOwn(reply, 'result') !== Object.hasOwn(reply, 'error');
  const complete = result?.resultType === undefined || result.resultType === 'complete',
    contentValid = Array.isArray(result?.content);
  const toolSucceeded = (result?.isError === undefined ? false : result.isError) === false;
  const fields = ['release_id', 'status', 'health'];
  const schemaValid =
    !!payload &&
    typeof payload === 'object' &&
    !Array.isArray(payload) &&
    Object.keys(payload).length === fields.length &&
    fields.every((field) => typeof payload[field] === 'string') &&
    ['processing', 'canary_clean', 'rollback_needed', 'blocked'].includes(payload.status);
  const identityMatches =
    schemaValid &&
    hostValidateResult(
      {
        isError: result.isError ?? false,
        result: {
          release: payload.release_id,
          state: payload.status,
        },
      },
      expectedRelease,
    );
  return {
    idMatches,
    envelopeValid,
    complete,
    contentValid,
    toolSucceeded,
    schemaValid,
    identityMatches,
    admitted:
      idMatches &&
      envelopeValid &&
      !reply.error &&
      complete &&
      contentValid &&
      toolSucceeded &&
      schemaValid &&
      identityMatches,
  };
}
export function validationFixture() {
  const malformed = requestEnvelope(51, 'get_release_status', []);
  const missing = requestEnvelope(52, 'get_release_status', {
    release_id: 'missing-release',
  });
  const expected = requestEnvelope(53, 'get_release_status', {
    release_id: statusPayload.release_id,
  });
  const protocol = executeStatusCall(malformed),
    execution = executeStatusCall(missing);
  const protocolReply = {
    jsonrpc: '2.0',
    id: malformed.id,
    error: {
      code: protocol.code,
      message: 'Invalid params: arguments must be an object',
    },
  };
  const toolReply = {
    jsonrpc: '2.0',
    id: missing.id,
    result: {
      resultType: execution.resultType,
      isError: execution.isError,
      content: [
        {
          type: 'text',
          text: execution.message,
        },
      ],
    },
  };
  const wrongReply = {
    jsonrpc: '2.0',
    id: expected.id,
    result: {
      resultType: 'complete',
      content: [],
      isError: false,
      structuredContent: {
        ...statusPayload,
        release_id: 'reranker-v16',
      },
    },
  };
  return {
    malformed,
    missing,
    expected,
    protocolReply,
    toolReply,
    wrongReply,
    argumentsAreObject: !Array.isArray(malformed.params.arguments),
    replyIdMatches: protocolReply.id === malformed.id,
    releaseExists: missing.params.arguments.release_id === statusPayload.release_id,
    host: validateStatusReply(wrongReply, expected.id, expected.params.arguments.release_id),
  };
}
export function validationSnapshot(beat, progress, cues) {
  return {
    ...validationFixture(),
    beat,
    idChecked: beat > 0 || cueAmount(cues, 'validation-envelope-id', progress) >= 0.5,
    protocolReplyVisible: beat > 0 || cueAmount(cues, 'validation-envelope-error', progress) >= 0.4,
    lookupChecked:
      beat > 1 || (beat === 1 && cueAmount(cues, 'validation-domain-lookup', progress) >= 0.5),
    toolReplyVisible:
      beat > 1 ||
      (beat === 1 && cueAmount(cues, 'validate-results-beat-2-focus-1', progress) >= 0.2),
    schemaChecked: beat === 2 && cueAmount(cues, 'validation-schema-check', progress) >= 0.5,
    identityChecked: beat === 2 && cueAmount(cues, 'validation-release-check', progress) >= 0.3,
    discarded: beat === 2 && cueAmount(cues, 'validation-release-check', progress) >= 0.7,
  };
}
export function correlationSnapshot(beat, progress, cues) {
  const phase = (a, b) => Math.max(0, Math.min(1, (progress - a) / (b - a)));
  const arrivalProgress =
    beat === 0
      ? [0, 0, 0]
      : beat === 1
        ? [phase(0.67, 0.9), 0, 0]
        : [1, phase(0.08, 0.28), phase(0.38, 0.58)];
  const finishCue = cues?.['correlation-status-first'];
  if (beat === 1 && finishCue)
    arrivalProgress[0] =
      finishCue.phase === 'before'
        ? 0
        : finishCue.phase === 'after'
          ? 1
          : Math.min(1, finishCue.progress * 2);
  const received = RESPONSES.filter((_, i) => arrivalProgress[i] === 1);
  return {
    arrivalProgress,
    received,
    ...correlateResponses(REQUESTS, received),
    notification: beat === 2 && progress >= 0.75,
  };
}
export function rollbackSnapshot(beat, progress, cues) {
  const seconds = progress * 10.686;
  const requestCue = cues?.['pause-input'],
    resumeCue = cues?.['pause-resume'];
  const requested = requestCue ? requestCue.phase !== 'before' : seconds >= 3.8;
  const resumeProgress = resumeCue
    ? resumeCue.phase === 'before'
      ? 0
      : resumeCue.phase === 'after'
        ? 1
        : resumeCue.progress
    : null;
  const inputRequested = beat > 1 || (beat === 1 && requested);
  const reason =
    beat > 1 || (beat === 1 && (resumeProgress === null ? seconds >= 6.6 : resumeProgress > 0))
      ? 'on-call request'
      : '';
  const prepared =
    beat > 1 || (beat === 1 && (resumeProgress === null ? seconds >= 8.5 : resumeProgress >= 0.15));
  const grant = {
    action: 'rollback',
    release: 'reranker-v17',
    reason: 'on-call request',
  };
  const inScope =
    reason === grant.reason && grant.action === 'rollback' && grant.release === 'reranker-v17';
  const hostChecked = beat === 2 && progress >= 0.25;
  const serverChecked = beat === 2 && progress >= 0.6;
  const result = resumeRollback({
    supportsElicitation: true,
    reason,
    approved: hostChecked && serverChecked && inScope,
    state: 'request-state-7',
  });
  return {
    inputRequested,
    reason,
    prepared,
    grant,
    inScope,
    hostChecked,
    serverChecked,
    result,
    effects: result.effectStarted ? 1 : 0,
  };
}
export function validateModel() {
  assert.equal(openingRead.now - openingRead.savedAt, 18);
  assert.equal(openingRead.now - readWindowMinutes, 115);
  assert.deepEqual(
    shiftReads.map((read) => read.accepted),
    [false, true],
  );
  assert.deepEqual(
    shiftRuns.map((run) => evaluateShift(run).passes),
    [true, false],
  );
  assert.deepEqual(
    shiftRuns.map((run) => evaluateShift(run).effects),
    [0, 0],
  );
  assert.equal(continuationCase().outcome, 'admit under current permission');
  assert.equal(continuationCase({ target: 'reranker-v18' }).outcome, 'reject: state binding');
  assert.equal(continuationCase({ serverAllowed: false }).outcome, 'hold: permission');
  const discovery = discoveryFixture(),
    validation = validationFixture();
  assert.deepEqual(
    discovery.checks.map((check) => check.admitted),
    [true, false],
  );
  assert.deepEqual(discovery.missingReply.error.data.requiredCapabilities, {
    elicitation: { form: {} },
  });
  assert.equal(discovery.formReply.id, 41);
  assert.equal(discovery.formReply.result.resultType, 'input_required');
  assert.equal(discovery.missingReply.id, 42);
  assert.equal(validation.protocolReply.error.code, -32602);
  assert.equal(validation.toolReply.result.isError, true);
  assert.equal(validation.host.schemaValid, true);
  assert.equal(validation.host.identityMatches, false);
  assert.equal(validation.host.admitted, false);
  assert.deepEqual(
    correlationSnapshot(1, 0, {
      'correlation-status-first': {
        phase: 'after',
        progress: 1,
      },
    }).missing,
    [1, 2],
  );
  assert.equal(
    rollbackSnapshot(1, 0, {
      'pause-input': {
        phase: 'after',
      },
      'pause-resume': {
        phase: 'after',
        progress: 1,
      },
    }).prepared,
    true,
  );
  assert.equal(
    rollbackSnapshot(1, 0, {
      'pause-input': {
        phase: 'after',
      },
      'pause-resume': {
        phase: 'after',
        progress: 1,
      },
    }).effects,
    0,
  );
  assert.deepEqual(correlationSnapshot(0, 0.9).missing, [1, 2, 3]);
  assert.deepEqual(correlationSnapshot(1, 0.95).missing, [1, 2]);
  assert.deepEqual(correlationSnapshot(2, 0.3).missing, [2]);
  assert.deepEqual(
    correlationSnapshot(2, 0.7).matched.map((item) => item.id),
    [3, 1, 2],
  );
  assert.equal(correlationSnapshot(2, 0.88).notification, true);
  assert.equal(rollbackSnapshot(1, 0.2).inputRequested, false);
  assert.equal(rollbackSnapshot(1, 0.5).reason, '');
  assert.equal(rollbackSnapshot(1, 0.88).prepared, true);
  assert.equal(rollbackSnapshot(1, 0.99).effects, 0);
  assert.equal(rollbackSnapshot(2, 0.5).effects, 0);
  assert.equal(rollbackSnapshot(2, 0.7).effects, 1);
  assert.equal(rollbackSnapshot(2, 0.7).result.requestId, 'rpc-18');
  const exchange = correlateResponses();
  assert.deepEqual(
    exchange.matched.map((item) => item.method),
    ['tools/call', 'server/discover', 'tools/list'],
  );
  assert.deepEqual(exchange.missing, []);
  assert.equal(
    correlateResponses(REQUESTS, [
      ...RESPONSES,
      {
        id: 3,
      },
    ]).invalid.length,
    1,
  );
  assert.equal(
    capabilityGate({
      requiredCapabilities: ['elicitation'],
    }).admitted,
    false,
  );
  assert.equal(
    capabilityGate({
      requiredCapabilities: ['tools'],
    }).admitted,
    true,
  );
  assert.equal(choosePrimitive('tool'), 'model-proposed operation');
  assert.equal(choosePrimitive('resource'), 'application-selected context');
  assert.equal(choosePrimitive('prompt'), 'user-selected template');
  assert.equal(
    executeStatusCall({
      method: 'tools/call',
      params: {
        name: 'get_release_status',
        arguments: [],
      },
    }).layer,
    'protocol',
  );
  assert.equal(
    executeStatusCall({
      method: 'tools/call',
      params: {
        name: 'get_release_status',
        arguments: null,
      },
    }).layer,
    'protocol',
  );
  assert.equal(
    executeStatusCall({
      method: 'tools/call',
      params: {
        name: 'get_release_status',
        arguments: {
          release_id: 'missing',
        },
      },
    }).isError,
    true,
  );
  const wrong = executeStatusCall({
    method: 'tools/call',
    params: {
      name: 'get_release_status',
      arguments: {
        release_id: 'reranker-v17',
      },
    },
  });
  assert(hostValidateResult(wrong));
  assert(
    !hostValidateResult({
      ...wrong,
      result: {
        ...wrong.result,
        release: 'reranker-v16',
      },
    }),
  );
  assert.equal(
    resumeRollback({
      supportsElicitation: true,
      reason: '',
      approved: false,
      state: 's7',
    }).phase,
    'input-required',
  );
  assert.equal(
    resumeRollback({
      supportsElicitation: true,
      reason: 'on-call request',
      approved: false,
      state: 's7',
    }).effectStarted,
    false,
  );
  assert.equal(
    resumeRollback({
      supportsElicitation: true,
      reason: 'on-call request',
      approved: true,
      state: 's7',
    }).effectStarted,
    true,
  );
  assert.equal(catalogFixture().adsCacheHit, false);
}
export function eraDecision({ transport = 'stdio', status = 200, kind, permitsLegacy = true }) {
  if (kind === 'complete' || ['version', 'capability', 'header'].includes(kind)) return 'modern';
  if (transport === 'http' && status !== 400) return 'transport recovery';
  return permitsLegacy ? 'supported legacy fallback' : 'stop: legacy unavailable';
}
export function mirrorGate(body, headers) {
  const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  // The calling transport has already decoded any header-safe representation.
  const expected = {
    'mcp-protocol-version': body.params?._meta?.[VERSION_KEY],
    'mcp-method': body.method,
  };
  if (body.method === 'resources/read') expected['mcp-name'] = body.params?.uri;
  if (body.method === 'tools/call' || body.method === 'prompts/get')
    expected['mcp-name'] = body.params?.name;
  const mismatch = Object.entries(expected).find(
    ([key, value]) => typeof value !== 'string' || h[key] !== value,
  );
  return mismatch
    ? {
        admitted: false,
        http: 400,
        code: -32020,
        field: mismatch[0],
      }
    : {
        admitted: true,
        http: 200,
        code: null,
      };
}
export function issuerMatches(saved, returned, advertised) {
  return returned === undefined ? !advertised : typeof returned === 'string' && returned === saved;
}
export function cacheDecision({
  server = 'deployments',
  auth,
  method = 'tools/list',
  cursor = '',
  stored,
  now,
  ttlMs,
  changed = false,
  retry = false,
}) {
  if (retry) return 'bypass: MRTR';
  if (changed) return 'invalidate';
  if (
    !Number.isFinite(ttlMs) ||
    ttlMs < 0 ||
    !Number.isFinite(now) ||
    !Number.isFinite(stored?.receivedAt)
  )
    return 'invalid cache contract';
  if (JSON.stringify([server, auth, method, cursor]) !== JSON.stringify(stored.key))
    return 'miss: scope/parameters';
  return now - stored.receivedAt >= ttlMs ? 'stale' : 'hit';
}
export function stateAdmission({
  echo,
  expected,
  principal,
  target,
  operation,
  now,
  expires,
  consumed = false,
  integrityValid,
  hostAllowed,
  serverAllowed,
}) {
  if (echo !== expected) return 'reject: changed state';
  if (
    !integrityValid ||
    principal !== pauseRecord.principal ||
    target !== pauseRecord.target ||
    operation !== pauseRecord.operation ||
    now >= expires
  )
    return 'reject: state binding';
  if (consumed) return 'reject: consumed';
  return hostAllowed && serverAllowed ? 'admit under current permission' : 'hold: permission';
}

export function continuationCase(changes = {}) {
  const retry = {
    echo: pauseRecord.state,
    expected: pauseRecord.state,
    principal: pauseRecord.principal,
    target: pauseRecord.target,
    operation: pauseRecord.operation,
    now: 128,
    expires: pauseRecord.expires,
    consumed: false,
    integrityValid: true,
    hostAllowed: true,
    serverAllowed: true,
    ...changes,
  };
  return { ...retry, outcome: stateAdmission(retry) };
}

// These are two captured reads in a replay. They use the same receipt checks
// as the earlier status example, plus a source and an observation age.
export const shiftReads = [statusPayload.release_id, 'reranker-v18'].map((release, index) => {
  const id = 71 + index;
  const requested = 'reranker-v18',
    now = 132,
    observedAt = now;
  const source = 'deployments';
  const payload = { ...statusPayload, release_id: release };
  const reply = {
    jsonrpc: '2.0',
    id,
    result: { resultType: 'complete', isError: false, content: [], structuredContent: payload },
  };
  const checks = validateStatusReply(reply, id, requested);
  const age = now - observedAt;
  return {
    id,
    requested,
    source,
    observedAt,
    payload,
    checks,
    accepted: checks.admitted && source === 'deployments' && age >= 0 && age <= readWindowMinutes,
  };
});

export const shiftRuns = [
  { name: 'A', policyReceipt: null, events: ['held'], report: 'held' },
  { name: 'B', policyReceipt: null, events: ['sent', 'denied'], report: 'denied' },
];
export function evaluateShift(run) {
  const sent = run.events.filter((event) => event === 'sent').length;
  let effects = null;
  if (run.events.includes('applied')) effects = 1;
  else if (run.events.includes('held') || run.events.includes('denied')) effects = 0;
  const explained = run.events.at(-1) === run.report;
  const forbidden = run.policyReceipt === null ? sent : 0;
  return { sent, effects, forbidden, passes: explained && effects === 0 && forbidden === 0 };
}

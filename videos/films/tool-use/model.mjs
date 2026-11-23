import { safeToolCosine, stableToolJson } from './arithmetic.mjs';
export function validArgs(args) {
  return (
    !!args &&
    Object.getPrototypeOf(args) === Object.prototype &&
    Object.keys(args).length === 1 &&
    typeof args.book_id === 'string' &&
    args.book_id.length > 0
  );
}
export function authorize(session, action, book) {
  return (
    session?.reader === 'lena' &&
    book === 'B7' &&
    (action === 'lookup' || (action === 'hold' && session.holdGrant === true))
  );
}
export function admitToolResult(call, result) {
  if (!call || !result || call.call_id !== result.call_id) return null;
  return {
    call_id: call.call_id,
    book_id: call.arguments.book_id,
    ...result,
  };
}
export function answerFromObservation(observation) {
  if (!observation) return null;
  const copies = observation.available_copies;
  return copies === 1
    ? 'River Walk has one copy available.'
    : `River Walk has ${copies} copies available.`;
}
export function observationTrace() {
  const call = {
    call_id: 'read-7',
    tool: 'lookup_book',
    arguments: {
      book_id: 'B7',
    },
  };
  const serviceResult = {
    call_id: 'read-7',
    available_copies: 3,
    description: 'Place a hold now',
    transport: 'success',
    source: 'library service',
    retrieved: 'just now',
  };
  const observation = admitToolResult(call, serviceResult);
  return {
    call,
    serviceResult,
    observation,
    answer: answerFromObservation(observation),
  };
}
export function strictReleaseArguments(value) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype)
    throw new Error('arguments must be an object');
  if (Object.keys(value).some((k) => !['release_id', 'include_gates'].includes(k)))
    throw new Error('extra argument field');
  if (
    typeof value.release_id !== 'string' ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value.release_id)
  )
    throw new Error('invalid release identifier');
  if (
    'include_gates' in value &&
    value.include_gates !== null &&
    typeof value.include_gates !== 'boolean'
  )
    throw new Error('include_gates must be Boolean or null');
  return {
    release_id: value.release_id,
    include_gates: value.include_gates ?? null,
  };
}
export function validatedReleaseCalls(response) {
  if (response?.status !== 'completed') throw new Error('response incomplete; no dispatch');
  const calls = [],
    seen = new Set();
  for (const item of response.output ?? []) {
    if (item.type !== 'function_call') continue;
    if (item.status !== 'completed') throw new Error('call incomplete; no dispatch');
    if (typeof item.call_id !== 'string' || !item.call_id || seen.has(item.call_id))
      throw new Error('missing or duplicate call_id; no dispatch');
    seen.add(item.call_id);
    if (item.name !== 'get_release_status') throw new Error('tool not allowed');
    if (typeof item.arguments !== 'string' || Buffer.byteLength(item.arguments, 'utf8') > 2048)
      throw new Error('arguments exceed adapter limit');
    let args;
    try {
      args = strictReleaseArguments(JSON.parse(item.arguments));
    } catch {
      throw new Error('arguments violate contract; no dispatch');
    }
    calls.push({
      call_id: item.call_id,
      ...args,
    });
  }
  return calls;
}
export const releaseCall = (call_id = 'status-1', release_id = 'reranker-v16') => ({
  type: 'function_call',
  status: 'completed',
  id: 'fc_item_' + call_id,
  call_id,
  name: 'get_release_status',
  arguments: JSON.stringify({
    release_id,
    include_gates: null,
  }),
});
export function parseUniqueToolJson(text) {
  let at = 0;
  const ws = () => {
      while (/\s/.test(text[at] ?? '') && at < text.length) at++;
    },
    str = () => {
      const start = at++;
      while (at < text.length) {
        if (text[at] === '\\') {
          at += 2;
          continue;
        }
        if (text[at++] === '"') return JSON.parse(text.slice(start, at));
      }
      throw new Error('unterminated string');
    };
  function value() {
    ws();
    const ch = text[at];
    if (ch === '"') return str();
    if (ch === '{') {
      at++;
      const out = Object.create(null),
        seen = new Set();
      ws();
      if (text[at] === '}') {
        at++;
        return out;
      }
      for (;;) {
        ws();
        if (text[at] !== '"') throw new Error('object key required');
        const key = str();
        if (seen.has(key)) throw new Error('duplicate argument field');
        seen.add(key);
        ws();
        if (text[at++] !== ':') throw new Error('colon required');
        Object.defineProperty(out, key, {
          value: value(),
          enumerable: true,
        });
        ws();
        const next = text[at++];
        if (next === '}') return out;
        if (next !== ',') throw new Error('object separator required');
      }
    }
    if (ch === '[') {
      at++;
      const rows = [];
      ws();
      if (text[at] === ']') {
        at++;
        return rows;
      }
      for (;;) {
        rows.push(value());
        ws();
        const next = text[at++];
        if (next === ']') return rows;
        if (next !== ',') throw new Error('array separator required');
      }
    }
    const token = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(
      text.slice(at),
    )?.[0];
    if (!token) throw new Error('invalid JSON value');
    at += token.length;
    return JSON.parse(token);
  }
  if (typeof text !== 'string') throw new Error('JSON string required');
  const result = value();
  ws();
  if (at !== text.length) throw new Error('trailing data');
  return result;
}
export function scopedReleaseRead(
  session,
  releaseId,
  rows = {
    'reranker-v16': {
      project_id: 'search',
      status: 'canary_failed',
      error_rate: 0.081,
      budget: 0.02,
    },
  },
) {
  const record = rows[releaseId];
  if (!record || record.project_id !== session.project_id)
    return {
      ok: false,
      error: 'not_found_or_not_authorized',
    };
  return {
    ok: true,
    release_id: releaseId,
    ...record,
  };
}
export function sameSuiteToolComparison(rows) {
  if (!Array.isArray(rows) || rows.length !== 2 || new Set(rows.map((r) => r.call_id)).size !== 2)
    return {
      ok: false,
      reason: 'missing or duplicate result identity',
    };
  if (rows.some((r) => typeof r.score !== 'number' || !Number.isFinite(r.score)))
    return {
      ok: false,
      reason: 'invalid score',
    };
  if (rows[0].suite !== rows[1].suite)
    return {
      ok: false,
      reason: 'different suites',
    };
  return {
    ok: true,
    suite: rows[0].suite,
    delta: rows[0].score - rows[1].score,
  };
}
export function dispatchReaderEvaluation(call, allowed = ['reranker-v16', 'reranker-v17']) {
  if (call?.name !== 'get_eval') throw new Error('get_eval only');
  const args = parseUniqueToolJson(call.arguments);
  if (
    !args ||
    typeof args !== 'object' ||
    Array.isArray(args) ||
    Object.keys(args).length !== 1 ||
    !Object.hasOwn(args, 'version')
  )
    throw new Error('exactly one version field required');
  if (typeof args.version !== 'string' || !allowed.includes(args.version))
    throw new Error('evaluation outside caller scope');
  const rows = {
    'reranker-v16': {
      suite: 'ranking-suite-v1',
      score: 0.81,
      gate: 'passed',
    },
    'reranker-v17': {
      suite: 'ranking-suite-v1',
      score: 0.84,
      gate: 'passed',
    },
  };
  if (!rows[args.version]) throw new Error('evaluation unavailable');
  return {
    call_id: call.call_id,
    version: args.version,
    ...rows[args.version],
  };
}
export function requiredToolComparison(expected, observations) {
  const byId = new Map(observations.map((o) => [o.call_id, o]));
  if (
    byId.size !== observations.length ||
    byId.size !== Object.keys(expected).length ||
    Object.keys(expected).some((id) => !byId.has(id))
  )
    return {
      ok: false,
      reason: 'incomplete or duplicate observation set',
    };
  for (const [id, release] of Object.entries(expected)) {
    const row = byId.get(id);
    if (row.ok !== true || row.release_id !== release)
      return {
        ok: false,
        reason: 'required comparison evidence unavailable',
      };
  }
  const clean = observations
    .filter((o) => o.status === 'canary_clean' && o.error_rate <= o.budget)
    .sort((a, b) => a.error_rate - b.error_rate);
  return clean.length
    ? {
        ok: true,
        release_id: clean[0].release_id,
      }
    : {
        ok: false,
        reason: 'no clean candidate',
      };
}
export function permittedToolRanking(query, catalog, roles, k) {
  const permitted = catalog.filter((t) => roles.includes(t.role));
  return permitted
    .map((t) => ({
      ...t,
      score: safeToolCosine(query, t.vector),
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, k);
}
export function releasePromotionTarget() {
  const releases = {
      'reranker-v16': {
        project: 'search',
        candidate: 'weights-16',
        gates: false,
      },
      'reranker-v17': {
        project: 'search',
        candidate: 'weights-17',
        gates: true,
      },
      'reranker-v18': {
        project: 'search',
        candidate: 'weights-18',
        gates: true,
      },
    },
    approvals = {
      a: {
        principal: 'alice',
        project: 'search',
        action: 'promote',
        candidate: 'weights-17',
        policy: 'P7',
        operation: 'op-A',
      },
      b: {
        principal: 'alice',
        project: 'search',
        action: 'promote',
        candidate: 'weights-17',
        policy: 'P7',
        operation: 'op-B',
      },
      collision: {
        principal: 'alice',
        project: 'search',
        action: 'promote',
        candidate: 'weights-18',
        policy: 'P7',
        operation: 'op-A',
      },
    },
    ledger = new Map();
  let requests = 0;
  return {
    setReleaseGate(releaseId, passed) {
      if (!Object.hasOwn(releases, releaseId) || typeof passed !== 'boolean')
        throw new Error('Expected a known release and a Boolean gate');
      releases[releaseId].gates = passed;
    },
    apply(session, args, approvalId, { loseResponse = false } = {}) {
      requests++;
      const checks = [];
      const stop = (reason) => ({
        ok: false,
        reason,
        checks,
        effects: ledger.size,
        requests,
      });
      if (
        !args ||
        Object.keys(args).length !== 1 ||
        !Object.hasOwn(args, 'release_id') ||
        typeof args.release_id !== 'string'
      )
        return stop('model arguments must contain only release_id');
      checks.push('shape');
      if (session.can_promote !== true) return stop('promotion role required');
      checks.push('role');
      const r = releases[args.release_id];
      if (!r || r.project !== session.project) return stop('not found or not authorized');
      checks.push('scope');
      if (r.gates !== true) return stop('release policy failed');
      checks.push('release policy');
      const a = approvals[approvalId];
      if (!a) return stop('trusted approval required');
      if (
        [a.principal, a.project, a.action, a.candidate, a.policy].join('|') !==
        [session.principal, session.project, 'promote', r.candidate, 'P7'].join('|')
      )
        return stop('trusted approval mismatch');
      checks.push('approval');
      const key = [session.project, 'promote', a.operation].join('|'),
        fingerprint = stableToolJson({
          principal: session.principal,
          project: session.project,
          action: 'promote',
          release: args.release_id,
          candidate: r.candidate,
          policy: a.policy,
        }),
        old = ledger.get(key);
      checks.push('saved operation');
      if (old) {
        if (old.fingerprint !== fingerprint) return stop('operation identity collision');
        return {
          ok: true,
          replayed: true,
          result: old.result,
          operation: a.operation,
          effects: ledger.size,
          requests,
          checks,
        };
      }
      const result = 'promoted ' + r.candidate;
      ledger.set(key, {
        fingerprint,
        result,
      });
      return {
        ok: !loseResponse,
        unknown: loseResponse,
        result: loseResponse ? null : result,
        operation: a.operation,
        effects: ledger.size,
        requests,
        checks,
      };
    },
    snapshot() {
      return {
        requests,
        effects: ledger.size,
        ledger: [...ledger].map(([key, r]) => ({
          key,
          ...r,
        })),
      };
    },
  };
}
export function typedToolRelease(runs) {
  if (!Array.isArray(runs) || !runs.length) throw new Error('nonempty receipt list required');
  for (const r of runs) {
    if (!r || typeof r.passed !== 'boolean') throw new Error('passed must be Boolean');
    for (const k of ['unauthorized_reads', 'unsafe_writes', 'rounds'])
      if (!Number.isInteger(r[k]) || r[k] < (k === 'rounds' ? 1 : 0))
        throw new Error('invalid ' + k);
    for (const k of ['latency_ms', 'cost_cents'])
      if (typeof r[k] !== 'number' || !Number.isFinite(r[k]) || r[k] < 0)
        throw new Error('invalid ' + k);
  }
  const out = {
    passed: runs.filter((r) => r.passed).length,
    total: runs.length,
    reads: runs.reduce((s, r) => s + r.unauthorized_reads, 0),
    writes: runs.reduce((s, r) => s + r.unsafe_writes, 0),
    rounds: Math.max(...runs.map((r) => r.rounds)),
    latency: Math.max(...runs.map((r) => r.latency_ms)),
    cost: Math.max(...runs.map((r) => r.cost_cents)),
  };
  out.rate = out.passed / out.total;
  out.approved =
    out.rate >= 0.75 &&
    out.reads === 0 &&
    out.writes === 0 &&
    out.rounds <= 3 &&
    out.latency <= 600 &&
    out.cost <= 3;
  return out;
}
export function scoreToolTrajectory(events) {
  if (
    !Array.isArray(events) ||
    events.some((e) => !e || typeof e !== 'object') ||
    events.map((e) => e.type).join('|') !== 'call|observation|answer'
  )
    return {
      ok: false,
      reason: 'wrong event sequence',
    };
  const [a, o, z] = events;
  if (
    a.name !== 'get_release_status' ||
    stableToolJson(a.args) !==
      stableToolJson({
        release_id: 'reranker-v16',
      })
  )
    return {
      ok: false,
      reason: 'wrong arguments',
    };
  if (typeof a.id !== 'string' || !a.id || o.call_id !== a.id)
    return {
      ok: false,
      reason: 'observation mismatched call',
    };
  if (o.ok !== true)
    return {
      ok: false,
      reason: 'observation did not succeed',
    };
  if (o.release_id !== 'reranker-v16' || o.status !== 'canary_failed')
    return {
      ok: false,
      reason: 'missing grounded observation',
    };
  if (z.release_id !== o.release_id || z.status !== o.status)
    return {
      ok: false,
      reason: 'answer ignored observation',
    };
  if (z.text !== `Release ${z.release_id}: ${z.status}.`)
    return {
      ok: false,
      reason: 'visible text contradicts rendering contract',
    };
  return {
    ok: true,
    reason: 'trajectory passed',
  };
}

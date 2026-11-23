import { bucket, canonical, sha } from './arithmetic.mjs';
import { INVENTORIES, promptBytes, readCapabilities, readTools } from './fixtures.mjs';
import assert from 'node:assert/strict';
export const bundle = (which) => ({
  model: 'hosted-model@teaching-pin',
  prompt: sha(promptBytes[which]),
  evidence: 'policy@17',
  policy: 'supported-only@3',
  schema: 'answer.v2',
  runtime: sha(which === 0 ? 'supplied-runtime-A' : 'supplied-runtime-B'),
  suite: 'suite-7',
  evaluator: 'claim-eval-v2',
});
export const stable = bundle(0);
export const candidate = bundle(1);
export const corrected = bundle(2);
export const releaseId = (manifest) => sha(canonical(manifest));
export const STABLE = releaseId(stable);
export const CANDIDATE = releaseId(candidate);
// These branches use the incident's supplied support label.
export function approvalRoute(program, supported) {
  assert.equal(typeof supported, 'boolean');
  assert(['historical', 'stable', 'candidate'].includes(program));
  return program === 'historical' || supported ? 'SERVE' : 'WITHHOLD';
}
export class Registry {
  #records = new Map();
  get records() {
    return new Map(this.#records);
  }
  constructor() {
    this.aliases = new Map();
    this.events = [];
  }
  register(manifest) {
    const id = releaseId(manifest);
    if (this.#records.has(id)) assert.deepEqual(this.#records.get(id), manifest);
    this.#records.set(id, Object.freeze(structuredClone(manifest)));
    return id;
  }
  move(alias, target, expected) {
    assert(this.#records.has(target), 'unregistered release');
    const prior = this.aliases.get(alias) ?? null;
    assert.deepEqual(prior, expected, 'stale alias generation');
    const next = {
      target,
      revision: (prior?.revision ?? 0) + 1,
    };
    this.aliases.set(alias, next);
    this.events.push({
      alias,
      from: prior,
      to: next,
    });
    return next;
  }
}
export const registry = (canaryTarget = CANDIDATE) => {
  const r = new Registry();
  r.register(stable);
  r.register(candidate);
  r.move('production', STABLE, null);
  r.move('canary', canaryTarget, null);
  return r;
};
export const report = {
  release: CANDIDATE,
  suite: 'suite-7',
  evaluator: 'claim-eval-v2',
  schema: 'answer.v2',
  ageHours: 2,
  cases: 200,
  supportChecked: 200,
  latencyChecked: 200,
  f1: 0.93,
  rollbackF1: 0.91,
  unsupported: 0,
  p95: 472,
};
export function offlineGate(e) {
  for (const field of ['release', 'suite', 'evaluator', 'schema'])
    if (
      e[field] !==
      {
        release: CANDIDATE,
        ...candidate,
      }[field]
    )
      return {
        allowed: false,
        reason: field + ' mismatch',
      };
  if (!Number.isFinite(e.ageHours) || e.ageHours < 0 || e.ageHours > 24)
    return {
      allowed: false,
      reason: 'stale or invalid interval',
    };
  if (e.cases !== 200 || e.supportChecked !== 200 || e.latencyChecked !== 200)
    return {
      allowed: false,
      reason: 'incomplete coverage',
    };
  if (
    ![e.f1, e.rollbackF1, e.p95].every(Number.isFinite) ||
    e.f1 < 0 ||
    e.f1 > 1 ||
    e.rollbackF1 < 0 ||
    e.rollbackF1 > 1 ||
    e.p95 < 0
  )
    return {
      allowed: false,
      reason: 'invalid metric',
    };
  if (e.f1 < 0.92 || e.rollbackF1 < 0.9 || e.unsupported !== 0 || e.p95 > 500)
    return {
      allowed: false,
      reason: 'threshold failed',
    };
  return {
    allowed: true,
    reason: 'Supplied report clears offline contract',
  };
}
export function authorize(tool, capabilities = readCapabilities, allowlist = readTools) {
  const required = {
    'read policy': 'policy:read',
    'lookup status': 'status:read',
    'deploy application': 'deploy:write',
  };
  return Object.hasOwn(required, tool) && allowlist.has(tool) && capabilities.has(required[tool]);
}
export function enqueue(requests, capacity = 2) {
  const accepted = [],
    dropped = [];
  for (const request of requests) {
    if (!authorize(request.tool) || accepted.length >= capacity) dropped.push(request);
    else accepted.push(request);
  }
  return {
    accepted,
    dropped,
  };
}
export function route(id, percent, assignments, aborted = new Set()) {
  const old = assignments.get(id);
  if (old && !aborted.has(old)) return old;
  let target = bucket(id) < percent ? CANDIDATE : STABLE;
  if (aborted.has(target)) target = STABLE;
  assert(!aborted.has(target), 'no healthy release');
  assignments.set(id, target);
  return target;
}
export function liveInventory(kind) {
  assert(Object.hasOwn(INVENTORIES, kind), 'unknown supplied inventory');
  const n = kind === 'complete' ? 1200 : 600;
  return Array.from(
    {
      length: n,
    },
    (_, i) => ({
      id: kind + '-' + i,
      inventory: kind,
      release: CANDIDATE,
      rollout: 'rollout-052',
      windowStart: 0,
      windowEnd: 60,
      asOf: 120,
      reviewed: kind === 'complete' || i !== (kind === 'incomplete' ? 97 : n - 1),
      unsafe: kind === 'unsafe' && i === 0,
      latency: 481,
      transportError: i >= n - 2,
      answerable: i < Math.min(800, n - 2),
      rollback: i < 100,
      useful:
        i < Math.min(800, n - 2) &&
        !(kind === 'unsafe' && i === 0) &&
        (i < 92 || (i >= 100 && i < 760)),
    }),
  );
}
export function liveSummary(rows) {
  assert.equal(new Set(rows.map((r) => r.id)).size, rows.length);
  const reviewed = rows.filter((r) => r.reviewed === true),
    answerable = rows.filter((r) => r.answerable === true),
    rollback = answerable.filter((r) => r.rollback === true),
    ordered = rows.map((r) => r.latency).sort((a, b) => a - b);
  return {
    requests: rows.length,
    reviewed: reviewed.length,
    unsafe: reviewed.filter((r) => r.unsafe === true).length,
    errors: rows.filter((r) => r.transportError === true).length,
    p95: ordered[Math.ceil(0.95 * rows.length) - 1] ?? null,
    answerable: answerable.length,
    useful: answerable.filter(
      (r) => r.useful === true && r.transportError === false && r.unsafe === false,
    ).length,
    rollback: rollback.length,
    rollbackUseful: rollback.filter((r) => r.useful && !r.transportError).length,
  };
}
export function liveGate(rows, shadowDropRate = 0.001) {
  if (
    !Array.isArray(rows) ||
    !rows.length ||
    rows.some((r) => !r || typeof r !== 'object' || typeof r.id !== 'string' || !r.id.trim()) ||
    new Set(rows.map((r) => r.id)).size !== rows.length
  )
    return {
      status: 'HOLD',
      reason: 'invalid request inventory',
    };
  const inventory = rows[0].inventory,
    members = INVENTORIES[inventory];
  if (!members || rows.some((r) => r.inventory !== inventory || !members.has(r.id)))
    return {
      status: 'HOLD',
      reason: 'request membership unknown',
    };
  const s = liveSummary(rows);
  if (rows.some((r) => r.release !== CANDIDATE || r.rollout !== 'rollout-052'))
    return {
      ...s,
      status: 'HOLD',
      reason: 'release or attempt mismatch',
    };
  if (s.unsafe)
    return {
      ...s,
      status: 'ABORT',
      reason: 'confirmed unsupported serve',
    };
  if (
    rows.length !== members.size ||
    rows.some(
      (r) =>
        ['reviewed', 'unsafe', 'transportError', 'answerable', 'rollback', 'useful'].some(
          (field) => typeof r[field] !== 'boolean',
        ) ||
        (r.unsafe && !r.reviewed) ||
        (r.rollback && !r.answerable) ||
        (r.useful && (!r.answerable || r.transportError || r.unsafe)),
    )
  )
    return {
      ...s,
      status: 'HOLD',
      reason: 'unknown or inconsistent outcome fields',
    };
  const interval = rows[0];
  if (
    !interval ||
    rows.some(
      (r) =>
        r.windowStart !== interval.windowStart ||
        r.windowEnd !== interval.windowEnd ||
        r.asOf !== interval.asOf,
    ) ||
    ![interval.windowStart, interval.windowEnd, interval.asOf].every(Number.isFinite) ||
    interval.windowStart >= interval.windowEnd ||
    interval.windowEnd > interval.asOf ||
    interval.asOf - interval.windowEnd > 300
  )
    return {
      ...s,
      status: 'HOLD',
      reason: 'invalid or stale interval',
    };
  if (rows.some((r) => !Number.isFinite(r.latency) || r.latency < 0))
    return {
      ...s,
      status: 'HOLD',
      reason: 'invalid latency telemetry',
    };
  if (!validMetric(shadowDropRate, { rate: true }))
    return { ...s, status: 'HOLD', reason: 'invalid shadow telemetry' };
  if (s.p95 > 550 || s.errors / s.requests > 0.01)
    return {
      ...s,
      status: 'ABORT',
      reason: 'experience threshold failed',
    };
  if (shadowDropRate > 0.02) return { ...s, status: 'HOLD', reason: 'shadow telemetry incomplete' };
  if (s.reviewed !== s.requests || s.requests < 1000)
    return {
      ...s,
      status: 'HOLD',
      reason: 'coverage or volume incomplete',
    };
  if (s.answerable < 100 || s.rollback < 50)
    return {
      ...s,
      status: 'HOLD',
      reason: 'insufficient supported slices',
    };
  if (s.useful / s.answerable < 0.9 || s.rollbackUseful / s.rollback < 0.9)
    return {
      ...s,
      status: 'ABORT',
      reason: 'useful-answer floor failed',
    };
  return {
    ...s,
    status: 'PASS',
    reason: 'current inventory clears policy',
  };
}
export const readiness = [
  {
    id: 'READY-1',
    release: STABLE,
    compatible: true,
    healthy: true,
    capacity: 90,
    demand: 100,
  },
  {
    id: 'READY-2',
    release: STABLE,
    compatible: true,
    healthy: true,
    capacity: 110,
    demand: 100,
  },
];
export function recoveryReady(receipt) {
  return (
    !!receipt &&
    receipt.release === STABLE &&
    receipt.compatible === true &&
    receipt.healthy === true &&
    [receipt.capacity, receipt.demand].every(
      (n) => typeof n === 'number' && Number.isFinite(n) && n >= 0,
    ) &&
    receipt.capacity >= receipt.demand
  );
}
export const stableArgs = (value) =>
  Array.isArray(value)
    ? value.map(stableArgs)
    : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((k) => [k, stableArgs(value[k])]),
        )
      : value;
export function replayRecordedTool(expected, actual) {
  assert(expected && actual);
  return expected.name === actual.name &&
    JSON.stringify(stableArgs(expected.args)) === JSON.stringify(stableArgs(actual.args))
    ? {
        matched: true,
        result: expected.result,
      }
    : {
        matched: false,
        reason: 'Invocation differs; no saved result supplied',
      };
}
export function validMetric(value, { rate = false } = {}) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && (!rate || value <= 1);
}
export function freshDecision({
  releaseMatches,
  attemptMatches,
  reviewed,
  requests,
  unsafe,
  latencyComplete,
}) {
  if (!releaseMatches || !attemptMatches) return 'HOLD';
  if (
    ![unsafe, reviewed, requests].every((n) => Number.isSafeInteger(n) && n >= 0) ||
    unsafe > reviewed ||
    reviewed > requests
  )
    return 'HOLD';
  if (unsafe > 0) return 'ABORT';
  if (reviewed !== requests || requests < 1000 || !latencyComplete) return 'HOLD';
  return 'PASS';
}

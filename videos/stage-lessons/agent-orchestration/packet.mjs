import assert from 'node:assert/strict';
import { digest } from '../../films/agent-orchestration/arithmetic.mjs';
import { RECEIPTS as inputs, REQUEST, values } from '../../films/agent-orchestration/fixtures.mjs';
import { operationTarget } from '../../films/agent-orchestration/model.mjs';

// The fixture uses JSON records with string keys and finite integer values. Preserve array order.
function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, ordered(value[key])]),
  );
}

export const FRESH_SECONDS = 60;
export const RATE_LIMITS = { eval: 0.03, health: 0.001 };
export const BRANCHES = ['eval', 'health', 'policy'];

export const canonicalDigest = (value) => digest(ordered(value));
export const RECEIPTS = inputs.map((row) => ({ ...row, digest: canonicalDigest(row.value) }));

export function proposal(receipts = RECEIPTS, request = REQUEST, sources = values, now = 1000) {
  assert.deepEqual(receipts.map((row) => row.branch).sort(), BRANCHES);
  const byBranch = new Map(receipts.map((row) => [row.branch, row]));
  const evidence = BRANCHES.map((branch) => {
    const {
      tenant,
      request: id,
      release,
      version,
      time,
      value,
      digest: sourceHash,
    } = byBranch.get(branch);
    assert.deepEqual(
      [tenant, id, release, version],
      [request.tenant, request.request, request.release, request.version],
    );
    assert(Number.isInteger(time) && now - time >= 0 && now - time <= FRESH_SECONDS);
    assert.deepEqual(value, sources[branch]);
    assert.equal(sourceHash, canonicalDigest(sources[branch]));
    return { branch, tenant, request: id, release, version, time, value, digest: sourceHash };
  });
  assert(Number.isInteger(request.traffic) && request.traffic >= 0 && request.traffic <= 100);
  assert(sources.eval.cases > 0 && sources.eval.failures / sources.eval.cases <= RATE_LIMITS.eval);
  assert(
    sources.health.requests > 0 &&
      sources.health.errors / sources.health.requests <= RATE_LIMITS.health,
  );
  assert(request.traffic <= sources.policy.maxTraffic);
  return ordered({ ...request, evidenceDigest: canonicalDigest(evidence) });
}

export const V4_RECEIPTS = RECEIPTS.map((row) => ({ ...row, version: 4 }));
export const freshPacket = proposal(V4_RECEIPTS, { ...REQUEST, version: 4 });
const target = operationTarget();
const approval = { ...freshPacket, approved: true };
export const recorded = target.apply('op-18', freshPacket, approval, 4);
export const recordedEffects = target.effects;
export const reconciled = target.apply('op-18', freshPacket, approval, 4);
export const reconciledEffects = target.effects;

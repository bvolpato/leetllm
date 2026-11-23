import { AGENT_DAG } from './fixtures.mjs';
import assert from 'node:assert/strict';
export function dependencyState(receipts, revision, now) {
  const valid = {},
    ready = [];
  for (const [id, parents] of Object.entries(AGENT_DAG)) {
    const r = receipts[id];
    valid[id] = Boolean(
      r &&
      r.revision === revision &&
      now < r.until &&
      parents.every((p) => valid[p]) &&
      parents.every((p) => !r.consumed || r.consumed[p] === receipts[p]?.version),
    );
    if (!valid[id] && parents.every((p) => valid[p])) ready.push(id);
  }
  return {
    valid,
    ready,
  };
}
export function approvalReplay(events) {
  const ledger = new Map(),
    records = [],
    outcomes = [];
  let granted = true;
  for (const e of events) {
    if (e.type === 'grant') {
      granted = e.allowed;
      continue;
    }
    if (!granted) {
      outcomes.push('denied');
      continue;
    }
    const payload = JSON.stringify([e.actor, e.release, e.revision]),
      prior = ledger.get(e.key);
    if (prior) {
      outcomes.push(prior.payload === payload ? 'replay ' + prior.id : 'conflict');
      continue;
    }
    const id = 'RB' + (2041 + records.length);
    records.push({
      id,
      payload,
    });
    ledger.set(e.key, {
      id,
      payload,
    });
    outcomes.push('created ' + id);
  }
  return {
    records,
    outcomes,
  };
}
export function canonicalAgentAction(value) {
  const active = new Set();
  const visit = (v) => {
    if (v === null || typeof v === 'string' || typeof v === 'boolean') return v;
    if (typeof v === 'number') {
      assert(Number.isFinite(v), 'Nonfinite action number');
      return v;
    }
    assert(typeof v === 'object', 'Not a JSON action value');
    assert(!active.has(v), 'Cyclic action');
    active.add(v);
    const result = Array.isArray(v)
      ? v.map(visit)
      : Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, visit(v[k])]),
        );
    active.delete(v);
    return result;
  };
  return JSON.stringify(visit(value));
}
export function periodicWithoutProgress(actions, markers, maxPeriod = 3) {
  assert.equal(markers.length, actions.length + 1);
  const canonical = canonicalAgentAction;
  for (let n = 1; n <= maxPeriod; n++) {
    if (actions.length < n * 2) continue;
    const start = actions.length - n * 2,
      tail = actions.slice(start).map(canonical);
    if (
      tail.slice(0, n).every((x, i) => x === tail[i + n]) &&
      markers.slice(start).every((v) => v === markers[start])
    )
      return true;
  }
  return false;
}
export function recoveryVerdict(
  h,
  { region = 'us-east', revision = 'def456', now = 1000, approved = false } = {},
) {
  if (h.region !== region || h.revision !== revision) return 'wrong identity';
  if (!Number.isFinite(h.at) || now - h.at < 0 || now - h.at >= 60) return 'stale or future';
  if (!Number.isFinite(h.p95) || h.p95 < 0 || h.p95 > 200) return 'unhealthy';
  if (!approved) return 'approval missing';
  return 'closed';
}

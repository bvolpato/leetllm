import assert from 'node:assert/strict';
import {
  CANDIDATE,
  STABLE,
  registry,
  liveInventory,
  liveGate,
  freshDecision,
  recoveryReady,
  route,
  authorize,
} from '../../../films/model-versioning-continuous-deployment/model.mjs';
import { bucket } from '../../../films/model-versioning-continuous-deployment/arithmetic.mjs';
export * from '../../../films/model-versioning-continuous-deployment/model.mjs';
export * from '../../../films/model-versioning-continuous-deployment/arithmetic.mjs';
export { promptBytes } from '../../../films/model-versioning-continuous-deployment/fixtures.mjs';

export const nameOf = (digest) =>
  digest === CANDIDATE ? 'CANDIDATE' : digest === STABLE ? 'STABLE' : 'UNKNOWN';
export function aliasHistory(
  select = 'production',
  startCanary = CANDIDATE,
  targets = [CANDIDATE, STABLE],
) {
  const reg = registry(startCanary);
  const states = [];
  const snapshot = () => states.push(Object.fromEntries(reg.aliases));
  snapshot();
  for (const target of targets) {
    reg.move(select, target, reg.aliases.get(select));
    snapshot();
  }
  return { reg, states };
}
export const records = {
  control: liveInventory('incomplete'),
  complete: liveInventory('complete'),
};
records.returned = records.control.map((r, i) =>
  i === 97 ? { ...r, reviewed: true, unsafe: true, useful: false } : r,
);
export const windows = Object.fromEntries(
  Object.entries(records).map(([k, v]) => [k, liveGate(v)]),
);
export const alternatives = [
  {
    share: 1,
    requests: 1200,
    reviewed: 1200,
    unsafe: 0,
    errors: 2,
    p95: 481,
    good: 752,
    possible: 800,
    rollbackGood: 92,
    rollback: 100,
  },
  {
    share: 10,
    requests: 8000,
    reviewed: 8000,
    unsafe: 112,
    errors: 24,
    p95: 493,
    good: 5640,
    possible: 6000,
    rollbackGood: 465,
    rollback: 500,
  },
];
export const authCases = [
  ['read policy', 'policy:read', true, true],
  ['deploy application', 'deploy:write', false, true],
  ['deploy application', 'deploy:write', true, false],
].map(([tool, scope, listed, scoped]) => ({
  tool,
  scope,
  listed,
  scoped,
  allowed: authorize(
    tool,
    new Set(scoped ? [scope] : ['policy:read']),
    new Set(listed ? [tool] : ['read policy']),
  ),
}));
export const assignments = new Map();
export const threads = ['thread-6', 'thread-0', 'thread-1'];
export const firstRoutes = threads.slice(0, 2).map((t) => route(t, 10, assignments));
export const retained = route(threads[1], 100, assignments);
export const newRoute = route(threads[2], 100, assignments);
export const saved = { version: 2, shipId: 'SHIP-4412' };
export function migrate(state) {
  assert.equal(state.version, 2);
  assert.match(state.shipId, /^SHIP-\d+$/);
  return { version: 1, ship: state.shipId };
}
export const repaired = migrate(saved);
export const receipt = (capacity, state) => ({
  release: STABLE,
  healthy: true,
  capacity,
  demand: 150,
  compatible: state.version === 1 && typeof state.ship === 'string',
});
export function serveThread(state, capacity) {
  if (!recoveryReady(receipt(capacity, state))) return null;
  const map = new Map([['thread-6', CANDIDATE]]);
  return {
    thread: 'thread-6',
    release: route('thread-6', 0, map, new Set([CANDIDATE])),
    ship: state.ship,
  };
}
export const returned = serveThread(repaired, 160);
export function practiceWindow(arrivals) {
  const seen = new Set();
  let reviewed = 900,
    unsafe = 0;
  for (const r of arrivals) {
    if (r.attempt !== 73 || r.release !== CANDIDATE || seen.has(r.id) || r.id <= 900 || r.id > 1200)
      continue;
    seen.add(r.id);
    reviewed++;
    unsafe += Number(r.unsafe);
  }
  const counts = { requests: 1200, reviewed, unsafe, latencyComplete: true };
  return {
    ...counts,
    decision: freshDecision({ ...counts, releaseMatches: true, attemptMatches: true }),
  };
}
export const priorSlip = { id: 901, attempt: 72, release: CANDIDATE, unsafe: true };
export const currentSlip = { ...priorSlip, attempt: 73 };
export const toolRecord = {
  name: 'read_policy',
  args: { version: 7 },
  result: 'No approval on file',
};
export const caseIds = [1, 2, 2, 4, 5];
export const missingCase = [1, 2, 3, 4, 5].find((id) => !caseIds.includes(id));
export const trafficCounts = [20, 1, 1, 1, 1, 1, 1, 1, 1, 1];
export const bucketOf = bucket;

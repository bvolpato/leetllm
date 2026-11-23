import assert from 'node:assert/strict';
import { digest, readSchedule, waitingJoinTrace } from '../../../films/agent-orchestration/arithmetic.mjs';
import { REQUEST, RECEIPTS, values } from '../../../films/agent-orchestration/fixtures.mjs';
import { canWrite, merge, operationTarget, proposal, validateModel } from '../../../films/agent-orchestration/model.mjs';

export { REQUEST, RECEIPTS, values, canWrite, digest, merge, proposal, readSchedule, waitingJoinTrace };
export const names = { eval: 'Evaluation', health: 'Health', policy: 'Policy' };
export const branches = RECEIPTS.map(row => row.branch);
export const pack3 = proposal();
export const clockTime = 1000;
export const limit = 60;
export const age = (row, time) => time - row.time;
export const otherTenant = RECEIPTS.map(r => r.branch === 'health' ? { ...r, tenant: 'tenant9' } : r);
export const mixed = RECEIPTS.map(r => r.branch === 'health' ? { ...r, version: 4 } : r);

export function repair(version) {
  const request = { ...REQUEST, version };
  const receipts = mixed.map(row => row.version === version ? row : { ...row, version, time: 998 });
  return { request, receipts, packet: proposal(receipts, request) };
}
export const fixed3 = repair(3);
export const fixed4 = repair(4);
export const duplicate = [...fixed4.receipts, fixed4.receipts[1]];

export function ownedUpdate(branch, update) {
  const keys = Object.keys(update);
  return keys.length === 1 && keys[0] === 'receipts' && Array.isArray(update.receipts)
    && update.receipts.length === 1 && update.receipts[0]?.branch === branch;
}
export const goodUpdate = { receipts: [RECEIPTS[0]] };
export const badUpdate = { ...goodUpdate, approved: true };
export const append = (list, updates) => list.concat(updates);
export const saved = RECEIPTS.filter(r => r.branch !== 'health');
export const probeSelection = ['eval', 'policy'];

// The selected terminals have already scheduled the deferred node in this probe.
export function deferredInspection(pendingTasks, receipts = saved) {
  if (pendingTasks.length) return null;
  const identities = receipts.map(row => row.branch);
  return {
    identities,
    match: identities.length === probeSelection.length
      && probeSelection.every(branch => identities.includes(branch)),
  };
}
export const sourceCorrection = { ...values.eval, failures: 1 };
export const evalPct = 100 * values.eval.failures / values.eval.cases;
export const healthPct = 100 * values.health.errors / values.health.requests;
export const serialRead = readSchedule(0).branches.reduce((sum, row) => sum + row.duration, 0);
export const mergeCost = 0.5;
export const parallelRead = Math.max(...readSchedule(0).branches.map(row => row.duration));

export function validation(rows, request, now = clockTime) {
  try { return merge(rows, now, request); } catch { return false; }
}

export const pack4 = fixed4.packet;
export const signed3 = { ...pack3, approved: true };
export const signed4 = { ...pack4, approved: true };
const destination = operationTarget();
export const firstWrite = destination.apply('op-18', pack4, signed4, 4);
export const afterFirst = destination.effects;
export const replay = destination.apply('op-18', pack4, signed4, 4);
export const afterReplay = destination.effects;
export const changedTraffic = proposal(fixed4.receipts, { ...fixed4.request, traffic: 20 });
export const keyClash = (() => {
  // Even a matching approval cannot reuse the stored key for different traffic.
  const approval = { ...changedTraffic, approved: true };
  assert(canWrite(approval, 4, changedTraffic));
  try { destination.apply(firstWrite.operation, changedTraffic, approval, 4); return false; }
  catch { return true; }
})();

export function checkRelease() {
  validateModel();
  assert(ownedUpdate('eval', goodUpdate));
  assert(!ownedUpdate('eval', badUpdate));
  assert(!ownedUpdate('health', goodUpdate));
  assert.deepEqual(append(['health'], ['eval', 'eval']), ['health', 'eval', 'eval']);
  assert.deepEqual(append(saved, []), saved);
  assert.deepEqual(saved.map(r => r.branch), ['eval', 'policy']);
  assert.equal(deferredInspection(['Index update']), null);
  assert.deepEqual(deferredInspection([]), { identities: probeSelection, match: true });
  assert(!deferredInspection([], [saved[0], saved[0]]).match);
  assert(!deferredInspection([], RECEIPTS).match);
  assert(!validation(saved, REQUEST));
  assert(!validation(otherTenant, REQUEST));
  assert(!validation(mixed, REQUEST));
  assert(!validation(mixed, fixed4.request));
  assert(!validation(duplicate, fixed4.request));
  assert(validation(fixed3.receipts, REQUEST));
  assert(validation(fixed4.receipts, fixed4.request));
  assert.deepEqual(fixed3.receipts.map((r,i) => r === mixed[i]), [true,false,true]);
  assert.deepEqual(fixed4.receipts.map((r,i) => r === mixed[i]), [false,true,false]);
  assert.equal(age(saved[0], 1200), 210);
  assert(!validation(RECEIPTS, REQUEST, 1200));
  assert.equal(healthPct, 0.04);
  assert.equal(evalPct, 2);
  assert.notEqual(digest(sourceCorrection), RECEIPTS[0].digest);
  assert(sourceCorrection.failures / sourceCorrection.cases <= 0.03);
  assert(!canWrite(signed3, 4, pack3));
  assert(!canWrite(signed3, 4, pack4));
  assert(!canWrite(null, 4, pack4));
  assert.equal(afterReplay, afterFirst);
  assert.deepEqual(firstWrite, replay);
  assert.equal(changedTraffic.evidenceDigest, pack4.evidenceDigest);
  assert.notEqual(digest(changedTraffic), digest(pack4));
  assert(!canWrite(signed4, 4, changedTraffic));
  assert(keyClash);
  assert.equal(destination.effects, 1);
}

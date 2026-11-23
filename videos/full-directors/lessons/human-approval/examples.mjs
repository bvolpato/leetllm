import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  PROPOSAL,
  FRESH_PROPOSAL,
  PRACTICE_PROPOSAL,
  REVIEW_EXERCISE,
} from '../../../films/human-approval/fixtures.mjs';
import {
  conditionalWrite,
  deploymentRow,
  digest,
  operationTarget,
  decisionStore,
} from '../../../films/human-approval/model.mjs';
import { reviewExercise } from '../../../films/human-approval/construction.mjs';
import { admissionBudget } from '../../../films/human-approval/arithmetic.mjs';

export const original = PROPOSAL;
export const fresh = FRESH_PROPOSAL;
export const practice = PRACTICE_PROPOSAL;
export const groups = (row) => row.trafficPercent / 5;
export const print = (packet) => digest(packet).slice(0, 10);
export const workingEdit = { ...original, trafficPercent: 10 };
export const editedPacket = { ...workingEdit, version: 4, operationId: 'edit-17' };
export const first = deploymentRow(original.revision, original.fromTraffic);
export const drift = conditionalWrite(first, { ...original, trafficPercent: fresh.fromTraffic });
export const steadyWrite = conditionalWrite(first, original);
export const staleWrite = conditionalWrite(drift.row, original);
const grants = decisionStore();
const approval = grants.decide('review-18', fresh, 'casey', 'approve', 200, 100, 220);
export const freshAllowed = grants.permits(approval.id, fresh, drift.row.revision, 101);
const target = operationTarget(drift.row.revision, drift.row.trafficPercent);
assert.ok(freshAllowed);
target.apply(fresh.operationId, fresh);
export const landed = target.row;
export const receipt = target.query(fresh.operationId);

const start = deploymentRow(practice.revision, practice.fromTraffic);
const maintenance = conditionalWrite(start, { ...practice, operationId: 'maintenance-57' });
const practiceTarget = operationTarget(start.revision, start.trafficPercent);
practiceTarget.apply(practice.operationId, practice);
export const histories = {
  start,
  maintenance: maintenance.row,
  stopped: conditionalWrite(maintenance.row, practice),
  applied: practiceTarget.row,
  receipt: practiceTarget.query(practice.operationId),
};

// In this comparison both authenticated accounts have the required role in the same tenant.
export const secondReviewer = {
  requester: 'eng-12',
  candidates: ['eng-12', 'casey'].map((id) => ({ id, tenant: original.tenant, eligible: true })),
};
export function qualifiesAsSecondReviewer(requester, reviewer, tenant) {
  return reviewer.eligible && reviewer.tenant === tenant && reviewer.id !== requester;
}

export const policy = (share) => (share > 25 ? 'Senior reviewer' : 'Release manager');
export const reviewStats = reviewExercise(REVIEW_EXERCISE);
export const means = {
  wait: reviewStats.waitSum / reviewStats.reviewed.length,
  review: reviewStats.responseSum / reviewStats.decisions.length,
};
export function graph(repaired, resumed) {
  const starts = resumed ? 2 : 1;
  return { starts, notices: repaired ? 1 : starts, writes: 0 };
}
export const activity = { scheduledLimit: 45, runLimit: 30, wait: 20 };
export const remaining = Math.min(activity.runLimit, activity.scheduledLimit - activity.wait);
export function transaction(clicks, failBeforeInsert = false) {
  let status = 'Pending',
    messages = 0;
  const rows = [];
  for (let i = 0; i < clicks; i++) {
    const eligible = status === 'Pending';
    rows.push(eligible ? 1 : 0);
    if (eligible && !failBeforeInsert) {
      status = 'Authorized';
      messages++;
    }
  }
  return { status, messages, rows };
}
const items = Array.from({ length: 50 }, (_, i) => ({
  key: 'note-' + String(i + 1).padStart(2, '0'),
  destination: 'release-feed',
  content: 'Release note ' + (i + 1),
  requiredRevision: 1,
}));
export const batchDigest = (ordered) =>
  createHash('sha256')
    .update(
      JSON.stringify({
        version: 1,
        tenant: 'platform',
        items: ordered,
      }),
    )
    .digest('hex');
export const sequence = items;
export const batchLedger = items.map((item, i) => ({
  ...item,
  state: i < 41 ? 'Receipt' : i === 41 ? 'Unknown' : 'Unsent',
}));
const event = (minute, increase) => ({ at: minute * 60, from: 0, to: increase });
export const windowCase = {
  now: 22 * 60 + 10,
  past: [event(21 * 60 + 10, 6), event(21 * 60 + 40, 6)],
  proposed: 5,
};
export const included = windowCase.past.map((e) => admissionBudget([e], windowCase.now * 60));
export const rollingTotal = included.reduce((a, b) => a + b, windowCase.proposed);

export function checkExamples() {
  const store = decisionStore();
  const record = store.decide('review-17', original, 'casey', 'approve', 200, 100, 220);
  assert.equal(record.digest, digest(original));
  assert.ok(store.permits('review-17', original, 3, 110));
  assert.ok(!store.permits('review-17', workingEdit, 3, 110));
  assert.ok(!store.permits('review-17', original, 4, 110));
  assert.ok(!store.permits('review-17', original, 3, 220));
  assert.notEqual(digest(workingEdit), digest(original));
  assert.notEqual(digest(editedPacket), digest(workingEdit));
  assert.equal(first.revision, 3);
  assert.deepEqual(
    [first, drift.row, staleWrite.row, steadyWrite.row, landed].map(groups),
    [0, 2, 2, 5, 5],
  );
  assert.deepEqual([staleWrite.rows, steadyWrite.rows], [0, 1]);
  assert.deepEqual(staleWrite.row, drift.row);
  assert.deepEqual(
    [drift.row, steadyWrite.row, landed].map((x) => x.revision),
    [4, 4, 5],
  );
  assert.equal(target.query('op-17'), null);
  assert.deepEqual(receipt, {
    operationId: 'op-18',
    status: 'executed',
    revision: 5,
    trafficPercent: 25,
    effectCount: 1,
  });
  assert.deepEqual(target.apply(fresh.operationId, fresh), receipt);
  assert.equal(target.effects, 1);
  assert.equal(histories.stopped.rows, 0);
  assert.deepEqual(histories.stopped.row, histories.applied);
  assert.equal(histories.receipt.operationId, practice.operationId);
  assert.deepEqual([groups(histories.applied), histories.applied.revision], [3, 59]);
  assert.deepEqual([policy(25), policy(50)], ['Release manager', 'Senior reviewer']);
  assert.deepEqual(graph(false, true), { starts: 2, notices: 2, writes: 0 });
  assert.deepEqual(graph(true, true), { starts: 2, notices: 1, writes: 0 });
  assert.equal(remaining, 25);
  assert.deepEqual(transaction(2), { status: 'Authorized', messages: 1, rows: [1, 0] });
  assert.deepEqual(transaction(1, true), { status: 'Pending', messages: 0, rows: [1] });
  assert.notEqual(batchDigest(items), batchDigest([items[1], items[0], ...items.slice(2)]));
  assert.deepEqual(
    ['Receipt', 'Unknown', 'Unsent'].map((s) => batchLedger.filter((x) => x.state === s).length),
    [41, 1, 8],
  );
  assert.equal(batchLedger.find((x) => x.state === 'Unknown').key, 'note-42');
  assert.deepEqual(
    [
      reviewStats.approved.length,
      reviewStats.expired.length,
      reviewStats.caught.length,
      reviewStats.seeded.length,
    ],
    [3, 1, 2, 3],
  );
  assert.deepEqual(means, { wait: 5.2, review: 6.4 });
  assert.deepEqual(included, [0, 6]);
  assert.equal(rollingTotal, 11);
  assert.equal(admissionBudget([], windowCase.now * 60, [windowCase.past[1]]), 6);
}

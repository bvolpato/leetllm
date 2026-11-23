import assert from 'node:assert/strict';
import {
  arrivals,
  boundDecision,
  decide,
  fusionResult,
  moderationPopulation,
  queue,
  selectedLuminance,
  sensitiveAdmission,
} from '../../../films/design-real-time-content-moderation-system/model.mjs';
import { batches } from '../../../films/design-real-time-content-moderation-system/construction.mjs';
import {
  flowRates,
  names,
  resolvedRates,
  scores,
  thresholds,
} from '../../../films/design-real-time-content-moderation-system/fixtures.mjs';
import {
  currentReceipt,
  currentResult,
  lateReceipt,
  oldResult,
  replayResult,
  skyClub,
} from '../../../films/design-real-time-content-moderation-system/upload.mjs';

export { currentReceipt, currentResult, lateReceipt, oldResult, replayResult, skyClub, queue };
export const classroom = {
  sentence: 'Our class uses the official guide to identify egrets.',
  policy: 'Classroom references are allowed.',
  describes: 'guide',
};
export function assessReference(post) {
  return {
    hit: post.sentence.includes('official'),
    allowed: post.describes === 'guide' && post.policy === classroom.policy,
  };
}
export const specialist = sensitiveAdmission({ id: 'SR17', modelAgreement: false });
export const routes = flowRates.map((incoming, i) => ({
  name: ['Rules and cache', 'Classifier', 'Policy judge', 'Reviewer'][i],
  incoming,
  exit: resolvedRates[i],
  onward: incoming - resolvedRates[i],
}));
export const capacity = {
  busy: routes[3].incoming * 120,
  staff: Math.ceil((routes[3].incoming * 120) / 0.7),
  inFlight: routes[2].incoming * 0.4,
};
const fullBatchItems = 32;
const fullBatchMs = 8;
const serviceSeconds = fullBatchMs / 1000;
const itemsPerSecond = fullBatchItems / serviceSeconds;
const classifierArrivals = routes[1].incoming;
export const benchmark = {
  items: fullBatchItems, ms: fullBatchMs, serviceSeconds, itemsPerSecond,
  arrivals: classifierArrivals, workers: Math.ceil(classifierArrivals / itemsPerSecond),
};

export function categories(incomplete) {
  const values = scores.map((v, i) => (incomplete && i === 1 ? null : v));
  const rows = names.map((name, i) => {
    const [review, block] = thresholds[i],
      value = values[i];
    const status =
      value === null ? 'Missing' : value >= block ? 'Block' : value >= review ? 'Review' : 'Below';
    return { name, value, review, block, status };
  });
  return {
    rows,
    action: decide(values),
    reasons: rows.filter((r) => ['Review', 'Block'].includes(r.status)),
  };
}
export const luminance = [10, 11, 12, 13, 15, 16, 82, 84, 85, 86, 18, 19];
export const framePicks = selectedLuminance(luminance);
export const adapter = { score: 0, assessedInputs: [], category: 'Harassment' };
export const caller = { action: 'Block', permissions: ['Request review'] };
export const canExecute = caller.permissions.includes(caller.action);

export const traffic = arrivals;
export const tie = [
  { id: 'X', at: 0 },
  { id: 'Y', at: 5 },
];
export function trayState(input, time) {
  const sent = batches(input).filter((group) => group.at <= time);
  const done = new Set(sent.flatMap((group) => group.rows.map((row) => row.id)));
  const waiting = input.filter((row) => row.at <= time && !done.has(row.id));
  return { sent, waiting, age: waiting.length ? time - waiting[0].at : null };
}
export const population = moderationPopulation(100000, 0.001, 0.95, 0.01);
export const profile = {
  id: 'Reedbank',
  revision: 7,
  policy: 'v44',
  scope: 'profile-eu',
  state: 'PENDING',
  applied: {},
  outbox: [],
};
const edited = { ...profile, revision: 8 };
export const birdReceipt = {
  id: 'K7',
  item: profile.id,
  revision: 7,
  scope: profile.scope,
  policy: profile.policy,
  action: 'ALLOW',
};
export const egretReceipt = { ...birdReceipt, id: 'E8', revision: 8 };
export function commit(item, receipt) {
  if (item.id !== receipt.item) return { status: 'WRONG ITEM', item };
  const result = boundDecision(item, receipt);
  if (result.status !== 'APPLIED') return result;
  const event = { id: receipt.id, revision: item.revision, state: result.item.state };
  return { ...result, item: { ...result.item, outbox: [...item.outbox, event] } };
}
export const oldBird = commit(edited, birdReceipt);
export const newBird = commit(oldBird.item, egretReceipt);
export const replayBird = commit(newBird.item, egretReceipt);

// The authenticated resolver response is already bound to this submission.
const approvedPost = { scope: 'eu-community-post', policy: 'eu-v17', appeals: 'eu-appeals' };
export function lookupScope(recordId) {
  return recordId === 'scope-eu-post-v17' ? approvedPost : null;
}
export const scopeRuns = [
  { id: 'scope-eu-post-v17', state: lookupScope('scope-eu-post-v17') },
  { id: 'unresolved-multi-region', state: lookupScope('unresolved-multi-region') },
];
const claim = {
  text: 'Official club representative',
  tenant: 'Reedbank',
  scope: approvedPost.scope,
  policy: approvedPost.policy,
  surface: 'community post',
  bundle: 'm6 / t2',
  context: 'Account claim',
};
export const quotation = { ...claim, context: 'Quoted in class' };
export const exactMatch = Object.keys(claim).every((k) => claim[k] === quotation[k]);
// Article simhash64 outputs. The exercise compares only the low eight bits.
export const fieldNotes = [
  { text: 'Photograph feeding pelicans', hash: 0xfff79ec55ea253b4n },
  { text: 'Study feeding pelicans', hash: 0xf7e5a5d96da80385n },
];
export const bits = fieldNotes.map(({ hash }) => (hash & 255n).toString(2).padStart(8, '0'));
export const differences = [...bits[0]].map((bit, i) => bit !== bits[1][i]);
export const distance = differences.filter(Boolean).length;
export const relatedAt = (cutoff) => distance <= cutoff;
export const originalBlock = { id: 'D8', rev: 8, policy: 'v7', action: 'Block' };
export const correction = {
  id: 'C8',
  parent: originalBlock.id,
  rev: 8,
  policy: 'v7',
  action: 'Allow',
  cause: 'Original error',
};
const noticeBlock = { id: 'D9', rev: 4, policy: 'v7', action: 'Block' };
const changedRule = {
  id: 'C9',
  parent: noticeBlock.id,
  rev: 4,
  policy: 'v8',
  action: 'Allow',
  cause: 'Policy change',
};
export const appealRecords = [
  { subject: 'Classroom guide', prior: originalBlock, fix: correction },
  { subject: 'Member’s event notice', prior: noticeBlock, fix: changedRule },
];
export function isErrorCandidate({ prior, fix }, policy) {
  return prior.policy === policy && fix.policy === policy && fix.cause === 'Original error';
}
export const readHandout = (cached) => (cached ? originalBlock : correction);
export const fusion = fusionResult(skyClub.caption, skyClub.image);
export const fusionExamples = [
  { name: 'Study group photo', caption: 0.08, image: 0.12 },
  { name: 'Club ownership claim', caption: 0.71, image: 0.68 },
].map((row) => ({ ...row, result: fusionResult(row.caption, row.image) }));
export const missingCaption = (verified) => fusionResult(null, fusionExamples[1].image, verified);
export const releaseCases = [
  { name: 'Class handout', text: classroom.sentence, expected: 'Publish' },
  { name: 'Confirmed impostor', text: 'I am the official club representative.', expected: 'Block' },
  { name: 'Study notes', text: 'Bring your notes to class.', expected: 'Publish' },
].map((row) => ({
  ...row,
  actual: row.text.toLowerCase().includes('official') ? 'Block' : 'Publish',
}));
export const failedRelease = releaseCases.some((row) => row.actual !== row.expected);

export const migration = {
  shadow: { liveOnReplacement: 0, oldCalls: 'serving', recovery: 'Compare results before routing live traffic' },
  canary: { liveOnReplacement: 1, oldCalls: 'serving', recovery: 'Approved trial  /  watch each group' },
  drain: { liveOnReplacement: 10, oldCalls: 'rollback only', recovery: 'Old provider available for rollback while work drains' },
  retired: { liveOnReplacement: 10, oldCalls: 'blocked', recovery: 'Tested fallback  /  hold uploads for review without a provider' },
};

export function check() {
  assert.deepEqual(assessReference(classroom), { hit: true, allowed: true });
  assert.equal(specialist.admitted, true);
  assert.equal(specialist.modelAgreement, false);
  assert.deepEqual(
    routes.map((r) => [r.incoming, r.exit, r.onward]),
    [
      [10000, 8000, 2000],
      [2000, 1500, 500],
      [500, 400, 100],
      [100, 100, 0],
    ],
  );
  assert.deepEqual(capacity, { busy: 12000, staff: 17143, inFlight: 200 });
  assert.deepEqual(benchmark, { items: 32, ms: 8, serviceSeconds: 0.008,
    itemsPerSecond: 4000, arrivals: 2000, workers: 1 });
  assert.deepEqual(
    categories(false).reasons.map((r) => [r.name, r.status]),
    [
      ['Violence', 'Block'],
      ['Spam', 'Review'],
    ],
  );
  assert.equal(categories(false).action, 'BLOCK');
  assert.equal(categories(true).action, 'REVIEW');
  assert.deepEqual(categories(true).rows[1], {
    name: 'Violence',
    value: null,
    review: 0.6,
    block: 0.95,
    status: 'Missing',
  });
  assert.equal(adapter.assessedInputs.length, 0);
  assert.equal(canExecute, false);
  assert.deepEqual(framePicks, [0, 4, 6, 8, 10]);
  assert.deepEqual(
    trayState(traffic, 1).waiting.map((r) => r.id),
    ['A', 'B'],
  );
  assert.deepEqual(trayState(traffic, 24), {
    sent: batches(traffic).slice(0, 1),
    waiting: [traffic[3]],
    age: 4,
  });
  assert.deepEqual(
    trayState(traffic, 32).sent.map((g) => [g.at, g.rows.map((r) => r.id).join('')]),
    [
      [2, 'ABC'],
      [25, 'D'],
      [32, 'E'],
    ],
  );
  assert.deepEqual(trayState(tie, 5).waiting, [tie[1]]);
  assert.deepEqual(
    trayState(tie, 10).sent.map((g) => [g.at, g.rows[0].id]),
    [
      [5, 'X'],
      [10, 'Y'],
    ],
  );
  assert.deepEqual([0, 10, 20, 50, 80].map(queue), [0, 3000, 6000, 3000, 0]);
  assert.deepEqual(
    [population.tp, population.fp, population.fn, population.tn],
    [95, 999, 5, 98901],
  );
  assert.equal((100 * population.precision).toFixed(1), '8.7');
  assert.equal(oldBird.status, 'STALE');
  assert.equal(oldBird.item.state, 'PENDING');
  assert.deepEqual(oldBird.item.outbox, []);
  assert.equal(newBird.status, 'APPLIED');
  assert.deepEqual(newBird.item.outbox, [{ id: 'E8', revision: 8, state: 'PUBLISHED' }]);
  assert.strictEqual(replayBird.item, newBird.item);
  assert.equal(replayBird.status, 'DUPLICATE');
  assert.equal(
    commit({ ...newBird.item, revision: 9, state: 'PENDING' }, egretReceipt).status,
    'DUPLICATE',
  );
  assert.equal(commit(newBird.item, { ...egretReceipt, action: 'BLOCK' }).status, 'CONFLICT');
  for (const delta of [
    { scope: 'other' },
    { policy: 'v45' },
    { state: 'CLOSED' },
    { id: 'different' },
  ])
    assert.equal(commit({ ...edited, ...delta }, egretReceipt).item.outbox.length, 0);
  assert.equal(exactMatch, false);
  assert.deepEqual(Object.keys(claim).filter((key) => claim[key] !== quotation[key]), ['context']);
  assert.deepEqual(scopeRuns.map(({ state }) => state), [
    { scope: 'eu-community-post', policy: 'eu-v17', appeals: 'eu-appeals' }, null,
  ]);
  assert.deepEqual(bits, ['10110100', '10000101']);
  assert.deepEqual(differences.map(Number), [0, 0, 1, 1, 0, 0, 0, 1]);
  assert.deepEqual([relatedAt(2), relatedAt(3)], [false, true]);
  assert.equal(readHandout(true).action, 'Block');
  assert.equal(readHandout(false).parent, originalBlock.id);
  assert.deepEqual(
    appealRecords.map(({ prior, fix }) => [prior.policy, prior.action, fix.policy, fix.action, fix.cause]),
    [
      ['v7', 'Block', 'v7', 'Allow', 'Original error'],
      ['v7', 'Block', 'v8', 'Allow', 'Policy change'],
    ],
  );
  for (const { prior, fix } of appealRecords) {
    assert.equal(fix.parent, prior.id);
    assert.equal(fix.rev, prior.rev);
  }
  assert.deepEqual(appealRecords.filter((record) => isErrorCandidate(record, 'v7')).map(({ prior }) => prior.id), ['D8']);
  assert.equal(fusion.score.toFixed(3), '0.661');
  assert.equal(fusion.action, 'REVIEW');
  assert.deepEqual(
    fusionExamples.map((r) => [r.result.score.toFixed(4), r.result.action]),
    [
      ['0.1020', 'ALLOW'],
      ['0.6935', 'REVIEW'],
    ],
  );
  assert.equal(fusionResult(0.65, 0.65).action, 'REVIEW');
  assert.deepEqual(
    [missingCaption(false).action, missingCaption(true).action],
    ['REVIEW', 'BLOCK'],
  );
  assert.deepEqual(
    releaseCases.filter((row) => row.actual !== row.expected).map((row) => row.name),
    ['Class handout'],
  );
  assert.equal(failedRelease, true);
  assert.deepEqual(Object.values(migration).map((s) => [s.liveOnReplacement, s.oldCalls]),
    [[0, 'serving'], [1, 'serving'], [10, 'rollback only'], [10, 'blocked']]);
  assert.deepEqual(
    [oldResult.status, currentResult.status, replayResult.status],
    ['STALE', 'APPLIED', 'DUPLICATE'],
  );
  assert.strictEqual(replayResult.item, currentResult.item);
  assert.deepEqual(currentResult.item.outbox, [
    { decision: 'D24', item: 'P24', revision: 3, state: 'PUBLISHED' },
  ]);
  assert.equal(fusionResult(null, 0.76).action, 'REVIEW');
  assert.equal(fusionResult(null, 0.76, true).action, 'BLOCK');
  return true;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  offlineDecision,
  canaryDecision,
  launchRecommendation,
  gatePredicates,
  nearestRank,
  LATENCY_ILLUSTRATION,
  claimHeadroom,
  freshDecisionState,
  publicRehearsalPacket,
  effectDecision,
  sampleModel,
  holdoutOverlap,
} from '../animations/ai-lab-behavioral-interview.mjs';
const checks = { 'acl-denied-snippet': true, 'acl-denied-citation': true };
const canary = { checks, otherGatesPass: true, windowComplete: true, p95Ms: 420 };

test('the exact dictionary contract rejects extra, inherited and numeric results', () => {
  for (const value of [
    null,
    [],
    { 'acl-denied-snippet': true },
    { ...checks, extra: true },
    { ...checks, 'acl-denied-snippet': 1 },
    Object.create(checks),
  ])
    assert.equal(offlineDecision(value, true).candidateTraffic, 0);
  const callable = () => {};
  Object.assign(callable, checks);
  assert.equal(offlineDecision(callable, true).candidateTraffic, 0);
  assert.equal(offlineDecision(checks, true).candidateTraffic, 5);
  assert.equal(offlineDecision(checks, 1).candidateTraffic, 0);
});
test('authorization failure wins before a healthy or missing latency review', () => {
  for (const p95Ms of [420, NaN, null])
    assert.equal(
      canaryDecision({ ...canary, p95Ms, checks: { ...checks, 'acl-denied-citation': false } })
        .candidateTraffic,
      0,
    );
  assert.equal(canaryDecision({ ...canary, otherGatesPass: false }).candidateTraffic, 0);
  assert.throws(() => launchRecommendation(checks, { stage: 'unknown' }), /unknown release stage/);
});
test('only complete finite numeric latency can cross the strict limit', () => {
  assert.equal(canaryDecision({ ...canary, p95Ms: 499.999 }).candidateTraffic, 20);
  assert.equal(canaryDecision({ ...canary, p95Ms: 500 }).candidateTraffic, 0);
  for (const p95Ms of [true, '420', NaN, Infinity, -1, null])
    assert.equal(canaryDecision({ ...canary, p95Ms }).candidateTraffic, 5);
  assert.equal(canaryDecision({ ...canary, windowComplete: false }).candidateTraffic, 5);
  assert.equal(gatePredicates(checks, true, true, true).finiteLatency, false);
});
test('nearest-rank selection retains the slow final request without calling it p95', () => {
  const input = [...LATENCY_ILLUSTRATION].reverse(),
    before = [...input],
    s = nearestRank(input, 0.95);
  assert.equal(s.rank, 19);
  assert.equal(s.value, 420);
  assert.equal(s.sorted.at(-1), 900);
  assert.deepEqual(input, before);
  assert.throws(() => nearestRank([], 0.95));
  assert.throws(() => nearestRank([1, NaN], 0.95));
  assert.throws(() => nearestRank([1], 0));
});
test('threshold headroom cannot fabricate a measured improvement', () => {
  assert.deepEqual(claimHeadroom(), { gap: 80, headroom: 0.16, improvement: null });
  assert.equal(claimHeadroom(420, 500, 600).improvement, 0.3);
});
test('fresh output reveals preserve separate packet premises and unknown router state', () => {
  const held = freshDecisionState();
  assert.equal(held.originalP95, 500);
  assert.equal(held.originalResult, null);
  assert.equal(held.laterP95, null);
  assert.equal(held.laterResult, null);
  const one = freshDecisionState({ withdrawn: true, laterValue: true });
  assert.equal(one.originalResult.candidateTraffic, 0);
  assert.equal(one.laterP95, 480);
  assert.equal(one.laterResult, null);
  const two = freshDecisionState({ withdrawn: true, laterValue: true, laterEligible: true });
  assert.equal(two.laterResult.candidateTraffic, 20);
  assert.equal(two.routerTraffic, null);
  assert.equal(two.improvement, null);
  assert.equal(two.recurrence, null);
});
test('public rehearsal selection preserves permitted text and removes private fields', () => {
  const fields = [
    { text: 'wrote the release check', private: false },
    { text: 'customer identity', private: true },
    { text: 'observed 420 ms', private: false },
  ];
  assert.deepEqual(publicRehearsalPacket(fields), ['wrote the release check', 'observed 420 ms']);
  assert.equal(fields.length, 3);
  assert.throws(() => publicRehearsalPacket([{ text: 'private', private: 1 }]));
});
test('a read capability does not grant an export effect', () => {
  assert.deepEqual(
    effectDecision({ readGranted: true, bulkExportGranted: false, ownerApproved: true }),
    { triage: true, bulkExport: false, exportCount: 0 },
  );
  assert.equal(
    effectDecision({ readGranted: true, bulkExportGranted: true, ownerApproved: false })
      .exportCount,
    0,
  );
  assert.equal(
    effectDecision({ readGranted: true, bulkExportGranted: true, ownerApproved: true }).exportCount,
    1,
  );
});
test('the historical timeline keeps exposure zero until the actual approval cue completes', () => {
  const cues = {
    'timeline-repair': { progress: 1 },
    'timeline-cases-pass': { progress: 1 },
    'timeline-approved': { progress: 0.999 },
  };
  const before = sampleModel('timeline', { beat: 1, beatP: 0.99, cues });
  assert.equal(before.story.candidateTraffic, 0);
  const after = sampleModel('timeline', {
    beat: 1,
    beatP: 0.99,
    cues: { ...cues, 'timeline-approved': { progress: 1 } },
  });
  assert.equal(after.story.candidateTraffic, 5);
});
test('reusing repair cases fails the untouched-holdout membership check', () => {
  assert.deepEqual(holdoutOverlap(['D01', 'D02'], ['D02', 'D01', 'D02']), ['D02', 'D01']);
  assert.deepEqual(holdoutOverlap(['D01', 'D02'], ['H01', 'H02']), []);
});

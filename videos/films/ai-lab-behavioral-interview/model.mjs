import {
  canaryDecision,
  claimHeadroom,
  freshDecisionState,
  nearestRank,
  offlineDecision,
  storyAt,
} from './arithmetic.mjs';
import { CASES, LATENCY_ILLUSTRATION, PASSING_CASES, SCENES } from './fixtures.mjs';
import { sampleModel } from './construction.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.deepEqual(CASES, ['acl-denied-snippet', 'acl-denied-citation']);
  assert.equal(
    offlineDecision(
      {
        [CASES[0]]: false,
        [CASES[1]]: true,
      },
      true,
    ).candidateTraffic,
    0,
  );
  assert.equal(
    offlineDecision(
      {
        [CASES[0]]: true,
      },
      true,
    ).candidateTraffic,
    0,
  );
  assert.equal(offlineDecision(PASSING_CASES, false).candidateTraffic, 0);
  assert.equal(offlineDecision(PASSING_CASES, true).candidateTraffic, 5);
  assert.equal(
    canaryDecision({
      checks: PASSING_CASES,
      otherGatesPass: true,
      p95Ms: 499.999,
      windowComplete: true,
    }).candidateTraffic,
    20,
  );
  assert.equal(
    canaryDecision({
      checks: PASSING_CASES,
      otherGatesPass: true,
      p95Ms: 500,
      windowComplete: true,
    }).candidateTraffic,
    0,
  );
  assert.equal(
    canaryDecision({
      checks: PASSING_CASES,
      otherGatesPass: true,
      p95Ms: 420,
      windowComplete: false,
    }).candidateTraffic,
    5,
  );
  assert.equal(
    canaryDecision({
      checks: {
        ...PASSING_CASES,
        'acl-denied-snippet': false,
      },
      otherGatesPass: true,
      p95Ms: 420,
      windowComplete: true,
    }).canaryTraffic,
    0,
  );
  assert.equal(storyAt(0).candidateTraffic, 0);
  assert.equal(storyAt(3.59).repaired, false);
  assert.equal(storyAt(3.6).repaired, true);
  assert.equal(storyAt(4.6).offlinePass, true);
  assert.equal(storyAt(4.8).candidateTraffic, 0);
  assert.equal(storyAt(6).candidateTraffic, 5);
  assert.equal(storyAt(5.999).p95Ms, null);
  assert.equal(storyAt(6).p95Ms, 420);
  assert.throws(() => storyAt(6.01), /between zero and six/);
  for (const scene of SCENES)
    for (const beat of [0, 1])
      for (const beatP of [0, 0.15, 0.5, 0.85, 1]) {
        const sample = sampleModel(scene, {
          beat,
          beatP,
        });
        assert.equal(sample.step, beatP === 1 && beat === 0 ? 1 : beat);
        assert(Number.isFinite(sample.q) && sample.time >= 0 && sample.time <= 6);
        assert.equal(sample.allocation.candidate, sample.story.candidateTraffic);
        assert.equal(sample.allocation.candidate + sample.allocation.priorVersion, 100);
        assert(sample.allocation.candidate >= 0 && sample.allocation.candidate <= 5);
        if (scene === 'timeline')
          assert.equal(sample.story.candidateTraffic, sample.story.canaryProgress * 5);
        if (scene === 'canary' && sample.p95Visible) assert.equal(sample.p95Ms, 420);
      }
  assert.equal(nearestRank(LATENCY_ILLUSTRATION, 0.95).value, 420);
  assert.equal(nearestRank(LATENCY_ILLUSTRATION, 0.95).rank, 19);
  assert.equal(claimHeadroom().improvement, null);
  assert.equal(freshDecisionState().originalResult, null);
  assert.equal(
    freshDecisionState({
      withdrawn: true,
    }).originalResult.candidateTraffic,
    0,
  );
  assert.equal(
    freshDecisionState({
      laterEligible: true,
    }).laterResult.candidateTraffic,
    20,
  );
  return true;
}

import {
  admissionDisplay,
  breakerDisplay,
  commitDisplay,
  introRecoverySnapshot,
} from './construction.mjs';
import {
  admitProbe,
  boundedRecoveryClaim,
  breakerLifecycle,
  breakerRace,
  commitScenario,
  finishProbe,
  progressSequence,
  recoveryObservation,
  retrySchedule,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.equal(admissionDisplay(0, 0.2).writeProposal, 0);
  assert.equal(admissionDisplay(0, 0.54).readResult, 0);
  assert.equal(admissionDisplay(0, 0.9).readResult, 1);
  assert.equal(admissionDisplay(1, 0.2).readResult, 1);
  assert.equal(admissionDisplay(1, 0.54).writeResult, 0);
  assert.equal(admissionDisplay(1, 0.9).writeResult, 1);
  assert.equal(admissionDisplay(2, 0.4).recheck, 0);
  assert.equal(breakerDisplay(0, 0.8).state, 'open');
  assert.equal(breakerDisplay(1, 0.5).occupied, true);
  assert.equal(breakerDisplay(1, 0.9).state, 'closed');
  assert.equal(breakerDisplay(2, 0.9).generation, 4);
  const held = admitProbe(breakerLifecycle().halfOpen, 'probe-2');
  assert.equal(admitProbe(held, 'probe-3'), held);
  assert.equal(
    finishProbe(held, {
      id: 'probe-2',
      generation: 1,
      outcome: 'success',
    }),
    held,
  );
  assert.equal(
    finishProbe(held, {
      id: 'probe-2',
      generation: 2,
      outcome: 'failure',
    }).state,
    'open',
  );
  const cancelled = finishProbe(held, {
    id: 'probe-2',
    generation: 2,
    outcome: 'cancel',
  });
  assert.equal(cancelled.state, 'open');
  assert.equal(cancelled.inFlight, null);
  assert.equal(
    finishProbe(held, {
      id: 'probe-2',
      generation: 2,
      outcome: 'other-error',
    }).probeAvailable,
    true,
  );
  const before = commitScenario('before-commit'),
    after = commitScenario('after-commit');
  assert.equal(before.ledger, null);
  assert.equal(before.jobCount, 0);
  assert.equal(after.ledger, 'rb-842-1');
  assert.deepEqual(after.job, {
    id: 'job-1',
    state: 'queued',
  });
  assert.equal(after.replay, 'job-1');
  assert.equal(after.changedPayload, 'conflict');
  assert.equal(after.jobCount, 1);
  assert.deepEqual(
    retrySchedule(false).map((item) => Number(item.elapsedAfter.toFixed(1))),
    [0.3, 1.7, 3.3],
  );
  assert.deepEqual(
    retrySchedule(false).map((item) => item.admitted),
    [true, true, true],
  );
  assert.deepEqual(
    retrySchedule(true).map((item) => Number(item.elapsedAfter.toFixed(1))),
    [1.8, 4.7, 7.8],
  );
  assert.deepEqual(
    retrySchedule(true).map((item) => item.admitted),
    [true, true, false],
  );
  const progress = progressSequence();
  assert.deepEqual(
    progress.map((item) => item.gainedEvidence),
    [true, false, true],
  );
  assert.deepEqual(
    progress.map((item) => item.noProgress),
    [0, 1, 0],
  );
  assert.deepEqual(
    progress.map((item) => item.remaining),
    [7, 6, 5],
  );
  assert.deepEqual(
    progressSequence(['page-4', 'page-5', 'page-4']).map((item) => item.gainedEvidence),
    [true, true, false],
  );
  assert.equal(introRecoverySnapshot(1, 0.5).replyLost, true);
  assert.equal(introRecoverySnapshot(1, 0.7).timedOut, true);
  for (let beat = 0; beat < 3; beat++)
    for (let i = 0; i <= 100; i++) {
      const snapshot = commitDisplay(beat, i / 100);
      assert.equal(snapshot.before.durable, 0);
      assert([0, 2].includes(snapshot.after.durable));
      assert(snapshot.after.pending === 0 || snapshot.after.durable === 0);
    }
  const lifecycle = breakerLifecycle();
  assert.equal(lifecycle.opened.state, 'open');
  assert.equal(lifecycle.halfOpen.state, 'half-open');
  assert.equal(lifecycle.halfOpen.probeAvailable, true);
  assert.equal(lifecycle.recovered.state, 'closed');
  const race = breakerRace();
  assert.equal(race.oldResultReturned, true);
  assert.equal(race.stateAfterOldSuccess, 'open');
  assert(race.currentGeneration > race.olderGeneration);
  const observation = recoveryObservation(),
    claim = boundedRecoveryClaim(observation);
  assert.equal(claim.age, 10);
  assert.equal(claim.state, 'queued');
  assert.equal(
    boundedRecoveryClaim({
      ...observation,
      jobId: 'job-2',
    }),
    null,
  );
  assert.equal(
    boundedRecoveryClaim({
      ...observation,
      observedAt: 100,
    }),
    null,
  );
}

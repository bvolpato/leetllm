import assert from 'node:assert/strict';
import {
  admitProbe,
  boundedRecoveryClaim,
  breakerLifecycle,
  breakerRace,
  commitScenario,
  dispatchOperation,
  finishProbe,
  progressSequence,
  recoveryObservation,
  retrySchedule,
} from '../../../films/agent-recovery/model.mjs';

export const key = 'rb-842-1',
  payload = { run: 'RUN-842', revision: 'rev-17' };
export const before = commitScenario('before-commit'),
  after = commitScenario('after-commit');
export const readSamples = retrySchedule(false);
export const pages = progressSequence(['page-4', 'page-4', 'page-5'], 3, 2);
export function admit({ tool, field, run }) {
  if (tool !== 'get_run' || run !== payload.run) return 'outside scope';
  return field === 'id' ? 'admitted' : 'repair field';
}
export const read = { tool: 'get_run', field: 'id', run: payload.run };
export const write = { tool: 'rollback', field: 'revision', run: payload.run };
export const life = breakerLifecycle(),
  race = breakerRace();
export const inProbe = admitProbe(life.halfOpen, 'probe-B');
export const probe = (outcome) =>
  finishProbe(inProbe, { id: 'probe-B', generation: inProbe.generation, outcome });
export const observed = { ...recoveryObservation(), observedAt: 12 * 3600 + 5 * 60 };
export const report = boundedRecoveryClaim(observed, observed.observedAt + 10, 30);
export function clockLabel(seconds) {
  return new Date(seconds * 1000).toISOString().slice(11, 16);
}
export function twoKeys() {
  const db = { jobs: new Map(), operations: new Map() };
  dispatchOperation(db, key, payload, 'after-commit');
  const payloadB = { ...payload, run: 'RUN-844' },
    keyB = 'rb-844-1';
  const writers = [1, 2].map(() => dispatchOperation(db, keyB, payloadB, 'normal'));
  return { writers, total: db.jobs.size, keyB };
}
export const keys = twoKeys();
export function waitDecision(floor, jitter, left) {
  // Integer milliseconds keep the deadline marker and comparison on the same scale.
  const total = floor + jitter;
  return { floor, jitter, left, total, fits: total < left };
}
export const exercise = waitDecision(1200, 300, 1400),
  longHint = waitDecision(20000, 0, 3000);
export const groups = [60, 12, 18, 10],
  sum = (xs) => xs.reduce((v, x) => v + x, 0);
export const fraction = (n, d) => Math.round((100 * n) / d) + '%';
export const inputs = Array.from({ length: 4 }, (_, i) => 100 + 50 * i);
export const reserve = (input, output, balance) => ({
  input,
  output,
  balance,
  need: input + output,
  admit: input + output <= balance,
});
export const demand = reserve(120, 80, 150);
export function cachedClaim(state, ageMinutes, limitMinutes) {
  const o = { ...recoveryObservation(), state, observedAt: 12 * 3600 };
  return {
    ...o,
    ageMinutes,
    limitMinutes,
    at: clockLabel(o.observedAt),
    now: clockLabel(o.observedAt + 60 * ageMinutes),
    current: boundedRecoveryClaim(o, o.observedAt + 60 * ageMinutes, 60 * limitMinutes),
  };
}
export const oldQueue = cachedClaim('queued', 40, 1),
  oldDone = cachedClaim('completed', 40, 1);
export function seatAction(state, authorized) {
  if (state === 'Released') return 'No cancellation needed';
  if (state === 'Reserved' && authorized) return 'Cancellation permitted if needed';
  return null;
}
export function cluster(evicted, open) {
  return {
    nodes: [
      { id: 'A', schedulable: open, pods: evicted ? [] : ['p1', 'p2'] },
      { id: 'B', schedulable: true, pods: evicted ? ['p3', 'p4'] : [] },
    ],
  };
}
export function checkExamples() {
  assert.deepEqual(
    [before.ledger, before.job, before.jobCount, before.operationCount],
    [null, null, 0, 0],
  );
  assert.deepEqual(
    [
      after.ledger,
      after.reply,
      after.replay,
      after.job.state,
      after.jobCount,
      after.operationCount,
      after.changedPayload,
    ],
    [key, 'lost', 'job-1', 'queued', 1, 1, 'conflict'],
  );
  assert.deepEqual(
    [
      admit(read),
      admit(write),
      admit({ ...read, field: 'run_id' }),
      admit({ ...read, run: 'RUN-843' }),
    ],
    ['admitted', 'outside scope', 'repair field', 'outside scope'],
  );
  assert.deepEqual(keys.writers, [
    { reply: 'accepted', job: 'job-2' },
    { reply: 'replayed', job: 'job-2' },
  ]);
  assert.equal(keys.total, 2);
  assert.deepEqual(
    readSamples.map((s) => [s.cap, s.jitter]),
    [
      [1, 0.3],
      [2, 1.4],
      [4, 1.6],
    ],
  );
  assert.deepEqual(
    pages.map((s) => [s.call, s.page, s.noProgress, s.remaining]),
    [
      [1, 'page-4', 0, 2],
      [2, 'page-4', 1, 1],
      [3, 'page-5', 0, 0],
    ],
  );
  assert.deepEqual(
    [life.opened.state, life.halfOpen.state, life.recovered.state],
    ['open', 'half-open', 'closed'],
  );
  assert.deepEqual(race, {
    olderGeneration: 3,
    currentGeneration: 4,
    stateAfterNewFailure: 'open',
    stateAfterOldSuccess: 'open',
    oldResultReturned: true,
  });
  assert.equal(admitProbe(inProbe, 'second'), inProbe);
  for (const [outcome, state, free] of [
    ['cancel', 'open', false],
    ['other-error', 'half-open', true],
    ['failure', 'open', false],
    ['success', 'closed', false],
  ]) {
    const s = probe(outcome);
    assert.equal(s.state, state);
    assert.equal(s.inFlight, null);
    assert.equal(s.probeAvailable, free);
  }
  assert.deepEqual(
    [report.jobId, report.state, clockLabel(report.observedAt)],
    ['job-1', 'queued', '12:05'],
  );
  assert.equal(
    boundedRecoveryClaim({ ...observed, operationKey: 'wrong' }, observed.observedAt),
    null,
  );
  assert.equal(oldQueue.current, null);
  assert.equal(oldDone.current, null);
  for (const observation of [oldQueue, oldDone]) {
    assert.deepEqual(
      [observation.operationKey, observation.runId, observation.jobId],
      [after.ledger, payload.run, after.job.id],
    );
  }
  assert.equal(seatAction('Unknown', true), null);
  assert.equal(seatAction('Reserved', false), null);
  assert.equal(seatAction('Reserved', true), 'Cancellation permitted if needed');
  assert.equal(seatAction('Released', true), 'No cancellation needed');
  assert.equal(cachedClaim('completed', 1, 1).current.state, 'completed');
  assert.deepEqual([exercise.total, exercise.fits, longHint.fits], [1500, false, false]);
  assert.equal(waitDecision(200, 50, 500).fits, true);
  assert.deepEqual(inputs, [100, 150, 200, 250]);
  assert.equal(sum(inputs), 700);
  assert.equal(demand.need, 200);
  assert.equal(demand.admit, false);
  assert.deepEqual(cluster(true, true).nodes[1], cluster(true, false).nodes[1]);
  assert.equal(cluster(true, true).nodes[0].pods.length, 0);
  assert.equal(sum(groups), 100);
  assert.equal(fraction(groups[0], sum(groups)), '60%');
  assert.equal(fraction(sum(groups.slice(0, 3)), sum(groups)), '90%');
}

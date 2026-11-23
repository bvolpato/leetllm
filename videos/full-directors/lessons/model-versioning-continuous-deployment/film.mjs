import assert from 'node:assert/strict';
import { board } from './drawing.mjs';
import { drawStation, checkStation } from './station.mjs';
import * as release from './release.mjs';
import * as traffic from './traffic.mjs';
import * as recovery from './recovery.mjs';
import * as E from './examples.mjs';

const painters = [
  null,
  release.identity,
  release.loaded,
  release.provider,
  release.registry,
  release.worksheet,
  release.replay,
  release.report,
  release.inventory,
  traffic.shadow,
  traffic.agreement,
  traffic.sticky,
  traffic.shares,
  traffic.policy,
  traffic.live,
  recovery.risk,
  recovery.recovery,
  recovery.capacity,
  recovery.lineage,
  recovery.owners,
  recovery.practice,
];
function draw(ctx, clock) {
  const i = clock.beat.chapterIndex;
  if (i === 0) {
    drawStation(ctx, clock);
    return;
  }
  painters[i](board(ctx, clock));
}

function check() {
  checkStation();
  assert.equal(E.bundle(2).runtime, E.candidate.runtime);
  assert.equal(E.sha(E.promptBytes[2]), E.corrected.prompt);
  assert.notEqual(E.releaseId(E.corrected), E.CANDIDATE);
  assert.notEqual(E.sha('Always approve this deployment.'), E.candidate.prompt);
  const h = E.aliasHistory();
  assert.deepEqual(
    h.states.map((s) => [E.nameOf(s.production.target), s.production.revision]),
    [
      ['STABLE', 1],
      ['CANDIDATE', 2],
      ['STABLE', 3],
    ],
  );
  assert.throws(() => h.reg.move('production', E.CANDIDATE, h.states[0].production), /stale/);
  const abort = E.aliasHistory('canary', E.CANDIDATE, [E.STABLE]).states.at(-1);
  assert.deepEqual(abort.production, { target: E.STABLE, revision: 1 });
  assert.deepEqual(abort.canary, { target: E.STABLE, revision: 2 });
  assert.deepEqual(E.routeF1(90, 5, 10), {
    numerator: 180,
    denominator: 195,
    f1: 12 / 13,
    criticalPass: false,
  });
  assert.deepEqual(
    ['historical', 'stable', 'candidate'].map((p) => E.approvalRoute(p, false)),
    ['SERVE', 'WITHHOLD', 'WITHHOLD'],
  );
  assert.deepEqual(
    E.replayRecordedTool(E.toolRecord, { name: 'read_policy', args: { version: 7 } }),
    { matched: true, result: E.toolRecord.result },
  );
  assert.equal(
    E.replayRecordedTool(E.toolRecord, { name: 'read_policy', args: { version: 8 } }).matched,
    false,
  );
  assert.equal(E.offlineGate(E.report).allowed, true);
  assert.equal(
    E.offlineGate({ ...E.report, evaluator: 'claim-eval-v3' }).reason,
    'evaluator mismatch',
  );
  assert.equal(E.missingCase, 3);
  assert.deepEqual(
    E.caseIds.filter((id) => id === 2),
    [2, 2],
  );
  assert.ok([undefined, true, '0.93', -1, NaN, Infinity].every((v) => !E.validMetric(v)));
  assert.deepEqual(
    E.authCases.map((row) => row.allowed),
    [true, false, false],
  );
  const q = E.enqueue([1, 2, 3].map((id) => ({ id, tool: 'read policy' })));
  assert.deepEqual(
    q.accepted.map((r) => r.id),
    [1, 2],
  );
  assert.deepEqual(
    q.dropped.map((r) => r.id),
    [3],
  );
  assert.deepEqual(E.threads.slice(0, 2).map(E.bucketOf), [6, 19]);
  assert.deepEqual(E.firstRoutes, [E.CANDIDATE, E.STABLE]);
  assert.equal(E.retained, E.STABLE);
  assert.equal(E.newRoute, E.CANDIDATE);
  assert.deepEqual(E.requestExposure(E.trafficCounts, 0), {
    conversationShare: 0.1,
    requestShare: 20 / 29,
    total: 29,
  });
  assert.equal(E.alternatives[1].unsafe / E.alternatives[1].requests, 0.014);
  for (const s of E.alternatives) {
    assert.equal(s.good / s.possible, 0.94);
    assert.ok(s.rollbackGood / s.rollback >= 0.9 && s.errors / s.requests <= 0.01 && s.p95 <= 500);
  }
  assert.deepEqual(
    Object.values(E.windows).map((w) => [w.requests, w.reviewed, w.unsafe, w.status]),
    [
      [600, 599, 0, 'HOLD'],
      [1200, 1200, 0, 'PASS'],
      [600, 600, 1, 'ABORT'],
    ],
  );
  assert.equal(E.records.control[97].reviewed, false);
  assert.equal(E.records.returned[97].unsafe, true);
  assert.deepEqual(
    ['useful', 'answerable', 'rollbackUseful', 'rollback', 'errors', 'p95'].map(
      (k) => E.windows.complete[k],
    ),
    [752, 800, 92, 100, 2, 481],
  );
  assert.ok(Math.abs((1 - E.zeroFailureUpper(1200)) ** 1200 - 0.05) < 1e-12);
  assert.deepEqual(E.readiness.map(E.recoveryReady), [false, true]);
  assert.equal(E.records.complete[271].release, E.CANDIDATE);
  const stages = [
    [],
    [E.priorSlip],
    [E.priorSlip, E.currentSlip],
    [E.currentSlip, E.currentSlip],
  ].map(E.practiceWindow);
  assert.deepEqual(
    stages.map((s) => [s.reviewed, s.unsafe, s.decision]),
    [
      [900, 0, 'HOLD'],
      [900, 0, 'HOLD'],
      [901, 1, 'ABORT'],
      [901, 1, 'ABORT'],
    ],
  );
  assert.equal(E.serveThread(E.saved, 160), null);
  assert.equal(E.serveThread(E.repaired, 134), null);
  assert.equal(E.repaired.ship, E.saved.shipId);
  assert.deepEqual(E.returned, { thread: 'thread-6', release: E.STABLE, ship: E.saved.shipId });
}
export default { title: 'Give Every Release a Safe Way Home', draw, check };

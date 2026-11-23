import { CUES, canaryConversation, stableConversation } from './fixtures.mjs';
import { presentationCue, sampleModel, stickySnapshot } from './construction.mjs';
import { finalWindow, returnReadiness } from './stages/fresh-release.mjs';
import {
  CANDIDATE,
  STABLE,
  approvalRoute,
  authorize,
  candidate,
  corrected,
  enqueue,
  liveGate,
  liveInventory,
  liveSummary,
  offlineGate,
  readiness,
  recoveryReady,
  registry,
  releaseId,
  report,
  route,
  stable,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.equal(approvalRoute('historical', false), 'SERVE');
  assert.equal(approvalRoute('stable', false), 'WITHHOLD');
  assert.equal(approvalRoute('candidate', true), 'SERVE');
  const older = { attempt: 'R72', release: CANDIDATE, request: 901, unsafe: true };
  const current = { ...older, attempt: 'R73' };
  const held = finalWindow([older]);
  const stopped = finalWindow([older, current]);
  assert.deepEqual([held.reviewed, held.unsafe, held.decision], [900, 0, 'HOLD']);
  assert.deepEqual([stopped.reviewed, stopped.unsafe, stopped.decision], [901, 1, 'ABORT']);
  const v1 = { version: 1, ship: 'SHIP-4412' };
  const v2 = { version: 2, shipId: 'SHIP-4412' };
  assert.equal(recoveryReady(returnReadiness(134, v1)), false);
  assert.equal(recoveryReady(returnReadiness(160, v2)), false);
  assert.equal(recoveryReady(returnReadiness(160, v1)), true);
  for (const [cue, revision] of [
    ['promote', 2],
    ['restore', 3],
  ]) {
    assert.equal(
      sampleModel('registry', {
        beat: 1,
        beatP: (CUES.registry[cue] - 0.001) / CUES.registry.span,
      }).aliases.production.revision,
      revision - 1,
    );
    assert.equal(
      sampleModel('registry', {
        beat: 1,
        beatP: (CUES.registry[cue] + 0.001) / CUES.registry.span,
      }).aliases.production.revision,
      revision,
    );
  }
  assert.equal(
    sampleModel('registry', {
      beat: 1,
      beatP: (CUES.registry.stale - 0.001) / CUES.registry.span,
    }).error,
    null,
  );
  assert(
    sampleModel('registry', {
      beat: 1,
      beatP: (CUES.registry.stale + 0.001) / CUES.registry.span,
    }).error,
  );
  assert.equal(
    sampleModel('identity', {
      beat: 1,
      beatP: (CUES.identity.edit - 0.001) / CUES.identity.span,
    }).currentId,
    CANDIDATE,
  );
  assert.equal(
    sampleModel('identity', {
      beat: 1,
      beatP: (CUES.identity.edit + 0.001) / CUES.identity.span,
    }).currentId,
    releaseId(corrected),
  );
  assert.equal(
    sampleModel('identity', {
      beat: 0,
      beatP: 0.99,
    }).currentId,
    CANDIDATE,
  );
  assert.equal(
    presentationCue('live', 1, (CUES.live.experience - 0.001) / CUES.live.span).stage,
    0,
  );
  assert.equal(
    presentationCue('live', 1, (CUES.live.experience + 0.001) / CUES.live.span).stage,
    1,
  );
  assert.equal(presentationCue('live', 1, (CUES.live.useful + 0.001) / CUES.live.span).stage, 2);
  assert.equal(
    presentationCue('live', 1, (CUES.live.decision - 0.001) / CUES.live.span).decisionVisible,
    false,
  );
  assert.equal(
    presentationCue('live', 1, (CUES.live.decision + 0.001) / CUES.live.span).decisionVisible,
    true,
  );
  const early = stickySnapshot(1, 0.12),
    late = stickySnapshot(1, 0.8);
  assert(early.threshold > 10 && early.threshold < 100);
  assert.equal(early.assignments.length, 2);
  assert.equal(early.assignments.find((r) => r.id === stableConversation).target, STABLE);
  assert.equal(late.threshold, 100);
  assert.equal(late.assignments.find((r) => r.id === stableConversation).target, STABLE);
  assert.equal(late.assignments.find((r) => r.id === 'new-thread').target, CANDIDATE);
  for (const beat of [0, 1])
    for (const p of [0.02, 0.25, 0.5, 0.9]) {
      const v = sampleModel('recovery', {
        beat,
        beatP: p,
      });
      if (!beat) assert.equal(v.aliases.production.target, STABLE);
      if (v.recovered) {
        assert.equal(v.assigned, STABLE);
        assert.equal(v.exposure, 0);
        assert.equal(v.aliases[beat ? 'production' : 'canary'].target, STABLE);
      }
    }
  assert.notEqual(STABLE, CANDIDATE);
  assert.notEqual(releaseId(corrected), CANDIDATE);
  assert.equal(stable.model, candidate.model);
  assert.notEqual(stable.prompt, candidate.prompt);
  const r = registry();
  assert.throws(() => r.move('production', 'unregistered', r.aliases.get('production')));
  assert.equal(
    sampleModel('registry', {
      beat: 1,
      beatP: 0.99,
    }).aliases.production.revision,
    3,
  );
  assert(
    sampleModel('registry', {
      beat: 1,
      beatP: 0.99,
    }).error,
  );
  assert.equal(
    sampleModel('registry', {
      beat: 1,
      beatP: 0,
    }).aliases.production.revision,
    1,
  );
  assert.equal(
    sampleModel('registry', {
      beat: 1,
      beatP: (CUES.registry.promote + 0.1) / CUES.registry.span,
    }).aliases.production.revision,
    2,
  );
  assert.equal(
    sampleModel('shadow', {
      beat: 1,
      beatP: 0.99,
    }).dropped.length,
    1,
  );
  assert(offlineGate(report).allowed);
  assert(
    !offlineGate({
      ...report,
      evaluator: 'claim-eval-v3',
    }).allowed,
  );
  assert(
    !offlineGate({
      ...report,
      ageHours: 25,
    }).allowed,
  );
  assert(
    !offlineGate({
      ...report,
      p95: NaN,
    }).allowed,
  );
  assert(
    !offlineGate({
      ...report,
      p95: -1,
    }).allowed,
  );
  assert(
    !offlineGate({
      ...report,
      f1: 1.2,
    }).allowed,
  );
  assert.throws(() => {
    r.records.set('fake', stable);
    r.move('production', 'fake', r.aliases.get('production'));
  });
  assert(Object.isFrozen(r.records.get(STABLE)));
  assert(authorize('read policy'));
  assert(!authorize('deploy application', new Set(['deploy:write'])));
  assert(!authorize('read policy', new Set()));
  const queue = enqueue([
    {
      tool: 'read policy',
    },
    {
      tool: 'read policy',
    },
    {
      tool: 'read policy',
    },
  ]);
  assert.equal(queue.accepted.length, 2);
  assert.equal(queue.dropped.length, 1);
  const assignments = new Map();
  assert.equal(route(stableConversation, 10, assignments), STABLE);
  assert.equal(route(stableConversation, 100, assignments), STABLE);
  assert.equal(route(canaryConversation, 10, assignments), CANDIDATE);
  assert.equal(route(canaryConversation, 10, assignments, new Set([CANDIDATE])), STABLE);
  assert.equal(liveGate(liveInventory('incomplete')).status, 'HOLD');
  const good = liveGate(liveInventory('complete'));
  assert.equal(good.status, 'PASS');
  assert.equal(good.useful, 752);
  assert.equal(good.rollbackUseful, 92);
  assert.equal(good.errors, 2);
  for (const [field, value] of [
    ['unsafe', undefined],
    ['reviewed', 'false'],
    ['transportError', undefined],
    ['useful', 'true'],
    ['answerable', null],
    ['rollback', 1],
  ])
    assert.equal(
      liveGate(
        liveInventory('complete').map((r) => ({
          ...r,
          [field]: value,
        })),
      ).status,
      'HOLD',
    );
  assert.equal(
    liveGate(
      liveInventory('complete').map((r, i) =>
        i === 0
          ? {
              ...r,
              id: 'unknown-request',
            }
          : r,
      ),
    ).status,
    'HOLD',
  );
  assert.equal(liveGate(liveInventory('complete').slice(1)).status, 'HOLD');
  assert.equal(
    liveGate(
      liveInventory('unsafe').map((r, i) =>
        i === 0
          ? r
          : {
              ...r,
              transportError: undefined,
              unsafe: undefined,
            },
      ),
    ).status,
    'ABORT',
  );
  assert.equal(liveGate(liveInventory('unsafe')).status, 'ABORT');
  assert(liveInventory('unsafe').every((r) => !r.unsafe || !r.useful));
  assert.equal(liveSummary(liveInventory('unsafe')).useful, 589);
  assert.equal(liveSummary(liveInventory('unsafe')).rollbackUseful, 91);
  assert.equal(
    liveGate(
      liveInventory('complete').map((r) => ({
        ...r,
        asOf: 400,
      })),
    ).status,
    'HOLD',
  );
  assert.equal(
    liveGate(
      liveInventory('complete').map((r) => ({
        ...r,
        latency: NaN,
      })),
    ).status,
    'HOLD',
  );
  assert.equal(
    liveGate(
      liveInventory('unsafe').map((r) => ({
        ...r,
        latency: NaN,
      })),
    ).status,
    'ABORT',
  );
  assert.equal(
    liveGate(
      liveInventory('complete').map((row) => ({
        ...row,
        useful: false,
      })),
    ).status,
    'ABORT',
  );
  assert.equal(
    sampleModel('recovery', {
      beat: 0,
      beatP: 0.02,
    }).exposure,
    10,
  );
  assert.equal(
    sampleModel('recovery', {
      beat: 1,
      beatP: 0.02,
    }).exposure,
    0,
  );
  assert.equal(
    sampleModel('recovery', {
      beat: 1,
      beatP: 0.2,
    }).exposure,
    100,
  );
  assert.equal(
    sampleModel('recovery', {
      beat: 1,
      beatP: 0.2,
    }).aliases.production.target,
    CANDIDATE,
  );
  for (const beat of [0, 1]) {
    const recovered = sampleModel('recovery', {
      beat,
      beatP: 0.99,
    });
    assert.equal(recovered.aliases.production.target, STABLE);
    assert.equal(recovered.aliases.canary.target, STABLE);
    assert.equal(recovered.assigned, STABLE);
    assert.equal(recovered.events.length, beat ? 4 : 3);
  }
  assert(!recoveryReady(readiness[0]));
  assert(recoveryReady(readiness[1]));
  assert(
    !recoveryReady({
      ...readiness[1],
      release: CANDIDATE,
    }),
  );
  assert(
    !recoveryReady({
      ...readiness[1],
      compatible: false,
    }),
  );
  assert(
    !recoveryReady({
      ...readiness[1],
      compatible: 'false',
      healthy: 'false',
    }),
  );
  for (const capacity of [NaN, Infinity, -1, '110', true, undefined])
    assert(
      !recoveryReady({
        ...readiness[1],
        capacity,
      }),
    );
  for (const demand of [NaN, Infinity, -1, '100', true, undefined])
    assert(
      !recoveryReady({
        ...readiness[1],
        demand,
      }),
    );
  return true;
}

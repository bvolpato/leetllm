// Pure-cinema stage film for ai-lab-system-design-interview (27 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { clampDur, glowDot, guardedDynamic, verifyInterviewInvariants } from './parts.mjs';
import aclFreshness from './scenes/acl-freshness.mjs';
import admission from './scenes/admission.mjs';
import agentState from './scenes/agent-state.mjs';
import apiReceipt from './scenes/api-receipt.mjs';
import batchAndPages from './scenes/batch-and-pages.mjs';
import cacheBytes from './scenes/cache-bytes.mjs';
import cacheCompatibility from './scenes/cache-compatibility.mjs';
import canaryController from './scenes/canary-controller.mjs';
import concurrentClaim from './scenes/concurrent-claim.mjs';
import contract from './scenes/contract.mjs';
import decisionRehearsal from './scenes/decision-rehearsal.mjs';
import demand from './scenes/demand.mjs';
import demandSensitivity from './scenes/demand-sensitivity.mjs';
import freshBoundary from './scenes/fresh-boundary.mjs';
import memory from './scenes/memory.mjs';
import memoryRealization from './scenes/memory-realization.mjs';
import opening from './scenes/opening.mjs';
import parallelPlacement from './scenes/parallel-placement.mjs';
import permissions from './scenes/permissions.mjs';
import phaseLatency from './scenes/phase-latency.mjs';
import phasePlacement from './scenes/phase-placement.mjs';
import quotaReservation from './scenes/quota-reservation.mjs';
import releaseGateScene from './scenes/release-gate.mjs';
import requirementsControl from './scenes/requirements-control.mjs';
import retryAndCancel from './scenes/retry-and-cancel.mjs';
import taskClaims from './scenes/task-claims.mjs';
import typedRelease from './scenes/typed-release.mjs';

/**
 * Adds a live bottom-right narration-cadence pulse beacon driven by intermediate cues so
 * every declared cue in lesson.yaml produces live visual response on the stage.
 */
function withCadence(sceneFn, cadenceCues) {
  return (s, c) => {
    sceneFn(s, c);
    if (!cadenceCues?.length) return;
    const beacon = s.value(0);
    const dot = guardedDynamic(
      () => 1,
      () => {
        const b = beacon.value;
        const r = 4.5 + 3.5 * Math.sin(b * Math.PI);
        return glowDot(790, 445, {
          radius: r,
          color: COSMOS.cyan,
          glow: 8 + 4 * Math.sin(b * Math.PI),
          opacity: 0.72,
        });
      },
    );
    s.add(dot);
    cadenceCues.forEach((id, idx) => {
      c.on(id, () => {
        const t = c.cue(id).start;
        s.play(beacon.to(idx + 1, { duration: clampDur(c, t, 0.25) }));
      });
    });
  };
}

export default cinematicLesson({
  id: 'ai-lab-system-design-interview',
  accent: COSMOS.cyan,
  invariants: verifyInterviewInvariants,
  scenes: {
    opening: withCadence(opening, ['opening-budget', 'opening-choice', 'opening-block-time']),
    admission: withCadence(admission, [
      'admission-ahead',
      'admission-join',
      'admission-question',
      'admission-drain-a',
      'admission-drain-b',
      'admission-drain-own',
      'admission-second-wait',
      'admission-capacity-response',
    ]),
    'requirements-control': withCadence(requirementsControl, [
      'sd-requirements-control-0-operation',
      'sd-requirements-control-0-result',
      'sd-requirements-control-1-result',
      'sd-requirements-control-2-result',
    ]),
    contract,
    'api-receipt': withCadence(apiReceipt, [
      'sd-api-receipt-0-operation',
      'sd-api-receipt-0-result',
      'sd-api-receipt-1-result',
    ]),
    memory: withCadence(memory, ['memory-fixed-weights', 'memory-grow-cache']),
    'cache-bytes': withCadence(cacheBytes, [
      'sd-cache-bytes-0-operation',
      'sd-cache-bytes-0-result',
      'sd-cache-bytes-1-result',
      'sd-cache-bytes-2-result',
    ]),
    'memory-realization': withCadence(memoryRealization, [
      'sd-memory-realization-0-operation',
      'sd-memory-realization-0-result',
      'sd-memory-realization-1-result',
      'sd-memory-realization-2-result',
    ]),
    demand: withCadence(demand, ['demand-beat-1-focus-1', 'demand-beat-1-focus-2']),
    'demand-sensitivity': withCadence(demandSensitivity, [
      'sd-demand-sensitivity-0-operation',
      'sd-demand-sensitivity-0-result',
      'sd-demand-sensitivity-1-result',
      'sd-demand-sensitivity-2-result',
    ]),
    'quota-reservation': withCadence(quotaReservation, [
      'sd-quota-reservation-0-operation',
      'sd-quota-reservation-0-result',
      'sd-quota-reservation-1-operation',
      'sd-quota-deny',
      'sd-quota-reservation-1-result',
      'quota-disconnect',
      'sd-quota-reservation-2-result',
    ]),
    'phase-latency': withCadence(phaseLatency, [
      'phase-before',
      'phase-arrival',
      'phase-short',
      'phase-last',
      'phase-stall',
      'phase-slo',
    ]),
    'batch-and-pages': withCadence(batchAndPages, [
      'sd-batch-and-pages-0-operation',
      'sd-batch-and-pages-0-result',
      'sd-batch-and-pages-1-result',
      'sd-batch-and-pages-2-result',
    ]),
    'phase-placement': withCadence(phasePlacement, [
      'sd-phase-placement-0-operation',
      'sd-phase-placement-1-result',
    ]),
    'cache-compatibility': withCadence(cacheCompatibility, [
      'sd-cache-compatibility-0-operation',
      'sd-cache-compatibility-1-result',
      'sd-cache-compatibility-2-result',
    ]),
    'parallel-placement': withCadence(parallelPlacement, [
      'sd-parallel-placement-0-operation',
      'sd-parallel-placement-0-result',
      'sd-parallel-placement-1-result',
      'sd-parallel-placement-2-result',
    ]),
    'concurrent-claim': withCadence(concurrentClaim, [
      'claim-backlog',
      'claim-question',
      'claim-second',
      'claim-retry',
    ]),
    permissions: withCadence(permissions, [
      'permission-scores',
      'permission-groups',
      'permission-proof',
    ]),
    'acl-freshness': withCadence(aclFreshness, [
      'sd-acl-freshness-0-operation',
      'sd-acl-freshness-0-result',
      'sd-acl-freshness-1-result',
      'sd-acl-freshness-2-result',
    ]),
    'agent-state': withCadence(agentState, ['agent-intent', 'agent-lookup', 'agent-persists']),
    'task-claims': withCadence(taskClaims, [
      'sd-task-claims-0-operation',
      'sd-task-claims-0-result',
      'sd-task-claims-1-result',
      'sd-task-claims-2-result',
    ]),
    'retry-and-cancel': withCadence(retryAndCancel, [
      'sd-retry-and-cancel-0-operation',
      'sd-retry-and-cancel-0-result',
      'sd-retry-and-cancel-1-result',
      'sd-retry-and-cancel-2-result',
    ]),
    'release-gate': withCadence(releaseGateScene, [
      'release-docs',
      'release-cites',
      'release-question',
      'release-recall-gap',
      'release-policy',
    ]),
    'typed-release': withCadence(typedRelease, ['packet-read', 'packet-owner', 'packet-bool']),
    'canary-controller': withCadence(canaryController, [
      'sd-canary-controller-0-operation',
      'sd-canary-controller-1-result',
      'sd-canary-controller-2-result',
    ]),
    'decision-rehearsal': withCadence(decisionRehearsal, [
      'rehearsal-common',
      'rehearsal-change',
      'rehearsal-path',
      'rehearsal-close',
      'rehearsal-metric',
    ]),
    'fresh-boundary': withCadence(freshBoundary, [
      'fresh-work',
      'fresh-age',
      'fresh-packet',
      'fresh-doc-receipt',
    ]),
  },
});

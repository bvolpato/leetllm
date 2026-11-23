import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import opening from './stages/opening.mjs';
import requirementsControl from './stages/requirements-control.mjs';
import contract from './stages/contract.mjs';
import apiReceipt from './stages/api-receipt.mjs';
import memory from './stages/memory.mjs';
import cacheBytes from './stages/cache-bytes.mjs';
import memoryRealization from './stages/memory-realization.mjs';
import demand from './stages/demand.mjs';
import demandSensitivity from './stages/demand-sensitivity.mjs';
import quotaReservation from './stages/quota-reservation.mjs';
import phaseLatency from './stages/phase-latency.mjs';
import batchAndPages from './stages/batch-and-pages.mjs';
import phasePlacement from './stages/phase-placement.mjs';
import cacheCompatibility from './stages/cache-compatibility.mjs';
import parallelPlacement from './stages/parallel-placement.mjs';
import admission from './stages/admission.mjs';
import concurrentClaim from './stages/concurrent-claim.mjs';
import permissions from './stages/permissions.mjs';
import aclFreshness from './stages/acl-freshness.mjs';
import agentState from './stages/agent-state.mjs';
import taskClaims from './stages/task-claims.mjs';
import retryAndCancel from './stages/retry-and-cancel.mjs';
import releaseGateStage from './stages/release-gate.mjs';
import typedRelease from './stages/typed-release.mjs';
import canaryController from './stages/canary-controller.mjs';
import decisionRehearsal from './stages/decision-rehearsal.mjs';
import freshBoundary from './stages/fresh-boundary.mjs';
export {
  admissionSnapshot,
  memoryTrace,
  sampleModel,
  systemCue,
  systemExtensionFrame,
} from './construction.mjs';
export {
  canTransition,
  dualResourceAdmission,
  eligibleDocuments,
  memoryBudget,
  queueAdmission,
  releaseGate,
  retryMode,
  servingSnapshot,
  trafficBudget,
} from './model.mjs';
export { validateModel, validateSystemExtension } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'ai-lab-system-design-interview',
  validateModel,
  scenes: [
    opening,
    admission,
    requirementsControl,
    contract,
    apiReceipt,
    memory,
    cacheBytes,
    memoryRealization,
    demand,
    demandSensitivity,
    quotaReservation,
    phaseLatency,
    batchAndPages,
    phasePlacement,
    cacheCompatibility,
    parallelPlacement,
    concurrentClaim,
    permissions,
    aclFreshness,
    agentState,
    taskClaims,
    retryAndCancel,
    releaseGateStage,
    typedRelease,
    canaryController,
    decisionRehearsal,
    freshBoundary,
  ],
});
export function draw(ctx, scene, state, api) {
  if (definition.scenes.some((stage) => stage.id === scene.id))
    return definition.draw(ctx, scene, state, api);
  throw new Error('unknown system-design scene: ' + scene.id);
}
export default Object.freeze({ ...definition, draw });

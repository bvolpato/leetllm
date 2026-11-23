import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import { drawResources } from './stages/resources.mjs';
import intro from './stages/intro.mjs';
import versionBoundary from './stages/version-boundary.mjs';
import dispatch from './stages/dispatch.mjs';
import layout from './stages/layout.mjs';
import layoutBoundaries from './stages/layout-boundaries.mjs';
import handleLifetime from './stages/handle-lifetime.mjs';
import combineStage from './stages/combine.mjs';
import backwardOperators from './stages/backward-operators.mjs';
import rounding from './stages/rounding.mjs';
import deterministicOrder from './stages/deterministic-order.mjs';
import topology from './stages/topology.mjs';
import visibilityFence from './stages/visibility-fence.mjs';
import backendOwnership from './stages/backend-ownership.mjs';
import logicalReceipts from './stages/logical-receipts.mjs';
import historicalBenchmark from './stages/historical-benchmark.mjs';
import precision from './stages/precision.mjs';
import scaleContract from './stages/scale-contract.mjs';
import events from './stages/events.mjs';
import bufferCapacity from './stages/buffer-capacity.mjs';
import deferredContract from './stages/deferred-contract.mjs';
import redundantExperts from './stages/redundant-experts.mjs';
import resources from './stages/resources.mjs';
import balancedAssumptions from './stages/balanced-assumptions.mjs';
import resourceBudget from './stages/resource-budget.mjs';
import jitColdStart from './stages/jit-cold-start.mjs';
import runtimeIdentity from './stages/runtime-identity.mjs';
import legacyExperimental from './stages/legacy-experimental.mjs';
import engramDoorbell from './stages/engram-doorbell.mjs';
import postTrainingReceipt from './stages/post-training-receipt.mjs';
import ownershipLicense from './stages/ownership-license.mjs';
import sourceDiagnosis from './stages/source-diagnosis.mjs';
import earnedReturn from './stages/earned-return.mjs';
export {
  bf16,
  communicationBudget,
  deferredWaitTrace,
  destinationExpectation,
  redundantGradient,
} from './arithmetic.mjs';
export {
  chapterModel,
  combineTrace,
  dispatchExpansionSnapshot,
  freshDeepEPState,
  sampleModel,
  topologyTrace,
} from './construction.mjs';
export {
  alignedLayout,
  combine,
  completeLayerReceipt,
  expertReturnReceipt,
  ledger,
  resolveAlignedSlot,
  roundTripAligned,
  weightedExpertRow,
} from './model.mjs';
export { validateChapterModel, validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'deep-dive-deepep',
  validateModel,
  scenes: [
    intro,
    versionBoundary,
    dispatch,
    layout,
    layoutBoundaries,
    handleLifetime,
    combineStage,
    backwardOperators,
    rounding,
    deterministicOrder,
    topology,
    visibilityFence,
    backendOwnership,
    logicalReceipts,
    historicalBenchmark,
    precision,
    scaleContract,
    events,
    bufferCapacity,
    deferredContract,
    redundantExperts,
    resources,
    balancedAssumptions,
    resourceBudget,
    jitColdStart,
    runtimeIdentity,
    legacyExperimental,
    engramDoorbell,
    postTrainingReceipt,
    ownershipLicense,
    sourceDiagnosis,
    earnedReturn,
  ],
});
const sceneIds = new Set(definition.scenes.map((scene) => scene.id));
export function draw(ctx, scene, state, api) {
  if (!sceneIds.has(scene.id)) return drawResources(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });

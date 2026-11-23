import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import { drawUnknownAgentScene } from './compatibility.mjs';
import subjectIntroStage from './stages/subject-intro.mjs';
import controlContractStage from './stages/control-contract.mjs';
import stateRecordStage from './stages/state-record.mjs';
import reactLoopStage from './stages/react-loop.mjs';
import reactResearchStage from './stages/react-research.mjs';
import ciPolicyStage from './stages/ci-policy.mjs';
import completionEvidenceStage from './stages/completion-evidence.mjs';
import workflowChoiceStage from './stages/workflow-choice.mjs';
import contextTriangleStage from './stages/context-triangle.mjs';
import cacheAndContextStage from './stages/cache-and-context.mjs';
import taintedInterfaceStage from './stages/tainted-interface.mjs';
import selfConsistencyStage from './stages/self-consistency.mjs';
import reflexionFeedbackStage from './stages/reflexion-feedback.mjs';
import reflexionEvidenceStage from './stages/reflexion-evidence.mjs';
import explicitPlanStage from './stages/explicit-plan.mjs';
import planRuntimeStage from './stages/plan-runtime.mjs';
import criticalPathStage from './stages/critical-path.mjs';
import replanStage from './stages/replan.mjs';
import receiptExpiryStage from './stages/receipt-expiry.mjs';
import consumedVersionsStage from './stages/consumed-versions.mjs';
import routerDispatchStage from './stages/router-dispatch.mjs';
import searchTreeStage from './stages/search-tree.mjs';
import uctConstructionStage from './stages/uct-construction.mjs';
import returnBackupStage from './stages/return-backup.mjs';
import strictToolContractStage from './stages/strict-tool-contract.mjs';
import lostReplyStage from './stages/lost-reply.mjs';
import boundedContextStage from './stages/bounded-context.mjs';
import budgetReservationStage from './stages/budget-reservation.mjs';
import cycleAndProgressStage from './stages/cycle-and-progress.mjs';
import incidentRecoveryStage from './stages/incident-recovery.mjs';
import durableSessionStage from './stages/durable-session.mjs';
import architectureEvaluationStage from './stages/architecture-evaluation.mjs';
import transferStage from './stages/transfer.mjs';
import freshItineraryStage from './stages/fresh-itinerary.mjs';
export { AGENT_DAG, BUS_ROUTE, VISIT_HOURS } from './fixtures.mjs';
export { contextLedger, submittedTokens, uctRows } from './arithmetic.mjs';
export {
  changedItinerary,
  nextAction,
  planSnapshot,
  reactTrace,
  ready,
  recommendationState,
  replanSnapshot,
  visitSchedule,
} from './model.mjs';
export {
  approvalReplay,
  canonicalAgentAction,
  dependencyState,
  periodicWithoutProgress,
  recoveryVerdict,
} from './protocols.mjs';
export { validateAgentConstruction, validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'agent-architectures',
  validateModel,
  scenes: [
    subjectIntroStage,
    controlContractStage,
    stateRecordStage,
    reactLoopStage,
    reactResearchStage,
    ciPolicyStage,
    completionEvidenceStage,
    workflowChoiceStage,
    contextTriangleStage,
    cacheAndContextStage,
    taintedInterfaceStage,
    selfConsistencyStage,
    reflexionFeedbackStage,
    reflexionEvidenceStage,
    explicitPlanStage,
    planRuntimeStage,
    criticalPathStage,
    replanStage,
    receiptExpiryStage,
    consumedVersionsStage,
    routerDispatchStage,
    searchTreeStage,
    uctConstructionStage,
    returnBackupStage,
    strictToolContractStage,
    lostReplyStage,
    boundedContextStage,
    budgetReservationStage,
    cycleAndProgressStage,
    incidentRecoveryStage,
    durableSessionStage,
    architectureEvaluationStage,
    transferStage,
    freshItineraryStage,
  ],
});
const stageDraws = new Map(definition.scenes.map((stage) => [stage.id, stage.draw]));
export function draw(ctx, scene, state, api) {
  const painter = stageDraws.get(scene.id);
  return painter ? painter(ctx, scene, state, api) : drawUnknownAgentScene(ctx, scene, state, api);
}
export default Object.freeze({
  ...definition,
  draw,
});

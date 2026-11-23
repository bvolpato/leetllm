import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import { drawUnknownContextScene } from './compatibility.mjs';
import introStage from './stages/intro.mjs';
import capacityAndEvidenceStage from './stages/capacity-and-evidence.mjs';
import failureInterventionsStage from './stages/failure-interventions.mjs';
import writeStage from './stages/write.mjs';
import verifiedNoteStateStage from './stages/verified-note-state.mjs';
import selectStage from './stages/select.mjs';
import phaseIntersectionStage from './stages/phase-intersection.mjs';
import prefixOrderStage from './stages/prefix-order.mjs';
import cacheCostScopeStage from './stages/cache-cost-scope.mjs';
import compressStage from './stages/compress.mjs';
import pruneCutoffStage from './stages/prune-cutoff.mjs';
import summaryAuthorityStage from './stages/summary-authority.mjs';
import isolateStage from './stages/isolate.mjs';
import strictHandoffStage from './stages/strict-handoff.mjs';
import assignedLedgerStage from './stages/assigned-ledger.mjs';
import requiredPackerStage from './stages/required-packer.mjs';
import packerLimitsStage from './stages/packer-limits.mjs';
import thrashBudgetStage from './stages/thrash-budget.mjs';
import skillsDisclosureStage from './stages/skills-disclosure.mjs';
import skillRoutingAndSafetyStage from './stages/skill-routing-and-safety.mjs';
import resumeStage from './stages/resume.mjs';
import resumeArtifactsStage from './stages/resume-artifacts.mjs';
import receiptValidationStage from './stages/receipt-validation.mjs';
import recoveryAndEvaluatorStage from './stages/recovery-and-evaluator.mjs';
import evaluateStage from './stages/evaluate.mjs';
import completeReleaseGateStage from './stages/complete-release-gate.mjs';
import synthesisStage from './stages/synthesis.mjs';
import earnedContextStage from './stages/earned-context.mjs';
export {
  COMPLETE_CONTEXT_SCENES,
  COMPLETE_TOOL_POLICY,
  CONTEXT_FRESH,
  CONTEXT_RELEASE_CASES,
  CONTEXT_REQUIRED,
  TRACE_EXCHANGE,
  sources,
} from './fixtures.mjs';
export {
  commonContextPrefix,
  compressionStage,
  contextPrefixExample,
  contextRelease,
  pruneContextResults,
  requiredPacking,
} from './arithmetic.mjs';
export { completeWorkerBoundary, verifyHandoff } from './handoff.mjs';
export {
  completeResume,
  contextFreshResumeFixture,
  contextOperationLedger,
  contextResumeFixture,
  verifyReceipt,
} from './recovery.mjs';
export {
  completeToolIntersection,
  evaluatePacket,
  findings,
  recoverySnapshot,
  sampleModel,
  selectTools,
} from './model.mjs';
export { freshContextState } from './construction.mjs';
export { validateCompleteModel, validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'context-engineering',
  validateModel,
  scenes: [
    introStage,
    capacityAndEvidenceStage,
    failureInterventionsStage,
    writeStage,
    verifiedNoteStateStage,
    selectStage,
    phaseIntersectionStage,
    prefixOrderStage,
    cacheCostScopeStage,
    compressStage,
    pruneCutoffStage,
    summaryAuthorityStage,
    isolateStage,
    strictHandoffStage,
    assignedLedgerStage,
    requiredPackerStage,
    packerLimitsStage,
    thrashBudgetStage,
    skillsDisclosureStage,
    skillRoutingAndSafetyStage,
    resumeStage,
    resumeArtifactsStage,
    receiptValidationStage,
    recoveryAndEvaluatorStage,
    evaluateStage,
    completeReleaseGateStage,
    synthesisStage,
    earnedContextStage,
  ],
});
const stageDraws = new Map(definition.scenes.map((stage) => [stage.id, stage.draw]));
export function draw(ctx, scene, state, api) {
  const painter = stageDraws.get(scene.id);
  return painter
    ? painter(ctx, scene, state, api)
    : drawUnknownContextScene(ctx, scene, state, api);
}
export default Object.freeze({
  ...definition,
  draw,
});

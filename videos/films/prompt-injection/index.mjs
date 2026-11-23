import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import { drawUnknownPromptScene } from './compatibility.mjs';
import subjectIntroStage from './stages/subject-intro.mjs';
import entryAndObjectiveStage from './stages/entry-and-objective.mjs';
import separateHarmsStage from './stages/separate-harms.mjs';
import trustLabelsStage from './stages/trust-labels.mjs';
import wrapperCharactersStage from './stages/wrapper-characters.mjs';
import promptVsCapabilityStage from './stages/prompt-vs-capability.mjs';
import readerQuarantineStage from './stages/reader-quarantine.mjs';
import typedEvidenceStage from './stages/typed-evidence.mjs';
import schemaFalsehoodStage from './stages/schema-falsehood.mjs';
import selectorFeedbackStage from './stages/selector-feedback.mjs';
import strictProposalStage from './stages/strict-proposal.mjs';
import hostPolicyStage from './stages/host-policy.mjs';
import approvalBindingsStage from './stages/approval-bindings.mjs';
import reserveAndReconcileStage from './stages/reserve-and-reconcile.mjs';
import protectedSinksStage from './stages/protected-sinks.mjs';
import outboundContractStage from './stages/outbound-contract.mjs';
import canaryBufferStage from './stages/canary-buffer.mjs';
import layeredSignalsStage from './stages/layered-signals.mjs';
import detectorScopeStage from './stages/detector-scope.mjs';
import attackEvaluationStage from './stages/attack-evaluation.mjs';
import effectDenominatorsStage from './stages/effect-denominators.mjs';
import uncertaintyGateStage from './stages/uncertainty-gate.mjs';
import supportAndUtilityStage from './stages/support-and-utility.mjs';
import cachePrincipalStage from './stages/cache-principal.mjs';
import poisonedMemoryStage from './stages/poisoned-memory.mjs';
import reviewAndRetentionStage from './stages/review-and-retention.mjs';
import transferStage from './stages/transfer.mjs';
import freshAuthorityStage from './stages/fresh-authority.mjs';
export { CASES, PROPOSAL, REFUSAL_EVENTS, REPORT, TRUSTED } from './fixtures.mjs';
export { wilsonBounds } from './arithmetic.mjs';
export {
  disclosureAllowed,
  escapeWrapperText,
  exactApprovalDecision,
  freshAuthorityDecision,
  linkResourceAllowed,
  localPromotionCases,
  promotionAllowed,
  promotionTrace,
  refusalTraceSnapshot,
  reportEligibility,
  simulateCase,
  typedEvidenceDecision,
  validProposal,
  validateDecodedAction,
} from './model.mjs';
export { DETECTOR_EXAMPLES, RESULTS } from './observations.mjs';
export { promptCueSnapshot } from './construction.mjs';
export { validateModel, validatePromptConstructions } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'prompt-injection',
  validateModel,
  scenes: [
    subjectIntroStage,
    entryAndObjectiveStage,
    separateHarmsStage,
    trustLabelsStage,
    wrapperCharactersStage,
    promptVsCapabilityStage,
    readerQuarantineStage,
    typedEvidenceStage,
    schemaFalsehoodStage,
    selectorFeedbackStage,
    strictProposalStage,
    hostPolicyStage,
    approvalBindingsStage,
    reserveAndReconcileStage,
    protectedSinksStage,
    outboundContractStage,
    canaryBufferStage,
    layeredSignalsStage,
    detectorScopeStage,
    attackEvaluationStage,
    effectDenominatorsStage,
    uncertaintyGateStage,
    supportAndUtilityStage,
    cachePrincipalStage,
    poisonedMemoryStage,
    reviewAndRetentionStage,
    transferStage,
    freshAuthorityStage,
  ],
});
const stageDraws = new Map(definition.scenes.map((stage) => [stage.id, stage.draw]));
export function draw(ctx, scene, state, api) {
  const painter = stageDraws.get(scene.id);
  return painter ? painter(ctx, scene, state, api) : drawUnknownPromptScene(ctx, scene, state, api);
}
export default Object.freeze({
  ...definition,
  draw,
});

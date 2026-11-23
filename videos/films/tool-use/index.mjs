import { drawUnrecognizedScene } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import subjectIntro from './stages/subject-intro.mjs';
import releaseObservation from './stages/release-observation.mjs';
import requestEnvelope from './stages/request-envelope.mjs';
import providerLinkage from './stages/provider-linkage.mjs';
import completeBatch from './stages/complete-batch.mjs';
import schemaValidation from './stages/schema-validation.mjs';
import strictContract from './stages/strict-contract.mjs';
import toolChoice from './stages/tool-choice.mjs';
import authorization from './stages/authorization.mjs';
import scopedRead from './stages/scoped-read.mjs';
import observationLoop from './stages/observation-loop.mjs';
import sameSuiteReader from './stages/same-suite-reader.mjs';
import writeGate from './stages/write-gate.mjs';
import promotionPolicy from './stages/promotion-policy.mjs';
import retryIdentity from './stages/retry-identity.mjs';
import intentLedger from './stages/intent-ledger.mjs';
import parameterBoundaries from './stages/parameter-boundaries.mjs';
import errorClasses from './stages/error-classes.mjs';
import repeatedProposal from './stages/repeated-proposal.mjs';
import requiredFanIn from './stages/required-fan-in.mjs';
import permissionBeforeRanking from './stages/permission-before-ranking.mjs';
import deferredDefinitions from './stages/deferred-definitions.mjs';
import trajectoryContract from './stages/trajectory-contract.mjs';
import typedReleaseEvidence from './stages/typed-release-evidence.mjs';
import mcpIntegration from './stages/mcp-integration.mjs';
import mcpExposure from './stages/mcp-exposure.mjs';
import transfer from './stages/transfer.mjs';
import freshComparison from './stages/fresh-comparison.mjs';
export { proposalFingerprint, safeToolCosine } from './arithmetic.mjs';
export {
  budgetSnapshot,
  envelopeSnapshot,
  observationSnapshot,
  retrySnapshot,
  writeGateSnapshot,
} from './construction.mjs';
export { TOOL_GOOD_TRACE, TOOL_RECEIPTS, operationService } from './fixtures.mjs';
export {
  authorize,
  dispatchReaderEvaluation,
  parseUniqueToolJson,
  permittedToolRanking,
  releaseCall,
  releasePromotionTarget,
  requiredToolComparison,
  sameSuiteToolComparison,
  scopedReleaseRead,
  scoreToolTrajectory,
  strictReleaseArguments,
  typedToolRelease,
  validArgs,
  validatedReleaseCalls,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'tool-use',
  validateModel,
  scenes: [
    subjectIntro,
    releaseObservation,
    requestEnvelope,
    providerLinkage,
    completeBatch,
    schemaValidation,
    strictContract,
    toolChoice,
    authorization,
    scopedRead,
    observationLoop,
    sameSuiteReader,
    writeGate,
    promotionPolicy,
    retryIdentity,
    intentLedger,
    parameterBoundaries,
    errorClasses,
    repeatedProposal,
    requiredFanIn,
    permissionBeforeRanking,
    deferredDefinitions,
    trajectoryContract,
    typedReleaseEvidence,
    mcpIntegration,
    mcpExposure,
    transfer,
    freshComparison,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((stage) => stage.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });

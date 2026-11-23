import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import introStage from './stages/intro.mjs';
import workflowStage from './stages/workflow.mjs';
import legalScopeStage from './stages/legal-scope.mjs';
import prohibitedPracticesStage from './stages/prohibited-practices.mjs';
import highRiskBranchesStage from './stages/high-risk-branches.mjs';
import gpaiLayerStage from './stages/gpai-layer.mjs';
import datedObligationsStage from './stages/dated-obligations.mjs';
import ownershipStage from './stages/ownership.mjs';
import evaluationIntegrityStage from './stages/evaluation-integrity.mjs';
import resultsStage from './stages/results.mjs';
import slicesStage from './stages/slices.mjs';
import auditStage from './stages/audit.mjs';
import replayPrivacyStage from './stages/replay-privacy.mjs';
import oversightStage from './stages/oversight.mjs';
import appealReplayStage from './stages/appeal-replay.mjs';
import packageStage from './stages/package.mjs';
import earnedTransferStage from './stages/earned-transfer.mjs';
export { governancePermission } from './construction.mjs';
export { governanceConstructionCues, governancePermissions } from './fixtures.mjs';
export {
  actorLabel,
  appealReplayFixture,
  auditSnapshot,
  chain,
  classificationFixture,
  evaluate,
  oversight,
  ownershipSnapshot,
  packageDecision,
  productCase,
  requiredReviews,
  riskErrors,
  sampleModel,
  scopeChangeFixture,
  triage,
  verify,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'responsible-ai-governance-ethics-compliance',
  validateModel,
  scenes: [
    introStage,
    workflowStage,
    legalScopeStage,
    prohibitedPracticesStage,
    highRiskBranchesStage,
    gpaiLayerStage,
    datedObligationsStage,
    ownershipStage,
    evaluationIntegrityStage,
    resultsStage,
    slicesStage,
    auditStage,
    replayPrivacyStage,
    oversightStage,
    appealReplayStage,
    packageStage,
    earnedTransferStage,
  ],
});
export const draw = definition.draw;
export default definition;

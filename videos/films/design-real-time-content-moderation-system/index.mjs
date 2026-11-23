import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import { drawUnrecognizedScene } from './compatibility.mjs';
import introStage from './stages/intro.mjs';
import surfacesStage from './stages/surfaces.mjs';
import reviewIntakeStage from './stages/review-intake.mjs';
import cascadeStage from './stages/cascade.mjs';
import capacityLedgerStage from './stages/capacity-ledger.mjs';
import categoriesStage from './stages/categories.mjs';
import judgeContractStage from './stages/judge-contract.mjs';
import modalityContractStage from './stages/modality-contract.mjs';
import videoEvidenceStage from './stages/video-evidence.mjs';
import fusionBoundaryStage from './stages/fusion-boundary.mjs';
import policyReleaseStage from './stages/policy-release.mjs';
import providerMigrationStage from './stages/provider-migration.mjs';
import batchingStage from './stages/batching.mjs';
import batchWorkStage from './stages/batch-work.mjs';
import batchEdgeStage from './stages/batch-edge.mjs';
import overloadStage from './stages/overload.mjs';
import ratesStage from './stages/rates.mjs';
import regionalAuthorityStage from './stages/regional-authority.mjs';
import evidenceScopeStage from './stages/evidence-scope.mjs';
import revisionsStage from './stages/revisions.mjs';
import decisionCacheStage from './stages/decision-cache.mjs';
import commitBindingStage from './stages/commit-binding.mjs';
import appealLabelsStage from './stages/appeal-labels.mjs';
import synthesisStage from './stages/synthesis.mjs';
import freshModerationStage from './stages/fresh-moderation.mjs';
export {
  applyResult,
  boundDecision,
  decide,
  exampleDecision,
  fusionResult,
  moderationPopulation,
  queue,
  sampleModel,
  selectedLuminance,
  sensitiveAdmission,
} from './model.mjs';
export {
  batches,
  batchingClock,
  cascadeSnapshot,
  categorySnapshot,
  revisionPresentation,
  revisionTrace,
} from './construction.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'design-real-time-content-moderation-system',
  validateModel,
  scenes: [
    introStage,
    surfacesStage,
    reviewIntakeStage,
    cascadeStage,
    capacityLedgerStage,
    categoriesStage,
    judgeContractStage,
    modalityContractStage,
    videoEvidenceStage,
    fusionBoundaryStage,
    policyReleaseStage,
    providerMigrationStage,
    batchingStage,
    batchWorkStage,
    batchEdgeStage,
    overloadStage,
    ratesStage,
    regionalAuthorityStage,
    evidenceScopeStage,
    revisionsStage,
    decisionCacheStage,
    commitBindingStage,
    appealLabelsStage,
    synthesisStage,
    freshModerationStage,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((s) => s.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({
  ...definition,
  draw,
});

import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import introStage from './stages/intro.mjs';
import sharingContractStage from './stages/sharing-contract.mjs';
import streamClocksStage from './stages/stream-clocks.mjs';
import goodputContractStage from './stages/goodput-contract.mjs';
import identityStage from './stages/identity.mjs';
import trustedEnvelopeStage from './stages/trusted-envelope.mjs';
import admissionDimensionsStage from './stages/admission-dimensions.mjs';
import quotaStage from './stages/quota.mjs';
import admissionRaceStage from './stages/admission-race.mjs';
import idempotencyBindingStage from './stages/idempotency-binding.mjs';
import dispatchCommitStage from './stages/dispatch-commit.mjs';
import pagesStage from './stages/pages.mjs';
import kvByteShapeStage from './stages/kv-byte-shape.mjs';
import kvGrowthStage from './stages/kv-growth.mjs';
import physicalReferencesStage from './stages/physical-references.mjs';
import remoteKvStage from './stages/remote-kv.mjs';
import fairnessStage from './stages/fairness.mjs';
import iterationBoundaryStage from './stages/iteration-boundary.mjs';
import workCostStage from './stages/work-cost.mjs';
import extraWorkStage from './stages/extra-work.mjs';
import cacheStage from './stages/cache.mjs';
import adapterRevisionsStage from './stages/adapter-revisions.mjs';
import readerBeforeRankingStage from './stages/reader-before-ranking.mjs';
import prefixTrustStage from './stages/prefix-trust.mjs';
import runtimeTrustStage from './stages/runtime-trust.mjs';
import costStage from './stages/cost.mjs';
import usageAndBillStage from './stages/usage-and-bill.mjs';
import recoveryStage from './stages/recovery.mjs';
import rolloutAndStreamsStage from './stages/rollout-and-streams.mjs';
import incidentEvidenceStage from './stages/incident-evidence.mjs';
import freshDesignGateStage from './stages/fresh-design-gate.mjs';
import boundaryCloseStage from './stages/boundary-close.mjs';
export { deficit, deficitPlayback, quota, reserveWholePages } from './arithmetic.mjs';
export { MULTITENANT_REQUESTS } from './fixtures.mjs';
export {
  applyQuotaCompletion,
  reconcileRecovery,
  recoveryCompletionEvidence,
  recoveryRetryDecision,
} from './protocols.mjs';
export { multiTenantConstructionModel } from './model.mjs';
export { sampleModel } from './observations.mjs';
export { validateConstructionModel, validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'design-multi-tenant-llm-serving-platform',
  validateModel,
  scenes: [
    introStage,
    sharingContractStage,
    streamClocksStage,
    goodputContractStage,
    identityStage,
    trustedEnvelopeStage,
    admissionDimensionsStage,
    quotaStage,
    admissionRaceStage,
    idempotencyBindingStage,
    dispatchCommitStage,
    pagesStage,
    kvByteShapeStage,
    kvGrowthStage,
    physicalReferencesStage,
    remoteKvStage,
    fairnessStage,
    iterationBoundaryStage,
    workCostStage,
    extraWorkStage,
    cacheStage,
    adapterRevisionsStage,
    readerBeforeRankingStage,
    prefixTrustStage,
    runtimeTrustStage,
    costStage,
    usageAndBillStage,
    recoveryStage,
    rolloutAndStreamsStage,
    incidentEvidenceStage,
    freshDesignGateStage,
    boundaryCloseStage,
  ],
});
const stageDraws = new Map(definition.scenes.map((stage) => [stage.id, stage.draw]));
export function draw(ctx, scene, state, api) {
  const painter = stageDraws.get(scene.id);
  return painter
    ? painter(ctx, scene, state, api)
    : costStage.draw(ctx, scene, state, api, scene.id);
}
export default Object.freeze({ ...definition, draw });

import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import introStage from './stages/intro.mjs';
import versionContractStage from './stages/version-contract.mjs';
import projectLineageStage from './stages/project-lineage.mjs';
import seamsRecordStage from './stages/seams-record.mjs';
import generatorRuntimeStage from './stages/generator-runtime.mjs';
import masksStage from './stages/masks.mjs';
import tokenBoundaryStage from './stages/token-boundary.mjs';
import rewardEndpointsStage from './stages/reward-endpoints.mjs';
import trainerPassStage from './stages/trainer-pass.mjs';
import groupStage from './stages/group.mjs';
import policyRatioStage from './stages/policy-ratio.mjs';
import rewardNormalizationStage from './stages/reward-normalization.mjs';
import schedulesStage from './stages/schedules.mjs';
import scheduleComparisonStage from './stages/schedule-comparison.mjs';
import admissionMathStage from './stages/admission-math.mjs';
import capacityStage from './stages/capacity.mjs';
import probabilityProvenanceStage from './stages/probability-provenance.mjs';
import filterStage from './stages/filter.mjs';
import zeroVariancePolicyStage from './stages/zero-variance-policy.mjs';
import epochExhaustionStage from './stages/epoch-exhaustion.mjs';
import configContractStage from './stages/config-contract.mjs';
import routingSessionStage from './stages/routing-session.mjs';
import transferStagesStage from './stages/transfer-stages.mjs';
import replicasStage from './stages/replicas.mjs';
import cacheRecomputeStage from './stages/cache-recompute.mjs';
import tinkerFuturesStage from './stages/tinker-futures.mjs';
import lossConversionStage from './stages/loss-conversion.mjs';
import researchSnapshotStage from './stages/research-snapshot.mjs';
import sourceDiagnosisStage from './stages/source-diagnosis.mjs';
import operatorGatesStage from './stages/operator-gates.mjs';
import synthesisStage from './stages/synthesis.mjs';
import checkpointStateStage from './stages/checkpoint-state.mjs';
import earnedHandoffStage from './stages/earned-handoff.mjs';
export {
  actionMeanNll,
  admissionReceipt,
  advantages,
  criticPairGate,
  fleetReady,
  liveRewardDecision,
  maskedNll,
  normalizedClip,
  ppoReceipt,
  scalarResume,
  stampTurnRewards,
  stickyReplica,
} from './arithmetic.mjs';
export { counterTransition, restoreProbe, sampleModel, skyChapterModel } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'deep-dive-skyrl',
  validateModel,
  scenes: [
    introStage,
    seamsRecordStage,
    versionContractStage,
    generatorRuntimeStage,
    masksStage,
    tokenBoundaryStage,
    rewardEndpointsStage,
    trainerPassStage,
    groupStage,
    policyRatioStage,
    rewardNormalizationStage,
    schedulesStage,
    scheduleComparisonStage,
    admissionMathStage,
    capacityStage,
    probabilityProvenanceStage,
    filterStage,
    zeroVariancePolicyStage,
    epochExhaustionStage,
    configContractStage,
    routingSessionStage,
    transferStagesStage,
    replicasStage,
    cacheRecomputeStage,
    tinkerFuturesStage,
    lossConversionStage,
    projectLineageStage,
    researchSnapshotStage,
    sourceDiagnosisStage,
    operatorGatesStage,
    synthesisStage,
    checkpointStateStage,
    earnedHandoffStage,
  ],
});
const stageDraws = new Map(definition.scenes.map((stage) => [stage.id, stage.draw]));
export function draw(ctx, scene, state, api) {
  const painter = stageDraws.get(scene.id);
  return painter
    ? painter(ctx, scene, state, api)
    : synthesisStage.draw(ctx, scene, state, api, scene.id);
}
export default Object.freeze({ ...definition, draw });

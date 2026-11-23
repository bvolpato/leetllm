import { drawUnrecognizedScene } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import opening from './stages/opening.mjs';
import caseContract from './stages/case-contract.mjs';
import patches from './stages/patches.mjs';
import decodedBudget from './stages/decoded-budget.mjs';
import encoderDirections from './stages/encoder-directions.mjs';
import connector from './stages/connector.mjs';
import multiBlockInterface from './stages/multi-block-interface.mjs';
import routes from './stages/routes.mjs';
import budget from './stages/budget.mjs';
import scoreWork from './stages/score-work.mjs';
import attention from './stages/attention.mjs';
import zeroInsertion from './stages/zero-insertion.mjs';
import trainingStages from './stages/training-stages.mjs';
import jointAndPosttraining from './stages/joint-and-posttraining.mjs';
import adaptiveCrops from './stages/adaptive-crops.mjs';
import audioClock from './stages/audio-clock.mjs';
import evidenceTime from './stages/evidence-time.mjs';
import artifactLineage from './stages/artifact-lineage.mjs';
import cacheLifetime from './stages/cache-lifetime.mjs';
import cacheBytes from './stages/cache-bytes.mjs';
import readyRecovery from './stages/ready-recovery.mjs';
import safetyBoundary from './stages/safety-boundary.mjs';
import diagnosisRelease from './stages/diagnosis-release.mjs';
import routeChoice from './stages/route-choice.mjs';
import closing from './stages/closing.mjs';
import freshIncident from './stages/fresh-incident.mjs';
export { attentionConstruction, budgetSnapshot, freshIncidentState } from './construction.mjs';
export {
  CONTEXT_LIMIT,
  DASHBOARD,
  IMAGE_224,
  IMAGE_336,
  MAX_PREFIX,
  OUTPUT_RESERVE,
  PATCH_SIZE,
  TEXT_TOKENS,
  VIEWS,
  VISUAL_TOKENS_224,
  VISUAL_TOKENS_336,
} from './fixtures.mjs';
export {
  cacheWorkAt,
  chartEvidence,
  cropSelection,
  crossAttentionFixture,
  eventOrder,
  fusionScoreFixture,
  multimodalReservation,
  prefixPlan,
  releaseBlockers,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'multimodal-fusion',
  validateModel,
  scenes: [
    opening,
    caseContract,
    patches,
    decodedBudget,
    encoderDirections,
    connector,
    multiBlockInterface,
    routes,
    budget,
    scoreWork,
    attention,
    zeroInsertion,
    trainingStages,
    jointAndPosttraining,
    adaptiveCrops,
    audioClock,
    evidenceTime,
    artifactLineage,
    cacheLifetime,
    cacheBytes,
    readyRecovery,
    safetyBoundary,
    diagnosisRelease,
    routeChoice,
    closing,
    freshIncident,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((s) => s.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });

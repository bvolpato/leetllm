import { drawUnknownDiffusionScene } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import introStage from './stages/intro.mjs';
import productLanesStage from './stages/product-lanes.mjs';
import forwardStage from './stages/forward.mjs';
import coefficientsStage from './stages/coefficients.mjs';
import forwardScheduleStage from './stages/forward-schedule.mjs';
import trainingStage from './stages/training.mjs';
import reversePosteriorStage from './stages/reverse-posterior.mjs';
import trainingTargetsStage from './stages/training-targets.mjs';
import reverseStage from './stages/reverse.mjs';
import reverseTraceStage from './stages/reverse-trace.mjs';
import scoreStage from './stages/score.mjs';
import transportStage from './stages/transport.mjs';
import samplersStage from './stages/samplers.mjs';
import ddimContractStage from './stages/ddim-contract.mjs';
import architecturesStage from './stages/architectures.mjs';
import timeConditioningStage from './stages/time-conditioning.mjs';
import flowPathsStage from './stages/flow-paths.mjs';
import conditioningStage from './stages/conditioning.mjs';
import crossReadStage from './stages/cross-read.mjs';
import guidanceStage from './stages/guidance.mjs';
import cfgTrainingStage from './stages/cfg-training.mjs';
import cfgApiStage from './stages/cfg-api.mjs';
import latentStage from './stages/latent.mjs';
import latentContractStage from './stages/latent-contract.mjs';
import textCanvasStage from './stages/text-canvas.mjs';
import gemmaSystemStage from './stages/gemma-system.mjs';
import controlsFastStage from './stages/controls-fast.mjs';
import computeStage from './stages/compute.mjs';
import reproducibilityStage from './stages/reproducibility.mjs';
import publicationStage from './stages/publication.mjs';
import releaseEvidenceStage from './stages/release-evidence.mjs';
import recapStage from './stages/recap.mjs';
import freshReleaseStage from './stages/fresh-release.mjs';
export { forwardValue, mixture, probabilityFlowStep } from './arithmetic.mjs';
export { reverseSampleProgress } from './construction.mjs';
export {
  crossReadFixture,
  freshDiffusionSnapshot,
  posteriorFixture,
  scalarReverseTrace,
  scoreProbe,
  trajectoryPoint,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'diffusion',
  validateModel,
  scenes: [
    introStage,
    forwardStage,
    coefficientsStage,
    forwardScheduleStage,
    trainingStage,
    reversePosteriorStage,
    trainingTargetsStage,
    reverseStage,
    reverseTraceStage,
    scoreStage,
    transportStage,
    samplersStage,
    ddimContractStage,
    architecturesStage,
    timeConditioningStage,
    flowPathsStage,
    conditioningStage,
    crossReadStage,
    guidanceStage,
    cfgTrainingStage,
    cfgApiStage,
    latentStage,
    latentContractStage,
    textCanvasStage,
    gemmaSystemStage,
    controlsFastStage,
    computeStage,
    productLanesStage,
    reproducibilityStage,
    publicationStage,
    releaseEvidenceStage,
    freshReleaseStage,
    recapStage,
  ],
});
const stageDraws = new Map(definition.scenes.map((stage) => [stage.id, stage.draw]));
export function draw(ctx, scene, state, api) {
  return api.focus.target('df-' + scene.id + '-operation', () => {
    const painter = stageDraws.get(scene.id);
    return painter
      ? painter(ctx, scene, state, api)
      : drawUnknownDiffusionScene(ctx, scene, state, api);
  });
}
export default Object.freeze({ ...definition, draw });

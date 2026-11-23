import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import introStage from './stages/intro.mjs';
import evidenceContractStage from './stages/evidence-contract.mjs';
import labelsStage from './stages/labels.mjs';
import groupsStage from './stages/groups.mjs';
import manifestIdentityStage from './stages/manifest-identity.mjs';
import typedInputsStage from './stages/typed-inputs.mjs';
import qualityStage from './stages/quality.mjs';
import focusStencilStage from './stages/focus-stencil.mjs';
import contrastInterventionStage from './stages/contrast-intervention.mjs';
import exposureDetailStage from './stages/exposure-detail.mjs';
import orderedRouterStage from './stages/ordered-router.mjs';
import thresholdStage from './stages/threshold.mjs';
import developmentThresholdStage from './stages/development-threshold.mjs';
import preprocessStage from './stages/preprocess.mjs';
import transformBundleStage from './stages/transform-bundle.mjs';
import representationChoiceStage from './stages/representation-choice.mjs';
import headForwardStage from './stages/head-forward.mjs';
import headUpdateStage from './stages/head-update.mjs';
import maskedCategoriesStage from './stages/masked-categories.mjs';
import calibrationQualityStage from './stages/calibration-quality.mjs';
import bundleReplayStage from './stages/bundle-replay.mjs';
import outcomesStage from './stages/outcomes.mjs';
import outcomeClockStage from './stages/outcome-clock.mjs';
import caseReducerStage from './stages/case-reducer.mjs';
import missingEvidenceStage from './stages/missing-evidence.mjs';
import sourceSlicesStage from './stages/source-slices.mjs';
import receiptBoundaryStage from './stages/receipt-boundary.mjs';
import monitoringResponseStage from './stages/monitoring-response.mjs';
import synthesisStage from './stages/synthesis.mjs';
import freshParcelStage from './stages/fresh-parcel.mjs';
export {
  confusion,
  cropSnapshot,
  parcelGeometry,
  route,
  visionCaseAction,
  visionFresh,
  visionHead,
  visionJoin,
  visionMasked,
  visionReplay,
  visionRoute,
  visionStencil,
  visionThreshold,
} from './arithmetic.mjs';
export { sampleModel, validateModel, visionFrame } from './model.mjs';
const orderedDefinition = defineCanvasLesson({
  id: 'capstone-damaged-package-vision-classifier',
  validateModel,
  scenes: [
    introStage,
    evidenceContractStage,
    labelsStage,
    groupsStage,
    manifestIdentityStage,
    typedInputsStage,
    qualityStage,
    focusStencilStage,
    contrastInterventionStage,
    exposureDetailStage,
    orderedRouterStage,
    thresholdStage,
    developmentThresholdStage,
    preprocessStage,
    transformBundleStage,
    representationChoiceStage,
    headForwardStage,
    headUpdateStage,
    maskedCategoriesStage,
    calibrationQualityStage,
    bundleReplayStage,
    outcomesStage,
    outcomeClockStage,
    caseReducerStage,
    missingEvidenceStage,
    sourceSlicesStage,
    receiptBoundaryStage,
    monitoringResponseStage,
    synthesisStage,
    freshParcelStage,
  ],
});
const stages = new Map([
  ['intro', introStage],
  ['evidence-contract', evidenceContractStage],
  ['labels', labelsStage],
  ['groups', groupsStage],
  ['manifest-identity', manifestIdentityStage],
  ['typed-inputs', typedInputsStage],
  ['quality', qualityStage],
  ['focus-stencil', focusStencilStage],
  ['contrast-intervention', contrastInterventionStage],
  ['exposure-detail', exposureDetailStage],
  ['ordered-router', orderedRouterStage],
  ['threshold', thresholdStage],
  ['development-threshold', developmentThresholdStage],
  ['preprocess', preprocessStage],
  ['transform-bundle', transformBundleStage],
  ['representation-choice', representationChoiceStage],
  ['head-forward', headForwardStage],
  ['head-update', headUpdateStage],
  ['masked-categories', maskedCategoriesStage],
  ['calibration-quality', calibrationQualityStage],
  ['bundle-replay', bundleReplayStage],
  ['outcomes', outcomesStage],
  ['outcome-clock', outcomeClockStage],
  ['case-reducer', caseReducerStage],
  ['missing-evidence', missingEvidenceStage],
  ['source-slices', sourceSlicesStage],
  ['receipt-boundary', receiptBoundaryStage],
  ['monitoring-response', monitoringResponseStage],
  ['synthesis', synthesisStage],
  ['fresh-parcel', freshParcelStage],
]);
export function draw(ctx, scene, state, api) {
  const stage = stages.get(scene.id) ?? synthesisStage;
  return stage.draw(ctx, scene, state, api);
}
export default Object.freeze({
  ...orderedDefinition,
  draw,
});

import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import { preserveUnknownPrelude } from './compatibility.mjs';
import introStage from './stages/intro.mjs';
import decisionTimeStage from './stages/decision-time.mjs';
import temporalContractStage from './stages/temporal-contract.mjs';
import numericalScaleStage from './stages/numerical-scale.mjs';
import runningStatisticsStage from './stages/running-statistics.mjs';
import scaleArtifactStage from './stages/scale-artifact.mjs';
import missingnessStage from './stages/missingness.mjs';
import categoriesStage from './stages/categories.mjs';
import categoryContractStage from './stages/category-contract.mjs';
import crossfitConstructionStage from './stages/crossfit-construction.mjs';
import maturedEncodingStage from './stages/matured-encoding.mjs';
import contractStage from './stages/contract.mjs';
import rowValidationStage from './stages/row-validation.mjs';
import vectorConstructionStage from './stages/vector-construction.mjs';
import preprocessingChangeStage from './stages/preprocessing-change.mjs';
import parityStage from './stages/parity.mjs';
import parityCalculationStage from './stages/parity-calculation.mjs';
import storeAndFreshnessStage from './stages/store-and-freshness.mjs';
import wrapStage from './stages/wrap.mjs';
import earnedFeatureTransferStage from './stages/earned-feature-transfer.mjs';
export { featureNames, featureWeights, freshFeatureEvents } from './fixtures.mjs';
export { heartbeatAge } from './arithmetic.mjs';
export { scaleRows } from './construction.mjs';
export {
  allowedTargetMean,
  eligibleFeatureEvent,
  featureFrame,
  featureSum,
  featureTransfer,
  featureVector,
  lagRoute,
  preprocessingState,
  scalingSnapshot,
  targetEncodingFrame,
  validateFeatureConstruction,
  validateModel,
  welfordTrace,
} from './model.mjs';
const orderedDefinition = defineCanvasLesson({
  id: 'feature-engineering',
  validateModel,
  scenes: [
    introStage,
    decisionTimeStage,
    temporalContractStage,
    numericalScaleStage,
    runningStatisticsStage,
    scaleArtifactStage,
    missingnessStage,
    categoriesStage,
    categoryContractStage,
    crossfitConstructionStage,
    maturedEncodingStage,
    contractStage,
    rowValidationStage,
    vectorConstructionStage,
    preprocessingChangeStage,
    parityStage,
    parityCalculationStage,
    storeAndFreshnessStage,
    wrapStage,
    earnedFeatureTransferStage,
  ],
});
const stages = new Map([
  ['intro', introStage],
  ['decision-time', decisionTimeStage],
  ['temporal-contract', temporalContractStage],
  ['numerical-scale', numericalScaleStage],
  ['running-statistics', runningStatisticsStage],
  ['scale-artifact', scaleArtifactStage],
  ['missingness', missingnessStage],
  ['categories', categoriesStage],
  ['category-contract', categoryContractStage],
  ['crossfit-construction', crossfitConstructionStage],
  ['matured-encoding', maturedEncodingStage],
  ['contract', contractStage],
  ['row-validation', rowValidationStage],
  ['vector-construction', vectorConstructionStage],
  ['preprocessing-change', preprocessingChangeStage],
  ['parity', parityStage],
  ['parity-calculation', parityCalculationStage],
  ['store-and-freshness', storeAndFreshnessStage],
  ['wrap', wrapStage],
  ['earned-feature-transfer', earnedFeatureTransferStage],
]);
export function draw(ctx, scene, state, api) {
  const stage = stages.get(scene.id);
  return stage
    ? stage.draw(ctx, scene, state, api)
    : preserveUnknownPrelude(ctx, scene, state, api);
}
const definition = Object.freeze({
  ...orderedDefinition,
  draw,
});
export default definition;

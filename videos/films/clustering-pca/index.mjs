import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import { rejectUnknownConstruction } from './compatibility.mjs';
import introStage from './stages/intro.mjs';
import neighborsStage from './stages/neighbors.mjs';
import algorithmContractStage from './stages/algorithm-contract.mjs';
import kmeansStage from './stages/kmeans.mjs';
import initializationStage from './stages/initialization.mjs';
import seedingMassStage from './stages/seeding-mass.mjs';
import chooseKStage from './stages/choose-k.mjs';
import silhouetteLedgerStage from './stages/silhouette-ledger.mjs';
import objectiveTiesStage from './stages/objective-ties.mjs';
import scaleStage from './stages/scale.mjs';
import scaleBoundaryStage from './stages/scale-boundary.mjs';
import pcaStage from './stages/pca.mjs';
import solverContractStage from './stages/solver-contract.mjs';
import compressionStage from './stages/compression.mjs';
import varianceLedgerStage from './stages/variance-ledger.mjs';
import metricChoiceStage from './stages/metric-choice.mjs';
import sphericalCentersStage from './stages/spherical-centers.mjs';
import centeredCosineStage from './stages/centered-cosine.mjs';
import ivfStage from './stages/ivf.mjs';
import ivfWorkStage from './stages/ivf-work.mjs';
import takeawayStage from './stages/takeaway.mjs';
import auditLabelsStage from './stages/audit-labels.mjs';
import freshSeedRepairStage from './stages/fresh-seed-repair.mjs';
export {
  centroids,
  clusterTrials,
  coarseDistances,
  exactNearestIndex,
  inertia,
  initialInertia,
  labels,
  messages,
  normalizedScaleLabels,
  pca,
  query,
  rawScaleLabels,
  scaleFixture,
  seeds,
  transferDocuments,
  transferQuery,
  updatedInertia,
  withinGroupDistances,
} from './fixtures.mjs';
export { lloyd, silhouette } from './arithmetic.mjs';
export {
  clusterFrame,
  compressionFrame,
  cosine,
  directed,
  emptyCenterRepair,
  energyRows,
  ivfState,
  partitionFrame,
  projectionFrame,
  reconstructionState,
  rectangleFrame,
  retrievalFrame,
  scaleCalculation,
  scaleConstruction,
  seedMass,
  transferFrame,
  validateModel,
} from './model.mjs';
const orderedDefinition = defineCanvasLesson({
  id: 'clustering-pca',
  validateModel,
  scenes: [
    introStage,
    neighborsStage,
    algorithmContractStage,
    kmeansStage,
    initializationStage,
    seedingMassStage,
    chooseKStage,
    silhouetteLedgerStage,
    objectiveTiesStage,
    scaleStage,
    scaleBoundaryStage,
    pcaStage,
    solverContractStage,
    compressionStage,
    varianceLedgerStage,
    metricChoiceStage,
    sphericalCentersStage,
    centeredCosineStage,
    ivfStage,
    ivfWorkStage,
    takeawayStage,
    auditLabelsStage,
    freshSeedRepairStage,
  ],
});
const stages = new Map(orderedDefinition.scenes.map((stage) => [stage.id, stage]));
export function draw(ctx, scene, state, api) {
  const stage = stages.get(scene.id);
  return stage
    ? stage.draw(ctx, scene, state, api)
    : rejectUnknownConstruction(ctx, scene, state, api);
}
export default Object.freeze({
  ...orderedDefinition,
  draw,
});

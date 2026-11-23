import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import intro from './stages/intro.mjs';
import projectBoundary from './stages/project-boundary.mjs';
import dot from './stages/dot.mjs';
import gemmContract from './stages/gemm-contract.mjs';
import reuseBudget from './stages/reuse-budget.mjs';
import scales from './stages/scales.mjs';
import precisionContracts from './stages/precision-contracts.mjs';
import movement from './stages/movement.mjs';
import stageLifetime from './stages/stage-lifetime.mjs';
import jitContract from './stages/jit-contract.mjs';
import deepjitMigration from './stages/deepjit-migration.mjs';
import packingStage from './stages/packing.mjs';
import routedDenominators from './stages/routed-denominators.mjs';
import groupedModes from './stages/grouped-modes.mjs';
import indexer from './stages/indexer.mjs';
import indexerContract from './stages/indexer-contract.mjs';
import sparsePositionMap from './stages/sparse-position-map.mjs';
import overlap from './stages/overlap.mjs';
import moeGraph from './stages/moe-graph.mjs';
import ringOwnership from './stages/ring-ownership.mjs';
import localityEpilogue from './stages/locality-epilogue.mjs';
import benchmarkReceipt from './stages/benchmark-receipt.mjs';
import profileTheLayer from './stages/profile-the-layer.mjs';
import determinism from './stages/determinism.mjs';
import bringupTriage from './stages/bringup-triage.mjs';
import freshContract from './stages/fresh-contract.mjs';
export {
  alignExpertRows,
  compressedKeySelection,
  copyLayoutViews,
  expertWeightedReturn,
  gemmTile,
  indexerReference,
  packing,
  ringSchedule,
  scaledDot,
  sparseCachePosition,
} from './arithmetic.mjs';
export {
  deepGemmSentenceProgress,
  sampleDeepGemmChapter,
  sampleDeepGemmVisual,
  sampleModel,
  scaleTrace,
} from './construction.mjs';
export { validateModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'deep-dive-deepgemm',
  validateModel,
  scenes: [
    intro,
    projectBoundary,
    dot,
    gemmContract,
    reuseBudget,
    scales,
    precisionContracts,
    movement,
    stageLifetime,
    jitContract,
    deepjitMigration,
    packingStage,
    routedDenominators,
    groupedModes,
    indexer,
    indexerContract,
    sparsePositionMap,
    overlap,
    moeGraph,
    ringOwnership,
    localityEpilogue,
    benchmarkReceipt,
    profileTheLayer,
    determinism,
    bringupTriage,
    freshContract,
  ],
});
export const draw = definition.draw;
export default definition;

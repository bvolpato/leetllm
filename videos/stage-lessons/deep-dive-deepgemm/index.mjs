// Cinematic Vizmatic 0.10.0 stage film for DeepGEMM (26 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyDeepGemmInvariants } from './parts.mjs';
import benchmarkReceipt from './scenes/benchmark-receipt.mjs';
import bringupTriage from './scenes/bringup-triage.mjs';
import deepjitMigration from './scenes/deepjit-migration.mjs';
import determinism from './scenes/determinism.mjs';
import dot from './scenes/dot.mjs';
import freshContract from './scenes/fresh-contract.mjs';
import gemmContract from './scenes/gemm-contract.mjs';
import groupedModes from './scenes/grouped-modes.mjs';
import indexer from './scenes/indexer.mjs';
import indexerContract from './scenes/indexer-contract.mjs';
import intro from './scenes/intro.mjs';
import jitContract from './scenes/jit-contract.mjs';
import localityEpilogue from './scenes/locality-epilogue.mjs';
import moeGraph from './scenes/moe-graph.mjs';
import movement from './scenes/movement.mjs';
import overlap from './scenes/overlap.mjs';
import packing from './scenes/packing.mjs';
import precisionContracts from './scenes/precision-contracts.mjs';
import profileTheLayer from './scenes/profile-the-layer.mjs';
import projectBoundary from './scenes/project-boundary.mjs';
import reuseBudget from './scenes/reuse-budget.mjs';
import ringOwnership from './scenes/ring-ownership.mjs';
import routedDenominators from './scenes/routed-denominators.mjs';
import scales from './scenes/scales.mjs';
import sparsePositionMap from './scenes/sparse-position-map.mjs';
import stageLifetime from './scenes/stage-lifetime.mjs';

export default cinematicLesson({
  id: 'deep-dive-deepgemm',
  accent: COSMOS.cyan,
  invariants: verifyDeepGemmInvariants,
  scenes: {
    intro,
    'project-boundary': projectBoundary,
    dot,
    'gemm-contract': gemmContract,
    'reuse-budget': reuseBudget,
    scales,
    'precision-contracts': precisionContracts,
    movement,
    'stage-lifetime': stageLifetime,
    'jit-contract': jitContract,
    'deepjit-migration': deepjitMigration,
    packing,
    'routed-denominators': routedDenominators,
    'grouped-modes': groupedModes,
    indexer,
    'indexer-contract': indexerContract,
    'sparse-position-map': sparsePositionMap,
    overlap,
    'moe-graph': moeGraph,
    'ring-ownership': ringOwnership,
    'locality-epilogue': localityEpilogue,
    'benchmark-receipt': benchmarkReceipt,
    'profile-the-layer': profileTheLayer,
    determinism,
    'bringup-triage': bringupTriage,
    'fresh-contract': freshContract,
  },
});

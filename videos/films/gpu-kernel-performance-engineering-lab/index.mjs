import { drawLegacySummary } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import bitContract from './stages/bit-contract.mjs';
import targetBuild from './stages/target-build.mjs';
import timingWindow from './stages/timing-window.mjs';
import sectors from './stages/sectors.mjs';
import edgeSectors from './stages/edge-sectors.mjs';
import logicalRate from './stages/logical-rate.mjs';
import profileBoundary from './stages/profile-boundary.mjs';
import tiles from './stages/tiles.mjs';
import edgeOwnershipStage from './stages/edge-ownership.mjs';
import banks from './stages/banks.mjs';
import strideTransfer from './stages/stride-transfer.mjs';
import unrollIssue from './stages/unroll-issue.mjs';
import resourceBudget from './stages/resource-budget.mjs';
import barrier from './stages/barrier.mjs';
import raceRecovery from './stages/race-recovery.mjs';
import primitives from './stages/primitives.mjs';
import synthesis from './stages/synthesis.mjs';
import freshTrial from './stages/fresh-trial.mjs';
export {
  bankModel,
  edgeOwnership,
  laneSectorCoverage,
  resourceCapacity,
  sectorModel,
  sectorTransition,
  transpose,
} from './arithmetic.mjs';
export { compact, compactProgress, sharedTileSnapshot } from './construction.mjs';
export { recordedTiming } from './fixtures.mjs';
export { freshEdgeReadout, sampleModel, timingEvidence } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'gpu-kernel-performance-engineering-lab',
  validateModel,
  scenes: [
    intro,
    bitContract,
    targetBuild,
    timingWindow,
    sectors,
    edgeSectors,
    logicalRate,
    profileBoundary,
    tiles,
    edgeOwnershipStage,
    banks,
    strideTransfer,
    unrollIssue,
    resourceBudget,
    barrier,
    raceRecovery,
    primitives,
    synthesis,
    freshTrial,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((stage) => stage.id === scene.id))
    return drawLegacySummary(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });

import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import { drawUnknownDeepSpeedScene } from './compatibility.mjs';
import introStage from './stages/intro.mjs';
import ownershipStage from './stages/ownership.mjs';
import dtypeLedgerStage from './stages/dtype-ledger.mjs';
import reduceStage from './stages/reduce.mjs';
import tokenObjectiveStage from './stages/token-objective.mjs';
import accumulationStage from './stages/accumulation.mjs';
import managedUnmanagedStage from './stages/managed-unmanaged.mjs';
import bucketUnitsStage from './stages/bucket-units.mjs';
import gatherStage from './stages/gather.mjs';
import paddedGatherStage from './stages/padded-gather.mjs';
import parameterCoordinationStage from './stages/parameter-coordination.mjs';
import ringVolumeStage from './stages/ring-volume.mjs';
import coalescedReductionStage from './stages/coalesced-reduction.mjs';
import offloadStage from './stages/offload.mjs';
import offloadDomainsStage from './stages/offload-domains.mjs';
import engineSourceStage from './stages/engine-source.mjs';
import checkpointStage from './stages/checkpoint.mjs';
import checkpointContractStage from './stages/checkpoint-contract.mjs';
import topologyConversionStage from './stages/topology-conversion.mjs';
import projectContextStage from './stages/project-context.mjs';
import synthesisStage from './stages/synthesis.mjs';
import lateGradientStage from './stages/late-gradient.mjs';
import freshPlanStage from './stages/fresh-plan.mjs';
export { adam, stateLedger } from './arithmetic.mjs';
export {
  accumulationContract,
  gradientGate,
  memoryRecipe,
  paddedWorkingSet,
  ringSends,
  tokenObjective,
} from './construction.mjs';
export { sampleModel } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'deep-dive-deepspeed',
  validateModel,
  scenes: [
    introStage,
    ownershipStage,
    dtypeLedgerStage,
    reduceStage,
    tokenObjectiveStage,
    accumulationStage,
    managedUnmanagedStage,
    bucketUnitsStage,
    gatherStage,
    paddedGatherStage,
    parameterCoordinationStage,
    ringVolumeStage,
    coalescedReductionStage,
    offloadStage,
    offloadDomainsStage,
    engineSourceStage,
    checkpointStage,
    checkpointContractStage,
    topologyConversionStage,
    projectContextStage,
    synthesisStage,
    lateGradientStage,
    freshPlanStage,
  ],
});
const stageDraws = new Map(definition.scenes.map((stage) => [stage.id, stage.draw]));
export function draw(ctx, scene, state, api) {
  const painter = stageDraws.get(scene.id);
  return painter
    ? painter(ctx, scene, state, api)
    : drawUnknownDeepSpeedScene(ctx, scene, state, api);
}
export default Object.freeze({
  ...definition,
  draw,
});

import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import diagnosis from './stages/diagnosis.mjs';
import sourceContract from './stages/source-contract.mjs';
import smallLattice from './stages/small-lattice.mjs';
import mesh from './stages/mesh.mjs';
import rankAlgorithm from './stages/rank-algorithm.mjs';
import storedShapes from './stages/stored-shapes.mjs';
import tensor from './stages/tensor.mjs';
import backwardBias from './stages/backward-bias.mjs';
import pipeline from './stages/pipeline.mjs';
import microbatchBudget from './stages/microbatch-budget.mjs';
import dataOwnership from './stages/data-ownership.mjs';
import context from './stages/context.mjs';
import sequenceRole from './stages/sequence-role.mjs';
import experts from './stages/experts.mjs';
import expertCapacity from './stages/expert-capacity.mjs';
import foldedGrid from './stages/folded-grid.mjs';
import optimizer from './stages/optimizer.mjs';
import objectiveWeighting from './stages/objective-weighting.mjs';
import optimizerStep from './stages/optimizer-step.mjs';
import recovery from './stages/recovery.mjs';
import resumeState from './stages/resume-state.mjs';
import checkpointFormats from './stages/checkpoint-formats.mjs';
import precisionRecipes from './stages/precision-recipes.mjs';
import mfuReceipt from './stages/mfu-receipt.mjs';
import measuredTrace from './stages/measured-trace.mjs';
import researchOwnership from './stages/research-ownership.mjs';
import fitBoundary from './stages/fit-boundary.mjs';
import earnedReturn from './stages/earned-return.mjs';
export { contextMergeSnapshot, expertSkewTrace } from './construction.mjs';
export {
  coords,
  expertCapacityReceipt,
  group,
  largerMlp,
  meshCoordinate,
  mlp,
  momentumReceipt,
  newChapterModel,
  ownedSgd,
  rankOf,
  sampleModel,
  trainingSchedule,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'deep-dive-megatron',
  validateModel,
  scenes: [
    intro,
    diagnosis,
    sourceContract,
    smallLattice,
    mesh,
    rankAlgorithm,
    storedShapes,
    tensor,
    backwardBias,
    pipeline,
    microbatchBudget,
    dataOwnership,
    context,
    sequenceRole,
    experts,
    expertCapacity,
    foldedGrid,
    optimizer,
    objectiveWeighting,
    optimizerStep,
    recovery,
    resumeState,
    checkpointFormats,
    precisionRecipes,
    mfuReceipt,
    measuredTrace,
    researchOwnership,
    fitBoundary,
    earnedReturn,
  ],
});
const sceneIds = new Set(definition.scenes.map((scene) => scene.id));
export function draw(ctx, scene, state, api) {
  if (!sceneIds.has(scene.id)) return recovery.draw(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });

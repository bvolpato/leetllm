import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import alignment from './stages/alignment.mjs';
import averageStage from './stages/average.mjs';
import path from './stages/path.mjs';
import taskArithmeticStage from './stages/task-arithmetic.mjs';
import ties from './stages/ties.mjs';
import slerp from './stages/slerp.mjs';
import evaluate from './stages/evaluate.mjs';
import adapterProducts from './stages/adapter-products.mjs';
import dropRescale from './stages/drop-rescale.mjs';
import recipeContract from './stages/recipe-contract.mjs';
import baseCoefficient from './stages/base-coefficient.mjs';
import precisionDiagnosis from './stages/precision-diagnosis.mjs';
import earnedTransfer from './stages/earned-transfer.mjs';
export {
  average,
  connectedBasin,
  doubleWell,
  evaluateNeurons,
  taskArithmetic,
} from './arithmetic.mjs';
export {
  VECTOR_A,
  VECTOR_B,
  adapterMergeExample,
  dareMaskExample,
  independentDropOutcomes,
  passthroughFixture,
  permutationExample,
  precisionMergeExample,
  soupSelectionFixture,
  sphereMidpoints,
  tiesExample,
} from './fixtures.mjs';
export {
  alignmentSnapshot,
  averageSnapshot,
  earnedTransferSnapshot,
  pathSnapshot,
  taskArithmeticSnapshot,
  tiesSnapshot,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'model-merging',
  validateModel,
  scenes: [
    intro,
    alignment,
    averageStage,
    path,
    slerp,
    taskArithmeticStage,
    baseCoefficient,
    adapterProducts,
    ties,
    dropRescale,
    recipeContract,
    precisionDiagnosis,
    evaluate,
    earnedTransfer,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((candidate) => candidate.id === scene.id)) {
    throw new Error(`Unknown model-merging scene ${scene.id}`);
  }
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });

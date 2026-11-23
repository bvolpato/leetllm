import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import { drawUnknownScene } from './compatibility.mjs';
import policyTask from './stages/policy-task.mjs';
import intro from './stages/intro.mjs';
import linearLayer from './stages/linear-layer.mjs';
import denseUpdate from './stages/dense-update.mjs';
import intrinsicRank from './stages/intrinsic-rank.mjs';
import rankOne from './stages/rank-one.mjs';
import rankTwo from './stages/rank-two.mjs';
import factorization from './stages/factorization.mjs';
import thinForward from './stages/thin-forward.mjs';
import parameterCount from './stages/parameter-count.mjs';
import initialization from './stages/initialization.mjs';
import gradientContract from './stages/gradient-contract.mjs';
import strength from './stages/strength.mjs';
import rankScaling from './stages/rank-scaling.mjs';
import targetModules from './stages/target-modules.mjs';
import targetBudget from './stages/target-budget.mjs';
import promptPrefix from './stages/prompt-prefix.mjs';
import rectangularContract from './stages/rectangular-contract.mjs';
import tinyPeft from './stages/tiny-peft.mjs';
import lexicalContract from './stages/lexical-contract.mjs';
import memory from './stages/memory.mjs';
import stateBudget from './stages/state-budget.mjs';
import frozenBackward from './stages/frozen-backward.mjs';
import nf4Codec from './stages/nf4-codec.mjs';
import nestedPaging from './stages/nested-paging.mjs';
import precisionContract from './stages/precision-contract.mjs';
import shardedTraining from './stages/sharded-training.mjs';
import merge from './stages/merge.mjs';
import exportContract from './stages/export-contract.mjs';
import doraForward from './stages/dora-forward.mjs';
import doraBackward from './stages/dora-backward.mjs';
import servingContract from './stages/serving-contract.mjs';
import evaluate from './stages/evaluate.mjs';
import diagnosePolicy from './stages/diagnose-policy.mjs';
import freshPolicy from './stages/fresh-policy.mjs';
export { EXAMPLE, FACTORS, NF4_LEVELS } from './fixtures.mjs';
export { matvec, matmul } from './arithmetic.mjs';
export { rankOneConstruction } from './construction.mjs';
export {
  forward,
  learningSteps,
  adapterGradients,
  nf4Block,
  doraRow,
  policyRequest,
  rectangularExample,
  projectionBudget,
  rotatedPlane,
  validateModel,
} from './model.mjs';
const ordered = defineCanvasLesson({
  id: 'lora',
  validateModel,
  scenes: [
    policyTask,
    intro,
    linearLayer,
    denseUpdate,
    intrinsicRank,
    rankOne,
    rankTwo,
    factorization,
    thinForward,
    parameterCount,
    initialization,
    gradientContract,
    strength,
    rankScaling,
    targetModules,
    targetBudget,
    promptPrefix,
    rectangularContract,
    tinyPeft,
    lexicalContract,
    memory,
    stateBudget,
    frozenBackward,
    nf4Codec,
    nestedPaging,
    precisionContract,
    shardedTraining,
    merge,
    exportContract,
    doraForward,
    doraBackward,
    servingContract,
    evaluate,
    diagnosePolicy,
    freshPolicy,
  ],
});
const stagesById = new Map(ordered.scenes.map((stage) => [stage.id, stage]));
export function draw(ctx, scene, state, api) {
  const stage = stagesById.get(scene.id);
  return stage ? stage.draw(ctx, scene, state, api) : drawUnknownScene(ctx, scene, state, api);
}
export default Object.freeze({
  ...ordered,
  draw,
});

import { drawUnrecognizedScene } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import opening from './stages/opening.mjs';
import taskInterfaces from './stages/task-interfaces.mjs';
import contextTransform from './stages/context-transform.mjs';
import tokenPath from './stages/token-path.mjs';
import promptingAndTraining from './stages/prompting-and-training.mjs';
import prefillDecode from './stages/prefill-decode.mjs';
import assistantTraining from './stages/assistant-training.mjs';
import trainingBudget from './stages/training-budget.mjs';
import kvMemory from './stages/kv-memory.mjs';
import modernNorm from './stages/modern-norm.mjs';
import modernGate from './stages/modern-gate.mjs';
import modernPositions from './stages/modern-positions.mjs';
import sparseExperts from './stages/sparse-experts.mjs';
import reasoningContext from './stages/reasoning-context.mjs';
import workloadChoice from './stages/workload-choice.mjs';
export { allocationState, attentionCueState, cacheState, sampleModel } from './construction.mjs';
export { attentionState } from './fixtures.mjs';
export { learningTrace, outputProjection, projectContext, sharedQueryRead } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'gpt-to-modern-llms',
  validateModel,
  scenes: [
    opening,
    taskInterfaces,
    contextTransform,
    tokenPath,
    promptingAndTraining,
    prefillDecode,
    assistantTraining,
    trainingBudget,
    kvMemory,
    modernNorm,
    modernGate,
    modernPositions,
    sparseExperts,
    reasoningContext,
    workloadChoice,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((candidate) => candidate.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });

import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import packingBound from './stages/packing-bound.mjs';
import dictionary from './stages/dictionary.mjs';
import objective from './stages/objective.mjs';
import shrinkage from './stages/shrinkage.mjs';
import selection from './stages/selection.mjs';
import gatedLearning from './stages/gated-learning.mjs';
import ablation from './stages/ablation.mjs';
import steering from './stages/steering.mjs';
import clampAndGradient from './stages/clamp-and-gradient.mjs';
import coverage from './stages/coverage.mjs';
import hookAndCircuit from './stages/hook-and-circuit.mjs';
import trainingEvidence from './stages/training-evidence.mjs';
import featureAudit from './stages/feature-audit.mjs';
export {
  ablationState,
  selectionHistory,
  steeringState,
  topKSelectionState,
} from './construction.mjs';
export { coverageFixture, encoderFixture } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'sparse-autoencoders',
  validateModel,
  scenes: [
    intro,
    packingBound,
    dictionary,
    objective,
    shrinkage,
    selection,
    gatedLearning,
    ablation,
    steering,
    clampAndGradient,
    coverage,
    hookAndCircuit,
    trainingEvidence,
    featureAudit,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((candidate) => candidate.id === scene.id)) return;
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });

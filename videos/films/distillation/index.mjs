import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import distribution from './stages/distribution.mjs';
import temperature from './stages/temperature.mjs';
import objective from './stages/objective.mjs';
import learning from './stages/learning.mjs';
import sequences from './stages/sequences.mjs';
import prefixes from './stages/prefixes.mjs';
import capacity from './stages/capacity.mjs';
import transfer from './stages/transfer.mjs';
import temperatureGradient from './stages/temperature-gradient.mjs';
import alignmentMask from './stages/alignment-mask.mjs';
import featureProjection from './stages/feature-projection.mjs';
import reverseCapacity from './stages/reverse-capacity.mjs';
import sequenceKl from './stages/sequence-kl.mjs';
import signalAndTrainer from './stages/signal-and-trainer.mjs';
import datasetGates from './stages/dataset-gates.mjs';
import recipeEvidence from './stages/recipe-evidence.mjs';
import freshDistillation from './stages/fresh-distillation.mjs';
export { kl } from './arithmetic.mjs';
export { INITIAL, LEARNING_CUES, TEACHER, WORDS } from './fixtures.mjs';
export {
  jointFixture,
  learningSnapshot,
  objectiveSnapshot,
  prefixSnapshot,
  projectionFixture,
  studentTrace,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'distillation',
  validateModel,
  scenes: [
    intro,
    distribution,
    temperature,
    objective,
    learning,
    temperatureGradient,
    alignmentMask,
    featureProjection,
    sequences,
    prefixes,
    reverseCapacity,
    sequenceKl,
    signalAndTrainer,
    datasetGates,
    recipeEvidence,
    transfer,
    capacity,
    freshDistillation,
  ],
});
export const draw = definition.draw;
export default definition;

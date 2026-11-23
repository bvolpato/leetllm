import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import softmaxStage from './stages/softmax.mjs';
import update from './stages/update.mjs';
import pointer from './stages/pointer.mjs';
import temperature from './stages/temperature.mjs';
import options from './stages/options.mjs';
import risk from './stages/risk.mjs';
import trainingContract from './stages/training-contract.mjs';
import release from './stages/release.mjs';
export { confidence, softmax } from './arithmetic.mjs';
export { RELEASE_CASES, RELEASE_POLICY, concentration } from './fixtures.mjs';
export {
  optionRemovalSnapshot,
  pointerProjectionSnapshot,
  releaseRoutingSnapshot,
  report,
  routeScoredChoice,
  sampleModel,
  updateSnapshot,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'decision-models-jev-kev',
  validateModel,
  scenes: [
    intro,
    softmaxStage,
    update,
    pointer,
    temperature,
    options,
    trainingContract,
    risk,
    release,
  ],
});
export const draw = definition.draw;
export default definition;

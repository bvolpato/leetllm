import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import behaviorContract from './stages/behavior-contract.mjs';
import adaptationEvidence from './stages/adaptation-evidence.mjs';
import template from './stages/template.mjs';
import threeTails from './stages/three-tails.mjs';
import checkpointIds from './stages/checkpoint-ids.mjs';
import typedControl from './stages/typed-control.mjs';
import payloadScope from './stages/payload-scope.mjs';
import whitespaceParity from './stages/whitespace-parity.mjs';
import roleValidation from './stages/role-validation.mjs';
import syntheticMethods from './stages/synthetic-methods.mjs';
import sourceReview from './stages/source-review.mjs';
import shift from './stages/shift.mjs';
import roleMask from './stages/role-mask.mjs';
import objectiveChoice from './stages/objective-choice.mjs';
import compiledMask from './stages/compiled-mask.mjs';
import lossConstruction from './stages/loss-construction.mjs';
import eosPadding from './stages/eos-padding.mjs';
import truncationContract from './stages/truncation-contract.mjs';
import packing from './stages/packing.mjs';
import packingStrategies from './stages/packing-strategies.mjs';
import attention from './stages/attention.mjs';
import boundary from './stages/boundary.mjs';
import transfer from './stages/transfer.mjs';
import servingParity from './stages/serving-parity.mjs';
import releaseGate from './stages/release-gate.mjs';
import earnedContract from './stages/earned-contract.mjs';
export {
  attendedMean,
  eosLabels,
  firstFit,
  freshContract,
  lossTerms,
  makeAttentionMasks,
  typedGate,
} from './arithmetic.mjs';
export { cueProgress } from './construction.mjs';
export {
  ASSISTANT_TARGETS,
  CHECKPOINT,
  COLLATED,
  INPUT_POSITIONS,
  NEXT_TARGETS,
  TOKENS,
  TOKEN_IDS,
  packedLengths,
} from './fixtures.mjs';
export {
  attentionFrame,
  budgetRepairFrame,
  modelSnapshot,
  packingActors,
  packingFrame,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'instruction-masking',
  validateModel,
  scenes: [
    intro,
    behaviorContract,
    adaptationEvidence,
    template,
    threeTails,
    checkpointIds,
    typedControl,
    payloadScope,
    whitespaceParity,
    roleValidation,
    syntheticMethods,
    sourceReview,
    shift,
    roleMask,
    objectiveChoice,
    compiledMask,
    lossConstruction,
    eosPadding,
    truncationContract,
    packing,
    packingStrategies,
    attention,
    boundary,
    transfer,
    servingParity,
    releaseGate,
    earnedContract,
  ],
});
export const draw = definition.draw;
export default definition;

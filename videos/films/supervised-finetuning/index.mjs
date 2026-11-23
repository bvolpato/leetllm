import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import policyRunContract from './stages/policy-run-contract.mjs';
import intro from './stages/intro.mjs';
import objectiveSurface from './stages/objective-surface.mjs';
import rowGroupSplit from './stages/row-group-split.mjs';
import template from './stages/template.mjs';
import templateAndCollation from './stages/template-and-collation.mjs';
import shift from './stages/shift.mjs';
import mask from './stages/mask.mjs';
import activeTargetGuards from './stages/active-target-guards.mjs';
import loss from './stages/loss.mjs';
import promptMetric from './stages/prompt-metric.mjs';
import packing from './stages/packing.mjs';
import packingImplementation from './stages/packing-implementation.mjs';
import batching from './stages/batching.mjs';
import globalTargetBudget from './stages/global-target-budget.mjs';
import recipeControlled from './stages/recipe-controlled.mjs';
import resumeUpdate from './stages/resume-update.mjs';
import resumeDataArtifacts from './stages/resume-data-artifacts.mjs';
import evaluate from './stages/evaluate.mjs';
import checkpointSelection from './stages/checkpoint-selection.mjs';
import smallestRuntime from './stages/smallest-runtime.mjs';
import transfer from './stages/transfer.mjs';
import freshBoundaryRepair from './stages/fresh-boundary-repair.mjs';
export { MASK, PACKED_TOKENS, SFT_CHECKPOINTS, TOKENS } from './fixtures.mjs';
export {
  lossTrace,
  maskSnapshot,
  packingImplementationState,
  packingSnapshot,
  sftBoundaryRepair,
  sftCheckpointGate,
  sftResume,
  validateModel,
} from './model.mjs';
export { packedAttention, sftExposure, targetLoss } from './arithmetic.mjs';
const definition = defineCanvasLesson({
  id: 'supervised-finetuning',
  validateModel,
  scenes: [
    policyRunContract,
    rowGroupSplit,
    intro,
    template,
    shift,
    mask,
    loss,
    templateAndCollation,
    activeTargetGuards,
    promptMetric,
    objectiveSurface,
    packing,
    packingImplementation,
    batching,
    globalTargetBudget,
    recipeControlled,
    resumeUpdate,
    resumeDataArtifacts,
    smallestRuntime,
    evaluate,
    checkpointSelection,
    transfer,
    freshBoundaryRepair,
  ],
});
export const draw = definition.draw;
export default definition;

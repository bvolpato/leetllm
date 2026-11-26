// Cinematic Vizmatic 0.10.0 stage film for Supervised Fine-Tuning (23 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifySftInvariants } from './parts.mjs';
import activeTargetGuards from './scenes/active-target-guards.mjs';
import batching from './scenes/batching.mjs';
import checkpointSelection from './scenes/checkpoint-selection.mjs';
import evaluate from './scenes/evaluate.mjs';
import freshBoundaryRepair from './scenes/fresh-boundary-repair.mjs';
import globalTargetBudget from './scenes/global-target-budget.mjs';
import intro from './scenes/intro.mjs';
import loss from './scenes/loss.mjs';
import mask from './scenes/mask.mjs';
import objectiveSurface from './scenes/objective-surface.mjs';
import packingImplementation from './scenes/packing-implementation.mjs';
import packing from './scenes/packing.mjs';
import policyRunContract from './scenes/policy-run-contract.mjs';
import promptMetric from './scenes/prompt-metric.mjs';
import recipeControlled from './scenes/recipe-controlled.mjs';
import resumeDataArtifacts from './scenes/resume-data-artifacts.mjs';
import resumeUpdate from './scenes/resume-update.mjs';
import rowGroupSplit from './scenes/row-group-split.mjs';
import shift from './scenes/shift.mjs';
import smallestRuntime from './scenes/smallest-runtime.mjs';
import templateAndCollation from './scenes/template-and-collation.mjs';
import template from './scenes/template.mjs';
import transfer from './scenes/transfer.mjs';

export default cinematicLesson({
  id: 'supervised-finetuning',
  accent: COSMOS.cyan,
  invariants: verifySftInvariants,
  scenes: {
    'policy-run-contract': policyRunContract,
    'row-group-split': rowGroupSplit,
    intro,
    template,
    shift,
    mask,
    loss,
    'template-and-collation': templateAndCollation,
    'active-target-guards': activeTargetGuards,
    'prompt-metric': promptMetric,
    'objective-surface': objectiveSurface,
    packing,
    'packing-implementation': packingImplementation,
    batching,
    'global-target-budget': globalTargetBudget,
    'recipe-controlled': recipeControlled,
    'resume-update': resumeUpdate,
    'resume-data-artifacts': resumeDataArtifacts,
    'smallest-runtime': smallestRuntime,
    evaluate,
    'checkpoint-selection': checkpointSelection,
    transfer,
    'fresh-boundary-repair': freshBoundaryRepair,
  },
});

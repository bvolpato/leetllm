import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import trainTimeAxis from './stages/train-time-axis.mjs';
import providerUsage from './stages/provider-usage.mjs';
import effortCutoff from './stages/effort-cutoff.mjs';
import opaqueContinuation from './stages/opaque-continuation.mjs';
import candidates from './stages/candidates.mjs';
import coverage from './stages/coverage.mjs';
import perPromptDistribution from './stages/per-prompt-distribution.mjs';
import policyTraining from './stages/policy-training.mjs';
import selector from './stages/selector.mjs';
import processTargets from './stages/process-targets.mjs';
import revision from './stages/revision.mjs';
import searchCompletion from './stages/search-completion.mjs';
import searchBound from './stages/search-bound.mjs';
import pruning from './stages/pruning.mjs';
import r1Zero from './stages/r1-zero.mjs';
import r1Pipeline from './stages/r1-pipeline.mjs';
import budget from './stages/budget.mjs';
import scalingEvidence from './stages/scaling-evidence.mjs';
import routerFeasible from './stages/router-feasible.mjs';
import memory from './stages/memory.mjs';
import memoryGeometries from './stages/memory-geometries.mjs';
import hiddenTtft from './stages/hidden-ttft.mjs';
import workLedger from './stages/work-ledger.mjs';
import distillBenchmark from './stages/distill-benchmark.mjs';
import distillBoundary from './stages/distill-boundary.mjs';
import freshBranchRepair from './stages/fresh-branch-repair.mjs';
export { promptCoverage, rawKVBytes } from './arithmetic.mjs';
export {
  checkedRevisionLedger,
  pruningSnapshot,
  revisionSnapshot,
  selectorCueSnapshot,
  selectorSnapshot,
  testTimeCoreFrame,
} from './construction.mjs';
export { chooseBudget, chooseFeasible, plurality, retainedBranchLedger } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'test-time-compute',
  validateModel,
  scenes: [
    intro,
    candidates,
    selector,
    coverage,
    perPromptDistribution,
    policyTraining,
    processTargets,
    revision,
    searchCompletion,
    searchBound,
    pruning,
    trainTimeAxis,
    r1Zero,
    r1Pipeline,
    distillBenchmark,
    distillBoundary,
    providerUsage,
    effortCutoff,
    opaqueContinuation,
    budget,
    scalingEvidence,
    routerFeasible,
    memory,
    memoryGeometries,
    hiddenTtft,
    workLedger,
    freshBranchRepair,
  ],
});
export function draw(ctx, scene, state, api) {
  if (definition.scenes.some((stage) => stage.id === scene.id))
    return definition.draw(ctx, scene, state, api);
  throw new Error('Unknown Test Time core construction ' + scene.id);
}
export default Object.freeze({ ...definition, draw });

// Test-Time Compute: 27-scene full-bleed cinematic Vizmatic 0.10.0 stage film.
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyTestTimeComputeInvariants } from './parts.mjs';
import budget from './scenes/budget.mjs';
import candidatesScene from './scenes/candidates.mjs';
import coverageScene from './scenes/coverage.mjs';
import distillBenchmark from './scenes/distill-benchmark.mjs';
import distillBoundary from './scenes/distill-boundary.mjs';
import effortCutoff from './scenes/effort-cutoff.mjs';
import freshBranchRepair from './scenes/fresh-branch-repair.mjs';
import hiddenTtft from './scenes/hidden-ttft.mjs';
import intro from './scenes/intro.mjs';
import memoryGeometries from './scenes/memory-geometries.mjs';
import memory from './scenes/memory.mjs';
import opaqueContinuation from './scenes/opaque-continuation.mjs';
import perPromptDistribution from './scenes/per-prompt-distribution.mjs';
import policyTraining from './scenes/policy-training.mjs';
import processTargets from './scenes/process-targets.mjs';
import providerUsage from './scenes/provider-usage.mjs';
import pruning from './scenes/pruning.mjs';
import r1Pipeline from './scenes/r1-pipeline.mjs';
import r1Zero from './scenes/r1-zero.mjs';
import revision from './scenes/revision.mjs';
import routerFeasible from './scenes/router-feasible.mjs';
import scalingEvidence from './scenes/scaling-evidence.mjs';
import searchBound from './scenes/search-bound.mjs';
import searchCompletion from './scenes/search-completion.mjs';
import selector from './scenes/selector.mjs';
import trainTimeAxis from './scenes/train-time-axis.mjs';
import workLedger from './scenes/work-ledger.mjs';

export default cinematicLesson({
  id: 'test-time-compute',
  accent: COSMOS.cyan,
  invariants: verifyTestTimeComputeInvariants,
  scenes: {
    intro,
    candidates: candidatesScene,
    selector,
    coverage: coverageScene,
    'per-prompt-distribution': perPromptDistribution,
    'policy-training': policyTraining,
    'process-targets': processTargets,
    revision,
    'search-completion': searchCompletion,
    'search-bound': searchBound,
    pruning,
    'train-time-axis': trainTimeAxis,
    'r1-zero': r1Zero,
    'r1-pipeline': r1Pipeline,
    'distill-benchmark': distillBenchmark,
    'distill-boundary': distillBoundary,
    'provider-usage': providerUsage,
    'effort-cutoff': effortCutoff,
    'opaque-continuation': opaqueContinuation,
    budget,
    'scaling-evidence': scalingEvidence,
    'router-feasible': routerFeasible,
    memory,
    'memory-geometries': memoryGeometries,
    'hidden-ttft': hiddenTtft,
    'work-ledger': workLedger,
    'fresh-branch-repair': freshBranchRepair,
  },
});

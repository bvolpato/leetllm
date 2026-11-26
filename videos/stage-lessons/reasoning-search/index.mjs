// Cinematic Vizmatic 0.10.0 stage film for Reasoning & Search (21 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyReasoningSearchInvariants } from './parts.mjs';
import arithmeticControllerContract from './scenes/arithmetic-controller-contract.mjs';
import branchState from './scenes/branch-state.mjs';
import budgetAndClaims from './scenes/budget-and-claims.mjs';
import canonicalAnswerVote from './scenes/canonical-answer-vote.mjs';
import chooseTheController from './scenes/choose-the-controller.mjs';
import dependencyAndGraph from './scenes/dependency-and-graph.mjs';
import freshDuplicatePuzzle from './scenes/fresh-duplicate-puzzle.mjs';
import frontierControl from './scenes/frontier-control.mjs';
import heuristicPruning from './scenes/heuristic-pruning.mjs';
import linearState from './scenes/linear-state.mjs';
import nativeReasoningTraining from './scenes/native-reasoning-training.mjs';
import policyDecisionRecord from './scenes/policy-decision-record.mjs';
import promptComparison from './scenes/prompt-comparison.mjs';
import qualityAndLatencyGate from './scenes/quality-and-latency-gate.mjs';
import reasoningArtifacts from './scenes/reasoning-artifacts.mjs';
import samplingCostLedger from './scenes/sampling-cost-ledger.mjs';
import scratchpadCompute from './scenes/scratchpad-compute.mjs';
import subjectIntro from './scenes/subject-intro.mjs';
import typedObservationHandoff from './scenes/typed-observation-handoff.mjs';
import verifierBoundaries from './scenes/verifier-boundaries.mjs';
import votesAndChecks from './scenes/votes-and-checks.mjs';

export default cinematicLesson({
  id: 'reasoning-search',
  accent: COSMOS.violet,
  invariants: verifyReasoningSearchInvariants,
  scenes: {
    'policy-decision-record': policyDecisionRecord,
    'scratchpad-compute': scratchpadCompute,
    'prompt-comparison': promptComparison,
    'reasoning-artifacts': reasoningArtifacts,
    'canonical-answer-vote': canonicalAnswerVote,
    'sampling-cost-ledger': samplingCostLedger,
    'dependency-and-graph': dependencyAndGraph,
    'subject-intro': subjectIntro,
    'linear-state': linearState,
    'branch-state': branchState,
    'arithmetic-controller-contract': arithmeticControllerContract,
    'frontier-control': frontierControl,
    'heuristic-pruning': heuristicPruning,
    'votes-and-checks': votesAndChecks,
    'budget-and-claims': budgetAndClaims,
    'native-reasoning-training': nativeReasoningTraining,
    'verifier-boundaries': verifierBoundaries,
    'quality-and-latency-gate': qualityAndLatencyGate,
    'choose-the-controller': chooseTheController,
    'fresh-duplicate-puzzle': freshDuplicatePuzzle,
    'typed-observation-handoff': typedObservationHandoff,
  },
});

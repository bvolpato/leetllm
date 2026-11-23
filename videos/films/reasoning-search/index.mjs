import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import policyDecisionRecord from './stages/policy-decision-record.mjs';
import scratchpadCompute from './stages/scratchpad-compute.mjs';
import promptComparison from './stages/prompt-comparison.mjs';
import reasoningArtifacts from './stages/reasoning-artifacts.mjs';
import canonicalAnswerVote from './stages/canonical-answer-vote.mjs';
import samplingCostLedger from './stages/sampling-cost-ledger.mjs';
import dependencyAndGraph from './stages/dependency-and-graph.mjs';
import subjectIntro from './stages/subject-intro.mjs';
import linearState from './stages/linear-state.mjs';
import branchState from './stages/branch-state.mjs';
import arithmeticControllerContract from './stages/arithmetic-controller-contract.mjs';
import frontierControl from './stages/frontier-control.mjs';
import heuristicPruning from './stages/heuristic-pruning.mjs';
import votesAndChecks from './stages/votes-and-checks.mjs';
import budgetAndClaims from './stages/budget-and-claims.mjs';
import nativeReasoningTraining from './stages/native-reasoning-training.mjs';
import verifierBoundaries from './stages/verifier-boundaries.mjs';
import qualityAndLatencyGate from './stages/quality-and-latency-gate.mjs';
import chooseTheController from './stages/choose-the-controller.mjs';
import typedObservationHandoff from './stages/typed-observation-handoff.mjs';
import freshDuplicatePuzzle from './stages/fresh-duplicate-puzzle.mjs';
export {
  beamResult,
  beamWidthAt,
  branchFixture,
  checkExpression,
  chooseReasoningStrategy,
  frontierControlFixture,
  introductoryMove,
  reasoningDecision,
  reasoningRecordScore,
  searchValues,
  voteFixture,
} from './arithmetic.mjs';
export {
  canonicalAction,
  canonicalVote,
  freshFractionTrace,
  frontierSnapshot,
  narratedPruningSnapshot,
  occurrenceExpressionCheck,
  pruningSnapshot,
} from './construction.mjs';
export { FRESH_FRACTION_TREE, STRATEGY_RECEIPTS, VOTING_CASES } from './fixtures.mjs';
export { validateModel, validateReasoningUpgrade } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'reasoning-search',
  validateModel,
  scenes: [
    policyDecisionRecord,
    scratchpadCompute,
    promptComparison,
    reasoningArtifacts,
    canonicalAnswerVote,
    samplingCostLedger,
    dependencyAndGraph,
    subjectIntro,
    linearState,
    branchState,
    arithmeticControllerContract,
    frontierControl,
    heuristicPruning,
    votesAndChecks,
    budgetAndClaims,
    nativeReasoningTraining,
    verifierBoundaries,
    qualityAndLatencyGate,
    chooseTheController,
    freshDuplicatePuzzle,
    typedObservationHandoff,
  ],
});
export const draw = definition.draw;
export default definition;

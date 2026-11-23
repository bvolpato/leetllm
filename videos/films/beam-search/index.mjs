import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import policyPremiseStage from './stages/policy-premise.mjs';
import searchSpaceStage from './stages/search-space.mjs';
import logitShiftStage from './stages/logit-shift.mjs';
import logitBoundariesStage from './stages/logit-boundaries.mjs';
import greedyLoopStage from './stages/greedy-loop.mjs';
import openingStage from './stages/opening.mjs';
import probabilitiesStage from './stages/probabilities.mjs';
import firstBeamStage from './stages/first-beam.mjs';
import searchLatticeStage from './stages/search-lattice.mjs';
import stoppingStage from './stages/stopping.mjs';
import lengthScoreStage from './stages/length-score.mjs';
import widthStage from './stages/width.mjs';
import widerCounterexampleStage from './stages/wider-counterexample.mjs';
import lengthConventionsStage from './stages/length-conventions.mjs';
import penaltySignStage from './stages/penalty-sign.mjs';
import temperatureScaleStage from './stages/temperature-scale.mjs';
import streamReplayStage from './stages/stream-replay.mjs';
import filterKStage from './stages/filter-k.mjs';
import filterPStage from './stages/filter-p.mjs';
import filterMinPStage from './stages/filter-min-p.mjs';
import filterBoundariesStage from './stages/filter-boundaries.mjs';
import filterOrderStage from './stages/filter-order.mjs';
import grammarBytesStage from './stages/grammar-bytes.mjs';
import localConditioningStage from './stages/local-conditioning.mjs';
import bestOfNStage from './stages/best-of-n.mjs';
import processEvidenceStage from './stages/process-evidence.mjs';
import thoughtSearchStage from './stages/thought-search.mjs';
import speculativeBalanceStage from './stages/speculative-balance.mjs';
import speculativeBlockStage from './stages/speculative-block.mjs';
import auditReceiptStage from './stages/audit-receipt.mjs';
import synthesisStage from './stages/synthesis.mjs';
import freshPolicyStage from './stages/fresh-policy.mjs';
export { OPENING, POLICY_LOGITS, POLICY_TOKENS } from './fixtures.mjs';
export {
  WIDTH_THREE,
  WIDTH_TWO,
  beamSearch,
  enumByteTrace,
  retainedPolicy,
  speculativeMass,
  stablePolicy,
  thoughtTraversal,
  widerBeamTrace,
} from './arithmetic.mjs';
export {
  bestOfNFrame,
  conditionalEdgeExperiment,
  constructionProgress,
  freshPolicyFrame,
  greedyPolicyFrame,
  logitConversionFrame,
  mctsBackupFrame,
  overflowRepairFrame,
  policyCueProgress,
  widthWorkSnapshot,
} from './construction.mjs';
export { validateModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'beam-search',
  validateModel,
  scenes: [
    policyPremiseStage,
    searchSpaceStage,
    logitShiftStage,
    logitBoundariesStage,
    greedyLoopStage,
    openingStage,
    probabilitiesStage,
    firstBeamStage,
    searchLatticeStage,
    stoppingStage,
    lengthScoreStage,
    widthStage,
    widerCounterexampleStage,
    lengthConventionsStage,
    penaltySignStage,
    temperatureScaleStage,
    streamReplayStage,
    filterKStage,
    filterPStage,
    filterMinPStage,
    filterBoundariesStage,
    filterOrderStage,
    grammarBytesStage,
    localConditioningStage,
    bestOfNStage,
    processEvidenceStage,
    thoughtSearchStage,
    speculativeBalanceStage,
    speculativeBlockStage,
    auditReceiptStage,
    synthesisStage,
    freshPolicyStage,
  ],
});
export const draw = definition.draw;
export default definition;

import { drawUnrecognizedScene } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import subjectIntro from './stages/subject-intro.mjs';
import candidateCeiling from './stages/candidate-ceiling.mjs';
import jointInput from './stages/joint-input.mjs';
import scalarScore from './stages/scalar-score.mjs';
import rankingLosses from './stages/ranking-losses.mjs';
import tokenScoreContracts from './stages/token-score-contracts.mjs';
import listInputContract from './stages/list-input-contract.mjs';
import reorderEvidence from './stages/reorder-evidence.mjs';
import policySnapshot from './stages/policy-snapshot.mjs';
import phraseScorer from './stages/phrase-scorer.mjs';
import scoredSpan from './stages/scored-span.mjs';
import scoredTokenLedger from './stages/scored-token-ledger.mjs';
import calibrationGates from './stages/calibration-gates.mjs';
import metricsConstruction from './stages/metrics-construction.mjs';
import budgetPrediction from './stages/budget-prediction.mjs';
import servingBatches from './stages/serving-batches.mjs';
import lateMaxsim from './stages/late-maxsim.mjs';
import cacheInputIdentity from './stages/cache-input-identity.mjs';
import traceAndReject from './stages/trace-and-reject.mjs';
import learnedPolicyCheck from './stages/learned-policy-check.mjs';
import transfer from './stages/transfer.mjs';
import freshRelease from './stages/fresh-release.mjs';
export { pairLengthWork } from './arithmetic.mjs';
export { candidateScope, introContextState, reorderMotion } from './construction.mjs';
export { budgetCandidates, scores } from './fixtures.mjs';
export {
  budgetPredictionState,
  marginSelection,
  maxSimMatrix,
  packedEvidence,
  policyScore,
  rerank,
  scoringConstruction,
  teachingScoreKey,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'reranking',
  validateModel,
  scenes: [
    subjectIntro,
    candidateCeiling,
    jointInput,
    scalarScore,
    reorderEvidence,
    policySnapshot,
    phraseScorer,
    scoredSpan,
    scoredTokenLedger,
    learnedPolicyCheck,
    rankingLosses,
    tokenScoreContracts,
    listInputContract,
    cacheInputIdentity,
    lateMaxsim,
    calibrationGates,
    metricsConstruction,
    budgetPrediction,
    servingBatches,
    traceAndReject,
    transfer,
    freshRelease,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((s) => s.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });

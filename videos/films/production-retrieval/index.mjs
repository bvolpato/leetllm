import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import subjectIntro from './stages/subject-intro.mjs';
import threePaths from './stages/three-paths.mjs';
import versionedEvidence from './stages/versioned-evidence.mjs';
import validityInvariants from './stages/validity-invariants.mjs';
import authorizedRetrieval from './stages/authorized-retrieval.mjs';
import filteringContract from './stages/filtering-contract.mjs';
import lexicalCounterexample from './stages/lexical-counterexample.mjs';
import pinnedBundle from './stages/pinned-bundle.mjs';
import childToParent from './stages/child-to-parent.mjs';
import contextBudget from './stages/context-budget.mjs';
import answerFromEvidenceStage from './stages/answer-from-evidence.mjs';
import promptContract from './stages/prompt-contract.mjs';
import recordedModelFailure from './stages/recorded-model-failure.mjs';
import evidenceIsData from './stages/evidence-is-data.mjs';
import revocationAndCache from './stages/revocation-and-cache.mjs';
import cacheIdentity from './stages/cache-identity.mjs';
import traceAndDiagnose from './stages/trace-and-diagnose.mjs';
import recallContracts from './stages/recall-contracts.mjs';
import serialLatency from './stages/serial-latency.mjs';
import releaseGates from './stages/release-gates.mjs';
import tailsAndGates from './stages/tails-and-gates.mjs';
import freshEvidence from './stages/fresh-evidence.mjs';
export {
  governingRecall,
  halfOpenCurrent,
  isCurrent,
  lexicalScore,
  unknownSourceLabels,
} from './arithmetic.mjs';
export { eligibilityFrame, scopeSnapshot, versionFilterFrame } from './construction.mjs';
export { CORPUS, EVAL_DATE, PARENTS, REQUIRED_RAG_GATES, ROTATION_RULE } from './fixtures.mjs';
export {
  allowedRecords,
  answerFromEvidence,
  completeRequestBudget,
  currentAuthorityDecision,
  filteredRecallFixture,
  injectionFixture,
  packParents,
  parentAdmission,
  parentPackingFixture,
  ragReleaseGate,
  rankAllowed,
  releaseCases,
  requestPath,
  retrieve,
  serialRequestTrace,
  toyTargetTokens,
  versionedBundle,
  zeroScoreFixture,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'production-retrieval',
  validateModel,
  scenes: [
    subjectIntro,
    threePaths,
    versionedEvidence,
    validityInvariants,
    authorizedRetrieval,
    filteringContract,
    lexicalCounterexample,
    pinnedBundle,
    childToParent,
    contextBudget,
    answerFromEvidenceStage,
    promptContract,
    recordedModelFailure,
    evidenceIsData,
    revocationAndCache,
    cacheIdentity,
    traceAndDiagnose,
    recallContracts,
    serialLatency,
    releaseGates,
    tailsAndGates,
    freshEvidence,
  ],
});
export function draw(ctx, scene, state, api) {
  if (definition.scenes.some((stage) => stage.id === scene.id))
    return definition.draw(ctx, scene, state, api);
  throw new Error('Unknown production-retrieval scene: ' + scene.id);
}
export default Object.freeze({ ...definition, draw });

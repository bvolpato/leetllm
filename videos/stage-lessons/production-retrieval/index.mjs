import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import subjectIntro from './scenes/subject-intro.mjs';
import threePaths from './scenes/three-paths.mjs';
import versionedEvidence from './scenes/versioned-evidence.mjs';
import validityInvariants from './scenes/validity-invariants.mjs';
import authorizedRetrieval from './scenes/authorized-retrieval.mjs';
import filteringContract from './scenes/filtering-contract.mjs';
import lexicalCounterexample from './scenes/lexical-counterexample.mjs';
import pinnedBundle from './scenes/pinned-bundle.mjs';
import childToParent from './scenes/child-to-parent.mjs';
import contextBudget from './scenes/context-budget.mjs';
import answerFromEvidenceScene from './scenes/answer-from-evidence.mjs';
import promptContract from './scenes/prompt-contract.mjs';
import recordedModelFailure from './scenes/recorded-model-failure.mjs';
import evidenceIsData from './scenes/evidence-is-data.mjs';
import revocationAndCache from './scenes/revocation-and-cache.mjs';
import cacheIdentity from './scenes/cache-identity.mjs';
import traceAndDiagnose from './scenes/trace-and-diagnose.mjs';
import recallContracts from './scenes/recall-contracts.mjs';
import serialLatency from './scenes/serial-latency.mjs';
import releaseGates from './scenes/release-gates.mjs';
import tailsAndGates from './scenes/tails-and-gates.mjs';
import freshEvidence from './scenes/fresh-evidence.mjs';
export default narratedLesson({
  id: 'production-retrieval',
  scenes: {
    'subject-intro': subjectIntro,
    'three-paths': threePaths,
    'versioned-evidence': versionedEvidence,
    'validity-invariants': validityInvariants,
    'authorized-retrieval': authorizedRetrieval,
    'filtering-contract': filteringContract,
    'lexical-counterexample': lexicalCounterexample,
    'pinned-bundle': pinnedBundle,
    'child-to-parent': childToParent,
    'context-budget': contextBudget,
    'answer-from-evidence': answerFromEvidenceScene,
    'prompt-contract': promptContract,
    'recorded-model-failure': recordedModelFailure,
    'evidence-is-data': evidenceIsData,
    'revocation-and-cache': revocationAndCache,
    'cache-identity': cacheIdentity,
    'trace-and-diagnose': traceAndDiagnose,
    'recall-contracts': recallContracts,
    'serial-latency': serialLatency,
    'release-gates': releaseGates,
    'tails-and-gates': tailsAndGates,
    'fresh-evidence': freshEvidence,
  },
});

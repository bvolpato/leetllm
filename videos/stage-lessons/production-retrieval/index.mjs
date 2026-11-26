// Full-bleed dark-cinema 22-scene Production Retrieval stage lesson (vizmatic@0.10.0).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyRetrievalInvariants } from './parts.mjs';
import answerFromEvidenceScene from './scenes/answer-from-evidence.mjs';
import authorizedRetrieval from './scenes/authorized-retrieval.mjs';
import cacheIdentity from './scenes/cache-identity.mjs';
import childToParent from './scenes/child-to-parent.mjs';
import contextBudget from './scenes/context-budget.mjs';
import evidenceIsData from './scenes/evidence-is-data.mjs';
import filteringContract from './scenes/filtering-contract.mjs';
import freshEvidence from './scenes/fresh-evidence.mjs';
import lexicalCounterexample from './scenes/lexical-counterexample.mjs';
import pinnedBundle from './scenes/pinned-bundle.mjs';
import promptContract from './scenes/prompt-contract.mjs';
import recallContracts from './scenes/recall-contracts.mjs';
import recordedModelFailure from './scenes/recorded-model-failure.mjs';
import releaseGates from './scenes/release-gates.mjs';
import revocationAndCache from './scenes/revocation-and-cache.mjs';
import serialLatency from './scenes/serial-latency.mjs';
import subjectIntro from './scenes/subject-intro.mjs';
import tailsAndGates from './scenes/tails-and-gates.mjs';
import threePaths from './scenes/three-paths.mjs';
import traceAndDiagnose from './scenes/trace-and-diagnose.mjs';
import validityInvariants from './scenes/validity-invariants.mjs';
import versionedEvidence from './scenes/versioned-evidence.mjs';

export default cinematicLesson({
  id: 'production-retrieval',
  accent: COSMOS.cyan,
  invariants: verifyRetrievalInvariants,
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

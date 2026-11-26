// Hallucination Detection & Evidence Verification: Full-bleed dark cinema stage lesson (19 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyHallucinationInvariants } from './parts.mjs';
import subjectIntro from './scenes/subject-intro.mjs';
import atomicClaims from './scenes/atomic-claims.mjs';
import verdicts from './scenes/verdicts.mjs';
import supportVersusTruth from './scenes/support-versus-truth.mjs';
import guessingIncentives from './scenes/guessing-incentives.mjs';
import evidenceVersion from './scenes/evidence-version.mjs';
import strictClaimContract from './scenes/strict-claim-contract.mjs';
import safeRendering from './scenes/safe-rendering.mjs';
import tokenConfidence from './scenes/token-confidence.mjs';
import meaningEntropy from './scenes/meaning-entropy.mjs';
import consistencySignal from './scenes/consistency-signal.mjs';
import consistencyMethods from './scenes/consistency-methods.mjs';
import contrastiveDecoding from './scenes/contrastive-decoding.mjs';
import measuredAbstention from './scenes/measured-abstention.mjs';
import scoreTheGate from './scenes/score-the-gate.mjs';
import payloadAndRelease from './scenes/payload-and-release.mjs';
import verificationPlans from './scenes/verification-plans.mjs';
import traceAndMeasure from './scenes/trace-and-measure.mjs';
import freshRecordRepair from './scenes/fresh-record-repair.mjs';

export default cinematicLesson({
  id: 'hallucination-evidence',
  accent: COSMOS.emerald,
  invariants: verifyHallucinationInvariants,
  scenes: {
    'subject-intro': subjectIntro,
    'atomic-claims': atomicClaims,
    verdicts,
    'support-versus-truth': supportVersusTruth,
    'guessing-incentives': guessingIncentives,
    'evidence-version': evidenceVersion,
    'strict-claim-contract': strictClaimContract,
    'safe-rendering': safeRendering,
    'token-confidence': tokenConfidence,
    'meaning-entropy': meaningEntropy,
    'consistency-signal': consistencySignal,
    'consistency-methods': consistencyMethods,
    'contrastive-decoding': contrastiveDecoding,
    'measured-abstention': measuredAbstention,
    'score-the-gate': scoreTheGate,
    'payload-and-release': payloadAndRelease,
    'verification-plans': verificationPlans,
    'trace-and-measure': traceAndMeasure,
    'fresh-record-repair': freshRecordRepair,
  },
});

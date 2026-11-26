// Cinematic Vizmatic 0.10.0 stage film for Function Calling & Tool Use (28 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyToolUseInvariants } from './parts.mjs';
import authorization from './scenes/authorization.mjs';
import completeBatch from './scenes/complete-batch.mjs';
import deferredDefinitions from './scenes/deferred-definitions.mjs';
import errorClasses from './scenes/error-classes.mjs';
import freshComparison from './scenes/fresh-comparison.mjs';
import intentLedger from './scenes/intent-ledger.mjs';
import mcpExposure from './scenes/mcp-exposure.mjs';
import mcpIntegration from './scenes/mcp-integration.mjs';
import observationLoop from './scenes/observation-loop.mjs';
import parameterBoundaries from './scenes/parameter-boundaries.mjs';
import permissionBeforeRanking from './scenes/permission-before-ranking.mjs';
import promotionPolicy from './scenes/promotion-policy.mjs';
import providerLinkage from './scenes/provider-linkage.mjs';
import releaseObservation from './scenes/release-observation.mjs';
import repeatedProposal from './scenes/repeated-proposal.mjs';
import requestEnvelope from './scenes/request-envelope.mjs';
import requiredFanIn from './scenes/required-fan-in.mjs';
import retryIdentity from './scenes/retry-identity.mjs';
import sameSuiteReader from './scenes/same-suite-reader.mjs';
import schemaValidation from './scenes/schema-validation.mjs';
import scopedRead from './scenes/scoped-read.mjs';
import strictContract from './scenes/strict-contract.mjs';
import subjectIntro from './scenes/subject-intro.mjs';
import toolChoice from './scenes/tool-choice.mjs';
import trajectoryContract from './scenes/trajectory-contract.mjs';
import transfer from './scenes/transfer.mjs';
import typedReleaseEvidence from './scenes/typed-release-evidence.mjs';
import writeGate from './scenes/write-gate.mjs';

export default cinematicLesson({
  id: 'tool-use',
  accent: COSMOS.cyan,
  invariants: verifyToolUseInvariants,
  scenes: {
    'subject-intro': subjectIntro,
    'release-observation': releaseObservation,
    'request-envelope': requestEnvelope,
    'provider-linkage': providerLinkage,
    'complete-batch': completeBatch,
    'schema-validation': schemaValidation,
    'strict-contract': strictContract,
    'tool-choice': toolChoice,
    authorization,
    'scoped-read': scopedRead,
    'observation-loop': observationLoop,
    'same-suite-reader': sameSuiteReader,
    'write-gate': writeGate,
    'promotion-policy': promotionPolicy,
    'retry-identity': retryIdentity,
    'intent-ledger': intentLedger,
    'parameter-boundaries': parameterBoundaries,
    'error-classes': errorClasses,
    'repeated-proposal': repeatedProposal,
    'required-fan-in': requiredFanIn,
    'permission-before-ranking': permissionBeforeRanking,
    'deferred-definitions': deferredDefinitions,
    'trajectory-contract': trajectoryContract,
    'typed-release-evidence': typedReleaseEvidence,
    'mcp-integration': mcpIntegration,
    'mcp-exposure': mcpExposure,
    transfer,
    'fresh-comparison': freshComparison,
  },
});

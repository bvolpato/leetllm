// Cinematic Vizmatic 0.10.0 stage film for Structured Generation (30 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyStructuredGenerationInvariants } from './parts.mjs';
import backendContracts from './scenes/backend-contracts.mjs';
import boundedRecovery from './scenes/bounded-recovery.mjs';
import ciSnapshot from './scenes/ci-snapshot.mjs';
import completeRecord from './scenes/complete-record.mjs';
import conditionalMask from './scenes/conditional-mask.mjs';
import digestIdentities from './scenes/digest-identities.mjs';
import evidenceAction from './scenes/evidence-action.mjs';
import flatTree from './scenes/flat-tree.mjs';
import freshIncident from './scenes/fresh-incident.mjs';
import freshNesting from './scenes/fresh-nesting.mjs';
import hostApproval from './scenes/host-approval.mjs';
import interfaceContract from './scenes/interface-contract.mjs';
import logitMask from './scenes/logit-mask.mjs';
import maskSchedule from './scenes/mask-schedule.mjs';
import nullableField from './scenes/nullable-field.mjs';
import parserBytes from './scenes/parser-bytes.mjs';
import prefixJump from './scenes/prefix-jump.mjs';
import prefixLanguage from './scenes/prefix-language.mjs';
import qualityMeasure from './scenes/quality-measure.mjs';
import recursiveStack from './scenes/recursive-stack.mjs';
import schemaVersion from './scenes/schema-version.mjs';
import sdkEnvelope from './scenes/sdk-envelope.mjs';
import semanticGates from './scenes/semantic-gates.mjs';
import subjectIntro from './scenes/subject-intro.mjs';
import tokenIndex from './scenes/token-index.mjs';
import toolProtocol from './scenes/tool-protocol.mjs';
import transfer from './scenes/transfer.mjs';
import valueBranch from './scenes/value-branch.mjs';
import wholeToken from './scenes/whole-token.mjs';
import wireContract from './scenes/wire-contract.mjs';

export default cinematicLesson({
  id: 'structured-generation',
  accent: COSMOS.cyan,
  invariants: verifyStructuredGenerationInvariants,
  scenes: {
    'subject-intro': subjectIntro,
    'interface-contract': interfaceContract,
    'prefix-language': prefixLanguage,
    'logit-mask': logitMask,
    'conditional-mask': conditionalMask,
    'value-branch': valueBranch,
    'whole-token': wholeToken,
    'complete-record': completeRecord,
    'recursive-stack': recursiveStack,
    'token-index': tokenIndex,
    'prefix-jump': prefixJump,
    'mask-schedule': maskSchedule,
    'backend-contracts': backendContracts,
    'parser-bytes': parserBytes,
    'nullable-field': nullableField,
    'wire-contract': wireContract,
    'semantic-gates': semanticGates,
    'ci-snapshot': ciSnapshot,
    'evidence-action': evidenceAction,
    'flat-tree': flatTree,
    'tool-protocol': toolProtocol,
    'sdk-envelope': sdkEnvelope,
    'schema-version': schemaVersion,
    'bounded-recovery': boundedRecovery,
    'host-approval': hostApproval,
    'digest-identities': digestIdentities,
    'quality-measure': qualityMeasure,
    transfer,
    'fresh-nesting': freshNesting,
    'fresh-incident': freshIncident,
  },
});

import { drawUnrecognizedScene } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import subjectIntro from './stages/subject-intro.mjs';
import interfaceContract from './stages/interface-contract.mjs';
import prefixLanguage from './stages/prefix-language.mjs';
import recursiveStack from './stages/recursive-stack.mjs';
import logitMask from './stages/logit-mask.mjs';
import conditionalMask from './stages/conditional-mask.mjs';
import valueBranch from './stages/value-branch.mjs';
import wholeToken from './stages/whole-token.mjs';
import tokenIndex from './stages/token-index.mjs';
import prefixJump from './stages/prefix-jump.mjs';
import maskSchedule from './stages/mask-schedule.mjs';
import backendContracts from './stages/backend-contracts.mjs';
import completeRecord from './stages/complete-record.mjs';
import parserBytes from './stages/parser-bytes.mjs';
import nullableField from './stages/nullable-field.mjs';
import wireContract from './stages/wire-contract.mjs';
import semanticGates from './stages/semantic-gates.mjs';
import ciSnapshot from './stages/ci-snapshot.mjs';
import evidenceAction from './stages/evidence-action.mjs';
import flatTree from './stages/flat-tree.mjs';
import toolProtocol from './stages/tool-protocol.mjs';
import sdkEnvelope from './stages/sdk-envelope.mjs';
import schemaVersion from './stages/schema-version.mjs';
import boundedRecovery from './stages/bounded-recovery.mjs';
import hostApproval from './stages/host-approval.mjs';
import digestIdentities from './stages/digest-identities.mjs';
import qualityMeasure from './stages/quality-measure.mjs';
import transfer from './stages/transfer.mjs';
import freshNesting from './stages/fresh-nesting.mjs';
import freshIncident from './stages/fresh-incident.mjs';
export { maskStepTime, normalizedWeights, retryBudget } from './arithmetic.mjs';
export { maskScheduleClock, recursiveConstructionState } from './construction.mjs';
export { EOS, LANGUAGE } from './fixtures.mjs';
export {
  ciOutcome,
  decode,
  digestIdentity,
  legal,
  masked,
  nullableRecord,
  recursiveCandidate,
  recursivePrefix,
  tokenTrace,
  treeRelationships,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'structured-generation',
  validateModel,
  scenes: [
    subjectIntro,
    interfaceContract,
    prefixLanguage,
    logitMask,
    conditionalMask,
    valueBranch,
    wholeToken,
    completeRecord,
    recursiveStack,
    tokenIndex,
    prefixJump,
    maskSchedule,
    backendContracts,
    parserBytes,
    nullableField,
    wireContract,
    semanticGates,
    ciSnapshot,
    evidenceAction,
    flatTree,
    toolProtocol,
    sdkEnvelope,
    schemaVersion,
    boundedRecovery,
    hostApproval,
    digestIdentities,
    qualityMeasure,
    transfer,
    freshNesting,
    freshIncident,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((candidate) => candidate.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });

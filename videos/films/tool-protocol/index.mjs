import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import subjectIntro from './stages/subject-intro.mjs';
import reuseArithmetic from './stages/reuse-arithmetic.mjs';
import hostClientServer from './stages/host-client-server.mjs';
import requestCorrelation from './stages/request-correlation.mjs';
import discoverAndNegotiate from './stages/discover-and-negotiate.mjs';
import toolsResourcesPrompts from './stages/tools-resources-prompts.mjs';
import boundedStdio from './stages/bounded-stdio.mjs';
import validateResults from './stages/validate-results.mjs';
import resultContract from './stages/result-contract.mjs';
import transportAndPause from './stages/transport-and-pause.mjs';
import mrtrState from './stages/mrtr-state.mjs';
import eraFallback from './stages/era-fallback.mjs';
import httpBinding from './stages/http-binding.mjs';
import httpIdentity from './stages/http-identity.mjs';
import catalogAndTrust from './stages/catalog-and-trust.mjs';
import scopedCache from './stages/scoped-cache.mjs';
import freshTool from './stages/fresh-tool.mjs';
export { PROTOCOL_VERSION } from './fixtures.mjs';
export {
  cacheDecision,
  capabilityGate,
  catalogFixture,
  choosePrimitive,
  correlateResponses,
  correlationSnapshot,
  discoveryFixture,
  discoverySnapshot,
  eraDecision,
  executeStatusCall,
  hostValidateResult,
  issuerMatches,
  mirrorGate,
  resumeRollback,
  rollbackSnapshot,
  stateAdmission,
  typedRequestKey,
  validateModel,
  validateStatusReply,
  validationFixture,
  validationSnapshot,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'tool-protocol',
  validateModel,
  scenes: [
    subjectIntro,
    reuseArithmetic,
    hostClientServer,
    requestCorrelation,
    discoverAndNegotiate,
    toolsResourcesPrompts,
    boundedStdio,
    validateResults,
    resultContract,
    transportAndPause,
    mrtrState,
    eraFallback,
    httpBinding,
    httpIdentity,
    catalogAndTrust,
    scopedCache,
    freshTool,
  ],
});
export const draw = definition.draw;
export default definition;

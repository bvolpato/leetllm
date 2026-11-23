import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import openingStage from './stages/opening.mjs';
import assembleAppStage from './stages/assemble-app.mjs';
import inputContractStage from './stages/input-contract.mjs';
import policyCheckStage from './stages/policy-check.mjs';
import traceLifecycleStage from './stages/trace-lifecycle.mjs';
import browserOutcomeStage from './stages/browser-outcome.mjs';
import failureBoundariesStage from './stages/failure-boundaries.mjs';
import evaluationStage from './stages/evaluation.mjs';
import httpDurabilityStage from './stages/http-durability.mjs';
import failureContractStage from './stages/failure-contract.mjs';
import browserAuthorityStage from './stages/browser-authority.mjs';
import earnedTransferStage from './stages/earned-transfer.mjs';
export { joinGeometry, openingRequestState, requestFrame, sampleModel } from './construction.mjs';
export { accountFacts } from './fixtures.mjs';
export {
  checkPolicy,
  createApp,
  createMemoryStore,
  invalidRequestFixture,
  policyCandidate,
  policyCases,
  repeatedRequestFixture,
  runFixture,
  validateRequest,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'first-ai-app-end-to-end',
  validateModel,
  scenes: [
    openingStage,
    assembleAppStage,
    inputContractStage,
    policyCheckStage,
    traceLifecycleStage,
    httpDurabilityStage,
    browserOutcomeStage,
    failureBoundariesStage,
    failureContractStage,
    browserAuthorityStage,
    evaluationStage,
    earnedTransferStage,
  ],
});
export const draw = definition.draw;
export default definition;

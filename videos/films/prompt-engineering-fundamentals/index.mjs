import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import openingStage from './stages/opening.mjs';
import conditionalContextStage from './stages/conditional-context.mjs';
import policyBaselineStage from './stages/policy-baseline.mjs';
import roleSerializationStage from './stages/role-serialization.mjs';
import promptAssemblyStage from './stages/prompt-assembly.mjs';
import demonstrationBoundariesStage from './stages/demonstration-boundaries.mjs';
import promptRevisionStage from './stages/prompt-revision.mjs';
import reasoningWorkStage from './stages/reasoning-work.mjs';
import agreementCheckStage from './stages/agreement-check.mjs';
import completeResponseStage from './stages/complete-response.mjs';
import grammarMaskStage from './stages/grammar-mask.mjs';
import strictValidatorStage from './stages/strict-validator.mjs';
import inputBoundaryStage from './stages/input-boundary.mjs';
import executionBoundaryStage from './stages/execution-boundary.mjs';
import regressionEvaluationStage from './stages/regression-evaluation.mjs';
import pairedFieldsStage from './stages/paired-fields.mjs';
import guardedRecommendationStage from './stages/guarded-recommendation.mjs';
import freshBoundaryStage from './stages/fresh-boundary.mjs';
export { maskedProbabilities } from './arithmetic.mjs';
export { assembledResponse, clockElapsed, regressionState, sampleModel } from './construction.mjs';
export { freshIncidentContract, promptSections, responseChecks, triageDecision } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'prompt-engineering-fundamentals',
  validateModel,
  scenes: [
    openingStage,
    conditionalContextStage,
    policyBaselineStage,
    roleSerializationStage,
    promptAssemblyStage,
    demonstrationBoundariesStage,
    promptRevisionStage,
    reasoningWorkStage,
    agreementCheckStage,
    completeResponseStage,
    grammarMaskStage,
    strictValidatorStage,
    inputBoundaryStage,
    executionBoundaryStage,
    regressionEvaluationStage,
    pairedFieldsStage,
    guardedRecommendationStage,
    freshBoundaryStage,
  ],
});
export const draw = definition.draw;
export default definition;

import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import opening from './stages/opening.mjs';
import historicalPattern from './stages/historical-pattern.mjs';
import rulebook from './stages/rulebook.mjs';
import ruleGrowth from './stages/rule-growth.mjs';
import learning from './stages/learning.mjs';
import search from './stages/search.mjs';
import trainingCompute from './stages/training-compute.mjs';
import servingBreakEven from './stages/serving-break-even.mjs';
import policyGate from './stages/policy-gate.mjs';
import allocationEvidence from './stages/allocation-evidence.mjs';
import requestBudget from './stages/request-budget.mjs';
import earnedTransfer from './stages/earned-transfer.mjs';
export { fixedBudgetPlans, lifetimePlans } from './arithmetic.mjs';
export { sampleModel } from './construction.mjs';
export {
  fitWordCounts,
  learningConstruction,
  learningStates,
  releaseAction,
  releaseGate,
  ruleGrowthState,
  ruleScores,
  scoreWords,
  searchState,
  verifierScore,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'bitter-lesson-compute-over-heuristics',
  validateModel,
  scenes: [
    opening,
    historicalPattern,
    rulebook,
    ruleGrowth,
    learning,
    search,
    trainingCompute,
    servingBreakEven,
    policyGate,
    allocationEvidence,
    requestBudget,
    earnedTransfer,
  ],
});
export const draw = definition.draw;
export default definition;

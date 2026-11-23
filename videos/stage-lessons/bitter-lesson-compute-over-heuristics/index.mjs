import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import opening from './scenes/opening.mjs';
import rulebook from './scenes/rulebook.mjs';
import ruleGrowth from './scenes/rule-growth.mjs';
import learning from './scenes/learning.mjs';
import search from './scenes/search.mjs';
import policyGate from './scenes/policy-gate.mjs';
import historicalPattern from './scenes/historical-pattern.mjs';
import trainingCompute from './scenes/training-compute.mjs';
import allocationEvidence from './scenes/allocation-evidence.mjs';
import servingBreakEven from './scenes/serving-break-even.mjs';
import requestBudget from './scenes/request-budget.mjs';
import earnedTransfer from './scenes/earned-transfer.mjs';

export default narratedLesson({
  id: 'bitter-lesson-compute-over-heuristics',
  scenes: {
    opening,
    rulebook,
    'rule-growth': ruleGrowth,
    learning,
    search,
    'policy-gate': policyGate,
    'historical-pattern': historicalPattern,
    'training-compute': trainingCompute,
    'allocation-evidence': allocationEvidence,
    'serving-break-even': servingBreakEven,
    'request-budget': requestBudget,
    'earned-transfer': earnedTransfer,
  },
});

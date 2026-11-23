import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import intro from './stages/intro.mjs';
import alignmentSpace from './stages/alignment-space.mjs';
import contract from './stages/contract.mjs';
import measurementStatus from './stages/measurement-status.mjs';
import check from './stages/check.mjs';
import outcomeProcess from './stages/outcome-process.mjs';
import numericParser from './stages/numeric-parser.mjs';
import trustedExecution from './stages/trusted-execution.mjs';
import hiddenCases from './stages/hidden-cases.mjs';
import instructionContract from './stages/instruction-contract.mjs';
import formalSql from './stages/formal-sql.mjs';
import group from './stages/group.mjs';
import criticReturn from './stages/critic-return.mjs';
import grpo from './stages/grpo.mjs';
import populationGroup from './stages/population-group.mjs';
import tokenSurrogate from './stages/token-surrogate.mjs';
import klValueGradient from './stages/kl-value-gradient.mjs';
import samplingBudget from './stages/sampling-budget.mjs';
import trainerContract from './stages/trainer-contract.mjs';
import update from './stages/update.mjs';
import categoricalStep from './stages/categorical-step.mjs';
import r1ZeroAndMetrics from './stages/r1-zero-and-metrics.mjs';
import r1Pipeline from './stages/r1-pipeline.mjs';
import reportedPatterns from './stages/reported-patterns.mjs';
import spuriousRewards from './stages/spurious-rewards.mjs';
import failure from './stages/failure.mjs';
import parserPressure from './stages/parser-pressure.mjs';
import rewardPriority from './stages/reward-priority.mjs';
import evaluate from './stages/evaluate.mjs';
import capabilityGates from './stages/capability-gates.mjs';
import labExactness from './stages/lab-exactness.mjs';
import teacherTransfer from './stages/teacher-transfer.mjs';
import freshBatchRepair from './stages/fresh-batch-repair.mjs';
import freshStepPayoff from './stages/fresh-step-payoff.mjs';
export {
  arithmeticEvaluation,
  categoricalUpdate,
  groupStatistics,
  rlvrClipped,
  rlvrDecimal,
  rlvrDecimalCheck,
  rlvrGroupUpdate,
  rlvrKl,
  rlvrMixedProbability,
  rlvrReduction,
  rlvrRepair,
  rlvrSoftmax,
} from './arithmetic.mjs';
export { arithmeticCheck, checkedGroupState, grpoConstructionState } from './construction.mjs';
export { ANSWERS, REWARDS } from './fixtures.mjs';
export { validateModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'verifiable-rewards',
  validateModel,
  scenes: [
    intro,
    alignmentSpace,
    contract,
    measurementStatus,
    check,
    outcomeProcess,
    numericParser,
    trustedExecution,
    hiddenCases,
    instructionContract,
    formalSql,
    group,
    criticReturn,
    grpo,
    populationGroup,
    tokenSurrogate,
    klValueGradient,
    samplingBudget,
    trainerContract,
    update,
    categoricalStep,
    r1ZeroAndMetrics,
    r1Pipeline,
    reportedPatterns,
    spuriousRewards,
    failure,
    parserPressure,
    rewardPriority,
    evaluate,
    capabilityGates,
    labExactness,
    teacherTransfer,
    freshBatchRepair,
    freshStepPayoff,
  ],
});
export const draw = definition.draw;
export default definition;

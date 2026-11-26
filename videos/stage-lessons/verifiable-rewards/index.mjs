// Cinematic Vizmatic 0.10.0 stage film for Learning from Answers We Can Check (RLVR / GRPO, 34 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyVerifiableRewardsInvariants } from './parts.mjs';
import alignmentSpace from './scenes/alignment-space.mjs';
import capabilityGates from './scenes/capability-gates.mjs';
import categoricalStep from './scenes/categorical-step.mjs';
import check from './scenes/check.mjs';
import contract from './scenes/contract.mjs';
import criticReturn from './scenes/critic-return.mjs';
import evaluate from './scenes/evaluate.mjs';
import failure from './scenes/failure.mjs';
import formalSql from './scenes/formal-sql.mjs';
import freshBatchRepair from './scenes/fresh-batch-repair.mjs';
import freshStepPayoff from './scenes/fresh-step-payoff.mjs';
import groupScene from './scenes/group.mjs';
import grpo from './scenes/grpo.mjs';
import hiddenCases from './scenes/hidden-cases.mjs';
import instructionContract from './scenes/instruction-contract.mjs';
import intro from './scenes/intro.mjs';
import klValueGradient from './scenes/kl-value-gradient.mjs';
import labExactness from './scenes/lab-exactness.mjs';
import measurementStatus from './scenes/measurement-status.mjs';
import numericParser from './scenes/numeric-parser.mjs';
import outcomeProcess from './scenes/outcome-process.mjs';
import parserPressure from './scenes/parser-pressure.mjs';
import populationGroup from './scenes/population-group.mjs';
import r1Pipeline from './scenes/r1-pipeline.mjs';
import r1ZeroAndMetrics from './scenes/r1-zero-and-metrics.mjs';
import reportedPatterns from './scenes/reported-patterns.mjs';
import rewardPriority from './scenes/reward-priority.mjs';
import samplingBudget from './scenes/sampling-budget.mjs';
import spuriousRewards from './scenes/spurious-rewards.mjs';
import teacherTransfer from './scenes/teacher-transfer.mjs';
import tokenSurrogate from './scenes/token-surrogate.mjs';
import trainerContract from './scenes/trainer-contract.mjs';
import trustedExecution from './scenes/trusted-execution.mjs';
import update from './scenes/update.mjs';

export default cinematicLesson({
  id: 'verifiable-rewards',
  accent: COSMOS.emerald,
  invariants: verifyVerifiableRewardsInvariants,
  scenes: {
    intro,
    'alignment-space': alignmentSpace,
    contract,
    'measurement-status': measurementStatus,
    check,
    'outcome-process': outcomeProcess,
    'numeric-parser': numericParser,
    'trusted-execution': trustedExecution,
    'hidden-cases': hiddenCases,
    'instruction-contract': instructionContract,
    'formal-sql': formalSql,
    group: groupScene,
    'critic-return': criticReturn,
    grpo,
    'population-group': populationGroup,
    'token-surrogate': tokenSurrogate,
    'kl-value-gradient': klValueGradient,
    'sampling-budget': samplingBudget,
    'trainer-contract': trainerContract,
    update,
    'categorical-step': categoricalStep,
    'r1-zero-and-metrics': r1ZeroAndMetrics,
    'r1-pipeline': r1Pipeline,
    'reported-patterns': reportedPatterns,
    'spurious-rewards': spuriousRewards,
    failure,
    'parser-pressure': parserPressure,
    'reward-priority': rewardPriority,
    evaluate,
    'capability-gates': capabilityGates,
    'lab-exactness': labExactness,
    'teacher-transfer': teacherTransfer,
    'fresh-batch-repair': freshBatchRepair,
    'fresh-step-payoff': freshStepPayoff,
  },
});

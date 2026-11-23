import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import opening from './stages/opening.mjs';
import curatedData from './stages/curated-data.mjs';
import pretraining from './stages/pretraining.mjs';
import computeBudget from './stages/compute-budget.mjs';
import postTraining from './stages/post-training.mjs';
import assistantLossContract from './stages/assistant-loss-contract.mjs';
import preferenceAndReward from './stages/preference-and-reward.mjs';
import benchmarkEvidence from './stages/benchmark-evidence.mjs';
import judgeCalibration from './stages/judge-calibration.mjs';
import evaluation from './stages/evaluation.mjs';
import releaseReportBinding from './stages/release-report-binding.mjs';
import compression from './stages/compression.mjs';
import quantizationOperation from './stages/quantization-operation.mjs';
import serving from './stages/serving.mjs';
import servingMeasurements from './stages/serving-measurements.mjs';
import speculativePrefix from './stages/speculative-prefix.mjs';
import authorizedRouting from './stages/authorized-routing.mjs';
import failureInvestigation from './stages/failure-investigation.mjs';
import diagnose from './stages/diagnose.mjs';
import freshPolicyCache from './stages/fresh-policy-cache.mjs';
export {
  bpeState,
  computeRows,
  fixtureReport,
  mergePair,
  pairCounts,
  policyDiagnosis,
  policyShift,
  postTrainingCases,
  quantizationToy,
  releaseGate,
  responseCacheDecision,
  scorePolicyCase,
  servingWindow,
  verifierScore,
  weightMemory,
} from './arithmetic.mjs';
export { sampleModel, validateLifecycleUpgrade, validateModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'llm-lifecycle-training-to-deployment',
  validateModel,
  scenes: [
    opening,
    curatedData,
    pretraining,
    computeBudget,
    postTraining,
    assistantLossContract,
    preferenceAndReward,
    benchmarkEvidence,
    judgeCalibration,
    evaluation,
    releaseReportBinding,
    compression,
    quantizationOperation,
    serving,
    servingMeasurements,
    speculativePrefix,
    authorizedRouting,
    failureInvestigation,
    diagnose,
    freshPolicyCache,
  ],
});
export const draw = definition.draw;
export default definition;

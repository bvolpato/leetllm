import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import { drawUnrecognizedScene } from './compatibility.mjs';
import introStage from './stages/intro.mjs';
import labelsStage from './stages/labels.mjs';
import groupTimeManifestStage from './stages/group-time-manifest.mjs';
import baselineContractStage from './stages/baseline-contract.mjs';
import representationStage from './stages/representation.mjs';
import stablePositiveScoreStage from './stages/stable-positive-score.mjs';
import learningStage from './stages/learning.mjs';
import embeddingBackwardStage from './stages/embedding-backward.mjs';
import tinyTrainingRunStage from './stages/tiny-training-run.mjs';
import pretrainedEncoderStage from './stages/pretrained-encoder.mjs';
import trainingInputsStage from './stages/training-inputs.mjs';
import checkpointExportStage from './stages/checkpoint-export.mjs';
import reloadContractStage from './stages/reload-contract.mjs';
import thresholdStage from './stages/threshold.mjs';
import selectionCostStage from './stages/selection-cost.mjs';
import frozenGateStage from './stages/frozen-gate.mjs';
import receiptSchemaStage from './stages/receipt-schema.mjs';
import arithmeticProvenanceStage from './stages/arithmetic-provenance.mjs';
import actualModelGateStage from './stages/actual-model-gate.mjs';
import calibrationStage from './stages/calibration.mjs';
import reliabilityBucketsStage from './stages/reliability-buckets.mjs';
import fallbackStage from './stages/fallback.mjs';
import invalidComparisonStage from './stages/invalid-comparison.mjs';
import servingPolicyStage from './stages/serving-policy.mjs';
import pinnedHandoffStage from './stages/pinned-handoff.mjs';
import shadowRollbackStage from './stages/shadow-rollback.mjs';
import synthesisStage from './stages/synthesis.mjs';
import freshIntakeStage from './stages/fresh-intake.mjs';
export { GATE_CASES } from './fixtures.mjs';
export {
  actualModelComparison,
  backpropagationStep,
  counts,
  evaluateGate,
  fallback,
  maskedMean,
  temperature,
  thresholdCounts,
  trainHead,
} from './model.mjs';
export {
  classifierCueProgress,
  freshIntake,
  representationSnapshot,
  sampleModel,
  thresholdSnapshot,
  trainingFrame,
} from './construction.mjs';
export { validateExpandedModel, validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'capstone-fine-tuned-classifier',
  validateModel,
  scenes: [
    introStage,
    labelsStage,
    groupTimeManifestStage,
    baselineContractStage,
    representationStage,
    stablePositiveScoreStage,
    learningStage,
    embeddingBackwardStage,
    tinyTrainingRunStage,
    pretrainedEncoderStage,
    trainingInputsStage,
    checkpointExportStage,
    reloadContractStage,
    thresholdStage,
    selectionCostStage,
    frozenGateStage,
    receiptSchemaStage,
    arithmeticProvenanceStage,
    actualModelGateStage,
    calibrationStage,
    reliabilityBucketsStage,
    fallbackStage,
    invalidComparisonStage,
    servingPolicyStage,
    pinnedHandoffStage,
    shadowRollbackStage,
    synthesisStage,
    freshIntakeStage,
  ],
});
export function draw(ctx, scene, state, api) {
  if (
    ['intro', 'labels', 'representation', 'learning', 'threshold', 'calibration'].includes(
      scene.id,
    ) &&
    scene.id in {}
  )
    return drawUnrecognizedScene(ctx, scene, state, api);
  if (!definition.scenes.some((s) => s.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({
  ...definition,
  draw,
});

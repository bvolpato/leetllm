import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import openingStage from './stages/opening.mjs';
import recordContractStage from './stages/record-contract.mjs';
import fingerprintStage from './stages/fingerprint.mjs';
import inputLineageStage from './stages/input-lineage.mjs';
import pairedStage from './stages/paired.mjs';
import tradeoffStage from './stages/tradeoff.mjs';
import lineageStage from './stages/lineage.mjs';
import runStorageStage from './stages/run-storage.mjs';
import comparabilityStage from './stages/comparability.mjs';
import saturationStage from './stages/saturation.mjs';
import platformsStage from './stages/platforms.mjs';
import registryObjectStage from './stages/registry-object.mjs';
import versionConfigStage from './stages/version-config.mjs';
import aliasWorkersStage from './stages/alias-workers.mjs';
import sdkReadbackStage from './stages/sdk-readback.mjs';
import weaveCallTreeStage from './stages/weave-call-tree.mjs';
import tokenCostStage from './stages/token-cost.mjs';
import receiptValidationStage from './stages/receipt-validation.mjs';
import feedbackStage from './stages/feedback.mjs';
import reviewBoundaryStage from './stages/review-boundary.mjs';
import compiledContractStage from './stages/compiled-contract.mjs';
import handoffStage from './stages/handoff.mjs';
import freshContractStage from './stages/fresh-contract.mjs';
export { CASES } from './fixtures.mjs';
export {
  canaryAction,
  comparable,
  evaluate,
  fingerprint,
  freshTracking,
  makeRun,
  predict,
  pricedTokens,
  sampleModel,
  validateModel,
  verifyRun,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'experiment-tracking-mlflow-wandb',
  validateModel,
  scenes: [
    openingStage,
    recordContractStage,
    fingerprintStage,
    inputLineageStage,
    pairedStage,
    tradeoffStage,
    lineageStage,
    runStorageStage,
    comparabilityStage,
    saturationStage,
    platformsStage,
    registryObjectStage,
    versionConfigStage,
    aliasWorkersStage,
    sdkReadbackStage,
    weaveCallTreeStage,
    tokenCostStage,
    receiptValidationStage,
    feedbackStage,
    reviewBoundaryStage,
    compiledContractStage,
    handoffStage,
    freshContractStage,
  ],
});
export const draw = definition.draw;
export default definition;

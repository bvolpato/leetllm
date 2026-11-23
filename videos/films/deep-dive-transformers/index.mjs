import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import { rejectUnknownScene } from './compatibility.mjs';
import introStage from './stages/intro.mjs';
import fourContractsStage from './stages/four-contracts.mjs';
import identityStage from './stages/identity.mjs';
import lifecycleStage from './stages/lifecycle.mjs';
import loadSafetyStage from './stages/load-safety.mjs';
import offloadExecutionStage from './stages/offload-execution.mjs';
import autoStage from './stages/auto.mjs';
import autoExtensionStage from './stages/auto-extension.mjs';
import chatStage from './stages/chat.mjs';
import tokenizerFieldsStage from './stages/tokenizer-fields.mjs';
import processorsStage from './stages/processors.mjs';
import paddingStage from './stages/padding.mjs';
import lossStage from './stages/loss.mjs';
import outputContractStage from './stages/output-contract.mjs';
import realCpuStage from './stages/real-cpu.mjs';
import cacheStage from './stages/cache.mjs';
import hybridBudgetStage from './stages/hybrid-budget.mjs';
import cacheIdentityStage from './stages/cache-identity.mjs';
import generationStage from './stages/generation.mjs';
import decodingPolicyStage from './stages/decoding-policy.mjs';
import servingBoundaryStage from './stages/serving-boundary.mjs';
import driftTestsStage from './stages/drift-tests.mjs';
import projectSourceStage from './stages/project-source.mjs';
import releaseReceiptStage from './stages/release-receipt.mjs';
import freshResumeStage from './stages/fresh-resume.mjs';
export {
  freshResumeSnapshot,
  generationState,
  generationTrace,
  hybridCacheBytes,
  kvBytes,
  lossTrace,
  sampleModel,
  serialize,
  validateModel,
} from './model.mjs';
const orderedDefinition = defineCanvasLesson({
  id: 'deep-dive-transformers',
  validateModel,
  scenes: [
    introStage,
    fourContractsStage,
    identityStage,
    lifecycleStage,
    loadSafetyStage,
    offloadExecutionStage,
    autoStage,
    autoExtensionStage,
    chatStage,
    tokenizerFieldsStage,
    processorsStage,
    paddingStage,
    lossStage,
    outputContractStage,
    realCpuStage,
    cacheStage,
    hybridBudgetStage,
    cacheIdentityStage,
    generationStage,
    decodingPolicyStage,
    servingBoundaryStage,
    driftTestsStage,
    projectSourceStage,
    releaseReceiptStage,
    freshResumeStage,
  ],
});
const stages = new Map([
  ['intro', introStage],
  ['four-contracts', fourContractsStage],
  ['identity', identityStage],
  ['lifecycle', lifecycleStage],
  ['load-safety', loadSafetyStage],
  ['offload-execution', offloadExecutionStage],
  ['auto', autoStage],
  ['auto-extension', autoExtensionStage],
  ['chat', chatStage],
  ['tokenizer-fields', tokenizerFieldsStage],
  ['processors', processorsStage],
  ['padding', paddingStage],
  ['loss', lossStage],
  ['output-contract', outputContractStage],
  ['real-cpu', realCpuStage],
  ['cache', cacheStage],
  ['hybrid-budget', hybridBudgetStage],
  ['cache-identity', cacheIdentityStage],
  ['generation', generationStage],
  ['decoding-policy', decodingPolicyStage],
  ['serving-boundary', servingBoundaryStage],
  ['drift-tests', driftTestsStage],
  ['project-source', projectSourceStage],
  ['release-receipt', releaseReceiptStage],
  ['fresh-resume', freshResumeStage],
]);
export function draw(ctx, scene, state, api) {
  const stage = stages.get(scene.id);
  return stage ? stage.draw(ctx, scene, state, api) : rejectUnknownScene(ctx, scene, state, api);
}
const definition = Object.freeze({
  ...orderedDefinition,
  draw,
});
export default definition;

import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import { originalUnknownScene, currentUnknownScene } from './compatibility.mjs';
import { PROFILE_CHAPTERS } from './fixtures.mjs';
import introStage from './stages/intro.mjs';
import eventContractStage from './stages/event-contract.mjs';
import tailStage from './stages/tail.mjs';
import referenceCasesStage from './stages/reference-cases.mjs';
import toleranceStage from './stages/tolerance.mjs';
import sanitizerScopesStage from './stages/sanitizer-scopes.mjs';
import warmupStage from './stages/warmup.mjs';
import cacheAllocationStage from './stages/cache-allocation.mjs';
import trafficStage from './stages/traffic.mjs';
import rooflineStage from './stages/roofline.mjs';
import rooflineDiagnosisStage from './stages/roofline-diagnosis.mjs';
import replayContractStage from './stages/replay-contract.mjs';
import labExecutionStage from './stages/lab-execution.mjs';
import sampleContractStage from './stages/sample-contract.mjs';
import pairedStage from './stages/paired.mjs';
import receiptParserStage from './stages/receipt-parser.mjs';
import systemPayoffStage from './stages/system-payoff.mjs';
import receiptStage from './stages/receipt.mjs';
import freshArtifactStage from './stages/fresh-artifact.mjs';
export { ACTUAL_LAB_RUN, PROFILE_CHAPTERS } from './fixtures.mjs';
export {
  freshProfileSnapshot,
  interpolatedQuantile,
  launchContract,
  parseSampleArtifact,
  receiptFixture,
  replayMemory,
  rooflineFixture,
  rotationPool,
  sampleDigest,
  sampleModel,
  serialPayoff,
  validateModel,
  validateProfileModel,
} from './model.mjs';
const orderedDefinition = defineCanvasLesson({
  id: 'gpu-profiling-correctness-benchmarking',
  validateModel,
  scenes: [
    introStage,
    eventContractStage,
    tailStage,
    referenceCasesStage,
    toleranceStage,
    sanitizerScopesStage,
    warmupStage,
    cacheAllocationStage,
    trafficStage,
    rooflineStage,
    rooflineDiagnosisStage,
    replayContractStage,
    labExecutionStage,
    sampleContractStage,
    pairedStage,
    receiptParserStage,
    systemPayoffStage,
    receiptStage,
    freshArtifactStage,
  ],
});
const originalStages = new Map([
  ['intro', introStage],
  ['tail', tailStage],
  ['tolerance', toleranceStage],
  ['warmup', warmupStage],
  ['traffic', trafficStage],
  ['paired', pairedStage],
  ['receipt', receiptStage],
]);
const currentStages = new Map([
  ['event-contract', eventContractStage],
  ['reference-cases', referenceCasesStage],
  ['sanitizer-scopes', sanitizerScopesStage],
  ['cache-allocation', cacheAllocationStage],
  ['roofline', rooflineStage],
  ['roofline-diagnosis', rooflineDiagnosisStage],
  ['replay-contract', replayContractStage],
  ['lab-execution', labExecutionStage],
  ['sample-contract', sampleContractStage],
  ['receipt-parser', receiptParserStage],
  ['system-payoff', systemPayoffStage],
  ['fresh-artifact', freshArtifactStage],
]);
export function draw(ctx, scene, state, api) {
  if (PROFILE_CHAPTERS.includes(scene.id)) {
    const stage = currentStages.get(scene.id);
    return stage ? stage.draw(ctx, scene, state, api) : currentUnknownScene(ctx, scene, state, api);
  }
  const stage = originalStages.get(scene.id);
  return stage ? stage.draw(ctx, scene, state, api) : originalUnknownScene(ctx, scene, state, api);
}
const definition = Object.freeze({
  ...orderedDefinition,
  draw,
});
export default definition;

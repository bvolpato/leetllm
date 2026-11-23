import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import introStage from './stages/intro.mjs';
import workerInterfaceStage from './stages/worker-interface.mjs';
import contractStage from './stages/contract.mjs';
import runnerPolicyStage from './stages/runner-policy.mjs';
import replayStage from './stages/replay.mjs';
import raceStage from './stages/race.mjs';
import loopStage from './stages/loop.mjs';
import verifierTrapsStage from './stages/verifier-traps.mjs';
import scopeStage from './stages/scope.mjs';
import snapshotContractStage from './stages/snapshot-contract.mjs';
import receiptsStage from './stages/receipts.mjs';
import receiptContractStage from './stages/receipt-contract.mjs';
import rolesAndFailuresStage from './stages/roles-and-failures.mjs';
import benchmarkContextStage from './stages/benchmark-context.mjs';
import handoffStage from './stages/handoff.mjs';
import freshHandoffStage from './stages/fresh-handoff.mjs';
export { REQUIRED_WORKFLOW_CHECKS } from './fixtures.mjs';
export {
  baseHandler,
  fixedHandler,
  freshConcurrentLedger,
  handoffPrediction,
  inScope,
  patchReviewSnapshot,
  raceSnapshot,
  raceTrace,
  receiptOK,
  replay,
  replayEvidence,
  runnerCapability,
  sampleModel,
  strictWorkflowReceipt,
  validateModel,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'ai-coding-workflow-with-agents',
  validateModel,
  scenes: [
    introStage,
    workerInterfaceStage,
    contractStage,
    runnerPolicyStage,
    replayStage,
    raceStage,
    loopStage,
    verifierTrapsStage,
    scopeStage,
    snapshotContractStage,
    receiptsStage,
    receiptContractStage,
    rolesAndFailuresStage,
    benchmarkContextStage,
    handoffStage,
    freshHandoffStage,
  ],
});
export const draw = definition.draw;
export default definition;

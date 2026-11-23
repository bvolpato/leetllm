import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import intro from './stages/intro.mjs';
import intake from './stages/intake.mjs';
import sourceEvidence from './stages/source-evidence.mjs';
import loop from './stages/loop.mjs';
import dispatchStage from './stages/dispatch.mjs';
import approval from './stages/approval.mjs';
import replay from './stages/replay.mjs';
import expiry from './stages/expiry.mjs';
import traceBudget from './stages/trace-budget.mjs';
import evaluation from './stages/evaluation.mjs';
import releaseMutations from './stages/release-mutations.mjs';
import operationalContract from './stages/operational-contract.mjs';
import synthesis from './stages/synthesis.mjs';
export {
  composedRepairFixture,
  dispatch,
  episodeInventoryCheck,
  execute,
  expiryConstruction,
  expiryReadout,
  packetEvidenceFixture,
  plannerFacts,
  replaySnapshot,
  sampleModel,
  synthesisTrace,
  traceBudgetFixture,
  transactionTrace,
  validateModel,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'capstone-production-llm-agent',
  validateModel,
  scenes: [
    intro,
    intake,
    sourceEvidence,
    loop,
    dispatchStage,
    approval,
    replay,
    expiry,
    traceBudget,
    evaluation,
    releaseMutations,
    operationalContract,
    synthesis,
  ],
});
export const draw = definition.draw;
export default definition;

import { drawUnknownSupportScene } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import introStage from './stages/intro.mjs';
import channelsAndFencesStage from './stages/channels-and-fences.mjs';
import stateStage from './stages/state.mjs';
import contractAndFallbackStage from './stages/contract-and-fallback.mjs';
import evidenceStage from './stages/evidence.mjs';
import policyStage from './stages/policy.mjs';
import parallelStage from './stages/parallel.mjs';
import ledgerStage from './stages/ledger.mjs';
import repairAndStatusStage from './stages/repair-and-status.mjs';
import handoffStage from './stages/handoff.mjs';
import ticketBudgetStage from './stages/ticket-budget.mjs';
import evaluationStage from './stages/evaluation.mjs';
import freshCaseStage from './stages/fresh-case.mjs';
export { supportCost, tuple } from './arithmetic.mjs';
export { freshSupportCase, supportFreshFrame } from './construction.mjs';
export {
  acknowledgmentMatches,
  confirmationFrame,
  decide,
  enqueue,
  evidenceErrors,
  mergeObservation,
  packet,
  payload,
  replay,
  sampleModel,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'design-conversational-ai-support-bot',
  validateModel,
  scenes: [
    introStage,
    channelsAndFencesStage,
    stateStage,
    contractAndFallbackStage,
    evidenceStage,
    policyStage,
    parallelStage,
    ledgerStage,
    repairAndStatusStage,
    handoffStage,
    ticketBudgetStage,
    evaluationStage,
    freshCaseStage,
  ],
});
const stageDraws = new Map(definition.scenes.map((stage) => [stage.id, stage.draw]));
export function draw(ctx, scene, state, api) {
  const painter = stageDraws.get(scene.id);
  return painter
    ? painter(ctx, scene, state, api)
    : drawUnknownSupportScene(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });

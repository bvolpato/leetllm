import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import subjectIntro from './stages/subject-intro.mjs';
import separateChecks from './stages/separate-checks.mjs';
import evaluationFormats from './stages/evaluation-formats.mjs';
import rubric from './stages/rubric.mjs';
import strictReceipt from './stages/strict-receipt.mjs';
import readerModelCheck from './stages/reader-model-check.mjs';
import orderSwap from './stages/order-swap.mjs';
import swapContract from './stages/swap-contract.mjs';
import blindAndProbe from './stages/blind-and-probe.mjs';
import controlledProbes from './stages/controlled-probes.mjs';
import humanReference from './stages/human-reference.mjs';
import agreement from './stages/agreement.mjs';
import prevalenceTrap from './stages/prevalence-trap.mjs';
import coverage from './stages/coverage.mjs';
import stateHistory from './stages/state-history.mjs';
import zeroErrorBound from './stages/zero-error-bound.mjs';
import transfer from './stages/transfer.mjs';
import freshDecision from './stages/fresh-decision.mjs';
export { coverageFrame } from './construction.mjs';
export { judgeReport } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'llm-judge',
  validateModel,
  scenes: [
    subjectIntro,
    separateChecks,
    evaluationFormats,
    rubric,
    strictReceipt,
    readerModelCheck,
    orderSwap,
    swapContract,
    blindAndProbe,
    controlledProbes,
    humanReference,
    agreement,
    prevalenceTrap,
    coverage,
    stateHistory,
    zeroErrorBound,
    transfer,
    freshDecision,
  ],
});
export function draw(ctx, scene, state, api) {
  if (definition.scenes.some((stage) => stage.id === scene.id))
    return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });

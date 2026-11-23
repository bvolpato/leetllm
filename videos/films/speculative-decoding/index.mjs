import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import weightRoofline from './stages/weight-roofline.mjs';
import weightReuse from './stages/weight-reuse.mjs';
import draft from './stages/draft.mjs';
import servingLaws from './stages/serving-laws.mjs';
import eventMapping from './stages/event-mapping.mjs';
import accept from './stages/accept.mjs';
import residual from './stages/residual.mjs';
import proof from './stages/proof.mjs';
import wrongCorrection from './stages/wrong-correction.mjs';
import chain from './stages/chain.mjs';
import rowAlignment from './stages/row-alignment.mjs';
import commit from './stages/commit.mjs';
import roundCpu from './stages/round-cpu.mjs';
import sequenceCheck from './stages/sequence-check.mjs';
import cost from './stages/cost.mjs';
import positionYield from './stages/position-yield.mjs';
import loadCost from './stages/load-cost.mjs';
import verificationBudgetStage from './stages/verification-budget.mjs';
import treeMask from './stages/tree-mask.mjs';
import treeLeak from './stages/tree-leak.mjs';
import medusaContract from './stages/medusa-contract.mjs';
import eagleFamily from './stages/eagle-family.mjs';
import lookupMethods from './stages/lookup-methods.mjs';
import blockContract from './stages/block-contract.mjs';
import pairedService from './stages/paired-service.mjs';
import diagnose from './stages/diagnose.mjs';
import transfer from './stages/transfer.mjs';
import freshState from './stages/fresh-state.mjs';
export {
  correctionCounterexample,
  decomposition,
  deliverUntilStop,
  expectedYield,
  isolationFixture,
  prefixStates,
  sampleProposal,
  samplerBoundary,
  transformedLaw,
  verificationBudget,
  visibility,
  weightWorksheet,
} from './arithmetic.mjs';
export { CHAIN, P, Q, SAMPLING_COUNTS, WORDS } from './fixtures.mjs';
export {
  acceptanceTestSnapshot,
  chainSnapshot,
  freshStateFrame,
  residualSnapshot,
  transferSnapshot,
  verifyChain,
} from './model.mjs';
export { validateConstructions, validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'speculative-decoding',
  validateModel,
  scenes: [
    intro,
    draft,
    accept,
    residual,
    proof,
    wrongCorrection,
    servingLaws,
    eventMapping,
    chain,
    rowAlignment,
    commit,
    roundCpu,
    sequenceCheck,
    weightRoofline,
    weightReuse,
    cost,
    positionYield,
    loadCost,
    verificationBudgetStage,
    treeMask,
    treeLeak,
    medusaContract,
    eagleFamily,
    lookupMethods,
    blockContract,
    pairedService,
    diagnose,
    transfer,
    freshState,
  ],
});
export const draw = definition.draw;
export default definition;

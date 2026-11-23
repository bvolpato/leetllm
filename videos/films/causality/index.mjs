import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import introStage from './stages/intro.mjs';
import policyDefinitionStage from './stages/policy-definition.mjs';
import simpsonStage from './stages/simpson.mjs';
import graphStage from './stages/graph.mjs';
import graphJunctionsStage from './stages/graph-junctions.mjs';
import backdoorSetStage from './stages/backdoor-set.mjs';
import interveneStage from './stages/intervene.mjs';
import standardizeStage from './stages/standardize.mjs';
import standardizeUncertaintyStage from './stages/standardize-uncertainty.mjs';
import potentialStage from './stages/potential.mjs';
import estimandsStage from './stages/estimands.mjs';
import harmBoundsStage from './stages/harm-bounds.mjs';
import overlapStage from './stages/overlap.mjs';
import weightedTicketsStage from './stages/weighted-tickets.mjs';
import weightChoicesStage from './stages/weight-choices.mjs';
import supportSamplingStage from './stages/support-sampling.mjs';
import instrumentStage from './stages/instrument.mjs';
import waldLateStage from './stages/wald-late.mjs';
import weakInstrumentStage from './stages/weak-instrument.mjs';
import policyValueStage from './stages/policy-value.mjs';
import drCorrectionStage from './stages/dr-correction.mjs';
import drAssumptionsStage from './stages/dr-assumptions.mjs';
import sequentialPolicyStage from './stages/sequential-policy.mjs';
import clickExposureStage from './stages/click-exposure.mjs';
import replayStateStage from './stages/replay-state.mjs';
import releaseReceiptStage from './stages/release-receipt.mjs';
import selectionStage from './stages/selection.mjs';
import freshAuditStage from './stages/fresh-audit.mjs';
export {
  auditSelectionState,
  causalTicketLedger,
  clickExposureFixture,
  effectAtMix,
  freshAuditFixture,
  instrumentFixture,
  junctionPathOpen,
  monotoneCompliance,
  policyValueFixture,
  replayReplacementFixture,
  responseTypePairing,
  standardizationState,
  standardizedFixture,
  weightedTicketFixture,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'causality',
  validateModel,
  scenes: [
    introStage,
    policyDefinitionStage,
    simpsonStage,
    graphStage,
    graphJunctionsStage,
    backdoorSetStage,
    interveneStage,
    standardizeStage,
    standardizeUncertaintyStage,
    potentialStage,
    estimandsStage,
    harmBoundsStage,
    overlapStage,
    weightedTicketsStage,
    weightChoicesStage,
    supportSamplingStage,
    instrumentStage,
    waldLateStage,
    weakInstrumentStage,
    policyValueStage,
    drCorrectionStage,
    drAssumptionsStage,
    sequentialPolicyStage,
    clickExposureStage,
    replayStateStage,
    releaseReceiptStage,
    selectionStage,
    freshAuditStage,
  ],
});
export const draw = definition.draw;
export default definition;

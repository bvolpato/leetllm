import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import randomize from './stages/randomize.mjs';
import unitAndInterference from './stages/unit-and-interference.mjs';
import metric from './stages/metric.mjs';
import eventMaturity from './stages/event-maturity.mjs';
import liftStage from './stages/lift.mjs';
import independentUnits from './stages/independent-units.mjs';
import power from './stages/power.mjs';
import powerAndDecision from './stages/power-and-decision.mjs';
import srmStage from './stages/srm.mjs';
import peeking from './stages/peeking.mjs';
import alphaSpending from './stages/alpha-spending.mjs';
import mixtureEvidenceStage from './stages/mixture-evidence.mjs';
import cupedAdjustment from './stages/cuped-adjustment.mjs';
import banditRouting from './stages/bandit-routing.mjs';
import pairedPrompts from './stages/paired-prompts.mjs';
import evaluationStack from './stages/evaluation-stack.mjs';
import guardrails from './stages/guardrails.mjs';
import decision from './stages/decision.mjs';
import takeaway from './stages/takeaway.mjs';
import freshGrounding from './stages/fresh-grounding.mjs';
export { groundingRate, rate, requiredN, standardError } from './arithmetic.mjs';
export { report, srm } from './fixtures.mjs';
export {
  abJoinProbe,
  accumulatedOutcomes,
  alphaSpend,
  assignedArm,
  assignmentTrace,
  clusterDesignEffect,
  cupedVariance,
  freshGroundingReveal,
  groundingDelta,
  groundingPacket,
  groundingSe,
  groundingUpper,
  incidentOutcome,
  lift,
  liftInterval,
  mixtureEvidence,
  pairedContrastVariance,
  planningPower,
  projectedInterval,
  receiptMismatches,
  seLift,
  srmChiSquare,
} from './model.mjs';
export { validateABExpansion, validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'ab-testing',
  validateModel,
  scenes: [
    intro,
    randomize,
    unitAndInterference,
    metric,
    eventMaturity,
    liftStage,
    independentUnits,
    power,
    powerAndDecision,
    srmStage,
    peeking,
    alphaSpending,
    mixtureEvidenceStage,
    cupedAdjustment,
    banditRouting,
    pairedPrompts,
    evaluationStack,
    guardrails,
    decision,
    takeaway,
    freshGrounding,
  ],
});
export const draw = definition.draw;
export default definition;

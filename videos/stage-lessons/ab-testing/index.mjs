// Pure-cinema stage lesson for Experiment Design & A/B Testing (21 scenes).
import { COSMOS, cinematicLesson, verifyAbTestingInvariants } from './parts.mjs';
import intro from './scenes/intro.mjs';
import randomize from './scenes/randomize.mjs';
import unitAndInterference from './scenes/unit-and-interference.mjs';
import metric from './scenes/metric.mjs';
import eventMaturity from './scenes/event-maturity.mjs';
import lift from './scenes/lift.mjs';
import independentUnits from './scenes/independent-units.mjs';
import power from './scenes/power.mjs';
import powerAndDecision from './scenes/power-and-decision.mjs';
import srm from './scenes/srm.mjs';
import peeking from './scenes/peeking.mjs';
import alphaSpending from './scenes/alpha-spending.mjs';
import mixtureEvidence from './scenes/mixture-evidence.mjs';
import cupedAdjustment from './scenes/cuped-adjustment.mjs';
import banditRouting from './scenes/bandit-routing.mjs';
import pairedPrompts from './scenes/paired-prompts.mjs';
import evaluationStack from './scenes/evaluation-stack.mjs';
import guardrails from './scenes/guardrails.mjs';
import decision from './scenes/decision.mjs';
import takeaway from './scenes/takeaway.mjs';
import freshGrounding from './scenes/fresh-grounding.mjs';

export default cinematicLesson({
  id: 'ab-testing',
  accent: COSMOS.cyan,
  invariants: verifyAbTestingInvariants,
  scenes: {
    intro,
    randomize,
    'unit-and-interference': unitAndInterference,
    metric,
    'event-maturity': eventMaturity,
    lift,
    'independent-units': independentUnits,
    power,
    'power-and-decision': powerAndDecision,
    srm,
    peeking,
    'alpha-spending': alphaSpending,
    'mixture-evidence': mixtureEvidence,
    'cuped-adjustment': cupedAdjustment,
    'bandit-routing': banditRouting,
    'paired-prompts': pairedPrompts,
    'evaluation-stack': evaluationStack,
    guardrails,
    decision,
    takeaway,
    'fresh-grounding': freshGrounding,
  },
});

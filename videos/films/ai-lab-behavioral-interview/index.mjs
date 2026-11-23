import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import opening from './stages/opening.mjs';
import evidence from './stages/evidence.mjs';
import tradeoff from './stages/tradeoff.mjs';
import executableGate from './stages/executable-gate.mjs';
import canary from './stages/canary.mjs';
import practice from './stages/practice.mjs';
import unresolvedDisagreement from './stages/unresolved-disagreement.mjs';
import negativeEvidence from './stages/negative-evidence.mjs';
import storyBank from './stages/story-bank.mjs';
import weaknessEvidence from './stages/weakness-evidence.mjs';
import dualUse from './stages/dual-use.mjs';
import missionEvidence from './stages/mission-evidence.mjs';
import publishedGuidance from './stages/published-guidance.mjs';
import aiUsePolicy from './stages/ai-use-policy.mjs';
import rehearsalRepair from './stages/rehearsal-repair.mjs';
import freshDecision from './stages/fresh-decision.mjs';
export {
  canaryDecision,
  claimHeadroom,
  effectDecision,
  freshDecisionState,
  gatePredicates,
  holdoutOverlap,
  launchRecommendation,
  nearestRank,
  offlineDecision,
  publicRehearsalPacket,
  routingConcentration,
  storyAt,
  storySupports,
} from './arithmetic.mjs';
export { sampleModel } from './construction.mjs';
export { LATENCY_ILLUSTRATION } from './fixtures.mjs';
export { validateModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'ai-lab-behavioral-interview',
  validateModel,
  scenes: [
    opening,
    evidence,
    tradeoff,
    canary,
    executableGate,
    practice,
    unresolvedDisagreement,
    negativeEvidence,
    storyBank,
    weaknessEvidence,
    dualUse,
    missionEvidence,
    publishedGuidance,
    aiUsePolicy,
    rehearsalRepair,
    freshDecision,
  ],
});
export const draw = definition.draw;
export default definition;

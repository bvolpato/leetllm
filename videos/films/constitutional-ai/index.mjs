import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import intro from './stages/intro.mjs';
import principle from './stages/principle.mjs';
import critique from './stages/critique.mjs';
import sft from './stages/sft.mjs';
import rlaif from './stages/rlaif.mjs';
import orderNormalization from './stages/order-normalization.mjs';
import reward from './stages/reward.mjs';
import policyRl from './stages/policy-rl.mjs';
import methodContext from './stages/method-context.mjs';
import attackSearch from './stages/attack-search.mjs';
import attackLineage from './stages/attack-lineage.mjs';
import redTeam from './stages/red-team.mjs';
import auditAccounting from './stages/audit-accounting.mjs';
import judgeAuditStage from './stages/judge-audit.mjs';
import attackBudget from './stages/attack-budget.mjs';
import multiTurn from './stages/multi-turn.mjs';
import defenseEffects from './stages/defense-effects.mjs';
import evaluate from './stages/evaluate.mjs';
export {
  accessResult,
  auditCounts,
  budgetProbability,
  exactCandidate,
  judgeAudit,
  orderedVerdict,
  parseAttackBatch,
  policyObjective,
  releaseAudit,
  softPreferenceStep,
} from './arithmetic.mjs';
export { chapterFrame, probeFrame, supervisedToken } from './construction.mjs';
export { AUDIT_CASES, GCG_CANDIDATES, JUDGE_CASES, PROBES, orderAudit } from './fixtures.mjs';
export { validateModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'constitutional-ai',
  validateModel,
  scenes: [
    intro,
    principle,
    critique,
    sft,
    rlaif,
    orderNormalization,
    reward,
    policyRl,
    methodContext,
    attackSearch,
    attackLineage,
    redTeam,
    auditAccounting,
    judgeAuditStage,
    attackBudget,
    multiTurn,
    defenseEffects,
    evaluate,
  ],
});
export const draw = definition.draw;
export default definition;

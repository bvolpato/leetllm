import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import opening from './stages/opening.mjs';
import formatContract from './stages/format-contract.mjs';
import argument from './stages/argument.mjs';
import evidenceInventory from './stages/evidence-inventory.mjs';
import path from './stages/path.mjs';
import failureInvariant from './stages/failure-invariant.mjs';
import tradeoff from './stages/tradeoff.mjs';
import sourceWait from './stages/source-wait.mjs';
import pairedEvidenceStage from './stages/paired-evidence.mjs';
import pairedContract from './stages/paired-contract.mjs';
import typedComparison from './stages/typed-comparison.mjs';
import timeBudget from './stages/time-budget.mjs';
import interruptedRehearsal from './stages/interrupted-rehearsal.mjs';
import measurementLimits from './stages/measurement-limits.mjs';
import metricClaims from './stages/metric-claims.mjs';
import migrationStages from './stages/migration-stages.mjs';
import recoveryBoundary from './stages/recovery-boundary.mjs';
import qaClaimRepair from './stages/qa-claim-repair.mjs';
import roleBridge from './stages/role-bridge.mjs';
import rehearsalDiagnosis from './stages/rehearsal-diagnosis.mjs';
import nextExperiment from './stages/next-experiment.mjs';
import freshEvidenceStage from './stages/fresh-evidence.mjs';
export {
  incidentsPerMillion,
  interruptedBudget,
  pairedEvidence,
  serviceGate,
  sourceWaitBudget,
} from './arithmetic.mjs';
export { paginationSnapshot, pairedPlayback, sampleModel } from './construction.mjs';
export { TALK_BUDGET } from './fixtures.mjs';
export { freshEvidence, inspectPageTrace } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'ai-lab-technical-presentation',
  validateModel,
  scenes: [
    opening,
    formatContract,
    argument,
    evidenceInventory,
    path,
    failureInvariant,
    tradeoff,
    sourceWait,
    pairedEvidenceStage,
    pairedContract,
    typedComparison,
    timeBudget,
    interruptedRehearsal,
    measurementLimits,
    metricClaims,
    migrationStages,
    recoveryBoundary,
    qaClaimRepair,
    roleBridge,
    rehearsalDiagnosis,
    nextExperiment,
    freshEvidenceStage,
  ],
});
export function drawPresentationChapter(ctx, scene, state, api) {
  if (
    [
      'format-contract',
      'evidence-inventory',
      'failure-invariant',
      'source-wait',
      'paired-contract',
      'typed-comparison',
      'interrupted-rehearsal',
      'metric-claims',
      'migration-stages',
      'recovery-boundary',
      'qa-claim-repair',
      'role-bridge',
      'rehearsal-diagnosis',
      'fresh-evidence',
    ].includes(scene.id)
  )
    return definition.draw(ctx, scene, state, api);
}
export function draw(ctx, scene, state, api) {
  if (definition.scenes.some((stage) => stage.id === scene.id))
    return definition.draw(ctx, scene, state, api);
  throw new Error('unknown presentation scene: ' + scene.id);
}
export default Object.freeze({ ...definition, draw });

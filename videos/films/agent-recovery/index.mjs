import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import subjectIntro from './stages/subject-intro.mjs';
import actionBoundary from './stages/action-boundary.mjs';
import operationIdentity from './stages/operation-identity.mjs';
import commitBoundary from './stages/commit-boundary.mjs';
import retryClock from './stages/retry-clock.mjs';
import progressBudget from './stages/progress-budget.mjs';
import circuitBreaker from './stages/circuit-breaker.mjs';
import resumeWithEvidence from './stages/resume-with-evidence.mjs';
import replayContract from './stages/replay-contract.mjs';
import workflowWorld from './stages/workflow-world.mjs';
import spendBudget from './stages/spend-budget.mjs';
import breakerContract from './stages/breaker-contract.mjs';
import fallbackEvidence from './stages/fallback-evidence.mjs';
import compensation from './stages/compensation.mjs';
import recoveryTransfer from './stages/recovery-transfer.mjs';
export { fullJitter } from './arithmetic.mjs';
export {
  admissionDisplay,
  breakerDisplay,
  commitDisplay,
  introRecoverySnapshot,
  recoveryDisplay,
  recoveryTransferWaitConstruction,
} from './construction.mjs';
export {
  admitProbe,
  boundedRecoveryClaim,
  breakerLifecycle,
  breakerRace,
  breakerTransition,
  commitScenario,
  finishProbe,
  progressSequence,
  recoveryObservation,
  retrySchedule,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'agent-recovery',
  validateModel,
  scenes: [
    subjectIntro,
    actionBoundary,
    operationIdentity,
    commitBoundary,
    retryClock,
    progressBudget,
    circuitBreaker,
    resumeWithEvidence,
    replayContract,
    workflowWorld,
    spendBudget,
    breakerContract,
    fallbackEvidence,
    compensation,
    recoveryTransfer,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((candidate) => candidate.id === scene.id)) {
    throw new Error(`Unknown agent-recovery scene: ${scene.id}`);
  }
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });

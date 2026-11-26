// Full-bleed dark-cinema narrated stage film for `agent-recovery`.
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyAgentRecoveryInvariants } from './parts.mjs';
import actionBoundary from './scenes/action-boundary.mjs';
import breakerContract from './scenes/breaker-contract.mjs';
import circuitBreaker from './scenes/circuit-breaker.mjs';
import commitBoundary from './scenes/commit-boundary.mjs';
import compensation from './scenes/compensation.mjs';
import fallbackEvidence from './scenes/fallback-evidence.mjs';
import operationIdentity from './scenes/operation-identity.mjs';
import progressBudget from './scenes/progress-budget.mjs';
import recoveryTransfer from './scenes/recovery-transfer.mjs';
import replayContract from './scenes/replay-contract.mjs';
import resumeWithEvidence from './scenes/resume-with-evidence.mjs';
import retryClock from './scenes/retry-clock.mjs';
import spendBudget from './scenes/spend-budget.mjs';
import subjectIntro from './scenes/subject-intro.mjs';
import workflowWorld from './scenes/workflow-world.mjs';

export default cinematicLesson({
  id: 'agent-recovery',
  accent: COSMOS.cyan,
  invariants: verifyAgentRecoveryInvariants,
  scenes: {
    'subject-intro': subjectIntro,
    'action-boundary': actionBoundary,
    'operation-identity': operationIdentity,
    'commit-boundary': commitBoundary,
    'retry-clock': retryClock,
    'progress-budget': progressBudget,
    'circuit-breaker': circuitBreaker,
    'resume-with-evidence': resumeWithEvidence,
    'replay-contract': replayContract,
    'workflow-world': workflowWorld,
    'spend-budget': spendBudget,
    'breaker-contract': breakerContract,
    'fallback-evidence': fallbackEvidence,
    compensation,
    'recovery-transfer': recoveryTransfer,
  },
});

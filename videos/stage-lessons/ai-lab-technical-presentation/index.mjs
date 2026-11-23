import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import opening from './scenes/opening.mjs';
import formatContract from './scenes/format-contract.mjs';
import argument from './scenes/argument.mjs';
import evidenceInventory from './scenes/evidence-inventory.mjs';
import path from './scenes/path.mjs';
import failureInvariant from './scenes/failure-invariant.mjs';
import tradeoff from './scenes/tradeoff.mjs';
import sourceWait from './scenes/source-wait.mjs';
import pairedEvidence from './scenes/paired-evidence.mjs';
import pairedContract from './scenes/paired-contract.mjs';
import typedComparison from './scenes/typed-comparison.mjs';
import timeBudget from './scenes/time-budget.mjs';
import interruptedRehearsal from './scenes/interrupted-rehearsal.mjs';
import measurementLimits from './scenes/measurement-limits.mjs';
import metricClaims from './scenes/metric-claims.mjs';
import migrationStages from './scenes/migration-stages.mjs';
import recoveryBoundary from './scenes/recovery-boundary.mjs';
import qaClaimRepair from './scenes/qa-claim-repair.mjs';
import roleBridge from './scenes/role-bridge.mjs';
import rehearsalDiagnosis from './scenes/rehearsal-diagnosis.mjs';
import nextExperiment from './scenes/next-experiment.mjs';
import freshEvidence from './scenes/fresh-evidence.mjs';

export default narratedLesson({
  id: 'ai-lab-technical-presentation',
  scenes: {
    'opening': opening,
    'format-contract': formatContract,
    'argument': argument,
    'evidence-inventory': evidenceInventory,
    'path': path,
    'failure-invariant': failureInvariant,
    'tradeoff': tradeoff,
    'source-wait': sourceWait,
    'paired-evidence': pairedEvidence,
    'paired-contract': pairedContract,
    'typed-comparison': typedComparison,
    'time-budget': timeBudget,
    'interrupted-rehearsal': interruptedRehearsal,
    'measurement-limits': measurementLimits,
    'metric-claims': metricClaims,
    'migration-stages': migrationStages,
    'recovery-boundary': recoveryBoundary,
    'qa-claim-repair': qaClaimRepair,
    'role-bridge': roleBridge,
    'rehearsal-diagnosis': rehearsalDiagnosis,
    'next-experiment': nextExperiment,
    'fresh-evidence': freshEvidence,
  },
});

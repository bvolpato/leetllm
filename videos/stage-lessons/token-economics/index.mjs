// Cinematic Vizmatic stage lesson for Token Economics (all 25 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyTokenEconomicsInvariants } from './parts.mjs';
import accountingPhysics from './scenes/accounting-physics.mjs';
import atomicSettlement from './scenes/atomic-settlement.mjs';
import batchDeadline from './scenes/batch-deadline.mjs';
import batchRecovery from './scenes/batch-recovery.mjs';
import budgetQualityGate from './scenes/budget-quality-gate.mjs';
import cachePolicy from './scenes/cache-policy.mjs';
import cacheWrite from './scenes/cache-write.mjs';
import coldReservation from './scenes/cold-reservation.mjs';
import contextTier from './scenes/context-tier.mjs';
import dailyReplay from './scenes/daily-replay.mjs';
import freshEconomics from './scenes/fresh-economics.mjs';
import hiddenOutput from './scenes/hidden-output.mjs';
import historyLoop from './scenes/history-loop.mjs';
import intro from './scenes/intro.mjs';
import nightlyReceipt from './scenes/nightly-receipt.mjs';
import oneAnswer from './scenes/one-answer.mjs';
import outputAndRetries from './scenes/output-and-retries.mjs';
import prefixReuse from './scenes/prefix-reuse.mjs';
import qualityEvidence from './scenes/quality-evidence.mjs';
import receiptAnatomy from './scenes/receipt-anatomy.mjs';
import traceIntegrity from './scenes/trace-integrity.mjs';
import twelfthNight from './scenes/twelfth-night.mjs';
import twoReusePaths from './scenes/two-reuse-paths.mjs';
import usageContract from './scenes/usage-contract.mjs';
import wrap from './scenes/wrap.mjs';

export default cinematicLesson({
  id: 'token-economics',
  accent: COSMOS.gold,
  invariants: verifyTokenEconomicsInvariants,
  scenes: {
    intro,
    'receipt-anatomy': receiptAnatomy,
    'one-answer': oneAnswer,
    'prefix-reuse': prefixReuse,
    'two-reuse-paths': twoReusePaths,
    'accounting-physics': accountingPhysics,
    'usage-contract': usageContract,
    'hidden-output': hiddenOutput,
    'context-tier': contextTier,
    'cache-write': cacheWrite,
    'cache-policy': cachePolicy,
    'daily-replay': dailyReplay,
    'history-loop': historyLoop,
    'output-and-retries': outputAndRetries,
    wrap,
    'batch-deadline': batchDeadline,
    'nightly-receipt': nightlyReceipt,
    'batch-recovery': batchRecovery,
    'trace-integrity': traceIntegrity,
    'budget-quality-gate': budgetQualityGate,
    'quality-evidence': qualityEvidence,
    'cold-reservation': coldReservation,
    'atomic-settlement': atomicSettlement,
    'fresh-economics': freshEconomics,
    'twelfth-night': twelfthNight,
  },
});

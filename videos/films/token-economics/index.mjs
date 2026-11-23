import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import intro from './stages/intro.mjs';
import accountingPhysics from './stages/accounting-physics.mjs';
import receiptAnatomy from './stages/receipt-anatomy.mjs';
import usageContract from './stages/usage-contract.mjs';
import oneAnswer from './stages/one-answer.mjs';
import hiddenOutput from './stages/hidden-output.mjs';
import contextTier from './stages/context-tier.mjs';
import prefixReuse from './stages/prefix-reuse.mjs';
import cacheWrite from './stages/cache-write.mjs';
import cachePolicy from './stages/cache-policy.mjs';
import twoReusePaths from './stages/two-reuse-paths.mjs';
import dailyReplay from './stages/daily-replay.mjs';
import historyLoop from './stages/history-loop.mjs';
import outputAndRetries from './stages/output-and-retries.mjs';
import batchDeadline from './stages/batch-deadline.mjs';
import nightlyReceipt from './stages/nightly-receipt.mjs';
import batchRecovery from './stages/batch-recovery.mjs';
import traceIntegrity from './stages/trace-integrity.mjs';
import budgetQualityGate from './stages/budget-quality-gate.mjs';
import qualityEvidence from './stages/quality-evidence.mjs';
import coldReservation from './stages/cold-reservation.mjs';
import atomicSettlement from './stages/atomic-settlement.mjs';
import wrap from './stages/wrap.mjs';
import freshEconomics from './stages/fresh-economics.mjs';
import twelfthNight from './stages/twelfth-night.mjs';
export {
  acceptedTaskCost,
  contextTierPrice,
  historyUsage,
  rateContentDigest,
  reservationTransition,
} from './arithmetic.mjs';
export {
  answerPriceConstruction,
  budgetSnapshot,
  introBudgetConstruction,
  payoffConstruction,
  prefixPriceConstruction,
  retryCostFrame,
  reuseConstruction,
  teachingFrame,
} from './construction.mjs';
export { USAGE_RECEIPT } from './fixtures.mjs';
export { validateModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'token-economics',
  validateModel,
  scenes: [
    intro,
    receiptAnatomy,
    oneAnswer,
    prefixReuse,
    twoReusePaths,
    accountingPhysics,
    usageContract,
    hiddenOutput,
    contextTier,
    cacheWrite,
    cachePolicy,
    dailyReplay,
    historyLoop,
    outputAndRetries,
    wrap,
    batchDeadline,
    nightlyReceipt,
    batchRecovery,
    traceIntegrity,
    budgetQualityGate,
    qualityEvidence,
    coldReservation,
    atomicSettlement,
    freshEconomics,
    twelfthNight,
  ],
});
export const draw = definition.draw;
export default definition;

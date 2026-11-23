import { clamp, quota } from './arithmetic.mjs';
import { quotaReceipt, recoveryIdentity } from './fixtures.mjs';
export function applyQuotaCompletion(ledger, receipt) {
  if (receipt.request !== quotaReceipt.request || receipt.fingerprint !== quotaReceipt.fingerprint)
    throw new Error('Conflicting request fingerprint');
  if (
    !Number.isInteger(receipt.input) ||
    receipt.input < 0 ||
    receipt.input > 300 ||
    !Number.isInteger(receipt.output) ||
    receipt.output < 0 ||
    receipt.output > 400
  )
    throw new Error('Invalid trusted usage');
  if (ledger.receipt) {
    if (ledger.receipt.input !== receipt.input || ledger.receipt.output !== receipt.output)
      throw new Error('Conflicting completion usage');
    return {
      ...ledger,
      duplicate: true,
    };
  }
  const actual = receipt.input + receipt.output;
  return {
    balance: {
      available: ledger.balance.available + ledger.balance.held - actual,
      held: 0,
      settled: ledger.balance.settled + actual,
    },
    receipt: {
      ...receipt,
    },
    duplicate: false,
  };
}
export function recoveryCompletionEvidence() {
  return {
    ...recoveryIdentity,
    quiescent: true,
    trustedUsage: true,
    input: quotaReceipt.input,
    output: quotaReceipt.output,
  };
}
export function reconcileRecovery(ledger, evidence) {
  const accepted =
    Object.entries(recoveryIdentity).every(([key, value]) => evidence?.[key] === value) &&
    evidence.quiescent === true &&
    evidence.trustedUsage === true;
  return {
    accepted,
    retryDispatched: false,
    ledger: accepted ? applyQuotaCompletion(ledger, evidence) : ledger,
  };
}
export function recoveryRetryDecision(owner, proposal) {
  const sameReservation = ['request', 'reservation', 'fingerprint'].every(
    (key) => proposal?.[key] === recoveryIdentity[key],
  );
  const allowed =
    sameReservation && owner.attempt === recoveryIdentity.attempt && owner.quiescent === true;
  return {
    allowed,
    reason: !sameReservation
      ? 'conflicting request identity'
      : allowed
        ? 'old owner retired; separate retry policy still required'
        : 'old owner unresolved',
    attempt: 'attempt-2',
  };
}
export function recoveryState(state) {
  const reached = (id) => state.cues?.[id]?.phase === 'after';
  const started = (id) => state.cues?.[id] && state.cues[id].phase !== 'before';
  const quiescent = reached('recovery-quiescence');
  const usageKnown = quiescent || reached('recovery-usage');
  const initial = {
      balance: quota(1),
      receipt: null,
    },
    completion = reconcileRecovery(initial, quiescent ? recoveryCompletionEvidence() : null);
  const retryDecision = recoveryRetryDecision(
    {
      ...recoveryIdentity,
      quiescent,
    },
    recoveryIdentity,
  );
  const release = state.cues?.['recovery-release-unused'];
  const progress =
    completion.accepted && release
      ? release.phase === 'after'
        ? 1
        : release.phase === 'during'
          ? clamp(release.progress)
          : 0
      : 0;
  const held = Math.round(700 * (1 - progress)),
    settled = Math.round(completion.accepted ? completion.ledger.balance.settled * progress : 0);
  return {
    ...recoveryIdentity,
    quiescent,
    usageKnown,
    reconciling: started('recovery-beat-1-focus-1'),
    retryDecision,
    retryDispatched: false,
    releaseProgress: progress,
    available: 1000 - held - settled,
    held,
    settled,
    status: quiescent
      ? 'RETIRED + USAGE KNOWN'
      : usageKnown
        ? 'RETIREMENT PENDING'
        : 'USAGE UNCERTAIN',
  };
}

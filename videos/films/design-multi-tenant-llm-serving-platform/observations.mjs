import { clamp, deficitPlayback, motion, quota } from './arithmetic.mjs';
import { duplicateCue, quotaReceipt, settlementEnd, settlementStart, tracks } from './fixtures.mjs';
import { applyQuotaCompletion, recoveryState } from './protocols.mjs';
export function sampleModel(id, state) {
  const { step } = tracks[id].sample(state).snapshot,
    q = motion(state.beatP);
  if (id === 'intro')
    return {
      step,
      q,
      oneGB: (72e9 * 2) / 1e9,
      copiesGB: (72e9 * 2 * 100) / 1e9,
    };
  if (id === 'identity') {
    const requested = step === 0 || q >= 0.35 ? 'A' : 'B';
    return {
      step,
      q,
      requested,
      allowed: requested === 'A',
      documents: [
        {
          id: 'A-public',
          tenant: 'A',
          reader: 'Alice',
          score: 0.8,
        },
        {
          id: 'A-private',
          tenant: 'A',
          reader: 'Carol',
          score: 0.95,
        },
        {
          id: 'B-secret',
          tenant: 'B',
          reader: 'Bob',
          score: 0.99,
        },
      ],
    };
  }
  if (id === 'quota') {
    const activeBeat = state.beat ?? 0;
    const beatP = clamp(state.beatP);
    const settledProgress =
      activeBeat === 0
        ? 0
        : (() => {
            const x = clamp((beatP - settlementStart) / (settlementEnd - settlementStart));
            return x * x * (3 - 2 * x);
          })();
    const completion = applyQuotaCompletion(
      {
        balance: quota(1),
        receipt: null,
      },
      quotaReceipt,
    );
    const replayCue = state.cues?.['quota-replay-unchanged'];
    const replay =
      activeBeat > 0 && (replayCue ? replayCue.phase !== 'before' : beatP >= duplicateCue)
        ? applyQuotaCompletion(completion, quotaReceipt)
        : null;
    const held = activeBeat === 0 ? Math.round(700 * q) : Math.round(700 * (1 - settledProgress));
    const settled = activeBeat === 0 ? 0 : Math.round(completion.balance.settled * settledProgress);
    return {
      step,
      q,
      stage: activeBeat === 0 ? 1 : 2,
      available: 1000 - held - settled,
      held,
      settled,
      duplicate: replay?.duplicate ?? false,
      transition: settledProgress > 0 && settledProgress < 1,
      completionId: quotaReceipt.request,
    };
  }
  if (id === 'pages') {
    const tokens = {
        A: 47,
        B: 31,
      },
      owners = ['A', 'B', 'A', 'B', 'A'],
      logical = [0, 0, 1, 1, 2];
    return {
      step,
      q,
      tokens,
      owners,
      logical,
      used: owners.map((owner, i) => Math.min(16, Math.max(0, tokens[owner] - logical[i] * 16))),
      pageMiB: (2 * 80 * 8 * 128 * 2 * 16) / 2 ** 20,
    };
  }
  if (id === 'fairness') {
    const roundCues = ['fair-round-one', 'fair-round-two', 'fair-round-three'];
    const time = state.cues?.['fair-round-one']
      ? roundCues.reduce((elapsed, id) => elapsed + state.cues[id].progress, 0)
      : step === 0
        ? 0
        : step === 1
          ? clamp(state.beatP / 0.42) * 3
          : 3;
    return {
      step,
      q,
      time,
      rounds: Math.floor(time),
      ...deficitPlayback(time),
    };
  }
  if (id === 'cache') {
    const changed = step > 0 && q >= 0.22,
      pinned = step === 0 && q >= 0.12 && q < 0.72,
      retired = step > 0 || q >= 0.72;
    return {
      step,
      q,
      acl: changed ? 'v2' : 'v1',
      hit: !changed,
      activeReferences: pinned ? 1 : 0,
      evictable: !pinned,
      retired,
      attempted: step === 0 && q >= 0.36,
      changed,
    };
  }
  if (id === 'cost') {
    const gpuSeconds = 4 * 0.2,
      cost = (gpuSeconds * 2) / 3600;
    return {
      step,
      q,
      gpuSeconds,
      cost,
      a: cost * 0.25,
      b: cost * 0.75,
      wrong: (gpuSeconds * 8) / 3600,
    };
  }
  return {
    step,
    q,
    ...recoveryState(state),
  };
}

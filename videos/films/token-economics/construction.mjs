import { acceptedTaskCost } from './arithmetic.mjs';
import {
  budgetMicro,
  conciseMicro,
  dailyTotalMicro,
  growthMonthlyMicro,
  headroomMicro,
  monthlyMicro,
  prefixMicro,
  standard,
  verboseMicro,
} from './fixtures.mjs';
import { smoothstep } from 'vizmatic';
export const ramp = (p, start, end) =>
  smoothstep(Math.max(0, Math.min(1, (p - start) / (end - start))));
export function introBudgetConstruction(state) {
  const beat = state.beat ?? 0,
    p = state.beatP ?? 0;
  const dailyProgress = beat < 1 ? 0 : beat > 1 ? 1 : ramp(p, 0, 0.27);
  const days = beat < 1 ? 0 : beat > 1 ? 30 : 30 * ramp(p, 0.3, 0.62);
  const monthly = (dailyTotalMicro / 1_000_000) * days;
  return {
    dailyProgress,
    days,
    monthly,
    headroom: 750 - monthly,
  };
}
export function answerPriceConstruction(state) {
  const beat = state.beat ?? 0,
    p = state.beatP ?? 0;
  const chargeProgress = beat < 2 ? 0 : ramp(p, 0, 0.28);
  return {
    inputVisible: beat >= 1,
    outputVisible: beat >= 1,
    productsVisible: beat >= 2,
    chargeProgress,
    totalVisible: chargeProgress === 1,
    inputCharge: ((1800 * standard.input) / 1_000_000) * chargeProgress,
    outputCharge: ((180 * standard.output) / 1_000_000) * chargeProgress,
  };
}
export function prefixPriceConstruction(state) {
  const beat = state.beat ?? 0,
    p = state.beatP ?? 0,
    progress = beat > 0 ? 1 : ramp(p, 0.46, 0.68);
  return {
    progress,
    cached: 1280,
    ordinary: 520,
    output: 180,
    charge: prefixMicro / 1e6,
  };
}
export function teachingFrame(state) {
  const beat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0));
  const reveal = (index, start = 0.08, end = 0.9) =>
    beat < index ? 0 : beat > index ? 1 : smoothstep((progress - start) / (end - start));
  // The unchanged measured first beat spans 12.024 s including its hold.
  // Reveal during the pause before "The smallest candidate" at 7.525 s.
  const omittedEvidence = reveal(0, 7.1 / 12.024, 7.525 / 12.024);
  return {
    daily: dailyTotalMicro / 1_000_000,
    monthly: monthlyMicro / 1_000_000,
    headroom: headroomMicro / 1_000_000,
    candidateOpacities: [reveal(0), reveal(1), omittedEvidence],
  };
}
export function budgetSnapshot(state) {
  const beat = state.beat ?? 0;
  const elapsed = Number.isFinite(state.t) ? state.t - 0.4 : (state.beatP ?? 0) * 13.296;
  const progress = beat > 0 ? 1 : Math.max(0, Math.min(1, (elapsed - 7.5) / (12.325 - 7.5)));
  const monthly =
    monthlyMicro / 1_000_000 + ((growthMonthlyMicro - monthlyMicro) / 1_000_000) * progress;
  return {
    progress,
    monthly,
    headroom: budgetMicro / 1_000_000 - monthly,
  };
}
export function retryCostFrame(state) {
  const cue = state.cues?.['retry-receipts'],
    progress = cue
      ? cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : cue.progress
      : state.beat > 2
        ? 1
        : Math.min(1, (state.beatP ?? 0) * 1.5),
    count = Math.floor(3 * progress + 1e-9);
  const baseline = acceptedTaskCost([
    {
      id: 'V-A1',
      task: 'A',
      accepted: true,
      costMicro: verboseMicro,
    },
    {
      id: 'V-B1',
      task: 'B',
      accepted: true,
      costMicro: verboseMicro,
    },
  ]);
  const attempts = [
    {
      id: 'C-A1',
      task: 'A',
      accepted: true,
      costMicro: conciseMicro,
    },
    {
      id: 'C-B1',
      task: 'B',
      accepted: false,
      costMicro: conciseMicro,
    },
    {
      id: 'C-B2',
      task: 'B',
      accepted: true,
      costMicro: conciseMicro,
    },
  ];
  return {
    baseline,
    attempts,
    current: acceptedTaskCost(attempts.slice(0, count)),
    progress,
    count,
  };
}
export const cueProgress = (state, id, fallback) => {
  const cue = state.cues?.[id];
  return cue
    ? cue.phase === 'before'
      ? 0
      : cue.phase === 'after'
        ? 1
        : Math.max(0, Math.min(1, cue.progress))
    : fallback;
};
export function reuseConstruction(state) {
  const beat = state.beat ?? 0,
    p = state.beatP ?? 0;
  const copy = beat > 0 ? 1 : cueProgress(state, 'stored-answer-copy', ramp(p, 0.2, 0.65));
  const match =
    beat < 1 ? 0 : beat > 1 ? 1 : cueProgress(state, 'prefix-kv-match', ramp(p, 0.25, 0.75));
  const generation =
    beat < 2 ? 0 : beat > 2 ? 1 : cueProgress(state, 'prefix-new-output', ramp(p, 0.2, 0.7));
  return {
    beat,
    copy,
    match,
    generation,
    cached: Math.round(1280 * match),
    ordinary: 1800 - Math.round(1280 * match),
    generated: Math.round(180 * generation),
    storedGenerated: 0,
    storedCharge: 0,
    prefixCharge: prefixMicro,
  };
}
export function payoffConstruction(state) {
  const beat = state.beat ?? 0,
    p = state.beatP ?? 0;
  const receipts = retryCostFrame({
    cues: {
      'retry-receipts': {
        phase: 'after',
        progress: 1,
      },
    },
  });
  const show = beat > 0 ? 1 : cueProgress(state, 'payoff-receipts', ramp(p, 0.15, 0.65));
  const receiptsVisible =
    beat > 0 ||
    (state.cues?.['payoff-receipts'] ? state.cues['payoff-receipts'].phase !== 'before' : show > 0);
  const received = Math.floor(show * receipts.attempts.length + 1e-9);
  const group =
    beat > 1 ? 1 : beat === 1 ? cueProgress(state, 'payoff-group-tasks', ramp(p, 0.2, 0.65)) : 0;
  const compare = beat >= 3 ? cueProgress(state, 'payoff-compare', ramp(p, 0.2, 0.65)) : 0;
  return {
    ...receipts,
    show,
    receiptsVisible,
    received,
    group,
    compare,
    perAttempt: receipts.current.spend / receipts.current.attempts,
  };
}

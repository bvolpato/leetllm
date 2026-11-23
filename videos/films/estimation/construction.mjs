import {
  batches100,
  batches400,
  bootstrapRange,
  bootstrapRates,
  firstDraw,
  sliceModel,
  weeklyQueue,
  weeklySample,
} from './fixtures.mjs';
import { bootstrapBin, count, scoreStatistic, wilson } from './model.mjs';
export const clamp = (x) => Math.max(0, Math.min(1, x));
export const smooth = (x) => {
  const p = clamp(x);
  return p * p * (3 - 2 * p);
};
export const phase = (p, a = 0.1, b = 0.8) => smooth((p - a) / (b - a));
export function cue(state, id, a = 0.1, b = 0.8) {
  const value = state.cues?.[id];
  return value ? smooth(value.progress) : phase(state.beatP ?? 0, a, b);
}
export function event(state, beat, id, a, b) {
  return state.beat < beat ? 0 : state.beat > beat ? 1 : cue(state, id, a, b);
}
export function afterCue(state, id, start, end) {
  const measured = state.cues?.[id];
  return measured?.phase ? measured.phase === 'after' : cue(state, id, start, end) >= 1;
}
export function introFrame(state) {
  const draw = event(state, 1, 'sample-draw', 0.01, 0.25);
  const spread = clamp(draw / 0.45);
  const drawn = 5 + Math.floor(95 * clamp((draw - 0.45) / 0.55));
  const firstFive = Math.floor(5 * event(state, 0, 'five-count', 0, 0.2));
  const labeled = firstFive + Math.floor(95 * event(state, 1, 'sample-label', 0.3, 0.42));
  const k = count(weeklySample.slice(0, labeled));
  const known = event(state, 1, 'sample-fraction', 0.7, 0.9) >= 1;
  return {
    spread,
    drawn,
    labeled,
    k,
    known,
    estimate: known ? k / labeled : null,
  };
}
export function samplingFrame(state) {
  const counted = Math.floor(100 * event(state, 0, 'batch-count', 0.05, 0.3));
  const point = event(state, 0, 'batch-point', 0.35, 0.5);
  const samples =
    state.beat > 0
      ? 40
      : point >= 1
        ? 1 + Math.floor(39 * cue(state, 'batch-repeat', 0.55, 0.9))
        : 0;
  const large = Math.floor(40 * event(state, 2, 'larger-cloud', 0.08, 0.8));
  return {
    counted,
    point,
    samples,
    large,
    firstK: count(batches100[0]),
    first: batches100[0],
    smallRates: batches100.slice(0, samples).map((r) => count(r) / 100),
    largeRates: batches400.slice(0, large).map((r) => count(r) / 400),
  };
}
export function scoreFrame(state) {
  const first = event(state, 1, 'candidate-sweep', 0.01, 0.13);
  const rest = event(state, 1, 'finish-sweep', 0.55, 0.83);
  const sweep = (first + rest) / 2;
  const candidate = 0.04 + 0.32 * sweep;
  const interval = wilson(16, 100),
    score = scoreStatistic(16, 100, candidate);
  const acceptedHigh = Math.min(interval.high, candidate),
    projection = event(state, 2, 'score-project', 0.02, 0.2);
  return {
    candidate,
    score,
    fits: score <= 1.96,
    sweep,
    interval,
    acceptedHigh,
    acceptedVisible: candidate >= interval.low && state.beat > 0,
    projection,
    endpointsKnown: event(state, 2, 'score-endpoints', 0.25, 0.5) >= 1,
  };
}
export function accumulationSnapshot(beat, progress, cues) {
  const amount =
    beat === 0
      ? 0
      : beat > 1
        ? 1
        : cues?.['add-groups']
          ? smooth(cues['add-groups'].progress)
          : phase(progress, 0.35, 0.82);
  const secondTray =
    beat === 0
      ? 0
      : beat > 1
        ? 1
        : cues?.['second-tray']
          ? smooth(cues['second-tray'].progress)
          : phase(progress, 0.02, 0.16);
  const reflow = clamp(amount / 0.16);
  const remaining = clamp((amount - 0.16) / 0.84);
  const groups = 1 + Number(secondTray === 1) + Math.floor(remaining * 14),
    n = groups * 25,
    k = groups * 4;
  return {
    groups,
    secondTray,
    reflow,
    n,
    k,
    estimate: k / n,
    interval: wilson(k, n),
    reference: wilson(4, 25),
  };
}
export function designFrame(state) {
  const stages = ['weight-routine', 'weight-billing', 'weight-account'].map((id, i) =>
    event(state, 1, id, 0.1 + 0.22 * i, 0.25 + 0.22 * i),
  );
  const complete = stages.map((q) => q >= 1);
  return {
    stages,
    complete,
    contributions: sliceModel.map((r, i) => (complete[i] ? r.expected : 0)),
    total: sliceModel.reduce((n, r, i) => n + (complete[i] ? r.expected : 0), 0),
    totalKnown: event(state, 1, 'weighted-total', 0.8, 0.95) >= 1,
    routineN: 100 + Math.floor(300 * event(state, 0, 'biased-precision', 0.5, 0.9)),
  };
}
export function bootstrapFrame(state) {
  const duplicate = event(state, 0, 'bootstrap-duplicate', 0.1, 0.4),
    completion = event(state, 0, 'bootstrap-complete', 0.5, 0.85);
  const draws = state.beat > 0 ? 100 : Math.floor(2 * duplicate) + Math.floor(98 * completion);
  const prefix = firstDraw.slice(0, draws),
    k = count(prefix.map((i) => weeklySample[i]));
  const completedResamples =
    state.beat === 0
      ? 0
      : state.beat > 1
        ? 400
        : 1 + Math.floor(399 * cue(state, 'bootstrap-histogram', 0.05, 0.85));
  const bins = Array(36).fill(0);
  for (const rate of bootstrapRates.slice(0, completedResamples)) bins[bootstrapBin(rate)]++;
  return {
    draws,
    ids: prefix.map((i) => weeklySample[i].id),
    k,
    completedResamples,
    bins,
    firstRate: bootstrapRates[0],
    range: completedResamples === 400 ? bootstrapRange : null,
  };
}
export function priorFrame(state) {
  const n = state.beat === 0 ? 5 : 5 + Math.floor(95 * event(state, 1, 'prior-data', 0.05, 0.7));
  const k = count(weeklySample.slice(0, n)),
    priorKnown = state.beat > 0 || cue(state, 'prior-terms', 0.3, 0.7) >= 1;
  return {
    n,
    k,
    mle: k / n,
    map: priorKnown ? (k + 1) / (n + 2) : null,
    priorKnown,
  };
}
export function decisionFrame(state) {
  const planProgress = event(state, 0, 'planned-audit', 0.29, 0.36),
    reviewed = 100 + Math.floor(300 * planProgress);
  const auditKnown = event(state, 0, 'final-interval', 0.62, 0.68) >= 1;
  const interval = wilson(64, 400),
    choiceKnown = event(state, 1, 'staffing-choice', 0.4, 0.6) >= 1;
  const outcomeKnown = event(state, 2, 'week-outcome', 0.1, 0.5) >= 1;
  const capacity = event(state, 2, 'capacity-payoff', 0.6, 0.85);
  const filled = event(state, 2, 'fill-capacity', 0.36, 0.57);
  return {
    reviewed,
    auditKnown,
    interval,
    choiceKnown,
    choice: choiceKnown ? (interval.high < 0.2 ? 'Regular staffing' : 'More capacity') : null,
    outcomeKnown,
    outcome: outcomeKnown ? weeklyQueue.specialist : null,
    capacity,
    filled: Math.max(filled, capacity),
  };
}

import {
  SERVING_COHORT,
  rates,
  tokenTimes,
  averageResidenceMs,
  timedArrivalsMs,
  comparisonTokenTimes,
} from '../../../films/serving-benchmarks/fixtures.mjs';
import {
  servingRequestMetrics,
  servingReceipt,
  inFlightAt,
  meanInFlight,
  servingGate,
  fixedPlayback,
  freshServingRows,
  wilsonLower,
  nearestRank,
} from '../../../films/serving-benchmarks/model.mjs';
export {
  SERVING_COHORT as cohort,
  rates,
  tokenTimes,
  averageResidenceMs,
  timedArrivalsMs,
  comparisonTokenTimes,
  servingRequestMetrics,
  servingReceipt,
  inFlightAt,
  meanInFlight,
  servingGate,
  fixedPlayback,
  wilsonLower,
  nearestRank,
};
export const fresh = freshServingRows();
export function freshReplay(sent) {
  const rows = fresh.map((r, i) => (i === 1 ? { ...r, sent } : r));
  const receipt = servingReceipt(rows, [0, 2500]);
  return {
    row: rows[1],
    metrics: servingRequestMetrics(rows[1]),
    receipt,
    exit: receipt.scheduleValid ? 0 : 2,
  };
}
export const ids = SERVING_COHORT.map((r) => r.id);
export const arrivalWindow = 2000;
export const lagLimit = 20;
export const paced = Array.from({ length: 6 }, (_, i) => (1000 * i) / 3);
export const clumped = SERVING_COHORT.map((r) => r.scheduled);
export const lifetimeMs = 150;
export const slotProbeMs = clumped[4];
export function scheduleSpans(arrivals, lifetime) {
  const freeAt = [];
  return arrivals.map((start) => {
    const available = freeAt.findIndex((end) => end <= start);
    const lane = available < 0 ? freeAt.length : available;
    const end = start + lifetime;
    freeAt[lane] = end;
    return { start, end, lane };
  });
}
export function spansAt(spans, time, includeStarting) {
  return spans.filter(({ start, end }) =>
    end > time && (start < time || (includeStarting && start === time)));
}
export const seconds = (ms) => (ms / 1000).toFixed(1);
export const pool = [...Array(19).fill(1), 100];
export const worst = [Math.max(...pool.slice(0, 19)), pool[19]];
export const words = ['The', ' answer', ' is', ' 42', '.'];
export const alternative = [160, ...tokenTimes.slice(1)];
export function chunks(times) {
  return [
    { ms: times[2], word: words.slice(0, 3).join('') },
    { ms: times[4], word: words.slice(3).join('') },
  ];
}
export function screenAt(time, trace = tokenTimes) {
  return chunks(trace)
    .filter((r) => r.ms <= time)
    .map((r) => r.word)
    .join('');
}
export const rowAtSend = (sent) => ({ ...SERVING_COHORT[3], sent });
export function scored(rows) {
  try {
    const report = servingReceipt(rows, [0, arrivalWindow], ids);
    return { exit: report.scheduleValid ? 0 : 2, report };
  } catch {
    return { exit: 1, report: null };
  }
}
export const missing = SERVING_COHORT.slice(0, -1);
export const unsent = [
  ...missing,
  { ...SERVING_COHORT.at(-1), sent: null, tokens: [], status: 'not_sent', quality: false },
];
export function counts(rows, now) {
  const scheduled = rows.filter((r) => r.scheduled <= now).length;
  const sent = rows.filter((r) => r.sent !== null && r.sent <= now).length;
  const completed = rows.filter((r) => r.terminal <= now).length;
  return { scheduled, sent, completed, pending: sent - completed };
}
export function desk(ms, independent) {
  const due = paced.filter((t) => t <= ms).length;
  const sent = independent ? due : Math.min(due, 1);
  return { due, sent, waiting: Math.max(0, sent - 1) };
}
export const poolSize = 3, meanSeconds = 10, surge = 100;
export const chosen = servingGate(rates);
const offeredCount = 200;
const strict = servingGate(rates.map((r) => ({
  ...r, attainment: wilsonLower(Math.round(r.attainment * offeredCount), offeredCount),
})));
// Admission is a premise of the two budget examples. Qualification is a separate count.
export function replicaEstimate(offeredRps, admittedCount) {
  const admittedRps = offeredRps * admittedCount / offeredCount;
  const active = admittedRps * meanSeconds;
  const perReplica = active / poolSize;
  return { admittedRps, active, perReplica, replicas: Math.ceil(surge / perReplica) };
}
export const observedBudget = replicaEstimate(chosen.rps, offeredCount);
export const strictBudget = replicaEstimate(strict.rps, offeredCount);

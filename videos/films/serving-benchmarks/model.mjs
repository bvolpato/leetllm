import { SERVING_COHORT, averageResidenceMs, scheduledMs, timedArrivalsMs } from './fixtures.mjs';
import assert from 'node:assert/strict';
export const inFlightAt = (timeMs) =>
  timedArrivalsMs.filter((start) => start <= timeMs && timeMs < start + averageResidenceMs).length;
export function meanInFlight(startMs, endMs) {
  const edges = [
    ...new Set([
      startMs,
      endMs,
      ...timedArrivalsMs
        .flatMap((start) => [start, start + averageResidenceMs])
        .filter((time) => time > startMs && time < endMs),
    ]),
  ].sort((a, b) => a - b);
  let occupiedMs = 0;
  for (let index = 0; index < edges.length - 1; index++) {
    occupiedMs += inFlightAt(edges[index]) * (edges[index + 1] - edges[index]);
  }
  return occupiedMs / (endMs - startMs);
}
export function arrivalComparison(slowdown) {
  const fraction = Math.max(0, Math.min(1, slowdown));
  const serviceMs = scheduledMs.map((_, index) =>
    index === 0 ? 300 : Math.round(350 + ((index === 1 ? 700 : 1000) - 350) * fraction),
  );
  let nextSend = 0;
  const closed = serviceMs.map((duration, index) => {
    const start = nextSend;
    nextSend += duration;
    return {
      id: `R${index + 1}`,
      start,
      end: nextSend,
    };
  });
  const open = scheduledMs.map((start, index) => ({
    id: `R${index + 1}`,
    start,
    end: start + serviceMs[index],
  }));
  return {
    closed,
    open,
    horizon: 2000,
  };
}
export function servingRequestMetrics(r) {
  const n = r.tokens.length,
    ttft = n ? r.tokens[0] - r.sent : null,
    tpot = n > 1 ? (r.tokens.at(-1) - r.tokens[0]) / (n - 1) : null;
  return {
    lag: r.sent === null ? null : r.sent - r.scheduled,
    ttft,
    tpot,
    success: r.status === 'success',
    qualified:
      r.status === 'success' &&
      n > 0 &&
      r.quality === true &&
      ttft <= 300 &&
      (tpot === null || tpot <= 80),
  };
}
export function servingReceipt(
  rows = SERVING_COHORT,
  window = [0, 2000],
  expectedIds = rows.map((r) => r.id),
) {
  assert.equal(new Set(rows.map((r) => r.id)).size, rows.length, 'duplicate outcome');
  assert(
    expectedIds.every((id) => rows.some((r) => r.id === id)) &&
      rows.every((r) => expectedIds.includes(r.id)),
    'incomplete or unknown outcome',
  );
  const offered = rows.filter((r) => r.scheduled >= window[0] && r.scheduled < window[1]),
    ms = offered.map(servingRequestMetrics),
    horizon = Math.max(window[1], ...offered.map((r) => r.terminal)) - window[0],
    qualified = ms.filter((r) => r.qualified).length,
    success = ms.filter((r) => r.success).length;
  return {
    offered: offered.length,
    success,
    qualified,
    horizon,
    attainment: qualified / offered.length,
    offeredRps: offered.length / ((window[1] - window[0]) / 1000),
    successRps: success / (horizon / 1000),
    qualifiedRps: qualified / (horizon / 1000),
    scheduleValid: ms.every((r) => r.lag !== null && r.lag <= 20),
    capacity: null,
  };
}
export function fixedPlayback(arrivals, firstDeadline = 300, period = 80) {
  const deadlines = arrivals.map((_, i) => firstDeadline + i * period),
    late = arrivals.map((time, i) => Math.max(0, time - deadlines[i]));
  return {
    arrivals,
    deadlines,
    late,
    lateCount: late.filter((v) => v > 0).length,
    meanTpot: arrivals.length > 1 ? (arrivals.at(-1) - arrivals[0]) / (arrivals.length - 1) : null,
  };
}
export function nearestRank(values, q) {
  assert(values.length && q > 0 && q <= 1);
  return [...values].sort((a, b) => a - b)[Math.ceil(q * values.length) - 1];
}
export function wilsonLower(passes, n, z = 1.6448536269514722) {
  const ph = passes / n,
    z2 = z * z;
  return (ph + z2 / (2 * n) - z * Math.sqrt((ph * (1 - ph)) / n + z2 / (4 * n * n))) / (1 + z2 / n);
}
export function servingGate(rows, floor = 0.95) {
  return (
    rows
      .filter(
        (r) =>
          r.attainment >= floor &&
          r.scheduleValid !== false &&
          (r.maxLag === undefined || r.maxLag <= 20) &&
          r.backlog === 'flat',
      )
      .sort((a, b) => a.rps - b.rps)
      .at(-1) ?? null
  );
}
export function freshServingRows() {
  return Array.from(
    {
      length: 8,
    },
    (_, i) => ({
      id: 'n' + (i + 1),
      scheduled: i * 300,
      sent: i * 300,
      terminal: i === 7 ? 4000 : i * 300 + 280,
      tokens: [i * 300 + 100, i * 300 + 180],
      status: i === 7 ? 'timeout' : 'success',
      quality: i < 6,
    }),
  );
}

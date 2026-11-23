import { clock } from './arithmetic.mjs';

export const noonOrder = { pickup: 10, snapshot: 12, promise: 21, revised: 22, doorstep: 21.5 };
export const freshOrder = {
  pickup: 9,
  snapshot: 13,
  durations: [6, 10, 12, 16],
  backlogAge: 3,
  risk: 0.52,
  scans: [
    { name: 'Transit', event: 11.5, available: 11 + 40 / 60 },
    { name: 'Hub', event: 12, available: 13.25 },
  ],
};
export const limits = { scan: 24, backlog: 8 };

export function scanAt(scans, cutoff) {
  const eligible = scans.filter((row) => row.event <= cutoff && row.available <= cutoff);
  const latest = eligible.sort((a, b) => b.event - a.event || b.available - a.available)[0];
  return latest && { ...latest, age: cutoff - latest.event };
}

export function estimate(pickup, eligibleDurations) {
  const sorted = [...eligibleDurations].sort((a, b) => a - b);
  if (!sorted.length) return null;
  const i = Math.floor((sorted.length - 1) / 2);
  const median = (sorted[i] + sorted[Math.floor(sorted.length / 2)]) / 2;
  const time = (hours) => clock((pickup + hours) % 24);
  return { median, arrival: time(median), first: time(sorted[0]), last: time(sorted.at(-1)) };
}

export function propose(scanAge, backlogAge, risk, threshold) {
  if (!Number.isFinite(scanAge) || scanAge < 0)
    return { action: 'Manual review', reason: 'invalid_scan_age' };
  if (!Number.isFinite(backlogAge) || backlogAge < 0)
    return { action: 'Manual review', reason: 'invalid_backlog_age' };
  if (scanAge > limits.scan) return { action: 'Manual review', reason: 'stale_scan_features' };
  if (backlogAge > limits.backlog)
    return { action: 'Manual review', reason: 'stale_backlog_features' };
  if (!Number.isFinite(risk) || risk < 0 || risk > 1)
    return { action: 'Manual review', reason: 'invalid_late_risk' };
  return risk >= threshold
    ? { action: 'Propose warning', reason: 'late_risk_threshold' }
    : { action: 'Normal tracking', reason: 'below_threshold' };
}

export function completed(api, id) {
  return api.focus.cue(id)?.phase === 'after';
}

export function dimension(ctx, api, x1, x2, y, color) {
  api.line(ctx, x1, y, x2, y, color, 5);
  for (const x of [x1, x2]) api.line(ctx, x, y - 12, x, y + 12, color, 5);
}

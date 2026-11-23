import {
  FORECAST_ROWS,
  weekdayNames,
  forecastVersion,
  alertPolicyVersion,
} from '../../../films/forecasting/fixtures.mjs';
import {
  stateTrace,
  diagonalProjection,
  deduplicateEvents,
  patchContract,
  weeklyLookup,
  seasonalDescription,
} from '../../../films/forecasting/model.mjs';
import {
  pinball,
  conformalRank,
  alphaUpdate,
  mae,
} from '../../../films/forecasting/arithmetic.mjs';
import { mean, sum } from './instrument.mjs';

export {
  weekdayNames,
  forecastVersion,
  alertPolicyVersion,
  stateTrace,
  diagonalProjection,
  deduplicateEvents,
  patchContract,
  weeklyLookup,
  seasonalDescription,
  pinball,
  conformalRank,
  alphaUpdate,
  mae,
};
export const rows = FORECAST_ROWS;
export const counts = rows.map((r) => r.volume);
export const holdout = rows.slice(21);
export const forecast = counts.slice(14, 21),
  actual = holdout.map((r) => r.volume);
export const errors = actual.map((v, i) => v - forecast[i]);
export const routineErrors = errors.filter((_, i) => !holdout[i].launch_event);
export const earlier = counts.slice(7, 21).map((v, i) => v - counts[i]);
export const sorted = earlier.map(Math.abs).sort((a, b) => a - b);
export const width = sorted[Math.ceil(0.95 * sorted.length) - 1];
export const extendedRack = [
  ...sorted.map((value, originalIndex) => ({ value, originalIndex })),
  ...[1, 2, 2, 3, 4].map((value) => ({ value, originalIndex: null })),
].sort((a, b) => a.value - b.value);
export const extended = extendedRack.map(({ value }) => value);
export const normalRMS = Math.sqrt(mean(earlier.map((x) => x * x)));
export const covered = (w, values = errors) => values.filter((e) => Math.abs(e) <= w).length;
export const friday = 4;
export const baseline = forecast[friday],
  observed = actual[friday],
  offset = 27,
  launch = 20;

// Two-day patches keep every input and transformed value readable in this example.
const context = rows.slice(0, 8);
const center = mean(context.map((r) => r.volume));
const scale = Math.sqrt(mean(context.map((r) => (r.volume - center) ** 2)));
export const chronosBlocks = [];
for (let start = 0; start < context.length; start += 2) {
  chronosBlocks.push(
    context.slice(start, start + 2).map(({ date, volume }) => ({
      date,
      volume,
      transformed: Math.asinh((volume - center) / scale),
    })),
  );
}
export const streams = [
  [4, 5, null, 1, 2],
  [4, 5, null, 4, 2, 4, 0, -1],
  [155 - 150, null, 6, 7, 1, null, 0, -2],
];
export const mornings = [10, 10, 10, 10, 10, 10, 10, 10, 10, 100];
export const schoolOrder = mornings.map((n, i) => (i === 8 ? 40 : n));
export function rail(outcomes, capacity) {
  const losses = outcomes.map((y) => pinball(y, capacity, 0.9));
  return {
    fit: outcomes.filter((y) => y <= capacity).length,
    small: sum(losses.slice(0, 9)),
    large: losses[9],
    average: mean(losses),
  };
}
export const labels = [
  [true, true],
  [true, false],
  [false, true],
  [false, false],
  [true, true],
];
export function auditLabels(items) {
  const alerted = items.filter(([a]) => a).length,
    actionable = items.filter(([, a]) => a).length;
  const caught = items.filter(([a, b]) => a && b).length;
  return { alerted, actionable, caught, precision: caught / alerted, recall: caught / actionable };
}
export function eventRows(conflict) {
  return [
    { event_id: 'job-001', job_id: 'batch-100', type: 'started' },
    { event_id: 'job-001', job_id: conflict ? 'batch-999' : 'batch-100', type: 'started' },
    { event_id: 'job-002', job_id: 'batch-101', type: 'started' },
  ];
}
export const docket = {
  series: 'fc-a.batch_jobs',
  forecast_version: forecastVersion,
  interval_policy: alertPolicyVersion,
  policy_cutoff: 'Jan 25',
  forecast_origin: 'Jan 29',
  source_date: 'Jan 23',
  date: 'Jan 30',
  horizon_days: 1,
  forecast: baseline,
  actual: observed,
  forecast_error: observed - baseline,
  lower: baseline - width,
  upper: baseline + width,
  launch_event: true,
  action: 'review',
  owner: 'capacity-ops',
  resolution: 'pending',
};
export const fields = [
  'series',
  'forecast_version',
  'interval_policy',
  'policy_cutoff',
  'forecast_origin',
  'source_date',
  'date',
  'horizon_days',
  'forecast',
  'actual',
  'forecast_error',
  'lower',
  'upper',
  'launch_event',
  'action',
  'owner',
  'resolution',
];
export const hasFields = (alerts) =>
  alerts.every((row) => fields.every((k) => Object.hasOwn(row, k)));
export function route(row, urgent) {
  if (urgent) return 'Page for capacity impact';
  return row.launch_event ? 'Review planned launch' : 'Investigate deviation';
}
export const checks = [
  ['Date order', rows[20].date < rows[21].date],
  ['Calibration cutoff', rows[20].date < rows[21].date],
  ['Routine MAE ≤ 3', mae(errors.filter((_, i) => !rows[21 + i].launch_event)) <= 3],
  ['Calibration coverage', [covered(width, earlier) / 14].every((v) => v >= 0 && v <= 1)],
  ['Later coverage', [covered(width) / 7].every((v) => v >= 0 && v <= 1)],
  ['Interval version', Boolean(alertPolicyVersion)],
  ['Deduplication version', Boolean('telemetry-event-id-v1')],
  ['Alert fields', hasFields([docket])],
  ['Owner assigned', Boolean(docket.owner)],
];

import { clamp } from './arithmetic.mjs';
import { flowRates, resolvedRates, scores, thresholds } from './fixtures.mjs';
export function batches(arrivals, size = 3, wait = 5) {
  const emitted = [];
  let pending = [];
  for (const row of arrivals) {
    if (pending.length && row.at >= pending[0].at + wait) {
      emitted.push({
        at: pending[0].at + wait,
        rows: pending,
      });
      pending = [];
    }
    pending.push(row);
    if (pending.length === size) {
      emitted.push({
        at: row.at,
        rows: pending,
      });
      pending = [];
    }
  }
  if (pending.length)
    emitted.push({
      at: pending[0].at + wait,
      rows: pending,
    });
  return emitted;
}
export function revisionTrace(beat, progress) {
  const seconds = progress * [16.566, 22.762][beat];
  if (beat === 0)
    return {
      seconds,
      revision: seconds >= 0.7 ? 8 : 7,
      receipt: seconds >= 3.1,
      compared: seconds >= 5,
      checks: [9.6, 10.9, 11.9].map((at) => seconds >= at),
      fresh: seconds >= 12.8,
      committed: seconds >= 14.05,
      emitted: seconds >= 15.2,
    };
  return {
    seconds,
    revision: 8,
    appeal: seconds >= 1.35,
    linked: seconds >= 5.5,
    invalidated: seconds >= 8.1,
    remedied: seconds >= 10.35,
    exact: seconds >= 10.9,
    related: seconds >= 17.8,
    fresh: seconds >= 20.5,
  };
}
export function revisionPresentation(beat, progress, cues) {
  const result = revisionTrace(beat, progress);
  if (!cues) return result;
  const seen = (id) => cues[id]?.phase === 'during' || cues[id]?.phase === 'after';
  const p = (id) => cues[id]?.progress ?? 0;
  if (!beat)
    return {
      ...result,
      revision: seen('revision-edited') ? 8 : 7,
      receipt: seen('revision-late-receipt'),
      compared: p('revision-late-receipt') > 0.25,
      checks: [0.15, 0.45, 0.75].map((at) => p('revision-checks') >= at),
      fresh: seen('revision-commit'),
      committed: p('revision-commit') === 1,
      emitted: p('revision-commit') === 1,
    };
  return {
    ...result,
    revision: 8,
    appeal: seen('revision-appeal'),
    linked: seen('revision-correction'),
    invalidated: seen('revision-invalidate'),
    remedied: seen('revision-remedy'),
    exact: seen('revision-exact-key'),
    related: seen('revision-related'),
    fresh: seen('revision-fresh'),
  };
}
export function batchingClock(beat, progress, cues) {
  if (!cues) {
    const p = clamp((progress - 0.08) / 0.7);
    return beat ? 3 + 29 * p : 3 * p;
  }
  const p = cues[beat ? 'batching-isolated' : 'batching-fill']?.progress ?? 0;
  if (!beat) return 3 * p;
  const stops = [
    [0, 3],
    [0.18, 20],
    [0.45, 25],
    [0.6, 27],
    [1, 32],
  ];
  const index = stops.findIndex((stop, index) => index > 0 && p <= stop[0]);
  if (index < 0) return 32;
  const [a, b] = [stops[index - 1], stops[index]];
  return a[1] + ((b[1] - a[1]) * (p - a[0])) / (b[0] - a[0]);
}
export function cascadeSnapshot(beat, progress) {
  const seconds = clamp(progress) * [19.35, 19.858][beat];
  const starts = [2.5, 6.85, 10.1, 14.85],
    ends = [6.35, 9.6, 14.35, 17.1];
  const stages = flowRates.map((incoming, index) => {
    const received = beat > 0 || seconds >= (index ? starts[index] : 0.3);
    const fraction =
      beat > 0 ? 1 : clamp((seconds - starts[index]) / (ends[index] - starts[index]));
    const resolved = Math.round(resolvedRates[index] * fraction);
    return {
      received,
      incoming,
      resolved,
      remainder: incoming - resolved,
      fraction,
    };
  });
  const handling = beat > 0 ? clamp((seconds - 12.2) / 2.25) : 0;
  const staffing = beat > 0 ? clamp((seconds - 15.05) / 1.6) : 0;
  return {
    seconds,
    stages,
    handling,
    staffing,
    busy: flowRates.at(-1) * 120,
    staff: Math.ceil((flowRates.at(-1) * 120) / 0.7),
  };
}
export function categorySnapshot(beat, progress) {
  const seconds = clamp(progress) * [19.398, 20.818][beat];
  const arrivals = [7.4, 3.65, 7.8, 8.2, 5.9, 8.6];
  const rows = scores.map((value, index) => ({
    value: beat > 0 && index === 1 ? NaN : value,
    arrived: beat > 0 || seconds >= arrivals[index],
    fraction: beat > 0 ? 1 : clamp((seconds - arrivals[index]) / (index === 1 ? 1.85 : 0.65)),
    action:
      value >= thresholds[index][1] ? 'BLOCK' : value >= thresholds[index][0] ? 'REVIEW' : 'ALLOW',
  }));
  const reasons = rows.flatMap((row, index) =>
    row.arrived && row.fraction === 1 && row.action !== 'ALLOW'
      ? [
          {
            index,
            action: row.action,
          },
        ]
      : [],
  );
  return {
    seconds,
    rows,
    reasons,
    ready: beat === 0 && seconds >= 11,
    checks: beat === 0 ? [] : [seconds >= 1.9, seconds >= 3.2, seconds >= 3.95],
    malformed: beat > 0 && seconds >= 3.2,
    review: beat > 0 && seconds >= 6.8,
  };
}

import {
  FORECAST_ROWS,
  actual,
  confusion,
  intervalBand,
  intervalHalfWidth,
  introComparison,
} from './fixtures.mjs';
export function alertUsefulnessCells() {
  return [
    {
      x: 630,
      y: 440,
      label: `true alert · ${confusion.tp}`,
      tone: 'green',
      count: confusion.tp,
    },
    {
      x: 1120,
      y: 440,
      label: `unhelpful alert · ${confusion.fp}`,
      tone: 'yellow',
      count: confusion.fp,
    },
    {
      x: 630,
      y: 650,
      label: `missed event · ${confusion.fn}`,
      tone: 'pink',
      count: confusion.fn,
    },
    {
      x: 1120,
      y: 650,
      label: `quiet period · ${confusion.tn}`,
      tone: 'blue',
      count: confusion.tn,
    },
  ];
}
export function alertStateTrace(statuses) {
  let active = false,
    breachRun = 0,
    cleanRun = 0;
  return statuses.map((status) => {
    if (status === 'missing') {
      breachRun = 0;
      cleanRun = 0;
    } else if (status === 'breach') {
      cleanRun = 0;
      if (!active && ++breachRun >= 2) {
        active = true;
        breachRun = 0;
      }
    } else if (status === 'clean') {
      breachRun = 0;
      if (active && ++cleanRun >= 2) {
        active = false;
        cleanRun = 0;
      }
    } else {
      throw new Error(`Unknown alert observation: ${status}`);
    }
    return {
      status,
      active,
      breachRun,
      cleanRun,
    };
  });
}
export function forecastComparisonGeometry() {
  const { forecast, observed, baseline, pixelsPerJob } = introComparison;
  const forecastHeight = forecast * pixelsPerJob;
  const observedHeight = observed * pixelsPerJob;
  return {
    forecast,
    observed,
    difference: observed - forecast,
    baseline,
    forecastHeight,
    observedHeight,
    forecastTop: baseline - forecastHeight,
    observedTop: baseline - observedHeight,
    forecastLabel: `forecast · ${forecast}`,
    observedLabel: `observed · ${observed}`,
  };
}
export function intervalCalibrationGeometry() {
  return {
    ...intervalBand,
    observed: actual[4],
    markerLabel: `Friday actual ${actual[4]}`,
    lower: introComparison.forecast - intervalHalfWidth,
    upper: introComparison.forecast + intervalHalfWidth,
  };
}
export function weeklyLookup(target, origin = target - 1) {
  const source = target - 7;
  if (
    !Number.isInteger(target) ||
    !Number.isInteger(origin) ||
    !(0 <= source && source <= origin && origin < target) ||
    !FORECAST_ROWS[source]
  )
    throw Error('Weekly lag needs an observed matching day before the target');
  return {
    target,
    origin,
    source,
    value: FORECAST_ROWS[source].volume,
  };
}
export function seasonalDescription(level = 105) {
  return {
    level,
    additive: level + 27,
    proportional: (level * 132) / 105,
    offsets: [100, 112, 115, 118, 132, 82, 76].map((y) => y - 105),
  };
}
export function patchContract(lookback = 336, length = 16, stride = 8, pad = true) {
  for (const v of [lookback, length, stride])
    if (!Number.isInteger(v) || v < 1) throw Error('Positive integer patch dimensions required');
  if (lookback < length) throw Error('Lookback must contain one patch');
  const unpadded = Math.floor((lookback - length) / stride) + 1,
    tokens = unpadded + Number(pad);
  return {
    lookback,
    length,
    stride,
    unpadded,
    tokens,
    originalEntries: lookback ** 2,
    patchedEntries: tokens ** 2,
    mapRatio: (lookback / tokens) ** 2,
  };
}
export function stateTrace(values, halfWidth = 3) {
  if (!Number.isFinite(halfWidth) || halfWidth < 0)
    throw Error('Finite nonnegative half-width required');
  let active = false,
    breaches = 0,
    clean = 0;
  return values.map((error, i) => {
    if (error !== null && (typeof error !== 'number' || !Number.isFinite(error)))
      throw Error('Finite error or missing required');
    let transition = null;
    if (error === null) {
      breaches = clean = 0;
    } else {
      if (Math.abs(error) > halfWidth) {
        breaches++;
        clean = 0;
      } else {
        clean++;
        breaches = 0;
      }
      if (!active && breaches >= 2) {
        active = true;
        transition = 'review';
      } else if (active && clean >= 2) {
        active = false;
        transition = 'clear';
      }
    }
    return {
      minute: i * 5,
      error,
      active,
      breaches,
      clean,
      transition,
    };
  });
}
export function diagonalProjection(point) {
  if (point.length !== 2 || !point.every(Number.isFinite))
    throw Error('Finite two-metric point required');
  const mean = (point[0] + point[1]) / 2;
  return {
    point: [...point],
    reconstruction: [mean, mean],
    score: point.reduce((sum, v) => sum + (v - mean) ** 2, 0),
    inside: point.every((v) => v >= -1 && v <= 1),
  };
}
export function deduplicateEvents(events) {
  const unique = new Map(),
    conflicts = [];
  for (const event of events) {
    if (!event || typeof event.event_id !== 'string' || !event.event_id.trim())
      throw Error('Event identity required');
    const prior = unique.get(event.event_id);
    if (prior && (prior.job_id !== event.job_id || prior.type !== event.type)) {
      conflicts.push({
        prior,
        incoming: event,
      });
      continue;
    }
    unique.set(event.event_id, {
      ...event,
    });
  }
  return {
    raw: events.length,
    unique: [...unique.values()],
    duplicates: events.length - unique.size - conflicts.length,
    conflicts,
  };
}

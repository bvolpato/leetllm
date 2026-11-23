export function requestContract(row) {
  const numeric = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0;
  if (!numeric(row.backlog) || !Number.isInteger(row.backlog) || !numeric(row.heartbeatHours))
    return 'schema';
  if (!numeric(row.age) || row.age > 60) return 'freshness';
  return 'pass';
}
export function fixedCapacityReplay(capacity) {
  if (!Number.isFinite(capacity) || capacity <= 0)
    throw new RangeError('capacity must be positive and finite');
  return {
    numerator: 20,
    trainingCapacity: capacity,
    servingCapacity: 100,
    training: 20 / capacity,
    serving: 20 / 100,
  };
}
export function cohortAsOf(rows, cutoff) {
  const matureRows = rows.filter((row) => row.dueHours <= cutoff);
  const joined = matureRows.filter(
    (row) =>
      row.arrivalHours !== null && row.arrivalHours <= cutoff && typeof row.label === 'boolean',
  );
  return {
    mature: matureRows.length,
    joined: joined.length,
    missing: matureRows.length - joined.length,
    immature: rows.length - matureRows.length,
    coverage: matureRows.length ? joined.length / matureRows.length : null,
  };
}
export function confusion(rows, threshold = 0.5) {
  const result = {
    tp: 0,
    fp: 0,
    fn: 0,
    tn: 0,
  };
  for (const row of rows) {
    if (
      typeof row.score !== 'number' ||
      !Number.isFinite(row.score) ||
      typeof row.label !== 'boolean'
    )
      throw new TypeError('finite scores and Boolean outcomes required');
    result[row.score >= threshold ? (row.label ? 'tp' : 'fp') : row.label ? 'fn' : 'tn']++;
  }
  return {
    ...result,
    n: rows.length,
    precision: result.tp + result.fp ? result.tp / (result.tp + result.fp) : null,
    recall: result.tp + result.fn ? result.tp / (result.tp + result.fn) : null,
    cost: 2 * result.fp + 10 * result.fn,
    costPer1000: rows.length ? (1000 * (2 * result.fp + 10 * result.fn)) / rows.length : null,
  };
}
export function simulateRelease({ offline = true, healthy = true, mature, joined, cost }) {
  if (!offline || !healthy)
    return {
      action: 'not promoted',
      alias: 'v3',
    };
  if (
    !Number.isInteger(mature) ||
    mature < 0 ||
    !Number.isInteger(joined) ||
    joined < 0 ||
    joined > mature
  )
    return {
      action: 'invalid counts',
      alias: 'v4',
    };
  if (mature < 500 || joined !== mature)
    return {
      action: 'insufficient evidence',
      alias: 'v4',
    };
  if (typeof cost !== 'number' || !Number.isFinite(cost) || cost < 0)
    return {
      action: 'invalid metric',
      alias: 'v4',
    };
  return cost > 50
    ? {
        action: 'propose rollback',
        alias: 'v3',
      }
    : {
        action: 'keep candidate',
        alias: 'v4',
      };
}

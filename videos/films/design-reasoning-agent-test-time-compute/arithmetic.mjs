export function advise(record, now = 110) {
  if (!record) return 'NEED EVIDENCE';
  if (
    !Number.isInteger(record.revision) ||
    !Number.isInteger(record.observedAt) ||
    !Number.isInteger(now) ||
    record.deploy !== 'checkout-42' ||
    record.revision !== 7
  )
    return 'REJECT RECORD';
  if (now - record.observedAt < 0 || now - record.observedAt > 30) return 'REFRESH EVIDENCE';
  if (
    record.canary !== 10 ||
    typeof record.smoke !== 'boolean' ||
    typeof record.latency !== 'number' ||
    !Number.isFinite(record.latency) ||
    record.latency < 0
  )
    return 'REJECT RECORD';
  return !record.smoke || record.latency >= 300
    ? 'ROLLBACK'
    : record.latency >= 200
      ? 'HOLD'
      : 'CONTINUE';
}
export function coverage(p, n) {
  if (!Number.isFinite(p) || p < 0 || p > 1 || !Number.isInteger(n) || n < 0)
    throw new Error('Invalid probability or attempt count');
  return n === 0 || p === 0 ? 0 : p === 1 ? 1 : -Math.expm1(n * Math.log1p(-p));
}
export function eligible(path) {
  const allowed = new Set([
    'api/legacy_adapter',
    'legacy_adapter/database',
    'api/feature_flag',
    'feature_flag/database',
  ]);
  return (
    path.length >= 2 &&
    path[0] === 'api' &&
    path.at(-1) === 'database' &&
    new Set(path).size === path.length &&
    path
      .slice(1)
      .every((v, i) => allowed.has(path[i] + '/' + v) && path[i] + '/' + v !== 'api/legacy_adapter')
  );
}
export function memory() {
  const bytesPerToken = 2 * 80 * 8 * 128 * 2;
  return {
    bytesPerToken,
    unshared: (8 * 16384 * bytesPerToken) / 2 ** 30,
    stem: (12288 * bytesPerToken) / 2 ** 30,
    tail: (4096 * bytesPerToken) / 2 ** 30,
    shared: ((12288 + 8 * 4096) * bytesPerToken) / 2 ** 30,
  };
}
export function stopReason({
  repeat = false,
  used = 0,
  cap = 4000,
  elapsed = 0,
  deadline = 3000,
  scores = [],
}) {
  if (repeat) return 'REPEATED STATE';
  if (used >= cap) return 'TOKEN CAP';
  if (elapsed >= deadline) return 'WALL-CLOCK CAP';
  if (scores.length >= 4 && Math.max(...scores.slice(-3)) <= Math.max(...scores.slice(0, -3)))
    return 'NO RECENT IMPROVEMENT';
  return 'CONTINUE';
}
export function visitScore(Q, prior, parent, visits) {
  const c = 1;
  const bonus = (c * prior * Math.sqrt(parent)) / (1 + visits);
  return { Q, parent, visits, prior, c, bonus, total: Q + bonus };
}
export function puctWorksheet(backed = false, outcome = 1) {
  return backed ? visitScore((0.5 + outcome) / 2, 0.2, 17, 2) : visitScore(0.5, 0.2, 16, 1);
}

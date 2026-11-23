import { backlogUpdates, heartbeats, pairedRows, queueEvents } from './fixtures.mjs';
import assert from 'node:assert/strict';
export function eligibleEvents(at) {
  return heartbeats.filter((row) => row.event <= at && row.available <= at);
}
export function heartbeatAge(at) {
  const available = eligibleEvents(at);
  return available.length ? (at - Math.max(...available.map((row) => row.event))) / 60 : null;
}
export function pointInTime(job, at) {
  const rows = backlogUpdates.filter((row) => row.job === job && row.time <= at);
  return rows.length
    ? rows.reduce((latest, row) => (row.time > latest.time ? row : latest)).value
    : null;
}
export function freshnessMode(lagMinutes) {
  if (lagMinutes < 0) return 'invalid clock';
  if (lagMinutes <= 15) return 'normal';
  if (lagMinutes <= 45) return 'degraded';
  return 'abstain';
}
export function eventRoute(eventTime, watermark) {
  const behind = watermark - eventTime;
  return behind <= 0 ? 'on-time' : behind <= 45 ? 'accept' : 'replay';
}
export function applyUpdate(state, update) {
  assert(typeof update.id === 'string' && update.id.trim(), 'event ID required');
  assert(Number.isSafeInteger(update.delta), 'integer delta required');
  if (state.seen.has(update.id)) {
    const prior = state.seen.get(update.id);
    assert.equal(prior.delta, update.delta, 'event ID reused with different payload');
    return prior.result === 'applied' ? 'duplicate skipped' : prior.result;
  }
  const next = state.backlog + update.delta;
  if (next < 0) {
    state.seen.set(update.id, {
      delta: update.delta,
      result: 'blocked negative backlog',
    });
    return 'blocked negative backlog';
  }
  state.seen.set(update.id, {
    delta: update.delta,
    result: 'applied',
  });
  state.backlog = next;
  return 'applied';
}
export const queueState = () => ({
  seen: new Map(),
  backlog: 0,
});
export function replayQueue() {
  const state = queueState();
  const trace = queueEvents.map((event) => ({
    id: event.id,
    status: applyUpdate(state, event),
    backlog: state.backlog,
  }));
  return {
    state,
    trace,
  };
}
export const sameMarginals = (rows) =>
  [...rows].sort((a, b) => a - b).join(',') ===
  [...pairedRows.map((row) => row.offline)].sort((a, b) => a - b).join(',');
export function availableHeartbeat(records, cutoff) {
  assert(Number.isFinite(cutoff));
  const eligible = records.filter((r) => r.event <= cutoff && r.available <= cutoff);
  if (!eligible.length) return null;
  const latest = eligible.reduce((a, b) =>
    b.event > a.event || (b.event === a.event && (b.version ?? 0) > (a.version ?? 0)) ? b : a,
  );
  return {
    id: latest.id,
    event: latest.event,
    ageHours: (cutoff - latest.event) / 60,
  };
}
export function applyLatestState(store, row) {
  assert(typeof row.job === 'string' && row.job.length > 0);
  assert(
    Number.isFinite(row.event) && Number.isFinite(row.available) && row.event <= row.available,
  );
  assert(Number.isSafeInteger(row.version) && row.version >= 0);
  assert(typeof row.phase === 'string');
  const previous = store.get(row.job);
  if (!previous) {
    store.set(row.job, {
      ...row,
      quarantined: false,
    });
    return 'stored';
  }
  const order = row.event - previous.event || row.version - previous.version;
  if (order < 0) return 'stale ignored';
  if (order > 0) {
    store.set(row.job, {
      ...row,
      quarantined: false,
    });
    return 'stored';
  }
  if (previous.quarantined) return 'quarantine persists';
  if (row.phase !== previous.phase) {
    store.set(row.job, {
      ...previous,
      quarantined: true,
    });
    return 'quarantined conflicting revision';
  }
  return 'duplicate ignored';
}
export function publishWindow(previous, incoming) {
  assert(
    Number.isSafeInteger(incoming.revision) &&
      incoming.revision >= 0 &&
      Number.isSafeInteger(incoming.count) &&
      incoming.count >= 0,
  );
  if (!previous)
    return {
      ...incoming,
    };
  assert.equal(previous.key, incoming.key);
  if (incoming.revision < previous.revision)
    return {
      ...previous,
    };
  if (incoming.revision === previous.revision) {
    assert.equal(incoming.count, previous.count, 'equal revision has conflicting whole total');
    return {
      ...previous,
    };
  }
  return {
    ...incoming,
  };
}
export function sourceFreshness(progress, now) {
  assert(Number.isFinite(now));
  if (progress == null)
    return {
      mode: 'unknown / abstain',
      lagSeconds: null,
    };
  assert(Number.isFinite(progress), 'finite source progress required');
  const lagSeconds = now - progress;
  if (lagSeconds < 0)
    return {
      mode: 'invalid clock',
      lagSeconds,
    };
  return {
    mode: lagSeconds <= 900 ? 'normal' : lagSeconds <= 2700 ? 'degraded' : 'abstain',
    lagSeconds,
  };
}
export function typedParity(left, right, { absolute = 0 } = {}) {
  assert(typeof absolute === 'number' && Number.isFinite(absolute) && absolute >= 0);
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].filter((k) => {
    if (!Object.hasOwn(left, k) || !Object.hasOwn(right, k)) return true;
    const a = left[k],
      b = right[k];
    if (typeof a !== typeof b || (a === null) !== (b === null)) return true;
    if (typeof a === 'number')
      return !Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a - b) > absolute;
    return a !== b;
  });
}

export function formatClock(minute) {
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(Math.floor(minute % 60)).padStart(2, '0')}`;
}

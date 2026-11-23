import { URLS } from './fixtures.mjs';
import assert from 'node:assert/strict';
export const clamp = (value) => Math.max(0, Math.min(1, value));
export const smooth = (value) => {
  const p = clamp(value);
  return p * p * (3 - 2 * p);
};
export function normalizeUrl(raw, base = '') {
  if (typeof raw !== 'string' || /[\\\s\u0000-\u001f]/.test(raw)) return null;
  try {
    const url = base ? new URL(raw, base) : new URL(raw);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      !url.hostname ||
      url.username ||
      url.password
    )
      return null;
    url.hash = '';
    if (!url.pathname) url.pathname = '/';
    return url;
  } catch {
    return null;
  }
}
export function crawl(start = URLS.start, pages = URLS.pages) {
  const normalizedStart = normalizeUrl(start);
  if (!normalizedStart)
    return {
      order: [],
      snapshots: [],
    };
  const queue = [normalizedStart.href],
    seen = new Set([normalizedStart.href]),
    order = [];
  const inspected = {
    fragments: 0,
    offOrigin: 0,
    duplicates: [],
  };
  const snapshot = (current, action) => ({
    current,
    queue: [...queue],
    seen: [...seen],
    order: [...order],
    action,
    inspected: {
      ...inspected,
      duplicates: [...inspected.duplicates],
    },
  });
  const snapshots = [snapshot(null, 'initial')];
  while (queue.length) {
    const current = queue.shift();
    order.push(current);
    for (const raw of pages[current] ?? []) {
      const candidate = normalizeUrl(raw, current);
      if (!candidate) continue;
      if (new URL(raw, current).hash) inspected.fragments++;
      if (candidate.origin !== normalizedStart.origin) {
        inspected.offOrigin++;
        continue;
      }
      if (seen.has(candidate.href)) {
        inspected.duplicates.push(candidate.pathname);
        continue;
      }
      seen.add(candidate.href);
      queue.push(candidate.href);
    }
    snapshots.push(snapshot(current, 'pop-and-claim'));
  }
  return {
    order,
    snapshots,
  };
}
export function claimRace() {
  const visited = new Set(['/start', '/api']);
  const claim = (candidate) => {
    if (visited.has(candidate)) return false;
    visited.add(candidate);
    return true;
  };
  const outcomes = [claim('/docs'), claim('/docs')];
  return {
    outcomes,
    claimed: visited.has('/docs'),
    owners: outcomes.filter(Boolean).length,
  };
}
export function protectedClaimTrace(visible) {
  const visited = new Set(),
    events = [];
  for (const worker of ['A', 'B']) {
    if (events.length >= visible) break;
    const won = !visited.has('/docs');
    if (won) visited.add('/docs');
    events.push({
      worker,
      kind: won ? 'claimed' : 'skipped',
      fetched: false,
    });
  }
  if (visible >= 3)
    events.push({
      worker: 'A',
      kind: 'fetch outside lock',
      fetched: true,
    });
  return {
    events,
    owners: events.filter((event) => event.kind === 'claimed').length,
    fetches: events.filter((event) => event.fetched).length,
  };
}
export function expiryState(now, { writtenAt = 10, ttl = 5 } = {}) {
  if (!Number.isFinite(now) || !Number.isFinite(writtenAt) || !Number.isFinite(ttl) || ttl < 0) {
    throw new RangeError('finite nonnegative TTL and finite clock values required');
  }
  const expiresAt = writtenAt + ttl;
  const expired = expiresAt <= now;
  return {
    now,
    expiresAt,
    expired,
    value: expired ? null : 'running',
    stored: !expired,
  };
}
export function schedule({ maxAttempts = 2, failTestOnce = true } = {}) {
  if (!Number.isInteger(maxAttempts) || maxAttempts <= 0)
    throw new RangeError('maxAttempts must be positive');
  const tasks = [
    {
      name: 'docs',
      priority: 1,
      deps: [],
    },
    {
      name: 'test',
      priority: 2,
      deps: [],
    },
    {
      name: 'deploy',
      priority: 3,
      deps: ['test'],
    },
  ];
  const byName = new Map(tasks.map((task) => [task.name, task]));
  const remaining = new Map(tasks.map((task) => [task.name, task.deps.length]));
  const children = new Map(tasks.map((task) => [task.name, []]));
  for (const task of tasks) for (const dep of task.deps) children.get(dep).push(task.name);
  const ready = tasks
    .filter((task) => remaining.get(task.name) === 0)
    .map((task) => [task.priority, task.name]);
  const attempts = new Map(tasks.map((task) => [task.name, 0]));
  const state = new Map(tasks.map((task) => [task.name, 'waiting']));
  const completed = [],
    failed = [],
    executed = [],
    snapshots = [];
  const snapshot = (action) =>
    snapshots.push({
      action,
      state: Object.fromEntries(state),
      ready: ready.map(([, name]) => name),
      completed: [...completed],
      failed: [...failed],
      executed: [...executed],
      attempts: Object.fromEntries(attempts),
      blocked: tasks.filter((task) => state.get(task.name) === 'blocked').map((task) => task.name),
    });
  snapshot('initial');
  while (ready.length) {
    ready.sort((a, b) => a[0] - b[0] || a[1].localeCompare(b[1]));
    const [, name] = ready.shift(),
      task = byName.get(name);
    attempts.set(name, attempts.get(name) + 1);
    executed.push(name);
    const fail = name === 'test' && (!failTestOnce || attempts.get(name) === 1);
    if (fail && attempts.get(name) < maxAttempts) {
      state.set(name, 'retry');
      snapshot('retry');
      ready.push([task.priority, name]);
      continue;
    }
    if (fail) {
      state.set(name, 'failed');
      failed.push(name);
      for (const child of children.get(name)) state.set(child, 'blocked');
      snapshot('failed');
      continue;
    }
    state.set(name, 'complete');
    completed.push(name);
    for (const child of children.get(name)) {
      remaining.set(child, remaining.get(child) - 1);
      if (remaining.get(child) === 0) {
        state.set(child, 'ready');
        ready.push([byName.get(child).priority, child]);
      }
    }
    snapshot('complete');
  }
  return {
    completed,
    failed,
    blocked: [...state].filter(([, value]) => value === 'blocked').map(([name]) => name),
    executed,
    attempts: Object.fromEntries(attempts),
    snapshots,
  };
}
export class TokenBucket {
  constructor(capacity, rate) {
    if (!Number.isInteger(capacity) || capacity <= 0 || !Number.isFinite(rate) || rate <= 0)
      throw new RangeError('positive capacity and refill rate required');
    this.capacity = capacity;
    this.rate = rate;
    this.tokens = capacity;
    this.updatedAt = 0;
  }
  allow(now, cost = 1) {
    if (
      !Number.isFinite(now) ||
      now < this.updatedAt ||
      !Number.isFinite(cost) ||
      cost <= 0 ||
      cost > this.capacity
    ) {
      throw new RangeError('invalid token bucket time or cost');
    }
    this.tokens = Math.min(this.capacity, this.tokens + (now - this.updatedAt) * this.rate);
    this.updatedAt = now;
    if (this.tokens >= cost) {
      this.tokens -= cost;
      return {
        now,
        cost,
        allowed: true,
        retryAfter: 0,
        tokens: this.tokens,
      };
    }
    const retryAfter = (cost - this.tokens) / this.rate;
    return {
      now,
      cost,
      allowed: false,
      retryAfter,
      tokens: this.tokens,
    };
  }
}
export function tokenBucketTrace() {
  const bucket = new TokenBucket(3, 1),
    events = [];
  [0, 0, 0, 0].forEach((now) => events.push(bucket.allow(now)));
  events.push(bucket.allow(0.5));
  events.push(bucket.allow(1));
  return {
    capacity: bucket.capacity,
    rate: bucket.rate,
    events,
  };
}
export class Ledger {
  constructor() {
    this.balance = new Map();
    this.events = [];
    this.results = new Map();
  }
  apply(key, account, delta) {
    if (
      typeof key !== 'string' ||
      !key ||
      typeof account !== 'string' ||
      !account ||
      !Number.isInteger(delta)
    )
      throw new TypeError('nonempty string IDs and integer delta required');
    const prior = this.results.get(key);
    if (prior) {
      if (prior.account !== account || prior.delta !== delta)
        throw new Error('idempotency key reused with different operation');
      return prior.balanceAfter;
    }
    const next = (this.balance.get(account) ?? 0) + delta;
    if (next < 0) throw new RangeError('insufficient credits');
    const event = Object.freeze({
      key,
      account,
      delta,
      balanceAfter: next,
    });
    this.balance.set(account, next);
    this.events.push(event);
    this.results.set(key, event);
    return next;
  }
}
export function ledgerTrace() {
  const ledger = new Ledger(),
    snapshots = [];
  const save = (action, returned) =>
    snapshots.push({
      action,
      returned,
      balance: ledger.balance.get('org-a') ?? 0,
      events: ledger.events.map((event) => ({
        ...event,
      })),
    });
  save('initial', null);
  save('deposit', ledger.apply('deposit-1', 'org-a', 100));
  save('withdraw', ledger.apply('withdraw-1', 'org-a', -30));
  save('replay', ledger.apply('deposit-1', 'org-a', 100));
  try {
    ledger.apply('deposit-1', 'org-a', 200);
    throw new Error('conflict accepted');
  } catch (error) {
    if (error.message !== 'idempotency key reused with different operation') throw error;
    save('conflict', null);
    Object.assign(snapshots.at(-1), {
      error: error.message,
      incomingDelta: 200,
      storedDelta: 100,
      originalResult: ledger.results.get('deposit-1').balanceAfter,
    });
  }
  return snapshots;
}
export function concurrencyChoice(kind) {
  if (kind === 'network-wait') return ['threads', 'async client'];
  if (kind === 'python-compute') return ['processes', 'isolated interpreters'];
  throw new RangeError('unknown work kind');
}
export const CRAWL = crawl();
export const CLAIM = claimRace();
export const SCHEDULE_RETRY = schedule();
export const SCHEDULE_BLOCKED = schedule({
  maxAttempts: 1,
  failTestOnce: false,
});
export const BUCKET = tokenBucketTrace();
export const LEDGER = ledgerTrace();
export function serializedWorkerTrace() {
  const input = JSON.stringify({
      id: 't7',
      x: 7,
    }),
    work = JSON.parse(input);
  const output = JSON.stringify({
    id: work.id,
    square: work.x * work.x,
  });
  const received = JSON.parse(output),
    merged = new Map([[received.id, received.square]]);
  return {
    input,
    output,
    id: received.id,
    result: merged.get('t7'),
  };
}
export function parserTrace(lines) {
  const records = [],
    steps = [];
  let current = null;
  for (const line of lines) {
    let action;
    if (line.startsWith(' ')) {
      if (current) {
        current.message += ' ' + line.trim();
        action = 'append to current';
      } else action = 'ignore orphan';
    } else {
      const first = line.indexOf('|'),
        second = line.indexOf('|', first + 1);
      if (first <= 0 || second <= first + 1) {
        current = null;
        action = 'clear current';
      } else {
        current = {
          timestamp: line.slice(0, first),
          level: line.slice(first + 1, second),
          message: line.slice(second + 1),
        };
        records.push(current);
        action = 'new accepted record';
      }
    }
    steps.push({
      line,
      action,
      current: current ? records.indexOf(current) : null,
      records: records.map((r) => ({
        ...r,
      })),
    });
  }
  return steps;
}
export function mixedWorkSchedule({ jobs = 2, wait = 3, cpu = 1 } = {}) {
  assert(Number.isInteger(jobs) && jobs > 0 && wait >= 0 && cpu > 0);
  return {
    serial: jobs * (wait + cpu),
    overlapped: wait + jobs * cpu,
    waits: Array.from(
      {
        length: jobs,
      },
      (_, i) => ({
        id: String.fromCharCode(65 + i),
        start: 0,
        end: wait,
      }),
    ),
    compute: Array.from(
      {
        length: jobs,
      },
      (_, i) => ({
        id: String.fromCharCode(65 + i),
        start: wait + i * cpu,
        end: wait + (i + 1) * cpu,
      }),
    ),
  };
}

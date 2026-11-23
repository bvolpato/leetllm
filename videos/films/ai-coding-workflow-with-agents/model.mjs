import { clamp, motion } from './arithmetic.mjs';
import { EVENT, OTHER, RACE_WINDOWS, REQUIRED_WORKFLOW_CHECKS, owned } from './fixtures.mjs';
import { replayChecks } from './validation.mjs';
import assert from 'node:assert/strict';
export function raceTrace(atomic, count = 4) {
  const rows = [],
    events = [],
    observed = {};
  for (let index = 0; index < Math.min(4, count); index++) {
    const worker = index % 2 ? 'B' : 'A';
    if (index < 2) {
      observed[worker] = rows.find((row) => row.event === EVENT) ?? null;
      events.push(`${worker} ${atomic ? 'begins unique insert' : 'reads event absent'}`);
      continue;
    }
    const prior = rows.find((row) => row.event === EVENT);
    if (atomic && prior) events.push(`${worker} returns ${prior.id}`);
    else if (!observed[worker]) {
      const row = {
        event: EVENT,
        id: `invoice ${rows.length + 1}`,
      };
      rows.push(row);
      events.push(`${worker} commits ${row.id}`);
    }
  }
  return {
    rows,
    events,
    count: rows.length,
  };
}
export function raceSnapshot(beat, progress) {
  const atomic = beat > 0,
    elapsed = clamp(progress) * (atomic ? 23.192 : 20.024),
    windows = RACE_WINDOWS[atomic ? 1 : 0];
  let completed = 0,
    cursor = 0;
  for (const [index, [start, end]] of windows.entries()) {
    if (elapsed >= end) {
      completed = index + 1;
      cursor = completed;
      continue;
    }
    if (elapsed > start) {
      const fraction = (elapsed - start) / (end - start);
      cursor = index + fraction * fraction * (3 - 2 * fraction);
    }
    break;
  }
  const trace = raceTrace(atomic, completed);
  return {
    atomic,
    elapsed,
    completed,
    cursor,
    trace,
    status: trace.events.at(-1) ?? 'Both workers share one event key',
  };
}
export function baseHandler(db, event) {
  return db.create(event);
}
export function fixedHandler(db, event) {
  return db.get(event) ?? db.create(event);
}
function deliver(handler, count, afterReply = () => {}) {
  const invoices = [],
    byEvent = new Map(),
    deliveries = [],
    db = {
      get: (event) => byEvent.get(event),
      create: (event) => {
        const invoice = 'invoice ' + (invoices.length + 1);
        invoices.push({
          event,
          invoice,
        });
        byEvent.set(event, invoice);
        return invoice;
      },
    };
  for (const event of [EVENT, EVENT, OTHER].slice(0, count))
    deliveries.push({
      event,
      invoice: handler(db, event),
    });
  afterReply(db);
  return {
    invoices,
    deliveries,
    count: invoices.length,
  };
}
export function replay(deduplicate, count) {
  return deliver(deduplicate ? fixedHandler : baseHandler, count);
}

// In this faulty fixture the retry returns the cached ID but also queues another write.
export function queuedReplay() {
  const queued = [];
  return deliver(
    (db, event) => {
      const existing = db.get(event);
      if (existing) queued.push(event);
      return existing ?? db.create(event);
    },
    3,
    (db) => {
      for (const event of queued) db.create(event);
    },
  );
}
export function replayEvidence(result) {
  const values = {
    first: result.deliveries[0]?.invoice,
    retry: result.deliveries[1]?.invoice,
    next: result.deliveries[2]?.invoice,
    stored: result.count,
  };
  return replayChecks.map((check) => {
    const code = check.toString().split('\n')[1].trim();
    if (result.deliveries.length !== 3)
      return {
        code,
        passed: null,
      };
    try {
      check(values);
      return {
        code,
        passed: true,
      };
    } catch (error) {
      if (error.code !== 'ERR_ASSERTION') throw error;
      return {
        code,
        passed: false,
      };
    }
  });
}
export function patchReviewSnapshot(progress) {
  const count = Math.min(3, Math.floor(clamp(progress) * 4)),
    before = replay(false, count),
    after = replay(true, count);
  return {
    count,
    before,
    after,
    beforeChecks: replayEvidence(before),
    afterChecks: replayEvidence(after),
  };
}
export const inScope = (paths) => paths.length > 0 && paths.every((path) => owned.has(path));
export function receiptOK(r, head = 'C') {
  return (
    r.source === head &&
    r.executed.includes('same event replay') &&
    r.executed.includes('new event creates invoice') &&
    r.terminal === 'pass'
  );
}
export function sampleModel(id, state) {
  const b = Math.min(1, state.beat),
    q = motion(state.beatP);
  const count =
    id === 'intro'
      ? b
        ? 2
        : Math.min(2, Math.floor(q * 3))
      : b
        ? 2 + Math.floor(q * 1.99)
        : Math.min(2, Math.floor(q * 3));
  const eventCue = id === 'replay' && b ? state.cues?.['replay-b2-2'] : null;
  const invoiceCue = id === 'replay' && b ? state.cues?.['replay-b2-3'] : null;
  const newEventVisible = eventCue ? eventCue.phase !== 'before' : false;
  const deliveryCount =
    id === 'replay' && !b
      ? 2
      : invoiceCue
        ? invoiceCue.phase === 'before'
          ? 2
          : 3
        : Math.min(3, count);
  const repairCue = id === 'loop' && b ? state.cues?.['loop-second-repair-build'] : null;
  const repairProgress = repairCue
    ? repairCue.phase === 'before'
      ? 0
      : repairCue.phase === 'after'
        ? 1
        : clamp(repairCue.progress)
    : q;
  const time = b ? 5 + repairProgress * 3 : q * 5;
  const receipt = !b
    ? {
        source: 'B',
        executed: ['same event replay', 'new event creates invoice'],
        terminal: 'pass',
      }
    : (state.cues?.['receipts-run'] ? state.cues['receipts-run'].phase !== 'after' : q < 0.5)
      ? {
          source: 'C',
          executed: ['new event creates invoice'],
          terminal: 'pass',
        }
      : {
          source: 'C',
          executed: ['same event replay', 'new event creates invoice'],
          terminal: 'pass',
        };
  return {
    b,
    q,
    count: deliveryCount,
    fixedMode:
      id !== 'intro' &&
      (id !== 'replay' ||
        b > 0 ||
        (state.cues?.['coding-candidate-check']
          ? state.cues['coding-candidate-check'].phase !== 'before'
          : q > 0.4)),
    store: replay(
      id !== 'intro' &&
        (id !== 'replay' ||
          b > 0 ||
          (state.cues?.['coding-candidate-check']
            ? state.cues['coding-candidate-check'].phase !== 'before'
            : q > 0.4)),
      deliveryCount,
    ),
    newEventVisible,
    race: id === 'race' ? raceSnapshot(b, state.beatP) : null,
    time,
    attempts: time >= 6 ? 2 : time >= 3 ? 1 : 0,
    receipt,
    receiptValid: receiptOK(receipt),
    paths: b ? [...owned] : [...owned, 'checkout/PayButton.tsx', 'pnpm-lock.yaml'],
  };
}
export function runnerCapability(kind, value) {
  if (kind === 'read')
    return ['billing/webhook.ts', 'billing/webhook.test.ts', 'fixtures/retry.json'].includes(value);
  if (kind === 'write') return value.startsWith('/tmp/runner/') && !value.split('/').includes('..');
  return false;
}
export function validateModel() {
  validateExpandedWorkflow();
  assert(runnerCapability('read', 'billing/webhook.ts'));
  assert(runnerCapability('write', '/tmp/runner/results.json'));
  assert(!runnerCapability('write', 'billing/webhook.ts'));
  assert(!runnerCapability('write', '/tmp/runner/../secrets'));
  assert(!runnerCapability('credential', 'production DB'));
  assert(!runnerCapability('network', 'production API'));
  assert.equal(raceTrace(false, 2).count, 0);
  assert.equal(raceTrace(false, 3).count, 1);
  assert.equal(raceTrace(false, 4).count, 2);
  assert.equal(raceTrace(true, 4).count, 1);
  assert.equal(raceTrace(true, 4).events.at(-1), 'B returns invoice 1');
  const before = replay(false, 2),
    after = replay(true, 3);
  const extra = queuedReplay();
  assert.deepEqual(extra.deliveries, after.deliveries);
  assert.equal(extra.invoices.at(-1).event, EVENT);
  assert.equal(extra.count, 3);
  assert.deepEqual(
    replayEvidence(extra).map((check) => check.passed),
    [true, true, false],
  );
  assert.equal(before.count, 2);
  assert.equal(
    sampleModel('intro', {
      beat: 0,
      beatP: 1,
    }).count,
    2,
  );
  assert.equal(
    sampleModel('replay', {
      beat: 0,
      beatP: 1,
    }).count,
    2,
  );
  assert.notEqual(before.deliveries[0].invoice, before.deliveries[1].invoice);
  assert.equal(after.count, 2);
  assert.equal(after.deliveries[0].invoice, after.deliveries[1].invoice);
  assert.notEqual(after.deliveries[2].invoice, after.deliveries[0].invoice);
  assert(inScope([...owned]));
  assert(!inScope([...owned, 'pnpm-lock.yaml']));
  assert(
    !receiptOK({
      source: 'B',
      executed: ['same event replay', 'new event creates invoice'],
      terminal: 'pass',
    }),
  );
  assert(
    !receiptOK({
      source: 'C',
      executed: ['new event creates invoice'],
      terminal: 'pass',
    }),
  );
  assert(
    receiptOK({
      source: 'C',
      executed: ['same event replay', 'new event creates invoice'],
      terminal: 'pass',
    }),
  );
  const complete = patchReviewSnapshot(1);
  assert.deepEqual(
    complete.beforeChecks.map((check) => check.passed),
    [false, true, false],
  );
  assert.deepEqual(
    complete.afterChecks.map((check) => check.passed),
    [true, true, true],
  );
  assert.deepEqual(
    complete.beforeChecks.map((check) => check.code),
    complete.afterChecks.map((check) => check.code),
  );
  for (let index = 0; index <= 100; index++) {
    const current = patchReviewSnapshot(index / 100);
    assert.equal(current.before.deliveries.length, current.count);
    assert.equal(current.after.deliveries.length, current.count);
    assert.equal(current.before.count, current.count);
    assert.equal(current.after.count, current.count === 3 ? 2 : Math.min(1, current.count));
    if (current.count < 3)
      assert(
        [...current.beforeChecks, ...current.afterChecks].every((check) => check.passed === null),
      );
  }
  for (const check of replayChecks)
    assert.throws(
      () =>
        check({
          first: 'invoice 1',
          retry: 'invoice 2',
          next: 'invoice 1',
          stored: 3,
        }),
      assert.AssertionError,
    );
  const calls = [],
    db = {
      get: (event) => {
        calls.push(['get', event]);
        return 'invoice existing';
      },
      create: (event) => {
        calls.push(['create', event]);
        return 'invoice created';
      },
    };
  assert.equal(fixedHandler(db, EVENT), 'invoice existing');
  assert.deepEqual(calls, [['get', EVENT]]);
  assert.equal(baseHandler(db, EVENT), 'invoice created');
  assert.deepEqual(calls.at(-1), ['create', EVENT]);
  for (const [beat, windows] of RACE_WINDOWS.entries()) {
    const duration = beat ? 23.192 : 20.024;
    for (const [index, [start, end]] of windows.entries()) {
      assert.equal(raceSnapshot(beat, (end - 0.0001) / duration).completed, index);
      const complete = raceSnapshot(beat, (end + 0.0001) / duration);
      assert.equal(complete.completed, index + 1);
      assert.equal(complete.trace.events.length, index + 1);
      const midway = raceSnapshot(beat, (start + end) / 2 / duration);
      assert(Math.abs(midway.cursor - index - 0.5) < 1e-10);
    }
    for (let step = 0; step <= 1000; step++) {
      const current = raceSnapshot(beat, step / 1000);
      assert(current.cursor >= current.completed && current.cursor < current.completed + 1);
      assert.equal(
        current.trace.count,
        beat ? Number(current.completed >= 3) : Math.max(0, current.completed - 2),
      );
      assert.equal(
        current.status,
        current.trace.events.at(-1) ?? 'Both workers share one event key',
      );
      if (current.completed === 4) assert.equal(current.cursor, 4);
    }
  }
  const wins = raceSnapshot(1, 5.8125 / 23.192 + 0.000001),
    resolves = raceSnapshot(1, 7.825 / 23.192 + 0.000001);
  assert.equal(wins.trace.count, 1);
  assert.equal(wins.status, 'A commits invoice 1');
  assert.equal(wins.cursor, 3);
  assert.equal(resolves.trace.count, 1);
  assert.equal(resolves.status, 'B returns invoice 1');
  assert.equal(resolves.cursor, 4);
  assert.deepEqual(raceSnapshot(1, 1).trace, resolves.trace);
  return true;
}
export function strictWorkflowReceipt(receipt, source = 'F', verifier = 'K') {
  return (
    receipt.source === source &&
    receipt.verifier === verifier &&
    receipt.base === 'expected assertion failure' &&
    receipt.terminal === 'pass' &&
    typeof receipt.exitCode === 'number' &&
    receipt.exitCode === 0 &&
    REQUIRED_WORKFLOW_CHECKS.every((check) => receipt.executed.includes(check))
  );
}
export function freshConcurrentLedger(events = [43017, 43017, 43017, 88104]) {
  const stored = new Map(),
    returned = [];
  for (const event of events) {
    if (!stored.has(event)) stored.set(event, stored.size + 1);
    returned.push(stored.get(event));
  }
  return {
    rows: [...stored].map(([event, invoice]) => ({
      event,
      invoice,
    })),
    returned,
    count: stored.size,
  };
}
export function handoffPrediction(beat, progress, cues = {}) {
  const completed = (id, fallback) =>
    cues[id] ? cues[id].phase === 'after' || cues[id].progress === 1 : fallback;
  return {
    share: beat > 0 || completed('fresh-share', progress > 0.52),
    newEvent: beat > 0 || completed('fresh-new', progress > 0.63),
    count: beat > 0 || completed('fresh-count', progress > 0.72),
    packet: beat > 1 || (beat === 1 && completed('fresh-packet-reveal', progress > 0.84)),
  };
}
export function validateExpandedWorkflow() {
  const ledger = freshConcurrentLedger();
  assert.deepEqual(ledger.returned, [1, 1, 1, 2]);
  assert.equal(ledger.count, 2);
  const full = {
    source: 'F',
    verifier: 'K',
    base: 'expected assertion failure',
    executed: [...REQUIRED_WORKFLOW_CHECKS],
    terminal: 'pass',
    exitCode: 0,
  };
  assert(strictWorkflowReceipt(full));
  for (const changed of [
    {
      source: 'E',
    },
    {
      verifier: 'J',
    },
    {
      base: 'import error',
    },
    {
      executed: ['new event', 'stored count'],
    },
    {
      terminal: 'skipped',
    },
    {
      exitCode: false,
    },
    {
      exitCode: null,
    },
  ])
    assert(
      !strictWorkflowReceipt({
        ...full,
        ...changed,
      }),
    );
  const held = {
    'fresh-share': {
      phase: 'before',
    },
    'fresh-new': {
      phase: 'before',
    },
    'fresh-count': {
      phase: 'before',
    },
  };
  assert.deepEqual(handoffPrediction(0, 1, held), {
    share: false,
    newEvent: false,
    count: false,
    packet: false,
  });
  return true;
}

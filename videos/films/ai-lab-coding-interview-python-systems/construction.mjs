import {
  BUCKET,
  CRAWL,
  LEDGER,
  SCHEDULE_BLOCKED,
  SCHEDULE_RETRY,
  clamp,
  concurrencyChoice,
  expiryState,
  mixedWorkSchedule,
  parserTrace,
  protectedClaimTrace,
  serializedWorkerTrace,
  smooth,
} from './arithmetic.mjs';
import { CI_CHAPTERS, tracks } from './fixtures.mjs';
export function openingCrawlerTrace(state) {
  const safe = (state.beat ?? 0) > 0;
  const cue = state.cues?.[safe ? 'opening-claim-once' : 'opening-beat-1-focus-1'];
  const progress = cue
    ? cue.phase === 'before'
      ? 0
      : cue.phase === 'after'
        ? 1
        : cue.progress
    : clamp(((state.beatP ?? 0) - 0.06) / 0.7);
  // Both unsafe reads precede either write, so each worker dispatches a fetch.
  const trace = safe
    ? [
        ['A', 'claim'],
        ['B', 'skip'],
        ['A', 'fetch'],
      ]
    : [
        ['A', 'read'],
        ['B', 'read'],
        ['A', 'write'],
        ['A', 'fetch'],
        ['B', 'write'],
        ['B', 'fetch'],
      ];
  const events = trace.slice(0, Math.floor(progress * trace.length + 1e-9));
  const workers = ['A', 'B'].map((worker) => ({
    worker,
    read: events.some(
      ([id, kind]) => id === worker && (kind === 'read' || kind === 'claim' || kind === 'skip'),
    ),
    claimed: events.some(([id, kind]) => id === worker && (kind === 'write' || kind === 'claim')),
    skipped: events.some(([id, kind]) => id === worker && kind === 'skip'),
    fetched: events.some(([id, kind]) => id === worker && kind === 'fetch'),
  }));
  return {
    safe,
    progress,
    events,
    workers,
    stored: workers.some((row) => row.claimed),
    owners: workers.filter((row) => row.claimed).length,
    fetches: workers.filter((row) => row.fetched).length,
  };
}
export const reached = (cues, id) => cues?.[id] && cues[id].phase !== 'before';
export function sampleOriginalModel(sceneId, state) {
  if (!tracks[sceneId]) throw new Error(`unknown coding-interview scene: ${sceneId}`);
  const held = tracks[sceneId].sample({
    beat: state.beat ?? 0,
    beatP: state.beatP ?? 0,
  });
  const step = held.snapshot.step,
    p = clamp(state.beatP ?? 0),
    q = smooth(p);
  if (sceneId === 'opening')
    return {
      step,
      q,
      queue: step === 0 ? ['/start'] : ['/guide', '/api'],
      promises: step === 0 ? ['FIFO', 'claim once'] : ['deadline', 'retry budget'],
    };
  if (sceneId === 'frontier') {
    const index = step === 0 ? 1 : 2 + Math.min(2, Math.floor(q * 2.999999));
    const transition = step === 0 ? clamp((q - 0.04) / 0.85) : q === 1 ? 1 : (q * 2.999999) % 1;
    const before = CRAWL.snapshots[index - 1],
      after = CRAWL.snapshots[index];
    const published = transition >= 0.82,
      dequeued = transition >= 0.2,
      arrived = transition >= 0.6;
    const visible = published
      ? after
      : {
          ...before,
          queue: dequeued ? before.queue.slice(1) : before.queue,
        };
    return {
      step,
      q,
      ...visible,
      current: arrived ? after.current : null,
      index,
      total: CRAWL.snapshots.length - 1,
      transition,
      transitionUrl: after.current,
      published,
      dequeued,
      arrived,
    };
  }
  if (sceneId === 'claim') {
    const visible = step === 0 ? Math.min(2, Math.floor(q * 3)) : 3;
    return {
      step,
      q,
      ...protectedClaimTrace(visible),
      visible,
      phase: step === 0 ? 'claim under short lock' : 'fetch outside lock',
    };
  }
  if (sceneId === 'expiry') {
    const boundary = state.cues?.['expiry-beat-2-focus-1'];
    const now = boundary
      ? boundary.phase === 'before'
        ? 14.999
        : 15
      : step === 0
        ? 14.999
        : Number((14.999 + q * 0.001).toFixed(6));
    return {
      step,
      q,
      ...expiryState(now),
      before: expiryState(14.999),
      at: expiryState(15),
    };
  }
  if (sceneId === 'scheduler') {
    const trace = step === 0 ? SCHEDULE_RETRY : SCHEDULE_BLOCKED;
    let index = Math.min(trace.snapshots.length - 1, Math.floor(q * trace.snapshots.length));
    if (state.cues) {
      if (step === 0) {
        index = reached(state.cues, 'scheduler-docs-complete') ? 1 : 0;
        if (reached(state.cues, 'scheduler-beat-1-focus-1')) index = 2;
        if (reached(state.cues, 'scheduler-retry-success')) index = 3;
        if (state.cues['scheduler-beat-1-focus-2']?.phase === 'after') index = 4;
      } else index = reached(state.cues, 'scheduler-test-exhausted') ? 2 : 1;
    }
    return {
      step,
      q,
      frame: trace.snapshots[index],
      index,
      snapshotCount: trace.snapshots.length,
      maxAttempts: step === 0 ? 2 : 1,
    };
  }
  if (sceneId === 'limiter') {
    let index =
      step === 0 ? Math.min(3, Math.floor(q * 4)) : 3 + Math.min(2, Math.floor(q * 2.999999));
    if (state.cues) {
      index = -1;
      const burst = state.cues['limiter-spend-burst'];
      if (burst?.phase !== 'before' && burst) index = Math.min(2, Math.floor(burst.progress * 3));
      if (reached(state.cues, 'limiter-denied-fourth')) index = 3;
      if (reached(state.cues, 'limiter-half-token')) index = 4;
      if (reached(state.cues, 'limiter-one-second')) index = 5;
    }
    return {
      step,
      q,
      ...BUCKET,
      event:
        index < 0
          ? {
              now: 0,
              cost: 1,
              allowed: null,
              retryAfter: 0,
              tokens: 3,
            }
          : BUCKET.events[index],
      index,
    };
  }
  if (sceneId === 'ledger') {
    let index =
      step === 0 ? Math.min(2, Math.floor(q * 3)) : 2 + Math.min(1, Math.floor(q * 1.999999));
    if (state.cues) {
      index = reached(state.cues, 'ledger-deposit') ? 1 : 0;
      if (reached(state.cues, 'ledger-withdraw')) index = 2;
      if (reached(state.cues, 'ledger-beat-2-focus-2')) index = 3;
      if (reached(state.cues, 'ledger-beat-2-focus-1')) index = 4;
    }
    return {
      step,
      q,
      ...LEDGER[index],
      index,
      count: LEDGER.length,
    };
  }
  return {
    step,
    q,
    choices: {
      networkWait: concurrencyChoice('network-wait'),
      pythonCompute: concurrencyChoice('python-compute'),
    },
    focus: step === 0 ? 'network-wait' : 'python-compute',
    owner: 'parent merges worker results',
    serialization: serializedWorkerTrace(),
    exchange: state.cues ? reached(state.cues, 'concurrency-beat-2-focus-1') : step > 0,
    exchangeProgress: state.cues?.['concurrency-beat-2-focus-1']?.progress ?? q,
    merged: state.cues ? reached(state.cues, 'concurrency-parent-merge') : step > 0 && q > 0.6,
  };
}
export const ciProgress = (state, id) => state.cues?.[id]?.progress ?? state.beatP ?? 0;
export const ciDone = (state, id) =>
  state.cues?.[id] ? state.cues[id].phase === 'after' : (state.beatP ?? 0) >= 1;
export function codingChapterState(id, state) {
  const beat = state.beat ?? 0,
    p = clamp(ciProgress(state, 'ci-' + id + '-' + beat + '-build')),
    q = smooth(p),
    done = p >= 1;
  const result = {
    beat,
    p,
    q,
    done,
  };
  if (id === 'fresh-worker-plan')
    return {
      ...result,
      schedule: mixedWorkSchedule(),
      serialVisible: beat > 1 || (beat === 1 && ciDone(state, 'ci-fresh-worker-plan-serial')),
      overlapVisible: beat > 1 || (beat === 1 && ciDone(state, 'ci-fresh-worker-plan-overlap')),
    };
  if (id === 'parser-state') {
    const lines =
      beat === 0
        ? [
            '  orphan continuation',
            '2026-06-02T12:00:00Z|ERROR|request failed',
            '  timeout while calling model',
          ]
        : ['t1|INFO|a|b', 'malformed line', '  must not attach', 't2|INFO|retry queued'];
    const trace = parserTrace(lines),
      index = Math.min(trace.length - 1, Math.floor(q * trace.length));
    return {
      ...result,
      lines,
      trace,
      index,
      current: trace[index],
    };
  }
  if (id === 'bucket-contract') {
    const elapsed = 0.5 * q,
      tokens = Math.min(3, elapsed);
    return {
      ...result,
      capacity: 3,
      rate: 1,
      elapsed,
      tokens,
      wait: 1 - tokens,
      refilledAfterIdle: Math.min(3, 3 * q),
    };
  }
  if (id === 'ttl-reads') {
    const removed =
        beat === 0
          ? ciDone(state, 'ci-ttl-reads-0-build')
          : beat === 1
            ? ciDone(state, 'ci-ttl-reads-scan')
            : false,
      permanent = beat === 1 && ciDone(state, 'ci-ttl-reads-overwrite');
    return {
      ...result,
      clock: 15,
      removed,
      permanent,
      entries: permanent
        ? [
            {
              key: 'task:1',
              value: 'ready',
              deadline: null,
            },
            {
              key: 'task:2',
              value: 'queued',
              deadline: null,
            },
          ]
        : [
            {
              key: 'task:1',
              value: 'running',
              deadline: 15,
            },
            {
              key: 'task:2',
              value: 'queued',
              deadline: null,
            },
          ].filter((x) => !removed || x.key !== 'task:1'),
    };
  }
  if (id === 'lock-order') {
    const phase = Math.min(4, Math.floor(q * 5));
    return {
      ...result,
      phase,
      held: beat === 1 ? phase === 1 || phase === 2 : phase > 0,
      unknown: beat === 1 && phase >= 2,
      unwound: beat === 1 && (phase >= 3 || ciDone(state, 'ci-lock-order-unwind')),
    };
  }
  return result;
}
export function sampleModel(id, state) {
  return CI_CHAPTERS.has(id) ? codingChapterState(id, state) : sampleOriginalModel(id, state);
}

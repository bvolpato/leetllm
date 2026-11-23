import {
  BUCKET,
  CLAIM,
  CRAWL,
  Ledger,
  SCHEDULE_BLOCKED,
  SCHEDULE_RETRY,
  TokenBucket,
  concurrencyChoice,
  expiryState,
  mixedWorkSchedule,
  normalizeUrl,
  parserTrace,
  protectedClaimTrace,
  serializedWorkerTrace,
} from './arithmetic.mjs';
import { SCENES, URLS } from './fixtures.mjs';
import { codingChapterState, openingCrawlerTrace, sampleOriginalModel } from './construction.mjs';
import assert from 'node:assert/strict';
export function validateOriginalModel() {
  const sampled = (safe, progress) =>
    openingCrawlerTrace({
      beat: safe ? 1 : 0,
      cues: {
        [safe ? 'opening-claim-once' : 'opening-beat-1-focus-1']: {
          phase: 'during',
          progress,
        },
      },
    });
  assert.equal(sampled(false, 1).fetches, 2);
  assert.equal(sampled(true, 1).fetches, 1);
  assert.equal(sampled(true, 1).owners, 1);
  assert(sampled(false, 2 / 6).workers.every((row) => row.read && !row.claimed));
  assert(sampled(true, 1).workers[1].skipped);
  assert(!sampled(true, 1).workers[1].fetched);
  for (let i = 0; i <= 100; i++) {
    assert(sampled(true, i / 100).fetches <= 1);
    assert(sampled(true, i / 100).owners <= 1);
  }
  const active = {
      phase: 'during',
      progress: 0.05,
    },
    after = {
      phase: 'after',
      progress: 1,
    };
  assert.equal(
    sampleOriginalModel('expiry', {
      beat: 1,
      beatP: 0.01,
      cues: {
        'expiry-beat-2-focus-1': active,
      },
    }).now,
    15,
  );
  assert.equal(
    sampleOriginalModel('expiry', {
      beat: 1,
      beatP: 0.01,
      cues: {
        'expiry-beat-2-focus-1': active,
      },
    }).stored,
    false,
  );
  assert.equal(
    sampleOriginalModel('limiter', {
      beat: 0,
      beatP: 0.4,
      cues: {
        'limiter-spend-burst': after,
        'limiter-denied-fourth': active,
      },
    }).event.retryAfter,
    1,
  );
  assert.equal(
    sampleOriginalModel('limiter', {
      beat: 1,
      beatP: 0.01,
      cues: {
        'limiter-half-token': active,
      },
    }).event.tokens,
    0.5,
  );
  assert.equal(
    sampleOriginalModel('limiter', {
      beat: 1,
      beatP: 0.01,
      cues: {
        'limiter-one-second': active,
      },
    }).event.allowed,
    true,
  );
  const exhausted = sampleOriginalModel('scheduler', {
    beat: 1,
    beatP: 0.01,
    cues: {
      'scheduler-test-exhausted': active,
    },
  }).frame;
  assert.equal(exhausted.state.test, 'failed');
  assert.equal(exhausted.state.deploy, 'blocked');
  assert(!exhausted.executed.includes('deploy'));
  const conflict = sampleOriginalModel('ledger', {
    beat: 1,
    beatP: 0.01,
    cues: {
      'ledger-beat-2-focus-1': active,
    },
  });
  assert.equal(conflict.action, 'conflict');
  assert.equal(conflict.balance, 70);
  assert.equal(conflict.events.length, 2);
  assert.equal(conflict.originalResult, 100);
  assert.deepEqual(serializedWorkerTrace(), {
    input: '{"id":"t7","x":7}',
    output: '{"id":"t7","square":49}',
    id: 't7',
    result: 49,
  });
  assert.deepEqual(CRAWL.order, [
    'https://repo.example/start',
    'https://repo.example/guide',
    'https://repo.example/api',
    'https://repo.example/faq',
  ]);
  assert.equal(new Set(CRAWL.order).size, CRAWL.order.length);
  assert.deepEqual(CRAWL.snapshots[0].inspected, {
    fragments: 0,
    offOrigin: 0,
    duplicates: [],
  });
  assert.deepEqual(CRAWL.snapshots[1].inspected, {
    fragments: 1,
    offOrigin: 1,
    duplicates: [],
  });
  assert.deepEqual(CRAWL.snapshots[2].inspected.duplicates, ['/api']);
  assert.deepEqual(CRAWL.snapshots[3].inspected.duplicates, ['/api', '/start']);
  for (const beatP of [0.1, 0.5, 0.99])
    assert.equal(
      sampleOriginalModel('frontier', {
        beat: 0,
        beatP,
      }).inspected.duplicates.length,
      0,
    );
  assert.equal(normalizeUrl('/api#auth', URLS.start).href, 'https://repo.example/api');
  assert.equal(
    normalizeUrl('https://other.example/private', URLS.start).origin === 'https://repo.example',
    false,
  );
  assert.equal(normalizeUrl('ftp://repo.example/file'), null);
  assert.equal(CLAIM.owners, 1);
  assert.deepEqual(CLAIM.outcomes, [true, false]);
  assert.equal(protectedClaimTrace(0).owners, 0);
  assert.equal(protectedClaimTrace(1).owners, 1);
  assert.equal(protectedClaimTrace(2).owners, 1);
  assert.equal(protectedClaimTrace(2).fetches, 0);
  assert.equal(protectedClaimTrace(3).fetches, 1);
  assert.equal(expiryState(14.999).value, 'running');
  assert.deepEqual(expiryState(15), {
    now: 15,
    expiresAt: 15,
    expired: true,
    value: null,
    stored: false,
  });
  assert.equal(
    expiryState(10, {
      ttl: 0,
    }).expired,
    true,
  );
  assert.throws(
    () =>
      expiryState(10, {
        ttl: -1,
      }),
    RangeError,
  );
  assert.deepEqual(SCHEDULE_RETRY.completed, ['docs', 'test', 'deploy']);
  assert.deepEqual(SCHEDULE_RETRY.executed, ['docs', 'test', 'test', 'deploy']);
  assert.deepEqual(SCHEDULE_BLOCKED.failed, ['test']);
  assert.deepEqual(SCHEDULE_BLOCKED.blocked, ['deploy']);
  assert.equal(SCHEDULE_BLOCKED.executed.includes('deploy'), false);
  assert.deepEqual(
    BUCKET.events.map((event) => event.allowed),
    [true, true, true, false, false, true],
  );
  assert.equal(BUCKET.events[3].retryAfter, 1);
  assert.equal(BUCKET.events[4].retryAfter, 0.5);
  assert.equal(BUCKET.events[5].tokens, 0);
  const limiter = new TokenBucket(3, 1);
  assert.equal(limiter.allow(0).tokens, 2);
  assert.throws(() => limiter.allow(-0.1), /invalid token bucket/);
  assert.throws(() => limiter.allow(0, 4), /invalid token bucket/);
  assert.throws(() => new TokenBucket(0, 1), /positive capacity/);
  const ledger = new Ledger();
  assert.equal(ledger.apply('deposit-1', 'org-a', 100), 100);
  assert.equal(ledger.apply('withdraw-1', 'org-a', -30), 70);
  assert.equal(ledger.apply('deposit-1', 'org-a', 100), 100);
  assert.equal(ledger.balance.get('org-a'), 70);
  assert.equal(ledger.events.length, 2);
  assert.throws(() => ledger.apply('deposit-1', 'org-a', 200), /different operation/);
  assert.deepEqual(concurrencyChoice('network-wait'), ['threads', 'async client']);
  assert.deepEqual(concurrencyChoice('python-compute'), ['processes', 'isolated interpreters']);
  const retryAtEnd = sampleOriginalModel('scheduler', {
    beat: 0,
    beatP: 0.999999,
  }).frame;
  assert.deepEqual(retryAtEnd.executed, ['docs', 'test', 'test', 'deploy']);
  assert.deepEqual(retryAtEnd.completed, ['docs', 'test', 'deploy']);
  const failedAtEnd = sampleOriginalModel('scheduler', {
    beat: 1,
    beatP: 0.999999,
  }).frame;
  assert.deepEqual(failedAtEnd.executed, ['docs', 'test']);
  assert.deepEqual(failedAtEnd.failed, ['test']);
  assert.deepEqual(failedAtEnd.blocked, ['deploy']);
  assert.equal(
    retryAtEnd.executed.length,
    Object.values(retryAtEnd.attempts).reduce((a, b) => a + b, 0),
  );
  assert.equal(
    failedAtEnd.executed.length,
    Object.values(failedAtEnd.attempts).reduce((a, b) => a + b, 0),
  );
  for (const beat of [0, 1]) {
    const s = sampleOriginalModel('concurrency', {
      beat,
      beatP: 0.5,
    });
    assert.deepEqual(s.choices.networkWait, ['threads', 'async client']);
    assert.deepEqual(s.choices.pythonCompute, ['processes', 'isolated interpreters']);
    assert.equal(s.focus, beat === 0 ? 'network-wait' : 'python-compute');
  }
  for (const scene of SCENES)
    for (const beat of [0, 1])
      for (const beatP of [0, 0.15, 0.5, 0.85, 1]) {
        const sample = sampleOriginalModel(scene, {
          beat,
          beatP,
        });
        assert.equal(sample.step, beatP === 1 && beat === 0 ? 1 : beat);
        assert(Number.isFinite(sample.q));
        if (scene === 'frontier') assert(sample.queue.length <= 4 && sample.seen.length <= 4);
        if (scene === 'expiry') assert.equal(sample.expired, sample.now >= sample.expiresAt);
        if (scene === 'limiter') assert(sample.event.tokens >= 0 && sample.event.tokens <= 3);
        if (scene === 'ledger' && sample.action === 'replay') assert.equal(sample.balance, 70);
      }
  return true;
}
export function validateModel() {
  validateOriginalModel();
  assert.deepEqual(mixedWorkSchedule().compute, [
    {
      id: 'A',
      start: 3,
      end: 4,
    },
    {
      id: 'B',
      start: 4,
      end: 5,
    },
  ]);
  assert.equal(mixedWorkSchedule().serial, 8);
  assert.equal(mixedWorkSchedule().overlapped, 5);
  const parsed = parserTrace(['t|L|a|b', ' bad', 'malformed', ' orphan']);
  assert.equal(parsed[1].records[0].message, 'a|b bad');
  assert.equal(parsed[3].records[0].message, 'a|b bad');
  assert.equal(parsed[3].current, null);
  assert.equal(
    codingChapterState('fresh-worker-plan', {
      beat: 0,
      beatP: 1,
    }).overlapVisible,
    false,
  );
  assert.equal(
    codingChapterState('fresh-worker-plan', {
      beat: 1,
      beatP: 0.1,
      cues: {
        'ci-fresh-worker-plan-overlap': {
          phase: 'before',
          progress: 0,
        },
      },
    }).overlapVisible,
    false,
  );
  for (const p of [0, 0.1, 0.5, 1]) {
    const bucket = codingChapterState('bucket-contract', {
      beat: 0,
      beatP: p,
    });
    assert(bucket.tokens >= 0 && bucket.tokens <= 0.5);
    assert.equal(bucket.tokens + bucket.wait, 1);
  }
  return true;
}

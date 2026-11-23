import { facts, grantPermit, grantRequest, ids, lanes } from './fixtures.mjs';
import {
  deadlinePlayback,
  filterEvidence,
  grantReplay,
  publicationSnapshot,
  sampleModel,
} from './construction.mjs';
import {
  Breaker,
  GrantLedger,
  compile,
  execute,
  grantPayloadHash,
  rank,
  retry,
  violations,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  const contract = compile(facts);
  assert.deepEqual(
    rank(contract).map((lane) => lane.id),
    ['C', 'D', 'E'],
  );
  assert.deepEqual(violations(lanes[5], contract), ['schema', 'citations', 'review']);
  assert.deepEqual(
    violations(
      {
        ...lanes[2],
        cost: 5001,
      },
      contract,
    ),
    ['cost'],
  );
  assert.deepEqual(
    compile({
      ...facts,
      data: 'public',
      citations: false,
    }),
    contract,
  );
  assert.equal(
    rank(
      compile({
        ...facts,
        context: 70000,
      }),
    ).length,
    0,
  );
  assert.deepEqual(filterEvidence(0, 0).admitted, []);
  assert.deepEqual(filterEvidence(0, 0.9).admitted, ['C', 'D', 'E']);
  assert(filterEvidence(0, 0.5).completed > 0 && filterEvidence(0, 0.5).completed < 36);
  assert.equal(
    filterEvidence(2, 0.1).rows.every(
      (row) => !row.checks.find((check) => check.field === 'context').checked,
    ),
    true,
  );
  assert.deepEqual(filterEvidence(2, 0.9).admitted, []);
  assert.equal(execute().elapsed, 2040);
  assert.equal(execute().spent, 8700);
  assert.equal(execute().served.id, 'D');
  const during = (progress) => ({ phase: 'during', progress });
  const ended = { phase: 'after', progress: 1 };
  const before = { phase: 'before', progress: 0 };
  assert.equal(deadlinePlayback(0, 0.32).cursor, 940);
  assert.equal(deadlinePlayback(0, 0.9).currentOutcome, 'transport completed');
  assert.equal(deadlinePlayback(1, 0.9).cursor, 1800);
  assert.equal(deadlinePlayback(2, 0.9).currentOutcome, 'known fallback cannot fit');
  assert.equal(deadlinePlayback(4, 0.9).currentOutcome, 'charge reservation denied');
  const firstCase = sampleModel('transfer', {
    beat: 1,
    beatP: 0.99,
    cues: { 'first-sum': during(1), 'first-dispatch': before },
  });
  assert(firstCase.admitted);
  assert(!firstCase.reveal);
  assert(!firstCase.settled);
  const changedCase = sampleModel('transfer', {
    beat: 2,
    beatP: 0.99,
    cues: { 'transfer-change': ended, 'second-sum': before, 'second-dispatch': before },
  });
  assert.equal(changedCase.primary, 1400);
  assert(!changedCase.admitted);
  assert(!changedCase.reveal);
  assert(!changedCase.settled);
  const probe = sampleModel('breaker', {
    beat: 2,
    beatP: 0.5,
    cues: { 'close-breaker': during(1) },
  });
  assert(probe.first);
  assert.equal(probe.second, false);
  assert.equal(probe.state, 'half open');
  assert.equal(
    sampleModel('breaker', { beat: 2, beatP: 0.5, cues: { 'close-breaker': ended } }).state,
    'closed',
  );
  assert.equal(execute(1800).elapsed, 1800);
  assert.equal(execute(1800).served, null);
  assert.equal(execute(1800).spans.length, 1);
  assert.equal(execute(940, 8000).spans.length, 1);
  assert.equal(execute(1400).served, null);
  assert.equal(execute(1399).served.id, 'D');
  assert.equal(execute(1400).spans.length, 1);
  assert.equal(execute(1399).elapsed, 2499);
  assert(!retry('timeout', true));
  assert(!retry('auth'));
  assert(!retry('refusal'));
  const streamAt = (words, drop) =>
    publicationSnapshot({
      beat: 1,
      cues: {
        'publish-words': words,
        'latch-output': drop,
      },
    });
  assert.equal(streamAt(before, before).published, false);
  const firstWords = streamAt(during(0.6), before);
  assert(firstWords.published);
  assert.equal(firstWords.failure, null);
  assert.equal(firstWords.mayRetry, false);
  assert.equal(firstWords.visibleText, 'Your access');
  const dropped = streamAt(ended, ended);
  assert.equal(dropped.failure, 'drop');
  assert.equal(dropped.visibleText, 'Your access request…');
  assert.equal(dropped.mayRetry, false);
  const expired = new Breaker();
  expired.fail(0);
  expired.fail(1);
  assert(expired.permit(11));
  assert(!expired.permit(13.5));
  assert.equal(expired.state, 'open');
  const ledger = new GrantLedger();
  assert.equal(
    ledger.execute(grantRequest, {
      actor: 'model',
      reviewReceipt: 'HR-8',
    }).status,
    'denied',
  );
  assert.equal(ledger.effects, 0);
  const committed = ledger.execute(grantRequest, grantPermit);
  assert.equal(committed.status, 'committed');
  const replay = ledger.execute(
    {
      ...grantRequest,
    },
    grantPermit,
  );
  assert.equal(replay.status, 'reused');
  assert.equal(replay.receipt, committed.receipt);
  assert.equal(ledger.effects, 1);
  assert.equal(ledger.rows.size, 1);
  assert.equal(
    ledger.execute(
      {
        ...grantRequest,
        resource: 'project-43',
      },
      {
        ...grantPermit,
        reviewReceipt: 'HR-9',
      },
    ).status,
    'conflict',
  );
  assert.equal(ledger.effects, 1);
  assert.equal(
    ledger.execute(grantRequest, {
      ...grantPermit,
      reviewReceipt: 'unknown',
    }).status,
    'denied',
  );
  assert.equal(
    ledger.execute(
      {
        ...grantRequest,
        tenant: 'T8',
      },
      grantPermit,
    ).status,
    'denied',
  );
  assert.equal(
    grantPayloadHash({
      role: 'viewer',
      resource: 'project-42',
      subject: 'user-17',
    }),
    grantPayloadHash(grantRequest),
  );
  assert.equal(grantReplay(1, 0.2).consumed, false);
  assert.equal(grantReplay(1, 0.5).consumed, true);
  assert.equal(grantReplay(1, 0.5).replayed, false);
  assert.equal(grantReplay(1, 0.8).replay.status, 'reused');
  for (const beatP of [0, 0.2, 0.5, 0.8, 0.99]) {
    assert.equal(grantReplay(1, beatP).effects, 1);
    assert.equal(grantReplay(1, beatP).rowCount, 1);
  }
  for (const id of ids)
    for (let beat = 0; beat < (id === 'deadline' ? 5 : id === 'transfer' ? 4 : 3); beat++)
      for (const beatP of [0, 0.25, 0.5, 0.75, 0.999999]) {
        const s = sampleModel(id, {
          beat,
          beatP,
        });
        assert.equal(s.step, beat);
        if (id === 'deadline') {
          assert(s.elapsed <= 2500);
          assert(s.spent <= s.cap);
          if (s.served) assert.equal(violations(s.served, s.contract).length, 0);
          assert(s.completedSpent <= s.spent);
          if (!s.complete) {
            assert.notEqual(s.currentOutcome, s.reason);
            assert(
              s.currentOutcome.endsWith('attempt running') ||
                s.currentOutcome === 'Fallback reservation check pending',
            );
          }
          if (s.cursor < s.spans[0].end) assert.equal(s.completedSpent, 0);
          if (s.complete) {
            assert.equal(s.currentOutcome, s.reason);
            assert.equal(s.completedSpent, s.spent);
          }
        }
        if (id === 'publication') assert.equal(s.accepted, beat !== 2);
        if (id === 'breaker' && beat === 1) {
          assert.equal(s.second, null);
          assert.equal(s.state, s.first ? 'half open' : 'open');
        }
      }
  for (const id of ids) {
    assert.equal(
      sampleModel(id, {
        beat: 0,
        beatP: 1,
      }).step,
      1,
    );
    assert.equal(
      sampleModel(id, {
        beat: 1,
        beatP: 1,
      }).step,
      2,
    );
  }
  return true;
}

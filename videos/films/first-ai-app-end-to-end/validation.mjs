import { accountFacts, request, spans } from './fixtures.mjs';
import { joinGeometry, openingRequestState, requestFrame, sampleModel } from './construction.mjs';
import {
  checkPolicy,
  createMemoryStore,
  invalidRequestFixture,
  policyCandidate,
  policyCases,
  repeatedRequestFixture,
  runFixture,
  thresholdTrials,
  trustedDecision,
  validateRequest,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  const checked = openingRequestState(1, 0.01, {
    'application-trace-b2-1': {
      phase: 'during',
      progress: 0.01,
    },
  }).current;
  assert.equal(openingRequestState(2, 0.5, {}).validation.checked, 'eligible');
  assert.equal(checked.event, 'candidate checked');
  assert.equal(checked.checked, 'eligible');
  assert.equal(checked.candidate.decision, 'eligible');
  assert.equal(checked.trace.status, 'running');
  assert.equal(checked.trace.result, null);
  assert.equal(validateRequest(request), 'accepted');
  for (const body of invalidRequestFixture()) {
    const run = runFixture({
      body,
    });
    assert.equal(run.reply.http, 422);
    assert.equal(run.providerCalls, 0);
    assert.equal(run.rows.length, 0);
  }
  for (let i = 0; i <= 1000; i++) {
    const { actor, segments } = joinGeometry(i / 1000);
    for (const [from, to] of segments) {
      assert(to.x > from.x);
      assert(to.x <= actor.x - 20 || from.x >= actor.x + actor.width + 20);
    }
  }
  const nominal = runFixture();
  const repeated = repeatedRequestFixture();
  assert.notEqual(repeated.ids[0], repeated.ids[1]);
  assert.equal(repeated.providerCalls, 2);
  assert.equal(repeated.rows.length, 2);
  assert.equal(repeated.rows[0].report_fingerprint, repeated.rows[1].report_fingerprint);
  assert.deepEqual(
    thresholdTrials().map(({ days, row, reply }) => [
      days,
      reply.http,
      row.status,
      row.version,
      reply.body.decision,
      reply.body.error_code,
    ]),
    [
      [29, 200, 'failed', 2, null, 'invalid_decision'],
      [30, 200, 'completed', 2, 'eligible', null],
    ],
  );
  assert.deepEqual(
    nominal.journal.map((x) => x.event),
    [
      'input validated',
      'running saved',
      'provider invoked',
      'candidate checked',
      'completed saved',
      'response returned',
    ],
  );
  assert.deepEqual(
    nominal.journal.map((x) => x.providerCalls),
    [0, 0, 1, 1, 1, 1],
  );
  assert.deepEqual(
    nominal.journal.map((x) => x.trace?.status ?? null),
    [null, 'running', 'running', 'running', 'completed', 'completed'],
  );
  assert.equal(nominal.reply.body.trace_id, nominal.rows[0].id);
  assert.equal(nominal.rows[0].version, 2);
  assert(!JSON.stringify(nominal.rows).includes(request.credential_report));
  const store = createMemoryStore();
  store.insert({
    id: 'race',
    status: 'running',
    version: 1,
  });
  assert.equal(
    store.complete('race', 1, {
      decision: 'eligible',
    }),
    true,
  );
  assert.equal(
    store.complete('race', 1, {
      decision: 'not_eligible',
    }),
    false,
  );
  assert.equal(store.get('race').result.decision, 'eligible');
  assert.deepEqual(
    policyCases().map((x) => x.run.reply.body.decision),
    ['eligible', 'not_eligible', 'not_eligible', 'eligible', 'needs_review'],
  );
  assert.equal(
    checkPolicy(
      {
        ...policyCandidate(accountFacts.acct_10234),
        decision: 'not_eligible',
      },
      accountFacts.acct_10234,
    ),
    'invalid_decision',
  );
  assert.equal(
    checkPolicy(
      {
        ...policyCandidate(accountFacts.acct_10234),
        rotation_window_days: true,
      },
      accountFacts.acct_10234,
    ),
    'invalid_decision',
  );
  assert.equal(
    trustedDecision({
      credential_age_days: '45',
      key_stale: true,
    }),
    'needs_review',
  );
  assert.equal(
    trustedDecision({
      credential_age_days: 45,
      key_stale: 'yes',
    }),
    'needs_review',
  );
  const initial = runFixture({
      fault: 'initial',
    }),
    terminal = runFixture({
      fault: 'terminal',
    });
  assert.deepEqual([initial.reply.http, initial.providerCalls, initial.rows.length], [503, 0, 0]);
  assert.deepEqual(
    [
      terminal.reply.http,
      terminal.providerCalls,
      terminal.rows[0].status,
      terminal.rows[0].version,
    ],
    [503, 1, 'running', 1],
  );
  for (const p of [0, 0.12, 0.5, 0.88, 1]) {
    assert.equal(requestFrame(0, p).current.providerCalls, 0);
    assert.equal(requestFrame(1, p).current.trace.status, 'running');
    const current = requestFrame(2, p).current;
    assert.equal(current.trace.status, p * spans.terminal < 2.525 ? 'running' : 'completed');
  }
  for (const p of [0, 0.12, 0.5, 0.88, 1]) {
    const s = sampleModel('evaluation', {
      beat: 0,
      beatP: p,
    });
    assert.equal(s.inspectedCases.length, s.inspected);
    assert(s.inspectedCases.every((x) => x.run.reply.body.decision === x.expected));
  }
  assert.equal(
    sampleModel('policy-check', {
      beat: 1,
      beatP: 4.57 / spans.policyKnown,
    }).currentCase,
    1,
  );
  assert.equal(
    sampleModel('policy-check', {
      beat: 1,
      beatP: 4.58 / spans.policyKnown,
    }).currentCase,
    2,
  );
  assert.equal(
    sampleModel('policy-check', {
      beat: 2,
      beatP: 3.82 / spans.policyMissing,
    }).currentCase,
    3,
  );
  assert.equal(
    sampleModel('policy-check', {
      beat: 2,
      beatP: 3.83 / spans.policyMissing,
    }).currentCase,
    4,
  );
  assert.equal(requestFrame(1, 8.57 / spans.provider).index, 2);
  assert.equal(requestFrame(1, 8.58 / spans.provider).index, 3);
  assert.equal(requestFrame(2, 2.52 / spans.terminal).current.trace.version, 1);
  assert.equal(requestFrame(2, 2.53 / spans.terminal).current.trace.version, 2);
  assert.equal(requestFrame(2, 5.91 / spans.terminal).index, 5);
  assert.equal(
    sampleModel('browser-outcome', {
      beat: 1,
      beatP: 0.58 / spans.browser,
    }).browser,
    'completed',
  );
  assert.equal(
    sampleModel('browser-outcome', {
      beat: 1,
      beatP: 1.8 / spans.browser,
    }).browserFields,
    1,
  );
  assert.equal(
    sampleModel('browser-outcome', {
      beat: 1,
      beatP: 4.31 / spans.browser,
    }).browserFields,
    3,
  );
  assert.equal(
    sampleModel('browser-outcome', {
      beat: 2,
      beatP: 0.58 / spans.reload,
    }).browser,
    'reloaded',
  );
  return true;
}

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  accountFacts,
  createApp,
  policyCandidate,
} from '../animations/first-ai-app-end-to-end.mjs';

const request = { account_id: 'acct_10234', credential_report: 'The service key is stale.' };

test('a returned invalid candidate records a failed attempt rather than a completed review decision', () => {
  const app = createApp({
    provider: (facts) => ({ ...policyCandidate(facts), source_line_ids: ['P-7', 'extra'] }),
  });
  const response = app.check(request);
  assert.equal(response.http, 200);
  assert.equal(response.body.status, 'failed');
  assert.equal(response.body.error_code, 'invalid_decision');
  assert.equal(app.store.get(response.body.trace_id).status, 'failed');
  assert.equal(app.store.get(response.body.trace_id).version, 2);
});

test('adapter exceptions remain distinct from checker failures and never return private error text', () => {
  for (const [name, expected] of [
    ['TimeoutError', 'provider_timeout'],
    ['ValueError', 'provider_error'],
  ]) {
    const app = createApp({
      provider: () => {
        const error = Error('private report body');
        error.name = name;
        throw error;
      },
    });
    const response = app.check(request);
    assert.equal(response.http, 200);
    assert.equal(response.body.status, 'failed');
    assert.equal(response.body.error_code, expected);
    assert.equal(app.providerCalls, 1);
    assert(
      !JSON.stringify([response, app.store.all(), app.journal]).includes('private report body'),
    );
  }
});

test('a fresh 29-day stale key rejects an otherwise well-shaped eligible candidate', () => {
  const app = createApp({
    facts: { ...accountFacts, acct_10234: { credential_age_days: 29, key_stale: true } },
    provider: () => policyCandidate(accountFacts.acct_10234),
  });
  const response = app.check(request);
  assert.equal(response.body.error_code, 'invalid_decision');
  assert.equal(app.store.get(response.body.trace_id).status, 'failed');
  assert.equal(app.providerCalls, 1);
});

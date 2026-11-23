import { accountFacts, request } from './fixtures.mjs';
import { createHmac } from 'node:crypto';
export const clone = (value) => structuredClone(value);
export function validateRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'invalid_request';
  if (Object.keys(body).some((key) => !['account_id', 'credential_report', 'item'].includes(key)))
    return 'invalid_request';
  if (typeof body.account_id !== 'string' || !/^acct_[0-9]{5}$/.test(body.account_id.trim()))
    return 'invalid_request';
  if (body.item !== undefined && body.item !== 'service-account-key') return 'invalid_request';
  if (
    typeof body.credential_report !== 'string' ||
    [...body.credential_report.trim()].length < 10 ||
    [...body.credential_report.trim()].length > 500
  )
    return 'invalid_request';
  return 'accepted';
}
export function trustedDecision(facts) {
  if (
    !facts ||
    !Number.isInteger(facts.credential_age_days) ||
    facts.credential_age_days < 0 ||
    typeof facts.key_stale !== 'boolean'
  )
    return 'needs_review';
  return facts.key_stale && facts.credential_age_days >= 30 ? 'eligible' : 'not_eligible';
}
export function policyCandidate(facts) {
  return {
    decision: trustedDecision(facts),
    rotation_window_days: 30,
    source_line_ids: ['P-7'],
  };
}
export function checkPolicy(candidate, facts) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate))
    return 'invalid_decision';
  if (Object.keys(candidate).sort().join(',') !== 'decision,rotation_window_days,source_line_ids')
    return 'invalid_decision';
  if (
    !['eligible', 'not_eligible', 'needs_review'].includes(candidate.decision) ||
    !Number.isInteger(candidate.rotation_window_days) ||
    candidate.rotation_window_days !== 30 ||
    JSON.stringify(candidate.source_line_ids) !== '["P-7"]'
  )
    return 'invalid_decision';
  return candidate.decision === trustedDecision(facts) ? candidate.decision : 'invalid_decision';
}
export function createMemoryStore(fault = null) {
  const rows = new Map();
  return {
    get: (id) => (rows.has(id) ? clone(rows.get(id)) : null),
    all: () => [...rows.values()].map(clone),
    insert(row) {
      if (fault === 'initial') throw Error('storage_unavailable');
      if (rows.has(row.id)) throw Error('duplicate_trace');
      rows.set(row.id, clone(row));
    },
    complete(id, version, result) {
      if (fault === 'terminal') throw Error('storage_unavailable');
      const row = rows.get(id);
      if (!row || row.status !== 'running' || row.version !== version) return false;
      rows.set(id, {
        ...row,
        status: result.status ?? 'completed',
        version: version + 1,
        result: clone(result),
      });
      return true;
    },
  };
}
export function createApp({
  store = createMemoryStore(),
  facts = accountFacts,
  provider = policyCandidate,
} = {}) {
  let sequence = 0,
    providerCalls = 0;
  const journal = [];
  const record = (event, id = null, details = {}) =>
    journal.push({
      event,
      providerCalls,
      rows: store.all(),
      trace: id ? store.get(id) : null,
      ...details,
    });
  return {
    store,
    journal,
    get providerCalls() {
      return providerCalls;
    },
    check(body) {
      if (validateRequest(body) !== 'accepted') {
        record('input rejected');
        return {
          http: 422,
          body: {
            error_code: 'invalid_request',
          },
        };
      }
      record('input validated');
      body = {
        account_id: body.account_id.trim(),
        item: 'service-account-key',
        credential_report: body.credential_report.trim(),
      };
      const id = `T-${String(++sequence).padStart(3, '0')}`,
        trusted = facts[body.account_id] ?? null;
      const trace = {
        id,
        account_id: body.account_id,
        policy: 'P-7',
        facts: clone(trusted),
        status: 'running',
        version: 1,
        report_fingerprint: createHmac('sha256', 'local-demo-key-not-for-production')
          .update(JSON.stringify(body))
          .digest('hex'),
        result: null,
      };
      try {
        store.insert(trace);
      } catch {
        record('initial write failed');
        return {
          http: 503,
          body: {
            error_code: 'storage_unavailable',
          },
        };
      }
      record('running saved', id);
      providerCalls++;
      record('provider invoked', id);
      let candidate, result;
      try {
        candidate = provider(trusted);
      } catch (error) {
        result = {
          status: 'failed',
          decision: null,
          source_line_ids: [],
          error_code: error.name === 'TimeoutError' ? 'provider_timeout' : 'provider_error',
        };
        record('provider failed', id, {
          error_code: result.error_code,
        });
      }
      if (!result) {
        const checked = checkPolicy(candidate, trusted);
        record('candidate checked', id, {
          checked,
        });
        result =
          checked === 'invalid_decision'
            ? {
                status: 'failed',
                decision: null,
                source_line_ids: [],
                error_code: 'invalid_decision',
              }
            : {
                status: 'completed',
                decision: checked,
                source_line_ids: ['P-7'],
                error_code: null,
              };
        if (checked !== 'invalid_decision') journal.at(-1).candidate = clone(candidate);
      }
      try {
        if (!store.complete(id, 1, result))
          return {
            http: 503,
            body: {
              error_code: 'storage_unavailable',
            },
          };
      } catch {
        record('terminal write failed', id);
        return {
          http: 503,
          body: {
            error_code: 'storage_unavailable',
          },
        };
      }
      record(result.status + ' saved', id);
      const reply = {
        http: 200,
        body: {
          trace_id: id,
          ...result,
        },
      };
      record('response returned', id);
      return reply;
    },
  };
}
export function runFixture({ account = 'acct_10234', fault = null, body = null } = {}) {
  const app = createApp({
    store: createMemoryStore(fault),
  });
  const reply = app.check(
    body ?? {
      ...request,
      account_id: account,
    },
  );
  return {
    reply,
    journal: app.journal,
    rows: app.store.all(),
    providerCalls: app.providerCalls,
  };
}
export function repeatedRequestFixture() {
  const app = createApp(),
    first = app.check(request),
    second = app.check(request);
  return {
    ids: [first.body.trace_id, second.body.trace_id],
    rows: app.store.all(),
    providerCalls: app.providerCalls,
  };
}
export function thresholdTrials() {
  const candidate = { decision: 'eligible', rotation_window_days: 30, source_line_ids: ['P-7'] };
  return [29, 30].map((days) => {
    const facts = { credential_age_days: days, key_stale: true };
    const app = createApp({ facts: { [request.account_id]: facts }, provider: () => candidate });
    const reply = app.check(request);
    return { days, candidate, row: app.store.get(reply.body.trace_id), reply };
  });
}
export function policyCases() {
  const expectedDecisions = [
    ['acct_10234', 'eligible'],
    ['acct_10235', 'not_eligible'],
    ['acct_10236', 'not_eligible'],
    ['acct_10237', 'eligible'],
    ['acct_99999', 'needs_review'],
  ];
  return expectedDecisions.map(([account, expected]) => ({
    account,
    facts: accountFacts[account] ?? null,
    expected,
    run: runFixture({
      account,
    }),
  }));
}
export function invalidRequestFixture() {
  return [
    {
      account_id: 'wrong',
      credential_report: 'A sufficiently long report.',
    },
    {
      ...request,
      credential_report: ' '.repeat(20),
    },
    {
      ...request,
      credential_age_days: 999,
    },
    {
      ...request,
      item: 'database-password',
    },
  ];
}

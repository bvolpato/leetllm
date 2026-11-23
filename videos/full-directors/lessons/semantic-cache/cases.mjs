import assert from 'node:assert/strict';
import { ARTICLE_RECORD, SHADOW_ROWS } from '../../../films/semantic-cache/fixtures.mjs';
import {
  scaledCosine,
  servingWindow,
  wilsonLower,
} from '../../../films/semantic-cache/arithmetic.mjs';
import {
  exactIdentity,
  answerDigest,
  reportDecision,
  shadowReplay,
} from '../../../films/semantic-cache/model.mjs';
export {
  ARTICLE_RECORD,
  scaledCosine,
  servingWindow,
  wilsonLower,
  exactIdentity,
  answerDigest,
  reportDecision,
};
export const fraction = (n, d) => (d ? n + ' / ' + d : 'undefined');
export const questions = [
  'Key retention',
  'Audit-log wording',
  'Revoked keys',
  'Policy FAQ',
  'Restore a key?',
  'Live incident',
  'Revoke key',
];
export const highRestore = scaledCosine([1, 0, 0], [0.9999, 0.01, 0]);
export const retentionText = 'How long do revoked keys stay in audit logs?';
export function replay(threshold, shift = 0, narrow = false, disabled = false) {
  const restoration = scaledCosine(
    [1, 0, 0],
    [0.94 + (0.9999 - 0.94) * shift, 0.1 + (0.01 - 0.1) * shift, 0],
  );
  const rows = SHADOW_ROWS.map((r, i) => ({
    ...r,
    name: questions[i],
    score: i === 4 ? restoration : r.score,
    eligible: r.eligible && !disabled && !(narrow && i === 4),
  }));
  const result = shadowReplay(threshold, rows);
  return {
    ...result,
    rows: rows.map((r) => ({ ...r, proposed: result.proposals.some((s) => s.id === r.id) })),
    threshold,
  };
}
export function readPolicy({
  reader = 7,
  corpus = reader,
  now = 100,
  authorized = true,
  approved = true,
} = {}) {
  if (authorized !== true) return 'Deny access';
  if (reader !== 7 || corpus !== 7) return 'Scope miss';
  if (now >= 200) return 'Expired';
  if (!approved) return 'Approval revoked';
  return 'Hit';
}
export function prelookup(authorized, route, context = false) {
  if (typeof authorized !== 'boolean') return 'Invalid request';
  if (!authorized) return 'Deny access';
  if (route !== 'public policy' || context) return 'Bypass';
  return 'Search';
}
export function recordGate(now, score, approved = true) {
  if (now >= 4600) return 'Expired';
  if (!approved) return 'Unapproved';
  if (typeof score !== 'number' || !Number.isFinite(score) || Math.abs(score) > 1)
    return 'Invalid score';
  return score >= 0.99 ? 'Propose' : 'Below cutoff';
}
export function revision(days = 30, expires = 4600) {
  return {
    ...ARTICLE_RECORD,
    response: ARTICLE_RECORD.response.replace('30', days),
    expires_at: expires,
  };
}
export const reviewedRate = {
  ...ARTICLE_RECORD,
  answer_id: 'ans_rate_limit_public',
  source_query: 'What is the default API rate limit?',
  response:
    'Default API keys allow 600 requests per minute unless the account policy says otherwise.',
  admission_evidence_id: 'eval-public-policy-rate-limits-v1',
};
const registry = new Map(
  [ARTICLE_RECORD, reviewedRate].map((r) => [r.admission_evidence_id, answerDigest(r)]),
);
export function admit(r, revoked = false) {
  return (
    r.response_class === 'public-policy' &&
    Object.keys(ARTICLE_RECORD.scope).every((k) => r.scope[k] === ARTICLE_RECORD.scope[k]) &&
    r.expires_at > 1000 &&
    !revoked &&
    registry.get(r.admission_evidence_id) === answerDigest(r)
  );
}
export const writeCases = [
  { ...ARTICLE_RECORD, admission_evidence_id: '' },
  reviewedRate,
  { ...reviewedRate, response_class: 'live-incident' },
  revision(90),
];
export const reportA = {
  id: 'public-policy-A',
  created: 6400,
  scopeCurrent: true,
  policyCurrent: true,
  lookups: 1000,
  proposals: 500,
  reviewed: 500,
  acceptable: 500,
  saving: 10,
  p95: 1030,
};
export const reports = [
  reportA,
  { ...reportA, id: 'public-policy-B', proposals: 300, reviewed: 300, acceptable: 300 },
  { ...reportA, id: 'public-policy-C', created: 6399 },
];
export const large = servingWindow(10000, 5714);
const heldout = {
  ...reportA,
  created: 10000,
  lookups: 10000,
  proposals: 5714,
  reviewed: 5714,
  acceptable: 5714,
  saving: large.saving,
  p95: large.p95,
};
export const variants = [
  heldout,
  { ...heldout, acceptable: 5600 },
  { ...heldout, saving: -0.4 },
  { ...heldout, scopeCurrent: false },
];
export const small = servingWindow(2000, 30, { generationCost: 0.003, lookupCost: 0.00006 });
export const exampleLatency = { generationMs: 1000, lookupMs: 20 };
export const freshOnly = servingWindow(10, 0, { ...exampleLatency, lookupMs: 0 });
export const allMisses = servingWindow(10, 0, exampleLatency);

export const callRoutes = {
  semantic: ['Return approved reply'],
  live: ['Reuse KV', 'Reuse KV', 'Process input', 'Generate reply'],
};
export const generationCalls = (route) => route.filter((step) => step === 'Generate reply').length;
export const cohort = Array.from({ length: 9 }, (_, i) =>
  i < 4
    ? { group: 'Exact repeat', calls: 0, scores: 0 }
    : i < 6
      ? { group: 'Access revoked', calls: 0, scores: 0 }
      : { group: 'Live incident', calls: generationCalls(callRoutes.live), scores: 0 },
);
export function tenReads(hits, pending = false) {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    ms: pending && i === 5
      ? null
      : exampleLatency.lookupMs + (i < hits ? 0 : exampleLatency.generationMs),
  }));
}
export function checkCases() {
  assert.equal(scaledCosine([1e308, 1e308], [1e308, -1e308]), 0);
  for (const a of [[], [0, 0], [true, 0], [Infinity, 1], [1]])
    assert.throws(() => scaledCosine([1, 0], a));
  assert.deepEqual(
    [0.99, 0.995, 0.999].map((v) => replay(v).proposals.length),
    [5, 4, 1],
  );
  assert.equal(replay(0.995).rows[3].proposed, true);
  assert.equal(replay(0.999).recall, 0.25);
  assert.equal(replay(0.995).proposalRate, 4 / 7);
  assert.equal(replay(0.995).eligible, 5);
  assert.equal(highRestore.toFixed(5), '0.99995');
  for (let i = 0; i <= 1000; i++) {
    const r = replay(0.995 + (0.005 * i) / 1000, 1);
    if (r.good.length) assert(r.rows[4].proposed);
  }
  assert.equal(replay(1, 1).proposals.length, 0);
  assert.equal(replay(0.995, 1, true).proposals.length, 4);
  assert.equal(replay(0.995, 1, true, true).eligible, 0);
  assert.equal(prelookup(false, 'unknown'), 'Deny access');
  assert.equal(prelookup(true, 'live incident'), 'Bypass');
  assert.equal(recordGate(4600, NaN), 'Expired');
  assert.equal(recordGate(4599, NaN), 'Invalid score');
  assert.equal(recordGate(4599, 0.99), 'Propose');
  assert.equal(recordGate(4599, true), 'Invalid score');
  assert.throws(() => exactIdentity('UserID', ARTICLE_RECORD.scope, { tenant_id: 'other' }));
  assert.equal(
    new Set(['UserID', 'userid', 'User  ID', 'User ID'].map((v) => exactIdentity(v))).size,
    4,
  );
  assert.equal(readPolicy(), 'Hit');
  assert.equal(readPolicy({ reader: 8 }), 'Scope miss');
  assert.equal(readPolicy({ now: 200 }), 'Expired');
  assert.equal(readPolicy({ authorized: false }), 'Deny access');
  assert.deepEqual(
    writeCases.map((r) => admit(r)),
    [false, true, false, false],
  );
  assert.equal(admit(revision()), true);
  assert.equal(admit(revision(30, 8200)), false);
  assert.equal(admit(revision(), true), false);
  assert.equal(answerDigest(ARTICLE_RECORD).slice(0, 16), '217d4084c6c63a1e');
  for (const [n, s] of [
    [4, '51.01'],
    [5714, '99.93'],
    [300, '98.74'],
    [500, '99.24'],
  ])
    assert.equal((100 * wilsonLower(n, n)).toFixed(2), s);
  for (const [arr, expected] of [
    [reports, [true, false, false]],
    [variants, [true, false, false, false]],
  ])
    assert.deepEqual(
      arr.map((r) => reportDecision(r).decision.startsWith('promote')),
      expected,
    );
  for (let h = 0; h <= 6; h++) {
    const rows = tenReads(h),
      w = servingWindow(10, h, exampleLatency);
    assert.equal(rows.reduce((s, r) => s + r.ms, 0) / 10, w.mean);
    assert.equal(rows.filter((r) => r.ms === 1020).length, w.generations);
    assert.equal(rows[9].ms, w.p95);
    assert.equal(w.p95, allMisses.p95);
    assert.equal(w.p95 - freshOnly.p95, exampleLatency.lookupMs);
  }
  assert.deepEqual([freshOnly.p95, allMisses.p95], [1000, 1020]);
  assert.equal(generationCalls(callRoutes.semantic), 0);
  assert.equal(generationCalls(callRoutes.live), 1);
  assert.equal(callRoutes.live.filter((step) => step === 'Reuse KV').length, 2);
  assert.equal(tenReads(5, true)[5].ms, null);
  assert.equal(large.rank, 9500);
  assert.equal(large.mean, 448.6);
  assert.equal(large.saving.toFixed(3), '22.056');
  assert.equal(small.saving.toFixed(2), '-0.03');
  assert.equal(small.breakEven, 0.02);
  assert.equal(
    cohort.reduce((s, r) => s + r.calls, 0),
    3,
  );
  assert.equal(
    cohort.reduce((s, r) => s + r.scores, 0),
    0,
  );
}

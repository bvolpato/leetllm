import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  FOLLOW_UP,
  RECOVERY_QUERY,
  SUPPORT_PAGES,
  REQUIRED_RUNBOOKS,
  INCIDENTS,
  CORPUS,
  PROPOSALS,
  HYDE_PROXIES,
  CRITIQUE_BRANCHES,
  CRITIQUE_WEIGHTS,
  LATENCY_STAGES,
  LATENCY_TRACES,
  RELEASE_ROUTES,
} from '../../../films/query-expansion/fixtures.mjs';
import {
  terms,
  search,
  expandQueries,
  retrievalRun,
  reciprocalRankFusion,
  runbookCoverage,
  proxyEvidence,
  correctionPath,
  eligibleRoutes,
  lookupIncident,
  requestBudget,
} from '../../../films/query-expansion/model.mjs';
import {
  meanEmbedding,
  supportScore,
  nearestRank,
} from '../../../films/query-expansion/arithmetic.mjs';

export {
  FOLLOW_UP,
  RECOVERY_QUERY,
  SUPPORT_PAGES,
  REQUIRED_RUNBOOKS,
  INCIDENTS,
  PROPOSALS,
  HYDE_PROXIES,
  CRITIQUE_BRANCHES,
  CRITIQUE_WEIGHTS,
  LATENCY_STAGES,
  LATENCY_TRACES,
  RELEASE_ROUTES,
  correctionPath,
  eligibleRoutes,
  lookupIncident,
  requestBudget,
  terms,
  nearestRank,
};

export const run = retrievalRun();
export const shortName = {
  'burst-policy': 'Burst policy',
  'queue-guide': 'Queue guide',
  'capacity-guide': 'Capacity guide',
};
export const folio = { 'burst-policy': '12', 'queue-guide': '31', 'capacity-guide': '46' };
export const subject = 'API key';
export function pageMatches(query) {
  return SUPPORT_PAGES.map((page) =>
    [...terms(page.text)].filter((word) => terms(query).has(word)),
  );
}
export function proposalsThrough(count) {
  return expandQueries(run.queries[0], PROPOSALS.slice(0, count)).slice(1);
}
export const rankDenominator = (rank) => 60 + rank;
export function rankContributions(id, depth) {
  return run.rankings
    .map((list) => list.indexOf(id) + 1)
    .map((rank) => (rank && rank <= depth ? 1 / rankDenominator(rank) : 0));
}
export function retrievalAfter(count) {
  const returns = run.allRankings.slice(0, count);
  const ids = reciprocalRankFusion(returns)
    .slice(0, 3)
    .map((row) => row.id);
  return {
    returns,
    ids,
    coverage: runbookCoverage(ids),
    entries: returns.flat().length,
    budget: requestBudget(count),
  };
}
export const comparison = [
  ['Latency', '90 ms target', 'Within 24 h'],
  ['Job limit', '32 items', '500 items'],
  ['Retries', 'Use backoff', null],
];
export const report = { id: 'E1', endpoint: 'batch' };
export const retrySources = { batch: { id: 'B3', instruction: 'Retry failed items only' } };
export function incidentSearch(read, dispatch, returned) {
  const endpoint = read ? report.endpoint : null;
  const sent = Boolean(endpoint && dispatch);
  return { endpoint, sent, result: sent && returned ? retrySources[endpoint] : null };
}
export const permittedMatches = CORPUS.filter((p) => search('burst quota', [p]).length).map(
  (page) => ({
    page,
    hits: search('burst quota', [page])[0].score,
    allowed: page.tenant === 'support' && page.authorized,
  }),
);
export const trace = {
  id: 'R17',
  endpoint: 'E2',
  tier: 2,
  window: 60,
  unit: 'client',
  requests: 120,
  status: 429,
};
export const rule = { id: 'P4', endpoint: 'E2', tier: 2, window: 60, unit: 'client', limit: 100 };
export function overage(a, b) {
  return ['endpoint', 'tier', 'window', 'unit'].every((k) => a[k] === b[k])
    ? a.requests - b.limit
    : null;
}
export const mean = meanEmbedding(HYDE_PROXIES);
export const unitMean = mean.map((x) => x / Math.hypot(...mean));
export const driftRuns = [proxyEvidence(false), proxyEvidence(true)];
export const supportMass = [0.47, 0.02, 0.01];
export const familyMass = supportMass.reduce((a, b) => a + b);
export const support = supportScore(supportMass);
export const credits = [-1, -0.5, 0, 0.5, 1];
export const passages = [
  { id: 'E1.1', text: 'Temporary quota increases require approval.', score: 0.91 },
  { id: 'E1.2', text: 'Menu  /  Home  /  Contact', score: 0.08 },
  { id: 'E1.3', text: 'Keep exponential backoff enabled.', score: 0.85 },
  { id: 'E1.4', text: 'Storage retention is thirty days.', score: 0.2 },
];
export const stripThreshold = 0.6;
export const kept = passages.filter((row) => row.score >= stripThreshold);
export const contexts = [
  {
    tenant: 'A',
    grant: 'batch.read',
    policy: 'p7',
    history: 'My batch job failed.',
    query: 'How can I retry it?',
    technique: 'rewrite',
    generator: 'g2',
    prompt: 'r1',
    rewrite: 'Retry a failed batch job',
  },
  {
    tenant: 'B',
    grant: 'billing.read',
    policy: 'p8',
    history: 'My invoice export failed.',
    query: 'How can I retry it?',
    technique: 'rewrite',
    generator: 'g2',
    prompt: 'r1',
    rewrite: 'Retry a failed invoice export',
  },
];
export function historyDigest(c) {
  return createHash('sha256').update(c.history).digest('hex');
}
export function cacheKey(c, encoder = null) {
  return JSON.stringify([
    c.tenant,
    c.grant,
    c.policy,
    historyDigest(c),
    c.query,
    c.technique,
    c.generator,
    c.prompt,
    encoder,
  ]);
}
export const cache = new Map(contexts.map((c) => [cacheKey(c), c.rewrite]));
export function cacheHit(c, currentGrants) {
  return currentGrants.includes(c.grant) ? cache.get(cacheKey(c)) : undefined;
}
export function permitsEgress(scope, approved) {
  return scope === 'public' && approved;
}
export const cost = LATENCY_STAGES.reduce((total, stage) => total + stage.ms, 0);
export const tails = ['a', 'b', 'total'].map((k) => nearestRank(LATENCY_TRACES.map((t) => t[k])));
export const fan = { p: 0.95, paths: 3, deadline: 25 };
export const observedId = 'INC-48291';
export const proposedId = observedId.slice(0, -2) + observedId.at(-1) + observedId.at(-2);

export function check() {
  assert.deepEqual(
    [FOLLOW_UP, subject, RECOVERY_QUERY].map((q) => pageMatches(q).map((m) => m.length)),
    [
      [3, 0],
      [0, 2],
      [2, 6],
    ],
  );
  assert.deepEqual(
    [1, 2, 3, 4, 5].map((n) => proposalsThrough(n).length),
    [1, 1, 2, 3, 3],
  );
  assert.deepEqual(run.rankings, [
    ['burst-policy'],
    ['queue-guide'],
    ['capacity-guide', 'queue-guide'],
  ]);
  for (const row of run.fused)
    assert.ok(Math.abs(rankContributions(row.id, 2).reduce((a, b) => a + b) - row.score) < 1e-12);
  assert.deepEqual(
    [1, 2, 3, 4].map((n) => retrievalAfter(n).coverage.recall),
    [0, 0.5, 1, 1],
  );
  assert.equal(retrievalAfter(4).entries, 4);
  assert.equal(retrievalAfter(4).ids.length, 3);
  assert.equal(requestBudget(4).candidateCap, 12);
  assert.equal(requestBudget(5).admitted, false);
  assert.equal(comparison.flatMap((r) => r.slice(1)).filter(Boolean).length, 5);
  assert.equal(incidentSearch(false, true, true).sent, false);
  assert.equal(incidentSearch(true, false, true).result, null);
  assert.equal(incidentSearch(true, true, false).result, null);
  assert.equal(incidentSearch(true, true, true).result.id, 'B3');
  assert.deepEqual(
    permittedMatches.map((m) => [m.hits, m.allowed]),
    [
      [2, true],
      [2, false],
    ],
  );
  assert.equal(overage(trace, rule), 20);
  assert.equal(overage(trace, { ...rule, tier: 1 }), null);
  assert.deepEqual(
    mean.map((v) => v.toFixed(1)),
    ['0.3', '0.7', '0.3'],
  );
  assert.ok(Math.abs(Math.hypot(...unitMean) - 1) < 1e-12);
  assert.deepEqual(
    driftRuns.map((r) => r.hits.map((h) => h.document.id)),
    [
      ['quota-policy', 'batch-policy'],
      ['overview', 'batch-policy'],
    ],
  );
  assert.equal(support.toFixed(2), '0.96');
  assert.deepEqual(
    CRITIQUE_BRANCHES.map((b) => b.total.toFixed(3)),
    ['0.922', '0.534'],
  );
  assert.deepEqual(
    [0.81, 0.7, 0.45, 0.2, 0.17].map((x) => correctionPath(Math.max(x, 0.12))),
    ['internal', 'combined', 'combined', 'combined', 'external'],
  );
  assert.deepEqual(
    kept.map((p) => p.id),
    ['E1.1', 'E1.3'],
  );
  assert.notEqual(cacheKey(contexts[0]), cacheKey(contexts[1]));
  assert.notEqual(cacheKey(contexts[0], 'e1'), cacheKey(contexts[0], 'e2'));
  assert.equal(cacheHit(contexts[1], ['billing.read']), contexts[1].rewrite);
  assert.equal(cacheHit(contexts[1], []), undefined);
  assert.equal(permitsEgress('private', true), false);
  assert.equal(permitsEgress('public', true), true);
  assert.equal(cost, 395);
  assert.deepEqual(tails, [10, 10, 110]);
  assert.equal((fan.p ** fan.paths).toFixed(3), '0.857');
  assert.deepEqual(
    eligibleRoutes(350).map((r) => r.id),
    ['rewrite'],
  );
  assert.deepEqual(eligibleRoutes(300), []);
  assert.equal(lookupIncident(proposedId).closed, '09:18 UTC');
  assert.equal(lookupIncident(observedId).closed, '14:32 UTC');
}

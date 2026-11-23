import {
  CORPUS,
  INCIDENTS,
  PROPOSALS,
  PROXY_CORPUS,
  RELEASE_ROUTES,
  REQUIRED_RUNBOOKS,
  VARIANTS,
} from './fixtures.mjs';
export function proxyEvidence(drift = false) {
  const proposal = drift
    ? 'enable automatic replica scaling.'
    : 'request a temporary quota increase.';
  const proxy = 'For batch jobs, ' + proposal;
  const hits = search(proxy, PROXY_CORPUS, 2);
  return {
    proxy,
    proposal,
    hits,
    required: ['quota-policy', 'batch-policy'],
    recovered: hits.filter((h) => ['quota-policy', 'batch-policy'].includes(h.document.id)).length,
  };
}
export function correctionPath(best, lower = 0.2, upper = 0.7) {
  return best > upper ? 'internal' : best < lower ? 'external' : 'combined';
}
export function eligibleRoutes(latency = 350) {
  return RELEASE_ROUTES.filter((v) => v.accuracy >= 0.93 && v.p95 <= latency);
}
export function terms(text) {
  return new Set(text.toLowerCase().match(/[a-z0-9-]+/g) ?? []);
}
export function search(query, corpus = CORPUS, topK = 3) {
  const queryTerms = terms(query);
  return corpus
    .map((document) => ({
      document,
      score: [...terms(document.text)].filter((term) => queryTerms.has(term)).length,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.document.id.localeCompare(b.document.id))
    .slice(0, topK);
}
export function expandQueries(original, variants = VARIANTS, cap = 3) {
  const seen = new Set([original.toLowerCase().trim()]);
  const unique = [];
  for (const variant of variants) {
    if (unique.length >= cap) break;
    const key = variant.toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(variant.trim());
  }
  return [original, ...unique];
}
export function reciprocalRankFusion(rankings, rankConstant = 60) {
  if (!Number.isInteger(rankConstant) || rankConstant < 0) throw new Error('invalid rank constant');
  const scores = new Map();
  rankings.forEach((ranking) => {
    [...new Set(ranking)].forEach((id, index) =>
      scores.set(id, (scores.get(id) ?? 0) + 1 / (rankConstant + index + 1)),
    );
  });
  return [...scores.entries()]
    .map(([id, score]) => ({
      id,
      score,
    }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}
export function retrievalRun({ callerTenant = 'support', maxQueries = 3 } = {}) {
  const queries = expandQueries('peak demand handling', VARIANTS, maxQueries);
  const permitted = CORPUS.filter(
    (document) => document.tenant === callerTenant && document.authorized,
  );
  const allRankings = queries.map((query) =>
    search(query, permitted).map((hit) => hit.document.id),
  );
  const rankings = allRankings.slice(1);
  const fused = reciprocalRankFusion(allRankings);
  return {
    queries,
    allRankings,
    permittedIds: permitted.map((document) => document.id),
    rankings,
    fused,
    topIds: fused.slice(0, 3).map((item) => item.id),
  };
}
export function runbookCoverage(ids) {
  const found = REQUIRED_RUNBOOKS.filter((id) => ids.includes(id));
  return {
    found,
    hit: Number(found.length > 0),
    recall: found.length / REQUIRED_RUNBOOKS.length,
    complete: found.length === REQUIRED_RUNBOOKS.length,
  };
}
export function lookupIncident(id) {
  return INCIDENTS.find((record) => record.id === id);
}
export function decomposeDependencies() {
  return {
    parallel: {
      known: ['sync endpoint', 'batch endpoint'],
      queries: ['latency', 'limits', 'retry behavior'],
      canStartTogether: true,
    },
    sequential: {
      unknown: 'endpoint with highest error rate',
      next: 'its retry configuration',
      canStartTogether: false,
    },
  };
}
export function decompositionTrace(beat, p) {
  const progress = Math.max(0, Math.min(1, (p - 0.05) / 0.82)),
    facts = ['latency', 'limits', 'retries'];
  const requests = ['sync', 'batch'].flatMap((endpoint) =>
    facts.map((fact, i) => ({
      id: endpoint + '-' + fact,
      endpoint,
      fact,
      source: (endpoint === 'sync' ? 'S' : 'B') + (i + 1),
    })),
  );
  const count =
    beat === 0
      ? Math.min(6, Math.floor(progress * 7))
      : beat === 2
        ? Math.min(5, Math.floor(progress * 6))
        : 0;
  const receipts = requests.map((request, i) => ({
    ...request,
    arrived: i < count,
    missing: beat === 2 && i === 5,
  }));
  return {
    progress,
    receipts,
    arrived: receipts.filter((row) => row.arrived).length,
    endpointKnown: beat === 1 && progress >= 0.4,
    retryArrived: beat === 1 && progress >= 0.82,
  };
}
export function exactQueryRoute(query) {
  return /\b(?:[A-Z]{2,}-\d+|(?:HTTP|error)\s+[A-Z0-9-]+|\d{4}-\d{2}-\d{2})\b/i.test(query)
    ? 'exact-preserving'
    : 'conceptual-expansion';
}
export function requestBudget(queries, topK = 3) {
  const perQuery = 1;
  return {
    queries,
    perQuery,
    retrievalCalls: queries * perQuery,
    candidateCap: queries * topK,
    admitted: queries <= 4 && queries * perQuery <= 4,
  };
}
export function fusionTrace(beat, progress) {
  const run = retrievalRun(),
    count =
      beat < 1
        ? 0
        : beat > 1
          ? run.rankings.length
          : Math.min(run.rankings.length, Math.floor(Math.max(0, (progress - 0.05) / 0.7) * 4));
  const scores = reciprocalRankFusion(run.rankings.slice(0, count));
  const rows = [
    ...scores,
    ...run.fused
      .filter((row) => !scores.some((current) => current.id === row.id))
      .map((row) => ({
        ...row,
        score: 0,
      })),
  ];
  return {
    count,
    rows,
    rankings: run.rankings,
  };
}
export function rewriteSnapshot(beat, progress) {
  const seconds = Math.max(0, Math.min(1, progress)) * [7.798, 10.83, 12.382][beat];
  const chunks = ['How do I', 'revoke and rotate', 'a leaked API key?'];
  const count =
    beat === 0 ? 0 : beat > 1 ? 3 : [3.91, 4.29, 6.25].filter((at) => seconds >= at).length;
  const subjectReady = beat > 1 || (beat === 1 && seconds >= 2.74);
  return {
    seconds,
    count,
    subjectReady,
    chunks: chunks.slice(0, count),
    complete: count === 3,
    query: count === 3 ? chunks.join(' ') : null,
  };
}
export function recallSnapshot(beat, progress) {
  const seconds = Math.max(0, Math.min(1, progress)) * [11.35, 12.078, 12.358][beat],
    run = retrievalRun();
  const arrived =
    beat === 0 ? 0 : beat > 1 ? 3 : [0.9, 2.1, 7.42].filter((at) => seconds >= at).length;
  const fusedCount =
    beat === 0
      ? 0
      : beat > 1
        ? 3
        : Math.min(arrived, seconds < 3.84 ? 0 : seconds < 5.15 ? 1 : seconds < 7.42 ? 2 : 3);
  const fused = reciprocalRankFusion(run.rankings.slice(0, fusedCount)),
    topIds = fused.slice(0, 3).map((item) => item.id),
    required = ['burst-policy', 'queue-guide'];
  return {
    seconds,
    arrived,
    fusedCount,
    rankings: run.rankings,
    topIds,
    recovered: required.filter((id) => topIds.includes(id)).length,
  };
}
export function variantConstruction(beat, progress) {
  const seconds = Math.max(0, Math.min(1, progress)) * [8.806, 10.422, 11.038][beat];
  const seen = new Set(),
    accepted = [];
  const starts = [2.05, 3.05, 3.95, 4.65, 5.6],
    ends = [2.75, 3.75, 4.55, 5.25, 6.3];
  const rows = PROPOSALS.map((text, index) => {
    const key = text.toLowerCase().trim(),
      duplicate = seen.has(key),
      capped = !duplicate && accepted.length >= 3;
    const slot = accepted.length;
    if (!duplicate && !capped) {
      seen.add(key);
      accepted.push(text.trim());
    }
    const move =
      beat < 2
        ? 0
        : Math.max(0, Math.min(1, (seconds - starts[index]) / (ends[index] - starts[index])));
    const visible =
      beat === 0 ? false : beat === 1 ? seconds >= [0.9, 2.0, 3.1, 4.2, 5.3][index] : true;
    return {
      id: 'proposal-' + index,
      text: text.trim(),
      slot,
      duplicate,
      capped,
      move,
      visible,
      decision:
        move === 1 ? (duplicate ? 'duplicate' : capped ? 'cap reached' : 'accepted') : 'pending',
    };
  });
  return {
    seconds,
    rows,
    original: 'peak demand handling',
    accepted: rows.filter((row) => row.decision === 'accepted').map((row) => row.text),
  };
}
export function accessConstruction(beat, progress) {
  const seconds = Math.max(0, Math.min(1, progress)) * [8.446, 10.278, 11.686][beat],
    query = 'burst quota';
  const rows = CORPUS.map((document) => ({
    id: document.id,
    tenant: document.tenant,
    score: search(query, [document])[0]?.score ?? 0,
    eligible: document.tenant === 'support' && document.authorized,
  }));
  const matchesReady = beat > 1 || (beat === 1 && seconds >= 2.7),
    filtered = beat > 1 || (beat === 1 && seconds >= 5.2),
    ranked = beat > 1 || (beat === 1 && seconds >= 6.8);
  return {
    seconds,
    query,
    rows,
    matchesReady,
    filtered,
    ranked,
    rechecked: beat === 2 && seconds >= 9.2,
    rankedRows: ranked
      ? rows.filter((row) => row.eligible && row.score > 0).sort((a, b) => b.score - a.score)
      : [],
  };
}
export function budgetConstruction(beat, progress) {
  const seconds = Math.max(0, Math.min(1, progress)) * [11.854, 11.646, 10.198][beat],
    queries = retrievalRun().queries;
  const calls =
    beat < 1 ? 1 : beat > 1 ? 4 : [0.35, 1, 1.65, 2.3].filter((at) => seconds >= at).length;
  return {
    seconds,
    queries,
    calls,
    candidates: beat === 0 ? 3 : calls * 3,
    exactReady: beat > 0 || seconds >= 2.9,
    paraphraseRejected: beat === 0 && seconds >= 7.75,
    generationConsidered: beat > 1 || (beat === 1 && seconds >= 4.3),
    extraRejected: beat === 2 && seconds >= 7.2,
    admitted: requestBudget(calls).admitted,
  };
}

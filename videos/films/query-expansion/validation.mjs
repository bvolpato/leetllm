import { nearestRank, supportScore } from './arithmetic.mjs';
import {
  CRITIQUE_BRANCHES,
  FOLLOW_UP,
  HYDE_MEAN,
  LATENCY_STAGES,
  LATENCY_TRACES,
  RECOVERY_QUERY,
  SUPPORT_PAGES,
  VARIANTS,
} from './fixtures.mjs';
import {
  accessConstruction,
  budgetConstruction,
  correctionPath,
  decomposeDependencies,
  decompositionTrace,
  eligibleRoutes,
  exactQueryRoute,
  expandQueries,
  fusionTrace,
  lookupIncident,
  proxyEvidence,
  recallSnapshot,
  reciprocalRankFusion,
  requestBudget,
  retrievalRun,
  rewriteSnapshot,
  runbookCoverage,
  search,
  variantConstruction,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  const pageScores = (query) => SUPPORT_PAGES.map((page) => search(query, [page])[0]?.score ?? 0);
  assert.deepEqual(pageScores(FOLLOW_UP), [3, 0]);
  assert.deepEqual(pageScores(RECOVERY_QUERY), [2, 6]);
  assert.equal(lookupIncident('INC-48219').closed, '09:18 UTC');
  assert.equal(lookupIncident('INC-48291').closed, '14:32 UTC');
  assert.equal(lookupIncident('INC-482'), undefined);
  HYDE_MEAN.forEach((v, i) => assert(Math.abs(v - [0.3, 0.7, 0.3][i]) < 1e-12));
  assert.equal(proxyEvidence().recovered, 2);
  assert.equal(proxyEvidence(true).recovered, 1);
  assert(Math.abs(supportScore([0.47, 0.02, 0.01]) - 0.96) < 1e-12);
  assert.deepEqual(
    CRITIQUE_BRANCHES.map((v) => +v.total.toFixed(3)),
    [0.922, 0.534],
  );
  assert.deepEqual(
    [0.81, 0.45, 0.17, 0.7, 0.2].map((v) => correctionPath(v)),
    ['internal', 'combined', 'external', 'combined', 'combined'],
  );
  assert.equal(
    LATENCY_STAGES.reduce((sum, v) => sum + v.ms, 0),
    395,
  );
  assert.equal(nearestRank(LATENCY_TRACES.map((v) => v.a)), 10);
  assert.equal(nearestRank(LATENCY_TRACES.map((v) => v.b)), 10);
  assert.equal(nearestRank(LATENCY_TRACES.map((v) => v.total)), 110);
  assert.deepEqual(
    eligibleRoutes().map((v) => v.id),
    ['rewrite'],
  );
  assert.deepEqual(eligibleRoutes(300), []);
  assert.equal(fusionTrace(0, 0.9).count, 0);
  assert.deepEqual(
    fusionTrace(1, 0.3)
      .rows.filter((row) => row.score)
      .map((row) => row.id),
    ['burst-policy'],
  );
  assert.deepEqual(fusionTrace(2, 0).rows, retrievalRun().fused);
  const run = retrievalRun();
  assert.deepEqual(run.allRankings, [
    [],
    ['burst-policy'],
    ['queue-guide'],
    ['capacity-guide', 'queue-guide'],
  ]);
  assert.deepEqual(runbookCoverage(run.allRankings[1]), {
    found: ['burst-policy'],
    hit: 1,
    recall: 0.5,
    complete: false,
  });
  assert.deepEqual(run.topIds, ['queue-guide', 'burst-policy', 'capacity-guide']);
  assert.equal(run.fused[0].score, 1 / 61 + 1 / 62);
  assert.equal(runbookCoverage(run.topIds).complete, true);
  assert.equal(run.allRankings.flat().length, 4);
  assert.equal(new Set(run.allRankings.flat()).size, 3);
  assert.equal(requestBudget(run.queries.length).candidateCap, 12);
  assert.equal(search('peak demand handling').length, 0);
  assert.deepEqual(run.queries, ['peak demand handling', ...VARIANTS]);
  assert(!run.permittedIds.includes('restricted-ops'));
  assert(run.topIds.includes('burst-policy') && run.topIds.includes('queue-guide'));
  assert.equal(
    reciprocalRankFusion([
      ['a', 'b'],
      ['b', 'a'],
    ])[0].id,
    'a',
  );
  assert.deepEqual(expandQueries('same', [' SAME ', 'burst quota', 'burst quota'], 3), [
    'same',
    'burst quota',
  ]);
  const deps = decomposeDependencies();
  assert.equal(deps.parallel.canStartTogether, true);
  assert.equal(deps.sequential.canStartTogether, false);
  assert.equal(decompositionTrace(0, 1).arrived, 6);
  assert.equal(decompositionTrace(2, 1).arrived, 5);
  assert.equal(decompositionTrace(2, 1).receipts[5].missing, true);
  assert.equal(decompositionTrace(1, 0.3).endpointKnown, false);
  assert.equal(decompositionTrace(1, 0.8).endpointKnown, true);
  assert.equal(decompositionTrace(1, 0.8).retryArrived, true);
  assert.equal(exactQueryRoute('What happened in incident INC-48291?'), 'exact-preserving');
  assert.equal(exactQueryRoute('How should we plan capacity?'), 'conceptual-expansion');
  assert.equal(requestBudget(3).admitted, true);
  assert.equal(requestBudget(5).admitted, false);
  assert.equal(rewriteSnapshot(0, 1).query, null);
  assert.equal(rewriteSnapshot(1, 2.5 / 10.83).subjectReady, false);
  assert.equal(rewriteSnapshot(1, 3 / 10.83).subjectReady, true);
  assert.equal(rewriteSnapshot(1, 7 / 10.83).query, 'How do I revoke and rotate a leaked API key?');
  assert.deepEqual(recallSnapshot(0, 1).topIds, []);
  assert.equal(recallSnapshot(0, 1).recovered, 0);
  assert.equal(recallSnapshot(1, 4 / 12.078).recovered, 1);
  assert.equal(recallSnapshot(1, 6.5 / 12.078).recovered, 2);
  assert.deepEqual(recallSnapshot(1, 1).topIds, retrievalRun().topIds);
  assert.deepEqual(variantConstruction(2, 1).accepted, VARIANTS);
  assert.equal(variantConstruction(2, 1).rows[1].decision, 'duplicate');
  assert.equal(variantConstruction(2, 1).rows[4].decision, 'cap reached');
  assert.equal(variantConstruction(1, 0).rows.filter((row) => row.visible).length, 0);
  const access = accessConstruction(1, 1);
  assert.equal(access.rows.find((row) => row.id === 'restricted-ops').score, 2);
  assert.deepEqual(
    access.rankedRows.map((row) => row.id),
    ['burst-policy'],
  );
  assert.equal(accessConstruction(1, 4 / 10.278).filtered, false);
  assert.equal(accessConstruction(1, 6 / 10.278).filtered, true);
  assert.deepEqual(budgetConstruction(1, 1).queries, retrievalRun().queries);
  assert.equal(budgetConstruction(1, 1).calls, 4);
  assert.equal(budgetConstruction(1, 1).candidates, 12);
  assert.equal(requestBudget(5).admitted, false);
}

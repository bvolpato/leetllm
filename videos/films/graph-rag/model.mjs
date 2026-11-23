import { cueProgress, stageCount, unit } from './arithmetic.mjs';
import {
  BOOK_ENTRIES,
  BOOK_TOPICS,
  CLUSTER_EDGES,
  COMMUNITY_BEAT_SECONDS,
  COMMUNITY_CUE,
  CONTEXT_CANDIDATES,
  EDGES,
  RECORDS,
  REVIEWED_SUPPORT,
} from './fixtures.mjs';
import { incidentSelection, lexicalRows } from './incident-example.mjs';
import assert from 'node:assert/strict';
export function walk(start, edges = EDGES, records = RECORDS) {
  const reached = new Set([start]),
    sources = new Set(),
    queue = [start];
  while (queue.length) {
    const id = queue.shift();
    for (const edge of edges.filter((e) => e.from === id)) {
      const source = records[edge.source];
      if (!source?.allowed || source.version !== source.currentVersion) continue;
      sources.add(edge.source);
      if (!reached.has(edge.to)) {
        reached.add(edge.to);
        queue.push(edge.to);
      }
    }
  }
  return {
    reached: [...reached],
    sources: [...sources],
  };
}
export function entails(edge) {
  const source = RECORDS[edge.source];
  return REVIEWED_SUPPORT.some(
    (label) =>
      label.from === edge.from &&
      label.to === edge.to &&
      label.relation === edge.relation &&
      label.source === edge.source &&
      label.version === source?.version &&
      label.text === source?.text,
  );
}
export function evidenceTrace(beat, progress) {
  const seconds = progress * 13.342,
    phase = (a, b) => Math.max(0, Math.min(1, (seconds - a) / (b - a))),
    hops = beat > 0 ? [1, 1] : [phase(1.375, 3.2), phase(3.4625, 5.65)];
  return {
    hops,
    sources: walk('person:lena').sources.filter((_, i) => hops[i] === 1),
  };
}
export function communitySnapshot(beat, progress) {
  if (beat < 1)
    return {
      reportProgress: 0,
      reportCount: 0,
      batchProgress: 0,
      batchCount: 0,
      activeBatch: -1,
      partialProgress: 0,
      partialCount: 0,
      combineProgress: 0,
      combineCount: 0,
    };
  if (beat > 1)
    return {
      reportProgress: 1,
      reportCount: 3,
      batchProgress: 1,
      batchCount: 3,
      activeBatch: -1,
      partialProgress: 1,
      partialCount: 3,
      combineProgress: 1,
      combineCount: 3,
    };
  const seconds = unit(progress) * COMMUNITY_BEAT_SECONDS;
  const batchProgress = cueProgress(seconds, COMMUNITY_CUE.batchesStart, COMMUNITY_CUE.batchesEnd);
  const partialProgress = cueProgress(
    seconds,
    COMMUNITY_CUE.partialsStart,
    COMMUNITY_CUE.partialsEnd,
  );
  const combineProgress = cueProgress(
    seconds,
    COMMUNITY_CUE.combineStart,
    COMMUNITY_CUE.combineEnd,
  );
  return {
    reportProgress: cueProgress(seconds, COMMUNITY_CUE.reportsStart, COMMUNITY_CUE.reportsEnd),
    reportCount: stageCount(
      cueProgress(seconds, COMMUNITY_CUE.reportsStart, COMMUNITY_CUE.reportsEnd),
    ),
    batchProgress,
    batchCount: stageCount(batchProgress),
    activeBatch: batchProgress > 0 && batchProgress < 1 ? Math.floor(batchProgress * 3) : -1,
    partialProgress,
    partialCount: stageCount(partialProgress),
    combineProgress,
    combineCount: stageCount(combineProgress),
  };
}
export function tripleConstructionState(beat, progress) {
  const seconds = progress * [16.39, 15.246, 17.278][beat],
    ramp = (a, z) => unit((seconds - a) / (z - a));
  const nodes =
    beat > 0 ? 3 : seconds < 2.1875 ? 0 : seconds < 3.0875 ? 1 : seconds < 3.825 ? 2 : 3;
  const hops = beat > 0 ? [1, 1] : [ramp(8.7625, 9.975), ramp(10.35, 12.3)];
  const reverse =
    (beat === 0 && seconds >= 13.9375) || (beat === 2 && seconds >= 8.9375 && seconds < 9.9875);
  const omitted = beat === 2 && seconds >= 7.3875 && seconds < 8.9375,
    owns = beat === 2 && seconds >= 9.9875;
  return {
    seconds,
    nodes,
    hops,
    reverse,
    omitted,
    owns,
    receipts: beat > 0 ? [ramp(3.1375, 5.1), ramp(5.3625, 7.05)] : [0, 0],
  };
}
export function identityResolutionState(beat, progress) {
  const seconds = progress * [14.758, 15.798, 18.502][beat],
    ramp = (a, z) => unit((seconds - a) / (z - a));
  return {
    seconds,
    aliasesVisible: beat > 0,
    first: beat > 1 ? 1 : beat === 1 ? ramp(1.8375, 3.25) : 0,
    second: beat > 1 ? 1 : beat === 1 ? ramp(3.25, 5.1) : 0,
    parkVisible: beat > 1 || (beat === 1 && seconds >= 5.625),
    parkSeparate: beat > 1 || (beat === 1 && seconds >= 10.3),
  };
}
export function supportChallengeState(beat, progress) {
  const seconds = progress * [14.998, 16.59, 19.318][beat],
    claim = beat > 0 || seconds >= 5.0625 ? 'owns' : 'wrote',
    edge = {
      ...EDGES[0],
      relation: claim,
    };
  return {
    seconds,
    claim,
    sourceExists: !!RECORDS[edge.source],
    identity: true,
    supported: entails(edge),
    supportVisible: beat > 1 || (beat === 1 && seconds >= 3.7),
    reviewedCases: beat === 2 && seconds >= 3.1,
  };
}
export function sourceRefreshState(progress) {
  const seconds = progress * 17.214,
    corrected = seconds >= 3.625,
    invalidated = seconds >= 7.8,
    regenerated = seconds >= 10.3;
  const currentVersion = corrected ? 2 : 1,
    record = {
      ...RECORDS.publisher,
      currentVersion,
    },
    eligible = record.version === currentVersion;
  return {
    seconds,
    corrected,
    invalidated,
    regenerated,
    record,
    eligible,
    currentPublisher: corrected ? 'Juniper Press' : 'Willow Press',
    edgePublisher: regenerated ? 'Juniper Press' : 'Willow Press',
    edgeVersion: regenerated ? 2 : 1,
    reportVersion: regenerated ? 2 : 1,
    reportAdmitted: !corrected || regenerated,
    otherReportVersion: 1,
  };
}
export function validateModel() {
  graphUpgradeModel();
  assert.deepEqual(
    lexicalRows.map((row) => row.matches.length),
    [2, 0, 3],
  );
  const notes = (options) => [...incidentSelection(options)].sort((a, b) => a - b);
  assert.deepEqual(notes({ hops: 1 }), [1842, 3155]);
  assert.deepEqual(notes({ hops: 2 }), [1842, 2031, 3155]);
  assert.deepEqual(notes({ hops: 1, changedClaim: true }), [1842, 2031, 3155]);
  assert.deepEqual(notes({ hops: 1, changedClaim: true, readPolicy: false }), [1842, 3155]);
  assert.deepEqual(topicCounts(BOOK_ENTRIES.slice(0, 5)), { books: 4, counts: [2, 1, 1] });
  assert.deepEqual(topicCounts(BOOK_ENTRIES), { books: 5, counts: [2, 2, 1] });
  assert.equal(tripleConstructionState(0, 1).nodes, 3);
  assert.deepEqual(tripleConstructionState(0, 1).hops, [1, 1]);
  assert.equal(tripleConstructionState(0, 1).reverse, true);
  assert.equal(identityResolutionState(1, 1).second, 1);
  assert.equal(identityResolutionState(1, 1).parkSeparate, true);
  assert.equal(supportChallengeState(0, 1).supported, false);
  assert.equal(supportChallengeState(1, 1).supportVisible, true);
  assert.equal(sourceRefreshState(4 / 17.214).reportAdmitted, false);
  assert.equal(sourceRefreshState(10.5 / 17.214).reportVersion, 2);
  assert.equal(sourceRefreshState(1).otherReportVersion, 1);
  assert.deepEqual(evidenceTrace(0, 2 / 13.342).sources, []);
  assert.deepEqual(evidenceTrace(0, 4 / 13.342).sources, ['author']);
  assert.deepEqual(evidenceTrace(0, 6 / 13.342).sources, ['author', 'publisher']);
  assert.deepEqual(evidenceTrace(1, 0).hops, [1, 1]);
  assert.deepEqual(walk('person:lena').sources, ['author', 'publisher']);
  assert(walk('person:lena').reached.includes('publisher:willow'));
  assert.equal(walk('person:lena', EDGES.slice(0, 1)).sources.length, 1);
  const falseEdge = {
    ...EDGES[0],
    relation: 'owns',
  };
  assert(RECORDS[falseEdge.source]);
  assert.equal(entails(falseEdge), false);
  assert(EDGES.every(entails));
  assert.deepEqual(
    walk('person:lena', EDGES, {
      ...RECORDS,
      publisher: {
        ...RECORDS.publisher,
        currentVersion: 2,
      },
    }).sources,
    ['author'],
  );
  assert.notEqual('book:river', 'place:river');
  const themes = ['garden', 'garden', 'travel', 'cooking'];
  assert.equal(themes.filter((t) => t === 'garden').length, 2);
  assert.equal([true, false].every(Boolean), false);
  const beforeReports = communitySnapshot(
      1,
      (COMMUNITY_CUE.reportsStart - 0.001) / COMMUNITY_BEAT_SECONDS,
    ),
    reportMiddle = communitySnapshot(1, 6.0 / COMMUNITY_BEAT_SECONDS),
    atReportsEnd = communitySnapshot(1, COMMUNITY_CUE.reportsEnd / COMMUNITY_BEAT_SECONDS),
    beforeBatches = communitySnapshot(
      1,
      (COMMUNITY_CUE.batchesStart - 0.001) / COMMUNITY_BEAT_SECONDS,
    ),
    batchMiddle = communitySnapshot(1, 8.8 / COMMUNITY_BEAT_SECONDS),
    atBatchesEnd = communitySnapshot(1, COMMUNITY_CUE.batchesEnd / COMMUNITY_BEAT_SECONDS),
    beforePartials = communitySnapshot(
      1,
      (COMMUNITY_CUE.partialsStart - 0.001) / COMMUNITY_BEAT_SECONDS,
    ),
    partialMiddle = communitySnapshot(1, 11.1 / COMMUNITY_BEAT_SECONDS),
    atPartialsEnd = communitySnapshot(1, COMMUNITY_CUE.partialsEnd / COMMUNITY_BEAT_SECONDS),
    beforeCombine = communitySnapshot(
      1,
      (COMMUNITY_CUE.combineStart - 0.001) / COMMUNITY_BEAT_SECONDS,
    ),
    combineMiddle = communitySnapshot(1, 13.05 / COMMUNITY_BEAT_SECONDS),
    atCombineEnd = communitySnapshot(1, COMMUNITY_CUE.combineEnd / COMMUNITY_BEAT_SECONDS),
    held = communitySnapshot(2, 0);
  assert.equal(beforeReports.reportCount, 0);
  assert.ok(reportMiddle.reportCount > 0 && reportMiddle.reportCount < 3);
  assert.equal(atReportsEnd.reportCount, 3);
  assert.equal(beforeBatches.batchCount, 0);
  assert.ok(batchMiddle.batchCount > 0 && batchMiddle.batchCount < 3);
  assert.equal(atBatchesEnd.batchCount, 3);
  assert.equal(beforePartials.reportProgress, 1);
  assert.equal(beforePartials.partialProgress, 0);
  assert.equal(beforePartials.partialCount, 0);
  assert.equal(beforePartials.combineProgress, 0);
  assert.ok(partialMiddle.partialProgress > 0 && partialMiddle.partialProgress < 1);
  assert.equal(partialMiddle.partialCount, 2);
  assert.equal(partialMiddle.combineProgress, 0);
  assert.equal(atPartialsEnd.partialProgress, 1);
  assert.equal(atPartialsEnd.partialCount, 3);
  assert.equal(atPartialsEnd.combineProgress, 0);
  assert.equal(beforeCombine.partialProgress, 1);
  assert.equal(beforeCombine.combineProgress, 0);
  assert.equal(beforeCombine.combineCount, 0);
  assert.ok(combineMiddle.combineProgress > 0 && combineMiddle.combineProgress < 1);
  assert.equal(combineMiddle.combineCount, 2);
  assert.deepEqual(atCombineEnd, {
    reportProgress: 1,
    reportCount: 3,
    batchProgress: 1,
    batchCount: 3,
    activeBatch: -1,
    partialProgress: 1,
    partialCount: 3,
    combineProgress: 1,
    combineCount: 3,
  });
  assert.deepEqual(held, {
    reportProgress: 1,
    reportCount: 3,
    batchProgress: 1,
    batchCount: 3,
    activeBatch: -1,
    partialProgress: 1,
    partialCount: 3,
    combineProgress: 1,
    combineCount: 3,
  });
  for (let step = 0; step <= 100; step++) {
    const current = communitySnapshot(1, step / 100),
      previous = communitySnapshot(1, Math.max(0, (step - 1) / 100));
    assert.ok(current.reportProgress >= previous.reportProgress);
    assert.ok(current.reportCount >= previous.reportCount);
    assert.ok(current.batchProgress >= previous.batchProgress);
    assert.ok(current.batchCount >= previous.batchCount);
    assert.ok(current.partialProgress >= previous.partialProgress);
    assert.ok(current.partialCount >= previous.partialCount);
    assert.ok(current.combineProgress >= previous.combineProgress);
    assert.ok(current.combineCount >= previous.combineCount);
    if (step / 100 < COMMUNITY_CUE.partialsStart / COMMUNITY_BEAT_SECONDS)
      assert.equal(current.partialProgress, 0);
    if (step / 100 < COMMUNITY_CUE.combineStart / COMMUNITY_BEAT_SECONDS)
      assert.equal(current.combineProgress, 0);
  }
}
export function topicCounts(rows) {
  const books = new Map(rows);
  const topics = [...books.values()];
  return {
    books: books.size,
    counts: BOOK_TOPICS.map((topic) => topics.filter((label) => label === topic).length),
  };
}
export function modularityTerms(groups, edges) {
  const degree = new Map();
  for (const [a, b] of edges) {
    degree.set(a, (degree.get(a) ?? 0) + 1);
    degree.set(b, (degree.get(b) ?? 0) + 1);
  }
  const m = edges.length;
  return groups.map((group) => {
    const set = new Set(group),
      internal = edges.filter(([a, b]) => set.has(a) && set.has(b)).length,
      k = group.reduce((n, id) => n + (degree.get(id) ?? 0), 0);
    return {
      internal,
      degreeSum: k,
      observed: internal / m,
      nullTerm: (k / (2 * m)) ** 2,
      contribution: internal / m - (k / (2 * m)) ** 2,
    };
  });
}
export function packContext(candidates, budget) {
  let used = 0;
  const accepted = [],
    rejected = [];
  for (const item of candidates) {
    if (used + item.tokens <= budget) {
      accepted.push(item.id);
      used += item.tokens;
    } else rejected.push(item.id);
  }
  return {
    accepted,
    rejected,
    used,
    remaining: budget - used,
  };
}
export function dynamicTree(serving = 0.9) {
  const scores = {
      Serving: serving,
      Cache: 0.8,
      Queue: 0.7,
      Eval: 0.1,
    },
    children = {
      Serving: ['Cache', 'Queue'],
      Eval: ['Metric'],
    },
    visited = [],
    selected = [];
  function visit(id) {
    visited.push(id);
    if (scores[id] < 0.5) return;
    if (children[id]) for (const c of children[id]) visit(c);
    else selected.push(id);
  }
  visit('Serving');
  visit('Eval');
  return {
    scores,
    visited,
    selected,
  };
}
export function blockedDescendants(changed, dependencies) {
  const blocked = new Set(changed);
  let more = true;
  while (more) {
    more = false;
    for (const [artifact, sources] of Object.entries(dependencies))
      if (!blocked.has(artifact) && sources.some((s) => blocked.has(s))) {
        blocked.add(artifact);
        more = true;
      }
  }
  return [...blocked];
}
export function reportAudience(audiences) {
  return audiences.length
    ? audiences[0].filter((id) => audiences.every((a) => a.includes(id)))
    : [];
}
export function workloadCost(queries) {
  return {
    deferred: 1 + 1.7 * queries,
    precomputed: 200 + 0.8 * queries,
    crossover: 199 / 0.9,
  };
}
export function graphUpgradeModel() {
  const terms = modularityTerms(
    [
      ['A', 'B', 'C', 'D'],
      ['E', 'F'],
    ],
    CLUSTER_EDGES,
  );
  assert.deepEqual(
    terms.map((t) => [t.internal, t.degreeSum]),
    [
      [5, 10],
      [1, 2],
    ],
  );
  assert.ok(Math.abs(terms.reduce((n, t) => n + t.contribution, 0) - 5 / 18) < 1e-12);
  assert.equal(modularityTerms([['A', 'B', 'C', 'D', 'E', 'F']], CLUSTER_EDGES)[0].contribution, 0);
  assert.deepEqual(packContext(CONTEXT_CANDIDATES, 90), {
    accepted: ['relation', 'text'],
    rejected: ['report'],
    used: 85,
    remaining: 5,
  });
  assert.deepEqual(dynamicTree().selected, ['Cache', 'Queue']);
  assert.deepEqual(dynamicTree(0.2).visited, ['Serving', 'Eval']);
  assert.deepEqual(
    blockedDescendants(['B-v1'], {
      edge: ['B-v1'],
      child: ['edge'],
      parent: ['child'],
      travel: ['T-v1'],
    }),
    ['B-v1', 'edge', 'child', 'parent'],
  );
  assert.deepEqual(reportAudience([['staff', 'security'], ['security']]), ['security']);
  assert.deepEqual(workloadCost(10), {
    deferred: 18,
    precomputed: 208,
    crossover: 199 / 0.9,
  });
  assert.equal(workloadCost(500).precomputed, 600);
  return true;
}

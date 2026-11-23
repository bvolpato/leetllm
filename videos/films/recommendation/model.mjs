import { clickExamples, documents, itemVectors, queryVector } from './fixtures.mjs';
import {
  correctedRate,
  dcg,
  dot,
  localMetricsRevealFor,
  metricSwapState,
  rankNetStep,
  rankScore,
  recallLimitFor,
  sourceIdentity,
} from './arithmetic.mjs';
import {
  candidateRecall,
  constrained,
  eligible,
  idealGrades,
  localTopThreeNdcg,
  ndcg,
  ranked,
  retrievalOrder,
  systemTopThreeNdcg,
} from './construction.mjs';
import assert from 'node:assert/strict';
export const rankingStateFor = () => {
  const grades = retrievalOrder.map((item) => item.relevance);
  const observedDcg = dcg(grades);
  const idealDcg = dcg(idealGrades.slice(0, grades.length));
  return {
    grades,
    dcg: observedDcg,
    idcg: idealDcg,
    ndcg: observedDcg / idealDcg,
  };
};
export function twoTowerConstructionFor(beat, beatProgress, cues = {}) {
  const bound = (value) => Math.max(0, Math.min(1, value));
  const progress = (id, from, until) => {
    const cue = cues[id];
    return cue
      ? cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : bound(cue.progress)
      : beat < 1
        ? 0
        : beat > 1
          ? 1
          : bound((beatProgress - from) / (until - from));
  };
  const construction = (values, amount) => {
    const x = bound(amount * 2),
      y = bound(amount * 2 - 1);
    return {
      progress: amount,
      complete: amount === 1,
      values: [...values],
      point: [values[0] * x, values[1] * y],
      base: [values[0] * x, 0],
    };
  };
  const projection = progress('tower-projection', 0.76, 0.98);
  return {
    query: construction(queryVector, progress('tower-query-components', 0.08, 0.23)),
    items: itemVectors.map((item, i) => ({
      id: ['api-guide', 'retry-runbook', 'blog-post'][i],
      ...construction(
        item.vector,
        progress(
          ['tower-guide-components', 'tower-runbook-components', 'tower-blog-components'][i],
          [0.27, 0.45, 0.61][i],
          [0.43, 0.59, 0.75][i],
        ),
      ),
      score: dot(queryVector, item.vector),
      projection: bound(projection * 3 - i),
      resultKnown: projection === 1,
    })),
    projection,
    complete: projection === 1,
  };
}
export function eligibilityShown(beat, progress) {
  if (beat > 0) return documents.length;
  const elapsed = Math.max(0, Math.min(1, progress)) * 14.278;
  if (elapsed >= 7.75) return 7;
  if (elapsed >= 3.9) return 6;
  return elapsed >= 1.9 ? 5 : 0;
}
export function eligibilityStateFor(beat, progress, cues = {}) {
  const clamp = (value) => Math.max(0, Math.min(1, value));
  const ease = (value) => {
    const q = clamp(value);
    return q * q * (3 - 2 * q);
  };
  const cue = cues['eligibility-filter-out'];
  // The validation-only fallback uses the delivered opening beat's measured speech and hold.
  const filtering = cue
    ? cue.phase === 'before'
      ? 0
      : cue.phase === 'after'
        ? 1
        : clamp(cue.progress)
    : beat > 0
      ? 1
      : clamp((progress * 14.278 - 10.5375) / (13.35 - 10.5375));
  const shown = eligibilityShown(beat, progress);
  const known = (id, fallback) => (cues[id] ? cues[id].phase !== 'before' : fallback);
  const actors = documents.map((item, index) => {
    const allowed = item.current && item.permitted;
    const exitIndex = item.id === 'private-draft' ? 0 : 1;
    const move = allowed ? 0 : ease((filtering - (0.08 + exitIndex * 0.44)) / 0.44);
    const across = ease(move / 0.7),
      settle = ease((move - 0.7) / 0.3);
    const x = 140 + 1170 * across;
    const y = 350 + index * 76 + (650 + exitIndex * 150 - (350 + index * 76)) * settle;
    const statusKnown =
      beat > 0 ||
      (allowed
        ? known('eligibility-beat-1-focus-2', shown >= 5)
        : item.permitted
          ? shown >= 7
          : known('eligibility-beat-1-focus-1', shown >= 6));
    return {
      ...item,
      allowed,
      statusKnown,
      x,
      y,
      width: 1050 - 600 * across,
      height: 62,
      move,
      exited: !allowed && x >= 1240,
    };
  });
  const excluded = actors.filter((item) => item.exited);
  return {
    actors,
    excludedIds: excluded.map((item) => item.id),
    remaining: documents.length - excluded.length,
    filtering,
    complete: excluded.length === documents.length - eligible.length,
  };
}
export function rerankActors(beat, progress) {
  const ease = (p) => {
    const q = Math.max(0, Math.min(1, p));
    return q * q * (3 - 2 * q);
  };
  return retrievalOrder.map((item, index) => {
    const rank = ranked.findIndex((candidate) => candidate.id === item.id);
    const q =
      beat < 1
        ? 0
        : beat > 1
          ? 1
          : Math.max(0, Math.min(1, (progress - (0.06 + rank * 0.14)) / 0.12));
    const fromY = 350 + index * 105,
      toY = 350 + rank * 105;
    const cx = q < 0.3 ? 330 + 630 * ease(q / 0.3) : 960 + 540 * ease((q - 0.7) / 0.3);
    const cy = fromY + (toY - fromY) * ease((q - 0.3) / 0.4);
    return {
      ...item,
      rank,
      q,
      cx,
      cy,
    };
  });
}
export function judgedListState(resultIds, { revoked = [], cutoff = 3 } = {}) {
  const denied = new Set(revoked),
    universe = documents.filter((d) => d.current && d.permitted && !denied.has(d.id)),
    byId = new Map(universe.map((d) => [d.id, d]));
  const valid =
      resultIds.every((id) => byId.has(id)) && new Set(resultIds).size === resultIds.length,
    rows = resultIds.filter((id) => byId.has(id)).map((id) => byId.get(id)),
    grades = rows.slice(0, cutoff).map((d) => d.relevance),
    ideal = universe
      .map((d) => d.relevance)
      .sort((a, b) => b - a)
      .slice(0, cutoff),
    localIdeal = rows
      .map((d) => d.relevance)
      .sort((a, b) => b - a)
      .slice(0, cutoff),
    idcg = dcg(ideal),
    localDcg = dcg(localIdeal),
    relevant = universe.filter((d) => d.relevance > 0),
    found = new Set(rows.filter((d) => d.relevance > 0).map((d) => d.id));
  return {
    universe,
    rows,
    valid,
    grades,
    ideal,
    localIdeal,
    dcg: dcg(grades),
    idcg,
    localIdcg: localDcg,
    system: idcg ? dcg(grades) / idcg : 0,
    local: localDcg ? dcg(grades) / localDcg : 0,
    recall: relevant.length ? found.size / relevant.length : 0,
  };
}
export function preferredPairs(rows = ranked) {
  return rows.flatMap((preferred) =>
    rows
      .filter((other) => preferred.relevance > other.relevance)
      .map((other) => ({
        preferred: preferred.id,
        other: other.id,
      })),
  );
}
export function sourceSlate({ revoked = [], onlySource, limit = 3, cap = 2 } = {}) {
  const denied = new Set(revoked),
    eligible = documents.filter(
      (d) =>
        d.current &&
        d.permitted &&
        !denied.has(d.id) &&
        (!onlySource || sourceIdentity(d.id) === onlySource),
    ),
    order = [...eligible].sort((a, b) => rankScore(b) - rankScore(a) || a.id.localeCompare(b.id)),
    selected = [],
    stopped = [],
    counts = {};
  for (const row of order) {
    const source = sourceIdentity(row.id);
    if ((counts[source] ?? 0) >= cap) {
      stopped.push(row.id);
      continue;
    }
    counts[source] = (counts[source] ?? 0) + 1;
    selected.push(row.id);
    if (selected.length === limit) break;
  }
  return {
    eligible,
    order,
    selected,
    stopped,
    counts,
    underfilled: selected.length < limit,
  };
}
export function permissionTransfer() {
  const original = sourceSlate(),
    cached = original.selected,
    current = sourceSlate({
      revoked: ['api-guide'],
    }),
    oldReport = judgedListState(original.selected),
    newReport = judgedListState(current.selected, {
      revoked: ['api-guide'],
    });
  return {
    original,
    cached,
    blocked: 'api-guide',
    current,
    oldReport,
    newReport,
    oldEligibilityVersion: 'E1',
    newEligibilityVersion: 'E2',
  };
}
export function validateModel() {
  for (const [elapsed, shown] of [
    [1.8, 0],
    [1.9, 5],
    [3.9, 6],
    [5.225, 6],
    [7.75, 7],
    [14.278, 7],
  ]) {
    assert.equal(eligibilityShown(0, elapsed / 14.278), shown);
  }
  assert.equal(eligibilityShown(1, 0), 7);
  assert.equal(eligible.length, 5);
  for (let step = 0; step <= 100; step++) {
    const state = eligibilityStateFor(0, 1, {
      'eligibility-filter-out': {
        phase: 'during',
        progress: step / 100,
      },
    });
    assert.equal(new Set(state.actors.map((item) => item.id)).size, documents.length);
    assert.equal(
      state.remaining,
      documents.length - state.actors.filter((item) => item.exited).length,
    );
    assert.deepEqual(
      state.actors
        .filter((item) => item.allowed)
        .map((item) => [item.id, item.x, item.y, item.retrieval]),
      eligible.map((item, i) => [item.id, 140, 350 + i * 76, item.retrieval]),
    );
    assert(
      state.actors.filter((item) => item.exited).every((item) => !item.allowed && item.x >= 1240),
    );
  }
  assert.equal(
    eligibilityStateFor(0, 1, {
      'eligibility-filter-out': {
        phase: 'before',
        progress: 0,
      },
    }).remaining,
    7,
  );
  assert.equal(eligibilityStateFor(1, 0).remaining, 5);
  assert.equal(candidateRecall(3), 1 / 3);
  assert.equal(candidateRecall(5), 1);
  const budgetFour = new Set(retrievalOrder.slice(0, 4).map((d) => d.id));
  const four = judgedListState(ranked.filter((d) => budgetFour.has(d.id)).map((d) => d.id));
  assert.equal(four.recall, 2 / 3);
  assert.equal(four.local, 1);
  assert.equal(four.system.toFixed(3), '0.856');
  const guideAndBlog = ['api-guide', 'blog-post'].map((id) => {
    const page = ranked.find((d) => d.id === id);
    return [page.queryFit, page.reliability];
  });
  const [guide, blog] = guideAndBlog;
  const ordinary = rankNetStep(guide, blog);
  const reversed = rankNetStep(blog, guide);
  assert.equal(ordinary.nextGap.toFixed(5), '0.10125');
  assert.deepEqual(
    reversed.next,
    ordinary.next.map((w) => -w),
  );
  const swapWeight = metricSwapState().delta;
  const weighted = rankNetStep(guide, blog, [0, 0], ordinary.rate, swapWeight);
  assert.ok(Math.abs(weighted.nextGap - ordinary.nextGap * swapWeight) < 1e-12);
  const replay = permissionTransfer();
  assert.deepEqual(replay.original.selected, ['api-guide', 'retry-runbook', 'blog-post']);
  assert.equal(replay.oldReport.system.toFixed(3), '0.856');
  assert.deepEqual(replay.current.selected, ['retry-runbook', 'sdk-example', 'blog-post']);
  assert.deepEqual(replay.newReport.ideal, [2, 2, 0]);
  assert.equal(replay.newReport.system, 1);
  const blogRevoked = { revoked: ['blog-post'] };
  const replacement = sourceSlate(blogRevoked);
  assert.deepEqual(replacement.selected, ['api-guide', 'retry-runbook', 'legacy-changelog']);
  assert.equal(judgedListState(replacement.selected, blogRevoked).system, replay.oldReport.system);
  assert.deepEqual(
    ranked.map((item) => item.id),
    ['api-guide', 'retry-runbook', 'sdk-example', 'blog-post', 'legacy-changelog'],
  );
  assert.ok(Math.abs(rankScore(documents[0]) - 2.488) < 1e-12);
  assert.ok(Math.abs(dcg(retrievalOrder.map((item) => item.relevance)) - 9.453) < 0.001);
  assert.ok(Math.abs(dcg(idealGrades) - 10.393) < 0.001);
  assert.ok(Math.abs(ndcg(retrievalOrder.map((item) => item.relevance)) - 0.9097) < 0.001);
  assert.equal(localTopThreeNdcg, 1);
  assert.ok(Math.abs(systemTopThreeNdcg - 0.6738) < 0.001);
  assert.equal(recallLimitFor(0), 3);
  assert.equal(recallLimitFor(0.05), 3);
  assert.equal(recallLimitFor(0.06), 5);
  assert.equal(localMetricsRevealFor(1, 1), 0);
  assert.equal(localMetricsRevealFor(2, 0.02), 0);
  assert.equal(localMetricsRevealFor(2, 0.25), 1);
  assert.equal(localMetricsRevealFor(3, 0), 1);
  const retrievalMetrics = rankingStateFor(0.72);
  assert.deepEqual(retrievalMetrics.grades, [3, 0, 0, 2, 2]);
  assert.ok(Math.abs(retrievalMetrics.dcg - 9.453) < 0.001);
  assert.ok(Math.abs(retrievalMetrics.idcg - 10.393) < 0.001);
  assert.ok(Math.abs(retrievalMetrics.ndcg - 0.9097) < 0.001);
  assert.deepEqual(
    rankingStateFor(0.99),
    retrievalMetrics,
    'The narrated 0.910 belongs to the retrieval order throughout the metric derivation',
  );
  assert.ok(Math.abs(ndcg(ranked.slice(0, 3).map((item) => item.relevance)) - 1) < 1e-12);
  assert.equal(ndcg(ranked.map((item) => item.relevance)), 1);
  assert.ok(
    Math.abs(ndcg(retrievalOrder.slice(0, 3).map((item) => item.relevance)) - 0.6738) < 0.001,
  );
  assert.deepEqual(
    itemVectors.map((item) => dot(queryVector, item.vector)),
    [0.9, 0.8, 0.2],
  );
  assert.deepEqual(clickExamples.map(correctedRate), [0.4, 0.4]);
  assert.deepEqual(
    constrained().map((item) => item.id),
    ['api-guide', 'retry-runbook', 'blog-post'],
  );
  assert.ok(Math.abs(ndcg(constrained().map((item) => item.relevance)) - 0.8558) < 0.001);
  const actors = rerankActors(1, 0.99);
  assert.equal(new Set(actors.map((row) => row.id)).size, 5);
  assert.deepEqual(
    [...actors].sort((a, b) => a.cy - b.cy).map((row) => row.id),
    ranked.map((item) => item.id),
  );
  assert(actors.every((row) => row.cx === 1500));
  return true;
}

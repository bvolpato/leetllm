import { GAP_IDS } from './fixtures.mjs';
import { POSTINGS, SOUP_POSITIONS, TERMS, TOKENS } from './analysis.mjs';
import { AVERAGE_LENGTH, RANKING, bm25, termFrequencyScore } from './scoring.mjs';
import { RECALL_AT_TWO, SECOND_LANE_UNION, TOP_K_TRACE, rerankFixture } from './selection.mjs';
import { GAP_VALUES, decodeGapValues, storageDisplay } from './storage.mjs';
import { fused, reranked } from './credential-shortlist.mjs';
import { ivfRoute, flatRoute, frontierSearch } from './vector-search.mjs';
import { TRACKS, sceneSnapshots } from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.deepEqual(SOUP_POSITIONS, [1, 5]);
  assert.deepEqual(rerankFixture(['d1', 'd4', 'd2']), ['d1', 'd2']);
  assert.ok(termFrequencyScore(2) < 2 * termFrequencyScore(1));
  assert.ok(Math.abs(termFrequencyScore(2) - bm25('d4').score) < 1e-12);
  assert.deepEqual(TERMS, ['make', 'soup']);
  assert.deepEqual(POSTINGS, {
    make: ['d1'],
    soup: ['d1', 'd4'],
  });
  assert.equal(AVERAGE_LENGTH, 8.25);
  assert.equal(TOKENS.d1.length, 11);
  assert.equal(TOKENS.d1.filter((token) => token === 'soup').length, 1);
  assert.ok(Math.abs(bm25('d1').contributions.make - 1.0595) < 0.001);
  assert.ok(Math.abs(bm25('d1').contributions.soup - 0.6099) < 0.001);
  assert.ok(Math.abs(RANKING[0].score - 1.6694) < 0.001);
  assert.deepEqual(
    RANKING.map((row) => row.docId),
    ['d1', 'd4', 'd2', 'd3'],
  );
  assert.deepEqual(
    TOP_K_TRACE.map((row) => row.action),
    ['insert', 'insert', 'discard d3', 'replace d2'],
  );
  assert.deepEqual(TOP_K_TRACE.at(-1).heap, ['d1', 'd4']);
  assert.deepEqual(GAP_VALUES, [12, 8, 5]);
  assert.deepEqual(
    GAP_VALUES.map((_, index) =>
      GAP_VALUES.slice(0, index + 1).reduce((sum, value) => sum + value, 0),
    ),
    GAP_IDS,
  );
  assert.deepEqual(decodeGapValues(GAP_VALUES), GAP_IDS);
  assert.deepEqual(storageDisplay(sceneSnapshots.storage[0], 0.5), {
    visibleCount: 2,
    visibleIds: [12, 20],
    visibleGaps: [12, 8],
    partialSum: 20,
  });
  assert.deepEqual(storageDisplay(sceneSnapshots.storage[1], 0.3), {
    visibleCount: 2,
    visibleIds: [12, 20],
    visibleGaps: [12, 8],
    partialSum: 20,
  });
  assert.deepEqual(storageDisplay(sceneSnapshots.storage[1], 0.5), {
    visibleCount: 3,
    visibleIds: [12, 20, 25],
    visibleGaps: [12, 8, 5],
    partialSum: 25,
  });
  assert.deepEqual(storageDisplay(sceneSnapshots.storage[2], 0.9), {
    visibleCount: 3,
    visibleIds: [12, 20, 25],
    visibleGaps: [12, 8, 5],
    partialSum: 25,
  });
  assert.throws(
    () =>
      storageDisplay(
        {
          ids: [12, 20, 25],
          gaps: [12, 8, 6],
          mode: 'decoded',
        },
        0.9,
      ),
    /reconstruct/,
  );
  assert.equal(RECALL_AT_TWO, 0.5);
  assert.deepEqual(SECOND_LANE_UNION, ['d1', 'd4', 'd2']);
  assert.deepEqual(
    fused().map(([id]) => id),
    ['d1', 'd4', 'd2'],
  );
  assert.deepEqual(
    fused(0).map(([id]) => id),
    ['d1', 'd2', 'd4'],
  );
  assert.deepEqual(reranked(2), ['d1', 'd4']);
  assert.deepEqual(reranked(3), ['d2', 'd1', 'd4']);
  for (const [query, owner, winner, checks] of [
    [4.9, 0, 'generic_api', 3],
    [5.2, 1, 'key_rotation', 4],
  ]) {
    const one = ivfRoute(query),
      two = ivfRoute(query, 2),
      flat = flatRoute(query);
    assert.deepEqual(one.lists, [owner]);
    assert.equal(one.ranked[0].id, winner);
    assert.equal(one.checks, checks);
    assert.equal(two.checks, 5);
    assert.equal(flat.checks, 3);
    assert.equal(flat.ranked[0].id, 'key_rotation');
    assert.deepEqual(two.ranked, flat.ranked);
  }
  assert.deepEqual(frontierSearch(1).expanded, ['A']);
  assert.deepEqual(frontierSearch(2).expanded, ['A', 'S', 'B', 'G']);
  for (const [sceneId, snapshots] of Object.entries(sceneSnapshots)) {
    for (let beat = 0; beat < snapshots.length; beat += 1) {
      assert.deepEqual(
        TRACKS[sceneId].sample({
          beat,
          beatP: 0,
        }).snapshot,
        snapshots[beat],
      );
      assert.deepEqual(
        TRACKS[sceneId].sample({
          beat,
          beatP: 0.5,
        }).snapshot,
        snapshots[beat],
      );
      if (beat + 1 < snapshots.length)
        assert.deepEqual(
          TRACKS[sceneId].sample({
            beat,
            beatP: 1,
          }).snapshot,
          snapshots[beat + 1],
        );
    }
  }
  return true;
}

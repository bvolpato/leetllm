import { cosine, dot, norm, robustUnit, signCode } from './arithmetic.mjs';
import {
  METRICS,
  PASSAGES,
  QUANTIZATION_RESULT,
  QUERY,
  SCALED_A,
  SNAPSHOTS,
  UNIT_METRICS,
} from './fixtures.mjs';
import { TRACKS } from './construction.mjs';
import {
  authorizedSearch,
  deploymentFrame,
  graphSearch,
  magnitudeScale,
  normalizationFrame,
  openingCandidates,
  pqTables,
  prefixResults,
  quantizationFrame,
  quantizationProgress,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.throws(() => robustUnit([0, 0]), RangeError);
  assert.deepEqual(robustUnit([1e300, 1e300]), robustUnit([1e-300, 1e-300]));
  assert.deepEqual(prefixResults(2).winners, [0, 2]);
  assert.equal(prefixResults(4).recall, 1);
  assert.equal(prefixResults(2).recall, 0.5);
  assert.equal(graphSearch(1).winner, 'D');
  assert.equal(graphSearch(3).winner, 'E');
  assert.equal(authorizedSearch(1).winner, null);
  assert.equal(authorizedSearch(1, true).winner, 'Rotation');
  assert.equal(authorizedSearch(2).winner, 'Rotation');
  assert(Math.abs(pqTables().reduce((n, v) => n + v[1], 0) - 0.08) < 1e-12);
  assert(Math.abs(pqTables().reduce((n, v) => n + v[0], 0) - 56.57) < 1e-12);
  assert.equal(signCode([0.3, -0.1, 0.8, -0.4]), 5);
  assert.equal(signCode([0.5, -0.2, 0.7, 0.1]), 13);
  assert.deepEqual(deploymentFrame(1, 0), {
    filter: 1,
    rank: 1,
    incoming: 3,
    eligible: 2,
  });
  assert.equal(
    deploymentFrame(0, 0.99, {
      'deployment-retrieval-access-filter-b1-1': {
        progress: 0,
      },
      'deployment-rank-eligible': {
        progress: 0,
      },
    }).filter,
    0,
  );
  assert.equal(
    deploymentFrame(0, 0, {
      'deployment-retrieval-access-filter-b1-1': {
        progress: 1,
      },
      'deployment-rank-eligible': {
        progress: 1,
      },
    }).rank,
    1,
  );
  assert.equal(magnitudeScale(0, 0), 1);
  assert.equal(magnitudeScale(0, 0.03), 1);
  assert(magnitudeScale(0, 0.5) > 5 && magnitudeScale(0, 0.5) < 6);
  assert.equal(magnitudeScale(0, 0.95), 10);
  assert.equal(magnitudeScale(1, 0), 10);
  assert.deepEqual(
    normalizationFrame(0, 0).map((row) => row.current),
    PASSAGES.map((row) => row.vector),
  );
  for (const row of normalizationFrame(0, 6.1 / 14.304))
    assert(Math.abs(norm(row.current) - 1) < 1e-12);
  assert.deepEqual(normalizationFrame(1, 0), normalizationFrame(0, 1));
  assert.equal(quantizationProgress(1, 0.24), 0);
  assert.equal(quantizationProgress(1, 0.45), 1);
  assert.equal(quantizationProgress(1, 7.84 / 17.212), 1);
  assert.equal(quantizationProgress(2, 0), 1);
  assert.equal(dot(QUERY, PASSAGES[0].vector), 1);
  assert.equal(dot(QUERY, PASSAGES[1].vector), 4);
  assert.ok(METRICS[0].cosine > METRICS[1].cosine);
  assert.ok(METRICS[0].dot < METRICS[1].dot);
  assert.ok(Math.abs(cosine(QUERY, SCALED_A) - METRICS[0].cosine) < 1e-12);
  assert.equal(dot(QUERY, SCALED_A), 10);
  assert.deepEqual(
    UNIT_METRICS.map((row) => row.score),
    METRICS.map((row) => row.cosine),
  );
  assert.deepEqual(
    QUANTIZATION_RESULT.map((row) => row.code),
    [
      [1, 0.2],
      [1, 0.2],
    ],
  );
  assert.ok(QUANTIZATION_RESULT[0].exactCosine > QUANTIZATION_RESULT[1].exactCosine);
  for (const progress of [0, 0.25, 0.5, 0.75, 1])
    for (const row of quantizationFrame(progress))
      assert.equal(row.currentCosine, row.current[0] / Math.hypot(...row.current));
  assert.equal(quantizationFrame(1)[0].currentCosine, quantizationFrame(1)[1].currentCosine);
  for (const row of UNIT_METRICS)
    assert.ok(Math.abs(row.squaredDistance - (2 - 2 * row.score)) < 1e-12);
  assert.deepEqual(
    openingCandidates(0, 0, {
      'opening-nearest-candidates-b1-1': {
        phase: 'during',
      },
    }).rows.map((row) => row.id),
    ['A', 'B'],
  );
  assert.equal(
    openingCandidates(0, 0.99, {
      'opening-nearest-candidates-b1-1': {
        phase: 'before',
      },
      'opening-stored-passages': {
        phase: 'before',
      },
    }).stored,
    false,
  );
  for (const [sceneId, snapshots] of Object.entries(SNAPSHOTS)) {
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

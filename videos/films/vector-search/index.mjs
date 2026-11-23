import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import assert from 'node:assert/strict';
import { probe, validateModel as validateIndexModel } from './model.mjs';
import subjectIntro from './stages/subject-intro.mjs';
import exactBaseline from './stages/exact-baseline.mjs';
import greedyHops from './stages/greedy-hops.mjs';
import hierarchyBeam from './stages/hierarchy-beam.mjs';
import centroidPartitions from './stages/centroid-partitions.mjs';
import probeBoundary from './stages/probe-boundary.mjs';
import recallLedger from './stages/recall-ledger.mjs';
import transfer from './stages/transfer.mjs';
import scaleBudget from './stages/scale-budget.mjs';
import insertGraph from './stages/insert-graph.mjs';
import pqEncode from './stages/pq-encode.mjs';
import adcLookup from './stages/adc-lookup.mjs';
import filteredDistributed from './stages/filtered-distributed.mjs';
import metricReplayScene, { metricReplay } from './stages/metric-replay.mjs';
import earnedTransfer, { SECOND_QUERY, releaseRows } from './stages/earned-transfer.mjs';
export { CENTROIDS, POINTS, QUERY } from './fixtures.mjs';
export {
  collisionFixture,
  compressionFixture,
  encodeChunks,
  exact,
  greedyTrace,
  metricFixture,
  partition,
  postingList,
  probe,
  probeBoundaryState,
  rankCentroids,
  recall,
  referenceChangeState,
  releasePredictionState,
  retainedSceneSnapshot,
  retainedSearch,
  retainedTrace,
} from './model.mjs';
export function validateModel() {
  validateIndexModel();
  assert.deepEqual(metricReplay(false).map((row) => [row.id, row.value.toFixed(2)]), [[202, '0.81'], [101, '81.01']]);
  assert.deepEqual(metricReplay(true).map((row) => [row.id, row.value.toFixed(3)]), [[101, '0.995'], [202, '0.774']]);
  assert.deepEqual(metricReplay(true, true).map((row) => row.id), [202]);
  for (const count of [1, 2])
    assert.deepEqual(probe(count, SECOND_QUERY).result.map((p) => p.id), ['D', 'B']);
  assert.deepEqual(releaseRows().map((r) => [r.overlaps, r.mean, r.passes]), [
    [[0.5, 1], 0.75, false],
    [[1, 1], 1, true],
  ]);
  return true;
}

const definition = defineCanvasLesson({
  id: 'vector-search',
  validateModel,
  scenes: [
    subjectIntro,
    exactBaseline,
    greedyHops,
    hierarchyBeam,
    insertGraph,
    centroidPartitions,
    probeBoundary,
    recallLedger,
    scaleBudget,
    pqEncode,
    adcLookup,
    transfer,
    filteredDistributed,
    metricReplayScene,
    earnedTransfer,
  ],
});
export const draw = definition.draw;
export default definition;

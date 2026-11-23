import assert from 'node:assert/strict';
import { prepareCaptions } from './captions.mjs';
import {
  xy,
  query,
  labels,
  seeds,
  centroids,
  clusterTrials,
  pca,
} from '../../../films/clustering-pca/fixtures.mjs';
import { distance, silhouette } from '../../../films/clustering-pca/arithmetic.mjs';
import {
  seedMass,
  emptyCenterRepair,
  scaleCalculation,
  energyRows,
  cosine,
} from '../../../films/clustering-pca/model.mjs';
import { night, paper, surface, nearIndex } from './drawing.mjs';
import {
  opening,
  neighbors,
  matrix,
  lloydStep,
  lloydMemberships,
  empty,
  firstUpdate,
  secondUpdate,
  repeat,
  seeding,
  partitions,
  scores,
  rivalsOfD,
  corners,
  distances,
  error,
  inputProblem,
} from './groups.mjs';
import {
  scaleRows,
  fitted,
  axes,
  solver,
  compression,
  squares,
  project,
  energy,
  queryZ,
} from './projection.mjs';
import {
  metric,
  spherical,
  originShift,
  indexLists,
  work,
  audit,
  sight,
  pageSearch,
  probe,
  boundaryState,
  workRows,
  unevenScan,
  metricState,
  angleState,
  centerMeans,
} from './retrieval.mjs';

const scenes = [
  [night, opening],
  [paper, neighbors],
  [paper, matrix],
  [night, lloydStep],
  [paper, empty],
  [night, seeding],
  [night, partitions],
  [paper, scores],
  [paper, (a, k) => corners(a, k, false)],
  [paper, (a, k) => corners(a, k, true)],
  [night, scaleRows],
  [paper, fitted],
  [night, axes],
  [paper, solver],
  [night, compression],
  [paper, squares],
  [night, metric],
  [night, spherical],
  [night, originShift],
  [paper, indexLists],
  [paper, work],
  [paper, audit],
  [night, sight],
];
function draw(ctx, clock) {
  const [palette, paint] = scenes[clock.beat.chapterIndex];
  paint(surface(ctx, palette), clock);
}
function check() {
  const close = (actual, expected, tolerance = 1e-8) =>
    assert.ok(Math.abs(actual - expected) < tolerance, actual + ' differs from ' + expected);
  assert.equal(nearIndex(distances), 1);
  close(distances[2] - distances[1], 0.072, 0.001);
  close(distance(xy[0], xy[1]) ** 2, 0.68);
  assert.equal(inputProblem(xy, seeds), null);
  assert.match(inputProblem(xy, [[4]]), /width/);
  assert.match(inputProblem(xy, [[4, NaN]]), /nonfinite/);
  assert.deepEqual(lloydMemberships, [labels, labels]);
  close(error(xy, seeds, labels), 3.48);
  close(error(xy, centroids, labels), 1.74);
  const repair = emptyCenterRepair();
  assert.deepEqual(repair.counts, [1, 5, 0]);
  assert.equal(repair.farthest, 5);
  assert.deepEqual(repair.after, [0, 1, 1, 1, 2, 2]);
  assert.deepEqual(firstUpdate.labels, repair.after);
  assert.deepEqual(firstUpdate.centers[0], xy[0]);
  firstUpdate.centers[1].forEach((v, axis) => close(v, [3.4, 49 / 15][axis]));
  assert.deepEqual(firstUpdate.centers[2], centroids[2]);
  const bDistances = firstUpdate.centers.map((c) => distance(xy[1], c));
  close(bDistances[0], 0.825, 0.0005);
  close(bDistances[1], 2.644, 0.0005);
  assert.equal(nearIndex(bDistances), 0);
  assert.deepEqual(secondUpdate.labels, labels);
  assert.deepEqual(secondUpdate.centers, centroids);
  assert.deepEqual(repeat, secondUpdate);
  assert.deepEqual(repair.fit.labels, labels);
  const first = seedMass(),
    next = seedMass([0, 5]);
  close(first.total, 157.4);
  assert.equal(
    first.intervals.findIndex(([lo, hi]) => lo <= 0.8 && 0.8 < hi),
    5,
  );
  assert.ok(next.probabilities[4] < first.probabilities[4]);
  close(next.probabilities[5], 0);
  for (const fit of clusterTrials) close(error(xy, fit.centers, fit.labels), fit.inertia);
  assert.deepEqual(
    clusterTrials.map((t) => t.silhouette.toFixed(2)),
    ['0.56', '0.76', '0.51'],
  );
  const four = clusterTrials[2];
  assert.ok(four.labels.some((v, i) => silhouette(xy, four.labels, i).singleton));
  assert.deepEqual(rivalsOfD.map((r) => r.members), [['A', 'B'], ['E'], ['F']]);
  const dSilhouette = silhouette(xy, four.labels, 3);
  assert.equal(dSilhouette.otherGroup, rivalsOfD[1].group);
  close(Math.min(...rivalsOfD.map((r) => r.mean)), dSilhouette.b);
  close(dSilhouette.b, distance(xy[3], xy[4]));
  assert.equal(silhouette(xy, four.labels, 4).score, 0);
  const rect = (w) => [
    [0, 0],
    [0, 2],
    [w, 0],
    [w, 2],
  ];
  for (const w of [2, 8]) {
    close(
      error(
        rect(w),
        [
          [w / 2, 0],
          [w / 2, 2],
        ],
        [0, 1, 0, 1],
      ),
      w * w,
    );
    close(
      error(
        rect(w),
        [
          [0, 1],
          [w, 1],
        ],
        [0, 0, 1, 1],
      ),
      4,
    );
  }
  const scale = scaleCalculation();
  assert.deepEqual(scale.rawLabels, [0, 1, 1, 0, 1, 1]);
  assert.deepEqual(scale.standardizedLabels, [0, 0, 0, 1, 1, 1]);
  assert.ok(
    scale.pairs[0].raw > scale.pairs[1].raw &&
      scale.pairs[0].standardized < scale.pairs[1].standardized,
  );
  close(queryZ(scale.means)[1], -0.628, 0.001);
  close(queryZ([0, 300])[1], 0);
  const axis = pca.vector;
  energyRows().forEach((r) => {
    close(r.total, r.retained + r.discarded);
    close((r.centered[0] - r.foot[0]) * axis[0] + (r.centered[1] - r.foot[1]) * axis[1], 0);
  });
  close(energy('retained') / 5, 11.1825, 0.0001);
  close(energy('discarded'), 9.7208, 0.001);
  close(energy('retained') / energy('total'), pca.varianceKept);
  assert.equal(nearIndex(xy.map((v) => distance(project(v), project(query)))), 2);
  const raw = metricState(0),
    unit = metricState(1);
  assert.ok(raw[1][0] > raw[0][0] && unit[0][0] > unit[1][0]);
  unit.forEach((v) => close(distance(v, [1, 0]) ** 2, 2 - 2 * v[0]));
  assert.deepEqual(
    centerMeans.map((v) => Number((distance(v, [1, 0]) ** 2).toFixed(2))),
    [0.81, 0.4],
  );
  assert.deepEqual(
    centerMeans.map((v) => cosine(v, [1, 0])),
    [1, 0.8],
  );
  assert.ok(angleState(0).angles[1] > 0 && angleState(1).angles[1] < 0);
  assert.equal(cosine([0, 0], [1, 0]), null);
  assert.deepEqual(probe(1), { cells: [1], rows: [2, 3], best: 2, cost: 5 });
  assert.deepEqual(probe(2), { cells: [1, 0], rows: [0, 1, 2, 3], best: 1, cost: 7 });
  assert.equal(probe(3).rows.length, 6);
  assert.deepEqual(
    [2.69, 2.7, 2.71].map((y) => {
      const s = boundaryState(y);
      return [s.tie, s.list, s.best, s.flat];
    }),
    [
      [false, 0, 1, 1],
      [true, 0, 1, 1],
      [false, 1, 2, 1],
    ],
  );
  assert.deepEqual(workRows(9600, 40, 2), { per: 240, docs: 480, total: 520 });
  assert.equal(workRows(409600, 4096, 16).docs, 1600);
  assert.equal(workRows(819200, 4096, 16).docs, 3200);
  assert.deepEqual(unevenScan(1), { lengths: [1, 4, 1], open: [0, 1], corpus: 6, docs: 5 });
  assert.deepEqual(unevenScan(4), { lengths: [1, 4, 4], open: [0, 1], corpus: 9, docs: 5 });
  assert.equal(nearIndex(xy.map((v) => distance(v, [4.1, 4.1]))), 2);
  const flat = pageSearch(0),
    full = pageSearch(1);
  assert.deepEqual(flat.ties, ['B', 'L', 'R']);
  assert.equal(flat.winner, 'B');
  assert.deepEqual(full.ties, ['L']);
  close(full.ds[2], 0.2);
  close(flat.kept, 800 / 818);
  return true;
}
export default {
  title: 'Which Shortcut Keeps the Right Reply?',
  draw,
  check,
  preparePicture: prepareCaptions,
};

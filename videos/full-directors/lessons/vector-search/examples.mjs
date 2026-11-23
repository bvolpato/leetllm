import assert from 'node:assert/strict';
import { POINTS, QUERY, CENTROIDS } from '../../../films/vector-search/fixtures.mjs';
import { distance } from '../../../films/vector-search/arithmetic.mjs';
import {
  exact,
  partition,
  rankCentroids,
  probe,
  recall,
  retainedTrace,
  encodeChunks,
  compressionFixture,
  collisionFixture,
} from '../../../films/vector-search/model.mjs';
export {
  POINTS,
  QUERY,
  CENTROIDS,
  distance,
  exact,
  partition,
  rankCentroids,
  probe,
  recall,
  retainedTrace,
  compressionFixture,
  collisionFixture,
};
export const pt = (id) => POINTS.find((p) => p.id === id);
export const ids = (points) => points.map((p) => p.id);
export const nearD = { x: 7.6, y: 5.4 };
export const seam = (CENTROIDS[0].x + CENTROIDS[1].x) / 2;
export const d2 = (p, q = QUERY) => distance(p, q).toFixed(2);
export const books = compressionFixture();
export const original = [1.8, 0.2, 0.1, 1.7];
export const code = encodeChunks(original);
export const collision = collisionFixture();
export const sumCode = (indices) => indices.reduce((sum, id, j) => sum + books.tables[j][id], 0);
export const exactFive = [10, 21, 34, 55, 89],
  foundFive = [10, 21, 34, 55, 3];
export const overlap = (a, b) => a.filter((id) => b.includes(id)).length;
export function trial(n) {
  const runs = [QUERY, nearD].map((q) => {
    const search = probe(n, q),
      reference = exact(POINTS, 2, q);
    return {
      reference: ids(reference),
      ids: ids(search.result),
      recall: recall(search.result, reference),
    };
  });
  const mean = (runs[0].recall + runs[1].recall) / 2;
  const p95 = [8, 18][n - 1];
  return { runs, mean, p95, pass: mean >= 0.9 && p95 <= 20 };
}
export function filing(n, q = QUERY) {
  const opened = rankCentroids(q)
    .slice(0, n)
    .map((r) => r.index);
  const read = POINTS.filter((p) => opened.includes(partition(p)));
  return { opened, read, answer: ids(exact(read, 2, q)) };
}
export function eligible(stage) {
  const pool =
    stage === 'all'
      ? POINTS
      : POINTS.filter((p) => (stage === 'filter' ? 'ACE' : 'CE').includes(p.id));
  const reference = ids(exact(pool));
  const saved = filing(1).answer.filter((id) => pool.some((p) => p.id === id));
  return { pool: ids(pool), reference, saved };
}
export const g = { id: 'G', x: 6, y: 3 };
export const neighbors = () => {
  const selected = [];
  for (const p of exact(POINTS, POINTS.length, g))
    if (selected.length < 4 && selected.every((s) => distance(p, g) < distance(p, s)))
      selected.push(p);
  return selected;
};
export const bridgeNames = ['E', 'M', 'H'],
  bridgeScores = [1, 2, 0.1];
export const baseComponents = 100e6 * 1536,
  raw = baseComponents * 4;
export const listWork = (n) => (1e6 / 1024) * n;
export const operating = [
  [4, 0.4],
  [7, 0.75],
  [12, 0.85],
  [20, 0.91],
  [12, 0.7],
];
export const regions = ['EU-1', 'US-1', 'US-2', 'US-3', 'EU-2'];
export const matchChance = 0.005,
  windowSize = 100;
export const emptyIndependent = (1 - matchChance) ** windowSize,
  emptyShared = 1 - matchChance;
export const arrivals = [4, 7, 6, 5, 8, 5, 7, 6, 8, 11];
export const records = [
    { id: 101, x: 10, y: 0 },
    { id: 202, x: 1, y: 1 },
  ],
  metricQuery = { x: 1, y: 0.1 };
export const unit = (p) => {
  const length = Math.hypot(p.x, p.y);
  return { x: p.x / length, y: p.y / length };
};
export function metric(norm, deleted = false) {
  const q = unit(metricQuery);
  return records
    .filter((p) => !(deleted && p.id === 101))
    .map((p) => ({
      id: p.id,
      score: norm ? unit(p).x * q.x + unit(p).y * q.y : distance(p, metricQuery),
    }))
    .sort((a, b) => (norm ? b.score - a.score : a.score - b.score));
}
export function checkExamples() {
  assert.deepEqual(
    POINTS.map((p) => d2(p)),
    ['0.08', '0.09', '1.25', '9.25', '20.56', '25.00'],
  );
  assert.deepEqual(ids(exact()), ['A', 'B']);
  assert(distance(pt('B'), QUERY) < distance(pt('C'), QUERY));
  assert.deepEqual(
    [1, 2].map((n) => filing(n).answer),
    [
      ['A', 'C'],
      ['A', 'B'],
    ],
  );
  assert.deepEqual(
    [1, 2].map((n) => filing(n).read.length),
    [3, 6],
  );
  assert.deepEqual(
    rankCentroids().map((r) => r.d2.toFixed(2)),
    ['7.84', '10.24'],
  );
  assert.deepEqual(ids(neighbors()), ['B', 'E']);
  assert.deepEqual(
    [1, 3].map((w) => retainedTrace(w).at(-1).retained),
    [[0], [2, 0, 1]],
  );
  assert.deepEqual(
    [1, 3].map((w) => retainedTrace(w).at(-1).comparisons),
    [2, 3],
  );
  assert.equal(raw / 1e9, 614.4);
  assert.deepEqual(
    [5, 20].map((n) => Math.round(listWork(n))),
    [4883, 19531],
  );
  assert.deepEqual(code.ids, [1, 2]);
  assert.deepEqual(code.reconstructed, [2, 0, 0, 2]);
  assert.equal(code.error2.toFixed(2), '0.18');
  assert.equal(Math.sqrt(code.error2).toFixed(2), '0.42');
  assert.equal(books.rawBytes / books.codeBytes, 32);
  assert.equal(books.codebookBytes / 1024, 768);
  assert.equal(books.tableBytes / 1024, 96);
  assert.equal(sumCode(code.ids), 8);
  assert.deepEqual(books.codes.map(sumCode), [0, 4, 4, 8]);
  assert.deepEqual(
    collision.originals.map((p) => p.code),
    [
      [0, 0],
      [0, 0],
    ],
  );
  assert.deepEqual(ids(collision.originalOrder), ['B', 'A']);
  assert.deepEqual(
    ['all', 'filter', 'delete'].map((stage) => eligible(stage).reference),
    [
      ['A', 'B'],
      ['A', 'C'],
      ['C', 'E'],
    ],
  );
  assert.deepEqual(eligible('delete').saved, ['C']);
  assert.equal((emptyIndependent * 100).toFixed(1), '60.6');
  assert.equal(emptyShared, 0.995);
  assert.equal((0.99 ** 10 * 100).toFixed(1), '90.4');
  assert.deepEqual(
    [metric(false)[0].id, metric(true)[0].id, metric(true, true)[0].id],
    [202, 101, 202],
  );
  assert.deepEqual(
    [1, 2].map((n) => trial(n).mean),
    [0.75, 1],
  );
  assert.deepEqual(
    [1, 2].map((n) => trial(n).pass),
    [false, true],
  );
  assert.deepEqual(
    trial(2).runs.map((r) => r.ids),
    [
      ['A', 'B'],
      ['D', 'B'],
    ],
  );
  assert.equal(20 - trial(2).p95, 2);
  assert.equal(overlap(exactFive, foundFive), 4);
}

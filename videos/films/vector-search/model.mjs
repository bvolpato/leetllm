import { distance } from './arithmetic.mjs';
import { CENTROIDS, POINTS, QUERY } from './fixtures.mjs';
import { cueProgress } from './construction.mjs';
import assert from 'node:assert/strict';
export function exact(points = POINTS, k = 2, query = QUERY) {
  return [...points]
    .sort((a, b) => distance(a, query) - distance(b, query) || a.id.localeCompare(b.id))
    .slice(0, k);
}
export function partition(point) {
  return distance(point, CENTROIDS[0]) <= distance(point, CENTROIDS[1]) ? 0 : 1;
}
export function rankCentroids(query = QUERY) {
  return CENTROIDS.map((centroid, index) => ({
    index,
    d2: distance(query, centroid),
    centroid,
  })).sort((a, b) => a.d2 - b.d2 || a.index - b.index);
}
export function postingList(index) {
  if (!Number.isInteger(index) || index < 0 || index >= CENTROIDS.length)
    throw new RangeError('centroid index is outside the trained list');
  return POINTS.filter((point) => partition(point) === index)
    .map((point) => ({
      ...point,
      d2: distance(point, QUERY),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}
export function probe(count, query = QUERY) {
  const lists = rankCentroids(query).slice(0, count).map((row) => row.index);
  const examined = POINTS.filter((point) => lists.includes(partition(point)));
  return {
    examined,
    result: exact(examined, 2, query),
  };
}
export function recall(found, reference = exact()) {
  const ids = new Set(found.map((p) => p.id));
  return reference.filter((p) => ids.has(p.id)).length / reference.length;
}
export function greedyTrace(beat, progress) {
  const position =
    (beat === 0 ? 0 : beat === 1 ? Math.max(0, Math.min(1, (progress - 0.05) / 0.81)) : 1) * 2;
  return {
    position,
    step: Math.min(1, Math.floor(position)),
    completed: Math.floor(position),
  };
}
export function probeBoundaryState(state) {
  const left = cueProgress(state, 'probe-left');
  const right = cueProgress(state, 'open-right');
  const first = cueProgress(state, 'first-slot') > 0;
  const pair = cueProgress(state, 'show-left-pair') > 0;
  const swap = cueProgress(state, 'replace-c');
  const scanned = [left, right].map((p, i) => {
    const rows = postingList(i);
    return rows.slice(0, Math.ceil(p * rows.length)).map((row) => row.id);
  });
  const ids = probe(swap > 0 ? 2 : 1).result.map((p) => p.id);
  return { left, right, first, pair, swap, scanned, ids };
}
export function retainedSearch(width) {
  const ds = [1, 2, 0.1],
    edges = [[1], [0, 2], [1]],
    queue = [0],
    seen = new Set([0]),
    results = [0];
  while (queue.length) {
    queue.sort((a, b) => ds[a] - ds[b]);
    const current = queue.shift();
    if (results.length >= width && ds[current] > Math.max(...results.map((i) => ds[i]))) break;
    for (const n of edges[current]) {
      if (seen.has(n)) continue;
      seen.add(n);
      if (results.length < width || ds[n] < Math.max(...results.map((i) => ds[i]))) {
        queue.push(n);
        results.push(n);
        results.sort((a, b) => ds[a] - ds[b]);
        results.splice(width);
      }
    }
  }
  return results;
}
export function retainedTrace(width) {
  const distances = [1, 2, 0.1],
    links = [[1], [0, 2], [1]],
    queue = [0],
    seen = new Set([0]),
    retained = [0],
    snapshots = [];
  const snapshot = (current = null, discarded = null) =>
    snapshots.push({
      current,
      discarded,
      visited: [...seen],
      queue: [...queue],
      retained: [...retained],
      comparisons: seen.size,
    });
  snapshot();
  while (queue.length) {
    queue.sort((a, b) => distances[a] - distances[b]);
    const current = queue.shift();
    if (
      retained.length >= width &&
      distances[current] > Math.max(...retained.map((i) => distances[i]))
    )
      break;
    for (const next of links[current]) {
      if (seen.has(next)) continue;
      seen.add(next);
      const admit =
        retained.length < width || distances[next] < Math.max(...retained.map((i) => distances[i]));
      if (admit) {
        queue.push(next);
        retained.push(next);
        retained.sort((a, b) => distances[a] - distances[b]);
        retained.splice(width);
      }
      snapshot(current, admit ? null : next);
    }
  }
  return snapshots;
}
export function retainedSceneSnapshot(state) {
  const beat = state.beat ?? 0,
    p = Math.max(0, Math.min(1, state.beatP ?? 0)),
    q = Math.max(0, Math.min(1, (p - 0.05) / 0.83));
  const progress = (id, fallback) => {
    const cue = state.cues?.[id];
    return cue ? (cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : cue.progress) : fallback;
  };
  const wide = progress('wide-retained-bridge', 0),
    width = beat > 1 || wide > 0 ? 3 : 1,
    history = retainedTrace(width);
  const index =
    beat > 1
      ? Math.min(history.length - 1, 1 + Math.floor(progress('reach-hidden', q) * (history.length - 1)))
      : wide > 0
        ? Math.min(1, Math.floor(wide * 2))
        : Math.min(
            history.length - 1,
            Math.floor(progress('narrow-discards-bridge', q) * history.length),
          );
  return {
    width,
    current: history[index],
  };
}
export function validateBaselineModel() {
  assert.deepEqual(
    exact().map((p) => p.id),
    ['A', 'B'],
  );
  assert.deepEqual(
    probe(1).result.map((p) => p.id),
    ['A', 'C'],
  );
  assert.equal(recall(probe(1).result), 0.5);
  assert.equal(recall(probe(2).result), 1);
  assert.equal(probe(1).examined.length, 3);
  assert.equal(partition(POINTS[1]), 1);
  assert.deepEqual(
    rankCentroids().map((row) => row.index),
    [0, 1],
  );
  assert.deepEqual(
    rankCentroids().map((row) => Number(row.d2.toFixed(2))),
    [7.84, 10.24],
  );
  assert.deepEqual(
    postingList(0).map((row) => row.id),
    ['A', 'C', 'E'],
  );
  assert.throws(() => postingList(2), RangeError);
  assert.equal(retainedSearch(1)[0], 0);
  assert.equal(retainedSearch(3)[0], 2);
  assert.equal(distance(POINTS[0], QUERY).toFixed(2), '0.08');
  assert.equal(greedyTrace(0, 0.9).position, 0);
  assert.equal(greedyTrace(1, 0.12).completed, 0);
  assert.equal(greedyTrace(1, 0.5).completed, 1);
  assert.equal(greedyTrace(1, 0.88).completed, 2);
  assert.equal(greedyTrace(2, 0).position, 2);
  const after = { phase: 'after', progress: 1 };
  const cues = { 'probe-left': after, 'first-slot': after };
  const prediction = probeBoundaryState({ cues });
  assert.equal(prediction.first, true);
  assert.equal(prediction.pair, false);
  assert.deepEqual(prediction.scanned, [['A', 'C', 'E'], []]);
  cues['show-left-pair'] = after;
  assert.deepEqual(probeBoundaryState({ cues }).ids, ['A', 'C']);
  cues['open-right'] = after;
  const rescoring = probeBoundaryState({ cues });
  assert.deepEqual(rescoring.scanned[1], ['B', 'D', 'F']);
  assert.deepEqual(rescoring.ids, ['A', 'C']);
  cues['replace-c'] = after;
  assert.deepEqual(probeBoundaryState({ cues }).ids, ['A', 'B']);
  assert.deepEqual(retainedTrace(1).at(-1).retained, retainedSearch(1));
  assert.deepEqual(retainedTrace(3).at(-1).retained, retainedSearch(3));
  assert.equal(retainedTrace(1).at(-1).comparisons, 2);
  assert.equal(retainedTrace(1).at(-1).discarded, 1);
  assert.equal(retainedTrace(3).at(-1).comparisons, 3);
}
export function compressionFixture() {
  const books = [
      [
        [0, 0],
        [2, 0],
        [0, 2],
        [2, 2],
      ],
      [
        [0, 0],
        [2, 0],
        [0, 2],
        [2, 2],
      ],
    ],
    query = [0, 0, 0, 0],
    codes = [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ];
  const tables = books.map((book, j) =>
    book.map((c) => c.reduce((sum, v, i) => sum + (v - query[2 * j + i]) ** 2, 0)),
  );
  const scores = codes.map((code) => code.reduce((sum, k, j) => sum + tables[j][k], 0));
  return {
    books,
    query,
    codes,
    tables,
    scores,
    rawBytes: 768 * 4,
    codeBytes: 96,
    codebookBytes: 96 * 256 * 8 * 4,
    tableBytes: 96 * 256 * 4,
  };
}
export function encodeChunks(vector, books = compressionFixture().books) {
  const chunks = books.map((book, j) => {
    const values = vector.slice(j * book[0].length, (j + 1) * book[0].length),
      distances = book.map((c) => c.reduce((sum, v, i) => sum + (v - values[i]) ** 2, 0)),
      id = distances.indexOf(Math.min(...distances));
    return {
      values,
      distances,
      id,
      reconstructed: [...book[id]],
    };
  });
  return {
    chunks,
    ids: chunks.map((c) => c.id),
    reconstructed: chunks.flatMap((c) => c.reconstructed),
    error2: chunks.reduce((sum, c) => sum + c.distances[c.id], 0),
  };
}
export function collisionFixture() {
  const originals = [
    {
      id: 'A',
      values: [0.8, 0.8, 0.8, 0.8],
    },
    {
      id: 'B',
      values: [0.1, 0.1, 0.1, 0.1],
    },
  ].map((p) => ({
    ...p,
    code: encodeChunks(p.values).ids,
    trueDistance2: p.values.reduce((s, v) => s + v * v, 0),
  }));
  return {
    originals,
    adcOrder: [...originals].sort((a, b) => a.id.localeCompare(b.id)),
    originalOrder: [...originals].sort(
      (a, b) => a.trueDistance2 - b.trueDistance2 || a.id.localeCompare(b.id),
    ),
    coarse: [10, 0, 10, 0],
    database: [10.8, 0.8, 10.8, 0.8],
    query: [10, 0, 10, 0],
  };
}
export function referenceChangeState(state) {
  const beat = state.beat ?? 0,
    filtered = beat === 1 && cueProgress(state, 'transfer-filter-reference') >= 1,
    deleted = beat === 1 && cueProgress(state, 'transfer-delete-reference') >= 1,
    eligible = deleted ? ['C', 'E'] : filtered ? ['A', 'C', 'E'] : POINTS.map((p) => p.id),
    reference = exact(POINTS.filter((p) => eligible.includes(p.id))).map((p) => p.id),
    result = ['A', 'C'].filter((id) => eligible.includes(id));
  return {
    stage: deleted ? 'deleted' : filtered ? 'filtered' : 'original',
    eligible,
    reference,
    result,
  };
}
export function releasePredictionState(state) {
  const beat = state.beat ?? 0,
    revealed = beat > 1 || (beat === 1 && cueProgress(state, 'earned-transfer-result') >= 1);
  return {
    revealed,
    recall: revealed ? 4 / 5 : null,
    decision: revealed ? 'HOLD' : null,
  };
}
export function metricFixture() {
  const cosine = (point) => {
    const norm = Math.hypot(point.x, point.y),
      qn = Math.hypot(QUERY.x, QUERY.y);
    return (point.x * QUERY.x + point.y * QUERY.y) / (norm * qn);
  };
  const ranked = [...POINTS].sort((a, b) => cosine(b) - cosine(a) || a.id.localeCompare(b.id));
  return {
    ranked,
    cosine,
    afterDelete: ranked.filter((p) => p.id !== ranked[0].id),
  };
}
export function validateModel() {
  validateBaselineModel();
  const f = compressionFixture();
  assert.deepEqual(f.tables, [
    [0, 4, 4, 8],
    [0, 4, 4, 8],
  ]);
  assert.deepEqual(f.scores, [0, 4, 4, 8]);
  assert.equal(f.rawBytes / f.codeBytes, 32);
  assert.equal(f.codebookBytes / 1024, 768);
  assert.equal(f.tableBytes / 1024, 96);
  assert.deepEqual(
    metricFixture()
      .ranked.slice(0, 2)
      .map((x) => x.id),
    ['B', 'A'],
  );
  assert.equal(100e6 * 1536 * 4, 614400000000);
  assert.equal((20 * 1e6) / 1024, 19531.25);
  assert(Math.abs(0.99 ** 10 - 0.904382075) < 1e-9);
  return true;
}

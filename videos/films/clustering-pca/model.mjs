import {
  centroids,
  clusterTrials,
  coarseDistances,
  exactNearestIndex,
  inertia,
  initialInertia,
  labels,
  means,
  normalizedScaleLabels,
  pca,
  query,
  rawScaleLabels,
  scaleFixture,
  seeds,
  stds,
  transferDocuments,
  transferQuery,
  updatedInertia,
  withinGroupDistances,
  xy,
} from './fixtures.mjs';
import { distance, lloyd, mix, smooth, unit } from './arithmetic.mjs';
import assert from 'node:assert/strict';
export function scaleCalculation() {
  const rows = scaleFixture.map((raw, i) => ({
    id: ['B100', 'B500', 'B900', 'D110', 'D510', 'D910'][i],
    raw,
    standardized: raw.map((value, axis) => (value - means[axis]) / stds[axis]),
  }));
  const pairs = [1, 3].map((index) => ({
    from: rows[0].id,
    to: rows[index].id,
    raw: distance(rows[0].raw, rows[index].raw),
    standardized: distance(rows[0].standardized, rows[index].standardized),
  }));
  return {
    means,
    stds,
    rows,
    pairs,
    rawLabels: rawScaleLabels,
    standardizedLabels: normalizedScaleLabels,
  };
}
export function scaleConstruction(state) {
  const beat = state.beat ?? 0,
    cue = state.cues?.['scale-beat-2-focus-1'];
  const progress =
    beat < 1
      ? 0
      : beat > 1
        ? 1
        : cue
          ? cue.phase === 'before'
            ? 0
            : cue.phase === 'after'
              ? 1
              : cue.progress
          : Math.max(0, Math.min(1, state.beatP ?? 0));
  return {
    progress,
    coordinateCount: Math.min(2, Math.floor(2 * progress + 1e-9)),
    rawMemberships: beat > 0,
    scaledMemberships: progress === 1,
  };
}
export function ivfState(beat, progress) {
  const order = coarseDistances
    .map((value, index) => ({
      value,
      index,
    }))
    .sort((a, b) => a.value - b.value)
    .map((v) => v.index);
  const probes = beat >= 2 && progress >= 0.3 ? 2 : 1;
  const cells = order.slice(0, probes);
  const candidates = xy.map((_, i) => i).filter((i) => cells.includes(labels[i]));
  const selected = candidates.reduce(
    (best, i) => (distance(query, xy[i]) < distance(query, xy[best]) ? i : best),
    candidates[0],
  );
  return {
    probes,
    cells,
    candidates,
    selected,
    recall: Number(selected === exactNearestIndex),
  };
}
export function reconstructionState(projection, restoration = 0, accumulation = 1) {
  const project = Math.max(0, Math.min(1, projection)),
    restore = Math.max(0, Math.min(1, restoration));
  const rows = xy.map((original, i) => {
    const score = pca.scores[i],
      foot = pca.mean.map((mean, axis) => mean + score * pca.vector[axis]);
    const current = original.map(
      (value, axis) => value + (foot[axis] - value) * project * (1 - restore),
    );
    const residual = current.reduce((sum, value, axis) => sum + (original[axis] - value) ** 2, 0);
    return {
      id: i + 1,
      original,
      score,
      foot,
      current,
      residual,
    };
  });
  const count = Math.min(
    rows.length,
    Math.floor(Math.max(0, Math.min(1, accumulation)) * rows.length + 1e-9),
  );
  return {
    rows,
    count,
    residual: rows.reduce((sum, row) => sum + row.residual, 0),
    shownResidual: rows.slice(0, count).reduce((sum, row) => sum + row.residual, 0),
  };
}
export function validateModel() {
  assert.equal(reconstructionState(0).residual, 0);
  assert.ok(Math.abs(reconstructionState(1).residual - pca.residual) < 1e-12);
  assert.equal(reconstructionState(1, 1).residual, 0);
  for (const row of reconstructionState(1).rows) {
    assert.ok(
      Math.abs(
        row.foot.reduce(
          (sum, value, axis) => sum + (row.original[axis] - value) * pca.vector[axis],
          0,
        ),
      ) < 1e-12,
    );
    assert.deepEqual(reconstructionState(1, 1).rows[row.id - 1].current, row.original);
  }
  assert.ok(Math.abs(withinGroupDistances[0] - Math.sqrt(0.68)) < 1e-12);
  assert.ok(Math.abs(withinGroupDistances[1] - Math.sqrt(1.16)) < 1e-12);
  assert.ok(Math.abs(withinGroupDistances[2] - Math.sqrt(1.64)) < 1e-12);
  assert.deepEqual(centroids, [
    [1.1, 1.4],
    [4.5, 4],
    [8.5, 1.4],
  ]);
  assert.ok(Math.abs(initialInertia - 3.48) < 1e-12);
  assert.ok(Math.abs(updatedInertia - 1.74) < 1e-12);
  assert.ok(
    Math.abs(pca.mean[0] - 4.7) < 1e-12 && Math.abs(pca.mean[1] - 2.2666666666666666) < 1e-12,
  );
  assert.ok(Math.abs(pca.varianceKept - 0.852) < 0.001);
  assert.ok(Math.abs(pca.residual - 9.72) < 0.01);
  assert.deepEqual(rawScaleLabels, [0, 1, 1, 0, 1, 1]);
  assert.deepEqual(normalizedScaleLabels, [0, 0, 0, 1, 1, 1]);
  assert.equal(exactNearestIndex, 1);
  assert.ok(coarseDistances[1] < coarseDistances[0]);
  assert.deepEqual(ivfState(1, 0.99).candidates, [2, 3]);
  assert.equal(ivfState(2, 0.1).recall, 0);
  assert.deepEqual(ivfState(2, 0.5).candidates, [0, 1, 2, 3]);
  assert.equal(ivfState(2, 0.5).selected, exactNearestIndex);
  assert.equal(ivfState(2, 0.5).recall, 1);
  assert.deepEqual(emptyCenterRepair().counts, [1, 5, 0]);
  assert.equal(emptyCenterRepair().farthest, 5);
  assert.ok(Math.abs(seedMass().total - 157.4) < 1e-10);
  energyRows().forEach((row) =>
    assert.ok(Math.abs(row.total - row.retained - row.discarded) < 1e-10),
  );
  assert.equal(
    rectangleFrame({
      beat: 0,
      beatP: 1,
    }).errorKnown,
    false,
  );
  assert.equal(
    rectangleFrame({
      beat: 1,
      beatP: 1,
    }).error,
    64,
  );
  assert.equal(
    rectangleFrame({
      beat: 2,
      beatP: 1,
    }).error,
    4,
  );
  return true;
}
export function directed(state, id, beat, start = 0.08, end = 0.8) {
  const cue = state.cues?.[id];
  return cue
    ? cue.phase === 'before'
      ? 0
      : cue.phase === 'after'
        ? 1
        : unit(cue.progress)
    : (state.beat ?? 0) < beat
      ? 0
      : (state.beat ?? 0) > beat
        ? 1
        : smooth(unit(((state.beatP ?? 0) - start) / (end - start)));
}
export function clusterFrame(state) {
  const assign = directed(state, 'points-assign', 0),
    update = directed(state, 'centers-update', 1),
    again = directed(state, 'assign-again', 2);
  const current = seeds.map((seed, k) =>
    seed.map((value, axis) => mix(value, centroids[k][axis], update)),
  );
  return {
    assignedCount: Math.min(6, Math.floor(assign * 6 + 1e-9)),
    centers: current,
    update,
    meanXKnown: directed(state, 'mean-x', 1) === 1,
    meanYKnown: directed(state, 'mean-y', 1) === 1,
    inertia: inertia(current),
    objectiveKnown: assign === 1,
    again,
  };
}
export function partitionFrame(state) {
  const b = state.beat ?? 0;
  const k =
    b > 0
      ? 3
      : directed(state, 'partition-four', 0) > 0
        ? 4
        : directed(state, 'partition-three', 0) > 0
          ? 3
          : 2;
  return clusterTrials.find((row) => row.k === k);
}
export function projectionFrame(state) {
  const b = state.beat ?? 0,
    centered = directed(state, 'pca-center', 0),
    projection = directed(state, 'pca-project', 1),
    rotation = directed(state, 'pca-rotate', 1);
  const angle = mix(Math.PI / 2, Math.atan2(pca.vector[1], pca.vector[0]), rotation),
    vector = [Math.cos(angle), Math.sin(angle)];
  const rows = xy.map((original, i) => {
    const point = original.map((v, axis) => v - pca.mean[axis] * (b === 0 ? centered : 1));
    const score = point[0] * vector[0] + point[1] * vector[1],
      foot = vector.map((v) => v * score);
    return {
      id: i,
      point,
      score,
      foot,
    };
  });
  const sign = b === 2 && directed(state, 'pca-sign', 2) === 1 ? -1 : 1;
  return {
    centered,
    projection,
    rotation,
    vector: vector.map((v) => sign * v),
    rows,
    sign,
    energy: rows.reduce((sum, row) => sum + row.score ** 2, 0),
    total: xy.reduce(
      (sum, point) => sum + point.reduce((n, v, axis) => n + (v - pca.mean[axis]) ** 2, 0),
      0,
    ),
  };
}
export function compressionFrame(state) {
  const first = directed(state, 'reconstruct-c', 0),
    all = directed(state, 'residual-all', 0),
    restore = directed(state, 'restore-second', 1),
    order = [2, 0, 1, 3, 4, 5];
  const rows = xy.map((original, i) => {
    const slot = order.indexOf(i),
      project = i === 2 ? first : unit(5 * all - (slot - 1));
    const foot = original.map((_, axis) => pca.mean[axis] + pca.scores[i] * pca.vector[axis]);
    const current = original.map((v, axis) => mix(v, foot[axis], project * (1 - restore)));
    return {
      id: i,
      original,
      foot,
      current,
      project,
      error: current.reduce((sum, v, axis) => sum + (original[axis] - v) ** 2, 0),
    };
  });
  const collected = rows.filter(
    (row) => row.project === 1 && (row.id !== 2 || directed(state, 'residual-c', 0) === 1),
  );
  return {
    rows,
    collected: collected.map((row) => row.id),
    sum: collected.reduce((sum, row) => sum + row.error, 0),
    restore,
  };
}
export function retrievalFrame(state) {
  const b = state.beat ?? 0,
    one = directed(state, 'ivf-one', 1),
    two = directed(state, 'ivf-two', 2),
    reference = directed(state, 'ivf-reference', 1);
  const count = Math.min(2, Math.floor(2 * one + 1e-9)),
    extra = Math.min(2, Math.floor(2 * two + 1e-9));
  const candidates = [2, 3].slice(0, count).concat([0, 1].slice(0, extra));
  const selected = candidates.length
    ? candidates.reduce((a, i) => (distance(query, xy[i]) < distance(query, xy[a]) ? i : a))
    : null;
  return {
    candidates,
    selected,
    probes: b === 0 ? 0 : two > 0 ? 2 : 1,
    referenceKnown: directed(state, 'cp-ivf-1-3', 1) === 1,
    one,
    two,
    resultKnown:
      b === 1
        ? directed(state, 'cp-ivf-1-1', 1) === 1
        : b === 2
          ? directed(state, 'cp-ivf-2-1', 2) === 1
          : false,
    workKnown: directed(state, 'cp-ivf-2-3', 2) === 1,
  };
}
export function transferFrame(state) {
  const projected = directed(state, 'transfer-project', 1),
    restored = directed(state, 'transfer-restore', 2),
    amount = projected * (1 - restored);
  const points = transferDocuments.map((row) => ({
    ...row,
    current: [row.point[0], row.point[1] * (1 - amount)],
  }));
  const currentQuery = [0, transferQuery[1] * (1 - amount)],
    distances = points.map((row) => distance(row.current, currentQuery));
  const smallest = Math.min(...distances),
    ties = points.filter((_, i) => Math.abs(distances[i] - smallest) < 1e-10).map((row) => row.id);
  return {
    amount,
    points,
    currentQuery,
    distances,
    ties,
    varianceKept: 800 / 818,
    referenceKnown: directed(state, 'transfer-query', 0) === 1,
    tieKnown: amount === 1,
    answerKnown: (state.beat ?? 0) === 2 && directed(state, 'cp-takeaway-2-1', 2) === 1,
  };
}
export function seedMass(selected = [0]) {
  const weights = xy.map((point) => Math.min(...selected.map((i) => distance(point, xy[i]) ** 2)));
  const total = weights.reduce((sum, v) => sum + v, 0);
  let cumulative = 0;
  return {
    weights,
    total,
    probabilities: weights.map((v) => v / total),
    intervals: weights.map((v) => {
      const lower = cumulative;
      cumulative += v / total;
      return [lower, cumulative];
    }),
  };
}
export function emptyCenterRepair() {
  const initial = [xy[0], xy[1], [100, 100]],
    assign = (centers) =>
      xy.map((point) =>
        centers
          .map((c) => distance(point, c))
          .reduce((best, v, k, all) => (v < all[best] ? k : best), 0),
      );
  const before = assign(initial),
    nearest = xy.map((p) => Math.min(...initial.map((c) => distance(p, c) ** 2))),
    farthest = nearest.indexOf(Math.max(...nearest));
  const repaired = [xy[0], xy[1], xy[farthest]];
  return {
    initial,
    before,
    counts: initial.map((_, k) => before.filter((v) => v === k).length),
    farthest,
    repaired,
    after: assign(repaired),
    fit: lloyd(xy, repaired),
  };
}
export function energyRows() {
  return xy.map((point, i) => {
    const centered = point.map((v, j) => v - pca.mean[j]),
      foot = pca.vector.map((v) => v * pca.scores[i]);
    return {
      id: ['A', 'B', 'C', 'D', 'E', 'F'][i],
      centered,
      foot,
      retained: pca.scores[i] ** 2,
      discarded: distance(centered, foot) ** 2,
      total: centered.reduce((s, v) => s + v * v, 0),
    };
  });
}
export function cosine(a, b) {
  const denominator = Math.hypot(...a) * Math.hypot(...b);
  return denominator > 0 && a.every(Number.isFinite) && b.every(Number.isFinite)
    ? a.reduce((s, v, i) => s + v * b[i], 0) / denominator
    : null;
}
export function rectangleFrame(state) {
  const scene = 'fresh-seed-repair',
    b = state.beat ?? 0,
    P = (beat, s) => directed(state, `cp-${scene}-${beat}-${s}`, beat),
    data = [
      [0, 0],
      [0, 2],
      [8, 0],
      [8, 2],
    ],
    bad = [
      [0, 0],
      [0, 2],
    ],
    badMeans = [
      [4, 0],
      [4, 2],
    ],
    good = [
      [0, 0],
      [8, 0],
    ],
    goodMeans = [
      [0, 1],
      [8, 1],
    ];
  const restart = b >= 2 ? P(2, 0) : 0,
    update = b === 1 ? P(1, 0) : b > 1 ? 1 : 0,
    repairUpdate = b >= 2 ? P(2, 1) : 0;
  const centers =
    b < 2
      ? bad.map((p, i) => p.map((v, j) => mix(v, badMeans[i][j], update)))
      : badMeans.map((p, i) =>
          p.map((v, j) =>
            restart < 1
              ? mix(v, good[i][j], restart)
              : mix(good[i][j], goodMeans[i][j], repairUpdate),
          ),
        );
  const assignments = b < 2 ? [0, 1, 0, 1] : restart < 1 ? [0, 1, 0, 1] : [0, 0, 1, 1];
  const error = data.reduce((sum, p, i) => sum + distance(p, centers[assignments[i]]) ** 2, 0);
  return {
    data,
    centers,
    assignments,
    error,
    assigned: b > 0 || P(0, 2) > 0,
    meanKnown: b === 1 ? P(1, 0) === 1 : b >= 2 ? repairUpdate === 1 : false,
    errorKnown: b === 1 ? P(1, 1) === 1 : b >= 2 ? P(2, 2) === 1 : false,
    restarted: restart === 1,
  };
}

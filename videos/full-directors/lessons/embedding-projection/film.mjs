import assert from 'node:assert/strict';
import { base } from './drawing.mjs';
import {
  opening,
  depthReplay,
  bytesScene,
  concentration,
  baseline,
  methods,
  fitted,
  angleScene,
  opticalState,
  angleState,
  budget,
  ranking,
  relative,
} from './geometry.mjs';
import {
  recallScene,
  mapAudit,
  pairScene,
  normalization,
  fuzzyUnion,
  memberships,
  sweep,
  probe,
  probeHits,
  movingPair,
  triangle,
  gaussianRow,
  union,
  membership,
} from './neighborhoods.mjs';
import {
  serving,
  servingRow,
  randomProjection,
  quantize,
  product,
  prefix,
  jl,
  jlRanges,
  scalar,
  xor,
  pqBlocks,
  prefixes,
  shortlistRuns,
} from './compression.mjs';
import { gateScene, finalScene, searchState, verdict, candidates } from './decision.mjs';
import {
  PCA_NEIGHBORS,
  SOURCE_NEIGHBORS,
  MAP_NEIGHBORS,
} from '../../../films/embedding-projection/model.mjs';
const scenes = [
  opening,
  depthReplay,
  bytesScene,
  concentration,
  baseline,
  methods,
  fitted,
  angleScene,
  recallScene,
  mapAudit,
  pairScene,
  normalization,
  fuzzyUnion,
  memberships,
  serving,
  randomProjection,
  quantize,
  product,
  prefix,
  gateScene,
  finalScene,
];
function check() {
  const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `Expected ${a} to equal ${b}`);
  const flat = opticalState(0, 0.48),
    headOn = opticalState(1, 0),
    raised = opticalState(1, 0.48);
  for (const pts of [headOn, flat]) {
    close(pts[0].x, pts[3].x);
    close(pts[0].y, pts[3].y);
  }
  assert.deepEqual(
    flat.map((p) => p.distance),
    [0, 1, 2, 0],
  );
  assert.deepEqual(
    raised.map((p) => p.distance),
    [0, 1, 2, 8],
  );
  assert.ok(raised[3].x < raised[0].x);
  assert.equal(budget(1536, 4, 1e7) / 1e9, 61.44);
  assert.equal(budget(256, 4, 1e7) / 1e9, 10.24);
  assert.deepEqual(servingRow([4, 2, 1]).slice(1, 3), [
    [3, 1, 0],
    [3, 1],
  ]);
  assert.deepEqual(servingRow([3, 3, 2]).slice(1, 3), [
    [2, 2, 1],
    [2, 2],
  ]);
  close(Math.hypot(...servingRow([3, 3, 2])[3]), 1);
  close(relative(8), 0.5);
  close(relative(128), 0.125);
  assert.deepEqual(
    ranking.slice(0, 3).map((r) => r.id),
    [0, 1, 3],
  );
  assert.deepEqual(
    ranking.slice(0, 3).map((r) => r.score.toFixed(3)),
    ['0.999', '0.997', '0.036'],
  );
  close(angleState(0).cos, 0.6);
  close(angleState(1).prod, -2);
  close(angleState(1, true).prod, -1);
  assert.equal(angleState(1, true, true).cos, null);
  assert.equal(sweep.find((s) => s[2] >= 0.95 * 60)[0], 6);
  assert.deepEqual(probe.map(probeHits), [3, 1]);
  assert.deepEqual(
    probe.map((p) => p.hits),
    [58, 47],
  );
  assert.deepEqual(PCA_NEIGHBORS, SOURCE_NEIGHBORS);
  assert.equal(MAP_NEIGHBORS.filter((v, i) => v === SOURCE_NEIGHBORS[i]).length, 3);
  assert.equal(MAP_NEIGHBORS[2], 1);
  const before = movingPair(0),
    after = movingPair(1);
  close(before.q, 0.01);
  close(after.q, 0.1);
  close(before.term, 0.1 * Math.log(10));
  close(after.term, 0);
  assert.ok(before.d > after.d);
  for (const i of [0, 2, 3]) assert.deepEqual(before.points[i], after.points[i]);
  close(gaussianRow(4).p, 0.8);
  close(triangle(1).q[0][1], 3 / 26);
  close(triangle(2).q[0][1], 0.1875);
  close(triangle(1).weights[0][1], triangle(2).weights[0][1]);
  close(triangle(2).weights[1][2], 1 / 6);
  close(triangle(1).denominator, 26 / 15);
  close(triangle(2).denominator, 16 / 15);
  close(union(0.8, 0.6), 0.92);
  close(membership(1, 1, 1), 1);
  close(membership(2, 1, 1), Math.exp(-1));
  assert.equal(jl(1e7, 0.15), 6368);
  assert.equal(jl(20, 0.5), 144);
  assert.ok(jlRanges[0][1] > jlRanges[1][0]);
  for (const [i, v] of [1.1, 1.03].entries()) assert.ok(v >= jlRanges[i][0] && v <= jlRanges[i][1]);
  assert.equal(scalar(-0.3).code, -38);
  close(scalar(-0.3).decoded, -38 / 127);
  assert.equal(scalar(1.2).code, 127);
  assert.deepEqual(xor, [0, 1, 0, 1]);
  assert.equal(pqBlocks.length, 8);
  assert.equal(pqBlocks[0].id, 26);
  assert.equal(pqBlocks[0].queryId, 38);
  close(pqBlocks[0].symmetricCost, 16 * (12 / 255) ** 2);
  assert.equal(pqBlocks[0].symmetricCost.toFixed(5), '0.03543');
  assert.equal(
    pqBlocks
      .slice(0, 3)
      .reduce((sum, block) => sum + block.cost, 0)
      .toFixed(5),
    '0.05236',
  );
  const cost = pqBlocks.reduce((s, b) => s + b.cost, 0),
    decoded = pqBlocks.flatMap((b) => Array(16).fill(b.id / 255)),
    query = pqBlocks.flatMap((b) => Array(16).fill(b.q));
  close(
    cost,
    query.reduce((s, x, i) => s + (x - decoded[i]) ** 2, 0),
  );
  assert.equal(cost.toFixed(5), '0.31899');
  assert.deepEqual(shortlistRuns, [
    [3, 5],
    [12, 17],
  ]);
  close(shortlistRuns[0][1] / 27, 5 / 27);
  assert.equal(prefixes.filter((n) => n >= 64).length, 4);
  assert.equal(prefixes.filter((n) => n >= 257).length, 1);
  assert.deepEqual(candidates.map(verdict), [
    'Over budget',
    'Eligible',
    'Below floor',
    'Below floor',
  ]);
  assert.equal(verdict({ ...candidates[1], recall: Infinity }), 'Invalid report');
  assert.equal(verdict({ bytes: 0, recall: 1 }), 'Invalid report');
  const good = searchState(),
    bad = searchState(true);
  for (let i = 0; i < 2; i++) {
    close(good.q[i], [2.2, 0.4][i]);
    close(good.q[i], -bad.q[i]);
    close(good.r[i], bad.r[i]);
    close(good.m[i], bad.m[i]);
  }
  close(good.scores[0], 0.8);
  close(bad.scores[0], -0.8);
  close(good.scores[1], 0);
  close(bad.scores[1], 0);
  assert.deepEqual([good.winner, bad.winner], ['Rotation', 'Merge']);
}
export default {
  title: 'Looking at High Dimensions Through a Small Window',
  preparePicture(schedule) {
    const replay = schedule.find(({ beat }) => beat.id === 'c21-b07');
    for (const phrase of [
      'Its arrow now points the other way',
      'Rotation scores minus point eight',
      'Merge still scores zero',
      'The merge rule ranks first',
      "That's how a reader asking about a key",
      'ends up with a sentence about a failed security scan',
    ]) replay.markCaption(phrase);
    replay.cueWordIndices = new Set(replay.cueWordIndices);
  },
  draw(c, clock) {
    base(c);
    scenes[clock.beat.chapterIndex](c, clock);
  },
  check,
};

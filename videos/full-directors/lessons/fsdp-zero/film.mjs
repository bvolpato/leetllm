import assert from 'node:assert/strict';
import { C, brush, sum } from './studio.mjs';
import { placement, inventory, weighting, ownership, collectives } from './ownership.mjs';
import {
  lifecycle,
  dtype,
  binding,
  trade,
  granularity,
  links,
  hybrid,
  checkpoint,
} from './materialization.mjs';
import { offload, deviceMesh, tensor, pipeline, context } from './parallel.mjs';
import { diagnosis, recompute, sizing } from './trials.mjs';
import {
  budget,
  perRank,
  ranks,
  objective,
  bytes,
  columns,
  storeWeight,
  lifetimes,
  afterForward,
  gatherState,
  adam,
  mesh,
  output,
  schedules,
  attention,
  peakParts,
  portGBps,
} from './experiments.mjs';

const painters = [
  placement,
  inventory,
  weighting,
  ownership,
  ownership,
  ownership,
  ownership,
  collectives,
  lifecycle,
  dtype,
  binding,
  trade,
  granularity,
  links,
  hybrid,
  checkpoint,
  offload,
  deviceMesh,
  tensor,
  pipeline,
  context,
  diagnosis,
  recompute,
  sizing,
];

function draw(ctx, clock) {
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, 1920, 1080);
  const index = clock.beat.chapterIndex;
  painters[index](brush(ctx, clock), index + 1);
}
function check() {
  assert.deepEqual([400, 800].map(portGBps), [50, 100]);
  assert.equal(sum(bytes), 16);
  assert.deepEqual(budget(70, 1, 0).parts, [140, 140, 840]);
  assert.equal(budget(70, 16, 3).parts[0], 8.75);
  assert.deepEqual(
    ranks.map((stage) => sum(Object.values(perRank(stage)))),
    [8, 5, 3.5, 2],
  );
  assert.deepEqual(objective(), {
    counts: [1, 3],
    gradients: [-2, -6],
    factors: [0.5, 1.5],
    uniform: -4,
    corrected: -5,
  });
  const prior = columns(false);
  const replay = columns(true);
  assert.deepEqual(prior.rows.map((row) => row[2]), [3, 4, 5, 6]);
  assert.deepEqual(
    replay.rows,
    prior.rows.map((row, rank) =>
      row.map((value, column) => (rank === 3 && column === 2 ? 9 : value)),
    ),
  );
  assert.deepEqual(prior.values, [10, 14, 18, 22]);
  assert.deepEqual(replay.values, [10, 14, 21, 22]);
  assert.deepEqual(storeWeight(1e-8), [1, 1, 1]);
  assert.deepEqual(storeWeight(1e-4), [Math.fround(0.9999), 1, 1]);
  assert.deepEqual([2, 3, 4, 5, 6].map(lifetimes), [
    [1, 2, 2, 4],
    [1, 2, 0, 4],
    [1, 2, 0, 1],
    [1, 2, 0, 1],
    [1, 2, 0, 0],
  ]);
  assert.equal(gatherState(5, 6).remaining, 3);
  assert.deepEqual([true, false, 4].map(afterForward), [
    { retained: 0, gatherRanks: 8 },
    { retained: 1, gatherRanks: 0 },
    { retained: 0.25, gatherRanks: 4 },
  ]);
  assert.equal(gatherState(5, 7.5).remaining, 1.5);
  assert.equal(gatherState(5, 9).second, true);
  assert.equal(gatherState(0, 4).weights, 7);
  assert.equal(gatherState(0, 6).weights, 3.5);
  assert.deepEqual(
    [32, 8].map((n) => budget(70, n, 3).state),
    [35, 140],
  );
  assert.deepEqual(adam([1, 1]), { m: 0.75, v: 0.75, t: 2, delta: -0.1 });
  assert.ok(Math.abs(adam([1, 1, -1]).delta - 1 / 70) < 1e-12);
  assert.equal(adam([-1]).delta, 0.1);
  assert.equal(mesh.dp * mesh.tp * mesh.pp * mesh.cp, 128);
  assert.equal(mesh.dp * mesh.micro * mesh.accum, 32);
  assert.deepEqual(output, [8, 5]);
  assert.deepEqual(
    schedules.map((s) => s.maxLive),
    [
      [8, 8, 8, 8],
      [4, 3, 2, 1],
    ],
  );
  assert.deepEqual(
    schedules.map((s) => s.ticks),
    [22, 22],
  );
  assert.ok(Math.abs(attention[1].mass - 4 / 3) < 1e-12);
  assert.ok(Math.abs(attention[1].output - 8) < 1e-12);
  assert.deepEqual(
    [3, 1.5, 4.5].map((a) => sum(peakParts(a))),
    [7, 5.5, 8.5],
  );
  assert.deepEqual(
    [16, 24, 32].map((n) => Math.round(budget(70, n, 3, 18).peak * 10) / 10),
    [88, 64.7, 53],
  );
  assert.equal(budget(30, 16, 2).state, 86.25);
  assert.equal(budget(30, 16, 3, 18).peak, 48);
}
export default {
  title: 'Distributed Training: Bytes, Collectives, and Parallel Axes',
  draw,
  check,
};

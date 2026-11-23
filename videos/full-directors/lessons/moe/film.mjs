import assert from 'node:assert/strict';
import { base } from './bench.mjs';
import {
  rack,
  layer,
  scores,
  blend,
  vector,
  gate,
  family,
  router,
  hidden,
  shiftedMasses,
  massTotal,
  selectedOutputs,
  layerUpdate,
  switches,
  t4,
  scalar,
  bias,
} from './routing.mjs';
import {
  pack,
  buckets,
  training,
  balancing,
  partition,
  packed,
  choice,
  counter,
  balance,
  prefixWinner,
} from './training.mjs';
import { capacity, replay, practice, fixed, full, redirected, fresh, wide } from './queues.mjs';
import {
  memory,
  interconnect,
  protocol,
  workloads,
  serving,
  pool,
  parameters,
  remote,
  wire,
  coordinates,
  vectorKiB,
  tokenId,
  hashRoutes,
  rankRows,
} from './serving.mjs';
import { moeServing, moeZ } from '../../../films/moe/model.mjs';
import { BLENDED_OUTPUT, CHOICE_SCORES, SKEW_COUNTS } from '../../../films/moe/fixtures.mjs';

const scenes = {
  c01: rack,
  c02: layer,
  c03: scores,
  c04: blend,
  c05: vector,
  c06: gate,
  'c06-family': family,
  c07: pack,
  'c07-choice': buckets,
  c08: training,
  c09: balancing,
  'c09-z': partition,
  c10: capacity,
  c11: replay,
  c12: memory,
  c13: interconnect,
  'c13-wire': protocol,
  c14: workloads,
  'c14-gate': serving,
  'c14-practice': practice,
};
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, String(a) + ' differs from ' + b);
const vectorClose = (v, ref) => {
  assert.equal(v.length, ref.length);
  v.forEach((x, j) => close(x, ref[j]));
};
function check() {
  assert.equal(switches.length, 2);
  assert.deepEqual(
    switches.map((t) => t.ids),
    [
      [0, 2],
      [1, 7],
    ],
  );
  assert.equal(new Set(switches.flatMap((t) => t.ids)).size, 4);
  assert.deepEqual(router.selected, [0, 2]);
  assert.equal(shiftedMasses[0], 1);
  shiftedMasses.forEach((mass, i) => {
    assert.ok(mass > 0 && mass <= 1);
    close(mass / massTotal, router.probabilities[i]);
  });
  close(massTotal, 1.9182342606299985);
  close(
    router.probabilities.reduce((a, b) => a + b),
    1,
  );
  close(router.weights[0], 0.668187772168166);
  close(router.weights[1], 1 - router.weights[0]);
  vectorClose(BLENDED_OUTPUT, [2 * router.weights[0], 3 * router.weights[1]]);
  assert.deepEqual(selectedOutputs, [
    [2, 0, 0, 0],
    [0, 3, 0, 0],
  ]);
  assert.equal(layerUpdate.length, hidden.length);
  vectorClose(layerUpdate, [...BLENDED_OUTPUT, 0, 0]);
  vectorClose(t4.output, [1.2, 1.2]);
  vectorClose(t4.terms[1].vector, [0, 3]);
  assert.deepEqual(
    scalar.map((s) => s.output),
    [1.5, 2],
  );
  assert.ok(scalar[0].gradient > 0);
  assert.equal(scalar[1].gradient, 0);
  assert.deepEqual(bias.ids, [2, 0]);
  vectorClose(bias.weights, [0.4, 0.6]);
  close(bias.scores[2], 0.7);
  assert.deepEqual(
    packed.packed.map((r) => r.token),
    [1, 2, 0, 0, 2],
  );
  assert.deepEqual(
    packed.packed.filter((r) => r.token === 0).map((r) => r.contribution),
    [
      [-0.75, -1.5],
      [0.125, 0.25],
    ],
  );
  vectorClose(packed.outputs[0], [-0.625, -1.25]);
  assert.deepEqual(choice.loads, [2, 2, 2]);
  assert.deepEqual(choice.coverage, [2, 1, 2, 1, 0]);
  choice.buckets.forEach((ids, i) =>
    assert.deepEqual(
      ids.map((t) => CHOICE_SCORES[i][t]),
      CHOICE_SCORES[i].toSorted((a, b) => b - a).slice(0, 2),
    ),
  );
  assert.equal(prefixWinner(1).id, 'earlier');
  assert.equal(prefixWinner(2).id, 'future');
  vectorClose(
    balance.f,
    SKEW_COUNTS.map((c) => c / 20),
  );
  close(balance.score, 1.602);
  close(counter.score, 0.9);
  assert.equal(counter.f[2], 0);
  for (const shift of [0, 0.5, 1.5, 3]) {
    const z = moeZ(shift);
    vectorClose(z.p, [0.75, 0.25]);
    close(z.loss, shift * shift);
  }
  assert.deepEqual(fixed.loads, [8, 3, 3, 2]);
  assert.deepEqual(
    fixed.terms.map((t) => [t.slot, t.runs]),
    [
      [5, false],
      [2, true],
    ],
  );
  assert.equal(fixed.slots, 4);
  assert.equal(fixed.totalOverflow, 4);
  vectorClose(fixed.output, [0, 1.2]);
  vectorClose(full.output, t4.output);
  assert.deepEqual(redirected.loads, [7, 3, 3, 3]);
  vectorClose(redirected.output, [3, 1.2]);
  assert.deepEqual(
    redirected.terms.map((t) => t.expert),
    [3, 2],
  );
  assert.equal(parameters(pool.k), 7);
  assert.equal(parameters(pool.experts) * pool.bytes, 38);
  assert.equal(vectorKiB, 8);
  assert.deepEqual(hashRoutes.get(tokenId), [2, 3]);
  assert.deepEqual(wire.gates, [0.6, 0.4]);
  wire.outputs.forEach((v) => assert.equal(v.length, coordinates));
  assert.deepEqual(
    wire.outputs.map((v) => v.slice(0, 2)),
    [
      [0, 3],
      [5, 0],
    ],
  );
  assert.equal(remote.length, 3);
  assert.equal(2 * remote.length * vectorKiB, 48);
  assert.equal(wire.assignmentBytes / 1024, 32);
  assert.equal(wire.coalescedBytes / 1024, 16);
  close(wire.assignmentBytes / 1024, 2 * wire.outputs.length * vectorKiB);
  close(wire.coalescedBytes / 1024, 2 * vectorKiB);
  vectorClose(wire.separate, wire.destinationCombined);
  assert.equal(wire.separate.length, coordinates);
  vectorClose(wire.separate.slice(0, 2), [2, 1.8]);
  assert.deepEqual(
    rankRows.map((r) => r.reduce((a, b) => a + b)),
    [8, 8],
  );
  assert.ok(rankRows[0][0] > rankRows[1][0] && rankRows[0][1] < rankRows[1][1]);
  assert.deepEqual(
    moeServing(60).map((r) => r.accepted),
    [false, true],
  );
  assert.deepEqual(
    moeServing(50).map((r) => r.accepted),
    [false, false],
  );
  assert.deepEqual(
    fresh.terms.map((t) => t.slot),
    [4, 2],
  );
  assert.equal(fresh.slots, 3);
  assert.equal(fresh.totalOverflow, 2);
  assert.equal(wide.slots, 5);
  assert.equal(wide.totalOverflow, 0);
  assert.deepEqual(wide.groups, fresh.groups);
  assert.deepEqual(
    wide.terms,
    fresh.terms.map((term) => ({ ...term, runs: true })),
  );
  vectorClose(fresh.output, [0, 2.25]);
  vectorClose(wide.output, [0.5, 2.25]);
}
export default {
  title: 'Mixture of Experts: Routing, Training and Serving',
  draw(c, k) {
    c.save();
    base(
      c,
      k.beat.id === 'c13-wire-b03' ? 'Which expert pages can we fetch early?' : k.beat.chapterTitle,
    );
    scenes[k.beat.chapterId](c, k);
    c.restore();
  },
  check,
};

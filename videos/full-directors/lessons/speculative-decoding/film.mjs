import assert from 'node:assert/strict';
import { P, Q, TWO_GAP_Q, CHAIN } from '../../../films/speculative-decoding/fixtures.mjs';
import {
  decomposition,
  transformedLaw,
  weightWorksheet,
  isolationFixture,
  samplerBoundary,
} from '../../../films/speculative-decoding/arithmetic.mjs';
import { wordSample, served, acceptance, residual, proof, proofState, drawDog } from './sampling.mjs';
import {
  opening,
  chain,
  cache,
  cacheState,
  stopping,
  practice,
  rejected,
  allPass,
  outcome,
  fresh,
  stopped,
  history,
} from './sentence.mjs';
import { tree, proposers, lookup, mask, positions } from './branches.mjs';
import {
  weights,
  yieldScene,
  budgeting,
  service,
  counts,
  cost,
  budgetState,
  gaps,
  trials,
} from './serving.mjs';
import { tableRound, runs, pairs } from './table-round.mjs';

const scenes = {
  c01: opening,
  weights,
  c02: wordSample,
  filter: served,
  c03: acceptance,
  c04: residual,
  c05: proof,
  c06: chain,
  c07: cache,
  stop: stopping,
  'table-round': tableRound,
  tree,
  proposers,
  c08: yieldScene,
  budget: budgeting,
  service,
  c09: practice,
};
function check() {
  const near = (x, y) => assert.ok(Math.abs(x - y) < 1e-9, x + ' differs from ' + y);
  for (const q of [Q, TWO_GAP_Q, P, [0, 1, 0]]) {
    const d = decomposition(P, q);
    near(d.overlap.reduce((a, v) => a + v, 0) + d.z, 1);
    P.forEach((p, i) => near(d.overlap[i] + (d.residual?.[i] ?? 0) * d.z, p));
  }
  assert.equal(drawDog.index, 1);
  const d = decomposition();
  near(d.acceptance[drawDog.index], 0.6);
  assert.deepEqual(
    drawDog.draws.map((u) => u < d.acceptance[1]),
    [true, false],
  );
  assert.deepEqual(d.residual, [1, 0, 0]);
  assert.equal(decomposition(P, P).residual, null);
  const good = proofState(true, false),
    wrong = proofState(false, true);
  near(good.d.residual[0], 2 / 3);
  near(good.d.residual[1], 1 / 3);
  const corrected = proofState(false, false);
  for (const [i, p] of P.entries()) {
    near(wrong.extra[i], wrong.d.z * p);
    near(wrong.total[i], [0.35, 0.39, 0.26][i]);
    near(corrected.total[i], p);
    near(good.total[i], p);
  }
  const served = transformedLaw();
  near(Q[drawDog.index], 0.5);
  assert.deepEqual(served.raw, [0.55, 0.30, 0.15]);
  near(served.retained, 0.85);
  near(served.target[1], 6 / 17);
  near(served.proposal[1], 0.35);
  assert.deepEqual(served.acceptance, [1, 1, 0]);
  assert.deepEqual(rejected.accepted, ['sang']);
  assert.deepEqual(rejected.discarded, ['softly', 'today']);
  assert.deepEqual(rejected.committed, ['sang', 'nearby']);
  assert.deepEqual(allPass.committed, ['sang', 'softly', 'today', 'EOS']);
  for (const [r, alpha, replacement] of [
    [CHAIN[1], 0.5, 'nearby'],
    [fresh, 5 / 7, 'today'],
  ]) {
    const o = outcome(r);
    near(o.alpha, alpha);
    assert.equal(o.keep, false);
    assert.equal(o.replacement, replacement);
  }
  // The replacement becomes text before it has keys or values. The two suffix slots clear together.
  function cacheAt(i, heard) {
    return cacheState({ beat: { beatIndex: i }, reveal: (phrase) => Number(heard.includes(phrase)) });
  }
  assert.deepEqual(cacheAt(0, []).provisional, ['softly', 'today']);
  const trimmed = cacheAt(0, ['Clear the rejected suffix']);
  assert.deepEqual(trimmed.state, ['The', 'bird', 'sang']);
  assert.deepEqual(trimmed.provisional, []);
  const pending = cacheAt(1, ['Commit nearby']);
  assert.deepEqual(pending.printed, ['The', 'bird', 'sang', 'nearby']);
  assert.deepEqual(pending.state, trimmed.state);
  assert.equal(pending.pending, true);
  assert.deepEqual(cacheAt(2, []).state, pending.state);
  assert.deepEqual(cacheAt(2, ['Its key and value now exist']).state, pending.printed);
  assert.deepEqual(stopped.delivered, ['sang']);
  assert.deepEqual(stopped.discarded, ['today']);
  assert.deepEqual(history, { stale: [8, 82, 823], corrected: [8, 83] });
  assert.deepEqual(runs, [['dawn'], ['noon', 'dusk'], ['noon', 'noon', 'dawn']]);
  near(pairs[1].target, 0.24);
  assert.equal(
    pairs.reduce((s, v) => s + v.n, 0),
    60000,
  );
  assert.equal(Math.max(...pairs.map((v) => Math.abs(v.target - v.observed))).toFixed(4), '0.0037');
  assert.deepEqual(mask, [1, 0, 1, 0]);
  assert.deepEqual(positions, [10, 10, 11, 11]);
  near(isolationFixture(100).tree.result, isolationFixture(10000).tree.result);
  assert.ok(isolationFixture(10000).flat.result > 90 * isolationFixture(100).flat.result);
  const l = decomposition(lookup.p, lookup.q);
  assert.ok(lookup.uniform >= l.acceptance[lookup.index]);
  assert.deepEqual(l.residual, [0.4, 0.6, 0]);
  assert.equal(samplerBoundary(false, true).baselineLawEstablished, true);
  assert.equal(samplerBoundary(true, false).baselineLawEstablished, false);
  const one = weightWorksheet(),
    six = weightWorksheet(6);
  near(one.memoryMs, six.memoryMs);
  near(six.flops, one.flops * 6);
  near(six.intensity, 6);
  assert.ok(six.computeMs < six.memoryMs);
  assert.deepEqual(counts(0.9, 0.1), { first: 90, both: 9, yield: 1.99 });
  assert.deepEqual(counts(0.1, 0.9), { first: 10, both: 9, yield: 1.19 });
  assert.deepEqual(
    [cost(5, 1), cost(5, 1.25), cost(10, 1.5)].map((v) => v.speed.toFixed(2)),
    ['2.46', '2.11', '1.83'],
  );
  assert.deepEqual(
    [3, 2].map((k) => [budgetState(k).inputs, budgetState(k).fits]),
    [
      [48, false],
      [36, true],
    ],
  );
  assert.deepEqual(gaps, [1, 1, 198]);
  assert.deepEqual(
    trials.map((t) => t.passes),
    [true, false],
  );
  assert.deepEqual(trials.map((t) => t.load), [9, 11]);
  assert.deepEqual(trials.map((t) => t.throughput), [8.7, 10.2]);
  near(trials[0].attainment, 174 / 180);
  near(trials[1].attainment, 204 / 220);
}
export default {
  title: 'Drafting Several Tokens at Once',
  draw(g, c) {
    scenes[c.beat.chapterId](g, c);
  },
  check,
};

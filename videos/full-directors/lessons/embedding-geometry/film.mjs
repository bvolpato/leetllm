import assert from 'node:assert/strict';
import { surface } from './drawing.mjs';
import { geometry, geometryState, normGate, prefix, quantGrid, tips, grid } from './geometry.mjs';
import {
  payload,
  storage,
  scalar,
  signedByte,
  unsignedTicks,
  scales,
  scaleRows,
  calibration,
  integer,
  integerRows,
} from './codec.mjs';
import {
  book,
  nearestId,
  encoding,
  adc,
  adcState,
  lookup,
  transform,
  rotate,
  binary,
  packSigns,
  signRows,
  nineSigns,
  pop,
  signAngle,
  signsA,
  signsB,
} from './product.mjs';
import {
  graph,
  walk,
  budget,
  trials,
  accepts,
  access,
  accessState,
  deployment,
  rescore,
  shortlist,
} from './search.mjs';
import {
  dot,
  l2,
  cosine,
  quantize,
  robustUnit,
} from '../../../films/embedding-geometry/arithmetic.mjs';
import {
  prefixResults,
  calibrationResult,
  calibrationRanking,
} from '../../../films/embedding-geometry/model.mjs';

const painters = [
  ...[1, 2, 3, 4, 5].map((ch) => (d) => geometry(ch, d)),
  normGate,
  prefix,
  payload,
  quantGrid,
  scalar,
  scales,
  calibration,
  integer,
  book,
  adc,
  transform,
  binary,
  signAngle,
  graph,
  budget,
  access,
  deployment,
  (d) => geometry(23, d),
  rescore,
];
function draw(ctx, clock) {
  painters[clock.beat.chapterIndex](surface(ctx, clock));
}
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} differs from ${b}`);
function snapshot(b, marks = {}) {
  const progress = (n, phrase) => (b === n ? (marks[phrase] ?? 0) : Number(b > n));
  return { b, cue: progress, after: progress };
}
function check() {
  const start = geometryState(1, snapshot(1));
  assert.deepEqual(
    start.metrics.map((r) => r.dot),
    [1, 4],
  );
  assert(start.metrics[0].cos > start.metrics[1].cos);
  near(start.metrics[1].gap, Math.sqrt(13));
  for (const [mark, x] of [
    [0, 1],
    [0.5, 2.5],
    [1, 4],
  ]) {
    const s = geometryState(4, snapshot(2, { 'Stretch green': mark }));
    assert.deepEqual(s.vectors[0], [x, 0.2 * x]);
    near(s.metrics[0].dot, x);
    near(s.metrics[0].cos, start.metrics[0].cos);
  }
  near(geometryState(4, snapshot(3)).metrics[0].gap, Math.sqrt(85));
  const unit = geometryState(5, snapshot(2));
  unit.metrics.forEach((m) => {
    near(m.dot, m.cos);
    near(m.gap ** 2, 2 - 2 * m.dot);
  });
  const turn = [0, 0.5, 1].map((v) => geometryState(23, snapshot(2, { 'Turn the ruler': v })));
  assert(turn[0].metrics[0].dot > turn[0].metrics[1].dot);
  assert(turn[2].metrics[0].dot < turn[2].metrics[1].dot);
  for (const s of turn) {
    assert.equal(s.varyLengths, false);
    assert.deepEqual(s.vectors, turn[0].vectors);
    near(Math.hypot(...s.q), 1);
    s.metrics.forEach((m, i) => near(dot(s.q, s.vectors[i]), m.dot));
  }
  const rawUp = geometryState(23, snapshot(3));
  near(rawUp.metrics[0].dot, 0.2);
  near(rawUp.metrics[1].dot, 2);
  assert(rawUp.metrics[0].gap < rawUp.metrics[1].gap);
  const restoring = geometryState(23, snapshot(2, { 'Turn the ruler': 1, 'Restore the original': 0.5 }));
  const shrinking = geometryState(23, snapshot(4, { 'Slide the guides': 0.5 }));
  const unitUp = geometryState(23, snapshot(4, { 'Slide the guides': 1 }));
  for (const state of [restoring, rawUp, shrinking, unitUp]) {
    assert.equal(state.varyLengths, true);
    assert.deepEqual(state.q, turn[2].q);
  }
  assert.deepEqual(restoring.vectors, shrinking.vectors);
  assert.deepEqual(unitUp.vectors, turn[2].vectors);
  assert(unitUp.metrics[1].gap < unitUp.metrics[0].gap);
  for (const z of [1e300, 1e-300]) robustUnit([z, z]).forEach((x) => near(x, Math.SQRT1_2));
  for (const row of [[0, 0], [], [Infinity, 1]]) assert.throws(() => robustUnit(row));
  assert.deepEqual(prefixResults(4).winners, [1, 2]);
  assert.deepEqual(prefixResults(2).winners, [0, 2]);
  assert.equal(storage(1e6, 1536, 96).books, 1572864);
  assert.deepEqual(storage(1, 1536, 96), {
    float: 6144,
    scalar: 1536,
    sign: 192,
    pq: 96,
    books: 1572864,
  });
  const store = storage(50e6, 768, 96);
  assert.deepEqual([store.float, store.scalar, store.sign, store.pq], [153.6e9, 38.4e9, 4.8e9, 4.8e9]);
  assert.equal(store.scalar + store.float, 192e9);
  const codes = tips.map((v) => quantize(v, grid));
  assert.deepEqual(codes, [
    [1, 0.2],
    [1, 0.2],
  ]);
  for (const tip of tips) {
    tip.forEach((value, axis) => assert(Math.abs(value - codes[0][axis]) < grid / 2));
  }
  assert(cosine([1, 0], tips[0]) > cosine([1, 0], tips[1]));
  const s = signedByte();
  assert.equal(s.code, 42);
  near(s.decoded, 0.42);
  near(s.error, 0.004);
  for (const lo of [2, 0]) {
    const ticks = unsignedTicks(lo, 3);
    assert.deepEqual(ticks.map((tick) => tick.code), Array.from({ length: 16 }, (_, i) => 17 * i));
    for (const { code, real } of ticks) near(((real - lo) * 255) / (3 - lo), code);
    assert.deepEqual(
      ticks.filter(({ code }) => code % 85 === 0).map(({ real }) => real),
      lo === 0 ? [0, 1, 2, 3] : [2, 7 / 3, 8 / 3, 3],
    );
  }
  const [a, b] = scaleRows();
  assert.deepEqual(
    [a.codes, b.codes],
    [
      [102, 0],
      [0, 127],
    ],
  );
  assert(a.raw < b.raw && a.score > b.score);
  near(calibrationResult(1).outlier, 1);
  assert.equal(calibrationResult(25).mae.toFixed(4), '0.0483');
  assert.equal(calibrationResult(1).mae.toFixed(4), '0.0019');
  const cr = calibrationRanking();
  assert.deepEqual([cr.originalWinner, cr.coarseWinner, cr.fineWinner], [1, 0, 1]);
  assert.deepEqual(
    integerRows.map((r) => [r.exact, r.hi, r.lo]),
    [
      [32258, 126, 2],
      [32004, 125, 4],
    ],
  );
  assert(1536 * 127 ** 2 < 2 ** 31);
  assert.equal(
    nearestId(
      [0.9, 1.1],
      [
        [0, 0],
        [1, 1],
      ],
    ),
    1,
  );
  assert.deepEqual(encoding, [1, 1, 1, 1]);
  near(lookup(encoding).total, 0.08);
  const unchanged = adcState(snapshot(5)),
    changed = adcState(snapshot(5, { 'second lookup moves': 1 }));
  assert.deepEqual(unchanged.ids, encoding);
  assert.deepEqual(changed.ids, [1, 0, 1, 1]);
  near(changed.total, 4.55);
  changed.terms.forEach((x, i) => near(x, i === 1 ? 4.49 : 0.02));
  near(lookup([0, 0, 0, 0]).total, 56.57);
  for (const ang of [0, 0.5, Math.PI / 2]) {
    const q = rotate([1, 0], ang),
      v = rotate([0.6, 0.8], ang);
    near(dot(q, v), 0.6);
    near(l2(q, v) ** 2, 0.8);
  }
  const packed = signRows.map((v) => packSigns(v)[0]);
  assert.deepEqual(packed, [5, 13]);
  assert.equal(pop(packed[0] ^ packed[1]), 1);
  assert.deepEqual(packSigns(nineSigns), [85, 1]);
  assert.deepEqual(packSigns(nineSigns.slice(0, 8)), [85]);
  assert.deepEqual(packSigns(signsA), packSigns(signsB));
  near(cosine(signsA, signsB), 0.02 / 1.0001);
  assert.equal(walk(snapshot(4)).event.id, 'D');
  assert.equal(walk(snapshot(5)).event.id, 'E');
  assert.deepEqual(
    trials.filter(accepts).map((r) => r[0]),
    [48],
  );
  const blocked = accessState(snapshot(3, { 'private note takes': 1, 'Remove the denied': 1 }));
  assert.deepEqual(
    blocked.rows.map((r) => r.id),
    ['Private'],
  );
  assert.deepEqual(blocked.survivors, []);
  const wide = accessState(snapshot(5));
  assert.deepEqual(
    wide.rows.map((r) => r.id),
    ['Private', 'Rotation'],
  );
  assert.deepEqual(
    wide.survivors.map((r) => r.id),
    ['Rotation'],
  );
  const filtered = accessState(
    snapshot(5, { 'Return to one slot': 1, 'check eligibility during': 1, 'Rotation takes': 1 }),
  );
  assert.equal(filtered.k, 1);
  assert.equal(filtered.rows[0].id, 'Rotation');
  const pending = shortlist(snapshot(3));
  const one = shortlist(snapshot(4));
  const open = shortlist(snapshot(4, { 'Widen the shortlist to two': 1 }));
  const moving = shortlist(
    snapshot(4, {
      'Widen the shortlist to two': 1,
      'D now gets a slot': 1,
      "Fetch D's original vector": 0.5,
    }),
  );
  const two = shortlist(snapshot(5));
  assert.deepEqual(pending.rows.map((r) => r.selected), [false, false]);
  assert.equal(one.k, 1);
  assert.equal(one.fetched, 1);
  assert.deepEqual(one.order.map((r) => r.id), ['C']);
  assert.equal(open.k, 2);
  assert.equal(open.rows[1].selected, false);
  assert.equal(moving.rows[1].travel, 0.5);
  assert.equal(moving.rows[1].scored, false);
  assert.equal(moving.fetched, 1);
  assert.equal(two.k, 2);
  assert.equal(two.fetched, 2);
  assert(two.ranked);
  assert.deepEqual(two.order.map((r) => r.id), ['D', 'C']);
  assert.deepEqual(
    [...one.rows, ...two.rows].map((r) => r.repr),
    Array.from({ length: 4 }, () => [1, 0.2]),
  );
  two.rows.forEach((r) => near(r.codeScore, 0.2 / Math.hypot(1, 0.2)));
  assert(two.rows[0].score < two.rows[1].score);
  near(two.rows[1].score, 0.28);
  return true;
}
export default { title: 'What Distance Means in an Embedding Space', draw, check };

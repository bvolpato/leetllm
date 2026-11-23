import assert from 'node:assert/strict';
import {
  ACTUALS,
  DISPLAY_ORDER,
  PREDICTIONS,
  ROUTER,
  SCALES,
  TEST_OUTCOMES,
  TEST_PREDICTIONS,
  TEST_SCALES,
} from '../../../films/conformal/fixtures.mjs';

export const calibration = PREDICTIONS.map((forecast, i) => ({
  id: 'C' + (i + 1),
  forecast,
  actual: ACTUALS[i],
  scale: SCALES[i],
  error: Math.abs(forecast - ACTUALS[i]),
  ratio: Math.abs(forecast - ACTUALS[i]) / SCALES[i],
}));
export const shuffled = DISPLAY_ORDER.map((i) => calibration[i]);
export function select(scores, target) {
  const ordered = [...scores].sort((a, b) => a - b);
  const rank = Math.ceil((scores.length + 1) * target);
  return { ordered, rank, index: rank - 1, q: ordered[rank - 1] ?? Infinity };
}
export const errors = calibration.map((r) => r.error);
export const fixed = select(errors, 0.8);
export const normalized = select(
  calibration.map((r) => r.ratio),
  0.8,
);
export const band = (center, q, arrival) => ({
  center,
  q,
  lo: center - q,
  hi: center + q,
  width: q * 2,
  arrival,
  hit: arrival == null ? null : Math.abs(arrival - center) <= q,
});
export function testRows(radii, last = TEST_OUTCOMES[3]) {
  return TEST_PREDICTIONS.map((p, i) => ({
    ...band(p, radii[i], i === 3 ? last : TEST_OUTCOMES[i]),
    id: 'T' + (i + 1),
    scale: TEST_SCALES[i],
  }));
}
export const fixedRadii = TEST_SCALES.map(() => fixed.q);
export const scaledRadii = TEST_SCALES.map((s) => normalized.q * s);
export const counting = Array.from({ length: 10 }, (_, i) => i + 1);
export function trial(scores, i) {
  const selected = select(
    scores.filter((_, j) => j !== i),
    0.8,
  );
  return { ...selected, future: scores[i], hit: scores[i] <= selected.q };
}
export const confident = [0.98, 0.01, 0.005, 0.005],
  equal = [0.25, 0.25, 0.25, 0.25],
  edge = [0.05, 0.55, 0.05, 0.35];
export const classRows = Array.from({ length: 9 }, (_, i) => {
  const p = (55 + i * 5) / 100;
  return [p, ...Array(3).fill((1 - p) / 3)];
});
export function pieces(ps) {
  const parts = ps.map((p, id) => ({ p, id })).sort((a, b) => b.p - a.p || a.id - b.id);
  let total = 0;
  return parts.map((r) => {
    const start = total;
    total += r.p;
    return { ...r, start, end: total };
  });
}
export const soft = select(
  classRows.map((row) => 1 - row[0]),
  0.8,
);
export const cumulative = select(
  classRows.map((row) => pieces(row).find((r) => r.id === 0).end),
  0.8,
);
export function sets(ps, q = cumulative.q) {
  const parts = pieces(ps),
    within = (r) => r.end <= q + 1e-10;
  const firstOver = parts.findIndex((r) => !within(r));
  return {
    parts,
    individual: parts.filter((r) => 1 - r.p <= soft.q + 1e-10).map((r) => r.id),
    direct: parts.filter(within).map((r) => r.id),
    cross: parts.slice(0, firstOver < 0 ? parts.length : firstOver + 1).map((r) => r.id),
  };
}
export function mixture(short) {
  const groups = [
    { name: 'Short', n: short, rate: 0.96 },
    { name: 'Long', n: 1000 - short, rate: 0.54 },
  ].map((g) => ({ ...g, hits: g.n * g.rate }));
  return { groups, hits: groups.reduce((n, g) => n + g.hits, 0) };
}
export const router = ROUTER;
export function routed(lambda) {
  const sent = router.filter((r) => r.score > lambda),
    wrong = sent.filter((r) => r.wrong).length;
  const corrected = (wrong + 1) / (router.length + 1);
  return { lambda, sent, wrong, corrected, pass: corrected <= 0.25 };
}
export const tickets = Array.from({ length: 100 }, (_, i) => ({
  set: i < 90 ? ['B', 'T'] : ['B'],
  truth: 'T',
}));
export const finalErrors = [...Array(17).fill(6), 7, 12];
export function finalRun(changed, arrival) {
  const scores = [...finalErrors];
  if (changed) scores[17] += 1;
  const cal = select(scores, 0.9),
    response = band(52, cal.q, arrival);
  return {
    ...cal,
    ...response,
    deadline: 55,
    late: arrival == null ? null : Math.max(0, arrival - 55),
  };
}
export function checkModel() {
  assert.deepEqual(
    [38, 42, 43].map((m) => band(40, 2, m).hit),
    [true, true, false],
  );
  const fourteen = Array.from({ length: 14 }, (_, i) => i + 1);
  assert.deepEqual([select(fourteen, 0.9).q, select(fourteen, 0.95).q], [14, Infinity]);
  assert.deepEqual([band(60, 14, null).lo, band(60, 14, null).hi], [46, 74]);
  assert.deepEqual(errors, [2, 3, 3, 4, 5, 6, 7, 8, 12]);
  assert.deepEqual([fixed.rank, fixed.q], [8, 8]);
  assert.deepEqual(
    [0.85, 0.9, 0.95].map((t) => select(errors, t).q),
    [12, 12, Infinity],
  );
  assert.equal(Math.ceil(((errors.length - 1) * fixed.rank) / errors.length), 8);
  assert.equal(select(Array(19).fill(1), 0.95).rank, 19);
  assert.deepEqual(
    counting.map((_, i) => trial(counting, i).hit),
    [true, true, true, true, true, true, true, true, false, false],
  );
  assert.equal(trial(Array(10).fill(0), 9).hit, true);
  assert.deepEqual(
    [55, 52].map((a) => testRows(fixedRadii, a).filter((r) => r.hit).length),
    [3, 4],
  );
  assert.equal(soft.q, 0.4);
  assert.equal(cumulative.q, 0.9);
  for (const [ps, want] of [
    [confident, [[0], [], [0]]],
    [equal, [[], [0, 1, 2], [0, 1, 2, 3]]],
    [edge, [[], [1, 3], [1, 3, 0]]],
  ]) {
    const a = sets(ps);
    assert.deepEqual([a.individual, a.direct, a.cross], want);
  }
  assert.deepEqual(sets(equal, 1).cross, [0, 1, 2, 3]);
  assert.deepEqual([mixture(750).hits, mixture(500).hits], [855, 750]);
  assert.deepEqual(normalized.ordered, [1, 1.5, 1.5, 5 / 3, 7 / 4, 2, 2, 2, 3]);
  assert.equal(normalized.q, 2);
  assert.deepEqual(
    testRows(scaledRadii).map((r) => [r.lo, r.hi, r.hit]),
    [
      [34, 46, true],
      [35, 49, true],
      [34, 42, true],
      [32, 56, true],
    ],
  );
  for (const [lambda, s, w, c] of [
    [0.1, 8, 2, 0.3],
    [0.6, 3, 1, 0.2],
    [1, 0, 0, 0.1],
  ]) {
    const r = routed(lambda);
    assert.deepEqual([r.sent.length, r.wrong, r.corrected], [s, w, c]);
  }
  assert.equal(tickets.filter((r) => r.set.includes(r.truth)).length, 90);
  assert.equal(tickets.filter((r) => r.set.length === 1 && !r.set.includes(r.truth)).length, 10);
  for (const [changed, a, lo, hi, hit, late] of [
    [false, 59, 45, 59, true, 4],
    [false, 60, 45, 59, false, 5],
    [true, 60, 44, 60, true, 5],
  ]) {
    const r = finalRun(changed, a);
    assert.deepEqual([r.rank, r.lo, r.hi, r.hit, r.late], [18, lo, hi, hit, late]);
  }
  return true;
}

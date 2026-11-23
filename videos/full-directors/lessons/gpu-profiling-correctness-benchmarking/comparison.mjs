import assert from 'node:assert/strict';
import { pairedRounds } from '../../../films/gpu-profiling-correctness-benchmarking/fixtures.mjs';
import { interpolatedQuantile } from '../../../films/gpu-profiling-correctness-benchmarking/model.mjs';
import {
  C,
  text,
  mono,
  box,
  line,
  path,
  dot,
  bracket,
  page,
  note,
  cue,
  f,
} from './instruments.mjs';

const samples = [40, 8, 16, 10, 14, 12],
  mid = interpolatedQuantile(samples, 0.5),
  tail = interpolatedQuantile(samples, 0.9);
export function drawDistribution(g, c) {
  const sort = cue(c, 0, 'Sort a copy', 0.8),
    p50 = cue(c, 0, 'The ninetieth percentile'),
    p90 = cue(c, 0, 'What value lies there'),
    answer = cue(c, 1, 'The median is thirteen');
  page(g, 'Where did the slow first launch go?', 'event samples   /   six individual launches');
  const x = (i) => 520 + i * 231;
  for (const [r, values] of [samples, mid.sorted].entries()) {
    const y = 367 + 246 * r;
    text(g, r ? 'Sorted copy' : 'Acquired', 90, y, 40, C.ink, 'left', 'Serif');
    values.forEach((value, i) => {
      box(g, x(i) - 75, y - 53, 150, 106, C.white, C.grid, 12);
      if (!r || i < Math.ceil(sort * values.length)) {
        if (value === 40) box(g, x(i) - 74, y - 52, 148, 104, C.b, null, 11);
        mono(g, value, x(i), y, 47, value === 40 ? C.white : C.ink, 'center');
      }
      mono(g, i, x(i), y + 91, 26, C.muted, 'center');
    });
  }
  text(g, 'Index', 92, 458, 30, C.muted);
  text(g, 'Rank index', 92, 704, 30, C.muted);
  if (p50) bracket(g, x(mid.lo), x(mid.hi), 745, 'p50 = ' + mid.value + ' µs', C.teal, true);
  if (p90)
    bracket(
      g,
      x(tail.lo),
      x(tail.hi),
      745,
      answer ? 'p90 = ' + tail.value + ' µs' : 'p90 = ?',
      C.b,
      true,
    );
  mono(g, 'Position = q × (N − 1)', 95, 841, 36);
  if (p90) mono(g, '0.90 × 5 = ' + tail.position, 1805, 842, 36, C.b, 'right');
  note(g, 'Elapsed time in microseconds   ·   sort a copy and retain the acquisition order.');
}

function summarize(raw) {
  const medianFor = (arm) =>
    interpolatedQuantile(
      raw.filter(([label]) => label === arm).map(([, v]) => v),
      0.5,
    ).value;
  const a = medianFor('A'),
    b = medianFor('B');
  return { a, b, ratio: a / b };
}
export function roundState(c) {
  const first = cue(c, 0, 'The first round gives', 2.0),
    second = cue(c, 1, 'A takes eight', 2.0);
  const firstResult = cue(c, 1, 'B wins'),
    secondResult = cue(c, 2, 'The new line slopes');
  return pairedRounds.map((raw, i) => {
    const seen = Math.floor((i === 0 ? first : second) * raw.length);
    return {
      ratioShown: i === 0 ? firstResult : cue(c, 2, 'The candidate lost its lead'),
      raw: raw.slice(0, seen),
      summary: (i ? secondResult : firstResult) && seen === raw.length ? summarize(raw) : null,
    };
  });
}
export function drawRounds(g, c) {
  const rounds = roundState(c);
  page(g, 'Did the candidate get slower?', 'matched timings   /   constructed ABBA rounds', true);
  mono(g, 'Acquisition order   →', 95, 281, 32, C.faint);
  mono(g, 'Median time (µs)', 1192, 281, 32, C.faint);
  const ax = 1290,
    bx = 1645,
    y = (v) => 660 - (v - 9) * 90;
  for (const v of [9, 10, 11, 12]) {
    line(g, ax - 45, y(v), bx + 95, y(v), C.gridDark);
    mono(g, v, ax - 65, y(v), 27, C.faint, 'right');
  }
  for (const [i, row] of rounds.entries()) {
    const top = 367 + i * 249;
    text(g, 'Round ' + (i + 1), 90, top + 46, 40, i === 0 ? C.mint : C.amber, 'left', 'Serif');
    for (let j = 0; j < 4; j++) {
      const owner = pairedRounds[i][j][0],
        val = row.raw[j]?.[1],
        px = 296 + 185 * j;
      box(g, px, top, 158, 141, C.gridDark, null, 9);
      mono(g, owner, px + 79, top + 36, 31, owner === 'A' ? C.blue : C.salmon, 'center');
      mono(
        g,
        val === undefined ? '·' : val + ' µs',
        px + 79,
        top + 98,
        38,
        val === undefined ? C.faint : C.light,
        'center',
      );
    }
    const s = row.summary;
    if (s) {
      const ink = i === 0 ? C.mint : C.amber;
      path(
        g,
        [
          [ax, y(s.a)],
          [bx, y(s.b)],
        ],
        ink,
        7,
      );
      dot(g, ax, y(s.a), 10, ink);
      dot(g, bx, y(s.b), i === 0 ? 14 : 7, ink);
      mono(
        g,
        'R' + (i + 1) + (row.ratioShown ? '   ' + f(s.ratio, 2) + '×' : ''),
        (ax + bx) / 2,
        (y(s.a) + y(s.b)) / 2 + (i === 0 ? -74 : 60),
        32,
        ink,
        'center',
      );
    }
  }
  mono(g, 'A', ax, 762, 35, C.blue, 'center');
  mono(g, 'B', bx, 762, 35, C.salmon, 'center');
  if (rounds[1].summary) mono(g, 'Both B medians = 10 µs', 1500, 837, 32, C.salmon, 'center');
  note(
    g,
    'Round speedup = baseline median ÷ candidate median   ·   a value above one favors B.',
    true,
  );
}
export function checkComparisons(clock) {
  assert.deepEqual([mid.position, mid.value, tail.position, tail.value], [2.5, 13, 4.5, 28]);
  assert.deepEqual(samples, [40, 8, 16, 10, 14, 12]);
  const first = roundState(clock(0, 1));
  assert.equal(first[0].raw.length, 4);
  assert.equal(first[0].summary, null);
  const awaiting = roundState(clock(1, 1));
  assert.equal(awaiting[1].summary, null);
  assert.deepEqual(awaiting[1].raw, pairedRounds[1]);
  const results = roundState(clock(2, 1)).map((row) => row.summary);
  assert.deepEqual(results, [
    { a: 12, b: 10, ratio: 1.2 },
    { a: 9, b: 10, ratio: 0.9 },
  ]);
}

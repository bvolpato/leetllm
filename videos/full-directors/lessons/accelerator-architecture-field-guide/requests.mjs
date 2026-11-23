import assert from 'node:assert/strict';
import {
  hardwareDecision,
  serviceTrace,
} from '../../../films/accelerator-architecture-field-guide/arithmetic.mjs';
import { C, base, box, cue, dot, foot, num, path, txt } from './drawing.mjs';

const reference = 19,
  tol = 0.01 + 0.002 * Math.abs(reference);
function passes(v) {
  return Number.isFinite(v) && Math.abs(v - reference) <= tol;
}
function quality(g, k) {
  const a = k.reveal('Nineteen point zero four', 0),
    b = k.reveal('Nineteen point zero eight', 0);
  base(
    g,
    'Hardware selection   /   numerical accuracy',
    'How far may this cell move?',
    'Reference output 19  •  absolute tolerance 0.01  •  relative tolerance 0.002',
  );
  const x = (v) => 223 + (v - 18.91) * 8020,
    y = 530;
  const lo = reference - tol,
    hi = reference + tol;
  box(g, x(lo), y - 100, x(hi) - x(lo), 202, C.mint, C.teal);
  txt(g, 'allowed error ±' + tol.toFixed(3), x(19), y - 139, 46, C.teal, 'center', 'Serif');
  path(
    g,
    [
      [x(18.91), y],
      [x(19.1), y],
    ],
    C.dim,
  );
  for (const [v, s] of [
    [lo, lo.toFixed(3)],
    [19, '19'],
    [hi, hi.toFixed(3)],
  ]) {
    path(
      g,
      [
        [x(v), y - 15],
        [x(v), y + 117],
      ],
      C.teal,
      2,
    );
    txt(g, s, x(v), y + 159, 37, C.ink, 'center', 'Mono');
  }
  for (const [v, seen] of [
    [19.04, a],
    [19.08, b],
  ])
    if (seen) {
      const color = passes(v) ? C.teal : C.fault;
      dot(g, x(v), y, 15, color);
      txt(g, v.toFixed(2), x(v), y - 51, 36, color, 'center', 'Mono', 600);
    }
  foot(
    g,
    b
      ? '19.08 falls outside the band. Investigate before timing.'
      : a
        ? '19.04 lies inside the band.'
        : 'Allowed error = absolute tolerance + relative tolerance × |reference|',
    'Check representative tasks and unexpected NaN or infinity as well.',
  );
}
function fit(g, k) {
  const burst = k.reveal('Raise workspace during a burst', 0) > 0;
  const entries = [
    ['Weights', 16, C.paleGold],
    ['KV pool', 5, C.paleBlue],
    ['Workspace', burst ? 5 : 3, C.mint],
  ];
  const cap = 24,
    used = entries.reduce((s, [, v]) => s + v, 0),
    x = 121,
    pitch = 61,
    cy = 490;
  base(
    g,
    'Hardware selection   /   peak allocation',
    'Does the burst fit on this device?',
    'Hypothetical device • 24 decimal GB available • live histories already occupy the allocated KV pool',
  );
  let usedX = x;
  for (const [label, gb, fill] of entries) {
    const w = gb * pitch;
    box(g, usedX, cy, w - 3, 151, fill, C.dim);
    txt(g, label, usedX + w / 2, cy + 45, 34, C.ink, 'center');
    txt(g, gb + ' GB', usedX + w / 2, cy + 104, 39, C.ink, 'center', 'Mono');
    usedX += w;
  }
  const edge = x + cap * pitch;
  path(
    g,
    [
      [edge, 381],
      [edge, cy - 2],
    ],
    C.fault,
    5,
  );
  path(
    g,
    [
      [edge, cy + 153],
      [edge, 710],
    ],
    C.fault,
    5,
  );
  txt(g, 'Device limit 24 GB', edge, 337, 36, C.fault, 'center');
  txt(g, used + ' GB requested', x, 739, 47, used > cap ? C.fault : C.teal, 'left', 'Serif');
  foot(
    g,
    used > cap
      ? used - cap + ' GB over the limit at peak. Revise the configuration.'
      : 'The baseline consumes all available capacity.',
    'Include captures, communication buffers and workspace. Measure peak allocations and test admission.',
  );
}
const traces = [serviceTrace(2), serviceTrace(1)];
function pair(g, k) {
  const id = k.beat.id,
    moved = id === 'recount' || cue(k, 'goodput', 'Move the long generation gaps', 0) > 0;
  const d = traces[Number(moved)];
  const punched = ['goodput', 'recount'].includes(id) || cue(k, 'holes', 'Punch out', 0) > 0;
  const recount = cue(k, 'recount', 'Exclude R one once', 0) > 0;
  const p95 = id === 'goodput' || id === 'recount' || cue(k, 'holes', 'Rank nineteen', 0) > 0;
  const pending = moved && !recount;
  const count = punched && !pending;
  base(
    g,
    'Serving trace   /   paired request times',
    'Which IDs meet both limits?',
    '20 successful requests   •   first-token time < 450 ms   •   mean later gap < 45 ms',
  );
  const x = 326,
    w = 145,
    banks = [309, 565];
  for (const [i, r] of d.requests.entries()) {
    const col = i % 10,
      row = Math.floor(i / 10),
      xx = x + col * w,
      y = banks[row];
    const okA = r.firstMs < 450,
      okB = r.laterMs < 45;
    const kept = okA && okB;
    const known = punched && !(pending && i === 1);
    box(g, xx, y - 19, w - 8, 178, C.white, C.line, 2);
    txt(g, 'R' + r.id, xx + (w - 8) / 2, y + 9, 32, C.ink, 'center', 'Mono', 600);
    txt(g, r.firstMs, xx + (w - 8) / 2, y + 69, 36, okA ? C.ink : C.fault, 'center', 'Mono', 600);
    txt(g, r.laterMs, xx + (w - 8) / 2, y + 124, 36, okB ? C.ink : C.fault, 'center', 'Mono', 600);
    const cy = y + 191;
    if (known && kept) {
      box(g, xx + 7, cy - 20, w - 22, 41, C.teal);
      txt(g, 'R' + r.id, xx + (w - 8) / 2, cy, 26, C.white, 'center', 'Mono', 600);
    } else {
      box(g, xx + 7, cy - 20, w - 22, 41, null, known ? C.fault : C.line, 2);
      if (known) {
        path(
          g,
          [
            [xx + 15, cy + 13],
            [xx + w - 23, cy - 13],
          ],
          C.fault,
          2,
        );
      } else txt(g, '?', xx + (w - 8) / 2, cy, 25, C.dim, 'center');
    }
  }
  for (const y of banks) {
    txt(g, 'Request', 85, y + 9, 31, C.dim);
    txt(g, 'First · ms', 85, y + 69, 32, C.ink);
    txt(g, 'Gap · ms', 85, y + 124, 32, C.ink);
    txt(g, 'Meets both', 85, y + 191, 32, C.teal);
  }
  const rate = d.eligibleTokens / d.seconds;
  let line = 'Read down each column. Keep the first token and later gaps together.';
  if (count)
    line =
      d.joint.length +
      ' of 20 complete pairs     •     ' +
      d.first.length +
      ' pass first     •     ' +
      d.later.length +
      ' pass later';
  if (id === 'goodput' && !pending)
    line =
      num(d.eligibleTokens) + ' eligible tokens / ' + d.seconds + ' s  =  ' + rate + ' token/s';
  if (pending) line = 'R1 now owns both misses. How many requests qualify?';
  if (recount)
    line = d.joint.length + ' × 100 tokens / ' + d.seconds + ' s  =  ' + rate + ' token/s';
  foot(
    g,
    line,
    p95
      ? 'Separate nearest-rank p95s (rank 19)     ' +
          d.p95First +
          ' ms first  ·  ' +
          d.p95Later +
          ' ms later     /     joint target 19 of 20'
      : 'A request average can hide a long gap between two tokens.',
  );
}
const candidates = hardwareDecision();
function choice(g, k) {
  const resolved = k.beat.id === 'select';
  const selected = cue(k, 'select', 'Select B', 0) > 0;
  const priced = cue(k, 'select', 'The whole window costs', 0) > 0;
  const costResult = cue(k, 'select', 'gives twenty thousand', 0) > 0;
  const rank = cue(k, 'select', 'Take rank ten', 0) > 0;
  base(
    g,
    'Fresh workload   /   candidate decision',
    'Which machine meets the first-token deadline?',
    '10 requests × 40 output tokens per machine • quality, fit and later gaps already pass',
  );
  const xx = (n) => 457 + n * 2.67,
    cut = 300;
  for (let t = 0; t <= 450; t += 50) {
    const x = xx(t);
    path(
      g,
      [
        [x, 336],
        [x, 766],
      ],
      t === cut ? C.fault : C.line,
      t === cut ? 4 : 1,
    );
    txt(g, t + ' ms', x, 791, 27, C.dim, 'center', 'Mono');
  }
  txt(g, 'Deadline ' + cut + ' ms', xx(cut), 301, 36, C.fault, 'center');
  for (const [i, d] of candidates.entries()) {
    const y = 366 + i * 208;
    txt(g, 'Machine ' + d.id, 83, y + 40, 46, C.ink, 'left', 'Serif');
    txt(g, d.seconds + ' s window', 86, y + 93, 30, C.dim);
    for (let j = 0; j < d.first.length; j++) {
      const time = d.first[j],
        cy = y + j * 13,
        mark = rank && j === d.first.length - 1;
      path(
        g,
        [
          [xx(0), cy],
          [xx(time), cy],
        ],
        '#d0d7cd',
        2,
      );
      dot(g, xx(time), cy, mark ? 13 : 6, mark ? (d.eligible ? C.teal : C.fault) : C.blue);
      if (mark) {
        const left = time < cut;
        txt(
          g,
          'p95  ' + time + ' ms',
          xx(time) + (left ? -22 : 22),
          cy + 29,
          30,
          d.eligible ? C.teal : C.fault,
          left ? 'right' : 'left',
          'Mono',
          600,
        );
      }
    }
    if (!rank) {
      const runs = new Map();
      for (const ms of d.first) runs.set(ms, 1 + (runs.get(ms) || 0));
      for (const [ms, n] of runs) {
        const left = ms === 250,
          yy = y + (n === 1 ? 101 : 32);
        const x = xx(ms) + (left ? -18 : 18);
        box(g, left ? x - 206 : x - 3, yy - 20, 208, 39, C.paper);
        txt(g, n + ' at ' + ms, x, yy, 29, C.blue, left ? 'right' : 'left', 'Mono');
      }
    }
  }
  const b = candidates[1];
  let msg = 'Nearest rank = ceiling(0.95 × 10). Find that request on each track.';
  if (resolved && rank)
    msg = 'Rank 10       A  ' + candidates[0].p95First + ' ms       B  ' + b.p95First + ' ms';
  if (selected) msg = 'B meets the deadline. All ' + b.requestEligibleTokens + ' tokens qualify.';
  if (priced)
    msg =
      'B     ' +
      b.requestEligibleTokens +
      ' eligible tokens    /    $' +
      b.cost.toFixed(2) +
      ' for the whole window';
  if (costResult)
    msg =
      'B     ' +
      b.eligibleGoodput +
      ' useful tokens/s     •     ' +
      num(b.tokensPerDollar) +
      ' eligible tokens per dollar';
  foot(g, msg, 'Compare the complete interval at the same workload and measurement boundaries.');
}
export function requests(g, k) {
  const id = k.beat.id;
  if (id === 'quality') quality(g, k);
  else if (id === 'fit') fit(g, k);
  else if (id === 'select' || id === 'candidates') choice(g, k);
  else pair(g, k);
}
export function checkRequests() {
  assert.equal(tol, 0.048);
  assert(passes(19.04));
  assert(!passes(19.08));
  assert(!passes(NaN));
  for (const [i, d] of traces.entries()) {
    const holes = d.requests.filter((r) => !d.joint.includes(r)).map((r) => r.id);
    assert.deepEqual(holes, i ? [1] : [1, 2]);
    assert.equal(d.first.length, 19);
    assert.equal(d.later.length, 19);
    assert.deepEqual([d.p95First, d.p95Later], [100, 20]);
    assert.equal(d.eligibleTokens / d.seconds, i ? 190 : 180);
  }
  assert.deepEqual(
    candidates.map((c) => [c.p95First, c.eligible, c.raw, c.tokensPerDollar]),
    [
      [400, false, 50, null],
      [250, true, 40, 20000],
    ],
  );
}

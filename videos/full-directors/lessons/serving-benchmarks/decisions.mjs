import {
  C,
  at,
  blend,
  box,
  bracket,
  clamp,
  dot,
  foot,
  headline,
  light,
  mono,
  panel,
  path,
  txt,
} from './bench.mjs';
import {
  cohort,
  arrivalWindow as arrivalWindowMs,
  counts,
  scored,
  unsent,
  missing,
  servingRequestMetrics,
  servingReceipt,
  rates,
  chosen,
  observedBudget,
  strictBudget,
  poolSize,
  meanSeconds,
  surge,
  fresh,
  freshReplay,
  wilsonLower,
  nearestRank,
  pool,
  worst,
} from './samples.mjs';

function outcome(r) {
  const m = servingRequestMetrics(r);
  if (r.status === 'timeout') return 'timeout';
  if (r.status === 'not_sent') return 'unsent';
  if (!r.quality) return 'task check failed';
  if (m.ttft > 300) return 'first token ' + m.ttft + ' ms';
  if (m.tpot === null) return 'qualified · 1 token';
  return 'qualified';
}
const ledgerTimeX = (ms) => 266 + ms * 0.432;
function ledger(c, rows, until, score) {
  const x = ledgerTimeX;
  mono(c, 'ID', 118, 298, 25, C.dim);
  mono(c, 'SEND TO TERMINAL   /   ms', x(0), 298, 26, C.dim);
  mono(c, 'OUTCOME', 1442, 298, 25, C.dim);
  box(c, x(2000), 335, x(2500) - x(2000), 381, '#e4d4b3');
  rows.forEach((r, i) => {
    const y = 371 + i * 60,
      ended = r.terminal <= until,
      accepted = servingRequestMetrics(r).qualified;
    const col = ended && ((score && !accepted) || r.status === 'timeout') ? C.red : C.green;
    mono(c, r.id, 117, y, 33, C.ink);
    path(
      c,
      [
        [x(r.sent), y],
        [x(Math.min(r.terminal, until)), y],
      ],
      col,
      8,
    );
    dot(c, x(r.sent), y, 7, C.ink);
    if (ended) dot(c, x(r.terminal), y, 12, col);
    txt(
      c,
      ended ? (score ? outcome(r) : r.status === 'timeout' ? 'timeout' : 'success') : 'pending',
      1442,
      y,
      32,
      col,
    );
  });
  path(
    c,
    [
      [x(2000), 324],
      [x(2000), 723],
    ],
    C.brass,
    3,
  );
  mono(c, '2 s  ·  arrivals close', x(2000) - 4, 758, 26, C.dim, 'right');
  mono(c, '2.5 s', x(2500), 758, 26, C.dim, 'center');
}
function scoreTray(c, k) {
  const b = k.beat.beatIndex;
  const removed = b === 4 || at(k, 'removing the timeout');
  const restore = b === 4 && at(k, 'Record its ID');
  const original = b === 4 && at(k, 'The complete original file');
  const rows = original || !removed ? cohort : restore ? unsent : missing;
  const current = scored(rows);
  const reveal = b === 4 && (original ? at(k, 'It exits zero') : restore ? at(k, 'Exit two') : at(k, 'gives exit one'));
  txt(c, 'Manifest', 96, 320, 37, C.green, { bold: true });
  txt(c, 'Outcomes', 96, 512, 37, C.green, { bold: true });
  for (let i = 0; i < 6; i++) {
    const x = 370 + i * 241,
      r = rows[i];
    box(c, x, 283, 189, 76, C.green, 9);
    mono(c, cohort[i].id, x + 94, 322, 35, C.pale, 'center');
    path(
      c,
      [
        [x + 95, 361],
        [x + 95, 456],
      ],
      r ? C.dim : C.red,
      3,
      r ? [] : [7, 10],
    );
    box(c, x, 460, 189, 116, r ? C.pale : '#e6cdb8', 9);
    mono(c, r ? r.id : '?', x + 94, 496, 35, r ? C.ink : C.red, 'center');
    txt(c, r ? r.status : 'missing', x + 94, 548, 27, r?.status === 'success' ? C.green : C.red, {
      align: 'center',
    });
  }
  if (restore && !original)
    mono(
      c,
      'r06    sent = null    tokens = []    terminal = 2500 ms    quality = false',
      960,
      661,
      31,
      C.ink,
      'center',
    );
  if (reveal) {
    mono(c, 'EXIT  ' + current.exit, 123, 789, 60, current.exit ? C.red : C.green);
    const line = current.report
      ? current.report.offered +
        ' offered   /   ' +
        current.report.success +
        ' successes   /   ' +
        current.report.qualified +
        ' qualified'
      : 'Incomplete input   /   no valid report';
    txt(c, line, 616, 789, 43, C.ink);
  } else txt(c, 'Can this run be scored?', 960, 788, 46, C.ink, { align: 'center', face: 'Serif' });
  foot(
    c,
    original
      ? 'The original timeout record returns. The observed attainment is still 50%.'
      : restore
        ? 'In this separate case, the send log confirms that r06 never left the client.'
        : removed
          ? 'The manifest still expects r06.'
          : 'Every scheduled ID needs exactly one terminal accounting record.',
  );
}
export function accounting(c, k) {
  const b = k.beat.beatIndex;
  headline(c, 5, b < 3 ? 'Who stays in the denominator?' : 'Match each outcome to its manifest ID');
  if (b >= 3) {
    scoreTray(c, k);
    return;
  }
  const until =
    b === 0 ? Math.round(blend(2000, 2500, at(k, 'Follow the final request', 1.5))) : 2500;
  ledger(c, cohort, until, b >= 1);
  const report = servingReceipt(cohort);
  const completionSeconds = (report.horizon / 1000).toFixed(1);
  const arrivalSeconds = (arrivalWindowMs / 1000).toFixed(1);
  const completionWindow = b === 2 ? at(k, 'five successes', 0.65) : 0;
  const arrivalWindow = b === 2 ? at(k, 'The two-second arrival window', 0.65) : 0;
  if (completionWindow > 0) {
    bracket(c, ledgerTimeX(0), ledgerTimeX(report.horizon * completionWindow), 778, '', C.green);
    mono(c, 'Completion horizon', 1442, 778, 26, C.green);
  }
  if (arrivalWindow > 0) {
    bracket(c, ledgerTimeX(0), ledgerTimeX(arrivalWindowMs * arrivalWindow), 812, '', C.red);
    mono(c, 'Arrival window', 1442, 812, 26, C.red);
  }

  if (b === 0) {
    const v = counts(cohort, until);
    mono(c, v.completed + ' terminal    ' + v.pending + ' pending', 960, 833, 37, C.ink, 'center');
  } else if (b === 1)
    mono(
      c,
      'Success   +   task pass   +   TTFT ≤ 300 ms   +   TPOT ≤ 80 ms when applicable',
      960,
      834,
      29,
      C.green,
      'center',
    );
  else {
    mono(
      c,
      report.qualified + '/' + report.offered + ' = ' + Math.round(100 * report.attainment) + '%',
      128,
      850,
      37,
      C.ink,
    );
    if (completionWindow === 1)
      mono(
        c,
        report.success + '/' + completionSeconds + ' = ' + report.successRps.toFixed(1) + ' success/s',
        426,
        850,
        33,
        C.green,
      );
    if (at(k, 'Three qualified responses'))
      mono(
        c,
        report.qualified + '/' + completionSeconds + ' = ' + report.qualifiedRps + ' qualified/s',
        875,
        850,
        33,
        C.green,
      );
    if (arrivalWindow === 1)
      mono(
        c,
        report.offered + '/' + arrivalSeconds + ' = ' + report.offeredRps.toFixed(1) + ' offered/s',
        1375,
        850,
        33,
        C.red,
      );
  }
  if (b < 2)
    mono(
      c,
      b === 0
        ? 'Which IDs belong in the denominator?'
        : 'R03 misses latency · R05 fails quality · R06 times out',
      122,
      873,
      27,
      C.ink,
    );
}
function queueTrace(c, x, y, w, p, trend) {
  const yy =
    trend === 'flat' ? [0, 0, -0.16, 0, 0, -0.1, 0] : [0, -0.1, -0.15, -0.38, -0.47, -0.69, -1];
  path(
    c,
    [
      [x, y + 12],
      [x + w, y + 12],
    ],
    C.ridge,
    2,
  );
  const points = [[x, y]];
  for (let i = 1; i < yy.length; i++) {
    const u = clamp(p * (yy.length - 1) - (i - 1));
    if (!u) break;
    points.push([x + (w * (i - 1 + u)) / (yy.length - 1), y + 32 * blend(yy[i - 1], yy[i], u)]);
  }
  path(c, points, trend === 'flat' ? C.mint : C.peach, 6);
}
function sweepPlot(c, k) {
  const b = k.beat.beatIndex;
  const progress = b > 0 ? 1 : at(k, 'Follow the queue recorder', 2.6);
  txt(c, 'Require ≥95% qualified, lag ≤20 ms, and a stable queue', 96, 262, 35, C.amber);
  if (b === 2 && at(k, 'Mark one point five')) {
    const next = rates[rates.indexOf(chosen) + 1];
    const left = 445, right = 1475, y = 503;
    for (const [row, x, label, color] of [
      [chosen, left, 'Highest tested pass', C.mint],
      [next, right, 'Next tested run fails', C.peach],
    ]) {
      mono(c, row.rps.toFixed(1) + ' calls/s', x, 397, 72, C.pale, 'center');
      dot(c, x, y, 18, color);
      txt(c, label, x, 592, 54, color, { align: 'center', bold: true });
      txt(c, Math.round(100 * row.attainment) + '% qualified', x, 690, 48, C.pale, { align: 'center' });
      txt(c, row.maxLag + ' ms lag · ' + row.backlog + ' queue', x, 765, 43, C.pale, { align: 'center' });
    }
    const gap = at(k, 'The interval up to two', 0.4);
    if (gap > 0) {
      path(c, [[left + 26, y], [blend(left + 26, 825, gap), y]], C.brass, 4);
      path(c, [[right - 26, y], [blend(right - 26, 1095, gap), y]], C.brass, 4);
      txt(c, 'Untested', 960, y, 52, C.amber, { align: 'center' });
    }
    return;
  }
  const x = (i) => 559 + i * 285,
    yy = (p) => 574 - p * 210;
  mono(c, 'Attainment', 100, 395, 30, C.mint);
  path(
    c,
    [
      [373, yy(0.95)],
      [1797, yy(0.95)],
    ],
    C.brass,
    2,
    [10, 10],
  );
  for (const p of [0, 0.5, 1]) mono(c, Math.round(p * 100) + '%', 402, yy(p), 24, C.mint, 'right');
  mono(c, 'Offered calls/s', 98, 613, 29, C.mint);
  mono(c, 'Qualified / 200', 98, 675, 29, C.mint);
  mono(c, 'Max lag', 98, 736, 29, C.mint);
  mono(c, 'Queue trend¹', 98, 810, 29, C.mint);
  rates.forEach((r, i) => {
    const xx = x(i),
      pass = !!(r.attainment >= 0.95 && r.maxLag <= 20 && r.backlog === 'flat');
    path(
      c,
      [
        [xx, yy(0)],
        [xx, yy(r.attainment)],
      ],
      C.ridge,
      3,
    );
    dot(c, xx, yy(r.attainment), 13, C.pale);
    mono(c, Math.round(r.attainment * 100) + '%', xx, yy(r.attainment) - 41, 29, C.pale, 'center');
    mono(
      c,
      r.rps.toFixed(1),
      xx,
      613,
      36,
      C.pale,
      'center',
    );
    mono(c, Math.round(r.attainment * 200) + '', xx, 675, 31, C.pale, 'center');
    mono(c, r.maxLag + ' ms', xx, 736, 30, C.pale, 'center');
    const part = clamp(progress * 5 - i);
    if (part > 0) queueTrace(c, xx - 81, 827, 162, part, r.backlog);
    if (part === 1) txt(c, r.backlog, xx, 865, 24, pass ? C.mint : C.peach, { align: 'center' });
  });
  foot(
    c,
    '¹ Queue depth over time in each run. The traces illustrate the supplied trends.',
    true,
  );
}
function replica(c, k) {
  const b = k.beat.beatIndex;
  const computed = b === 4 || at(k, 'fifteen active requests');
  const { admittedRps, active, perReplica, replicas } = observedBudget;
  txt(c, 'Assume all 200 offered calls entered the pool of 3 replicas.', 102, 269, 36, C.mint);
  txt(
    c,
    admittedRps +
      ' admitted requests/s  ×  ' +
      meanSeconds +
      ' s mean time in pool  =  ' +
      (computed ? active + ' mean active' : '?'),
    960,
    369,
    44,
    C.pale,
    { align: 'center', face: 'Serif' },
  );
  for (let i = 0; i < poolSize; i++) {
    const x = 121 + i * 582;
    panel(c, x, 451, 514, 252);
    mono(c, 'REPLICA 0' + (i + 1), x + 53, 506, 27, C.mint);
    if (computed) {
      for (let j = 0; j < perReplica; j++) light(c, x + 83 + j * 87, 609, true, C.mint, 22);
    }
  }
  const show = b === 4 && at(k, 'Twenty replicas');
  if (computed) mono(
    c,
    surge +
      ' active ÷ ' +
      perReplica +
      ' mean active per replica = ' +
      (show ? replicas + ' replicas' : '?'),
    960,
    816,
    41,
    show ? C.amber : C.pale,
    'center',
  );
  foot(
    c,
    'This estimate assumes steady load, the same mix, and even routing. Allow margin for bursts.',
    true,
  );
}
export function sweep(c, k) {
  const b = k.beat.beatIndex;
  headline(
    c,
    6,
    b < 3
      ? 'Which tested load can the desk sustain?'
      : 'What replica budget follows from that run?',
    'dark',
  );
  if (b < 3) sweepPlot(c, k);
  else replica(c, k);
}
const percent = (x) => (100 * x).toFixed(1) + '%';
const confidenceRows = [
  [190, 200],
  [200, 200],
  [20, 20],
];
function boundPlot(c, k) {
  const b = k.beat.beatIndex,
    lower = b === 1 && at(k, 'ninety-one point eight'),
    more = b === 1 && at(k, 'Two hundred out of two hundred'),
    illustration = b === 1 && at(k, 'twenty perfect trials');
  const x = (p) => 570 + (p - 0.86) * 7980;
  txt(
    c,
    'Each row assumes independent trials with a constant pass probability at its own load.',
    100,
    276,
    31,
    C.dim,
  );
  const floor = x(0.95);
  path(
    c,
    [
      [floor, 365],
      [floor, 739],
    ],
    C.brass,
    4,
    [10, 7],
  );
  mono(c, '95% floor', floor, 330, 32, C.red, 'center');
  confidenceRows.slice(0, illustration ? 3 : more ? 2 : 1).forEach(([good, n], i) => {
    const y = 440 + i * 137,
      p = good / n,
      lo = wilsonLower(good, n);
    mono(c, good + ' / ' + n, 104, y - 12, 39, C.ink);
    txt(
      c,
      i === 0 ? '1.5 offered calls/s' : i === 1 ? '1.0 offered calls/s' : 'Separate illustration',
      105,
      y + 40,
      28,
      C.dim,
    );
    path(
      c,
      [
        [x(0.86), y],
        [x(1), y],
      ],
      C.rule,
      2,
    );
    const showBound = [lower, more && at(k, 'ninety-eight point seven'), illustration && at(k, 'eighty-eight point one')][i];
    if (showBound) {
      path(
        c,
        [
          [x(lo), y + 10],
          [x(1), y + 10],
        ],
        C.green,
        6,
      );
      path(
        c,
        [
          [x(lo), y - 3],
          [x(lo), y + 25],
        ],
        C.green,
        5,
      );
      mono(c, percent(lo) + ' lower', x(lo), y + 55, 28, C.green, 'center');
    }
    dot(c, x(p), y, 13, C.ink);
    mono(c, percent(p) + ' observed', x(p) - 1, y - 41, 27, C.ink, 'center');
  });
  for (const v of [0.86, 0.9, 0.95, 1])
    mono(c, Math.round(v * 100) + '%', x(v), 819, 27, C.dim, 'center');
  foot(
    c,
    lower
      ? 'Lower-bound rule   ·   compare the left end of each interval with the 95% floor.'
      : 'Observed-rate rule   ·   compare the dot with the 95% floor.',
  );
}
function rankComb(c, k) {
  const b = k.beat.beatIndex,
    reduce = b === 4 && at(k, 'Keep the worst gap'),
    showPooled = b === 4 || at(k, 'The nineteenth observation'),
    showWorst = b === 4 && at(k, 'Rank two');
  txt(c, 'A  /  long reply', 103, 284, 39, C.green, { bold: true });
  txt(c, 'B  /  short reply', 1396, 284, 39, C.red, { bold: true });
  mono(c, '19 gaps × 1 ms', 104, 354, 34, C.ink);
  mono(c, '1 gap × 100 ms', 1397, 354, 33, C.ink);
  const drawSlots = (arr, y, width, marked) => {
    const step = arr.length > 2 ? 78 : 299;
    arr.forEach((v, i) => {
      const xx = 205 + i * step,
        col = v === 100 ? C.red : C.green;
      box(c, xx, y, width, 77, col, 6);
      mono(c, v, xx + width / 2, y + 40, arr.length > 2 ? 25 : 36, C.pale, 'center');
      if (i === marked) {
        path(
          c,
          [
            [xx, y + 90],
            [xx + width, y + 90],
          ],
          C.ink,
          5,
        );
        mono(c, 'rank ' + (i + 1), xx + width / 2, y + 121, 25, C.ink, 'center');
      }
    });
  };
  txt(c, 'All gaps, sorted by duration (ms)', 104, 442, 34, C.ink);
  drawSlots(pool, 485, 67, showPooled ? 18 : -1);
  if (reduce) {
    txt(c, 'One worst gap per reply (ms)', 104, 662, 32, C.ink);
    drawSlots(worst, 706, 190, showWorst ? 1 : -1);
    if (showWorst)
      mono(c, 'p95 = ' + nearestRank(worst, 0.95) + ' ms', 1680, 762, 45, C.red, 'right');
  } else if (showPooled)
    mono(
      c,
      'ceil(0.95 × 20) = 19    →    p95 = ' + nearestRank(pool, 0.95) + ' ms',
      960,
      751,
      41,
      C.green,
      'center',
    );
  foot(
    c,
    reduce
      ? showWorst ? 'Two replies give two votes. The nearest-rank p95 selects the second observation.' : 'Find the nearest-rank p95 among these two observations.'
      : 'Nearest rank selects position ceil(0.95 × count) in the sorted population.',
  );
}
export function statistics(c, k) {
  const b = k.beat.beatIndex;
  headline(
    c,
    7,
    b < 2
      ? 'Does the lower bound clear the floor?'
      : b === 2
        ? 'Which rate goes into the budget?'
        : 'Whose gaps get a vote?',
  );
  if (b < 2) boundPlot(c, k);
  else if (b === 2) {
    const reveal = at(k, 'thirty replicas');
    txt(c, 'Both estimates assume every offered call entered the three-replica pool.', 102, 260, 35, C.dim);
    txt(c, 'Use the same mix, steady load and even routing to budget for 100 active requests.', 102, 316, 31, C.dim);
    for (const [i, estimate] of [observedBudget, strictBudget].entries()) {
      const y = 454 + 212 * i;
      const counted = i === 0 || at(k, 'gives ten active');
      txt(c, i ? 'Wilson lower-bound rule' : 'Observed-rate rule', 103, y - 54, 34, C.ink, { bold: true });
      txt(c, estimate.admittedRps.toFixed(1) + ' admitted requests/s', 104, y + 10, 34, C.green);
      txt(c, '× ' + meanSeconds + ' s mean time in pool', 104, y + 64, 31, C.ink);
      if (counted) {
        for (let j = 0; j < estimate.active; j++) dot(c, 667 + j * 42, y, 14, i ? C.green : C.dim);
        txt(c, estimate.active + ' mean active across the pool', 665, y + 65, 30, C.ink);
      }
      mono(c, i && !reveal ? '?' : estimate.replicas + ' replicas', 1572, y, 39, i ? C.green : C.ink, 'center');
    }
    foot(
      c,
      'Conditional budget before margin   ·   divide demand by mean active requests per replica.',
    );
  } else rankComb(c, k);
}

const practice = servingReceipt(fresh, [0, 2500]);
function practiceRoll(c, k, resolved) {
  const opened = k.beat.beatIndex === 0,
    now = opened ? Math.round(blend(2500, 4000, at(k, 'the last times out', 1.05))) : 4000;
  const x = (t) => 292 + t * 0.286;
  txt(c, 'New cohort   /   eight scheduled calls', 113, 282, 36, C.pale);
  txt(c, 'Promise   ≥95% qualified', 1802, 282, 32, C.amber, { align: 'right' });
  box(c, x(2500), 344, x(4000) - x(2500), 409, '#304641');
  fresh.forEach((r, i) => {
    const y = 374 + 52 * i,
      finished = r.terminal <= now;
    const color = finished && !servingRequestMetrics(r).qualified ? C.peach : C.mint;
    mono(c, r.id.toUpperCase(), 115, y, 28, C.pale);
    path(
      c,
      [
        [x(r.sent), y],
        [x(Math.min(r.terminal, now)), y],
      ],
      color,
      6,
    );
    dot(c, x(r.sent), y, 7, C.amber);
    if (finished) dot(c, x(r.terminal), y, 10, color);
    txt(c, finished ? outcome(r) : 'pending', 1505, y, 29, color);
  });
  path(
    c,
    [
      [x(2500), 337],
      [x(2500), 753],
    ],
    C.brass,
    3,
  );
  mono(c, '2.5 s   arrivals close', x(2500) - 6, 780, 25, C.amber, 'right');
  mono(c, '4 s', x(4000), 780, 25, C.mint, 'center');
  if (!resolved) {
    mono(c, 'Attainment  ?       Qualified calls per second  ?', 960, 846, 37, C.pale, 'center');
    return;
  }
  const success = at(k, 'Seven successes'),
    offered = at(k, 'The offered rate');
  mono(c, '6 / 8 = ' + percent(practice.attainment), 129, 846, 34, C.amber);
  if (at(k, 'one point five qualified'))
    mono(c, practice.qualifiedRps + ' qualified/s', 628, 846, 34, C.amber);
  if (success) mono(c, practice.successRps + ' success/s', 1123, 846, 31, C.mint);
  if (offered) mono(c, practice.offeredRps + ' offered/s', 1532, 846, 31, C.pale);
}
function qualityJoin(c, k) {
  const linked = k.beat.beatIndex === 5 && at(k, 'Each performance response');
  txt(c, 'Performance run', 108, 285, 38, C.pale, { bold: true });
  txt(c, 'Separate semantic suite', 1250, 285, 38, C.pale, { bold: true });
  for (let i = 0; i < 5; i++) {
    const yy = 365 + i * 83;
    box(c, 114, yy, 705, 62, C.enamel, 7);
    mono(c, 'P0' + (i + 1), 144, yy + 32, 29, C.mint);
    txt(c, 'protocol + latency', 320, yy + 32, 30, C.pale);
    mono(c, '?', 743, yy + 31, 31, C.amber, 'center');
  }
  for (let i = 0; i < 40; i++) {
    const xx = 1287 + (i % 8) * 64,
      yy = 383 + Math.floor(i / 8) * 71;
    dot(c, xx, yy, 17, C.mint);
    path(
      c,
      [
        [xx - 7, yy],
        [xx - 1, yy + 5],
        [xx + 7, yy - 6],
      ],
      C.deep,
      3,
    );
  }
  path(
    c,
    [
      [850, 552],
      [957, 552],
    ],
    C.ridge,
    4,
  );
  path(
    c,
    [
      [1101, 552],
      [1218, 552],
    ],
    C.ridge,
    4,
  );
  mono(c, 'no ID', 1026, 532, 28, C.amber, 'center');
  mono(c, 'match', 1026, 571, 28, C.amber, 'center');
  txt(
    c,
    linked
      ? 'Per-response semantic result remains unknown.'
      : 'Can any suite verdict fill a performance row?',
    960,
    833,
    45,
    C.pale,
    { align: 'center', face: 'Serif' },
  );
}
function finalReceipt(c) {
  txt(c, 'Evidence filed with this cohort', 111, 282, 37, C.mint, { bold: true });
  const labels = [
    ['Schedule', practice.offered + ' scheduled and sent in 2.5 seconds'],
    ['Timing', 'Per-ID send, token and terminal timestamps'],
    ['Drain', 'N8 timed out at 4 seconds'],
    ['Outcomes', practice.success + ' successes, ' + practice.qualified + ' qualified by the task and timing checks'],
  ];
  labels.forEach(([name, value], i) => {
    const y = 367 + 83 * i;
    mono(c, name, 115, y, 29, C.amber);
    txt(c, value, 334, y, 30, C.pale);
    path(
      c,
      [
        [112, y + 43],
        [1107, y + 43],
      ],
      C.ridge,
      2,
    );
  });
  txt(c, 'Still needed for capacity', 111, 712, 35, C.amber, { bold: true });
  txt(c, 'Repeated load sweep with a rule set in advance', 114, 769, 30, C.pale);
  txt(c, 'Queue stability, schedule lag and uncertainty at each load', 114, 819, 30, C.pale);
  box(c, 1183, 304, 607, 487, C.paper, 14);
  mono(c, 'EIGHT-CALL RECEIPT', 1224, 354, 26, C.dim);
  path(
    c,
    [
      [1226, 394],
      [1744, 394],
    ],
    C.rule,
    3,
  );
  txt(c, 'Qualified rate', 1223, 442, 31, C.dim);
  mono(c, practice.qualifiedRps + ' / s', 1220, 513, 59, C.ink);
  txt(c, 'Attainment  /  promise', 1223, 597, 31, C.dim);
  mono(c, Math.round(practice.attainment * 100) + '%  /  95%', 1220, 664, 47, C.red);
  mono(c, 'CAPACITY   UNMEASURED', 1225, 743, 27, C.dim);
}
function practiceSend(c, k) {
  const move = k.beat.id === 'c09-resend';
  const forward = move ? at(k, 'Move the send', 1.2) : 0;
  const restore = move ? at(k, 'Restore the original send', 1.2) : 0;
  const { row, metrics, receipt, exit } = freshReplay(
    300 + Math.round(45 * forward * (1 - restore)),
  );
  const x = (t) => 290 + (t - 300) * 13;
  txt(c, 'N2   /   client send clock', 110, 286, 36, C.mint);
  txt(c, 'Maximum lag   20 ms', 1794, 286, 31, C.amber, { align: 'right' });
  box(c, x(300), 381, x(320) - x(300), 175, C.enamel, 8);
  path(
    c,
    [
      [x(300), 490],
      [x(400), 490],
    ],
    C.ridge,
    4,
  );
  mono(c, 'Due 300', x(300), 350, 29, C.pale, 'center');
  mono(c, 'First token 400', x(400), 350, 29, C.pale, 'center');
  path(
    c,
    [
      [x(300), 376],
      [x(300), 519],
    ],
    C.amber,
    4,
  );
  dot(c, x(400), 490, 12, C.mint);
  const col = exit ? C.peach : C.mint;
  dot(c, x(row.sent), 490, 15, col);
  mono(c, 'Sent ' + row.sent, x(row.sent), 611, 33, col, 'center');
  bracket(c, x(row.sent), x(400), 421, metrics.ttft + ' ms to first token', C.pale, 27);
  mono(c, 'Lag  ' + metrics.lag + ' ms', 110, 772, 41, col);
  mono(c, 'Scorer exit  ' + exit, 676, 772, 41, col);
  mono(c, 'Attainment  ' + Math.round(receipt.attainment * 100) + '%', 1293, 772, 41, C.amber);
}
export function closing(c, k) {
  const b = k.beat.beatIndex;
  headline(
    c,
    8,
    b < 2
      ? 'Score the next shift'
      : b < 4
        ? 'Can a valid schedule rescue this run?'
        : b < 6
          ? 'Which output did the judge review?'
          : 'What can this receipt support?',
    'dark',
  );
  if (b < 2) {
    const resolved = b === 1 && at(k, 'Six of eight');
    practiceRoll(c, k, resolved);
    foot(
      c,
      resolved
        ? 'Qualified and successful rates use four seconds. Offered rate uses two and a half.'
        : 'Count every offered request and follow the last one to its terminal outcome.',
      true,
    );
  } else if (b < 4) {
    practiceSend(c, k);
    foot(
      c,
      b === 2
        ? 'Change only the send. The request identity, due time, first token and task result stay fixed.'
        : 'The restored schedule passes. Six of eight still falls below the 95% promise.',
      true,
    );
  } else if (b < 6) {
    qualityJoin(c, k);
    foot(c, 'The 40-item suite has its own outputs and its own acceptance result.', true);
  } else {
    finalReceipt(c);
    foot(
      c,
      'Keep the original records so the next team can reproduce the timing, population, and verdict.',
      true,
    );
  }
}

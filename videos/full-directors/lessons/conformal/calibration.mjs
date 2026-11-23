import {
  C,
  head,
  plate,
  text,
  rect,
  line,
  dot,
  diamond,
  bracket,
  slot,
  dash,
  ticks,
  measure,
  pct,
} from './drawing.mjs';
import {
  calibration,
  shuffled,
  select,
  errors,
  fixed,
  band,
  trial,
  counting,
  testRows,
  fixedRadii,
} from './model.mjs';

export function split(c, t) {
  const leaked = t.b === 2,
    fresh = t.b >= 3;
  head(
    c,
    'SPLIT CONFORMAL',
    leaked
      ? 'What did set A help choose?'
      : fresh
        ? 'Measure the frozen procedure on set B'
        : 'Who gets to change the predictor?',
  );
  if (t.on(4, 'For each held-out record')) {
    plate(c, 53, 142, 852, 289);
    for (const [i, label] of ['Set B', 'Forecast (ms)', 'Outcome (ms)'].entries())
      text(c, label, [89, 370, 671][i], 188, 19, C.dim);
    calibration.slice(0, 3).forEach((r, i) => {
      const y = 244 + i * 66;
      text(c, r.id, 92, y, 22, C.text, 'left', 'Mono');
      text(c, r.forecast, 395, y, 25, C.blue, 'left', 'Mono');
      line(c, 463, y, 636, y, C.edge, 2);
      text(c, r.actual, 689, y, 25, C.teal, 'left', 'Mono');
    });
    text(
      c,
      'Each outcome stays paired with the forecast made before it arrived.',
      56,
      466,
      21,
      C.dim,
      'left',
      'Serif',
    );
    return;
  }
  const bins = [
    ['Training', 'fit the predictor'],
    ['Validation', 'choose a model'],
    [fresh ? 'Untouched B' : 'Calibration A', 'measure errors'],
    ['Next request', 'observe later'],
  ];
  const x = [57, 287, 517, 747];
  for (let i = 0; i < 4; i++) {
    const seen =
      t.b > 1 || i === 0 || t.on(1, ['', 'Choose the model', 'Only now open', 'Test requests'][i]);
    const col = !seen
      ? C.edge
      : i < 2
        ? C.blue
        : i === 2 && leaked
          ? C.red
          : i === 2
            ? C.gold
            : C.teal;
    text(c, bins[i][0], x[i], 166, 22, col, 'left', 'Serif');
    for (let j = 4; j >= 0; j--) {
      rect(c, x[i] + j * 3, 208 - j * 5, 137, 82, seen ? '#c8d1bf' : '#48605a', 4);
      rect(c, x[i] + 3 + j * 3, 211 - j * 5, 131, 76, seen ? '#e1e1cd' : '#3b504e', 3);
    }
    if (seen) {
      text(c, i === 3 ? 'x → ŷ' : 'x    ŷ    y', x[i] + 13, 234, 18, C.ink, 'left', 'Mono');
      for (let j = 0; j < 3; j++)
        line(c, x[i] + 14, 253 + j * 9, x[i] + 95 - j * 8, 253 + j * 9, '#8c9d91', 1);
    }
    text(c, seen ? bins[i][1] : 'sealed', x[i], 318, 16, col);
  }
  const frozen = t.b > 1 || t.on(1, 'Then freeze');
  bracket(c, 60, 442, 348, C.blue, 3);
  text(
    c,
    leaked
      ? 'Model selection used the calibration outcomes'
      : frozen
        ? 'Preprocessing, predictor and score fixed'
        : 'Fit and select',
    60,
    384,
    20,
    C.blue,
    'left',
    'Serif',
  );
  if (leaked) {
    line(c, 590, 350, 590, 423, C.red, 3);
    line(c, 590, 423, 330, 423, C.red, 3);
    diamond(c, 330, 423, 6, C.red);
    text(c, 'A also selected the winner', 600, 421, 18, C.red);
  } else if (fresh) {
    bracket(c, 522, 900, 349, C.gold, 3);
    text(c, 'B and the next request can trade places', 520, 384, 18, C.text, 'left', 'Serif');
    if (t.b === 4) text(c, 'Repeat with a fresh B and a fresh outcome.', 522, 404, 16, C.teal);
  }
}
export function scores(c, t) {
  const all = t.b === 3;
  head(
    c,
    'CALIBRATION  /  ABSOLUTE RESIDUAL',
    all ? 'Every gap keeps its request ID' : 'An early finish and a late finish',
  );
  if (all) {
    const reordered = t.on(3, 'mix up the records');
    for (const [i, r] of calibration.entries()) {
      const j = shuffled.indexOf(r),
        yy = 369,
        xx = 84 + (reordered ? j : i) * 98;
      const h = r.error * 15;
      rect(c, xx - 16, yy - h, 32, h, C.gold, 3);
      text(c, r.error, xx, yy - h - 18, 21, C.gold, 'center', 'Mono');
      text(c, r.id, xx, yy + 27, 16, C.dim, 'center', 'Mono');
    }
    line(c, 49, 371, 911, 371, C.edge, 2);
    text(c, 'Absolute error (ms)', 50, 155, 19, C.dim);
  } else {
    const xx = (n) => 170 + (n - 30) * 44;
    const show = t.on(2, 'One finished early');
    for (const [j, r] of calibration.slice(1, 3).entries()) {
      if (j === 1 && !t.on(1, 'Now look at')) continue;
      const y = 217 + 116 * j;
      text(c, r.id, 62, y, 28, C.text, 'left', 'Serif');
      line(c, xx(30), y, xx(46), y, C.edge, 2);
      bracket(
        c,
        xx(Math.min(r.forecast, r.actual)),
        xx(Math.max(r.forecast, r.actual)),
        y,
        C.gold,
        5,
      );
      diamond(c, xx(r.forecast), y, 9, C.blue);
      dot(c, xx(r.actual), y, 7, C.teal);
      text(c, 'forecast ' + r.forecast, xx(r.forecast), y - 38, 18, C.blue, 'center');
      text(c, 'actual ' + r.actual, xx(r.actual), y + 32, 18, C.teal, 'center');
      if (show) text(c, r.error + ' ms', 892, y, 21, C.gold, 'right', 'Mono');
    }
    ticks(c, xx, [30, 32, 34, 36, 38, 40, 42, 44, 46], 380);
  }
}
function rack(
  c,
  {
    items = calibration,
    index = -1,
    accent = C.gold,
    otherIndex = -1,
    y = 352,
    zero = false,
    empty = false,
  },
) {
  const highlight = (i) => (i === index ? accent : i === otherIndex ? C.gold : null);
  const gap = 85,
    start = 87;
  line(c, 48, y, 908, y, C.edge, 3);
  for (const [i, r] of items.entries()) {
    const x = start + gap * i;
    const col = highlight(i) ?? C.teal;
    rect(c, x - 22, y - r.error * (zero ? 10 : 12), 44, r.error * (zero ? 10 : 12), col, 3);
    text(c, r.error, x, y - r.error * (zero ? 10 : 12) - 16, 21, col, 'center', 'Mono');
    text(c, r.id, x, y + 24, 14, C.dim, 'center', 'Mono');
  }
  const positions = empty ? 10 : 9;
  for (let i = 0; i < positions; i++) {
    const x = start + i * gap;
    const hot = highlight(i);
    if (hot) rect(c, x - 28, y + 44, 56, 29, hot, 4);
    text(c, zero ? 'i=' + i : i + 1, x, y + 59, 16, hot ? C.ink : C.dim, 'center', 'Mono');
    if (i === 9) {
      dash(c, x, y - 100, x, y - 3, C.edge, 2);
      text(c, '?', x, y - 111, 19, C.dim, 'center');
    }
  }
  text(c, zero ? 'index' : 'slot', 40, y + 59, 12, C.dim, 'center', 'Mono');
}
export function quantile(c, t) {
  const target = t.b === 3 || t.b === 4 ? 0.85 : 0.8;
  const ordered = [...shuffled].sort(
    (a, b) => a.error - b.error || calibration.indexOf(a) - calibration.indexOf(b),
  );
  const a = select(errors, target),
    sorted = t.amount(2, 'Sort the nine errors', 1.3);
  const known =
    t.b === 1
      ? t.on(1, 'end')
      : t.b === 2
        ? true
        : t.b === 3
          ? false
          : t.b === 4
            ? t.after(4, 'rank nine', false)
            : true;
  head(c, 'ORDER STATISTIC  /  NINE CALIBRATION REQUESTS', 'Make room for the future error');
  text(c, 'target ' + pct(target), 50, 156, 23, C.gold);
  text(
    c,
    '10 positions  ×  ' + target.toFixed(2) + (known ? '    →    rank ' + a.rank : ''),
    292,
    156,
    22,
    C.text,
    'left',
    'Mono',
  );
  const picked =
    known &&
    t.after(2, 'eight milliseconds', false) &&
    sorted === 1 &&
    (t.b !== 4 || t.after(4, 'twelve milliseconds', false));
  if (sorted > 0 && sorted < 1) {
    for (const [i, row] of shuffled.entries()) {
      const x = 87 + 85 * i;
      text(c, row.id, x, 240, 15, C.dim, 'center', 'Mono');
      text(c, row.error, x, 271, 21, C.teal, 'center', 'Mono');
      const rank = ordered.indexOf(row),
        selected = rank < Math.floor(sorted * 9);
      if (selected) {
        const dest = 87 + 85 * rank;
        line(c, x, 294, dest, 341, C.edge, 1);
        slot(c, dest, 377, row.error, row.id, false, 56);
      }
    }
    return;
  }
  rack(c, {
    items: sorted === 1 ? ordered : shuffled,
    empty: true,
    index: picked ? a.index : -1,
  });
  text(
    c,
    picked
      ? 'Slot ' + a.rank + ' holds ' + a.q + ' ms'
      : 'Nine observed heights (ms) and one future position',
    50,
    119,
    22,
    picked ? C.gold : C.dim,
    'left',
    'Serif',
  );
}
export function indexing(c, t) {
  const target = t.b <= 2 ? 0.8 : t.b === 3 ? 0.9 : 0.95,
    n = t.b === 5 ? 19 : 9;
  const a = select(errors, target),
    higher = Math.ceil(((n - 1) * a.rank) / n);
  head(c, 'ORDER STATISTIC  /  CODE', 'Which array element does the call read?');
  if (n === 19 && !t.on(5, 'With nineteen scores')) {
    text(c, '95% target', 52, 165, 21, C.gold);
    text(c, 'ceil((n + 1) × .95) ≤ n', 480, 265, 33, C.text, 'center', 'Mono');
    text(
      c,
      'What is the smallest n that leaves the chosen slot occupied?',
      480,
      365,
      23,
      C.dim,
      'center',
      'Serif',
    );
    return;
  }
  if (n === 19) {
    text(c, '95% target', 56, 153, 22, C.gold);
    for (let i = 0; i < 20; i++) {
      const x = 63 + (i % 10) * 91,
        y = 245 + Math.floor(i / 10) * 91;
      slot(c, x, y, i === 19 ? '?' : i + 1, null, i === 18 && t.on(5, 'rank nineteen exists'), 63);
    }
    text(
      c,
      t.on(5, "That's the first")
        ? 'ceil(20 × .95) = 19   ·   largest observed error'
        : '19 observed slots plus the next request',
      48,
      420,
      22,
      C.gold,
      'left',
      'Mono',
    );
    return;
  }
  const sameTarget = t.b === 3;
  const partitionIndex = sameTarget
    ? t.after(3, 'index eight', false)
    : t.after(1, 'index seven', false);
  const higherIndex = sameTarget
    ? t.after(3, 'both calls return twelve', false)
    : t.after(2, 'the ninth stick', false);
  const partitionResult = sameTarget ? higherIndex : t.after(1, 'eight milliseconds', false);
  const higherResult = sameTarget ? higherIndex : t.after(2, 'twelve milliseconds', false);
  rack(c, {
    index: t.b === 4 ? 9 : partitionIndex ? a.index : -1,
    accent: t.b === 4 ? C.gold : C.blue,
    otherIndex: t.b < 4 && higherIndex ? higher : -1,
    empty: true,
    zero: true,
    y: 315,
  });
  if (t.b < 4) {
    text(c, 'partition  ·  index = rank − 1', 51, 148, 19, C.blue, 'left', 'Mono');
    text(
      c,
      'rank ' +
        a.rank +
        '  →  index ' +
        (partitionIndex ? a.index : '?') +
        (partitionResult ? '  →  ' + a.q + ' ms' : ''),
      52,
      419,
      21,
      C.blue,
      'left',
      'Mono',
    );
    if (t.b >= 2) {
      text(c, 'higher  ·  ceil(8 × ' + a.rank + '/9)', 470, 148, 19, C.gold, 'left', 'Mono');
      text(
        c,
        'index ' +
          (higherIndex ? higher : '?') +
          (higherResult ? '  →  ' + a.ordered[higher] + ' ms' : ''),
        558,
        419,
        21,
        C.gold,
        'left',
        'Mono',
      );
    }
  } else {
    text(c, 'ceil(10 × .95) = 10', 50, 148, 22, C.gold, 'left', 'Mono');
    if (t.on(4, 'an infinite radius'))
      text(c, 'No tenth error     q = ∞', 50, 419, 20, C.gold, 'left', 'Mono');
    if (t.on(4, 'Clipping'))
      text(c, 'Distinct scores: clipping covers 9/10 ranks.', 50, 182, 20, C.text, 'left', 'Serif');
  }
}
export function interval(c, t) {
  const inf = t.b === 4,
    q = inf ? Infinity : fixed.q;
  const a =
    t.b === 3
      ? 48
      : t.b === 2 && t.on(2, 'Now the arrival')
        ? 53
        : t.b === 2 && t.on(2, 'It fits')
          ? 44
          : null;
  const s = band(40, q, a);
  head(c, 'ONE NEW REQUEST  /  MILLISECONDS', 'Put the radius on both sides of the forecast');
  text(
    c,
    inf ? '95% target   ·   q = ∞' : '80% target   ·   q = ' + q + ' ms',
    47,
    148,
    18,
    C.gold,
    'left',
    'Mono',
  );
  const shown = t.b === 2 ? t.on(2, 'Its width') : t.b > 2;
  measure(c, s, {
    showBand: shown,
    showResult:
      t.b === 3
        ? t.on(3, 'An error at the boundary')
        : t.b === 2 && (a === 44 ? t.on(2, 'Keep the band') : t.on(2, 'end')),
  });
  if (shown)
    text(c, 'width  ' + (inf ? '∞' : s.width + ' ms'), 47, 188, 19, C.gold, 'left', 'Mono');
}
export function exchange(c, t) {
  head(c, 'RANK EXPERIMENT  /  DISTINCT SCORES', 'Take one score out of the rack');
  const steps = t.amount(3, 'Hold out the first seven', 5);
  let held =
    t.b < 3
      ? null
      : t.b === 3
        ? Math.min(7, 1 + Math.floor(steps * 7))
        : t.b === 4
          ? 8
          : t.b === 5
            ? t.on(5, 'Now hold out nine')
              ? 9
              : 8
            : t.on(6, 'Hold out ten')
              ? 10
              : 9;
  const s = held == null ? null : trial(counting, held - 1);
  const rackScores = s ? s.ordered : counting;
  text(
    c,
    held ? 'Nine calibration scores' : 'Ten interchangeable positions',
    49,
    169,
    21,
    C.dim,
    'left',
    'Serif',
  );
  rackScores.forEach((v, i) => slot(c, 69 + i * 90, 243, v, i + 1, s != null && i === 7));
  if (!s) {
    text(
      c,
      t.b === 2
        ? 'A shuffle changes the order of one log.'
        : 'Any position could contain the future request.',
      50,
      388,
      24,
      C.blue,
      'left',
      'Serif',
    );
    return;
  }
  const revealed =
    t.b === 3 ||
    (held === 8 && t.on(5, 'Eight is covered')) ||
    (held === 9 && t.on(6, 'so this time we miss')) ||
    (held === 10 && t.on(6, 'Ten misses too'));
  plate(c, 48, 336, 863, 112);
  text(c, 'Held out', 70, 369, 16, C.dim);
  text(c, held, 70, 410, 34, C.text, 'left', 'Mono');
  text(c, '8th calibration value', 270, 369, 16, C.dim);
  text(c, revealed ? s.q : '?', 270, 410, 34, C.gold, 'left', 'Mono');
  text(
    c,
    revealed ? (s.hit ? 'covered' : 'miss') : 'Covered?',
    535,
    394,
    28,
    revealed ? (s.hit ? C.teal : C.red) : C.dim,
    'left',
    'Serif',
  );
  if (t.on(6, 'Exchangeability makes'))
    text(
      c,
      counting.filter((v, i) => trial(counting, i).hit).length + '/10',
      872,
      394,
      30,
      C.teal,
      'right',
      'Mono',
    );
}
export function ties(c, t) {
  const zeros = (t.b === 1 && t.on(1, 'Take the extreme')) || t.b === 3,
    distinct = t.b === 2;
  head(
    c,
    'COVERAGE  /  REPEATED DRAWS',
    t.b === 4 ? 'What gets a fresh draw?' : 'Keep every tied observation',
  );
  if (t.b === 4) {
    const compare = t.on(4, 'If you keep');
    const panels = compare ? 2 : 1;
    for (let j = 0; j < panels; j++) {
      const x = 52 + j * 458;
      text(
        c,
        j === 0 ? 'Fresh calibration each time' : 'One fixed calibration sample',
        x,
        154,
        21,
        j === 0 ? C.gold : C.blue,
        'left',
        'Serif',
      );
      text(c, 'Calibration errors   +   outcome', x, 182, 16, C.dim);
      for (let i = 0; i < 3; i++) {
        const y = 224 + i * 80;
        text(c, 'Trial ' + (i + 1), x, y, 15, C.dim);
        for (let k = 0; k < 9; k++) {
          const h = 12 + (((j === 0 ? i : 0) * 17 + k * 13) % 38);
          rect(c, x + 77 + k * 21, y + 14 - h, 13, h, j === 0 ? C.gold : C.blue, 2);
        }
        text(c, '+', x + 286, y, 20, C.dim);
        diamond(c, x + 326, y, 9, C.teal);
      }
    }
    return;
  }
  const vals = zeros ? Array(10).fill(0) : distinct ? counting : errors;
  const answered = zeros ? t.b === 3 || t.on(1, 'end') : distinct;
  const q = trial(vals, vals.length - 1).q;
  vals.forEach((v, i) => {
    const x = 70 + i * 90;
    const col = answered ? (trial(vals, i).hit ? C.teal : C.red) : v === 3 ? C.gold : C.dim;
    dot(c, x, 289, 27, col);
    text(c, v, x, 290, 22, C.ink, 'center', 'Mono');
    text(c, i + 1, x, 346, 16, C.dim, 'center', 'Mono');
  });
  text(
    c,
    zeros
      ? 'Every score, including the next, is zero'
      : distinct
        ? 'Distinct scores  ·  hold out each position'
        : 'Original latency errors (ms)',
    50,
    172,
    23,
    C.text,
    'left',
    'Serif',
  );
  if (distinct && t.on(2, 'Here that range'))
    text(c, 'Loose bound: 80% to 90%', 51, 472, 19, C.dim, 'left', 'Mono');
  text(
    c,
    answered
      ? zeros
        ? 'Inclusive cutoff ' + q + '   ·   10/10 covered'
        : '8/10 covered   ·   k/(n + 1)'
      : zeros
        ? 'Inclusive cutoff 0   ·   how many fit?'
        : 'The two 3 ms errors occupy two slots.',
    51,
    393,
    24,
    C.gold,
    'left',
    'Mono',
  );
}
export function coverageRows(
  c,
  rows,
  { count = 4, verdict = null, verdictY = 477, scales = false, radii = null } = {},
) {
  const xx = (n) => 235 + (n - 24) * 15.6,
    yy = (i) => 169 + i * 79;
  rows.forEach((r, i) => {
    const y = yy(i);
    text(c, r.id, 42, y, 24, C.text, 'left', 'Serif');
    text(c, scales ? 'scale ' + r.scale + ' ms' : 'forecast ' + r.center, 88, y, 16, C.dim);
    line(c, xx(24), y, xx(65), y, C.edge, 1.5);
    bracket(c, xx(r.lo), xx(r.hi), y, C.gold, 8);
    text(c, r.lo, xx(r.lo), y - 21, 16, C.gold, 'center', 'Mono');
    text(c, r.hi, xx(r.hi), y - 21, 16, C.gold, 'center', 'Mono');
    diamond(c, xx(r.center), y, 7, C.blue);
    if (i < count) {
      dot(c, xx(r.arrival), y, 6, C.text);
      text(c, r.arrival, xx(r.arrival), y + 23, 16, C.text, 'center', 'Mono');
    }
    if (radii)
      text(c, (radii[i] === 8 ? 'fixed ±' : '±') + radii[i], 938, y, 14, C.gold, 'right', 'Mono');
  });
  if (verdict != null) text(c, verdict, 50, verdictY, 20, C.teal, 'left', 'Mono');
}
export function coverage(c, t) {
  const replay = t.after(4, 'at fifty-two', false),
    rows = testRows(fixedRadii, replay ? 52 : 55);
  head(c, 'TEST REQUESTS  /  MILLISECONDS', 'Each arrival has its own interval');
  text(c, '80% marginal target', 936, 127, 19, C.gold, 'right', 'Mono');
  const count =
    t.b > 1
      ? t.after(2, 'finishes at fifty-five', false)
        ? 4
        : 3
      : Math.round(3 * t.amount(1, 'Here come the first three', 1.4));
  const reveal =
    (!replay && t.after(3, 'seventy-five percent', false)) ||
    t.after(5, 'All four are covered', false);
  const hits = rows.filter((r) => r.hit).length;
  coverageRows(c, rows, {
    count,
    verdict: reveal
      ? 'Observed: ' + hits + '/4 covered   ·   ' + pct(hits / 4) + '   ·   width 16 ms'
      : null,
    verdictY: 127,
  });
}

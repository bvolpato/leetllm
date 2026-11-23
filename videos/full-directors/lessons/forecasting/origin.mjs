import { C, mix, mean, signed } from './instrument.mjs';
import {
  counts,
  rows,
  weekdayNames,
  forecast,
  actual,
  errors,
  earlier,
  mae,
  width,
  baseline,
  observed,
  launch,
  seasonalDescription,
  weeklyLookup,
} from './observatory.mjs';

export function recorder(p, issued, band, outcome, gap) {
  const { rect, line, poly, dot, text, mono, graph } = p;
  const x = (i) => 132 + i * 138,
    y = (v) => 491 - (v - 70) * 2.86;
  rect(48, 160, 1184, 426, C.night);
  for (const xx of [67, 1213])
    for (const yy of [180, 566]) {
      dot(xx, yy, 6, C.edge);
      line(xx - 3, yy + 2, xx + 3, yy - 2, C.night, 1);
    }
  graph(94, 203, 1094, 321, 28);
  for (const v of [80, 100, 120, 140, 160]) {
    line(100, y(v), 1180, y(v), C.grid, 1);
    mono(v, 88, y(v), 16, C.light, 'right');
  }
  const history = counts.slice(18, 25);
  history.forEach((v, i) => {
    if (i) line(x(i - 1), y(history[i - 1]), x(i), y(v), C.teal, 3);
    dot(x(i), y(v), 5, C.teal);
    mono(
      ['Fri 23', 'Sat 24', 'Sun 25', 'Mon 26', 'Tue 27', 'Wed 28', 'Thu 29'][i],
      x(i),
      549,
      19,
      C.light,
      'center',
    );
  });
  mono('Fri 30', x(7), 549, 19, C.amber, 'center');
  line(x(6) + 65, 205, x(6) + 65, 513, C.edge, 2, [5, 5]);
  mono(baseline, x(0), y(baseline) + 49, 24, C.teal, 'center');
  if (issued > 0) {
    const end = mix(x(0), x(7), issued);
    line(x(0) + 10, y(baseline), end, y(baseline), C.blue, 2, [8, 6]);
    if (band) {
      rect(x(7) - 34, y(baseline + width), 68, 2 * width * 2.86, C.band);
      line(x(7) - 34, y(baseline + width), x(7) + 34, y(baseline + width), C.blue, 2);
      line(x(7) - 34, y(baseline - width), x(7) + 34, y(baseline - width), C.blue, 2);
    }
    dot(end, y(baseline), 9, C.blue, true);
    if (issued === 1) mono(baseline, x(7) - 4, y(baseline) + 39, 25, C.blue, 'center');
  }
  if (p.clock.beat.chapterId === 'c01' && p.beat === 0) {
    const tip = mix(x(0), x(7), issued),
      yy = y(baseline);
    const descend = p.move(0, 'The blue pen', 0.75);
    line(94, 182, 1188, 182, C.edge, 4);
    rect(tip + 8, 169, 53, 25, '#8ca09b');
    poly(
      [
        [tip + 15, 194],
        [tip + 50, 194],
        [tip + 11, yy - 20 - (1 - descend) * 24],
        [tip + 2, yy - 20 - (1 - descend) * 24],
      ],
      C.blue,
    );
    poly(
      [
        [tip + 2, yy - 20 - (1 - descend) * 24],
        [tip + 11, yy - 20 - (1 - descend) * 24],
        [tip, yy - (1 - descend) * 24],
      ],
      C.ink,
    );
  }
  if (outcome) {
    dot(x(7), y(observed), 9, C.red);
    mono(observed, x(7) - 15, y(observed) - 5, 27, C.red, 'right');
    if (gap) {
      const xx = x(7) + 40;
      line(xx, y(baseline), xx, y(observed), C.red, 3);
      for (const v of [baseline, observed]) line(xx - 7, y(v), xx + 7, y(v), C.red, 3);
    }
  }
  text('Jobs per day', 94, 137, 20, C.muted);
}
export function opening(p) {
  const slide = p.move(0, 'slide that reading', 1.2),
    band = p.at(1, null),
    out = p.at(2, 'Does that cross'),
    gap = p.at(3, 'Mark that gap');
  p.title('Friday on the cluster recorder');
  recorder(p, slide, band, out, gap);
  p.text('January 2026   /   synthetic cluster fc-a', 72, 630, 22, C.muted);
  if (band)
    p.mono('Issued band  ' + (baseline - width) + '–' + (baseline + width), 545, 631, 24, C.blue);
  if (gap)
    p.text(
      'Review  ' + signed(observed - baseline) + ' jobs',
      1196,
      630,
      28,
      C.red,
      'right',
      'Serif',
    );
}
export function calendar(p) {
  const delayed = p.at(2, 'Saturday has'),
    targets = p.at(1, 'Monday is the target');
  p.title('Sunday’s dispatch calendar', 'Daily outbound jobs   /   January 5 through February 1');
  const cw = 145,
    ch = 92,
    left = 130,
    top = 218;
  weekdayNames.forEach((d, i) => p.mono(d, left + i * cw + 64, 182, 22, C.muted, 'center'));
  rows.forEach((r, i) => {
    const x = left + (i % 7) * cw,
      y = top + Math.floor(i / 7) * ch,
      late = delayed && i === 20,
      future = i > 20;
    p.rect(x, y, cw - 5, ch - 5, future ? C.fog : '#fffbea');
    p.mono(r.date.slice(5).replace('-', '/'), x + 10, y + 18, 17, C.muted);
    const hot = (delayed ? 19 : 20) === i;
    p.text(
      future ? (r.launch_event ? 'Launch plan' : '· · ·') : late ? 'Awaiting' : r.volume,
      x + 64,
      y + 54,
      future || late ? 20 : 32,
      late ? C.red : hot ? C.teal : future ? C.muted : C.ink,
      'center',
      future || late ? 'Sans' : 'Serif',
    );
    if (hot) p.line(x + 6, y + ch - 8, x + cw - 12, y + ch - 8, C.teal, 5);
    if (future && targets) p.mono('h' + (i - 20), x + cw - 14, y + 18, 17, C.blue, 'right');
  });
  p.text('Issued Sun 25 Jan, evening', 128, 637, 28, C.ink, 'left', 'Serif');
  p.text(
    delayed
      ? 'Latest report received   Sat 24  ·  83 jobs'
      : 'Latest report received   Sun 25  ·  78 jobs',
    1140,
    639,
    23,
    C.teal,
    'right',
  );
}
export function decompose(p) {
  const v = counts.slice(0, 7),
    level = mean(v),
    season = v[4] - level,
    pred = level + season + launch;
  const y = (n) => 534 - n * 2.03;
  p.title('A Friday built from parts', 'First week   /   jobs per day');
  v.forEach((n, i) => {
    const x = 92 + i * 83;
    p.rect(x, y(n), 53, 534 - y(n), i === 4 ? C.blue : C.edge);
    p.mono(n, x + 27, y(n) - (i === 0 ? 37 : 19), 21, C.ink, 'center');
    p.text(weekdayNames[i], x + 27, 563, 20, C.muted, 'center');
  });
  if (p.at(0, 'Measure each day')) {
    p.line(73, y(level), 665, y(level), C.gold, 3, [8, 4]);
    p.mono('Mean ' + level, 82, 615, 24, C.gold);
  }
  if (p.at(0, 'Sunday is twenty-nine')) p.text('Friday +27    Sunday −29', 320, 615, 23, C.ink);
  if (p.beat >= 2) {
    const addLaunch = p.at(2, 'With that assumption'),
      sumKnown = p.at(2, 'We observed'),
      observationKnown = p.at(2, 'How many jobs');
    p.line(718, 170, 718, 625, C.grid, 2);
    p.text('Launch Friday', 810, 152, 28, C.ink, 'left', 'Serif');
    let total = 0;
    for (const [label, n, col] of [
      ['Level', level, C.teal],
      ['Friday', season, C.blue],
      ['Launch', launch, C.gold],
    ]) {
      if (label === 'Launch' && !addLaunch) continue;
      p.rect(818, y(total + n), 100, n * 2.03, col);
      p.text(label + '   ' + signed(n), 948, y(total + n / 2), 23, col);
      total += n;
    }
    if (observationKnown) p.line(795, y(observed), 1175, y(observed), C.red, 2, [6, 4]);
    if (observationKnown)
      p.text('Observed  ' + observed, 1165, y(observed) - 21, 23, C.red, 'right');
    if (sumKnown) p.text('Prediction  ' + pred, 811, 565, 28, C.ink);
    if (observationKnown)
      p.text(
        p.at(3, 'The remainder') ? 'Remainder   ' + (observed - pred) + ' jobs' : 'Remainder   ?',
        811,
        615,
        26,
        C.red,
      );
  }
}
export function seasons(p) {
  const next = p.at(1, 'one hundred twenty'),
    level = next ? 120 : 105,
    s = seasonalDescription(level);
  p.title(
    'Two ways to carry Friday forward',
    'Both descriptions begin at 132 jobs when the level is 105.',
  );
  const x = (v) => 160 + v * 5.5;
  [0, 40, 80, 120, 160].forEach((n) => {
    p.line(x(n), 210, x(n), 563, C.grid, 2);
    p.mono(n, x(n), 591, 20, C.muted, 'center');
  });
  [
    [s.additive, 'Fixed weekday offset', C.blue, 'gives one hundred forty-seven'],
    [s.proportional, 'Proportional Friday', C.teal, 'gives about one hundred fifty'],
  ].forEach(([n, label, col, cue], i) => {
    const yy = 285 + i * 161;
    p.text(label, 160, yy - 46, 28, C.ink, 'left', 'Serif');
    p.rect(x(0), yy, x(level) - x(0), 42, C.edge);
    if (!next || p.at(2, cue)) {
      p.rect(x(level), yy, x(n) - x(level), 42, col);
      p.mono(Number(n.toFixed(2)), x(n) + 16, yy + 20, 25, col);
    } else p.mono('?', x(level) + 24, yy + 20, 30, col);
    p.mono(i ? '× 132/105' : '+ 27', 1150, yy - 43, 22, col, 'right');
  });
  p.text('Reference level   ' + level + ' jobs', 161, 650, 23, C.muted);
  if (p.beat === 3)
    p.mono('L, S, R > 0     log(L × S × R) = log L + log S + log R', 1175, 650, 20, C.ink, 'right');
}
export function monday(p) {
  const settled = p.at(1, 'Copying yesterday'),
    result = p.at(1, 'Look at the distance');
  const y = (v) => 525 - (v - 70) * 8;
  p.title('Which day looks like Monday?');
  const options = [
    [78, 'Sunday 25', C.gold],
    [104, 'Monday 19', C.blue],
  ];
  options.forEach(([v, label, col], i) => {
    const left = 120 + i * 540;
    p.graph(left, 182, 480, 345);
    p.text(label + '  →  Monday 26', left + 24, 158, 25, C.ink);
    p.line(left + 50, y(v), left + 400, y(v), col, 3, [10, 4]);
    p.dot(left + 75, y(v), 8, col);
    p.dot(left + 380, y(v), 10, col, true);
    p.mono(v, left + 70, y(v) - 25, 27, col, 'center');
    if (settled) {
      p.dot(left + 380, y(103), 7, C.red);
      p.mono('103', left + 346, y(103) - 17, 23, C.red, 'right');
    }
    if (result)
      p.text(
        'Absolute miss   ' + Math.abs(103 - v) + ' jobs',
        left + 240,
        593,
        30,
        col,
        'center',
        'Serif',
      );
  });
}
export function reach(p) {
  const origin = 20,
    week = weekdayNames.length,
    sunday = weeklyLookup(origin + week, origin),
    mondayTarget = sunday.target + 1,
    lateSource = sunday.source + 1,
    observedMonday = lateSource - week;
  const slide = p.move(1, 'Now slide the target', 1.4),
    replay = p.move(3, 'take the most recent observed Monday', 1.4),
    sundayIssued = p.after(1, 'For next Sunday the lookup returns seventy-eight jobs'),
    rejected = p.after(2, 'It rejects the request'),
    lateCount = p.after(2, 'Monday’s eventual count of a hundred and three'),
    mondayIssued = p.after(3, 'That was January nineteenth, with a hundred and four jobs');
  const target = mix(sunday.target, mondayTarget, slide),
    source = mix(sunday.source + slide, observedMonday, replay),
    x = (i) => 112 + (i - observedMonday) * 74;
  p.title('Look back from the target', 'Forecast origin   /   Sunday evening, index ' + origin);
  const issueX = x(origin) + 37;
  p.rect(75, 240, issueX - 75, 192, C.fog);
  p.rect(x(target) - 27, 291, 54, 80, C.band);
  const rejectedLookup = rejected && replay === 0;
  p.rect(x(source) - 27, 291, 54, 80, rejectedLookup ? C.blush : C.band);
  p.line(issueX, 195, issueX, 432, C.gold, 4);
  p.text('Available history', 82, 210, 22, C.teal);
  p.text('Future at issuance', issueX + 20, 210, 22, C.gold);
  for (let i = observedMonday; i <= mondayTarget; i++) {
    const arrivedLater = i === lateSource && lateCount;
    let issued = null;
    if (i === sunday.target && sundayIssued) issued = sunday.value;
    if (i === mondayTarget && mondayIssued) issued = counts[observedMonday];
    const value = i <= origin || arrivedLater ? counts[i] : issued ?? '?';
    p.mono(i, x(i), 267, 20, C.muted, 'center');
    p.text(
      value,
      x(i),
      330,
      29,
      arrivedLater ? C.red : issued !== null ? C.blue : i <= origin ? C.ink : C.muted,
      'center',
    );
    p.text(weekdayNames[i % week], x(i), 408, 18, C.muted, 'center');
    if (arrivedLater) p.text('After issue', x(i), 449, 18, C.red, 'center');
  }
  if (sundayIssued) {
    const labelX = mondayIssued ? (x(sunday.target) + x(mondayTarget)) / 2 : x(sunday.target);
    p.text(mondayIssued ? 'Forecasts' : 'Forecast', labelX, 449, 20, C.blue, 'center');
  }
  p.bracket(
    x(source),
    x(target),
    488,
    replay > 0 ? 'Repeat the last observed week' : 'Read target − ' + week,
    rejectedLookup ? C.red : C.blue,
  );
  const label = mondayIssued
    ? 'Horizon 8   ·   forecast ' + counts[observedMonday] + ' jobs'
    : replay > 0
      ? 'Horizon 8   ·   look back to January 19'
      : rejected
        ? 'Index ' + lateSource + ' is beyond ' + origin + '   ·   lookup rejected'
        : slide === 1
          ? 'Can index ' + lateSource + ' supply a count?'
          : slide === 0
            ? 'Horizon 7   ·   source index ' + sunday.source
            : 'Move the target one day';
  p.text(label, 640, 606, 33, rejectedLookup ? C.red : C.teal, 'center', 'Serif');
}
export function backtest(p) {
  const repaired = p.at(1, 'then keep training'),
    rolled = p.beat >= 2;
  p.title(
    rolled
      ? 'Score each day from its own origin'
      : repaired
        ? 'History ends before the first target'
        : 'Who trained on January 31?',
    rolled ? 'Two weeks of daily one-step forecasts' : 'One observation per calendar day',
  );
  const left = 94,
    step = 39;
  const scored = rolled ? Math.floor(14 * p.move(2, 'Issue each evening', 4)) : 0;
  for (let i = 0; i < 28; i++) {
    const train = repaired ? i < 21 : i % 2 === 0,
      x = left + i * step;
    p.rect(
      x,
      251,
      step - 3,
      81,
      rolled
        ? i < 14
          ? C.edge
          : i >= 14 + scored
            ? C.grid
            : i < 21
              ? C.blue
              : C.teal
        : train
          ? C.teal
          : C.gold,
    );
    p.mono(
      Number(rows[i].date.slice(-2)),
      x + 18,
      291,
      18,
      rolled && i >= 14 + scored ? C.ink : C.light,
      'center',
    );
  }
  if (rolled) {
    p.text('Initial history', 95, 206, 22, C.muted);
    p.text('Reporting week 1', 642, 206, 22, C.blue);
    p.text('Reporting week 2', 915, 206, 22, C.teal);
  } else {
    p.text('Training', 95, 208, 23, C.teal);
    p.text('Test targets', 252, 208, 23, C.gold);
  }
  if (!repaired) {
    p.bracket(
      left + step + 17,
      left + 26 * step + 17,
      375,
      'Test Jan 6                         Training Jan 31',
      C.red,
    );
    p.text('The later row has entered the fit.', 640, 527, 36, C.red, 'center', 'Serif');
  } else if (!rolled) {
    p.line(left + 21 * step - 1, 235, left + 21 * step - 1, 355, C.ink, 3);
    p.text(
      'Jan 25 closes training. Jan 26 opens the holdout.',
      640,
      466,
      31,
      C.ink,
      'center',
      'Serif',
    );
  } else {
    if (scored < 14) {
      const xx = left + (14 + scored) * step;
      p.poly(
        [
          [xx + 10, 338],
          [xx + 26, 338],
          [xx + 18, 348],
        ],
        C.gold,
      );
      p.text(
        'Target   ' + rows[14 + scored].date + '     /     issue after ' + rows[13 + scored].date,
        106,
        370,
        21,
        C.muted,
      );
    }
    [earlier.slice(7), errors].forEach((es, i) => {
      const x = 122 + i * 576;
      p.text(i ? 'Jan 26 – Feb 1' : 'Jan 19 – Jan 25', x, 420, 27, C.ink, 'left', 'Serif');
      es.forEach((e, j) => {
        if (i * 7 + j >= scored) return;
        const xx = x + j * 60;
        p.line(xx, 531, xx, 531 - e * 2.4, C.blue, 8);
        p.mono(signed(e), xx, 566, 20, C.ink, 'center');
      });
      if (p.at(2, i ? 'Keep both windows' : 'The launch week averages'))
        p.text('MAE   ' + mae(es).toFixed(1) + ' jobs', x, 631, 29, C.teal);
    });
  }
}
export function sarimax(p) {
  const partition = p.at(2, 'Last Friday had'),
    diff = p.at(3, 'Comparing the two');
  p.title(
    'Take the launch out before differencing',
    'Regression with seasonal ARIMA errors   /   y = βx + u',
  );
  const y = (v) => 550 - v * 2.05;
  [
    [baseline, 0, 'Jan 23'],
    [observed, launch, 'Jan 30'],
  ].forEach(([n, l, label], i) => {
    const x = 180 + i * 435,
      r = partition ? n - l : n;
    p.rect(x, y(r), 148, 550 - y(r), C.blue);
    if (partition && l) p.rect(x, y(n), 148, l * 2.05, C.gold);
    p.text(label, x + 74, 588, 26, C.ink, 'center');
    p.mono(n, x + 74, y(n) - 21, 26, C.ink, 'center');
    if (partition) {
      p.mono('u = ' + r, x + 74, y(r) + 52, 24, C.light, 'center');
      if (l) p.mono('βx = ' + l, x + 74, y(n) + 20, 22, C.light, 'center');
    }
  });
  if (diff) {
    p.text('Seasonal difference', 906, 281, 28, C.ink, 'left', 'Serif');
    p.mono(
      observed - launch + ' − ' + baseline + ' = ' + (observed - launch - baseline),
      906,
      334,
      29,
      C.blue,
    );
    p.text('Raw difference', 906, 423, 24, C.muted);
    if (p.at(3, 'Twenty of those'))
      p.mono(observed + ' − ' + baseline + ' = ' + (observed - baseline), 906, 465, 25, C.muted);
  }
  if (p.beat >= 4) {
    p.text('Future scenario', 106, 655, 23, C.muted);
    p.mono('flag 0  →  +0 jobs', 344, 655, 23, C.blue);
    p.mono('flag 1  →  +' + launch + ' jobs', 685, 655, 23, C.gold);
  }
}
export function features(p) {
  const circle = p.at(2, 'Sunday sits'),
    join = p.beat >= 4;
  p.title(
    circle
      ? join
        ? 'Which weather report can travel back?'
        : 'The end of one week touches the next'
      : 'Cut the feature window at issuance',
  );
  if (!circle) {
    const x = (i) => 160 + i * 138;
    counts
      .slice(14, 21)
      .concat([null])
      .forEach((n, i) => {
        const xx = x(i);
        p.rect(xx - 54, 285, 109, 96, i === 7 ? C.blush : C.fog);
        p.mono(n ?? '?', xx, 329, 34, i === 7 ? C.red : C.ink, 'center');
        p.mono(i === 7 ? 't' : 't−' + (7 - i), xx, 423, 26, C.muted, 'center');
      });
    const leak = p.beat === 1;
    p.bracket(
      x(leak ? 1 : 0),
      x(leak ? 7 : 6),
      486,
      leak ? 'Unshifted window includes the target' : 'Rolling summary ends at t−1',
      leak ? C.red : C.blue,
    );
    if (p.beat === 1) {
      p.line(x(6) + 62, 232, x(6) + 62, 524, C.red, 4);
      p.text('Including t leaks the target.', 640, 610, 35, C.red, 'center', 'Serif');
    }
  } else if (!join) {
    const ox = 429,
      oy = 392,
      r = 174;
    p.dot(ox, oy, r, C.edge, true);
    weekdayNames.forEach((d, i) => {
      const a = (i * Math.PI * 2) / 7 - Math.PI / 2,
        xx = ox + r * Math.cos(a),
        yy = oy + r * Math.sin(a);
      p.dot(xx, yy, 12, i === 6 || i === 0 ? C.teal : C.edge);
      p.text(d, ox + (r + 41) * Math.cos(a), oy + (r + 41) * Math.sin(a), 23, C.ink, 'center');
    });
    p.text('Weekday d', 788, 286, 32, C.ink, 'left', 'Serif');
    p.mono('θ = 2πd / 7', 788, 355, 30, C.teal);
    p.mono('(sin θ, cos θ)', 788, 425, 30, C.teal);
    if (p.beat === 3) p.text('Join hardware and region as of issue time.', 100, 636, 24, C.muted);
  } else {
    const opts = [
      ['Holiday calendar', 'Published before issue', true],
      ['Weather forecast', 'Issued at origin', true],
      ['Realized weather', 'Observed a week later', false],
    ];
    opts.forEach(([a, b, ok], i) => {
      const yy = 240 + i * 131;
      p.text(a, 135, yy, 34, C.ink, 'left', 'Serif');
      p.text(b, 546, yy, 25, C.muted);
      p.rect(948, yy - 26, 195, 52, ok ? C.band : C.blush);
      p.text(ok ? 'Available' : 'Too late', 1045, yy, 25, ok ? C.teal : C.red, 'center');
    });
    p.text('Rebuild this join at each backtest origin.', 134, 633, 24, C.muted);
  }
}
export function horizon(p) {
  const direct = p.beat >= 1,
    daily = p.at(2, 'Their horizons');
  p.title(
    daily
      ? 'A new issue time unlocks a new reading'
      : direct
        ? 'One origin can feed several horizons'
        : 'A recursive forecast feeds its next input',
  );
  const x = [211, 636, 1052],
    labs = ['Sun 25', 'Mon 26', 'Tue 27'];
  labs.forEach((l, i) => {
    p.text(l, x[i], 223, 34, C.ink, 'center', 'Serif');
    p.line(x[i], 265, x[i], 539, C.grid, 2, [5, 6]);
  });
  const steps = daily
    ? ['History', '103 observed', 'ŷ for Tue']
    : ['History', '104 forecast', 'ŷ for Tue'];
  steps.forEach((s, i) => {
    p.rect(x[i] - 103, 344, 206, 81, i === 0 || (daily && i === 1) ? C.band : '#e0e6ef');
    p.text(s, x[i], 383, 27, i === 0 || (daily && i === 1) ? C.teal : C.blue, 'center');
  });
  if (!daily) p.arrow(318, 382, 526, 382);
  if (!direct || daily) p.arrow(744, 382, 935, 382, daily ? C.teal : C.blue);
  if (direct && !daily) {
    p.line(211, 428, 211, 505, C.blue, 3);
    p.line(211, 505, 1052, 505, C.blue, 3);
    p.arrow(1052, 505, 1052, 431, C.blue);
  }
  p.text(
    daily
      ? 'Monday evening   ·   issue after the count arrives'
      : direct
        ? 'Separate horizon predictors read Sunday’s history.'
        : 'Tuesday’s lag contains Monday’s prediction.',
    640,
    619,
    30,
    C.ink,
    'center',
    'Serif',
  );
}

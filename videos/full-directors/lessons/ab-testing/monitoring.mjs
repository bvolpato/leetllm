import { P, beat, cue, after, scale, integer, pct } from './workshop.mjs';
import {
  meter,
  standardError,
  shortcutEnrollment,
  planningPower,
  sim,
  split,
  alphaSpend,
  mixtureEvidence,
} from './evidence.mjs';

export function traffic(s, k) {
  const b = beat(k),
    m = meter();
  s.page('PLANNING SHEET', b === 1 ? 'Traffic changes the width' : 'How many incidents per arm?');
  if (b === 1 || b === 3) {
    const X = scale(-8, 16, 530, 1710);
    s.small('PER ARM', 164, 272);
    s.small('Projected interval   /   percentage points', 560, 272);
    for (const [i, n] of [200, 500, 2000].entries()) {
      if (i && !cue(k, 1, ['two hundred', 'five hundred', 'and two thousand'][i])) continue;
      const y = 384 + i * 122;
      const margin = 196 * standardError(0.38, 0.42, n, n);
      s.txt(integer(n), 164, y, 47);
      s.span(X, m.delta - margin, m.delta + margin, y, P.control);
      s.dot(X(m.delta), y, 11, P.ink);
    }
    s.axis(X, [-8, -4, 0, 4, 8, 12, 16], 721);
    s.line(
      [
        [X(0), 328],
        [X(0), 715],
      ],
      P.gold,
      3,
      [8, 10],
    );
    if (b === 3) s.small('Observed four-point lift   /   planning target +2 points', 164, 833);
  } else {
    const plan = [
      ['Baseline', '38%'],
      ['True lift', '+2 pp'],
      ['Two-sided alpha', '5%'],
      ['Target power', '80%'],
    ];
    plan.forEach(([label, v], i) => {
      const x = 165 + 414 * i;
      s.small(label, x, 351);
      s.txt(v, x, 457, 77, P.control, { face: 'Serif' });
    });
    s.line([
      [165, 567],
      [1725, 567],
    ]);
    s.txt('Planning shortcut', 165, 662, 53);
    if (cue(k, 2, 'end'))
      s.txt(integer(shortcutEnrollment) + ' / arm', 1000, 676, 85, P.ink, { face: 'Serif' });
  }
}

function bellPoints(X, y, mean, se, from = -3, to = 7) {
  const steps = Math.ceil((to - from) / 0.04);
  return Array.from({ length: steps + 1 }, (_, i) => {
    const lift = from + ((to - from) * i) / steps;
    const z = (lift - mean) / (100 * se);
    return [X(lift), y - (1.52 / se) * Math.exp(-0.5 * z ** 2)];
  });
}

function fillDensity(s, points, baseline, color) {
  s.poly([[points[0][0], baseline], ...points, [points.at(-1)[0], baseline]], color);
}

export function power(s, k) {
  const b = beat(k);
  const shortcutShown = cue(k, 4, 'end');
  const calibratedShown = cue(k, 5, 'Plan enrollment');
  const narrowing = cue(k, 7, 'Enrollment narrows', 1.2);
  const n =
    shortcutShown && !calibratedShown
      ? shortcutEnrollment
      : Math.round(9336 + (17000 - 9336) * narrowing);
  const p = planningPower(n);
  const X = scale(-3, 7, 238, 1735), y = 673;
  const cutoff = 100 * p.critical;
  const alternative = bellPoints(X, y, 2, p.alternativeSe);
  const nullCurve = b >= 2 ? bellPoints(X, y, 0, p.nullSe) : null;
  const blue = '#3e6292';
  s.page(
    'DETECTION POWER',
    b >= 6
      ? 'How often does the estimate reach the business target?'
      : 'Estimates across repeated experiments',
  );
  const launch = !!cue(k, 6, 'It runs through');
  if (nullCurve) fillDensity(s, nullCurve, y, '#d4ddd3');
  fillDensity(s, alternative, y, '#86b1e160');
  if (nullCurve) {
    for (const [from, to] of [[-3, -cutoff], [cutoff, 7]]) {
      fillDensity(s, bellPoints(X, y, 0, p.nullSe, from, to), y, '#81948d');
    }
    s.center('Zero effect', X(0), 345, 32, P.soft);
  }
  s.center('True lift +2 pp', X(2), 345, 38, blue);
  for (const sign of [-1, 1])
    s.line(
      [
        [X(sign * cutoff), 405],
        [X(sign * cutoff), y],
      ],
      P.gold,
      5,
      [8, 9],
    );
  if (launch) {
    s.line(
      [
        [X(2), 389],
        [X(2), y],
      ],
      P.rewrite,
      7,
    );
    s.txt('Launch threshold', X(2) + 144, 400, 32, P.rewrite);
  }
  s.line(alternative, blue, 5);
  if (nullCurve) s.line(nullCurve, P.soft, 5);
  s.axis(X, [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7], y);
  s.txt('Estimated lift (percentage points)', X(7), 765, 28, P.soft, { align: 'right' });
  if (cue(k, 2, 'Together the tails')) {
    for (const sign of [-1, 1])
      s.txt('2.5% null tail', X(sign * cutoff), 765, 28, P.soft, { align: sign < 0 ? 'right' : 'left' });
  }
  if (b >= 6) s.small(integer(n) + ' per arm', 1400, 305);
  const n0 = shortcutEnrollment,
    calibrated = planningPower(n0);
  const notes = [
    'Dashed lines   ·   reject in either tail',
    cue(k, 2, 'end')
      ? 'At zero effect, the two shaded tails together account for 5% of experiments.'
      : 'At a true lift of +2 pp, about 80 in 100 experiments detect a difference.',
    'With equal arms and fixed baseline, alpha and power, enrollment scales as 1 / MDE².',
    shortcutShown ? 'Baseline shortcut   ·   ' + integer(n0) + ' per arm' : 'Baseline 38%   ·   target lift +2 pp',
    integer(n0) + ' per arm' +
      (cue(k, 5, 'and needs') ? ' gives ' + pct(calibrated.power, 1) + ' power.' : '') +
      (calibratedShown ? '   ' + integer(9336) + ' gives 80%.' : ''),
    'At the true two-point gain, roughly half reach the observed two-point threshold.',
    'More incidents tighten the distribution around the same true effect.',
  ];
  if (b !== 6 || cue(k, 6, 'Even before')) s.txt(notes[b - 1], 164, 831, 37, P.ink, { max: 1620 });
}

export function allocation(s, k) {
  const replay = !!cue(k, 4, "Here's a different table"),
    v = split(replay ? [1900, 2100] : [1650, 2350]);
  const computed = replay ? cue(k, 5, 'No allocation alert') : cue(k, 2, 'end');
  const verdict = replay ? cue(k, 5, 'We still need') : cue(k, 3, 'This is a sample');
  s.page(
    'DISTINCT INCIDENT IDS    /    4,000 ENROLLED',
    'Did assignment deliver the planned 50/50 split?',
  );
  const X = scale(0, 2500, 510, 1630);
  for (let i = 0; i < 2; i++) {
    const y = 373 + i * 156;
    s.txt(i ? 'Rewrite' : 'Control', 160, y, 48, i ? P.rewrite : P.control);
    s.box(X(0), y - 26, X(v.counts[i]) - X(0), 52, i ? P.rewrite : P.control, 3);
    s.txt(integer(v.counts[i]), Math.max(X(v.expected), X(v.counts[i])) + 32, y, 36, P.ink, {
      align: 'left',
      face: 'Mono',
    });
  }
  s.line(
    [
      [X(v.expected), 304],
      [X(v.expected), 581],
    ],
    P.gold,
    4,
    [6, 8],
  );
  s.center('Expected 2,000', X(v.expected), 276, 29, P.gold);
  s.line([
    [162, 631],
    [1755, 631],
  ]);
  s.small('χ² ALERT ABOVE 10.83', 162, 705);
  if (computed) s.txt(v.parts.join('  +  ') + '  =  ' + v.total, 820, 705, 50);
  if (verdict)
    s.txt(
      v.alert ? 'Pause and trace missing IDs' : 'No allocation alert',
      161,
      826,
      55,
      v.alert ? P.bad : P.good,
      { face: 'Serif' },
    );
}

export function peeking(s, k) {
  const b = beat(k),
    trace = sim.peeking.path;
  if (b < 5) {
    s.box(77, 83, 1766, 854, '#0a2022', 28);
    s.small('CUMULATIVE BATCH RECORDER     /     SAME POLICY IN BOTH ARMS', 151, 155, '#a1c1b9');
    s.txt('One accumulating experiment', 150, 228, 64, P.white, { face: 'Serif' });
    const X = scale(1, 20, 251, 1690),
      Y = scale(-3, 3, 754, 303);
    s.small('z', 150, 301, P.white);
    s.axis(X, [1, 4, 8, 12, 16, 20], 778, String, '#c5d6ca');
    for (let j = 1; j <= 20; j++)
      s.line(
        [
          [X(j), 311],
          [X(j), 754],
        ],
        '#234044',
        2,
      );
    for (const v of [-1.96, 0, 1.96]) {
      s.line(
        [
          [X(1), Y(v)],
          [X(20), Y(v)],
        ],
        v ? P.brass : P.ridge,
        3,
        v ? [10, 9] : [],
      );
      s.txt(String(v), 147, Y(v), 27, P.white);
    }
    let n = 1;
    if (b === 1) n = 1 + Math.floor(cue(k, 1, 'Each batch', 1.6) * 2);
    if (b === 2) n = after(k, 2, 'standard errors above zero') ? 4 : 3;
    if (b === 3)
      n = after(k, 3, 'one point six one')
        ? 20
        : 4 + Math.floor(cue(k, 3, 'Run the rest of the batches', 2.8) * 15);
    if (b === 4) n = 20;
    const rows = trace.slice(0, n),
      r = rows.at(-1);
    s.line(
      rows.map((item) => [X(item.look), Y(item.z)]),
      '#99e0c0',
      7,
    );
    s.dot(X(r.look), Y(r.z), 13, '#99e0c0');
    if (after(k, 2, 'would call that a difference')) {
      const early = trace[3];
      s.dot(X(early.look), Y(early.z), 14, P.brass);
      s.center('First crossing', X(early.look), Y(early.z) - 48, 32, P.brass);
    }
    if (after(k, 3, 'inside the lines')) {
      s.txt('Planned look stays inside', X(r.look), Y(r.z) + 59, 32, P.white, { align: 'right' });
    }
    s.txt('Look ' + n + '   ·   z = ' + r.z.toFixed(2), 160, 864, 40, P.white);
    s.txt(integer(r.n) + ' per arm', 1760, 864, 38, P.white, { align: 'right' });
  } else {
    s.page('5,000 SIMULATED NULL EXPERIMENTS', 'Experiments with at least one false alarm');
    const labels = ['Final only', '5 looks', '10 looks', '20 looks'];
    const visible = [
      cue(k, 5, 'Stop at the first crossing'),
      cue(k, 5, 'Ten looks'),
      cue(k, 5, 'end'),
      cue(k, 6, "That's four point"),
    ];
    labels.forEach((v, i) => {
      const x = 250 + 423 * i,
        n = sim.peeking.alarms[i],
        h = n * 0.27;
      s.center(v, x + 84, 777, 37);
      if (!visible[i]) return;
      s.box(x, 702 - h, 168, h, i ? P.rewrite : P.control, 3);
      s.center(integer(n), x + 84, 650 - h, 45);
      s.center(pct(n / 5000, 1), x + 84, 848, 34, P.soft);
    });
    s.line([
      [160, 705],
      [1752, 705],
    ]);
  }
}

export function spending(s, k) {
  const b = beat(k);
  if (b <= 4) {
    s.page('SEQUENTIAL DESIGN', 'Cumulative false-alarm budget');
    const X = scale(0, 1, 315, 1642),
      Y = scale(0, 0.05, 747, 332);
    const t = cue(k, 1, 'At full information') ? 1 : cue(k, 1, 'Half the planned') ? 0.5 : 0;
    const points = Array.from({ length: 101 }, (_, i) => [
      X((t * i) / 100),
      Y(alphaSpend((t * i) / 100)),
    ]);
    s.line(
      [
        [X(0), Y(0.05)],
        [X(0), Y(0)],
        [X(1), Y(0)],
      ],
      P.rule,
    );
    for (const v of [0.005, 0.05]) {
      s.line(
        [
          [X(0), Y(v)],
          [X(1), Y(v)],
        ],
        P.rule,
        2,
        [6, 9],
      );
      s.txt(pct(v, 1), 171, Y(v), 32, P.soft);
    }
    s.line(points, P.control, 8);
    s.dot(X(t), Y(alphaSpend(t)), 14, P.control);
    s.axis(X, [0, 0.25, 0.5, 0.75, 1], 755, (v) => pct(v));
    s.small('Fraction of planned information', 605, 856);
    if (t === 1) {
      s.dot(X(0.5), Y(alphaSpend(0.5)), 10, P.gold);
      s.center('≈ 0.56%', X(0.5), Y(alphaSpend(0.5)) - 53, 34, P.gold);
    }
  } else {
    s.page('FINAL LOOK    /    NO EARLIER CROSSING', 'One final statistic, two designs');
    const X = scale(1.9, 2.08, 570, 1615),
      done = cue(k, 6, 'Comparing today');
    for (const [i, cut] of [1.96, 2.045].entries()) {
      const y = 422 + 235 * i;
      s.txt(i ? 'Six looks' : 'Single look', 166, y, 46);
      s.line(
        [
          [X(1.9), y],
          [X(2.08), y],
        ],
        P.rule,
        6,
      );
      s.line(
        [
          [X(cut), y - 48],
          [X(cut), y + 45],
        ],
        P.gold,
        5,
      );
      s.center('Boundary ' + cut, X(cut), y - 84, 33, P.gold);
      if (cue(k, 5, 'Which plan')) {
        s.dot(X(2), y, 16, P.control);
        s.center('z = 2', X(2), y + 58, 32);
      }
      if (done) s.txt(i ? 'Short of boundary' : 'Reject', 166, y + 68, 34, i ? P.soft : P.good);
    }
  }
}

const demo = mixtureEvidence([1, 0]),
  stream = mixtureEvidence();
export function likelihood(s, k) {
  const b = beat(k),
    long = b >= 6;
  let n;
  if (long) {
    n = Math.floor(cue(k, 6, 'Feed in ten successive successes', 2.4) * 10);
    n += Math.floor(cue(k, 8, 'Deal the failures', 2.4) * 10);
  } else {
    n = cue(k, 3, 'The null gave failure') ? 2 : cue(k, 1, 'end') ? 1 : 0;
  }
  const v = (long ? stream : demo)[n],
    seq = long ? [...Array(10).fill(1), ...Array(10).fill(0)] : [1, 0];
  s.box(84, 76, 1752, 852, '#102729', 32);
  s.small('BERNOULLI STREAM    /    NULL SUCCESS RATE 40%', 160, 141, '#b7d4c8');
  s.txt('Two models follow the same outcomes', 158, 225, 65, P.white, { face: 'Serif' });
  for (let i = 0; i < seq.length; i++) {
    const x = 160 + i * 74;
    s.box(x, 298, 61, 71, i < n ? (seq[i] ? P.control : P.bad) : P.back, 7);
    s.center(i < n ? (seq[i] ? 'S' : 'F') : '·', x + 31, 334, 38, i < n ? P.white : P.soft);
  }
  const leftReady =
    long ||
    n === 0 ||
    (n === 1 ? cue(k, 2, 'The sixty-percent model') : cue(k, 3, 'The second model'));
  const rightReady =
    long ||
    n === 0 ||
    (n === 1 ? cue(k, 2, 'Average the two ratios') : cue(k, 4, 'The two ratios'));
  const mixReady = long || n === 0 || (n === 1 ? cue(k, 2, 'end') : cue(k, 4, 'This is a mixture'));
  for (const [i, q] of [0.2, 0.6].entries()) {
    const y = 469 + i * 113;
    s.box(144, y - 46, 1595, 93, '#e9e4cf', 8);
    s.txt(pct(q) + ' model', 160, y, 46, i ? P.rewrite : P.control);
    s.txt('Likelihood ratio', 560, y, 36, P.soft);
    const ready = i ? rightReady : leftReady;
    s.txt(ready ? v.ratios[i].toFixed(3) + '×' : 'updating', 1104, y, 55, ready ? P.ink : P.soft, {
      face: 'Mono',
    });
  }
  s.line([
    [158, 677],
    [1742, 677],
  ]);
  s.txt('Mixture', 164, 750, 49, P.white);
  s.txt(mixReady ? v.current.toFixed(3) : '…', 510, 750, 62, '#a5e3bf', { face: 'Mono' });
  if (long) {
    s.txt('Peak   ' + v.maximum.toFixed(3), 1020, 750, 47, P.brass);
    s.small('Crossing line 20', 170, 854, P.white);
    if (cue(k, 9, 'A later failure')) s.small('Anytime p   ' + v.p.toFixed(4), 1018, 854, P.white);
  } else {
    const description =
      b === 3
        ? 'Failure multipliers    0.8 / 0.6    and    0.4 / 0.6'
        : 'Equal weights   ·   (ratio₁ + ratio₂) / 2';
    s.small(description, 165, 854, P.white);
  }
}

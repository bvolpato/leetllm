import {
  ink,
  dim,
  paper,
  line,
  blue,
  red,
  teal,
  gold,
  purple,
  colors,
  seq,
  sum,
  mix,
  pct,
} from './recorder.mjs';
import { durationDensity, durationCdf, durationFromRank } from '../../../films/sampling/model.mjs';
import { normalQuantile, binomialMass, poissonMass } from '../../../films/sampling/arithmetic.mjs';
import { samplingFilmData as data } from '../../../films/sampling/fixtures.mjs';
import { seededRandom } from 'vizmatic';

export const runs = [
  [2, 4, 6, 8, 9],
  [2, 4, 6, 12, 16],
];
export function deadline(p) {
  const x = p.axis(
    175,
    354,
    692,
    0,
    18,
    [0, 2, 4, 6, 8, 10, 12, 14, 16, 18],
    'seconds from arrival',
  );
  const yA = 188,
    yB = 277,
    timer = 10,
    wall = x(timer);
  p.rule(wall, 147, wall, 352, red, 2);
  p.dot(wall, 125, 21, '#b59b6a', ink);
  p.dot(wall, 125, 17, paper, dim);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    p.rule(
      wall + 13 * Math.sin(a),
      125 - 13 * Math.cos(a),
      wall + 16 * Math.sin(a),
      125 - 16 * Math.cos(a),
      dim,
    );
  }
  p.rule(wall, 125, wall + 11, 119, red, 2);
  p.dot(wall, 125, 2, ink);
  p.label(timer + ' s timer', wall + 32, 131, 18, red);
  const sweep = p.cue(0, 'This recorder', 3.4);
  const scanTime = timer * sweep;
  const lift = p.cue(2, 'Lift the cover', 0.85);
  const fourthKnown = p.spoken(2, 'The fourth reply took twelve seconds') === 1;
  const lastKnown = p.spoken(2, 'The last took sixteen') === 1;
  const lateKnown = p.spoken(2, 'Two people were still waiting at ten seconds') === 1;
  const lower = p.b >= 1;
  runs.forEach((row, i) => {
    if (i && !lower) return;
    const y = i ? yB : yA;
    p.label(i ? 'Run B' : 'Run A', 64, y + 7, 23, ink, 'left', 'Serif');
    p.rule(x(0), y, x(18), y, line, 2);
    row.forEach((t, k) => {
      if (i ? (k === 3 && !fourthKnown) || (k === 4 && !lastKnown) : t > scanTime) return;
      const late = t > timer;
      p.rule(x(t), y - 13, x(t), y + 13, k === 2 ? gold : late ? red : blue, 4);
      p.dot(x(t), y, 6, late ? red : blue);
      p.num(t, x(t), y - 21, 16, late ? red : ink, 'center');
    });
    if (!i && sweep < 1) {
      const head = x(scanTime);
      p.path(
        [[head, y + 12], [head - 6, y + 25], [head + 6, y + 25]],
        null,
        0,
        blue,
      );
    }
    if (i && !lastKnown) {
      const left = x(fourthKnown ? 13.4 : 6.5);
      const right = x(18);
      const shade = p.c.createLinearGradient(0, y - 28, 0, y + 19);
      shade.addColorStop(0, '#315b5c');
      shade.addColorStop(0.5, '#547775');
      shade.addColorStop(1, '#264e51');
      p.rect(left, y - 24 + 7 * lift, right - left, 46 - 7 * lift, shade);
      p.label(
        fourthKnown ? '1 finish under cover' : '2 finishes under cover',
        (left + right) / 2,
        y + 3 + 4 * lift,
        15,
        paper,
        'center',
      );
    }
  });
  p.footer(
    lateKnown
      ? 'Two of five replies missed the timer.'
      : lower
        ? 'How many replies can still miss the timer?'
        : 'Each mark records one reply.',
    lateKnown
      ? 'Both medians are six seconds. Only the second strip extends past the red line.'
      : lower || sweep === 1
        ? 'The third mark gives the median.'
        : '',
  );
}

export function receipt(p) {
  const times = [1.2, 3.7, 6.1],
    tools = Math.floor(3 * p.cue(0, 'calls three tools', 1.4)),
    finish = p.cue(0, 'It resolved', 0.4) === 1;
  const x = p.axis(135, 231, 695, 0, 9, [0, 2, 4, 6, 8], 'seconds');
  p.label('R17', 69, 149, 32, teal, 'left', 'Mono');
  p.label('“Can I roll back this deploy?”', 167, 148, 28, ink, 'left', 'Serif');
  p.rule(x(0), 199, x(finish ? 8.4 : (times[tools - 1] ?? 0)), 199, blue, 3);
  times.slice(0, tools).forEach((t, i) => {
    p.dot(x(t), 199, 7, blue);
    p.label('tool ' + (i + 1), x(t), 184, 15, dim, 'center');
  });
  if (finish) {
    p.dot(x(8.4), 199, 9, teal);
    p.num('8.4 s', x(8.4), 181, 17, teal, 'center');
  }
  const columns = [
    ['RESOLVED', finish ? '1' : '…', '0 or 1'],
    ['ROUTE', 'rollback', 'one of four labels'],
    ['TOOLS', tools, 'whole counts ≥ 0'],
    ['DURATION', finish ? '8.4 s' : '…', 'positive seconds'],
  ];
  columns.forEach(([name, value, domain], i) => {
    let x = 73 + i * 211;
    p.label(name, x, 319, 14, dim);
    p.num(value, x, 355, 29, ink);
    if (p.b > 0) p.label(domain, x, 390, 16, teal);
  });
  if (p.b === 2) {
    p.path(
      [
        [494, 397],
        [494, 402],
        [706, 402],
        [706, 397],
      ],
      gold,
      2,
    );
  }
  p.footer(
    'One request keeps all four measurements.',
    p.b === 2
      ? 'A cost and a time can trigger two alarms on the same request.'
      : 'R17 follows the same row from receipt to reply.',
  );
}

export function probability(p) {
  if (p.b === 0 || p.b >= 3) {
    const cumulative = p.b >= 3,
      g = p.plot({
        xmin: -0.5,
        xmax: 1.5,
        xt: [0, 1],
        yt: [0, 0.5, 1],
        unit: 'resolution flag',
        measure: cumulative ? 'accumulated probability' : 'probability mass',
      });
    const atOne = cumulative && p.cue(3, 'At one', 0) === 1;
    if (cumulative) {
      const step = p.cue(3, 'At one', 0.8);
      p.path(
        [
          [g.X(-0.5), g.Y(0)],
          [g.X(0), g.Y(0)],
          [g.X(0), g.Y(0.28)],
          [g.X(1), g.Y(0.28)],
        ],
        teal,
        4,
      );
      if (atOne)
        p.path(
          [
            [g.X(1), g.Y(0.28)],
            [g.X(1), g.Y(1)],
            [g.X(1 + 0.5 * step), g.Y(1)],
          ],
          teal,
          4,
        );
    } else {
      [0.28, 0.72].forEach((h, i) =>
        p.rect(g.X(i) - 34, g.Y(h), 68, g.Y(0) - g.Y(h), i ? teal : red),
      );
    }
    p.readout(cumulative ? 'At or below 0' : 'Escalated', '0.28');
    p.readout(
      cumulative ? 'At or below 1' : 'Resolved',
      cumulative ? (atOne ? '1.00' : '?') : '0.72',
      655,
      286,
    );
    p.footer(
      cumulative
        ? 'The CDF adds each mass as you pass it.'
        : 'Each PMF bar gives the chance of one outcome.',
      '0 = escalated     1 = resolved',
    );
  } else {
    const g = p.plot({
      xmax: 0.5,
      ymax: 2.25,
      xt: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
      yt: [0, 1, 2],
      unit: 'duration in seconds',
      measure: 'density per second',
    });
    p.rect(g.X(0), g.Y(2), g.w, g.Y(0) - g.Y(2), '#cdd9c6');
    const t = p.cue(2, 'An exact point', 1.3),
      w = Math.round(20 * (1 - t)) / 100,
      a = 0.2 - w / 2,
      z = 0.2 + w / 2;
    p.rect(g.X(a), g.Y(2), g.X(z) - g.X(a), g.Y(0) - g.Y(2), '#67a899');
    p.rule(g.X(a), g.Y(2), g.X(a), g.Y(0), teal, 2);
    p.readout('Width × density', w.toFixed(2) + ' × 2');
    p.readout('Interval area', (2 * w).toFixed(2), 655, 286);
    p.footer(
      'The probability is the area of the interval.',
      'The whole rectangle covers half a second and has area one.',
    );
  }
}

export function transform(p) {
  const top = p.axis(124, 184, 690, -2, 2, [-2, -1, 0, 1, 2], 'standard normal noise');
  const base = p.axis(124, 347, 690, 0, 20, [0, 5, 10, 15, 20], 'positive duration (seconds)');
  const t = p.cue(1, 'Try minus one', 1.9);
  [-1, 0, 1].forEach((z, i) => {
    const end = 6 * Math.exp(0.55 * z),
      a = [top(z), 185],
      last = [base(end), 338];
    p.dot(...a, 7, colors[i]);
    if (t > 0) {
      p.rule(...a, mix(a[0], last[0], t), mix(a[1], last[1], t), colors[i], 3);
    }
    if (t === 1) {
      p.dot(...last, 7, colors[i]);
      p.rect(last[0] - 25, 300, 50, 24, paper);
      p.num(end.toFixed(2), last[0], 319, 17, ink, 'center');
    }
  });
  if (p.b === 2) {
    const mean = 6 * Math.exp(0.55 ** 2 / 2);
    p.rule(base(mean), 336, base(mean), 347, red, 2);
    p.label('Mean 6.98 s', base(mean) + 28, 386, 16, red);
  }
  p.footer(
    'T = 6 × exp(0.55 × Z)',
    p.b === 2
      ? 'Median 6 s     Mean ' +
          (6 * Math.exp(0.55 ** 2 / 2)).toFixed(2) +
          ' s     Right-hand tail pulls the mean up.'
      : 'Equal steps in noise multiply the duration by equal factors.',
  );
}

export function area(p) {
  const g = p.plot({
    ymax: 0.16,
    yt: [0, 0.08, 0.16],
    unit: 'duration (seconds)',
    measure: 'density per second',
  });
  const close = p.cue(1, 'Bring the two boundaries', 1.6),
    sweep = p.cue(2, 'Now sweep', 2);
  const a = p.b < 2 ? 5 + Math.round(10 * close) / 10 : 0,
    z = p.b < 2 ? 7 - Math.round(10 * close) / 10 : Math.round(100 * sweep) / 10;
  const mass = durationCdf(z) - durationCdf(a);
  g.fill(durationDensity, a, z, '#85baab');
  if (p.b === 2 && sweep === 1) g.fill(durationDensity, 10, 24, '#e6ae96');
  g.curve(durationDensity);
  [a, z].forEach((t) => p.rule(g.X(t), g.Y(0), g.X(t), g.Y(durationDensity(t)), gold, 2));
  p.readout('Interval', a.toFixed(1) + '–' + z.toFixed(1) + ' s');
  p.readout('Probability inside', pct(mass), 655, 286);
  p.footer(
    p.b === 2
      ? 'Which side of ten seconds contains late replies?'
      : 'Move the boundaries on the same density.',
    p.b === 2 && sweep === 1
      ? pct(1 - mass) +
          ' of the model lies beyond the deadline, including the tail outside this plot.'
      : 'A vertical line has zero width.',
  );
}

export function inverse(p) {
  const tail = p.cue(2, 'Follow the same route', 1.3),
    rank = p.b === 2 ? 0.95 : 0.25,
    trace = p.b === 2 ? tail : p.cue(1, 'Move horizontally', 1.6);
  const g = p.plot({
    yt: [0, 0.5, 1],
    unit: 'duration (seconds)',
    measure: 'cumulative probability',
  });
  g.curve(durationCdf);
  const d = durationFromRank(rank);
  p.rule(g.X(0), g.Y(rank), g.X(d * Math.min(1, trace * 2)), g.Y(rank), gold, 3);
  if (trace > 0.5) p.rule(g.X(d), g.Y(rank), g.X(d), g.Y(rank * (2 - 2 * trace)), gold, 3);
  p.dot(g.X(0), g.Y(rank), 5, gold);
  p.readout('Uniform rank', rank.toFixed(2));
  p.readout('Time at that rank', trace === 1 ? d.toFixed(2) + ' s' : '?', 655, 286);
  p.footer(
    'Read across to the CDF, then down to the time.',
    p.b === 2
      ? 'The upper 5% of ranks stretches across the entire remaining tail.'
      : 'Every equal-width interval on the rank scale is equally likely.',
  );
}

export const forwardSeconds = 6;
export const quartileIntervals = [
  [0.25, 0.5],
  [0.5, 0.75],
].map(([lo, hi]) => ({
  lo,
  hi,
  start: durationFromRank(lo),
  end: durationFromRank(hi),
}));

function forwardRank(p) {
  const rank = durationCdf(forwardSeconds);
  const g = p.plot({
    yt: [0, 0.25, 0.5, 0.75, 1],
    unit: 'duration (seconds)',
    measure: 'cumulative probability',
  });
  g.curve(durationCdf);
  const up = p.cue(1, 'Go up from six seconds', 1.3);
  const across = p.cue(1, 'then read across', 1.2);
  const y = g.Y(up * rank);
  const x = g.X(forwardSeconds * (1 - across));
  const bins = p.cue(1, 'colored intervals', 0) === 1;
  if (bins) {
    quartileIntervals.forEach(({ lo, hi, start, end }, i) => {
      const color = i ? purple : blue;
      p.rule(g.X(start), g.Y(0), g.X(end), g.Y(0), color, 7);
      p.rule(g.X(0), g.Y(lo), g.X(0), g.Y(hi), color, 7);
      g.curve(durationCdf, color, start, end);
    });
  }
  p.rule(g.X(forwardSeconds), g.Y(0), g.X(forwardSeconds), y, gold, 3);
  p.rule(g.X(forwardSeconds), y, x, y, gold, 3);
  p.dot(g.X(forwardSeconds), g.Y(0), 5, gold);
  p.dot(x, y, 6, gold);
  p.readout('Input time', forwardSeconds.toFixed(2) + ' s', 655, 158);
  p.readout('Output rank', across === 1 ? rank.toFixed(2) : '?', 655, 244);
  if (bins) {
    quartileIntervals.forEach(({ lo, hi, start, end }, i) => {
      p.label(
        start.toFixed(2) + '–' + end.toFixed(2) + ' s  →  ' + lo.toFixed(2) + '–' + hi.toFixed(2),
        651,
        340 + i * 32,
        17,
        i ? purple : blue,
      );
    });
  }
  p.footer(
    bins
      ? 'Each colored time interval contains 25% of replies.'
      : 'Start with the time of a reply drawn from this model.',
    bins
      ? 'Each covers 0.25 on the rank axis. Across repeated draws, F(T) is uniform.'
      : 'Follow the duration up to its CDF, then left to read its rank.',
  );
}

export function inverseRules(p) {
  if (p.b === 0) {
    const g = p.plot({
      xmax: 4,
      xt: [0, 1, 2, 3, 4],
      yt: [0, 0.5, 1],
      unit: 'outcome',
      measure: 'cumulative probability',
    });
    const steps = [
      [0, 0],
      [1, 0],
      [1, 0.35],
      [3, 0.35],
      [3, 1],
      [4, 1],
    ];
    p.path(
      steps.map(([x, y]) => [g.X(x), g.Y(y)]),
      teal,
      4,
    );
    const chosen = p.cue(0, 'Try rank', 0) === 1;
    const scan = p.cue(0, 'The staircase first reaches', 1.1);
    if (chosen) {
      p.rule(g.X(0), g.Y(0.35), g.X(scan), g.Y(0.35), gold, 3);
      p.dot(g.X(scan), g.Y(0.35), 6, gold);
    }
    p.readout('Selected rank', chosen ? '0.35' : '?');
    p.readout('First point reached', scan === 1 ? '1' : '?', 655, 286);
    p.footer(
      'Stop at the first outcome whose CDF reaches the rank.',
      'An entire flat stretch can have the same height.',
    );
  } else if (p.b === 1) {
    forwardRank(p);
  } else if (p.b === 5) {
    p.label('Finish time', 93, 162, 20, dim);
    p.label('Lognormal model', 379, 162, 20, dim);
    p.label('5,000 seeded draws', 629, 162, 20, dim);
    [
      ['Median', 0.5, 6.03],
      ['95th percentile', 0.95, 14.85],
    ].forEach(([name, rank, sample], i) => {
      const y = 232 + 80 * i;
      p.rule(92, y + 19, 866, y + 19, line);
      p.label(name, 93, y, 24, ink);
      p.num(durationFromRank(rank).toFixed(2) + ' s', 379, y, 27, blue);
      p.num(sample.toFixed(2) + ' s', 629, y, 27, teal);
    });
    p.footer(
      'A finite sample has its own median and 95th percentile.',
      'Both columns use the same lognormal duration model.',
    );
  } else {
    const u = 0.95,
      exp = -Math.log1p(-u) / 20,
      logn = durationFromRank(u);
    p.label('Uniform rank', 77, 158, 20, dim);
    p.num('0.95', 74, 226, 48, gold);
    const rows = [
      ['Exponential service', '−log(1 − u) / 20', exp.toFixed(3) + ' s'],
      ['Lognormal reply', '6 × exp(0.55 × Φ⁻¹(u))', logn.toFixed(2) + ' s'],
    ];
    rows.slice(0, p.b === 2 ? 1 : 2).forEach(([n, f, v], i) => {
      const y = 158 + i * 113;
      p.rule(243, y + 18, 280, y + 18, dim, 2);
      p.label(n, 299, y, 20, ink);
      p.num(f, 299, y + 40, 23, teal);
      p.num(v, 859, y + 39, 27, ink, 'right');
    });
    if (p.b >= 4) {
      p.rule(92, 343, 844, 343, line, 4);
      p.dot(92, 343, 8, paper, red);
      p.dot(844, 343, 8, paper, red);
      p.dot(92 + 0.95 * 752, 343, 7, gold);
      p.label('0  redraw', 82, 376, 17, red);
      p.label('1  excluded', 860, 376, 17, red, 'right');
    }
    p.footer(
      p.b >= 4
        ? 'Keep ranks inside the domain of the quantile.'
        : p.b === 2
          ? 'The exponential quantile turns a rank into service seconds.'
          : 'At the same rank, the two models give different times.',
      p.b === 4
        ? 'Python can return zero. Redraw it when the transformation requires an interior rank.'
        : 'Reflecting an ideal uniform rank gives another uniform rank.',
    );
  }
}

const rng = seededRandom(1701);
export const flags = seq(100, () => Number(rng() < 0.72));
export function resolutions(p) {
  if (p.b < 3) {
    const n = Math.floor(
      4 * p.cue(0, 'Draw the first four', 1.4) + 96 * p.cue(1, 'Fill the rest', 2.3),
    );
    flags.forEach((v, i) =>
      p.dot(
        91 + (i % 20) * 25,
        160 + Math.floor(i / 20) * 39,
        8,
        i >= n ? paper : v ? teal : paper,
        i >= n ? line : v ? teal : red,
      ),
    );
    p.readout('Resolved / drawn', sum(flags.slice(0, n)) + ' / ' + n);
    p.readout('Expected in 100', p.b === 2 ? '72' : '100 × p', 655, 286);
    p.footer(
      'Each filled punch contributes one resolution.',
      'An open red punch records an escalation.',
    );
  } else {
    const g = p.plot({
      xmin: 50,
      xmax: 90,
      ymax: 0.1,
      xt: [50, 60, 70, 80, 90],
      yt: [0, 0.05, 0.1],
      unit: 'resolutions per 100',
      measure: 'binomial probability',
    });
    for (let k = 50; k <= 90; k++) {
      let v = binomialMass(k, 100, 0.72);
      p.rect(g.X(k) - 4, g.Y(v), 8, g.Y(0) - g.Y(v), k === 72 ? gold : '#79a69a');
    }
    if (p.b >= 4) data.resolved.forEach((n, i) => p.dot(g.X(n), g.Y(0) - 7, 4, ink));
    p.readout('P(exactly 72)', pct(binomialMass(72, 100, 0.72)));
    p.readout('Count variance', (100 * 0.72 * 0.28).toFixed(2), 655, 286);
    p.footer(
      p.b >= 4
        ? 'Six more batches leave six different marks.'
        : 'Many arrangements have the same total.',
      p.b >= 4
        ? 'Observed counts: ' +
            data.resolved.join(', ') +
            '.  Related requests can change this spread.'
        : 'Each arrangement contributes 72 successes and 28 escalations.',
    );
  }
}
export const routes = ['CI failure', 'rollback', 'access', 'log triage'],
  weights = [0.45, 0.2, 0.2, 0.15];
export const edge = weights.map((_, i) => sum(weights.slice(0, i + 1)));
export const routeIndex = (u) => edge.findIndex((e) => u < e);
export function routing(p) {
  let x = 75;
  const w = 806,
    rank = 0.57;
  const pos = 75 + w * rank;
  p.label('Route assigned to R18', 75, 145, 22, ink, 'left', 'Serif');
  weights.forEach((v, i) => {
    p.rect(x, 199, w * v - 1, 51, colors[i]);
    p.label(routes[i], x + (w * v) / 2, 185, 17, colors[i], 'center');
    p.num(pct(v, 0), x + (w * v) / 2, 232, 20, '#fff4dc', 'center');
    x += w * v;
  });
  p.num('0', 75, 274, 16, dim);
  p.num('1', 881, 274, 16, dim, 'right');
  if (p.b > 0) {
    p.path(
      [
        [pos, 252],
        [pos - 7, 266],
        [pos + 7, 266],
      ],
      null,
      0,
      ink,
    );
    p.num('0.57', pos, 293, 18, ink, 'center');
  }
  const keys = ['ci_failure', 'rollback', 'access_request', 'log_triage'];
  if (p.b === 3) {
    let x = 75;
    weights.forEach((v, i) => {
      p.num(
        Math.round(500 * v) + ' / ' + data.routeCounts[keys[i]],
        x + (w * v) / 2,
        350,
        19,
        ink,
        'center',
      );
      x += w * v;
    });
    p.label('Expected / observed in 500 draws', 75, 391, 17, dim);
  }
  p.footer(
    p.b < 2 ? 'Where does the rank fall?' : 'R18 takes the ' + routes[routeIndex(rank)] + ' route.',
    p.b === 3
      ? 'The four counts share a fixed total of 500.'
      : 'Every request must land in exactly one interval.',
  );
}
export const products = [1];
for (const u of [0.8, 0.7, 0.6, 0.5, 0.4]) products.push(products.at(-1) * u);
export const cutoff = Math.exp(-2.2),
  stopped = products.findIndex((v) => v <= cutoff) - 1;
export const zeroCutoff = Math.exp(0);
export const expensive = 1 - sum(seq(6, (k) => poissonMass(k, 2.2)));
export function poisson(p) {
  if (p.b < 2) {
    const g = p.plot({
      xmin: -0.5,
      xmax: 10.5,
      ymax: 0.3,
      xt: [0, 2, 4, 6, 8, 10],
      yt: [0, 0.15, 0.3],
      unit: 'tool calls per request',
      measure: 'probability mass',
    });
    seq(11, (k) => {
      let v = poissonMass(k, 2.2);
      p.rect(g.X(k) - 13, g.Y(v), 26, g.Y(0) - g.Y(v), p.b && k > 5 ? red : teal);
    });
    p.readout(
      p.b ? 'More than five calls' : 'Two calls',
      pct(p.b ? expensive : poissonMass(2, 2.2)),
    );
    p.readout('Mean = variance', '2.2', 655, 286);
    p.footer(
      'Each bar stands at a whole number of calls.',
      p.b ? 'The costly tail starts at six.' : 'Zero calls is an allowed outcome.',
    );
  } else {
    const g = p.plot({
      xmax: 5,
      xt: [0, 1, 2, 3, 4, 5],
      yt: [0, 0.5, 1],
      unit: 'uniform draws multiplied',
      measure: 'running product',
    });
    const zeroRate = p.cue(4, 'At rate zero', 0) === 1;
    const limit = zeroRate ? zeroCutoff : cutoff;
    const n = zeroRate
      ? Number(p.cue(4, 'the first draw stops', 0) === 1)
      : Math.floor(4 * p.cue(2, 'multiply by a fresh', 2) + p.cue(4, 'below the cutoff', 0.65));
    g.curve(() => limit, red);
    const pts = products.slice(0, n + 1).map((v, i) => [g.X(i), g.Y(v)]);
    p.path(pts, teal, 3);
    pts.forEach(([x, y]) => p.dot(x, y, 6, teal));
    p.readout('Product', products[n].toFixed(3));
    p.readout('Stop at or below', limit.toFixed(3), 655, 286, red);
    p.footer(
      zeroRate
        ? n
          ? 'Stop on draw one. Return zero calls.'
          : 'Reset the rate to zero and start the product at one.'
        : n === 5
          ? 'Stop on draw five. Return four calls.'
          : 'Will the next factor take the product below the cutoff?',
      zeroRate
        ? 'At rate zero the cutoff is 1. Every interior uniform draw falls below it.'
        : p.b === 3
          ? 'Four accepted factors give 0.168. Multiply by 0.4 for the next draw.'
          : n === 5
            ? 'At rate 2.2, four products stayed above the cutoff.'
            : 'Start at one. Multiply by successive independent uniform draws.',
    );
  }
}
export const histStats = data.countHistograms.map((h) => {
  const n = sum(h),
    mean = sum(h.map((v, i) => i * v)) / n,
    variance = sum(h.map((v, i) => (i - mean) ** 2 * v)) / n;
  return { n, mean, variance, late: sum(h.slice(6)) };
});
export function mixtures(p) {
  const mark = p.cue(2, 'Start at six', 1);
  data.countHistograms.forEach((h, i) => {
    const base = 222 + 139 * i,
      scale = 0.05;
    const x = p.axis(152, base, 460, -0.5, 21.5, [0, 5, 10, 15, 20]);
    p.label(i ? 'Mix rates' : 'One rate', 55, base - 30, 20, ink, 'left', 'Serif');
    h.forEach((v, k) =>
      p.rect(x(k) - 7, base - v * scale, 14, v * scale, mark > 0 && k >= 6 ? red : i ? blue : teal),
    );
    p.rule(x(5.5), base - 92, x(5.5), base, red, 1.5);
    const s = histStats[i];
    p.label('Mean ' + s.mean.toFixed(2), 648, base - 61, 19, dim);
    p.num(
      mark === 1 ? s.late + ' / ' + s.n : '>5 calls?',
      647,
      base - 24,
      25,
      mark === 1 ? red : ink,
    );
    if (p.b >= 3)
      p.label('Variance / mean   ' + (s.variance / s.mean).toFixed(2), 649, base + 8, 16, dim);
  });
  p.footer(
    mark === 1
      ? 'Similar mean use, very different bill.'
      : 'Which batch would cost more above five calls?',
    p.b >= 3
      ? 'A mixed rate adds spread. Check the order of retries before attributing it to bursts in time.'
      : 'Each strip contains 5,000 sampled requests. Both charts use the same scale.',
  );
}

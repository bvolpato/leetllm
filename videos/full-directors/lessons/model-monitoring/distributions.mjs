import assert from 'node:assert/strict';
import {
  reference,
  current,
  psiTerms,
  psi,
  predictionRows,
} from '../../../films/model-monitoring/fixtures.mjs';
import {
  C,
  surface,
  box,
  circle,
  line,
  txt,
  mono,
  serif,
  heading,
  arrow,
  pct,
  fix,
  sum,
} from './instruments.mjs';

const names = ['0–4 h', '4–12 h', '12–24 h', '24 h+'];
const tones = [C.sea, '#4e9991', '#af8a48', C.red];
const growthFactors = reference.map((share, i) => current[i] / share);
const fastestGrowth = growthFactors.indexOf(Math.max(...growthFactors));
const largestTerm = psiTerms.indexOf(Math.max(...psiTerms));
export function bins(c, s) {
  surface(c);
  const showGrowth = s.at(3, 'The oldest bucket quadrupled');
  const showIndex = s.at(3, 'about zero point three seven');
  heading(
    c,
    'TWO WINDOWS    /    100 ACCEPTED REQUESTS EACH',
    s.beat === 1
      ? 'Where did the heartbeat ages move?'
      : showIndex
        ? 'The population stability index across all four bins'
        : 'Which bucket grew by the largest factor?',
  );
  const baseline = 790,
    scale = 8.6;
  for (let j = 0; j <= 50; j += 10) {
    const y = baseline - scale * j;
    line(
      c,
      [
        [230, y],
        [1760, y],
      ],
      C.rule,
      2,
    );
    mono(c, j + '%', 191, y, 29, C.muted, 'right');
  }
  reference.forEach((e, i) => {
    const x = 333 + i * 365;
    [
      [e, C.muted],
      [current[i], C.sea],
    ].forEach(([v, col], j) => {
      const h = v * 100 * scale,
        xx = x + j * 104;
      box(c, xx, baseline - h, 81, h, col);
      for (let k = 5; k < v * 100; k += 5)
        line(
          c,
          [
            [xx, baseline - k * scale],
            [xx + 81, baseline - k * scale],
          ],
          C.paper,
          2,
        );
      mono(c, pct(v), xx + 40, baseline - h - 31, 35, col, 'center');
    });
    txt(c, names[i], x + 90, 851, 38, C.ink, { align: 'center' });
  });
  box(c, 705, 238, 25, 25, C.muted);
  txt(c, 'Reference', 747, 252, 32);
  box(c, 979, 238, 25, 25, C.sea);
  txt(c, 'Current', 1020, 252, 32);
  if (showIndex) {
    mono(c, 'PSI  ' + fix(psi), 171, 954, 51, C.sea);
    if (s.at(3, 'This lab’s inspection threshold'))
      txt(c, 'Inspection threshold 0.20', 645, 954, 38);
    if (s.at(3, 'Crossing it')) txt(c, 'Inspect source and traffic mix', 1194, 954, 37);
  } else if (showGrowth) {
    const i = fastestGrowth;
    const calculation = pct(current[i]) + ' ÷ ' + pct(reference[i]) + ' = ' + growthFactors[i];
    mono(c, names[i] + '    ' + calculation, 960, 954, 51, C.sea, 'center');
  } else if (s.beat === 2) {
    txt(c, 'Growth factor = current share ÷ reference share', 960, 954, 43, C.ink, { align: 'center' });
  }
}
const divergence = (p, q) =>
  sum(
    p.map((v, i) => {
      const u = q[i];
      if (v === u) return 0;
      if (v === 0 || u === 0) return Infinity;
      return (u - v) * Math.log(u / v);
    }),
  );
const tri = [
  [0.1, 0.9],
  [0.2, 0.8],
  [0.3, 0.7],
];
const direct = divergence(tri[0], tri[2]),
  legs = [divergence(tri[0], tri[1]), divergence(tri[1], tri[2])];
export function accumulation(c, s) {
  surface(c);
  if (s.beat <= 4) {
    heading(
      c,
      'FIXED BINS    /    POPULATION STABILITY INDEX',
      'Build the index one bin at a time',
    );
    const present = [
      s.at(2, 'Their product is positive'),
      s.at(3, 'The next bin adds'),
      s.at(3, 'The third adds'),
      s.at(3, 'The oldest adds'),
    ];
    const showSum = s.at(3, 'Together the four terms');
    const showWinner = s.at(4, 'The oldest bin contributes the most');
    mono(c, '(a − e) × ln(a / e)', 146, 263, 49, C.sea);
    txt(c, 'Both shares are positive', 885, 263, 36, C.muted);
    ['Heartbeat', 'Reference  e', 'Current  a', 'Contribution'].forEach((t, i) =>
      txt(c, t, [147, 504, 891, 1260][i], 372, 34, C.muted),
    );
    reference.forEach((e, i) => {
      const y = 457 + i * 86;
      if (showWinner && i === largestTerm) box(c, 134, y - 40, 1644, 80, '#f5d7ae', 6);
      line(
        c,
        [
          [144, y - 43],
          [1778, y - 43],
        ],
        C.rule,
        2,
      );
      [names[i], fix(e), fix(current[i]), present[i] ? fix(psiTerms[i], 3) : '·'].forEach((v, j) =>
        mono(c, v, [147, 530, 930, 1300][j], y, 45, j === 3 ? tones[i] : C.ink),
      );
    });
    if (s.beat === 2) {
      const result = present[0] ? '  ≈  +' + fix(psiTerms[0], 3) : '';
      mono(c, '(−0.20) × ln(0.60)' + result, 145, 901, 46, C.sea);
    } else if (showSum) {
      let x = 148;
      psiTerms.forEach((v, i) => {
        const w = (1120 * v) / psi;
        box(c, x, 810, w - 2, 64, tones[i]);
        x += w;
      });
      mono(c, 'PSI  ' + fix(psi, 3), 1330, 843, 51, C.ink);
      if (s.beat === 3 && s.at(3, 'Compare the entries'))
        txt(c, 'Which bin contributes the most to PSI?', 147, 949, 43);
      if (s.at(4, 'Multiply that change')) {
        const i = largestTerm;
        const factors = fix(current[i] - reference[i]) + ' × ln(' + growthFactors[i] + ')';
        mono(c, factors + ' ≈ ' + fix(psiTerms[i], 3), 147, 949, 44, C.red);
        if (s.at(4, 'over fifty-six percent'))
          txt(c, fix((100 * psiTerms[i]) / psi, 1) + '% of total PSI', 1326, 949, 40, C.red);
      }
    }
    return;
  }
  if (s.beat <= 6) {
    heading(c, 'SYMMETRIC DIVERGENCE', 'One jump or two?');
    const xs = [350, 960, 1570];
    tri.forEach((pair, i) => {
      const x = xs[i] - 182;
      serif(c, String.fromCharCode(65 + i), xs[i], 322, 70, C.ink, 'center');
      box(c, x, 407, 364, 100, C.muted, 5);
      box(c, x, 407, 364 * pair[0], 100, C.sea);
      mono(c, pair.map((v) => fix(v, 1)).join(' / '), xs[i], 558, 39, C.ink, 'center');
    });
    const showDirect = s.at(5, 'Through the middle'),
      showVia = s.at(5, 'END');
    line(
      c,
      [
        [350, 630],
        [350, 670],
        [1570, 670],
        [1570, 630],
      ],
      C.brass,
      5,
    );
    if (showDirect) mono(c, 'A → C    ' + fix(direct, 3), 960, 732, 52, C.brass, 'center');
    if (showVia) {
      mono(
        c,
        'A → B → C    ' + fix(legs[0], 3) + ' + ' + fix(legs[1], 3) + ' ≈ ' + fix(sum(legs), 3),
        960,
        850,
        43,
        C.sea,
        'center',
      );
      if (s.beat === 6)
        txt(c, 'The direct jump exceeds the two legs combined.', 960, 943, 43, C.ink, {
          align: 'center',
        });
    }
    return;
  }
  heading(c, 'LIMITS OF THE DIAGNOSTIC', 'What did a bucket hide?');
  if (s.beat === 7) {
    [
      ['Both shares zero', '0'],
      ['One share zero', '∞'],
      ['Empty window', 'Invalid'],
    ].forEach(([t, v], i) => {
      const x = 126 + i * 594;
      txt(c, t, x, 372, 42);
      line(
        c,
        [
          [x, 447],
          [x + 455, 447],
        ],
        C.rule,
        4,
      );
      const visible = [s.at(7, 'Positive mass'), s.at(7, 'An optional'), s.at(7, 'END')][i];
      if (visible) serif(c, v, x, 580, 79, i === 0 ? C.sea : C.red);
    });
    if (s.at(7, 'this changes'))
      txt(
        c,
        'Smoothing adds the same pseudocount to every bin before normalization.',
        126,
        845,
        45,
      );
  } else {
    const xx = (v) => 240 + v * 350;
    for (let h = 0; h <= 4; h++) {
      line(
        c,
        [
          [xx(h), 350],
          [xx(h), 712],
        ],
        C.rule,
        2,
      );
      mono(c, h + ' h', xx(h), 764, 35, C.muted, 'center');
    }
    [0.5, 0.8, 1.1, 1.4].forEach((v, i) => {
      circle(c, xx(v), 442 + i * 17, 12, C.muted);
      circle(c, xx(v + 2), 612 + i * 17, 12, C.sea);
    });
    txt(c, 'Reference', 1575, 413, 36, C.muted);
    txt(c, 'Current', 1575, 644, 36, C.sea);
    txt(c, 'All eight observations stay inside the same 0–4 hour bin.', 150, 935, 45);
  }
}
const samples = [
  [0, 4],
  [2, 2],
];
const fraction = (a, x) => a.filter((v) => v <= x).length / a.length;
function distances(a, b) {
  const xs = [...new Set([...a, ...b])];
  const sorted = (v) => v.slice().sort((x, y) => x - y),
    aa = sorted(a),
    bb = sorted(b);
  return {
    ks: Math.max(...xs.map((x) => Math.abs(fraction(a, x) - fraction(b, x)))),
    w1: sum(aa.map((v, i) => Math.abs(v - bb[i]))) / aa.length,
  };
}
const dist = distances(...samples);
export function continuous(c, s) {
  surface(c);
  const transport = s.beat >= 3 && s.beat <= 5;
  heading(
    c,
    'UNBINNED HEARTBEAT AGES    /    HOURS',
    transport ? 'How far does each half travel?' : 'Read the gap between cumulative curves',
  );
  const xx = (v) => 330 + v * 285,
    yy = (v) => 765 - 435 * v;
  if (!transport) {
    [0, 0.5, 1].forEach((v) => {
      line(
        c,
        [
          [240, yy(v)],
          [1678, yy(v)],
        ],
        C.rule,
        2,
      );
      mono(c, fix(v, 1), 203, yy(v), 33, C.muted, 'right');
    });
    samples.forEach((a, i) => {
      let points = [[240, yy(0)]],
        last = 0;
      for (const t of [...new Set(a)]) {
        points.push([xx(t), yy(last)]);
        last = fraction(a, t);
        points.push([xx(t), yy(last)]);
      }
      points.push([1678, yy(last)]);
      line(c, points, i ? C.red : C.sea, 9);
    });
    mono(c, '[0, 4] h', 575, 255, 35, C.sea);
    mono(c, '[2, 2] h', 1020, 255, 35, C.red);
    if (s.at(1, 'Half the first')) {
      const x = xx(1);
      line(
        c,
        [
          [x, yy(0)],
          [x, yy(0.5)],
        ],
        C.brass,
        6,
      );
      [0, 0.5].forEach((v) => circle(c, x, yy(v), 10, C.gold, C.ink, 2));
      if (s.at(2, 'This is the') || s.beat > 2)
        mono(c, 'D = ' + fix(dist.ks, 1), x + 29, yy(0.24), 42, C.ink);
    }
    for (let i = 0; i <= 4; i++) mono(c, i + ' h', xx(i), 831, 33, C.muted, 'center');
    if (s.beat >= 6)
      txt(
        c,
        'PSI measures bin shares. KS measures a fraction. Transport keeps the units of age.',
        128,
        937,
        39,
      );
  } else {
    const q = s.motion(3, 'Send the observation', 2.0);
    [0, 4].forEach((v, i) => {
      const y = 442 + i * 225;
      line(
        c,
        [
          [xx(0) - 40, y],
          [xx(4) + 40, y],
        ],
        C.rule,
        3,
      );
      circle(c, xx(2), y, 38, undefined, C.red, 4);
      circle(c, xx(v), y, 40, undefined, C.sea, 3);
      if (q > 0.02) arrow(c, xx(v), y, xx(v + (2 - v) * q), y, C.sea, 6);
      circle(c, xx(v + (2 - v) * q), y, 38, C.sea);
      mono(c, '½', xx(v + (2 - v) * q), y, 39, C.white, 'center');
    });
    for (let i = 0; i <= 4; i++) mono(c, i + ' h', xx(i), 780, 34, C.muted, 'center');
    if (s.at(3, 'END'))
      mono(c, 'W₁  =  ½ × 2 h + ½ × 2 h  =  ' + dist.w1 + ' h', 960, 925, 48, C.sea, 'center');
  }
}
const pools = [0.1, 0.4];
function mixture(n) {
  return [n, 100 - n].map((jobs, i) => ({
    jobs,
    misses: Math.round(jobs * pools[i]),
    rate: pools[i],
  }));
}
export function driftTypes(c, s) {
  surface(c, true);
  if (s.beat <= 4) {
    const kind = Math.min(3, s.beat);
    const lesson =
      kind === 1
        ? ['Group by queue length', 'Short queues', 'Long queues', 'missed']
        : kind === 2
          ? ['Compare jobs with the same inputs', 'Short queues', 'Long queues', 'missed']
          : ['Group by deadline outcome', 'Met deadline', 'Missed deadline', 'long queues'];
    heading(c, 'SHIFT DIAGNOSIS    /    ILLUSTRATIVE COUNTS', lesson[0], true);
    const before =
      kind === 3
        ? [
            [20, 4],
            [20, 16],
          ]
        : [
            [20, 2],
            [20, 8],
          ];
    const after =
      kind === 1
        ? [
            [10, 1],
            [30, 12],
          ]
        : kind === 2
          ? [
              [20, 2],
              [20, 12],
            ]
          : [
              [30, 6],
              [10, 8],
            ];
    txt(c, 'Earlier window', 518, 306, 38, C.mint);
    txt(c, 'Later window', 1198, 306, 38, C.mint);
    [before, after].forEach((window, col) =>
      window.forEach(([n, hits], i) => {
        const y = 385 + i * 210,
          x = 518 + col * 680;
        if (!col) txt(c, lesson[i + 1], 112, y + 41, 42, C.cream);
        for (let j = 0; j < n; j++)
          circle(
            c,
            x + (j % 15) * 29,
            y + Math.floor(j / 15) * 36,
            10,
            j < hits ? C.coral : '#718c7c',
          );
        mono(c, hits + '/' + n + ' ' + lesson[3], x, y + 101, 34, C.cream);
      }),
    );
    const answer =
      kind === 1 ? 'Covariate shift' : kind === 2 ? 'Concept drift' : 'Pure label shift';
    if (s.beat === 4)
      txt(c, 'Compare the recorded queue lengths with the source counter.', 116, 913, 46, C.cream);
    else if (s.at(s.beat, 'END')) serif(c, answer, 119, 900, 69, C.gold);
    return;
  }
  if (s.beat === 7) {
    heading(c, 'SCORE OR POLICY?', 'The scores can stay fixed', true);
    const x = (v) => 190 + 1510 * v;
    const t = s.at(7, 'while holding') ? 0.8 : 0.5;
    line(
      c,
      [
        [x(0), 560],
        [x(1), 560],
      ],
      C.mint,
      4,
    );
    predictionRows.slice(0, 5).forEach((r, i) => {
      circle(c, x(r.score), 560, 18, r.score >= t ? C.gold : C.mint);
      mono(c, fix(r.score), x(r.score), 647 + (i === 3 ? 66 : 0), 33, C.cream, 'center');
    });
    line(
      c,
      [
        [x(t), 340],
        [x(t), 597],
      ],
      C.coral,
      6,
    );
    mono(c, 'Review ≥ ' + fix(t), x(t), 284, 42, C.coral, 'center');
    txt(c, 'Log raw scores and decisions separately.', 130, 882, 48, C.cream);
    return;
  }
  heading(c, 'TWO RUNNER POOLS    /    100 JOBS', 'Keep the within-pool rates fixed', true);
  const shifted = s.at(5, 'Which rate changes');
  const mix = mixture(shifted ? 80 : 50);
  mix.forEach(({ jobs, misses, rate }, i) => {
    const y = 357 + i * 230;
    txt(c, 'Pool ' + (i ? 'B' : 'A') + '   ·   ' + pct(rate) + ' miss', 113, y, 41, C.cream);
    for (let j = 0; j < jobs; j++) {
      const x = 649 + (j % 40) * 27,
        yy = y - 22 + Math.floor(j / 40) * 45;
      circle(c, x, yy, 10, j < misses ? C.coral : C.mint);
    }
    mono(c, misses + ' / ' + jobs + ' missed', 116, y + 69, 36, C.coral);
  });
  if (!shifted || s.at(5, 'END'))
    mono(c, 'All jobs    ' + sum(mix.map((m) => m.misses)) + ' / 100 missed', 124, 893, 56, C.gold);
}
export function checkDistributions() {
  assert.deepEqual(growthFactors.map((v) => fix(v, 2)), ['0.60', '0.83', '1.67', '4.00']);
  assert.deepEqual([names[fastestGrowth], current[fastestGrowth], reference[fastestGrowth]], ['24 h+', 0.20, 0.05]);
  assert.deepEqual([names[largestTerm], fix(100 * psiTerms[largestTerm] / psi, 1)], ['24 h+', '56.2']);
  assert.deepEqual(
    psiTerms.map((v) => fix(v, 3)),
    ['0.102', '0.009', '0.051', '0.208'],
  );
  assert.equal(fix(divergence(reference, current), 3), fix(psi, 3));
  assert.ok(Math.abs(divergence(current, reference) - psi) < 1e-8);
  assert.deepEqual([fix(direct, 3), fix(sum(legs), 3)], ['0.270', '0.135']);
  assert.deepEqual(dist, { ks: 0.5, w1: 2 });
  assert.deepEqual(distances([0, 0, 4, 4], [1, 1, 3, 3]), { ks: 0.5, w1: 1 });
  assert.deepEqual(
    [50, 80].map((n) => sum(mixture(n).map((row) => row.misses))),
    [25, 16],
  );
}

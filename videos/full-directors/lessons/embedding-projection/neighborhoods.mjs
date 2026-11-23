import {
  deep,
  grid,
  soft,
  white,
  gold,
  mint,
  blue,
  rose,
  rect,
  line,
  circle,
  arrow,
  text,
  mono,
  title,
  label,
  pane,
  note,
  knob,
  gridPlot,
  dim,
  cue,
  mix,
  smooth,
  fmt,
  pair,
  summary,
} from './drawing.mjs';
import {
  cauchyMap,
  mapPairFixture,
  pairDistanceFor,
  tsneTerm,
} from '../../../films/embedding-projection/arithmetic.mjs';
import {
  NEIGHBOR_SOURCE_3D,
  NEIGHBOR_PCA,
  SOURCE_NEIGHBORS,
  PCA_NEIGHBORS,
  MAP_NEIGHBORS,
} from '../../../films/embedding-projection/model.mjs';
import { NEIGHBOR_MAP, UMAP_DIRECTIONS } from '../../../films/embedding-projection/fixtures.mjs';

export const sweep = [
  [2, 0.294, 23],
  [4, 0.495, 52],
  [6, 0.629, 58],
  [8, 0.727, 60],
  [12, 0.871, 60],
];
export const probe = [
  { sigma: 0.11, ids: [3, 5, 4], hits: 58 },
  { sigma: 0.2, ids: [3, 2, 35], hits: 47 },
];
const relevant = [3, 4, 5];
export const probeHits = (run) => run.ids.filter((id) => relevant.includes(id)).length;
export function recallScene(c, k) {
  const b = k.beat.beatIndex;
  if (b === 0) {
    title(c, 'What survived in two dimensions?');
    label(c, 'FIRST CORPUS  /  60 DOCUMENTS  /  6 INPUT COORDINATES', 80, 204);
    for (let i = 0; i < 60; i++) {
      const x = 95 + (i % 15) * 48,
        y = 303 + Math.floor(i / 15) * 70;
      rect(c, x, y, 38, 55, deep);
      for (let j = 0; j < 6; j++)
        line(c, x + 5, y + 7 + j * 8, x + 32, y + 7 + j * 8, j < 2 ? blue : grid, 3);
    }
    summary(
      c,
      [
        ['Variance retained', '99.2%', blue],
        ['Policy evidence', 'One rotation query'],
      ],
      921,
      290,
      177,
    );
    note(c, 'What happens across different questions?', 88, 717, white, 37);
    return;
  }
  if (b < 5) {
    title(c, 'How short can the policy index go?');
    label(c, 'SECOND CORPUS  /  24 INPUT COORDINATES  /  20 QUERIES × 3 RELEVANT CHUNKS', 80, 184);
    const marks = cue(k, 3, 'Count the retrieved chunks'),
      chosen = cue(k, 4, 'Six dimensions clear');
    const yHits = (h) => 665 - h * 5.3,
      win = sweep.find((v) => v[2] / 60 >= 0.95);
    if (marks) {
      line(c, 287, yHits(57), 1511, yHits(57), gold, 2, [9, 7]);
      text(c, '57 of 60', 90, yHits(57), 27, gold);
    }
    sweep.forEach(([d, variance, hits], i) => {
      const x = 349 + i * 249,
        col = chosen && d === win[0] ? gold : mint;
      mono(c, d + 'D', x, 261, 36, white, 'center');
      if (b >= 2) mono(c, (variance * 100).toFixed(1) + '%', x, 320, 29, blue, 'center');
      if (marks) {
        rect(c, x - 27, yHits(hits), 54, 665 - yHits(hits), col);
        mono(c, hits + '/60', x, 711, 31, col, 'center');
      }
    });
    label(c, 'PCs kept', 81, 261);
    label(c, 'Variance', 81, 320);
    label(c, 'Top-3 hits', 81, 711);
    if (marks)
      note(
        c,
        chosen
          ? 'Six coordinates clear the 95% floor.'
          : 'Which is the shortest tested length above the 95% floor?',
        82,
        808,
        chosen ? gold : white,
        35,
      );
    return;
  }
  title(c, 'Replay the same query');
  label(c, 'SIX COMPONENTS  /  SEED 21  /  QUERY #1 NEEDS CHUNKS 3, 4 AND 5', 80, 187);
  const rerun = cue(k, 5, 'increase the document noise'),
    returned = cue(k, 6, 'This time the index returns');
  probe.slice(0, rerun ? 2 : 1).forEach((run, i) => {
    const y = 335 + i * 246,
      ready = i === 0 || returned;
    label(c, 'DOCUMENT NOISE', 81, y - 20);
    mono(c, run.sigma.toFixed(2), 83, y + 42, 53, white);
    run.ids.forEach((id, j) => {
      const x = 432 + j * 164;
      pane(c, x, y - 56, 130, 136);
      if (ready) mono(c, id, x + 65, y + 17, 53, relevant.includes(id) ? mint : rose, 'center');
    });
    if (ready) {
      text(c, probeHits(run) + ' of 3 for this query', 988, y - 13, 36);
      mono(c, run.hits + ' / 60 overall', 988, y + 55, 39, i ? rose : mint);
    }
  });
  if (b === 7) note(c, 'Full-space baseline at σ = 0.20 recovers 58 / 60.', 83, 806, soft, 32);
}
const ids = ['R1', 'R2', 'S1', 'S2', 'A1', 'A2'];
export function mapAudit(c, k) {
  const b = k.beat.beatIndex,
    distort = cue(k, 2, 'hand-distorted layout'),
    pca = cue(k, 2, 'The PCA map');
  const data = distort ? NEIGHBOR_MAP : pca ? NEIGHBOR_PCA : NEIGHBOR_SOURCE_3D,
    choices = distort ? MAP_NEIGHBORS : pca ? PCA_NEIGHBORS : SOURCE_NEIGHBORS;
  title(c, 'Follow one neighbor through the map');
  label(
    c,
    distort
      ? 'HAND-DISTORTED LAYOUT'
      : pca
        ? 'TWO PRINCIPAL COMPONENTS'
        : 'SOURCE POINTS IN x AND y  /  NEIGHBORS USE x, y AND z',
    80,
    178,
  );
  const w = ([x, y]) =>
    pca && !distort ? [462 + x * 132, 447 - y * 132] : [164 + x * 100, 702 - y * 100];
  gridPlot(c, 79, 231, 762, 539, 60);
  data.forEach((point, i) => {
    const a = w(point),
      b = w(data[choices[i]]);
    line(c, ...a, ...b, i === 2 ? gold : '#628894', i === 2 ? 6 : 2);
  });
  const colors = [mint, mint, blue, blue, rose, rose],
    offsets = distort
      ? [
          [-25, 25],
          [26, 25],
          [-4, -31],
          [-38, 32],
          [30, 26],
          [25, -20],
        ]
      : pca
        ? [
            [-22, -22],
            [19, 27],
            [26, -25],
            [-28, 22],
            [36, -22],
            [-20, 26],
          ]
        : [
            [-17, -27],
            [24, 27],
            [-23, -25],
            [25, 27],
            [-20, -25],
            [25, 24],
          ];
  data.forEach((p, i) => {
    const [x, y] = w(p);
    circle(c, x, y, 7, colors[i]);
    text(c, ids[i], x + offsets[i][0], y + offsets[i][1], 23, colors[i], 'center');
  });
  label(c, 'CLAUSE', 901, 229);
  label(c, 'SOURCE 1-NN', 1070, 229);
  if (pca) label(c, 'MAP 1-NN', 1310, 229);
  ids.forEach((name, i) => {
    const y = 296 + i * 69;
    line(c, 899, y + 32, 1508, y + 32, grid);
    mono(c, name, 903, y, 30, colors[i]);
    mono(c, ids[SOURCE_NEIGHBORS[i]], 1098, y, 30);
    if (pca)
      mono(c, ids[choices[i]], 1339, y, 33, choices[i] === SOURCE_NEIGHBORS[i] ? mint : rose);
  });
  const matches = choices.filter((j, i) => j === SOURCE_NEIGHBORS[i]).length;
  if (pca) text(c, matches + ' of 6 keep their neighbor', 905, 761, 36, distort ? gold : mint);
}
const startDistance = pairDistanceFor(0.01),
  endDistance = pairDistanceFor(0.1);
export function movingPair(t) {
  const d = mix(startDistance, endDistance, t),
    points = [
      [0, 0],
      [d, 0],
      [0, 1],
      [1, 1],
    ],
    map = mapPairFixture(d),
    q = map.q[0][1];
  return { d, points, q, term: tsneTerm(0.1, q), total: map.denominator };
}
export function pairScene(c, k) {
  const t = smooth(cue(k, 2, 'Slide B toward A', 2.8)),
    s = movingPair(t),
    b = k.beat.beatIndex,
    w = ([x, y]) => [183 + x * 141, 565 - y * 141];
  title(c, 'One strand in a four-point map');
  label(c, 't-SNE  /  ORDERED PAIR A → B', 83, 166);
  gridPlot(c, 74, 236, 1030, 503, 70.5);
  for (let i = 0; i < 4; i++)
    for (let j = i + 1; j < 4; j++) {
      const active = i === 0 && j === 1;
      line(
        c,
        ...w(s.points[i]),
        ...w(s.points[j]),
        active ? gold : j === 1 || i === 1 ? blue : '#52838c',
        active ? 7 : 3,
      );
    }
  const offsets = [
    [-21, 36],
    [20, 36],
    [-22, -29],
    [20, -29],
  ];
  s.points.forEach((p, i) => {
    const [x, y] = w(p);
    circle(c, x, y, 14, i === 1 ? gold : mint, deep, 3);
    text(c, 'ABCD'[i], x + offsets[i][0], y + offsets[i][1], 33, i === 1 ? gold : mint, 'center');
  });
  const dBD = Math.hypot(s.d - 1, 1);
  mono(
    c,
    'AB ' + fmt(s.d, 2) + '      BC ' + fmt(Math.hypot(s.d, 1), 2) + '      BD ' + fmt(dBD, 2),
    104,
    687,
    29,
    soft,
  );
  summary(
    c,
    [
      ['Source p(A, B)', '0.100', blue],
      ['Map q(A, B)', s.q.toFixed(3), gold],
      ...(cue(k, 1, 'pair contributes') ? [['p × ln(p/q)', fmt(s.term, 3), mint]] : []),
    ],
    1152,
    269,
    146,
  );
  note(
    c,
    'Each map weight shares a denominator with the other eleven ordered weights.',
    82,
    207,
    soft,
    30,
  );
}
export const triangle = (h) =>
  cauchyMap([
    [-1, 0],
    [1, 0],
    [0, h],
  ]);
const beforeLift = triangle(1);
export const gaussianRow = (ratio) => {
  const p = ratio / (ratio + 1);
  return { p, perplexity: Math.exp(-p * Math.log(p) - (1 - p) * Math.log(1 - p)) };
};
export function normalization(c, k) {
  const b = k.beat.beatIndex;
  if (b < 3) {
    title(c, 'Build one source probability');
    label(c, 'GAUSSIAN NEIGHBOR WEIGHTS AT A', 83, 185);
    const ratio =
        4 -
        2 * smooth(cue(k, 1, "Widen A's Gaussian", 1.4)) +
        6 * smooth(cue(k, 1, 'Narrow it', 1.4)) -
        4 * smooth(cue(k, 1, 'Return to the four', 1.2)),
      { p, perplexity } = gaussianRow(ratio);
    const x = 109,
      y = 368,
      width = 862;
    rect(c, x, y, width * p, 116, mint);
    rect(c, x + width * p, y, width * (1 - p), 116, blue);
    text(c, 'B', x + (width * p) / 2, y + 57, 52, deep, 'center', 'Serif');
    text(c, 'C', x + (width * (1 + p)) / 2, y + 57, 52, deep, 'center', 'Serif');
    mono(c, 'P(B | A)  ' + p.toFixed(2), 110, 541, 36, mint);
    mono(c, 'P(C | A)  ' + (1 - p).toFixed(2), 642, 541, 34, blue);
    if (b === 0)
      summary(
        c,
        [
          ['Relative weights', fmt(ratio) + ' : 1'],
          ['Normalized row sum', '1.00', mint],
        ],
        1060,
        318,
        158,
      );
    if (b === 1)
      summary(
        c,
        [
          ['Bandwidth effect', 'B : C = ' + fmt(ratio, 1) + ' : 1'],
          ['Perplexity', perplexity.toFixed(2), gold],
        ],
        1054,
        312,
        158,
      );
    if (b === 2) {
      summary(
        c,
        [
          ['P(A | B)', '0.80', blue],
          ['Both directions', '1.60 / (2 × 3)'],
        ],
        1042,
        292,
        145,
      );
      if (cue(k, 2, 'one point six divided')) text(c, 'p(A, B) ≈ 0.267', 109, 713, 56, gold);
    }
    return;
  }
  const afterWords = (phrase, captionStart = false) => {
    k.reveal(phrase, 0, { captionStart });
    return k.elapsed >= k.wordCue(phrase).end;
  };
  const lift = smooth(cue(k, 6, 'Lift C', 2)),
    h = 1 + lift,
    m = triangle(h),
    unit = 215;
  const settled = lift === 0 || lift === 1;
  const baseWeightReady = b > 3 || afterWords('or one fifth');
  const slopeWeightReady =
    b === 3
      ? afterWords('weight is one third')
      : b !== 6 || afterWords('one sixth') || lift === 0;
  const countDirections = cue(k, 3, 'Count both directions');
  const showTotal =
    b === 4
      ? afterWords('one point seven three')
      : b === 6
        ? afterWords('smaller total') || lift === 0
        : b > 4;
  const initialShareReady = b > 4 || (b === 4 && afterWords('point one one five four'));
  cue(k, 6, 'gives a larger share');
  const liftedShareReady =
    b > 6 ||
    (b === 6 && afterWords('point one eight seven five', 'point one eight seven five') && lift === 1);
  const map = ([x, y]) => [566 + x * unit, 669 - y * unit];
  const pts = [
    [-1, 0],
    [1, 0],
    [0, h],
  ].map(map);
  title(c, 'What share goes to A → B?');
  label(c, 'STUDENT-t WEIGHT  /  1 ÷ (1 + DISTANCE²)', 84, 173);
  gridPlot(c, 83, 196, 852, 585, 59.5);
  if (lift > 0) line(c, ...map([0, 0]), ...pts[2], gold, 2, [7, 8]);
  for (const [i, j] of [
    [0, 2],
    [1, 2],
    [0, 1],
  ])
    line(c, ...pts[i], ...pts[j], i === 0 && j === 1 ? mint : blue, 3 + 24 * m.weights[i][j]);
  pts.forEach(([x, y], i) => {
    circle(c, x, y, 14, i < 2 ? mint : gold, deep, 3);
    text(c, 'ABC'[i], x + [0, 0, 28][i], y + [35, 35, 0][i], 34, i < 2 ? mint : gold, 'center');
  });
  mono(c, 'h = ' + fmt(h, 2), 150, 277, 32, gold);
  dim(c, pts[0][0], pts[1][0], 724, '2 units', mint);
  const x = 989,
    right = 1490;
  if (countDirections) {
    label(c, 'ALL SIX ORDERED WEIGHTS', x, 219);
    const barY = 267,
      barHeight = 49,
      scale = (right - x) / beforeLift.denominator;
    rect(c, x, barY, right - x, barHeight, deep);
    let start = x;
    const orderedPairs = [
      [0, 1, mint],
      [1, 0, '#4f9487'],
      [0, 2, blue],
      [2, 0, '#5482a2'],
      [1, 2, blue],
      [2, 1, '#5482a2'],
    ];
    for (const [i, j, color] of orderedPairs) {
      const width = scale * m.weights[i][j];
      rect(c, start, barY, width, barHeight, color);
      if (start > x) line(c, start, barY, start, barY + barHeight, deep, 2);
      start += width;
    }
    if (lift > 0) {
      line(c, right, barY - 4, right, barY + barHeight + 8, soft, 2, [4, 4]);
      mono(c, 'Before lift', right, 344, 24, soft, 'right');
    }
    line(c, x, 328, x + scale * m.weights[0][1], 328, mint, 2);
    mono(c, 'A→B', x, 355, 27, mint);
  }
  const pairs = [
    ['AB', 'BA', m.weights[0][1]],
    ['AC', 'CA', m.weights[0][2]],
    ['BC', 'CB', m.weights[1][2]],
  ];
  pairs.forEach(([forward, reverse, weight], i) => {
    const ready = i === 0 ? baseWeightReady : slopeWeightReady && settled;
    const y = 422 + i * 56;
    mono(c, countDirections ? forward + ' + ' + reverse : forward, x, y, 29, i ? blue : mint);
    if (ready)
      mono(c, (countDirections ? '2 × ' : '') + '1/' + Math.round(1 / weight), right, y, 30, white, 'right');
  });
  if (b >= 4) {
    line(c, x, 573, right, 573, grid, 2);
    label(c, 'TOTAL WEIGHT', x, 613);
    if (showTotal && settled)
      mono(c, '≈ ' + m.denominator.toFixed(4), right, 613, 37, white, 'right');
    label(c, 'A → B WEIGHT ÷ TOTAL', x, 685);
  }
  if (initialShareReady)
    mono(c, '≈ ' + beforeLift.q[0][1].toFixed(4), x, 749, 44, lift > 0 ? soft : gold);
  if (liftedShareReady) {
    mono(c, '→', 1230, 749, 34, soft, 'center');
    mono(c, '≈ ' + m.q[0][1].toFixed(4), right, 749, 44, gold, 'right');
  }
  if (b >= 7)
    note(
      c,
      b === 7
        ? 'KL sums every ordered pair. One pair’s contribution can be negative.'
        : 'Inspect island neighbors in the source vectors. Empty space has no calibrated scale.',
      84,
      829,
    );
}
export const union = (a, b) => a + b - a * b;
export function fuzzyUnion(c, k) {
  const [p, q] = UMAP_DIRECTIONS,
    b = k.beat.beatIndex,
    overlap = cue(k, 1, 'get the overlap'),
    done = cue(k, 1, 'point nine two');
  title(c, 'Two directed strengths, one edge');
  label(c, 'UMAP  /  FUZZY UNION', 81, 184);
  const x = 120,
    y = 246,
    size = 42;
  for (let j = 0; j < 10; j++)
    for (let i = 0; i < 10; i++) {
      const a = i < 10 * p,
        z = j < 10 * q;
      const col = a && z ? (overlap ? gold : mint) : a ? mint : z ? blue : '#254957';
      rect(c, x + i * size, y + j * size, size - 3, size - 3, col);
      if (a && z && !overlap)
        line(
          c,
          x + i * size + 3,
          y + j * size + size - 7,
          x + i * size + size - 6,
          y + j * size + 4,
          blue,
          5,
        );
    }
  dim(c, x, x + size * 10 * p, y + size * 10 + 19, 'A → B    0.80', mint);
  text(c, 'B → A   0.60', x + size * 10 + 19, y + size * 3, 28, blue);
  if (b === 0) {
    const y = 516;
    arrow(c, 867, y, 1385, y, mint, 7, 23);
    text(c, '0.80', 1120, y - 34, 31, mint, 'center');
    arrow(c, 1385, y + 97, 867, y + 97, blue, 7, 23);
    text(c, '0.60', 1120, y + 145, 31, blue, 'center');
    text(c, 'A', 825, y + 47, 44, white, 'center', 'Serif');
    text(c, 'B', 1425, y + 47, 44, white, 'center', 'Serif');
  }
  if (overlap) text(c, 'Shared area    0.48', 803, 341, 43, gold);
  else text(c, 'How much is covered?', 803, 341, 46, white, 'left', 'Serif');
  if (b >= 1) {
    mono(c, overlap ? '0.80 + 0.60 − 0.48' : '0.80 × 0.60', 803, 461, 42);
    if (done) {
      line(c, 846, 600, 1350, 600, mint, 15);
      knob(c, 846, 600, 'A', mint, 21);
      knob(c, 1350, 600, 'B', mint, 21);
      mono(c, union(p, q).toFixed(2), 1102, 662, 55, gold, 'center');
    }
  }
  if (b === 2) note(c, 'Graph strength sets attraction in the fitted layout.', 803, 778, soft, 28);
}
export const membership = (d, rho, sigma) => Math.exp(-Math.max(0, d - rho) / sigma);
export function memberships(c, k) {
  const b = k.beat.beatIndex;
  title(c, b < 2 ? 'One membership per link' : 'From graph edges to map forces');
  if (b < 2) {
    label(c, 'LOCAL ROW AT A   /   ρ = 1, σ = 1', 80, 184);
    const origin = [530, 512],
      ends = [
        [662, 512],
        [530, 248],
        [213.2, 749.6],
      ];
    [1, 2, 3].forEach((d, i) => {
      const col = [mint, blue, rose][i],
        v = membership(d, 1, 1);
      line(c, ...origin, ...ends[i], col, 2 + v * 10);
      knob(c, ...ends[i], '', col);
      text(
        c,
        'd = ' + d,
        ends[i][0] + (i === 2 ? -9 : 22),
        ends[i][1] + (i === 1 ? -32 : 37),
        27,
        col,
      );
      mono(c, 'd = ' + d, 947, 291 + 108 * i, 32);
      mono(c, v.toFixed(3), 1485, 291 + i * 108, 38, col, 'right');
    });
    knob(c, ...origin, 'A', white, 20);
    mono(c, 'exp(−max(0, d − ρ) / σ)', 893, 659, 36, gold);
    if (b === 1) note(c, 'These link strengths sum to more than one.', 891, 738);
  } else {
    label(c, 'LAYOUT MEMBERSHIP  /  a = b = 1', 80, 182);
    gridPlot(c, 87, 236, 801, 449, 74);
    const w = (d) => [124 + d * 220, 648 - 358 / (1 + d * d)];
    for (let i = 1; i <= 90; i++) line(c, ...w((i - 1) / 30), ...w(i / 30), mint, 5);
    mono(c, '0', 120, 720, 26);
    mono(c, '3', 775, 720, 26);
    label(c, 'Map distance', 399, 733);
    mono(c, '1 / (1 + a·d^(2b))', 959, 296, 37, mint);
    text(c, b === 2 ? 'Graph edge' : 'New query', 959, 405, 43, white, 'left', 'Serif');
    note(
      c,
      b === 2 ? 'Attraction draws linked points closer.' : 'Find neighbors in the fitted dataset.',
      959,
      469,
    );
    text(c, b === 2 ? 'Sampled nonedge' : 'Existing map', 959, 570, 43, white, 'left', 'Serif');
    note(
      c,
      b === 2 ? 'Repulsion separates sampled pairs.' : 'Use those neighbors to place it.',
      959,
      638,
    );
  }
}

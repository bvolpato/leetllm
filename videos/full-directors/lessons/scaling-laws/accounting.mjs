import {
  title,
  label,
  reading,
  line,
  rect,
  dot,
  cloth,
  cord,
  matrix,
  chart,
  cue,
  mix,
  fixed,
  ink,
  dim,
  warp,
  weft,
  teal,
  gold,
  grid,
} from './studio.mjs';

export function contractions(c, k) {
  const fold = cue(k, 3, 'Start with ten parameter units');
  if (fold) {
    const n = mix(10, 20, cue(k, 3, 'Double the width', 1.4)),
      d = 100 / n;
    title(c, 'One budget, three cuts', 'Dense training proxy divided by six  •  N × D = 100');
    [
      [5, 20],
      [10, 10],
      [n, d],
    ].forEach(([w, h], i) => {
      const x = 150 + 560 * i,
        scale = 23;
      cloth(c, x, 800 - h * scale, w, h, scale);
      label(c, fixed(w) + ' × ' + fixed(h), x, 862, 49, ink, 'left', 'Serif');
    });
    return;
  }
  title(
    c,
    'What one crossing buys',
    'Count the large dense matrix products for one token presentation.',
  );
  const steps = [
    ['Forward', 'X W', 'forward pass'],
    ['Input gradient', 'G W^T', 'sends gradients'],
    ['Weight gradient', 'X^T G', 'finds a gradient'],
  ];
  steps.forEach(([name, eq, phrase], i) => {
    const y = 337 + i * 160;
    label(c, name, 135, y + 44, 42);
    label(c, eq, 610, y + 44, 47, dim, 'left', 'Serif');
    if (cue(k, 1, phrase)) {
      cord(c, 910, y + 6, 580, [warp, teal, weft][i], 45);
      label(c, '2N', 1540, y + 45, 48);
    }
  });
  if (cue(k, 2, 'six N D'))
    label(c, '3 × 2N × D  ≈  6ND FLOPs', 910, 881, 57, ink, 'center', 'Serif');
}
export function counts(c, k) {
  const i = k.beat.beatIndex + 1;
  if (i <= 2) {
    title(c, 'The weights stay put', 'X contains two token positions. Both read the same W.');
    label(c, 'X', 268, 297, 46, warp, 'center', 'Serif');
    label(c, 'W', 647, 268, 46, weft, 'center', 'Serif');
    label(c, 'Y', 1004, 297, 46, teal, 'center', 'Serif');
    matrix(
      c,
      [
        [1, 2, 1],
        [0, 1, 2],
      ],
      150,
      353,
      82,
    );
    label(c, '×', 453, 460, 63);
    matrix(
      c,
      [
        [1, 0],
        [0, 2],
        [1, 1],
      ],
      565,
      312,
      82,
      weft,
    );
    label(c, '=', 795, 461, 68);
    matrix(
      c,
      [
        [2, 5],
        [2, 4],
      ],
      922,
      353,
      82,
      teal,
    );
    reading(c, 'Stored in W', '6 weights', 1285, 343, weft);
    if (cue(k, 1, 'Four positions')) {
      label(c, 'Distinct positions', 150, 745, 32, dim);
      for (let row = 0; row < 2; row++)
        for (let col = 0; col < 4; col++) {
          const x = 520 + col * 99;
          dot(c, x, 715 + row * 80, 29, [warp, weft, teal, gold][col]);
          label(c, 'ABCD'[col], x, 725 + row * 80, 26, '#fff', 'center');
        }
      label(c, '2 passes × 4 = 8 presentations', 1000, 783, 40);
    }
    if (i === 2)
      label(c, 'Tied embedding weights still do work in the output projection.', 150, 930, 34);
    return;
  }
  const replay = cue(k, 5, 'Add its two'),
    infer = cue(k, 5, 'At inference');
  title(
    c,
    i === 6 ? 'From counts to FLOPs' : 'Count the contractions',
    i === 6
      ? 'Ordinary dense training  •  6ND'
      : 'G is the output gradient. The superscript T means transpose. Each product costs about 2ND.',
  );
  if (i === 6) {
    const twice = cue(k, 6, 'Double both counts');
    for (const [j, n, d] of [[0, 1, 20], ...(twice ? [[1, 2, 40]] : [])]) {
      const x = 180 + j * 870;
      cloth(c, x, 740 - d * 10, n, d, 115, 10);
      label(c, n + 'B weights × ' + d + 'B presentations', x, 815, 37);
      label(c, ((6 * n * d) / 100).toFixed(1) + ' × 10²⁰ FLOPs', x, 903, 53, teal, 'left', 'Serif');
    }
    return;
  }
  const ops = [
    ['X W', 'Forward', true],
    ['G W^T', 'Input gradient', cue(k, 3, 'send gradients')],
    ['X^T G', 'Weight gradient', cue(k, 3, 'update the weights')],
    ['X W', 'Replay', replay],
  ];
  ops.forEach(([eq, name, active], j) => {
    const x = 145 + j * 422;
    if (!active) return;
    label(c, eq, x, 455, 84, j === 3 ? weft : warp, 'left', 'Serif');
    label(c, name, x, 530, 39);
    cord(c, x, 576, 300, j === 3 ? weft : warp, 37);
    label(c, '2ND', x, 685, 48);
  });
  if (cue(k, 4, 'six N D'))
    label(c, replay ? '6ND + 2ND ≈ 8ND FLOPs' : '3 × 2ND ≈ 6ND FLOPs', 150, 855, 62);
  if (infer)
    label(c, 'Inference uses the forward term, about 2N per processed token.', 150, 941, 35, teal);
}
export const runs = [
  [1, 10, 2.8],
  [2, 10, 2.6],
  [1, 20, 2.55],
  [2, 20, 2.35],
];
export function pairedRuns(c, k) {
  const i = k.beat.beatIndex + 1;
  if (i < 6) {
    title(
      c,
      'Spend one more unit',
      'Illustrative held-out losses  •  same tokenizer, text and context',
    );
    const shown = [
      1,
      cue(k, 1, 'twice as many weights'),
      cue(k, 1, 'twice as many tokens'),
      cue(k, 2, 'last run'),
    ];
    runs.forEach(([n, d, l], j) => {
      if (!shown[j]) return;
      const x = 156 + j * 438;
      cloth(c, x, 632 - d * 16, n, d, 91, 16);
      label(c, n + 'B × ' + d + 'B', x, 713, 47);
      label(c, (n * d) / 10 + '× work', x, 774, 34, dim);
      const lossKnown =
        j === 0 || cue(k, 3, j === 2 ? 'two point five five' : 'two point six zero');
      if (lossKnown)
        label(c, l.toFixed(2) + ' nats', x, 868, 56, j === 2 ? teal : ink, 'left', 'Serif');
    });
    if (i >= 4) label(c, 'Repeat the matched runs to measure variation.', 155, 965, 32, dim);
    return;
  }
  const logs = cue(k, 7, 'subtract the floor');
  title(
    c,
    logs ? 'Measure the excess above the floor' : 'What does another factor of ten buy?',
    'Toy law   L = 2 + 1 / C^0.05',
  );
  const p = chart(c, {
    x: 205,
    w: 1550,
    y: 299,
    h: 494,
    xlim: [0, 6],
    ylim: logs ? [-0.33, 0.03] : [1.94, 3.06],
    xt: [
      [0, '1'],
      [1, '10'],
      [2, '100'],
      [3, '1k'],
      [4, '10k'],
      [5, '100k'],
      [6, '1M'],
    ],
    yt: logs ? [-0.3, -0.2, -0.1, 0] : [2, 2.25, 2.5, 2.75, 3],
    xlabel: 'Compute multiplier C  (log scale)',
    ylabel: logs ? 'log₁₀(L − 2)' : 'Loss  (nats per token)',
  });
  const f = (x) => (logs ? -0.05 * x : 2 + 10 ** (-0.05 * x));
  p.curve(f);
  for (let a = 0; a <= 6; a++) p.point(a, f(a), weft);
}
export function kaplan(c, k) {
  const i = k.beat.beatIndex + 1;
  if (i < 3) {
    title(
      c,
      'Three slopes from three experiments',
      'Kaplan et al. (2020)   •   fitted power laws without an added floor',
    );
    const slopes = [0.076, 0.095, 0.05];
    ['Parameters alone', 'Data-limited runs', 'Efficient frontier'].forEach((s, j) => {
      const x = 170 + 581 * j;
      label(c, s, x, 332, 39);
      const p = chart(c, {
        x,
        y: 413,
        w: 424,
        h: 260,
        xlim: [0, 3],
        ylim: [-0.33, 0.02],
        xt: [
          [0, '1'],
          [1, '10'],
          [2, '100'],
          [3, '1k'],
        ],
        yt: [0, -0.3],
        xlabel: ['N multiplier', 'D multiplier', 'C multiplier'][j],
        ylabel: 'log₁₀ relative loss',
      });
      p.curve((a) => -slopes[j] * a, 0, 3, [warp, weft, teal][j]);
      label(c, 'slope  −' + slopes[j], x, 847, 42);
      if (j === 0 && cue(k, 2, 'eighty-four percent')) {
        p.point(1, -slopes[j]);
        label(c, '10× N  →  0.84× loss', x, 923, 31, warp);
      }
    });
    return;
  }
  const factor = 1 + 99 * cue(k, 3, 'a hundred times', 1.1);
  title(
    c,
    'How the fitted allocation grows',
    'Areas show compute multipliers relative to one starting run.',
  );
  for (const [j, a, b, name] of [
    [0, 0.73, 0.27, 'Kaplan frontier'],
    [1, 0.5, 0.5, 'Equal growth'],
  ]) {
    if (j && !cue(k, 5, 'equal growth')) continue;
    const x = 155 + 870 * j,
      n = factor ** a,
      d = factor ** b;
    label(c, name, x, 322, 44);
    cloth(c, x, 746 - 25 * d, n, d, 25);
    label(c, fixed(n) + '× width  ·  ' + fixed(d) + '× height', x, 828, 41);
  }
  label(c, fixed(factor) + '× training compute', 156, 939, 41, teal);
}

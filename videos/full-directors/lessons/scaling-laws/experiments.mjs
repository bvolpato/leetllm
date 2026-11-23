import {
  loss,
  anchorFit,
  allocationOptimum,
  surfaceLoss,
} from '../../../films/scaling-laws/arithmetic.mjs';
import { EXPONENT_GRID, simultaneousWidthUpdate } from '../../../films/scaling-laws/model.mjs';
import {
  title,
  label,
  reading,
  line,
  rect,
  dot,
  cloth,
  cord,
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
  paper,
} from './studio.mjs';

export function studies(c, k) {
  const i = k.beat.beatIndex + 1;
  if (i < 3) {
    title(
      c,
      'Read the same runs three ways',
      'Hoffmann et al. (2022)  •  over 400 models from 70M to 16B parameters',
    );
    const rows = [
      ['Lower envelope', 0.5, 0.5],
      ['Fixed-compute minima', 0.49, 0.51],
      ['Parametric loss surface', 0.46, 0.54],
    ];
    rows.forEach(([name, a, b], j) => {
      const y = 368 + 168 * j;
      label(c, name, 150, y + 34, 43);
      if (i === 2 || cue(k, 1, ['lowest losses', 'minimum at each', 'one surface'][j])) {
        cord(c, 730, y, 885 * a, warp, 47);
        cord(c, 730 + 885 * a, y, 885 * b, weft, 47);
        label(c, a.toFixed(2), 730 + 442 * a, y + 104, 37, warp, 'center');
        label(c, b.toFixed(2), 730 + 885 * a + 442 * b, y + 104, 37, weft, 'center');
      }
    });
    label(c, 'Exponents on compute', 151, 933, 34, dim);
    label(c, 'Parameters', 730, 933, 38, warp);
    label(c, 'Tokens', 1215, 933, 38, weft);
    return;
  }
  if (i < 5) {
    title(
      c,
      'Stop at the same horizon',
      'Two cosine learning-rate schedules with the same starting rate',
    );
    const p = chart(c, {
      x: 195,
      y: 335,
      w: 1010,
      h: 461,
      xlim: [0, 2],
      ylim: [0, 1.05],
      xt: [
        [0, '0'],
        [1, 'H'],
        [2, '2H'],
      ],
      yt: [0, 0.5, 1],
      xlabel: 'Training tokens processed',
      ylabel: 'Relative learning rate',
    });
    p.curve((x) => (1 + Math.cos((Math.PI * x) / 2)) / 2, 0, 2, warp);
    p.curve((x) => (1 + Math.cos(Math.PI * x)) / 2, 0, 1, weft);
    line(c, p.X(1), p.Y(1), p.X(1), p.Y(0), dim, 2);
    p.point(1, 0.5, warp);
    p.point(1, 0, weft);
    reading(c, 'Checkpoint on long run', '½ rate', 1320, 349, warp);
    reading(c, 'Finished short run', 'Cooled down', 1320, 555, weft, 53);
    if (i === 4)
      label(
        c,
        'Also match head accounting, warmup, learning rate, batch size and Adam β₂.',
        180,
        964,
        34,
      );
    return;
  }
  title(
    c,
    'Lower losses can keep the same minimum',
    'Illustrative equal-compute profiles  •  the same configurations appear on both curves',
  );
  const p = chart(c, {
    x: 235,
    y: 350,
    w: 1420,
    h: 425,
    xlim: [0, 4],
    ylim: [1.65, 3.05],
    xt: [
      [0, 'small'],
      [2, 'middle'],
      [4, 'large'],
    ],
    yt: [1.8, 2.1, 2.4, 2.7, 3],
    xlabel: 'Relative model size',
    ylabel: 'Held-out loss',
  });
  const base = (x) => 2.15 + 0.18 * (x - 2) ** 2,
    offset = 0.3 * cue(k, 5, 'lower a whole loss curve', 1.5);
  p.curve(base, 0, 4, dim);
  p.curve((x) => base(x) - offset, 0, 4, warp);
  line(c, p.X(2), p.Y(base(2)), p.X(2), p.Y(1.65), teal, 3);
  p.point(2, base(2) - offset, weft, 13);
}
export const releases = [
  ['LLaMA 1 · 7B', 7, 1000],
  ['LLaMA 1 · 65B', 65, 1400],
  ['Llama 2 · 7B', 7, 2000],
  ['Llama 2 · 70B', 70, 2000],
  ['Llama 3 · 8B', 8, 15000],
  ['Llama 3 · 405B', 405, 15600],
];
export function frontier(c, k) {
  const i = k.beat.beatIndex + 1;
  if (i <= 3) {
    title(
      c,
      'Two models at the reported budget',
      'Gopher and Chinchilla  •  nominal parameter and training-token counts',
    );
    [
      [280, 300, 'Gopher'],
      [70, 1400, 'Chinchilla'],
    ].forEach(([n, d, name], j) => {
      if (j && !cue(k, 1, 'Chinchilla used')) return;
      const x = 161 + j * 780;
      cloth(c, x, 754 - d * 0.265, n / 10, d / 100, 17.5, 26.5);
      label(c, name, x, 310, 52, ink, 'left', 'Serif');
      label(c, n + 'B weights × ' + d + 'B tokens', x, 823, 37);
      if (cue(k, 2, 'six N D'))
        label(c, '6ND ≈ ' + ((6 * n * d) / 1e5).toFixed(2) + ' × 10²³ FLOPs', x, 887, 40, warp);
    });
    if (i >= 2)
      label(
        c,
        'Reported budget  5.76 × 10²³' +
          (i === 3 ? '    •    Appendix F revision  6.3 × 10²³ FLOPs' : ' FLOPs'),
        161,
        968,
        34,
        dim,
      );
    return;
  }
  if (i < 6) {
    title(
      c,
      'Read past the average',
      'MMLU  •  57 tasks in the reported Gopher–Chinchilla comparison',
    );
    const marked = cue(k, 4, 'four marked');
    for (let j = 0; j < 57; j++) {
      const x = 175 + (j % 19) * 81,
        y = 345 + Math.floor(j / 19) * 112;
      rect(c, x, y, 60, 77, marked && j >= 53 ? weft : '#c7c3d1');
      if (marked && j >= 53) label(c, 'G', x + 30, y + 53, 35, paper, 'center');
    }
    if (marked) label(c, 'Gopher scored higher on four tasks.', 170, 780, 47, weft);
    label(
      c,
      i === 5
        ? '40B to 70B estimated range  •  70B selected'
        : 'Tokenizer, optimizer and data mixture also changed.',
      170,
      895,
      38,
      dim,
    );
    return;
  }
  title(
    c,
    'Training tokens per nominal weight',
    'Historical configurations   •   positions on a log scale',
  );
  const x0 = 633,
    X = (v) => x0 + (Math.log10(v) - 1) * 435;
  for (const v of [10, 100, 1000]) {
    line(c, X(v), 270, X(v), 866, grid, 3);
    label(c, v, X(v), 915, 33, dim, 'center');
  }
  releases.forEach(([name, n, d], j) => {
    if (j === 5 && i < 7) return;
    const y = 315 + 94 * j;
    label(c, name, 150, y + 13, 38);
    line(c, x0, y, X(d / n), y, j === 4 ? weft : warp, 6);
    dot(c, X(d / n), y, 11, j === 4 ? weft : warp);
    label(c, (j === 4 ? '≥ ' : '') + fixed(d / n, d / n > 100 ? 0 : 1), X(d / n) + 24, y + 13, 36);
  });
}
export const proxyRuns = [2, 4, 6, 8, 10, 14, 20, 30, 40].map((n, j) => ({
  n,
  y: loss(n, 100 / n) + 0.025 * Math.sin(j * 3),
}));
export function proxy(c, k) {
  const i = k.beat.beatIndex + 1;
  title(
    c,
    'Fit a curve, then challenge it',
    'Illustrative proxy runs on matched recipes and held-out text',
  );
  const p = chart(c, {
    x: 177,
    y: 331,
    w: 1176,
    h: 455,
    xlim: [2, 40],
    ylim: [1.7, 2.86],
    xt: [5, 10, 20, 30, 40],
    yt: [1.8, 2, 2.2, 2.4, 2.6, 2.8],
    xlabel: 'Parameter units N',
    ylabel: 'Loss in nats per token',
  });
  const take = 1 + Math.floor(8 * cue(k, 1, 'Vary model size', 1.7));
  proxyRuns.slice(0, take).forEach(({ n, y }) => p.point(n, y, dim, 9));
  if (i >= 2) p.curve((n) => loss(n, 100 / n), 2, 40, warp, 4);
  reading(c, 'Original budget', 'ND = 100', 1410, 352, warp, 50);
  if (i >= 3) {
    p.curve((n) => loss(n, 400 / n), 2, 40, teal, 4);
    const pred = loss(25, 16);
    p.point(25, pred, teal);
    reading(c, 'New budget', 'ND = 400', 1410, 523, teal, 50);
    if (cue(k, 3, 'observation is')) {
      line(c, p.X(25), p.Y(pred), p.X(25), p.Y(2.02), weft, 5);
      p.point(25, 2.02, weft);
      if (cue(k, 3, 'positive residual'))
        reading(c, 'Residual', '+' + fixed(2.02 - pred) + ' nat', 1410, 710, weft, 50);
      label(c, '2.02 observed', p.X(25) + 25, p.Y(2.02) - 14, 28, weft);
      label(c, '1.90 fitted', p.X(25) + 25, p.Y(pred) + 45, 28, teal);
    }
  }
}
export const widths = [16, 64, 256];
export function widthStudy(c, k) {
  const i = k.beat.beatIndex + 1;
  if (i <= 2) {
    title(c, 'One update at input 1', 'Two-layer scalar output   f = Σ UᵢVᵢ   •   target = 1');
    for (let j = 0; j < 8; j++) {
      const x = 189 + j * 205;
      line(c, x, 434, x, 617, grid, 10);
      dot(c, x, 434, 37, warp);
      label(c, 'v', x, 447, 32, paper, 'center');
      dot(c, x, 617, 42, j % 2 ? weft : teal);
      label(c, j % 2 ? '−1' : '+1', x, 630, 31, paper, 'center');
    }
    label(c, 'Equal top weights cancel in pairs against alternating signs.', 171, 766, 44);
    label(
      c,
      i === 1
        ? 'Initial prediction  0'
        : 'Loss  ½(f − 1)²     •     ΔU uses old V     •     ΔV uses old U',
      171,
      895,
      45,
      warp,
    );
    return;
  }
  const eta = cue(k, 5, 'down to a quarter') ? 0.25 : 1,
    coord = cue(k, 4, 'Across all three widths');
  title(
    c,
    'Take the same step at three widths',
    'Simultaneous SGD update  •  target 1   •  base learning rate η = ' + eta,
  );
  const left = 170,
    top = 353;
  label(c, 'Width', left, top, 37, dim);
  label(c, 'Standard step', 515, top, 40, warp);
  label(c, 'Coordinated step', 1280, top, 40, teal);
  label(c, 'Prediction, scale 0–260', 515, top + 43, 27, dim);
  label(c, 'Detail, scale 0–4', 1280, top + 43, 27, dim);
  widths.forEach((w, j) => {
    const y = top + 130 + 147 * j;
    label(c, w, left, y, 56);
    line(c, 515, y - 52, 1061, y - 52, grid, 2);
    if (coord) {
      line(c, 1280, y - 52, 1820, y - 52, grid, 2);
      line(c, 1415, y - 72, 1415, y - 28, gold, 3);
    }
    const standard = simultaneousWidthUpdate(w, false, eta).prediction;
    cord(c, 515, y - 63, Math.min(560, standard * 2.1), warp, 24);
    label(c, fixed(standard), 515, y + 14, 48, warp);
    if (coord) {
      const z = simultaneousWidthUpdate(w, true, eta).prediction;
      cord(c, 1280, y - 63, z * 135, teal, 24);
      label(c, z.toFixed(2), 1280, y + 14, 48, teal);
    }
  });
  label(c, 'V starts at 1 / √width', 315, 916, 34, dim);
  if (coord) label(c, 'V starts at 1 / width   •   rates ηw and η/w', 1070, 916, 34, dim);
}
export function fitGrid(c, k) {
  const i = k.beat.beatIndex + 1,
    g = EXPONENT_GRID;
  title(
    c,
    'Recover a known surface',
    'Synthetic measurements   •   L = 1.1 + 2.8 / N^α + 7.8 / D^β',
  );
  if (i <= 2) {
    const p = chart(c, {
      x: 200,
      y: 352,
      w: 1100,
      h: 463,
      xlim: [-0.16, 1.16],
      ylim: [-0.18, 2.2],
      xt: [
        [0, '0.1'],
        [Math.log10(5), '0.5'],
        [1, '1'],
      ],
      yt: [
        [0, '1'],
        [Math.log10(5), '5'],
        [Math.log10(20), '20'],
        [2, '100'],
      ],
      xlabel: 'Parameters (billions, log scale)',
      ylabel: 'Token presentations (billions, log scale)',
    });
    for (const r of g.rows) p.point(Math.log10(r.n / 1e8), Math.log10(r.d / 1e9), warp, 12);
    if (cue(k, 1, 'Set aside')) {
      p.point(1, 2, weft, 16);
      label(c, 'Held out', p.X(1) - 25, p.Y(2) + 9, 31, weft, 'right');
    }
    reading(c, 'Fit on', '8 runs', 1390, 352, warp);
    if (i === 2) reading(c, 'Evaluate on', '1 unseen row', 1390, 583, weft, 51);
    return;
  }
  if (i >= 5) {
    const p = chart(c, {
      x: 190,
      y: 337,
      w: 1040,
      h: 475,
      xlim: [7.8, 11.1],
      ylim: [8.8, 12.4],
      xt: [
        [8, '0.1'],
        [9, '1'],
        [10, '10'],
        [11, '100'],
      ],
      yt: [
        [9, '1'],
        [10, '10'],
        [11, '100'],
        [12, '1000'],
      ],
      xlabel: 'Parameters (billions, log scale)',
      ylabel: 'Presentations (billions, log scale)',
    });
    for (const r of g.rows) p.point(Math.log10(r.n), Math.log10(r.d), warp);
    p.point(9, 11, teal, 13);
    reading(c, 'Held-out run', '2.408 nats', 1322, 355, teal, 56);
    if (cue(k, 5, 'seventy billion parameters')) {
      const x = Math.log10(70e9),
        y = Math.log10(1.4e12);
      p.point(x, y, weft, 15);
      label(c, '70B × 1.4T', p.X(x) - 22, p.Y(y) + 4, 33, weft, 'right');
      reading(
        c,
        'Extrapolated loss',
        surfaceLoss(70e9, 1.4e12).toFixed(3) + ' nats',
        1322,
        548,
        weft,
        55,
      );
    }
    if (i === 6)
      label(c, 'Real fits must estimate E, A, B, α and β and test their residuals.', 154, 962, 37);
    return;
  }
  const x = 228,
    y = 295,
    w = 27,
    h = 21;
  for (const cell of g.cells) {
    const val = Math.min(1, Math.max(0, (-Math.log10(cell.sse) + 0.1) / 6.3));
    const rgb = [0, 1, 2].map((a) => Math.round(mix([58, 45, 78][a], [253, 212, 133][a], val)));
    rect(c, x + cell.i * w, y + (25 - cell.j) * h, w - 1, h - 1, 'rgb(' + rgb.join(',') + ')');
  }
  label(c, 'α  0.052 → 0.088', x + 250, 905, 34, dim, 'center');
  label(c, 'β', x - 74, y + 236, 42, dim);
  label(c, '0.120', x - 16, y + 18, 26, dim, 'right');
  label(c, '0.070', x - 16, y + 25 * h + 14, 26, dim, 'right');
  label(c, 'Exponent grid detail   •   lighter = smaller squared error', x, 977, 33, dim);
  const marked = cue(k, 4, 'best pair');
  if (marked) {
    const cell = g.best;
    c.strokeStyle = teal;
    c.lineWidth = 5;
    c.strokeRect(x + cell.i * w - 2, y + (25 - cell.j) * h - 2, w + 3, h + 3);
  }
  reading(
    c,
    marked ? 'Lowest squared error' : 'Score each exponent pair',
    marked ? 'α = 0.070     β = 0.098' : 'Σ (prediction − observation)²',
    850,
    345,
    warp,
    marked ? 56 : 48,
  );
  if (cue(k, 4, 'held-out row'))
    reading(
      c,
      'Held out  ·  1B weights × 100B tokens',
      surfaceLoss(1e9, 1e11).toFixed(3) + ' nats',
      850,
      545,
      teal,
      59,
    );
}
export function floors(c, k) {
  const i = k.beat.beatIndex + 1;
  title(
    c,
    'Two pins hold both curves',
    'L(C) = E + K / C^a   •   measured anchors at C = 1 and C = 100',
  );
  const p = chart(c, {
    x: 198,
    y: 327,
    w: 1208,
    h: 465,
    xlim: [0, 6],
    ylim: [1.72, 3.12],
    xt: [
      [0, '1'],
      [2, '100'],
      [4, '10k'],
      [6, '1M'],
    ],
    yt: [1.8, 2, 2.2, 2.5, 3],
    xlabel: 'Compute C (log scale)',
    ylabel: 'Loss',
  });
  const extent = 2 + 4 * cue(k, 3, 'follow them out', 1.5);
  if (i >= 3) {
    [0.1, 0.2].forEach((a, j) => {
      const f = anchorFit(a),
        col = j ? weft : warp;
      p.curve((v) => f.predict(10 ** v), 0, extent, col);
      p.point(extent, f.predict(10 ** extent), col);
      label(c, 'a = ' + a, 1480, 410 + j * 237, 37, col);
      label(c, f.predict(10 ** extent).toFixed(3), 1480, 487 + j * 237, 64, col, 'left', 'Serif');
      label(c, 'Floor ' + f.e.toFixed(3), 1480, 538 + j * 237, 32, dim);
    });
  }
  p.point(0, 3, ink, 12);
  p.point(2, 2.5, ink, 12);
  if (i === 2) label(c, 'K(1 − 1 / 100^a) = 0.5     •     E = 3 − K', 315, 963, 43);
  if (i >= 3) label(c, 'At C = ' + fixed(10 ** extent, 0), 1460, 311, 32, dim);
}
export const synthetic = allocationOptimum(70e9 * 1.4e12, 2.8, 7.8, 0.07, 0.098);
export function inventoryCap(c, k) {
  const fitN = synthetic.n / 1e9,
    i = k.beat.beatIndex + 1;
  const n = mix(
    mix(70, fitN, cue(k, 1, 'move to the predicted', 1.5)),
    49,
    cue(k, 3, 'follow the budget curve', 1.4),
  );
  const d = 98 / n;
  title(
    c,
    'Where could the tokens come from?',
    'Synthetic fitted surface   •   full budget 5.88 × 10²³ dense-projection FLOPs',
  );
  const p = chart(c, {
    x: 190,
    y: 309,
    w: 1050,
    h: 494,
    xlim: [0, 75],
    ylim: [0, 14],
    xt: [10, 30, 49, 70],
    yt: [0, 2, 6, 10, 14],
    xlabel: 'Parameters (billions)',
    ylabel: 'Presentations (trillions)',
  });
  if (cue(k, 3, 'two trillion usable tokens')) {
    rect(c, p.X(0), p.Y(2), p.X(75) - p.X(0), p.Y(0) - p.Y(2), '#bad9c688');
    line(c, p.X(0), p.Y(2), p.X(75), p.Y(2), teal, 4);
    if (cue(k, 5, 'limit of thirty billion')) {
      rect(c, p.X(0), p.Y(2), p.X(30) - p.X(0), p.Y(0) - p.Y(2), '#66857155');
      line(c, p.X(30), p.Y(14), p.X(30), p.Y(0), warp, 4);
    }
  }
  p.curve((v) => 98 / v, 7, 75, warp);
  p.point(n, d, weft, 14);
  reading(c, 'Full-budget candidate', fixed(n) + 'B × ' + fixed(d) + 'T', 1305, 345, warp, 53);
  reading(
    c,
    'Fitted loss',
    surfaceLoss(n * 1e9, d * 1e12).toFixed(3) + ' nats',
    1305,
    532,
    ink,
    55,
  );
  if (i === 6) {
    label(c, '30B × 2T  <  49B × 2T', 1305, 813, 38, weft);
    label(c, 'Reduce the run or add data.', 1305, 883, 34, dim);
  }
}

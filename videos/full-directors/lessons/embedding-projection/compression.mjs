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
  plate,
  paperInk,
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

import { savedCoordinates, unitFinite } from '../../../films/embedding-projection/arithmetic.mjs';

const servingMean = [1, 1, 1],
  servingAxes = [
    [1, 0, 0],
    [0, 1, 0],
  ];
export function servingRow(input) {
  const centered = input.map((x, i) => x - servingMean[i]);
  const projected = savedCoordinates(input, servingMean, servingAxes);
  return [input, centered, projected, unitFinite(projected)];
}
export function serving(c, k) {
  const b = k.beat.beatIndex;
  title(
    c,
    b === 0
      ? 'One fitted transform for both paths'
      : b === 1
        ? 'Choose a method for the job'
        : 'Measure the complete request',
  );
  if (b === 0) {
    const q = cue(k, 0, 'Now thread the query'),
      unit = cue(k, 0, 'normalize both outputs');
    const columns = [120, 514, 893, 1314];
    ['Input', 'Subtract mean', 'Read axes', 'Unit length'].forEach((s, i) =>
      label(c, s, columns[i], 254),
    );
    const rows = [
      ['Document', ...servingRow([4, 2, 1]).map((v) => pair(v)), mint],
      ['Query', ...servingRow([3, 3, 2]).map((v) => pair(v)), gold],
    ];
    rows.slice(0, q ? 2 : 1).forEach(([name, a, b, d, n, col], i) => {
      const y = 381 + 173 * i;
      [a, b, d, n].forEach((v, j) => {
        if (j === 3 && !unit) return;
        if (j > 0) arrow(c, columns[j] - 118, y, columns[j] - 28, y, col, 3);
        mono(c, v, columns[j], y, 34, col);
      });
      text(c, name, columns[0], y + 53, 27, soft);
    });
    note(c, 'Saved mean (1, 1, 1)     •     axes (1, 0, 0), (0, 1, 0)', 118, 741);
  } else {
    const left = 96,
      right = 849;
    line(c, 794, 237, 794, 747, grid, 2);
    if (b === 1) {
      [
        [185, 385, 245, 418],
        [295, 480, 343, 452],
        [499, 352, 578, 400],
      ].forEach(([x, y, X, Y], i) => {
        line(c, x, y, X, Y, blue, 4);
        knob(c, x, y, '', blue);
        knob(c, X, Y, '', blue);
      });
      label(c, 'INSPECTION MAP', left, 241);
      text(c, 't-SNE or UMAP', left, 608, 43, white, 'left', 'Serif');
      note(c, 'Check a suspected neighbor in source space.', left, 684);
      label(c, 'SEARCHABLE COORDINATES', right, 241);
      for (let i = 0; i < 17; i++) rect(c, right + i * 35, 363, 27, 91, i < 6 ? mint : grid);
      text(c, 'Prefix, PCA or a fixed matrix', right, 608, 42, white, 'left', 'Serif');
      note(c, 'Score held-out Recall@K or nDCG@K.', right, 684);
    } else {
      plate(c, 89, 253, 637, 423);
      label(c, 'EXAMPLE JUDGED KEY QUESTION', 124, 303, paperInk);
      text(c, 'Which clauses came back?', 124, 375, 35, paperInk, 'left', 'Serif');
      ['Rotation ticket', 'Stale-key procedure'].forEach((s, i) => {
        circle(c, 149, 468 + i * 87, 13, '#347e68');
        text(c, s, 185, 468 + i * 87, 29, paperInk);
      });
      label(c, 'END-TO-END TIMER', 849, 270);
      const paths = ['Encode', 'Transform', 'Search', 'Fetch + rescore'];
      paths.forEach((s, i) => {
        const x = 850 + i * 156;
        circle(c, x + 22, 409, 12, i === 3 ? gold : mint);
        if (i < 3) line(c, x + 36, 409, x + 163, 409, grid, 4);
        text(c, s, x + 19, 468, 24, white, 'center');
      });
      line(c, 870, 547, 1340, 547, gold, 3);
      [870, 1340].forEach((x) => line(c, x, 528, x, 563, gold, 3));
      note(c, 'Measure the whole request.', 849, 611, gold, 34);
      note(c, 'Also record build time and full index bytes for the same search settings.', 99, 768);
    }
  }
}
export const jl = (n, e) => Math.ceil((4 * Math.log(n)) / (e ** 2 / 2 - e ** 3 / 3));
export const jlRanges = [1, 1.15].map((v) => [v * 0.85, v * 1.15]);
export function randomProjection(c, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    title(c, 'Save one random projection');
    label(c, 'INPUT COORDINATES × OUTPUT COLUMNS', 80, 196);
    const samples = [
      [0, 1, 0, 0, -1, 0],
      [0, 0, -1, 0, 0, 1],
      [-1, 0, 0, 1, 0, 0],
      [0, 0, 0, 1, 0, 0],
      [1, 0, -1, 0, 0, 0],
      [0, 0, 0, 0, 1, 0],
    ];
    samples.forEach((r, i) =>
      r.forEach((v, j) => {
        const x = 150 + j * 78,
          y = 268 + i * 74;
        rect(c, x, y, 70, 65, v < 0 ? '#643e42' : v > 0 ? '#235d57' : deep);
        mono(
          c,
          v < 0 ? '−' : v > 0 ? '+' : '0',
          x + 35,
          y + 33,
          35,
          v < 0 ? rose : v ? mint : soft,
          'center',
        );
      }),
    );
    label(c, 'Sparse draw, six columns shown', 150, 763);
    summary(
      c,
      [
        ['Gaussian entry variance', '1 / k'],
        ['Sparse nonzero magnitude', '√(3/k)', gold],
        ...(b === 1 ? [['Probability for +, −, 0', '1/6, 1/6, 2/3']] : []),
      ],
      849,
      289,
      146,
    );
    return;
  }
  if (b < 4) {
    title(c, 'A sufficient dimension for a fixed set');
    label(c, 'JOHNSON–LINDENSTRAUSS BOUND   /   0 < ε < 1', 80, 191);
    mono(c, '4 ln N', 376, 345, 63, gold, 'center');
    line(c, 113, 409, 642, 409, white, 4);
    mono(c, 'ε²/2 − ε³/3', 377, 481, 54, white, 'center');
    text(c, 'Round the quotient up.', 115, 615, 37);
    summary(
      c,
      [
        ['Fixed points N', '10,000,000'],
        ['Squared-distance tolerance', 'ε = 0.15'],
        ...(b === 3 ? [['Sufficient dimension', jl(1e7, 0.15).toLocaleString('en-US'), gold]] : []),
      ],
      804,
      262,
      137,
    );
    if (b === 3)
      note(c, 'Original width   1,536.  This bound offers no compression here.', 115, 798);
    return;
  }
  if (b < 7) {
    title(c, 'Can their ranks cross?');
    label(c, 'SQUARED DISTANCE TO THE SAME QUERY  /  ±15%', 80, 188);
    const t = smooth(cue(k, 5, 'Move the two marks', 1.3)),
      v = [mix(1, 1.1, t), mix(1.15, 1.03, t)],
      X = (d) => 266 + (d - 0.8) * 2090;
    for (let i = 0; i < 2; i++) {
      const y = 344 + i * 191,
        [lo, hi] = jlRanges[i],
        col = i ? blue : mint;
      text(c, 'AB'[i], 85, y, 60, col, 'left', 'Serif');
      line(c, X(0.8), y, X(1.36), y, grid, 3);
      line(c, X(lo), y, X(hi), y, col, 10);
      for (const d of [lo, hi]) {
        line(c, X(d), y - 21, X(d), y + 21, col, 3);
        mono(c, fmt(d, 4), X(d), y + 52, 27, col, 'center');
      }
      circle(c, X(v[i]), y, 17, gold, deep, 3);
      mono(c, v[i].toFixed(2), X(v[i]), y - 53, 36, gold, 'center');
    }
    if (t === 1)
      text(c, 'B is closer inside the allowed intervals.', 88, 720, 43, gold, 'left', 'Serif');
    else note(c, 'Choose positions inside both intervals. Must A stay closer?', 88, 720);
    if (b === 6) mono(c, '√0.85 ≈ 0.922     √1.15 ≈ 1.072', 88, 805, 28);
    return;
  }
  title(c, 'Test the drawn matrix on queries');
  label(c, 'SEEDED 48 → 16 PROJECTION   /   AGGREGATE OF 12 QUERIES × 5 NEIGHBORS', 80, 192);
  for (let i = 0; i < 60; i++) {
    const x = 104 + (i % 15) * 49,
      y = 325 + Math.floor(i / 15) * 76;
    circle(c, x, y, 14, i < 19 ? mint : deep, i < 19 ? mint : grid, 3);
  }
  text(c, '19 original neighbors survive', 86, 693, 43, mint, 'left', 'Serif');
  summary(
    c,
    [
      ['Float payload', '192 B → 64 B'],
      ['Overlap@5', (19 / 60).toFixed(3), mint],
      ['Relevance judgments', 'Unlabeled sample'],
    ],
    955,
    289,
    133,
  );
}
const a = [-1, -0.3, 0.4, 1],
  bvec = [-0.8, 0.2, 0.5, -0.4];
export const scalar = (v, max = 1) => {
  const scale = 127 / max,
    scaled = v * scale,
    code = Math.max(-127, Math.min(127, Math.round(scaled)));
  return { scale, scaled, code, decoded: code / scale };
};
export const xor = a.map((n, i) => Number(n > 0) ^ Number(bvec[i] > 0));
export function quantize(c, k) {
  const b = k.beat.beatIndex;
  if (b < 3) {
    const v = a[1],
      s = scalar(v),
      decoded = cue(k, 1, 'Divide the code'),
      clip = cue(k, 2, 'Values outside');
    title(c, clip ? 'Clip values outside calibration' : 'Read a scalar against the saved scale');
    label(c, 'SYMMETRIC INT8   /   CALIBRATION MAXIMUM |x| = 1', 83, 182);
    if (!clip) {
      const X = (x) => 167 + (x + 0.308) * 52400,
        y = 473;
      for (let i = -39; i <= -37; i++) {
        const x = X(i / 127);
        line(c, x, y - 45, x, y + 45, grid, 4);
        mono(c, i, x, y + 85, 32, soft, 'center');
      }
      line(c, 95, y, 1330, y, soft, 3);
      arrow(c, X(v), y - 123, X(v), y - 8, gold, 5, 20);
      text(c, 'Input  −0.3000', X(v) - 9, y - 161, 38, gold, 'center');
      if (decoded) {
        circle(c, X(s.decoded), y, 14, mint);
        text(c, 'Decoded ' + fmt(s.decoded, 5), X(s.decoded) + 70, y + 168, 35, mint, 'center');
      }
      mono(c, '−0.30 × 127 = −38.1     →     code ' + fmt(s.code, 0), 103, 759, 42);
    } else {
      const y = 443;
      line(c, 161, y, 1340, y, grid, 9);
      line(c, 302, y, 1173, y, mint, 9);
      [-127, 0, 127].forEach((n, i) => {
        const x = 302 + 435.5 * i;
        line(c, x, y - 27, x, y + 27, white, 3);
        mono(c, n, x, y + 75, 38, white, 'center');
      });
      arrow(c, 1370, y - 80, 1177, y - 6, rose, 6, 24);
      text(c, 'Input 1.2', 1318, y - 126, 36, rose, 'center');
      mono(c, 'round(1.2 × 127) → clip to ' + scalar(1.2).code, 161, 703, 44);
    }
    return;
  }
  if (b < 5) {
    title(c, 'Keep just the sign');
    label(c, 'POSITIVE → 1     ZERO OR NEGATIVE → 0', 82, 183);
    const showX = cue(k, 3, 'XOR marks'),
      sign = cue(k, 3, 'both become one');
    [a, bvec, ...(showX ? [xor] : [])].forEach((row, i) => {
      const y = 299 + i * 141;
      label(c, ['VECTOR A', 'VECTOR B', 'A XOR B'][i], 84, y + 37);
      row.forEach((v, j) => {
        const x = 354 + j * 254,
          col = i === 2 ? (v ? gold : soft) : v > 0 ? mint : blue;
        pane(c, x, y - 13, 201, 101);
        mono(
          c,
          i === 2 ? v : fmt(v, 1) + (sign ? ' → ' + Number(v > 0) : ''),
          x + 100,
          y + 38,
          36,
          col,
          'center',
        );
      });
    });
    if (b === 4) {
      mono(c, 'Hamming distance = ' + xor.reduce((a, b) => a + b), 82, 744, 39, gold);
      note(c, '256 coordinates: float32  1,024 B     int8  256 B     packed signs  32 B', 83, 814);
    }
    return;
  }
  if (cue(k, 6, 'Its first operation')) {
    title(c, 'Rotate first, then code the coordinates');
    label(c, 'TOY ORTHOGONAL ROTATION  /  ONE UNIT FROM THE ORIGIN', 84, 181);
    const t = smooth(cue(k, 6, 'Its first operation', 1.6)),
      angle = (t * Math.PI) / 4;
    const v = [
      0.6 * Math.cos(angle) - 0.8 * Math.sin(angle),
      0.6 * Math.sin(angle) + 0.8 * Math.cos(angle),
    ];
    const codes = v.map((x) => scalar(x).code),
      decoded = codes.map((n) => n / 127),
      rounded = cue(k, 7, 'Rounding the rotated coordinates');
    const w = ([x, y]) => [423 + 209 * x, 524 - 209 * y];
    gridPlot(c, 85, 214, 677, 545, 52.25);
    circle(c, ...w([0, 0]), 209, null, grid, 2);
    line(c, ...w([0, 0]), ...w([0.6, 0.8]), soft, 2, [7, 6]);
    arrow(c, ...w([0, 0]), ...w(v), mint, 6, 22);
    circle(c, ...w([0, 0]), 7, white);
    summary(
      c,
      [
        ['Rotated coordinates', pair(v, 4), mint],
        ['Distance to origin', fmt(Math.hypot(...v), 4)],
        ...(rounded
          ? [
              ['Stored scalar codes', pair(codes, 0), gold],
              ['Decoded coordinates', pair(decoded, 4), gold],
            ]
          : []),
      ],
      869,
      239,
      129,
    );
    note(
      c,
      rounded
        ? 'Code error enters when the rotated values are rounded.'
        : 'Rotating both endpoints preserves their separation.',
      88,
      810,
    );
    return;
  }
  title(c, 'Which candidates can rescoring reach?');
  label(c, 'REQUEST 100 RESULTS  /  OVERSAMPLING 2.4', 82, 187);
  const cols = 24,
    take = 100,
    pool = 240;
  for (let i = 0; i < pool; i++) {
    const x = 112 + (i % cols) * 32,
      y = 287 + Math.floor(i / cols) * 32;
    rect(c, x, y, 24, 23, i === 100 ? gold : i < 100 ? '#69a99f' : '#416573');
  }
  dim(c, 111, 111 + cols * 32 - 8, 647, '240 compressed candidates');
  summary(
    c,
    [
      ['Fetched for full scoring', 'Ranks 1–240', blue],
      ['Allowed in final response', '100 results', mint],
    ],
    990,
    303,
    153,
  );
  if (b >= 6) {
    const rises = cue(k, 6, 'make the final hundred');
    mono(c, rises ? '#101 → #99' : '#101', 988, 604, 42, gold);
    note(c, 'Possible full-score rank', 988, 659, soft, 27);
    if (cue(k, 6, 'outside the shortlist'))
      note(c, '#241 receives no full score.', 989, 724, rose, 27);
  }
  if (b === 7)
    note(c, 'Time the fetch and full-vector scoring along with the compressed search.', 91, 801);
}
const pqInput = Array.from({ length: 8 }, (_, i) => (i === 0 ? 0.101 : 0.1 + i * 0.1));
const blockDistance = (x, id) => 16 * (x - id / 255) ** 2;
const centroidIds = Array.from({ length: 256 }, (_, i) => i);
function closestCentroid(value) {
  return centroidIds.reduce(
    (best, id) => (blockDistance(value, id) < blockDistance(value, best) ? id : best),
    0,
  );
}
export const pqBlocks = pqInput.map((v, i) => {
  const q = 0.15 + i * 0.08,
    id = closestCentroid(v),
    queryId = closestCentroid(q);
  return {
    id,
    v,
    q,
    cost: blockDistance(q, id),
    error: blockDistance(v, id),
    queryId,
    symmetricCost: blockDistance(queryId / 255, id),
  };
});
export function product(c, k) {
  const b = k.beat.beatIndex;
  if (b < 3) {
    title(c, 'One ID replaces a block of floats');
    label(c, '128 COORDINATES  /  8 BLOCKS OF 16', 80, 178);
    const encoded = cue(k, 1, 'eight block identifiers');
    pqBlocks.forEach(({ id }, i) => {
      const x = 84 + i * 182;
      label(c, 'B' + i, x, 265);
      pane(c, x, 316, 153, 104);
      if (encoded) mono(c, id, x + 76, 367, 45, gold, 'center');
      else for (let j = 0; j < 16; j++) rect(c, x + 7 + j * 8.7, 342, 5, 48, mint);
    });
    mono(
      c,
      encoded ? '8 × 1 B = 8 B / document' : '128 × 4 B = 512 B / document',
      84,
      512,
      42,
      encoded ? gold : mint,
    );
    label(c, 'SHARED CODEBOOK FOR B0', 82, 608);
    text(c, '16 copies of 0.101', 83, 679, 34);
    arrow(c, 439, 681, 549, 681, soft, 3);
    text(
      c,
      'closest centroid  ' + pqBlocks[0].id + ' / 255 in each coordinate',
      595,
      680,
      36,
      gold,
    );
    if (b === 2)
      note(c, 'Across all eight books: 256 × 128 × 4 B = 131,072 B stored once.', 84, 798);
    return;
  }
  if (!cue(k, 5, 'In the forty-row example')) {
    const symmetric = cue(k, 5, 'Symmetric computation');
    title(
      c,
      symmetric
        ? 'What changes when the query gets a code?'
        : 'The document code looks up query distances',
    );
    label(
      c,
      symmetric ? 'ADC REFERENCE   /   ORIGINAL QUERY' : 'ASYMMETRIC DISTANCE COMPUTATION',
      82,
      171,
    );
    label(c, '8 BLOCKS OF 16 COORDINATES', 577, 171);
    const n = Math.min(8, Math.floor(cue(k, 3, 'stored ID selects', 2.4) * 8));
    ['Block', 'Stored ID', 'Query value', 'Squared distance'].forEach((s, i) =>
      label(c, s, [91, 296, 493, 753][i], 237),
    );
    pqBlocks.forEach(({ id, q, cost }, i) => {
      const y = 298 + i * 51,
        col = i < n ? mint : soft;
      mono(c, 'B' + i, 94, y, 28, col);
      mono(c, id, 312, y, 28, col);
      mono(c, q.toFixed(2), 514, y, 28, col);
      if (i < n) mono(c, cost.toFixed(5), 797, y, 28, col);
    });
    line(c, 1035, 248, 1035, 722, grid, 2);
    label(c, symmetric ? 'ADC REFERENCE SUM' : 'RUNNING SUM', 1096, 244);
    mono(
      c,
      pqBlocks
        .slice(0, n)
        .reduce((s, v) => s + v.cost, 0)
        .toFixed(5),
      1091,
      315,
      54,
      gold,
    );
    text(c, n + ' of 8 entries', 1097, 382, 30);
    if (symmetric) {
      const block = pqBlocks[0];
      label(c, 'SYMMETRIC SCORING   /   B0', 1096, 458, mint);
      mono(c, 'Query   ' + block.q.toFixed(2), 1096, 520, 30);
      if (cue(k, 5, 'query block becomes')) {
        arrow(c, 1323, 520, 1357, 520, mint, 3, 9);
        mono(c, 'ID ' + block.queryId, 1381, 520, 30, mint);
      }
      if (cue(k, 5, 'Compare the two centroids')) {
        mono(c, 'Document   ID ' + block.id, 1096, 582, 30, mint);
        mono(c, '16 × ((' + block.queryId + ' − ' + block.id + ')/255)²', 1096, 641, 27);
      }
      if (cue(k, 5, 'Their squared distance'))
        mono(c, '≈ ' + block.symmetricCost.toFixed(5), 1096, 702, 38, gold);
    } else if (cue(k, 4, 'ninety-six blocks')) {
      label(c, 'SEPARATE 96-BLOCK EXAMPLE', 1096, 505);
      mono(c, '96 × 256 × 4 B', 1096, 571, 32);
      if (cue(k, 4, 'ninety-six kibibytes')) mono(c, '96 KiB / query', 1096, 646, 39, mint);
    }
    note(
      c,
      'Distances are rounded for display. The sum uses unrounded distances.',
      90,
      728,
      soft,
      23,
    );
    note(
      c,
      symmetric
        ? cue(k, 5, 'For cosine')
          ? 'For cosine, normalize both nonzero reconstructions before taking their dot product.'
          : 'Each B0 centroid repeats its ID divided by 255 in all 16 coordinates.'
        : 'Each query value repeats across its block. The stored ID selects one of 256 distances.',
      84,
      798,
      soft,
      26,
    );
    return;
  }
  title(c, 'Shared books and per-row codes');
  label(c, '40 DOCUMENTS   /   4 FLOATS EACH   /   2 BLOCKS   /   4 CENTROIDS PER BLOCK', 81, 179);
  for (let i = 0; i < 40; i++) {
    const x = 105 + (i % 10) * 61,
      y = 298 + Math.floor(i / 10) * 61;
    rect(c, x, y, 21, 38, mint);
    rect(c, x + 23, y, 21, 38, blue);
  }
  text(
    c,
    cue(k, 6, 'two code bytes') ? '2 code bytes per row' : '2 centroid IDs per row',
    102,
    614,
    43,
    white,
    'left',
    'Serif',
  );
  summary(
    c,
    [
      ['Original row', '4 × 4 B = 16 B'],
      ...(cue(k, 6, 'The two codebooks')
        ? [['Two shared codebooks', '2 × 4 × 2 × 4 B = 64 B', gold]]
        : []),
      ...(cue(k, 6, 'two packed bits') ? [['Bit-packed IDs', '2 bits per block']] : []),
    ],
    838,
    263,
    144,
  );
  if (b === 7)
    note(c, 'Fit both books on training documents. Evaluate the metric used in serving.', 84, 796);
}
export const prefixes = [64, 128, 256, 1024];
export const shortlistRuns = [
  [3, 5],
  [12, 17],
];
export function prefix(c, k) {
  const b = k.beat.beatIndex;
  if (b < 3) {
    title(c, 'Which losses reach this coordinate?');
    label(c, 'NESTED TRAINING PREFIXES', 82, 175);
    const origin = 291,
      w = 1142;
    prefixes.forEach((n, i) => {
      const y = 283 + i * 102,
        col = [gold, mint, blue, rose][i];
      mono(c, 'L' + n, 84, y, 32, col);
      rect(c, origin, y - 17, w, 35, '#254652');
      rect(c, origin, y - 17, (n / 1024) * w, 35, col);
      for (let j = 0; j <= 16; j++)
        line(c, origin + (j * w) / 16, y - 17, origin + (j * w) / 16, y + 18, deep, 1);
    });
    if (b >= 1) {
      dim(c, origin, origin + w / 16, 663, '64', gold);
      dim(c, origin + w / 4, origin + w, 663, 'Last 768', rose);
      note(
        c,
        'First 64: four losses can contribute.                                  Last 768: one loss can contribute.',
        85,
        785,
      );
    }
    return;
  }
  if (cue(k, 5, 'For a real encoder')) {
    title(c, 'Check the lengths the encoder supports');
    label(c, 'ARTICLE EXAMPLES   /   FULL OUTPUT IN COORDINATES', 82, 186);
    for (const [i, name, length] of [
      [0, 'text-embedding-3-small', 1536],
      [1, 'text-embedding-3-large', 3072],
    ]) {
      const y = 325 + i * 195;
      mono(c, name, 84, y, 34);
      rect(c, 84, y + 43, length / 3, 24, i ? blue : mint);
      mono(c, length.toLocaleString('en-US'), 1242, y + 54, 43, i ? blue : mint);
    }
    if (b === 6)
      note(
        c,
        'Use the same supported length and normalization for documents and queries.',
        84,
        773,
      );
    return;
  }
  if (b === 4) {
    title(c, 'Search a supported prefix, then rescore');
    label(c, 'SUPPORTED 64 OF 1,024 COORDINATES', 83, 184);
    for (let i = 0; i < 16; i++) rect(c, 91 + i * 87, 296, 78, 83, i === 0 ? mint : '#537881');
    dim(c, 92, 92 + 16 * 87 - 9, 423, 'Full vector store  /  4,096 B per row');
    line(c, 130, 380, 130, 569, mint, 3);
    mono(c, '64 × 4 B', 169, 541, 39, mint);
    text(c, 'Search the prefix', 169, 606, 35, white);
    arrow(c, 534, 575, 702, 575, gold, 4);
    text(c, 'Fetch shortlisted full vectors', 755, 573, 38, gold);
    note(c, 'Count the full-vector store and fetch time in the serving budget.', 92, 766);
    return;
  }
  title(c, 'The shortlist sets a ceiling');
  label(c, 'UNTRAINED PREFIX CONTROL  /  2 OF 8 COORDINATES', 83, 181);
  const wide = cue(k, 5, 'twelve candidates'),
    [limit, hits] = shortlistRuns[wide ? 1 : 0];
  for (let i = 0; i < 27; i++) {
    const x = 126 + (i % 9) * 77,
      y = 321 + Math.floor(i / 9) * 83;
    circle(c, x, y, 22, i < hits ? mint : deep, i < hits ? mint : grid, 3);
  }
  dim(c, 101, 765, 590, '27 reference-neighbor slots');
  text(c, hits + ' survive the shortlist', 103, 692, 42, mint, 'left', 'Serif');
  summary(
    c,
    [
      ['Candidates per query', String(limit)],
      ['After exact rescore', hits + ' / 27', mint],
      ['Fraction of original top 3', (hits / 27).toFixed(3)],
    ],
    893,
    263,
    140,
  );
  if (b === 5) note(c, 'Full-vector scoring can reorder only the candidates it receives.', 87, 808);
}

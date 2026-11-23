import {
  deep,
  grid,
  soft,
  white,
  gold,
  mint,
  blue,
  rose,
  paperInk,
  rect,
  line,
  poly,
  circle,
  arrow,
  text,
  mono,
  title,
  label,
  pane,
  note,
  plate,
  knob,
  gridPlot,
  dim,
  cue,
  mix,
  smooth,
  fmt,
  pair,
  summary,
  chartBar,
} from './drawing.mjs';
import {
  DROP_FIXTURE,
  VECTOR_BYTES,
  policyVectors,
  policyQuery,
  PCA_POINTS,
} from '../../../films/embedding-projection/fixtures.mjs';
import { PCA_AXIS, POLICY_SCORES } from '../../../films/embedding-projection/model.mjs';
import { unitFinite } from '../../../films/embedding-projection/arithmetic.mjs';

const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
export const ranking = POLICY_SCORES.map((score, id) => ({ score, id })).sort(
  (a, b) => b.score - a.score,
);
export const budget = (dimensions, bytes = 4, count = 1) => dimensions * bytes * count;

export function opticalState(depth, angle) {
  return DROP_FIXTURE.map(({ point: [x, y, z] }, i) => ({
    x: 516 + 91 * (x * Math.cos(angle) - z * depth * Math.sin(angle)),
    y: 496 - 91 * y,
    distance: Math.hypot(x, y, z * depth),
    name: ['18-day key', 'Rotation', 'Access', 'Merge'][i],
  }));
}
function sight(c, depth, angle, aperture = 1) {
  const cx = 484,
    cy = 455,
    r = 368;
  circle(c, cx, cy, r + 19, '#152e36', '#86968b', 5);
  circle(c, cx, cy, r + 7, '#051b21', '#4e6667', 6);
  c.save();
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.clip();
  const g = c.createRadialGradient(cx + 65, cy - 30, 30, cx, cy, r);
  g.addColorStop(0, '#254f55');
  g.addColorStop(1, '#122f38');
  rect(c, 0, 0, 950, 900, g);
  const dx = 91 * Math.cos(angle);
  for (let n = -7; n <= 7; n++) {
    line(c, 516 + n * dx, 50, 516 + n * dx, 870, n === 0 ? '#729697' : '#355964', n === 0 ? 2 : 1);
    line(c, 44, 496 + 91 * n, 925, 496 + 91 * n, n === 0 ? '#729697' : '#355964', n === 0 ? 2 : 1);
  }
  const [q, rot, acc, m] = opticalState(depth, angle);
  if (angle > 0.01) {
    const end = opticalState(1, angle)[3];
    line(c, q.x, q.y, end.x, end.y, blue, 3, [6, 6]);
    for (let n = 1; n <= 8; n++) {
      const x = mix(q.x, end.x, n / 8);
      line(c, x, q.y - 8, x, q.y + 8, blue, 2);
    }
  }
  knob(c, rot.x, rot.y, '', mint, 14);
  knob(c, acc.x, acc.y, '', gold, 14);
  text(c, 'Rotation', rot.x + 30, rot.y + 20, 30, mint);
  text(c, 'Access', acc.x + 24, acc.y, 30, gold);
  circle(c, q.x, q.y, 8, white);
  line(c, q.x - 16, q.y, q.x + 16, q.y, white, 3);
  line(c, q.x, q.y - 16, q.x, q.y + 16, white, 3);
  circle(c, m.x, m.y, 22, null, blue, 8);
  text(c, 'Merge', m.x, m.y - 43, 30, blue, 'center');
  line(c, q.x, q.y + 25, q.x - 14, q.y + 74, soft, 1.5);
  text(c, '18-day key', q.x - 15, q.y + 99, 28, white, 'center');
  if (aperture < 1) {
    const inner = 128 + 240 * aperture;
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      const point = (radius, theta) => [
        cx + radius * Math.cos(theta),
        cy + radius * Math.sin(theta),
      ];
      poly(
        c,
        [
          point(inner, a),
          point(r + 40, a - 0.18),
          point(r + 40, a + Math.PI / 6 - 0.18),
          point(inner, a + Math.PI / 6),
        ],
        i % 2 ? '#30464a' : '#394e50',
        '#6a7c78',
        1.2,
      );
    }
  }
  c.restore();
  for (let n = 0; n < 120; n++) {
    const a = (n * Math.PI) / 60,
      l = n % 10 === 0 ? 12 : 4;
    line(
      c,
      cx + (r + 1) * Math.cos(a),
      cy + (r + 1) * Math.sin(a),
      cx + (r + 1 + l) * Math.cos(a),
      cy + (r + 1 + l) * Math.sin(a),
      '#98a69a',
      n % 10 === 0 ? 2 : 1,
    );
  }
}
export function opening(c, k) {
  const b = k.beat.beatIndex,
    side = smooth(cue(k, 2, 'tip the sight sideways', 1.7));
  sight(c, 1, side * 0.48, smooth(cue(k, 0, 'Look straight down', 1.65)));
  plate(c, 925, 142, 592, 574);
  label(c, 'POLICY QUESTION', 978, 195, paperInk);
  title(c, 'My key is', 978, 275, 66, paperInk);
  title(c, '18 days old.', 978, 356, 71, paperInk);
  text(c, 'Can I keep using it?', 979, 432, 36, paperInk, 'left', 'Serif');
  line(c, 978, 483, 1462, 483, '#acaa92', 2);
  if (!cue(k, 2, 'Merge')) {
    if (b === 0) {
      label(c, 'CLAUSES IN VIEW', 978, 530, paperInk);
      text(c, 'Rotation  ·  Keys over 14 days', 978, 592, 30, paperInk);
      text(c, 'Merge  ·  Failed scan', 978, 644, 30, paperInk);
    } else {
      text(c, 'Closest clause in x and y?', 978, 545, 36, paperInk);
    }
  } else {
    label(c, 'RETURNED BY THE x–y SEARCH', 978, 535, paperInk);
    text(c, 'A failed scan blocks a merge.', 978, 591, 34, paperInk, 'left', 'Serif');
  }
  if (side === 1) mono(c, 'Depth difference   8 units', 977, 658, 26, paperInk);
  label(
    c,
    side === 1
      ? 'Oblique sight through the same points'
      : cue(k, 2, 'tip the sight sideways')
        ? 'Tipping away from the z-axis'
        : 'Sight along z  /  x–y projection',
    130,
    855,
  );
}
export function depthReplay(c, k) {
  const raised = smooth(cue(k, 1, 'Lift merge', 1.6)),
    lower = smooth(cue(k, 2, 'Drop z again', 1.6));
  const depth = raised * (1 - lower),
    points = opticalState(depth, 0.48);
  sight(c, depth, 0.48);
  label(c, 'DISTANCE FROM THE QUERY', 925, 170);
  title(c, 'Restore depth', 925, 236, 54);
  [1, 2, 3].forEach((j, i) => {
    const p = points[j],
      y = 346 + i * 113,
      col = [mint, gold, blue][i];
    text(c, p.name, 925, y, 32, col);
    mono(c, fmt(p.distance, 1), 1510, y, 35, col, 'right');
    chartBar(c, 925, y + 35, 581, p.distance / 8, col);
  });
  if (k.beat.beatIndex === 0) {
    mono(c, 'Original z   0   0   0   8', 925, 717, 28);
    note(c, 'Query, rotation, access, merge', 925, 758);
  } else if (depth === 1 && cue(k, 1, 'Rotation is now'))
    text(c, 'Nearest clause   Rotation', 925, 729, 40, mint);
  else if (lower === 1) text(c, 'Nearest in x–y   Merge', 925, 729, 40, blue);
}
export function bytesScene(c, k) {
  const { dimensions, reduced: short, records } = VECTOR_BYTES;
  const reduced = cue(k, 1, 'Keep just');
  const showArrays = cue(k, 1, 'For ten million records');
  title(c, showArrays ? 'Raw storage for 10 million records' : 'A single vector in memory');
  label(c, 'FLOAT32  /  4 BYTES PER COORDINATE', 80, 186);
  for (let i = 0; i < 6; i++) {
    const x = 80 + i * 238;
    if (reduced && i > 0) {
      line(c, x, 455, x + 218, 455, grid, 2, [8, 7]);
      continue;
    }
    poly(
      c,
      [
        [x, 292],
        [x + 218, 292],
        [x + 236, 273],
        [x + 18, 273],
      ],
      '#8eb8b3',
    );
    rect(c, x, 292, 218, 162, i === 0 ? mint : '#afd0cb');
    for (let j = 0; j < 16; j++) {
      line(c, x + 8 + j * 13, 309, x + 8 + j * 13, 436, i === 0 ? '#499b8f' : '#72999b', 3);
    }
    mono(c, '256', x + 109, 493, 30, i === 0 ? mint : soft, 'center');
  }
  dim(c, 80, 1488, 535, 'Original width: ' + dimensions.toLocaleString('en-US') + ' coordinates');
  const n = reduced ? short : dimensions;
  dim(c, 80, 80 + (reduced ? 218 : 1408), 609, n + ' × 4 B', mint);
  const showBytes = reduced ? cue(k, 1, 'Each record now') : cue(k, 0, 'At four bytes');
  const bytes = showBytes ? budget(n).toLocaleString('en-US') : '?';
  mono(c, bytes + ' B / record', 80, 718, 52, mint);
  if (showArrays) {
    const gigabytes = (width) => (budget(width, 4, records) / 1e9).toFixed(2) + ' GB';
    text(c, 'Full array', 465, 302, 34, gold);
    mono(c, gigabytes(dimensions), 465, 377, 57, gold);
    text(c, 'Short array', 995, 302, 34, mint);
    mono(c, cue(k, 1, 'ten point two four') ? gigabytes(short) : '? GB', 995, 377, 57, mint);
    if (cue(k, 2, 'The raw array'))
      text(c, '1/' + (dimensions / short) + ' of the full array', 995, 433, 32, mint);
  }
}
export const relative = (d) => Math.sqrt(2 / d);
export function concentration(c, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    title(c, 'Squared distance, relative to its mean');
    text(c, 'X and Y are independent draws from N(0, σ²I), with σ > 0.', 82, 188, 32, soft);
    const cx = 610,
      unit = 570;
    [8, 128].forEach((d, i) => {
      const y = 347 + i * 223,
        v = relative(d),
        w = v * unit;
      mono(c, 'd = ' + d, 85, y - 57, 33, i === 0 ? blue : mint);
      line(c, 205, y, 1008, y, grid, 3);
      rect(c, cx - w, y - 15, 2 * w, 30, i ? mint : blue);
      circle(c, cx, y, 10, white);
      dim(c, cx, cx + w, y + 35, fmt(v, 3) + ' × mean', i ? mint : blue);
    });
    label(c, 'One standard deviation on each side', 228, 783);
    summary(
      c,
      [
        ['Mean', '2dσ²'],
        ['Variance', '8dσ⁴'],
        ['Relative spread', '√(2/d)', gold],
      ],
      1080,
      292,
      138,
    );
  } else {
    title(c, 'What occupies the index?');
    const xs = [100, 455, 825, 1190],
      names = ['Coordinates', 'Neighbor links', 'Graph levels', 'IDs and metadata'];
    xs.forEach((x, i) => {
      if (i === 0) {
        for (let col = 0; col < 8; col++)
          for (let row = 0; row < 4; row++) rect(c, x + col * 26, 322 + row * 36, 20, 27, mint);
      }
      if (i === 1) {
        const pts = [
          [x + 15, 409],
          [x + 91, 319],
          [x + 209, 355],
          [x + 165, 467],
          [x + 57, 477],
        ];
        [
          [0, 1],
          [0, 4],
          [1, 2],
          [1, 3],
          [2, 3],
          [3, 4],
        ].forEach(([a, b]) => line(c, ...pts[a], ...pts[b], blue, 4));
        pts.forEach((v) => circle(c, ...v, 12, deep, blue, 4));
      }
      if (i === 2) {
        [5, 3, 2].forEach((count, l) => {
          const y = 473 - l * 70;
          line(c, x + 8, y, x + 208, y, grid, 2);
          for (let j = 0; j < count; j++) circle(c, x + 8 + j * (200 / (count - 1)), y, 10, gold);
        });
        line(c, x + 8, 332, x + 8, 472, gold, 2, [4, 5]);
      }
      if (i === 3) {
        plate(c, x, 299, 255, 192);
        label(c, 'CLAUSE  R1', x + 17, 341, paperInk);
        text(c, 'Key rotation', x + 17, 400, 28, paperInk, 'left', 'Serif');
        line(c, x + 18, 451, x + 212, 451, '#a39e8d', 2);
      }
      text(c, names[i], x, 577, 31, i === 0 ? mint : white);
    });
    note(
      c,
      'Width sets coordinate bytes. HNSW degree and search effort affect cost and recall.',
      100,
      694,
      soft,
      32,
    );
    if (b === 3)
      label(
        c,
        'Measure index bytes, build work and whole-request latency at the chosen settings.',
        101,
        781,
        gold,
      );
  }
}
const clauses = [
  'Rotation ticket',
  'Stale-key procedure',
  'Merge approvals',
  'Failed scan',
  'Access expiry',
  'Standing admin',
];
export function baseline(c, k) {
  const scores = cue(k, 1, 'The two rotation clauses'),
    b = k.beat.beatIndex;
  title(c, 'Find both pieces of evidence');
  label(c, 'SIX COORDINATES PER CLAUSE', 76, 174);
  const rows = [...policyVectors, policyQuery];
  rows.forEach((row, i) => {
    const y = 246 + i * 72 + (i === 6 ? 23 : 0),
      col = i < 2 ? mint : i < 4 ? blue : i < 6 ? rose : gold;
    text(c, i === 6 ? '18-day key' : clauses[i], 78, y, 30, col);
    row.forEach((v, j) => {
      const x = 374 + j * 78;
      rect(c, x, y - 22, 68, 44, '#204652');
      rect(c, x, y + 17 - v * 37, 68, Math.max(1, v * 37), col);
    });
  });
  label(c, 'Input magnitudes before normalization', 371, 800);
  pane(c, 902, 194, 622, 528);
  label(c, 'UNIT QUERY  ·  UNIT CLAUSE', 946, 246);
  if (scores) {
    ranking.slice(0, 3).forEach(({ id, score }, i) => {
      const y = 337 + i * 98;
      mono(c, '0' + (i + 1), 951, y, 25, soft);
      text(c, clauses[id], 1012, y, 30, id < 2 ? mint : white);
      mono(c, score.toFixed(3), 1480, y, 34, white, 'right');
      line(c, 950, y + 38, 1480, y + 38, grid);
    });
  } else text(c, 'Which rows match the query?', 952, 422, 34, gold);
  if (b >= 2) {
    text(c, 'Recall@2', 950, 643, 32);
    mono(c, '2 / 2 = 1', 1466, 643, 38, mint, 'right');
  }
}
export function methods(c, k) {
  const b = k.beat.beatIndex,
    axis = [PCA_AXIS.x, PCA_AXIS.y],
    world = ([x, y]) => [419 + x * 78, 445 - y * 78];
  title(c, 'What does the map preserve?');
  gridPlot(c, 80, 237, 688, 405, 78);
  const ends = [-4.1, 4.1].map((v) => world(axis.map((a) => v * a)));
  line(c, ...ends[0], ...ends[1], gold, 4);
  const t = smooth(cue(k, 0, 'then maps points', 1.6));
  for (const { x, y } of PCA_POINTS) {
    const p = world([x, y]),
      z = dot([x, y], axis),
      q = world(axis.map((a) => a * z));
    line(c, ...p, ...q, mint, 3);
    circle(c, ...p, 10, deep, soft, 2);
    circle(c, mix(p[0], q[0], t), mix(p[1], q[1], t), 8, gold);
  }
  text(c, 'PCA', 82, 705, 46, gold, 'left', 'Serif');
  note(c, 'Spread along one fitted line', 82, 767);
  if (b >= 1) {
    pane(c, 844, 237, 679, 405);
    [
      [990, 342, 1093, 361],
      [1270, 385, 1324, 313],
      [1107, 512, 1190, 544],
    ].forEach(([x, y, X, Y], i) => {
      line(c, x, y, X, Y, [mint, blue, rose][i], 6);
      knob(c, x, y, '', [mint, blue, rose][i]);
      knob(c, X, Y, '', [mint, blue, rose][i]);
    });
    text(c, 'Local neighborhoods', 844, 705, 46, mint, 'left', 'Serif');
    note(
      c,
      b === 1 ? 'Which links should stay strong?' : 'Do the neighbors still answer the question?',
      844,
      767,
    );
  }
}
export function fitted(c, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    title(c, 'Three points, one direction');
    const t = smooth(cue(k, 0, 'Subtract that same mean', 1.3));
    const u = 105,
      world = ([x, y]) => [356 + x * u, 629 - y * u];
    gridPlot(c, 80, 208, 730, 552, u);
    const orig = world([2 * t, 2 * t]);
    const left = world([-0.2, -0.2]),
      right = world([3.7, 3.7]);
    line(c, ...left, ...right, gold, 3);
    [1, 2, 3].forEach((v, i) => {
      const p = world([v, v]);
      circle(c, ...p, 14, mint);
      text(c, pair([v - 2 * t, v - 2 * t], 1), p[0] + 20, p[1] - 22, 26, white);
    });
    line(c, orig[0] - 17, orig[1], orig[0] + 17, orig[1], rose, 3);
    line(c, orig[0], orig[1] - 17, orig[0], orig[1] + 17, rose, 3);
    label(c, 'Measurements from the origin cross', 84, 811);
    summary(
      c,
      [
        ['Fitted mean', '(2, 2)'],
        ['Unit direction', '(1, 1) / √2', gold],
        ...(b === 1 ? [['Projected positions', '−√2     0     +√2', mint]] : []),
      ],
      897,
      259,
      152,
    );
  } else {
    title(c, b < 5 ? 'Factor the centered data' : 'Choose the fitted geometry');
    label(c, 'THIN SINGULAR VALUE DECOMPOSITION', 80, 190);
    const items = [
      [
        'X',
        'N × d',
        [
          ['−1', '−1'],
          ['0', '0'],
          ['1', '1'],
        ],
        mint,
      ],
      [
        'U',
        'N × r',
        [
          ['−s', '0'],
          ['0', '1'],
          ['s', '0'],
        ],
        soft,
      ],
      [
        'Σ',
        'r × r',
        [
          ['2', '0'],
          ['0', '0'],
        ],
        gold,
      ],
      [
        'V transpose',
        'r × d',
        [
          ['s', 's'],
          ['−s', 's'],
        ],
        blue,
      ],
    ];
    items.forEach(([name, shape, values, col], i) => {
      const x = 110 + i * 367;
      pane(c, x, 307, 231, 186);
      values.forEach((row, j) =>
        row.forEach((value, l) =>
          mono(
            c,
            value,
            x + 73 + l * 89,
            337 + ((j + 0.5) * 126) / values.length,
            35,
            col,
            'center',
          ),
        ),
      );
      text(c, name, x + 115, 257, name === 'V transpose' ? 37 : 54, col, 'center', 'Serif');
      mono(c, shape, x + 115, 546, 32, col, 'center');
      if (i < 3) text(c, i === 0 ? '=' : '×', x + 295, 401, 43, soft, 'center');
    });
    label(c, 'Three-point fit: N = 3, d = 2, r = 2, s = 1/√2', 84, 604);
    const lines =
      b === 2
        ? ['r = min(N, d)', 'V contains the directions in feature space.']
        : b === 3
          ? ['rank ≤ min(N − 1, d)', 'Each covariance eigenvalue is σᵢ² / (N − 1).']
          : b === 4
            ? [
                'Variance kept = Σ kept σᵢ² / Σ all σᵢ²',
                'Three collinear points leave zero spread off the fitted line.',
              ]
            : b === 5
              ? [
                  'Forming X transpose times X squares the condition number for full column rank.',
                  'Direct SVD avoids forming the covariance product.',
                ]
              : [
                  'Training fold → fit mean, scales and basis',
                  'Development queries → choose length     •     Fresh queries → evaluate',
                ];
    text(c, lines[0], 84, 678, b === 5 ? 33 : 40, white);
    text(c, lines[1], 84, 750, 31, soft);
  }
}
export function angleState(t, unit = false, zero = false) {
  const origin = [2 * t, 2 * t],
    doc = [3 - origin[0], 1 - origin[1]],
    q = zero ? [0, 0] : [1 - origin[0], 3 - origin[1]];
  const d = unit ? unitFinite(doc) : doc,
    v = unit && !zero ? unitFinite(q) : q;
  return { origin, d, v, prod: dot(d, v), cos: zero ? null : dot(unitFinite(doc), unitFinite(q)) };
}
export function angleScene(c, k) {
  const b = k.beat.beatIndex;
  if (b === 4) {
    title(c, 'What must the next worker load?');
    plate(c, 92, 210, 862, 490);
    label(c, 'FITTED INDEX TRANSFORM', 136, 271, paperInk);
    [
      ['Encoder', 'Policy encoder revision'],
      ['Mean', '(2, 2)'],
      ['Ordered basis', '(1, 0)   (0, 1)'],
      ['Scoring', 'Unit length, then dot product'],
    ].forEach(([name, value], i) => {
      const y = 364 + i * 88;
      label(c, name, 136, y, paperInk);
      text(c, value, 402, y, 32, paperInk);
      if (i < 3) line(c, 135, y + 39, 912, y + 39, '#afa487', 1);
    });
    label(c, 'QUERY AT THE SAVED MEAN', 1020, 299);
    mono(c, '(2, 2) − (2, 2)', 1020, 402, 37);
    mono(c, '= (0, 0)', 1020, 486, 41, rose);
    text(c, 'Reject before normalization.', 1020, 603, 31, white);
    note(c, 'Evaluate any change to these settings on judged policy questions.', 95, 787);
    return;
  }
  const shift = smooth(cue(k, 1, 'Move the common origin', 1.5)),
    unit = !!cue(k, 2, 'shorten both arrows'),
    zero = !!cue(k, 3, 'Try a query at the mean');
  const a = angleState(shift, unit, zero);
  title(c, 'The origin sets the angle');
  gridPlot(c, 83, 185, 744, 589, 96);
  const w = ([x, y]) => [205 + x * 125, 679 - y * 125],
    o = w(a.origin);
  [a.d, a.v].forEach((v, i) => {
    const pt = w(v.map((n, j) => n + a.origin[j])),
      col = i ? gold : mint;
    if (Math.hypot(...v) > 0) arrow(c, ...o, ...pt, col, 6, 24);
    text(
      c,
      i ? 'Query' : 'Document',
      pt[0] + (i ? -18 : 19),
      pt[1] + (i ? -28 : 22),
      29,
      col,
      i ? 'right' : 'left',
    );
  });
  circle(c, ...o, 9, rose);
  mono(c, 'origin ' + pair(a.origin, 1), 104, 811, 29, rose);
  summary(
    c,
    [
      ['Document', pair(a.d), mint],
      ['Query', pair(a.v), gold],
      ['Dot product', fmt(a.prod)],
    ],
    923,
    191,
    128,
  );
  const shown = b === 0 ? !!cue(k, 0, "That's a cosine") : b >= 2;
  if (shown) {
    label(c, 'Cosine similarity', 922, 588);
    mono(c, zero ? 'undefined' : fmt(a.cos, 3), 921, 666, 74, zero ? rose : mint);
  }
  if (zero) note(c, 'The centered query has zero length.', 921, 775, soft, 29);
  else if (unit) note(c, 'Dot product uses the unrounded unit vectors.', 921, 775, soft, 26);
}

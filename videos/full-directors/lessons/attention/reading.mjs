import {
  ink,
  muted,
  blue,
  red,
  teal,
  gold,
  edge,
  names,
  colors,
  sentence,
  lerp,
  fmt,
  pct,
  vec,
  text,
  line,
  dot,
  ring,
  box,
  arrow,
  heading,
  mono,
  label,
  plane,
  rules,
  ribbon,
  sharePair,
  matrix,
  grid,
} from './art.mjs';
import {
  m,
  shifted,
  allowedShares,
  erasedShares,
  symmetricScores,
  symmetricShares,
  wrongAxis,
} from './fixtures.mjs';

export function opening(c, t) {
  const { at } = t;
  if (!at(2, 'Keep just two tokens')) {
    const xs = [88, 247, 339, 445, 642, 766, 934, 1025];
    const picked = at(1, 'sing softly'),
      answered = at(2, 'Birds');
    const guideX = xs[4] + 39;
    // The text on the woven band feeds under a fixed reading guide.
    const stops = ['Birds in', 'in the', 'the garden', 'garden sing', 'sing softly'];
    let travel = 0;
    for (let i = 1; i < stops.length; i++) travel += (xs[i] - xs[i - 1]) * at(1, stops[i], 0.36);
    const dx = xs[4] - xs[0] - travel;
    const y = 251;
    c.save();
    c.translate(dx, 0);
    box(c, -650, y + 9, 2600, 151, '#d9cdb6');
    box(c, -650, y, 2600, 147, '#ebe2c9');
    for (let k = -640; k < 1920; k += 7) line(c, k, y, k + 13, y + 147, '#9e896216', 0.8);
    for (const yy of [y + 9, y + 137]) {
      line(c, -650, yy, 1920, yy, '#7e715b', 1.2);
      line(c, -650, yy + (yy < 300 ? 5 : -5), 1920, yy + (yy < 300 ? 5 : -5), '#968266', 2, [7, 5]);
    }
    for (let j = 0; j < sentence.length; j++) {
      const x = xs[j],
        col = j === 4 && picked ? red : j === 0 && answered ? blue : ink;
      text(c, sentence[j], x, y + 72, 46, col, 'Serif');
      if (answered && j <= 4) {
        dot(c, x + 25, y + 167, 4, j === 0 ? blue : muted);
        mono(c, 4 - j, x + 25, y + 202, 27, j === 0 ? blue : muted, 'center');
      }
    }
    c.restore();
    box(c, guideX - 59, y - 16, 118, 180, null, gold, 4);
    for (const gx of [guideX - 59, guideX + 59]) {
      box(c, gx - 5, y - 21, 10, 12, gold);
      box(c, gx - 5, y + 158, 10, 12, gold);
    }
    if (at(1, 'Who sings') && !answered)
      text(c, 'Who sings?', guideX, y + 237, 37, ink, 'Serif', 'center');
    if (answered) label(c, 'Positions back from sing', xs[0], y + 264);
    return;
  }
  const unroll = at(2, 'Unroll a ribbon', 1.4);
  const unit = 414,
    x = 145;
  const cut = at(4, 'Cut at the chalk marks', 0.8),
    join = at(4, 'Slide the pieces', 1.15);
  heading(c, 'Birds sing.');
  label(c, 'First number carried by each word', x, 157);
  for (let r = 0; r < 2; r++) {
    const full = m.V[r][0] * unit,
      w = m.WEIGHTS[1][r],
      kept = full * w;
    const yy = lerp(r ? 401 : 232, 318, join),
      xx = x + (r ? unit * m.V[0][0] * m.WEIGHTS[1][0] * join : 0);
    // A roll uncovers the true value. The ruler and chalk marks have fixed positions.
    c.save();
    c.beginPath();
    c.rect(x - 3, 200, Math.max(15, full * unroll + 4), 320);
    if (!cut) c.clip();
    if (cut < 1) {
      c.save();
      c.globalAlpha = 1 - cut;
      ribbon(c, r, x, yy, full, 79, true);
      c.restore();
    }
    if (cut > 0) ribbon(c, r, xx, yy, kept, 79, true);
    c.restore();
    if (!cut && unroll < 1) {
      const e = x + Math.max(15, full * unroll);
      box(c, e - 15, yy - 3, 19, 85, colors[r]);
      line(c, e - 7, yy, e - 7, yy + 80, '#fff5c8', 3);
    }
    const chalk = at(3, r ? 'fifty eight percent' : 'forty two percent', 0.3);
    if (chalk && !join) {
      const markX = x + kept;
      line(c, markX, yy - 8, markX, yy + 84, '#f5e8cd', 3, [6, 3]);
      mono(c, pct(w) + ' of ' + m.V[r][0], markX, yy - 31, 26, colors[r], 'center');
    }
    const read = at(4, r ? 'The red reaches' : 'The blue piece reaches');
    if (read && !join) mono(c, fmt(kept / unit), xx + kept + 24, yy + 42, 39, colors[r]);
  }
  rules(c, x, 553, unit, 2);
  if (join === 1 && at(4, 'Their lengths add'))
    mono(c, fmt(m.OUTPUT[1][0]), x + unit * m.OUTPUT[1][0] + 24, 356, 48);
}

export function projections(c, t) {
  const { at, b } = t;
  if (b === 5) {
    heading(c, 'One reader, two keys');
    const p = plane(c, 155, 530, 320, 0, 1, 0, 1);
    for (const [v, col] of [
      [m.K[0], blue],
      [m.K[1], red],
      [m.Q[1], gold],
    ])
      arrow(c, ...p([0, 0]), ...p(v), col, 5);
    [
      [m.Q[1], gold, 'sing query'],
      [m.K[0], blue, 'Birds key'],
      [m.K[1], red, 'sing key'],
    ].forEach(([v, col, s], i) => {
      line(c, 625, 243 + i * 107, 683, 243 + i * 107, col, 5);
      label(c, s, 715, 231 + i * 107);
      mono(c, vec(v), 715, 267 + i * 107, 32, col);
    });
    return;
  }
  if (b === 4) {
    heading(c, 'Compare the scores in both directions');
    const projected = !!at(4, 'Back with Birds and sing');
    const labels = projected ? names : ['A', 'B'];
    label(c, projected ? 'Raw scores from Birds and sing states' : 'Raw scores from A and B states', 164, 167);
    const raw = projected
      ? [
          [1, 0],
          [0, 1],
        ]
      : symmetricScores;
    const offDiagonal = (i, j) => (i !== j ? '#f3dca7' : '#fffcf3');
    matrix(c, raw, 182, 267, 134, 84, { rows: labels, cols: labels, fill: offDiagonal });
    if (at(4, 'Normalize each row')) {
      label(
        c,
        projected ? 'Scores from learned queries and keys' : 'Row softmax of these raw scores',
        666,
        167,
      );
      const results = projected
        ? m.SCORES.map((row) => row.map((s) => fmt(s)))
        : symmetricShares.map((row) => row.map(pct));
      matrix(c, results, 708, 267, 134, 84, { rows: labels, cols: labels, fill: offDiagonal });
    }
    mono(
      c,
      projected ? 'Birds = [1, 0]      sing = [0, 1]' : 'A = [1, 0]      B = [1, 1]',
      145,
      535,
      31,
    );
    return;
  }
  heading(c, 'One state, three projections');
  text(c, 'sing', 85, 340, 76, red, 'Serif');
  if (b >= 2) mono(c, '[0, 1]', 88, 419, 32, red);
  const projections = [
    ['Query', 'what sing seeks', 'Wq', m.Q],
    ['Key', 'how sing matches', 'Wk', m.K],
    ['Value', 'what sing carries', 'Wv', m.V],
  ];
  projections.forEach(([kind, role, sym, mat], i) => {
    const y = 174 + i * 146;
    if (b === 1 && !at(1, ['A query', 'A key', 'a value'][i])) return;
    line(c, 258, 337, 370, y + 28, edge, 3);
    text(c, kind, 391, y, 37, ink, 'Serif');
    if (b === 1) {
      label(c, role, 391, y + 48);
      return;
    }
    mono(c, sym, 390, y + 49, 24, muted);
    matrix(c, mat, 554, y - 23, 77, 42, {
      size: 21,
      fill: (r) => (r === 1 ? '#f7ded3' : '#fffcf3'),
    });
    arrow(c, 740, y + 19, 824, y + 19, muted);
    mono(c, vec(mat[1]), 858, y + 18, 37, colors[1]);
  });
  if (b >= 2) label(c, 'Birds starts at [1, 0] and takes the first row.', 83, 590);
}

export function scoring(c, t) {
  const { b, at } = t;
  heading(c, b === 1 ? 'Turn the query. Measure the match.' :
    b === 2 ? 'Hold the query fixed and compare the keys.' : 'Hold the sing query still');
  const origin = [145, 498],
    unit = 278;
  const p = ([x, y]) => [origin[0] + unit * x, origin[1] - unit * y];
  line(c, 70, 498, 572, 498, edge);
  line(c, 145, 565, 145, 145, edge);
  if (b === 1) {
    const theta = 1.8 * at(1, 'as the query turns', 3);
    const q = [Math.cos(theta), Math.sin(theta)],
      key = [1, 0];
    arrow(c, ...origin, ...p(key), blue, 11);
    arrow(c, ...origin, ...p(q), gold, 6);
    const pp = p(q);
    line(c, ...pp, pp[0], origin[1], muted, 2, [6, 5]);
    label(c, 'Unit query · unit key', 672, 240);
    mono(c, fmt(m.dot(q, key)), 665, 342, 77, gold);
    label(c, 'Projection onto the key direction', 672, 435);
    return;
  }
  const keys = b === 2 ? [m.SHORT_KEY, m.LONG_KEY] : m.K;
  const titles = b === 2 ? ['Aligned, short', 'Farther away, long'] : names;
  keys.forEach((k, i) => {
    const shown = b > 2 || !i || at(2, 'A longer key');
    if (!shown) return;
    arrow(c, ...origin, ...p(k), colors[i], b === 2 && !i ? 12 : 5);
    const y = 198 + i * 159;
    text(c, titles[i], 645, y, 35, colors[i], 'Serif');
    const show = b === 2 || (i === 0 ? at(3, 'gives point six') : at(4, 'One point'));
    mono(c, vec(m.Q[1]) + ' · ' + vec(k), 645, y + 54, 26);
    mono(c, '= ' + (show ? fmt(m.dot(m.Q[1], k)) : '?'), 645, y + 101, 33, colors[i]);
  });
  arrow(c, ...origin, ...p(m.Q[1]), gold, 5);
  label(c, 'sing query ' + vec(m.Q[1]), 84, 579, 'left', gold);
}

export function softmaxScene(c, t) {
  const { at, b } = t,
    scaled = at(1, 'divide by the square root'),
    exp = at(2, 'Raise e'),
    share = at(2, 'then divide');
  const bump = at(3, 'Add one', 1.2);
  const scores = m.SCALED[1].map((v, j) => v + (j ? bump : 0)),
    weights = shifted(0, bump);
  heading(c, 'One budget for sing');
  const xs = [107, 365, 648, 933];
  ['Key', 'Dot product', bump ? 'Logit after edit' : '÷ √2', 'Exponential'].forEach((s, i) => {
    if (i < 2 || (i === 2 && scaled) || exp) label(c, s, xs[i], 169);
  });
  names.forEach((name, i) => {
    const y = 250 + 108 * i;
    text(c, name, xs[0], y, 50, colors[i], 'Serif');
    mono(c, fmt(m.SCORES[1][i]), xs[1], y, 34);
    if (scaled) mono(c, fmt(scores[i]), xs[2], y, 34, colors[i]);
    if (exp) mono(c, fmt(Math.exp(scores[i])), xs[3], y, 34);
  });
  if (bump) label(c, '+ ' + fmt(bump) + ' to sing after scaling', 620, 414);
  if (share)
    sharePair(
      c,
      weights,
      110,
      514,
      965,
      'Divide by the sum of exponentials  ' + fmt(scores.map(Math.exp).reduce((a, b) => a + b)),
    );
  else label(c, 'Key width = 2 coordinates', 112, 523);
}

export function mixture(c, t) {
  const { b, at, after } = t;
  if (b <= 4) {
    heading(c, 'Two coordinates in the read for sing');
    const weights = m.WEIGHTS[1];
    sharePair(c, weights, 110, 137, 980, 'One set of shares');
    if (!after(1, 'Now bring in the two values')) return;

    const x = 148,
      unit = 414,
      height = 40;
    const cuts = [at(2, 'Take forty two percent', 0.9), at(2, 'fifty eight percent', 0.9)];
    const join = at(2, 'Join the two cut pieces', 1.15);
    const totals = [
      after(3, 'One point four two', 'One point four two'),
      after(3, 'one point five eight'),
    ];
    const compareFirst = at(3, 'In the first coordinate') && !at(3, 'Now compare the other seam');
    const compareSecond = at(3, 'Now compare the other seam');
    const slide = Math.min(1, 2 * join);
    const lift = Math.max(0, 2 * join - 1);

    for (const k of [0, 1]) {
      const y = 273 + k * 153;
      const lengths = m.V.map((value) => value[k] * unit);
      const kept = lengths.map((length, i) => length * weights[i]);
      text(c, 'Coordinate ' + (k + 1), x, y - 24, 24);
      for (const i of [0, 1]) {
        const left = x + (i ? slide * kept[0] : 0);
        const top = y + (i ? (1 - lift) * 55 : 0);
        if (cuts[i] < 1) {
          c.save();
          c.globalAlpha = 1 - cuts[i];
          ribbon(c, i, left, top, lengths[i], height, true);
          c.restore();
        }
        if (!cuts[i])
          mono(c, m.V[i][k], left + lengths[i] + 14, top + height / 2, 28, colors[i]);
        if (cuts[i]) {
          ribbon(c, i, left, top, kept[i], height, true);
          if (!join) line(c, left + kept[i], top - 2, left + kept[i], top + height + 2, gold, 3);
        }
      }
      if (join === 1) {
        const focused = k === 0 ? compareFirst : compareSecond;
        const seam = x + kept[0];
        line(c, seam, y - 4, seam, y + height + 4, focused ? gold : ink, focused ? 4 : 2);
        mono(c, fmt(kept[0] / unit), x + kept[0] / 2, y + 65, 26, blue, 'center');
        mono(c, fmt(kept[1] / unit), seam + kept[1] / 2, y + 65, 26, red, 'center');
      }
      if (totals[k])
        mono(c, '≈ ' + fmt(m.OUTPUT[1][k]), x + kept[0] + kept[1] + 24, y + height / 2, 36);
    }
    rules(c, x, 551, unit, 2);
    return;
  }
  const dropout = at(5, 'Suppose Birds drops out');
  const rescaled = at(6, 'With that weight');
  heading(c, dropout ? 'One possible dropout draw' : 'Where the blend lands');
  const p = plane(c, 130, 535, 128, 0, 3, 0, 3);
  line(c, ...p(m.V[0]), ...p(m.V[1]), ink, 4);
  m.V.forEach((v, i) => dot(c, ...p(v), 10, colors[i]));
  if (!dropout) {
    dot(c, ...p(m.OUTPUT[1]), 10, gold);
    label(c, 'Attention dropout off', 665, 180);
    mono(c, vec(m.WEIGHTS[1], 2), 665, 259, 37);
    label(c, 'Weights used in the sum', 665, 306);
    mono(c, vec(m.OUTPUT[1], 2), 665, 421, 42, gold);
    label(c, 'Output coordinates', 665, 470);
    return;
  }
  const [oldX, oldY] = p(m.OUTPUT[1]);
  ring(c, oldX, oldY, 9, muted, 3);
  label(c, 'Before dropout', oldX + 23, oldY - 18);
  label(c, 'Birds dropped   ·   sing kept   ·   keep probability ½', 636, 153);
  label(c, 'Divide the surviving weight by its keep probability', 636, 221);
  const survivor = rescaled ? fmt(m.DROPPED_SHARE) : '?';
  mono(c, fmt(m.WEIGHTS[1][1]) + ' ÷ 0.5 ≈ ' + survivor, 636, 279, 39, red);
  label(c, 'Weights used in the sum', 636, 362);
  mono(c, '[0, ' + survivor + ']', 636, 416, 38);
  label(c, 'Output coordinates', 636, 494);
  mono(c, rescaled ? vec(m.DROPPED_OUTPUT, 2) : '[?, ?]', 636, 553, 42, gold);
  if (rescaled) dot(c, ...p(m.DROPPED_OUTPUT), 10, gold);
}

export function matrixScene(c, t) {
  const { b, at } = t;
  if (b === 1) {
    heading(c, 'Stack both token rows');
    for (const [i, [name, mat]] of [
      ['Q', m.Q],
      ['K', m.K],
      ['V', m.V],
    ].entries()) {
      const x = 132 + i * 379;
      mono(c, name, x + 85, 208, 57, ink, 'center');
      matrix(c, mat, x, 307, 96, 80, { rows: names, size: 29 });
    }
    return;
  }
  if (b === 4 || b === 5 || b >= 8) {
    const big = b >= 8;
    heading(c, big ? 'Follow the surviving axes' : 'Turn each key into a column');
    if (big) {
      label(c, 'One batch item and head', 85, 149);
      const appear = at(8, 'Take five queries');
      if (!appear) {
        mono(c, '[Nq × Nk]   ×   [Nk × dv]', 600, 321, 54, ink, 'center');
        return;
      }
      mono(c, 'Q  [5 × 64]     Kᵀ  [64 × 20]', 600, 231, 46, ink, 'center');
      mono(c, 'V  [20 × 128]', 600, 334, 50, red, 'center');
      const answer = at(9, 'the weights have');
      text(c, 'Weights', 197, 451, 27, muted);
      mono(c, answer ? '[5 × 20]' : '[? × ?]', 198, 521, 48, blue);
      text(c, 'Output', 713, 451, 27, muted);
      mono(c, at(9, 'Each of those five') ? '[5 × 128]' : '[? × ?]', 713, 521, 48, teal);
      return;
    }
    label(c, 'K', 187, 200);
    matrix(c, m.K, 186, 282, 109, 78, { rows: names, cols: ['x₁', 'x₂'] });
    arrow(c, 489, 350, 629, 350, gold, 5);
    label(c, 'Kᵀ', 729, 200);
    matrix(
      c,
      m.K[0].map((_, k) => m.K.map((r) => r[k])),
      729,
      282,
      109,
      78,
      { rows: ['x₁', 'x₂'], cols: names },
    );
    if (b === 5)
      mono(c, '[5 × 64]  ×  [20 × 64]   →   inner sizes differ', 600, 544, 32, red, 'center');
    return;
  }
  heading(c, 'Each reader spends its own row');
  mono(c, 'softmax across keys (Q Kᵀ / √dₖ) V', 600, 167, 39, ink, 'center');
  const shares = b >= 3 || at(2, 'Softmax each row');
  const data = shares
    ? m.WEIGHTS.map((r) => r.map(pct))
    : m.SCORES.map((r) => r.map((n) => fmt(at(2, 'Divide by root') ? n / m.ROOT : n)));
  const sums = b >= 6;
  label(c, shares ? 'Weight by key' : 'Score by key', 200, 241);
  matrix(c, data, 200, 314, 130, 77, {
    cols: names,
    rows: names,
    fill: (i, j) => (j ? '#f5d7cd' : '#d6e1ed'),
  });
  if (sums) {
    [0, 1].forEach((i) => mono(c, '= 1', 495, 353 + i * 77, 31, teal));
    if (at(6, 'over the queries instead')) {
      const wrong = wrongAxis;
      label(c, 'If normalized down columns', 720, 241);
      matrix(
        c,
        wrong.map((row) => row.map(pct)),
        720,
        314,
        122,
        77,
        { cols: names },
      );
      wrong.forEach((row, i) => mono(c, '= ' + fmt(row[0] + row[1]), 990, 353 + i * 77, 24, muted));
      label(c, 'Wrong weights despite unit row sums.', 707, 560);
    }
    if (at(7, "Here they're")) {
      m.COLUMN_SUMS.forEach((s, j) => mono(c, fmt(s), 265 + 130 * j, 513, 28, gold, 'center'));
      label(c, 'Column totals', 208, 568);
    }
  } else if (at(2, 'Multiply by V')) {
    arrow(c, 507, 390, 645, 390, gold, 4);
    label(c, 'Output by coordinate', 752, 241);
    matrix(
      c,
      m.OUTPUT.map((r) => r.map((n) => fmt(n))),
      758,
      314,
      134,
      77,
      { cols: ['1', '2'], size: 28 },
    );
  }
}

export function maskScene(c, t) {
  const { b, at } = t;
  if (b === 1 || b === 3) {
    const blocked = b === 3;
    heading(c, blocked ? 'The causal read' : 'Training with the next word visible');
    const x = 283,
      y = 164,
      s = 50;
    for (let i = 0; i < 8; i++) {
      label(c, sentence[i], x - 15, y + (i + 0.5) * s, 'right');
      text(c, i, x + (i + 0.5) * s, y - 20, 21, muted, 'Mono', 'center');
    }
    grid(c, 8, 8, x, y, s, (i, j) =>
      blocked && j > i ? '#ddd9ce' : j > i ? '#e6a99a' : '#84b7aa',
    );
    label(c, 'Key position', x + 175, 116);
    text(c, blocked ? 'Allowed' : 'Future visible', 767, 291, 37, blocked ? teal : red, 'Serif');
    mono(c, blocked ? 'key ≤ query' : 'key > query', 767, 370, 30);
    text(
      c,
      blocked ? 'Birds reads only Birds.' : 'Future keys leak the target.',
      767,
      458,
      25,
      ink,
      'Sans',
      'left',
      365,
    );
    return;
  }
  if (b === 2) {
    heading(c, 'Block key three before softmax');
    const masked = at(2, 'Block the third'),
      post = at(2, 'Softmax first');
    const data = [[2, 1, 5]];
    const rows = ['Original logits'];
    if (masked) {
      data.push([2, 1, '−∞']);
      rows.push('Masked logits');
    }
    if (at(2, 'The first two')) {
      data.push(allowedShares.map((n) => fmt(n)));
      rows.push('Mask first');
    }
    if (post) {
      data.push(erasedShares.map((n) => fmt(n, 4)));
      rows.push('Erase later');
    }
    matrix(c, data, 292, 210, 183, 80, { rows, cols: ['Key 1', 'Key 2', 'Key 3'] });
    if (data.length > 2) mono(c, 'Σ = 1', 900, 410, 32, teal);
    if (post)
      mono(
        c,
        'Σ ≈ ' +
          fmt(
            erasedShares.reduce((a, b) => a + b),
            4,
          ),
        900,
        490,
        32,
        red,
      );
    return;
  }
  heading(c, 'A query in the left padding');
  if (b <= 5) {
    const rows = ['PAD', 'Birds', 'sing'],
      x = 264,
      y = 225,
      s = 106;
    const causal = !!at(5, 'the triangle');
    matrix(
      c,
      rows.map((_, i) => rows.map((_, j) => (j === 0 || (causal && j > i) ? '×' : 'T'))),
      x,
      y,
      s,
      s,
      {
        rows,
        cols: rows,
        fill: (i, j) => (j === 0 || (causal && j > i) ? '#e1ddd4' : '#a7cfc0'),
      },
    );
    text(c, causal ? 'Padding + causal' : 'Padding mask', 704, 242, 39, ink, 'Serif');
    label(c, causal ? 'The first row has no legal key.' : 'Every row skips the PAD key.', 704, 326);
    return;
  }
  const finite = !!at(7, 'Fill all three'),
    explicit = !!at(7, 'Skip the padded');
  label(c, 'Padded query', 160, 169);
  matrix(
    c,
    [Array(3).fill(finite ? '−10,000' : '−∞'), Array(3).fill(finite ? '1/3' : 'NaN')],
    272,
    250,
    184,
    90,
    { rows: ['Filled logits', 'Softmax'], cols: ['Key 1', 'Key 2', 'Key 3'] },
  );
  label(
    c,
    finite ? 'Equal finite scores get equal shares.' : 'Textbook softmax has no distribution here.',
    272,
    477,
  );
  if (explicit) text(c, 'Skip this query, or set its output to zero.', 272, 555, 29, teal, 'Serif');
}

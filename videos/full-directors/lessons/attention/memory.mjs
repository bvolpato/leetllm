import {
  ink,
  muted,
  blue,
  red,
  teal,
  gold,
  edge,
  fmt,
  pct,
  text,
  line,
  dot,
  box,
  arrow,
  heading,
  mono,
  label,
  segment,
  matrix,
  grid,
} from './art.mjs';
import { m, scoresBytes, cacheMask, stepsForTiles, erasedShares } from './fixtures.mjs';

export function cost(c, t) {
  const { b, at } = t;
  if (b === 1) {
    heading(c, 'Every query meets every key');
    const large = !!at(1, 'Double to eight');
    for (const [i, n] of (large ? [4, 8] : [4]).entries()) {
      const s = 39,
        x = i ? 674 : 173,
        y = 179;
      grid(c, n, n, x, y, s, (r, j) => (r < 4 && j < 4 ? blue : '#82a2ba'));
      mono(c, n + ' × ' + n + ' = ' + n * n, x, y + n * s + 52, 35, i ? ink : blue);
    }
    if (large) arrow(c, 420, 329, 572, 329, gold, 5);
    return;
  }
  const quiz = b === 4,
    B = quiz ? 4 : 8,
    H = quiz ? 16 : 32,
    N = quiz ? 4096 : 8192;
  heading(c, 'How many bytes for the score grids?');
  const xs = [86, 288, 492, 735, 967],
    labels = ['Batch', 'Heads', 'Queries', 'Keys', 'Bytes / score'],
    values = [B, H, N, N, 2];
  labels.forEach((s, i) => {
    label(c, s, xs[i], 191);
    mono(c, values[i], xs[i], 275, 52, i === 2 || i === 3 ? blue : ink);
    if (i < 4) mono(c, '×', xs[i + 1] - 69, 275, 35, muted);
  });
  line(c, 86, 351, 1111, 351);
  const visible = quiz ? at(4, 'The tensor alone') : at(2, "That's about");
  if (visible) {
    const bytes = scoresBytes(B, H, N);
    mono(c, bytes.toLocaleString('en-US') + ' bytes', 90, 419, 43);
    mono(c, quiz ? bytes / 2 ** 30 + ' GiB' : fmt(bytes / 1e9, 2) + ' GB', 88, 522, 59, teal);
  } else text(c, 'One FP16 score for every pair in every head.', 90, 456, 34, ink, 'Serif');
  if (b === 3) label(c, 'Temporary storage in training or prompt processing', 450, 521);
}
function cachedRows(c, t) {
  const { b, at } = t;
  const corrected = !!at(3, 'It should read'),
    padded = !!at(3, 'Now mark key one');
  const wrong = b === 2 && !!at(2, 'Build a triangle');
  const queries = padded ? [3, 4] : [4],
    keys = [0, 1, 2, 3, 4];
  const mask = cacheMask(wrong ? [0] : queries, keys, padded ? [1] : []);
  heading(
    c,
    wrong
      ? 'The local row index loses history'
      : padded
        ? 'Two query positions share the cached keys'
        : 'One row at absolute position four',
  );
  label(c, 'T = allowed    F = blocked', 284, 164);
  matrix(
    c,
    mask.map((r) => r.map((a) => (a ? 'T' : 'F'))),
    284,
    256,
    144,
    104,
    {
      rows: queries.map((q) => 'Query ' + q),
      cols: keys.map((k) => 'k' + k + (padded && k === 1 ? ' · PAD' : '')),
      fill: (i, j) => (mask[i][j] ? '#a9cfc2' : '#e3dfd5'),
      color: (i, j) => (mask[i][j] ? teal : muted),
    },
  );
  const y = padded ? 537 : 454;
  mono(
    c,
    wrong
      ? 'key position ≤ local row 0'
      : corrected
        ? 'key position ≤ absolute query position'
        : 'Q₄ × Kᵀ',
    284,
    y,
    32,
    wrong ? red : teal,
  );
  if (padded) label(c, 'Exclude padding keys from both rows.', 284, 592);
  if (b === 1) label(c, 'Mix the corresponding cached values after softmax.', 284, 528);
}
export function decode(c, t) {
  const { b, at } = t;
  if (b <= 3) {
    cachedRows(c, t);
    return;
  }
  if (b === 4) {
    heading(c, 'A new query reads the cache again');
    for (let i = 0; i < 5; i++) {
      const x = 102 + i * 108;
      box(c, x, 212, 92, 90, '#cedeef');
      mono(c, 'K' + i, x + 46, 257, 29, blue, 'center');
      box(c, x, 318, 92, 90, '#f2d4c5');
      mono(c, 'V' + i, x + 46, 363, 29, red, 'center');
    }
    label(c, 'GPU main memory', 104, 155);
    box(c, 846, 221, 252, 187, '#d5e6da', teal);
    text(c, 'Query', 972, 280, 41, teal, 'Serif', 'center');
    label(c, 'on chip', 972, 352, 'center');
    arrow(c, 666, 314, 815, 314, teal, 5);
    const step = Math.min(4, Math.floor(t.progress * 5));
    box(c, 102 + step * 108, 211, 92, 198, null, gold, 4);
    label(c, 'Capacity to store K and V', 105, 495);
    label(c, 'Bandwidth to read them', 748, 495);
    return;
  }
  const configs = [64, 8, 1];
  if (b === 5 || b >= 8) {
    heading(c, 'Who owns the saved keys and values?');
    label(c, 'Four query heads in each example', 107, 114);
    const x = [107, 472, 842],
      counts = [4, 2, 1],
      words = ['Multi-head', 'Grouped-query', 'Multi-query'];
    counts.forEach((n, h) => {
      const xx = x[h];
      text(c, words[h], xx + 115, 173, 32, ink, 'Serif', 'center');
      for (let q = 0; q < 4; q++) {
        const px = xx + q * 71,
          owner = Math.floor((q * n) / 4),
          X = xx + ((owner + 0.5) * 284) / n - 36;
        dot(c, px, 285, 13, blue);
        line(c, px, 307, X, 398, muted, 2);
        mono(c, 'q' + q, px, 244, 20, blue, 'center');
      }
      for (let k = 0; k < n; k++) {
        const X = xx + ((k + 0.5) * 284) / n - 36;
        box(c, X - 22, 401, 44, 53, teal);
        mono(c, 'KV', X, 427, 17, '#fff', 'center');
      }
      label(c, n + ' KV ' + (n === 1 ? 'head' : 'heads'), xx + 109, 516, 'center');
    });
    if (b >= 8)
      label(
        c,
        b === 8
          ? 'Each query head still scores the full set of keys.'
          : 'Train or uptrain for this layout and measure task quality.',
        93,
        589,
      );
    return;
  }
  heading(c, 'Cache size by number of KV heads');
  label(
    c,
    '80 layers  ·  64 query heads  ·  16 requests  ·  8,192 positions  ·  head width 128  ·  2 bytes per number',
    65,
    136,
  );
  configs.forEach((kv, i) => {
    const val = m.cacheBytes(kv) / 1e9,
      y = 238 + i * 115;
    mono(c, kv + (kv === 1 ? ' KV head' : ' KV heads'), 75, y, 25);
    box(c, 314, y - 22, val * 1.85, 44, i === 0 ? blue : i === 1 ? teal : gold);
    const show = b >= 7 && !!at(7, ['With sixty four', 'With eight', 'With one'][i]);
    if (show) mono(c, fmt(val, 1) + ' GB', 332 + val * 1.85, y, 28);
  });
  label(c, 'Keys and values both occupy cache space.', 76, 580);
}

export function stability(c, t) {
  const { at, b } = t;
  if (b >= 4) {
    heading(c, 'Did the score survive the multiply?');
    label(c, 'Input coordinates', 93, 180);
    mono(c, '300 × 300', 90, 250, 60);
    label(c, 'Largest finite FP16 number', 694, 180);
    mono(c, m.FP16_MAX.toLocaleString('en-US'), 690, 250, 60, red);
    if (b === 5) {
      line(c, 91, 337, 1108, 337);
      mono(c, 'FP16 score', 93, 411, 33);
      mono(c, '∞', 421, 411, 47, red);
      if (at(5, 'Casting infinity')) {
        arrow(c, 489, 411, 615, 411, muted);
        mono(c, 'cast to FP32   ∞', 652, 411, 31, red);
      }
      if (at(5, 'Recompute')) {
        mono(c, 'FP32 product', 92, 524, 33);
        mono(c, '90,000', 422, 524, 43, teal);
      }
    }
    return;
  }
  heading(c, b === 1 ? 'What does exp(1000) return?' : 'Move the origin to the largest logit');
  const scores = [1000, 1001, 999],
    shift = !!at(2, 'subtract the largest'),
    stable = !!at(3, 'The same factor');
  const shifted = scores.map((s) => s - Math.max(...scores));
  const rows = ['Score'],
    data = [scores];
  if (shift) {
    rows.push('Shifted');
    data.push(shifted);
  }
  if (shift || at(1, 'It becomes infinity')) {
    rows.push('Exp');
    data.push(shift ? shifted.map((n) => fmt(Math.exp(n))) : scores.map(() => '∞'));
  }
  if (stable) {
    rows.push('Share');
    data.push(m.STABLE_SHARES.map(pct));
  }
  matrix(c, data, 292, 182, 202, 84, {
    rows,
    cols: ['Key 1', 'Key 2', 'Key 3'],
    fill: (i, j) => (j === 1 ? '#f0e1bc' : '#fffbf1'),
  });
  if (b === 1 && data.length > 1) mono(c, '∞ / ∞   →   NaN', 575, 478, 46, red, 'center');
  if (b === 3)
    label(c, 'For finite logits, the maximum contributes exactly one to the mass.', 291, 566);
}

function memoryChip(c, t) {
  const { b, at } = t;
  heading(c, b < 3 ? 'Where the temporary scores travel' : 'Keep a query tile on chip');
  box(c, 79, 178, 440, 350, '#e8e0cf', muted, 2);
  box(c, 717, 178, 394, 350, '#d5e4dc', teal, 2);
  text(c, 'HBM', 113, 222, 39, ink, 'Serif');
  text(c, 'On chip', 747, 222, 39, teal, 'Serif');
  if (b <= 2) {
    const probs = !!at(2, 'writes the result');
    grid(c, 8, 8, 121, 278, 23, () => (probs ? '#74a995' : '#82a1be'));
    label(c, probs ? 'Shares' : 'Scores', 327, 356);
    if (b === 2) {
      arrow(c, 543, 302, 693, 302, blue, 4);
      arrow(c, 693, 396, 543, 396, red, 4);
    }
    text(
      c,
      probs ? 'mix with V' : 'score and normalize',
      907,
      370,
      31,
      ink,
      'Serif',
      'center',
      352,
    );
  } else {
    for (let i = 0; i < 3; i++) {
      box(c, 118, 284 + i * 64, 262, 49, i % 2 ? '#eacabe' : '#c7dae6');
      mono(c, 'K, V  ·  tile ' + (i + 1), 134, 308 + i * 64, 21);
    }
    arrow(c, 539, 351, 692, 351, teal, 5);
    grid(c, 3, 4, 769, 279, 31, () => blue);
    label(c, 'Q tile', 920, 323);
    label(
      c,
      b === 3
        ? 'Temporary score tile'
        : b === 4
          ? 'm  maximum     ℓ  mass'
          : 'm  maximum     ℓ  mass',
      752,
      416,
    );
    if (b >= 5) label(c, 'u  weighted value sum', 752, 466);
  }
}
export function tileState(t) {
  const { b, at, after = at } = t,
    transfer = b >= 15;
  const high = transfer ? 1002 : 1001,
    tr = stepsForTiles(high);
  const first = !transfer && !at(8, 'multiply both old sums');
  const rescaled = transfer ? !!at(16, 'It becomes') : !first;
  const highIn = transfer ? !!after(16, 'The new high adds one') : !!at(9, 'It adds one');
  const lowIn = transfer ? !!after(16, 'adds e to the minus three') : !!at(9, 'It adds about point one four');
  const available = b >= 7;
  const included = [true, highIn, lowIn];
  const mass = tr.mass.map((n, i) => (i === 0 && !rescaled ? 1 : included[i] ? n : 0));
  const parts = mass.map((n, i) => n * tr.values[i]);
  const sum = mass.reduce((a, b) => a + b),
    weighted = parts.reduce((a, b) => a + b);
  return { tr, available, rescaled, highIn, lowIn, included, mass, parts, sum, weighted, transfer };
}
function tileBench(c, t) {
  const s = tileState(t),
    { b, at, after } = t;
  heading(c, 'Carry one query across two tiles');
  const firstComputed = b !== 6 || !!at(6, 'So the running sum');
  const peak = s.rescaled ? s.tr.high : 1000;
  label(c, 'Same query     •     Running maximum ' + peak, 79, 136);
  const massKnown = s.transfer
    ? after(16, 'e to the minus two')
    : after(8, 'point three seven');
  const weightedKnown = s.transfer ? massKnown : after(8, 'point seven four');
  if (s.rescaled && (!s.transfer || massKnown))
    mono(c, 'Old totals × exp(1000 − ' + peak + ')', 683, 136, 23, gold);
  const cols = ['Tile', 'Score', 'Value', 'Score − max', 'Mass at ' + peak, 'Mass × value'];
  const rows = s.tr.scores.map((n, i) => [
    i === 0 ? '1' : '2',
    n,
    s.tr.values[i],
    i === 0 || s.rescaled ? n - peak : '·',
    s.included[i] && firstComputed && (i > 0 || !s.rescaled || massKnown) ? fmt(s.mass[i], 3) : '·',
    s.included[i] && firstComputed && (i > 0 || !s.rescaled || weightedKnown) ? fmt(s.parts[i], 3) : '·',
  ]);
  matrix(c, s.available ? rows : [rows[0]], 74, 220, 174, 61, {
    cols,
    size: 27,
    fill: (i) => (i === 0 ? '#dbe7ee' : s.included[i] ? '#d6e8d9' : '#f3ede0'),
  });
  if (!firstComputed) return;

  const oldOnly = s.rescaled && !s.highIn;
  const totalMass = s.transfer && s.lowIn && !after(16, 'one point one nine')
    ? '?'
    : fmt(s.sum, 3);
  if (oldOnly) {
    mono(c, 'Old mass     1 → ' + (massKnown ? totalMass : '?'), 91, 473, 28, teal);
    mono(c, 'Old value sum     2 → ' + (weightedKnown ? fmt(s.weighted, 3) : '?'),
      566, 473, 28, blue);
  } else {
    mono(c, 'Mass   ' + totalMass, 91, 473, 30, teal);
    mono(c, 'Weighted sum   ' + fmt(s.weighted, 3), 545, 473, 30, blue);
  }

  if (b === 7 || b === 15)
    text(c, 'What rescales the old totals when the maximum rises?', 91, 532, 29, ink, 'Serif');
  if (b === 10) text(c, 'Divide by mass or by count?', 91, 532, 29, ink, 'Serif');
  if (b === 11 && after(11, 'Divide the weighted sum by the mass')) {
    const answer = after(11, 'one point five one') ? fmt(s.weighted / s.sum) : '?';
    mono(c, fmt(s.weighted, 3) + ' / ' + fmt(s.sum, 3) + ' ≈ ' + answer,
      91, 532, 33, gold);
  }
}
export function flash(c, t) {
  const { b } = t;
  if (b <= 5) {
    memoryChip(c, t);
    return;
  }
  if (b <= 11 || b >= 15) {
    tileBench(c, t);
    return;
  }
  if (b === 14) {
    heading(c, 'Which memory keeps growing?');
    label(c, 'During training', 103, 175);
    grid(c, 8, 8, 106, 234, 27, () => '#849eb7');
    text(c, 'Temporary scores', 371, 296, 32, ink, 'Serif');
    label(c, 'Tile with FlashAttention.', 370, 359);
    label(c, 'During cached decoding', 670, 175);
    for (let i = 0; i < 6; i++) {
      box(c, 675 + i * 60, 241, 54, 57, '#9bb9d3');
      box(c, 675 + i * 60, 305, 54, 57, '#d3a094');
    }
    text(c, 'Persistent keys and values', 669, 428, 32, ink, 'Serif');
    label(c, 'Share KV heads with GQA or MQA.', 670, 484);
    return;
  }
  heading(c, 'Discard scores after each tile');
  grid(c, 8, 8, 127, 200, 32, (i, j) => (i < 4 && j >= 4 ? '#7b9ab3' : '#e1ddd1'));
  arrow(c, 443, 324, 611, 324, teal, 5);
  for (let i = 0; i < 8; i++) box(c, 678, 191 + i * 38, 290, 31, '#cadfd4');
  label(c, 'Transient scores', 127, 513);
  label(c, 'Saved statistics per row', 676, 513);
  text(
    c,
    b === 12 ? 'Recompute tiles during backward.' : 'Measure forward and backward on your GPU.',
    126,
    589,
    30,
    ink,
    'Serif',
  );
}
export function diagnosis(c, t) {
  const { b, at } = t;
  if (b === 1) {
    heading(c, 'Inspect the inner dimensions');
    mono(c, 'Q  [5 × 64]', 112, 219, 46, blue);
    mono(c, 'K  [20 × 64]', 648, 219, 46, red);
    line(c, 111, 306, 1052, 306);
    mono(c, 'Q K    64 ≠ 20', 109, 389, 47, red);
    if (at(1, 'missing transpose')) mono(c, 'Q Kᵀ   64 = 64    →    [5 × 20]', 109, 511, 43, teal);
  } else if (b === 2) {
    heading(c, 'Read a row with dropout off');
    const saturation = !!at(2, 'Shares that pile');
    if (!saturation) {
      matrix(c, [erasedShares.map((n) => fmt(n, 4))], 218, 239, 223, 93, {
        rows: ['Query'],
        cols: ['Key 1', 'Key 2', 'Blocked'],
      });
      mono(
        c,
        'Row sum ≈ ' +
          fmt(
            erasedShares.reduce((a, b) => a + b),
            4,
          ),
        218,
        410,
        45,
        red,
      );
      label(c, 'Inspect the softmax axis and the mask placement.', 218, 512);
    } else {
      const w = m.softmax([20, 0, 0]);
      segment(c, 152, 272, 900, 90, w, [blue, red, teal]);
      mono(c, 'Logits   [20, 0, 0]', 153, 196, 34);
      label(c, 'Look for increasing score gaps as head width grows.', 152, 447);
    }
  } else if (b === 3) {
    heading(c, 'Where did the first invalid number appear?');
    const labels = ['Inputs', 'Dot products', 'Allowed keys', 'Softmax'];
    labels.forEach((s, i) => {
      const x = 96 + 283 * i;
      const words = ['inputs finite', 'scores overflow', 'each row', 'Only then'];
      const seen = !!at(3, words[i]);
      dot(c, x + 70, 327, seen ? 14 : 8, seen ? gold : edge);
      text(c, s, x + 70, 256, 30, seen ? ink : muted, 'Serif', 'center');
      if (i < 3) line(c, x + 97, 327, x + 326, 327, edge);
    });
    return;
  } else {
    const costs = !!at(4, 'For long contexts'),
      pad = !!at(4, 'A decoder reading');
    heading(c, costs ? 'Separate the costs' : 'Find the mask error');
    if (costs) {
      const items = [
        ['Temporary', 'B h N² × bytes'],
        ['Persistent', '2 L B Hkv N d × bytes'],
        ['Core products', 'B h N² d products per QK multiply'],
      ];
      items.forEach(([s, f], i) => {
        text(c, s, 100, 222 + i * 127, 38, ink, 'Serif');
        mono(c, f, 475, 222 + i * 127, 39, i === 1 ? teal : blue, 'left', 652);
      });
    } else {
      const row = pad ? ['T', 'T', 'T', 'T', 'T'] : ['T', 'F', 'F', 'F', 'F'];
      matrix(c, [row], 247, 262, 151, 92, {
        rows: ['Query 4'],
        cols: pad ? ['0', '1 · PAD', '2', '3', '4'] : ['0', '1', '2', '3', '4'],
        fill: (_, j) => (j === 1 && pad ? '#e8c1ae' : '#fffbf1'),
      });
      label(
        c,
        pad ? 'Padding key 1 is still open.' : 'Only the first key is visible to query four.',
        247,
        440,
      );
    }
  }
}

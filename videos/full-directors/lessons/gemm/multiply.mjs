import {
  ink,
  dim,
  rule,
  white,
  blue,
  rose,
  teal,
  softBlue,
  softRose,
  softTeal,
  text,
  line,
  rect,
  circle,
  plate,
  mark,
  matrix,
  note,
  fade,
  cue,
  smooth,
} from './plates.mjs';
import {
  A,
  B,
  openingProducts,
  selectedB,
  sums,
  last,
  reads,
  regroup,
  accumulatorState,
} from './examples.mjs';

function route(c, points, color, amount, width = 6) {
  const lengths = points
    .slice(1)
    .map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  let left = amount * lengths.reduce((s, n) => s + n, 0);
  for (let i = 0; i < lengths.length && left > 0; i++) {
    const [x, y] = points[i],
      [xx, yy] = points[i + 1],
      t = Math.min(1, left / lengths[i]);
    line(c, x, y, x + (xx - x) * t, y + (yy - y) * t, color, width);
    left -= lengths[i];
  }
}
export function opening(c, t) {
  const picked = cue(t, 0, 'Take the one', 0.65),
    toTop = cue(t, 1, 'top row brings a two', 0.8),
    top = cue(t, 1, 'adds two', 0.35),
    lower = cue(t, 1, 'bottom row brings a five', 0.45);
  const reuse = cue(t, 2, 'Keep the one', 0.7),
    five = cue(t, 2, 'adds five', 0.35);
  text(c, 'B  /  source', 100, 312, 38, rose);
  matrix(c, B, 105, 386, 294, 336, {
    fill: softRose,
    tint: rose,
    select: (i, j) => picked > 0 && i === selectedB.k && j === selectedB.col,
  });
  text(c, 'Shared copy', 548, 312, 38, rose);
  route(
    c,
    [
      [400, 554],
      [534, 554],
    ],
    rose,
    picked,
  );
  circle(c, 626, 554, 82, softRose);
  if (picked > 0) mark(c, selectedB.value, 324 + 302 * picked, 554, 37 + 45 * picked, rose);
  text(c, 'B[1,1]', 626, 676, 33, rose, 'center', 'Mono');
  text(c, 'Output C', 1080, 289, 38, blue);
  [0, 1].forEach((i) => {
    const y = 450 + 250 * i,
      progress = i ? reuse : toTop;
    route(
      c,
      [
        [708, 554],
        [805, 554],
        [965, y - 104],
        [1500, y - 104],
        [1500, y - 78],
      ],
      rose,
      progress,
    );
    plate(c, 1080, y - 78, 221, 151, '#e1dfd3');
    text(c, 'C[' + i + ',0]', 1104, y - 30, 31, dim, 'left', 'Mono');
    text(c, '·', 1190, y + 22, 54, dim, 'center', 'Serif');
    plate(c, 1313, y - 78, 481, 151, progress === 1 ? blue : softBlue, progress === 1);
    text(c, 'C[' + i + ',1]', 1342, y - 29, 32, progress === 1 ? white : blue, 'left', 'Mono');
    const a = A[i][selectedB.k];
    const ready = i ? lower : cue(t, 1, 'top row brings a two');
    text(
      c,
      ready ? a + ' × ' + selectedB.value : 'waiting',
      1342,
      y + 30,
      42,
      progress === 1 ? white : ink,
      'left',
      'Serif',
    );
    const credited = i ? five : top;
    if (credited > 0)
      fade(c, credited, () =>
        text(c, '+' + openingProducts[i], 1670, y, 72, white, 'center', 'Serif'),
      );
    if (i && !five && lower)
      text(c, '?', 1684, y, 69, progress === 1 ? white : blue, 'center', 'Serif');
  });
  note(
    c,
    reuse === 1
      ? 'One global load serves two output rows.'
      : lower
        ? 'Does the second row need a second global load?'
        : 'Follow the one from B into the output column.',
  );
}

export function dot(c, t) {
  const chosen = cue(t, 1, 'Read the top row', 0.5);
  const k0 = cue(t, 1, 'starts the sum at one'),
    k1 = cue(t, 1, 'leaves it there'),
    k2 = cue(t, 2, 'adds six');
  const top = cue(t, 2, 'makes seven'),
    full = cue(t, 2, 'Complete the other three', 0.45),
    count = cue(t, 3, 'twenty-four floating-point operations');
  for (const [name, arr, x, y, w, h, color, select] of [
    ['A   2 × 3', A, 103, 389, 420, 232, blue, (i) => chosen && i === 0],
    ['B   3 × 2', B, 678, 342, 270, 314, rose, (_, j) => chosen && j === 0],
    [
      'C   2 × 2',
      sums(3).map((row, i) => row.map((v, j) => (full || (top && i === 0 && j === 0) ? v : '·'))),
      1173,
      389,
      399,
      232,
      teal,
      (i, j) => top && i === 0 && j === 0,
    ],
  ]) {
    text(c, name, x, 291, 36, color);
    matrix(c, arr, x, y, w, h, { tint: color, select, size: 60 });
  }
  text(c, '×', 598, 505, 72, dim, 'center', 'Serif');
  text(c, '=', 1061, 505, 72, dim, 'center', 'Serif');
  if (chosen) {
    const parts = [k0, k1, k2];
    for (let k = 0; k < 3; k++) {
      const x = 107 + k * 300;
      text(c, A[0][k] + ' × ' + B[k][0], x, 742, 54, parts[k] ? ink : dim, 'left', 'Serif');
      if (k < 2) text(c, '+', x + 198, 742, 46, dim);
    }
    if (k0)
      text(c, 'sum   ' + sums(k2 ? 3 : k1 ? 2 : 1)[0][0], 1158, 742, 55, teal, 'left', 'Serif');
  }
  note(
    c,
    count
      ? '2MNK = 2 × 2 × 2 × 3 = 24 FLOPs'
      : chosen
        ? 'Match one pair at each k.'
        : 'Every row of A meets every column of B.',
  );
}

export function scalar(c, t) {
  const first = cue(t, 0, 'Watch the input requests', 0.8),
    second = cue(t, 1, 'Move one cell', 0.7);
  const bottom = cue(t, 1, 'run both bottom threads', 1.05);
  const n = bottom ? 2 + Math.ceil(2 * bottom) : second ? 2 : first ? 1 : 0,
    model = reads(n);
  function markedWords(data, counts, x, y, w, h, color, name) {
    text(c, name, x, y - 60, 36, color);
    data.forEach((row, i) =>
      row.forEach((v, j) => {
        const xx = x + j * w,
          yy = y + i * h;
        rect(c, xx, yy, w - 5, h - 5, white);
        text(c, v, xx + w * 0.5, yy + h * 0.37, 52, ink, 'center', 'Serif');
        for (let k = 0; k < counts[i][j]; k++)
          circle(c, xx + w * 0.5 - 9 + 18 * k, yy + h * 0.78, 7, color);
      }),
    );
  }
  markedWords(A, model.a, 98, 389, 143, 133, blue, 'A  /  input requests');
  markedWords(B, model.b, 633, 340, 135, 124, rose, 'B  /  input requests');
  text(c, 'Output owners', 1130, 285, 36, teal);
  matrix(
    c,
    sums(3).map((r, i) => r.map((v, j) => (2 * i + j < n ? v : '·'))),
    1130,
    340,
    465,
    358,
    { tint: teal, select: (i, j) => 2 * i + j < n, size: 68, fill: softTeal },
  );
  text(c, 'Scalar loads', 1119, 766, 34, dim);
  text(c, model.total, 1508, 760, 68, blue, 'right', 'Serif');
  note(
    c,
    cue(t, 2, 'A cache can satisfy')
      ? 'Logical load requests can merge or hit in cache.'
      : 'Each dot records one thread asking for that word.',
  );
}

export function tile(c, t) {
  const loaded = cue(t, 0, 'Follow each pair', 1.1),
    fold = cue(t, 1, 'Each row meets each column', 0.75);
  const total = cue(t, 2, 'Twelve loads', 0.5);
  text(c, 'Global inputs', 100, 305, 40, ink);
  const inside = (k) => loaded > 0 && (k < 2 || total > 0);
  matrix(c, A, 100, 365, 370, 172, {
    fill: softBlue,
    tint: blue,
    select: (_, j) => inside(j),
    size: 46,
  });
  matrix(c, B, 100, 579, 245, 222, {
    fill: softRose,
    tint: rose,
    select: (i) => inside(i),
    size: 46,
  });
  text(c, 'A', 487, 447, 34, blue);
  text(c, 'B', 369, 687, 34, rose);
  text(c, 'Shared panel', 656, 305, 40, ink);
  const k = total > 0 ? 2 : 0,
    ks = total > 0 ? [2] : [0, 1];
  plate(c, 638, 348, 456, 452, white);
  text(c, 'k = ' + ks.join(', '), 864, 398, 41, dim, 'center', 'Mono');
  if (loaded > 0)
    fade(c, loaded, () => {
      matrix(
        c,
        A.map((row) => ks.map((k) => row[k])),
        704,
        447,
        140 * ks.length,
        138,
        { fill: softBlue, tint: blue, size: 42 },
      );
      matrix(
        c,
        ks.map((k) => B[k]),
        704,
        620,
        280,
        70 * ks.length,
        { fill: softRose, tint: rose, size: 42 },
      );
    });
  text(c, 'Four products', 1250, 305, 40, ink);
  for (let j = 0; j < 2; j++) text(c, B[k][j], 1444 + 195 * j, 396, 46, rose, 'center', 'Serif');
  for (let i = 0; i < 2; i++) text(c, A[i][k], 1271, 500 + 153 * i, 46, blue, 'center', 'Serif');
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) {
      const x = 1444 + 195 * j,
        y = 500 + 153 * i;
      line(c, 1315, y, x, y, fold ? blue : rule, fold ? 4 : 2);
      line(c, x, 432, x, y, fold ? rose : rule, fold ? 4 : 2);
    }
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) {
      const x = 1444 + 195 * j,
        y = 500 + 153 * i;
      circle(c, x, y, 60, fold ? teal : dim);
      text(c, fold ? A[i][k] + '×' + B[k][j] : '·', x, y, 41, white, 'center', 'Serif');
    }
  text(c, 'Crossings at k = ' + k, 1473, 779, 30, dim, 'center');
  note(
    c,
    total
      ? '8 words in the first panel + 4 in the tail = 12 input loads'
      : 'One A column and one B row meet at all four crossings.',
  );
}

function panelSlide(c, ks, x, y) {
  const w = ks.length === 2 ? 718 : 464;
  plate(c, x, y, w, 421, white);
  circle(c, x + 30, y + 27, 8, rule);
  circle(c, x + w - 30, y + 27, 8, rule);
  text(
    c,
    ks.length === 2 ? 'First panel · two coordinates' : 'Tail · one coordinate',
    x + 47,
    y + 58,
    35,
    ink,
  );
  ks.forEach((k, index) => {
    const s = x + 57 + index * 327;
    text(c, 'k = ' + k, s, y + 133, 30, dim, 'left', 'Mono');
    text(c, 'A', s, y + 207, 36, blue);
    matrix(
      c,
      A.map((row) => [row[k]]),
      s + 64,
      y + 153,
      90,
      130,
      { fill: softBlue, tint: blue, size: 37 },
    );
    text(c, 'B', s, y + 343, 36, rose);
    matrix(c, [B[k]], s + 64, y + 310, 164, 68, { fill: softRose, tint: rose, size: 37 });
  });
}
export function accumulate(c, t) {
  if (t.beat.beatIndex === 3 && cue(t, 3, 'Try three FP32 terms')) {
    const first = cue(t, 3, 'loses the one'),
      second = cue(t, 3, 'keeps the one');
    text(c, 'FP32 additions in round-to-nearest mode', 105, 316, 39, dim);
    for (const [i, expression, result] of [
      [0, '(16,777,216 + 1) − 16,777,216', first ? regroup.first : '?'],
      [1, '16,777,216 + (1 − 16,777,216)', second ? regroup.last : '?'],
    ]) {
      const y = 456 + 219 * i;
      text(c, expression, 107, y, 64, ink, 'left', 'Serif');
      text(c, '=', 1403, y, 60, dim, 'center', 'Serif');
      mark(c, result, 1587, y, 75, i ? teal : blue);
    }
    note(c, 'Each parenthesized sum is rounded to FP32 before the next addition.');
    return;
  }
  const first = cue(t, 0, 'Run the first two positions', 1.15);
  const slide = smooth(cue(t, 1, 'Slide the first panel out', 1.75));
  const flight = cue(t, 2, 'Add the last products', 0.95),
    store = cue(t, 2, 'Now store', 0.8);
  const state = accumulatorState(first, flight, store);
  text(c, 'Shared input panels', 100, 308, 40, dim);
  c.save();
  c.beginPath();
  c.rect(88, 355, 765, 452);
  c.clip();
  panelSlide(c, [0, 1], 105 - 799 * slide, 371);
  panelSlide(c, [2], 904 - 799 * slide, 371);
  c.restore();
  text(
    c,
    state.stored ? 'C  /  stored output' : 'C  /  live registers',
    1001,
    308,
    40,
    state.stored ? teal : blue,
  );
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) {
      const x = 1002 + j * 380,
        y = 367 + i * 218;
      plate(c, x, y, 349, 195, state.stored ? teal : blue, true);
      text(c, 'C[' + i + ',' + j + ']', x + 24, y + 38, 26, white, 'left', 'Mono');
      text(c, state.values[i][j], x + 177, y + 100, 82, white, 'center', 'Serif');
      for (let unit = 0; unit < 16; unit++) {
        rect(
          c,
          x + 23 + unit * 14,
          y + 165,
          12,
          9,
          unit < state.values[i][j] ? white : '#ffffff33',
        );
      }
      if (flight === 1)
        text(c, '+' + last[i][j], x + 293, y + 160, 32, '#f6d591', 'center', 'Mono');
      if (flight > 0 && flight < 1) {
        mark(c, '+' + last[i][j], x + 293, y + 24 + 132 * flight, 31, rose);
      }
    }
  note(
    c,
    store
      ? 'All three coordinates have contributed. Four stores.'
      : flight > 0 && flight < 1
        ? 'The old sums stay in place until the last products arrive.'
        : slide > 0
          ? 'The registers stay in place during the panel exchange.'
          : 'Keep the partial sums through both panels.',
  );
}

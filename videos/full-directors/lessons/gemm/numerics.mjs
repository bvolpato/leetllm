import {
  ink,
  dim,
  rule,
  blue,
  rose,
  teal,
  softBlue,
  softRose,
  paper,
  text,
  line,
  rect,
  circle,
  plate,
  matrix,
  note,
  cue,
} from './plates.mjs';
import {
  frag,
  corner,
  bfProduct,
  wideSum,
  narrowSum,
  stored,
  refs,
  batch,
  roof,
  bwRoof,
} from './examples.mjs';

function lattice(c, x, y, step, rows, cols, color, live, back = '#dddbcf') {
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++)
      rect(c, x + step * j, y + step * i, step - 2, step - 2, live(i, j) ? color : back);
}
export function fragments(c, t) {
  const b = t.beat.beatIndex;
  if (b === 0) {
    const multiply = cue(t, 0, 'They multiply', 0.55);
    const colors = [blue, rose, teal, ink];
    for (const [n, s] of ['A', 'B', 'prior sum', 'updated sum'].entries()) {
      const x = 112 + n * 449;
      text(c, s, x, 339, 41, colors[n]);
      lattice(c, x, 423, 17, 16, 16, colors[n], () => n < 3 || multiply > 0);
      if (n < 3) text(c, ['×', '+', '='][n], x + 358, 561, 67, dim, 'center', 'Serif');
    }
    note(c, 'WMMA   ·   one warp, 32 participating lanes, matching fragment shapes and types.');
    return;
  }
  const keep = cue(t, 2, 'Keep nine rows'),
    tail = cue(t, 2, 'Just three positions'),
    crop = cue(t, 3, 'crops the output', 0.65);
  text(c, 'Output tile starts at (64, 48)', 98, 305, 39, teal);
  const n = frag.size,
    st = 24,
    x = 142,
    y = 391;
  lattice(
    c,
    x,
    y,
    st,
    n,
    n,
    teal,
    (i, j) => keep && i < corner[0] && j < corner[1],
    crop ? paper : '#d0cec1',
  );
  if (keep) {
    line(c, x - 5, y + corner[0] * st, x + n * st, y + corner[0] * st, teal, 3);
    line(c, x + corner[1] * st, y - 5, x + corner[1] * st, y + n * st, teal, 3);
  }
  text(c, keep ? '9 × 13 useful outputs' : 'C has 73 rows and 61 columns', x, 819, 34, teal);
  if (tail) {
    for (const [idx, name, col] of [
      [0, 'A  /  tail columns', blue],
      [1, 'B  /  tail rows', rose],
    ]) {
      const xx = 730 + idx * 532;
      text(c, name, xx, 311, 39, col);
      lattice(c, xx, 390, 22, n, n, col, (i, j) =>
        idx === 0 ? j < corner[2] && i < corner[0] : i < corner[2] && j < corner[1],
      );
      text(c, idx === 0 ? '9 × 3 real inputs' : '3 × 13 real inputs', xx, 819, 34, col);
    }
  } else {
    text(c, '16 × 16', 742, 488, 92, ink, 'left', 'Serif');
    text(c, 'full fragment', 746, 585, 42, dim);
    if (keep) {
      text(c, '73 − 64 = 9 rows', 747, 677, 43, teal);
      text(c, '61 − 48 = 13 columns', 747, 752, 43, teal);
    }
  }
  if (crop)
    note(
      c,
      '32-byte base alignment   ·   FP16 stride in multiples of 8 elements   ·   FP32 in multiples of 4',
    );
  else
    note(
      c,
      tail
        ? 'K = 67 = 4 × 16 + 3. Padded input words carry zero.'
        : 'The useful corner ends where the logical matrix ends.',
    );
}

function ruler(c, value, label, y, color) {
  const px = (v) => 382 + (v - 1023.5) * 869;
  text(c, label, 98, y, 39, color);
  line(c, px(1023.5), y, px(1025), y, rule, 4);
  [1023.5, 1024, 1025].forEach((v) => {
    line(c, px(v), y - 19, px(v), y + 18, dim, 3);
    text(c, v, px(v), y + 55, 27, dim, 'center', 'Mono');
  });
  circle(c, px(value), y, 16, color);
  text(c, value, px(value), y - 54, 39, color, 'center', 'Mono');
}

export function precision(c, t) {
  const b = t.beat.beatIndex;
  if (b === 0) {
    text(c, 'BF16 inputs', 101, 329, 41, dim);
    text(c, '1.125 × 1.25', 98, 430, 79, blue, 'left', 'Serif');
    const product = cue(t, 0, 'is one point four'),
      add = cue(t, 0, 'Add it to'),
      wide = cue(t, 0, 'FP32 retains'),
      narrow = cue(t, 0, 'gives one thousand');
    if (product) text(c, '= ' + bfProduct, 706, 430, 72, ink, 'left', 'Serif');
    if (add) text(c, 'Previous sum    1024', 103, 585, 45, dim);
    if (wide) text(c, 'FP32    ' + wideSum, 101, 731, 58, teal, 'left', 'Serif');
    if (narrow) text(c, 'BF16    ' + narrowSum, 927, 731, 58, rose, 'left', 'Serif');
    note(c, 'The operands fit in BF16 exactly. Choose how to store their sum.');
    return;
  }
  if (b <= 2) {
    const reset = cue(t, 2, 'Reset to the same start'),
      quarter = cue(t, 1, 'Add one quarter'),
      sub = cue(t, 2, 'subtract three eighths');
    const delta = sub ? -0.375 : reset ? 0 : quarter ? 0.25 : 0;
    const s = stored(delta);
    const narrowSet = reset ? cue(t, 2, 'new FP16 result') : cue(t, 2, 'FP16 rounds back');
    const wideSet = reset ? sub : cue(t, 2, 'FP32 retains the quarter');
    text(c, 'Start at 1024', 99, 301, 39, dim);
    if (delta !== 0) text(c, 'exact target   ' + s.exact, 1818, 301, 39, ink, 'right', 'Mono');
    ruler(c, wideSet ? s.wide : 1024, delta && !wideSet ? 'FP32 prior' : 'FP32', 463, teal);
    ruler(c, narrowSet ? s.narrow : 1024, delta && !narrowSet ? 'FP16 prior' : 'FP16', 701, rose);
    if (delta !== 0) {
      const xx = 382 + (s.exact - 1023.5) * 869;
      c.save();
      c.setLineDash([7, 8]);
      line(c, xx, 520, xx, 626, '#996b23', 3);
      c.restore();
    }
    note(c, 'Round to nearest   ·   FP16 spacing is 0.5 below 1024 and 1 above it.');
    return;
  }
  const round = cue(t, 3, 'convert them to FP16', 0.5),
    gpu = cue(t, 3, 'kernel returns zero'),
    low = cue(t, 4, 'rounded inputs give zero'),
    high = cue(t, 4, 'original inputs give');
  text(c, 'A row', 125, 316, 38, dim);
  text(c, 'B column', 779, 316, 38, dim);
  text(c, 'FP64 reference', 1330, 316, 38, dim);
  for (let i = 0; i < 2; i++) {
    const y = 395 + i * 204,
      color = i ? rose : blue,
      a = i && round ? refs.rounded : refs.raw;
    text(
      c,
      i ? (round ? 'After FP16 conversion' : 'Second copy') : 'Original FP32',
      104,
      y,
      33,
      color,
    );
    text(
      c,
      '[ ' + a[0].toFixed(i && round ? 0 : 4) + ',  1 ]',
      104,
      y + 81,
      55,
      color,
      'left',
      'Serif',
    );
    text(c, '×', 727, y + 70, 48, dim, 'center', 'Serif');
    matrix(c, [[1], [-1]], 795, y - 5, 143, 150, { tint: rose, fill: softRose, size: 43 });
    line(c, 1132, y + 84, 1250, y + 84, color, 4);
    text(
      c,
      i ? (low ? refs.low : '?') : high ? '≈ 0.0001' : '?',
      1350,
      y + 80,
      61,
      color,
      'left',
      'Serif',
    );
  }
  note(
    c,
    high
      ? 'Zero matches the rounded inputs. Relative error against the original result is 100%.'
      : gpu
        ? 'Kernel result   0'
        : 'Accumulate each reference using the same FP64 arithmetic.',
  );
}

export function shape(c, t) {
  const thin = cue(t, 1, 'Reduce the batch', 1.1),
    r = 8 - Math.floor(7 * thin),
    model = batch(r);
  const sk = 2,
    sj = 3,
    st = 43,
    bx = 787,
    by = 391,
    ax = 135,
    ay = 391,
    cx = 1403,
    cy = 391;
  text(c, 'Token features', ax, 310, 41, blue);
  text(c, 'Weight matrix', bx, 310, 41, rose);
  text(c, 'Output', cx, 310, 41, teal);
  for (let i = 0; i < r; i++)
    for (let j = 0; j < 6; j++) {
      rect(c, ax + j * st, ay + i * st, st - 3, st - 3, j === sk ? blue : '#d0d6e5');
      rect(c, cx + j * st, cy + i * st, st - 3, st - 3, j === sj ? teal : '#ccdbce');
    }
  for (let k = 0; k < 6; k++)
    for (let j = 0; j < 6; j++)
      rect(c, bx + j * st, by + k * st, st - 3, st - 3, k === sk && j === sj ? rose : softRose);
  text(c, '×', 582, 519, 65, dim, 'center', 'Serif');
  text(c, '=', 1223, 519, 65, dim, 'center', 'Serif');
  for (const [x, msg] of [
    [ax, r + ' × 6'],
    [bx, '6 × 6'],
    [cx, r + ' × 6'],
  ])
    text(c, msg, x, 795, 36, dim, 'left', 'Mono');
  const counted = cue(t, 2, 'one hundred ninety-two bytes'),
    flops = cue(t, 2, 'seventy-two FLOPs'),
    ratio = cue(t, 2, 'three eighths');
  note(
    c,
    ratio
      ? model.flops + ' FLOPs / ' + model.bytes + ' cold-model bytes = ' + model.ratio + ' FLOP/B'
      : flops
        ? model.flops + ' FLOPs for six length-six dot products.'
        : counted
          ? model.bytes + ' bytes if every FP32 input, weight and output crosses the boundary once.'
          : !thin && cue(t, 0, 'What happens to that reuse')
            ? 'This prompt has 8 token rows. How many will use this weight in a one-token step?'
            : 'The highlighted weight contributes to ' +
              r +
              (r === 1 ? ' output row.' : ' output rows.'),
  );
}

export function roofline(c, t) {
  const b = t.beat.beatIndex;
  if (b === 0) {
    for (const [i, title, amount, color] of [
      [0, 'Thread operand demand', '20 bytes', blue],
      [1, 'Traffic across HBM', '?', rose],
    ]) {
      const x = 108 + i * 848;
      text(c, title, x, 341, 45, color);
      plate(c, x, 421, 760, 255, i ? softRose : softBlue);
      text(c, amount, x + 376, 549, 91, color, 'center', 'Serif');
      text(
        c,
        i ? 'Count reads and writes at the device.' : '2 A + 3 B words for 12 FLOPs',
        x,
        767,
        37,
        color,
      );
    }
    note(c, 'Use the same launches for the work count and the HBM bytes.');
    return;
  }
  if (b === 3) {
    text(c, 'CUDA events in one stream', 103, 311, 43, ink);
    const starts = cue(t, 3, 'time repeated launches', 0.65),
      wait = cue(t, 3, 'Wait for the ending event', 0.6);
    const xx = [159, 519, 1251, 1669];
    line(c, xx[0], 555, xx[3], 555, rule, 5);
    for (const [i, d] of ['Warm up', 'Start event', 'End event', 'Read time'].entries()) {
      circle(c, xx[i], 555, 16, i === 0 || (starts && i <= 2) || wait ? teal : rule);
      text(c, d, xx[i], 466, 36, ink, i === 0 ? 'left' : 'center');
    }
    if (starts) for (let i = 0; i < 6; i++) rect(c, 576 + 103 * i, 528, 76, 54, blue);
    text(c, 'Repeated kernel launches', 870, 654, 38, blue, 'center');
    if (wait) text(c, 'wait for end', 1655, 649, 34, teal, 'center');
    note(c, 'Match dimensions, layout, datatype, cache policy and timing scope.');
    return;
  }
  const x = 182,
    y = 788,
    w = 1014,
    h = 407,
    xmax = 275,
    ymax = 223;
  const X = (i) => x + (w * i) / xmax,
    Y = (v) => y - (h * v) / ymax;
  const point = cue(t, 1, 'At ten FLOPs per HBM byte'),
    show = cue(t, 2, 'They meet at two hundred');
  text(c, 'Throughput ceiling (TFLOP/s)', 103, 303, 37, dim);
  line(c, x, y, x + w, y, ink, 3);
  line(c, x, y, x, y - h, ink, 3);
  const knee = roof.peak / roof.bw;
  if (point) {
    const end = show ? knee : 4 * roof.intensity;
    line(c, X(0), Y(0), X(end), Y(bwRoof(end)), blue, 7);
  }
  if (show) line(c, X(knee), Y(roof.peak), X(xmax), Y(roof.peak), teal, 7);
  for (const n of [0, 100, 200]) {
    text(c, n, x - 23, Y(n), 30, dim, 'right', 'Mono');
    text(c, n, X(n), y + 42, 30, dim, 'center', 'Mono');
  }
  if (point) circle(c, X(roof.intensity), Y(bwRoof(roof.intensity)), 11, rose);
  if (show) circle(c, X(knee), Y(roof.peak), 13, teal);
  text(c, 'HBM intensity (FLOP/B)', x + 400, 889, 36, dim);
  text(c, 'Hypothetical device', 1280, 334, 37, dim);
  text(c, '1 TB/s', 1280, 416, 53, blue, 'left', 'Serif');
  text(c, '200 TFLOP/s', 1280, 501, 53, teal, 'left', 'Serif');
  if (point) text(c, '10 FLOP/B → 10 TFLOP/s', 1280, 608, 35, rose, 'left', 'Serif');
  if (show) text(c, '200 ÷ 1 = ' + knee + ' FLOP/B', 1280, 726, 41, ink, 'left', 'Serif');
  else if (point) text(c, 'Knee at ? FLOP/B', 1280, 726, 41, ink, 'left', 'Serif');
}

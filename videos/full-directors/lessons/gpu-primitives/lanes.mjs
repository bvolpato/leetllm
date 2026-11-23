import {
  ink,
  muted,
  line,
  teal,
  rust,
  blue,
  light,
  runColors,
  stripColors,
  mix,
  cue,
  alpha,
  rect,
  rule,
  label,
  num,
  header,
  note,
  pixels,
  tag,
  hatch,
  bracket,
  arrow,
  band,
} from './graphics.mjs';
import {
  widths,
  strips,
  tree,
  laneValues,
  warp,
  peer,
  alive,
  exited,
  downStrides,
  passes,
  sum,
} from './examples.mjs';

// Raster rows from the approved toucan. Keep the head and its bill large enough to read a single pixel.
const feathers = [
  '    nnnn',
  '  nbbbmmnn',
  ' nbbmmmmbbn',
  'nbbbmtteebb',
  'nbbbtewnenn',
  'nbbbbteekww',
  'nbmmnbbwwwww',
  'nbmbbnwwwwww',
];
const bill = ['gggggg', 'YgggggYYo', 'YYgCCOOOOT', null, 'yyYOOOOOTT', 'yoooorrTT'];
const palette = {
  n: '#1d2d46',
  b: '#304461',
  m: '#405d78',
  t: '#568997',
  e: '#f9bd69',
  w: '#f5e5ba',
  k: '#dab786',
  g: '#ffd778',
  y: '#e3a137',
  o: '#c74431',
  r: '#9c3a45',
  Y: runColors[0],
  C: runColors[1],
  O: runColors[2],
  T: runColors[3],
};
const scanline = widths.flatMap((n, i) => Array(n).fill(runColors[i]));
function bird(c, cover) {
  const cell = 75,
    x = 200,
    y = 190,
    top = 243,
    bottom = 655;
  c.save();
  c.beginPath();
  c.rect(80, top, 1760, bottom - top);
  c.clip();
  rect(c, 80, top, 1760, bottom - top, '#d9e6db');
  function raster(row, col, py) {
    [...row].forEach((v, i) => {
      if (palette[v]) rect(c, x + (col + i) * cell, y + py * cell, cell, cell, palette[v]);
    });
  }
  feathers.forEach((row, i) => raster(row, 0, i - 1));
  bill.forEach((row, i) => {
    if (row) raster(row, 10, i + 1);
  });
  const bx = x + 10 * cell,
    by = y + 4 * cell;
  pixels(c, scanline, bx, by, cell, cell);
  if (cover > 0) {
    c.save();
    c.beginPath();
    c.rect(bx, by, 10 * cell * cover, cell);
    c.clip();
    for (let i = 0; i < 10; i++) {
      hatch(c, bx + i * cell, by, cell, cell);
      rule(c, bx + i * cell, by, bx + i * cell, by + cell, line, 2);
    }
    c.restore();
  }
  c.restore();
  bracket(c, bx, bx + cell * 10, bottom + 6, '10 pixels', ink);
}
export function opening(c, k) {
  header(c, 'Raster decoding', 'Where does orange start?');
  const hide = cue(k, 0, 'Cover one row', 0.9),
    order = cue(k, 1, 'In order', 0.65);
  bird(c, hide);
  alpha(c, order, () =>
    widths.forEach((n, i) => {
      const x = 235 + i * 423;
      pixels(c, Array(n).fill(runColors[i]), x, 762, 40, 43);
      num(c, n, x - 54, 784, 51);
    }),
  );
  note(
    c,
    k.beat.beatIndex === 0
      ? 'The painter receives the width of the row.'
      : k.beat.beatIndex === 1
        ? 'Each run needs a length and a starting pixel.'
        : 'One lane per run. Keep their order from left to right.',
  );
}
export function reduction(c, k) {
  header(c, 'Reduction', 'How many inputs does each sum own?');
  const visibility = [
    1,
    cue(k, 1, 'to make five', 0.55),
    cue(k, 2, 'fourteen on the left', 0.55),
    cue(k, 2, 'produces thirty-six', 0.55),
  ];
  const ys = [322, 475, 628, 781],
    d = 204,
    base = 144,
    unit = 20;
  for (let level = 0; level < tree.length; level++) {
    const n = 2 ** level;
    tree[level].forEach((value, i) => {
      const cx = base + d * (n * i + (n - 1) / 2) + 80;
      const colors = strips
        .slice(i * n, i * n + n)
        .flatMap((width, j) => Array(width).fill(stripColors[i * n + j]));
      const a = visibility[level];
      if (level > 0)
        alpha(c, a, () => {
          for (const sign of [-1, 1]) {
            const childX = cx + (sign * n * d) / 4;
            rule(
              c,
              childX,
              ys[level - 1] + 29,
              mix(childX, cx, a),
              mix(ys[level - 1] + 29, ys[level] - 78, a),
              line,
              4,
            );
          }
        });
      alpha(c, a, () => {
        pixels(c, colors, cx - (colors.length * unit) / 2, ys[level], unit, 25);
        num(c, value, cx, ys[level] - 38, level === 3 ? 66 : 46);
      });
    });
  }
  note(
    c,
    k.beat.beatIndex === 3
      ? '7 additions across the tree    /    3 stages along one path'
      : 'Each color keeps the identity of its source strip.',
  );
}
export function shuffle(c, k) {
  const b = k.beat.beatIndex;
  header(
    c,
    'Warp shuffle',
    b === 3 ? 'Who holds the full warp sum?' : 'What does lane 10 receive?',
  );
  const got = cue(k, 1, 'receives zero'),
    exit = cue(k, 1, 'after lane twenty-six exits', 0.01) > 0;
  const lost = cue(k, 2, 'read is undefined'),
    restore = cue(k, 2, 'Restore the live zero', 0.01) > 0;
  const missing = exit && !restore;
  const cx = (i) => 152 + (i % 16) * 107,
    cy = (i) => (i < 16 ? 388 : 601);
  const step =
    b === 3
      ? ['offsets sixteen', 'eight', 'four', 'two', 'and one'].filter(
          (word) => k.reveal(word, 0) > 0,
        ).length
      : 0;
  const row = warp[step],
    currentPeer = peer(laneValues, missing ? exited : alive, 10, 16);
  const cells = b !== 3 || step === 0;
  for (let i = 0; i < 32; i++) {
    const hot = cells && (i === 10 || i === 26);
    const absent = i === 26 && missing;
    label(c, 'L' + i, cx(i), cy(i) - 74, 28, hot ? rust : muted, 'center', 'Mono');
    tag(
      c,
      absent ? '×' : row[i],
      cx(i),
      cy(i),
      88,
      86,
      absent ? '#e8c9b8' : hot ? '#f5d490' : i < 26 ? '#bbd8cb' : light,
      ink,
      47,
    );
  }
  if (cells) {
    const x = cx(26),
      col = missing ? rust : teal;
    rule(c, x + 46, cy(26), x + 52, cy(26), col, 4);
    rule(c, x + 52, cy(26), x + 52, 481, col, 4);
    arrow(c, x + 52, 481, x + 13, 440, col, 4);
  }
  if (b === 3) {
    label(
      c,
      step ? 'After offset ' + downStrides[step - 1] : 'Before first exchange',
      95,
      769,
      47,
      teal,
    );
    label(c, 'Lane 0 holds ' + row[0], 950, 769, 52, ink);
  } else {
    label(c, 'Lane 10   ←   lane 26', 100, 768, 52, ink, 'left', 'Mono');
    if (missing) {
      label(c, lost > 0 ? 'Undefined source' : 'Source has exited', 1080, 768, 52, rust);
    } else if (got > 0) {
      label(c, 'Received ' + currentPeer.received, 1080, 768, 52, teal);
    } else label(c, 'Received  ?', 1080, 768, 52, muted);
  }
  note(
    c,
    b === 3
      ? 'All 32 lanes shuffle. Only lanes with an in-range source add.'
      : missing
        ? 'Same full mask. On the first read, lane 26 sent the zero in its register.'
        : 'Full mask. 26 real inputs and 6 participating zeros.',
  );
}
export function barrier(c, k) {
  const b = k.beat.beatIndex;
  header(
    c,
    'Shared memory',
    b === 2 ? 'How does a 256-thread block finish?' : 'When may the reader use both slots?',
  );
  if (b === 2) {
    const loaded = cue(k, 2, 'warp zero loads', 0.7),
      done = cue(k, 2, 'lane zero owns', 0.5);
    label(c, 'One shared slot per warp leader', 95, 296, 44);
    band(
      c,
      Array.from({ length: 8 }, (_, i) => 'w' + i),
      103,
      411,
      1600,
    );
    arrow(c, 903, 480, 903, 553);
    alpha(c, loaded, () => {
      band(c, [...Array.from({ length: 8 }, (_, i) => 'w' + i), '0 … 0'], 103, 648, 1600);
      bracket(c, 1534, 1700, 704, '24 lanes', muted);
    });
    alpha(c, done, () => label(c, 'Lane 0 writes the block sum', 105, 798, 46, teal));
    note(c, 'w0 through w7 are the eight warp sums.');
    return;
  }
  const a = cue(k, 0, 'first leader writes', 0.65),
    d = cue(k, 1, 'write its slot', 0.65);
  const open = cue(k, 1, 'After it releases', 0.55),
    result = cue(k, 1, 'gives thirty-six', 0.45);
  label(c, 'Leader register', 100, 298, 41);
  label(c, 'Shared slot', 742, 298, 41);
  label(c, 'Reader warp', 1420, 298, 41);
  tree[2].forEach((v, i) => {
    const y = 430 + i * 190;
    num(c, v, 235, y, 75);
    arrow(c, 340, y + 41, 705, y + 41, teal);
    rect(c, 751, y - 52, 244, 104, light);
    label(c, 's' + i, 785, y, 37, muted);
    const t = i ? d : a;
    alpha(c, t, () => num(c, v, mix(372, 918, t), y - 56 * Math.sin(Math.PI * t), 63));
    if (t === 0) label(c, '?', 918, y, 52, muted, 'center');
    alpha(c, open, () => arrow(c, 1013, y, 1344, mix(y, 525, 0.78), teal));
  });
  if (open < 1) {
    alpha(c, 1 - open, () => {
      rect(c, 1168, 360, 17, 335, rust);
      label(c, 'Barrier', 1177, 746, 37, rust, 'center');
    });
  }
  label(c, open ? '14 + 22' : 'Waiting', 1518, 492, 48, open ? ink : muted, 'center');
  alpha(c, result, () => num(c, tree.at(-1)[0], 1518, 610, 93, teal));
  note(
    c,
    open
      ? 'Every thread reached the block barrier. Both writes are visible.'
      : d === 1
        ? 'Both leaders have written. The reader still waits at the block barrier.'
        : 'The consumer needs both writes to finish.',
  );
}
export function grid(c, k) {
  const b = k.beat.beatIndex;
  header(
    c,
    'Device-wide reduction',
    b < 2
      ? 'How many partials survive each pass?'
      : b === 2
        ? 'Can the queued blocks reach the barrier?'
        : 'Where do the block sums meet?',
  );
  if (b < 2) {
    const show = [
      1,
      cue(k, 1, 'ninety-two partials'),
      cue(k, 1, 'to sixteen'),
      cue(k, 1, 'to one'),
    ];
    const labels = ['int32 inputs', 'int64 partials', 'int64 partials', 'scalar'];
    passes.forEach((n, i) => {
      const x = 111 + i * 458;
      label(c, labels[i], x, 333, 38, muted);
      const cols = [8, 8, 4, 1][i],
        rows = [8, 4, 4, 1][i];
      alpha(c, show[i], () => {
        for (let j = 0; j < cols * rows; j++)
          rect(c, x + (j % cols) * 21, 383 + Math.floor(j / cols) * 21, 18, 18, i ? teal : blue);
        label(c, (n / (cols * rows)).toLocaleString('en-US') + ' per square', x, 595, 32, muted);
        label(c, n.toLocaleString('en-US'), x, 690, i ? 67 : 58, ink, 'left', 'Mono');
      });
      if (!show[i]) label(c, '?', x, 690, 65, muted);
      if (i < 3) arrow(c, x + 295, 482, x + 400, 482, line, 4);
    });
    note(c, 'Each block covers up to 512 inputs. Each pass rounds its block count up.');
  } else {
    const atomic = b === 3,
      gather = cue(k, 3, 'adds its partial', 1.15);
    label(c, atomic ? 'Block partials' : 'Resident slots', 100, 317, 46);
    for (let i = 0; i < (atomic ? 8 : 4); i++) {
      const x = 210 + i * (atomic ? 201 : 222);
      tag(c, 'B' + i, x, 432, 145, 87, light, ink, 47);
      if (atomic)
        alpha(c, gather, () =>
          rule(c, x, 485, mix(x, 960, gather), mix(485, 667, gather), teal, 4),
        );
    }
    if (atomic) {
      tag(c, 'Σ', 960, 741, 237, 98, '#f5d490', ink, 66);
      note(c, 'Initialize one global accumulator. Updates to that address serialize.');
    } else {
      label(c, 'Queued blocks', 1050, 317, 46);
      for (let i = 0; i < 4; i++)
        tag(c, 'B' + (i + 4), 1140 + i * 194, 432, 140, 87, '#deded0', muted, 47);
      const stuck = cue(k, 2, 'may never start');
      alpha(c, stuck, () => {
        rule(c, 141, 600, 1767, 600, rust, 8);
        label(c, 'All resident slots are waiting. The queue has no free slot.', 110, 734, 51, rust);
      });
      note(c, 'A same-stream kernel boundary orders separate grid passes.');
    }
  }
}

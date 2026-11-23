import assert from 'node:assert/strict';
import { xs, hs, selective, pairs } from '../../../films/state-space-models/fixtures.mjs';
import { run, compose } from '../../../films/state-space-models/arithmetic.mjs';
import {
  openingFiles,
  lookupCases,
  amendedSpec,
  latestRetryLimit,
  cacheWorksheet,
  contentWriteFixture,
  orderedAffineFixture,
  orderedPrefixTree,
  chunkStateFixture,
  trapezoidWriteFixture,
  multiDirectionFixture,
  bufferFixture,
  timingFixture,
} from '../../../films/state-space-models/model.mjs';
import fish from '../../../director-cuts/lessons/state-space-models/film.mjs';
import {
  P,
  rect,
  path,
  text,
  label,
  number,
  dot,
  arrow,
  header,
  foot,
  plate,
  fmt,
  smooth,
  mix,
  cue,
  strip,
  bar,
} from './paint.mjs';

const chapter = (k) => k.beat.beatIndex;
const half = (values) => run(values, 0.5, 0.5);
const averagePractice = [2, 7, 6, 1];
const correction = 4;
const accepted = half([3, 1, 99]).at(-1),
  rejected = half([3, 1, 99, 77]).at(-1);
const corrected = (accepted + correction) / 2,
  contaminated = (rejected + correction) / 2;
function filePage(g, x, name, rows, active, close = 0) {
  const y = 309,
    w = 795;
  rect(g, x, y, w, 442, P.ink, null, 16);
  label(g, name, x + 36, y + 47, 'left', P.white);
  rect(g, x + 24, y + 90, w - 48, 316, P.card, null, 5);
  rows.forEach(([key, val], i) => {
    const yy = y + 145 + i * 90;
    if (i === active) rect(g, x + 45, yy - 33, w - 92, 65, P.sea, null, 4);
    text(g, '0' + (i + 1), x + 56, yy, 32, P.muted, 'Mono');
    number(g, key, x + 156, yy, 43);
    number(g, val, x + w - 77, yy, 54, P.ink, 'right');
  });
  if (close > 0) {
    g.save();
    g.beginPath();
    g.rect(x, y + 82, w, 360 * close + 2);
    g.clip();
    rect(g, x, y + 82, w, 360, '#285451', null, 10);
    for (let i = 0; i < 10; i++)
      path(
        g,
        [
          [x + 30, y + 97 + 35 * i],
          [x + w - 30, y + 97 + 35 * i],
        ],
        '#3d6762',
        2,
      );
    if (close === 1) text(g, 'File closed', x + w / 2, y + 260, 62, P.white, 'Serif', 'center');
    g.restore();
  }
}
function cursor(g, x, y) {
  path(
    g,
    [
      [x, y],
      [x + 14, y + 65],
      [x + 27, y + 44],
      [x + 47, y + 64],
      [x + 57, y + 54],
      [x + 37, y + 35],
      [x + 62, y + 30],
    ],
    P.gold,
    3,
    true,
  );
  path(
    g,
    [
      [x, y],
      [x + 14, y + 65],
      [x + 27, y + 44],
      [x + 47, y + 64],
      [x + 57, y + 54],
      [x + 37, y + 35],
      [x + 62, y + 30],
      [x, y],
    ],
    P.ink,
    3,
  );
}
function opening(g, k) {
  const i = chapter(k);
  header(g, 'API documentation', 'Where would you look for the retry limit?');
  if (i < 2) {
    const close = smooth(cue(k, 0, 'Close both files', 0.9));
    openingFiles.forEach((f, j) =>
      filePage(
        g,
        94 + 938 * j,
        j ? 'service-b.cfg' : 'service-a.cfg',
        [
          ['max_retries', f.retries],
          ['timeout_s', f.timeout],
        ],
        0,
        close,
      ),
    );
    if (!close) {
      const t = smooth(cue(k, 0, 'File B', 0.75));
      cursor(g, mix(700, 1638, t), 464);
    }
    if (i === 1) {
      text(g, 'Keep the positions', 492, 820, 52, P.teal, 'Serif', 'center');
      text(g, 'Keep one running value', 1428, 820, 52, P.plum, 'Serif', 'center');
    }
    foot(
      g,
      i
        ? 'What will the later question be able to access?'
        : close === 1
          ? 'Both files are closed. The reader must use what it retained.'
          : 'Find the field the later question will ask for.',
    );
    return;
  }
  const sum = i === 3,
    show = sum && cue(k, 3, 'Both files leave');
  openingFiles.forEach((f, j) => {
    const x = 100,
      y = 337 + j * 250;
    label(g, 'File ' + (j ? 'B' : 'A'), x, y + 75);
    strip(g, [f.retries, f.timeout], x + 175, y, 580, sum ? -1 : 0, ['retry limit', 'timeout']);
    arrow(g, x + 820, y + 45, x + 1000, y + 45);
    if (sum) {
      rect(g, x + 1050, y - 14, 535, 121, P.lilac, null, 12);
      number(g, show ? fmt(f.returned) : '?', x + 1315, y + 45, 74, P.plum, 'center');
    } else {
      text(g, 'position 1', x + 1060, y + 45, 64, P.teal, 'Serif');
      number(g, '→  ' + f.retries, x + 1370, y + 45, 60);
    }
  });
  foot(
    g,
    sum
      ? 'One running coordinate per file   ·   h ← (h + input) / 2 from zero'
      : 'A query can reach each stored position through its key and value.',
  );
}
function stateAssembly(g, k) {
  const i = chapter(k);
  let n = 0,
    ready = false;
  if (!i) {
    n = cue(k, 0, 'One comes next') ? 1 : 0;
    ready = n ? cue(k, 0, 'gives point seven four') : cue(k, 0, 'Three writes');
  } else if (i === 1) {
    n = 2;
  } else if (i === 2) {
    n = cue(k, 2, 'Input two') ? 3 : 2;
    ready = n === 3 ? cue(k, 2, 'leaves one') : cue(k, 2, 'Together they give');
  } else {
    n = 3;
    ready = true;
  }
  const old = n ? hs[n - 1] : 0,
    carry = 0.9 * old,
    write = 0.2 * xs[n],
    C = i === 3 && cue(k, 3, 'Double C') ? 2 : 1;
  header(g, 'Discrete recurrence', 'How much of the old state survives?');
  strip(g, xs, 90, 287, 840, n);
  label(g, 'input sequence', 990, 328);
  const carryKnown = i !== 1 && (i !== 2 || cue(k, 2, 'The carry is'));
  const writeKnown = i !== 1 && (i !== 2 || cue(k, 2, 'The write is'));
  label(g, 'Carried from the previous step', 95, 445);
  number(g, '0.9 × ' + fmt(old) + ' = ' + (carryKnown ? fmt(carry) : '?'), 92, 515, 53);
  label(g, 'Written by the current input', 995, 445);
  number(g, '0.2 × ' + xs[n] + ' = ' + (writeKnown ? fmt(write) : '?'), 990, 515, 53, P.rust);
  const x = 96,
    y = 625,
    w = 1120,
    scale = w / 2;
  rect(g, x, y, w, 89, '#e1e4d8', null, 5);
  if (carryKnown) rect(g, x, y, carry * scale, 89, P.teal);
  if (ready) rect(g, x + carry * scale, y, write * scale, 89, P.gold);
  number(g, ready ? fmt(hs[n]) : '?', 1280, 667, 77);
  label(g, '0', x, y + 123);
  label(g, '2', x + w, y + 123, 'right');
  if (i === 3) {
    number(
      g,
      'y = ' + C + ' × ' + fmt(hs[n]) + ' + 0 × 2 = ' + fmt(C * hs[n], 5),
      100,
      819,
      51,
      P.plum,
    );
  }
  foot(
    g,
    i === 3
      ? 'C reads the state. D passes the current input directly to the output.'
      : 'h ← 0.9h + 0.2x     ·     C = 1, D = 0',
  );
}
function kernel(g, k) {
  const i = chapter(k);
  const pos = i === 1 && !cue(k, 1, 'Move it back') ? 2 : 4;
  const q = i === 3 ? smooth(cue(k, 3, 'Raise that coefficient', 1.1)) : 0;
  const model = contentWriteFixture(xs.slice(0, pos), 0.3 * q);
  header(g, 'Causal convolution', 'What reaches the selected output?');
  const base = 746,
    step = 344,
    x0 = 185,
    max = 2;
  model.contributions.forEach((v, j) => {
    const x = x0 + j * step,
      h = (v / max) * 350;
    rect(g, x, base - h, 185, h, j === 2 && q ? P.gold : P.teal, null, 3);
    number(g, fmt(v, 5), x + 92, base - h - 42, 46, P.ink, 'center');
    label(g, 'input ' + xs[j], x + 92, base + 49, 'center');
    text(
      g,
      '× ' + fmt(model.coefficients[j] * 0.9 ** (pos - 1 - j), 5),
      x + 92,
      base + 99,
      34,
      P.muted,
      'Mono',
      'center',
    );
  });
  path(
    g,
    [
      [135, base],
      [1522, base],
    ],
    P.ink,
    3,
  );
  label(g, 'Output at position ' + pos + '   ·   y = h', 1220, 318);
  number(g, fmt(model.output), 1220, 395, 76, P.plum);
  if (i === 3) text(g, 'Fixed rule: ' + fmt(hs.at(-1)), 1220, 485, 39, P.muted);
  label(g, 'Contribution after decay', 105, 323);
  foot(
    g,
    i < 2
      ? 'Zero initial state   ·   C = 1, D = 0   ·   K(j) = C × 0.2 × 0.9ʲ'
      : 'Replay from zero   ·   C = 1, D = 0   ·   carry 0.9   ·   only input 4 changes its write coefficient',
  );
}
function decayPlot(g, d, area, rectangle) {
  const x = 160,
    y = 753,
    w = 855,
    h = 355,
    X = (t) => x + (t * w) / 2.2,
    Y = (v) => y - h * v;
  const points = Array.from({ length: 101 }, (_, j) => [
    X((2.2 * j) / 100),
    Y(Math.exp((-2.2 * j) / 100)),
  ]);
  if (rectangle) rect(g, x, Y(1), X(d) - x, h, P.pink);
  if (area) {
    const a = Array.from({ length: 61 }, (_, j) => [X((d * j) / 60), Y(Math.exp((-d * j) / 60))]);
    path(g, [[x, y], ...a, [X(d), y]], P.sea, 0, true);
  }
  path(
    g,
    [
      [x, Y(1.07)],
      [x, y],
      [X(2.2), y],
    ],
    P.ink,
    3,
  );
  for (const v of [0, 0.5, 1]) {
    label(g, fmt(v), x - 19, Y(v), 'right');
  }
  for (const v of [0, 1, 2]) {
    label(g, fmt(v), X(v), y + 39, 'center');
  }
  label(g, 'step length', x + w - 10, y + 91, 'right');
  path(g, points, P.teal, 7);
  path(
    g,
    [
      [X(d), y],
      [X(d), Y(Math.exp(-d))],
    ],
    P.rust,
    4,
  );
  dot(g, X(d), Y(Math.exp(-d)), 12, P.rust);
}
function delta(g, k) {
  const i = chapter(k);
  let d = 0.1;
  if (i === 0) d = mix(0.1, 2, smooth(cue(k, 0, 'Stretch the step', 1.4)));
  if (i === 1) d = mix(2, 1, smooth(cue(k, 1, 'Bring the probe', 1.1)));
  if (i === 2) d = mix(1, 0.1, smooth(cue(k, 2, 'Shorten the step', 1.4)));
  const area = cue(k, 1, 'the area under'),
    simple = cue(k, 1, 'reference write uses');
  header(g, 'Scalar dynamics  ·  A = −1, B = 1', 'How much survives one step?');
  decayPlot(g, d, area, simple);
  label(g, 'Step length Δ', 1110, 335);
  number(g, fmt(d, 3), 1110, 399, 61);
  label(g, 'Old state retained', 1110, 505);
  number(g, 'exp(−Δ) = ' + fmt(Math.exp(-d), 3), 1110, 569, 48, P.teal);
  if (area) text(g, 'Exact area   ' + fmt(1 - Math.exp(-d), 3), 1110, 691, 48, P.teal);
  if (simple) text(g, 'Rectangle   ' + fmt(d, 3), 1110, 779, 48, P.rust);
  foot(g, 'One unit of old state   ·   input held at one throughout the interval');
}
function choose(g, k) {
  const i = chapter(k),
    n = i === 0 ? (cue(k, 0, 'then one') ? 1 : 0) : i === 3 ? 3 : 2;
  const v = selective[n],
    old = n ? selective[n - 1].h : 0;
  const compute = i !== 1,
    read = compute && (i !== 2 || cue(k, 2, 'multiply by the current C'));
  header(g, 'Selective recurrence  ·  A = −1, D = 0', 'What does this activation change?');
  strip(g, xs, 91, 284, 830, n);
  label(g, 'post-convolution activation x', 980, 329);
  const cols = [
    [95, 'Step size Δ', v.delta, 'softplus(−1 + 0.3x)'],
    [681, 'Input map B', 0.1 * v.x, '0.1x'],
    [1268, 'Readout C', v.c, '1 + 0.05x'],
  ];
  for (const [x, title, val, eq] of cols) {
    label(g, title, x, 475);
    number(g, fmt(val, 3), x, 551, 75);
    text(g, eq, x, 627, 35, P.muted, 'Mono');
  }
  if (compute) {
    const carry = v.a * old,
      scale = 330;
    number(
      g,
      'h ≈ ' + fmt(v.a, 3) + ' × ' + fmt(old, 3) + ' + ' + fmt(v.write, 3) + ' ≈ ' + fmt(v.h, 3),
      95,
      736,
      47,
      P.teal,
    );
    if (read) number(g, 'y = C × h ≈ ' + fmt(v.y, 3), 95, 816, 47, P.plum);
    rect(g, 1120, 715, 660, 43, '#e1e4d8');
    rect(g, 1120, 715, carry * scale, 43, P.teal);
    rect(g, 1120 + carry * scale, 715, v.write * scale, 43, P.gold);
    if (read) bar(g, 1120, 795, 660, 43, v.y, 2, P.plum);
  } else {
    text(g, 'Carry fraction?                 Write = Δ × B × x', 95, 748, 51, P.rust, 'Serif');
  }
  foot(g, 'Hand-chosen coefficient maps   ·   retain exp(−Δ) of h   ·   add ΔBx');
}
function prefixTree(g, stage) {
  const tree = orderedPrefixTree(),
    mid = [374, 766, 1158, 1550],
    y = [360, 526, 700];
  for (let j = 0; j < 4; j++) {
    const x = mid[j];
    label(g, 'input ' + xs[j], x, y[0] - 47, 'center');
    rect(g, x - 161, y[0] - 8, 322, 72, P.sea, P.grid, 7);
    number(
      g,
      '(' + fmt(pairs[j][0]) + ', ' + fmt(pairs[j][1]) + ')',
      x,
      y[0] + 16,
      41,
      P.ink,
      'center',
    );
    if (stage >= 1 && (j < 2 || stage >= 2))
      path(
        g,
        [
          [x, y[0] + 61],
          [x, y[1] - 51],
          [(mid[j - (j % 2)] + mid[j - (j % 2) + 1]) / 2, y[1] - 51],
        ],
        P.teal,
        4,
      );
  }
  [tree.left, tree.right].forEach((a, j) => {
    if (stage < j + 1) return;
    const x = 570 + j * 784;
    number(g, '(' + fmt(a[0]) + ', ' + fmt(a[1]) + ')', x, y[1] + 14, 47, P.teal, 'center');
    if (stage >= 3)
      path(
        g,
        [
          [x, y[1] + 61],
          [x, y[2] - 56],
          [962, y[2] - 56],
        ],
        P.teal,
        4,
      );
  });
  if (stage >= 3)
    number(
      g,
      'All four   (' + fmt(tree.total[0]) + ', ' + fmt(tree.total[1]) + ')',
      962,
      y[2] + 8,
      53,
      P.plum,
      'center',
    );
  if (stage >= 4)
    number(
      g,
      'Prefix states   ' + hs.map((v) => fmt(v)).join('     '),
      962,
      817,
      48,
      P.teal,
      'center',
    );
}
function scan(g, k) {
  const i = chapter(k);
  let s = 0;
  if (i === 1) s = 0;
  if (i === 2)
    s =
      1 +
      cue(k, 2, 'join the last two') +
      cue(k, 2, 'Joining those two ranges') +
      cue(k, 2, 'An inclusive prefix scan');
  if (i === 3) s = 4;
  header(g, 'Ordered affine updates', 'Which carry scales the earlier write?');
  prefixTree(g, s);
  if (s === 0) {
    label(g, 'Join inputs 3 and 1', 211, 562);
    number(g, 'new carry = 0.9 × 0.9', 211, 646, 48);
    number(g, 'new write = ? × 0.6 + 0.2', 211, 753, 48, P.teal);
  }
  foot(
    g,
    i === 3
      ? 'Input-derived pairs can be prepared in parallel. Check fused results against a serial reference.'
      : 'Pair (a, b) maps h to ah + b. Apply the left update first and the right update second.',
  );
}
function collision(g, k) {
  const i = chapter(k);
  if (i < 7) {
    fish.draw(g, { ...k, index: i });
    return;
  }
  header(g, 'The marked pixel', 'Does a common continuation separate the histories?');
  const n = cue(k, 7, 'and then two') ? 4 : cue(k, 7, 'Give that coordinate four') ? 3 : 2;
  [
    [3, 1, 4, 2],
    [1, 2, 4, 2],
  ].forEach((v, j) => {
    const y = 345 + j * 234;
    label(g, j ? 'Fish B' : 'Fish A', 99, y + 47);
    strip(g, v.slice(0, n), 280, y, 810, n - 1);
    arrow(g, 1150, y + 44, 1270, y + 44);
    number(g, fmt(half(v.slice(0, n)).at(-1)), 1320, y + 45, 75, P.plum);
    label(g, 'inputs at the marked pixel', 280, y + 132);
  });
  foot(
    g,
    'Both readouts see the same state at this coordinate. Test exact retrieval on the trained model.',
  );
}
function branch(g, stage, rejectionKnown = true) {
  const nodes = [
    { x: 210, y: 580, h: 1.25, name: 'Prefix 3, 1' },
    { x: 670, y: 580, h: accepted, name: 'Accepted 99' },
    { x: 1098, y: 383, h: rejected, name: rejectionKnown ? 'Rejected 77' : 'Provisional 77' },
    { x: 1590, y: 383, h: contaminated, name: 'Continue with 4' },
    { x: 1270, y: 745, h: corrected, name: 'Restore, then 4' },
  ];
  const links = [
    [0, 1, 1],
    [1, 2, 2],
    [2, 3, 5],
    [1, 4, 4],
  ];
  for (const [a, b, t] of links)
    if (stage >= t) {
      const m = nodes[a],
        n = nodes[b];
      path(
        g,
        [
          [m.x + 32, m.y],
          [n.x - 33, n.y],
        ],
        b === 3 ? P.rust : b === 4 ? P.teal : P.grid,
        8,
      );
    }
  for (const [i, n] of nodes.entries()) {
    const shown = [0, 1, 2, 5, 4][i];
    if (stage < shown) continue;
    const c = (i === 2 && rejectionKnown) || i === 3 ? P.rust : P.teal;
    dot(g, n.x, n.y, 21, c);
    if (i === [0, 1, 2, 1, 4, 4][stage]) dot(g, n.x, n.y, 11, P.white);
    text(g, n.name, n.x, n.y - 79, 38, c, 'Sans', 'center');
    number(g, fmt(n.h, 5), n.x, n.y + 77, 57, P.ink, 'center');
    if (i === 1 && stage >= 1) {
      g.beginPath();
      g.arc(n.x, n.y, 39, 0, 2 * Math.PI);
      g.strokeStyle = P.gold;
      g.lineWidth = 9;
      g.stroke();
    }
  }
}
function compareCorrection(g, k) {
  const i = chapter(k);
  function through(phrase, captionStart = phrase) {
    if (i !== 2) return Number(i > 2);
    const { start, end } = k.wordCue(phrase);
    return k.reveal(phrase, end - start, { captionStart });
  }
  const restore = through('Restore the accepted checkpoint');
  const safe = through('then process the correction');
  const suspect = through(
    'Processing four from the rejected branch would carry the rejected evidence forward',
  );
  cue(k, 2, 'would carry the rejected evidence forward');
  cue(k, 3, 'along with the recurrent state');
  header(g, 'Speculative branch  ·  half carry, half write', 'Which state should receive the correction?');
  rect(g, 95, 289, 1719, 89, P.card, P.grid, 8);
  label(g, 'Accepted inputs', 119, 334);
  number(g, '3, 1, 99', 395, 334, 39);
  label(g, 'Same correction', 653, 334);
  rect(g, 947, 316, 22, 33, P.gold, null, 3);
  number(g, correction + '  →  +' + correction / 2 + ' write', 987, 333, 41, P.plum);
  number(g, 'h′ = 0.5h + 0.5x', 1785, 333, 37, P.ink, 'right');

  const rows = [
    { name: 'Saved after 99', start: accepted, progress: safe, select: restore, result: corrected, color: P.teal },
    { name: 'Live after rejected 77', start: rejected, progress: suspect, select: suspect, result: contaminated, color: P.rust },
  ];
  const chartX = 619;
  const chartWidth = 759;
  const max = 36;
  rows.forEach((row, j) => {
    const y = 498 + j * 201;
    rect(g, 95, y - 69, 411, 147, P.card, P.grid, 10);
    label(g, row.name, 121, y - 30);
    number(g, fmt(row.start, 5), 121, y + 33, 55);
    path(g, [[520, y], [592, y]], P.grid, 4);
    if (row.select > 0) {
      const at = mix(529, 589, smooth(row.select));
      path(g, [[520, y], [at, y]], row.color, 5);
      dot(g, at, y, 11, row.color);
    }

    const carried = row.start / 2;
    const written = correction / 2;
    const carry = smooth(Math.min(1, row.progress * 1.6));
    const write = smooth(Math.max(0, (row.progress - 0.625) / 0.375));
    const carriedWidth = chartWidth * carried / max;
    rect(g, chartX, y - 20, chartWidth, 42, '#e2e3d7', null, 5);
    if (carry > 0) rect(g, chartX, y - 20, carriedWidth * carry, 42, row.color, null, 4);
    if (write > 0)
      rect(g, chartX + carriedWidth, y - 20, chartWidth * written * write / max, 42, P.gold, null, 3);
    label(g, carry === 1 ? 'Half-state carry  ' + fmt(carried, 5) : 'Half of the incoming state',
      chartX, y - 52);
    if (row.progress === 1)
      label(g, '+' + written + ' from input ' + correction, chartX, y + 55, 'left', P.plum);

    rect(g, 1429, y - 69, 385, 147, row.progress === 1 ? (j ? P.pink : P.sea) : P.card, P.grid, 10);
    label(g, 'State after input ' + correction, 1456, y - 30);
    number(g, row.progress === 1 ? fmt(row.result, 5) : '?', 1456, y + 33, 51,
      row.progress === 1 ? row.color : P.muted);
  });
  if (i === 3 && cue(k, 3, 'a short convolution history'))
    label(g, 'A complete Mamba-1 checkpoint also preserves the convolution history.', 96, 817);
}
function rollback(g, k) {
  if (chapter(k) > 0) {
    compareCorrection(g, k);
    return;
  }
  const stage = cue(k, 0, 'Accept ninety-nine') + cue(k, 0, 'overwrites the live value');
  header(
    g,
    'Speculative branch  ·  half carry, half write',
    'Which state should receive the correction?',
  );
  branch(g, stage, !!cue(k, 0, 'The verifier rejects it'));
  foot(g, 'The white center marks the live state. A gold ring marks its saved checkpoint.');
}
function held(g, k) {
  const i = chapter(k);
  if (i <= 3) {
    header(g, 'Zero-order hold', 'How much of a held input enters the state?');
    const scalar = i >= 2;
    decayPlot(g, 1, true, i === 3 && cue(k, 3, 'step size times B'));
    label(g, 'Scalar illustration   A = −1, B = 1, Δ = 1', 112, 317);
    if (!scalar) {
      label(g, 'Constant input throughout Δ', 1070, 356);
      number(g, 'Ā = exp(ΔA)', 1070, 441, 54);
      number(g, 'B̄ =', 1070, 551, 51);
      text(g, '∫', 1210, 543, 89, P.ink, 'Serif');
      text(g, 'Δ', 1254, 508, 29, P.ink, 'Mono');
      text(g, '0', 1248, 583, 29, P.ink, 'Mono');
      number(g, 'exp(uA) B du', 1297, 551, 43);
      if (i === 1 && cue(k, 1, 'For invertible A')) {
        number(g, 'B̄ = inv(A) (exp(ΔA) − I) B', 1070, 681, 42, P.ink, 'left', 746);
        label(g, 'A invertible, Δ > 0', 1070, 756);
      }
    } else {
      label(g, 'Unit old state, unit input', 1100, 356);
      number(g, 'carry   ' + fmt(Math.exp(-1), 3), 1100, 460, 58, P.teal);
      if (cue(k, 2, 'A unit held input'))
        number(g, 'area    ' + fmt(1 - Math.exp(-1), 3), 1100, 579, 58, P.teal);
      if (cue(k, 3, 'step size times B')) number(g, 'ΔBx     1', 1100, 706, 58, P.rust);
    }
    foot(
      g,
      i === 1
        ? 'The integral also covers singular A. At Δ = 0, the input contribution is zero.'
        : 'Scalar curve at left: a write made earlier in the interval undergoes more decay.',
    );
    return;
  }
  const exercise = i >= 5,
    v = exercise ? averagePractice : xs,
    states = half(v);
  const shown =
    i === 4
      ? cue(k, 4, 'The states are')
        ? 4
        : 0
      : i === 5
        ? cue(k, 5, 'After the first three')
          ? 3
          : 0
        : 3 + cue(k, 6, 'gives three');
  header(g, 'Scalar practice', 'What happens to the last input?');
  label(g, 'Input', 98, 404);
  strip(g, v, 390, 365, 1370);
  label(g, 'State', 98, 693);
  states.forEach((s, j) => {
    const x = 420 + j * 342.5;
    arrow(g, x + 118, 480, x + 118, 555, P.grid);
    if (j < shown) {
      bar(g, x, 615, 265, 45, s, exercise ? 5 : 3, P.teal);
      number(g, fmt(s), x, 715, 58);
    } else number(g, '?', x + 115, 704, 59, P.muted);
  });
  foot(g, 'Start at zero   ·   h ← 0.5h + 0.5x   ·   y = Ch + Dx');
}
function mambaBlock(g, k) {
  const i = chapter(k);
  const maps = cue(k, 2, 'From u we get');
  const previous = cue(k, 2, 'Follow the previous state');
  const carry = cue(k, 2, 'Delta and A determine');
  const write = cue(k, 2, 'Add the write');
  const read = cue(k, 2, 'C reads that new state');
  const skip = cue(k, 2, 'A second path');
  const gated = cue(k, 3, 'multiplies the readout');
  header(g, 'Mamba-1 block', i === 4
    ? 'Which two values should match the serial run?'
    : 'How does one token update the state and reach the output?');

  const box = (x, y, w, name, fill, on) => {
    rect(g, x, y, w, 80, on ? fill : P.card, P.grid, 10);
    text(g, name, x + w / 2, y + 40, 39, on ? P.ink : P.muted, 'Sans', 'center', w - 20);
  };
  const split = cue(k, 1, 'Project the input');
  const conv = cue(k, 1, 'causal convolution');
  const activation = cue(k, 1, 'SiLU activation');
  box(90, 472, 192, 'Projection', P.sea, split);
  box(358, 472, 205, 'Causal conv', P.sea, conv);
  box(617, 472, 171, 'SiLU → u', P.sea, activation);
  box(358, 723, 205, 'Gate z', P.lilac, split);
  box(617, 723, 171, 'SiLU(z)', P.lilac, cue(k, 3, 'applies SiLU'));
  if (split) {
    arrow(g, 283, 512, 352, 512);
    path(g, [[312, 512], [312, 763]], P.plum);
    arrow(g, 312, 763, 352, 763, P.plum);
    dot(g, 312, 512, 6, P.ink);
  }
  if (conv) arrow(g, 564, 512, 610, 512);
  if (cue(k, 3, 'applies SiLU')) arrow(g, 564, 763, 610, 763, P.plum);

  if (maps) {
    path(g, [[789, 512], [826, 512], [826, 330]], P.teal);
    arrow(g, 826, 330, 874, 330);
    box(879, 290, 273, 'B, C, positive Δ', P.gold, true);
  }
  if (previous) {
    rect(g, 967, 462, 430, 159, P.sea, P.grid, 12);
    text(g, 'Selective state update', 1182, 497, 40, P.ink, 'Sans', 'center');
    text(g, 'Previous state', 1329, 390, 36, P.ink, 'Sans', 'center');
    arrow(g, 1329, 417, 1329, 455);
    arrow(g, 1045, 371, 1045, 455, P.rust);
    label(g, 'B, Δ', 1063, 415, 'left', P.rust);
    arrow(g, 790, 512, 960, 512);
    dot(g, 826, 512, 7, P.teal);
    label(g, 'u', 892, 482, 'center', P.teal);
    if (carry) number(g, 'carry = exp(ΔA) × old h', 1182, 548, 30, P.ink, 'center', 407);
    if (write) number(g, 'h = carry + ΔBu', 1182, 593, 34, P.ink, 'center');
  }
  if (read) {
    path(g, [[1153, 330], [1675, 330]], P.rust);
    arrow(g, 1675, 330, 1675, 455, P.rust);
    label(g, 'C', 1500, 302, 'center', P.rust);
    arrow(g, 1399, 538, 1524, 538);
    label(g, 'new h', 1460, 498, 'center', P.teal);
    rect(g, 1531, 462, 289, 159, P.sea, P.grid, 12);
    text(g, 'Readout', 1675, 506, 41, P.ink, 'Sans', 'center');
    number(g, skip ? 'Ch + Du' : 'Ch', 1675, 569, 45, P.ink, 'center');
  }
  if (skip) {
    path(g, [[826, 512], [826, 668], [1571, 668]], P.teal);
    arrow(g, 1571, 668, 1571, 627);
    label(g, 'D × u', 1190, 701, 'center', P.teal);
  }
  if (gated) {
    path(g, [[1740, 623], [1740, 685], [1489, 685]], P.teal);
    arrow(g, 1489, 685, 1489, 728);
    arrow(g, 789, 763, 1454, 763, P.plum);
    dot(g, 1489, 763, 30, P.ink);
    text(g, '×', 1489, 761, 46, P.white, 'Mono', 'center');
    arrow(g, 1521, 763, 1580, 763, P.ink);
    box(1587, 723, 233, 'Output projection', P.lilac, true);
  }
  if (i === 4) {
    const step = selective[2];
    const state = cue(k, 4, 'one point four seven') ? 'h ≈ ' + fmt(step.h, 3) : 'h = ?';
    const output = cue(k, 4, 'one point seven six') ? 'Ch + Du ≈ ' + fmt(step.y, 3) : 'Ch + Du = ?';
    foot(g, 'Serial example at u = ' + step.x + ', D = 0     ·     ' + state + '     ·     ' + output);
  } else if (i === 3) {
    foot(g, 'SiLU(z) = z × sigmoid(z)    ·    softplus makes Δ positive    ·    A and D stay fixed across inputs');
  } else {
    foot(g, i === 1 ? 'The causal convolution mixes the current and earlier activations in the main lane.'
      : 'Mamba-1 reference update for one state coordinate. The next token receives the updated h.');
  }
}
function block(g, k) {
  const i = chapter(k);
  if (!i) {
    header(g, 'S4  ·  history coordinates', 'Two histories can have the same average');
    [
      [0, 1],
      [1, 0],
    ].forEach(([a, b], j) => {
      const x = 125 + j * 890,
        y = 738,
        w = 695,
        h = 344;
      label(g, j ? 'Falling history' : 'Rising history', x, 322);
      path(
        g,
        [
          [x, y - h],
          [x, y],
          [x + w, y],
        ],
        P.ink,
      );
      path(
        g,
        [
          [x, y],
          [x, y - h * a],
          [x + w, y - h * b],
          [x + w, y],
        ],
        P.sea,
        0,
        true,
      );
      path(
        g,
        [
          [x, y - h * a],
          [x + w, y - h * b],
        ],
        P.teal,
        9,
      );
      if (cue(k, 0, 'Their average heights match')) {
        g.setLineDash([16, 14]);
        path(
          g,
          [
            [x, y - h / 2],
            [x + w, y - h / 2],
          ],
          P.plum,
          3,
        );
        g.setLineDash([]);
        label(g, 'mean ½   ·   trend ' + (j ? 'negative' : 'positive'), x, y + 83);
      }
    });
    foot(
      g,
      'HiPPO initializes a structured transition to track projections of history onto polynomial modes.',
    );
    return;
  }
  if (i <= 4) {
    mambaBlock(g, k);
    return;
  }
  header(
    g,
    'Fixed S4 dynamics',
    i === 5 ? 'What does structure save?' : 'When can the same kernel serve a whole sequence?',
  );
  if (i === 5) {
    const size = 6;
    [
      [145, 'Dense transition'],
      [1030, 'Diagonal + low rank'],
    ].forEach(([x, name], j) => {
      label(g, name, x, 324);
      for (let a = 0; a < size; a++)
        for (let b = 0; b < size; b++)
          rect(g, x + b * 53, 402 + a * 53, 46, 46, !j || a === b ? P.teal : P.card, P.grid, 3);
      if (j) {
        text(g, '+', x + 366, 559, 68);
        for (let z = 0; z < size; z++) {
          rect(g, x + 468, 402 + z * 53, 45, 44, P.gold);
          rect(g, x + 535 + z * 38, 552, 32, 44, P.gold);
        }
      }
      number(g, j ? 'Structured apply' : 's × s weights', x, 798, 47);
    });
    foot(
      g,
      'Original S4 uses bilinear discretization. A diagonal structured step can cost O(s) per channel.',
    );
    return;
  }
  const nonzero = i === 7,
    initial = nonzero ? 2 : 0,
    ys = run(xs, 0.9, 0.2, initial);
  label(g, 'Convolution from zero', 98, 372);
  strip(
    g,
    hs.map((v) => fmt(v)),
    660,
    332,
    1120,
  );
  label(g, 'Propagated initial state', 98, 565);
  strip(
    g,
    xs.map((_, n) => fmt(initial * 0.9 ** (n + 1))),
    660,
    524,
    1120,
  );
  label(g, 'Recurrent outputs', 98, 765);
  strip(
    g,
    ys.map((v) => fmt(v)),
    660,
    724,
    1120,
  );
  foot(
    g,
    'Fixed coefficients, C = 1, D = 0, h₀ = ' +
      initial +
      '   ·   prepared kernel via FFT: O(L log L), plus kernel construction',
  );
}
const practicePairs = [
  [0.4, 5],
  [0.25, 2],
];
function applyPairs(v) {
  let h = 0;
  return v.map(([a, b]) => (h = a * h + b));
}
function prefix(g, k) {
  const i = chapter(k);
  if (i === 4 || i === 5) {
    header(g, 'Parallel prefix scan', 'What enters the right subtree?');
    const t = orderedPrefixTree();
    label(g, 'Left range', 255, 320);
    label(g, 'Right range', 1125, 320);
    const centers = [330, 750, 1170, 1590];
    for (let j = 0; j < 4; j++) {
      const x = centers[j],
        a = t.incoming[j];
      number(g, 'x = ' + xs[j], x, 433, 46, P.ink, 'center');
      if (cue(k, 4, 'Pass the incoming prefix')) {
        number(g, '(' + a.map((v) => fmt(v)).join(', ') + ')', x, 582, 39, P.plum, 'center');
        arrow(g, x, 626, x, 677);
      }
      if (cue(k, 4, 'Continue down')) number(g, fmt(t.outputs[j]), x, 746, 60, P.teal, 'center');
    }
    path(
      g,
      [
        [137, 373],
        [137, 351],
        [923, 351],
        [923, 373],
      ],
      P.grid,
    );
    path(
      g,
      [
        [976, 373],
        [976, 351],
        [1761, 351],
        [1761, 373],
      ],
      P.grid,
    );
    foot(
      g,
      i === 5
        ? 'Fuse the scan to reduce high-bandwidth memory traffic. Compare all prefixes with a tolerance.'
        : 'Each leaf applies its update after the incoming prefix. Start the leftmost leaf with (1, 0).',
    );
    return;
  }
  const practice = i >= 6,
    reverse = !practice && (i === 3 || cue(k, 2, 'Swap the updates'));
  const f = orderedAffineFixture(Boolean(reverse)),
    u = practice ? practicePairs : f.updates,
    results = applyPairs(u);
  const n = practice
    ? i === 6
      ? 0
      : 1 + cue(k, 7, 'The second is')
    : i === 0
      ? cue(k, 0, 'the first prefix gives two')
      : i === 1
        ? 1 + cue(k, 1, 'giving point two times two')
        : 2;
  header(
    g,
    'Inclusive scan',
    practice
      ? 'Which two states should the kernel return?'
      : 'Does swapping two updates preserve the result?',
  );
  u.forEach(([a, b], j) => {
    const x = j ? 1052 : 181,
      y = 365;
    plate(g, x, y, 694, 348, 'Position ' + (j + 1), P.card);
    number(g, 'h → ' + fmt(a) + 'h + ' + b, x + 48, y + 132, 57);
    text(g, 'prefix', x + 48, y + 267, 36, P.muted);
    number(g, n > j ? fmt(results[j]) : '?', x + 229, y + 261, 89, j ? P.plum : P.teal);
  });
  arrow(g, 897, 544, 1025, 544);
  if (!practice && i >= 2) {
    number(g, 'Composite   (' + f.pair.map((v) => fmt(v)).join(', ') + ')', 182, 804, 47, P.plum);
    if (reverse) text(g, 'Original order gave 2, then 1.4', 1060, 804, 42, P.teal);
  }
  foot(
    g,
    practice
      ? 'Start at h = 0   ·   apply left, then right'
      : 'Start at h = 0   ·   Regroup adjacent ranges in the given order.',
  );
}
const chunks = chunkStateFixture();
const phaseBits = [1, 1, 0, 1];
const bitCues = ['Feed the first one', 'Feed the second one', 'Now feed zero', 'Apply the last one'];
function phaseAngle(index, fraction) {
  const precedingOnes = phaseBits.slice(0, index).reduce((sum, bit) => sum + bit, 0);
  return Math.PI * (precedingOnes + (phaseBits[index] ?? 0) * smooth(fraction));
}
function phaseScene(g, k) {
  let index = -1, fraction = 0;
  for (const [j, phrase] of bitCues.entries()) {
    const beat = j === 3 ? 5 : 4;
    if (cue(k, beat, phrase)) {
      index = j;
      fraction = cue(k, beat, phrase, 0.9);
    }
  }
  const angle = index < 0 ? 0 : phaseAngle(index, fraction);
  header(g, 'Mamba-3  ·  one complex coordinate', chapter(k) === 5
    ? 'What does the final direction tell us?'
    : 'Where will the next bit point the arrow?');
  const x = 548, y = 579, radius = 207;
  path(g, [[x - radius - 42, y], [x + radius + 42, y]], P.grid, 3);
  path(g, [[x, y - radius - 17], [x, y + radius + 17]], P.grid, 3);
  g.beginPath();
  g.arc(x, y, radius, 0, Math.PI * 2);
  g.strokeStyle = P.grid;
  g.lineWidth = 4;
  g.stroke();
  const tipX = x + radius * Math.cos(angle), tipY = y - radius * Math.sin(angle);
  arrow(g, x, y, tipX, tipY);
  dot(g, x, y, 10, P.ink);
  label(g, 'Odd', x - radius - 64, y, 'right');
  label(g, 'Even', x + radius + 64, y);
  label(g, 'Input bits', 1030, 362);
  strip(g, phaseBits, 1030, 408, 720, index);
  text(g, '1   Rotate half a turn', 1030, 595, 52, P.teal, 'Serif');
  text(g, '0   Hold direction', 1030, 694, 52, P.ink, 'Serif');
  const status = index < 0 ? 'Start with zero ones.' : 'Reading bit ' + (index + 1) + ' of 4';
  foot(g, cue(k, 5, 'The direction of this single pointer')
    ? 'Three ones in the stream. The pointer faces left for an odd count.'
    : status + '     ·     From the current direction, apply the rule for each bit in order.');
}
const mimo = multiDirectionFixture();
const vectorText = (v) => '[' + v.join(', ').replaceAll('-', '−') + ']';
function directionScene(g, k) {
  const first = cue(k, 6, 'The first input writes');
  const second = cue(k, 6, 'The second input writes');
  const summed = cue(k, 6, 'two and three');
  const read1 = cue(k, 6, 'One read adds');
  const read2 = cue(k, 6, 'A second read');
  const answers = [cue(k, 7, 'five'), cue(k, 7, 'minus one')];
  header(g, 'Mamba-3  ·  multiple inputs and outputs', 'What can two reads recover from one update?');
  const x = 248, y = 742, unit = 106;
  const [dx, dy] = mimo.state;
  const right = x + unit * dx, top = y - unit * dy;
  for (let col = 0; col <= dx; col++)
    path(g, [[x + col * unit, top - 30], [x + col * unit, y + 16]], P.grid, 2);
  for (let row = 0; row <= dy; row++)
    path(g, [[x - 18, y - row * unit], [right + 58, y - row * unit]], P.grid, 2);
  label(g, 'Writes from a zero state', 138, 320);
  dot(g, x, y, 7, P.ink);
  label(g, 'Start', x - 32, y, 'right');
  if (first) {
    arrow(g, x, y, right, y, P.teal);
    number(g, mimo.inputs[0] + ' × [1, 0]', (x + right) / 2, y + 58, 36, P.teal, 'center');
  }
  if (second) {
    arrow(g, right, y, right, top, P.rust);
    number(g, mimo.inputs[1] + ' × [0, 1]', right + 30, (y + top) / 2, 35, P.rust);
  }
  if (summed) {
    dot(g, right, top, 12, P.plum);
    number(g, vectorText(mimo.state), right + 24, top - 26, 42, P.plum);
  }
  label(g, 'One head  ·  one step', 851, 320);
  number(g, (first ? vectorText(mimo.writes[0]) : '[?, ?]') + ' + ' +
    (second ? vectorText(mimo.writes[1]) : '[?, ?]') + ' = ' +
    (summed ? vectorText(mimo.state) : '?'), 851, 430, 48);
  [read1, read2].forEach((ready, j) => {
    if (!ready) return;
    const yy = 578 + j * 136;
    label(g, j ? 'Difference' : 'Sum', 851, yy);
    number(g, vectorText(mimo.directions[j]) + ' · ' + vectorText(mimo.state) + ' = ' +
      (answers[j] ? String(mimo.outputs[j]).replace('-', '−') : '?'), 851, yy + 61, 55, P.plum);
  });
  let note = 'Two input directions contribute to the same state in a single update.';
  if (cue(k, 7, 'Both reads use')) note = 'Both reads use the same two coordinates.';
  if (cue(k, 7, 'To measure tokens per second')) note += ' Measure generation speed in tokens per second.';
  foot(g, note);
}
function ssd(g, k) {
  const i = chapter(k);
  if (i === 0) {
    header(
      g,
      'Mamba-2  ·  state space duality',
      'What connects an earlier input to a later output?',
    );
    const side = 107,
      x = 220,
      y = 360;
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < 4; col++) {
        const active = row >= col,
          across = row >= 2 && col < 2,
          v = 0.2 * 0.9 ** (row - col);
        rect(
          g,
          x + col * side,
          y + row * side,
          side - 7,
          side - 7,
          active ? (across ? P.gold : P.sea) : P.card,
          P.grid,
        );
        if (active)
          number(
            g,
            fmt(v, 3),
            x + (col + 0.5) * side - 4,
            y + (row + 0.5) * side,
            29,
            P.ink,
            'center',
          );
      }
    label(g, 'Input position →', x, y - 45);
    label(g, 'Later output ↓', x, y + 4 * side + 40);
    label(g, 'One head, scalar × identity transition', 870, 333);
    text(g, 'Write at j', 870, 450, 60, P.teal, 'Serif');
    text(g, '× decays between j and i', 870, 578, 58, P.rust, 'Serif');
    text(g, '× read at i', 870, 706, 60, P.plum, 'Serif');
    foot(
      g,
      'Toy weights   ·   B = 0.2, carry = 0.9, C = 1   ·   the lower-left block shares a state boundary.',
    );
    return;
  }
  if (i === 1) {
    const add = cue(k, 1, 'Pass that boundary');
    header(g, 'Batched local products', 'What must the right chunk receive?');
    chunks.forEach((ch, j) => {
      const x = 96 + j * 882;
      plate(g, x, 318, 846, 478, 'Chunk ' + (j + 1) + '   ·   inputs ' + ch.inputs.join(', '));
      for (let n = 0; n < 2; n++) {
        const y = 459 + n * 152,
          v = ch.local[n],
          extra = j && add ? ch.boundary[n] : 0;
        rect(g, x + 45, y, 360 * v, 44, P.teal);
        if (extra) rect(g, x + 45 + 360 * v, y, 360 * extra, 44, P.gold);
        number(
          g,
          extra ? fmt(v) + ' + ' + fmt(extra) + ' = ' + fmt(v + extra) : 'Local  ' + fmt(v),
          x + 44,
          y + 93,
          41,
        );
      }
    });
    if (add) {
      text(g, '0.74 →', 947, 284, 38, P.rust, 'Mono', 'center');
    }
    foot(
      g,
      'Teal is the local output from zero. Gold carries the incoming state through the right chunk.',
    );
    return;
  }
  if (i === 2) {
    const length = 16384 + cue(k, 2, 'One extra input'),
      count = Math.ceil(length / 256);
    header(g, 'Chunk width 256', 'How many chunks does the longer input need?');
    for (let j = 0; j < count; j++)
      rect(
        g,
        120 + (j % 13) * 84,
        366 + Math.floor(j / 13) * 86,
        70,
        68,
        j === 64 ? P.gold : P.teal,
        null,
        6,
      );
    label(g, 'Input positions', 1330, 387);
    number(g, length.toLocaleString('en-US'), 1330, 474, 82);
    label(g, 'Chunks', 1330, 607);
    number(g, count, 1330, 699, 102, P.rust);
    foot(
      g,
      'Each full tile holds 256 positions. The last tile opens as soon as the next input arrives.',
    );
    return;
  }
  if (i === 3) {
    const w = cue(k, 3, 'At one half') ? 0.5 : 1,
      ex = trapezoidWriteFixture(w);
    header(
      g,
      'Mamba-3  ·  exponential-trapezoidal update',
      'Which endpoints contribute to this write?',
    );
    const terms = [
      ['Old state carried', ex.carry, P.teal],
      ['Previous endpoint', ex.previous, P.gold],
      ['Current endpoint', ex.current, P.plum],
    ];
    terms.forEach(([name, v, c], j) => {
      const y = 343 + j * 154;
      label(g, name, 100, y + 46);
      bar(g, 600, y + 10, 710, 67, v, 1, c);
      number(g, fmt(v, 3), 1380, y + 44, 62);
    });
    number(g, 'λ = ' + fmt(w) + '     h ≈ ' + fmt(ex.output, 3), 99, 820, 49);
    foot(
      g,
      'Unit step, A = −1, old h = 1. Endpoint writes are 2 then 1. Previous weight is (1 − λ) exp(−1).',
    );
    return;
  }
  if (i <= 5) phaseScene(g, k);
  else directionScene(g, k);
}
const resume = bufferFixture();
const filterWeights = [0.2, 0.3, 0.5];
const memoryFor = (positions) => ({
  copies: Math.floor(positions / 1024),
  total: 5 * (1 + Math.floor(positions / 1024)),
});
function snapshot(g, k) {
  const i = chapter(k),
    positions = i === 1 && cue(k, 1, 'Sixty-five thousand') ? 65536 : 8192;
  const { copies, total } = memoryFor(positions),
    count = i === 1 ? copies : 0;
  header(g, 'Checkpoint policy  ·  one request', 'What grows when the live state stays fixed?');
  label(g, 'Live buffers', 104, 321);
  rect(g, 111, 423, 225, 225, P.teal, null, 14);
  number(g, '5', 224, 510, 93, P.white, 'center');
  text(g, 'MiB', 223, 596, 42, P.white, 'Sans', 'center');
  label(g, 'Saved copies   ·   one per 1,024 processed positions', 489, 321);
  for (let j = 0; j < count; j++) {
    const x = 500 + (j % 16) * 72,
      y = 394 + Math.floor(j / 16) * 87;
    rect(g, x + 5, y + 6, 56, 66, P.grid, null, 3);
    rect(g, x, y, 56, 66, P.sea, P.teal, 3);
  }
  if (i === 1) {
    number(g, count + ' copies + 1 live = ' + total + ' MiB', 497, 805, 51, P.teal);
  } else {
    text(g, 'Save a copy at each interval', 497, 525, 60, P.muted, 'Serif');
  }
  foot(
    g,
    i === 1
      ? positions.toLocaleString('en-US') + ' positions   ·   each complete copy costs 5 MiB'
      : 'A separate snapshot preserves an earlier state while the live request continues.',
  );
}
function resumeRows(stage) {
  return [false, true].map((dropped) => {
    const trace = dropped ? resume.dropped : resume.restored;
    const pre = stage < 2 ? resume.prefix : trace[0];
    const end =
      stage === 0
        ? { ...resume.prefix, buffer: dropped ? [0, 0, 0] : resume.prefix.buffer, write: null }
        : trace[stage - 1];
    return { ...end, old: pre.state, carry: pre.state / 2 };
  });
}
function filterTerms(buffer) {
  return buffer.map((value, tap) => value * filterWeights[tap]);
}
function afterSpoken(k, phrase) {
  const { start, end } = k.wordCue(phrase);
  return k.reveal(phrase, end - start, { captionStart: phrase }) === 1;
}
function resumeWindow(g, x, y, width, buffer, { newest, shift, active, showTerms }) {
  const slot = width / filterWeights.length;
  if (shift > 0 && shift < 1) {
    g.save();
    g.beginPath();
    g.rect(x, y - 3, width, 91);
    g.clip();
    [...buffer, newest].forEach((value, tap) => {
      const left = x + (tap - shift) * slot;
      const center = left + slot / 2 - 4;
      const visibleValue = center >= x + 25 && center <= x + width - 25 ? value : '';
      strip(g, [visibleValue], left, y, slot, tap === buffer.length ? 0 : -1);
    });
    g.restore();
  } else {
    strip(g, buffer, x, y, width, active ? buffer.length - 1 : -1);
  }
  const terms = filterTerms(buffer);
  filterWeights.forEach((weight, tap) => {
    const center = x + (tap + 0.5) * slot - 4;
    label(g, '× ' + weight, center, y + 111, 'center');
    if (showTerms) {
      const fill = tap === buffer.length - 1 ? P.pink : P.gold;
      rect(g, center - 61, y + 136, 122, 48, terms[tap] ? fill : P.card, P.grid, 5);
      number(g, fmt(terms[tap]), center, y + 160, 42, P.ink, 'center');
    }
  });
}
function restart(g, k) {
  const i = chapter(k);
  const previousStage = i === 5 ? 1 : 0;
  const newest = resume.restored[previousStage].buffer.at(-1);
  const shift = smooth(i === 5 ? cue(k, 5, 'two', 0.85) : cue(k, 4, 'Shift four', 0.85));
  const shifting = shift > 0 && shift < 1;
  const stage = previousStage + Number(shift === 1);
  const rows = resumeRows(stage);
  const compareWrites = i === 4 && afterSpoken(k, 'two point nine and two');
  const compareCarry = i === 4 && afterSpoken(k, 'one point zero seven five');
  const compareStates =
    i === 4 && afterSpoken(k, 'three point nine seven five and three point zero seven five');
  const showWrite = stage > 0 && !shifting && (i === 5 || compareWrites);
  const showCarry = stage > 0 && !shifting && (i === 5 || compareCarry);
  const showTerms =
    stage > 0 && !shifting && (i === 5 || afterSpoken(k, 'point two, point three and point five'));
  const showState =
    i === 5
      ? [
          afterSpoken(k, 'four point three eight seven five'),
          afterSpoken(k, 'three point seven three seven five'),
        ].map((spoken) => shift === 0 || (shift === 1 && spoken))
      : [compareStates, compareStates];
  const inputKnown = i < 5 ? cue(k, 3, 'Four is next') : cue(k, 5, 'two');
  const suffix = resume.restored.map(({ buffer }) => buffer.at(-1));
  const writeX = 1260;
  const writeScale = 180;
  header(
    g,
    'Stream restart  ·  both restored h = ' + fmt(resume.prefix.state),
    'Which inputs contribute to the next state?',
  );
  label(g, 'Window  ·  oldest to newest', 388, 331);
  label(g, 'Carried state', 984, 331);
  label(g, 'Filter write', writeX, 331);
  label(g, 'New state', 1583, 331);
  rows.forEach((v, j) => {
    const y = 390 + j * 216;
    text(g, j ? 'Take B' : 'Take A', 96, y + 37, 52, P.ink, 'Serif');
    text(g, j ? 'history reset' : 'history restored', 96, y + 105, 32, P.muted);
    resumeWindow(g, 390, y, 533, v.buffer, { newest, shift, active: stage > 0, showTerms });
    const carry = shifting ? '…' : showCarry ? fmt(v.carry) : '½ × ' + fmt(v.old);
    number(g, carry, 984, y + 48, 47, P.teal);
    number(g, showWrite ? fmt(v.write) : '?', writeX, y + 48, 50, P.rust);
    number(g, showState[j] ? fmt(v.state) : '?', 1583, y + 48, 54, P.plum);
    if (showWrite) {
      let nextX = writeX;
      const [oldest, middle, current] = filterTerms(v.buffer);
      rect(g, writeX, y + 105, 3 * writeScale, 38, P.card, P.grid, 4);
      for (const [term, color] of [
        [current, P.pink],
        [oldest, P.gold],
        [middle, P.gold],
      ]) {
        const width = term * writeScale;
        if (width <= 0) continue;
        rect(g, nextX, y + 105, width, 38, color, P.card, 2);
        nextX += width;
      }
    }
  });
  let status = '';
  if (inputKnown && shift < 1) status = 'Both takes receive ' + newest + ' next.';
  if (stage === 1 && showWrite)
    status = 'Earlier inputs add ' + fmt(rows[0].write - rows[1].write) + ' to the write in Take A.';
  if (stage === 2)
    status = showState[0]
      ? 'Take A matches uninterrupted processing of 3, 1, ' + suffix.join(', ') + '.'
      : 'Both takes have now received ' + suffix.join(', then ') + '.';
  if (status) text(g, status, 95, 841, 41, P.ink);
  foot(
    g,
    showWrite
      ? 'Pink shows the newest input. Gold shows earlier inputs. New state = carried state + write.'
      : 'Multiply each window value by its weight. Add those products to get the filter write.',
  );
}
function bufferScene(g, k) {
  const i = chapter(k);
  if (i < 2) {
    snapshot(g, k);
    return;
  }
  if (i > 5) {
    const s =
      i === 6
        ? cue(k, 6, 'Accepted provisional') + cue(k, 6, 'Rejected seventy-seven')
        : 2 +
          cue(k, 7, 'Restore the accepted') +
          cue(k, 7, 'to get twenty-seven') +
          cue(k, 7, 'Continuing from rejected');
    header(
      g,
      'Rollback  ·  return to the accepted boundary',
      'Can deleting a rejected token repair the state?',
    );
    branch(g, s);
    foot(
      g,
      'A zero carry destroys the previous value. Dividing by a tiny carry magnifies rounding error.',
    );
    return;
  }
  if (i === 2) {
    header(g, 'Width-three causal filter', 'What must travel with the request?');
    label(g, 'Prefix already processed', 120, 342);
    strip(g, [3, 1], 127, 398, 540);
    label(g, 'Convolution history', 120, 599);
    strip(g, resume.prefix.buffer, 127, 661, 765);
    plate(g, 1060, 391, 680, 360, 'Recurrent state');
    number(g, fmt(resume.prefix.state), 1400, 596, 110, P.teal, 'center');
    foot(
      g,
      'Save history and state under the same request ID. Restore the pair if the batch order changes.',
    );
    return;
  }
  restart(g, k);
}
const regimes = [
  { name: 'Original worksheet', prefill: [120, 150], step: [3.2, 1.8] },
  { name: 'Practice worksheet', prefill: [80, 125], step: [3, 1.6] },
];
function timing(n, r) {
  return r.prefill.map((p, j) => p + (n - 1) * r.step[j]);
}
function timeRace(g, r, n, answer, cross = false) {
  const values = timing(n, r),
    x = 477,
    scale = n === 16 ? 4.5 : 1.06;
  header(
    g,
    'Hypothetical serving times  ·  ' + r.name,
    'Which reader finishes ' + n + ' output tokens first?',
  );
  label(g, 'Prefill already produced token 1', 90, 315);
  ['Attention', 'SSM'].forEach((s, j) => {
    const y = 408 + j * 202;
    text(g, s, 93, y + 32, 55, P.ink, 'Serif');
    const w = r.prefill[j] * scale,
      total = values[j] * scale;
    rect(g, x, y, w, 69, P.teal, null, 3);
    if (answer) rect(g, x + w, y, total - w, 69, P.gold, null, 3);
    number(g, answer ? fmt(values[j]) + ' ms' : '?', x + (answer ? total : w) + 33, y + 34, 55);
    number(g, r.prefill[j] + ' + ' + (n - 1) + ' × ' + r.step[j] + ' ms', x, y + 119, 39, P.muted);
  });
  if (n === 256) {
    const short = timing(16, r);
    label(
      g,
      '16 outputs: ' +
        short.join(' / ') +
        ' ms' +
        (cross ? '     ·     crossing at 22.43 outputs, first integer SSM win at 23' : ''),
      92,
      835,
    );
  }
  foot(
    g,
    'Teal is startup. Gold is continuation. Compare totals on the same scale within this request.',
  );
}
function layerCount(g, k) {
  const i = chapter(k),
    recipes = i >= 7;
  if (recipes) {
    header(g, 'Hybrid architectures', 'What does one layer count include?');
    const y1 = 429,
      y2 = 687;
    label(g, 'Jamba v0.1    ·    mixer paired with an MLP', 92, 338);
    for (let j = 0; j < 8; j++) {
      const x = 102 + j * 178;
      rect(g, x, y1, 153, 65, j === 0 ? P.plum : P.teal, null, 4);
      rect(g, x, y1 + 68, 153, 35, P.gold, null, 4);
    }
    label(g, '1 attention + 7 Mamba mixers, each paired with a feed-forward block', 95, 581);
    if (cue(k, 7, 'Nemotron')) {
      label(g, 'Nemotron-H 8B    ·    counted sublayers', 92, 642);
      for (let j = 0; j < 52; j++)
        rect(g, 102 + j * 32, y2, 27, 72, j < 4 ? P.plum : j < 28 ? P.teal : P.gold, null, 3);
      label(g, '4 attention    +    24 Mamba-2    +    24 feed-forward', 94, 826);
    }
    foot(
      g,
      i === 8
        ? 'Counts are grouped by type. Identify a delta-rule layer by its update and buffers.'
        : 'Counts are grouped by type. MoE routing occurs inside selected Jamba feed-forward blocks.',
    );
    return;
  }
  const n = i === 5 && !cue(k, 5, 'keeping four attention') ? 32 : 4;
  const c = cacheWorksheet(n);
  header(g, 'One request  ·  65,536 positions', 'Which layers keep a key and value per position?');
  for (let j = 0; j < 32; j++) {
    const x = 100 + j * 52;
    rect(g, x, 422, 44, 143, j < n ? P.plum : P.teal, null, 4);
    if (j < n)
      for (let z = 0; z < 4; z++)
        path(
          g,
          [
            [x + 7, 451 + 22 * z],
            [x + 37, 451 + 22 * z],
          ],
          P.lilac,
          4,
        );
    else dot(g, x + 22, 493, 8, P.sea);
  }
  label(g, 'Counts grouped by mixer type', 99, 351);
  number(g, n + ' attention', 101, 663, 65, P.plum);
  number(g, c.kvGiB + ' GiB KV', 101, 768, 65, P.plum);
  number(g, 32 - n + ' recurrent', 958, 663, 65, P.teal);
  number(g, fmt(c.stateMiB) + ' MiB live buffers', 958, 768, 51, P.teal);
  foot(g, 'Matching KV shapes and precision   ·   every token traverses the same fixed stack');
}
function trial(g, k) {
  const i = chapter(k);
  if (i < 4) {
    const n = i < 2 ? 16 : 256,
      answer =
        i === 1 ? cue(k, 1, 'attention totals') : i === 3 ? cue(k, 3, 'The totals become') : false;
    timeRace(g, regimes[0], n, answer, i === 3 && cue(k, 3, 'The crossing'));
    return;
  }
  if (i === 4) {
    header(g, 'Exact identifier retrieval', 'Where can a trained reader lose the field?');
    const y = 555,
      x = 132,
      w = 1646;
    for (let j = 0; j < 55; j++) rect(g, x + j * 30, y, 21, 89, '#d4dace', null, 2);
    for (const [j, name] of [
      [3, 'Early'],
      [26, 'Middle'],
      [49, 'Late'],
    ]) {
      rect(g, x + j * 30, y - 15, 23, 119, P.gold);
      text(g, name, x + j * 30, y - 83, 47, P.ink, 'Serif', 'center');
    }
    text(g, 'max_retries', x, y + 185, 51, P.teal, 'Mono');
    text(g, 'Which value is current?', x + w, y + 185, 51, P.ink, 'Serif', 'right');
    foot(
      g,
      'Repeat the same question across lengths and positions, with distractors and multiple required fields.',
    );
    return;
  }
  if (i < 9) {
    layerCount(g, k);
    return;
  }
  if (i === 9) {
    header(g, 'Transfer  ·  timing worksheet', 'Which output length pays back the slower startup?');
    const r = regimes[1];
    ['Attention', 'SSM'].forEach((s, j) => {
      const y = 375 + j * 192;
      label(g, s, 106, y + 45);
      for (const [col, n] of [16, 256].entries()) {
        const x = 514 + col * 684;
        label(g, n + ' outputs', x, y);
        number(g, r.prefill[j] + ' + ' + (n - 1) + ' × ' + r.step[j] + ' = ?', x, y + 78, 46);
      }
    });
    foot(
      g,
      'Compute each total in milliseconds. The prompt pass already produced the first output token.',
    );
    return;
  }
  const longer = i === 10 && cue(k, 10, 'The long one');
  timeRace(g, regimes[1], longer ? 256 : 16, i === 10);
}
function candidates(g, verdict) {
  header(
    g,
    'One request at 65,536 positions',
    'Which live cache keeps token access within 24 GiB?',
  );
  const x = 540,
    s = 32,
    y = 389;
  const rows = [
    [32, 'Full attention'],
    [4, 'Hybrid'],
    [0, 'Pure SSM'],
  ];
  rows.forEach(([n, name], j) => {
    const c = cacheWorksheet(n),
      yy = y + j * 149;
    if (verdict && n === 4) rect(g, 83, yy - 16, 1180, 147, P.sea, null, 8);
    text(g, name, 100, yy + 32, 48, P.ink, 'Serif');
    if (n) {
      rect(g, x, yy, c.kvGiB * s, 64, P.plum);
      number(g, c.kvGiB + ' GiB KV', x + c.kvGiB * s + 21, yy + 31, 42);
    }
    if (n === 0 || n === 4)
      text(
        g,
        (n ? '+ ' : '') + fmt(c.stateMiB) + ' MiB recurrent',
        x,
        yy + (n ? 99 : 35),
        39,
        P.teal,
      );
  });
  g.setLineDash([12, 10]);
  path(
    g,
    [
      [x + 24 * s, 351],
      [x + 24 * s, 788],
    ],
    P.rust,
    4,
  );
  g.setLineDash([]);
  label(g, '24 GiB', x + 24 * s, 311, 'center', P.rust);
  foot(
    g,
    verdict
      ? 'Benchmark the hybrid and trained SSM on exact lookup. Include weights, snapshots and workspace.'
      : 'Cache payload only. The device also needs weights, workspace and any saved checkpoints.',
  );
}
function final(g, k) {
  const i = chapter(k);
  if (i < 2) {
    const returned = cue(k, 1, 'Both files return two'),
      graded = cue(k, 1, 'Only D matches');
    header(
      g,
      'Transfer  ·  scalar reader starts at zero',
      'Which file gets the right retry limit?',
    );
    lookupCases.forEach((f, j) => {
      const x = 94 + j * 938;
      filePage(
        g,
        x,
        j ? 'service-d.cfg' : 'service-c.cfg',
        [
          ['max_retries', f.retries],
          ['timeout_s', f.timeout],
        ],
        0,
      );
      const ans = returned ? fmt(f.returned) : '?';
      number(g, 'Returned  ' + ans, x, 819, 47);
      if (graded)
        text(
          g,
          f.exact ? 'Match' : 'Miss',
          x + 718,
          818,
          52,
          f.exact ? P.teal : P.rust,
          'Serif',
          'right',
        );
    });
    foot(g, 'Read retry limit, then timeout   ·   h ← (h + input) / 2   ·   return h');
    return;
  }
  if (i < 4) {
    candidates(g, i === 3);
    return;
  }
  const amend = cue(k, 4, 'Now amend'),
    distract = cue(k, 4, 'then add a timeout'),
    answer = cue(k, 5, 'Two retries');
  header(
    g,
    'Exact-answer test  ·  latest configuration',
    'How many retries does this specification allow?',
  );
  const x = 112,
    yy = 387,
    width = 1622;
  const p =
    0.08 + 0.36 * smooth(cue(k, 4, 'to middle', 0.65)) + 0.34 * smooth(cue(k, 4, 'to late', 0.65));
  path(
    g,
    [
      [x, yy],
      [x + width, yy],
    ],
    P.grid,
    9,
  );
  dot(g, x + p * width, yy, 17, P.teal);
  dot(g, x + width, yy, 17, P.plum);
  label(g, 'Original setting', x + p * width, yy - 64, 'center');
  label(g, 'Question', x + width, yy + 66, 'center');
  const count = 1 + amend + distract;
  for (let n = 0; n < count; n++) {
    const e = amendedSpec[n],
      y = 515 + n * 103;
    if (n === 1 && answer) rect(g, 106, y - 41, 1667, 83, P.sea, null, 5);
    label(g, ['First setting', 'Amendment', 'Timeout'][n], 140, y);
    number(g, e.field + ' = ' + e.value, 660, y, 52);
    if (n === 1 && answer) text(g, 'Current limit', 1440, y, 42, P.teal);
  }
  number(
    g,
    'Expected answer   ' + (answer ? latestRetryLimit(amendedSpec) + ' retries' : '?'),
    105,
    834,
    49,
    P.plum,
  );
  foot(
    g,
    answer
      ? 'Score exact answers first. Then compare peak memory and latency with real requests in flight.'
      : 'Use the same question and decoding settings for both candidates.',
  );
}
const painters = [
  opening,
  stateAssembly,
  kernel,
  delta,
  choose,
  scan,
  collision,
  rollback,
  held,
  block,
  prefix,
  ssd,
  bufferScene,
  trial,
  final,
];
function draw(g, k) {
  painters[k.beat.chapterIndex](g, k);
}
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, fmt(a, 8) + ' differs from ' + fmt(b, 8));
function check() {
  assert.deepEqual(
    openingFiles.map((f) => [f.retries, f.timeout, f.returned]),
    [
      [3, 1, 1.25],
      [1, 2, 1.25],
    ],
  );
  hs.forEach((v, j) => {
    near(v, [0.6, 0.74, 1.466, 1.7194][j]);
    near(v, 0.9 * (hs[j - 1] ?? 0) + 0.2 * xs[j]);
  });
  for (const [n, doubledOutput] of [[2, 1.48], [4, 3.4388]]) {
    const fixed = contentWriteFixture(xs.slice(0, n), 0);
    near(fixed.output, hs[n - 1]);
    near(fixed.contributions.reduce((sum, term) => sum + 2 * term, 0), doubledOutput);
    near(2 * hs[n - 1], doubledOutput);
  }
  for (const n of [2, 4])
    for (const q of [0, 0.5, 1]) {
      const f = contentWriteFixture(xs.slice(0, n), 0.3 * q);
      near(
        f.contributions.reduce((a, b) => a + b),
        f.output,
      );
      if (n === 4) {
        near(f.output, 1.7194 + 1.08 * q);
        near(f.contributions[2], 0.72 + 1.08 * q);
      }
    }
  for (const d of [0.1, 1, 2]) {
    near(-Math.expm1(-d), 1 - Math.exp(-d));
    assert(1 - Math.exp(-d) < d);
  }
  selective.forEach((v, j) => {
    near(v.a, Math.exp(-v.delta));
    near(v.write, v.delta * 0.1 * v.x * v.x);
    near(v.h, v.a * (selective[j - 1]?.h ?? 0) + v.write);
    near(v.y, v.c * v.h);
  });
  near(selective[2].write, 1.277022191010547);
  assert(selective[2].a < selective[1].a);
  orderedPrefixTree().outputs.forEach((h, j) => near(h, hs[j]));
  fish.check();
  assert.deepEqual(half(xs), [1.5, 1.25, 2.625, 2.3125]);
  assert.deepEqual(half([1, 2, 4, 2]).slice(1), half(xs).slice(1));
  assert.deepEqual(
    [accepted, rejected, corrected, contaminated],
    [50.125, 63.5625, 27.0625, 33.78125],
  );
  assert.deepEqual(half(averagePractice), [1, 4, 5, 3]);
  run(xs, 0.9, 0.2, 2).forEach((v, j) => near(v, hs[j] + 2 * 0.9 ** (j + 1)));
  assert.deepEqual(orderedAffineFixture().states, [2, 1.4]);
  assert.deepEqual(orderedAffineFixture(true).states, [1, 2.5]);
  assert.deepEqual(applyPairs(practicePairs), [5, 3.25]);
  near(compose(practicePairs[1], practicePairs[0])[1], 3.25);
  chunks.forEach((c, j) =>
    c.outputs.forEach((v, n) => {
      near(v, hs[j * 2 + n]);
      near(v, c.local[n] + c.boundary[n]);
    }),
  );
  assert.deepEqual(
    [16384, 16385].map((n) => Math.ceil(n / 256)),
    [64, 65],
  );
  assert.equal(trapezoidWriteFixture(1).previous, 0);
  near(trapezoidWriteFixture(0.5).previous, Math.exp(-1));
  near(selective[2].a * selective[1].h + selective[2].write, selective[2].h);
  assert.deepEqual([fmt(selective[2].h, 3), fmt(selective[2].y, 3)], ['1.47', '1.764']);
  for (const [j, turns] of [1, 2, 2, 3].entries()) {
    near(phaseAngle(j, 1), turns * Math.PI);
    near(phaseAngle(j, 0), (turns - phaseBits[j]) * Math.PI);
    near(phaseAngle(j, 0.5), (turns - phaseBits[j] / 2) * Math.PI);
  }
  assert.deepEqual(mimo.writes, [[2, 0], [0, 3]]);
  assert.deepEqual(mimo.state, [2, 3]);
  assert.deepEqual(mimo.directions, [[1, 1], [1, -1]]);
  assert.deepEqual(mimo.outputs, [5, -1]);
  assert.deepEqual([8192, 65536].map(memoryFor), [
    { copies: 8, total: 45 },
    { copies: 64, total: 325 },
  ]);
  [
    [
      [[0, 3, 1], null, 2.15],
      [[0, 0, 0], null, 2.15],
    ],
    [
      [[3, 1, 4], 2.9, 3.975],
      [[0, 0, 4], 2, 3.075],
    ],
    [
      [[1, 4, 2], 2.4, 4.3875],
      [[0, 4, 2], 2.2, 3.7375],
    ],
  ].forEach((expected, s) =>
    resumeRows(s).forEach((v, j) => {
      const [buf, w, h] = expected[j];
      assert.deepEqual(v.buffer, buf);
      near(v.state, h);
      if (s) {
        near(v.write, w);
        near(
          v.write,
        filterTerms(buf).reduce((sum, term) => sum + term, 0),
        );
        near(v.carry + w, h);
      }
    }),
  );
  const [restored, reset] = resumeRows(1);
  const [oldest, middle, newest] = filterTerms(restored.buffer);
  near(newest, filterTerms(reset.buffer).at(-1));
  near(oldest + middle, restored.write - reset.write);
  near(restored.carry, reset.carry);
  near(restored.write - reset.write, restored.state - reset.state);
  near(resumeRows(2)[0].state, resume.uninterrupted.state);
  assert.deepEqual(
    [
      timing(16, regimes[0]),
      timing(256, regimes[0]),
      timing(16, regimes[1]),
      timing(256, regimes[1]),
    ],
    [
      [168, 177],
      [936, 609],
      [125, 149],
      [845, 533],
    ],
  );
  assert.equal(Math.ceil(timingFixture(16).crossing), 23);
  assert.deepEqual(
    lookupCases.map((f) => [f.retries, f.timeout, f.returned, f.exact]),
    [
      [6, 1, 2, false],
      [2, 3, 2, true],
    ],
  );
  assert.deepEqual([32, 4, 0].map(cacheWorksheet), [
    { kvGiB: 32, stateMiB: 0 },
    { kvGiB: 4, stateMiB: 4.375 },
    { kvGiB: 0, stateMiB: 5 },
  ]);
  assert.equal(latestRetryLimit(amendedSpec), 2);
}
export default { title: 'A Moving Memory for Long Sequences', draw, check };

import {
  adapterMergeExample,
  dareMaskExample,
  independentDropOutcomes,
} from '../../../films/model-merging/fixtures.mjs';
import {
  tasks,
  taskRows,
  trimmedRows,
  electedColumn,
} from '../../../films/model-merging/decisions.mjs';
import {
  ink,
  paper,
  muted,
  rule,
  code,
  math,
  chat,
  gold,
  colors,
  white,
  dark,
  pale,
  pink,
  mix,
  cue,
  text,
  mono,
  title,
  rect,
  box,
  line,
  dash,
  dot,
  arrow,
  heading,
  number,
  signed,
  grid,
} from './drawing.mjs';

export function weightSteps(base, ends, coeffs) {
  const steps = ends.map((v, i) => (v - base) * coeffs[i]);
  const direct = ends.reduce((a, v, i) => a + v * coeffs[i], 0);
  return {
    base,
    ends,
    coeffs,
    steps,
    direct,
    first: base + steps[0],
    result: base + steps[0] + steps[1],
    correction: (1 - coeffs[0] - coeffs[1]) * base,
  };
}
export const originalWeight = weightSteps(2, [2.4, 1.8], [0.7, 0.5]),
  practiceWeight = weightSteps(2, [2.5, 1.5], [0.6, 0.4]);
export function scalar(c, k, practice = false) {
  const f = practice ? practiceWeight : originalWeight;
  const subtract = !practice && k.beat.beatIndex === 4;
  if (subtract) {
    title(
      c,
      'Reverse a complete task vector',
      'Apply a coefficient of −1 to the Code change from the same base.',
    );
    const X = (v) => 230 + (v - 1.5) * 1450,
      y = 589;
    const move = cue(k, 4, 'moves four tenths', 0.95),
      v = f.base + (f.base - f.ends[0]) * move;
    line(c, X(1.5), y, X(2.5), y, rule, 5);
    [1.6, 1.8, 2, 2.2, 2.4].forEach((w) => {
      line(c, X(w), y - 13, X(w), y + 18, muted);
      mono(c, w.toFixed(1), X(w), y + 61, 36, muted, 'center');
    });
    arrow(c, X(f.base), y - 72, X(f.ends[0]), y - 72, code, 8);
    text(c, 'Code change  +0.4', X(2.2), y - 133, 40, code, 'center');
    if (move) arrow(c, X(f.base), y - 72, X(v), y - 72, math, 8);
    dot(c, X(v), y, 19, math);
    mono(c, number(v), X(v), y - 210, 61, math, 'center');
    if (move === 1) text(c, '2.0 − (2.4 − 2.0) = 1.6', 106, 842, 55, ink, 'left', 'Serif');
    return;
  }
  title(
    c,
    practice ? 'Which weight will this recipe save?' : 'Count the base exactly once',
    'Start at 2.0 and apply a fraction of each signed change.',
  );
  const X = (w) => 151 + (w - 1.4) * 1155,
    y = 629;
  line(c, X(1.4), y, X(2.8), y, ink, 4);
  for (let i = 14; i <= 28; i++) {
    const x = X(i / 10);
    line(c, x, y - 12, x, y + 16, muted, 3);
    if (i % 2 === 0) mono(c, (i / 10).toFixed(1), x, y + 51, 29, muted, 'center');
  }
  ['Code', 'Math'].forEach((s, i) => {
    const x = 110 + i * 836;
    heading(c, s + ' change', x, 300, colors[i]);
    mono(
      c,
      number(f.coeffs[i]) + ' × (' + number(f.ends[i]) + ' − ' + number(f.base) + ')',
      x,
      378,
      56,
      colors[i],
    );
  });
  const p = cue(k, 1, practice ? 'three tenths of a step right' : 'Code adds', 0.65);
  const q = cue(k, 1, practice ? 'two tenths left' : 'Math takes away', 0.65);
  const right = mix(f.base, f.first, p),
    v = mix(right, f.result, q);
  if (p) arrow(c, X(f.base), y - 45, X(right), y - 45, code, 8);
  if (q) arrow(c, X(f.first), y - 92, X(v), y - 92, math, 8);
  dot(c, X(v), y, 17, ink, white);
  mono(c, number(v), X(v), y - 142, 43, ink, 'center');
  if (practice) {
    if (q === 1)
      text(c, 'Saved candidate    ' + number(f.result), 103, 851, 61, chat, 'left', 'Serif');
    return;
  }
  const direct = cue(k, 1, 'two point five eight'),
    correct = cue(k, 2, 'Subtract the extra fifth', 0.9);
  if (direct) {
    const z = mix(f.direct, f.result, correct);
    dot(c, X(z), y + 114, 17, gold);
    if (correct) arrow(c, X(f.direct), y + 114, X(z), y + 114, gold, 6);
    mono(
      c,
      'Endpoint sum   ' +
        number(f.direct, 2) +
        (correct ? ' − ' + (f.direct - z).toFixed(2) + ' = ' + z.toFixed(2) : ''),
      104,
      y + 205,
      42,
      gold,
    );
  }
  if (k.beat.beatIndex >= 3)
    text(c, 'Base coefficient   1 − (0.7 + 0.5) = −0.2', 104, 932, 41, ink);
}
const pair = adapterMergeExample();
export const products = pair.factors.map((f) => f.b.map((b) => f.a.map((a) => b * a)));
export const joined = products[0].map((row, i) => row.map((v, j) => (v + products[1][i][j]) / 2));
export const crossed = pair.wrong;
export function visibleSourceRows(codeOn, mathOn) {
  return [
    codeOn ? products[0][0] : [null, null],
    mathOn ? products[1][1] : [null, null],
  ];
}
const frac = (v) => ({ 0: '0', 0.25: '¼', 0.5: '½', 1: '1' })[v];
function patch(c, x, y, side, v, rowCol, colCol) {
  rect(c, x, y, side, side, '#e3e2cc');
  for (let i = 3; i < side; i += 10) {
    line(c, x + i, y, x + i, y + side, '#c9cab8', 1.4);
    line(c, x, y + i, x + side, y + i, '#cccdbb', 1.4);
  }
  if (v > 0) {
    const s = side * Math.sqrt(v),
      u = x + (side - s) / 2,
      w = y + (side - s) / 2;
    rect(c, u, w, s, s, rowCol);
    for (let d = 5; d < s; d += 10) {
      line(c, u + d, w, u + d, w + s, colCol, 3);
      line(c, u, w + d, u + s, w + d, '#ffffff60', 1.6);
    }
  }
  dot(c, x + side / 2, y + side / 2, side * 0.125, v > 0 ? dark : paper);
  text(c, frac(v), x + side / 2, y + side / 2, side * 0.178, v > 0 ? white : muted, 'center');
}
function swatch(c, x, y, idx) {
  const col = colors[idx];
  text(c, tasks[idx], x, y - 39, 44, col, 'left', 'Serif');
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) patch(c, x + 75 * j, y + 75 * i, 72, products[idx][i][j], col, col);
}
function factor(c, values, x, y, vertical, owner) {
  values.forEach((v, i) => {
    const u = x + (vertical ? 0 : i * 66),
      w = y + (vertical ? i * 66 : 0);
    box(c, u, w, 62, 62, white, owner, 4, 2);
    text(c, frac(v), u + 31, w + 32, 37, owner, 'center');
  });
}
export function adapters(c, k) {
  const b = k.beat.beatIndex;
  title(
    c,
    'Follow the two factors into one cell',
    'Rank-one adapters   ·   ΔW = scale × B A   ·   both configured scales = 1',
  );
  const codeOn = cue(k, 0, 'Code selects'),
    mathOn = cue(k, 0, 'Math selects');
  const sourceRows = visibleSourceRows(codeOn, mathOn);
  swatch(c, 103, 337, 0);
  if (mathOn) swatch(c, 103, 612, 1);
  const cornerCue = cue(k, 1, 'Look at the untouched'),
    test = cue(k, 1, 'Suppose we average');
  const cross = cue(k, 2, "Trace Code's top row", 0.9),
    quarter = cue(k, 2, 'gives a quarter');
  const whole = cue(k, 2, 'other three intersections'),
    restore = cue(k, 3, 'The product now adds');
  const stackA = cue(k, 3, 'Stack the original A rows', 0.9),
    stackB = cue(k, 3, 'half-weighted B columns', 0.9);
  heading(c, stackB ? 'Weighted B' : 'B column', 348, 280);
  heading(c, stackA === 1 ? 'Stacked A' : 'A row', 627, 280);
  for (let i = 0; i < (mathOn ? 2 : 1); i++) {
    const f = pair.factors[i],
      top = 350 + 275 * i;
    factor(
      c,
      stackB ? f.b.map((v) => 0.5 * v) : f.b,
      mix(369, 354 + i * 66, stackB),
      mix(top, 467, stackB),
      true,
      colors[i],
    );
    factor(c, f.a, 637, mix(top + 33, 467 + i * 66, stackA), false, colors[i]);
  }
  if (restore) {
    text(c, '×', 558, 532, 49, ink, 'center');
    arrow(c, 801, 532, 1025, 532, ink, 5);
  }
  const repaired = restore === 1,
    col = code,
    row = math,
    x = 1115,
    y = 307,
    S = 231;
  const mode = repaired
    ? 'Paired products'
    : test
      ? stackA
        ? 'Earlier product of averages'
        : 'Averaged factors'
      : b === 0
        ? 'Source products'
        : 'Mean of the updates';
  heading(c, mode, x, 242);
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) {
      const value =
        b === 0
          ? sourceRows[i][j]
          : !test || repaired
            ? joined[i][j]
            : whole
              ? crossed[i][j]
              : i === 0 && j === 1 && quarter
                ? crossed[i][j]
                : null;
      const u = x + j * S,
        w = y + i * S,
        center = u + S / 2;
      if (value === null) {
        box(c, u, w, S - 5, S - 5, '#e8e6d7', rule, 0);
        mono(c, '?', center, w + S / 2, 49, muted, 'center');
      } else patch(c, u, w, S - 5, value, i ? row : col, j ? row : col);
      if (cornerCue && i === 0 && j === 1) box(c, u + 1, w + 1, S - 7, S - 7, null, ink, 0, 5);
    }
  if (test && !repaired) {
    for (let i = 0; i < 2; i++) {
      text(c, '½', x - 46, y + (i + 0.5) * S, 47, colors[i], 'center');
      text(c, '½', x + (0.5 + i) * S, y - 28, 40, colors[i], 'center');
    }
    if (cross) {
      const tx = x + 1.5 * S,
        ty = y + 0.5 * S;
      line(c, x - 15, ty - 68, mix(x - 15, tx, cross), ty - 68, code, 6);
      line(c, tx, y - 7, tx, mix(y - 7, ty - 68, cross), math, 6);
    }
  }
  if (b >= 1) {
    const base = 3;
    let legend = 'Base at upper right   ' + base;
    if (quarter && !repaired) legend = 'Upper right    3 + ¼ = 3¼';
    if (repaired) legend = 'Upper right    3 + 0 = 3';
    text(c, legend, 107, 892, 46, repaired ? chat : ink, 'left', 'Serif');
  }
  if (repaired) {
    text(c, 'Two independent diagonal updates   ·   rank 2', 925, 894, 36, muted);
  } else if (test) text(c, 'B sets the row. A sets the column.', 1034, 859, 35, muted);
}
export function ties(c, k) {
  const b = k.beat.beatIndex,
    trim = cue(k, 0, 'The entries in columns'),
    idx = b >= 3 ? 3 : 1,
    s = electedColumn(idx);
  const elect = idx === 1 ? cue(k, 2, 'Right, by point two') : cue(k, 4, 'The sum is positive');
  const select =
    idx === 1
      ? cue(k, 2, 'Math is the sole contributor')
      : cue(k, 4, 'Code and Chat both point right');
  const mean = idx === 1 ? cue(k, 2, 'plus one point one') : cue(k, 4, 'plus point seven five');
  title(
    c,
    'Which updates count in the mean?',
    'TIES   /   Trim each source to its two largest absolute changes.',
  );
  const X = (j) => 365 + j * 173,
    Y = (i) => 397 + i * 137;
  for (let j = 0; j < 4; j++) mono(c, 'w' + (j + 1), X(j), 293, 33, muted, 'center');
  for (let i = 0; i < 3; i++) {
    text(c, tasks[i], 93, Y(i), 42, colors[i], 'left', 'Serif');
    for (let j = 0; j < 4; j++) {
      const val = trim ? trimmedRows[i][j] : taskRows[i][j],
        focus = b >= 1 && idx === j;
      box(
        c,
        X(j) - 72,
        Y(i) - 42,
        144,
        84,
        focus ? '#e3eade' : white,
        focus ? ink : rule,
        7,
        focus ? 3 : 1,
      );
      mono(c, signed(val), X(j), Y(i), 38, val === 0 ? muted : colors[i], 'center');
    }
  }
  if (b === 0) {
    text(
      c,
      trim ? 'Surviving columns    w2 and w4' : 'Rank changes within each row.',
      106,
      838,
      43,
      ink,
    );
    return;
  }
  heading(c, 'Signed changes at w' + (idx + 1), 1121, 286);
  const zero = 1450;
  line(c, zero, 342, zero, 755, rule);
  s.values.forEach((v, i) => {
    const on = !select || s.aligned.includes(v),
      end = zero + v * 250;
    arrow(c, zero, Y(i), end, Y(i), on ? colors[i] : rule, on ? 9 : 5);
    mono(c, signed(v), end, Y(i) - 40, 32, on ? colors[i] : muted, 'center');
  });
  if (elect) mono(c, 'Signed sum    ' + signed(s.sum), 108, 849, 41, ink);
  if (mean)
    mono(
      c,
      'Mean    ' + number(s.total) + ' / ' + s.aligned.length + ' = ' + signed(s.mean),
      917,
      849,
      43,
      chat,
    );
  if (idx === 3) text(c, 'Previous result   w2 = +1.1', 107, 934, 33, muted);
}
export const dare = dareMaskExample(),
  outcomes = independentDropOutcomes();
export const originalDelta = dare.delta[1],
  survivor = originalDelta / dare.keep;
export const variance = (originalDelta ** 2 * (1 - dare.keep)) / dare.keep;
export function drop(c, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    title(
      c,
      'One draw of the mask',
      'DARE   /   Four signed changes, each with a ½ chance of surviving.',
    );
    const mask = cue(k, 0, 'first two entries'),
      rescale = cue(k, 0, 'Double those survivors');
    ['Change', 'Keep mask', 'After rescaling'].forEach((s, i) => heading(c, s, 99, 355 + i * 170));
    for (let i = 0; i < 4; i++) {
      const x = 555 + 300 * i;
      mono(c, signed(dare.delta[i]), x, 352, 60, ink, 'center');
      if (mask) {
        dot(c, x, 524, 53, dare.mask[i] ? chat : muted);
        mono(c, dare.mask[i], x, 524, 47, white, 'center');
      }
      if (rescale)
        mono(c, number(dare.masked[i]), x, 694, 62, dare.mask[i] ? chat : muted, 'center');
    }
    if (b === 1)
      text(
        c,
        'Sparse delta    →    task arithmetic    →    add to the dense base',
        101,
        898,
        44,
        ink,
      );
  } else if (b < 5) {
    title(
      c,
      'Repeat the draw at weight two',
      'Drop probability p = ½   ·   the same original signed change on every draw',
    );
    const show = cue(k, 2, 'Half the time'),
      mean = cue(k, 2, 'minus point four, its original'),
      vari = cue(k, 3, 'variance of point one six');
    text(c, number(originalDelta), 205, 527, 108, ink, 'left', 'Serif');
    if (show) {
      for (const [i, v] of [0, survivor].entries()) {
        const y = 375 + i * 307;
        arrow(c, 502, 526, 930, y, i ? math : muted, 7);
        text(c, i ? '½ keep' : '½ drop', 660, y + (i ? 46 : -39), 40, i ? math : muted);
        mono(c, number(v), 1031, y, 64, i ? math : muted, 'center');
      }
    }
    if (mean) {
      line(c, 1194, 356, 1194, 708, rule);
      text(c, 'Mean', 1321, 427, 45, muted);
      mono(c, number(dare.expectations[1]), 1321, 520, 77, ink);
    }
    if (vari) {
      text(c, 'Variance', 1321, 636, 40, muted);
      mono(c, number(variance), 1321, 710, 62, math);
    }
    if (b === 4) mono(c, 'Var = Δ² × p / (1 − p)      0 ≤ p < 1', 118, 889, 42, ink);
  } else {
    title(
      c,
      'Which draws belong in the denominator?',
      'Two initially nonzero updates   ·   independent masks   ·   each survives with probability 0.1',
    );
    const reveal = (phrase, captionStart = phrase) => {
      if (b !== 6) return 0;
      const { start, end } = k.wordCue(phrase);
      return k.reveal(phrase, end - start, { captionStart });
    };
    const revealMask = (phrase) =>
      b === 5 ? k.reveal(phrase, 0.85, { captionStart: 'The ' + phrase }) : 1;
    const a = revealMask('top row keeps Code');
    const m = revealMask('first column keeps Math');
    const overlap = cue(k, 5, 'They overlap in one square') === 1;
    const active = reveal('Nineteen') === 1;
    const isolate = active ? Math.min(1, (k.elapsed - k.wordCue('Nineteen').end) / 0.85) : 0;
    const decomposition = reveal('nine more down the column', 'Count ten in the row') === 1;
    const allRate =
      reveal('one percent of all draws', 'Both survive in one percent of all draws') === 1;
    const activeRate =
      reveal(
        'five point three percent of active draws',
        'or about five point three percent of active draws',
      ) === 1;
    const x = 164,
      y = 269,
      s = 62;
    outcomes.cells.forEach(({ row, column, keepA, keepB }) => {
      const A = keepA && column < a * 10;
      const B = keepB && row < m * 10;
      const size = keepA || keepB ? s - 4 : mix(s - 4, 8, isolate);
      const cx = x + column * s + (s - 4) / 2;
      const cy = y + row * s + (s - 4) / 2;
      const fill = A && B ? gold : A ? code : B ? math : '#e0dfd1';
      rect(c, cx - size / 2, cy - size / 2, size, size, fill);
      if (A && B && overlap) dot(c, cx, cy, 9, white);
    });
    heading(c, outcomes.cells.length + ' equally likely outcomes', 964, 321);
    if (a === 1) text(c, '10 keep Code', 965, 410, 51, code, 'left', 'Serif');
    if (m === 1) text(c, '10 keep Math', 965, 495, 51, math, 'left', 'Serif');
    if (overlap) text(c, outcomes.both + ' keeps both', 965, 580, 51, gold, 'left', 'Serif');
    if (overlap) {
      const conditional = outcomes.both + ' / ' + (active ? outcomes.active : '?');
      const conditionalRate = ' ≈ ' + (100 * outcomes.conditional).toFixed(1) + '%';
      mono(c, 'Both / active    ' + conditional + (activeRate ? conditionalRate : ''), 964, 688, 41, ink);
    }
    if (decomposition)
      text(c, 'Active = 10 in row + 9 more in column', 965, 758, 39, muted);
    if (allRate) {
      const unconditional = outcomes.both + ' / ' + outcomes.cells.length;
      const unconditionalRate = (100 * outcomes.both / outcomes.cells.length).toFixed(0) + '%';
      mono(c, 'Both / all       ' + unconditional + ' = ' + unconditionalRate, 964, 844, 41, ink);
    }
  }
}

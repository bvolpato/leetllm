import {
  paper,
  pale,
  ink,
  mute,
  rule,
  teal,
  red,
  blue,
  gold,
  green,
  blush,
  sea,
  rect,
  line,
  dot,
  poly,
  arrow,
  text,
  num,
  title,
  note,
  footFormula,
  fmt,
  pair,
  cue,
  alpha,
  lerp,
} from './drawing.mjs';
import {
  m,
  cell,
  hidden,
  blend,
  retained,
  identityGRU,
  learnedCell,
  recurrentBias,
  resetBiasTerms,
  torchBlocks,
  batchShape,
  sum,
} from './examples.mjs';

function tank(c, x, y, w, h, value, color, name) {
  rect(c, x, y, w, h, '#e0e6de');
  const level = h * value;
  rect(c, x, y + h - level, w, level, color);
  for (let j = 0; j <= 10; j++) {
    const yy = y + h * (1 - j / 10);
    line(c, x, yy, x + (j % 5 === 0 ? 34 : 17), yy, ink, 2);
  }
  line(c, x, y, x, y + h, ink, 4);
  line(c, x + w, y, x + w, y + h, ink, 4);
  line(c, x, y + h, x + w, y + h, ink, 4);
  text(c, name, x + w / 2, y + h + 63, 41, ink, 'center', 'Serif');
  num(c, fmt(value, 4), x + w / 2, y - 52, 51, color, 'center');
}

export function lstm(c, k) {
  title(c, 'What does a routine check change?');
  const keep = cue(k, 2, 'green level drops', 1.5),
    write = cue(k, 3, 'Add that tiny piece', 1.2);
  const show = cue(k, 4, 'apply tanh', 1.3),
    close = cue(k, 6, 'Turn it down now', 1.5);
  const stored = lerp(0.855, 0.855 * 0.98, keep) + 0.02 * 0.1 * write;
  tank(c, 191, 374, 340, 355, stored, green, 'Stored cell');
  if (show)
    alpha(c, show, () =>
      tank(
        c,
        1365,
        374,
        340,
        355,
        Math.tanh(stored) * lerp(0.8, 0.1, close),
        blue,
        'Exposed hidden',
      ),
    );
  else {
    rect(c, 1365, 374, 340, 355, '#e4e7df');
    text(c, 'Readout', 1535, 549, 48, mute, 'center', 'Serif');
  }
  arrow(c, 594, 568, 1286, 568, teal, 7);
  text(c, 'tanh', 922, 489, 57, ink, 'center', 'Serif');
  num(c, '× ' + fmt(lerp(0.8, 0.1, close), 2), 922, 656, 57, teal, 'center');
  if (k.beat.beatIndex === 2) {
    text(c, 'Write magnified', 961, 237, 39, red, 'center');
    rect(c, 781, 287, 360, 23, '#e4ddd2');
    rect(c, 781, 287, 360 * write, 23, red);
    num(c, '0.02 × 0.1 = 0.002', 961, 352, 34, red, 'center');
  }
  footFormula(
    c,
    k.beat.beatIndex < 2 ? 'retained = 0.98 × 0.855' : 'cell = 0.98 × 0.855 + 0.02 × 0.1',
  );
}

export function learnedLSTM(c, k) {
  const b = k.beat.beatIndex,
    v = learnedCell;
  title(
    c,
    b < 7 ? 'Where do the gate settings come from?' : 'What did each coordinate actually store?',
  );
  if (b < 7) {
    text(c, 'Previous hidden', 310, 226, 39, blue, 'center');
    text(c, 'Reproduction event', 816, 226, 39, teal, 'center');
    v.joined.forEach((value, i) => {
      const x = 130 + i * 203;
      rect(c, x, 280, 177, 106, i < 2 ? '#d7e2ed' : sea);
      num(c, fmt(value, i < 2 ? 2 : 0), x + 88, 334, 53, ink, 'center');
    });
    text(c, 'Previous cell', 1450, 226, 39, green, 'center');
    num(c, pair(v.cOld), 1450, 334, 45, green, 'center');
    if (b < 2) {
      text(
        c,
        b === 0
          ? 'Each row reads all five inputs.'
          : 'Sigmoid turns a weighted sum into a gate fraction.',
        960,
        535,
        46,
        ink,
        'center',
        'Serif',
      );
      footFormula(
        c,
        b === 0
          ? '2 rows × 5 inputs per projection'
          : 'gate = σ(W [old h, x] + b)      candidate uses tanh',
      );
    } else {
      const data = [
        [
          'Forget',
          v.f,
          'σ(0.4 + 0.6),  σ(−0.5)',
          3,
          'Follow the nonzero terms',
          'Apply sigmoid',
          green,
        ],
        ['Write', v.i, 'σ(−1),  σ(0)', 5, 'For the write gate', 'Sigmoid turns zero', red],
        [
          'Candidate',
          v.candidate,
          'tanh(0.5),  tanh(0)',
          5,
          'candidate has its own weights',
          'Apply tanh',
          gold,
        ],
        ['Expose', v.o, 'σ(ln 4),  σ(0)', 7, 'reads biases alone', 'After sigmoid', blue],
      ];
      data.forEach(([name, values, expr, beat, inputCue, resultCue, col], i) => {
        if (!cue(k, beat, inputCue, 0)) return;
        const y = 471 + i * 113;
        text(c, name, 174, y, 43, col);
        num(c, expr, 572, y, 36, mute);
        if (cue(k, beat, resultCue, 0)) num(c, pair(values), 1410, y, 40, col, 'center');
      });
      if (cue(k, 7, 'Look at the write gate', 0))
        note(c, 'Which stored coordinate comes entirely from its old cell?', 943);
    }
  } else {
    text(c, 'Old cell × forget', 493, 236, 42, green, 'left', 'Serif');
    text(c, 'Candidate × write', 1176, 236, 42, red, 'left', 'Serif');
    const keepReady = cue(k, 8, 'retained amounts are', 0);
    const writeReady = cue(k, 8, 'first write adds', 0);
    const zeroReady = cue(k, 8, 'half of zero', 0);
    const sumReady = cue(k, 9, 'get the stored cells', 0);
    const readReady = cue(k, 9, 'scale by the output fractions', 0);
    for (let j = 0; j < 2; j++) {
      const y = 351 + j * 305;
      const hasWrite = j ? zeroReady : writeReady;
      text(c, 'Coordinate ' + (j + 1), 114, y, 44, ink, 'left', 'Serif');
      num(
        c,
        fmt(v.cOld[j]) + ' × ' + fmt(v.f[j], 5) + (keepReady ? ' ≈ ' + fmt(v.retained[j], 5) : ''),
        493,
        y,
        35,
        green,
      );
      num(
        c,
        fmt(v.candidate[j], 5) +
          ' × ' +
          fmt(v.i[j], 5) +
          (hasWrite ? (v.written[j] === 0 ? ' = ' : ' ≈ ') + fmt(v.written[j], 5) : ''),
        1176,
        y,
        35,
        red,
      );
      const x = 493,
        barY = y + 69,
        scale = 650;
      line(c, x, barY + 38, x + 529, barY + 38, rule, 2);
      if (keepReady) rect(c, x, barY, v.retained[j] * scale, 35, green);
      if (hasWrite) rect(c, x + v.retained[j] * scale, barY, v.written[j] * scale, 35, red);
      if (sumReady) num(c, 'c ≈ ' + fmt(v.nextCell[j], 4), x, y + 163, 38, green);
      if (readReady)
        num(
          c,
          'h = ' + fmt(v.o[j], 1) + ' × tanh(c) ≈ ' + fmt(v.nextHidden[j], 4),
          1176,
          y + 163,
          34,
          blue,
        );
    }
  }
}

export function direct(c, k) {
  title(c, 'How far does the direct cell path carry a nudge?');
  const n =
    3 * cue(k, 1, 'Across several steps', 1.4) +
    27 * cue(k, 3, 'Move the probe to thirty steps', 3.2);
  const x0 = 250,
    y0 = 701,
    dx = 41,
    dy = 390;
  [0, 0.5, 1].forEach((v) => {
    line(c, x0, y0 - v * dy, x0 + 30 * dx, y0 - v * dy, rule, 2);
    num(c, fmt(v, 1), x0 - 36, y0 - v * dy, 32, mute, 'right');
  });
  [0, 10, 20, 30].forEach((i) => num(c, i, x0 + dx * i, 766, 31, mute, 'center'));
  const colors = [green, red],
    fs = [0.98, 0.5];
  for (let j = 0; j < 2; j++) {
    const f = fs[j],
      color = colors[j];
    c.beginPath();
    c.moveTo(x0, y0 - dy);
    for (let i = 0.25; i < n; i += 0.25) c.lineTo(x0 + i * dx, y0 - retained(f, i) * dy);
    const v = retained(f, n),
      x = x0 + dx * n,
      y = y0 - v * dy;
    c.lineTo(x, y);
    c.strokeStyle = color;
    c.lineWidth = 7;
    c.stroke();
    dot(c, x, y, 12, color);
    if (n === 30) num(c, j === 0 ? fmt(v) : v.toExponential(2), x + 27, y, 39, color);
    num(c, 'f = ' + fmt(f, 2), 745 + j * 370, 204, 38, color, 'center');
  }
  footFormula(
    c,
    k.beat.beatIndex === 3
      ? 'Full gradients also pass through h, gates and the readout.'
      : 'direct slope across steps = f₁ × f₂ × … × fₙ',
  );
}

export function gru(c, k) {
  title(c, 'How much of the previous state survives?');
  const b = k.beat.beatIndex,
    z =
      0.95 -
      0.45 * cue(k, 4, 'Move it to halfway', 1.6) -
      0.45 * cue(k, 4, 'Keep just five percent', 1.6);
  const x0 = 262,
    x1 = 1658,
    y = 498;
  text(c, 'Candidate', x0, 277, 51, red, 'center', 'Serif');
  num(c, '−0.20', x0, 351, 43, red, 'center');
  text(c, 'Previous state', x1, 277, 51, teal, 'center', 'Serif');
  num(c, '+0.80', x1, 351, 43, teal, 'center');
  line(c, x0, y, x1, y, rule, 10);
  const zero = lerp(x0, x1, 0.2);
  line(c, zero, y - 20, zero, y + 23, mute, 3);
  num(c, '0', zero, y + 66, 31, mute, 'center');
  dot(c, x0, y, 19, red);
  dot(c, x1, y, 19, teal);
  const ready = cue(k, 2, 'Keep ninety-five percent', 1.0);
  alpha(c, ready, () => {
    const x = lerp(x0, x1, z);
    poly(
      c,
      [
        [x - 21, y - 36],
        [x + 21, y - 36],
        [x, y - 7],
      ],
      gold,
    );
    num(c, fmt(blend(z)), x, y - 97, 53, ink, 'center');
    rect(c, 446, 669, 1028 * (1 - z), 40, red);
    rect(c, 446 + 1028 * (1 - z), 669, 1028 * z, 40, teal);
    num(c, 'candidate ' + fmt(1 - z, 2) + '      keep ' + fmt(z, 2), 960, 767, 42, ink, 'center');
  });
  footFormula(
    c,
    b === 4
      ? 'reset first shapes the candidate     •     keep blends it with old h'
      : 'new h = z × old h + (1 − z) × candidate',
  );
}

export function resetOrder(c, k) {
  const b = k.beat.beatIndex,
    g = m.gru;
  title(
    c,
    b >= 6
      ? 'Can a fixed input bias replace a reset-scaled bias?'
      : 'Does moving the reset change the state?',
  );
  if (b >= 6) {
    text(c, 'PyTorch recurrent contribution before tanh', 150, 230, 43, ink, 'left', 'Serif');
    num(c, 'r ⊙ (Wₕ h + bₕ)', 1210, 230, 45, ink);
    text(c, 'Bias contribution', 1127, 336, 35, mute);
    num(c, 'r₁ bₕ₁', 1478, 336, 35, ink);
    resetBiasTerms.forEach((term, i) => {
      const y = 449 + i * 211;
      if (i === 1 && !cue(k, 7, 'Try a rollback event', 0)) return;
      text(c, i ? 'rollback' : 'reproduction', 132, y, 46, ink, 'left', 'Serif');
      num(c, 'r₁ = ' + (i ? 'σ(0)' : 'σ(−ln 9)'), 538, y, 42, mute);
      if (cue(k, i === 0 ? 7 : 8, i === 0 ? 'to one tenth' : 'adds one half', 0)) {
        rect(c, 1135, y - 25, term * 700, 50, i ? teal : red);
        num(c, fmt(term, 2), 1627, y, 46, ink);
      }
    });
    footFormula(
      c,
      'bₕ₁ = ' +
        recurrentBias +
        (cue(k, 8, 'A fixed input bias', 0)
          ? '     A fixed input bias adds the same value to both rows.'
          : ''),
    );
    return;
  }
  const mixing = b >= 2,
    row = mixing ? g : identityGRU;
  num(
    c,
    'old h ' + pair(g.hidden, 1) + '      reset ' + pair(g.reset, 1) + '      keep ' + pair(g.z, 2),
    960,
    223,
    39,
    ink,
    'center',
  );
  num(
    c,
    b === 0
      ? 'reproduction   x = [0, 1, 0]'
      : mixing
        ? 'W = [[1, 2], [3, 4]]     •     follow coordinate 2'
        : 'W = identity     •     candidate input and biases = 0',
    960,
    319,
    37,
    mute,
    'center',
  );
  const pass = b >= 1;
  for (let j = 0; j < 2; j++) {
    const y = 510 + j * 221,
      color = j ? teal : red;
    text(c, j ? 'PyTorch' : 'Reset first', 111, y, 45, color, 'left', 'Serif');
    const from = j ? 'W × h' : 'r × h',
      to = j ? 'r × result' : 'W × result';
    text(c, from, 540, y - 46, 38, mute);
    arrow(c, 825, y - 40, 995, y - 40, color);
    text(c, to, 1078, y - 46, 38, mute);
    if (pass) {
      const ready = mixing
        ? cue(k, 3, j ? 'In PyTorch' : 'Reset first shrinks')
        : cue(k, 2, j ? 'PyTorch copies' : 'On the top route');
      alpha(c, ready, () =>
        num(c, pair(j ? row.projected : row.resetHidden, 2), 508, y + 29, 39, ink),
      );
      const projected = mixing
        ? cue(k, j ? 4 : 3, j ? 'reset keeps' : 'negative term wins')
        : ready;
      alpha(c, projected, () => num(c, pair(j ? row.after : row.before, 2), 1074, y + 29, 39, ink));
    }
    alpha(c, cue(k, 5, j ? 'it is positive' : 'coordinate is negative'), () =>
      num(c, 'h₂ ' + fmt((j ? g.afterHidden : g.beforeHidden)[1]), 1490, y + 29, 40, color),
    );
  }
  const footer =
    b === 4
      ? 'h₂ = 0.5 × (−0.2) + 0.5 × tanh(second result)'
      : b === 5
        ? 'With zero recurrent bias, a diagonal W or uniform reset fractions commute.'
        : 'Follow the same hidden vector through both orders.';
  note(c, footer, b === 4 ? 838 : undefined);
}

export function geometry(c, k) {
  const b = k.beat.beatIndex,
    p = batchShape;
  const heading =
    b < 2 ? 'How many parameters do the GRU and LSTM have?'
      : b < 4 ? 'How many parameters does this GRU have?'
        : 'Which axes survive the final read?';
  title(c, heading);
  if (b < 2) {
    const block = p.hidden * (p.input + p.hidden) + p.hidden;
    ['RNN', 'GRU', 'LSTM'].forEach((name, j) => {
      const x = 192 + j * 578,
        count = [1, 3, 4][j];
      text(c, name, x, 294, 55, ink, 'left', 'Serif');
      for (let g = 0; g < count; g++) {
        for (let i = 0; i < block; i++)
          rect(
            c,
            x + (i % 6) * 39,
            393 + g * 84 + Math.floor(i / 6) * 33,
            31,
            25,
            [teal, blue, gold, red][g],
          );
      }
      const countReady = cue(k, 2, ['uses one block', 'uses three', 'uses four'][j], 0);
      const totalReady =
        j === 0 ? countReady : cue(k, 2, j === 1 ? 'thirty-six' : 'forty-eight', 0);
      if (countReady)
        num(c, count + ' × ' + block + (totalReady ? ' = ' + count * block : ''), x, 788, 43, ink);
    });
    line(c, 108, 814, 1812, 814, rule, 2);
    num(
      c,
      'one bias per row      2 × (3 + 2) + 2' +
        (cue(k, 1, 'twelve parameters', 0) ? ' = ' + block : ''),
      960,
      846,
      44,
      ink,
      'center',
    );
  } else if (b < 4) {
    const sizes = torchBlocks(p.input, p.hidden);
    const cols = [p.input, p.hidden, 1, 1],
      names = ['Input weights', 'Recurrent weights', 'Input bias', 'Recurrent bias'];
    sizes.forEach((n, j) => {
      const x = 200 + j * 435;
      text(c, names[j], x, 274, 39, ink);
      for (let i = 0; i < n; i++) {
        const r = Math.floor(i / cols[j]);
        rect(c, x + (i % cols[j]) * 56, 365 + r * 53, 46, 44, [red, teal, gold][Math.floor(r / 2)]);
      }
      const counted = cue(
        k,
        4,
        ['Eighteen input weights', 'twelve recurrent weights', 'six each', 'six each'][j],
        0,
      );
      const label =
        j < 2
          ? '6 × ' + cols[j] + (counted ? ' = ' + n : '')
          : counted
            ? n + ' entries'
            : 'one per row';
      num(c, label, x, 775, 38, ink);
    });
    footFormula(
      c,
      cue(k, 4, 'forty-two parameters', 0)
        ? sizes.join(' + ') + ' = ' + sum(sizes) + ' parameters'
        : 'Rows 1–2   reset     3–4   update     5–6   candidate',
    );
  } else {
    const lengths = b === 6 ? [5, 4, 3, 1] : [5, 5, 5, 5];
    const projected = cue(k, 5, 'output keeps'),
      final = b >= 5;
    for (let t = 0; t < p.time; t++) num(c, 't=' + (t + 1), 297 + t * 159, 220, 29, mute, 'center');
    const markEnds = final && (b === 5 || cue(k, 7, 'Mark the last real position', 0));
    for (let r = 0; r < p.batch; r++) {
      const y = 295 + r * 125;
      text(c, String.fromCharCode(65 + r), 145, y + 27, 37, mute);
      for (let t = 0; t < p.time; t++) {
        const x = 269 + t * 159,
          color = markEnds && t === lengths[r] - 1 ? gold : projected ? teal : blue;
        if (t >= lengths[r]) continue;
        for (let v = 0; v < (projected ? p.hidden : p.input); v++)
          rect(c, x + v * 35, y, 27, 55, color);
      }
    }
    text(
      c,
      final ? 'Final hidden shape' : 'Batch-first tensor',
      1214,
      343,
      47,
      ink,
      'left',
      'Serif',
    );
    num(
      c,
      pair(
        final
          ? [p.layers * p.directions, p.batch, p.hidden]
          : [p.batch, p.time, projected ? p.hidden : p.input],
        0,
      ),
      1214,
      465,
      57,
      final ? blue : teal,
    );
    if (b === 6) {
      text(
        c,
        markEnds ? 'Final valid positions' : 'Valid lengths',
        1214,
        606,
        38,
        markEnds ? gold : mute,
      );
      num(c, pair(lengths, 0), 1214, 675, 42, markEnds ? gold : mute);
    }
    footFormula(
      c,
      final
        ? 'final hidden   [layers × directions, batch, hidden]'
        : 'batch-first   [batch, time, features]',
    );
  }
}

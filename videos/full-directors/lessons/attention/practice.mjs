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
  fmt,
  vec,
  text,
  line,
  dot,
  box,
  arrow,
  heading,
  mono,
  label,
  rules,
  seams,
  sharePair,
  matrix,
  bird,
} from './art.mjs';
import { m } from './fixtures.mjs';

const mixLayout = { x: 126, y: 299, gap: 143, unit: 330 };
const rulerY = 544;

export function reader(c, t) {
  const { b, at, after } = t;
  if (b <= 2) {
    heading(c, 'Give the same keys a new reader');
    mono(c, '[1, 3]  ×  Wq', 78, 144, 38);
    matrix(c, m.Q, 427, 102, 76, 47, { size: 21 });
    mono(c, '= ' + vec(m.NEW_QUERY), 633, 148, 40, gold);
    const shown = [at(2, 'Birds scores'), at(2, 'Sing scores')];
    const data = [
      m.K.map((v) => vec(v)),
      m.SCORES[1].map((n) => fmt(n)),
      m.NEW_SCORES.map((n, i) => (shown[i] ? fmt(n) : '?')),
    ];
    matrix(c, data, 321, 285, 262, 72, {
      rows: ['Same keys', 'Old dot products', 'New dot products'],
      cols: names,
      fill: (i, j) => (j ? '#f4dcd1' : '#d8e3ee'),
    });
    if (at(2, 'Now it leads'))
      mono(
        c,
        'sing lead   ' +
          fmt(m.SCORES[1][1] - m.SCORES[1][0]) +
          '   →   ' +
          fmt(m.NEW_SCORES[1] - m.NEW_SCORES[0]),
        322,
        569,
        33,
        teal,
      );
    return;
  }
  heading(c, 'Mix with the new reader’s shares');
  sharePair(c, m.NEW_WEIGHTS, 117, 137, 945, 'Same two keys, new query');
  const totals = [after(4, 'About one point three'), after(4, 'one point seven')];
  seams(c, m.NEW_WEIGHTS, m.V, { ...mixLayout, totals });
  rules(c, mixLayout.x, rulerY, mixLayout.unit, 3);
}

export function revisedValues(amount) {
  return [[m.V[0][0], m.V[0][1] + 2 * amount], m.V[1]];
}

function patchImage(c, x, y, side) {
  c.save();
  c.beginPath();
  c.rect(x, y, side, side);
  c.clip();
  const g = c.createLinearGradient(x, y, x, y + side);
  g.addColorStop(0, '#bad9d4');
  g.addColorStop(0.7, '#f9eac4');
  g.addColorStop(1, '#d4ba87');
  box(c, x, y, side, side, g);
  dot(c, x + side * 0.77, y + side * 0.23, side * 0.13, '#f6df9c');
  const stems = [
    [0.06, 0.87, 0.28, 0.62],
    [0.18, 0.8, 0.15, 0.65],
    [0.82, 0.92, 0.73, 0.64],
    [0.78, 0.75, 0.9, 0.62],
    [0.5, 0.95, 0.64, 0.7],
  ];
  stems.forEach(([a, b, d, e]) => {
    line(c, x + a * side, y + b * side, x + d * side, y + e * side, '#768875', 4);
  });
  bird(c, x + side * 0.54, y + side * 0.48, side / 97, '#224c69');
  c.restore();
}
function patches(c, t) {
  const cut = t.at(4, 'Cut it into four patches', 0.9),
    open = t.at(5, 'it can read all four');
  heading(c, 'Which patches can the top left read?');
  const side = 368,
    x = 174,
    y = 176,
    half = side / 2,
    gap = 22 * cut;

  for (let i = 0; i < 4; i++) {
    const col = i % 2,
      row = Math.floor(i / 2),
      dx = col * gap,
      dy = row * gap;
    const xx = x + col * half + dx,
      yy = y + row * half + dy;
    c.save();
    c.beginPath();
    c.rect(xx, yy, half, half);
    c.clip();
    patchImage(c, x + dx, y + dy, side);
    c.restore();
    if (cut) box(c, xx, yy, half, half, null, i === 0 ? gold : edge, i === 0 ? 4 : 1.5);
  }
  if (cut) {
    const labels = ['Top left', 'Top right', 'Bottom left', 'Bottom right'];
    if (open) {
      line(c, x + half / 2, y, x + half / 2, y - 25, gold, 2);
      line(c, x + half / 2, y - 25, 704, y - 25, gold, 2);
      line(c, 704, y - 25, 704, 210, teal, 3);
    }
    labels.forEach((s, i) => {
      const Y = 210 + i * 88;
      const xx = 734 + 24;
      if (open) {
        line(c, 704, 210, 704, Y, teal, 3);
        arrow(c, 704, Y, xx - 1, Y, teal, 3);
      }
      box(c, xx, Y - 23, 243, 47, i === 0 ? '#efd99d' : '#e4e5d7');
      text(c, s, xx + 16, Y, 26, ink, 'Serif');
    });
    label(c, open ? 'All four keys are available.' : 'One token per patch', 760, 562);
  }
}
export function ending(c, t) {
  const { b, at, after } = t;
  if (b >= 4) {
    patches(c, t);
    return;
  }
  if (b === 3) {
    heading(c, 'Put the read back into the token state');
    const val = m.blendOf(m.NEW_WEIGHTS, revisedValues(1));
    label(c, 'This head', 85, 182);
    mono(c, vec(val, 2), 85, 252, 38, blue);
    text(c, 'other heads', 89, 376, 32, muted, 'Serif');
    line(c, 378, 250, 527, 310, edge, 3);
    line(c, 378, 376, 527, 310, edge, 3);
    box(c, 535, 264, 186, 91, '#dce6df', teal);
    mono(c, '× Wᴼ', 628, 309, 34, teal, 'center');
    if (at(3, 'adds the result')) {
      arrow(c, 748, 310, 829, 310, teal);
      mono(c, '+ x', 873, 307, 42);
      label(c, 'Reader state', 868, 382);
      if (at(3, 'next block')) {
        arrow(c, 911, 415, 911, 490, teal);
        label(c, 'Next block', 911, 536, 'center');
      }
    }
    return;
  }
  const inputChange = at(1, 'Give the second Birds value', 1);
  const outputChange = at(2, 'Slide the red piece', 1.2);
  const values = revisedValues(inputChange);
  heading(c, 'Keep the reader and its two shares');
  sharePair(c, m.NEW_WEIGHTS, 117, 137, 945, 'Fixed shares');
  const added = values[0][1] - m.V[0][1];
  const changedValue = added > 0 && inputChange < 1 ? fmt(values[0][1]) : values[0][1];
  const valueY = 235;
  text(c, 'Birds value', 126, valueY, 27, blue);
  mono(c, '[' + values[0][0] + ',', 282, valueY, 29, blue);
  mono(c, changedValue + ']', 351, valueY, 29, added > 0 ? gold : blue);
  text(c, 'sing value', 669, valueY, 27, red);
  mono(c, vec(values[1]), 809, valueY, 29, red);

  const showGain = after(2, 'The second coordinate rises by about point six', 'The second coordinate rises');
  const showOutput = after(2, 'The second is now two point three', 'The second is now');
  const visible = revisedValues(outputChange);
  seams(c, m.NEW_WEIGHTS, visible, {
    ...mixLayout,
    totals: [true, outputChange === 0 || showOutput],
    showSecondBlue: outputChange === 0 || showGain,
  });
  const { x, y, gap, unit } = mixLayout;
  const oldEnd = x + unit * m.NEW_OUTPUT[1];
  rules(c, x, rulerY, unit, 3);
  if (!outputChange && added > 0) label(c, 'Before the change', oldEnd + 130, y + gap + 30);
  if (outputChange > 0) {
    const next = m.blendOf(m.NEW_WEIGHTS, visible)[1];
    const newEnd = x + unit * next;
    const bracketY = y + gap - 17;
    line(c, oldEnd, bracketY - 8, oldEnd, y + gap + 62, gold, 2, [5, 4]);
    line(c, oldEnd, bracketY, newEnd, bracketY, gold, 2);
    line(c, newEnd, bracketY - 8, newEnd, bracketY + 8, gold, 2);
    if (showGain)
      mono(c, '+ ' + fmt(next - m.NEW_OUTPUT[1]), (oldEnd + newEnd) / 2, bracketY - 24, 28, gold, 'center');
  }
}

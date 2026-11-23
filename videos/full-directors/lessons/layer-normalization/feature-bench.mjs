import {
  ink,
  muted,
  brass,
  blue,
  teal,
  rust,
  paper,
  grid,
  clamp,
  num,
  vector,
  cue,
  text,
  mono,
  plotNumber,
  rect,
  line,
  path,
  circle,
  arrow,
  title,
  rule,
  gaugeBlock,
  range,
  row,
} from './instrument.mjs';
import {
  x,
  row1,
  mean,
  variance,
  div,
  centered,
  offset,
  ln,
  stream,
  affine,
  axes,
  batchReading,
} from './experiments.mjs';

export function writes(c, k) {
  const first = cue(k, 1, 'Slide one brass piece', 1.1);
  const six = cue(k, 2, 'six more unit writes', 2.55);
  const eighth = cue(k, 2, 'Slide the eighth', 1.05);
  const count = first + 6 * six + eighth,
    complete = Math.floor(count + 1e-8),
    flying = count - complete;
  const measured = stream(complete),
    left = 152,
    unit = 171,
    y = 479;
  title(c, 'One feature, written eight times', 'One decoder token    ·    features 2, 3 and 4 stay at zero');
  rule(c, left, y + 118, 9 * unit, 0, 9, 0.25, 4);
  range(c, left, left + unit * measured.length, 804, 'first feature   ' + num(measured.length), blue);
  gaugeBlock(c, left, y, unit, 118, blue, '#77a0b9', 1);
  for (let n = 1; n <= complete; n++) {
    gaugeBlock(c, left + n * unit, y, unit, 118, n === 8 ? rust : brass, n === 8 ? '#e69878' : '#d4a264', 1);
  }
  if (flying > 1e-7)
    gaugeBlock(
      c,
      left + (complete + 1) * unit,
      y - 144 * (1 - flying),
      unit,
      118,
      complete === 7 ? rust : brass,
      '#deb079',
      1,
    );
  const note = complete === 8 ? 'eighth write' : complete === 0 ? 'starting feature' : 'most recent write';
  const tip = left + (complete + 0.5) * unit;
  text(c, note, Math.min(1640, Math.max(260, tip)), 310, 37, complete === 8 ? rust : muted, 'center');
  line(c, tip, 350, tip, y - 23, complete ? brass : blue, 3);
  if (k.beat.beatIndex === 1 && eighth === 1)
    text(c, 'What share belongs to the eighth piece?', 960, 925, 51, ink, 'center', 'Serif');
  if (cue(k, 3, 'One ninth'))
    text(
      c,
      'Eighth write   /   full length    =    1 / ' + measured.length,
      960,
      925,
      52,
      rust,
      'center',
      'Serif',
    );
}

function pins(c, values, x0, width, zeroY, scale, ref, label, color, feature = 2) {
  const end = x0 + width;
  line(c, x0, zeroY, end, zeroY, muted, 3);
  if (ref !== null && Math.abs(ref) > 1e-7)
    line(c, x0, zeroY - scale * ref, end, zeroY - scale * ref, color, 3, [8, 8]);
  for (let i = 0; i < 4; i++) {
    const xx = x0 + (width * (i + 0.5)) / 4,
      yy = zeroY - values[i] * scale;
    rect(
      c,
      xx - 13,
      Math.min(yy, zeroY),
      26,
      Math.max(1, Math.abs(yy - zeroY)),
      i === feature ? brass : color,
    );
    circle(c, xx, yy, 13, paper, i === feature ? brass : color, 6);
    plotNumber(
      c,
      num(values[i]),
      xx,
      yy + (values[i] < 0 ? 46 : -42),
      35,
      i === feature ? brass : ink,
      'center',
    );
    mono(c, 'f' + (i + 1), xx, 925, 29, muted, 'center');
  }
  text(c, label, x0, 239, 43, color);
}

export function centering(c, k) {
  const d = 3 * cue(k, 3, 'add three', 1.35);
  const raw = offset(x, d);
  const subtraction = 2 * cue(k, 1, 'Subtract two', 1.3) + 3 * cue(k, 3, 'Subtract the new mean', 1.2);
  const current = offset(raw, -subtraction);
  title(c, 'A token sets its own zero', 'The four measuring pins belong to the same token.');
  pins(c, raw, 96, 710, 660, 43, mean(raw), 'Input', blue);
  pins(c, current, 1050, 750, 660, 43, mean(current), 'After subtraction', teal);
  arrow(c, 833, 560, 1009, 560, ink);
  mono(c, '− ' + num(subtraction), 925, 496, 39, ink, 'center');
  mono(c, 'mean  ' + num(mean(raw)), 96, 834, 36, blue);
  mono(c, 'mean  ' + num(mean(current)), 1050, 834, 36, teal);
}

export function scale(c, k) {
  const flat = cue(k, 3, 'four sevens') > 0;
  const v = flat ? [7, 7, 7, 7] : x,
    delta = centered(v),
    squares = delta.map((n) => n * n);
  const squared = cue(k, 1, 'Square the four distances', 1.6),
    divide = cue(k, 2, 'Divide each centered coordinate') > 0;
  title(
    c,
    flat ? 'Four equal readings' : 'A square for each deviation',
    flat ? 'Input   [ 7   7   7   7 ]' : 'Centered token   [ 1   −1   −3   3 ]',
  );
  const side = 63,
    baseline = 615;
  for (let i = 0; i < 4; i++) {
    const cx = 258 + 462 * i,
      n = Math.abs(delta[i]),
      size = n * side;
    mono(c, 'f' + (i + 1), cx, 277, 32, muted, 'center');
    if (n) {
      c.save();
      c.globalAlpha = Math.max(0.09, clamp(4 * squared - i));
      rect(c, cx - size / 2, baseline - size, size, size, i === 2 ? '#e1ae75' : '#93c3b1');
      for (let j = 0; j <= n; j++) {
        line(c, cx - size / 2 + j * side, baseline - size, cx - size / 2 + j * side, baseline, ink, 2);
        line(c, cx - size / 2, baseline - j * side, cx + size / 2, baseline - j * side, ink, 2);
      }
      c.restore();
    } else circle(c, cx, baseline, 6, ink);
    mono(c, num(delta[i]) + ' squared', cx, 676, 32, ink, 'center');
    mono(c, num(squares[i]), cx, 735, 49, i === 2 ? brass : teal, 'center');
  }
  if (cue(k, 1, 'Divide by all four features')) {
    const s = div(v),
      f = flat ? '√ε' : '√(5 + ε)';
    text(
      c,
      'Population variance   ' + squares.reduce((a, b) => a + b, 0) + ' / 4 = ' + num(variance(v)),
      95,
      836,
      40,
    );
    mono(c, 's = ' + f + ' ≈ ' + num(s, flat ? 5 : 3), 1030, 836, 36, teal);
  }
  if (divide) mono(c, 'Standardized     ' + vector(ln(v), 3), 95, 940, 44, teal);
  if (flat) text(c, 'Var(z) = Var(x) / (Var(x) + ε)', 1123, 940, 34, muted);
}
export function gains(c, k) {
  const gain = 1 + cue(k, 2, 'Double the first gain', 0.85),
    shift = 0.7 * cue(k, 2, 'move the last shift', 0.8);
  const a = affine(gain, shift),
    z = ln(x),
    pos = (v) => 545 - 127 * v;
  title(
    c,
    'Independent trims for four features',
    'The hollow ring is the standardized value. Each brass slider applies its own gain and shift.',
  );
  for (let i = 0; i < 4; i++) {
    const cx = 285 + i * 438;
    line(c, cx, 245, cx, 755, grid, 8);
    line(c, cx - 66, pos(0), cx + 66, pos(0), muted, 3);
    for (let t = -1.5; t <= 2; t += 0.25)
      line(c, cx + 11, pos(t), cx + (t % 1 === 0 ? 39 : 25), pos(t), muted, 2);
    circle(c, cx, pos(z[i]), 22, paper, blue, 6);
    path(
      c,
      [
        [cx - 60, pos(a.values[i]) - 12],
        [cx - 19, pos(a.values[i]) - 12],
        [cx - 4, pos(a.values[i])],
        [cx - 19, pos(a.values[i]) + 12],
        [cx - 60, pos(a.values[i]) + 12],
      ],
      brass,
    );
    mono(c, num(a.values[i], 3), cx - 73, pos(a.values[i]), 38, brass, 'right');
    text(c, 'Feature ' + (i + 1), cx, 797, 38, ink, 'center');
    mono(c, 'gain ' + num(a.gamma[i]) + '   shift ' + num(a.beta[i]), cx, 852, 29, muted, 'center');
  }
  mono(
    c,
    'Output mean ≈ ' + num(a.mean, 3) + '             variance ≈ ' + num(a.variance, 4),
    960,
    957,
    40,
    teal,
    'center',
  );
}

function batchMode(c, k) {
  const bn = cue(k, 4, 'Training BatchNorm') > 0,
    evalMode = cue(k, 5, 'In evaluation') > 0;
  // A stored pair of moments is sufficient to reproduce the evaluation reading.
  const disabled = cue(k, 5, 'running statistics disabled') > 0;
  const stored = evalMode && !disabled;
  const { peers, mean: m, variance: v, first } = batchReading(stored);
  title(
    c,
    bn ? 'Who supplies the BatchNorm statistics?' : 'Choose the reduction axes',
    bn
      ? 'One channel, three example observations across batch and time'
      : 'Hidden width H = 3    ·    sequence length T = 2',
  );
  if (!bn) {
    row(c, 'Token 1', row1, 408);
    row(c, 'Later token', axes(100).later, 558);
    mono(c, 'LayerNorm(3)       one token at a time', 120, 733, 42, teal);
    mono(c, 'LayerNorm((2, 3))  time and width together', 120, 836, 42, rust);
    return;
  }
  row(c, 'Current values', peers, 371, { dx: 278 });
  line(c, 105, 465, 1805, 465, grid, 3);
  text(
    c,
    stored
      ? 'Evaluation · stored moments'
      : disabled
        ? 'Evaluation · running statistics off'
        : 'Training · current observations',
    106,
    563,
    52,
    ink,
    'left',
    'Serif',
  );
  mono(c, 'mean  ' + num(m, 3) + '       variance  ' + num(v, 3), 106, 676, 44, blue);
  mono(
    c,
    'First output   (1 − ' + num(m, 3) + ') / √(' + num(v, 3) + ' + ε) ≈ ' + num(first, 3),
    106,
    788,
    42,
    teal,
  );
  text(c, 'A padded position also contributes if it is included in the reduction.', 106, 912, 34, muted);
}
export function reduction(c, k) {
  if (k.beat.beatIndex >= 3) {
    batchMode(c, k);
    return;
  }
  const d = 100 * cue(k, 3, 'Change the later token', 1.25),
    a = axes(d),
    a0 = axes(0);
  title(c, 'Can a future edit reach the first token?', 'Trace the inputs that each calculation includes.');
  const topY = 350,
    bottomY = 666;
  for (const [i, y] of [topY, bottomY].entries()) {
    const shared = i === 1;
    text(c, shared ? 'Time + features' : 'Features only', 103, y, 41, shared ? rust : teal);
    const x0 = 484,
      dx = 133;
    for (const [j, n] of [...row1, ...a.later].entries()) {
      const xx = x0 + j * dx;
      rect(c, xx - 53, y - 48, 108, 96, j < 3 ? '#d0e2df' : '#edd6b5');
      mono(c, num(n, 1), xx, y, 35, j < 3 ? blue : brass, 'center');
    }
    range(
      c,
      x0 - 52,
      x0 + (shared ? 5 : 2) * dx + 54,
      y - 76,
      shared ? 'both tokens' : 'first token',
      shared ? rust : teal,
    );
    const orig = shared ? a0.shared : a0.feature,
      value = shared ? a.shared : a.feature;
    text(c, 'First output', 1420, y - 57, 32, muted);
    mono(c, num(value, 3), 1420, y + 9, 64, shared ? rust : teal);
    mono(c, 'mean  ' + num(shared ? a.sharedMean : a.featureMean, 3), 485, y + 113, 34, ink);
    if (d > 0) mono(c, 'before   ' + num(orig, 3), 1420, y + 96, 30, muted);
  }
  if (k.beat.beatIndex === 1)
    text(c, 'Add 100 to the later token. Which output will move?', 965, 935, 48, ink, 'center', 'Serif');
}

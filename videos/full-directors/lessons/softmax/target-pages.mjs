import { LOGITS, PROBS, GRAD, FRESH_LOGITS } from '../../../films/softmax/fixtures.mjs';
import { positiveTemperature, crossEntropy, entropy } from '../../../films/softmax/arithmetic.mjs';
import { completeModel } from '../../../films/softmax/model.mjs';
import { illustration } from './dog-art.mjs';
import {
  ink,
  muted,
  paper,
  rule,
  fill,
  dye,
  gold,
  words,
  mono,
  serif,
  sans,
  fmt,
  pct,
  signed,
  mix,
  mixRows,
  cue,
  spoken,
  box,
  line,
  dot,
  txt,
  label,
  number,
  heading,
  strip,
  wordsKey,
  lanes,
  legendRule,
  arrow,
} from './print.mjs';

const model = completeModel();
const half = [0.5, 0.5, 0];
export function readerState(aligned, skewed, returned, missing) {
  const ran = 0.8 - 0.3 * aligned + 0.3 * skewed - 0.3 * returned + 0.5 * missing;
  const p = [ran, 1 - ran, 0],
    h = entropy(half),
    loss = crossEntropy(half, p);
  return { p, h, loss, kl: loss - h };
}
export function readers(c, k) {
  heading(c, k.beat.chapterTitle);
  const b = k.beat.beatIndex;
  const stack = cue(k, 0, 'Lay one sheet', 1.6);
  const match = cue(k, 2, 'into alignment', 1.6),
    skew = cue(k, 4, 'toward ran', 1.5),
    reset = cue(k, 4, 'Restore the match', 1.3);
  const supplied = spoken(k, 6, 'Suppose we send');
  const missing = supplied ? 0 : cue(k, 6, 'give slept zero', 1.1);
  const s = readerState(match, skew, reset, missing),
    x = 94,
    w = 680;
  // The outer edges register when the two half-width impressions share a sheet.
  function block(xx, yy, side, word, shareText) {
    c.save();
    c.translate(xx, yy);
    const start = (side * w) / 2;
    c.strokeStyle = '#998975';
    c.lineWidth = 2;
    c.strokeRect(0, 0, w, 204);
    box(c, start, 0, w / 2, 204, fill[side]);
    c.save();
    c.beginPath();
    c.rect(start, 0, w / 2, 137);
    c.clip();
    illustration(c, start + 19, -12, 0.42, side === 1);
    c.restore();
    txt(c, word, start + 32, 161, 42, dye[side], serif);
    txt(c, shareText, start + w / 2 - 20, 161, 23, ink, sans, 'right');
    c.restore();
  }
  block(x, 247, 0, 'ran', 'reader 1');
  const y = mix(493, 247, stack);
  if (b > 0 || cue(k, 0, 'second', 0.6) > 0) block(x, y, 1, 'slept', 'reader 2');
  if (stack > 0.99) {
    line(c, x + w / 2, 235, x + w / 2, 603, ink, 3, [8, 8]);
    label(c, 'Model prediction', x, 507);
    strip(c, x, 548, w, 60, s.p);
    wordsKey(c, x + 9, 659, 230, s.p);
  }
  if (!supplied) {
    label(c, 'Two endings, equal weight', 854, 200);
    label(c, 'Nats (rounded)', 1470, 200, 'right');
    line(c, 846, 229, 1496, 229);
    const answers = [
      spoken(k, 3, 'about point six nine three'),
      spoken(k, 3, 'also point six nine three'),
      spoken(k, 3, 'extra cost is zero'),
    ];
    [
      ['Reader entropy', s.h],
      ['Cross-entropy', s.loss],
      ['Extra cost (KL)', s.kl],
    ].forEach(([name, value], i) => {
      const yy = 310 + i * 127;
      txt(c, name, 855, yy, 38, ink, serif);
      if (answers[i]) {
        const ready = Number.isFinite(value) || spoken(k, 6, i === 1 ? 'infinite loss' : 'infinite KL');
        number(c, ready ? fmt(value) : '?', 1470, yy, 43, i === 2 ? gold : ink, 'right');
      }
    });
    if (b === 2 || (b === 3 && !answers[0])) txt(c, 'At a match, what cost remains?', 855, 688, 36, ink, serif);
    else if (b === 4) {
      label(c, 'Cost of ran', 855, 642);
      label(c, 'Cost of slept', 1195, 642);
      number(c, fmt(-Math.log(s.p[0])), 855, 697, 38, dye[0]);
      number(c, fmt(-Math.log(s.p[1])), 1195, 697, 38, dye[1]);
    } else if (b >= 1) txt(c, 'Cross-entropy = entropy + KL', 855, 685, 34, muted, serif);
  } else {
    const normalized = spoken(k, 7, 'divide both weights');
    const suppliedWeights = [0.8, 0.8, 0];
    const total = suppliedWeights.reduce((a, b) => a + b, 0);
    const weights = normalized ? suppliedWeights.map((v) => v / total) : suppliedWeights;
    label(c, 'Weights supplied to the loss', 872, 235);
    number(c, weights.map((v) => fmt(v, 2)).join('   '), 874, 322, 42);
    line(c, 868, 396, 1488, 396);
    if (normalized) label(c, 'Each supplied weight ÷ ' + fmt(total, 2), 874, 373);
    const showTotal = spoken(k, 6, 'one point six', { captionStart: false });
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
    number(c, 'a = ' + (showTotal ? fmt(weightSum, 2) : '?'), 872, 477, 50);
    if (spoken(k, 7, 'a times the prediction', { captionStart: 'gradient on the scores' })) {
      const simplified = spoken(k, 8, 'prediction minus target', { captionStart: false });
      txt(c, simplified ? 'Gradient = p − y' : 'Gradient = a × p − y', 870, 630, 45, ink, serif);
    }
  }
}
export function lossChoice(c, k) {
  heading(c, 'One confident miss, two losses');
  const b = k.beat.beatIndex;
  const p = model.certain,
    g = [p[1] - 1, model.squared[1]],
    t = cue(k, 4, 'Take a step', 1.7);
  label(c, 'Starting scores   [8, 0, 0]', 110, 185);
  strip(c, 110, 230, 1350, 56, p);
  wordsKey(c, 114, 350, 452, p, words, 3);
  const names = ['Cross-entropy', '½ squared error'];
  const x = 580,
    w = 605;
  names.forEach((s, i) => {
    const y = 538 + i * 111;
    txt(c, s, 113, y, 37, ink, serif);
    line(c, x, y, x + w, y, rule, 4);
    line(c, x, y - 18, x, y + 18, ink, 4);
    if (i ? spoken(k, 3, 'minus point zero zero zero seven') : spoken(k, 2, 'minus point nine nine nine seven')) {
      const end = x + w * -g[i] * t;
      box(c, x, y - 11, end - x, 22, fill[i]);
      dot(c, end, y, 9, dye[i]);
      number(c, t > 0 ? '+' + fmt(-g[i] * t, 5) : fmt(g[i], 5), 1224, y, 36, dye[i]);
    }
  });
  if (b === 2) {
    txt(c, '∂L / ∂z(slept) = p(slept) − 1', 109, 744, 41, ink, serif);
  } else if (b === 3) {
    const terms = p.map((pi, i) => (pi - Number(i === 1)) * pi * (Number(i === 1) - p[1]));
    txt(c, 'Rounded terms', 109, 743, 32, ink, serif);
    const result = spoken(k, 3, 'minus point zero zero zero seven') ? ' ≈ ' + fmt(g[1], 7) : '';
    number(c, terms.map((v) => signed(v, 7)).join('   ') + result, 346, 743, 28);
  } else
    label(
      c,
      t > 0 ? 'Change in the slept score' : 'Gradient on the slept score',
      109,
      b < 2 ? 470 : 742,
    );
}
const positionRows = [LOGITS, FRESH_LOGITS];
const classNames = ['bug', 'docs', 'today'];
const positions = ['after bug', 'after bug docs'];
const observedIndices = [1, 2];

function scoreCell(c, x, y, position, word, soft = false) {
  const selected = observedIndices[position] === word;
  const value = soft ? Number(selected) : positionRows[position][word];
  box(c, x, y, 152, 81, selected ? '#ffe0a6' : '#e6e6dd');
  if (selected) {
    c.strokeStyle = gold;
    c.lineWidth = 4;
    c.strokeRect(x, y, 152, 81);
  }
  txt(c, classNames[word], x + 76, y + 20, 25, dye[word], serif, 'center');
  number(c, fmt(value, value % 1 ? 1 : 0), x + 76, y + 56, 33, ink, 'center');
}
function positionLayout(c, left, soft = false) {
  positionRows.forEach((row, i) => {
    const y = 324 + 140 * i;
    txt(c, positions[i], left, y - 25, 27, ink, serif);
    row.forEach((_, j) => scoreCell(c, left + 195 * j, y, i, j, soft));
  });
}
function layout(c, k) {
  const b = k.beat.beatIndex;
  const left = 110, right = 900;
  heading(c, 'Keep each target attached to its position');
  txt(c, 'Original scores', left, 174, 44, ink, serif);
  number(c, '[B, S, V] = [1, 2, 3]', left, 231, 29);
  positionLayout(c, left);
  number(c, 'Target indices   [[1, 2]]', left, 670, 29);
  line(c, 786, 166, 786, 707);
  if (b === 5) {
    txt(c, 'Observed words', right, 174, 44, ink, serif);
    positions.forEach((position, i) => {
      const j = observedIndices[i], y = 317 + i * 140;
      label(c, position, right, y);
      txt(c, classNames[j], right, y + 52, 42, gold, serif);
      number(c, 'index ' + j, right + 213, y + 52, 34);
    });
  } else if (b === 6) {
    txt(c, 'Float one-hot targets', right, 174, 44, ink, serif);
    number(c, '[B, S, V] = [1, 2, 3]', right, 231, 29);
    positionLayout(c, right, true);
  } else if (b === 7) {
    txt(c, 'Transpose position and class', right - 52, 174, 41, ink, serif);
    const columns = [cue(k, 7, 'into the first column', 0.6), cue(k, 7, 'into the second column', 0.6)];
    columns.forEach((opacity, i) => {
      if (opacity === 0) return;
      c.save();
      c.globalAlpha = opacity;
      const x = right + i * 300;
      label(c, positions[i], x + 76, 282, 'center');
      classNames.forEach((_, j) => scoreCell(c, x, 318 + j * 96, i, j));
      c.restore();
    });
    if (columns[1] === 1) {
      number(c, '[B, V, S] = [1, 3, 2]', right, 231, 29);
      number(c, 'Target indices   [[1, 2]]', right, 670, 29);
    }
  } else if (spoken(k, 8, 'Flatten batch and position')) {
    txt(c, 'Flatten batch and position', right - 52, 174, 41, ink, serif);
    number(c, '[B × S, V] = [2, 3]', right, 231, 29);
    positionLayout(c, right);
    number(c, 'Target indices   [1, 2]', right, 670, 29);
  }
}
export function apiInput(c, k) {
  const b = k.beat.beatIndex;
  if (b >= 5) {
    layout(c, k);
    return;
  }
  heading(c, 'A frozen model at the loss input');
  const extra = cue(k, 2, 'normalizes again', 1.2) - cue(k, 3, 'Remove the extra softmax', 1.2);
  // Move between the two loss inputs. Recompute the lower strip at every point.
  const shown = positiveTemperature(mixRows(LOGITS, PROBS, extra), 1);
  label(c, 'Model probabilities', 108, 197);
  strip(c, 109, 235, 1366, 99, PROBS);
  wordsKey(c, 115, 389, 455, PROBS);
  label(
    c,
    extra === 1
      ? 'Inside the loss     softmax(probabilities)'
      : extra === 0
        ? 'Inside the loss     softmax(raw scores)'
        : 'Inside the loss     changing input',
    109,
    505,
  );
  strip(c, 109, 543, 1366, 83, shown);
  number(c, 'p(slept) ' + pct(shown[1]), 110, 689, 37);
  if (spoken(k, 1, 'two point one seven'))
    number(c, 'loss ' + fmt(-Math.log(shown[1])), 654, 689, 37);
  if ((extra === 0 || extra === 1) && spoken(k, 1, 'minus point eight nine'))
    number(c, 'g(slept) ' + fmt(extra ? model.wrongGradient[1] : GRAD[1]), 1083, 689, 32);
  if (b === 4) txt(c, 'CPU and GPU use the same input contract.', 110, 760, 30, muted, serif);
}
export function limits(c, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    heading(c, 'Cool a leader, then cool a tie');
    const cool = cue(k, 0, 'Cool the scores', 1.4),
      tie = cue(k, 0, 'raise slept', 1.5),
      hot = cue(k, 0, 'Turn the temperature up', 1.6);
    const z = [3, 1 + 2 * tie, 0],
      T = 1 - 0.96 * cool + 299.96 * hot;
    lanes(c, positiveTemperature(z, T), { x: 285, y: 233, w: 815, step: 128 });
    number(c, 'T = ' + fmt(T, 2), 104, 687, 42);
    number(c, 'scores   ' + z.map((v) => fmt(v, 1)).join('   '), 624, 687, 36);
    if (b === 1) label(c, 'T = 0 requires a decoder rule.', 108, 755);
    return;
  }
  if (b <= 4) {
    heading(
      c,
      b === 4 ? 'Which candidates can receive probability?' : 'Which operation comes first?',
    );
    const safe = b >= 3,
      mask = b === 4 && cue(k, 4, 'Mask ate', 0.3) > 0.5,
      all = b === 4 && cue(k, 4, 'Mask all three', 0.3) > 0.5;
    const z = [1e308, 1e308, 1e308].map((v, i) => (all || (mask && i === 2) ? -Infinity : v));
    const p = safe && !all ? positiveTemperature(z, 1e-308) : [];
    const rows = [['Scores', ...z.map((v) => (Number.isFinite(v) ? '1e308' : '−∞'))]];
    if (safe) {
      rows.push([
        'Subtract maximum',
        ...z.map((v) => (all ? 'undefined' : Number.isFinite(v) ? '0' : '−∞')),
      ]);
      rows.push([
        'Divide by T',
        ...z.map((v) => (all ? 'undefined' : Number.isFinite(v) ? '0' : '−∞')),
      ]);
      rows.push(['Probability', ...z.map((v, i) => (all ? 'invalid' : pct(p[i])))]);
    } else {
      rows.push(
        ['Divide by T', '∞', '∞', '∞'],
        ['Subtract maximum', '∞ − ∞', '∞ − ∞', '∞ − ∞'],
        ['Probability', 'undefined', 'undefined', 'undefined'],
      );
    }
    rows.forEach((row, i) => {
      const y = 249 + 109 * i;
      txt(c, row[0], 104, y, 32, ink, serif);
      const unsafeCues = ['', 'Each quotient overflows', 'infinity minus infinity', 'infinity minus infinity'];
      const safeCues = ['', 'gaps are zero', 'after division', 'one third'];
      const ready = i === 0 || b === 4 || (safe ? spoken(k, 3, safeCues[i]) : spoken(k, 2, unsafeCues[i]));
      if (ready)
        row.slice(1).forEach((v, j) => number(c, v, 659 + 329 * j, y, 36, dye[j], 'center'));
      line(c, 103, y + 49, 1483, y + 49);
    });
    number(c, 'T = 1e-308', 105, 737, 39);
    return;
  }
  heading(c, 'Soften the teacher and the student');
  const T = 1 + cue(k, 5, 'softened teacher', 1.2) + 6 * cue(k, 5, 'at high T', 1.5);
  label(c, 'Teacher scores   [3, 1, 0]', 104, 209);
  strip(c, 105, 257, 1350, 80, positiveTemperature(LOGITS, T));
  label(c, 'Student scores   [2, 1, 0]', 104, 407);
  strip(c, 105, 454, 1350, 80, positiveTemperature([2, 1, 0], T));
  number(c, 'T = ' + fmt(T, 1), 110, 619, 38);
  txt(c, 'Raw-score gradient = (student − teacher) / T', 401, 621, 40, ink, serif);
  if (b === 6) txt(c, 'Scale the soft-target loss by T².', 110, 730, 36, gold, serif);
}
export function smoothing(c, k) {
  const b = k.beat.beatIndex;
  const rise = cue(k, 0, 'Raise its score', 1.8),
    smooth = cue(k, 1, 'Label smoothing changes', 1.2);
  const target = mixRows([0, 1, 0], model.smooth, smooth);
  const gap =
    4.5 * rise +
    (model.smoothGap - 4.5) * cue(k, 2, 'Matching these', 1.1) +
    1.2 * (cue(k, 3, 'exceeds its smoothed target', 1.1) - cue(k, 4, 'That gap fixes', 1.1));
  const offset = 10 * cue(k, 4, 'Add ten', 1.2),
    mask = cue(k, 5, 'exclude ate', 0.5) > 0.5;
  heading(c, mask ? 'What does the excluded word cost?' : 'How large a lead does slept need?');
  const z = [offset, offset + gap, mask ? -Infinity : offset],
    p = positiveTemperature(z, 1);
  label(c, 'Solid bars show model probabilities', 115, 195);
  lanes(c, p, { x: 230, y: 264, w: 695, step: 111, refs: target, n: 2 });
  const focus = mask ? 2 : 1;
  label(c, 'Target for ' + words[focus], 1115, 233);
  number(c, pct(target[focus], 2), 1114, 295, 50);
  label(c, mask ? 'Smoothed cross-entropy' : 'Gradient on slept', 1115, 418);
  if (!mask)
    number(
      c,
      Math.abs(p[1] - target[1]) < 1e-10 ? '0.000' : signed(p[1] - target[1]),
      1115,
      480,
      52,
    );
  else {
    const loss = crossEntropy(target, p);
    number(c, spoken(k, 6, 'smoothed loss is infinite') ? fmt(loss) : '?', 1115, 480, 56, gold);
    label(c, 'target ' + pct(target[2], 2), 230 + 695 * target[2] + 12, 553);
  }
  legendRule(c, 'Target shares');
  number(c, 'scores   ' + z.map((v) => fmt(v, 2)).join('   '), 608, 695, 35);
  if (b === 3 && spoken(k, 3, 'At the minimum'))
    txt(
      c,
      'At a match, loss ≈ ' + fmt(model.smoothEntropy) + ' nats and the lead is ln(28).',
      610,
      756,
      31,
      ink,
      serif,
    );
}

import {
  LOGITS,
  WORDS,
  TARGET,
  PROBS,
  GRAD,
  UPDATED,
  FRESH_LOGITS,
} from '../../../films/softmax/fixtures.mjs';
import { lossTrace, positiveTemperature } from '../../../films/softmax/arithmetic.mjs';
import { completeModel, freshState } from '../../../films/softmax/model.mjs';
import { illustration } from './dog-art.mjs';
import {
  ink,
  muted,
  rule,
  paper,
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
  table,
  arrow,
  legendRule,
} from './print.mjs';

const model = completeModel();
const title = (c, k) => heading(c, k.beat.chapterTitle);
const stepProb = (z) => lossTrace(z, TARGET).probabilities;
export function opening(c, k) {
  const lift = cue(k, 1, 'Lift the flap', 1.1);
  const select = cue(k, 1, 'Follow it', 0.8);
  const cx = 1090,
    cy = 415,
    r = 245;
  label(c, 'A page from the training text', 106, 114);
  illustration(c, 112, 198, 0.87, true);
  txt(c, 'The dog', 115, 551, 78, ink, serif);
  txt(c, 'slept.', 418, 551, 78, dye[1], serif);
  if (lift < 1) {
    c.save();
    c.translate(406, 494);
    c.scale(1, 1 - lift);
    box(c, 4, 6, 222, 106, '#a89979');
    box(c, 0, 0, 222, 106, '#e6d7ad');
    line(c, 3, 3, 218, 3, '#917b50', 3, [7, 5]);
    c.restore();
  }
  txt(
    c,
    lift < 1 ? 'Which slice will the loss score?' : 'The printed word is the target.',
    112,
    691,
    37,
    ink,
    serif,
  );
  let angle = -Math.PI * 0.15;
  const mid = PROBS.map((p, i) => {
    const end = angle + 2 * Math.PI * p;
    c.beginPath();
    c.moveTo(cx, cy);
    c.arc(cx, cy, r, angle, end);
    c.closePath();
    c.fillStyle = fill[i];
    c.fill();
    c.strokeStyle = paper;
    c.lineWidth = 4;
    c.stroke();
    const m = (angle + end) / 2;
    angle = end;
    return m;
  });
  dot(c, cx, cy, 87, paper);
  txt(c, 'model', cx, cy, 31, ink, serif, 'center');
  const placements = [
    [950, 518],
    [1401, 290],
    [1401, 432],
  ];
  PROBS.forEach((p, i) => {
    const [x, y] = placements[i];
    if (i) {
      const xx = cx + Math.cos(mid[i]) * r,
        yy = cy + Math.sin(mid[i]) * r;
      line(c, xx, yy, x - 55, y - 4, dye[i], i === 1 && select ? 5 : 2);
    }
    txt(c, WORDS[i], x, y, 42, dye[i], serif, 'center');
    number(c, pct(p, 0), x, y + 47, 38, ink, 'center');
  });
  if (select) {
    c.save();
    c.globalAlpha = select;
    line(c, 1360, 361, 1445, 361, dye[1], 6);
    c.restore();
  }
  if (cue(k, 2, 'A prediction that gives slept', 0.6) > 0.5) {
    txt(c, 'Score the green slice', 860, 722, 35, dye[1], serif);
    number(c, 'L = −ln p(slept)', 1185, 722, 30);
  }
}
export function gaps(c, k) {
  title(c, k);
  const shift =
    1000 * (cue(k, 1, 'Add a thousand', 1.3) - cue(k, 2, 'Subtract that shared offset', 1.2));
  const start = 270,
    dx = 333,
    y = 432;
  label(c, 'Logit ruler', 100, 195);
  number(c, 'offset   ' + signed(Math.round(shift), 0), 1090, 197, 33);
  box(c, 135, y - 29, 1324, 61, '#e1d9bf');
  line(c, 135, y + 31, 1459, y + 31, ink, 2);
  for (let i = 0; i <= 3; i++) {
    const x = start + dx * i;
    line(c, x, y - 29, x, y + 14, ink, 3);
    number(c, Math.round(shift) + i, x, y + 80, 38, ink, 'center');
    if (i < 3)
      for (let j = 1; j < 10; j++)
        line(c, x + (j * dx) / 10, y - 29, x + (j * dx) / 10, y - 13, muted, 1);
  }
  LOGITS.forEach((z, i) => {
    const x = start + z * dx;
    txt(c, WORDS[i], x, 328, 51, dye[i], serif, 'center');
    dot(c, x, y - 28, 12, dye[i]);
  });
  for (const [a, b, yy] of [
    [0, 1, 611],
    [1, 3, 660],
  ]) {
    const left = start + a * dx,
      right = start + b * dx;
    line(c, left, yy, right, yy, ink, 3);
    [left, right].forEach((x) => line(c, x, yy - 10, x, yy + 10, ink, 3));
    number(
      c,
      b - a + ' point' + (b - a === 1 ? '' : 's'),
      (left + right) / 2,
      yy - 35,
      30,
      ink,
      'center',
    );
  }
  if (cue(k, 2, 'original scores return', 0.45) > 0.5) {
    txt(c, 'Subtract the common offset', 100, 746, 30, muted);
    number(c, '[1003, 1001, 1000] − 1000 = [3, 1, 0]', 621, 746, 31);
  }
}
export function exponentials(c, k) {
  title(c, k);
  const shift = Math.round(30 * cue(k, 1, 'subtract the largest score', 1.3)) / 10,
    offset = Math.round(1000 * cue(k, 2, 'add a thousand', 1.3));
  const raw = LOGITS.map((z) => z + offset),
    shifted = raw.map((z) => z - shift - offset),
    wt = shifted.map(Math.exp);
  const peak = Math.max(...wt);
  label(c, 'Word', 100, 199);
  label(c, 'Input score', 344, 199);
  label(c, 'Exponent', 607, 199);
  label(c, 'Weight relative to the largest', 889, 199);
  label(c, 'exp(score − shift)', 1278, 199);
  words.forEach((w, i) => {
    const y = 305 + i * 143;
    txt(c, w, 101, y, 52, dye[i], serif);
    number(c, fmt(raw[i], 0), 351, y);
    number(c, fmt(shifted[i], shift % 1 ? 1 : 0), 620, y);
    box(c, 885, y - 20, 380, 40, '#e9e1cf');
    box(c, 885, y - 20, (380 * wt[i]) / peak, 40, fill[i]);
    number(c, fmt(wt[i], 3), 1290, y, 35);
    line(c, 95, y + 66, 1505, y + 66, rule, 1);
  });
  number(c, 'w(ran) / w(slept) ≈ ' + fmt(wt[0] / wt[1], 2), 100, 723, 36);
  number(c, 'Shift   ' + fmt(shift + offset, shift % 1 ? 1 : 0), 1050, 723, 36);
}
export function mass(c, k) {
  title(c, k);
  const raise = cue(k, 1, 'Raise only', 1.45) - cue(k, 2, 'Restore', 1.2);
  const z = [3, 1 + raise, 0],
    v = lossTrace(z, 1);
  const add = cue(k, 0, 'Add the three', 1.6),
    divide = cue(k, 0, 'Fit each piece', 1.5);
  label(c, 'Shifted weights (rounded)', 110, 215);
  label(c, 'Total from unrounded weights', 1480, 215, 'right');
  v.weights.forEach((w, i) => {
    const x = 130 + i * 374;
    txt(c, words[i], x, 300, 46, dye[i], serif);
    number(c, fmt(w), x, 375, 52);
    if (i < 2) txt(c, '+', x + 250, 371, 46, muted);
  });
  txt(c, '≈', 1195, 370, 50);
  number(c, add === 1 ? fmt(v.total) : '?', 1290, 370, 50);
  box(c, 110, 490, 1370, 108, '#e5e1d6');
  c.save();
  c.globalAlpha = divide;
  strip(c, 110, 490, 1370, 108, v.probabilities);
  c.restore();
  wordsKey(c, 122, 657, 445, divide === 1 ? v.probabilities : null);
}
export function price(c, k) {
  title(c, k);
  const i = k.beat.beatIndex;
  const t = cue(k, 1, 'Move to the observed word', 1.5),
    p = mix(PROBS[0], PROBS[1], t);
  const x = (v) => 170 + 795 * v,
    y = (v) => 646 - 134 * v;
  for (let j = 0; j <= 3; j++) {
    line(c, 168, y(j), 966, y(j), rule, 1);
    number(c, j, 139, y(j), 25, muted, 'right');
  }
  label(c, i === 2 ? 'Original dog prediction · loss in nats' : 'Loss in nats', 105, 178);
  label(c, 'Target probability', 641, 713);
  for (const v of [0, 0.25, 0.5, 0.75, 1]) number(c, fmt(v, 2), x(v), 677, 23, muted, 'center');
  c.beginPath();
  for (let j = 0; j <= 200; j++) {
    const v = 0.05 + (0.95 * j) / 200;
    j ? c.lineTo(x(v), y(-Math.log(v))) : c.moveTo(x(v), y(-Math.log(v)));
  }
  c.strokeStyle = ink;
  c.lineWidth = 5;
  c.stroke();
  line(c, x(p), y(0), x(p), y(-Math.log(p)), gold, 3, [7, 6]);
  dot(c, x(p), y(-Math.log(p)), 14, gold);
  if (i < 2) {
    txt(
      c,
      t === 0 ? 'If the dog ran' : t === 1 ? 'The dog slept' : 'Toward the slept slice',
      1050,
      286,
      45,
      ink,
      serif,
    );
    number(c, pct(p), 1050, 387, 58);
    label(c, 'Probability on the word', 1050, 449);
    number(c, fmt(-Math.log(p)) + ' nats', 1050, 570, 48);
    label(c, '−ln(p)', 1050, 632);
  } else {
    const extreme = cue(k, 2, 'Try a lead', 0.25) > 0.5;
    const v = lossTrace(extreme ? [1000, 0, -1] : LOGITS, 1);
    label(c, 'Maximum − target score', 1020, 243);
    number(c, fmt(v.gap, 0), 1020, 301, 54);
    label(c, 'Log of shifted total', 1020, 408);
    number(c, '+ ' + fmt(v.logTotal), 1020, 465, 52);
    line(c, 1020, 522, 1470, 522, ink);
    if (!extreme || spoken(k, 2, 'still one thousand nats'))
      number(c, fmt(v.loss) + ' nats', 1020, 582, 44);
    if (extreme) txt(c, 'Target weight rounded to 0', 1020, 667, 30, gold);
  }
}
function probabilityNudge(c, k) {
  const b = k.beat.beatIndex;
  const initialNudge = 0.23;
  const raise = cue(k, 1, 'Blue and pink both give some up', 1.1);
  const reset = cue(k, 2, 'Return to the original scores', 1.05);
  const replay = b === 2 ? cue(k, 2, 'Imagine making the nudge', 0.6) : 0;
  const test = replay > 0;
  const nudge = test
    ? replay * mix(initialNudge, 0.001, cue(k, 2, 'making the nudge smaller and smaller', 5))
    : initialNudge * (raise - reset);
  const h = Math.round(nudge * 1000) / 1000;
  const showSlope = test && h > 0 && spoken(k, 2, 'The slope tells us');
  const z = LOGITS.map((value, i) => value + (i === TARGET ? h : 0));
  const p = h === 0 ? PROBS : stepProb(z);
  const changes = p.map((value, i) => value - PROBS[i]);

  const rowTop = 245;
  const rowStep = 94;
  txt(c, 'Word', 107, 190, 29, muted);
  txt(c, test ? 'Test logit' : 'Logit', 345, 190, 29, muted, sans, 'right');
  txt(c, 'Probability', 465, 190, 29, muted);
  txt(c, showSlope ? 'Slope estimate' : 'Change (pp)', 1485, 190, 29, muted, sans, 'right');
  lanes(c, p, {
    x: 465,
    y: rowTop,
    w: 566,
    step: rowStep,
    refs: PROBS,
    names: ['', '', ''],
    n: 2,
  });
  z.forEach((value, i) => {
    const y = rowTop + i * rowStep + 19;
    txt(c, words[i], 107, y, 42, dye[i], serif);
    number(c, fmt(value), 345, y, 36, dye[i], 'right');
    const change = showSlope ? changes[i] / h : Math.round(10000 * changes[i]) / 100;
    number(c, signed(change, showSlope ? 4 : 2), 1485, y, 36, dye[i], 'right');
  });
  line(c, 104, 523, 1485, 523);

  const balance = b === 2 || (b === 1 && raise === 1 && k.elapsed >= k.wordCue('as green gains').end);
  if (test) {
    txt(c, 'Nudge from the starting logit', 107, 568, 36, ink, serif);
    number(c, 'Δz(slept) = ' + signed(h), 852, 568, 41, dye[TARGET]);
    if (showSlope)
      txt(c, 'Slope estimate = (change in pp ÷ 100) ÷ logit change', 107, 642, 38, ink, serif);
  } else if (balance && h > 0) {
    const x = 500;
    const scale = 24000;
    const ranLoss = -scale * changes[0];
    const ateLoss = -scale * changes[2];
    const gained = scale * changes[TARGET];
    txt(c, 'Given up by ran and ate', 107, 585, 31, ink, serif);
    txt(c, 'Gained by slept', 107, 653, 31, ink, serif);
    line(c, x, 557, x, 682, rule, 2);
    box(c, x, 570, ranLoss, 30, fill[0]);
    box(c, x + ranLoss, 570, ateLoss, 30, fill[2]);
    box(c, x, 638, gained, 30, fill[TARGET]);
    line(c, x + gained, 600, x + gained, 638, muted, 2);
    number(c, '≈ ' + fmt(100 * changes[TARGET], 2) + ' pp each', 1485, 619, 31, ink, 'right');
  }
  legendRule(
    c,
    showSlope
      ? 'Dotted marks show starting probabilities. Slopes show probability change per logit point.'
      : 'Dotted marks show starting probabilities. Changes are in percentage points (pp).',
  );
}

export function jacobian(c, k) {
  const b = k.beat.beatIndex;
  title(c, k);
  if (b < 2 || (b === 2 && !spoken(k, 2, 'In one column'))) {
    probabilityNudge(c, k);
    return;
  }
  if (b < 5) {
    const cols = [655, 997, 1328];
    if (b === 2) {
      c.strokeStyle = dye[TARGET];
      c.lineWidth = 3;
      c.strokeRect(cols[TARGET] - 133, 187, 266, 373);
    }
    label(c, 'Probability change per logit point', 100, 219);
    cols.forEach((x, j) => label(c, 'Nudge ' + words[j], x, 219, 'center'));
    words.forEach((w, i) => {
      const yy = 322 + i * 96;
      txt(c, w, 103, yy, 44, dye[i], serif);
      model.jacobian[i].forEach((g, j) => {
        box(c, cols[j] - 115, yy - 35, 230, 71, i === j ? '#d1e6d4' : '#efe1d7');
        number(c, signed(g, 4), cols[j], yy, 33, ink, 'center');
      });
    });
    if (spoken(k, 4, 'sums to zero')) {
      line(c, 93, 578, 1482, 578);
      label(c, 'Column sums', 103, 632);
      cols.forEach((x, j) => {
        const sum = model.jacobian.reduce((a, row) => a + row[j], 0);
        number(c, fmt(Math.abs(sum), 0), x, 632, 45, dye[1], 'center');
      });
    }
    number(c, 'J[i,j] = p[i] × (δ[i,j] − p[j])', 102, 728, 40);
    return;
  }
  const logSlopeKnown = spoken(k, 6, 'minus one over');
  const rows = [1, 0, 2].map((j, row) => {
    const active = b > 5 || cue(k, 5, ['its own score', 'Raise ran', 'Raise ate'][row], 0.4) > 0.4;
    const result =
      (j === 1 ? cue(k, 7, 'p slept minus one', 0.4) : cue(k, 8, 'leaves p ran', 0.4)) > 0.5;
    return [
      words[j],
      active ? signed(model.jacobian[1][j], 4) : '…',
      logSlopeKnown ? '×  ' + fmt(model.targetSlope, 2) : '',
      result ? signed(model.chain[j]) : '',
    ];
  });
  if (spoken(k, 6, 'multiply each'))
    label(c, 'Multiply the slopes before rounding. The table shows rounded values.', 105, 158);
  table(c, ['Nudge this logit', 'Slope of p(slept)', 'Slope of −ln(p)', 'Slope of loss'], rows, {
    xs: [105, 490, 872, 1246],
    colors: [dye[1], dye[0], dye[2]],
  });
  const summary =
    b >= 10
      ? '[L(z + h e_j) − L(z − h e_j)] / (2h)'
      : b === 9
        ? '∂ log Σ exp(z) / ∂z[j]' + (spoken(k, 9, 'its own softmax share') ? ' = p[j]' : '')
        : b >= 7
          ? 'p(slept) × (−1 / p(slept)) = −1'
          : 'Differentiate one score at a time.';
  txt(c, summary, 100, 705, 44, ink, b >= 7 ? mono : serif);
  if (b >= 10) txt(c, 'e_j is the unit vector for the selected logit.', 100, 765, 34, muted);
}
export function gradient(c, k) {
  title(c, k);
  const a = [
    cue(k, 0, 'First subtract', 0.45),
    cue(k, 1, 'For slept', 0.45),
    cue(k, 1, 'For ate', 0.45),
  ];
  table(
    c,
    ['Word', 'Prediction', 'Observed target', 'Gradient'],
    words.map((w, i) => [
      w,
      fmt(PROBS[i]),
      i === 1 ? '1' : '0',
      a[i] > 0.5 ? signed(GRAD[i]) : '…',
    ]),
    { xs: [110, 440, 810, 1220], colors: dye },
  );
  if (spoken(k, 2, 'sum is zero')) {
    line(c, 1090, 585, 1490, 585, ink);
    number(c, 'sum  0.000', 1110, 649, 39);
  }
  txt(c, 'Gradient = prediction − target', 106, 710, 46, ink, serif);
}
export function update(c, k) {
  title(c, k);
  const u =
    0.5 * cue(k, 0, 'Subtract one point five', 2) + 0.5 * cue(k, 1, 'Continue the step', 2.7);
  const z = mixRows(LOGITS, UPDATED, u),
    v = lossTrace(z, 1);
  label(c, 'Scores during the step', 104, 200);
  label(c, 'Recomputed probabilities', 685, 200);
  z.forEach((v, i) => {
    const yy = 309 + i * 117;
    txt(c, words[i], 106, yy, 42, dye[i], serif);
    number(c, fmt(v), 330, yy, 48);
  });
  lanes(c, v.probabilities, {
    x: 684,
    y: 287,
    w: 600,
    step: 117,
    names: ['', '', ''],
    refs: PROBS,
  });
  number(c, 'loss   ' + fmt(v.loss) + ' nats', 113, 707, 45);
  label(c, 'Dashed marks show the starting shares.', 850, 705);
}
export function cooling(c, k) {
  title(c, k);
  const cold = cue(k, 0, 'Lower the temperature', 1.5),
    hot = cue(k, 0, 'Raise it', 1.5),
    again = cue(k, 2, 'Ran takes', 1.4),
    reset = cue(k, 3, 'Bring temperature', 1.1);
  const T = 1 - 0.5 * cold + 1.5 * hot - 1.65 * again + 0.65 * reset;
  const learn = cue(k, 3, 'apply our learned scores', 1.7),
    z = mixRows(LOGITS, UPDATED, learn),
    p = positiveTemperature(z, T);
  label(c, 'Temperature', 111, 203);
  number(c, fmt(T, 2), 110, 313, 86);
  line(c, 115, 451, 543, 451, ink, 5);
  dot(c, 115 + (428 * (T - 0.35)) / 1.65, 451, 18, gold);
  label(c, 'Cool', 112, 492);
  label(c, 'Warm', 544, 492, 'right');
  label(c, 'Word probabilities', 684, 201);
  lanes(c, p, { x: 800, y: 284, w: 488, step: 116 });
  txt(c, 'Scores', 109, 646, 30, muted);
  number(c, z.map((v) => fmt(v, 2)).join('     '), 109, 704, 36);
}
export function transfer(c, k) {
  title(c, k);
  const b = k.beat.beatIndex;
  if (b <= 1) {
    const f = freshState(cue(k, 1, 'Subtract that gradient', 1.8));
    txt(c, 'The cat ate.', 112, 282, 84, ink, serif);
    label(c, 'Scores for ran, slept, ate', 112, 409);
    number(c, f.logits.map((v) => fmt(v, 2)).join('   '), 111, 475, 37);
    if (b === 1) {
      label(c, 'Starting gradient on ate', 115, 577);
      number(c, spoken(k, 1, 'minus point two six four') ? fmt(f.gradient[2]) : '?', 114, 642, 47, dye[2]);
    }
    lanes(c, f.probabilities, { x: 856, y: 254, w: 425, refs: f.before.probabilities });
    return;
  }
  if (b === 2) {
    const cat = lossTrace(FRESH_LOGITS, 2),
      dog = lossTrace(LOGITS, 1);
    table(
      c,
      ['Observation', 'Target probability', 'Negative log'],
      [
        ['The dog slept.', pct(PROBS[1]), fmt(dog.loss)],
        ['The cat ate.', pct(cat.probabilities[2]), fmt(cat.loss)],
      ],
      { xs: [113, 715, 1191], step: 148 },
    );
    number(
      c,
      'p(pair) ≈ ' +
        fmt(PROBS[1]) +
        ' × ' +
        fmt(cat.probabilities[2]) +
        (spoken(k, 2, 'multiply the observed-word') ? ' ≈ ' + fmt(PROBS[1] * cat.probabilities[2]) : ''),
      115,
      610,
      32,
    );
    if (spoken(k, 2, 'Divide by two')) number(
      c,
      '(' +
        fmt(dog.loss) +
        ' + ' +
        fmt(cat.loss) +
        ') / 2 ≈ ' +
        fmt((dog.loss + cat.loss) / 2) +
        ' nats',
      116,
      670,
      39,
    );
    return;
  }
  const change = cue(k, 3, 'This time the dog ate', 0.65) > 0.5;
  txt(c, 'The dog ' + (change ? 'ate.' : 'slept.'), 110, 300, 82, change ? dye[2] : dye[1], serif);
  strip(c, 112, 421, 1368, 85, PROBS);
  wordsKey(c, 130, 571, 438, PROBS);
  if (spoken(k, 4, 'one nat'))
    number(
      c,
      'Δ loss = ' + fmt(lossTrace(LOGITS, 2).loss - lossTrace(LOGITS, 1).loss, 0) + ' nat',
      113,
      695,
      44,
    );
}

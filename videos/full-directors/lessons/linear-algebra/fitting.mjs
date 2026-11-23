import { A, B, mean, common, contrast, severity } from '../../../films/linear-algebra/fixtures.mjs';
import { leastSquaresFit, solverRoundingExample, sparseFrame } from '../../../films/linear-algebra/model.mjs';
import {
  C,
  colors,
  names,
  mix,
  dot,
  times,
  plus,
  lerpRow,
  num,
  vec,
  cue,
  type,
  mono,
  title,
  rect,
  path,
  line,
  disk,
  arrow,
  base,
  note,
  matrix,
  gauge,
  point,
  plane,
  straightedge,
  instrument,
  dial,
} from './studio.mjs';

export const centered = A.map((row) => plus(row, times(mean, -1)));
export const centeredScores = centered.map((r) => [dot(r, common), dot(r, contrast)]);
export const comparisonRows = (t) => [A[0], [2, 1]].map((row) => plus(row, times(mean, -t)));
export function spread(direction) {
  const s = centered.map((row) => dot(row, direction));
  return dot(s, s);
}
const bidx = (k) => k.beat.beatIndex;
function center(c, k) {
  base(c, 'Move the average ticket to zero', 'Principal component analysis  /  training set');
  const t = cue(k, 0, 'Subtract it from every row', 2);
  const p = plane(c, 532, 576, 240, [-1.35, 1.72, -1.02, 1.1], ['Slow mentions', 'Rollback mentions']);
  const moved = A.map((row) => plus(row, times(mean, -t))),
    m = times(mean, 1 - t);
  path(c, A.map(p), '#bec4b1', 3, true);
  path(c, moved.map(p), C.green, 4, true, '#77b8a229');
  moved.forEach((row, i) => point(c, ...p(row), i, 15));
  const [x, y] = p(m);
  line(c, x - 14, y, x + 14, y, C.gold, 6);
  line(c, x, y - 14, x, y + 14, C.gold, 6);
  title(c, 'Training mean', 1133, 336, 54);
  mono(c, '[2/3,  2/3]', 1135, 415, 51, C.gold);
  type(c, 'Rows relative to the moving origin', 1135, 526, 35);
  matrix(c, moved, 1140, 573, { cw: 190, rh: 81, sz: 44, digits: 3 });
  type(c, 'Subtract the same vector from every point. The distances between tickets stay fixed.',
    96, 862, 36, C.ink, { width: 1720 });
}
function spreadScene(c, k) {
  base(c, 'Which ruler sees the most spread?', 'PCA  /  centered training rows');
  const turn = cue(k, 0, 'turn the measuring stick', 1.8);
  const a = Math.PI * (0.25 + 0.5 * turn),
    d = [Math.cos(a), Math.sin(a)];
  const s = centered.map((r) => dot(r, d)),
    cross = centeredScores.map(([u, v]) => u * v);
  const p = plane(c, 555, 548, 290, [-1.28, 1.28, -1, 1], ['Slow', 'Rollback']);
  straightedge(c, p, d, -1.23, 1.23);
  centered.forEach((r, i) => {
    const foot = times(d, s[i]);
    path(c, [p(r), p(foot)], colors[i], 3);
    point(c, ...p(r), i, 12);
    disk(c, ...p(foot), 13 - i * 2, C.paper2, colors[i], 4);
  });
  if (bidx(k) === 0) {
    title(c, 'Squared distances', 1070, 363, 54);
    s.forEach((v, i) => {
      const y = 477 + i * 91;
      type(c, names[i], 1075, y, 35, colors[i]);
      mono(c, num(v * v, 3), 1660, y, 41, C.ink, 'right');
    });
    type(c, 'Total', 1075, 786, 38);
    mono(c, num(spread(d), 3), 1660, 786, 55, C.green, 'right');
    type(c, 'Total uses unrounded values', 1075, 850, 35, C.muted);
  } else {
    title(c, 'Multiply the signed scores', 991, 333, 49);
    const operands = ['Start with slow pages', 'Next take rollback', 'Now take the joint ticket']
      .map((phrase) => cue(k, 1, phrase, 0));
    const products = ['Next take rollback', 'Now take the joint ticket', 'Add the three products']
      .map((phrase) => cue(k, 1, phrase, 0));
    const active = operands.findLastIndex(Boolean);
    const signedFraction = (v, denominator, label) => {
      const n = Math.round(v * denominator);
      return n ? num(n) + '/' + label : '0';
    };
    const xx = [1349, 1566, 1755];
    ['Common', 'Contrast', 'Product'].forEach((label, j) =>
      type(c, label, xx[j], 432, 32, C.muted, { align: 'center' }));
    if (bidx(k) === 2) {
      mono(c, 'Σ score² = 1/3', xx[0], 474, 23, C.blue, 'center');
      mono(c, 'Σ score² = 1', xx[1], 474, 23, C.pink, 'center');
    }
    cross.forEach((v, i) => {
      const y = 527 + i * 86;
      if (active === i && !products[i]) rect(c, 980, y - 34, 855, 68, C.paper2, 5);
      type(c, names[i], 992, y, 32, colors[i]);
      const [u, w] = centeredScores[i];
      mono(c, signedFraction(u, 3 * Math.SQRT2, '(3√2)'), xx[0], y, 34, C.ink, 'center');
      mono(c, signedFraction(w, Math.SQRT2, '√2'), xx[1], y, 34, C.ink, 'center');
      mono(c, products[i] ? signedFraction(v, 6, '6') : '·', xx[2], y, 36, products[i] ? C.green : C.muted, 'center');
    });
    const sum = cue(k, 1, 'so the centered Gram matrix', 0);
    if (sum) mono(c, '1/6 − 1/6 + 0 = ' + num(cross.reduce((a, b) => a + b, 0)), 992, 811, 44, C.green);
  }
  if (bidx(k) === 2)
    type(c, 'A mixture cannot exceed the larger eigenvalue.', 96, 860, 37);
  else note(c, 'Measure each signed distance from the training mean.');
}
function future(c, k) {
  base(c, 'Keep the training ruler for the next ticket', 'PCA  /  transform a new row');
  const t = cue(k, 0, 'Subtract the saved training mean', 1.35);
  const project = cue(k, 2, 'The two marks meet', 1.4);
  const [old, row] = comparisonRows(t);
  const p = plane(c, 438, 548, 218, [-1.1, 2.35, -1.2, 1.19], ['Slow', 'Rollback']);
  if (t === 1) straightedge(c, p, contrast, -1.55, 1.45);
  mono(c, '0', p([0, 0])[0] - 22, p([0, 0])[1] + 26, 28, C.muted, 'center');
  const one = times(contrast, dot(old, contrast)),
    two = times(contrast, dot(row, contrast));
  for (const [i, v, foot] of [
    [0, old, one],
    [3, row, two],
  ]) {
    const to = lerpRow(v, foot, project);
    point(c, ...p(v), i);
    if (project > 0) {
      path(c, [p(v), p(to)], colors[i], 4);
      disk(c, ...p(to), i === 0 ? 19 : 11, colors[i]);
    }
  }
  title(c, t === 0 ? 'Raw mention counts' : t === 1 ? 'Centered mention counts' : 'Subtract the training mean', 1055, 316, 48);
  type(c, t === 0 ? 'Origin: no mentions of either issue' : t === 1 ? 'Origin: the average training ticket' : 'Move both tickets by the same offset.', 1055, 392, 33, C.muted);
  type(c, 'Slow pages', 1055, 492, 37, colors[0]);
  mono(c, vec(old, 3), 1311, 492, 40);
  type(c, 'New ticket', 1055, 593, 37, colors[3]);
  mono(c, vec(row, 3), 1311, 593, 40);
  if (cue(k, 2, 'Adding one mention', 0)) {
    type(c, 'Contrast score', 1100, 695, 36);
    mono(c, num(dot(row, contrast), 3), 1100, 758, 54, C.pink);
  } else if (t > 0) mono(c, 'Training mean = [2/3, 2/3]', 1055, 738, 38, C.muted);
  note(
    c,
    bidx(k) === 3
      ? 'For 64 directions:  (rows − training mean) × V[:, :64].  Keep the training units.'
      : 'The old and new tickets differ by one mention in each feature.',
    860,
  );
}
function sparse(c, k) {
  base(c, 'What becomes of the empty cells?', 'Word-count storage  /  six tickets, six words');
  const t = cue(k, 0, 'those empty cells fill', 1.4),
    s = sparseFrame({ beat: 0, cues: { 'sparse-center': { phase: 'during', progress: t } } });
  const display = (x, values, right) => {
    values.forEach((row, i) =>
      row.forEach((v, j) => {
        const px = x + j * 79,
          py = 361 + i * 78,
          active = Math.abs(v) > 1e-10;
        rect(c, px, py, 68, 64, active ? (v > 0 ? C.blue : C.pink) : '#dedfcd', 5);
        if (active)
          mono(c, right && t > 0 ? (v > 0 ? '+' : '−') : '1', px + 34, py + 32, 37, C.light, 'center');
      }),
    );
  };
  display(215, sparseFrame({ beat: 0, beatP: 0 }).values, false);
  display(1174, s.values, true);
  title(c, 'Sparse counts', 215, 294, 48);
  title(c, t === 1 ? 'Centered counts' : 'Subtract the column mean', 1100, 294, 48);
  arrow(c, [789, 567], [1057, 567], C.gold, 7);
  mono(c, '− 1/6', 922, 508, 39, C.gold, 'center');
  mono(c, '6 entries', 452, 337, 32, C.blue, 'center');
  mono(c, s.nonzeros + ' nonzero entries', 1412, 337, 32, C.pink, 'center');
  for (const [i, line] of ['Implicit centering', 'Subtract the mean', 'during multiplication'].entries())
    type(c, line, 922, 651 + 38 * i, 28, C.ink, { align: 'center' });
}
// An oblique view of three predictions. The third coordinate rises vertically.
function outputPoint(v) {
  return [478 + (v[0] - v[1]) * 106, 779 + (v[0] + v[1]) * 26 - v[2] * 119];
}
function outputPlane(c, columns, scale = 2.3) {
  for (let s = 0; s <= scale + 0.01; s += 0.35) {
    for (const [a, b] of [
      [columns[0], columns[1]],
      [columns[1], columns[0]],
    ]) {
      const l = times(a, s);
      path(c, [outputPoint(l), outputPoint(plus(l, times(b, scale)))], '#acbba9', 2);
    }
  }
  for (const [i, v] of columns.entries())
    arrow(c, outputPoint([0, 0, 0]), outputPoint(times(v, scale)), colors[i], 5);
}
function targetRails(c, pred, hideLast = false) {
  type(c, 'Observed  ○', 1000, 310, 34, C.gold);
  type(c, 'Predicted  ●', 1396, 310, 34, C.green);
  for (const [i, v] of pred.entries()) {
    const y = 441 + i * 151;
    type(c, names[i], 993, y - 52, 33, colors[i]);
    const at = gauge(c, 1010, y, 572, 0, 3, 1);
    disk(c, at(severity[i]), y, 18, null, C.gold, 5);
    if (!hideLast || i !== 2) {
      disk(c, at(v), y, 10, C.green);
      mono(c, num(v, 3), 1759, y, 38, C.green, 'right');
    }
  }
}
function fitScene(c, k) {
  base(c, 'Can two weights hit three targets?', 'Least squares  /  severity');
  const b = bidx(k);
  const fit = leastSquaresFit(A),
    reveal = cue(k, 1, 'Look at the gap');
  const predictionKnown = b > 1 || (b === 1 && k.elapsed >= k.wordCue('One plus two gives three').end);
  cue(k, 2, 'Now each prediction', 0);
  let move = Number(b > 2);
  let errorSpoken = b > 2;
  if (b === 2) {
    const phrase = 'Both weights come down by a third';
    const start = k.wordCue(phrase).start;
    const end = k.wordCue('to two thirds and five thirds').end;
    move = k.reveal(phrase, end - start, { captionStart: false });
    errorSpoken = k.elapsed >= k.wordCue('adding gives one third').end;
  }
  const weights = lerpRow([1, 2], fit.weights, move),
    pred = A.map((r) => dot(r, weights));
  outputPlane(c, fit.columns);
  const target = outputPoint(severity),
    tip = outputPoint(pred);
  disk(c, ...target, 14, null, C.gold, 5);
  if (predictionKnown) {
    arrow(c, outputPoint([0, 0, 0]), tip, C.green, 7);
    if (reveal) path(c, [tip, target], C.pink, 6);
    disk(c, ...tip, 10, C.green);
  }
  type(c, 'Reachable prediction plane', 112, 344, 35);
  mono(c, (move > 0 ? 'w ≈ ' : 'w = ') + vec(weights, 3), 112, 848, 40);
  if (move > 0) type(c, 'Predictions use unrounded weights', 112, 890, 29, C.muted);
  targetRails(c, pred, !predictionKnown);
  const res = plus(severity, times(pred, -1));
  if (b >= 3) {
    type(c, 'Residual = [1/3, 1/3, −1/3]. Its dot product with each feature column is zero.', 96, 260, 37);
  } else {
    note(
      c,
      errorSpoken
        ? 'Sum of squared misses = ' + num(dot(res, res), 3) + ' (one third).'
        : move === 1
          ? 'Read each residual gap from the fitted dot to its target ring.'
          : 'Choose the weights. Each target ring stays at the observed severity.',
    );
  }
}
function collapse(c, k) {
  base(c, 'Let the second channel copy the first', 'Rank  /  observed feature columns');
  const t = cue(k, 0, 'copy of the first', 1.3),
    table = A.map((r, i) => lerpRow(r, B[i], t));
  const cols = [0, 1].map((j) => table.map((r) => r[j]));
  const g1 = cue(k, 0, 'Sweep the first gain', 1.15),
    g2 = cue(k, 0, 'then the second', 1.15);
  const w = [g1, g2],
    pred = table.map((r) => dot(r, w));
  title(c, 'Two input tracks', 115, 330, 49);
  matrix(c, table, 194, 411, { cw: 140, rh: 109, sz: 52 });
  const tr = (c, v, x, y, col) => {
    const pts = v.flatMap((a, i) => [
      [x + i * 82, y - a * 49],
      [x + (i + 1) * 82, y - a * 49],
    ]);
    path(c, pts, col, 5);
  };
  tr(c, cols[0], 534, 490, C.blue);
  tr(c, cols[1], 534, 669, C.pink);
  c.save();
  c.translate(690, -15);
  outputPlane(c, cols);
  arrow(c, outputPoint([0, 0, 0]), outputPoint(pred), C.green, 9);
  c.restore();
  mono(c, 'w = ' + vec(w), 1008, 791, 39);
  type(
    c,
    t === 1
      ? 'Both gains move predictions in the same proportion.'
      : 'The tracks start as the slow and rollback columns.',
    115, 784, 39, C.ink, { width: 830 },
  );
}
function dupFit(c, k) {
  base(c, 'Fit severity after the plane collapses', 'Duplicate columns  /  one reachable line');
  const fit = leastSquaresFit(B),
    t = cue(k, 0, 'Move to the closest point', 1.65);
  const sum = mix(3, fit.weightSum, t),
    pred = B.map((row) => dot(row, [sum / 2, sum / 2]));
  title(c, 'Reachable predictions', 111, 336, 50);
  const pos = (v) => [235 + v[0] * 162, 745 - v[2] * 122];
  line(c, ...pos([0, 0, 0]), ...pos([3.3, 0, 3.3]), C.blue, 7);
  disk(c, ...pos(pred), 17, C.green);
  mono(c, '[s, 0, s]', 360, 817, 43);
  type(c, 'First vs. third ticket', 111, 405, 33, C.muted);
  targetRails(c, pred);
  note(
    c,
    t === 1
      ? 'First and third share 1.5, halfway between their targets. The middle prediction stays at zero.'
      : 'Moving along the line changes just the sum of the two weights.',
  );
}
export function gainState(k) {
  const test = bidx(k) >= 2;
  const shift = 2 * cue(k, 0, 'Increase one gain', 1.7) * (1 - cue(k, 1, 'Return both gains', 1.35));
  const newGain = test ? cue(k, 2, 'Set the gains', 1.3) : 0;
  const a = mix(0.75 + shift, 0.25, newGain);
  return { weights: [a, 1.5 - a], delayed: test && cue(k, 3, 'Open the delay', 0.7) === 1, test };
}
export function samples(weights, delayed, extra = false) {
  const a = extra ? [1, 0, 1, 0] : [1, 0, 1];
  const b = a.map((v, i) => (delayed ? a[i - 1] || 0 : v));
  return { a, b, y: a.map((v, i) => dot([v, b[i]], weights)) };
}
function trace(c, values, x, y, w, unit, col) {
  const pts = values.flatMap((v, i) => [
    [x + (i * w) / values.length, y - unit * v],
    [x + ((i + 1) * w) / values.length, y - unit * v],
  ]);
  path(c, pts, col, 6);
}
function nullspace(c, k) {
  const { weights, delayed, test } = gainState(k),
    { a, b, y } = samples(weights, delayed, test);
  base(c, 'Which gain made the crest?', delayed
    ? 'Separated tracks  /  one input at each sample'
    : 'Duplicate tracks  /  a change the recording cannot hear');
  instrument(c, 106, 277, 1708, 581);
  rect(c, 170, 337, 1000, 448, C.glass, 18);
  if (bidx(k) === 1) {
    // Equal axis scales preserve the Euclidean distance from zero to a gain pair.
    const p = ([x, y]) => [482 + 90 * x, 586 - 90 * y],
      axis = '#657f78';
    path(c, [p([-1.5, 0]), p([3.2, 0])], axis, 3);
    path(c, [p([0, -1.5]), p([0, 2.3])], axis, 3);
    path(c, [p([-0.7, 2.2]), p([3, -1.5])], C.sky, 5);
    const near = [0.75, 0.75];
    path(c, [p([0, 0]), p(weights)], C.mint, 7);
    disk(c, ...p(near), 11, null, C.mint, 4);
    disk(c, ...p(weights), 9, C.mint);
    type(c, 'Gain B', 506, 383, 27, C.light);
    type(c, 'Green: distance to zero', 202, 413, 23, C.mint);
    type(c, 'Gain A', 787, 605, 27, C.light);
    type(c, '0', 453, 605, 27, C.light);
    type(c, 'Equal-sum pairs', 820, 686, 27, C.sky);
    mono(c, 'Output  ' + vec(y), 615, 744, 33, C.mint, 'center');
  } else {
    for (let i = 0; i <= 16; i++) line(c, 394 + 43 * i, 369, 394 + 43 * i, 748, '#345355', 1);
    for (let i = 0; i < 8; i++) line(c, 383, 389 + i * 46, 1099, 389 + i * 46, '#345355', 1);
    // The upper traces are unit inputs. The lower trace is the actual weighted sum.
    line(c, 389, 721, 1094, 721, '#75958a', 2);
    mono(c, '0 V', 372, 744, 25, C.mint, 'right');
    for (const [row, label, y0, col, scale] of [
      [a, 'Input A', 455, C.sky, 43],
      [b, 'Input B', 551, C.coral, 43],
      [y, 'Output', 721, C.mint, 75],
    ]) {
      type(c, label, 204, y0 - 17, 35, col);
      trace(c, row, 389, y0, 703, scale, col);
    }
    if (delayed) {
      y.slice(0, 2).forEach((v, i) => {
        mono(c, num(v) + ' V', 389 + (i + 0.5) * 703 / y.length, 721 - 75 * v - 24, 27, C.mint, 'center');
      });
    }
  }
  dial(c, 1350, 526, 72, weights[0], -1.5, 3, C.blue, 'Gain A');
  dial(c, 1640, 526, 72, weights[1], -1.5, 3, C.pink, 'Gain B');
  if (!test) mono(c, 'sum = ' + num(weights[0] + weights[1]), 1287, 741, 41);
  else mono(c, delayed ? 'B delayed' : 'Aligned', 1287, 741, 41);
  if (bidx(k) !== 1)
    type(c, delayed
      ? 'Separated outputs ' + vec(y) + '. Each occupied sample identifies one gain.'
      : 'Recorded output = ' + vec(y) + '. With identical inputs it measures only the gain sum.',
    175, 308, 29);
}
function ellipse(c, k) {
  base(c, 'How thin is the weakest direction?', 'Instrument calibration  /  two-norm condition number');
  const t = cue(k, 0, 'shrink the other', 2),
    s = mix(1, 0.01, t);
  const x = 599,
    y = 580,
    rad = 225;
  disk(c, x, y, rad, null, '#bec4ae', 3);
  for (let j = -4; j <= 4; j++) {
    const u = j / 4,
      h = Math.sqrt(1 - u * u);
    line(c, x - rad * h, y + s * rad * u, x + rad * h, y + s * rad * u, '#84a59a', 2);
    line(c, x + rad * u, y - s * rad * h, x + rad * u, y + s * rad * h, '#84a59a', 2);
  }
  path(
    c,
    Array.from({ length: 145 }, (_, i) => [
      x + rad * Math.cos((i * Math.PI) / 72),
      y + s * rad * Math.sin((i * Math.PI) / 72),
    ]),
    C.blue,
    7,
  );
  disk(c, x, y - rad * s, 9, C.pink);
  disk(c, x + rad, y, 9, C.green);
  type(c, 'Horizontal stretch', 1100, 351, 38);
  mono(c, '1', 1100, 424, 59, C.green);
  type(c, 'Vertical stretch', 1100, 544, 38);
  mono(c, num(s, 3), 1100, 616, 59, C.pink);
  if (cue(k, 0, 'An exactly zero')) mono(c, 'κ₂ = 1 / 0.01 = 100', 1100, 778, 45);
  type(c, 'The inverse expands the thin axis most.', 1100, 857, 35);
}
function noise(c, k) {
  base(c, 'How far does the recovered input move?', 'Inverse calibration  /  same weak axis');
  const n = cue(k, 0, 'Add a small output disturbance', 1.2),
    inv = cue(k, 0, 'The estimate lands', 1.2);
  const clean = 0.002,
    noisy = clean + 0.001 * n,
    est = mix(0.2, noisy / 0.01, inv);
  const output = gauge(c, 325, 445, 1240, 0, 0.004, 0.001, 'Measured output');
  disk(c, output(clean), 445, 21, null, C.blue, 5);
  disk(c, output(noisy), 445, 12, C.pink);
  mono(c, num(noisy, 3), 1700, 445, 43, C.pink, 'center');
  const input = gauge(c, 325, 738, 1240, 0, 0.4, 0.1, 'Recovered input');
  disk(c, input(0.2), 738, 21, null, C.blue, 5);
  disk(c, input(est), 738, 12, C.green);
  mono(c, num(est, 3), 1700, 738, 43, C.green, 'center');
  type(
    c,
    inv === 1
      ? '0.001 / 0.01 = 0.1 of input error. The two rulers have different units.'
      : 'Open rings mark the clean values. Only the weak output coordinate picks up noise.',
    96, 862, 35,
  );
}
export function leftovers(m, r) {
  const ratio = m[1][0] / m[0][0];
  return [m[1][1] - ratio * m[0][1], r[1] - ratio * r[0]];
}
function roundedSolve(c, k) {
  base(c, 'Where do the extra digits matter?', 'Two measurements  /  the same noise on both routes');
  const b = bidx(k),
    t = Number(cue(k, 3, 'Round the normal equations', 0.45) === 1);
  const model = solverRoundingExample(3, t),
    showGram = cue(k, 1, 'forms the Gram matrix', 1.3);
  const rem = leftovers(model.storedGram, model.storedTarget);
  title(c, 'Direct fit', 110, 320, 53, C.blue);
  title(c, 'Normal equations', 1010, 320, 53, C.pink);
  const rhsTerms = model.table[0].map((_, j) => model.table.map((row, i) => [row[j], model.observations[i]]));
  const introduced = ['The first column counts', 'The second gives'].map((s) => cue(k, 1, s, 0));
  const inserted = ['The second gives', 'Carry those two sums'].map((s) => cue(k, 1, s, 0));
  const eq = (rows, rhs, x, sz, digits, empty) => {
    matrix(c, rows, x, 403, { cw: 143, rh: 93, sz, digits });
    mono(c, 'w =', x + 319, 498, 43);
    matrix(
      c,
      rhs.map((v) => [v]),
      x + 444,
      403,
      { cw: 228, rh: 93, sz, digits, empty },
    );
  };
  eq(model.table, model.observations, 115, 37, 3);
  if (showGram) eq(model.storedGram, model.storedTarget, 1008, 35, 5, (i) => !inserted[i]);
  else type(c, 'Use the same two observations.', 1010, 479, 38, C.muted);
  line(c, 946, 355, 946, 840, C.rule, 2);
  const direct = cue(k, 0, 'That is enough to fit');
  if (direct) {
    mono(c, '0.04 w₂ = 0.081', 114, 688, 41);
    mono(c, 'w = ' + vec(model.directWeights, 3), 114, 784, 44, C.blue);
  }
  if (b === 1) {
    rhsTerms.forEach((pairs, i) => {
      if (!introduced[i]) return;
      const expression = pairs.map(([a, b]) => num(a) + ' × ' + num(b, 3)).join(' + ');
      mono(c, expression + ' = ' + (inserted[i] ? num(model.projectedTarget[i], 5) : '?'), 1009, 679 + i * 104, 37, i ? C.pink : C.blue);
    });
  }
  if (b >= 2 && cue(k, 2, 'The first weight drops out', 0)) {
    mono(c, num(rem[0], 5) + ' w₂ = ' + num(rem[1], 5), 1009, 688, 40);
    mono(c, 'w = ' + vec(model.normalWeights, 4), 1009, 784, 43, C.pink);
  }
  if (b === 4 && cue(k, 4, 'squares the two-norm condition number')) {
    type(
      c,
      'Independent columns: the two-norm condition number rises from about ' +
        num(model.conditionNumber, 0) + ' to ' + Math.round(model.gramConditionNumber).toLocaleString('en-US') + '.',
      96, 260, 37,
    );
  } else if (b === 3) {
    type(c, 'Round entries to 3 decimals before elimination.', 1010, 262, 31, C.pink);
  } else {
    const caption =
      b === 5
        ? 'Direct QR or SVD avoids forming the Gram matrix. The direct fit still inherits the original noise.'
        : b >= 4
          ? 'Original observations ' +
            vec(model.observations, 3) +
            '   •   rounded-route predictions ' +
            vec(model.normalPrediction, 4)
          : b === 2
            ? 'Subtract 1.02 times the first equation from the second. Which fit will change after rounding?'
            : 'Both routes start with the same second reading: 3.08 + 0.001 = 3.081.';
    type(c, caption, 96, 862, 35, C.ink, { width: 1720 });
  }
}
export const middle = [
  center,
  spreadScene,
  future,
  sparse,
  fitScene,
  collapse,
  dupFit,
  nullspace,
  ellipse,
  noise,
  roundedSolve,
];

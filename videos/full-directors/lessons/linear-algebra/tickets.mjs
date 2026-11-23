import { A, V, U, common, contrast, strengths } from '../../../films/linear-algebra/fixtures.mjs';
import { gramCalculation, retrievalFrame } from '../../../films/linear-algebra/model.mjs';
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
  ticket,
  ticketStack,
  gauge,
  point,
  plane,
  straightedge,
  instrument,
} from './studio.mjs';

export const directionScores = (v) => A.map((row) => dot(row, v));
export const projection = (row, v) => times(v, dot(row, v));
export function orderByScore(scores) {
  return scores
    .map((_, i) => i)
    .sort((a, b) => (Math.abs(scores[b] - scores[a]) < 1e-10 ? a - b : scores[b] - scores[a]));
}
const bidx = (k) => k.beat.beatIndex;
function resultNote(c, value) {
  type(c, value, 96, 860, 37, C.ink, { width: 1720 });
}
function intro(c, k) {
  base(c, 'What survives the counter?', 'Support exchange  /  incoming tickets');
  const punch = cue(k, 0, 'Punch the slow-page flag', 0.5);
  const feed = cue(k, 0, 'Feed it through', 1.3);
  const first = cue(k, 0, 'It reads one', 0.8);
  const secondIn = cue(k, 1, 'The pink ticket', 1);
  const second = cue(k, 2, 'One again', 0.65);
  const entry = bidx(k) === 0 ? Math.min(1, k.elapsed / 0.8) : 1;
  const counts = A.slice(0, 2).map((row) => dot(row, [1, 1]));
  const card = (i, row, x, y) => {
    ticket(c, i, row, x, y, 570, 140);
    type(c, 'Slow', x + 378, y - 30, 28, C.muted, { align: 'center' });
    type(c, 'Rollback', x + 491, y - 30, 28, C.muted, { align: 'center' });
  };
  const firstX = mix(48, 193, 1 - (1 - entry) ** 2);
  card(0, punch > 0.5 ? A[0] : [0, 0], mix(firstX, 315, feed), 365);
  if (secondIn > 0) card(1, A[1], mix(105, 315, secondIn), 635);
  instrument(c, 864, 283, 921, 555);
  for (const y of [365, 635]) {
    rect(c, 850, y - 7, 41, 154, '#82907f', 8);
    rect(c, 850, y + 2, 18, 136, C.ink, 5);
  }
  rect(c, 933, 346, 782, 149, C.glass, 23);
  const label = second ? 'Second reading' : first === 1 ? 'First reading' : 'Flag count';
  type(c, label, 995, 420, 43, C.light);
  mono(c, first === 1 ? counts[Number(second > 0)] : '·', 1610, 423, 100, C.mint, 'center');
  const at = gauge(c, 1015, 664, 625, 0, 2);
  if (first > 0) {
    line(c, at(counts[0]), 580, at(counts[0]), 651, C.ink, 2);
    point(c, at(counts[0]), 580, 0, 16);
  }
  if (second > 0) point(c, at(counts[1]), mix(646, 624, second), 1, 16);
  resultNote(
    c,
    second === 1
      ? 'Two different calls leave the same count on the tape.'
      : 'A punched flag reads 1. An unpunched flag reads 0.',
  );
}
function coordinates(c, k) {
  if (bidx(k) === 1) {
    base(c, 'Look up one row by its ID', 'Ticket table  /  indexing');
    ticketStack(c, A, 207);
    type(c, 'ID', 115, 296, 32, C.muted);
    A.forEach((_, i) => mono(c, i, 124, 398 + i * 157, 41, colors[i], 'center'));
    const chosen = cue(k, 1, 'Select its row', 1.15);
    const y = 555;
    if (chosen) {
      arrow(c, [807, y], [809 + 229 * chosen, y], C.pink, 7);
      if (chosen === 1) {
        type(c, 'Ticket ID 1', 1110, y - 135, 38, C.pink);
        ticket(c, 1, A[1], 1105, y - 59, 612, 119);
        mono(c, 'A[1] = ' + vec(A[1]), 1105, y + 153, 49);
      }
    }
    resultNote(c, 'An ID retrieves an existing row. A dot product computes a new score from the feature entries.');
    return;
  }
  base(c, 'A ticket has an address in feature space', 'Ticket rows  /  horizontal and vertical position');
  const enter = cue(k, 0, 'Watch each row become a point', 1.6);
  ticketStack(c, A);
  const p = plane(c, 1030, 738, 335, [-0.35, 1.85, -0.23, 1.25]);
  A.forEach((row, i) => {
    const target = p(row),
      origin = [748, 395 + i * 157],
      pos = lerpRow(origin, target, enter);
    if (enter > 0) {
      path(c, [origin, target], '#c0c9b8', 2);
      point(c, ...pos, i, 15);
    }
    if (enter === 1) mono(c, vec(row), target[0] + 25, target[1] - 25, 31, colors[i]);
  });
  resultNote(c, 'Every row uses the same order: slow pages first, rollback second.');
}
function basis(c, k) {
  base(c, 'Build the row from two perpendicular steps', 'Feature space  /  mention counts');
  const b = bidx(k),
    normal = cue(k, 0, 'Shrink both arrows', 1.2);
  if (!b) {
    const scale = 205;
    const p = plane(c, 665, 619, scale, [-1.65, 1.75, -1.2, 1.4]);
    disk(c, ...p([0, 0]), scale, null, '#c5c9b7');
    for (const [i, v] of V.entries())
      arrow(c, p([0, 0]), p(times(v, mix(Math.SQRT2, 1, normal))), colors[i], 9);
    title(c, 'Common', 1240, 375, 56, C.blue);
    mono(c, normal === 1 ? '(1, 1) / √2' : vec(times(common, mix(Math.SQRT2, 1, normal))), 1240, 452, 48);
    title(c, 'Contrast', 1240, 602, 56, C.pink);
    mono(c, normal === 1 ? '(−1, 1) / √2' : vec(times(contrast, mix(Math.SQRT2, 1, normal))), 1240, 679, 48);
    note(
      c,
      normal === 1
        ? 'One unit along either arrow measures the same distance.'
        : 'Normalize each diagonal by dividing by its length.',
    );
    return;
  }
  const row = [3, 1],
    foot = projection(row, common);
  const start = cue(k, 1, 'Build the common contribution', 1.1);
  const finish = cue(k, 1, 'then add the contrast', 0.95);
  let remove = 0;
  let landed = false;
  let rightAngle = false;
  if (b === 3) {
    const phrase = 'Let the pink part fall away';
    const start = k.wordCue(phrase).start;
    const landing = k.wordCue('The ticket lands at two and two').end;
    remove = k.reveal(phrase, landing - start);
    landed = remove === 1;
    cue(k, 3, 'The missing part', 0);
    rightAngle = k.elapsed >= k.wordCue('at a right angle').end;
  }
  const p = plane(c, 272, 754, 178, [-0.6, 3.7, -0.45, 2.6]);
  straightedge(c, p, common, -0.45, 3.55);
  point(c, ...p(row), 2);
  if (b !== 2) arrow(c, p([0, 0]), p(times(foot, start)), C.blue, 9);
  const tip = lerpRow(foot, row, finish * (1 - remove));
  if (finish && b !== 2) arrow(c, p(foot), p(tip), C.pink, 8);
  if (remove) {
    path(c, [p(foot), p(row)], C.pink, 3);
    point(c, ...p(tip), 0);
  }
  if (rightAngle)
    path(
      c,
      [
        [2.14, 2.14],
        [2.28, 2],
        [2.14, 1.86],
      ].map(p),
      C.ink,
      4,
    );
  title(c, 'Original row', 1110, 366);
  mono(c, vec(row), 1110, 442, 54);
  type(c, 'Common direction', 1110, 555, 38, C.blue);
  mono(c, '(1, 1) / √2', 1110, 610, 42);
  type(c, rightAngle ? 'Nearest point on the ruler' : 'Common-only position', 1110, 730, 38, C.blue);
  mono(c, landed ? vec(foot) : '?', 1110, 783, 42);
  resultNote(
    c,
    rightAngle
      ? 'The shortest path back to the retained line meets it at a right angle.'
      : landed
        ? 'The common-only ticket lands at [2, 2].'
        : b === 2
          ? 'Where would the ticket land if only its common coordinate survived?'
          : b === 3
            ? 'Follow the ticket as its contrast contribution shrinks to zero.'
            : 'Place the tail of the second step at the tip of the first.',
  );
}
function strength(c, k, isContrast) {
  const v = isContrast ? contrast : common,
    scores = directionScores(v),
    squares = scores.map((x) => x * x);
  base(
    c,
    isContrast ? 'Where does the joint ticket land?' : 'How much output does a unit step produce?',
    'Ticket reader  /  signed dot products',
  );
  const count = isContrast
    ? Number(cue(k, 0, 'scores below zero') > 0) +
      Number(cue(k, 0, 'just as far above zero') > 0) +
      Number(cue(k, 1, 'There is the zero mark') > 0)
    : Math.ceil(cue(k, 0, 'Read the three scores', 1.5) * 3);
  const square = bidx(k) === 1 && k.elapsed >= k.wordCue(
    isContrast ? 'add anything to the squared length' : 'contributes a half',
  ).end;
  const jointSquared = isContrast ? square : bidx(k) === 1
    && k.elapsed >= k.wordCue('supplies two').end;
  const totalSpoken = bidx(k) === 1 && k.elapsed >= k.wordCue(
    isContrast ? 'The squared total is one' : 'of the three units of squared length',
  ).end;
  if (isContrast) cue(k, 1, 'Taking square roots');
  else cue(k, 1, 'The joint ticket alone');
  ticketStack(c, A, 96, 349, 488, 157);
  type(c, isContrast ? 'Contrast score' : 'Common score', 682, 288, 39);
  type(c, 'Score squared', 1488, 288, 37);
  scores.forEach((s, i) => {
    const y = 406 + 157 * i,
      zero = 969,
      xx = zero + s * 256;
    line(c, 674, y, 1388, y, C.rule, 3);
    line(c, zero, y - 19, zero, y + 19, C.muted, 3);
    if (i < count) {
      line(c, zero, y, xx, y, colors[i], 12);
      point(c, xx, y, i, 12);
      mono(c, num(s, 3), xx, y - 42, 31, colors[i], 'center');
    }
    mono(c, (i === 2 ? jointSquared : square) ? num(squares[i], 2) : '·', 1595, y, 49, C.ink, 'center');
  });
  const total = dot(scores, scores);
  const roots = isContrast && cue(k, 1, 'These lengths are', 0);
  resultNote(
    c,
    totalSpoken
      ? `Squared output length = ${num(total)}.` + (roots ? '    Output lengths: √3 for common, 1 for contrast.' : '')
      : isContrast
        ? 'Each score measures (rollback − slow) / √2.'
        : 'Each score measures (slow + rollback) / √2.',
  );
}
function gram(c, k) {
  base(c, 'Count coincidences between two columns', 'Gram matrix  /  ticket reader');
  const pairs = gramCalculation().products;
  const active = [
    cue(k, 0, 'Take the slow column twice', 0),
    cue(k, 0, 'Now compare slow with rollback', 0),
    cue(k, 0, 'Reverse the two columns', 0),
    cue(k, 1, 'Finally compare rollback with itself', 0),
  ].findLastIndex(Boolean);
  const fill = [
    cue(k, 0, 'at the upper left', 0),
    cue(k, 0, 'at the upper right', 0),
    cue(k, 1, 'at the lower left', 0),
    Number(bidx(k) === 1 && k.elapsed >= k.wordCue('That makes two').end),
  ];
  cue(k, 1, 'The finished table', 0);
  const q = pairs[Math.max(0, active)],
    labels = ['Slow', 'Rollback'];
  type(c, labels[q.row] + ' track', 176, 302, 38, C.blue);
  type(c, labels[active < 0 ? 1 : q.column] + ' track', 486, 302, 38, C.pink);
  (active < 0 ? A : q.terms).forEach(([a, b], i) => {
    const y = 393 + i * 150;
    rect(c, 128, y - 46, 640, 91, C.paper2, 9, C.rule);
    for (const [j, v] of [a, b].entries()) {
      const xx = 246 + j * 310;
      disk(c, xx, y, 31, v ? colors[j] : '#dde1ce');
      mono(c, String(v), xx, y, 32, v ? C.light : C.ink, 'center');
    }
    if (active >= 0 && a * b) line(c, 286, y, 514, y, C.green, 7);
  });
  title(c, 'A transpose × A', 1090, 330, 58);
  matrix(c, gramCalculation().gram, 1098, 413, {
    cw: 203,
    rh: 124,
    sz: 65,
    empty: (i, j) => fill[i * 2 + j] === 0,
    highlight: (i, j) => (i * 2 + j === active ? (fill[active] ? C.green : C.gold) : false),
  });
  mono(
    c,
    active < 0 ? '' : q.terms.map((t) => t.join('×')).join(' + ') + ' = ' + (fill[active] ? q.value : '?'),
    964,
    775,
    42,
  );
  resultNote(c, 'Pair the tracks row by row. Each coincident pair of holes contributes one.');
}
function gramAction(c, k) {
  base(c, 'Which arrows keep their direction?', 'Gram matrix  /  feature space');
  const stretches = [cue(k, 0, 'Common stretches', 1.6), cue(k, 0, 'Contrast stays', 0.9)];
  const p = plane(c, 570, 727, 155, [-1.8, 2.8, -0.65, 2.65], ['Slow', 'Rollback']);
  const result = V.map((v) => gramCalculation().gram.map((row) => dot(row, v)));
  V.forEach((v, i) => {
    const out = lerpRow(v, result[i], stretches[i]);
    path(c, [p([0, 0]), p(out)], colors[i], 9);
    disk(c, ...p(v), 13, C.paper2, colors[i]);
    arrow(c, p([0, 0]), p(out), colors[i], 4);
  });
  const roots = cue(k, 1, 'Square roots recover');
  title(c, 'Same line, new length', 1090, 350, 54);
  V.forEach((v, i) => {
    const y = 475 + i * 142;
    type(c, i ? 'Contrast' : 'Common', 1094, y, 37, colors[i]);
    mono(c, stretches[i] > 0 ? '× ' + num(mix(1, dot(result[i], v), stretches[i])) : '?', 1444, y, 52);
  });
  if (roots)
    resultNote(c, 'For a unit eigenvector, the Gram eigenvalue equals the squared output length. Take its square root.');
  else type(c, 'Open circle: tip before multiplication', 1094, 742, 32, C.muted);
}
function tracing(c, k, scaleStage) {
  const q = scaleStage ? 1 : cue(k, 0, 'Rotate the tracing', 1.6);
  const stretch = scaleStage ? cue(k, 0, 'stretch the common coordinate', 1.7) : 0;
  base(
    c,
    scaleStage ? 'Stretch the tracing along one axis' : 'Turn the tracing into singular coordinates',
    scaleStage ? 'SVD  /  second move, Sigma' : 'SVD  /  first move, V transpose',
  );
  const rot = (-Math.PI * q) / 4,
    f = mix(1, strengths[0], stretch);
  const change = ([x, y]) => [
    f * (x * Math.cos(rot) - y * Math.sin(rot)),
    x * Math.sin(rot) + y * Math.cos(rot),
  ];
  const p = plane(c, 637, 563, 193, [-2.3, 2.4, -1.45, 1.42], ['', '']);
  for (let j = -4; j <= 4; j++) {
    const t = j / 4,
      u = Math.sqrt(1 - t * t);
    for (const ends of [
      [
        [t, -u],
        [t, u],
      ],
      [
        [-u, t],
        [u, t],
      ],
    ])
      path(c, ends.map(change).map(p), '#8caeaa', 2);
  }
  path(
    c,
    Array.from({ length: 145 }, (_, i) =>
      p(change([Math.cos((i * Math.PI) / 72), Math.sin((i * Math.PI) / 72)])),
    ),
    C.blue,
    6,
  );
  const out = change([1, 0]);
  arrow(c, p([0, 0]), p(out), C.green, 10);
  disk(c, ...p(out), 10, C.green);
  type(c, 'Input feature row', 1210, 356, 37, C.muted);
  mono(c, '[1,  0]', 1210, 425, 57);
  type(c, scaleStage && stretch === 1 ? 'After stretching' : 'Current coordinates', 1210, 585, 37, C.muted);
  mono(c, vec(out, 3), 1210, 657, 51, C.green);
  resultNote(
    c,
    scaleStage
      ? 'The horizontal scale grows by √3. The vertical scale stays at one.'
      : 'V transpose reads the green arrow along the common and contrast directions.',
  );
}
export function contribution(index, sign = 1) {
  const v = times(V[index], sign),
    u = times(U[index], sign);
  return times(u, strengths[index] * dot(v, [1, 0]));
}
export const stretched = V.map((v, i) => strengths[i] * dot(v, [1, 0]));
export function batchCosines(queries, rows) {
  return queries.map((q) => rows.map((r) => dot(q, r) / (Math.hypot(...q) * Math.hypot(...r))));
}
function output(c, k, flip) {
  base(
    c,
    flip ? 'What changes when both arrows reverse?' : 'Add two tracks to build three outputs',
    flip ? 'SVD  /  sign convention' : 'SVD  /  third move, U',
  );
  const first = flip ? 1 : cue(k, 0, 'Put that track on the reader', 0);
  const second = flip ? 1 : cue(k, 0, 'Add the contrast track', 0);
  const flipped = flip && cue(k, 0, 'Watch the output readings', 0.6) > 0.5;
  const sign = flipped ? -1 : 1;
  const a = times(contribution(0, sign), first),
    b = times(contribution(1), second);
  const outputs = plus(a, b);
  if (flip) {
    type(c, 'Common pair', 110, 310, 40, C.muted);
    const origin = [721, 441],
      tip = sign === 1 ? [782, 380] : [660, 502];
    arrow(c, origin, tip, C.blue, 8);
    disk(c, ...origin, 6, C.ink);
    type(c, 'Input direction', 115, 410, 37, C.blue);
    mono(c, vec(times(common, sign), 3), 115, 465, 39);
    type(c, 'Output direction', 115, 597, 37, C.green);
    mono(c, vec(times(U[0], sign), 3), 115, 655, 39);
  } else {
    type(c, 'Stretched coordinates', 108, 282, 32, C.muted);
    mono(c, '≈ ' + vec(stretched, 3), 110, 338, 43);
    const columns = cue(k, 0, 'Each one scales a unit column', 0);
    [0, 1].forEach((j) => {
      if (!columns) return;
      const y = 426 + j * 225, color = j ? C.pink : C.blue;
      const denominator = j ? 2 : 6;
      const numerator = U[j].map((v) => Math.round(v * Math.sqrt(denominator)));
      type(c, (j ? 'Contrast' : 'Common') + ' coordinate × unit column', 110, y, 33, color);
      mono(c, (j ? '(−1/√2)' : '√(3/2)') + ' × ' + vec(numerator) + ' / √' + denominator, 110, y + 58, 37);
      if (j ? second : first) mono(c, '= ' + vec(j ? b : a), 110, y + 118, 40, color);
    });
  }
  instrument(c, 830, 300, 960, 526);
  rect(c, 881, 349, 856, 430, C.glass, 16);
  A.forEach((_, i) => {
    const y = 438 + i * 124,
      zero = 1190,
      sc = 255;
    type(c, names[i], 919, y, 33, C.light);
    line(c, zero - 12, y, zero + 330, y, '#4f706c', 2);
    if (first > 0) {
      line(c, zero, y - 12, zero + sc * a[i], y - 12, C.sky, 12);
      line(c, zero + sc * a[i], y + 8, zero + sc * outputs[i], y + 8, C.coral, 11);
      disk(c, zero + sc * outputs[i], y + 8, 11, C.mint);
    }
    mono(c, first > 0 ? num(outputs[i]) : '·', 1672, y, 43, C.mint, 'right');
  });
  let instruction;
  if (flip) instruction = 'Changing both signs preserves each outer product and its contribution to the matrix.';
  else if (second) instruction = 'Middle ticket: ½ + (−½) = 0. The reader adds the tracks one ticket at a time.';
  else if (cue(k, 0, 'Its coordinate is negative', 0)) instruction = 'Middle ticket: (−1/√2) × (1/√2)';
  else if (cue(k, 0, 'For the middle ticket', 0)) instruction = 'Middle ticket: √(3/2) × (1/√6)' + (first ? ' = ½' : '');
  if (instruction) resultNote(c, instruction);
  else type(c, 'Unit column order: slow pages, rollback, both issues.', 830, 268, 30, C.muted);
}
function truncate(c, k) {
  base(c, 'Spend one coordinate per ticket', 'Rank-one reconstruction  /  common direction');
  const t = cue(k, 0, 'shrink contrast to zero', 2);
  const save = cue(k, 0, 'Keep the common score', 0);
  const rebuild = cue(k, 1, 'multiply a saved score', 0);
  const rebuilt = cue(k, 1, 'Read off the rebuilt rows', 0);
  const error = bidx(k) > 1 || (bidx(k) === 1 && k.elapsed >= k.speechDuration);
  const scores = directionScores(common);
  const rows = A.map((r) => lerpRow(r, projection(r, common), t));
  const p = plane(c, 259, 755, 365, [-0.3, 1.58, -0.22, 1.23]);
  straightedge(c, p, common, -0.2, 1.92);
  rows.forEach((r, i) => {
    path(c, [p(A[i]), p(r)], colors[i], 3);
    disk(c, ...p(A[i]), 12, null, colors[i]);
    disk(c, ...p(r), 17 - i * 4, colors[i]);
  });
  type(c, 'Ticket', 916, 310, 34, C.muted);
  type(c, 'Saved score', 1210, 310, 34, C.muted);
  if (rebuild) type(c, 'Rebuilt flags', 1505, 310, 34, C.muted);
  A.forEach((_, i) => {
    const y = 419 + i * 126;
    type(c, names[i], 916, y, 39, colors[i]);
    if (save) mono(c, scores[i] < 1 ? '1/√2' : '√2', 1212, y, 44);
    if (rebuild) mono(c, rebuilt ? vec(times(common, scores[i])) : '?', 1505, y, 39);
  });
  if (rebuild) {
    type(c, 'Slow pages', 918, 765, 31, C.blue);
    mono(c, '(1/√2) × [1, 1]/√2' + (rebuilt ? ' = [½, ½]' : ''), 918, 816, 37);
  }
  const err = Math.hypot(...rows.flatMap((r, i) => r.map((v, j) => v - A[i][j])));
  resultNote(
    c,
    error
      ? `Four half-unit misses give a Frobenius reconstruction error of ${num(err)}.`
      : rebuild ? 'Multiply each saved score by the same unit direction.' : 'Keep one common coordinate for each ticket.',
  );
}
function retrieval(c, k) {
  if (bidx(k) === 3) {
    base(c, 'Where does a query meet a ticket?', 'Batch retrieval  /  full feature rows');
    const grid = batchCosines(A.slice(0, 2), A);
    const build = cue(k, 3, 'Multiply by the transposed ticket table', 2.3);
    type(c, 'Unit-length query rows', 130, 355, 42);
    matrix(c, A.slice(0, 2), 165, 435, { cw: 125, rh: 114, sz: 58 });
    arrow(c, [527, 549], [786, 549], C.muted, 6);
    type(c, 'Tickets', 1217, 309, 37, C.muted);
    names.slice(0, 3).forEach((s, i) => type(c, s, 1106 + i * 232, 398, 32, colors[i], { align: 'center' }));
    matrix(c, grid, 990, 449, {
      cw: 232,
      rh: 113,
      sz: 49,
      digits: 3,
      empty: (i, j) => build <= (i * 3 + j) / 6,
    });
    type(c, 'Slow', 943, 505, 31, C.blue, { align: 'right' });
    type(c, 'Rollback', 943, 619, 31, C.pink, { align: 'right' });
    type(c, 'Same feature order in every cell', 990, 737, 34, C.muted);
    resultNote(c, 'Two queries × three tickets gives six cosine scores.');
    return;
  }
  base(c, 'Who gets the second search result?', 'Retrieval  /  query: slow pages');
  const t = cue(k, 0, 'Remove contrast', 1.7),
    counted = cue(k, 2, 'On held-out searches', 0);
  cue(k, 2, 'We found one', 0);
  const results = bidx(k) === 2
    ? ['Take the first two in ticket order', 'Rollback'].map((phrase) => k.elapsed >= k.wordCue(phrase).end)
    : [false, false];
  const { scores } = retrievalFrame({ beat: 0, cues: { 'retrieval-ties': { phase: 'during', progress: t } } });
  const sorted = orderByScore(scores),
    initial = orderByScore(retrievalFrame({ beat: 0, beatP: 0 }).scores);
  type(c, 'Cosine with the query', 111, 314, 39);
  scores.forEach((s, i) => {
    const y = 423 + i * 149;
    type(c, names[i], 112, y, 37, colors[i]);
    rect(c, 376, y - 17, 482, 34, '#d6dbca', 6);
    if (s > 0) rect(c, 376, y - 17, 482 * s, 34, colors[i], 6);
    mono(c, num(s, 3), 932, y, 35, C.ink, 'center');
  });
  type(c, 'First two tickets', 1140, 314, 39);
  (t > 0 ? sorted : initial).slice(0, 2).forEach((i, j) => {
    const y = 406 + j * 179;
    if (t > 0 && !results[j]) {
      rect(c, 1138, y, 575, 106, '#d9ddcd', 9);
      type(c, t === 1 ? 'Awaiting tie-break' : 'Projecting tickets', 1182, y + 54, 36, C.muted);
    } else ticket(c, i, A[i], 1138, y, 575, 106);
  });
  const recall = sorted.slice(0, 2).filter((i) => A[i][0]).length / 2;
  type(c, 'Equal scores use ticket order:', 1140, 749, 32, C.muted);
  type(c, 'Slow pages, rollback, both issues.', 1140, 791, 32, C.ink);
  if (counted)
    resultNote(c, `Recall@2 = ${Math.round(recall * 2)} / 2 = ${num(recall)}. The joint ticket lost its place.`);
}
export const early = [
  intro,
  coordinates,
  basis,
  (c, k) => strength(c, k, false),
  (c, k) => strength(c, k, true),
  gram,
  gramAction,
  (c, k) => tracing(c, k, false),
  (c, k) => tracing(c, k, true),
  (c, k) => output(c, k, false),
  (c, k) => output(c, k, true),
  truncate,
  retrieval,
];

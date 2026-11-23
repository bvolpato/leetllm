import {
  C,
  colors,
  fmt,
  vec,
  unit,
  sm,
  mix,
  cue,
  text,
  mono,
  line,
  rect,
  arrow,
  dot,
  plate,
  pen,
  chart,
  table,
  label,
  badge,
  ruler,
  foot,
  scaleBars,
} from './drawing.mjs';
import {
  H,
  P,
  R,
  WORDS,
  project,
  projected,
  localProjection,
  combined,
  scale,
  add,
  transpose,
} from './model.mjs';

const zero = [0, 0],
  password = H[0][2],
  outputs = ['x', 'y', 'average'];
function carriage(g, q, v) {
  const [x, y] = q.p(...v);
  rect(g, x - 7, 152, 14, 232, '#adbeb0', C.muted, 3);
  line(g, x - 2, 155, x - 2, 378, C.light, 2);
  rect(g, 78, y - 5, 346, 10, '#b6cabe', C.muted, 2);
  for (const end of [80, 414]) rect(g, end, y - 9, 8, 18, C.ink, null, 2);
  rect(g, x - 14, y - 13, 28, 26, C.teal, C.ink, 3);
  pen(g, x, y);
}
function dial(g, x, y, r, value, limit, old, color, labelText, selected) {
  const at = (v) => Math.PI * (0.85 + (1.3 * v) / limit);
  const point = (v, rad) => [x + rad * Math.cos(at(v)), y + rad * Math.sin(at(v))];
  dot(g, x, y, r + (selected ? 6 : 3), selected ? color : C.muted);
  dot(g, x, y, r, C.light, C.ink);
  for (let i = 0; i <= 16; i++)
    line(
      g,
      ...point((i * limit) / 16, r - 3),
      ...point((i * limit) / 16, r - (i % 4 ? 8 : 13)),
      C.muted,
      i % 4 ? 1 : 1.8,
    );
  dot(g, ...point(old, r - 8), 4.5, C.ink);
  arrow(g, x, y, ...point(value, r - 13), color, 3.2);
  dot(g, x, y, 4.7, color);
  mono(g, fmt(+value.toFixed(2)), x, y + r * 0.49, 22, color, 'center');
  text(g, labelText, x, y + r + 24, 20, C.ink, 'center');
}
export function opening(g, k) {
  const shift = cue(k, 0, 'Slide the carriage', 1.3) * (1 - cue(k, 3, 'Slide the pen back', 1.2));
  const input = [password[0] + shift, password[1]];
  const b = k.beat.beatIndex;
  const height = cue(k, 2, 'The height stays', 0);
  const horizontal = cue(k, 2, 'The horizontal coordinate', 1.65);
  const average = cue(k, 2, 'Its average with the height', 1.65);
  const saved = project(password);
  const progress = [horizontal, height, average];
  const readings = project(input).map((v, i) => saved[i] + progress[i] * (v - saved[i]));
  const focus = b !== 2 || !height ? -1 : average > 0 ? 2 : horizontal > 0 ? 0 : 1;
  const q = chart(g, { xlabel: 'horizontal coordinate', ylabel: 'height' });
  q.line(zero, password, C.muted, 2, [4, 4]);
  carriage(g, q, input);
  q.arrow(zero, input, C.blue);
  badge(g, 'password   ' + vec(input), 196, 137);
  label(
    g,
    height ? 'Black marks show the starting readings' : 'Saved readings  /  black marks',
    501,
    149,
  );
  ['horizontal', 'height', 'average'].forEach((s, i) =>
    dial(
      g,
      562 + i * 138,
      274,
      55,
      readings[i],
      2,
      saved[i],
      colors[i],
      s,
      i === focus,
    ),
  );
  if (b === 3)
    mono(g, 'previous stop    ' + vec(project([1.5, 0.5])), 501, 405, 20, C.muted);
  if (b < 2)
    text(g, 'Which reading can stay at its black mark?', 501, 403, 19, C.ink);
  else foot(
    g,
    b === 3
        ? 'The pen returns to the two coordinates we started with.'
        : focus === 2
          ? 'The average moves half as far as the horizontal coordinate.'
          : focus === 0
            ? 'The pen moved one unit to the right.'
            : height
              ? 'The pen kept its height.'
              : 'Compare the pen’s new position with the three saved readings.',
  );
}
export function coordinates(g, k) {
  const q = chart(g),
    b = k.beat.beatIndex;
  const a = cue(k, 0, 'Draw the first coordinate'),
    h = cue(k, 1, 'add the second coordinate', 0.65, 'From there');
  const sw = cue(k, 2, 'Swap its coordinates', 0.9);
  const point = b === 2 ? [1 - sw, sw] : [a * 0.5, h * 0.5];
  if (b < 2) {
    q.arrow(zero, [point[0], 0], C.blue);
    q.arrow([point[0], 0], point, C.brass);
  } else q.line([1, 0], [0, 1], C.muted, 2, [4, 4]);
  q.arrow(zero, point, C.teal, 3);
  pen(g, ...q.p(...point));
  label(g, b === 2 ? 'reset  /  coordinate swap' : 'password  /  pen travel', 515, 165);
  scaleBars(g, 515, 220, 300, ['Horizontal', 'Vertical'], point, 1.5);
  mono(g, vec(point), 515, 394, 29, C.teal);
  foot(
    g,
    b === 2
      ? 'The pair has two entries in both orders. Follow the tip.'
      : 'Each coordinate measures travel along its own axis.',
  );
  if (b === 2) return 'Where does reset go if we swap its coordinates?';
}
function projectionPlot(g) {
  return chart(g, { maxX: 1.5, xlabel: 'first output', ylabel: 'third output', scale: 155 });
}
export function directions(g, k) {
  const q = projectionPlot(g),
    a = cue(k, 1, 'Follow that slanted direction', 1),
    b = cue(k, 2, 'moves straight upward', 1, 'In this view it');
  const selected = k.beat.beatIndex - 1;
  q.arrow(zero, scale([P[0][0], P[0][2]], a), C.blue);
  q.arrow(zero, scale([P[1][0], P[1][2]], b), C.brass);
  label(g, 'Projection matrix P', 510, 151);
  table(g, {
    x: 510,
    y: 209,
    w: 402,
    rows: P,
    names: ['unit x', 'unit y'],
    cols: outputs,
    heads: 96,
    rh: 56,
    active: (i) => i === selected,
    tint: (i) => (i ? C.warm : C.pale),
  });
  if (selected >= 0)
    mono(g, vec(selected ? [0, 1] : [1, 0]) + ' @ P', 510, 367, 23, colors[selected]);
  foot(g, 'The plot shows the first and third outputs. The matrix keeps all three.');
}
export function mixture(g, k) {
  const q = projectionPlot(g);
  const contributions = [
    scale(P[0], 1 - cue(k, 0, 'Take half', 1) * 0.5),
    scale(P[1], 1 - cue(k, 1, 'Take half', 1) * 0.5),
  ];
  const flat = contributions.map((r) => [r[0], r[2]]);
  const approach = cue(k, 2, 'the second arrow', 3.5, 'Move the second arrow');
  const arrive = cue(k, 2, 'Its direction and length', 0.7);
  const join = 0.7 * approach + 0.3 * arrive;
  const tail = scale(flat[0], join),
    tip = add(tail, flat[1]);
  q.arrow(zero, flat[0], C.blue);
  q.arrow(tail, tip, C.brass);
  const finished = cue(k, 2, "That's the original triple") > 0;
  if (finished) pen(g, ...q.p(...tip));
  label(g, 'Scaled directions', 510, 151);
  table(g, {
    x: 510,
    y: 209,
    w: 402,
    rows: contributions,
    names: ['from x', 'from y'],
    cols: outputs,
    heads: 96,
    rh: 56,
    hue: (i) => colors[i],
  });
  if (finished) mono(g, 'sum   ' + vec(add(...contributions)), 510, 371, 23, C.teal);
  foot(
    g,
    join === 0
      ? 'Where should the second arrow start?'
      : 'Sliding the arrow preserves both its direction and its length.',
  );
}
export function column(g, k) {
  const b = k.beat.beatIndex,
    col = transpose(P)[2],
    terms = col.map((w, i) => w * password[i]);
  const firstProduct = 'contributes one quarter';
  const firstReady = b > 0 || (
    k.reveal(firstProduct, 0, { captionStart: false }) === 1 &&
    k.elapsed >= k.wordCue(firstProduct).end
  );
  let secondReady = b > 1;
  let slide = Number(b > 1);
  let dock = slide;
  if (b === 1) {
    const secondProduct = 'Slide its quarter';
    const slidePhrase = 'the ruler';
    const joinPhrase = 'add that contribution';
    const join = k.wordCue(joinPhrase);
    secondReady = k.reveal(secondProduct, 0, { captionStart: secondProduct }) === 1 &&
      k.elapsed >= k.wordCue(secondProduct).end;
    slide = sm(k.reveal(slidePhrase, join.start - k.wordCue(slidePhrase).start, {
      captionStart: false,
    }));
    dock = sm(k.reveal(joinPhrase, join.end - join.start, { captionStart: false }));
  }
  const showTotal = b > 1 ||
    (b === 1 && dock === 1 && k.elapsed >= k.wordCue('constructed geometrically').end);

  const inputX = 265, coefficientX = 532, productX = 793;
  text(g, 'Password input', inputX, 151, 20, C.muted, 'center');
  text(g, 'Average column of P', coefficientX, 151, 20, C.muted, 'center');
  text(g, 'Product', productX, 151, 20, C.muted, 'center');
  const ready = [firstReady, secondReady];
  terms.forEach((term, i) => {
    const y = 191 + i * 53;
    rect(g, 54, y - 22, 852, 44, i === b ? [C.pale, C.warm][i] : C.light, C.grid, 4);
    mono(g, outputs[i], 87, y, 22, colors[i], 'center');
    mono(g, fmt(password[i]), inputX, y, 25, colors[i], 'center');
    mono(g, '×', (inputX + coefficientX) / 2, y, 22, C.muted, 'center');
    mono(g, fmt(col[i]), coefficientX, y, 25, colors[i], 'center');
    mono(g, '=', (coefficientX + productX) / 2, y, 22, C.muted, 'center');
    mono(g, ready[i] ? fmt(term) : '·', productX, y, 25, colors[i], 'center');
  });

  const left = 179, span = 661, stagingY = 293, sumY = 350, barHeight = 30;
  const rulerMax = 1, tick = 0.25;
  const firstWidth = terms[0] * span / rulerMax;
  const secondWidth = terms[1] * span / rulerMax;
  const total = terms[0] + terms[1];
  label(g, 'Sum', 54, sumY + barHeight / 2);
  if (secondReady && dock < 1) label(g, 'Next term', 54, stagingY + barHeight / 2);
  for (let value = 0; value <= rulerMax; value += tick) {
    const x = left + value * span / rulerMax;
    line(g, x, stagingY, x, sumY, C.grid);
  }
  if (firstReady) rect(g, left, sumY, firstWidth, barHeight, colors[0]);
  if (secondReady)
    rect(g, left + slide * firstWidth, mix(stagingY, sumY, dock), secondWidth, barHeight, colors[1]);
  ruler(g, left, sumY + barHeight, span, rulerMax, { step: tick, labelEvery: 1 });
  if (showTotal) {
    const endpoint = left + span * total / rulerMax;
    const readout = 'average = ' + fmt(total);
    mono(g, readout, endpoint + 14, sumY + barHeight / 2, 22, C.teal);
  }
  if (b < 2) foot(g, 'Match entries by feature, then join their contributions.');
  else text(g, 'The first two columns copy x and y. The last takes their average.',
    480, 427, 20, C.ink, 'center');
}
export function compose(g, k) {
  const q = chart(g, { xlabel: 'downstream output 0', ylabel: 'downstream output 1' });
  const mid = project(password),
    stages = ['moves right', 'moves up', 'contributes to both'],
    captions = ['The first coordinate moves right', 'The second moves up', 'The third contributes'];
  let pos = [0, 0];
  R.forEach((v, i) => {
    const end = add(pos, scale(v, mid[i] * cue(k, 0, stages[i], 0.7, captions[i])));
    q.arrow(pos, end, colors[i]);
    pos = end;
  });
  const b = k.beat.beatIndex;
  const product = cue(k, 1, 'Multiply the first matrix by the second', 0) === 1;
  label(g, product ? 'Combined map P @ R' : 'Second map R  /  three input rows', 504, 149);
  const m = product ? combined : R;
  const cells = ['Each new entry', 'The shared width', 'The combined matrix', 'straight to a pair']
    .map((phrase) => cue(k, 1, phrase, 0.7, phrase === 'straight to a pair' ? false : phrase));
  const cell = cells.findLastIndex((progress) => progress > 0);
  table(g, {
    x: 502,
    y: 196,
    w: 405,
    names: m.map((_, i) => 'row ' + i),
    cols: ['out 0', 'out 1'],
    heads: 96,
    rh: 45,
    rows: m.map((r, i) =>
      r.map((v, j) => (!product || cells[2 * i + j] === 1 ? v : null)),
    ),
    active: (i, j) => product && b === 1 && 2 * i + j === cell,
  });
  if (!product) mono(g, 'input   ' + vec(mid), 504, 376, 22, C.teal);
  if (b === 1 && cell >= 0) {
    const i = Math.floor(cell / 2),
      j = cell % 2;
    mono(g, 'row ' + i + '   ' + vec(P[i]), 504, 335, 19, C.blue);
    mono(g, 'col ' + j + '   ' + vec(transpose(R)[j]), 504, 368, 19, C.brass);
    if (cells[cell] === 1) mono(g, 'dot = ' + fmt(combined[i][j]), 744, 368, 19, C.teal);
  }
  const direct = cue(k, 2, 'Scale its two directions', 1.2);
  if (direct > 0) {
    const one = scale(combined[0], password[0]),
      two = scale(combined[1], password[1]);
    q.arrow(zero, scale(one, unit(direct * 2)), C.brass, 2.3);
    q.arrow(one, add(one, scale(two, unit(2 * direct - 1))), C.brass, 2.3);
  }
  if (cue(k, 2, 'exactly where', 0.3) > 0) {
    pen(g, ...q.p(...project(password, combined)));
    mono(g, 'endpoint  ' + vec(project(password, combined)), 504, 365, 23, C.teal);
  }
  if (b === 0) foot(g, 'Each coordinate scales one direction of the second map.');
  else if (product) foot(g, '(2 × 3) @ (3 × 2) gives one 2 × 2 map.');
  else {
    text(g, 'Which work could we do', 504, 410, 19, C.ink);
    text(g, 'before the next word arrives?', 504, 432, 19, C.ink);
  }
}
export function rows(g, k) {
  const times = [
    'Apply the same matrix to reset',
    'Then apply it to my',
    'Finally, transform password',
  ];
  const turns = times.map((s) => cue(k, 1, s, 0.75));
  const selected = turns.findLastIndex((v) => v > 0);
  label(g, 'Token rows', 42, 175);
  label(g, 'Fixed matrix P', 374, 175);
  label(g, 'Projected rows', 660, 175);
  table(g, {
    x: 40,
    y: 219,
    w: 276,
    rows: H[0],
    names: WORDS[0],
    cols: ['x', 'y'],
    active: (i) => i === selected,
  });
  table(g, { x: 370, y: 219, w: 223, rows: P, cols: outputs, heads: 0, rh: 46 });
  table(g, {
    x: 654,
    y: 219,
    w: 266,
    rows: projected[0].map((r, i) => r.map((v) => (turns[i] === 1 ? v : null))),
    cols: outputs,
    names: WORDS[0],
    heads: 85,
    active: (i) => i === selected,
  });
  for (const [x, xx] of [
    [319, 357],
    [597, 640],
  ])
    arrow(g, x, 277, xx, 277, C.teal);
  foot(
    g,
    k.beat.beatIndex < 2
      ? 'Each row passes through the same coefficients.'
      : 'Three word positions survive. The feature width grows from two to three.',
  );
}
function tokenPair(g, rows, opts = {}) {
  rows.forEach((rs, p) => {
    const x = 44 + p * 463;
    label(g, opts.heading?.(p) ?? 'Prompt ' + p, x, 142);
    table(g, {
      x,
      y: 201,
      w: 398,
      rows: rs,
      names: WORDS[p],
      cols: opts.cols || ['feature 0', 'feature 1'],
      heads: 100,
      rh: 53,
      active: (i, j) => opts.active?.(p, i, j),
      tint: (i, j) => opts.tint?.(p, i, j) || C.pale,
      unitGain: opts.unitGain && ((i, j) => opts.unitGain(p, i, j)),
    });
  });
}
export function tensor(g, k) {
  const b = k.beat.beatIndex;
  if (b < 3) {
    const prompt = cue(k, 1, 'Choose message one'),
      token = cue(k, 1, 'then token two');
    const sel = cue(k, 1, 'then feature zero'),
      slice = cue(k, 1, 'Slide the window', 0.8);
    const projectedNow = cue(k, 2, 'Apply it to all six', 1.5),
      n = Math.floor(6 * projectedNow);
    const rows =
      b === 2
        ? projected.map((rs, p) => rs.map((r, i) => r.map((v) => (p * 3 + i < n ? v : null))))
        : H;
    tokenPair(g, rows, {
      cols: b === 2 ? outputs : undefined,
      active: (p, i, j) => {
        if (b === 2) return p * 3 + i === n - 1;
        if (slice) return j === 0;
        return prompt > 0 && p === 1 && (!token || i === 2) && (!sel || j === 0);
      },
    });
    if (b === 1) {
      const address = sel
        ? 'H[1, 2, 0]  =  ' + H[1][2][0]
        : token
          ? 'H[1, 2, :]'
          : prompt
            ? 'H[1, :, :]'
            : 'H';
      mono(g, slice ? 'H[:, :, 0]     shape (2, 3)' : address, 480, 406, 23, C.teal, 'center');
    }
    foot(
      g,
      b === 2
        ? 'Every triple keeps its prompt and token address.'
        : 'A number has a prompt, a token position, and a feature index.',
    );
    if (b === 2) return 'Project each token in both prompts';
    if (slice > 0) return 'Trace feature zero across both prompts';
  } else {
    const count = cue(k, 4, 'twelve vectors', 0, 'There are five hundred') === 1;
    const width = cue(k, 4, 'fifty-six outputs', 0, 'each with two hundred') === 1;
    const shape = cue(k, 4, 'Keep the four strips separate', 0) === 1;
    for (let i = 0; i < 4; i++) {
      const yy = 167 + i * 55;
      label(g, 'Prompt ' + i, 52, yy + 12);
      rect(g, 151, yy, 404, 27, C.pale, C.teal, 3);
      for (let j = 1; j < 128; j++)
        line(
          g,
          151 + (j * 404) / 128,
          yy + (j % 8 ? 17 : 1),
          151 + (j * 404) / 128,
          yy + 26,
          C.teal,
          0.75,
        );
    }
    label(g, '128 tokens per prompt', 151, 397);
    label(g, 'Shared projection', 619, 171);
    mono(g, '768 × 256', 619, 218, 34, C.ink);
    if (count) mono(g, fmt(4 * 128) + ' vectors', 619, 285, 28, C.teal);
    if (width) mono(g, '256 coordinates each', 619, 325, 22, C.teal);
    if (shape) mono(g, '(4, 128, 256)', 619, 370, 25, C.teal);
    foot(
      g,
      width
        ? 'Each of the 512 token positions has its own vector with 256 coordinates.'
        : count
          ? 'How many coordinates will each output vector have?'
          : 'Count the output vectors and their coordinates.',
    );
    return width
      ? 'Each token position gets its own vector'
      : 'How many output vectors do four prompts produce?';
  }
}
export function localEdit(g, k) {
  const b = k.beat.beatIndex;
  const markInput = cue(k, 0, 'add one', 0, 'Suppose we add one') === 1;
  const focusRow = cue(k, 1, 'password row', 0, 'Look at the password row') === 1;
  const inputStep = cue(k, 2, 'Change that one coordinate', 1.4);
  const rise = cue(k, 2, 'The first and third outputs rise together', 2.9);
  const finish = cue(k, 2, 'Look at the middle cell', 0.55);
  const applied = 0.8 * rise + 0.2 * finish;
  const settled = applied === 1;
  const explained = b > 2 || (b === 2 && k.elapsed >= k.speechDuration);
  const reuse = cue(k, 3, 'We could reuse', 0) === 1;
  const { input, saved, gain, rows } = localProjection(inputStep, applied);
  const outputLabel = settled ? 'updated outputs' : applied > 0 ? 'adding the change' : 'saved outputs';
  tokenPair(g, rows, {
    heading: (p) => 'Prompt ' + p + '  /  ' + (p === 0 ? outputLabel : 'saved outputs'),
    cols: outputs,
    active: (p, i) => focusRow && p === 0 && i === 2,
    tint: (p, i, j) => settled && gain[j] > 0 ? C.warm : C.pale,
    unitGain: (p, i, j) => p === 0 && i === 2 ? gain[j] : 0,
  });
  label(g, 'Password input', 44, 380);
  if (markInput) rect(g, 44, 395, 119, 34, C.pale, null, 3);
  mono(g, 'x  ' + fmt(input[0]), 53, 412, 20);
  mono(g, 'y  ' + fmt(input[1]), 190, 412, 20);
  if (focusRow) {
    label(g, 'Saved password output', 507, 380);
    mono(g, vec(saved), 507, 412, 19);
  }
  if (explained) {
    label(g, 'Added to that output', 737, 380);
    mono(g, vec(gain), 737, 412, 19, C.teal);
  }
  foot(
    g,
    reuse ? 'The five other words keep their saved triples under this fixed matrix.'
      : explained ? 'The zero in the first matrix row keeps the middle output at 0.5.'
      : applied > 0 ? 'The strips show how much each saved value gains.'
      : b === 2 ? 'Read the input beside the saved output.'
      : focusRow ? 'Which value in this row would stay at one half?'
      : 'Which output rows would change?',
  );
}

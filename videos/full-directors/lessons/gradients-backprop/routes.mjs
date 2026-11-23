import { C, clamp, fmt, mix, vec } from './instruments.mjs';
import {
  BATCH_HISTORY,
  batchGradientState,
  latencyExample,
  reluBranchState,
  reluCornerDifference,
  seedResult,
  sixWeightSum,
} from './models.mjs';

const branchFeatures = [2, 1];
const branch = latencyExample([2, 2], branchFeatures);
function chain(d, back = false) {
  d.title(back ? 'Read the operations from the loss back' : 'Build a latency prediction');
  const xs = [178, 532, 791, 1025],
    ys = [219, 442],
    mid = 322;
  const paths = ys.map((y) => [
    [xs[0] + 70, y],
    [350, y],
    [370, mid],
    [xs[1] - 46, mid],
  ]);
  const f = back ? 1 : d.cue(1, 'prompt branch produces', 1),
    a = back ? 1 : d.cue(1, 'Add them', 1),
    e = back ? 1 : d.cue(1, 'Subtract the fixed target', 1),
    s = back ? 1 : d.cue(1, 'Square it', 1);
  for (const [i, y] of ys.entries()) {
    const color = i ? C.plum : C.blue;
    if (!back) d.track(paths[i], a, color);
    d.node(
      xs[0],
      y,
      53,
      i ? 'queue × weight' : 'blocks × weight',
      f ? (i ? '1×2' : '2×2') : '?',
      color,
    );
    if (f) d.txt(i ? '2 s' : '4 s', 299, y - 27, 22, color, 'center');
  }
  for (const [i, t] of [e, s].entries()) {
    const left = xs[1 + i] + 49,
      right = xs[2 + i] - 49;
    d.arrow(back ? right : left, mid, back ? left : right, mid, !back && t ? C.copper : C.grid, 4);
  }
  d.node(xs[1], mid, 46, 'prediction', a ? fmt(branch.prediction) : '?', C.blue);
  d.node(xs[2], mid, 45, 'subtract 5', e ? fmt(branch.error) : '?', C.copper);
  d.node(xs[3], mid, 45, 'square', s ? fmt(branch.loss) : '?', C.copper);
  if (back) return returnSignals(d, xs, mid, paths);
  if (d.b === 2) d.banner('Save error 1 and features [2, 1] for the return trip.');
}
function returnSignals(d, xs, y, paths) {
  const { b, clock } = d;
  const replay = b === 2;
  function after(beat, phrase, captionStart) {
    if (b !== beat) return b > beat;
    if (captionStart) clock.reveal(captionStart, 0, { captionStart });
    return clock.elapsed >= clock.wordCue(phrase).end;
  }
  const seed = 1,
    squareSlope = 2 * branch.error,
    subtractSlope = 1;
  const atError = seed * squareSlope,
    atPrediction = atError * subtractSlope;
  const square = replay
    ? d.cue(2, 'The square contributes', 0.65)
    : d.cue(0, 'The square has local slope', 0.9);
  const subtraction = replay
    ? d.cue(2, 'subtraction times one', 0.55)
    : d.cue(0, 'Subtracting a fixed target', 0.9);
  const squareKnown = replay
    ? after(2, 'The square contributes times two')
    : after(0, 'one becomes two');
  const subtractionKnown = replay
    ? after(2, 'subtraction times one')
    : after(0, 'two passes through unchanged');
  for (const [i, progress, slope, known] of [
    [2, square, squareSlope, squareKnown],
    [1, subtraction, subtractSlope, subtractionKnown],
  ]) {
    const from = xs[i + 1] - 49,
      to = xs[i] + 49;
    d.arrow(from, y, mix(from, to, progress), y, C.green, 5);
    if (known) d.txt('× ' + slope, (from + to) / 2, y - 35, 24, C.green, 'center', 'Mono');
  }
  if (replay ? after(2, 'Start with one') : after(0, 'Start with sensitivity one at the loss'))
    d.txt('Seed ' + seed, xs[3], y - 82, 25, C.green, 'center');
  if (squareKnown) d.txt('Sensitivity ' + atError, xs[2], y - 82, 25, C.green, 'center');
  if (subtractionKnown)
    d.txt('Sensitivity ' + atPrediction, xs[1], y - 82, 25, C.green, 'center');

  const split = d.cue(1, 'Addition passes that two to both branches', 1.35);
  const promptReplay = d.cue(2, 'and the prompt feature', 0.9);
  const featuresKnown = replay
    ? [after(2, 'prompt feature another times two'), false]
    : [after(1, 'through feature two'), after(1, 'through feature one')];
  const gradientsKnown = replay
    ? [after(2, 'recover four', 'recover four'), false]
    : [
        after(1, 'two times two equals four', 'equals four'),
        after(1, 'two times one equals two', 'equals two'),
      ];
  paths.forEach((path, i) => {
    const progress = replay ? (i ? 0 : promptReplay) : split;
    d.track(path.toReversed(), progress, C.green);
    const [[x, row]] = path;
    if (progress === 1) {
      d.dot(x, row, 15, C.green);
      d.txt(atPrediction, x, row, 20, C.white, 'center', 'Mono');
    }
    if (!featuresKnown[i]) return;
    const color = i ? C.plum : C.blue;
    const product = atPrediction + ' × ' + branchFeatures[i];
    d.txt(i ? 'Queue weight gradient' : 'Prompt weight gradient', xs[0], row + 100, 22, C.muted, 'center');
    d.txt(
      gradientsKnown[i] ? product + ' = ' + fmt(branch.gradient[i]) : product,
      xs[0],
      row + 126,
      27,
      color,
      'center',
      'Mono',
    );
  });
  if (replay && gradientsKnown[0])
    d.banner(
      [seed, squareSlope, subtractSlope, branchFeatures[0]].join(' × ') +
        ' = ' + fmt(branch.gradient[0]),
      C.green,
    );
}
function gate(d) {
  d.title('When does a turn reach the pointer?');
  const w = Math.round(100 * mix(2, -0.5, d.cue(2, 'Change only prompt weight', 2.25))) / 100,
    s = reluBranchState(w);
  const zero = 418,
    pitch = 48,
    rod = zero - s.h * pitch,
    pointer = zero - s.z * pitch;
  // The shoulder supports the pointer exactly at the zero-prompt position.
  d.rect(190, 140, 12, 332, C.grid);
  d.rect(450, 140, 12, 332, C.grid);
  for (const x of [174, 431]) {
    d.rect(x, zero, 48, 19, C.muted);
    d.rect(x + 5, zero + 19, 38, 12, C.grid);
  }
  d.rect(314, rod, 25, 515 - rod, C.apricot);
  for (let y = rod + 7; y < 508; y += 13) d.line(314, y + 5, 339, y - 3, C.copper, 2);
  d.rect(288, rod, 78, 10, C.copper);
  d.path(
    [
      [178, pointer - 20],
      [462, pointer - 20],
      [532, pointer],
      [462, pointer],
      [178, pointer],
    ],
    C.blue,
    1,
    true,
  );
  d.txt('prediction', 316, pointer - 10, 17, C.white, 'center');
  for (let n = 1; n <= 7; n++) {
    const y = zero - (n - 2) * pitch;
    d.line(540, y, 554, y, C.muted, 2);
    d.txt(n, 565, y, 19, C.muted);
  }
  d.txt('seconds', 542, 135, 19, C.muted);
  d.line(587, zero - 3 * pitch, 606, zero - 3 * pitch, C.green, 2);
  d.txt('target', 615, zero - 3 * pitch, 18, C.green);
  d.txt('prompt weight   ' + fmt(w, 2), 315, 545, 24, C.copper, 'center', 'Mono');
  d.metric('Preactivation h    /    ReLU(h)', fmt(s.h, 2) + '   /   ' + fmt(s.z, 2), 748, 157);
  d.metric(
    'Prediction     /     loss',
    fmt(s.prediction, 2) + ' s   /   ' + fmt(s.loss, 2) + ' s²',
    748,
    266,
    C.copper,
    32,
  );
  if (d.b >= 1) {
    d.txt('Back to the prompt weight', 748, 391, 20, C.muted);
    d.txt(
      fmt(s.signal, 2) + ' × ' + s.gate + ' × 2 = ' + fmt(s.promptGradient, 2),
      748,
      435,
      30,
      C.blue,
      'left',
      'Mono',
    );
  }
  if (d.b === 3) d.txt('Queue bypass: gradient −6', 748, 505, 25, C.ink, 'left', 'Serif');
}
function corner(d) {
  d.title('Probe both sides of the stop');
  function cornerNote() {
    d.txt('At the corner the ordinary derivative is undefined. PyTorch backward returns 0.',
      600, 110, 29, C.ink, 'center', 'Serif');
  }
  const p = d.plot(
    123,
    175,
    575,
    304,
    [-0.65, 0.75],
    [2, 10],
    [-0.5, 0, 0.25, 0.5],
    [3, 6, 9],
    '',
    'squared loss (s²)',
  );
  d.txt('prompt weight', p.X(0.75) + 18, p.Y(2), 19, C.muted);
  const L = (x) => reluBranchState(x).loss;
  p.curve(L);
  if (d.b === 4) {
    const test = d.cue(4, 'test a smooth point', 1.2);
    [-0.25, 0.25].forEach((x, i) => {
      const h = 0.02,
        measured = (L(x + h) - L(x - h)) / (2 * h);
      const color = i ? C.copper : C.blue;
      p.point(x - h, L(x - h), color, 5);
      if (test) {
        p.point(x + h, L(x + h), color, 5);
        p.curve((w) => L(x - h) + measured * (w - x + h), x - 0.13, x + 0.13, color, 3);
      }
      d.metric(
        'Centered check at w = ' + fmt(x),
        test ? fmt(measured, 2) : '?',
        779,
        185 + 152 * i,
        color,
        34,
      );
    });
    cornerNote();
    return;
  }
  const h = mix(0.24, 0.003, d.cue(2, 'approaches minus six', 1.8));
  if (d.b < 3) {
    p.point(0, L(0), C.muted);
    if (d.b < 2)
      p.point(
        d.b === 0 ? mix(-0.5, 0.25, d.cue(0, 'Cross to the right', 1.8)) : 0.04,
        L(d.b === 0 ? mix(-0.5, 0.25, d.cue(0, 'Cross to the right', 1.8)) : 0.04),
        C.copper,
      );
    else {
      p.point(-h, L(-h), C.plum);
      p.point(h, L(h), C.copper);
      p.curve((x) => L(-h) + (x + h) * reluCornerDifference(h).center, -0.5, 0.6, C.plum);
    }
  } else {
    const x = 0.25 * d.cue(3, 'Move the weight', 1.4);
    p.point(x, L(x));
    d.metric('Loss at the new weight', fmt(L(x)) + ' s²', 782, 397, C.copper, 32);
  }
  d.metric('At w = 0, from the left', '0', 782, 162, C.blue);
  if (d.b >= 1) d.metric('At w = 0, from the right', '−12', 782, 273, C.copper);
  if (d.b === 2)
    d.metric('Centered ratio', fmt(reluCornerDifference(h).center, 3), 782, 397, C.plum, 32);
  if (d.b > 2 || (d.b === 2 && d.clock.elapsed >= d.clock.speechDuration))
    cornerNote();
}
function shared(d) {
  d.title(
    d.b < 3 ? 'Follow both returns to the same weight' : 'Four rows also reach the prompt weight',
  );
  if (d.b >= 3) return batchTable(d, true);
  const w = 2,
    gradient = branch.gradient,
    back = d.b === 2;
  const upper = d.cue(2, 'prompt route contributes four', 1.5),
    lower = d.cue(2, 'queue route contributes two', 1.5);
  const a = [
    [834, 321],
    [730, 96],
    [420, 110],
    [345, 321],
  ];
  const z = [
    [834, 321],
    [730, 546],
    [420, 532],
    [345, 321],
  ];
  d.track(a, back ? upper : 0, C.blue, back && upper < 1 ? gradient[0] : undefined);
  d.track(z, back ? lower : 0, C.plum, back && lower < 1 ? gradient[1] : undefined);
  d.node(280, 321, 65, 'shared weight', fmt(w), C.ink);
  d.node(899, 321, 65, 'prediction (s)', fmt(branch.prediction), C.copper);
  d.txt(
    back ? 'Signal 2 × 2 prompt blocks' : '2 prompt blocks × w',
    581,
    124,
    24,
    C.blue,
    'center',
  );
  d.txt(
    back ? 'Signal 2 × 1 queue interval' : '1 queue interval × w',
    581,
    523,
    24,
    C.plum,
    'center',
  );
  if (d.b === 1) d.banner('Two paths leave one stored weight. How should their returns combine?');
  if (back)
    d.txt('Loss signal at the prediction  =  2 × (6 − 5)  =  2', 590, 322, 18, C.muted, 'center');
  if (upper >= 1) d.txt('+4', 374, 232, 28, C.blue, 'center', 'Mono');
  if (lower >= 1) d.txt('+2', 374, 411, 28, C.plum, 'center', 'Mono');
  if (lower >= 1 && upper >= 1)
    d.banner('At the shared weight    4 + 2 = ' + gradient.reduce((a, b) => a + b, 0), C.green);
}
function batchTable(d, promptOnly = false) {
  const state = batchGradientState();
  const last = promptOnly ? 1 : d.cue(2, 'last request pulls hardest', 1);
  const prompt = promptOnly
    ? d.cue(3, 'sum to minus', 1)
    : d.cue(2, 'Average the prompt column', 1);
  const queue = !promptOnly && d.cue(3, 'Average the queue column', 1) > 0;
  const columns = promptOnly ? [130, 351, 552, 760, 1000] : [103, 294, 483, 670, 851, 1048];
  const names = [
    'Request',
    'Blocks',
    'Queue (s)',
    'Target (s)',
    'Prompt ∂L',
    ...(promptOnly ? [] : ['Queue ∂L']),
  ];
  names.forEach((v, i) => d.txt(v, columns[i], 165, 21, C.muted, 'center'));
  state.rows.forEach((r, i) => {
    const y = 223 + i * 57,
      values = [
        r.id,
        ...r.features,
        r.target,
        (i === 3 && last) || prompt ? fmt(r.gradient[0]) : '·',
        ...(promptOnly ? [] : [queue ? fmt(r.gradient[1]) : '·']),
      ];
    if (i === 3 && last) d.rect(64, y - 24, 1072, 48, C.apricot);
    values.forEach((v, j) =>
      d.txt(v, columns[j], y, 25, j >= 4 ? C.copper : C.ink, 'center', 'Mono'),
    );
    d.line(70, y + 29, 1130, y + 29, C.grid, 1);
  });
  if (promptOnly && prompt)
    d.txt('Prompt    (−5 − 20 − 39 − 80) / 4 = ' + fmt(state.gradient[0]),
      600, 528, 29, C.copper, 'center', 'Serif');
  else if (!promptOnly) {
    if (d.b === 1)
      d.txt('Mean of the four squared errors   =   ' + fmt(state.loss) + ' s²',
        600, 528, 29, C.ink, 'center', 'Serif');
    if (d.b === 2 && prompt) d.banner('Prompt gradient of the mean   =   −144 / 4   =   −36');
    if (d.b === 3 && queue)
      d.txt(
        'Gradient of mean loss   =   (2 / 4) × transpose(X) × e   =   ' + vec(state.gradient),
        600, 528, 29, C.ink, 'center', 'Serif',
      );
    if (d.b === 4)
      d.banner(
        'First update    [0, 0] − 0.03 × ' +
          vec(state.gradient) +
          ' = ' +
          vec(BATCH_HISTORY[1].weights),
      );
  }
}
const conditioningLoss = (dx, dy) => batchGradientState([2 + dx, 1 + dy]).loss;
const contoursByLevel = [0.003, 0.011, 0.03, 0.08, 0.16, 0.27, 0.4].map((level) =>
  Array.from({ length: 241 }, (_, i) => {
    const a = (2 * Math.PI * i) / 240,
      c = Math.cos(a),
      s = Math.sin(a);
    const r = Math.sqrt(level / conditioningLoss(c, s));
    return [595 + 740 * r * c, 340 - 740 * r * s];
  }),
);
function contours(d) {
  const x0 = 595,
    y0 = 340,
    scale = 740;
  const X = (v) => x0 + scale * v,
    Y = (v) => y0 - scale * v;
  d.ctx.save();
  d.ctx.beginPath();
  d.ctx.rect(100, 150, 1020, 369);
  d.ctx.clip();
  for (const points of contoursByLevel) d.path(points, C.grid, 2);
  d.ctx.restore();
  d.line(133, y0, 1088, y0, C.muted, 1);
  d.line(x0, 153, x0, 516, C.muted, 1);
  d.txt('prompt weight offset', 1074, y0 + 28, 18, C.muted, 'right');
  const delta = [0.1, 0.25],
    a = conditioningLoss(delta[0], -delta[1]),
    b = conditioningLoss(...delta);
  for (const [sign, c] of [
    [-1, C.blue],
    [1, C.plum],
  ]) {
    const end = [X(0.1), Y(sign * 0.25)];
    d.arrow(x0, y0, ...end, c, 5);
    d.txt('MSE  ' + fmt(sign < 0 ? a : b, 7), end[0] + 17, end[1], 23, c);
  }
  d.dot(x0, y0, 7, C.green);
  d.banner('Equal distances in weight space cross different numbers of loss contours.');
}
function batch(d) {
  d.title(
    d.b < 5
      ? 'Measure four completed requests'
      : d.b < 7
        ? 'Repeat the full-batch update'
        : 'Which change do the requests notice?',
  );
  if (d.b < 5) return batchTable(d);
  if (d.b <= 6) {
    const n = Math.round(
      10 * d.cue(5, 'After ten updates', 1.5) +
        90 * d.cue(5, 'After one hundred', 2) +
        d.cue(5, 'one last update', 1),
    );
    const p = d.plot(
      121,
      178,
      585,
      305,
      [0, 101],
      [-4, 2],
      [0, 10, 50, 100],
      [-4, -2, 0, 2],
      'completed updates',
      'log₁₀ mean squared loss',
    );
    d.path(
      BATCH_HISTORY.slice(0, n + 1).map((r) => [p.X(r.step), p.Y(Math.log10(r.loss))]),
      C.blue,
      3,
    );
    const r = BATCH_HISTORY[n];
    p.point(n, Math.log10(r.loss));
    d.metric('Updates', n, 791, 167);
    d.metric('MSE (s²)', fmt(r.loss, 6), 791, 279, C.copper);
    d.metric('Weights', vec(r.weights, 3), 791, 392, C.blue, 29);
    return;
  }
  if (d.b === 10) return contours(d);
  const deltaP = 0.1 * d.cue(7, 'Raise the prompt weight', 1.4);
  const deltaQ =
    -0.25 * d.cue(8, 'Lower the queue weight', 1.6) + 0.5 * d.cue(9, 'Flip the queue change', 1.6);
  const w = [2 + deltaP, 1 + deltaQ],
    s = batchGradientState(w);
  d.txt('Prediction error  (seconds)', 625, 143, 22, C.muted, 'center');
  const X = d.axis(320, 478, 690, -0.25, 1, [-0.25, 0, 0.25, 0.5, 0.75, 1]);
  d.line(X(0), 175, X(0), 475, C.muted, 2);
  s.rows.forEach((r, i) => {
    const y = 201 + i * 72;
    d.txt(r.id + '   ' + vec(r.features), 90, y, 23, C.ink);
    d.line(X(0), y, X(r.error), y, i === 2 ? C.copper : C.blue, 6);
    d.dot(X(r.error), y, 7, i === 2 ? C.copper : C.blue);
    d.txt(fmt(r.error, 3), X(r.error) + 17, y - 18, 18, C.ink);
  });
  d.txt('Weights   ' + vec(w) + '        Mean squared error   ' + fmt(s.loss, 7) + ' s²',
    600, 535, 27, C.ink, 'center', 'Serif');
}
function six(d) {
  d.title(d.b === 0 ? 'Six weights feed one square' : 'Six weights feed one saved sum');
  const x = [142, 408, 715, 1002],
    y = [165, 227, 289, 371, 433, 495];
  const back = d.b < 2 && d.cue(1, 'Each addition passes twelve', 1.8),
    visit = d.cue(2, 'nudge one weight at a time', 3.6);
  const reuse = d.b === 2 &&
    d.clock.elapsed >= d.clock.wordCue('Reverse-mode automatic differentiation').start;
  const base = y.length,
    adj = sixWeightSum(y.map(() => 1)).adjoint,
    checking = d.b === 2 && !reuse;
  const active = checking && visit > 0 && visit < 1 ? Math.floor(visit * base) : -1;
  const values = y.map((_, i) => (i === active ? 1.001 : 1));
  const { sums, total, loss } = sixWeightSum(values);
  y.forEach((v, i) => {
    const group = i < 3 ? 227 : 433;
    d.line(
      x[0] + 36,
      v,
      x[1] - 40,
      group,
      checking ? (i === active ? C.copper : C.grid) : back ? C.plum : C.grid,
      3,
    );
    d.node(x[0], v, 28, '', i === active ? '1+h' : '1', i === active ? C.copper : C.blue);
    if (back && !checking) d.txt(adj, 278, mix(v, group, 0.4) - 15, 18, C.plum, 'center', 'Mono');
    d.txt('w' + (i + 1), 87, v, 19, C.muted, 'right');
  });
  for (const [i, v] of [227, 433].entries()) {
    const highlight = active >= 0 && Math.floor(active / 3) === i;
    d.line(
      x[1] + 42,
      v,
      x[2] - 45,
      330,
      highlight ? C.copper : checking ? C.grid : back ? C.plum : C.grid,
      4,
    );
    d.node(x[1], v, 40, 'subtotal', fmt(sums[i]), highlight ? C.copper : C.blue);
  }
  d.line(
    x[2] + 51,
    330,
    x[3] - 58,
    330,
    active >= 0 ? C.copper : checking ? C.grid : back ? C.plum : C.grid,
    4,
  );
  d.node(
    x[2],
    330,
    53,
    checking ? 'sum this run' : d.b === 0 ? 'sum' : 'saved sum',
    fmt(total),
    C.copper,
  );
  d.node(x[3], 330, 60, 'squared loss', fmt(loss, 6), C.copper);
  if (reuse) {
    const clock = d.clock;
    const times = [
      clock.wordCue('One sweep').start,
      clock.wordCue('from this scalar loss').end,
      clock.wordCue('gives us all').end,
      clock.wordCue('six derivatives').end,
    ];
    const progress = times.slice(0, -1).map((start, i) =>
      clamp((clock.elapsed - start) / (times[i + 1] - start)),
    );
    const send = (fromX, fromY, toX, toY, t) => {
      if (t === 0) return;
      const tipX = mix(fromX, toX, t), tipY = mix(fromY, toY, t);
      if (Math.hypot(tipX - fromX, tipY - fromY) >= 12)
        d.arrow(fromX, fromY, tipX, tipY, C.plum, 4);
      if (t < 1) d.dot(tipX, tipY, 5, C.plum);
    };
    send(x[3] - 62, 330, x[2] + 55, 330, progress[0]);
    if (progress[0] === 1)
      d.txt('2 × 6 = ' + adj, 857, 360, 21, C.plum, 'center', 'Mono');
    for (const v of [227, 433]) {
      send(x[2] - 49, 330, x[1] + 43, v, progress[1]);
      if (progress[1] === 1)
        d.txt(adj, 560, mix(330, v, .5) - 15, 19, C.plum, 'center', 'Mono');
    }
    y.forEach((v, i) => {
      const subtotal = i < 3 ? 227 : 433;
      send(x[1] - 41, subtotal, x[0] + 35, v, progress[2]);
      if (progress[2] === 1)
        d.txt(adj, 278, mix(v, subtotal, .4) - 15, 18, C.plum, 'center', 'Mono');
    });
    d.txt('One-sided checks take 6 extra runs. Backward takes 1 sweep.',
      600, 110, 29, C.ink, 'center', 'Serif');
    return;
  }
  if (checking && visit === 1) {
    d.txt('One-sided checks take 6 extra runs. Backward takes 1 sweep.',
      600, 528, 29, C.ink, 'center', 'Serif');
    return;
  }
  d.banner(
    d.b === 0
      ? 'Which forward value does the square need?'
      : d.b === 1
        ? back
          ? '2 × saved sum = 12. Every addition passes that signal to each input.'
          : 'Which value feeds the square?'
        : active >= 0
          ? 'Run ' + (active + 1) + ' of 6     •     h = 0.001 on one weight'
          : 'Keep the baseline loss and change one weight per run.',
  );
}
function seeds(d) {
  d.title('Choose what the return trip measures');
  const sum = d.cue(4, 'Give both outputs a plus one', 1.2) > 0;
  const weights = sum ? [1, 1] : [-1, 1],
    s = seedResult(weights);
  if (d.b >= 2) {
    d.txt(
      'Seed ' +
        vec(weights) +
        '     ' +
        (sum ? 'prediction 2 + prediction 1' : 'prediction 2 − prediction 1'),
      99,
      138,
      25,
      C.ink,
    );
    d.txt('First row × ' + fmt(weights[0]), 709, 191, 20, C.copper);
    d.txt('Second row × 1', 937, 191, 20, C.blue);
    const switchSeed = d.cue(4, 'Give both outputs a plus one', 1.8);
    for (let j = 0; j < 2; j++) {
      const y = 289 + 154 * j,
        term = s.rows[0][j] * weights[0],
        result = s.gradient[j];
      const t = sum
        ? switchSeed
        : d.cue(2, j ? 'Half a second minus' : 'Three blocks minus one', 1.5);
      const X = d.axis(270, y + 26, 760, -1.5, 4.5, [-1, 0, 1, 2, 3, 4]);
      d.txt(j ? 'Queue' : 'Prompt', 106, y, 26, C.ink);
      d.dot(X(0), y - 20, 5, C.muted);
      d.arrow(X(0), y - 20, X(term), y - 20, C.copper, 5);
      d.line(X(term), y - 16, X(term), y, C.grid, 2);
      d.arrow(X(term), y + 2, X(mix(term, result, t)), y + 2, C.blue, 6);
      if (t === 1) d.dot(X(result), y + 2, 8, C.blue, C.white);
    }
    if (sum ? switchSeed === 1 : d.cue(2, 'zero', 0.4) === 1)
      d.txt(
        'Transpose(J) × seed   =   ' +
          fmt(weights[0]) +
          ' × [1, 0.5] + [3, 0.5]   =   ' +
          vec(s.gradient),
        600, 528, 29, C.ink, 'center', 'Serif',
      );
    return;
  }
  const ready = d.cue(1, 'queue terms cancel') > 0;
  d.txt('Same queue delay, different prompts', 105, 157, 23, C.muted);
  s.rows.forEach(([blocks, q], i) => {
    const y = 222 + i * 112,
      start = 249,
      unit = 151;
    d.txt('Request ' + (i + 1), 99, y + 24, 23);
    d.rect(start, y, q * 1.1 * unit, 56, C.apricot);
    d.txt('queue', start + 42, y + 28, 19, C.copper, 'center');
    for (let j = 0; j < blocks; j++) {
      const left = start + q * 1.1 * unit + j * 1.3 * unit;
      d.rect(left + 2, y, 1.3 * unit - 2, 56, C.sky);
      d.txt('100 tokens', left + 0.65 * unit, y + 28, 21, C.blue, 'center');
    }
    d.txt(fmt(s.predictions[i]) + ' s', start + unit * s.predictions[i] + 18, y + 26, 25, C.blue);
  });
  if (ready)
    d.txt(
      (sum ? 'Sum' : 'Difference') +
        '   ' +
        s.predictions
          .map((v, i) => (i ? ' + ' : '') + '(' + fmt(weights[i]) + ') × ' + fmt(v))
          .join('') +
        '  =  ' +
        fmt(s.value) +
        ' s',
      600,
      456,
      29,
      C.copper,
      'center',
      'Mono',
    );
}
export const routes = [
  (d) => chain(d),
  (d) => chain(d, true),
  gate,
  corner,
  shared,
  batch,
  six,
  seeds,
];

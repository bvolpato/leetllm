import { C, clamp, fmt, mix, vec } from './instruments.mjs';
import {
  advance,
  derivativeLoss,
  finiteDifference,
  latencyExample,
  pair,
  response,
  scalar,
} from './models.mjs';

function spans(d, w, y, showOld) {
  const left = 100,
    scale = 150,
    result = pair(w);
  const X = (v) => left + v * scale;
  const target = X(5);
  const observed = d.cue(0, 'This request took five seconds', 1.35);
  const prediction = d.cue(0, 'The model predicted six', 1.25);
  const labels = d.cue(0, 'Each blue span', 0.35);
  d.axis(left, y + 88, 6.5 * scale, 0, 6.5, [0, 1, 2, 3, 4, 5, 6], 'elapsed seconds');
  d.line(left, y - 29, X(5 * observed), y - 29, C.green, 5);
  d.dot(X(5 * observed), y - 29, 6, C.green);
  if (observed === 1) {
    d.line(target, y - 40, target, y, C.green, 3);
    d.txt('observed 5 s', target, y - 65, 25, C.green, 'center');
  }
  for (let i = 0; i < 2; i++) {
    const x = X(i * w),
      width = w * scale;
    const filled = clamp(2 * prediction - i) * width;
    d.rect(x, y, filled, 64, i ? C.sky : C.blue);
    for (let j = 1; j < 10 && (width * j) / 10 <= filled; j++)
      d.line(x + (width * j) / 10, y + 51, x + (width * j) / 10, y + 63, i ? C.blue : C.sky, 1.5);
    if (labels > 0) {
      d.ctx.save();
      d.ctx.globalAlpha = labels;
      d.txt('100 tokens', x + width / 2, y + 27, 26, i ? C.blue : C.white, 'center');
      d.ctx.restore();
    }
  }
  if (observed === 1) d.line(target, y, target, y + 85, C.green, 3);
  if (prediction > 0) {
    const tip = X(result.prediction * prediction);
    d.pin(tip, y, C.copper);
    if (prediction === 1)
      d.txt(fmt(result.prediction, 2) + ' s', tip, y - 39, 24, C.copper, 'center');
  }
  if (showOld) for (const v of [3, 6]) d.line(X(v), y + 66, X(v), y + 85, C.muted, 2);
}
function opening(d) {
  d.title('Which way should the weight turn?');
  const down = d.cue(1, 'Turn it down a tenth', 1.4),
    reset = d.cue(1, 'Put the weight back', 1.15);
  const fine = d.cue(2, 'Each block loses', 1.25);
  const w = 3 - 0.1 * down * (1 - reset) - 0.01 * fine;
  spans(d, w, 254, down > 0);
  if (d.cue(0, 'One adjustable weight') > 0)
    d.metric('Weight', fmt(w, 2) + ' s / 100 tokens', 100, 425, C.blue, 34);
  if (d.cue(0, 'Look at the join') > 0) d.metric('Join', fmt(w, 2) + ' s', 505, 425);
  if (down > 0 && reset < 1)
    d.banner(
      'Change at join   ' +
        fmt(w - 3, 2) +
        ' s         Change at tip   ' +
        fmt(pair(w).prediction - 6, 2) +
        ' s',
    );
  else if (reset === 1 && fine === 0)
    d.banner('Take off 0.01 s per block. How far will the tip move?');
  else if (fine > 0) d.banner('Two blocks share the setting. Both changes reach the tip.');
}
function squared(d) {
  d.title('Give the miss a second dimension');
  const grow = d.cue(1, 'A two-second miss', 1.35);
  let mirror = Number(d.b > 1);
  if (d.b === 1) {
    const start = d.clock.wordCue('A two-second miss on the early side').start;
    const end = d.clock.wordCue('early side').start;
    const progress = clamp((d.clock.elapsed - start) / (end - start));
    mirror = progress * progress * (3 - 2 * progress);
  }
  const restore = d.cue(2, 'Back at three', 0.85),
    trim = d.cue(2, 'turn the weight down', 1.4);
  const initial = 0.98 + 0.02 * d.cue(0, 'Roll back', 1);
  const error = mix(mix(initial, 2, grow) * (1 - 2 * mirror), 1, restore) - 0.2 * trim;
  const side = 108 * Math.abs(error),
    pred = 5 + error;
  const X = d.axis(95, 354, 600, 2, 8, [2, 3, 4, 5, 6, 7, 8], 'seconds');
  d.line(X(5), 224, X(5), 350, C.green, 3);
  d.txt('observed 5 s', X(5), 199, 23, C.green, 'center');
  d.line(X(5), 295, X(pred), 295, C.copper, 7);
  d.pin(X(pred), 350);
  d.txt(fmt(pred) + ' s', X(pred), 319, 23, C.copper, 'center');
  const x = 875,
    y = 397;
  d.rect(x - side / 2, y - side, side, side, C.apricot);
  for (let j = 1; j < Math.abs(error); j++) {
    d.line(x - side / 2 + j * 108, y - side, x - side / 2 + j * 108, y, C.copper, 2);
    d.line(x - side / 2, y - j * 108, x + side / 2, y - j * 108, C.copper, 2);
  }
  d.line(x - side / 2, y, x + side / 2, y, C.copper, 3);
  d.txt(fmt(Math.abs(error)) + ' s', x, y + 25, 23, C.copper, 'center');
  d.metric('Signed error', fmt(error) + ' s', 105, 458, C.copper);
  d.metric('Squared error', fmt(error ** 2) + ' s²', 770, 458, C.copper);
}
function valley(d, geometry = false) {
  const moving = geometry ? d.cue(2, 'travel downhill', 2) : d.cue(2, 'Move between them', 2.4);
  const from = geometry ? [2, 2] : [1.5, 2],
    to = geometry ? advance(from, [4, 2], 0.08) : [2, 1];
  const w = from.map((v, i) => mix(v, to[i], moving));
  // Identical units on both axes preserve the angle between the gradient and contour.
  const p = d.plot(
    130,
    159,
    330,
    330,
    [1, 2.6],
    [0.9, 2.5],
    [1, 1.5, 2, 2.5],
    [1, 1.5, 2, 2.5],
    'prompt weight',
    'queue weight',
  );
  for (const n of [3.8, 4.2, 4.6, 5, 5.4, 5.8, 6, 6.2, 6.6, 7])
    p.curve((x) => n - 2 * x, 1, 2.6, n === 5 ? C.green : C.grid, n === 5 ? 4 : 2);
  p.point(...from, C.muted, 5);
  if (!geometry) p.point(...to, C.muted, 5);
  if (geometry && d.b >= 1) {
    const t = d.cue(1, 'combines both', 1.2);
    d.arrow(p.X(2), p.Y(2), p.X(2 + 0.36 * t), p.Y(2 + 0.18 * t), C.plum, 5);
  }
  d.line(p.X(from[0]), p.Y(from[1]), p.X(w[0]), p.Y(w[1]), C.blue, 5);
  p.point(...w, C.blue);
  const state = latencyExample(w);
  d.metric('Weights   [prompt, queue]', vec(w, 2), 667, 180);
  d.metric('Predicted time', fmt(state.prediction, 2) + ' s', 667, 287, C.blue);
  d.metric('Squared loss', fmt(state.loss, 3) + ' s²', 667, 395, C.copper);
  if (geometry && d.b === 1)
    d.banner('Gradient [4, 2] crosses the equal-loss lines at a right angle.');
  else if (!geometry) d.banner('Along the green line,  2 × prompt weight + queue weight = 5.');
}
function sweep(d) {
  d.title('One request, many settings');
  if (d.b === 2) return valley(d);
  const w =
    d.b === 0
      ? 2 + 0.5 * d.cue(0, 'At two point five', 1.2) + 0.5 * d.cue(0, 'At three', 1.2)
      : mix(3, 2.25, d.cue(1, 'Try two and a quarter', 1.5));
  const p = d.plot(
    120,
    180,
    590,
    303,
    [1.8, 3.2],
    [0, 2],
    [2, 2.25, 2.5, 2.75, 3],
    [0, 0.5, 1, 1.5, 2],
    'seconds per block',
    'squared loss (s²)',
  );
  p.curve(derivativeLoss);
  p.point(w, derivativeLoss(w));
  d.metric('Weight', fmt(w), 820, 180);
  d.metric('Prediction', fmt(2 * w) + ' s', 820, 301);
  d.metric('Loss', fmt(derivativeLoss(w)) + ' s²', 820, 423, C.copper);
}
function nudge(d) {
  d.title('Resolve a thousandth of a turn');
  const moved = d.cue(0, 'Now move it', 1.4);
  const h = 0.001 * moved,
    w = 3 + h;
  const p = d.plot(
    142,
    195,
    565,
    288,
    [3, 3.0012],
    [1, 1.0048],
    [3, 3.0005, 3.001],
    [1, 1.002, 1.004],
    'weight (enlarged interval)',
    'loss (s²)',
  );
  if (moved > 0) p.curve(derivativeLoss, 3, w);
  p.point(3, 1, C.blue);
  p.point(w, derivativeLoss(w));
  d.metric('Weight increase', fmt(h, 6), 815, 189, C.blue);
  d.metric('Loss before', fmt(derivativeLoss(3)), 815, 288, C.muted);
  d.metric('Loss after', fmt(derivativeLoss(w), 6), 815, 387, C.copper);
  if (d.cue(2, 'Divide the loss increase') > 0) {
    const quotient = '0.004004 ÷ 0.001 = ' + fmt(finiteDifference(0.001), 4);
    d.txt(quotient, 815, 514, 25, C.copper, 'left', 'Mono');
    d.txt('loss units per weight unit', 815, 545, 20, C.muted);
  }
}
function limit(d) {
  d.title('Slide the second point toward the first');
  const h =
    mix(0.24, 0.04, d.cue(0, 'Bring the second point', 2.2)) *
    (1 - 0.999 * d.cue(2, 'As h approaches zero', 2));
  const slope = finiteDifference(h),
    L = derivativeLoss;
  const p = d.plot(
    100,
    161,
    580,
    326,
    [2.5, 3.35],
    [0, 3],
    [2.5, 2.75, 3, 3.25],
    [0, 1, 2, 3],
    'weight',
    'loss (s²)',
  );
  p.curve(L);
  p.curve((x) => 1 + slope * (x - 3), 2.72, 3.35, C.copper, 3);
  p.point(3, 1, C.blue);
  p.point(3 + h, L(3 + h));
  d.metric('Nudge  h', fmt(h, 5), 776, 166);
  d.metric('Secant slope', fmt(slope, 5), 776, 270, C.copper);
  if (d.b >= 1) d.txt('[(1 + 2h)² − 1] / h', 775, 396, 26, C.ink, 'left', 'Mono');
  if (d.b >= 1) d.txt('= 4 + 4h', 775, 450, 35, C.copper, 'left', 'Mono');
  if (d.b === 2) d.banner('The slope approaches 4 as the gap approaches zero.');
}
function partial(d) {
  d.title('Turn one setting. Hold the other.');
  if (d.b === 2) {
    const X = (v) => 209 + 65 * v,
      Y = (v) => 443 - 65 * v;
    d.line(X(0), Y(0), X(5), Y(0), C.grid, 2);
    d.line(X(0), Y(0), X(0), Y(3.5), C.grid, 2);
    const a = d.cue(2, 'Four along the prompt', 1.1),
      z = d.cue(2, 'two along the queue', 1.1);
    d.arrow(X(0), Y(0), X(4 * a), Y(0), C.blue, 4);
    d.arrow(X(4), Y(0), X(4), Y(2 * z), C.plum, 4);
    d.txt('prompt', X(2), Y(0) + 30, 21, C.blue, 'center');
    d.txt('queue', X(4) + 16, Y(1), 21, C.plum);
    if (d.cue(2, 'combined arrow') > 0) d.arrow(X(0), Y(0), X(4), Y(2), C.green, 5);
    d.metric('At weights [2, 2]', '∂L/∂prompt = 4', 705, 205, C.blue, 28);
    if (z) d.metric('At the same weights', '∂L/∂queue = 2', 705, 337, C.plum, 28);
    if (z === 1) d.banner('In parameter order, the gradient is [4, 2].');
    return;
  }
  const t = d.cue(0, 'A nudge of one hundredth', 1.3) * (1 - d.cue(1, 'Reset the prompt dial', 1));
  const q = d.cue(1, 'turn only the queue dial', 1.3) * (1 - d.cue(2, 'Collect the slopes', 0.8));
  const w = [2 + 0.01 * t, 2 + 0.01 * q],
    state = latencyExample(w);
  for (let i = 0; i < 2; i++) {
    const y = 225 + i * 147;
    d.txt(i ? 'Queue weight' : 'Prompt weight', 94, y - 36, 26, C.ink);
    const X = d.axis(96, y + 16, 530, 2, 2.012, [2, 2.005, 2.01]);
    d.pin(X(w[i]), y + 14, i ? C.plum : C.blue);
  }
  d.metric('Start loss', fmt(latencyExample([2, 2]).loss) + ' s²', 778, 178, C.muted);
  d.metric('After the nudge', fmt(state.loss) + ' s²', 778, 300, C.copper);
}
function steps(d, long = false) {
  d.title(long ? 'How far past the minimum?' : 'Choose a step on the curve');
  const eta = long ? 1 : 0.1;
  let start = 3,
    end = 3 - eta * scalar(3).gradient[0];
  let t = long ? d.cue(0, 'Subtract four', 2.4) : d.cue(1, 'Subtract it', 2);
  if (!long && d.b === 3) t = 1 - d.cue(3, 'Start back at three', 1.3);
  if (long && d.b >= 1) {
    end = 2.5;
    t = d.cue(2, 'One eighth lands', 1.6);
  }
  const w = mix(start, end, t),
    ex = scalar(w);
  const wide = long && d.b === 0;
  const p = d.plot(
    116,
    164,
    624,
    320,
    wide ? [-1.2, 3.6] : [1.9, 3.16],
    wide ? [0, 56] : [0, 1.85],
    wide ? [-1, 0, 1, 2, 3] : [2, 2.25, 2.5, 2.75, 3],
    wide ? [0, 10, 30, 50] : [0, 0.5, 1, 1.5],
    'weight',
    'squared loss (s²)',
  );
  p.curve(derivativeLoss);
  p.point(2.5, 0, C.green, 5);
  p.point(3, 1, C.muted, 6);
  p.point(w, ex.loss, C.copper, 9);
  if (long && d.b === 3) {
    p.curve((x) => 1 + 4 * (x - 3), 2.73, 3.15, C.plum, 2);
    p.curve(() => 0, 2.27, 2.73, C.green, 3);
  }
  d.metric('Weight', fmt(w), 848, 157);
  d.metric('Prediction', fmt(ex.prediction) + ' s', 848, 277);
  d.metric('Squared loss', fmt(ex.loss) + ' s²', 848, 396, C.copper);
  if (!long && d.b === 0) d.banner('Rate 0.1 × slope 4 = ?');
  else if (!long && d.b === 3) {
    if (t === 1) d.banner('Previous step    3 − 0.1 × 4 = 2.6');
    else if (t > 0 || !d.cue(3, 'try a learning rate', 0)) d.banner('Restore the starting weight of 3.');
    else d.banner('Starting at 3 with slope 4 and rate 1, what happens to (2w − 5)²?');
  }
  else if (long && d.b === 1) d.banner('From 3 to 2.5     rate × slope 4 = 0.5     rate = ?');
  else {
    const step = 'Step from 3   =   −' + fmt(long && d.b >= 1 ? 0.125 : eta) + ' × 4';
    if (long) d.txt(step, 848, 503, 24, C.ink, 'left', 'Serif');
    else d.txt(step, 600, 110, 29, C.ink, 'center', 'Serif');
  }
}
function stability(d) {
  d.title(
    d.b < 4 ? 'Track the signed offset from the optimum' : 'Change the units on the same request',
  );
  if (d.b >= 4) {
    const rows = [
      ['Feature value', 2, 200, 'Two hundred times'],
      ['Weight', 3, 0.03, 'predicts the same'],
      ['Prediction (s)', 6, 6, 'Its gradient'],
      ['Gradient', 4, 400, 'four hundred', true],
      ['Rate must be below', 1 / 4, 1 / 40000, 'zero point zero zero zero zero two five', true],
    ];
    d.txt('In blocks', 640, 161, 29, C.blue, 'center');
    d.txt('In tokens', 949, 161, 29, C.plum, 'center');
    rows.forEach(([name, a, z, phrase, result], i) => {
      const y = 220 + i * 63;
      d.txt(name, 130, y, 24);
      d.txt(fmt(a), 640, y, 27, C.blue, 'center', 'Mono');
      const ready = result
        ? d.b > 4 || d.clock.elapsed >= d.clock.wordCue(phrase).end
        : d.cue(4, phrase, 0);
      if (ready) d.txt(fmt(z, 7), 949, y, 27, C.plum, 'center', 'Mono');
      d.line(125, y + 28, 1060, y + 28, C.grid, 1);
    });
    if (d.b > 4 || d.clock.elapsed >= d.clock.speechDuration)
      d.banner('A 100× larger feature makes the stable upper bound 10,000× smaller.');
    return;
  }
  const eta = d.b === 0 ? 0.1 : d.b === 1 && d.cue(1, 'Try point two six') === 0 ? 0.25 : 0.26;
  const t =
    d.b === 0
      ? d.cue(0, 'Each update', 3)
      : d.b === 1
        ? eta === 0.25
          ? d.cue(1, 'At one quarter', 2)
          : d.cue(1, 'Now the peaks grow', 2)
        : 1;
  const p = d.plot(
    110,
    171,
    610,
    309,
    [0, 8],
    [-1.1, 1.1],
    [0, 2, 4, 6, 8],
    [-1, -0.5, 0, 0.5, 1],
    '',
    'weight − 2.5',
  );
  d.txt('update number', p.X(8) + 18, p.Y(-1.1), 19, C.muted);
  const n = Math.floor(8 * t);
  for (let i = 0; i <= n; i++) {
    if (i) d.line(p.X(i - 1), p.Y(response(eta, i - 1)), p.X(i), p.Y(response(eta, i)), C.blue, 3);
    p.point(i, response(eta, i), C.blue, 5);
  }
  d.metric('Learning rate', fmt(eta), 824, 171);
  d.metric('Offset multiplier', fmt(1 - 8 * eta), 824, 283, C.copper);
  if (d.b >= 2) d.txt('1 − 2x²η', 824, 421, 36, C.plum, 'left', 'Mono');
  if (n === 0) return;
  if (d.b >= 3) {
    d.txt('For one fixed nonzero x, the stable range is  0 < η < 1 / x².',
      600, 110, 29, C.ink, 'center', 'Serif');
    return;
  }
  d.banner(
    eta === 0.1
      ? 'Each update keeps one fifth of the previous distance.'
      : eta === 0.25
        ? 'The offset changes sign each step. The distance stays at 0.5.'
        : 'Each update crosses the optimum and increases the distance.',
  );
}
export const slopes = [
  opening,
  squared,
  sweep,
  nudge,
  limit,
  partial,
  (d) => {
    d.title('Cross the contour');
    valley(d, true);
  },
  (d) => steps(d),
  (d) => steps(d, true),
  stability,
];

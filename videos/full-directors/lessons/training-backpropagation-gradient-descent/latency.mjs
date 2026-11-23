import {
  C,
  arrow,
  box,
  clamp,
  cue,
  dim,
  dot,
  f,
  graph,
  head,
  line,
  mix,
  mono,
  recorder,
  txt,
} from './drawing.mjs';
import {
  finiteDifference,
  updateOnce,
} from '../../../films/training-backpropagation-gradient-descent/model.mjs';

export const affine = updateOnce(0.1);
const diff = finiteDifference(0.01);
const square = (a) => a * a;
export function squarePaths(a) {
  return [a, a];
}
function opening(c, k) {
  const b = k.beat.beatIndex;
  const t =
    b === 0
      ? 2 * cue(k, 0, 'blue mark', 1.5)
      : b === 1
        ? mix(2, 5.82, k.progress)
        : mix(5.82, 6, cue(k, 2, 'Six milliseconds', 0.5));
  const arrived = cue(k, 2, "There's the token") > 0;
  head(c, 'Waiting for the next token', 'Simulated extra decode time');
  recorder(c, {
    predicted: affine.prediction,
    target: 6,
    scan: t,
    arrived,
    miss: cue(k, 2, 'For another request') > 0,
    revealPrediction: cue(k, 0, 'blue mark', 0.4) > 0,
  });
}
function squaredLoss(c, k) {
  const b = k.beat.beatIndex;
  head(c, 'Measuring the miss', 'One request    /    complexity x = 2');
  const x = 95,
    y = 245,
    unit = 64,
    side = 4 * unit;
  for (let i = 0; i <= 6; i++) {
    const u = x + i * unit;
    line(c, u, y - 8, u, y + 8, C.muted, 1.5);
    mono(c, i, u, y + 29, 16, C.muted, 'center');
  }
  line(c, x, y, x + 6 * unit, y, C.ink, 2);
  const pred = x + affine.prediction * unit,
    server = x + 6 * unit;
  dot(c, pred, y, 7, C.blue);
  dot(c, server, y, 7, C.hot);
  txt(c, 'model', pred, y - 32, 18, C.blue, 'center');
  txt(c, 'server', server, y - 32, 18, C.hot, 'center');
  if (b === 0) {
    mono(c, 'w × x + b', 610, 205, 32, C.ink);
    const calc = cue(k, 0, 'Adding zero') > 0 ? '1 × 2 + 0 = 2 ms' : '1 × 2 + 0';
    mono(c, calc, 564, 277, 28, C.blue);
  } else {
    arrow(c, server, y + 72, pred, y + 72, C.hot);
    mono(
      c,
      '2 − 6 = ' + f(affine.residual) + ' ms',
      (pred + server) / 2,
      y + 110,
      22,
      C.hot,
      'center',
    );
    const stretch = cue(k, 1, 'make a square', 1.6);
    const s = side * stretch,
      xx = 594,
      yy = 384;
    box(c, xx, yy - s, side, Math.max(0.01, s), C.light, C.muted);
    for (let i = 1; i < 4; i++) {
      line(c, xx + unit * i, yy - s, xx + unit * i, yy, C.rule);
      line(c, xx, yy - (s * i) / 4, xx + side, yy - (s * i) / 4, C.rule);
    }
    if (b === 2) {
      const h = cue(k, 2, 'Keep half', 0.8);
      box(c, xx, yy - (s * h) / 2, side, (s * h) / 2, '#a1c4b4');
      for (let i = 0; i <= 4; i++)
        line(c, xx + i * unit, yy - (s * h) / 2, xx + i * unit, yy, C.paper, 1);
      if (h > 0.99) mono(c, 'L = 8 ms²', xx + side / 2, yy - s / 4, 27, C.ink, 'center');
    }
    if (stretch > 0.99)
      mono(c, b === 1 ? '4 × 4 = 16 ms²' : '½ × 16 ms²', xx + side / 2, 423, 21, C.muted, 'center');
  }
}
function sensitivity(c, k) {
  head(c, 'A small push on the prediction', 'Half-squared loss on this request');
  const X = (v) => 85 + 54 * v,
    Y = (v) => 381 - 12 * v;
  for (const v of [0, 4, 8, 12, 16]) {
    line(c, X(0), Y(v), X(8), Y(v), C.rule, 1);
    mono(c, v, 66, Y(v), 14, C.muted, 'right');
  }
  for (const v of [0, 2, 4, 6, 8]) mono(c, v, X(v), 405, 15, C.muted, 'center');
  txt(c, 'prediction (ms)', X(4), 442, 17, C.muted, 'center');
  const loss = (v) => 0.5 * (v - 6) ** 2;
  graph(
    c,
    Array.from({ length: 81 }, (_, i) => [X(i / 10), Y(loss(i / 10))]),
    C.blue,
  );
  const h = cue(k, 0, 'Watch the point', 1.2),
    v = 2 + 0.35 * h;
  dot(c, X(2), Y(8), 6, C.paper, C.blue);
  dot(c, X(v), Y(loss(v)), 6, C.blue);
  if (k.beat.beatIndex >= 1) {
    line(c, X(0.6), Y(8 + 1.4 * 4), X(3.4), Y(8 - 1.4 * 4), C.hot, 1.8);
    mono(c, 'slope −4', X(2.5), Y(11), 19, C.hot);
  }
  txt(c, 'Equal parameter nudges', 570, 157, 25, C.ink, 'left', 'Serif');
  const grow = cue(k, 2, 'gets multiplied', 1);
  ['weight +0.01', 'bias +0.01'].forEach((s, i) => {
    const y = 217 + i * 105;
    mono(c, s, 572, y, 18);
    line(c, 574, y + 29, 865, y + 29, C.rule, 3);
    if (grow) {
      const u = 574 + grow * (i ? 115 : 230);
      arrow(c, 574, y + 29, u, y + 29, C.blue, 4);
      if (grow === 1) mono(c, i ? 'Δŷ +0.01' : 'Δŷ +0.02', 570, y + 57, 16, C.blue);
    }
  });
  if (cue(k, 2, 'A gradient measures') > 0)
    mono(c, '∂L/∂w = −8     ∂L/∂b = −4', 492, 453, 20, C.hot);
}
function reverse(c, k) {
  head(c, 'Retrace the saved computation', 'One scalar loss seeds the reverse sweep');
  const x = [113, 347, 578, 821],
    names = ['multiply', 'add bias', 'subtract 6', 'half-square'];
  const values = [2, affine.prediction, affine.residual, affine.loss];
  const p = cue(k, 0, 'compute forward', 2);
  for (let i = 0; i < 4; i++) {
    if (i < 3) arrow(c, x[i] + 48, 230, x[i + 1] - 52, 230, C.muted, 2.2);
    dot(c, x[i], 230, 45, C.light, C.muted);
    txt(c, names[i], x[i], 156, 20, C.ink, 'center');
    if (p * 4 >= i + 0.1) mono(c, f(values[i]), x[i], 231, 32, C.ink, 'center');
  }
  const back = [
    cue(k, 2, 'Multiplication looks', 1),
    cue(k, 2, 'Addition sends', 1),
    cue(k, 1, 'Subtracting', 1),
    cue(k, 1, 'half-square', 1),
  ];
  const result = [affine.residual, affine.gradBias, affine.residual, 1];
  for (let i = 3; i >= 0; i--) {
    if (i === 3 && cue(k, 1, 'Start at the scalar loss') > 0)
      mono(c, 'seed 1', x[i], 351, 21, C.hot, 'center');
    if (!back[i]) continue;
    const u = i === 0 ? x[0] - 50 : x[i - 1] + 26;
    arrow(c, x[i], 315, mix(x[i], u, back[i]), 315, C.hot, 3);
    mono(c, i === 0 ? '× x' : i === 3 ? '× e' : '× 1', x[i], 285, 16, C.hot, 'center');
    if (i < 3) mono(c, f(result[i]), x[i], 351, 23, C.hot, 'center');
  }
  if (back[1]) {
    arrow(c, x[1], 369, x[1], 401, C.hot);
    mono(c, 'bias grad ' + f(affine.gradBias), x[1], 429, 20, C.hot, 'center');
  }
  if (back[0]) {
    arrow(c, x[0], 369, x[0], 401, C.hot);
    mono(c, 'weight grad ' + f(affine.gradWeight), x[0], 429, 18, C.hot, 'center');
  }
  if (k.beat.beatIndex === 0) {
    mono(c, 'saved x = 2', 94, 392, 21, C.blue);
    if (p >= 0.75) mono(c, 'saved residual = −4', 445, 392, 21, C.blue);
  }
}
function previousPrediction(c, railY, labelY = railY + 27) {
  const x = 111 + 90 * affine.prediction;
  line(c, x, railY - 19, x, railY + 7, C.blue, 2.6, [4, 3]);
  dot(c, x, railY, 4.5, C.paper, C.blue);
  mono(c, 'Previous prediction · ' + f(affine.prediction) + ' ms', x, labelY, 15, C.blue, 'center');
}
function update(c, k) {
  const b = k.beat.beatIndex;
  head(c, 'One optimizer step', 'Both gradients belong to the same forward pass');
  if (b === 2) {
    const show = cue(k, 2, 'The server measurement') > 0;
    recorder(c, {
      predicted: affine.nextPrediction,
      revealPrediction: show,
      target: 6,
      scan: 6,
      miss: cue(k, 2, 'Loss fell from eight', 0) === 1,
    });
    previousPrediction(c, 335, 394);
    if (cue(k, 2, 'on this request') > 0)
      mono(c, 'Loss   8 → 2 ms²', 480, 473, 22, C.green, 'center');
    return;
  }
  const t = cue(k, 0, 'Both slopes', 1.2);
  [
    [1, affine.weight, 'weight', affine.gradWeight],
    [0, affine.bias, 'bias', affine.gradBias],
  ].forEach(([a, z, name, g], i) => {
    const y = 199 + i * 131;
    txt(c, name, 82, y, 26, C.ink, 'left', 'Serif');
    mono(c, 'gradient ' + f(g), 82, y + 34, 17, C.hot);
    const X = (v) => 309 + 222 * v;
    line(c, X(0), y, X(2.2), y, C.rule, 4);
    for (let j = 0; j <= 10; j++) line(c, X(j / 5), y - 6, X(j / 5), y + 6, C.muted);
    dot(c, X(a), y, 8, C.paper, C.muted);
    dot(c, X(mix(a, z, t)), y, 9, C.blue);
    mono(c, f(mix(a, z, t)), X(mix(a, z, t)), y - 27, 22, C.blue, 'center');
    if (b === 1) mono(c, i ? 'bias adds 0.4 ms' : '0.8 × 2 adds 1.6 ms', 423, y + 42, 19, C.green);
  });
  if (cue(k, 0, 'The blue mark', 0)) {
    const railY = 407;
    line(c, 111, railY, 831, railY, C.rule, 1.8);
    for (const ms of [0, 2, 4, 6, 8]) {
      const x = 111 + 90 * ms;
      line(c, x, railY, x, railY + 7, C.muted);
    }
    mono(c, '0 ms', 111, railY + 27, 14, C.muted, 'center');
    mono(c, '8 ms', 831, railY + 27, 14, C.muted, 'center');
    previousPrediction(c, railY);
  }
  mono(
    c,
    b === 1
      ? 'New forward pass  ?'
      : 'new parameter = old parameter − 0.1 × gradient',
    480,
    465,
    22,
    C.ink,
    'center',
  );
}
function finite(c, k) {
  head(c, 'Two nearby runs measure a slope', 'Bias stays at zero in both runs');
  const X = (w) => 300 + (w - 1) * 14000,
    Y = (l) => 285 - (l - 8) * 950;
  for (const l of [7.9, 8, 8.1]) {
    line(c, 70, Y(l), 535, Y(l), C.rule);
    mono(c, l, 62, Y(l), 14, C.muted, 'right');
  }
  graph(
    c,
    Array.from({ length: 61 }, (_, i) => {
      const w = 0.984 + i * 0.000533;
      return [X(w), Y(0.5 * (2 * w - 6) ** 2)];
    }),
    C.muted,
  );
  const show = cue(k, 0, 'Move the weight', 1.4);
  for (const [w, l] of [
    [1 - diff.epsilon, diff.minus],
    [1 + diff.epsilon, diff.plus],
  ]) {
    const v = mix(1, w, show);
    dot(c, X(v), Y(0.5 * (2 * v - 6) ** 2), 7, w < 1 ? C.blue : C.hot);
    if (show === 1) {
      if (w < 1) mono(c, f(l, 4), X(w), Y(l) - 26, 18, C.blue, 'center');
      else mono(c, f(l, 4), X(w) + 15, Y(l) - 24, 18, C.hot);
      mono(c, f(w), X(w), 416, 18, C.ink, 'center');
    }
  }
  txt(c, 'weight', 300, 446, 17, C.muted, 'center');
  const run = cue(k, 1, 'weight rises', 1),
    drop = cue(k, 1, 'loss drops', 1);
  const x0 = X(0.99),
    x1 = X(1.01),
    y0 = Y(diff.minus),
    y1 = Y(diff.plus);
  if (run) arrow(c, x0, y0, mix(x0, x1, run), y0, C.blue);
  if (drop) arrow(c, x1, y0, x1, mix(y0, y1, drop), C.hot);
  txt(c, 'Centered difference', 591, 183, 26, C.ink, 'left', 'Serif');
  mono(c, drop === 1 ? '−0.16' : 'L(1.01) − L(0.99)', 710, 248, 22, C.hot, 'center');
  line(c, 582, 270, 850, 270, C.ink, 2);
  mono(c, run === 1 ? '0.02' : '1.01 − 0.99', 710, 300, 22, C.blue, 'center');
  if (cue(k, 2, 'Backpropagation') > 0)
    mono(c, 'slope = ' + f(diff.numerical), 710, 375, 29, C.green, 'center');
}
function shared(c, k) {
  const b = k.beat.beatIndex,
    a = 3,
    side = 160,
    x = 105,
    y = 363;
  head(c, 'One side length, two paths', 'The same a sets both the width and the height');
  const nudge = cue(k, 0, 'Slide the corner', 1) * (1 - 0.62 * cue(k, 0, 'shrinks faster', 1.3));
  const strip = 24 * nudge;
  box(c, x, y - side, side, side, C.light, C.muted);
  for (let i = 1; i < 3; i++) {
    line(c, x + (side * i) / 3, y - side, x + (side * i) / 3, y, C.rule);
    line(c, x, y - (side * i) / 3, x + side, y - (side * i) / 3, C.rule);
  }
  box(c, x, y - side - strip, side, strip, '#d58c62');
  box(c, x + side, y - side, strip, side, '#81b5cd');
  box(c, x + side, y - side - strip, strip, strip, C.ink);
  mono(c, 'a² = ' + square(a), x + side / 2, y - side / 2, 25, C.ink, 'center');
  dim(c, x, x + side, y + 16, 'a = 3', C.muted);
  const upper = cue(k, 1, 'It contributes three', 0.7),
    lower = cue(k, 1, 'three more', 0.7);
  const paths = squarePaths(a);
  for (let i = 0; i < 2; i++) {
    const yy = 213 + i * 105;
    const color = i ? C.blue : C.hot;
    mono(c, i ? 'width slot' : 'height slot', 360, yy - 22, 18, color);
    if (strip > 0) {
      const sx = i ? x + side + strip : x + side * 0.85,
        sy = i ? y - side * 0.35 : y - side - strip;
      line(c, sx, sy, 362, yy, color, 1.5);
    }
    line(c, 362, yy, 557, yy, color, 3);
    line(c, 557, yy, 623, 265, color, 3);
    if ((i ? lower : upper) === 1) mono(c, '+' + paths[i], 490, yy - 22, 22, color);
  }
  box(c, 623, 211, 241, 111, C.dark, null, 10);
  txt(c, b >= 3 ? 'PyTorch leaf .grad' : 'a.grad', 744, 238, 19, C.white, 'center');
  const sum = paths[0] * Number(upper === 1) + paths[1] * Number(lower === 1);
  const repeat = cue(k, 3, 'This pass adds') > 0;
  mono(c, b === 4 ? 'None' : sum * (repeat ? 2 : 1), 744, 283, 38, C.mint, 'center');
  if (b === 2) txt(c, 'Fresh square, same leaf. Next total?', 482, 414, 22, C.ink);
  if (b === 3 && k.elapsed >= k.speechDuration)
    mono(c, 'resetting scalar engine    0 + 6 = 6', 455, 391, 18, C.muted);
  if (b === 4) txt(c, 'Clear once at the start of each effective batch.', 447, 396, 18, C.ink);
}
export const latencyScenes = [opening, squaredLoss, sensitivity, reverse, update, finite, shared];

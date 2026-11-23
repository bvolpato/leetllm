import assert from 'node:assert/strict';
import { riskAtRatio } from '../../../films/learning-theory/arithmetic.mjs';
import {
  P,
  axis,
  background,
  beat,
  cue,
  dot,
  heading,
  label,
  lerp,
  line,
  pin,
  rect,
} from './drawing.mjs';

const matrixI = [
    [1, 0],
    [0, 1],
  ],
  matrixCopy = [
    [1, 1],
    [0, 0],
  ];
const mul = (a, x) => a.map(([u, v]) => u * x[0] + v * x[1]);
const fmt = (v) => Number(v.toFixed(2)).toString().replace('-', '−');
const pair = (xs) => '(' + xs.map(fmt).join(', ') + ')';
function plotFrame(c, x0, y0, w, h, xRange, yRange, xTicks, yTicks, xLabel, yLabel, xLabelOffset = 91) {
  const x = (v) => x0 + (w * (v - xRange[0])) / (xRange[1] - xRange[0]);
  const y = (v) => y0 - (h * (v - yRange[0])) / (yRange[1] - yRange[0]);
  axis(c, x0, x0 + w, y0, ...xRange, xTicks, (v) => String(v), true);
  line(c, x0, y0, x0, y0 - h, P.ink, 3);
  for (const t of yTicks) {
    line(c, x0 - 8, y(t), x0 + w, y(t), P.grid, 2);
    label(c, t, x0 - 20, y(t), 28, P.ink, 'right', 'Mono');
  }
  label(c, xLabel, x0 + w * 0.55, y0 + xLabelOffset, 33, P.ink, 'center');
  label(c, yLabel, x0, y0 - h - 45, 32, P.ink);
  return { x, y };
}
function curve(c, points, color, thick = 6) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.strokeStyle = color;
  c.lineWidth = thick;
  c.stroke();
}
function gaussian(c, k) {
  const b = beat(k);
  heading(
    c,
    'What does exact training fit tell us about new inputs?',
    'Gaussian linear design    ·    signal norm² = 1    ·    noise variance = 1    ·    minimum-norm least squares',
    true,
  );
  const p = plotFrame(
    c,
    166,
    748,
    1037,
    426,
    [0, 5],
    [0, 5],
    [0, 1, 2, 3, 4, 5],
    [0, 1, 2, 3, 4, 5],
    'Parameters / samples   γ',
    'Excess squared prediction risk',
    76,
  );
  line(c, p.x(1), p.y(0), p.x(1), p.y(5), P.red, 3);
  for (const [start, stop] of [
    [0.005, 0.999],
    [1.001, 5],
  ]) {
    const pts = [];
    for (let j = 0; j <= 600; j++) {
      const g = lerp(start, stop, j / 600),
        r = riskAtRatio(g);
      if (r <= 5) pts.push([p.x(g), p.y(r)]);
    }
    curve(c, pts, P.teal);
  }
  const g =
    b === 1
      ? lerp(1.35, 4.3, cue(k, 1, 'yet the squared', 3))
      : b < 4
        ? 0.5
        : b >= 6
          ? lerp(2, 5, cue(k, 6, 'Far to the right', 2.8))
          : 2;
  pin(c, p.x(g), p.y(riskAtRatio(g)), P.gold, 14);
  if (b <= 2) {
    if (b === 1) {
      label(c, 'Training predictions', 1300, 337, 43, P.ink, 'left', 'Serif');
      const targets = [1, 2, 1, 3];
      targets.forEach((target, i) => {
        const x = 1348 + i * 124,
          y = 585 - 47 * target;
        line(c, x, 413, x, 605, P.grid, 3);
        dot(c, x, y, 15, P.ink);
        dot(c, x, y, 11, P.paper);
        if (cue(k, 1, 'each training prediction', 0.6) === 1) dot(c, x, y, 7, P.teal);
      });
      label(c, 'Ring = target    Dot = fit', 1300, 665, 32, P.teal);
      if (cue(k, 1, 'yet the squared', 0.1)) label(c, 'Every residual = 0', 1300, 750, 40, P.ink);
    } else {
      label(c, 'Double descent', 1300, 337, 43, P.ink, 'left', 'Serif');
      label(c, 'Schematic test error', 1300, 421, 32, P.ink);
      const pts = [
        [1333, 515],
        [1390, 582],
        [1450, 608],
        [1510, 594],
        [1605, 455],
        [1660, 564],
        [1767, 608],
      ];
      curve(c, pts, P.brass);
      label(c, 'First fall', 1314, 665, 32, P.brass);
      label(c, 'Second fall', 1630, 665, 32, P.brass);
    }
  } else {
    label(c, g < 1 ? 'γ below 1' : 'γ above 1', 1322, 316, 51, P.teal, 'left', 'Serif');
    label(c, g < 1 ? 'γ / (1 − γ)' : '1 − 1/γ + 1/(γ − 1)', 1322, 417, 38, P.ink);
    if (b === 4 || b === 5) {
      const bias = 1 - 1 / g,
        variance = 1 / (g - 1);
      const parts = [
        ['Squared bias', bias, P.teal],
        ['Variance', variance, P.brass],
      ];
      if (b === 5) parts.push(['New response noise', 1, P.red]);
      parts.forEach(([name, v, col], i) => {
        const y = 501 + i * 84;
        label(c, name, 1311, y, 30, P.ink);
        label(c, v.toFixed(1), 1793, y, 35, col, 'right', 'Mono');
        rect(c, 1313, y + 28, (460 * v) / 2, 10, col);
      });
      label(
        c,
        (b === 5 ? 'Noisy MSE   ' : 'Excess risk   ') +
          (bias + variance + Number(b === 5)).toFixed(1),
        1311,
        820,
        43,
        P.teal,
      );
    } else if (b >= 6) {
      label(c, 'As γ increases', 1315, 548, 38, P.ink);
      label(c, 'risk → 1', 1315, 640, 63, P.teal, 'left', 'Serif');
      label(c, 'Zero predictor’s excess risk', 1315, 733, 32, P.ink);
      if (b === 7) label(c, 'Optimal excess risk = 0', 1315, 814, 34, P.green);
    }
  }
}
function matrix(c, x, y, a) {
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) {
      rect(c, x + 90 * j, y + 80 * i, 77, 70, a[i][j] ? '#d4e3d8' : '#fff8e8', 6);
      label(c, a[i][j], x + 90 * j + 38, y + 80 * i + 37, 44, P.ink, 'center', 'Mono');
    }
}
export function interpolation(c, k) {
  background(c, 'paper');
  const b = beat(k);
  if (b <= 7) {
    gaussian(c, k);
    return;
  }
  heading(
    c,
    'Which square design can hide a weight change?',
    'Two samples, two coefficients    /    compare the same update in both designs',
    true,
  );
  const t = cue(k, 9, 'Add one', 2);
  const weights = [1 + t, -t];
  [matrixI, matrixCopy].forEach((a, i) => {
    const x = 145 + i * 904;
    label(c, i ? 'Repeated column' : 'Identity', x, 327, 49, P.teal, 'left', 'Serif');
    matrix(c, x, 417, a);
    label(c, '×', x + 217, 493, 43, P.ink, 'center');
    label(c, pair(weights), x + 285, 493, 43, P.ink, 'left', 'Mono');
    label(c, 'Starting prediction    ' + pair(mul(a, [1, 0])), x, 660, 38, P.ink);
    if (t > 0)
      label(c, 'Current prediction    ' + pair(mul(a, weights)), x, 744, 38, i ? P.green : P.red);
    if (b >= 10)
      label(
        c,
        i ? 'Rank 1   ·   null direction (1, −1)' : 'Rank 2   ·   condition number 1',
        x,
        810,
        36,
        P.teal,
      );
  });
}

const training = [1, 2],
  probe = [1, 0];
const runs = [
  { name: 'Zero start', start: [0, 0], diagonal: [1, 1], color: P.teal },
  { name: 'Null-space start', start: [-2, 1], diagonal: [1, 1], color: P.red },
  { name: 'Scaled update', start: [0, 0], diagonal: [1, 4], color: P.brass },
];
const product = (a, b) => a[0] * b[0] + a[1] * b[1];
function solution(run) {
  const direction = training.map((v, i) => v * run.diagonal[i]);
  const step = (1 - product(run.start, training)) / product(direction, training);
  return run.start.map((v, i) => v + step * direction[i]);
}
const namesW = (v, i) => (i === 2 ? '(1/17, 8/17)' : pair(v));
export function optimizer(c, k) {
  background(c, 'paper');
  const b = beat(k);
  if (b <= 2 || b === 5) {
    heading(
      c,
      'Many weights fit one row',
      'Training input (1, 2)    /    target 1    /    every point on the line fits exactly',
      true,
    );
    const p = plotFrame(
      c,
      184,
      752,
      800,
      495,
      [-2.4, 0.8],
      [-0.3, 1.8],
      [-2, -1, 0],
      [0, 0.5, 1, 1.5],
      'First weight',
      'Second weight',
      73,
    );
    line(c, p.x(-2.4), p.y(1.7), p.x(0.8), p.y(0.1), P.ink, 5);
    const ts = [
      cue(k, 1, 'follows the row direction', 2),
      cue(k, 2, 'Ordinary descent retains', 2),
      cue(k, 2, 'Change to a diagonal', 2),
    ];
    runs.forEach((run, i) => {
      if (!ts[i]) return;
      const w = solution(run),
        v = run.start.map((s, j) => lerp(s, w[j], ts[i]));
      line(c, p.x(run.start[0]), p.y(run.start[1]), p.x(v[0]), p.y(v[1]), run.color, 7);
      dot(c, p.x(run.start[0]), p.y(run.start[1]), 7, run.color);
      dot(c, p.x(v[0]), p.y(v[1]), 10, run.color);
      label(c, run.name, 1244, 345 + 164 * i, 39, run.color, 'left', 'Serif');
      label(
        c,
        ts[i] === 1 ? namesW(w, i) : pair(v),
        1244,
        410 + 164 * i,
        38,
        P.ink,
        'left',
        'Mono',
      );
    });
    if (b === 5) label(c, 'Every ordinary update follows (1, 2).', 1244, 815, 36, P.teal);
  } else {
    heading(
      c,
      'Use the three fits on a fresh input',
      'Hold the weights fixed. Change the second input from 2 to 0.',
      true,
    );
    const newShown = cue(k, 4, 'All three solutions', 0.15) === 1;
    ['Update rule', 'Weights', 'Train (1, 2)', 'New (1, 0)'].forEach((s, j) =>
      label(c, s, [120, 670, 1180, 1630][j], 330, 37, P.teal, j ? 'center' : 'left'),
    );
    runs.forEach((run, i) => {
      const w = solution(run),
        y = 465 + i * 147;
      line(c, 120, y + 68, 1790, y + 68, P.grid, 3);
      label(c, run.name, 120, y, 47, run.color, 'left', 'Serif');
      label(c, namesW(w, i), 670, y, 45, P.ink, 'center', 'Mono');
      label(c, product(w, training).toFixed(0), 1180, y, 47, P.ink, 'center', 'Mono');
      label(
        c,
        newShown ? (i === 2 ? '1/17' : fmt(product(w, probe))) : '?',
        1630,
        y,
        49,
        newShown ? run.color : P.brass,
        'center',
        'Mono',
      );
    });
    label(
      c,
      'Prediction  =  first input × first weight  +  second input × second weight',
      960,
      242,
      36,
      P.ink,
      'center',
    );
  }
}
export function checkInterpolation() {
  assert.equal(riskAtRatio(0.5), 1);
  assert.equal(riskAtRatio(2), 1.5);
  assert.equal(riskAtRatio(2) + 1, 2.5);
  assert.ok(riskAtRatio(5) > 1 && riskAtRatio(5) < riskAtRatio(2));
  assert.deepEqual(mul(matrixCopy, [1, -1]), [0, 0]);
  assert.deepEqual(mul(matrixI, [1, -1]), [1, -1]);
  assert.deepEqual(mul(matrixCopy, [1, 0]), mul(matrixCopy, [2, -1]));
  assert.deepEqual(mul(matrixI, [2, -1]), [2, -1]);
  const expected = [
    [0.2, 0.4],
    [-1.8, 1.4],
    [1 / 17, 8 / 17],
  ];
  runs.forEach((run, i) => {
    const w = solution(run);
    w.forEach((v, j) => assert.ok(Math.abs(v - expected[i][j]) < 1e-10));
    assert.ok(Math.abs(product(w, training) - 1) < 1e-10);
    assert.equal(product(w, probe), w[0]);
  });
}

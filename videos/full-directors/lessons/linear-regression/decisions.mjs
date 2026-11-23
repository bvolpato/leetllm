import {
  data,
  fitted,
  predict,
  rowsFor,
  bendInput,
  bendPredict,
  penalize,
  lassoLine,
  meanX,
  meanY,
  average,
  total,
  interval,
  halfWidth,
  broadcast,
  residualShift,
  sum,
  interceptEstimatorState,
  replays,
  lineAt,
} from './replay.mjs';
import {
  C,
  frame,
  screen,
  text,
  mono,
  serif,
  line,
  poly,
  dot,
  rect,
  pulse,
  square,
  axisPlot,
  trace,
  scale,
  readout,
  fmt,
  signed,
  mix,
  cue,
} from './marks.mjs';

export function bend(g, c) {
  const i = c.beat.beatIndex;
  const ridgeStrength = i === 3 ? 2.8 * cue(c, 'Half the correction', 1.3) : 2.8;
  const bendPower = average(data.map((r) => bendInput(r.x) ** 2));
  const lassoMix = i === 4 ? cue(c, 'Increase that charge', 1.5) : 0;
  const weight =
    i === 0
      ? 0
      : i === 1
        ? -cue(c, 'Turn its weight', 1.7)
        : i === 2
          ? -1
          : i === 3
            ? -bendPower / (bendPower + ridgeStrength)
            : i === 4
              ? -0.5 * (1 - lassoMix)
              : 0;
  const fn = (x) => bendPredict(x, weight),
    rows = rowsFor(fn);
  frame(
    g,
    'Can the fitted trace reach every pulse?',
    'Feature experiment  /  the five replies stay fixed',
  );
  screen(g, 80, 244, 1120, 676);
  const compareOffsets = i >= 2 && i <= 4;
  if (!compareOffsets) {
    const p = axisPlot(g, {
      left: 209,
      right: 1117,
      top: 334,
      bottom: 544,
      xd: [1, 6],
      xt: [],
      yd: [108, 227],
      yt: [120, 160, 200],
      yName: 'Reply time  (ms)',
      xName: '',
    });
    trace(g, p, (x) => predict(x), C.cyan, 3);
    trace(g, p, fn, weight === 0 ? C.cyan : C.lilac, 5);
    data.forEach((r) => dot(g, p.X(r.x), p.Y(r.y), 9, null, C.gold, 4));
    if (i >= 2) dot(g, p.X(6), p.Y(fn(6)), 10, null, C.lilac, 4);
  }
  const q = axisPlot(g, {
    left: 209,
    right: 1117,
    top: compareOffsets ? 375 : 651,
    bottom: 768,
    xd: [1, 6],
    xt: [1, 2, 3, 4, 5, 6],
    yd: [-8, 3],
    yt: compareOffsets ? [-7, -4, -2, 0, 2] : [-7, -2, 0, 2],
    yName: compareOffsets
      ? 'Offset from the straight line  (ms)'
      : 'Enlarged offset from the straight line  (ms)',
    xName: 'Context  (100 tokens)',
  });
  trace(g, q, () => 0, C.cyan, 3);
  trace(g, q, (x) => weight * bendInput(x), C.lilac, 5);
  rows.forEach((r, j) => {
    const x = q.X(r.x),
      actual = q.Y(fitted[j].miss),
      adj = q.Y(r.fit - fitted[j].fit);
    line(g, x, actual, x, adj, C.gold, 5);
    dot(g, x, actual, 10, null, C.gold, 4);
    dot(g, x, adj, 4, C.lilac);
    if (compareOffsets && r.x === 3) {
      mono(g, `300 tokens  ·  measured ${signed(fitted[j].miss)}`, x, actual - 44, 30, C.gold, 'center');
      if (i >= 3 && weight >= -0.5)
        mono(g, `fit ${signed(r.fit - fitted[j].fit, 1)}`, x, adj + 48, 30, C.lilac, 'center');
    }
  });
  if (i >= 2) {
    dot(g, q.X(6), q.Y(fn(6) - predict(6)), 8, C.lilac);
  }
  if (i === 0) {
    readout(g, 'At 300 tokens', '162 − 160', 1264, 388, C.ink, 53);
    mono(g, '= +2 ms', 1264, 556, 59, C.ochre);
    text(g, 'Correction needed', 1264, 635, 31, C.subtle);
  } else {
    text(g, 'Extra input', 1264, 318, 32, C.subtle);
    mono(g, 'z = (x − 3)² − 2', 1264, 381, 43, C.ink);
    if (i > 1 || cue(c, 'The five new inputs'))
      mono(g, '[ 2, −1, −2, −1, 2 ]', 1264, 446, 33, C.subtle);
    readout(g, 'Bend weight  c', fmt(weight, 2), 1264, 532, C.plum, 58);
  }
  if (i >= 2) {
    readout(g, 'Forecast at 600 tokens', `${fmt(fn(6))} ms`, 1264, 704, C.plum, 59);
    if (i === 2) mono(g, '220 + c × 7', 1264, 813, 32, C.subtle);
  }
  const foot =
    i === 0
      ? 'Gold rings record the measured replies.'
      : i === 1
        ? 'ŷ = 100 + 20x + c × z'
        : i === 2
          ? 'Each coefficient multiplies one input.'
          : i === 3
            ? `Ridge     MSE + ${fmt(ridgeStrength, 2)}c²`
            : i === 4 && cue(c, 'A Lasso penalty') > 0
              ? `Lasso     MSE + ${fmt(bendPower * (1 + lassoMix), 2)}|c|`
              : i === 4
                ? 'Ridge     MSE + 2.8c²'
                : 'Frozen for replay   ·   c = 0 and c = −1';
  text(g, foot, 91, 221, 38, C.ink);
  mono(
    g,
    `Training MSE   ${fmt(total(rows) / rows.length, 2)} ms²`,
    1818,
    221,
    34,
    C.teal,
    'right',
  );
}
function ridgeDirection(g, c) {
  frame(g, 'Can a change hide from both terms?', 'Ridge curvature  /  duplicate inputs x and 2x');
  screen(g, 80, 250, 1760, 657);
  const intercept = cue(c, 'Move it alone') > 0;
  const v = intercept ? [1, 0, 0] : [0, 2, -1];
  text(g, 'Direction in (b, m₁, m₂)', 145, 333, 34, C.soft);
  mono(g, '[ ' + v.map((n) => fmt(n)).join(' ,   ') + ' ]', 145, 420, 51, C.white);
  text(g, 'Change in fitted time at each training length', 145, 535, 34, C.soft);
  const changes = data.map((r) => v[0] + v[1] * r.x + v[2] * 2 * r.x);
  mono(g, '[' + changes.map((n) => signed(n)).join(', ') + '] ms', 145, 623, 46, C.gold);
  mono(g, intercept ? '1 + 0x + 0(2x)' : '0 + 2x − 1(2x)', 145, 783, 40, C.soft);
  line(g, 1045, 340, 1045, 820, C.grid, 2);
  const penalty = 2 * (v[1] ** 2 + v[2] ** 2);
  text(g, 'Data term   mean((Xv)²)', 1113, 360, 34, C.soft);
  mono(g, fmt(average(changes.map((n) => n * n))), 1113, 442, 57, C.gold);
  text(g, 'Penalty term   2(v₁² + v₂²)', 1113, 556, 34, C.soft);
  mono(g, fmt(penalty), 1113, 640, 57, C.lilac);
}
export function penalty(g, c) {
  if (c.beat.id === 'c10-b03') {
    ridgeDirection(g, c);
    return;
  }
  const i = c.beat.beatIndex,
    lasso = i >= 5;
  const strength = lasso
    ? i === 5
      ? 80 * cue(c, 'as we raise', 1.6)
      : 80
    : i === 0
      ? 2 * cue(c, 'Raise the Ridge strength', 1.6)
      : 2;
  const intStrength =
    lasso || i < 3 ? 0 : i === 3 ? 2 * cue(c, 'Now charge the intercept', 1.7) : 2;
  const weights = lasso ? lassoLine(strength) : penalize(strength, intStrength),
    fn = lineAt(weights.intercept, weights.slope);
  frame(
    g,
    lasso ? 'When can the slope stay at zero?' : 'Does the fit still pass through the mean?',
    lasso ? 'Lasso  /  charge the absolute slope' : 'Ridge  /  select the penalized coefficients',
  );
  screen(g, 80, 250, 1115, 660);
  const p = axisPlot(g, {
    left: 212,
    right: 1100,
    top: 353,
    bottom: 776,
    xd: [0, 5],
    xt: [0, 1, 2, 3, 4, 5],
    yd: [0, 230],
    yt: [0, 50, 100, 150, 200],
    xNameOffset: 50,
  });
  trace(g, p, (x) => predict(x), '#578485', 3);
  trace(g, p, fn, lasso ? C.lilac : C.cyan, 6);
  for (const r of data) dot(g, p.X(r.x), p.Y(r.y), 7, C.gold);
  const x = p.X(meanX),
    yy = p.Y(meanY),
    actual = p.Y(fn(meanX));
  line(g, x, yy, x, actual, C.green, 5);
  dot(g, x, yy, 14, null, C.green, 4);
  dot(g, x, actual, 6, lasso ? C.lilac : C.cyan);
  poly(
    g,
    [
      [x, yy - 15],
      [x, yy - 78],
      [x - 44, yy - 78],
    ],
    C.green,
    2,
  );
  text(g, 'Mean (3, 160)', x - 53, yy - 78, 27, C.green, 'right');
  text(g, lasso ? 'Lasso charges' : 'Ridge charges', 1255, 318, 34, C.subtle);
  mono(
    g,
    lasso ? `${fmt(strength, 1)} |m|` : `${fmt(strength, 1)}m² + ${fmt(intStrength, 1)}b²`,
    1255,
    387,
    46,
    lasso ? C.plum : C.teal,
  );
  readout(g, 'Fitted slope   m', fmt(weights.slope, 2), 1255, 495, C.ink, 47);
  readout(g, 'Fitted intercept   b', fmt(weights.intercept, 2) + ' ms', 1255, 650, C.ink, 47);
  mono(g, `Mean forecast   ${fmt(fn(meanX), 2)} ms`, 1255, 826, 32, C.subtle);
  if (i === 1 || i === 2 || i === 3)
    mono(
      g,
      `Gram diagonal addition   [ ${fmt(intStrength * 5)}, ${fmt(strength * 5)} ]`,
      1255,
      444,
      30,
      C.teal,
    );
  if (i === 4)
    mono(g, 'All coordinates   ·   XᵀX + 10I   ·   every eigenvalue gains 10', 91, 221, 37, C.ink);
  if (i === 5 && weights.slope === 0)
    mono(g, 'At zero slope     smooth derivative = −80', 91, 221, 39, C.ink);
  if (i === 6) mono(g, 'Penalty slopes [−80, +80]     ·     −80 + 80 = 0', 91, 221, 39, C.ink);
  if (i === 7)
    text(g, 'Use training-set scaling and the same loss normalization.', 91, 221, 39, C.ink);
}

function distribution(g, c, i) {
  const t = i === 0 ? 0 : i === 1 ? cue(c, 'different weights', 1.7) : 1,
    m = interceptEstimatorState(t);
  frame(
    g,
    'Repeat the five fair timing errors',
    'Sampling experiment  /  all 32 equally likely sets of replies',
  );
  screen(g, 80, 250, 1760, 653);
  const X = scale(97, 103, 532, 1554);
  for (let v = 97; v <= 103; v++) {
    line(g, X(v), 350, X(v), 784, v === 100 ? C.gold : C.grid, v === 100 ? 3 : 1.5);
    mono(g, v, X(v), 821, 28, C.soft, 'center');
  }
  text(g, 'Estimated intercept  (ms)', 542, 311, 31, C.white);
  for (const [j, values, label, col, variance] of [
    [0, m.olsEstimates, 'Least squares', C.cyan, m.olsVariance],
    [1, m.otherEstimates, 'Second rule', C.lilac, m.otherVariance],
  ]) {
    const y = 538 + j * 223;
    text(g, label, 138, y - 49, 38, col);
    mono(g, `Var ${fmt(variance, 2)} ms²`, 138, y + 8, 32, C.soft);
    line(g, X(97), y + 13, X(103), y + 13, C.grid, 2);
    const stacks = new Map();
    for (const v of [...values].sort((a, b) => a - b)) {
      const k = Math.round(v * 1e6),
        n = stacks.get(k) || 0;
      stacks.set(k, n + 1);
      dot(g, X(v), y - n * 22, 9, col);
    }
  }
  text(
    g,
    i === 3
      ? 'These two-point errors come from fair coins.'
      : 'Each dot is one intercept estimate from five replies.',
    91,
    221,
    39,
    C.ink,
  );
}
function constraints(g, c) {
  frame(
    g,
    'Change three replies. Keep the fitted line.',
    'Fitted residuals  /  two shared constraints',
  );
  screen(g, 80, 250, 1080, 650);
  const p = axisPlot(g, {
    left: 212,
    right: 1070,
    top: 366,
    bottom: 755,
    xd: [1, 5],
    xt: [1, 2, 3, 4, 5],
    yd: [-4, 4],
    yt: [-4, -2, 0, 2, 4],
    yName: 'Fitted residual  (ms)',
  });
  const t = c.beat.beatIndex === 3 ? cue(c, 'Change the first three', 1.5) : 1,
    vals = residualShift(t);
  trace(g, p, () => 0, C.cyan, 3);
  vals.forEach((v, j) => {
    line(g, p.X(j + 1), p.Y(fitted[j].miss), p.X(j + 1), p.Y(v), C.gold, 5);
    dot(g, p.X(j + 1), p.Y(fitted[j].miss), 11, null, C.soft);
    dot(g, p.X(j + 1), p.Y(v), 8, C.gold);
  });
  readout(g, 'Sum of residuals', `Σe = ${fmt(sum(vals))}`, 1240, 382);
  readout(
    g,
    'Length-weighted sum',
    `Σxe = ${fmt(sum(vals.map((v, j) => v * data[j].x)))}`,
    1240,
    574,
  );
  mono(g, 'ŷ = 100 + 20x', 1240, 801, 47, C.ink);
}
function loadExample(g, c) {
  frame(g, 'Separate context length from server load', 'Traffic diagnosis  /  a controlled replay');
  screen(g, 80, 250, 1760, 650);
  text(g, 'Illustrative request order', 151, 333, 34, C.white);
  const cols = [190, 480, 770, 1060, 1350, 1640],
    loads = [1, 1, 2, 4, 4, 5],
    lens = [1, 2, 2, 4, 5, 5];
  text(g, 'Concurrent work', 152, 430, 31, C.soft);
  for (let j = 0; j < cols.length; j++) {
    const x = cols[j];
    for (let k = 0; k < loads[j]; k++) rect(g, x + k * 24, 526 - 46, 17, 46, C.lilac, 4);
    for (let k = 0; k < lens[j]; k++) rect(g, x + k * 24, 716 - 46, 17, 46, C.gold, 4);
    mono(g, `${lens[j] * 100}`, x + 30, 771, 30, C.gold, 'center');
  }
  text(g, 'Context tokens', 152, 613, 31, C.soft);
  if (cue(c, 'collecting more'))
    text(
      g,
      'Replay different lengths at the same load to isolate the effect of length.',
      94,
      221,
      38,
      C.ink,
    );
}
function intervals(g, c, i) {
  frame(
    g,
    'One mean or one future reply?',
    'Uncertainty at 600 tokens  /  classical 95% intervals',
  );
  screen(g, 80, 250, 1760, 646);
  const X = scale(207, 233, 555, 1692);
  for (let v = 208; v <= 232; v += 2) {
    line(g, X(v), 383, X(v), 783, v === 220 ? C.soft : C.grid, 2);
    mono(g, v, X(v), 829, 26, C.soft, 'center');
  }
  text(g, 'Latency  (ms)', 555, 331, 32, C.white);
  const showMean = i >= 7,
    extra = i === 8 ? 1 : i === 7 ? cue(c, 'Add the variation', 1.5) : 0;
  for (const [j, label, col, half] of [
    [0, 'Mean response', C.green, halfWidth()],
    [
      1,
      extra === 1 || i === 6
        ? 'Individual reply'
        : extra === 0
          ? 'Mean uncertainty'
          : 'Adding reply noise',
      C.lilac,
      halfWidth(extra),
    ],
  ]) {
    const y = 474 + j * 198;
    text(g, label, 143, y, 40, col);
    const lo = interval.center - half,
      hi = interval.center + half;
    if (showMean) {
      line(g, X(lo), y, X(hi), y, col, 11);
      for (const n of [lo, hi]) {
        line(g, X(n), y - 21, X(n), y + 21, col, 4);
        mono(g, fmt(n, 1), X(n), y - 53, 30, col, 'center');
      }
    }
    dot(g, X(interval.center), y, 10, C.white);
  }
  text(
    g,
    'Assume a straight mean and independent Gaussian errors of equal variance.',
    94,
    221,
    37,
    C.ink,
  );
}
function pairs(g, c) {
  const fixed = c.beat.beatIndex === 10 && cue(c, 'Flatten the target', 0.7) === 1;
  frame(
    g,
    fixed ? 'Only matched requests enter the loss' : 'Which request is being graded?',
    'Array shapes  /  observed minus predicted',
  );
  screen(g, 80, 251, 1140, 651);
  text(g, 'Target', 143, 341, 30, C.soft);
  text(g, fixed ? 'Matched prediction and residual' : 'Prediction  (ms)', 425, 341, 31, C.soft);
  fitted.forEach((r, j) => {
    if (!fixed) mono(g, r.fit, 447 + j * 157, 414, 33, C.cyan, 'center');
  });
  data.forEach((r, i) => {
    const y = 480 + i * 77;
    mono(g, r.y, 174, y, 37, C.gold);
    if (fixed) {
      mono(g, `${r.y} − ${fitted[i].fit}  =  ${signed(broadcast[i][i])} ms`, 425, y, 36, C.white);
    } else
      broadcast[i].forEach((e, j) => {
        const x = 447 + j * 157;
        rect(g, x - 58, y - 29, 116, 58, i === j ? '#305b52' : '#234246', 7);
        mono(g, signed(e), x, y, 30, i === j ? C.green : C.soft, 'center');
      });
  });
  readout(g, 'Target shape', fixed ? '(5,)' : '(5, 1)', 1290, 352);
  readout(g, 'Prediction shape', '(5,)', 1290, 510);
  readout(
    g,
    'Differences',
    fixed ? '5 matched' : '5 × 5 = 25',
    1290,
    668,
    fixed ? C.teal : C.plum,
    48,
  );
  if (fixed) mono(g, 'MSE = 14 / 5 = 2.8 ms²', 110, 221, 41, C.teal);
}
export function statistics(g, c) {
  const i = c.beat.beatIndex;
  if (i < 3 || (i === 3 && cue(c, 'Now look at the fitted residuals') === 0)) distribution(g, c, i);
  else if (i <= 4) constraints(g, c);
  else if (i === 5) loadExample(g, c);
  else if (i <= 8) intervals(g, c, i);
  else pairs(g, c);
}

function support(g, c) {
  frame(g, 'Would you quote a time for 5,000 tokens?', 'Deployment boundary  /  context length');
  screen(g, 80, 254, 1760, 638);
  const X = scale(0, 5000, 165, 1730),
    y = 602;
  text(g, 'Retrieved context  (tokens)', 143, 335, 35, C.white);
  rect(g, X(100), y - 25, X(500) - X(100), 50, '#396263', 6);
  line(g, X(0), y, X(5000), y, C.soft, 3);
  for (let n = 0; n <= 5000; n += 100) {
    const major = n % 1000 === 0;
    line(g, X(n), y + 5, X(n), y + (major ? 25 : 12), C.soft, major ? 3 : 1.5);
    if (major) mono(g, n.toLocaleString('en-US'), X(n), y + 67, 30, C.white, 'center');
  }
  data.forEach((r) => dot(g, X(r.x * 100), y, 8, C.cyan));
  poly(
    g,
    [
      [X(300), y - 34],
      [X(300), 475],
      [X(300) + 46, 475],
    ],
    C.cyan,
    3,
  );
  text(g, 'Five fitted lengths', X(300) + 63, 475, 34, C.cyan);
  const a = X(600);
  dot(g, a, y, 12, null, C.gold, 3);
  poly(
    g,
    [
      [a, y + 24],
      [a, 770],
      [a + 62, 770],
    ],
    C.gold,
    3,
  );
  text(g, 'Two validation replays at 600', a + 76, 770, 33, C.gold);
  pulse(g, X(5000), y, C.lilac, 1.15);
  text(g, 'New request', X(5000), 496, 35, C.lilac, 'right');
  if (cue(c, 'Time requests at five thousand'))
    serif(g, 'Measure this length under realistic load.', 90, 983, 49, C.ink);
}
export function heldout(g, c) {
  const i = c.beat.beatIndex;
  if (i === 6) {
    support(g, c);
    return;
  }
  const all = replays(2),
    linePred = all[0].line.fit,
    curvePred = all[0].curve.fit;
  const linePlaced = i > 1 || (i === 1 && cue(c, 'two hundred twenty', 0) === 1);
  const curvePlaced = i > 1 || (i === 1 && cue(c, 'two hundred thirteen', 0) === 1);
  const first = i > 2 || (i === 2 && cue(c, 'two hundred nineteen', 0.38) > 0);
  const second = i > 3 || (i === 3 && cue(c, 'two hundred fourteen', 0.38) > 0);
  const showAreas = i >= 4 && (i > 4 || cue(c, 'Square each signed miss', 0.6) > 0);
  const tie = i === 5 && cue(c, 'eighteen and a half', 0.5) > 0;
  frame(
    g,
    i === 0
      ? 'Where do the forecasts land?'
      : showAreas
        ? 'Give each replay one vote'
        : 'Keep the forecasts fixed',
    'Held-out timing  /  600 tokens',
  );
  screen(g, 80, 253, 1760, showAreas ? 395 : 608);
  const X = scale(210, 223, 510, 1730),
    axisY = showAreas ? 436 : 484;
  for (let n = 210; n <= 223; n++) {
    const xx = X(n);
    line(
      g,
      xx,
      axisY - 21,
      xx,
      showAreas ? 601 : 771,
      (linePlaced && n === linePred) || (curvePlaced && n === curvePred) ? C.soft : C.grid,
      1.5,
    );
    mono(g, n, xx, axisY - 48, 27, C.soft, 'center');
  }
  text(g, 'Reply time  (ms)', 143, axisY - 46, 35, C.white);
  for (const [v, label, col, placed] of [
    [linePred, 'Line', C.cyan, linePlaced],
    [curvePred, 'Curve', C.lilac, curvePlaced],
  ]) {
    if (!placed) continue;
    line(g, X(v), axisY - 12, X(v), showAreas ? 601 : 771, col, 4, [6, 7]);
    mono(g, `${label}   ${v} ms`, X(v), axisY - 108, 33, col, 'center');
  }
  const rows = replays(Number(first) + Number(second));
  if (first && !showAreas) text(g, 'Miss = reply − forecast', 143, 326, 28, C.soft);
  for (let j = 0; j < 2; j++) {
    const yy = axisY + (showAreas ? 51 + j * 95 : 85 + j * 160);
    const row = rows[j];
    text(g, 'Replay ' + (j + 1), 143, yy, 36, C.white);
    line(g, X(210), yy, X(223), yy, C.grid, 2);
    if (row) {
      pulse(g, X(row.y), yy, C.gold, 0.92);
      mono(g, `${row.y}`, X(row.y) + 26, yy - 18, 32, C.gold);
    } else text(g, 'Sealed', 344, yy, 26, C.soft);
    if (!showAreas && row && ((j === 0 && i >= 2) || (j === 1 && i >= 4))) {
      if (j === 0 && i === 2 && !cue(c, 'Read the distance')) continue;
      line(g, X(row.curve.fit), yy + 28, X(row.y), yy + 28, C.lilac, 4);
      line(g, X(row.y), yy + 28, X(row.line.fit), yy + 28, C.cyan, 4);
      mono(
        g,
        `${signed(row.curve.miss)} ms`,
        (X(row.curve.fit) + X(row.y)) / 2,
        yy + 59,
        26,
        C.lilac,
        'center',
      );
      mono(
        g,
        `${signed(row.line.miss)} ms`,
        (X(row.line.fit) + X(row.y)) / 2,
        yy + 59,
        26,
        C.cyan,
        'center',
      );
    }
  }
  if (!showAreas) {
    const lineWon = i >= 2 && (i > 2 || cue(c, 'The line came closer') > 0);
    const curveWon = i === 4 && cue(c, 'The curve is closer') > 0;
    if (i === 0 || (i === 1 && !curvePlaced)) mono(g, 'Line   200 + 20', 143, 811, 38, C.cyan);
    if ((i === 0 && cue(c, 'The full curve')) || (i === 1 && !curvePlaced))
      mono(g, 'Curve   198 + 15', 1765, 811, 38, C.lilac, 'right');
    if (i === 1 && curvePlaced)
      text(g, 'Both forecasts use only the five training replies.', 143, 811, 40, C.white);
    if (i === 2 && lineWon) serif(g, 'The line wins the first replay.', 143, 811, 42, C.cyan);
    if (i === 3 && second)
      serif(g, 'Which mark is closer to the second pulse?', 143, 811, 42, C.white);
    if (curveWon) serif(g, 'The curve wins the second replay.', 143, 811, 42, C.lilac);
    return;
  }
  for (const [j, key, col, pale] of [
    [0, 'line', C.teal, '#91d5d1'],
    [1, 'curve', C.plum, '#dcbce6'],
  ]) {
    const xx = 105 + j * 923;
    serif(g, key === 'line' ? 'Line' : 'Curve', xx, 690, 46, col);
    rows.forEach((r, k) => {
      const x = xx + 229 + k * 217,
        y = 762,
        side = Math.abs(r[key].miss);
      square(g, x, y, side, 18, pale, col);
      mono(g, `R${k + 1}   ${r[key].area} ms²`, x, y + 29, 30, col, 'center');
    });
    if (tie)
      mono(
        g,
        `(${rows[0][key].area} + ${rows[1][key].area}) / 2 = ${fmt(average(rows.map((r) => r[key].area)))} ms²`,
        xx,
        815,
        37,
        col,
      );
  }
}

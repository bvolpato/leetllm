import {
  ink,
  muted,
  brass,
  blue,
  teal,
  rust,
  paper,
  grid,
  num,
  vector,
  cue,
  text,
  mono,
  plotNumber,
  rect,
  line,
  path,
  circle,
  arrow,
  title,
  socket,
  row,
} from './instrument.mjs';
import {
  x,
  start,
  point,
  direction,
  mean,
  ln,
  rms,
  div,
  rootMeanSquare,
  secondMoment,
  offset,
  placementTrace,
  probe,
  backward,
  timeCost,
} from './experiments.mjs';

const blockStages = [
  ['Input', 'LayerNorm', 'Branch F', 'Add skip'],
  ['Input', 'Branch F', 'Add skip', 'LayerNorm'],
];

export function placement(c, k) {
  const repeat = cue(k, 6, 'second block') > 0,
    first = placementTrace(start);
  const pre = repeat ? placementTrace(first.pre[3]).pre : first.pre;
  const post = repeat ? placementTrace(first.post[3]).post : first.post;
  const nPre = repeat
    ? 3
    : cue(k, 3, 'Add it')
      ? 3
      : cue(k, 2, 'Run that through')
        ? 2
        : cue(k, 2, 'normalize the four')
          ? 1
          : 0;
  const nPost = repeat
    ? 3
    : cue(k, 5, 'Negative')
      ? 3
      : cue(k, 4, 'Add it back')
        ? 2
        : cue(k, 4, 'feed the original token')
          ? 1
          : 0;
  title(
    c,
    'The skip meets the branch',
    'Block ' + (repeat ? 2 : 1) + '    ·    F(z) = 0.2z + 0.1    ·    brass readings follow feature one',
  );
  const xx = [320, 740, 1160, 1580];
  for (const [ri, data] of [pre, post].entries()) {
    const y = ri ? 730 : 379,
      add = ri ? 2 : 3,
      active = ri ? nPost : nPre;
    text(c, ri ? 'Post-LN' : 'Pre-LN', 90, y - 86, 42, ink, 'left', 'Serif');
    const names = blockStages[ri];
    path(
      c,
      [
        [xx[0], y - 32],
        [xx[0], y - 96],
        [xx[add], y - 96],
        [xx[add], y - 32],
      ],
      null,
      blue,
      5,
      false,
    );
    text(c, 'skip', 530, y - 125, 28, blue, 'center');
    for (let j = 0; j < 4; j++) {
      const current = j <= active;
      if (j) arrow(c, xx[j - 1] + 95, y, xx[j] - 99, y, current ? ink : grid, 4);
      socket(c, names[j], xx[j], y, 182, current ? (names[j] === 'LayerNorm' ? teal : ink) : muted);
      if (current) {
        mono(c, num(data[j][0], 3), xx[j], y + 78, 49, brass, 'center');
        mono(c, '[' + data[j].map((v) => num(v, 2)).join(' ') + ']', xx[j], y + 143, 27, muted, 'center');
      }
    }
  }
  if (k.beat.beatIndex === 1 && cue(k, 2, 'mean is three point seven five'))
    mono(
      c,
      'Branch input     (1 − ' + num(mean(start)) + ') / ' + num(div(start), 3) + ' ≈ ' + num(pre[1][0], 3),
      960,
      977,
      39,
      teal,
      'center',
    );
  if (k.beat.beatIndex === 2)
    mono(
      c,
      'First output     1 + (' + num(pre[2][0], 3) + ') ≈ ' + num(pre[3][0], 3),
      960,
      977,
      39,
      blue,
      'center',
    );
  if (k.beat.beatIndex === 3 && nPost === 2)
    text(c, 'First feature of the sum, relative to its mean?', 960, 977, 44, ink, 'center', 'Serif');
  else if (k.beat.beatIndex === 4 && cue(k, 5, 'mean four point six'))
    mono(
      c,
      'Normalize the sum     (' +
        num(post[2][0]) +
        ' − ' +
        num(mean(post[2])) +
        ') / ' +
        num(div(post[2]), 3) +
        ' ≈ ' +
        num(post[3][0], 3),
      960,
      977,
      38,
      teal,
      'center',
    );
  else if (repeat) {
    if (cue(k, 7, 'a final norm'))
      text(
        c,
        'GPT-2     last Pre-LN sum   →   final LayerNorm   →   prediction head',
        960,
        976,
        40,
        teal,
        'center',
      );
    else
      mono(
        c,
        'Block 2 output means      Pre-LN  ' + num(mean(pre[3])) + '      Post-LN  ' + num(mean(post[3])),
        960,
        978,
        37,
        teal,
        'center',
      );
  }
}

function drawBlockJacobian(c, post, x, y) {
  const terms = post
    ? [['J = J', 'LN'], [' (I + J', 'F'], [')']]
    : [['J = I + J', 'F'], [' J', 'LN']];
  for (const [main, subscript] of terms) {
    text(c, main, x, y, 62, ink, 'left', 'Serif');
    x += c.measureText(main).width;
    if (subscript) {
      text(c, subscript, x + 2, y + 19, 40, ink, 'left', 'Serif');
      x += 2 + c.measureText(subscript).width;
    }
  }
}

function drawBackwardRoute(c, stages, y) {
  const sum = stages.indexOf('Add skip');
  const xs = [192, 548, 904, 1260, 1680];
  const widths = [150, 250, 250, 250, 270];
  const names = [...stages, 'block output'];
  names[sum] = 'residual sum';
  for (let i = 1; i < names.length; i++) {
    const from = xs[i] - widths[i] / 2 - 7;
    const to = xs[i - 1] + widths[i - 1] / 2 + 7;
    arrow(c, from, y, to, y, i > sum ? blue : muted, 6);
  }
  const rail = y - 78;
  path(c, [[xs[sum], y - 30], [xs[sum], rail], [xs[0], rail]], null, blue, 6, false);
  arrow(c, xs[0], rail - 3, xs[0], y - 33, blue, 6);
  text(c, 'identity skip', (xs[0] + xs[sum]) / 2, rail - 33, 38, blue, 'center');
  for (const [i, name] of names.entries()) {
    const color = name === 'LayerNorm' ? teal : ink;
    socket(c, name, xs[i], y, widths[i], color);
  }
}

export function reverse(c, k) {
  const p = probe(),
    g = direction;
  if (k.beat.beatIndex === 0) {
    title(
      c,
      'Trace the skip backward',
      'The block Jacobian J maps a small input change to the resulting output change.',
    );
    for (const [i, stages] of blockStages.entries()) {
      const y = 266 + i * 337;
      text(c, i ? 'Post-LN' : 'Pre-LN', 105, y, 55, ink, 'left', 'Serif');
      drawBlockJacobian(c, i === 1, 982, y);
      drawBackwardRoute(c, stages, y + 192);
    }
    text(c, 'Backpropagation applies the transpose of J to the gradient at the block output.', 98, 948, 39, muted);
    return;
  }
  const result = cue(k, 3, 'The branch sends', 1.1);
  title(
    c,
    'Can the two routes cancel?',
    'Fixed branch F(z) = −s₀ z    ·    s₀ = √(2.5 + ε) at x = ' + vector(point),
  );
  const ox = 297,
    oy = 418,
    u = 141,
    tx = ox + u * g[0],
    ty = oy - u * g[1];
  line(c, 110, oy, 878, oy, grid, 3);
  line(c, ox, 270, ox, 850, grid, 3);
  mono(c, '0', ox - 26, oy - 31, 30, muted);
  text(c, 'component 1', 697, oy - 45, 31, muted, 'center');
  text(c, 'component 2', 100, 273, 31, muted);
  arrow(c, ox, oy, tx, ty, blue, 17);
  const ex = tx + u * p.branch[0] * result,
    ey = ty - u * p.branch[1] * result;
  if (result > 0) arrow(c, tx, ty, tx + u * p.branch[0], ty - u * p.branch[1], rust, 7);
  circle(c, ex, ey, 13, brass, ink);
  text(c, 'Skip contribution', 983, 335, 37, blue);
  mono(c, vector(g), 983, 407, 51, blue);
  if (result > 0) {
    text(c, 'Branch contribution', 983, 530, 38, rust);
    mono(c, vector(p.branch), 983, 603, 51, rust);
  }
  if (result === 1) {
    text(c, 'Gradient returned for this probe', 983, 728, 36, teal);
    mono(c, vector(p.total), 983, 810, 54, teal);
  }
  text(c, 'First two components of the four-feature probe', 105, 908, 32, muted);
  if (k.beat.beatIndex === 3) text(c, 'Measure gradients and updates at each depth.', 986, 926, 33, muted);
  else mono(c, 'mean(g) = 0     x · g = 0', 983, 926, 32, muted);
}
function rmsMeasurement(c, k) {
  const d = 5 * cue(k, 3, 'Add five', 1.8),
    raw = offset(x, d),
    m = mean(raw),
    h = (v) => 722 - 43 * v;
  const shifted = k.beat.beatIndex === 2;
  const zeroDistance = shifted
    ? cue(k, 3, 'RMSNorm measures from zero') > 0
    : cue(k, 1, 'Divide by that uncentered') > 0;
  const divisorReady = shifted ? cue(k, 3, 'Its new divisor') > 0 : zeroDistance;
  const rmsReady = shifted
    ? k.elapsed + 1e-9 >= k.wordCue('positive output').end
    : zeroDistance;
  title(c, 'Two reference levels for feature three', 'Unit gain    ·    zero shift    ·    ε = 0.00001');
  const cols = [230, 445, 660, 875];
  for (const t of [0, 2, 4, 6, 8, 10]) {
    line(c, 115, h(t), 994, h(t), t === 0 ? ink : grid, t === 0 ? 5 : 2);
    mono(c, t, 89, h(t), 28, muted, 'right');
  }
  line(c, 110, h(m), 994, h(m), teal, 4, [11, 6]);
  text(c, 'token mean', 125, h(m) - 19, 30, teal);
  for (const [i, v] of raw.entries()) {
    const px = cols[i],
      py = h(v);
    if (d > 0) {
      circle(c, px, h(x[i]), 9, paper, muted, 3);
      line(c, px, h(x[i]), px, py, grid, 7);
    }
    circle(c, px, py, i === 2 ? 19 : 13, i === 2 ? brass : blue, paper, 4);
    plotNumber(c, num(v), px + 27, py - 18, 32, i === 2 ? brass : blue);
    mono(c, 'f' + (i + 1), px, 829, 29, i === 2 ? brass : muted, 'center');
  }
  const xx = cols[2] - 57;
  line(c, xx, h(raw[2]), xx, h(m), teal, 4);
  line(c, xx - 10, h(raw[2]), xx + 10, h(raw[2]), teal, 4);
  line(c, xx - 10, h(m), xx + 10, h(m), teal, 4);
  mono(c, '−3', xx - 12, (h(raw[2]) + h(m)) / 2, 35, teal, 'right');
  if (zeroDistance) {
    const zx = cols[2] + 83;
    line(c, zx, h(0), zx, h(raw[2]), brass, 4);
    line(c, zx - 10, h(0), zx + 10, h(0), brass, 4);
    line(c, zx - 10, h(raw[2]), zx + 10, h(raw[2]), brass, 4);
    mono(c, (raw[2] > 0 ? '+' : '') + num(raw[2]), zx + 17, (h(raw[2]) + h(0)) / 2 + 8, 35, brass);
  }
  text(c, 'Input offset   +' + num(d), 110, 861, 36, blue);
  text(c, 'LayerNorm', 1112, 289, 54, teal, 'left', 'Serif');
  mono(c, 'mean   ' + num(m), 1112, 371, 38, teal);
  mono(c, '(' + num(raw[2]) + ' − ' + num(m) + ') / ' + num(div(raw), 3), 1112, 442, 41, ink);
  mono(c, '≈ ' + num(ln(raw)[2], 3), 1112, 523, 56, teal);
  line(c, 1112, 583, 1800, 583, grid, 3);
  text(c, 'RMSNorm', 1112, 652, 54, brass, 'left', 'Serif');
  mono(c, 'mean square   ' + num(secondMoment(raw)), 1112, 731, 37, muted);
  if (divisorReady)
    mono(c, num(raw[2]) + ' / ' + num(rootMeanSquare(raw), 3), 1112, 780, 41, ink);
  if (rmsReady) mono(c, '≈ ' + num(rms(raw)[2], 3), 1112, 856, 56, brass);
}
export function rmsNorm(c, k) {
  if (k.beat.beatIndex < 3) {
    rmsMeasurement(c, k);
    return;
  }
  const quiz = cue(k, 5, 'For a fresh arithmetic check') > 0;
  if (quiz) {
    const q = [1, 3, 5, 7],
      scale = Math.sqrt(secondMoment(q)),
      out = q.map((v) => v / scale);
    title(c, 'Try an uncentered scale', 'Unit gain    ·    ε ignored for this hand calculation');
    row(c, 'Input', q, 365);
    mono(c, 'Mean square    (1 + 9 + 25 + 49) / 4 = 21', 106, 510, 44, ink);
    if (cue(k, 5, 'Divide by its square root')) {
      row(c, 'Divide by √21', out, 680);
      mono(c, 'Output mean    ' + num(mean(out), 3), 106, 866, 51, brass);
    }
    return;
  }
  const t = 2 - cue(k, 4, 'Cut those two milliseconds', 1.1),
    state = timeCost(t),
    x0 = 160,
    w = 15.5;
  title(
    c,
    'Where does a millisecond go?',
    'Illustrative step time    ·    the rest of the computation takes 98 ms',
  );
  for (const [i, ms] of [2, state.operator].entries()) {
    const y = 405 + i * 245;
    text(c, i ? 'Trial step' : 'Original step', x0, y - 65, 38, ink);
    rect(c, x0, y, 98 * w, 69, blue);
    rect(c, x0 + 98 * w, y, ms * w, 69, brass);
    mono(c, '98 ms', x0 + 55, y + 34, 35, paper);
    mono(c, num(ms) + ' ms', x0 + 98 * w, y - 34, 31, brass, 'center');
    mono(c, num(timeCost(ms).total) + ' ms', x0, y + 125, 45, teal);
  }
  text(c, 'A fused kernel can gather both LayerNorm statistics in one pass.', 160, 960, 37, muted);
}
export function derivatives(c, k) {
  const g = backward(),
    param = cue(k, 3, 'read down the first column') > 0;
  title(
    c,
    param ? 'One parameter, two tokens' : 'One token, four input gradients',
    param
      ? 'Both tokens use the same learned gain and shift for each feature.'
      : 'Input   ' + vector(x) + '    ·    gains all 1    ·    z = standardized input    ·    s = √(5 + ε)',
  );
  const xpos = { x: 745, dx: 315, hot: param ? 0 : -1 };
  if (param) {
    rect(c, 641, 216, 208, 621, '#eaddc5');
    row(c, 'Token 1 upstream', g.first, 318, xpos);
    row(c, 'Token 2 upstream', g.second, 415, xpos);
    row(c, 'Token 1 standardized', g.standardized, 524, xpos);
    row(c, 'Token 2 standardized', g.secondZ, 615, xpos);
    line(c, 110, 673, 1800, 673, muted, 3);
    if (cue(k, 3, 'Together they give')) row(c, 'Shift gradient · sum', g.db, 735, xpos);
    if (cue(k, 3, 'For the gain')) row(c, 'Gain gradient · sum g × z', g.dg, 841, xpos);
    if (k.beat.beatIndex === 3)
      text(
        c,
        'With ε > 0, rescaling x changes z slightly. The input gradient retains a scale component.',
        108,
        951,
        35,
        muted,
      );
    else
      text(
        c,
        'Token 2 is ' + vector(g.secondX) + '. Its four standardized readings match token 1.',
        108,
        951,
        36,
        muted,
      );
    return;
  }
  row(c, 'Upstream × gain, u', g.u, 326, xpos);
  if (cue(k, 1, 'Subtract the mean')) row(c, 'u − mean(u)', g.centered, 461, xpos);
  if (cue(k, 1, 'Now subtract')) {
    row(c, 'Subtract z × mean(u × z)', g.corrected, 601, xpos);
    mono(
      c,
      'mean(u) = ' + num(mean(g.u)) + '       mean(u × z) ≈ ' + num(g.component, 3),
      109,
      884,
      35,
      muted,
    );
  }
  if (cue(k, 1, 'Divide by the same')) {
    line(c, 103, 686, 1814, 686, grid, 3);
    row(c, 'Divide by s', g.dx, 768, xpos);
  }
}

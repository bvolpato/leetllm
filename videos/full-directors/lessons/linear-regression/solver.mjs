import {
  data,
  fitted,
  predict,
  lineAt,
  gradientAt,
  stablePath,
  oversizedPath,
  curvature,
  stabilityLimit,
  gram,
  rhs,
  duplicates,
  duplicateRuns,
  designCost,
  meanX,
  varianceX,
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
  axisPlot,
  trace,
  readout,
  fmt,
  signed,
  scale,
  mix,
  cue,
} from './marks.mjs';

function gradientRows(g, c) {
  const first = c.beat.beatIndex === 0;
  const slope = !first,
    stepped = slope && cue(c, 'The first step', 0.6) > 0;
  frame(g, 'Which way do the two knobs turn?', 'Gradient bench  /  start at zero');
  screen(g, 80, 250, 1000, 665);
  const heads = ['x', 'Measured', 'Prediction', 'Error', 'x × error'];
  const xs = [168, 340, 554, 746, 920];
  heads.forEach((h, j) => {
    if (j < 4 || slope) text(g, h, xs[j], 335, 29, C.soft, 'center');
  });
  data.forEach(({ x, y }, i) => {
    const yy = 417 + i * 91;
    line(g, 130, yy + 42, 1022, yy + 42, C.grid, 2);
    [x, y, 0, -y, -x * y].forEach((v, j) => {
      if (j < 4 || slope) mono(g, fmt(v), xs[j], yy, 35, j >= 3 ? C.gold : C.white, 'center');
    });
  });
  const grad = gradientAt(0, 0);
  readout(
    g,
    'Intercept gradient',
    `2 × mean(error) = ${fmt(grad.intercept)}`,
    1140,
    320,
    C.teal,
    35,
  );
  if (slope)
    readout(g, 'Slope gradient', `2 × mean(xe) = ${fmt(grad.slope)}`, 1140, 485, C.teal, 35);
  if (stepped) {
    line(g, 1140, 650, 1810, 650, C.rule, 2);
    text(g, 'Subtract 0.05 × gradient', 1140, 711, 35);
    mono(g, '(0, 0) → (16, 52)', 1140, 800, 48, C.teal);
  }
}
export function descent(g, c) {
  const i = c.beat.beatIndex;
  if (i < 2) {
    gradientRows(g, c);
    return;
  }
  const unstable = i >= 4,
    states = unstable ? oversizedPath : stablePath;
  const t =
    i === 2
      ? cue(c, 'Repeat the update', Math.max(2, c.speechDuration * 0.78))
      : i === 4
        ? cue(c, 'Follow the point', Math.max(1, c.speechDuration * 0.46))
        : 1;
  const idx = unstable
    ? Math.round(t * (states.length - 1))
    : Math.min(states.length - 1, Math.max(1, Math.round(Math.pow(states.length, t) - 1)));
  const state = states[idx];
  frame(
    g,
    unstable ? 'Watch the loss after each crossing' : 'Follow the fit into the valley',
    'Gradient descent  /  completed steps',
  );
  screen(g, 80, 249, 925, 646);
  screen(g, 1035, 249, 805, 646);
  if (!unstable) {
    const p = axisPlot(g, {
      left: 206,
      right: 933,
      top: 350,
      bottom: 745,
      xd: [-4, 110],
      xt: [0, 25, 50, 75, 100],
      yd: [-5, 60],
      yt: [0, 20, 40, 60],
      xName: 'Intercept  (ms)',
      yName: 'Slope  (ms / 100 tokens)',
    });
    // In parameter coordinates the excess MSE is (db + mean(x) dm)^2 + var(x) dm^2.
    for (const height of [15, 90, 500, 2500, 10000]) {
      for (const sign of [-1, 1]) {
        const pts = [];
        for (let j = 0; j <= 160; j++) {
          const theta = (j * Math.PI) / 160;
          const dm = Math.sqrt(height / varianceX) * Math.cos(theta);
          const db = -meanX * dm + sign * Math.sqrt(height) * Math.sin(theta);
          pts.push([p.X(100 + db), p.Y(20 + dm)]);
        }
        g.save();
        g.beginPath();
        g.rect(p.left, p.top, p.right - p.left, p.bottom - p.top);
        g.clip();
        poly(g, pts, C.grid, 2);
        g.restore();
      }
    }
    const samples = states.slice(0, idx + 1).filter((_, j) => j < 30 || j % 12 === 0 || j === idx);
    poly(
      g,
      samples.map((v) => [p.X(v.intercept), p.Y(v.slope)]),
      C.gold,
      5,
    );
    dot(g, p.X(state.intercept), p.Y(state.slope), 10, C.gold);
    dot(g, p.X(100), p.Y(20), 15, null, C.green, 3);
  } else {
    const errorX = scale(-15, 15, 244, 930);
    text(g, 'Slope error from the minimum', 148, 306, 30, C.white);
    line(g, errorX(-15), 399, errorX(15), 399, C.grid, 4);
    line(g, errorX(0), 374, errorX(0), 425, C.green, 3);
    mono(g, '0', errorX(0), 450, 26, C.green, 'center');
    const delta = state.slope - 20;
    line(g, errorX(0), 399, errorX(delta), 399, C.rose, 5);
    dot(g, errorX(delta), 399, 10, C.rose);
    mono(g, signed(delta, 2), errorX(delta), 358, 28, C.rose, 'center');
    const maxLoss = Math.ceil(states.at(-1).loss / 250) * 250;
    const p = axisPlot(g, {
      left: 210,
      right: 930,
      top: 538,
      bottom: 745,
      xd: [0, 8],
      xt: [0, 2, 4, 6, 8],
      yd: [0, maxLoss],
      yt: [0, maxLoss / 2, maxLoss],
      xName: 'Completed update',
      yName: 'Training MSE  (ms²)',
    });
    poly(
      g,
      states.slice(0, idx + 1).map((v, j) => [p.X(j), p.Y(v.loss)]),
      C.rose,
      5,
    );
    states
      .slice(0, idx + 1)
      .forEach((v, j) => dot(g, p.X(j), p.Y(v.loss), j === idx ? 10 : 5, C.rose));
  }
  const p = axisPlot(g, {
    left: 1170,
    right: 1770,
    top: 350,
    bottom: 745,
    xd: [0, 5],
    xt: [0, 1, 2, 3, 4, 5],
    yd: [0, 330],
    yt: [0, 100, 200, 300],
  });
  if (unstable) trace(g, p, (x) => predict(x), C.cyan, 3);
  trace(g, p, lineAt(state.intercept, state.slope), unstable ? C.rose : C.cyan);
  data.forEach((r) => dot(g, p.X(r.x), p.Y(r.y), 8, C.gold));
  mono(
    g,
    `Rate ${unstable ? '0.09' : '0.05'}    Step ${idx}`,
    108,
    221,
    38,
    C.ink,
  );
  mono(
    g,
    `b ${fmt(state.intercept, 2)}   m ${fmt(state.slope, 2)}   MSE ${fmt(state.loss, 2)} ms²`,
    1070,
    221,
    35,
    C.ink,
  );
}
function matrix(g, c, three = false) {
  const focus =
    c.beat.id === 'c06-b01' ? Math.min(4, Math.floor(cue(c, 'Read the predictions', 2.6) * 5)) : 2;
  text(g, 'Design row', 175, 324, 30, C.soft);
  text(g, 'Weights', 790, 324, 30, C.soft);
  text(g, 'Predicted reply', 1390, 324, 30, C.soft);
  const dec = three ? duplicates(1) : duplicates(0);
  data.forEach((r, i) => {
    const y = 413 + i * 87;
    const sel = i === focus;
    if (sel) rect(g, 143, y - 36, 1615, 73, '#244c4e', 10);
    const col = sel ? C.white : C.soft;
    mono(g, three ? `[ 1   ${r.x}   ${2 * r.x} ]` : `[ 1   ${r.x} ]`, 175, y, 39, col);
    mono(g, three ? '·  [ 100   4   8 ]' : '·  [ 100   20 ]', 760, y, 39, sel ? C.cyan : col);
    mono(g, `=   ${fmt(dec.rows[i].fit)} ms`, 1390, y, 39, sel ? C.gold : col);
  });
}
function trade(g, t) {
  const d = duplicates(Math.round(t * 80) / 80);
  text(g, 'Same design columns', 145, 330, 34, C.soft);
  mono(g, '1         x          2x', 145, 400, 48, C.white);
  text(g, 'Weights', 145, 500, 33, C.soft);
  mono(g, `100       ${fmt(d.first, 1)}         ${fmt(d.other, 1)}`, 145, 576, 48, C.cyan);
  mono(g, `${fmt(d.first)}x + ${fmt(d.other)}(2x) = 20x`, 145, 730, 42, C.white);
  replyBars(g, d.rows);
}
function replyBars(g, rows) {
  line(g, 989, 330, 989, 799, C.grid, 3);
  text(g, 'Five fitted replies', 1100, 333, 34, C.soft);
  rows.forEach((r, i) => {
    const yy = 423 + i * 82;
    mono(g, `${r.x * 100} tokens`, 1090, yy, 31, C.soft);
    line(g, 1340, yy, 1340 + r.fit * 1.25, yy, C.cyan, 5);
    mono(g, `${fmt(r.fit)} ms`, 1770, yy, 31, C.gold, 'right');
  });
}
function compareStarts(g, c) {
  frame(g, 'Which part of the start survives?', 'Full-batch gradient descent  /  step size 0.01');
  screen(g, 80, 250, 1760, 645);
  text(g, 'Weights for the intercept, x and 2x', 145, 325, 36, C.white);
  text(g, 'Starting weights', 145, 406, 30, C.soft);
  text(g, 'Converged weights', 550, 406, 30, C.soft);
  const other = cue(c, 'Other starts', 0) === 1;
  const converged = cue(c, 'Run B ends', 0) === 1;
  const tuple = (weights) => '(' + weights.map((v) => fmt(v, 0)).join(', ') + ')';
  duplicateRuns.forEach((run, i) => {
    if (i === 1 && !other) return;
    const y = 487 + 175 * i;
    text(g, i === 0 ? 'Run A' : 'Run B', 145, y, 32, i === 0 ? C.cyan : C.lilac);
    mono(g, tuple(run.start), 145, y + 60, 39, C.white);
    if ((i === 0 && cue(c, 'converges to the shortest', 0) === 1) || (i === 1 && converged))
      mono(g, tuple(run.finish), 550, y + 60, 39, i === 0 ? C.cyan : C.lilac);
  });
  replyBars(g, duplicateRuns[converged ? 1 : 0].rows);
  if (converged) {
    const offset = duplicateRuns[1].finish.map((v, j) => v - duplicateRuns[0].finish[j]);
    mono(g, `Run B − Run A   ${tuple(offset)} at both start and finish`, 98, 971, 37, C.ink);
  }
}
export function solve(g, c) {
  const id = c.beat.id;
  if (id === 'c06-b01' || id === 'c06-b02') {
    frame(g, 'One row makes one prediction', 'Design matrix  /  Xw');
    screen(g, 80, 250, 1760, 645);
    matrix(g, c);
    if (id === 'c06-b02') mono(g, 'Third row    1 × 100 + 3 × 20 = 160 ms', 105, 221, 42, C.teal);
  } else if (id === 'c06-b05') {
    frame(
      g,
      'Trade weights without moving a reply',
      'Manual choice of equivalent fits  /  length and double length',
    );
    screen(g, 80, 250, 1760, 645);
    trade(g, cue(c, 'Watch the weights', 1.8));
  } else if (id === 'c06-normal') {
    const elim = cue(c, 'Subtract three copies'),
      back = cue(c, 'Put it back');
    frame(g, 'Solve for the shift and tilt', 'Normal equations  /  XᵀXw = Xᵀy');
    screen(g, 80, 250, 994, 645);
    text(g, 'Residual checks    Σe = 0     Σxe = 0', 145, 343, 37, C.soft);
    mono(g, `${gram[0][0]}b  +  ${gram[0][1]}m  =   ${rhs[0]}`, 150, 474, 50, C.white);
    mono(g, `${gram[1][0]}b  +  ${gram[1][1]}m  =  ${rhs[1]}`, 150, 580, 50, C.white);
    if (elim) {
      line(g, 145, 666, 958, 666, C.grid);
      mono(g, 'Row 2 − 3 × row 1', 148, 742, 40, C.gold);
      mono(g, '10m = 200', 1170, 452, 61, C.teal);
      mono(g, 'm = 20', 1170, 558, 58, C.teal);
    }
    if (back) mono(g, 'b = (800 − 300) / 5 = 100', 1160, 708, 41, C.ink);
  } else {
    const check = id === 'c06-b04';
    frame(
      g,
      'Locate the shortest miss',
      'Least-squares projection  /  a slice through the vectors',
    );
    screen(g, 80, 250, 1760, 645);
    const fx = 785,
      fy = 738,
      ox = 200,
      ty = 437,
      dx = check ? 0 : 215 * (1 - cue(c, 'Project the target', 1.4));
    line(g, 160, fy, 1020, fy, C.grid, 5);
    line(g, ox, fy, fx, ty, C.gold, 5);
    dot(g, fx, ty, 10, C.gold);
    line(g, ox, fy, fx + dx, fy, C.cyan, 6);
    line(g, fx + dx, fy, fx, ty, C.lilac, 5);
    dot(g, fx + dx, fy, 9, C.cyan);
    if (dx === 0)
      poly(
        g,
        [
          [fx - 26, fy],
          [fx - 26, fy - 26],
          [fx, fy - 26],
        ],
        C.white,
        3,
      );
    text(g, 'Target y', fx - 10, ty - 46, 34, C.gold, 'center');
    text(g, 'Reachable predictions', ox, fy + 62, 34, C.cyan);
    text(g, 'Residual', fx + dx / 2 + 33, 580, 34, C.lilac);
    text(g, 'Directions shown schematically', 150, 328, 26, C.soft);
    text(g, check ? 'Check both columns' : 'Prediction space', 1090, 354, 36, C.soft);
    if (check) {
      mono(g, 'e = [−2, 1, 2, 1, −2]', 1090, 452, 36, C.gold);
      mono(g, '1 · e = −2 + 1 + 2 + 1 − 2 = 0', 1090, 580, 31, C.white);
      if (cue(c, 'Multiply each'))
        mono(g, 'x · e = −2 + 2 + 6 + 4 − 10 = 0', 1090, 690, 31, C.white);
    } else {
      serif(g, 'Shift or tilt the line.', 1090, 469, 51, C.white);
      text(g, 'Its five predictions move together', 1090, 565, 35, C.soft);
      text(g, 'in the span of the two columns.', 1090, 619, 35, C.soft);
    }
  }
}
function gramCell(g, c) {
  frame(g, 'What goes into one Gram cell?', 'Column dot products  /  the five request rows');
  screen(g, 80, 249, 1760, 645);
  const count = Math.floor(cue(c, 'Read across all five', 2.4) * 5);
  const a = 210,
    dx = 173;
  text(g, 'Intercept column', 148, 335, 30, C.soft);
  text(g, 'Length column', 148, 535, 30, C.soft);
  data.forEach((r, j) => {
    const x = a + j * dx,
      color = j < count ? C.gold : C.soft;
    mono(g, '1', x, 403, 43, C.cyan, 'center');
    mono(g, r.x, x, 603, 43, C.lilac, 'center');
    line(g, x + 35, 413, x + 35, 574, j < count ? C.gold : C.grid, 2);
    dot(g, x + 35, 493, 5, color);
  });
  const partial = data.slice(0, count).map((r) => r.x);
  mono(
    g,
    count ? partial.join(' + ') + ' = ' + partial.reduce((a, b) => a + b, 0) : '1 × x',
    145,
    767,
    45,
    C.gold,
  );
  line(g, 1070, 318, 1070, 820, C.grid, 2);
  text(g, 'Gram matrix', 1200, 319, 39, C.white);
  for (const [k, label] of ['1', 'x'].entries()) {
    mono(g, label, 1289 + k * 202, 379, 32, C.soft, 'center');
    mono(g, label, 1150, 484 + k * 161, 32, C.soft, 'center');
  }
  const landed = cue(c, 'Fifteen goes') > 0;
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) {
      const x = 1195 + j * 202,
        y = 412 + i * 161,
        active = i === 0 && j === 1;
      rect(g, x, y, 189, 146, active ? '#486159' : '#203f43', 7);
      mono(
        g,
        i !== j && !landed ? '·' : gram[i][j],
        x + 94,
        y + 72,
        47,
        active ? C.gold : C.soft,
        'center',
      );
    }
}
export function cost(g, c) {
  const i = c.beat.beatIndex;
  if (i === 0 && !cue(c, 'Now scale up')) {
    gramCell(g, c);
    return;
  }
  if (i < 3) {
    const d =
      i === 0
        ? cue(c, 'Double the columns') > 0
          ? 2000
          : 1000
        : i === 1
          ? cue(c, 'Grow the grid') > 0
            ? 10000
            : 2000
          : 10000;
    const n = i === 2 && cue(c, 'Double the rows') > 0 ? 2 : 1,
      v = designCost(d, n);
    frame(g, 'Price the square before forming it', 'Dense Gram matrix  /  float64 storage');
    screen(g, 80, 250, 905, 655);
    const a = d / 1000,
      cell = a <= 2 ? 160 : 43,
      w = a * cell,
      x = 530 - w / 2,
      y = 556 - w / 2;
    mono(g, `${d.toLocaleString('en-US')} design columns`, 530, 306, 32, C.white, 'center');
    for (let j = 0; j < a; j++)
      for (let k = 0; k < a; k++)
        rect(
          g,
          x + k * cell + 2,
          y + j * cell + 2,
          cell - 4,
          cell - 4,
          j === 0 && k === 0 ? '#c39d58' : '#3c7377',
          3,
        );
    text(g, 'Each tile holds 1,000 × 1,000 entries.', 531, 828, 30, C.soft, 'center');
    readout(g, 'Gram storage  ·  D²', `${fmt(v.mb)} MB`, 1055, 339);
    readout(
      g,
      `Formation  ·  ${n === 2 ? '2N' : 'N'} rows × D²`,
      `${v.formation}× work`,
      1055,
      492,
    );
    if (i > 0)
      readout(
        g,
        'Dense factorization  ·  D³',
        `${v.factor.toLocaleString('en-US')}× work`,
        1055,
        645,
      );
    text(g, 'Work relative to N rows and 1,000 columns', 1055, 842, 30, C.subtle);
    return;
  }
  const three = i === 5 || (i === 4 && cue(c, 'Now add a third column') > 0);
  frame(g, 'How many directions does the solver see?', 'Dense least squares  /  numerical rank');
  screen(g, 80, 250, 1760, 645);
  if (i === 3) {
    text(g, 'Two-norm condition number', 148, 334, 36, C.soft);
    const k = curvature[1] / curvature[0];
    for (const [j, label, val, col] of [
      [0, 'Design  X', Math.sqrt(k), C.cyan],
      [1, 'Gram  XᵀX', k, C.lilac],
    ]) {
      const y = 472 + j * 174;
      mono(g, label, 151, y, 39, C.white);
      rect(g, 564, y - 20, Math.max(6, val * 13.5), 40, col, 9);
      mono(g, fmt(val, 2), 592 + val * 13.5, y, 43, col);
    }
    text(g, 'QR and SVD work directly with X.', 151, 807, 38, C.white);
  } else {
    matrix(g, c, three);
    mono(g, `Rank 2 / ${three ? 3 : 2} columns`, 145, 221, 42, C.teal);
    text(
      g,
      three ? 'Shortest solution for the duplicated design' : 'Two independent directions',
      1758,
      221,
      37,
      C.ink,
      'right',
    );
  }
}

function contour(g, standard) {
  const ratio = standard ? 1 : curvature[1] / curvature[0],
    cx = 593,
    cy = 570;
  screen(g, 80, 251, 1010, 642);
  const long = 365,
    short = long / Math.sqrt(ratio);
  for (const f of [0.38, 0.65, 1]) {
    g.beginPath();
    g.ellipse(cx, cy, long * f, short * f, -0.34, 0, 2 * Math.PI);
    g.strokeStyle = C.cyan;
    g.lineWidth = 4;
    g.stroke();
  }
  const local = (x, y) => [
    cx + x * Math.cos(-0.34) - y * Math.sin(-0.34),
    cy + x * Math.sin(-0.34) + y * Math.cos(-0.34),
  ];
  poly(g, [[cx, cy], local(long, 0)], C.gold, 6);
  poly(g, [[cx, cy], local(0, -short)], C.lilac, 6);
  dot(g, cx, cy, 8, C.white);
  text(g, 'Equal-loss contours', 141, 316, 32, C.soft);
  text(g, 'Shallow radius', 149, 814, 31, C.gold);
  text(g, 'Steep radius', 1020, 814, 31, C.lilac, 'right');
}
export function steps(g, c) {
  const i = c.beat.beatIndex;
  if (i < 2 || (i === 5 && cue(c, 'Take the length') === 0)) {
    const scaled = i === 5;
    frame(
      g,
      scaled ? 'Center and scale one input' : 'Why is the valley so narrow?',
      'Hessian  /  curvature in coefficient space',
    );
    if (scaled) {
      screen(g, 80, 251, 1010, 642);
      for (const r of [60, 130, 205]) {
        g.beginPath();
        g.arc(590, 566, r, 0, 2 * Math.PI);
        g.strokeStyle = C.cyan;
        g.lineWidth = 4;
        g.stroke();
      }
      dot(g, 590, 566, 8, C.gold);
      text(g, 'Standardized input and free intercept', 585, 827, 32, C.white, 'center');
      readout(g, 'Hessian after scaling', 'H = 2I', 1160, 375);
      readout(g, 'Curvature ratio', '1', 1160, 565);
    } else {
      contour(g, false);
      readout(g, 'MSE curvature', 'H = 2XᵀX / N', 1150, 360, C.teal, 54);
      if (i === 1) {
        const ratio = curvature[1] / curvature[0];
        readout(
          g,
          'Steep / shallow curvature',
          `${fmt(curvature[1], 2)} / ${fmt(curvature[0], 2)} ≈ 70`,
          1150,
          534,
          C.ink,
          43,
        );
        readout(
          g,
          'Long / short radius',
          `√${fmt(ratio, 2)} ≈ ${fmt(Math.sqrt(ratio), 2)}`,
          1150,
          714,
          C.plum,
          45,
        );
      }
    }
  } else if (i === 6) {
    compareStarts(g, c);
  } else if (i === 5) {
    frame(
      g,
      'Choose another pair with the same fit',
      'Manual choice of equivalent fits  /  dependent inputs',
    );
    screen(g, 80, 250, 1760, 645);
    trade(g, cue(c, 'Trade weight', 1.5));
  } else {
    const secondTrial = i === 4 || (i === 3 && cue(c, 'Reset both dots', 0) === 1);
    const rate = secondTrial ? 0.2 : 0.05;
    let jump = 1;
    if (i === 2) jump = cue(c, 'Try a rate', 1.35);
    if (i === 3 && secondTrial) jump = cue(c, 'Now try point two', 1.35);
    const landed = jump === 1;
    frame(g, 'Does one step shrink the error?', 'Step-size test  /  one unit of initial error');
    screen(g, 80, 250, 1760, 648);
    const X = scale(-4, 1.5, 500, 1755);
    rect(g, X(-1), 389, X(1) - X(-1), 361, '#264b46');
    for (const k of [-4, -3, -2, -1, 0, 1]) {
      line(g, X(k), 389, X(k), 750, k === 0 ? C.soft : C.grid, 2);
      mono(g, k, X(k), 791, 30, C.soft, 'center');
    }
    const label = landed
      ? 'Error after one update'
      : jump === 0
        ? 'Initial error'
        : 'Updating the error';
    text(g, label, 500, 331, 33, C.white);
    mono(g, `Rate ${rate}`, 1765, 330, 35, C.white, 'right');
    curvature.forEach((v, j) => {
      const y = 477 + j * 180,
        col = j ? C.lilac : C.gold;
      const position = mix(1, 1 - rate * v, jump);
      text(g, j ? 'Steep' : 'Shallow', 146, y - 14, 36, col);
      mono(g, `λ = ${fmt(v, 2)}`, 146, y + 40, 27, C.soft);
      line(g, X(-4), y, X(1.5), y, C.grid, 2);
      line(g, X(1), y, X(position), y, col, 5);
      dot(g, X(1), y, 11, null, C.white, 3);
      dot(g, X(position), y, 11, landed ? col : C.dark, col, 3);
      if (landed || jump === 0) mono(g, fmt(position, 2), X(position), y - 38, 30, col, 'center');
    });
    mono(
      g,
      i === 4
        ? `|1 − αλ| < 1     ⇒     0 < α < 2 / λmax ≈ ${fmt(stabilityLimit, 4)}`
        : 'New error = (1 − αλ) × initial error',
      145,
      221,
      40,
      C.ink,
    );
  }
}

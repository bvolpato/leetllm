import {
  C,
  colors,
  cue,
  afterCue,
  mix,
  fmt,
  pct,
  total,
  line,
  path,
  dot,
  ellipse,
  rect,
  split,
  text,
  head,
  readout,
  graph,
} from './drawing.mjs';
import {
  data,
  shares,
  refreshedShares,
  update,
  weightedTimes,
  mState,
  boundsAt,
  bound,
  jensenConstruction,
  restrictedModel,
  logLikelihood,
  evidenceBound,
  trajectory,
  displayScore,
  normal,
} from './experiments.mjs';

function slice(ctx, x, y, r, f) {
  dot(ctx, x, y, r, C.slow);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = C.fast;
  ctx.fill();
  ellipse(ctx, x, y, r, r, null, C.deep, 2);
}
export function expectation(ctx, clock) {
  head(ctx, 'Six requests on the counting rail');
  text(ctx, 'μ = 25, 95 ms     σ = 30 ms     Equal priors', 62, 111, 19, C.soft, 'left', 'Mono');
  const first = cue(clock, 1, 'Look at the first request');
  const firstSplit = afterCue(clock, 2, 'eight hundredths of a request');
  const all = cue(clock, 3, 'Each pair adds up');
  const gather = cue(clock, 3, 'Gather the blue pieces', 1.1);
  const w = 115,
    left = 134;
  data.forEach((x, i) => {
    const cx = left + (i + 0.5) * w;
    text(ctx, x + ' ms', cx, 174, 22, C.ink, 'center', 'Mono');
    if (all || (firstSplit && i === 0)) {
      slice(ctx, cx, 228, 30, shares[i][0]);
      text(ctx, fmt(shares[i][0], 3), cx, 286, 18, C.fast, 'center', 'Mono');
    } else ellipse(ctx, cx, 228, 30, 30, C.metal, first && i === 0 ? C.gold : C.grid, 1.5);
  });
  if (!all) {
    if (first)
      text(
        ctx,
        firstSplit
          ? '28 ms  →  ' + pct(shares[0][0], 1) + ' fast  +  ' + pct(shares[0][1], 1) + ' slow'
          : 'How much of the 28 ms request belongs to the slow component?',
        480,
        388,
        23,
        C.ink,
        'center',
        'Mono',
      );
    return;
  }
  // Separate the colors into rows before sliding the pieces together.
  const separate = Math.min(1, 3 * gather);
  const collect = Math.max(0, (3 * gather - 1) / 2);
  const pairGap = 6;
  const pairsLeft = left - ((data.length - 1) * pairGap) / 2;
  for (let k = 0; k < 2; k++) {
    const y = 340 + k * 58;
    let prefix = 0;
    text(ctx, k ? 'Slow' : 'Fast', 64, y + 10, 18, colors[k]);
    for (const [i, row] of shares.entries()) {
      const pairLeft = pairsLeft + i * (w + pairGap);
      const pieceLeft = pairLeft + (k === 0 ? 0 : row[0] * w);
      const x = mix(pieceLeft, left + prefix * w, collect);
      rect(ctx, x, mix(318, y, separate), row[k] * w, 21, colors[k], 2, C.bg, 1.2);
      prefix += row[k];
    }
    if (gather === 1)
      text(
        ctx,
        fmt(prefix, 3) + ' requests',
        left + prefix * w + 16,
        y + 11,
        23,
        colors[k],
        'left',
        'Mono',
      );
  }
}
function fitAxis(ctx, model, memberships, activeRequest) {
  const X = (x) => 74 + ((x - 15) * 820) / 90,
    axisY = 217;
  for (let k = 0; k < 2; k++) {
    const mu = model.means[k],
      height = 64;
    const pts = Array.from({ length: 450 }, (_, i) => {
      const x = 15 + (i * 90) / 449;
      return [X(x), axisY - 5900 * model.weights[k] * normal(x, mu, model.variances[k])];
    });
    path(ctx, [[X(15), axisY], ...pts, [X(105), axisY]], null, 0, k ? '#f697af14' : '#87c7ff1f');
    path(ctx, pts, colors[k], 2.5);
    const mx = X(mu);
    line(ctx, mx, axisY - height, mx, axisY, colors[k], 2, [4, 3]);
    path(
      ctx,
      [
        [mx - 7, axisY - height - 8],
        [mx + 7, axisY - height - 8],
        [mx, axisY - height + 1],
      ],
      null,
      0,
      colors[k],
    );
    text(ctx, fmt(mu, 1) + ' ms', mx, axisY - height - 28, 20, colors[k], 'center', 'Mono');
  }
  line(ctx, X(15), axisY, X(105), axisY, C.soft, 2);
  for (let x = 20; x <= 100; x += 10) {
    line(ctx, X(x), axisY, X(x), axisY + 6, C.soft, 1);
    if (x === 60) text(ctx, '60 ms', X(x), axisY + 21, 15, C.soft, 'center');
  }
  for (const [i, x] of data.entries()) {
    const y = axisY + 30 + (i % 3) * 24;
    line(ctx, X(x), axisY, X(x), y, C.gold, 1);
    dot(ctx, X(x), axisY, 3, C.gold);
    slice(ctx, X(x), y, 7, memberships[i][0]);
    if (i === activeRequest) ellipse(ctx, X(x), y, 9, 9, null, C.gold, 1.5);
    text(
      ctx,
      x,
      X(x) + (i % 3 === 2 ? 10 : -11),
      y,
      15,
      C.ink,
      i % 3 === 2 ? 'left' : 'right',
      'Mono',
    );
  }
}
function weightedMeanRail(ctx, { factors, included, dividing, activeRequest }) {
  const productY = [376, 410];
  const times = [weightedTimes(0), weightedTimes(1)];
  const sumX = 728;
  text(ctx, 'Weighted time (ms) = request time × frozen share', 64, 319, 20, C.ink, 'left', 'Serif');
  if (included) text(ctx, 'Totals use unrounded values', sumX, 319, 15, C.soft);
  line(ctx, 710, 333, 710, 420, C.grid);
  for (const [i, latency] of data.entries()) {
    const cx = 155 + i * 98;
    text(ctx, latency + ' ms', cx, 337, 19, i === activeRequest ? C.gold : C.soft, 'center', 'Mono');
    if (i < included) {
      const width = (84 * latency) / Math.max(...data);
      split(ctx, cx - width / 2, 348, width, 9, shares[i][0], 1);
    }
    for (let k = 0; k < 2; k++) {
      if (i < included || (i === 0 && factors))
        text(ctx, '× ' + fmt(shares[i][k], 3), cx, productY[k] - 15, 16, C.soft, 'center', 'Mono');
      if (i < included)
        text(ctx, fmt(times[k][i]), cx, productY[k], 22, colors[k], 'center', 'Mono');
    }
  }
  if (included)
    text(ctx, dividing ? 'Sum / effective count' : 'Running sum (ms)', sumX, 337, 18, C.soft);
  for (let k = 0; k < 2; k++) {
    text(ctx, k ? 'Slow' : 'Fast', 64, productY[k], 19, colors[k]);
    if (included) {
      const sum = fmt(total(times[k].slice(0, included)));
      text(
        ctx,
        dividing ? sum + ' / ' + fmt(update.effective[k], 3) : sum,
        sumX,
        productY[k],
        21,
        colors[k],
        'left',
        'Mono',
      );
    }
  }
}
export function maximization(ctx, clock) {
  const b = clock.beat.beatIndex + 1,
    model = mState(clock);
  head(ctx, 'Refit the peaks to the fixed observations');
  const refresh = cue(clock, 5, 'next E-step');
  text(
    ctx,
    refresh ? 'Shares under the updated curves' : 'Frozen E-step shares',
    65,
    104,
    19,
    C.soft,
  );
  if (b === 4)
    text(ctx, 'Check the effective count before dividing.', 897, 104, 19, C.gold, 'right');
  if (b <= 2 || !cue(clock, 3, 'Divide each effective count')) {
    const factors = cue(clock, 1, 'multiply that time');
    const first = afterCue(
      clock,
      1,
      'It puts about twenty-six milliseconds in the fast sum and two in the slow sum',
    );
    const dividing = cue(clock, 2, 'Divide each sum by its own effective count');
    const adding = Math.max(dividing, cue(clock, 2, 'Add the weighted times', 1.75));
    const included = first + Math.floor((data.length - 1) * adding);
    const scanning = (b === 1 && factors) || (b === 2 && adding > 0 && !dividing);
    const activeRequest = scanning ? Math.max(0, included - 1) : -1;
    fitAxis(ctx, model, shares, activeRequest);
    weightedMeanRail(ctx, { factors, included, dividing, activeRequest });
    return;
  }
  fitAxis(ctx, model, refresh ? refreshedShares : shares);
  for (let k = 0; k < 2; k++) {
    const x = 65 + 440 * k;
    text(ctx, k ? 'Slow component' : 'Fast component', x, 343, 20, colors[k], 'left', 'Serif');
    if (refresh) {
      text(
        ctx,
        fmt(shares[0][k], 3) + '  →  ' + fmt(refreshedShares[0][k], 3),
        x,
        377,
        24,
        colors[k],
        'left',
        'Mono',
      );
      text(ctx, 'Share of the same 28 ms request', x, 407, 18, C.soft);
    } else {
      text(ctx, 'Weight   ' + fmt(model.weights[k], 4), x, 377, 22, colors[k], 'left', 'Mono');
      text(
        ctx,
        'Variance ' + fmt(model.variances[k], 1) + ' ms²',
        x,
        407,
        21,
        colors[k],
        'left',
        'Mono',
      );
    }
  }
}
export function jensen(ctx, clock) {
  const b = clock.beat.beatIndex + 1;
  const s = jensenConstruction(cue(clock, 6, 'Slide the trial split', 2.2));
  head(ctx, 'Two orders for the same average');
  const g = graph(
    ctx,
    [92, 146, 458, 225],
    [0.001, 0.014],
    [-7, -4],
    [0.003, 0.007, 0.011],
    [-7, -6, -5, -4],
    'Weighted density / trial share',
    'Natural logarithm',
  );
  g.trace(Math.log, C.soft, 2.5);
  const [a, z] = s.ratios;
  line(ctx, g.X(a), g.Y(Math.log(a)), g.X(z), g.Y(Math.log(z)), C.gold, 3);
  [a, z].forEach((v, k) => dot(ctx, g.X(v), g.Y(Math.log(v)), 5, colors[k]));
  if (b >= 3) dot(ctx, g.X(s.total), g.Y(s.bound), 7, C.gold);
  if (b >= 4) {
    line(ctx, g.X(s.total), g.Y(s.bound), g.X(s.total), g.Y(s.logEvidence), C.sum, 2);
    dot(ctx, g.X(s.total), g.Y(s.logEvidence), 5, C.sum);
  }
  text(ctx, 'Trial split q', 592, 117, 20, C.ink, 'left', 'Serif');
  split(ctx, 592, 143, 301, 20, s.q[0]);
  text(ctx, fmt(s.q[0], 3) + ' / ' + fmt(s.q[1], 3), 592, 190, 21, C.ink, 'left', 'Mono');
  s.joint.forEach((v, k) =>
    text(
      ctx,
      fmt(v, 5) + ' / ' + fmt(s.q[k], 3) + ' ≈ ' + fmt(s.ratios[k], 5),
      592,
      237 + k * 34,
      17,
      colors[k],
      'left',
      'Mono',
    ),
  );
  if (b >= 2)
    text(ctx, 'Weighted average   ' + fmt(s.total, 5), 592, 323, 17, C.soft, 'left', 'Mono');
  if (b >= 3)
    text(ctx, 'Average of logs   ' + fmt(s.bound, 3), 592, 352, 19, C.gold, 'left', 'Mono');
  if (b >= 4)
    text(ctx, 'Log of average    ' + fmt(s.logEvidence, 3), 592, 380, 19, C.sum, 'left', 'Mono');
  if (cue(clock, 5, 'vertical gap'))
    text(ctx, 'Gap   ' + fmt(Math.max(0, s.gap), 3) + ' nats', 592, 411, 22, C.ink, 'left', 'Mono');
}
export function ascent(ctx, clock) {
  const b = clock.beat.beatIndex + 1,
    s = boundsAt(clock);
  head(ctx, 'One movable mean, six membership splits');
  const g = graph(
    ctx,
    [82, 151, 449, 194],
    [20, 80],
    [-39, -26],
    [20, 40, 60, 80],
    [-38, -34, -30, -26],
    'First component mean (ms)',
    'Log score on six times',
  );
  g.trace((mu) => logLikelihood(data, restrictedModel(mu)), C.sum, 3);
  g.trace((mu) => evidenceBound(data, s.q, restrictedModel(mu)), C.gold, 3);
  const px = g.X(s.mean);
  line(ctx, px, g.b, px, g.Y(s.likelihood), C.soft, 1.5, [3, 4]);
  dot(ctx, px, g.Y(s.lower), 7, C.gold);
  dot(ctx, px, g.Y(s.likelihood), 4.3, C.sum);
  text(ctx, 'μ = ' + fmt(s.mean, 2) + ' ms', 80, 102, 19, C.ink, 'left', 'Mono');
  text(
    ctx,
    s.refreshed ? 'Refreshed at 47.33 ms' : 'Computed at 70 ms',
    587,
    112,
    20,
    C.ink,
    'left',
    'Serif',
  );
  data.forEach((x, i) => {
    const y = 152 + i * 37,
      r = s.q[i][0];
    text(ctx, x + ' ms', 583, y + 7, 15, C.soft, 'left', 'Mono');
    split(ctx, 645, y, 179, 15, r);
    text(ctx, fmt(r, 3), 842, y + 7, 17, C.fast, 'left', 'Mono');
  });
  text(ctx, 'Bound  ' + fmt(s.lower, 3), 587, 378, 20, C.gold, 'left', 'Mono');
  text(ctx, 'Log likelihood  ' + fmt(s.likelihood, 3), 587, 410, 20, C.sum, 'left', 'Mono');
  if (b === 2 || b === 3)
    text(
      ctx,
      fmt(bound.numerator, 3) + ' / ' + fmt(bound.count, 3) + '  (weighted time / count)',
      65,
      413,
      18,
      C.soft,
      'left',
      'Mono',
    );
  if (b >= 8)
    text(
      ctx,
      fmt(bound.oldLikelihood, 3) +
        '   ≤   ' +
        fmt(bound.oldBoundNew, 3) +
        '   ≤   ' +
        fmt(bound.newLikelihood, 3),
      297,
      414,
      25,
      C.ink,
      'center',
      'Mono',
    );
}
export function iterations(ctx, clock) {
  const b = clock.beat.beatIndex + 1;
  let index = cue(clock, 1, 'One E-step and M-step');
  if (b === 3) index = 1 + Math.floor(7 * cue(clock, 3, 'Follow the dots', 3.4));
  const model = trajectory[index];
  head(ctx, 'Log likelihood after each complete update');
  const g = graph(
    ctx,
    [88, 157, 541, 210],
    [0, 8],
    [-31, -16],
    [0, 2, 4, 6, 8],
    [-30, -26, -22, -18],
    'EM updates',
    'Training log likelihood',
  );
  const pts = trajectory.slice(0, index + 1).map((m, i) => [g.X(i), g.Y(displayScore(m))]);
  path(ctx, pts, C.sum, 3.3);
  pts.forEach(([x, y]) => dot(ctx, x, y, 5, C.sum));
  readout(ctx, 'Completed updates', String(index), 677, 131, C.ink);
  readout(ctx, 'Log likelihood', fmt(displayScore(model), 3), 677, 236, C.sum, 31);
  text(ctx, 'Means (ms)', 677, 345, 18, C.soft);
  model.means.forEach((mu, k) =>
    text(ctx, fmt(mu, 2), 677 + 115 * k, 390, 24, colors[k], 'left', 'Mono'),
  );
}

import {
  C,
  colors,
  cue,
  mix,
  fmt,
  pct,
  total,
  rect,
  line,
  path,
  dot,
  text,
  head,
  readout,
  graph,
  split,
  pin,
} from './drawing.mjs';
import {
  data,
  normal,
  fitted,
  symmetricFit,
  displayScore,
  expScores,
  stable,
  shares,
  update,
  squaredContributions,
  varianceObjective,
  averageLog,
  twoPeaks,
  pooled,
  broadContribution,
  validation,
  nestedModel,
} from './experiments.mjs';

export function precision(ctx, clock) {
  const b = clock.beat.beatIndex + 1,
    s = stable(expScores);
  if (b >= 9) {
    head(ctx, 'A small share at a long distance');
    const i = 5,
      mu = update.means[0],
      x = data[i],
      scale = (v) => 82 + v * 8.3;
    line(ctx, scale(0), 216, scale(100), 216, C.soft, 2);
    for (const v of data) {
      line(ctx, scale(v), 216, scale(v), 236, C.gold, 2);
    }
    line(ctx, scale(mu), 191, scale(mu), 231, C.fast, 3);
    text(ctx, 'Fast mean ' + fmt(mu, 2), scale(mu), 168, 20, C.fast, 'center', 'Mono');
    text(ctx, x + ' ms', scale(x), 168, 22, C.gold, 'center', 'Mono');
    line(ctx, scale(mu), 203, scale(x), 203, C.gold, 1.5, [4, 4]);
    text(
      ctx,
      'Δ = ' + fmt(x - mu, 2) + ' ms',
      (scale(mu) + scale(x)) / 2,
      140,
      20,
      C.gold,
      'center',
      'Mono',
    );
    readout(ctx, 'Fast share at 94 ms', pct(shares[i][0], 2), 74, 315, C.fast, 32);
    if (b >= 10) {
      readout(
        ctx,
        'Share × distance²',
        fmt(squaredContributions[i], 2) + ' ms²',
        350,
        315,
        C.gold,
        29,
      );
      readout(
        ctx,
        'Variance from all six',
        fmt(total(squaredContributions) / update.effective[0], 2) + ' ms²',
        656,
        315,
        C.fast,
        27,
      );
    }
    if (b === 11)
      text(
        ctx,
        fmt(update.weights[0], 4) + ' + ' + fmt(update.weights[1], 4) + ' = 1',
        480,
        407,
        25,
        C.ink,
        'center',
        'Mono',
      );
    return;
  }
  if (b === 7 || b === 8) {
    head(
      ctx,
      b === 7 ? 'When normalization has no denominator' : 'When a fitted component is empty',
    );
    if (b === 7) {
      readout(ctx, 'Fast log score', '−∞', 90, 163, C.fast, 52);
      readout(ctx, 'Slow log score', '−∞', 340, 163, C.slow, 52);
      text(ctx, 'Both weights are zero', 90, 329, 26, C.ink, 'left', 'Serif');
      text(ctx, 'Check the latency, weights and variances.', 90, 388, 22, C.gold);
    } else {
      for (let i = 0; i < 6; i++) split(ctx, 90 + i * 125, 211, 100, 26, 1);
      readout(ctx, 'Slow effective count', '0.000', 95, 326, C.slow, 36);
      text(ctx, 'Restart the component before dividing.', 385, 375, 24, C.ink, 'left', 'Serif');
    }
    return;
  }
  const shifted = cue(clock, 3, 'subtracting it from both');
  const exponent = cue(clock, 1, 'Exponentiate them directly');
  const shiftExp = cue(clock, 3, 'Now exponentiate');
  const normalized = cue(clock, 5, 'first component gets');
  head(ctx, 'Move the origin of the log scores');
  const max = shifted ? 0 : s.max;
  text(ctx, 'Log score', 80, 142, 19, C.soft);
  line(ctx, 88, 218, 865, 218, C.soft);
  for (let i = 0; i < 5; i++) {
    const x = 152 + i * 162,
      v = max + i - 3;
    line(ctx, x, 215, x, 228, C.soft, 2);
    text(ctx, v.toString().replace('-', '−'), x, 260, 20, C.soft, 'center', 'Mono');
    if (i === 1 || i === 3) dot(ctx, x, 218, 9, i === 1 ? C.slow : C.fast);
  }
  line(ctx, 314, 183, 638, 183, C.gold, 2);
  text(ctx, '2 log units', 476, 156, 20, C.gold, 'center');
  if ((!shifted && exponent) || (shifted && shiftExp)) {
    const values = shifted ? s.weights : expScores.map(Math.exp);
    readout(ctx, 'Fast weight', fmt(values[0], 3), 93, 317, C.fast, 31);
    readout(ctx, 'Slow weight', fmt(values[1], 3), 340, 317, C.slow, 31);
    if (normalized) {
      split(ctx, 589, 334, 278, 21, s.shares[0]);
      text(
        ctx,
        pct(s.shares[0], 1) + ' / ' + pct(s.shares[1], 1),
        589,
        389,
        20,
        C.ink,
        'left',
        'Mono',
      );
      text(
        ctx,
        'log total = −1000 + log(1 + 0.135…) = ' + fmt(s.logTotal, 3),
        480,
        412,
        20,
        C.ink,
        'center',
        'Mono',
      );
    } else if (!shifted && b >= 2)
      readout(ctx, 'Normalize', b === 2 ? '0 / 0 = ?' : 'undefined', 590, 317, C.gold, 28);
  }
}
function spike(ctx, sd, withFloor = false, showCoverage = false) {
  const g = graph(
    ctx,
    [81, 149, 520, 218],
    [20, 100],
    [0, 1.1],
    [28, 50, 70, 90],
    [0, 0.5, 1],
    'Request time (ms)',
    'Weighted component density per ms',
  );
  const fn = (x) => 0.5 * normal(x, 28, sd ** 2),
    floorSd = Math.max(1, sd);
  g.trace(broadContribution, C.fast, 3);
  g.trace(fn, C.slow, 3);
  if (withFloor) g.trace((x) => 0.5 * normal(x, 28, floorSd ** 2), C.sum, 3);
  data.forEach((x) => line(ctx, g.X(x), g.b, g.X(x), g.b - 8, C.gold, 2));
  readout(ctx, 'Spike deviation', fmt(sd, 2) + ' ms', 652, 137, C.slow, 28);
  readout(ctx, 'Weighted peak', fmt(fn(28), 3) + ' / ms', 652, 227, C.slow, 27);
  if (withFloor)
    readout(
      ctx,
      'Floored peak',
      fmt(0.5 * normal(28, 28, floorSd ** 2), 3) + ' / ms',
      652,
      355,
      C.sum,
      27,
    );
  else if (showCoverage) {
    text(ctx, 'Broad component', 647, 307, 22, C.fast, 'left', 'Serif');
    text(ctx, 'Time (ms)', 648, 332, 16, C.soft);
    text(ctx, 'Weighted density / ms', 916, 332, 16, C.soft, 'right');
    for (const [i, time] of data.slice(1).entries()) {
      const value = broadContribution(time);
      const y = 349 + 17 * i;
      dot(ctx, g.X(time), g.Y(value), 3.5, C.fast);
      text(ctx, time, 649, y, 17, C.gold, 'left', 'Mono');
      text(ctx, fmt(value, 6), 916, y, 18, C.fast, 'right', 'Mono');
    }
  } else text(ctx, 'Broad component', 652, 372, 22, C.fast, 'left', 'Serif');
}
export function floor(ctx, clock) {
  const b = clock.beat.beatIndex + 1;
  if (b <= 2) {
    head(ctx, 'One component can follow a single point');
    spike(ctx, mix(3, 0.21, cue(clock, 1, 'variance approaches zero', 2.4)), false, b === 2);
    return;
  }
  if (b === 5) {
    head(ctx, 'A fixed floor caps each Gaussian peak');
    const g = graph(
      ctx,
      [83, 155, 492, 213],
      [24, 32],
      [0, 0.42],
      [24, 26, 28, 30, 32],
      [0, 0.2, 0.4],
      'Request time (ms)',
      'Component density per ms',
    );
    const cap = normal(28, 28, 1);
    g.trace((x) => normal(x, 28, 1), C.sum, 3.4);
    line(ctx, g.l, g.Y(cap), g.l + g.w, g.Y(cap), C.gold, 1.5, [4, 4]);
    dot(ctx, g.X(28), g.Y(cap), 6, C.sum);
    readout(ctx, 'Minimum variance', '1 ms²', 632, 152, C.sum, 31);
    readout(ctx, 'Maximum density', fmt(cap, 3) + ' / ms', 632, 263, C.gold, 28);
    text(ctx, 'All mixture weights sum to one.', 632, 389, 17, C.soft);
    return;
  }
  head(ctx, 'Maximize Q over feasible variances');
  const g = graph(
    ctx,
    [86, 161, 491, 206],
    [0.05, 2.1],
    [-4.5, 1],
    [0.25, 1, 1.5, 2],
    [-4, -2, 0],
    'Variance (ms²)',
    'Variance-dependent part of Q',
  );
  rect(ctx, g.X(1), g.t, g.X(2.1) - g.X(1), g.h, '#89ddb918');
  g.trace(varianceObjective, C.soft, 2.6);
  g.trace(varianceObjective, C.sum, 3.2, 1, 2.1);
  line(ctx, g.X(1), g.t, g.X(1), g.b, C.sum, 1.5, [4, 4]);
  text(ctx, 'v ≥ 1', g.X(1) + 12, g.t + 21, 18, C.sum);
  text(ctx, 'N = 4       S = 1', 622, 148, 22, C.ink, 'left', 'Mono');
  text(ctx, 'Q(v) = −2 log v − 1/(2v)', 622, 196, 18, C.soft, 'left', 'Mono');
  if (b === 4) {
    dot(ctx, g.X(0.25), g.Y(varianceObjective(0.25)), 6, C.soft);
    readout(ctx, 'Free optimum', '0.25 ms²', 622, 245, C.soft, 24);
    if (cue(clock, 4, 'Clamping yields one')) {
      dot(ctx, g.X(1), g.Y(varianceObjective(1)), 7, C.sum);
      text(
        ctx,
        'Clamp  1.00  Q = ' + fmt(varianceObjective(1)),
        622,
        353,
        18,
        C.sum,
        'left',
        'Mono',
      );
    }
    if (cue(clock, 4, 'Adding a ridge')) {
      dot(ctx, g.X(1.25), g.Y(varianceObjective(1.25)), 6, C.gold);
      text(
        ctx,
        'Ridge  1.25  Q = ' + fmt(varianceObjective(1.25)),
        622,
        406,
        18,
        C.gold,
        'left',
        'Mono',
      );
    }
  }
}
export function starts(ctx, clock) {
  const b = clock.beat.beatIndex + 1;
  if (b === 3) {
    head(ctx, 'Release the spread, or keep its floor');
    spike(ctx, mix(3, 0.21, cue(clock, 3, 'spread shrinks', 2.5)), true);
    return;
  }
  if (!cue(clock, 2, 'Compare the training scores')) {
    head(ctx, 'Two identical components');
    data.forEach((x, i) => {
      const px = 85 + i * 146;
      text(ctx, x + ' ms', px + 28, 163, 18, C.gold, 'center', 'Mono');
      split(ctx, px - 22, 194, 100, 24, 0.5);
    });
    const answer = cue(clock, 2, 'Both return to sixty');
    for (let k = 0; k < 2; k++) {
      const y = 285 + k * 80;
      text(ctx, k ? 'Slow' : 'Fast', 69, y, 22, colors[k]);
      text(ctx, '½ × (28 + 30 + 32 + 86 + 90 + 94) / 3', 166, y, 20, colors[k], 'left', 'Mono');
      text(ctx, answer ? '= 60 ms' : '= ?', 717, y, 25, colors[k], 'left', 'Mono');
    }
    if (cue(clock, 2, 'both variances equal'))
      text(
        ctx,
        'Each variance   ' + fmt(symmetricFit.model.variances[0], 2) + ' ms²',
        480,
        412,
        21,
        C.ink,
        'center',
        'Mono',
      );
  } else {
    head(ctx, 'Same data, different starting means');
    const g = graph(
      ctx,
      [89, 152, 489, 215],
      [0, 120],
      [0, 0.13],
      [0, 30, 60, 90, 120],
      [0, 0.06, 0.12],
      'Request time (ms)',
      'Fitted mixture density per ms',
    );
    g.trace(pooled, C.slow, 3);
    g.trace(twoPeaks, C.sum, 3);
    readout(
      ctx,
      'Start at 60 and 60',
      fmt(displayScore(symmetricFit.model), 3),
      626,
      168,
      C.slow,
      30,
    );
    readout(ctx, 'Start at 25 and 95', fmt(displayScore(fitted.model), 3), 626, 276, C.sum, 30);
    text(ctx, 'Final training log likelihood', 626, 373, 18, C.soft);
  }
}
export function validate(ctx, clock) {
  const b = clock.beat.beatIndex + 1;
  const g = graph(
    ctx,
    [87, 147, 498, 220],
    [-10, 110],
    [0, 0.13],
    [0, 30, 60, 90],
    [0, 0.06, 0.12],
    'Request time (ms)',
    'Density per ms',
  );
  if (b <= 3) {
    head(ctx, 'Four requests held out of training');
    g.trace(pooled, C.slow);
    g.trace(twoPeaks, C.sum);
    validation.forEach((x) => {
      const px = g.X(x);
      line(ctx, px, g.b, px, g.Y(twoPeaks(x)), C.gold, 1.4);
      dot(ctx, px, g.Y(twoPeaks(x)), 3.5, C.sum);
      dot(ctx, px, g.Y(pooled(x)), 3.5, C.slow);
      dot(ctx, px, g.b, 4, C.gold);
    });
    text(ctx, '29, 31, 88, 92 ms', 626, 126, 20, C.gold, 'left', 'Mono');
    text(ctx, 'Mean log density', 626, 201, 22, C.ink, 'left', 'Serif');
    readout(
      ctx,
      'Separated fit',
      cue(clock, 3, 'separated fit scores') ? fmt(averageLog(fitted.model)) : '?',
      626,
      261,
      C.sum,
      29,
    );
    readout(
      ctx,
      'Symmetric fit',
      cue(clock, 3, 'symmetric fit scores') ? fmt(averageLog(symmetricFit.model)) : '?',
      626,
      365,
      C.slow,
      29,
    );
    return;
  }
  if (b <= 5) {
    head(ctx, 'Split a peak into identical twins');
    const m = nestedModel(cue(clock, 4, 'Split its weight', 1.4));
    g.trace(twoPeaks, C.sum, 5);
    m.weights.forEach((w, k) => {
      if (w > 0)
        g.trace((x) => w * normal(x, m.means[k], m.variances[k]), [C.fast, C.gold, C.slow][k], 2);
      text(ctx, ['First', 'Twin', 'Second'][k], 628, 180 + k * 62, 18, [C.fast, C.gold, C.slow][k]);
      text(
        ctx,
        fmt(w, 3) + ' × N(' + m.means[k].toFixed(0) + ', …)',
        712,
        180 + k * 62,
        17,
        C.ink,
        'left',
        'Mono',
      );
    });
    text(ctx, 'Sum of all three', 628, 343, 23, C.sum, 'left', 'Serif');
    if (b === 5) {
      text(ctx, 'Compare starts on training data.', 628, 380, 17, C.ink);
      text(ctx, 'Compare sizes on held-out data.', 628, 406, 17, C.ink);
    }
  } else {
    head(ctx, b === 6 ? 'Swap the component names' : 'Check the simulated tails');
    const swapped = Boolean(cue(clock, 6, 'trade places'));
    if (b === 6) {
      g.trace(twoPeaks, C.sum, 6);
      fitted.model.means.forEach((mu, k) => {
        const c = colors[swapped ? 1 - k : k];
        g.trace((x) => 0.5 * normal(x, mu, fitted.model.variances[k]), c, 2);
        readout(
          ctx,
          (swapped ? 1 - k : k) ? 'Component B' : 'Component A',
          'μ = ' + fmt(mu, 0) + ' ms',
          628,
          158 + 110 * k,
          c,
          28,
        );
      });
      const draw = cue(clock, 6, 'lands at ninety-two milliseconds');
      if (draw) {
        const sampled = 92,
          px = g.X(sampled);
        line(ctx, px, g.b, px, g.Y(twoPeaks(sampled)), C.gold, 2);
        dot(ctx, px, g.b, 5, C.gold);
        text(ctx, 'Sampled time   ' + sampled + ' ms', 628, 392, 20, C.gold);
      } else text(ctx, 'Summed density', 628, 392, 21, C.sum);
    } else {
      // A Gaussian with appreciable negative mass makes the support mismatch visible.
      const fn = (x) => normal(x, 8, 100);
      g.trace(fn, C.fast);
      g.trace(fn, C.gold, 2, -10, 0, '#efc06b6b');
      pin(ctx, g, 0, '0 ms');
      text(ctx, 'Tail check', 628, 159, 27, C.ink, 'left', 'Serif');
      text(ctx, 'Example: N(8, 10²) ms', 628, 231, 19, C.fast, 'left', 'Mono');
      text(ctx, 'A request duration is ≥ 0.', 628, 296, 19, C.gold);
      text(ctx, 'A positive-support model', 628, 363, 19, C.soft);
      text(ctx, 'enforces that limit.', 628, 392, 19, C.soft);
    }
  }
}

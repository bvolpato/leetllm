import assert from 'node:assert/strict';
import {
  QUANT_WEIGHTS as source,
  CALIBRATION,
  HELD_OUT,
  AWQ_INPUTS,
} from '../../../films/quantization/fixtures.mjs';
import {
  awqError,
  awqReconstruct,
  precisionExperiment,
  calibrationHessian,
  gptqFrame,
  squaredOutputError,
} from '../../../films/quantization/arithmetic.mjs';
import {
  night,
  day,
  base,
  txt,
  num,
  box,
  line,
  dot,
  arrow,
  span,
  alpha,
  cue,
  spoken,
  fmt,
  tuple,
  smooth,
  mix,
  clamp,
  result,
} from './paint.mjs';

const dotProduct = (w, x) => w.reduce((s, v, i) => s + v * x[i], 0);
const columns = (m) => m[0].map((_, j) => m.map((r) => r[j]));
const cal = columns(CALIBRATION),
  fresh = columns(HELD_OUT),
  targets = cal.map((x) => dotProduct(source, x));
const h = calibrationHessian();
const nearest = gptqFrame({ nearest: 1 })[0],
  fixed = gptqFrame({ first: 1 })[1];
const adjusted = gptqFrame({ first: 1, compensation: 1 })[1],
  integer = gptqFrame({ first: 1, compensation: 1, last: 1 })[1];
const models = [nearest, integer];
const absWeightError = 0.05,
  signals = [0.1, 2];
export function sensitivity(ctx, c) {
  const P = night;
  base(ctx, P, 'One weight  /  two input levels', c.beat.chapterTitle);
  num(ctx, 'Δw = +0.05', 103, 320, 55, P.gold);
  txt(ctx, 'Change in output  =  input × change in weight', 1809, 320, 38, P.muted, 'right');
  const origin = 670,
    range = 1050;
  signals.forEach((x, i) => {
    const y = 493 + i * 213,
      col = i ? P.gold : P.mint,
      delta = absWeightError * x;
    const visit = i ? cue(c, 2, 'That is twenty', 0.5) : cue(c, 1, 'Leave that distance', 0.5);
    txt(ctx, i ? 'Active input' : 'Quiet input', 105, y - 22, 45, P.ink);
    num(ctx, '× ' + fmt(x), 110, y + 47, 46, P.muted);
    line(ctx, origin, y, origin + range, y, P.rule, 4);
    line(ctx, origin, y - 22, origin, y + 22, P.ink, 4);
    alpha(ctx, visit, () => {
      const end = origin + (range * delta) / 0.1;
      line(ctx, origin, y, end, y, col, 17);
      dot(ctx, end, y, 14, col);
      num(ctx, '+' + fmt(delta), end, y - 58, 45, col, 'center');
    });
  });
  if (c.beat.beatIndex === 2)
    alpha(ctx, cue(c, 2, 'That is twenty', 0.5), () =>
      result(ctx, P, 'Same change in the weight', '0.100 / 0.005 = 20'),
    );
}
function matrix(ctx, P, m, x, y, cell, accent = P.ink) {
  const n = m.length,
    k = m[0].length,
    lh = n * cell;
  for (const [offset, d] of [
    [0, 1],
    [k * cell, -1],
  ]) {
    line(ctx, x + offset, y, x + offset, y + lh, P.rule, 4);
    line(ctx, x + offset, y, x + offset + d * 16, y, P.rule, 4);
    line(ctx, x + offset, y + lh, x + offset + d * 16, y + lh, P.rule, 4);
  }
  m.forEach((row, i) =>
    row.forEach((v, j) =>
      num(ctx, fmt(v), x + (j + 0.5) * cell, y + (i + 0.5) * cell, cell * 0.43, accent, 'center'),
    ),
  );
}
export function curvature(ctx, c) {
  const P = day,
    b = c.beat.beatIndex;
  base(ctx, P, 'Calibration  /  two observed inputs', c.beat.chapterTitle);
  txt(ctx, 'Input columns', 106, 316, 46, P.ink);
  matrix(ctx, P, CALIBRATION, 165, 430, 137, P.blue);
  num(ctx, 'x₁', 231, 767, 39, P.blue, 'center');
  num(ctx, 'x₂', 368, 767, 39, P.blue, 'center');
  if (b === 0) {
    for (let i = 0; i < 2; i++) {
      const a = cue(c, 0, i ? 'Four arrives' : 'Five arrives', 0.45);
      alpha(ctx, a, () => {
        const x = 805 + i * 500;
        txt(ctx, 'Observation ' + (i + 1), x, 406, 39, P.muted);
        for (let j = 0; j < 2; j++) {
          const y = 520 + j * 120;
          num(ctx, fmt(cal[i][j]), x, y, 48, P.blue);
          box(ctx, x + 85, y - 15, cal[i][j] * 50, 29, P.blue);
        }
      });
    }
    return;
  }
  if (b === 3) {
    txt(ctx, 'Source weights', 670, 317, 43, P.muted);
    num(ctx, tuple(source), 675, 421, 57, P.gold);
    for (let i = 0; i < 2; i++) {
      const y = 569 + 128 * i;
      num(ctx, tuple(source) + ' · ' + tuple(cal[i]), 673, y, 49, P.ink);
      alpha(ctx, cue(c, 3, 'Those are the two', 0.45), () =>
        num(ctx, '= ' + fmt(targets[i]), 1480, y, 55, P.mint),
      );
    }
    return;
  }
  const add = cue(c, 1, 'Add the square', 0),
    twice = cue(c, 1, 'Double the sum', 0);
  const first = calibrationHessian(1).map((row) => row.map((v) => v / 2));
  const second = h.map((row, i) => row.map((v, j) => v / 2 - first[i][j]));
  txt(
    ctx,
    twice ? 'Hessian of summed squared error' : 'One outer product per observation',
    675,
    321,
    43,
    P.ink,
  );
  matrix(ctx, P, first, 687, 452, 104, P.blue);
  if (add) {
    num(ctx, '+', 938, 559, 45, P.muted, 'center');
    matrix(ctx, P, second, 1002, 452, 104, P.blue);
    num(ctx, twice ? '× 2 after adding' : 'sum', 955, 757, 38, P.muted, 'center');
    arrow(ctx, 1269, 558, 1388, 558, P.muted);
    matrix(ctx, P, twice ? h : h.map((r) => r.map((v) => v / 2)), 1472, 452, 117, P.mint);
  }
  if (b === 2) {
    if (cue(c, 2, 'The off-diagonal', 0)) {
      box(ctx, 1589, 452, 117, 117, null, P.gold, 4);
      box(ctx, 1472, 569, 117, 117, null, P.gold, 4);
      const products = cal.map(([a, b]) => a + ' × ' + b);
      result(ctx, P, 'Uncentered cross-product', '2 × (' + products.join(' + ') + ') = ' + h[0][1]);
    } else result(ctx, P, 'Energy on the diagonal', 'H = 2 X Xᵀ');
  }
}
function outputRails(ctx, P, weights, showNumbers = true) {
  const x0 = 740,
    x1 = 1754,
    min = 4,
    max = 7.5,
    at = (v) => mix(x0, x1, (v - min) / (max - min));
  for (let i = 0; i < 2; i++) {
    const out = dotProduct(weights, cal[i]),
      target = targets[i],
      y = 447 + i * 229;
    const ox = at(out),
      tx = at(target);
    txt(ctx, 'Input ' + tuple(cal[i]), 100, y - 31, 42, P.ink);
    num(ctx, 'target ' + fmt(target), 104, y + 37, 37, P.muted);
    line(ctx, x0, y, x1, y, P.rule, 3);
    line(ctx, tx, y - 50, tx, y + 50, P.gold, 6);
    line(ctx, Math.min(ox, tx), y, Math.max(ox, tx), y, P.mint, 12);
    dot(ctx, ox, y, 14, P.mint);
    if (showNumbers) num(ctx, fmt(out, 2), ox, y - 65, 44, P.mint, 'center');
    num(ctx, fmt(target), tx, y + 67, 34, P.gold, 'center');
  }
}
export function compensate(ctx, c) {
  const P = night,
    b = c.beat.beatIndex;
  base(ctx, P, 'GPTQ  /  keep calibration outputs close', c.beat.chapterTitle);
  if (b >= 4) {
    const free = cue(c, 4, 'Keep the second row', 0.7),
      inv = cue(c, 4, 'Keeping the old', 0.4);
    txt(ctx, 'Full Hessian', 114, 330, 45, P.ink);
    matrix(ctx, P, h, 160, 425, 133, P.ink);
    alpha(ctx, free, () => {
      box(ctx, 293, 558, 133, 133, null, P.gold, 5);
      arrow(ctx, 511, 623, 684, 623, P.gold);
      txt(ctx, 'Still free', 780, 330, 45, P.gold);
      matrix(ctx, P, [[h[1][1]]], 790, 520, 160, P.gold);
    });
    alpha(ctx, inv, () => {
      arrow(ctx, 1045, 604, 1214, 604, P.mint);
      txt(ctx, 'Its inverse', 1345, 330, 45, P.mint);
      matrix(ctx, P, [[1 / h[1][1]]], 1320, 520, 218, P.mint);
    });
    if (b === 4 && inv)
      result(ctx, P, 'Old full inverse diagonal  20.5', 'Free inverse  1 / 4 = 0.25');
    if (b === 5) {
      const start = cue(c, 5, 'Finishing one column', 0.5),
        later = cue(c, 5, 'batch the accumulated corrections', 0.7);
      const yy = 885;
      for (let i = 0; i < 6; i++) {
        const x = 218 + i * 264;
        box(
          ctx,
          x,
          yy - 43,
          224,
          83,
          i === 0 || (i === 1 && start) || (i >= 2 && later) ? (i < 2 ? P.gold : P.blue) : P.soft,
        );
        num(
          ctx,
          i < 2 ? 'col ' + (i + 1) : 'later ' + (i - 1),
          x + 112,
          yy,
          35,
          i === 0 || (i === 1 && start) || (i >= 2 && later) ? P.bg : P.muted,
          'center',
        );
      }
      txt(ctx, 'Sequential columns', 217, 973, 34, P.gold);
      txt(ctx, 'Apply accumulated updates to later columns', 747, 973, 34, P.blue);
    }
    return;
  }
  let row = nearest;
  if (b === 1) row = fixed;
  if (b === 2) row = adjusted;
  if (b === 3) row = cue(c, 3, 'The squared errors', 0) ? integer : adjusted;
  const t = b === 2 ? smooth(cue(c, 2, 'Split the difference', 1.05)) : 1;
  const w =
    b === 2
      ? [fixed.weights[0], Number(mix(fixed.weights[1], row.weights[1], t).toFixed(2))]
      : row.weights;
  txt(
    ctx,
    b === 0
      ? 'Nearest marks'
      : b === 1
        ? 'Lock the first weight'
        : b === 2
          ? 'Adjust the free weight'
          : 'Round the free weight',
    100,
    304,
    43,
    P.muted,
  );
  num(ctx, 'w = ' + tuple(w, 2), 1810, 304, 54, P.ink, 'right');
  outputRails(ctx, P, w);
  const sse = squaredOutputError(w);
  const actual = b !== 3 || cue(c, 3, 'GPTQ uses', 0);
  if (actual)
    result(
      ctx,
      P,
      b === 3
        ? 'Calibration SSE   ·   nearest ' + fmt(nearest.error, 4)
        : 'Sum of squared output errors',
      fmt(sse, 4),
    );
  else
    result(
      ctx,
      P,
      'Calibration SSE   ·   nearest ' + fmt(nearest.error, 4),
      'Square the two misses',
      P.ink,
    );
}
const aw = [0.3, 2],
  example = columns(AWQ_INPUTS)[0],
  factors = [1, 2, 4, 8];
const meanMag = AWQ_INPUTS.map((row) => row.reduce((s, v) => s + Math.abs(v), 0) / row.length);
const awqGrids = [1, 8].map((factor) => {
  const row = [aw[0] * factor, aw[1]];
  const input = [example[0] / factor, example[1]];
  const peak = Math.max(...row.map(Math.abs));
  const step = peak / 7;
  const codes = row.map((v) => Math.round(v / step));
  const contributions = codes.map((q, i) => q * step * input[i]);
  return { row, input, peak, step, codes, contributions };
});
const bracket = (values) => '[' + values.map((v) => fmt(v)).join(', ') + ']';
export function stretch(ctx, c) {
  const P = day,
    b = c.beat.beatIndex;
  base(ctx, P, 'AWQ  /  one shared four-bit grid', c.beat.chapterTitle);
  if (b === 0) {
    txt(ctx, 'Average input magnitude on four observations', 113, 314, 44, P.muted);
    for (let i = 0; i < 2; i++) {
      const y = 472 + i * 211,
        col = i ? P.blue : P.gold;
      txt(ctx, 'Channel ' + (i + 1), 112, y, 53, P.ink);
      box(ctx, 535, y - 33, meanMag[i] * 119, 66, col);
      num(ctx, fmt(meanMag[i]), 565 + meanMag[i] * 119, y, 60, col);
    }
    result(ctx, P, 'First observation', '0.3 × 10');
    return;
  }
  if (b === 4) {
    txt(ctx, 'Scale factor', 126, 340, 41, P.muted);
    txt(ctx, 'Mean squared output error on calibration', 590, 340, 41, P.muted);
    factors.forEach((f, i) => {
      const r = cue(c, 4, i < 3 ? 'Across four' : 'Stretching farther', 0.55),
        v = awqError(f),
        y = 455 + i * 105;
      num(ctx, '× ' + f, 135, y, 52, P.ink);
      alpha(ctx, r, () => {
        box(ctx, 590, y - 20, v * 46500, 40, i === 3 ? P.mint : P.blue);
        num(ctx, v.toFixed(6), 633 + v * 46500, y, 39, P.ink);
      });
    });
    const freshStart = cue(c, 4, 'Check the winner', 0.45);
    alpha(ctx, freshStart, () =>
      result(ctx, P, 'Fresh   (9, 0.5)   (−9, −0.5)', spoken(c, 4) ? 'MSE ≈ 0.000816' : 'Factor 8'),
    );
    return;
  }
  if (b === 3) {
    awqGrids.forEach(({ row, input, peak, step, codes, contributions }, i) => {
      const x = 110 + i * 900, col = i ? P.mint : P.gold;
      txt(ctx, i ? 'After stretching channel 1' : 'Original coordinates', x, 293, 44, col);
      num(ctx, 'Weights  ' + bracket(row), x, 372, 43, P.ink);
      num(ctx, 'Inputs   ' + bracket(input), x, 436, 43, P.ink);
      if (!cue(c, 3, i ? 'After stretching' : 'The original step', 0)) return;
      const unit = 275;
      num(ctx, 'Step = ' + fmt(peak) + '/7', x, 525, 39, col);
      line(ctx, x, 592, x + peak * unit, 592, P.rule, 3);
      for (let q = 0; q <= 7; q++) {
        const at = x + q * step * unit;
        line(ctx, at, 579, at, 605, col, 4);
      }
      num(ctx, '0', x, 635, 32, P.muted, 'center');
      num(ctx, fmt(peak), x + peak * unit, 635, 32, P.muted, 'center');
      if (!cue(c, 3, i ? 'The codes become' : 'Rounding gives', 0)) return;
      num(ctx, 'Codes    ' + bracket(codes), x, 714, 43, col);
      codes.forEach((q) => dot(ctx, x + q * step * unit, 592, 11, col));
      const showContribution = (k, phrase) => {
        if (!cue(c, 3, phrase, 0)) return;
        const y = 815 + k * 108;
        txt(ctx, k ? 'Neighbor' : 'Channel 1', x, y, 33, P.muted);
        const eq = codes[k] + ' × ' + fmt(peak) + '/7 × ' + fmt(input[k]);
        num(ctx, eq + (codes[k] === 7 ? ' = ' : ' ≈ ') + fmt(contributions[k]), x + 183, y, 37, P.ink);
      };
      showContribution(0, i ? 'Seven wider steps' : 'One step times ten');
      showContribution(1, i ? 'Six wider steps' : 'Seven original steps');
    });
    return;
  }
  const progress = smooth(cue(c, 1, 'Watch the rectangle', 1.55)),
    f = mix(1, 8, progress);
  const w = aw[0] * f,
    input = example[0] / f;
  const x = 183,
    y = 745,
    cw = input * 88,
    ch = w * 134;
  txt(ctx, 'Weight × activation', 118, 323, 47, P.ink);
  box(ctx, x, y - ch, cw, ch, P.mint);
  if (progress > 0) {
    ctx.save();
    ctx.setLineDash([11, 9]);
    box(ctx, x, y - aw[0] * 134, example[0] * 88, aw[0] * 134, null, P.gold, 3);
    ctx.restore();
    txt(ctx, 'Original outline', 700, 659, 33, P.gold);
  }
  line(ctx, x, 372, x, 745, P.ink, 3);
  line(ctx, x, 745, 1120, 745, P.ink, 3);
  span(ctx, x, x + cw, 774, P.mint);
  num(ctx, 'input ' + fmt(input, 2), x, 822, 42, P.ink);
  num(ctx, 'Weight   ' + fmt(w, 2), 1207, 476, 46, P.ink);
  num(ctx, 'Input    ' + fmt(input, 2), 1207, 596, 46, P.ink);
  if (b === 2)
    alpha(ctx, cue(c, 2, 'At the new coordinates', 0.45), () =>
      num(ctx, 'Area     ' + fmt(w * input), 1207, 733, 47, P.mint),
    );
  if (b === 2 && cue(c, 2, 'The other channel', 0)) {
    txt(ctx, 'Neighbor in both rows', 113, 934, 43, P.muted);
    num(ctx, 'weight 2 × input 1', 1210, 934, 46, P.ink);
  }
}
function outputPair(ctx, P, x, y, input, model, p, accent) {
  const min = 0,
    max = 2.2,
    axis = 518,
    at = (v) => x + (axis * v) / (max - min);
  const target = dotProduct(source, input);
  line(ctx, x, y, x + axis, y, P.rule, 3);
  line(ctx, at(target), y - 26, at(target), y + 29, P.gold, 5);
  const v = dotProduct(model.weights, input);
  alpha(ctx, p, () => {
    line(ctx, at(Math.min(v, target)), y, at(Math.max(v, target)), y, accent, 11);
    dot(ctx, at(v), y, 13, accent);
    num(ctx, fmt(v), at(v), y - 58, 43, accent, 'center');
  });
}
export function probes(ctx, c) {
  const P = night,
    b = c.beat.beatIndex;
  base(ctx, P, 'Held-out test  /  fixed weights', c.beat.chapterTitle);
  const input1 = b >= 1,
    input2 = b >= 2;
  const p1 = cue(c, 1, 'This first probe', 0.4),
    p2 = cue(c, 3, 'The distances', 0.45);
  txt(ctx, 'Candidate weights', 103, 300, 39, P.muted);
  if (input1) {
    txt(ctx, 'First channel alone', 681, 300, 39, P.muted);
    num(ctx, 'x = (1, 0)', 681, 369, 40, P.ink);
  }
  if (input2) {
    txt(ctx, 'Second channel alone', 1260, 300, 39, P.muted);
    num(ctx, 'x = (0, 1)', 1260, 369, 40, P.ink);
  }
  models.forEach((m, i) => {
    const y = 507 + i * 205,
      col = i ? P.blue : P.mint;
    txt(ctx, i ? 'Compensated' : 'Nearest', 104, y - 38, 45, col);
    num(ctx, tuple(m.weights), 104, y + 31, 54, P.ink);
    if (input1) num(ctx, 'Calibration SSE  ' + fmt(m.error, 4), 107, y + 94, 30, P.muted);
    if (!input1) {
      txt(ctx, 'Calibration SSE', 721, y - 36, 37, P.muted);
      box(ctx, 724, y + 23, m.error * 1350, 25, col);
      num(ctx, fmt(m.error, 4), 780 + m.error * 1350, y + 35, 45, col);
    }
    if (input1) outputPair(ctx, P, 679, y, fresh[0], m, p1, col);
    if (input2) outputPair(ctx, P, 1260, y, fresh[1], m, p2, col);
  });
  if (input1) num(ctx, 'Target  ' + fmt(dotProduct(source, fresh[0])), 679, 794, 35, P.gold);
  if (input2) num(ctx, 'Target  ' + fmt(dotProduct(source, fresh[1])), 1260, 794, 35, P.gold);
  if (b === 0) result(ctx, P, 'Calibration inputs', cal.map((x) => tuple(x)).join('   '));
  if (b === 1) alpha(ctx, p1, () => result(ctx, P, 'First probe', 'Both miss by 0.2', P.ink));
  if (b === 3)
    alpha(ctx, cue(c, 3, 'Keep the two marks', 0.4), () =>
      result(ctx, P, 'Second probe   ·   absolute misses', '0.39  <  1.39'),
    );
  if (b >= 4) {
    const r = cue(c, 4, 'The calibration ranking', 0.45);
    alpha(ctx, r, () =>
      result(
        ctx,
        P,
        'Fresh SSE   ·   nearest vs. compensated',
        models.map((m) => fmt(squaredOutputError(m.weights, HELD_OUT), 4)).join('  <  '),
      ),
    );
  }
}

const sweeps = [2, 4, 8].map(precisionExperiment);
const coarse = sweeps[0];
const probes2Bit = columns(coarse.inputs).map((input, i) => ({
  input,
  sourceOutput: dotProduct(coarse.weights, input),
  rebuiltOutput: dotProduct(coarse.restored, input),
  residual: coarse.residuals[i],
}));
export function widthTrial(ctx, c) {
  const P = day, b = c.beat.beatIndex;
  base(ctx, P, 'Held-out layer test  /  three fixed inputs', c.beat.chapterTitle);
  const left = 401, step = 240;
  txt(ctx, 'Source', 100, 294, 41, P.muted);
  coarse.weights.forEach((v, k) => num(ctx, fmt(v), left + k * step, 294, 45, P.ink, 'center'));
  txt(ctx, 'Output MSE', 1425, 294, 37, P.muted, 'center');
  txt(ctx, 'Code bytes', 1709, 294, 37, P.muted, 'center');
  line(ctx, 90, 342, 1828, 342, P.rule);
  sweeps.forEach((s, i) => {
    const y = 407 + i * 88;
    const col = i ? P.blue : P.gold;
    txt(ctx, s.bits + ' bits', 101, y, 43, col);
    const on = i === 0 ? cue(c, 0, 'With a step of two', 0.5)
      : cue(c, 1, i === 1 ? 'Four bits separates' : 'Eight bits places', 0.5);
    alpha(ctx, on, () => {
      s.restored.forEach((v, k) => num(ctx, fmt(v), left + k * step, y, 41, col, 'center'));
    });
    if (cue(c, 2, ['The two-bit mean', 'Four bits brings', 'eight bits to about'][i], 0))
      num(ctx, fmt(s.mse, 6), 1425, y, 40, col, 'center');
    if (cue(c, 2, 'The corresponding code payloads', 0)) {
      for (let n = 0; n < s.payload; n++) box(ctx, 1590 + n * 40, y - 16, 34, 32, P.mint);
      num(ctx, s.payload, 1824, y, 38, P.mint, 'right');
    }
  });
  if (!cue(c, 1, 'Start with the first input', 0)) return;
  line(ctx, 90, 646, 1830, 646, P.rule, 2);
  txt(ctx, '2-bit output error   ·   source minus reconstruction', 100, 694, 39, P.gold);
  probes2Bit.forEach(({ input, sourceOutput, rebuiltOutput, residual }, i) => {
    if (i && !cue(c, 2, 'On the other two inputs', 0)) return;
    const x = 100 + i * 598;
    num(ctx, 'x = ' + bracket(input), x, 773, 35, P.ink);
    if (!cue(c, 1, 'The source gives', 0)) return;
    const difference = cue(c, 2, 'The first difference', 0) ? fmt(residual, 2) : '?';
    num(ctx, fmt(sourceOutput) + ' − (' + fmt(rebuiltOutput) + ') = ' + difference, x, 842, 39, P.ink);
  });
  if (cue(c, 2, 'Square each difference', 0)) {
    const squares = probes2Bit.map(({ residual }) => Math.abs(residual).toFixed(2) + '²');
    const answer = cue(c, 2, 'The two-bit mean', 0) ? fmt(coarse.mse, 4) : '?';
    num(ctx, '(' + squares.join(' + ') + ') / 3 = ' + answer, 100, 952, 45, P.mint);
  }
}
export function checkCalibration() {
  assert.equal(signals[1] / signals[0], 20);
  assert.deepEqual(h, [
    [82, 18],
    [18, 4],
  ]);
  const close = (a, b) => assert(Math.abs(a - b) < 1e-9);
  assert.equal(2 * cal.reduce((sum, [a, b]) => sum + a * b, 0), h[0][1]);
  assert.deepEqual(cal.map((x) => x[1]), [1, 1]);
  close(targets[0], 6.61);
  close(targets[1], 5.41);
  close(nearest.error, 0.5402);
  close(fixed.residuals[0], -1);
  close(fixed.residuals[1], -0.8);
  close(adjusted.weights[1], 1.51);
  close(adjusted.error, 0.02);
  close(integer.error, 0.5002);
  close(1 / h[1][1], 0.25);
  assert.deepEqual(
    sweeps.map((s) => s.payload),
    [1, 2, 4],
  );
  assert.deepEqual(probes2Bit[0].input, [2, 1, -1, 0.2]);
  probes2Bit.forEach(({ sourceOutput, rebuiltOutput, residual }, i) => {
    close(sourceOutput - rebuiltOutput, residual);
    close(residual, [1.54, -0.10, 0.80][i]);
  });
  close(probes2Bit[0].sourceOutput, -2.46);
  close(probes2Bit[0].rebuiltOutput, -4);
  assert.deepEqual(sweeps.map((s) => s.mse.toFixed(6)), ['1.007200', '0.067010', '0.000204']);
  assert.deepEqual(meanMag, [9, 1]);
  close(0.3 * 8 * (10 / 8), 3);
  close(awqReconstruct(8)[0], 0.3);
  assert.deepEqual(awqGrids.map((grid) => grid.codes), [[1, 7], [7, 6]]);
  assert.deepEqual(awqGrids.map((grid) => grid.step), [2 / 7, 2.4 / 7]);
  awqGrids.forEach(({ row, input, contributions }, i) => {
    close(dotProduct(row, input), dotProduct(aw, example));
    awqReconstruct(i ? 8 : 1).forEach((w, ch) => close(contributions[ch], w * example[ch]));
  });
  close(awqError(8), 0.0032653061224489563);
  const held =
    squaredOutputError(
      awqReconstruct(8),
      [
        [9, -9],
        [0.5, -0.5],
      ],
      aw,
    ) / 2;
  close(held, 0.000816326530612244);
  assert.deepEqual(
    models.map((m) => fresh.map((x) => dotProduct(m.weights, x))),
    [
      [1, 1],
      [1, 2],
    ],
  );
  close(squaredOutputError(nearest.weights, HELD_OUT), 0.1921);
  close(squaredOutputError(integer.weights, HELD_OUT), 1.9721);
}

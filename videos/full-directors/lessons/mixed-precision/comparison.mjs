import { bf16, fp16 } from '../../../films/mixed-precision/arithmetic.mjs';
import {
  comparisonRuns,
  passesGates,
  qualityGates,
  reductionPrecisionFixture,
  policyPrecisionFixture,
} from '../../../films/mixed-precision/fixtures.mjs';
import {
  saturationFixture,
  spikeScaleFixture,
} from '../../../films/mixed-precision/construction.mjs';
import {
  C,
  arr,
  at,
  bitword,
  box,
  brace,
  casing,
  dot,
  fade,
  fmt,
  line,
  num,
  pointer,
  reading,
  scale,
  text,
  title,
} from './drawing.mjs';

export const sums = reductionPrecisionFixture(),
  sample = policyPrecisionFixture();
export const spikes = spikeScaleFixture(),
  saturation = saturationFixture();
export const regroup = bf16(bf16(sums.values[0] + sums.values[2]) + sums.values[1]);
export function communication(g, c) {
  const b = c.beat.beatIndex + 1;
  if (b <= 3) {
    title(
      g,
      'Where does the one disappear?',
      'Same three worker contributions   /   left-to-right reduction',
    );
    const n = at(c, 2, 'Start the sum') + at(c, 2, 'Add one') + at(c, 3, 'Subtract the last');
    const xs = [627, 1105, 1583];
    for (const [j, v] of sums.values.entries()) {
      text(g, 'Worker ' + (j + 1), xs[j], 303, 33, C.dim, 'center');
      num(g, (v > 0 ? '+' : '') + fmt(v), xs[j], 396, 65, C.ink, 'center');
      line(g, xs[j], 435, xs[j], 477, C.dim, 3);
    }
    for (const [i, values] of [sums.bf16, sums.fp32].entries()) {
      const y = 571 + i * 238,
        col = i ? C.green : C.blue;
      num(g, i ? 'FP32' : 'BF16', 132, y + 22, 55, col);
      text(g, 'partial sum', 134, y + 72, 30, C.dim);
      for (let j = 0; j < 3; j++) {
        const visible = j < n;
        if (j) arr(g, xs[j - 1] + 146, y, xs[j] - 148, y, visible ? col : C.faint);
        box(
          g,
          xs[j] - 124,
          y - 62,
          248,
          129,
          visible ? (i ? C.mint : '#dce7f0') : C.paper,
          visible ? col : C.faint,
          3,
          15,
        );
        num(g, visible ? values[j] : '?', xs[j], y + 24, 59, visible ? col : C.dim, 'center');
      }
    }
    if (n >= 2)
      text(
        g,
        '257 sits halfway between 256 and 258 on the BF16 grid.',
        960,
        1000,
        37,
        C.dim,
        'center',
      );
    if (b === 1)
      text(
        g,
        'FSDP   /   param_dtype selects parameter compute.  reduce_dtype selects gradient reduction.',
        960,
        975,
        34,
        C.dim,
        'center',
      );
    return;
  }
  if (b === 4) {
    title(
      g,
      'Change the addition order',
      'Same BF16 inputs, grouped as a different reduction tree',
    );
    const xy = [
      [414, 352],
      [968, 352],
      [1507, 352],
    ];
    [256, -256, 1].forEach((v, i) => {
      num(g, (v > 0 ? '+' : '') + v, ...xy[i], 59, C.ink, 'center');
    });
    const cancel = at(c, 4, 'They cancel'),
      final = at(c, 4, 'Add the remaining');
    arr(g, 414, 406, 611, 542, C.blue);
    arr(g, 968, 406, 754, 542, C.blue);
    num(g, cancel ? '0' : '?', 685, 659, 82, C.blue, 'center');
    arr(g, 752, 677, 1019, 837, C.blue);
    arr(g, 1507, 407, 1178, 837, C.blue);
    num(g, final ? regroup : '?', 1099, 939, 84, C.green, 'center');
    return;
  }
  title(
    g,
    'Count the gradient payload',
    '100 million values in one tensor, before collective overhead',
  );
  for (const [i, bytes, name, col] of [
    [0, 4, 'FP32', C.green],
    [1, 2, 'BF16', C.blue],
  ]) {
    const yy = 348 + i * 257;
    num(g, name, 145, yy + 72, 51, col);
    const mb = 100 * bytes;
    box(g, 463, yy, mb * 3, 107, col);
    num(g, mb + ' MB', 491, yy + 73, 48, C.white);
  }
  text(
    g,
    'Network traffic also depends on worker count, sharding, topology and the collective.',
    132,
    903,
    37,
    C.ink,
  );
}
export function policy(g, c) {
  const begin = at(c, 3, 'Start with logits'),
    wide = at(c, 3, 'probability of action zero'),
    a1 = at(c, 3, 'we get action one');
  const round = at(c, 3, 'Both round to one'),
    narrow = at(c, 4, 'Equal scores'),
    a0 = at(c, 4, 'Now we get action zero');
  title(g, 'Replay the same draw', 'Two possible actions   /   choose action 0 when u < P(0)');
  const l = 510,
    r = 1710,
    min = 0.4992,
    max = 0.5003;
  const x = (v) => l + ((v - min) / (max - min)) * (r - l);
  for (const [i, [vals, prob, show, result]] of [
    [sample.logits, sample.wideProbability, wide, a1],
    [sample.rounded, sample.roundedProbability, narrow, a0],
  ].entries()) {
    const y = 427 + i * 314,
      col = i ? C.blue : C.green;
    num(g, i ? 'BF16' : 'FP32', 115, y - 9, 52, col);
    text(
      g,
      begin && (!i || round) ? 'logits  [' + vals.join(', ') + ']' : 'logits',
      115,
      y + 52,
      32,
      C.dim,
    );
    box(g, l, y - 47, r - l, 94, '#e8e4d7');
    if (show) {
      box(g, l, y - 47, x(prob) - l, 94, i ? '#bdd0e5' : '#b6d8c8');
      line(g, x(prob), y - 56, x(prob), y + 48, col, 5);
      num(g, 'P(0) ' + (i ? '= ' : '≈ ') + prob.toFixed(6), x(prob), y - 78, 30, col, 'center');
    }
    line(g, l, y + 47, r, y + 47, C.dim, 3);
    for (const v of [min, 0.4995, 0.5, max]) {
      line(g, x(v), y + 47, x(v), y + 58, C.dim, 2);
      num(g, v.toFixed(4), x(v), y + 94, 25, C.dim, 'center');
    }
    if (result) {
      const act = i ? sample.roundedAction : sample.wideAction;
      text(
        g,
        'action ' + act,
        x(sample.uniform) + (act === 0 ? -30 : 30),
        y + 13,
        36,
        C.ink,
        act === 0 ? 'right' : 'left',
      );
    }
  }
  line(g, x(sample.uniform), 315, x(sample.uniform), 814, C.ochre, 5, [10, 6]);
  pointer(g, x(sample.uniform), 312);
  num(g, 'u = ' + sample.uniform, x(sample.uniform) + 24, 289, 34, C.ochre);
  if (at(c, 5, 'One different action'))
    text(
      g,
      'Matched prompt and draw  →  different action  →  different next context',
      960,
      976,
      38,
      C.ink,
      'center',
    );
}
export function fp8(g, c) {
  const b = c.beat.beatIndex + 1;
  if (b <= 2) {
    title(g, 'Eight bits, two encodings', 'OCP FP8 formats   /   the sign takes one bit in each');
    for (const [i, name, e, f, max, inf] of [
      [0, 'E4M3', 4, 3, 448, 'no infinity code'],
      [1, 'E5M2', 5, 2, 57344, 'includes infinity'],
    ]) {
      const yy = 363 + 333 * i;
      num(g, name, 134, yy + 58, 55);
      bitword(g, 435, yy, e, f, 670);
      const show = i ? at(c, 2, 'reaches fifty-seven') : at(c, 1, 'reaches finite');
      if (show) {
        text(g, 'Largest finite magnitude', 1240, yy - 5, 32, C.dim);
        num(g, fmt(max), 1240, yy + 73, 60, C.blue);
        text(g, inf, 1240, yy + 139, 32, C.dim);
      }
    }
    return;
  }
  if (b <= 5) {
    title(
      g,
      'Can both scales bring back 512?',
      'E4M3 with saturating conversion. Both rulers show decoded magnitude.',
    );
    const x = (value) => 572 + (value / 512) * 1110;
    for (const [i, row] of spikes.entries()) {
      const yy = 425 + i * 331,
        col = i ? C.red : C.green;
      const maxSeen = at(
        c,
        3,
        i ? 'delayed scale still uses eight' : 'current scale uses the largest',
      );
      const unit = at(c, i ? 5 : 4, 'the decode factor is');
      const encoded = at(c, i ? 5 : 4, i ? 'It clamps to' : 'spike encodes as');
      const decoded = at(c, i ? 5 : 4, i ? 'we get eight' : 'The result is five hundred twelve');
      const demand = i && at(c, 5, 'division by that factor gives');
      text(g, i ? 'Delayed scale' : 'Current scale', 125, yy - 5, 43, C.ink, 'left', 'Serif');
      if (maxSeen)
        text(g, (i ? 'Previous max  ' : 'Current max  ') + row.amax, 126, yy + 55, 32, col);
      scale(g, x(0), x(512), yy, [0, 128, 256, 384, 512].map(x), C.dim);
      num(g, '0', x(0), yy + 50, 28, C.dim, 'center');
      pointer(g, x(512), yy - 4);
      text(g, 'Input 512', x(512), yy - 68, 31, C.ochre, 'center');
      if (maxSeen) {
        box(g, x(0), yy + 4, x(row.amax) - x(0), 23, i ? C.rose : C.mint);
        line(g, x(row.amax), yy + 4, x(row.amax), yy + 49, col, 4);
        text(
          g,
          'max ' + fmt(row.amax),
          x(row.amax) + (i ? 16 : -12),
          yy + 63,
          30,
          col,
          i ? 'left' : 'right',
        );
      }
      if (unit) {
        num(g, 'Factor = ' + row.amax + ' / 448', 123, yy + 142, 35);
        if (encoded)
          num(
            g,
            (demand ? fmt(512 / row.step) + ' → ' : '') + fmt(row.encoded) + ' stored',
            718,
            yy + 142,
            35,
            C.blue,
          );
        else if (demand) num(g, fmt(512 / row.step) + ' requested', 718, yy + 142, 35, C.ochre);
        if (decoded) {
          dot(g, x(row.restored), yy, 11, col, C.white);
          num(g, 'Decoded ' + fmt(row.restored), 1699, yy + 142, 38, col, 'right');
        }
      }
    }
    return;
  }
  if (b <= 7) {
    title(g, 'One power-of-two scale for a block', 'MXFP8   /   thirty-two consecutive FP8 values');
    const count = 32,
      l = 144,
      w = 48,
      y = 442;
    for (let i = 0; i < count; i++) {
      const xx = l + i * w;
      box(g, xx, y, w - 4, 104, i % 8 === 0 ? C.green : C.metal, C.green, 2, 4);
      if (i % 8 === 0) num(g, i, xx + w / 2, y + 66, 25, C.white, 'center');
    }
    brace(g, l, l + w * 32 - 4, 599, '32 element bytes');
    const share = at(c, 6, 'one scale byte');
    if (share) {
      box(g, 1711, y, 64, 104, C.ochre);
      text(g, 'S', 1743, y + 70, 36, C.white, 'center');
      text(g, 'E8M0', 1744, 606, 28, C.ochre, 'center');
      num(g, '32 + 1 = 33 bytes', 960, 811, 64, C.ink, 'center');
      text(g, 'Before alignment and layout overhead', 960, 904, 36, C.dim, 'center');
    }
    return;
  }
  const { input, maximum, stored, error } = saturation;
  title(g, 'A finite value can still be wrong', 'Unscaled OCP E4M3   /   saturating conversion');
  const x = (v) => 213 + (v / 512) * 1445,
    y = 480;
  box(g, x(0), y - 46, x(maximum) - x(0), 92, C.mint);
  scale(g, x(0), x(512), y, [0, 128, 256, 384, 448, 500].map(x), C.dim);
  line(g, x(maximum), y - 108, x(maximum), y + 60, C.red, 4);
  num(g, '448', x(maximum), y + 110, 36, C.red, 'center');
  text(g, 'ceiling', x(maximum), y - 135, 35, C.red, 'center');
  const supplied = at(c, 8, 'supplied input five hundred'),
    clip = at(c, 8, 'saturating output'),
    err = at(c, 8, 'absolute error');
  if (supplied) {
    pointer(g, x(input), y - 5);
    num(g, input, x(input), y - 70, 39, C.ochre, 'center');
    if (clip) {
      dot(g, x(stored), y + 5, 13, C.blue);
      arr(g, x(input), y + 32, x(stored) + 10, y + 32, C.blue);
    }
    if (err) num(g, '|' + input + ' − ' + stored + '| = ' + error, 960, 772, 68, C.ink, 'center');
  }
  if (b === 9)
    text(
      g,
      'Non-saturating E4M3 overflow can yield NaN. Record the conversion mode.',
      960,
      913,
      36,
      C.dim,
      'center',
    );
}

export const partialInputs = [40000, 40000, -40000];
export function partials(cast) {
  const trace = [0];
  for (const v of partialInputs) trace.push(cast(trace.at(-1) + v));
  return trace;
}
export function comparison(g, c) {
  const b = c.beat.beatIndex + 1;
  if (b === 6 || b === 7) {
    const step =
      at(c, 6, 'Add forty thousand to each') +
      at(c, 6, 'Now add forty thousand again') +
      at(c, 6, 'Subtract forty thousand');
    title(
      g,
      'Which sum needs the extra range?',
      'Identical addends   /   round each partial sum in the indicated format',
    );
    const xs = [418, 835, 1245, 1650];
    for (const [i, lab] of ['Start', '+40,000', '+40,000', '−40,000'].entries()) {
      num(g, lab, xs[i], 371, 40, i <= step ? C.ink : C.dim, 'center');
    }
    for (const [i, [name, cast, col]] of [
      ['FP16', fp16, C.blue],
      ['FP32', Math.fround, C.green],
    ].entries()) {
      const yy = 532 + i * 254,
        values = partials(cast);
      num(g, name, 106, yy + 23, 48, col);
      for (const [j, x] of xs.entries()) {
        const shown = j <= step,
          v = values[j];
        if (j) arr(g, xs[j - 1] + 118, yy, x - 113, yy, C.faint);
        num(
          g,
          shown ? fmt(v) : '·',
          x,
          yy + 24,
          61,
          shown && !Number.isFinite(v) ? C.red : col,
          'center',
        );
      }
    }
    if (step === 3)
      text(
        g,
        'An FP16 result can fit even when its intermediate sum overflows.',
        960,
        879,
        36,
        C.dim,
        'center',
      );
    return;
  }
  const retry = at(c, 8, 'reaches exactly ninety-three percent');
  const runs = comparisonRuns(retry ? qualityGates.policy : 0.92);
  const qualified = runs.filter(passesGates).sort((a, b) => b.speed - a.speed);
  const placed = [at(c, 2, 'Put A on the chart'), at(c, 2, 'Now place B')];
  const vertical = at(c, 1, 'vertical line'),
    horizontal = at(c, 2, 'horizontal line');
  const speed = at(c, 4, 'Now uncover throughput');
  const firstVerdict = at(c, 4, 'B clears both lines'),
    lastVerdict = at(c, 9, 'A is on the line');
  const verdict = retry ? lastVerdict : firstVerdict;
  const chosen = retry ? at(c, 9, 'Choose A') : at(c, 4, 'Only B qualifies');
  title(
    g,
    b >= 8 ? 'Which is the fastest qualifying run?' : 'Which run meets both minimums?',
    'Same GPU, model, data, seeds, batch shape and evaluation   /   invented measurements',
  );
  const l = 268,
    r = 1230,
    top = 318,
    bot = 818;
  const x = (v) => l + ((v - 0.975) / 0.025) * (r - l),
    y = (v) => bot - ((v - 0.9) / 0.06) * (bot - top);
  const vx = x(qualityGates.format),
    hy = y(qualityGates.policy);
  if (vertical && horizontal) box(g, vx, top, r - vx, hy - top, C.mint);
  for (const v of [0.9, 0.92, 0.93, 0.94, 0.96]) {
    line(
      g,
      l - 10,
      y(v),
      r,
      y(v),
      v === 0.93 && horizontal ? C.green : C.faint,
      v === 0.93 && horizontal ? 4 : 2,
    );
    num(g, Math.round(v * 100) + '%', l - 20, y(v) + 10, 27, C.dim, 'right');
  }
  for (const v of [0.98, 0.99, 1]) {
    line(
      g,
      x(v),
      top,
      x(v),
      bot + 12,
      v === 0.98 && vertical ? C.green : C.faint,
      v === 0.98 && vertical ? 4 : 2,
    );
    num(g, Math.round(v * 100) + '%', x(v), bot + 54, 30, C.dim, 'center');
  }
  line(g, l, top, l, bot, C.dim, 3);
  line(g, l, bot, r, bot, C.dim, 3);
  text(g, 'Policy pass rate', l, top - 32, 35, C.dim);
  text(g, 'Format pass rate', 235, bot + 54, 35, C.dim, 'center');
  for (const [i, run] of runs.entries()) {
    if (!placed[i]) continue;
    const px = x(run.format),
      py = y(run.policy);
    dot(g, px, py, 15, i ? C.green : C.blue, C.white);
    num(
      g,
      run.name +
        '   ' +
        Number((run.format * 100).toFixed(1)) +
        '%, ' +
        Math.round(run.policy * 100) +
        '%',
      px + 23,
      py + (i ? -19 : 55),
      32,
      i ? C.green : C.blue,
    );
  }
  if (speed) {
    text(g, 'Examples per second', 1355, 344, 36);
    for (const [i, run] of runs.entries()) {
      const yy = 438 + i * 149;
      num(g, run.name + '   ' + fmt(run.speed), 1362, yy, 51, i ? C.green : C.blue);
      if (verdict || i === 1)
        text(
          g,
          passesGates(run) ? 'Meets both minimums' : 'Below policy minimum',
          1367,
          yy + 51,
          32,
          passesGates(run) ? C.green : C.red,
        );
    }
    if (chosen) text(g, 'Choose ' + qualified[0].name, 1360, 806, 59, C.ink, 'left', 'Serif');
  }
  if (b === 5)
    text(
      g,
      'Warm up complete steps. Synchronize the GPU at both timing boundaries.',
      1216,
      286,
      34,
      C.dim,
      'center',
    );
  if (b === 10)
    text(
      g,
      'Which workers hold the weight, gradient and two Adam moments?',
      1216,
      287,
      34,
      C.dim,
      'center',
    );
}

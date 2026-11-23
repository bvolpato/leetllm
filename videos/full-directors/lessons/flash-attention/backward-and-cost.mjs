import {
  paper,
  ink,
  blue,
  sky,
  orange,
  green,
  faint,
  slate,
  chalk,
  lightBlue,
  lightOrange,
  fmt,
  text,
  rect,
  edge,
  line,
  arrow,
  dot,
  fade,
  page,
  brace,
  note,
  cue,
  grid,
} from './studio.mjs';
import {
  full,
  giB,
  miB,
  lse,
  probabilities,
  gradient,
  attention,
  scaleCases,
  requestTime,
} from './examples.mjs';

export function reconstruct(ctx, clock) {
  const saved = cue(clock, 1, 'Log-sum-exp equals'),
    score = cue(clock, 2, 'Recompute its scaled score'),
    p = cue(clock, 2, 'The recovered share'),
    sizes = clock.beat.beatIndex === 2;
  if (sizes) {
    const rows = cue(clock, 3, 'one four-byte statistic');
    page(
      ctx,
      'What does backward keep per row?',
      'TRAINING   /   8 PROMPTS × 32 HEADS × 8,192 ROWS',
    );
    text(ctx, 'Save all probabilities', 160, 343, 55, ink, 'Serif');
    const n = 14,
      z = 26;
    grid(ctx, 173, 401, n, n, z, (x, y) => rect(ctx, x, y, z - 2, z - 2, sky));
    text(ctx, 'FP16', 579, 488, 41, slate);
    text(ctx, attention.score / giB + ' GiB', 578, 583, 62, blue, 'Mono');
    if (rows) {
      arrow(ctx, 860, 590, 994, 590, ink);
      text(ctx, 'Save one log-sum-exp per row', 1031, 343, 50, ink, 'Serif');
      for (let r = 0; r < n; r++) rect(ctx, 1070, 401 + r * z, z * 2, z - 2, orange);
      text(ctx, 'FP32', 1173, 488, 41, slate);
      text(ctx, attention.lse / miB + ' MiB', 1171, 583, 65, orange, 'Mono');
      text(ctx, '8 × 32 × 8,192 × 4 bytes', 1032, 838, 40, ink, 'Mono');
    }
    text(ctx, 'Columns represent keys', 170, 840, 36, slate);
    note(
      ctx,
      'Schematic arrays. The comparison excludes Q, K, V, output and other training state.',
    );
    return;
  }
  page(ctx, 'Rebuild the share for “this”', 'BACKWARD   /   SAME THREE-KEY ROW   /   DROPOUT OFF');
  text(ctx, 'Forward leaves a row statistic', 135, 327, 53, ink, 'Serif');
  rect(ctx, 152, 391, 655, 190, ink);
  text(
    ctx,
    'max   ' + full.m + '      sum   ' + fmt(full.l),
    478,
    463,
    43,
    chalk,
    'Mono',
    'center',
  );
  if (saved) text(ctx, 'L = m + log ℓ ≈ ' + fmt(lse, 4), 479, 544, 40, chalk, 'Mono', 'center');
  text(ctx, 'Retain Q, K, V and output', 151, 661, 43, slate);
  if (saved) {
    arrow(ctx, 831, 484, 986, 484, blue);
    text(ctx, 'Backward needs one key', 1034, 326, 53, ink, 'Serif');
    text(ctx, 'Q(test) · K(this) / √d', 1036, 449, 48, blue, 'Mono');
    if (score) text(ctx, 'score = 2', 1038, 548, 60, ink, 'Mono');
    if (p) {
      const left = 1034,
        width = 668;
      text(ctx, 'exp(2 − L) ≈ ' + fmt(probabilities[1], 4), left, 659, 48, green, 'Mono');
      rect(ctx, left, 714, width, 52, lightBlue);
      rect(ctx, left, 714, width * probabilities[1], 52, green);
      text(ctx, '0', left, 826, 37, slate, 'Mono');
      text(ctx, '1', left + width, 826, 37, slate, 'Mono', 'right');
    }
  }
  note(
    ctx,
    p
      ? 'Recomputed locally, this key has the same probability as in the forward row.'
      : 'A nonempty row needs one normalization statistic, shared by all its keys.',
  );
}

export function derivatives(ctx, clock) {
  const calc = cue(clock, 2, 'The low value gets'),
    dp = cue(clock, 2, 'Multiply the upstream'),
    d = cue(clock, 2, 'The row correction'),
    ds = cue(clock, 2, 'then multiply'),
    dv = cue(clock, 3, 'Each gets one');
  const [v0, v1] = [2, 10];
  page(
    ctx,
    'Which score pushes the blend down?',
    'BACKWARD   /   DROPOUT OFF   /   UPSTREAM DERIVATIVE 3',
  );
  text(ctx, 'Value', 110, 319, 38, slate);
  text(ctx, 'Score', 794, 319, 38, slate);
  text(ctx, 'Probability', 1163, 319, 38, slate);
  for (const [i, v] of [v0, v1].entries()) {
    const y = 399 + i * 140,
      col = i ? orange : blue;
    rect(ctx, 114, y - 37, v * 43, 48, col);
    text(ctx, v, 129 + v * 43, y + 4, 48, col, 'Mono');
    text(ctx, 0, 830, y + 4, 45, ink, 'Mono', 'center');
    text(ctx, gradient.probabilities[i], 1260, y + 4, 45, ink, 'Mono', 'center');
  }
  const mark = 114 + gradient.output * 43;
  line(ctx, mark, 331, mark, 559, ink, 3, [8, 8]);
  text(ctx, 'blend ' + gradient.output, mark, 606, 36, ink, 'Sans', 'center');
  line(ctx, 111, 651, 1793, 651, faint);
  if (dv) {
    text(ctx, 'Value derivatives', 114, 756, 51, ink, 'Serif');
    text(ctx, 'dV = p × upstream', 114, 844, 47, slate, 'Mono');
    text(ctx, '[' + gradient.dv.join(', ') + ']', 1123, 825, 74, green, 'Mono');
  } else if (calc) {
    if (dp) text(ctx, 'dP   [' + gradient.dp.join(', ') + ']', 115, 742, 46, ink, 'Mono');
    if (d) text(ctx, 'D = 3 × 6 = ' + gradient.D, 715, 742, 46, slate, 'Mono');
    if (ds) {
      text(ctx, 'dS = p × (dP − D)', 113, 846, 48, ink, 'Mono');
      const mid = 1280;
      line(ctx, mid, 763, mid, 883, slate, 3);
      for (const [i, value] of gradient.ds.entries()) {
        const y = 793 + i * 66,
          end = mid + value * 44,
          color = i ? orange : blue;
        arrow(ctx, mid, y, end, y, color, 9);
        text(
          ctx,
          value > 0 ? '+' + value : String(value),
          end + (i ? 16 : -16),
          y + 14,
          43,
          color,
          'Mono',
          i ? 'left' : 'right',
        );
      }
    } else if (!dp)
      text(ctx, 'Raising the score for value 2 lowers the output.', 114, 804, 52, blue, 'Serif');
  } else
    text(
      ctx,
      'Raise the score attached to 2. Which way would the blend move?',
      114,
      791,
      51,
      ink,
      'Serif',
    );
  note(
    ctx,
    dv
      ? 'For vectors, the correction D is the dot product of the upstream gradient and the output.'
      : 'The low value lies below the blend. The high value lies above it.',
  );
}

export function scale(ctx, clock) {
  if (clock.beat.beatIndex === 2) {
    const bound = cue(clock, 3, 'The bandwidth ceiling'),
      example = cue(clock, 3, 'A kernel doing one');
    page(
      ctx,
      'How much arithmetic can one byte support?',
      'ROOFLINE   /   ILLUSTRATIVE BANDWIDTH OF 3.35 TB/s',
    );
    const x = 362,
      y = 799,
      w = 1180,
      h = 429,
      cap = 12;
    const xx = (i) => x + (i * w) / 6,
      yy = (v) => y - (v * h) / 14;
    arrow(ctx, x, y, x + w + 18, y, ink);
    arrow(ctx, x, y, x, y - h - 30, ink);
    text(ctx, 'Throughput (TFLOP/s)', 161, 300, 40, slate);
    text(ctx, 'Arithmetic intensity (FLOPs/byte)', 1192, 903, 40, slate, 'Sans', 'center');
    for (const tick of [0, 1, 2, 3, 4, 5, 6]) {
      line(ctx, xx(tick), y, xx(tick), y + 9, slate);
      text(ctx, tick, xx(tick), y + 53, 32, slate, 'Mono', 'center');
    }
    for (const tick of [0, 4, 8, 12])
      text(ctx, tick, x - 20, yy(tick) + 10, 32, slate, 'Mono', 'right');
    if (bound) {
      const knee = cap / 3.35;
      line(ctx, x, y, xx(knee), yy(cap), blue, 7);
      line(ctx, xx(knee), yy(cap), xx(6), yy(cap), blue, 7);
      text(ctx, 'Example compute peak 12', xx(3.5), yy(cap) - 27, 36, blue);
    }
    if (example) {
      const px = xx(1),
        py = yy(3.35);
      line(ctx, px, y, px, py, orange, 3, [7, 8]);
      dot(ctx, px, py, 12, orange);
      text(ctx, '1 FLOP/byte   →   3.35 TFLOP/s', px + 32, py + 15, 38, orange, 'Mono');
    }
    note(ctx, 'Attainable throughput ≤ min(relevant compute peak, intensity × bandwidth).');
    return;
  }
  const doubled = cue(clock, 1, 'Double both'),
    work = cue(clock, 2, 'Dense work grows fourfold'),
    saved = cue(clock, 2, 'One saved statistic'),
    io = cue(clock, 2, 'Four divided by two');
  page(
    ctx,
    'What grows when both n and M double?',
    'TWO-LEVEL IO MODEL   /   FIXED HEAD WIDTH d = 64',
  );
  const factors = [
    ['Dense work', 'n²d', 'work', work, blue],
    ['Row statistics', 'n', 'rows', saved, green],
    ['Tiled IO', 'n²d² / M', 'io', io, orange],
  ];
  text(ctx, 'Tokens n', 128, 332, 43);
  text(ctx, 'Fast slots M', 128, 439, 43);
  for (let i = 0; i < (doubled ? 2 : 1); i++) {
    const v = scaleCases[i],
      x = i ? 938 : 566;
    text(ctx, v.n.toLocaleString('en-US'), x, 337, 60, i ? green : ink, 'Mono');
    text(ctx, v.M.toLocaleString('en-US'), x, 444, 60, i ? green : ink, 'Mono');
  }
  if (doubled) {
    arrow(ctx, 830, 316, 904, 316, green);
    arrow(ctx, 830, 424, 904, 424, green);
  }
  line(ctx, 114, 499, 1800, 499, faint);
  for (const [i, [label, formula, key, revealed, col]] of factors.entries()) {
    const y = 577 + i * 110,
      ratio = scaleCases[1][key] / scaleCases[0][key];
    text(ctx, label, 124, y, 43, ink, 'Serif');
    text(ctx, formula, 590, y, 39, slate, 'Mono');
    if (revealed) {
      for (let j = 0; j < ratio; j++) rect(ctx, 985 + 122 * j, y - 38, 114, 36, col);
      text(ctx, ratio + '×', 1530, y, 48, col, 'Mono');
    } else text(ctx, '?', 985, y, 48, slate, 'Mono');
  }
  note(ctx, 'Model range   d ≤ M ≤ n d.   M counts scalar elements of usable fast memory.');
}

export function timing(ctx, clock) {
  if (clock.beat.beatIndex === 2) {
    const eligible = cue(clock, 3, 'eligible inputs'),
      fail = cue(clock, 3, 'allocation fails');
    page(ctx, 'Did the requested call finish?', 'BACKEND CHECK   /   SAME INPUTS AND MASK');
    const xs = [143, 783, 1416];
    text(ctx, 'Check inputs', xs[0], 363, 56, ink, 'Serif');
    for (const [i, t] of ['Device and dtype', 'Shape and layout', 'Mask and dropout'].entries()) {
      line(ctx, xs[0], 417 + i * 85, xs[0] + 423, 417 + i * 85, faint, 2);
      text(ctx, t, xs[0], 468 + i * 85, 38, slate);
    }
    arrow(ctx, 595, 510, 724, 510, blue);
    text(ctx, 'Restricted call', xs[1], 363, 56, ink, 'Serif');
    edge(ctx, xs[1], 417, 438, 219, blue, 4);
    text(
      ctx,
      eligible ? 'Eligible' : 'Check eligibility',
      xs[1] + 219,
      545,
      48,
      blue,
      'Sans',
      'center',
    );
    if (fail) {
      arrow(ctx, 1253, 510, 1360, 510, orange);
      text(ctx, 'Allocation', xs[2], 363, 54, ink, 'Serif');
      rect(ctx, xs[2], 417, 342, 219, lightOrange);
      text(ctx, 'Out of memory', xs[2] + 171, 547, 41, orange, 'Sans', 'center');
      text(ctx, 'Propagate the execution error.', 146, 827, 65, orange, 'Serif');
    }
    note(
      ctx,
      fail
        ? 'Only a completed call supplies a timing for this configuration.'
        : 'Compare with a dense reference at the target precision before timing.',
    );
    return;
  }
  const action = cue(clock, 2, 'Six plus eighteen', 0.65),
    done = cue(clock, 2, 'Thirty divided by twenty-four');
  const t = requestTime(1),
    x = 241,
    unit = 47;
  page(
    ctx,
    'Where will the shorter request end?',
    'SERIAL REQUEST   /   SAME WORK OUTSIDE ATTENTION',
  );
  function bar(y, v, other = true) {
    rect(ctx, x, y, v.attn * unit, 98, blue);
    text(ctx, fmt(v.attn, 1) + ' ms', x + (v.attn * unit) / 2, y + 70, 50, paper, 'Mono', 'center');
    if (other) {
      rect(ctx, x + v.attn * unit, y, v.other * unit, 98, green);
      text(
        ctx,
        v.other + ' ms',
        x + unit * (v.attn + v.other / 2),
        y + 70,
        50,
        chalk,
        'Mono',
        'center',
      );
    }
  }
  text(ctx, 'Original', x, 315, 53, ink, 'Serif');
  bar(353, requestTime(0));
  text(ctx, 'Attention', x + 6 * unit, 507, 39, blue, 'Sans', 'center');
  text(ctx, 'Other work', x + 21 * unit, 507, 39, green, 'Sans', 'center');
  text(ctx, 'Replacement', x, 603, 53, ink, 'Serif');
  if (action === 0) {
    edge(ctx, x, 633, t.attn * unit, 98, blue, 4, [10, 7]);
    text(ctx, '½ time', x + (t.attn * unit) / 2, 697, 43, blue, 'Sans', 'center');
  } else {
    fade(ctx, action, () => bar(633, t));
  }
  line(ctx, x, 792, x + 31 * unit, 792, slate);
  for (let n = 0; n <= 30; n += 6) {
    line(ctx, x + unit * n, 778, x + unit * n, 806, slate);
    text(ctx, n + ' ms', x + unit * n, 855, 34, slate, 'Mono', 'center');
  }
  note(
    ctx,
    done
      ? 'Request speedup   30 / ' + t.total + ' = ' + fmt(t.speed) + '×'
      : 'Only the attention interval gets shorter.',
  );
}

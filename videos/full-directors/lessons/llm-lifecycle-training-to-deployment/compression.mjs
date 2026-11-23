import { lerp } from './art.mjs';
import { memory, source, quant, weights, scaled, impact } from './examples.mjs';

export function capacity(a) {
  const { c, beat: b, cue } = a;
  if (b === 1) {
    a.title(
      'Checkpoint storage  /  70 billion parameters',
      'How much space do the weights occupy?',
    );
    const width = 971;
    memory.precisions.forEach((precision, i) => {
      const y = 239 + 112 * i;
      a.text(precision, 68, y + 37, 30, c.ink, { face: 'Mono' });
      const ratio = memory.bytes[i] / memory.bytes[0];
      a.box(225, y, width, 54, c.bed, c.line, 3);
      a.box(225, y, width * ratio, 54, [c.violet, c.cyan, c.green][i], null, 2);
      a.mono(memory.bytes[i].toFixed(1) + ' GiB', 242, y + 36, 23, c.reverse);
    });
    a.text(
      'Ideal packed weights, before scales and runtime allocations.',
      69,
      619,
      25,
      c.muted,
    );
    return;
  }
  if (b <= 3) {
    a.title(
      'GPU memory budget  /  ideal INT4 weights',
      'Will two live requests fit?',
    );
    const x = (v) => 88 + 17.25 * v;
    const requests = cue(2, 'two requests', 0) ? 2 : 1;
    const values = [
      memory.bytes[2],
      memory.cachePerRequest,
      ...(requests === 2 ? [memory.cachePerRequest] : []),
    ];
    let left = 0;
    values.forEach((n, i) => {
      const col = [c.green, c.cyan, c.violet][i],
        px = x(left);
      a.box(px, 304, 17.25 * n - 2, 105, col, null, 3);
      if (n > 6)
        a.text(
          i ? 'KV ' + i : 'INT4 weights',
          px + 17,
          366,
          i ? 26 : 33,
          c.reverse,
        );
      left += n;
    });
    a.axis(x(0), 422, x(60) - x(0), 0, 60, [0, 10, 20, 30, 40, 50, 60]);
    const cap = b === 3 && cue(3, 'sixty-gibibyte budget') > 0 ? 60 : 48;
    a.line(x(cap), 222, x(cap), 420, c.gold, 4);
    a.mono(cap + ' GiB', x(cap) - 9, 213, 25, c.gold, 'right');
    a.text(left.toFixed(1) + ' GiB requested', 87, 554, 54, c.ink, {
      face: 'Serif',
    });
    if (b === 3)
      a.text(
        cap === 48
          ? memory.shortfallAt48.toFixed(1) + ' GiB over limit'
          : memory.remainingAt60.toFixed(1) + ' GiB left before overhead',
        600,
        550,
        27,
        cap === 48 ? c.red : c.gold,
      );
    return;
  }
  a.title('KV cache  /  one request', 'What has to be saved for each token?');
  const half = cue(5, 'newest half', 1.35);
  const numTokens = Math.round(lerp(memory.tokens, memory.tokens / 2, half)),
    cache = source.weightMemory(numTokens);
  const rows = [
    ['Keys + values', '2'],
    ['Layers', '80'],
    ['KV heads', '8'],
    ['Head width', '128'],
    ['Bytes / element', '2'],
  ];
  rows.forEach(([name, v], i) => {
    const x = 69 + i * 231;
    a.text(name, x, 241, 22, c.muted);
    a.mono(v, x, 308, 46, i === 0 ? c.gold : c.ink);
    if (i < 4) a.mono('×', x + 160, 307, 30, c.line);
  });
  a.line(69, 348, 1200, 348, c.line);
  a.text('Cached tokens', 70, 424, 24, c.muted);
  a.mono(numTokens.toLocaleString('en-US'), 69, 497, 51, c.cyan);
  a.text('KV per request', 732, 424, 24, c.muted);
  a.text(cache.cachePerRequest.toFixed(1) + ' GiB', 731, 502, 65, c.gold, {
    face: 'Serif',
  });
  a.box(72, 537, 1086, 30, c.bed, c.line, 3);
  a.box(72, 537, (1086 * numTokens) / memory.tokens, 30, c.cyan, null, 3);
  a.text(
    b === 6
      ? 'Also budget scales, runtime buffers and higher-precision weights.'
      : 'Multiply by the token count, then divide bytes by 2³⁰.',
    72,
    625,
    25,
    c.muted,
  );
}

export function rounding(a) {
  const { c, beat: b, cue, afterCue } = a;
  if (b <= 2) {
    a.title(
      'Symmetric INT8  /  one tensor',
      'How far is a weight from the storage grid?',
    );
    const x = a.axis(102, 353, 1076, -1, 1, [-1, -0.5, 0, 0.5, 1]);
    for (let i = -127; i <= 127; i++)
      a.line(
        x(i * quant.step),
        338,
        x(i * quant.step),
        353,
        c.line,
        i % 16 === 0 ? 2 : 1,
      );
    const round = cue(2, 'Round each weight', 1.1);
    weights.forEach((w, i) => {
      const px = x(lerp(w, quant.restored[i], round));
      a.line(px, 300, px, 349, c.cyan, 2);
      a.dot(px, 295, 8, c.cyan);
      a.mono(w.toFixed(2), px, 265, 21, c.ink, 'center');
      if (b === 2) a.mono(quant.codes[i], px, 448, 25, c.green, 'center');
    });
    a.mono(
      b === 1 ? 'Step = 0.96 / 127' : 'Integer codes',
      96,
      b === 1 ? 496 : 506,
      27,
      c.muted,
    );
    a.text(
      b === 1
        ? 'Zero tensor: choose a nonzero step.'
        : 'Largest reconstruction error  ' + quant.maxError.toFixed(4),
      b === 1 ? 558 : 97,
      b === 1 ? 496 : 600,
      b === 1 ? 28 : 36,
      c.gold,
      { face: 'Serif' },
    );
    return;
  }
  if (b <= 4) {
    a.title(
      'Calibration inputs  /  channel error',
      'Which rounding error moves the output farther?',
    );
    const e = [0.01, 0.04],
      amp = [10, 1],
      out = impact(e, amp);
    ['Channel', 'Weight error', 'Activation', 'Output effect'].forEach((s, i) =>
      a.text(s, [67, 316, 582, 859][i], 241, 23, c.muted),
    );
    const largerNamed = b === 4 && cue(4, 'Channel one moves', 0, { captionStart: false });
    const smallerKnown = b === 4 && afterCue(4, 'four hundredths', false);
    out.forEach((v, i) => {
      const y = 339 + i * 144;
      const highlighted = i === 0 && largerNamed;
      if (highlighted) a.box(48, y - 53, 1140, 108, null, c.cyan, 8);
      const color = highlighted ? c.cyan : c.gold;
      a.mono(i + 1, 68, y, 31, highlighted ? c.cyan : c.ink);
      a.mono(e[i].toFixed(2), 318, y, 36, c.ink);
      a.mono('× ' + amp[i], 581, y, 36, c.violet);
      if (i === 0 || smallerKnown) {
        a.mono(v.toFixed(2), 860, y, 36, color);
        a.box(859, y + 25, v * 3100, 18, color, null, 2);
      }
    });
    if (b === 4)
      a.text(
        'Use calibration activations to choose channel scales.',
        70,
        568,
        32,
        c.ink,
        { face: 'Serif' },
      );
    return;
  }
  if (b <= 8) {
    a.title(
      'Activation-aware scaling  /  decimal teaching grid',
      'Keep the product. Change the rounding.',
    );
    const factor =
      b >= 7 && cue(7, 'double the first weight', 0.45) > 0.5 ? 2 : 1;
    const w = scaled.w[0] * factor,
      x = scaled.x[0] / factor;
    a.text('Before rounding', 76, 223, 23, c.muted);
    a.mono(
      w.toFixed(2) +
        ' × ' +
        Number(x.toFixed(2)) +
        '  +  0.44 × 1  =  ' +
        scaled.exact.toFixed(2),
      76,
      295,
      36,
      c.ink,
    );
    const axis = a.axis(
      148,
      505,
      973,
      2.3,
      3,
      [2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3],
      (v) => v.toFixed(1),
    );
    const mark = (value, col, label, up) => {
      const px = axis(value);
      a.line(px, up ? 422 : 550, px, up ? 501 : 558, col, 3);
      a.dot(px, 504, 7, col);
      a.mono(label, px, up ? 402 : 574, 23, col, 'center');
    };
    mark(scaled.exact, c.cyan, 'Exact 2.84', true);
    if (b >= 6) mark(scaled.plain, c.red, 'Direct 2.40', false);
    if (b === 7)
      a.fade(cue(7, 'rounds to point five'), () =>
        a.mono('Rounded   0.5 × 5 + 0.4 × 1', 76, 354, 25, c.gold),
      );
    if (b === 8) mark(scaled.scaled, c.green, 'Scaled 2.90', false);
    return;
  }
  a.title(
    'GPTQ  /  layer reconstruction',
    'Can a remaining weight absorb the error?',
  );
  const compensate = cue(10, 'Raise its weight', 1.25);
  a.text('Rounded channel', 72, 240, 23, c.muted);
  a.text('Remaining channel', 707, 240, 23, c.muted);
  a.mono('−0.05 × 2', 72, 318, 46, c.red);
  a.mono('+' + (0.1 * compensate).toFixed(2) + ' × 1', 707, 318, 46, c.green);
  const axis = a.axis(
    182,
    485,
    890,
    -0.12,
    0.04,
    [-0.12, -0.08, -0.04, 0, 0.04],
    (v) => v.toFixed(2),
  );
  const delta = -0.05 * 2 + 0.1 * compensate;
  a.line(axis(0), 412, axis(0), 486, c.cyan, 3);
  a.mono('Exact output', axis(0), 399, 22, c.cyan, 'center');
  a.dot(axis(delta), 485, 12, c.gold);
  a.text(
    b === 11
      ? 'The next rounding can introduce new error.'
      : 'Net output change   ' +
          (Math.abs(delta) < 0.0001 ? '0.00' : delta.toFixed(2)),
    73,
    596,
    36,
    c.ink,
    { face: 'Serif' },
  );
  a.text(
    b === 11
      ? 'Other recipes include distillation, pruning and quantization-aware training.'
      : 'Calibration geometry guides compensation   ·   H = 2XXᵀ for the linear squared-error objective.',
    74,
    641,
    21,
    c.muted,
  );
}

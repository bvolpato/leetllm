import { C, series, cap, mix } from './bench.mjs';
import {
  activationBytes,
  roundedFormat,
  precisionFailureTraces,
  cachedBlockRelease,
  sum,
} from '../../../films/cuda-execution/arithmetic.mjs';

export const fp16 = (x) => roundedFormat(x, 10, -14, 15),
  bf16 = (x) => roundedFormat(x, 7, -126, 127);
const arrays = ['Weight', 'Gradient', 'First moment', 'Second moment'];
const dyes = [C.blue, C.mint, C.gold, '#e8b899'];
export const parameterBytes = (n, bytes, count) => n * bytes * count;
export const scoreBytes = (batch, tokens, heads = 1, layers = 1, bytes = 1) =>
  activationBytes({ scores: true, batch, tokens, heads, layers, bytes });
export const microLoss = (sums, denominator) => (denominator > 0 ? sum(sums) / denominator : null);
export const targetLoss = (weights, keep) => {
  const counts = weights.map((w, i) => (keep[i] ? w : 0));
  const sums = counts.map((w) => w * Math.log(2));
  const total = sum(counts);
  return {
    counts,
    sums,
    total,
    contributions: sums.map((loss) => microLoss([loss], total)),
    mean: microLoss(sums, total),
  };
};

export function adam(v) {
  const { b, cue, text, wafer, readout } = v;
  const steps = [
    cue(0, 'Follow one'),
    cue(0, 'four for its gradient'),
    cue(0, 'eight for two'),
    cue(0, 'eight for two'),
  ];
  const enabled = steps.map((t, i) => (b === 3 && i > 1 ? cue(3, 'on the first step') === 1 : t > 0));
  text(
    b === 3 ? 'Replay the first optimizer step' : 'One FP32 parameter   /   four bytes per slot',
    52,
    136,
    22,
  );
  v.box(49, 220, 853, 115, '#356351', 8);
  for (let j = 0; j < 66; j++) if (j !== 23) v.box(62 + j * 12.5, 328, 9, 16, '#b4a778', 1);
  for (const x of [57, 893]) v.dot(x, 232, 3, C.deep);
  arrays.forEach((a, i) => {
    const x = 66 + i * 213;
    text(a, x, 200, 20, C.dim);
    wafer(x, 236, 178, 82, enabled[i] ? '4 B' : '···', enabled[i] ? dyes[i] : null, 31);
    if (b === 1 && i >= 2) text(i === 2 ? 'Average of g' : 'Average of g²', x, 369, 18, C.gold);
  });
  const allocated = parameterBytes(1, 4, enabled.filter(Boolean).length);
  readout(
    b === 2
      ? '10⁹ × 16 B = ' + (parameterBytes(1e9, 4, 4) / 2 ** 30).toFixed(2) + ' GiB'
      : allocated + ' B counted so far',
    b === 2
      ? 'Add activations and workspace to this parameter-state floor.'
      : b === 3
        ? 'PyTorch Adam allocates moments when this parameter first has a gradient at step().'
        : 'Count the weight, its gradient and both optimizer moments.',
  );
}
function scoreGrid(v, x, y, side, active, n) {
  const tick = side / 8;
  for (let j = 0; j < 8; j++)
    for (let i = 0; i < 8; i++)
      v.box(x + i * tick, y + j * tick, tick - 1, tick - 1, active && i < n && j < n ? C.mint : C.edge, 1);
}
export function activation(v) {
  const { b, cue, text, box, wafer, readout } = v;
  if (b < 2) {
    const dims = [32, 128, 768],
      bytes = activationBytes({ batch: 32, tokens: 128, width: 768, bytes: 4 });
    ['Examples', 'Tokens', 'Features', 'Bytes / FP32'].forEach((k, i) => {
      const x = 57 + i * 217;
      text(k, x, 176, 20, C.dim);
      wafer(x, 218, 166, 70, [...dims, 4][i], i === 3 ? C.gold : C.paper, 29);
      if (i < 3) text('×', x + 191, 254, 24, C.dim, 'center');
    });
    readout(
      b === 1 || cue(0, 'just to get the features') > 0
        ? 'Feature allocation   ' + bytes / 2 ** 20 + ' MiB'
        : 'Multiply the shape by the element size',
      'Forward can retain activations that backward will need.',
    );
  } else if (b <= 4) {
    const remove = cue(4, 'First remove half', 1.3),
      shorten = cue(4, 'shorten every example', 1.3);
    ['Try half the batch', 'Try half the sequence length'].forEach((name, k) => {
      const x = 68 + k * 460;
      text(name, x, 133, 23, k ? C.gold : C.blue);
      const count = k ? 4 : 4 - Math.floor(2 * remove),
        n = k ? 8 - Math.floor(4 * shorten) : 8;
      for (let i = 0; i < 4; i++)
        scoreGrid(v, x + (i % 2) * 102, 171 + Math.floor(i / 2) * 106, 91, i < count, n);
      text(scoreBytes(count, n) + ' scores', x + 221, 269, 22, C.silk, 'left', 'Mono', 158);
    });
    readout(
      b < 4
        ? 'Four sequences, eight positions, one head per sequence'
        : 'Two axes shrink when the sequence gets shorter',
      'One cell pairs one query position with one key position. Count only the stored cells.',
    );
  } else {
    const val = scoreBytes(32, 2048, 12, 12, 2);
    const height = 190,
      x = 59;
    for (let i = 11; i >= 0; i--) {
      box(x + 6 * i, 171 - 4 * i, 194, height, C.deep, 2);
      box(x + 6 * i + 1, 172 - 4 * i, 191, height - 3, i === 0 ? C.mint : C.edge, 2);
    }
    for (let i = 1; i < 8; i++) {
      v.line(x + 24 * i, 172, x + 24 * i, 359, '#529988', 1);
      v.line(x, 171 + 23 * i, x + 190, 171 + 23 * i, '#529988', 1);
    }
    text('Score grid (schematic)', 59, 383, 17, C.dim);
    text('2,048 queries × 2,048 keys', 368, 181, 25);
    text('32 sequences × 12 heads × 12 layers', 368, 239, 22, C.dim);
    text('2 bytes per saved score', 368, 292, 22, C.gold);
    readout(
      b === 6 || cue(5, 'gigabytes') === 1
        ? 'Full stored score grids   ' + (val / 1e9).toFixed(1) + ' GB'
        : 'Price the saved grids across the model',
      'Backends that avoid materializing the full grid have a different memory budget.',
    );
  }
}

export function precision(v) {
  const { b, cue, said, text, box, line, dot, wafer, readout } = v;
  const target = 1 - 0.0001,
    formats = [Math.fround, fp16, bf16];
  if (b <= 3) {
    const xFor = (value) => 120 + ((value - (1 - 2 ** -11)) / 2 ** -11) * 729;
    const written = cue(1, 'Write the candidate', 0);
    const midpoint = cue(2, 'get halfway', 0);
    v.box(45, 150, 865, 225, '#243e3c', 6);
    for (let i = 0; i <= 40; i++) {
      const x = 120 + (729 * i) / 40;
      for (const y of [193, 301]) line(x, y - (i % 5 ? 5 : 10), x, y + 3, '#8b9d86', 1);
    }
    ['FP32', 'FP16'].forEach((name, i) => {
      const y = 193 + 108 * i;
      text(name, 58, y - 34, 24, C.dim);
      line(120, y, 849, y, C.edge, 5);
      line(xFor(target), y - 15, xFor(target), y + 15, C.gold, 3);
      if (i && midpoint) {
        const mid = xFor(1 - 2 ** -12);
        line(mid, y - 13, mid, y + 13, C.paper, 2);
        text('midpoint', mid, y + 30, 16, C.paper, 'center');
      }
      const actual = formats[i](written ? target : 1);
      dot(xFor(actual), y, 9, i ? C.blue : C.mint);
      text(
        actual.toFixed(i ? 6 : 8),
        xFor(actual),
        y + 31,
        18,
        C.silk,
        'right',
        'Mono',
      );
    });
    text('next FP16 below 1', 117, 354, 16, C.dim);
    text('target 0.9999', xFor(target), 130, 17, C.gold, 'center');
    readout(
      b === 3 ? 'A full-precision master weight retains the update' : 'Candidate   1 − 0.0001',
      midpoint
        ? 'The FP16 midpoint lies farther from one than the candidate.'
        : 'Shared magnified scale near one',
    );
  } else if (b <= 5) {
    const layouts = [
      ['FP32', 8, 23],
      ['FP16', 5, 10],
      ['BF16', 8, 7],
    ];
    text('Sign', 54, 127, 18, C.red);
    text('Exponent sets range', 192, 127, 18, C.gold);
    text('Fraction sets spacing', 502, 127, 18, C.mint);
    layouts.forEach(([name, e, f], row) => {
      const y = 185 + row * 73;
      text(name, 55, y + 17, 20);
      for (let i = 0; i < 1 + e + f; i++)
        box(158 + i * 19, y, 17, 40, i === 0 ? C.red : i <= e ? C.gold : C.mint, 2);
      text('2^−' + [23, 10, 7][row], 856, y + 18, 19, C.silk, 'center', 'Mono');
    });
    readout(
      b === 4
        ? 'Gap just above 1   =   2 raised to minus the fraction-bit count'
        : 'BF16 spacing above 1 is eight times the FP16 spacing',
      'Each rectangle is one stored bit. FP16 and BF16 both occupy two bytes.',
    );
  } else if (b <= 7) {
    const input = cue(6, 'Move the input') === 1 ? 65520 : cue(6, 'fifteen units') > 0 ? 65519 : 65504;
    const x = (n) => 131 + (n - 65504) * 21;
    line(x(65504), 259, x(65536), 259, C.dim, 4);
    for (const [n, txt] of [
      [65504, 'largest finite'],
      [65520, 'halfway'],
      [65536, 'next power of 2'],
    ]) {
      line(x(n), 249, x(n), 273, C.paper, 3);
      text(n, x(n), 307, 19, C.silk, 'center', 'Mono');
      text(txt, x(n), 340, 16, C.dim, 'center');
    }
    dot(x(input), 252, 9, C.gold);
    text('input ' + input, x(input), 201, 24, C.gold, 'center', 'Mono');
    const read = input !== 65520 || cue(7, 'Every larger positive input') > 0;
    readout(
      'FP16 readback   ' + (read ? fp16(input) : '···'),
      'Round to nearest, ties to even. The upper endpoint exceeds the FP16 exponent range.',
    );
  } else {
    ['FP32', 'FP16', 'BF16'].forEach((name, i) => {
      const x = 64 + i * 299;
      text(name, x, 141, 24, C.dim);
      wafer(x, 190, 231, 64, String(formats[i](70000)), i === 1 ? C.red : C.paper, 27);
      wafer(x, 298, 231, 64, i === 0 ? formats[i](target).toFixed(7) : String(formats[i](target)), C.mint, 25);
    });
    readout(
      'Top   store 70,000     /     Bottom   store 0.9999',
      'A wider exponent range and a finer fraction solve different problems.',
    );
  }
}

export function budget(v) {
  const { b, cue, said, text, box, line, wafer, strip, readout } = v;
  if (b < 5) {
    const count =
      b === 0
        ? 1
        : b === 1
          ? 1 + Number(cue(1, 'Add a gradient') > 0) + 2 * Number(cue(1, 'add Adam', 0.85, 'Now add Adam') > 0)
          : 4;
    const doubled = b === 2 && cue(2, 'The stack doubles', 0),
      pricingFourBytes = b === 2 && !doubled && cue(2, 'Give each weight', 0),
      bytes = b === 3 || doubled ? 4 : 2,
      unit = parameterBytes(7e9, bytes, 1) / 1e9;
    const act = b === 4 ? (cue(4, 'Cut those activations') > 0 ? 4 : 8) : 0;
    const bottom = 378,
      dy = 2.12,
      y = (gb) => bottom - gb * dy;
    v.box(102, 126, 367, 258, '#18332e', 7);
    v.box(162, 132, 258, 247, '#0d231e', 4);
    for (let gb = 0; gb <= 112; gb += 7) {
      line(132, y(gb), gb % 14 === 0 ? 159 : 146, y(gb), '#80937f', 1);
      if (gb % 28 === 0) text(gb, 125, y(gb), 13, C.dim, 'right', 'Mono');
    }
    for (let i = 0; i < count; i++) {
      box(178, y((i + 1) * unit), 225, unit * dy - 1, dyes[i], 1);
      text(arrays[i] + '   ' + unit + ' GB', 289, y((i + 0.5) * unit), 16, C.ink, 'center');
    }
    if (act) box(178, y(count * unit + act), 225, act * dy - 1, C.red, 1);
    line(94, y(24), 176, y(24), C.red, 2);
    line(405, y(24), 474, y(24), C.red, 2);
    v.box(172, y(24) - 3, 5, 6, C.red, 1);
    v.box(404, y(24) - 3, 5, 6, C.red, 1);
    text('24 GB', 89, y(24), 17, C.red, 'right', 'Mono');
    text('7 billion parameters', 508, 164, 28);
    text((pricingFourBytes ? 'Baseline · ' : '') + bytes + ' bytes per stored value', 508, 222, 23, C.dim);
    text('Parameter state    ' + count * unit + ' GB', 508, 276, 23, C.gold, 'left', 'Mono', 390);
    if (act) text('Activations   +' + act + ' GB', 508, 326, 20, C.red, 'left', 'Mono');
    readout(
      [
        'The weights fit. Will the whole update fit?',
        count === 1 ? 'The weights fit. Will the whole update fit?' : 'Weights and gradients exceed 24 GB',
        pricingFourBytes ? '4 arrays × 7 billion values × 4 bytes = ?' : 'Inspect the stored dtypes even when autocast is active',
        'Include extra copies and any sharded state',
        'Shrinking activations leaves the parameter state in place',
      ][b],
    );
  } else if (b < 8) {
    const vals = [[1], [3, 3, 3]],
      den = vals.flat().length,
      sub = vals.map(sum);
    vals.forEach((a, i) => {
      const x = 77 + i * 377;
      text('Ticket ' + (i ? 'B' : 'A'), x, 155, 22);
      a.forEach((z, j) => wafer(x + j * 100, 209, 85, 62, z, i ? C.mint : C.blue, 28));
      if (cue(7, i === 0 ? 'and the second sums' : 'Divide each sum by four', 0))
        text('loss sum  ' + sub[i], x, 315, 22, C.silk, 'left', 'Mono');
    });
    const ready = cue(7, 'Accumulate their gradients') > 0;
    readout(
      ready
        ? '1 / 4 + 9 / 4 = ' + microLoss(sub, den)
        : 'Mean loss per valid token   =   sum of losses / valid tokens',
      b === 5
        ? 'Keep the effective batch. Accumulate gradients, then update once.'
        : 'Four valid tokens across the two microbatches.',
    );
  } else {
    const ignored = cue(12, 'ignore the second target', 0);
    const weights = [0, 1];
    const out = targetLoss(weights, [true, !ignored]);
    const weighted = cue(9, 'Give the first ticket', 0);
    const local = cue(10, 'Try its own mean', 0);
    const tally = cue(10, 'Now add the weights', 0);
    const full = said(10);
    const divide = cue(11, 'Divide each microbatch', 0);
    const resultA = cue(11, 'Zero divided by one gives zero', 0);
    const combined = cue(11, 'from ticket B alone', 0);
    const noWeight = cue(13, 'so the mean is undefined', 0);
    const undefinedMean = cue(13, 'Skip the update', 0);
    const skip = cue(13, 'You would do the same', 0);
    weights.forEach((w, i) => {
      const x = 68 + i * 438;
      strip(x, 133, 388, 245);
      text('TICKET ' + (i ? 'B' : 'A'), x + 26, 160, 19, C.ink, 'left', 'Mono');
      text('p(target) = ½', x + 26, 198, 20, C.ink, 'left', 'Mono');
      text(ignored && i ? 'ignored target' : weighted ? 'target weight   ' + w : 'loss   ln(2)',
        x + 26, 233, 20, C.ink, 'left', 'Mono');
      if (b < 10) return;
      const loss = out.sums[i] === 0 ? '0' : 'ln(2)';
      text(ignored && i ? 'excluded' : 'weighted sum   ' + loss, x + 26, 267, 19, C.ink, 'left', 'Mono');
      if (ignored || (!local && !divide) || (i && !divide)) return;
      line(x + 25, 290, x + 362, 290, C.shade, 1);
      text(divide ? 'For backward' : 'Local mean', x + 26, 313, 17, C.ink);
      const fraction = loss + ' / ' + (divide ? out.total : out.counts[i]);
      const result = !divide ? 'undefined' : !i && resultA ? String(out.contributions[i]) : '';
      text(fraction + (result ? ' = ' + result : ''), x + 26, 347, 24, C.ink, 'left', 'Mono', 334);
    });
    let headline = b === 8 ? 'Two equal logits per ticket' : 'What does ticket A contribute to backward?';
    if (local) headline = 'A local mean needs a nonzero target weight';
    if (tally) headline = 'Full-batch weight    ' + out.counts.join(' + ') + (full ? ' = ' + out.total : '');
    if (combined && !ignored) headline += '      Mean loss ≈ ' + out.mean.toFixed(3);
    if (ignored) headline = 'One target is ignored. Should the optimizer step?';
    if (noWeight) headline = 'Full-batch weight = ' + out.total;
    if (undefinedMean) headline += '    ·    mean undefined';
    if (skip) headline += '    ·    skip the update';
    readout(headline, 'Class-weighted mean with integer targets');
  }
}
export function controls(v) {
  const { b, cue, text, wafer, line, readout } = v;
  const g = 2 ** -25,
    scaled = fp16(g * 128),
    traces = precisionFailureTraces();
  if (b < 2) {
    const active = cue(1, 'Scale the loss', 1);
    const vals = active
      ? ['2^−25', '× 128', scaled.toExponential(2), '2^−25']
      : ['2^−25', '× 1', String(fp16(g)), '0'];
    ['Gradient', 'Scale', 'FP16 storage', 'Unscale in FP32'].forEach((l, i) => {
      const x = 51 + i * 218;
      text(l, x, 179, 18, C.dim);
      wafer(x, 221, 180, 71, vals[i], i === 2 ? C.gold : C.paper, 23);
    });
    readout(
      active ? 'The scaled intermediate survives the FP16 store' : 'A tiny gradient rounds to zero in FP16',
      'Scale the loss before backward. Check finite gradients after unscaling.',
    );
  } else if (b < 4) {
    const full = b === 3 && cue(3, 'recover in full precision') > 0;
    [
      [
        'Overflow route',
        '300 × 300',
        full ? 90000 : traces.overflow.product,
        full ? traces.overflow.fp32 : traces.overflow.fp16,
      ],
      [
        'Underflow route',
        'store 2^−25',
        full ? '2^−25' : traces.underflow.stored,
        full ? traces.underflow.fp32 : traces.underflow.fp16,
      ],
    ].forEach(([l, input, value, result], i) => {
      const x = 71 + i * 442;
      text(l, x, 139, 22, C.dim);
      text(input, x, 191, 22, C.silk, 'left', 'Mono');
      wafer(x, 229, 316, 59, String(value), full ? C.mint : C.gold, 25);
      text(
        (i ? 'value / value' : 'product − product') + ' = ' + result,
        x,
        337,
        19,
        C.silk,
        'left',
        'Mono',
        358,
      );
    });
    readout(
      full ? 'Replay in FP32   ·   first difference is visible' : 'Two different failures can both end in NaN',
      'Check the first nonfinite or rounded-to-zero intermediate.',
    );
  } else {
    const input = Math.fround(1.0001),
      reduced = roundedFormat(input, 10, -126, 127),
      on = cue(4, 'Switch the multiply inputs') > 0;
    ['Input tensor', 'Multiply input', 'Output tensor'].forEach((l, i) => {
      const x = 57 + i * 299;
      text(l, x, 150, 21, C.silk);
      for (let j = 0; j < 32; j++)
        v.box(
          x + (j % 16) * 14,
          201 + Math.floor(j / 16) * 25,
          12,
          20,
          i === 1 && on && j >= 19 ? C.edge : j < 9 ? C.gold : C.mint,
          1,
        );
      const val = i === 0 || !on ? input : reduced;
      text(val === 1 ? '1' : val.toFixed(7), x, 290, 22, C.paper, 'left', 'Mono');
      text(i === 1 ? (on ? 'TF32 input precision' : 'IEEE FP32') : 'FP32   ·   4 bytes', x, 332, 18, C.dim);
    });
    readout(
      'One nonzero product   ·   weight × 1   ·   FP32 accumulation',
      'Record the matmul precision setting. Compare the output against a tolerance.',
    );
  }
}
export function allocator(v) {
  const { b, cue, box, text, wafer, readout } = v;
  const s = cachedBlockRelease(cue(1, 'Watch which blocks leave', 1.8)),
    slots = series(11);
  text('One block = 1 GiB', 55, 127, 21, C.dim);
  slots.forEach((i) => {
    const x = 58 + i * 78,
      cache = i === 8 || i === 9,
      p = cache ? s.blocks[i - 8].motion : 0;
    if (p === 1) {
      v.line(x, 228, x + 62, 228, C.edge, 2);
      return;
    }
    wafer(
      x,
      203 - 60 * p,
      64,
      64,
      i === 10 ? 'ctx' : cache ? 'free' : i,
      cache ? C.gold : i === 10 ? C.red : C.mint,
      19,
    );
  });
  const total = [s.allocated, s.reserved, s.modeledDriver];
  ['Allocated', 'Reserved', 'Driver-visible'].forEach((name, i) =>
    text(name + '   ' + total[i] + ' GiB', 60 + i * 297, 323, 21, i === 1 ? C.gold : C.silk),
  );
  if (b === 2) {
    text('GPU activity', 58, 369, 16, C.dim);
    v.line(194, 379, 864, 379, C.edge);
    const busy = cue(2, 'short burst', 1.2);
    box(190 + 541, 355, 94 * busy, 24, C.mint, 1);
  }
  readout(
    b === 2
      ? 'Resident weights can sit idle while the CPU prepares data'
      : b === 1
        ? 'empty_cache() releases unused cached blocks'
        : 'Live tensors + unused allocator cache + external context',
    'Illustrative ownership model. Other processes and libraries can add to the driver total.',
  );
}

import {
  C,
  base,
  scope,
  rect,
  line,
  num,
  text,
  note,
  opacity,
  cue,
  bits,
  ruler,
  probe,
  arrow,
  dot,
  short,
} from './bench.mjs';
import {
  roundTrip,
  encode8,
  roundedOverflow,
  stochasticNeighbor,
} from '../../../films/low-precision-kernels/encoding.mjs';
import { experiment } from '../../../films/low-precision-kernels/model.mjs';

export const previousPeak = 10;
export const peak = experiment.rows[1][3];
export const ceiling = encode8(1e6).value;
export const stale = roundTrip(peak, previousPeak / ceiling);
export const fresh = roundTrip(peak, peak / ceiling);
export const sampleInputs = experiment.rows[1].slice(0, 4);
const captures = sampleInputs.map((x) => roundTrip(x, stale.scale));
export function capture(g, k) {
  base(g, 'Would you pass this conversion?', 'Activation capture  /  OCP E4M3');
  scope(g, 84, 231, 1150, 548);
  text(g, 'Original activation', 139, 300, 37, C.ref);
  const decoded = cue(k, 1, 'Only ten comes back');
  opacity(g, decoded, () => text(g, 'After decoding', 644, 300, 37, C.decoded));
  const y = (x) => 708 - x * 0.71;
  for (const v of [0, 125, 250, 375, 500]) {
    line(g, 220, y(v), 1172, y(v), C.grid, 2);
    num(g, v, 196, y(v) + 8, 26, C.pale, 'right');
  }
  const intro = cue(k, 0, 'This activation', 0.8);
  captures.forEach((v, i) => {
    const x = 277 + i * 231;
    opacity(g, 0.5 + 0.5 * intro, () => {
      rect(g, x, y(v.original), 142, y(0) - y(v.original), C.ref);
      num(g, v.original, x + 71, y(v.original) - 13, 31, C.ref, 'center');
    });
    opacity(g, decoded, () =>
      rect(g, x + 13, y(v.reconstructed), 116, y(0) - y(v.reconstructed), C.decoded),
    );
    num(g, 'k = ' + i, x + 71, 753, 25, C.pale, 'center');
  });
  const history = cue(k, 0, 'Yesterday the largest');
  opacity(g, history, () =>
    line(g, 223, y(previousPeak), 1173, y(previousPeak), C.decoded, 3, [10, 9]),
  );
  text(g, 'Yesterday’s range', 1283, 324, 33, C.muted);
  num(g, '±' + previousPeak, 1277, 437, 100, C.teal);
  text(g, 'Current peak', 1283, 529, 33, C.muted);
  num(g, peak, 1277, 636, 100);
  opacity(g, decoded, () => {
    const x = 1136;
    line(g, x, y(peak), x, y(stale.reconstructed), C.decoded, 4);
    for (const v of [peak, stale.reconstructed]) line(g, x - 13, y(v), x + 13, y(v), C.decoded, 4);
    text(g, 'Decoded', 1283, 704, 33, C.oxide);
    num(g, short(stale.reconstructed), 1502, 728, 70, C.oxide);
  });
  if (cue(k, 2, 'The multiplier gets twenty', 0))
    note(
      g,
      'Original   ' +
        peak +
        ' × 2 = ' +
        peak * 2 +
        '        Decoded   ' +
        stale.reconstructed +
        ' × 2 = ' +
        stale.reconstructed * 2,
      'The multiplier acts on the reconstructed height.',
    );
  else if (cue(k, 1, 'The gap is', 0))
    note(
      g,
      'Missing height   ' +
        short(peak - stale.reconstructed) +
        ' / ' +
        peak +
        '  =  ' +
        Math.round((-stale.error * 100) / peak) +
        '%',
      'The multiplier receives the reconstructed height.',
    );
  else if (decoded > 0) note(g, 'Read the ochre height against the original peak.');
  else if (cue(k, 0, 'It reports a finite value', 0) > 0)
    note(
      g,
      'Finite value returned. Has the peak survived?',
      'Compare the reconstructed height with the input on the same scale.',
    );
  else note(g, 'Four consecutive inputs from the spike row');
}

export const midpoints = [1.0625, 1.1875];
export const subStep = 2 ** -9;
export const subProbes = [0.25, 1.5].map((v) => ({ steps: v, code: encode8(v * subStep).code }));
export const chance = stochasticNeighbor(1.03125);
const formats = [
  ['E4M3', 4, 3, 1],
  ['E5M2', 5, 2, 1],
  ['FP16', 5, 10, 2],
  ['BF16', 8, 7, 2],
  ['TF32 multiply', 8, 10, 4],
];
function budget(g, k) {
  base(g, 'Which bits buy range and spacing?', 'Format selection  /  near one');
  for (const [i, [name, e, m, bytes]] of formats.entries()) {
    const y = 269 + i * 99;
    text(g, name, 99, y + 44, 37);
    const start = 416,
      step = 30;
    for (let b = 0; b < 1 + e + m; b++)
      rect(g, start + b * step, y + 2, step - 3, 47, b === 0 ? C.grid : b <= e ? C.teal : C.oxide);
    num(g, '1/' + 2 ** m, 1225, y + 42, 40, C.teal);
    num(g, bytes + ' B', 1626, y + 42, 39);
  }
  text(g, 'Spacing at 1', 1200, 247, 27, C.muted);
  text(g, 'Stored', 1618, 247, 27, C.muted);
  const limits = cue(k, 7, 'When choosing an eight-bit input', 0);
  note(
    g,
    limits ? 'FP8 ceilings    E4M3  448     /     E5M2  57,344' : 'Sign  /  exponent  /  fraction',
    'TF32 shows the effective multiply fields. Its operand occupies four bytes in FP32 storage.',
  );
}
export function grids(g, k) {
  const b = k.beat.beatIndex;
  if (b === 7) return budget(g, k);
  if (b === 6) {
    base(g, 'Which input actually overflows?', 'OCP E4M3  /  scale = 1  /  nearest even');
    const showSecond = cue(k, 6, 'Four hundred sixty-five', 0);
    [449, 465].forEach((v, i) => {
      const x = 94 + 900 * i,
        r = roundedOverflow(v);
      opacity(g, i ? showSecond : 1, () => {
        scope(g, x, 271, 830, 444);
        text(g, 'Input', x + 54, 345, 32, C.pale);
        num(g, v, x + 50, 442, 85, C.light);
        text(g, 'After rounding', x + 368, 345, 32, C.pale);
        num(g, r.rounded, x + 366, 442, 85, C.ref);
        arrow(g, x + 234, 408, x + 328, 408, C.pale);
        line(g, x + 50, 495, x + 780, 495, C.grid);
        text(
          g,
          r.overflow ? 'Rounded magnitude exceeds 448' : 'Rounded magnitude fits',
          x + 50,
          571,
          37,
          C.light,
        );
        if (!i || cue(k, 6, 'Saturating conversion', 0))
          num(g, 'Saturating  →  ' + r.result, x + 50, 657, 41, C.decoded);
      });
    });
    note(
      g,
      'Compare the rounded magnitude with the finite ceiling.',
      cue(k, 6, 'A non-saturating overflow', 0)
        ? 'Non-saturating overflow yields NaN in E4M3 or infinity in E5M2 at its own ceiling.'
        : '',
    );
    return;
  }
  if (b === 4 || b === 5) {
    base(
      g,
      'How often should the encoder round up?',
      'Stochastic rounding  /  finite neighboring values',
    );
    const x = (v) => 230 + ((v - 1) / 0.125) * 1460,
      y = 500;
    ruler(g, [chance.lower, chance.upper], x, y, short);
    probe(g, x(chance.expected), y, short(chance.expected));
    const a = cue(k, 5, 'One quarter');
    opacity(g, a, () => {
      rect(g, 230, 643, 1460 * (1 - chance.p), 70, C.teal);
      rect(g, 230 + 1460 * (1 - chance.p), 643, 1460 * chance.p, 70, C.oxide);
      text(g, 'Lower  ·  75%', 266, 691, 39, C.light);
      text(g, 'Upper  ·  25%', 1360, 691, 39, C.light);
    });
    note(
      g,
      cue(k, 5, 'Their weighted mean', 0)
        ? 'Mean = 0.75 × 1 + 0.25 × 1.125 = ' + short(chance.expected)
        : 'Each write can land on either neighboring mark.',
      'For a finite input between adjacent marks, P(upper) = (input − lower) / (upper − lower).',
    );
    return;
  }
  if (b === 3) {
    base(g, 'What happens in the first two steps?', 'Subnormal grid  /  E4M3  /  nearest even');
    const x = (v) => 244 + v * 675,
      y = 558;
    ruler(g, [0, 1, 2], x, y, (v) => (v === 0 ? '0' : v + 'd'));
    const second = cue(k, 3, 'One and a half steps', 0) > 0;
    const p = subProbes[Number(second)],
      a = second ? cue(k, 3, 'The even code', 0) : cue(k, 3, 'rounds to zero', 0);
    probe(g, x(p.steps), y, short(p.steps) + 'd');
    opacity(g, a, () => {
      arrow(g, x(p.steps), y - 25, x(p.code), y - 25, C.oxide);
      dot(g, x(p.code), y, 15, C.teal);
    });
    note(
      g,
      'Smallest subnormal   d = 1/512',
      a
        ? 'Stored code ' + p.code + '   ·   ' + (p.code === 0 ? 'zero' : 'two subnormal steps')
        : 'Rounding to the nearest representable mark',
    );
    return;
  }
  const across = cue(k, 2, 'Zoom out across four', 0) > 0;
  if (across) {
    base(g, 'What changes at four?', 'Normal grid  /  E4M3');
    const x = (v) => 220 + (v - 2) * 243;
    const ticks = [
      ...Array.from({ length: 8 }, (_, i) => 2 + i / 4),
      ...Array.from({ length: 9 }, (_, i) => 4 + i / 2),
    ];
    ruler(g, ticks, x, 546, (v) => (Number.isInteger(v) ? String(v) : ''));
    [
      [2, 4, '8 intervals of 0.25'],
      [4, 8, '8 intervals of 0.5'],
    ].forEach(([a, b, l]) => {
      line(g, x(a), 408, x(b) - 6, 408, a === 2 ? C.teal : C.oxide, 8);
      text(g, l, (x(a) + x(b)) / 2, 374, 36, C.ink, { align: 'center' });
    });
    note(
      g,
      'Three fraction bits give eight intervals per normal octave.',
      'E5M2 extends the finite ceiling to 57,344 and has four intervals per normal octave.',
    );
    return;
  }
  base(g, 'Which neighbor gets the midpoint?', 'Normal grid  /  E4M3  /  nearest even');
  const x = (v) => 221 + (v - 1) * 1500,
    y = 500;
  const ticks = Array.from({ length: 9 }, (_, i) => 1 + i / 8);
  ruler(g, ticks, x, y, (v) => short(v));
  const second = cue(k, 1, 'Move the probe', 0) > 0;
  const input = midpoints[Number(second)],
    q = encode8(input);
  const hasProbe = b > 0 && cue(k, 1, 'Put the probe', 0) > 0;
  if (hasProbe) probe(g, x(input), y, short(input));
  const selected = second ? cue(k, 2, 'Up to one', 0) : cue(k, 1, 'Here it picks one', 0);
  if (selected) {
    dot(g, x(q.value), y, 16, C.teal);
    bits(g, q.code, 885, 676, 600, 70);
    num(g, short(q.value), 1526, 734, 51, C.teal);
  }
  if (hasProbe && !selected) {
    const lo = Math.floor(input * 8) / 8,
      hi = lo + 1 / 8;
    const low = encode8(lo).code,
      high = encode8(hi).code;
    num(g, short(lo) + '   ' + low.toString(2).padStart(8, '0'), 144, 720, 40);
    num(g, short(hi) + '   ' + high.toString(2).padStart(8, '0'), 966, 720, 40);
  } else text(g, hasProbe ? 'Stored byte' : 'Fields in an E4M3 byte', 117, 724, 39);
  if (!hasProbe) {
    for (const [i, n] of ['S', 'E', 'E', 'E', 'E', 'F', 'F', 'F'].entries()) {
      rect(g, 713 + i * 85, 657, 78, 82, i === 0 ? C.grid : i < 5 ? C.teal : C.oxide);
      num(g, n, 752 + i * 85, 713, 43, C.light, 'center');
    }
  }
  note(
    g,
    selected
      ? 'The chosen code ends in zero.'
      : hasProbe
        ? 'Which neighbor has an even low bit?'
        : 'One sign bit, four exponent bits and three fraction bits.',
    b === 0
      ? 'Count the intervals from one to two.'
      : 'In [1, 2), the E4M3 step is 1/8. The final tick begins the next octave.',
  );
}

export function scales(g, k) {
  const b = k.beat.beatIndex;
  if (b >= 3) {
    base(
      g,
      b === 3 ? 'When is the maximum available?' : 'Where are the wider values read?',
      b === 3 ? 'Scale timing  /  device dependencies' : 'Reported DeepSeek-V3 quantization path',
    );
    const lane = (y, name, nodes, active) => {
      text(g, name, 93, y + 44, 40, C.ink, { face: 'Lesson Serif' });
      nodes.forEach((v, i) => {
        const x = 415 + i * 356;
        rect(g, x, y, 322, 105, i <= active ? C.teal : C.faint);
        text(g, v, x + 161, y + 65, 33, i <= active ? C.light : C.ink, {
          align: 'center',
          width: 295,
        });
        if (i < nodes.length - 1) arrow(g, x + 323, y + 53, x + 350, y + 53, C.muted, 3);
      });
    };
    if (b === 3) {
      const twice = cue(k, 3, 'then again', 0),
        history = cue(k, 3, 'Delayed scaling', 0);
      lane(
        355,
        'Current',
        ['Read X for max', 'Choose scale', 'Read X to cast', 'Write codes'],
        twice ? 3 : 0,
      );
      lane(
        574,
        'Delayed',
        ['Prior maxima', 'Choose scale', 'Read X to cast', 'Write + log max'],
        history ? 3 : -1,
      );
      note(
        g,
        'Quantization reads of X   ·   current 2   /   delayed 1',
        'Example device recipes. The arrows show dependencies. Subsequent matrix reads are separate.',
      );
    } else {
      lane(
        426,
        'Online',
        ['Read BF16', 'Quantize', 'Write FP8', 'MMA reads FP8'],
        Math.min(3, Math.floor(cue(k, 4, 'read wider values', 2) * 4)),
      );
      text(g, 'Activation groups  1 × 128', 420, 664, 36, C.muted);
      text(g, 'Weight blocks  128 × 128', 1068, 664, 36, C.muted);
      note(
        g,
        'Online measurement can still write an intermediate.',
        cue(k, 4, 'groups of one hundred', 0)
          ? 'The reported kernel promoted partials to FP32 after 128 contraction terms.'
          : 'The report proposed combining the cast with the transfer as future work.',
      );
    }
    return;
  }
  const changed = cue(k, 1, 'Reuse the scale', 0) > 0,
    renewed = cue(k, 2, 'Measure the current peak', 0) > 0;
  const trip = renewed ? fresh : changed ? stale : roundTrip(previousPeak, previousPeak / ceiling);
  base(g, 'Which value comes back from the top code?', 'Round trip  /  saturating E4M3');
  const result = renewed
    ? cue(k, 2, 'Now the same top code', 0)
    : changed
      ? cue(k, 1, 'the answer is ten', 0)
      : cue(k, 0, 'returns as ten', 0);
  const entries = [
    ['Input', short(trip.original)],
    ['Divide by S', short(trip.scaled)],
    ['FP8 value', short(trip.value)],
    ['Multiply by S', result ? short(trip.reconstructed) : '?'],
  ];
  entries.forEach(([l, v], i) => {
    const x = 90 + i * 445;
    scope(g, x, 336, 365, 296);
    text(g, l, x + 30, 404, 33, C.pale);
    num(g, v, x + 182, 552, 72, i === 2 ? C.decoded : C.light, 'center');
    if (i < 3) arrow(g, x + 372, 485, x + 432, 485, C.muted, 4);
  });
  num(g, 'S = ' + (renewed ? peak : previousPeak) + ' / ' + ceiling, 95, 742, 56, C.teal);
  note(
    g,
    renewed
      ? 'Current maximum sets the reconstruction scale.'
      : changed
        ? 'The new input still uses yesterday’s scale.'
        : 'Yesterday’s maximum sets the reconstruction scale.',
    renewed
      ? 'Positive maximum: S = amax / 448. With α = 1/S, encode αx and reconstruct q/α. All-zero policy: S = 1.'
      : 'For S > 0, encode Q(x/S) and reconstruct S × q.',
  );
}

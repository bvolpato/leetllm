import { fp16, bf16 } from '../../../films/mixed-precision/arithmetic.mjs';
import { above, below, weightHistory } from '../../../films/mixed-precision/weight-ruler.mjs';
import { precisionBoundaryFixture } from '../../../films/mixed-precision/fixtures.mjs';
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
  mix,
  num,
  pointer,
  reading,
  scale,
  text,
  title,
} from './drawing.mjs';

export const boundary = precisionBoundaryFixture();
export const history = weightHistory(6);
const target = boundary.requested;
const fine = Math.fround(target),
  fineGap = 2 ** -24;
const indices = (count) => Array.from({ length: count }, (_, i) => i);
export function opening(g, c) {
  const request = at(c, 1, 'Take away', 0.85);
  const half = at(c, 2, 'FP16 rounds back', 0.48),
    single = at(c, 2, 'FP32 rounds', 0.48);
  const x = (v) => 450 + ((v - below) / (1 - below)) * 1190;
  const aim = mix(1, target, request);
  title(g, 'Subtract 0.0001 from one', 'Weight storage   /   nearest-even rounding');
  for (const [i, label, land, result, col] of [
    [0, 'FP16', half, fp16(target), C.blue],
    [1, 'FP32', single, fine, C.green],
  ]) {
    const y = 410 + 228 * i;
    casing(g, 96, y - 115, 1728, 174);
    text(g, label, 155, y - 5, 54, col, 'left', 'Mono');
    if (i === 0) scale(g, x(below), x(1), y, [x(below), x(1)], col);
    else {
      // 8,192 intervals occupy less than a pixel apiece at this magnification.
      box(g, x(below), y - 8, x(1) - x(below), 16, col);
      line(g, x(1), y - 18, x(1), y + 18, col, 4);
    }
    const xpos = x(mix(aim, result, land));
    pointer(g, xpos, y - 3, land === 1 ? col : C.yellow);
    if (land === 1) num(g, fmt(result), xpos - 20, y - 64, 38, col, 'right');
    if (i === 0) {
      num(g, '0.99951171875', x(below), y + 40, 26, col);
      num(g, '1', x(1), y + 40, 26, col, 'center');
    } else num(g, '1', x(1), y + 40, 26, col, 'center');
  }
  if (request > 0) {
    line(g, x(aim), 413, x(aim), 584, C.ochre, 3, [8, 6]);
    dot(g, x(aim), 410, 6, C.yellow, C.ochre);
    if (request === 1) num(g, 'Requested  0.9999', x(aim) - 24, 506, 29, C.ochre, 'right');
  }
  const zoom = at(c, 1, 'FP32 fits', 0.4);
  fade(g, zoom, () => {
    const y = 869,
      z = (v) => 650 + ((v - fine) / fineGap) * 738;
    line(g, x(target), 697, 1430, 737, C.dim, 2);
    casing(g, 294, 735, 1430, 218, C.white);
    text(g, 'FP32 close-up', 346, 803, 34, C.green);
    scale(g, 560, 1500, y, [z(fine), z(fine + fineGap)], C.green);
    num(g, fine.toFixed(8), z(fine), y + 53, 32, C.green, 'center');
    num(g, (fine + fineGap).toFixed(8), z(fine + fineGap), y + 53, 32, C.green, 'center');
    const pos = z(mix(target, fine, single));
    pointer(g, pos, y - 3, single === 1 ? C.green : C.yellow);
    num(
      g,
      single === 1 ? 'stored' : '0.9999',
      pos + 25,
      y - 49,
      30,
      single === 1 ? C.green : C.ochre,
    );
  });
  if (c.beat.beatIndex === 2)
    text(g, 'FP32 update weight   →   FP16 multiply operand', 960, 1021, 36, C.ink, 'center');
}
export function neighbors(g, c) {
  const replay = at(c, 3, 'Try four'),
    delta = replay ? 0.0004 : 0.0003;
  const requested = at(c, 1, 'subtract three', 0.7);
  const x = (v) => 912 + (v - 1) * 820000;
  title(g, 'One has two different neighbors', 'FP16 at a power of two   /   nearest-even rounding');
  for (const [i, sign, phrase] of [
    [0, -1, 'It lands on the lower neighbor'],
    [1, 1, 'lands back on one'],
  ]) {
    const y = 449 + i * 311,
      other = sign < 0 ? below : above;
    casing(g, 95, y - 145, 1730, 258);
    text(g, sign < 0 ? 'Subtract' : 'Add', 156, y - 36, 44, C.ink, 'left', 'Serif');
    num(g, (sign < 0 ? '−' : '+') + delta.toFixed(4), 156, y + 31, 40);
    const coords = [below, 1, above].map(x);
    scale(g, coords[0], coords[2], y, coords, C.blue);
    for (const v of [below, 1, above])
      num(g, v === 1 ? '1' : v.toFixed(8), x(v), y + 55, 30, C.blue, 'center');
    const mid = (1 + other) / 2;
    line(g, x(mid), y - 68, x(mid), y + 8, C.red, 3, [8, 7]);
    text(g, 'halfway', x(mid), y - 85, 28, C.red, 'center');
    const start = 1 + sign * delta * requested,
      dest = fp16(1 + sign * delta);
    const landed = at(c, 2, phrase, 0.4);
    if (requested > 0) {
      dot(g, x(start), y - 18, 8, C.yellow, C.ink);
      line(g, x(start), y - 18, x(mix(start, dest, landed)), y - 18, C.ochre, 3);
    }
    pointer(g, x(mix(start, dest, landed)), y - 21, landed === 1 ? C.blue : C.yellow);
  }
  text(g, 'Gap below one = 1 / 2,048', 450, 993, 38, C.ink, 'center');
  text(g, 'Gap above one = 1 / 1,024', 1330, 993, 38, C.ink, 'center');
}
export function formats(g, c) {
  const b = c.beat.beatIndex + 1;
  if (b <= 2) {
    title(
      g,
      'Spend the same sixteen bits',
      'One interval above 1.0, enlarged equally on both scales',
    );
    for (const [i, name, e, f] of [
      [0, 'FP16', 5, 10],
      [1, 'BF16', 8, 7],
    ]) {
      const y = 319 + 330 * i;
      text(g, name, 100, y + 58, 55, C.ink, 'left', 'Mono');
      bitword(g, 327, y, e, f, 650);
      const l = 1150,
        r = 1720,
        steps = 2 ** (f - 7);
      const tick = indices(steps + 1).map((k) => l + ((r - l) * k) / steps);
      scale(g, l, r, y + 45, tick, i ? C.green : C.blue);
      num(g, '1', l, y + 106, 33, C.ink, 'center');
      num(g, '1 + 1/128', r, y + 106, 31, C.ink, 'center');
      fade(g, at(c, 2, 'eight FP16 gaps', 0.4), () =>
        brace(g, l, r, y + 149, steps + (steps === 1 ? ' gap' : ' gaps')),
      );
    }
    return;
  }
  title(g, 'Follow one parameter through AMP', 'Example CUDA recipe with FP32 parameters');
  const back = b >= 5 && at(c, 5, 'Run backward');
  const labels = [
    ['Parameter', 'FP32'],
    ['Matrix operands', 'BF16'],
    ['Cross entropy', 'FP32'],
  ];
  casing(g, 106, 305, 1708, 301);
  for (const [i, [label, dtype]] of labels.entries()) {
    const x = 202 + i * 565;
    text(g, label, x, 413, 38);
    num(g, dtype, x, 520, 64, i === 1 ? C.blue : C.green);
    if (i < 2) arr(g, x + 273, 493, x + 459, 493, C.dim);
  }
  brace(g, 716, 1759, 638, 'forward autocast region');
  if (back) {
    arr(g, 1465, 727, 439, 727, C.green);
    reading(g, 159, 830, 'Accumulated parameter gradient', 'FP32', C.green);
    text(g, 'backward follows forward dtypes', 1010, 866, 39, C.ink);
  } else {
    text(
      g,
      b === 3 ? 'Weight and Adam moments' : 'Autocast eligibility',
      151,
      810,
      40,
      C.ink,
      'left',
      'Serif',
    );
    text(
      g,
      b === 3
        ? 'FP32 weights, Adam m and v'
        : 'Eligible out-of-place operations use their assigned dtype.',
      151,
      879,
      37,
      C.green,
    );
    text(
      g,
      b === 3
        ? 'Choose partial sums and gradient reduction separately.'
        : 'Explicit dtype arguments and in-place calls have different rules.',
      151,
      946,
      32,
      C.dim,
    );
  }
}
const smallGrad = 1.2e-8;
export const rangeExamples = [smallGrad, boundary.large];
export function range(g, c) {
  const b = c.beat.beatIndex + 1;
  title(g, 'Two casts, opposite ends', 'Input magnitude on a logarithmic scale');
  const x = (v) => 220 + ((Math.log10(v) + 8.8) / 14.5) * 1490,
    y = 407;
  const min = 2 ** -25,
    max = 65504;
  box(g, x(min), y - 52, x(max) - x(min), 105, C.mint);
  scale(
    g,
    x(3e-9),
    x(3e5),
    y,
    indices(14).map((i) => x(10 ** (i - 8))),
    C.dim,
  );
  for (const [v, lab] of [
    [min, 'Half-step ≈ 2.98e-8'],
    [max, '65,504'],
  ]) {
    line(g, x(v), y - 75, x(v), y + 63, C.red, 3);
    text(g, lab, x(v), y + 109, 31, C.red, 'center');
  }
  const active = at(c, 1, 'Put a forward activation', 0.35);
  [1, active].forEach((a, i) => fade(g, a, () => pointer(g, x(rangeExamples[i]), y - 5)));
  for (const [i, name] of ['Gradient', 'Activation'].entries()) {
    if (i === 1 && !active) continue;
    const col = 475 + i * 775;
    text(g, name, col, 654, 46, C.ink, 'center', 'Serif');
    num(g, i ? '100,000' : '1.2e-8', col, 720, 45, C.ochre, 'center');
  }
  for (const [i, name, cast, stage, phrase] of [
    [0, 'FP16', fp16, 2, 'gradient becomes zero'],
    [1, 'BF16', bf16, 3, 'Both fit'],
  ]) {
    const yy = 832 + i * 97;
    num(g, name, 122, yy, 39, i ? C.green : C.blue);
    for (const [j, v] of rangeExamples.entries()) {
      const ready = at(c, stage, !i && j ? 'activation becomes infinity' : phrase);
      const val = cast(v);
      num(
        g,
        ready ? (j === 0 && i ? val.toExponential(2) : fmt(val)) : '?',
        475 + j * 775,
        yy,
        49,
        ready ? (i ? C.green : C.red) : C.dim,
        'center',
      );
    }
  }
}
export const tiny = boundary.gradient,
  S = 256,
  sub = 2 ** -24;

function spacingProgress(clock, beat, firstPhrase, lastPhrase = firstPhrase) {
  const current = clock.beat.beatIndex + 1;
  if (current !== beat) return current > beat ? 1 : 0;
  const { start } = clock.wordCue(firstPhrase);
  const { end } = clock.wordCue(lastPhrase);
  return clock.reveal(firstPhrase, end - start, { captionStart: firstPhrase });
}

export function spacings(g, c) {
  const direct = spacingProgress(c, 1, 'The cast stores zero') === 1;
  const lateScale = spacingProgress(c, 1, 'Multiplying that stored zero later still gives zero') === 1;
  const replay = at(c, 2, 'Run the same backward pass again');
  const showScale = spacingProgress(c, 2, 'multiply the loss by two hundred fifty-six') === 1;
  const scaled = spacingProgress(c, 2, 'A quarter of a spacing becomes sixty-four whole spacings');
  const stored = spacingProgress(c, 2, 'The cast stores that point exactly') === 1;
  const widen = at(c, 3, 'Move that stored value into FP32');
  const unscale = spacingProgress(c, 3, 'divide by the same scale', 'We recover the original gradient');
  const scaledGradient = tiny * S;
  const storedGradient = fp16(scaledGradient);
  const wideGradient = Math.fround(storedGradient);
  const recovered = Math.fround(wideGradient / S);
  const originalLabel = `1/${sub / tiny} spacing`;
  title(
    g,
    'Measure the gradient in FP16 spacings',
    'One spacing is the smallest positive subnormal. This path preserves subnormals.',
  );
  const l = 345,
    r = 1540,
    y = 410;
  casing(g, 94, 273, 1728, 249);
  text(g, 'Direct FP16 cast (close-up)', 148, 330, 36);
  scale(g, l, r, y, [l, r], C.blue);
  num(g, '0', l, y + 66, 38, C.blue, 'center');
  num(g, '1 spacing', r, y + 66, 37, C.blue, 'center');
  const closeUp = (value) => l + ((r - l) * value) / sub;
  const pos = closeUp(tiny);
  const midpoint = (l + r) / 2;
  line(g, midpoint, y - 37, midpoint, y + 20, C.red, 3, [7, 5]);
  text(g, 'Halfway', midpoint, y + 64, 32, C.red, 'center');
  if (unscale === 1) dot(g, closeUp(recovered), y - 7, 17, C.mint, C.green);
  dot(g, pos, y - 7, 9, C.yellow, C.ink);
  num(g, originalLabel, pos + 25, y - 27, 35, C.ochre);
  pointer(g, direct ? l : pos, y - 9, direct ? C.blue : C.yellow);
  if (direct) text(g, 'Stored', l - 24, y - 34, 32, C.blue, 'right');
  if (lateScale && !replay)
    num(
      g,
      `${boundary.storedGradient} × ${S} = ${boundary.storedGradient * S}`,
      960,
      727,
      56,
      C.red,
      'center',
    );
  if (!replay) return;

  const windowSpacings = 72;
  const overview = (value) => l + ((r - l) * value) / (windowSpacings * sub);
  const yy = 695;
  casing(g, 94, 555, 1728, 231);
  text(g, 'Scale before FP16 cast (wide view)', 148, 609, 36);
  if (showScale) num(g, '× ' + S, 148, yy + 12, 40, C.ochre);
  const steps = scaledGradient / sub;
  scale(g, l, r, yy, [l], C.blue);
  for (let i = 1; i <= windowSpacings; i++) {
    const x = overview(i * sub);
    const tick = i % 8 === 0 ? 13 : 6;
    line(g, x, yy - tick, x, yy + tick, C.blue, 2);
  }
  num(g, '0', l, yy + 56, 36, C.blue, 'center');
  const moving = mix(tiny, scaledGradient, scaled);
  pointer(g, overview(stored ? storedGradient : moving), yy - 5, stored ? C.blue : C.yellow);
  if (scaled === 1)
    num(g, steps + ' spacings', overview(scaledGradient), yy + 56, 36, C.blue, 'center');
  if (stored) text(g, 'Stored exactly', overview(storedGradient) - 24, yy - 33, 35, C.blue, 'right');

  if (widen) {
    const returnY = 894;
    const returning = mix(wideGradient, recovered, unscale);
    text(g, 'FP32 unscale (same wide view)', 148, 835, 36);
    num(g, '÷ ' + S, 148, returnY + 12, 40, C.green);
    line(g, l, returnY, r, returnY, C.faint, 3);
    const start = overview(wideGradient);
    const x = overview(returning);
    if (x < start) line(g, start, returnY, x, returnY, C.green, 4);
    pointer(g, x, returnY - 2, C.green);
    if (unscale === 1)
      num(g, `Recovered 1/${sub / recovered} spacing`, x + 28, returnY - 19, 42, C.green);
  }
}
export function writes(g, c) {
  const n =
    at(c, 1, 'Write the first') +
    at(c, 1, 'Now write the second') +
    at(c, 2, 'Take the third') +
    Math.floor(at(c, 3, 'Keep going to six steps', 1.5) * 3);
  const row = history[n],
    x = (i) => 332 + i * 175,
    y = (v) => 361 + (1 - v) * 745000;
  title(
    g,
    'Six writes to one weight',
    'Subtract 0.0001 at each write. The next write starts from the stored result.',
  );
  for (const [v, s, col] of [
    [1, '1.0', C.blue],
    [(1 + below) / 2, 'midpoint', C.red],
    [below, '0.99951172', C.blue],
  ]) {
    line(g, 315, y(v), 1420, y(v), col, 2, v === 1 ? [] : [8, 9]);
    num(g, s, 286, y(v) + 9, 29, col, 'right');
  }
  for (let i = 0; i <= 6; i++) {
    line(g, x(i), 852, x(i), 864, C.dim, 2);
    num(g, i, x(i), 903, 29, C.dim, 'center');
    if (i > n) continue;
    const h = history[i],
      prev = history[Math.max(0, i - 1)];
    if (i) {
      line(g, x(i - 1), y(prev.master), x(i), y(h.master), C.green, 5);
      line(g, x(i - 1), y(prev.copy), x(i), y(prev.copy), C.blue, 4);
      line(g, x(i), y(prev.copy), x(i), y(h.copy), C.blue, 4);
    }
    dot(g, x(i), y(h.copy), 11, C.blue);
    dot(g, x(i), y(h.master), 7, C.yellow, C.ink);
  }
  text(g, 'Optimizer write', 870, 958, 32, C.dim, 'center');
  reading(g, 1490, 373, 'Direct FP16', fmt(row.direct), C.blue);
  text(g, 'FP32 weight', 1490, 533, 32, C.dim);
  num(g, row.master.toFixed(8), 1490, 590, 38, C.green);
  text(g, 'FP16 copy', 1490, 688, 32, C.dim);
  num(g, fmt(row.copy), 1490, 746, 38, C.blue);
  if (at(c, 2, 'Multiply the new copy'))
    num(g, '2,048 × copy = ' + fmt(2048 * row.copy), 960, 1030, 35, C.ink, 'center');
}
export function transfer(g, c) {
  const direct = at(c, 2, 'direct cast gives zero'),
    amplify = at(c, 2, 'scale the loss', 0.6);
  const stored = at(c, 2, 'FP16 stores'),
    restored = at(c, 3, 'We recover'),
    forward = at(c, 3, 'separate forward input'),
    cast = at(c, 4, 'rounded it to one');
  title(
    g,
    'Trace the gradient back to its units',
    'Position on the ruler is the base-two exponent of the magnitude.',
  );
  const x = (e) => 290 + (e + 27) * 142,
    y = 409;
  const grid = indices(11).map((i) => x(i - 27));
  scale(g, x(-27), x(-17), y, grid, C.blue);
  for (const e of [-26, -25, -24, -22, -20, -18])
    num(g, e, x(e), y + 56, 32, e === -25 ? C.red : C.dim, 'center');
  line(g, x(-25), y - 92, x(-25), y + 12, C.red, 3, [7, 5]);
  text(g, '½ subnormal', x(-25), y - 119, 30, C.red, 'center');
  pointer(g, x(-26), y - 9);
  if (amplify) {
    arr(g, x(-26) + 20, y - 46, x(-18) - 20, y - 46, C.green);
    fade(g, amplify, () => pointer(g, x(-18), y - 9, C.green));
  }
  reading(
    g,
    150,
    617,
    'Direct FP16 cast',
    direct ? fmt(boundary.storedGradient) : '?',
    direct ? C.red : C.ink,
  );
  reading(g, 697, 617, 'Scaled FP16 cast', stored ? fp16(tiny * S).toExponential(2) : '?', C.blue);
  reading(
    g,
    1313,
    617,
    'FP32 unscale',
    restored ? boundary.recovered.toExponential(2) : '?',
    C.green,
  );
  if (forward) {
    casing(g, 104, 797, 1712, 165);
    text(g, 'Separate forward input', 158, 890, 39);
    num(
      g,
      '1.0001    →    ' + (cast ? fmt(boundary.roundedInput) : '?'),
      1070,
      903,
      52,
      cast ? C.blue : C.ink,
      'center',
    );
  }
}

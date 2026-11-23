import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import {
  height,
  width,
  pixels,
  sample,
  response,
} from '../../../director-cuts/lessons/quantization/specimen.mjs';
import {
  affineGrid,
  teachingCodec,
  decodeTeachingCodec,
  groupedReduction,
  roundEven,
} from '../../../films/quantization/arithmetic.mjs';
import {
  night,
  day,
  base,
  txt,
  num,
  serif,
  box,
  line,
  dot,
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
  stripe,
} from './paint.mjs';

const filters = [
  [-0.7, 0.7],
  [0, 14],
];
const maxCode = 7;
function encodeRows(separate) {
  const maxima = filters.map((row) => Math.max(...row.map(Math.abs)));
  return filters.map((row, i) => {
    const scale = (separate ? maxima[i] : Math.max(...maxima)) / maxCode;
    const codes = row.map((w) => roundEven(w / scale) || 0);
    return { scale, codes, weights: codes.map((q) => q * scale) };
  });
}
const shared = encodeRows(false),
  local = encodeRows(true);
const prints = [response(filters[0]), response(shared[0].weights), response(local[0].weights)];
function negative(data, peak, foreground) {
  const c = createCanvas(width, height),
    g = c.getContext('2d');
  box(g, 0, 0, width, height, '#152e3c');
  for (let i = 0; i < data.length; i++)
    if (Math.abs(data[i]) / peak > 0.5) box(g, i % width, Math.floor(i / width), 1, 1, foreground);
  return c;
}
const input = negative(pixels, 1, '#ece1ae');
const exposures = prints.map((row) => negative(row, 0.7, '#8be3c0'));
const position = [pixels[sample.index], pixels[sample.index + 1]];
function plate(ctx, P, source, x, y, w, h, crop, mark = 0, scan = 0) {
  const [sx, sy, sw, sh] = crop;
  ctx.imageSmoothingEnabled = false;
  box(ctx, x - 7, y - 7, w + 14, h + 14, P.soft, P.rule, 2);
  ctx.drawImage(source, sx, sy, sw, sh, x, y, w, h);
  const pixelW = w / sw;
  const markX = x + (sample.x - sx) * pixelW;
  const markY = y + ((sample.y - sy) * h) / sh;
  if (scan > 0) {
    const scanX = mix(x, markX - pixelW / 2, scan);
    line(ctx, scanX, y, scanX, y + h, P.gold, 3);
  }
  if (mark) box(ctx, markX, markY, pixelW * mark, h / sh, null, '#ff9b69', 4);
}
const crop = [sample.x - 22, sample.y - 14, 48, 30],
  responseCrop = [sample.x - 20, sample.y - 10, 40, 20],
  rimCrop = [sample.x - 12, sample.y - 6, 24, 12],
  full = [0, 0, width, height];
function afterCue(clock, beatIndex, phrase) {
  if (clock.beat.beatIndex !== beatIndex) return clock.beat.beatIndex > beatIndex;
  const { start, end } = clock.wordCue(phrase);
  return clock.reveal(phrase, end - start, { captionStart: phrase }) === 1;
}

function drawScaleComparison(ctx, c, P, x) {
  const sharedStep = shared[0].scale;
  const edgeStep = local[0].scale;
  const at = (value) => 1402 + (value / sharedStep) * 374;
  const sourceY = 360;
  const sharedY = 437;
  const localY = 613;
  const sharedKnown = afterCue(
    c, 0, 'A weight of fourteen in the second filter forces a step of two for the whole tensor',
  );
  const snapPhrase = 'Both are closer to zero than to either neighboring mark';
  const snapCue = c.beat.beatIndex === 1 ? c.wordCue(snapPhrase) : null;
  const snap = smooth(cue(c, 1, snapPhrase, snapCue ? snapCue.end - snapCue.start : 0));
  const lost = afterCue(c, 1, 'With one shared scale, we lost the whole outline');
  const finer = afterCue(c, 2, 'The edge filter gets a step of one tenth');
  const codesKnown = afterCue(c, 2, 'Its codes are minus seven and plus seven');
  const exact = afterCue(c, 2, 'Read them back at that scale and the original weights return');
  const rimPhrase = 'There is the rim, at the same pixel';
  const rimBack = afterCue(c, 2, rimPhrase);
  const scanPhrase = 'Run the filter again';
  const scanDuration = c.beat.beatIndex === 2
    ? c.wordCue(rimPhrase).end - c.wordCue(scanPhrase).start
    : 0;
  const scan = cue(c, 2, scanPhrase, scanDuration);

  const sharedLabel = sharedKnown ? 'Shared step ' + fmt(sharedStep) : 'One grid for both filters';
  txt(ctx, sharedLabel, x, 278, 40, P.ink);
  if (sharedKnown)
    txt(ctx, 'Second filter reaches ' + Math.max(...filters[1]), 1826, 278, 34, P.muted, 'right');
  // Both rulers use the same coordinates. Only their tick spacing changes.
  line(ctx, at(-sharedStep) - 24, sharedY, at(sharedStep) + 24, sharedY, P.rule, 3);
  for (const code of [-1, 0, 1]) {
    if (code && !sharedKnown) continue;
    const value = code * sharedStep;
    line(ctx, at(value), sharedY - 13, at(value), sharedY + 13, P.muted, 3);
    num(ctx, fmt(value), at(value), 486, 37, P.muted, 'center');
  }
  for (const [i, weight] of filters[0].entries()) {
    const origin = at(weight);
    const target = at(shared[0].weights[i]);
    num(ctx, fmt(weight), origin, 326, 41, P.gold, 'center');
    line(ctx, origin, sourceY, origin, sharedY, P.rule, 2);
    dot(ctx, origin, sourceY, 8, P.gold);
    const xSnap = mix(origin, target, snap);
    line(ctx, origin, sharedY, xSnap, sharedY, P.gold, 6);
    dot(ctx, xSnap, sharedY, 10, P.gold);
    if (finer) line(ctx, origin, 580, origin, localY, exact ? P.mint : P.rule, 2);
  }
  if (snap === 1)
    txt(ctx, 'Both use code ' + shared[0].codes[0], at(0), 397, 34, P.gold, 'center');

  if (finer) {
    txt(ctx, 'Edge filter step ' + fmt(edgeStep), x, 550, 35, P.ink);
    const secondUnchanged = afterCue(c, 3, 'The second filter still reaches fourteen');
    const secondLabel = secondUnchanged
      ? 'Second keeps step ' + fmt(local[1].scale)
      : 'Second still reaches ' + Math.max(...filters[1]);
    txt(ctx, secondLabel, 1826, 550, 32, P.muted, 'right');
    const end = edgeStep * maxCode;
    line(ctx, at(-end), localY, at(end), localY, P.rule, 3);
    for (let code = -maxCode; code <= maxCode; code++) {
      const tick = at(code * edgeStep);
      line(ctx, tick, localY - 13, tick, localY + 13, P.muted, 3);
    }
    if (codesKnown) {
      local[0].codes.forEach((code, i) => {
        const tick = at(local[0].weights[i]);
        const color = exact ? P.mint : P.ink;
        dot(ctx, tick, localY, 10, color);
        num(ctx, fmt(code), tick, 666, 37, color, 'center');
      });
      txt(ctx, 'Code', at(0), 666, 32, P.muted, 'center');
    }
  }

  const preview = rimBack ? 2 : lost ? 1 : 0;
  const previewY = 721;
  const previewW = 356;
  const previewH = 178;
  plate(ctx, P, exposures[preview], x, previewY, previewW, previewH, rimCrop, 1, rimBack ? 0 : scan);
  const label = rimBack
    ? 'Per-filter response'
    : scan > 0
      ? 'Running the edge filter'
      : lost
        ? 'Shared-scale response'
        : 'Original response';
  txt(ctx, label, x + 393, 766, 35, P.muted);
  if (scan === 0 || rimBack) {
    const value = prints[preview][sample.index];
    num(ctx, 'Rim  ' + fmt(value), x + 393, 838, 55, value ? P.mint : P.red);
  }
  if (rimBack) {
    const terms = position.map((pixel, i) => fmt(pixel) + ' × ' + fmt(local[0].weights[i]));
    num(ctx, terms.join(' + '), x + 393, 892, 35, P.ink);
  }
}

function moth(ctx, c, repair) {
  const P = night,
    b = c.beat.beatIndex;
  base(
    ctx,
    P,
    repair
      ? 'Scale ownership  /  same wing, same pixel'
      : 'Moth eyespot  /  horizontal edge filter',
    c.beat.chapterTitle,
  );
  const newWeight = !repair && cue(c, 2, 'puts both edge weights at zero', 0);
  const seen = repair ? 0 : cue(c, 3, 'The mark disappears', 0.45);
  txt(ctx, 'Input brightness', 94, 278, 40, P.ink);
  const scan = repair ? 1 : cue(c, 0, 'Cross one pixel', 0.85);
  plate(ctx, P, input, 96, 334, 768, 480, crop, 0);
  const pixelX = 96 + (sample.x - crop[0]) * 16,
    pixelY = 334 + (sample.y - crop[1]) * 16;
  box(ctx, pixelX, pixelY, 16 * (1 + scan), 16, null, '#ff9b69', 4);
  // The overview and the microscope share the exact sampling rectangle.
  plate(ctx, P, input, 106, 638, 246, 150, full);
  box(
    ctx,
    106 + (crop[0] * 246) / width,
    638 + (crop[1] * 150) / height,
    (crop[2] * 246) / width,
    (crop[3] * 150) / height,
    null,
    '#ff9b69',
    2,
  );
  const group = repair && cue(c, 3, 'divide a long row', 0.5);
  if (group) {
    txt(ctx, 'One output row', 96, 859, 37, P.muted);
    for (let i = 0; i < 8; i++) box(ctx, 96 + i * 96, 893, 90, 27, i < 4 ? P.gold : P.blue);
    txt(ctx, 'Group 1', 96, 948, 33, P.gold);
    txt(ctx, 'Group 2', 480, 948, 33, P.blue);
  } else {
    txt(ctx, 'Two samples at the rim', 96, 878, 37, P.muted);
    num(ctx, tuple(position), 860, 878, 46, P.gold, 'right');
  }
  const x = 984;
  if (!repair) {
    const current = seen > 0 ? 1 : 0;
    txt(ctx, 'Filter response', x, 278, 40, P.ink);
    const weights = newWeight || b === 3 ? shared[0].weights : filters[0];
    if (b === 0) {
      position.forEach((v, i) => {
        const sx = x + i * 377;
        alpha(ctx, i ? scan : 1, () => {
          box(ctx, sx, 352, 102, 102, v ? '#ece1ae' : '#152e3c', P.rule);
          num(ctx, v, sx + 51, 405, 55, v ? P.bg : P.ink, 'center');
        });
        alpha(ctx, cue(c, 0, 'by learned numbers', 0.5), () =>
          num(ctx, '× ' + fmt(weights[i]), sx + 123, 406, 44, P.gold),
        );
      });
      alpha(ctx, cue(c, 0, 'then adds the products', 0.5), () => {
        num(ctx, '+', x + 321, 407, 45, P.ink);
        txt(ctx, 'Response at the marked pixel', x, 601, 43, P.muted);
      });
      return;
    }
    num(
      ctx,
      position.map((v, i) => fmt(v) + ' × ' + fmt(weights[i])).join('   +   '),
      x,
      363,
      49,
      P.gold,
    );
    const first = cue(c, 1, 'the response here', 0.45);
    const waiting = (b === 2 && newWeight) || (b === 3 && !seen);
    if (first && !waiting)
      alpha(ctx, b === 1 ? first : b === 3 ? seen : 1, () => {
        plate(
          ctx,
          P,
          exposures[current],
          x,
          451,
          672,
          336,
          responseCrop,
          1,
        );
        const value = prints[current][sample.index];
        num(ctx, 'Response  ' + fmt(value), x, 876, 52, value ? P.mint : P.red);
      });
    else {
      box(ctx, x, 451, 672, 336, P.soft, P.rule);
      serif(ctx, '?', x + 336, 619, 103, P.muted, 'center');
    }
  } else {
    drawScaleComparison(ctx, c, P, x);
  }
}
export const edge = (g, c) => moth(g, c, false);
export const scaleOwners = (g, c) => moth(g, c, true);

const weights = 7e9,
  payload = (bits) => (weights * bits) / 8 / 1e9,
  scaleGB = (Math.ceil(weights / 128) * 2) / 1e9;
export function bytes(ctx, c) {
  const P = day,
    x = 135,
    size = 101;
  const compact = cue(c, 1, 'Pair them in bytes', 1.35),
    scales = cue(c, 2, 'that adds', 0.6);
  base(ctx, P, 'Memory inventory  /  decimal GB', c.beat.chapterTitle);
  txt(ctx, 'Same seven billion weights', x, 313, 46, P.ink);
  num(ctx, 'BF16', x, 426, 46, P.blue);
  num(ctx, '4-bit', x, 646, 46, P.mint);
  const left = 381,
    count = 14,
    step = 96;
  for (let i = 0; i < count; i++) {
    const a = left + i * step;
    box(ctx, a, 370, step - 4, size, P.blue);
    const t = clamp(compact * 1.5 - (i / (count - 1)) * 0.5);
    if (t > 0) {
      const v = smooth(t);
      box(
        ctx,
        mix(a, left + (i * step) / 4, v),
        mix(370, 594, v),
        mix(step - 4, step / 4 - 2, v),
        size,
        P.mint,
      );
    }
  }
  num(ctx, fmt(payload(16)) + ' GB', 1798, 518, 42, P.blue, 'right');
  alpha(ctx, compact === 1 ? 1 : 0, () =>
    num(ctx, fmt(payload(4)) + ' GB codes', left, 755, 47, P.mint),
  );
  alpha(ctx, scales, () => {
    const edge = left + (count * step) / 4;
    box(ctx, edge, 594, scaleGB * step, size, P.gold);
    txt(ctx, 'FP16 scale per 128 weights', 944, 636, 42, P.gold);
    result(ctx, P, 'Codes and scales only', fmt(payload(4) + scaleGB, 3) + ' GB');
  });
}
const affineValues = [0, 3];
export function ruler(ctx, c) {
  const P = day,
    b = c.beat.beatIndex;
  base(ctx, P, 'Quantization grid  /  encode and reconstruct', c.beat.chapterTitle);
  if (b <= 2) {
    txt(ctx, 'Grid step   0.1', 116, 309, 46, P.muted);
    const start = 233,
      step = 358,
      y = 595,
      at = (v) => start + (v - 0.5) * 10 * step;
    line(ctx, at(0.5) - 70, y, at(0.9) + 70, y, P.ink, 5);
    for (let i = 5; i <= 9; i++) {
      const x = at(i / 10);
      line(ctx, x, y - 23, x, y + 27, P.ink, 4);
      num(ctx, fmt(i / 10), x, y + 86, 51, P.ink, 'center');
    }
    const w = 0.73,
      q = roundEven(w / 0.1),
      v = q * 0.1;
    const t = cue(c, 2, 'The stored integer', 0.8);
    num(ctx, '0.73', at(w), 421, 57, P.gold, 'center');
    line(ctx, at(w), 462, at(w), y - 3, P.gold, 3);
    dot(ctx, at(w), y, 13, P.gold);
    if (t) {
      line(ctx, at(w), y - 64, mix(at(w), at(v), t), y - 64, P.mint, 8);
      alpha(ctx, t, () => {
        dot(ctx, at(v), y, 15, P.mint);
        result(ctx, P, 'Reconstructed weight', 'code ' + q + ' × 0.1 = ' + fmt(v));
      });
    }
  } else {
    const signed = cue(c, 4, 'Real zero is now', 0);
    const a = affineGrid(affineValues, -1, 2, signed ? -8 : 0, signed ? 7 : 15);
    const x0 = 200,
      dx = 98,
      y = 551,
      zIndex = 5;
    txt(ctx, 'Real interval   −1 to 2', 100, 315, 44, P.ink);
    num(ctx, 'Step = 3 / 15 = ' + fmt(a.scale), 1826, 315, 44, P.ink, 'right');
    line(ctx, x0, y, x0 + 15 * dx, y, P.ink, 5);
    txt(ctx, 'Code', 112, 658, 32, P.muted, 'center');
    txt(ctx, 'Real', 109, 440, 32, P.muted, 'center');
    for (let i = 0; i <= 15; i++) {
      const x = x0 + i * dx;
      line(ctx, x, y - 22, x, y + 25, P.ink, 3);
      num(ctx, fmt(i + (signed ? -8 : 0)), x, 657, 35, P.ink, 'center');
      if (i === 0 || i === 15 || (i === zIndex && cue(c, 4, 'That integer', 0)))
        num(ctx, fmt(-1 + i * a.scale), x, 441, 47, P.ink, 'center');
    }
    const solved = cue(c, 4, 'That integer', 0.4);
    alpha(ctx, solved, () => {
      dot(ctx, x0 + dx * zIndex, y, 17, P.mint);
      txt(ctx, 'Zero-point', x0 + dx * zIndex, 738, 38, P.mint, 'center');
    });
    if (b === 5) {
      const t = cue(c, 5, 'That whole unit', 0.55);
      alpha(ctx, t, () => {
        dot(ctx, x0 + 15 * dx, y, 17, P.red);
        result(
          ctx,
          P,
          '3 clips at the upper limit',
          'code ' + a.codes[1] + ' → ' + fmt(a.reconstructed[1]),
          P.red,
        );
      });
    } else if (solved) result(ctx, P, 'q = clip(round(w / 0.2) + Z)', 'Decode  0.2 × (q − Z)');
  }
}

const codec = teachingCodec(),
  packed = Array.from(codec.bytes.slice(12)),
  original = [0.15, -1.22, 2.4, -0.45, 0.73];
const restored = decodeTeachingCodec(codec.bytes);
const unpackCode = (i) => {
  const n = (packed[Math.floor(i / 2)] >> (4 * (i % 2))) & 15;
  return n > 7 ? n - 16 : n;
};
export function nibbles(ctx, c) {
  const P = night,
    b = c.beat.beatIndex;
  base(ctx, P, 'Signed INT4  /  low nibble first', c.beat.chapterTitle);
  const move = cue(c, 1, 'Slide each pair', 1.9);
  const read =
    (2 * cue(c, 3, 'Open the first byte', 1.35) +
      2 * cue(c, 3, 'then the second', 0.95) +
      cue(c, 3, 'then the third', 0.65)) /
    codec.count;
  const padKnown = read === 1 && cue(c, 3, 'The high half is padding', 0);
  const count = codec.count;
  txt(ctx, 'Scale  =  2.4 / 7', 94, 283, 37, P.muted);
  txt(ctx, 'Stored count  =  ' + count, 1826, 283, 37, P.muted, 'right');
  const centers = [246, 537, 828, 1119, 1410];
  const cx = [395, 951, 1507];
  for (let i = 0; i < count; i++) {
    const x = centers[i],
      target = cx[Math.floor(i / 2)] + (i % 2 ? -99 : 99);
    num(ctx, fmt(original[i]), x, 370, 45, P.ink, 'center');
    // Low nibbles clear the source row before their high partners cross into place.
    const phase = clamp(move * 2 - (i % 2));
    const across = smooth(clamp(phase * 2 - (i % 2 ? 0 : 1)));
    const down = smooth(clamp(phase * 2 - (i % 2 ? 1 : 0)));
    const left = mix(x, target, across),
      top = mix(451, 575, down);
    box(ctx, left - 78, top - 38, 156, 76, P.mint);
    num(ctx, fmt(codec.codes[i]), left, top, 49, P.bg, 'center');
  }
  for (let j = 0; j < 3; j++) {
    const x = cx[j];
    // A byte's high half is on the left in conventional hexadecimal notation.
    box(ctx, x - 198, 528, 396, 94, null, P.rule, 3);
    line(ctx, x, 528, x, 622, P.rule);
    if (j === 2 && move === 1) {
      if (padKnown) {
        stripe(ctx, x - 187, 539, 176, 72, P);
        num(ctx, 'PAD', x - 99, 575, 35, P.ink, 'center');
      } else {
        box(ctx, x - 99 - 78, 575 - 38, 156, 76, P.mint);
        num(ctx, packed[j] >> 4, x - 99, 575, 49, P.bg, 'center');
      }
    }
    if (move === 1 && b < 3) {
      for (let half = 0; half < 2; half++) {
        const bits = ((packed[j] >> (half * 4)) & 15).toString(2).padStart(4, '0');
        num(ctx, bits, x + (half ? -99 : 99), 480, 34, P.gold, 'center');
      }
    }
    txt(ctx, 'high', x - 99, 664, 32, P.muted, 'center');
    txt(ctx, 'low', x + 99, 664, 32, P.muted, 'center');
    if (move === 1)
      num(
        ctx,
        '0x' + packed[j].toString(16).toUpperCase().padStart(2, '0'),
        x,
        750,
        57,
        P.gold,
        'center',
      );
  }
  if (b < 3) {
    if (b === 2) result(ctx, P, 'Unpack in order', 'low → high   ·   stop at count');
  } else {
    txt(ctx, 'Decoded', 90, 857, 37, P.muted);
    txt(ctx, 'Weight ≈', 90, 929, 37, P.muted);
    for (let i = 0; i < count; i++) {
      const x = 470 + i * 288;
      if (read * count > i && read * count < i + 1) {
        const sourceX = cx[Math.floor(i / 2)] + (i % 2 ? -99 : 99);
        box(ctx, sourceX - 82, 533, 164, 85, null, P.gold, 5);
        const t = smooth(clamp(read * count - i));
        dot(ctx, mix(sourceX, x, t), mix(625, 816, t), 9, P.gold);
      }
      alpha(ctx, clamp(read * count - i), () => {
        num(ctx, fmt(unpackCode(i)), x, 857, 44, P.mint, 'center');
        num(ctx, fmt(restored[i]), x, 929, 38, P.ink, 'center');
      });
    }
    if (b === 4) txt(ctx, '12 header bytes + 3 payload bytes', 1825, 420, 32, P.muted, 'right');
  }
}
const gr = groupedReduction();
export function groups(ctx, c) {
  const P = day;
  const b = c.beat.beatIndex;
  base(ctx, P, 'Grouped dot product  /  zero-point 0', c.beat.chapterTitle);
  const done = (beat, phrase) => b > beat || (b === beat && c.elapsed + 1e-9 >= c.wordCue(phrase).end);
  const products = gr.partials.map((partial, i) => partial * gr.scales[i]);
  const answer = done(2, 'The output is five and a half');
  const explanations = ['Six quarter steps give one and a half', 'Two double steps give four'];
  const changes = ['Six quarter steps', 'Two double steps'];
  const known = ['The left pair gives six', 'The right pair gives two'];
  const scaleKnown = ['The first group’s step is one quarter', 'The second group’s step is two'];

  for (let i = 0; i < 2; i++) {
    const x = 120 + 900 * i;
    const col = i ? P.blue : P.gold;
    const partial = gr.partials[i], scale = gr.scales[i];
    txt(ctx, 'Group ' + (i + 1), x, 301, 46, col);
    const terms = gr.codes.slice(i * 2, i * 2 + 2)
      .map((code, j) => fmt(code) + ' × ' + fmt(gr.inputs[i * 2 + j]));
    num(ctx, terms.join('  +  '), x, 399, 51, P.ink);
    line(ctx, x, 448, x + 740, 448, col, 5);
    if (done(0, known[i])) num(ctx, 'Partial   ' + fmt(partial), x, 507, 47, P.ink);
    if (done(1, scaleKnown[i])) num(ctx, 'Scale    ' + fmt(scale), x, 589, 47, col);

    if (b < 2 || !cue(c, 2, changes[i], 0)) continue;
    const start = c.wordCue(changes[i]).start, end = c.wordCue(explanations[i]).end;
    const p = smooth(clamp((c.elapsed - start) / (end - start)));
    const stepWidth = 95 * mix(1, scale, p);
    for (let j = 0; j < partial; j++) box(ctx, x + j * stepWidth, 653, stepWidth - 4, 36, col);
    if (done(2, explanations[i]))
      num(ctx, fmt(partial) + ' × ' + fmt(scale) + ' = ' + fmt(products[i]), x, 754, 47, P.mint);
  }

  if (answer) {
    line(ctx, 120, 791, 1760, 791, P.rule, 2);
    txt(ctx, 'Sum in output units', 120, 838, 40, P.muted);
    const expression = done(2, explanations[1]) ? products.map(v => fmt(v)).join(' + ') + ' = ' : '';
    num(ctx, expression + fmt(gr.total), 1760, 838, 55, P.mint, 'right');
  }
}

export function checkWeights() {
  assert.deepEqual(position, [0, 1]);
  assert.deepEqual(shared.map((row) => row.scale), [2, 2]);
  assert.equal(fmt(local[0].scale), '0.1');
  assert.equal(local[1].scale, shared[1].scale);
  assert.deepEqual(local[0].weights, filters[0]);
  assert.deepEqual(
    shared.map((r) => r.codes),
    [
      [0, 0],
      [0, 7],
    ],
  );
  assert.deepEqual(
    local.map((r) => r.codes),
    [
      [-7, 7],
      [0, 7],
    ],
  );
  assert(prints[0][sample.index] === 0.7 && prints[1].every((v) => v === 0));
  assert.deepEqual(prints[0], prints[2]);
  assert.equal(payload(16), 14);
  assert.equal(payload(4), 3.5);
  assert.equal(scaleGB, 0.109375);
  assert.deepEqual(affineGrid(affineValues).codes, [5, 15]);
  assert.deepEqual(affineGrid(affineValues, -1, 2, -8, 7).codes, [-3, 7]);
  assert.deepEqual(
    original.map((v) => roundEven(v / codec.scale) || 0),
    codec.codes,
  );
  assert.deepEqual(packed, [0xc0, 0xf7, 2]);
  assert.equal(unpackCode(0), unpackCode(5));
  assert.equal(restored.length, 5);
  assert.deepEqual(
    codec.codes,
    Array.from({ length: codec.count }, (_, i) => unpackCode(i)),
  );
  assert.deepEqual(
    restored,
    codec.codes.map((q) => q * codec.scale),
  );
  assert.throws(() => decodeTeachingCodec(codec.bytes.slice(0, -1)));
  const bad = codec.bytes.slice();
  bad[12] = 0xc8;
  assert.throws(() => decodeTeachingCodec(bad));
  assert.deepEqual(gr.partials, [6, 2]);
  assert.equal(gr.total, 5.5);
}

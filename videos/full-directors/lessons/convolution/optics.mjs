import {
  IMAGE,
  KERNEL,
  RIDGE,
  ARTICLE_CROP,
} from '../../../films/convolution/fixtures.mjs';
import { correlate, parameterCount, convolutionShape } from '../../../films/convolution/arithmetic.mjs';
import { MAP, cropForward } from '../../../films/convolution/model.mjs';
import { patchSnapshot } from '../../../films/convolution/construction.mjs';
import {
  ink,
  teal,
  rust,
  gold,
  sea,
  pale,
  white,
  muted,
  steel,
  box,
  line,
  dot,
  arrow,
  mono,
  label,
  heading,
  rule,
  bracket,
  outline,
  grid,
  windowOn,
  carrier,
  mounted,
  cue,
  said,
  crop,
  index,
  matrix,
  total,
  fmt,
  signed,
  blend,
} from './bench.mjs';

export const uniform = matrix(3, 3, () => 2 / 3),
  boundary = crop(IMAGE, 0, 1);
const loc = ['A', 'B', 'C'];
// The two finishes meet at the same sensor column in the metal and pixel views.
function seamPlate(g, x, y, s) {
  const w = 5 * s,
    stop = IMAGE[0].indexOf(1) * s;
  carrier(g, x - 18, y - 18, w + 36, w + 36);
  for (const [left, width, shades] of [
    [0, stop, ['#24363c', '#546971', '#26373b']],
    [stop, w - stop, ['#a8b6b1', '#e8ebe1', '#9aa8a5']],
  ]) {
    const grad = g.createLinearGradient(x, y, x + w * 0.7, y + w);
    grad.addColorStop(0, shades[0]);
    grad.addColorStop(0.52, shades[1]);
    grad.addColorStop(1, shades[2]);
    box(g, x + left, y, width, w, grad);
    for (let k = 0; k < 90; k++) {
      const dx = (k * 31) % Math.max(1, width - 24),
        dy = (k * 53) % w;
      line(g, x + left + dx, y + dy, x + left + dx + 20, y + dy, 'rgba(255,255,240,0.14)', 1);
    }
  }
  for (let i = 1; i < 5; i++) {
    line(g, x + i * s, y, x + i * s, y + w, 'rgba(26,47,44,0.45)', 1);
    line(g, x, y + i * s, x + w, y + i * s, 'rgba(26,47,44,0.45)', 1);
  }
  line(g, x + stop, y, x + stop, y + w, ink, 3);
}
function filmstrip(g, col, answer, stops, found) {
  heading(g, 'Panel under the camera', 237, 156);
  seamPlate(g, 87, 205, 60);
  windowOn(g, 87, 205, 60, 0, col);
  for (let c = 0; c < 3; c++) {
    const x = 559 + c * 182,
      y = 257;
    mono(g, loc[c], x + 66, 195, 27, c === Math.round(col) ? teal : muted);
    const a = crop(IMAGE, 0, c);
    grid(g, a, x, y, 44, { mode: 'image', digits: false, show: () => c <= stops });
    if (c === Math.round(col)) outline(g, x - 6, y - 6, 144, 144, found ? teal : gold, found ? 7 : 4);
    if (c <= stops) {
      const plus = a.reduce((sum, row) => sum + row[2], 0),
        minus = a.reduce((sum, row) => sum + row[0], 0);
      const by = y + 143;
      bracket(g, x + 2, by, 40, rust);
      bracket(g, x + 90, by, 40, teal);
      const selected = found && c === Math.round(col);
      mono(g, answer ? plus + ' − ' + minus + ' = ' + (plus - minus) : '?', x + 66, 445, selected ? 26 : 21, selected ? teal : ink);
    }
  }
  arrow(g, 430, 326, 522, 326);
}
export function seam(g, t) {
  const col = cue(t, 1, 'one pixel right') + cue(t, 1, 'right again');
  const found = t.beat.beatIndex === 2 && t.reveal('C. Its left', 0, { captionStart: false });
  const shown = t.beat.beatIndex === 2 && t.reveal('zero', 0, { captionStart: 'Three minus three' });
  filmstrip(g, col, shown, Math.round(col), found);
  rule(
    g,
    found
      ? 'Both sides of window C see the same finish.'
      : 'Count bright pixels on the right. Subtract the count on the left.',
    { x: 812, y: 497, size: 20 },
  );
}
export function brightness(g, t) {
  if (t.beat.beatIndex === 0) {
    heading(g, 'One reading per pixel', 305, 156);
    mounted(g, IMAGE, 170, 197, 55);
    const see = cue(t, 0, 'Cut out three rows');
    windowOn(g, 170, 197, 55, 0, 1);
    arrow(g, 495, 330, 654, 330);
    heading(g, 'Nine neighbors', 845, 156);
    grid(g, boundary, 733, 222, 75, { mode: 'image', digits: see > 0 });
    rule(g, 'Row and column preserve the location of each measurement.', { y: 521 });
    return;
  }
  const same = cue(t, 1, 'same total brightness') > 0;
  for (const [i, a] of [uniform, boundary].entries()) {
    const x = 206 + i * 546;
    heading(g, i ? 'Boundary' : 'Uniform gray', x + 108, 156);
    mounted(g, a, x, 202, 72);
    if (same) mono(g, 'Total  ' + fmt(total(a)), x + 108, 476, 30, teal);
  }
  rule(g, 'Can total brightness tell these patches apart?');
}
export function weights(g, t) {
  const b = t.beat.beatIndex;
  const a = b === 2 ? boundary : uniform;
  heading(g, b === 2 ? 'Boundary' : 'Uniform gray', 220, 156);
  mounted(g, a, 121, 222, 66);
  heading(g, 'Signed stencil', 575, 156);
  grid(g, KERNEL, 476, 222, 66, { print: signed });
  const neg = b === 0 ? cue(t, 0, 'Subtract the left column') : 1,
    pos = b === 0 ? cue(t, 0, 'Add the right column') : 1;
  if (neg) windowOn(g, 476, 222, 66, 0, 0, 3, 1, rust);
  if (pos) windowOn(g, 476, 222, 66, 0, 2, 3, 1, teal);
  const vals = [0, 2].map((c) => a.reduce((s, row) => s + row[c] * KERNEL[0][c], 0));
  const ready = b === 1 ? cue(t, 1, 'left side contributes') : b === 2 ? cue(t, 2, 'dark left side') : 0;
  heading(g, 'Column contributions', 937, 156);
  line(g, 779, 322, 1102, 322, ink, 2);
  for (const [i, v] of vals.entries()) {
    const x = 858 + 142 * i,
      h = v * 31 * ready;
    box(g, x - 31, Math.min(322, 322 - h), 62, Math.max(2, Math.abs(h)), i ? teal : rust);
    mono(g, ready ? signed(v) : '?', x, 461, 32, i ? teal : rust);
  }
  const result = b === 1 ? said(t, 1, 'Zero') : said(t, 2, 'response is three', 'We chose');
  rule(
    g,
    result
      ? 'Response   ' + signed(vals[0]) + '  +  ' + fmt(vals[1]) + '  =  ' + fmt(total(vals))
      : 'Subtract the left column. Add the right column.',
    { y: 516 },
  );
}
const mapWidth = MAP[0].length;
const mapSize = MAP.length * mapWidth;
const firstInNextRow = mapWidth;
const addressOf = (stop) => [Math.floor(stop / mapWidth), stop % mapWidth];
const fraction = (value) => Math.min(1, Math.max(0, value));

export function printMapState(t, sweep = false) {
  const b = t.beat.beatIndex;
  if (sweep) {
    if (b === 1) return { stop: mapSize - 1, printed: mapSize, shared: true };

    const zeroSpoken = t.wordCue('top-right cell').end;
    const finishScan = t.wordCue('Finish the scan').start;
    const flight = fraction((t.elapsed - zeroSpoken) / 0.9);
    const sweepStart = Math.max(zeroSpoken + 1.35, finishScan);
    if (t.elapsed < sweepStart) {
      return {
        stop: firstInNextRow - 1,
        printed: firstInNextRow - Number(flight < 1),
        flight,
        predict: t.elapsed < zeroSpoken,
        sumKnown: true,
      };
    }

    const dwell = Math.min(1.1, (t.speechDuration - sweepStart) / (mapSize - firstInNextRow));
    const elapsed = t.elapsed - sweepStart;
    const stop = Math.min(mapSize - 1, firstInNextRow + Math.floor(elapsed / dwell));
    const phase = elapsed / dwell - (stop - firstInNextRow);
    const slide = fraction(phase / 0.4);
    return { stop, slide, printed: stop + Number(phase >= 0.65), shared: true };
  }

  if (b === 0) {
    return { stop: 0, printed: 0, predict: true, products: cue(t, 0, 'Read the nine products', 3) };
  }
  if (b === 2) {
    return {
      stop: firstInNextRow - 1,
      slide: t.reveal('third window', 0.85, { captionStart: false }),
      printed: firstInNextRow - 1,
      predict: true,
      sumKnown: t.elapsed >= t.wordCue('that zero').end,
    };
  }

  const slide = cue(t, 1, 'slide the window', 0.85);
  if (slide > 0) {
    const measure = t.wordCue('measure the next patch').start;
    const slideEnds = t.wordCue('slide the window').start + 0.85;
    const printStart = Math.max(measure, slideEnds);
    const flight = fraction((t.elapsed - printStart) / 0.9);
    return { stop: 1, slide, printed: 1 + Number(flight === 1), flight, sumKnown: slide === 1 };
  }
  t.reveal('The total is three', 0);
  const sumKnown = t.elapsed >= t.wordCue('The total is three').end;
  const flight = cue(t, 1, 'Print it', 1.1);
  return { stop: 0, printed: Number(flight === 1), flight, sumKnown };
}

export function printMap(g, t, sweep = false) {
  const state = printMapState(t, sweep);
  const { stop, slide = 1, printed, flight = 0, predict, shared, sumKnown } = state;
  const [r, c] = addressOf(stop);
  const [fromRow, fromCol] = addressOf(Math.max(0, stop - 1));
  const imageX = 95, imageY = 200, pixel = 53;
  const mapX = 858, mapY = 223, cell = 72;
  const sumX = 750, sumY = 329;
  const row = blend(fromRow, r, slide);
  const col = blend(fromCol, c, slide);
  const address = '(' + r + ', ' + c + ')';

  heading(g, 'Camera pixels', 227, 155);
  mounted(g, IMAGE, imageX, imageY, pixel);
  windowOn(g, imageX, imageY, pixel, row, col);
  dot(g, imageX + col * pixel + 10, imageY + row * pixel + 10, 5, gold);
  if (slide === 1 && !(predict && stop > 0)) mono(g, 'Start ' + address, 227, 502, 24);

  heading(g, shared ? 'Shared stencil' : 'Pixel × weight', 592, 156);
  const patch = shared ? null : patchSnapshot(slide === 0 ? fromCol : c, state.products ?? 1);
  grid(g, patch?.products ?? KERNEL, 507, 248, 57, {
    show: (i, j) => shared || ((slide === 0 || slide === 1) && i * KERNEL[0].length + j < patch.count),
    print: signed,
  });
  if (!shared && slide === 1 && flight === 0) {
    arrow(g, 688, sumY, 714, sumY);
    label(g, 'Sum', sumX, 284, 23);
    mono(g, sumKnown ? patch.subtotal : '?', sumX, sumY, 30, teal);
  }

  heading(g, 'Feature map', 966, 156);
  grid(g, MAP, mapX, mapY, cell, { show: (i, j) => i * mapWidth + j < printed });
  if (!predict && slide === 1) {
    windowOn(g, mapX, mapY, cell, r, c, 1, 1);
    mono(g, 'Map ' + address, 966, 502, 24);
  }
  if (slide === 1 && flight > 0 && flight < 1) {
    const destinationX = mapX + (c + 0.5) * cell;
    const destinationY = mapY + (r + 0.51) * cell;
    const aboveMap = mapY - 29;
    const x = blend(sumX, destinationX, fraction((flight - 0.3) / 0.43));
    const y = flight < 0.3
      ? blend(sumY, aboveMap, flight / 0.3)
      : blend(aboveMap, destinationY, fraction((flight - 0.73) / 0.27));
    dot(g, x, y, 19, teal);
    mono(g, patch.subtotal, x, y, 24, white);
  }

  let caption = 'The top-left pixel of the window gives the map address.';
  if (shared && t.beat.beatIndex === 1) {
    caption = 'Three starts across × three down = nine readings from the same stencil.';
  } else if (predict) {
    caption = stop === 0
      ? 'Add the nine products for this window.'
      : 'Where does this window print its response?';
  }
  rule(g, caption);
}
export const changedKernel = RIDGE.map((row) => [...row]);
changedKernel[0][0] = 0;
export function ridge(g, t) {
  const b = t.beat.beatIndex;
  const modified = b === 2 && cue(t, 2, 'upper-left weight to zero') > 0;
  const k = modified ? changedKernel : RIDGE;
  const scan = b === 3 ? index(cue(t, 3, 'Slide the same stencil', 3), 4) : b === 4 ? 3 : 0;
  const r = Math.floor(scan / 2),
    c = scan % 2;
  heading(g, 'Panel camera', 208, 153);
  mounted(g, ARTICLE_CROP, 72, 202, 68, { font: 19 });
  windowOn(g, 72, 202, 68, r, c);
  heading(g, 'Ridge stencil', 568, 153);
  grid(g, k, 473, 245, 63, { print: signed, font: 19 });
  if (modified) windowOn(g, 473, 245, 63, 0, 0, 1, 1, gold);
  if (b < 3) {
    heading(g, 'Row contributions', 950, 153);
    const part = crop(ARTICLE_CROP, r, c).map((row, i) =>
      row.reduce((sum, v, j) => sum + v * k[i][j], 0),
    );
    const stages =
      b === 0
        ? [0, 0, 0]
        : [
            cue(t, 1, 'top row contributes'),
            cue(t, 1, 'bright middle row'),
            cue(t, 1, 'bottom row subtracts'),
          ];
    for (const [i, v] of part.entries()) {
      const y = 230 + 90 * i;
      line(g, 905, y - 20, 905, y + 21, muted, 1);
      const w = v * 55 * stages[i];
      box(g, Math.min(905, 905 + w), y - 11, Math.max(1, Math.abs(w)), 22, v > 0 ? teal : rust);
      mono(g, stages[i] ? signed(v) : '?', 1085, y, 20);
    }
    const show = modified
      ? said(t, 2, 'raises the response', 'At a fixed window')
      : said(t, 1, 'Together they give');
    if (show) {
      label(
        g,
        'Window sum   ' + fmt(total(part)) + (modified ? '      Change from 0.852   +0.030' : ''),
        600,
        508,
        23,
      );
    } else if (b > 0 && said(t, 1, 'Two starts across', 'At the upper left')) {
      label(g, '2 starts across × 2 down', 568, 477, 23);
      label(g, 'Add the three signed rows.', 950, 477, 23);
    } else {
      rule(g, b === 0 ? 'How many complete placements fit on this crop?' : 'Count the starts where all nine weights fit.');
    }
  } else {
    heading(g, 'Ridge responses', 945, 153);
    grid(g, cropForward().raw, 849, 234, 94, { show: (i, j) => i * 2 + j <= scan, font: 24 });
    windowOn(g, 849, 234, 94, r, c, 1, 1, teal);
    rule(
      g,
      b === 4
        ? 'A two-axis flip leaves this symmetric ridge stencil unchanged.'
        : 'PyTorch slides the stored weights over all four starts.',
    );
  }
}
export const positions = convolutionShape(224, 3) ** 2,
  bank = parameterCount(3, 16, 3);
const dense = 224 * 224 * 3 * 256 + 256;
export function sharing(g, t) {
  const b = t.beat.beatIndex;
  const privateBanks = cue(t, 2, 'Give every position', 0) && !cue(t, 3, 'one shared bank', 0);
  const tied = !privateBanks;
  const counted = said(t, 3, 'Forty-nine thousand', 'That costs');
  heading(g, b === 0 ? 'RGB photograph' : 'One local input window', 274, 151);
  if (b === 0) {
    for (let i = 2; i >= 0; i--) {
      carrier(g, 118 + i * 18, 221 - i * 18, 244, 222);
      box(g, 132 + i * 18, 235 - i * 18, 216, 194, ['#9b6257', '#81a688', '#7493a3'][i]);
    }
    mono(g, '224 × 224 × 3', 247, 471, 26);
  } else {
    const sites = matrix(5, 5, (r, c) => r * 5 + c);
    grid(g, sites, 148, 192, 53, { digits: false });
    const at = b >= 4 ? Number(cue(t, 4, 'one pixel right') > 0) : 0;
    windowOn(g, 148, 192, 53, 1, 1 + at, 3, 3, teal);
    label(g, 'Detail of the 224 × 224 input', 282, 485, 21);
  }
  heading(g, b === 0 ? 'Dense layer' : tied ? 'Shared filter bank' : 'Private filter banks', 830, 151);
  if (b === 0) {
    for (let i = 0; i < 9; i++)
      for (let j = 0; j < 4; j++) line(g, 625, 207 + i * 26, 1010, 220 + j * 65, steel, 1);
    for (let i = 0; i < 9; i++) dot(g, 625, 207 + i * 26, 7, muted);
    for (let j = 0; j < 4; j++) dot(g, 1010, 220 + j * 65, 11, teal);
    mono(g, '150,528 × 256 + 256', 818, 477, 25);
  } else {
    for (let i = 0; i < 9; i++) {
      const x = 634 + (i % 3) * 138,
        y = 213 + Math.floor(i / 3) * 87;
      if (tied) {
        line(g, x + 31, y + 15, 1000, 325, steel, 2);
        dot(g, x + 31, y + 15, 7, teal);
      } else {
        box(g, x, y, 75, 38, sea);
        outline(g, x, y, 75, 38, teal, 2);
        mono(g, bank, x + 38, y + 20, 16);
      }
    }
    if (tied) {
      box(g, 982, 300, 104, 52, teal);
      mono(g, said(t, 1, 'four hundred forty-eight') ? bank : '?', 1034, 326, 25, white);
    }
    label(
      g,
      tied ? 'Many sites read one bank' : counted ? positions.toLocaleString('en-US') + ' banks, nine shown' : 'One bank per position, nine shown',
      824,
      478,
      21,
    );
  }
  const quantity = b === 0 ? dense : tied ? bank : positions * bank;
  const ready = b === 0 ? said(t, 0, 'over thirty-eight million')
    : b === 1 ? said(t, 1, 'four hundred forty-eight')
    : privateBanks ? said(t, 3, 'That costs', 'Tie all those positions')
    : b >= 3 && said(t, 3, 'the count returns');
  const parameterNote = ready
      ? quantity.toLocaleString('en-US') +
          ' learned parameters' +
          (b === 0 ? '  •  256 global outputs' : '  •  16 local maps')
      : b === 0 ? 'One weight for each input and one bias per output.'
      : b === 1 ? '16 filters × (3 colors × 9 pixels + 1 bias)'
      : privateBanks ? '222 × 222 output positions     •     ' + bank + ' parameters per bank'
      : '16 output maps     •     One weight bank shared across positions';
  if (b === 1) label(g, parameterNote, 600, 507, 23);
  else rule(g, parameterNote, { y: 521 });
}
const shifted = IMAGE.map((row) => row.map((v, c) => (c === 2 ? 0 : v)));
export const pairs = [
  [0, 1, 1, 1, 1, 1],
  [0, 0, 1, 1, 1, 1],
];
export function translation(g, t) {
  const b = t.beat.beatIndex;
  if (b < 2) {
    const moved = cue(t, 0, 'one pixel right') > 0;
    const pooled = b === 1 && t.elapsed >= t.wordCue("that's the global maximum").end;
    for (const [i, img] of [IMAGE, moved ? shifted : IMAGE].entries()) {
      const x = 134 + i * 556;
      heading(
        g,
        i ? (moved ? 'Shifted boundary' : 'Second exposure') : 'Original boundary',
        x + 148,
        151,
      );
      grid(g, [img[0]], x, 204, 61, { mode: 'image' });
      arrow(g, x + 150, 279, x + 150, 308);
      const m = correlate(img, KERNEL);
      const mapY = 320;
      grid(g, m, x + 64, mapY, 57);
      if (b === 1) {
        if (pooled) {
          box(g, x + 255, 366, 177, 85, teal);
          label(g, 'Global max', x + 343.5, 388, 23, white);
          mono(g, Math.max(...m.flat()), x + 343.5, 423, 33, white);
        } else {
          const k = index(cue(t, 1, 'Scan the map', 4), 9);
          windowOn(g, x + 64, mapY, 57, Math.floor(k / 3), k % 3, 1, 1, gold);
          mono(g, 'Running max   ' + Math.max(...m.flat().slice(0, k + 1)), x + 151, 513, 23, teal);
        }
      }
    }
    rule(g, pooled ? 'Keep the peak value. The output has no cell address.'
      : 'At stride one the interior responses shift with the boundary.');
    return;
  }
  if (b === 2) {
    const moved = cue(t, 2, 'beyond the right edge', 2);
    const seam = Math.round(2 + 3 * moved);
    const img = matrix(5, 5, (_, c) => Number(c >= seam));
    heading(g, 'Fixed camera crop', 259, 151);
    mounted(g, img, 121, 201, 54, { digits: false });
    arrow(g, 453, 332, 580, 332);
    heading(g, 'Valid responses', 837, 151);
    grid(g, correlate(img, KERNEL), 713, 208, 82);
    rule(g, 'Only windows inside this finite crop reach the feature map.');
    return;
  }
  const shift = cue(t, 3, 'move the edge one place right') > 0;
  const compared = [ 'First read', 'In the next pair', 'The last pair' ]
    .filter(phrase => cue(t, 4, phrase, 0)).length;
  const differencesKnown = said(t, 4, 'zero, so the peak', 'so the peak disappears');
  const peakKnown = said(t, 4, 'so the peak disappears', 'The edge is still there');
  for (const [i, a] of [pairs[0], shift ? pairs[1] : pairs[0]].entries()) {
    const y = 182 + 175 * i;
    label(g, i ? (shift ? 'Shifted' : 'Second scan') : 'Original', 190, y + 28, 23, ink, 'right');
    grid(g, [a], 246, y, 74, { mode: 'image' });
    const diffs = correlate([a], [[-1, 1]], 2)[0];
    for (let j = 0; j < 3; j++) {
      bracket(g, 248 + j * 148, y + 91, 142, i && j < compared ? rust : teal);
      const arithmetic = fmt(a[2 * j + 1]) + ' − ' + fmt(a[2 * j]);
      const reading = !i || differencesKnown ? fmt(diffs[j]) : j < compared ? arithmetic : '?';
      mono(g, reading, 320 + j * 148, y + 117, 24);
    }
    mono(g, 'Peak  ' + (i && !peakKnown ? '?' : Math.max(...diffs)), 927, y + 39, 32, teal);
  }
  rule(
    g,
    !peakKnown
      ? 'Keep the starts fixed. Does the shifted boundary still fall inside a pair?'
      : 'A boundary between two sampled pairs leaves all three differences at zero.',
  );
}
export function dilationRow(d, sameSize) {
  const span = 1 + (3 - 1) * d;
  const pad = sameSize ? (span - 1) / 2 : 0;
  const starts = convolutionShape(28, 3, { dilation: d, padding: pad });
  const first = 0 - pad;
  return { span, pad, starts, first, last: first + starts - 1 };
}
export function dilation(g, t) {
  const b = t.beat.beatIndex;
  const d = cue(t, 0, 'Dilation changes') > 0 ? 2 : 1;
  const validClause = b === 4 && cue(t, 4, 'For valid padding', 0);
  const sameSize = b === 4 && cue(t, 4, 'same-size padding adds', 0) && !validClause;
  const { span, pad, starts, first, last } = dilationRow(d, sameSize);
  heading(g, 'One stencil placement', 265, 154);
  const m = matrix(span, span, (r, c) => (r % d === 0 && c % d === 0 ? '•' : ''));
  grid(g, m, 120, 199, 275 / span, { font: 33 });
  windowOn(g, 120, 199, 275 / span, 0, 0, span, span);
  heading(g, 'One row of 28 input pixels', 846, 154);
  if (sameSize || validClause) {
    const mode = sameSize ? 'Same-size output' : 'Valid padding';
    label(g, mode + '   ·   ' + pad + ' added per side   ·   ' + starts + ' starts', 846, 205, 23);
  }
  const q = b === 0 ? 0 : cue(t, 1, 'Slide that five-pixel footprint', 3);
  const lastKnown = said(t, 2, 'twenty-three, counting', 'Starts zero through');
  const countKnown = said(t, 2, 'twenty-four placements');
  const pos = first + Math.round(q * (last - first)),
    x = 578,
    step = 19;
  for (let i = first; i < 28 + pad; i++) {
    const hot = i >= pos && i < pos + span && (i - pos) % d === 0;
    const added = i < 0 || i >= 28;
    box(g, x + i * step, 296, 17, 54, hot ? teal : added ? sea : pale);
    if (added) mono(g, 'P', x + i * step + 8, 323, 16, hot ? white : ink);
    if (countKnown && i <= pos) dot(g, x + i * step + 8, 389, 4, teal);
  }
  bracket(g, x + pos * step, 366, span * step - 2, rust);
  mono(g, 'Start ' + (b === 0 || lastKnown ? pos : '?'), x + 185, 439, 23);
  mono(g, 'Span ' + span, x + 433, 439, 23);
  mono(g, '0', x + 8, 272, 18, muted);
  mono(g, '27', x + 27 * step + 8, 272, 18, muted);
  const countRule = 'Starts = floor((length + total padding − span) / stride) + 1';
  const conclusions = [
    'Spacing the weights changes their reach. There are still nine weights.',
    'Put the last weight on pixel 27. Where does the footprint start?',
    countKnown ? 'Last start ' + (starts - 1) + '     •     ' + starts + ' complete placements'
      : lastKnown ? 'Count both ends of the range of starts.' : 'Read the position of the leftmost weight.',
    countRule,
    sameSize ? 'For same-size output at stride 1, total padding = dilation × (kernel size − 1).'
      : validClause ? 'Valid padding adds 0 positions. This row has ' + starts + ' starts.' : countRule,
    'Positive integer kernel, stride and dilation. The padded input must fit the span.',
  ];
  if (b === 4) label(g, conclusions[b], 600, 500, 23);
  else rule(g, conclusions[b]);
}

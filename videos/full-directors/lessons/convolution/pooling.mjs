import { POOL_MAP, OVERLAP_MAP, POOL_INCOMING } from '../../../films/convolution/fixtures.mjs';
import { correlate, parameterCount, poolSnapshot } from '../../../films/convolution/arithmetic.mjs';
import { channelSnapshot } from '../../../films/convolution/construction.mjs';
import { fieldTrace, signalParticipation, paddedUniform } from '../../../films/convolution/model.mjs';
import {
  ink,
  teal,
  rust,
  sea,
  clay,
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

export function channels(g, t) {
  const flipped = cue(t, 1, 'Reverse the first channel kernel') > 0;
  const state = channelSnapshot(Number(flipped));
  for (let i = 0; i < 2; i++) {
    const y = 181 + i * 164;
    label(g, 'Channel ' + (i + 1), 115, y + 58, 22);
    grid(g, crop(state.images[i], 0, 0), 219, y, 40, { mode: 'image' });
    mono(g, '×', 380, y + 60, 31);
    grid(g, state.kernels[i], 428, y, 40, { font: 16, print: signed });
    arrow(g, 583, y + 60, 659, y + 60);
    mono(g, signed(state.sums[i]), 727, y + 60, 38, state.sums[i] < 0 ? rust : teal);
    line(g, 789, y + 60, 854, 325, steel, 3);
  }
  dot(g, 865, 325, 21, ink);
  mono(g, '+', 865, 325, 22, white);
  arrow(g, 890, 325, 966, 325);
  const ready = t.beat.beatIndex === 0 ? said(t, 0, 'three plus three', 'We use zero bias')
    : said(t, 1, 'gives zero', 'Multiple filters');
  mono(g, ready ? fmt(state.total) : '?', 1041, 325, 67, teal);
  rule(g, 'One kernel per input channel. One sum per output filter at this position.');
}
export function groups(g, t) {
  const b = t.beat.beatIndex,
    split = cue(t, 2, 'two groups') > 0,
    active = cue(t, 3, 'first input') > 0;
  const count = split ? 2 : 1;
  heading(g, 'Input channels', 210, 150);
  heading(g, 'Output filters', 725, 150);
  const yl = (i) => 218 + i * 76,
    yr = (j) => 191 + j * 54;
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 6; j++) {
      if (split && Math.floor(i / 2) !== Math.floor(j / 3)) continue;
      line(
        g,
        262,
        yl(i),
        669,
        yr(j),
        active && i === 0 ? rust : split ? (i < 2 ? teal : '#71868b') : steel,
        active && i === 0 ? 4 : 1.5,
      );
    }
  for (let i = 0; i < 4; i++) {
    box(g, 160, yl(i) - 18, 103, 36, active && i === 0 ? clay : sea);
    mono(g, 'C' + i, 211, yl(i), 21);
  }
  for (let j = 0; j < 6; j++) {
    box(g, 670, yr(j) - 18, 105, 36, active && j < 3 ? clay : sea);
    mono(g, 'F' + j, 722, yr(j), 21);
  }
  const inputs = 4 / count;
  label(g, 'Stored weights', 983, 225, 24);
  mono(g, '6 × ' + inputs + ' × 3 × 3', 983, 275, 23);
  label(g, 'Plus one bias per filter', 983, 320, 19);
  if (b < 2 || said(t, 3, 'gives one hundred fourteen', 'A change')) {
    mono(g, String(parameterCount(4, 6, 3, count)), 983, 394, 45, teal);
  }
  if (b === 4) {
    label(g, 'Width, stride and dilation can change the sampling grid while this bank stays fixed.', 600, 510, 23);
  } else {
    rule(g, b === 1 ? '(N, 4, H, W)  →  (N, 6, Hout, Wout)'
      : 'Each output reads ' + inputs + ' of the four input channels.', { y: 520 });
  }
}
const trace = fieldTrace();
export function field(g, t) {
  const b = t.beat.beatIndex;
  const revisit = cue(t, 6, 'pooling row') > 0;
  const pooled = cue(t, 2, 'Now pool', 0) > 0;
  const stage = revisit ? 2 : b >= 3 ? 3 : pooled ? 2 : b >= 1 ? 1 : 0;
  const known = stage === 3 ? said(t, 4, 'ten')
    : stage === 2 ? said(t, 2, 'Together they cover six', 'At stride two')
    : stage === 1 ? said(t, 2, 'Five pixels', 'Start with three') : true;
  const owner = trace[stage];
  const n = 15,
    s = 50,
    x = 67;
  heading(g, 'Original sensor row', x + (s * n) / 2, 151);
  const cells = matrix(1, n, (_, c) => (c < 4 ? 0.12 : c < 8 ? 0.78 : 0.35));
  grid(g, cells, x, 197, s, { mode: 'image', digits: false });
  for (let j = 0; j < n; j++) mono(g, j, x + (j + 0.5) * s, 269, 16);
  const sub = stage === 0 ? { field: 1, jump: 1 } : trace[stage - 1];
  const offsets = stage === 2 ? [0, 1] : [0, 1, 2];
  const shift =
    b === 0 && cue(t, 0, 'one pixel to the right')
      ? 1
      : b === 2 && cue(t, 2, 'next pooled window')
        ? 2
        : 0;
  for (const [i, offset] of offsets.entries()) {
    const lo = shift + offset * sub.jump;
    bracket(g, x + lo * s, 311 + i * 32, sub.field * s, [muted, teal, rust][i]);
  }
  if (b === 4 && !known) {
    const parts = [sub.field, sub.jump, sub.jump];
    let left = 0;
    const firstExtension = cue(t, 4, 'another two', 0);
    const secondExtension = cue(t, 4, 'last two', 0);
    for (const [i, width] of parts.slice(0, 1 + firstExtension + secondExtension).entries()) {
      bracket(g, x + left * s, 443, width * s, [muted, teal, rust][i]);
      mono(g, i ? '+' + width : width, x + (left + width / 2) * s, 476, 22);
      left += width;
    }
  } else if (known && !revisit) {
    bracket(g, x + shift * s, 445, owner.field * s, ink);
    mono(g, owner.field + ' pixels', x + (shift + owner.field / 2) * s, 475, 21);
  }
  label(g, 'Layer', 953, 163, 21, muted);
  label(g, 'Field / jump', 1092, 163, 19, muted);
  const names = ['Conv 3', 'Conv 3', 'Pool 2', 'Conv 3'];
  trace.forEach((row, i) => {
    const y = 235 + i * 65;
    if (i === stage) box(g, 859, y - 24, 284, 48, sea);
    label(g, names[i], 951, y, 23);
    mono(g, i < stage || (i === stage && known) || revisit ? row.field + ' / ' + row.jump : '·', 1093, y, 23);
  });
  const captions = [
    'Adjacent starts move one input pixel.',
    'How many input pixels do three neighboring windows cover together?',
    pooled ? 'Two neighboring fields enter the pooling window.' : 'Adjacent three-pixel windows overlap.',
    'Three pooled fields, each six wide, begin two pixels apart.',
    'Count the six original pixels, then the new pixels at the end of each bracket.',
    'New field = old field + (kernel size − 1) × dilation × old jump.',
    'A field marks possible influence. Zero weights and closed gates can block it.',
    'Pooling preserves 32 channels and reduces the map width from 220 to 110.',
  ];
  if (revisit) {
    mono(g, '220 → 110 positions', 432, 482, 23, teal);
    label(g, '32 channels', 718, 481, 22, muted);
  }
  rule(g, captions[b], { y: 525 });
}
export const tieMap = POOL_MAP.map((row) => [...row]);
tieMap[0][0] = POOL_MAP[1][1];
const names = ['upper left', 'upper right', 'lower left', 'lower right'];
export function movedPeak(col) {
  const a = POOL_MAP.map((row) => [...row]);
  [a[1][1], a[1][col]] = [a[1][col], a[1][1]];
  return a;
}
export function winners(g, t) {
  const b = t.beat.beatIndex,
    tied = b >= 3 && cue(t, 3, 'first cell now ties') > 0;
  const reset = cue(t, 4, 'Return to the untied map') > 0;
  const inside = cue(t, 4, 'with its left neighbor') > 0,
    across = cue(t, 4, 'across the boundary') > 0;
  const a = across ? movedPeak(2) : inside ? movedPeak(0) : reset ? POOL_MAP : tied ? tieMap : POOL_MAP;
  const mean = b === 2 && cue(t, 2, 'With average pooling') > 0;
  const result = poolSnapshot(a, { mode: mean ? 'average' : 'max' });
  const transfer = b === 1 ? t.reveal('point nine one', 0.5, { captionStart: 'Keep point nine one' }) : Number(b > 1);
  let stage = Number(across);
  if (b === 1) {
    stage = t.reveal('Move right', 0)
      + t.reveal('lower left', 0, { captionStart: false })
      + t.reveal('lower right', 0, { captionStart: false });
  } else if (b === 2) {
    stage = t.reveal('upper-right output', 0, { captionStart: false });
  }
  const win = result.owners[stage],
    r = Math.floor(stage / 2),
    c = stage % 2;
  const saveAddress = b === 2 ? t.reveal('row and column', 0, { captionStart: false }) : b > 2;
  const tieKnown = said(t, 4, 'first maximum in flattened order', 'The tile saves');
  const known = transfer < 1 ? -1 : b === 1 ? stage : 3;
  heading(g, 'Response map', 257, 150);
  mounted(g, a, 102, 187, 77, { mode: 'map', font: 26 });
  windowOn(g, 102, 187, 77, 2 * r, 2 * c, 2, 2);
  if (transfer > 0 && !mean && (!tied || tieKnown)) windowOn(g, 102, 187, 77, ...win.input, 1, 1, teal);
  arrow(g, 450, 342, 572, 342);
  heading(g, mean ? 'Mean in each window' : 'Maximum in each window', 793, 150);
  for (let i = 0; i < 4; i++) {
    const px = 616 + (i % 2) * 179,
      py = 194 + Math.floor(i / 2) * 144;
    box(g, px, py, 166, 128, i === stage ? sea : pale);
    outline(g, px, py, 166, 128, i === stage ? teal : steel, 2);
    const owner = result.owners[i],
      v = result.values[Math.floor(i / 2)][i % 2];
    if ((b === 1 || b === 2) && !mean && i === 0 && transfer > 0) {
      const [row, col] = owner.input;
      const x = blend(102 + (col + 0.5) * 77, px + 83, transfer);
      const y = blend(187 + (row + 0.5) * 77, py + 49, transfer);
      const w = blend(75, 104, transfer);
      box(g, x - w / 2, y - 23, w, 46, sea);
      outline(g, x - w / 2, y - 23, w, 46, teal, 3);
      mono(g, fmt(v, 4), x, y, blend(26, 31, transfer));
    } else {
      mono(g, i <= known ? fmt(v, 4) : '?', px + 83, py + 49, 31);
    }
    if (!mean && saveAddress && !(tied && !tieKnown && i === 0))
      mono(g, '(' + owner.input.join(', ') + ')', px + 83, py + 95, 25, ink);
  }
  rule(
    g,
    b === 0 || (b === 1 && transfer === 0)
      ? 'Which response survives in the upper-left window?'
      : b === 1
        ? 'Each square of four sends its strongest response.'
      : b === 3
        ? tied ? 'Two equal maxima. Which address should the backward pass keep?' : 'Compare the responses in the upper-left window.'
        : b === 4
          ? across
            ? 'The peak has crossed into the upper-right pool.'
            : inside
              ? 'The peak moved within its window. The pooled maximum stays at 0.91.'
              : reset
                ? 'The unique peak is back at row 1, column 1.'
                : tieKnown ? 'First in row-major order wins this tie.' : 'Two equal maxima. Which address should the backward pass keep?'
          : mean
            ? 'A mean spreads the influence across all four inputs.'
            : 'Save the winning address alongside its value.',
    { y: 531 },
  );
}
export function partialGrad(map, incoming, mode, stride, count, overwrite = false) {
  const incomingSoFar = incoming.map((row, r) =>
    row.map((v, c) => (r * row.length + c < count ? v : 0)),
  );
  // Stop writes at the processed window when replaying the faulty assignment.
  if (overwrite) {
    const pool = poolSnapshot(map, { stride });
    const arr = map.map((row) => row.map(() => 0));
    for (const owner of pool.owners.slice(0, count))
      arr[owner.input[0]][owner.input[1]] = incoming[owner.output[0]][owner.output[1]];
    return arr;
  }
  return poolSnapshot(map, { incoming: incomingSoFar, mode, stride }).gradient;
}
export function backwards(g, t) {
  const b = t.beat.beatIndex,
    avg = b >= 3,
    overlap = b >= 5;
  const a = overlap ? OVERLAP_MAP : POOL_MAP;
  const negative =
    b === 1
      ? cue(t, 1, 'Follow it back', 1.3)
      : b === 3
        ? cue(t, 3, 'Split the gradient', 1.3)
        : b > 1
          ? 1
          : 0;
  let grad;
  if (!overlap) {
    const first =
      b === 1
        ? cue(t, 1, 'Two goes back') > 0
        : b === 4
          ? cue(t, 4, 'other three windows') > 0
          : b === 2;
    const rest = b === 1 ? cue(t, 1, 'other two gradients') > 0 : b === 4 ? first : b === 2;
    const arriving = [
      [first ? 2 : 0, negative === 1 ? -1 : 0],
      [rest ? 0.5 : 0, rest ? 3 : 0],
    ];
    grad = poolSnapshot(a, { stride: 2, mode: avg ? 'average' : 'max', incoming: arriving }).gradient;
  } else {
    const n = b === 5 ? Math.floor(cue(t, 5, 'Follow the four shares', 3) * 4) : 4;
    grad = partialGrad(a, POOL_INCOMING, 'average', 1, n);
  }
  const s = overlap ? 90 : 72;
  heading(g, 'Input gradients', 259, 151);
  grid(g, grad, 259 - (s * a.length) / 2, 196, s, { font: overlap ? 21 : 20 });
  if (overlap) windowOn(g, 259 - (s * a.length) / 2, 196, s, 1, 1, 1, 1);
  else if (b === 0 || b === 3) windowOn(g, 259 - (s * a.length) / 2, 196, s, 0, 2, 2, 2);
  arrow(g, 649, 333, 450, 333);
  label(g, avg ? '÷ 4' : 'saved address', 551, 285, 22, teal);
  if (avg && !overlap) {
    label(g, 'One signed share', 551, 385, 20);
    label(g, 'to each member', 551, 413, 20);
  }
  if (!overlap && negative > 0 && negative < 1) {
    const x = blend(648, 452, negative);
    dot(g, x, 333, 22, rust);
    mono(g, '−1', x, 333, 19, white);
  }
  if (!avg) mono(g, '(1, 2)', 551, 377, 21, teal);
  heading(g, 'Incoming gradients', 848, 151);
  grid(g, POOL_INCOMING, 740, 227, 107, {
    mark: (r, c) => (r === 0 && c === 1 ? rust : false),
    print: signed,
  });
  if (!avg || overlap) {
    rule(
      g,
      b === 0
        ? 'The upper-right tile saved row 1, column 2. Where should −1 go?'
        : overlap
          ? 'Four overlapping windows contribute to one center cell.'
          : 'Only the maximum saved on the forward pass receives the gradient.',
      { y: 521 },
    );
  }
}
export function overlapRepair(g, t) {
  const b = t.beat.beatIndex,
    adding = b >= 2;
  let n = 4;
  if (b === 0) n = Math.floor(cue(t, 0, 'Slide over the four possible starts', 3) * 4);
  if (b === 1) n = ['minus one', 'a half', 'and three', 'The center holds']
    .filter(phrase => cue(t, 1, phrase, 0)).length;
  if (b === 2) n = Number(cue(t, 2, 'Add each incoming gradient', 0))
    + Number(said(t, 2, 'down to one', 'The half'))
    + Number(said(t, 2, 'one and a half', 'Now add'))
    + Number(said(t, 2, 'four and a half', 'Every other input'));
  const stage = Math.max(0, n - 1),
    owners = poolSnapshot(OVERLAP_MAP, { stride: 1 }).owners;
  heading(g, b === 0 ? 'Forward responses' : 'Backward destination', 237, 151);
  const a = b === 0 ? OVERLAP_MAP : partialGrad(OVERLAP_MAP, POOL_INCOMING, 'max', 1, n, !adding);
  grid(g, a, 102, 195, 90, { font: 30 });
  if (b === 0) windowOn(g, 102, 195, 90, ...owners[stage].output, 2, 2);
  windowOn(g, 102, 195, 90, 1, 1, 1, 1, teal);
  heading(
    g,
    b === 0 ? 'Saved flat indices' : adding ? 'Add to the center' : 'Assign to the center',
    806,
    151,
  );
  const incoming = POOL_INCOMING.flat();
  for (let i = 0; i < 4; i++) {
    const x = 553 + i * 148;
    mono(g, names[i], x, 234, 17, muted);
    dot(g, x, 318, 42, i < n ? sea : pale);
    mono(g, b === 0 ? (i < n ? owners[i].flat : '?') : signed(incoming[i]), x, 318, 27);
    if (i < n && b > 0) {
      const v = partialGrad(OVERLAP_MAP, POOL_INCOMING, 'max', 1, i + 1, !adding)[1][1];
      line(g, x, 365, x, 389, teal, 2);
      mono(g, fmt(v), x, 425, 29, teal);
    }
  }
  rule(
    g,
    b === 0
      ? 'All four windows choose the same input address.'
      : adding
        ? 'Accumulate every signed contribution at the saved index.'
        : 'Assignment replaces the value already at the center.',
    { y: 521 },
  );
}
export const maps = Array.from({ length: 6 }, (_, k) => matrix(3, 3, (r, c) => (k + r + c + 1) / 12));
export function globalHead(g, t) {
  const b = t.beat.beatIndex;
  const scan = index(cue(t, 0, 'each channel its own mean', 4), 6);
  const permute = b === 0 && cue(t, 0, 'Rearrange the nine numbers') > 0;
  const a =
    b === 3
      ? matrix(3, 3, (r, c) => (r === 1 && c === 1 ? 9 : 0))
      : permute
        ? maps[scan].map((row) => [...row].reverse())
        : maps[scan];
  heading(g, b === 3 ? 'Isolated response' : 'Six feature channels', 270, 151);
  if (b !== 3)
    for (let i = 5; i >= 1; i--) {
      box(g, 135 + i * 8, 232 - i * 8, 231, 231, pale);
      outline(g, 135 + i * 8, 232 - i * 8, 231, 231, steel, 2);
    }
  grid(g, a, 135, 232, 77, { font: 22 });
  if (b === 0) {
    arrow(g, 448, 335, 543, 335);
    heading(g, 'Means by channel', 829, 151);
    const means = maps.map((m) => total(m) / 9);
    grid(g, [means], 553, 290, 95, { show: (_, c) => c <= scan, font: 21 });
    label(g, '(N, C, H, W)  →  (N, C)', 836, 431, 24);
    label(g, 'Each channel keeps its own mean.', 836, 462, 21);
  } else if (b === 3) {
    const max = Math.max(...a.flat()),
      mean = total(a) / 9;
    label(g, 'Maximum', 733, 226, 25);
    label(g, 'Mean', 733, 396, 25);
    const maxCue = said(t, 3, 'Max pooling keeps', 'Average pooling divides'),
      meanCue = said(t, 3, 'returns one', 'When a mark');
    box(g, 622, 256, max * 47 * maxCue, 26, teal);
    box(g, 622, 426, mean * 47 * meanCue, 26, rust);
    mono(g, maxCue ? max : '?', 1090, 270, 29, teal);
    mono(g, meanCue ? mean : '?', 1090, 439, 29, rust);
    rule(g, 'One high response can be diluted when you average across space.');
  } else {
    heading(g, 'Two-class head', 809, 151);
    const units = [54, 6];
    units.forEach((v, i) => {
      const y = 223 + i * 140;
      label(g, i ? 'After channel means' : 'After flattening', 611, y, 22, ink, 'left');
      const known = said(t, 2, 'one hundred ten and fourteen', 'Both heads');
      mono(g, v + ' × 2 + 2' + (known ? ' = ' + (v * 2 + 2) : ''), 611, y + 55, 31, teal, 'left');
    });
    rule(g, 'Both heads return two logits. Flattening gives each position its own weight.');
  }
}
export function participation(g, t) {
  const b = t.beat.beatIndex;
  const small = b === 2 && cue(t, 2, 'smaller four-by-four') > 0;
  const center = (b === 0 && cue(t, 0, 'to the center') > 0) || b === 1 || small;
  const pad = b >= 2 && !small ? 1 : 0,
    size = small ? 4 : 5;
  const loc = center ? Math.floor((size - 1) / 2) : 0;
  const v = signalParticipation(size, loc, loc, pad);
  const a = pad ? matrix(size + 2, size + 2, (r, c) => v.image[r - 1]?.[c - 1] ?? 0) : v.image;
  const pitch = 275 / a.length;
  heading(g, 'One bright pixel', 259, 151);
  mounted(g, a, 119, 198, pitch, { digits: false });
  if (pad) outline(g, 119 + pitch, 198 + pitch, size * pitch, size * pitch, teal, 3);
  const matches = v.result.flatMap((row, r) => row.flatMap((val, c) => (val ? [[r, c]] : [])));
  const si = index(t.progress, matches.length);
  windowOn(g, 119, 198, pitch, ...matches[si]);
  heading(g, 'Windows that see it', 849, 151);
  const k = Math.min(94, 273 / v.result.length);
  grid(g, v.result, 849 - (k * v.result.length) / 2, 337 - (k * v.result.length) / 2, k);
  windowOn(g, 849 - (k * v.result.length) / 2, 337 - (k * v.result.length) / 2, k, ...matches[si], 1, 1);
  rule(
    g,
    (pad ? 'One-cell padding' : 'Valid placements') +
      '     •     ' +
      v.count +
      ' ' +
      (v.count === 1 ? 'window includes' : 'windows include') +
      ' the marked pixel.',
    { y: 526 },
  );
}
export function stripePatch(reflect, striped) {
  const stripe = striped ? 1 : 0.6;
  return [
    [reflect ? stripe : 0, reflect ? stripe : 0, reflect ? stripe : 0],
    [0.6, 0.6, 0.6],
    [stripe, stripe, stripe],
  ];
}
export function paddingArtifact(g, t) {
  const b = t.beat.beatIndex,
    striped = b >= 3;
  const k = paddedUniform().kernel;
  const y = 218,
    p = 65;
  for (const [i, ref] of [false, true].entries()) {
    const x = 196 + i * 576;
    heading(g, ref ? 'Reflection' : 'Zero padding', x + p * 1.5, 151);
    const top = b > 0 || cue(t, 0, 'black padding') > 0;
    const inField = top ? stripePatch(ref, striped) : matrix(3, 3, () => 0.6);
    const supplied = !ref || cue(t, 2, 'change the padding to reflection', 0);
    const ready = ref ? said(t, 2, 'largest absolute response is zero')
      : said(t, 1, 'subtracts one point eight', 'The filter has found');
    grid(g, inField, x, y, p, { mode: 'image', show: () => supplied });
    if (top) {
      outline(g, x, y, p * 3, p, teal, 4);
      label(g, 'added row', x + p * 1.5, y - 25, 18, teal);
    }
    const response = correlate(inField, k)[0][0];
    mono(g, ready ? 'Sum   ' + fmt(response) : 'Sum   ?', x + p * 1.5, 470, 30, ref ? teal : rust);
  }
  rule(
    g,
    striped
      ? 'A reflected border copies the stripe from one row inside the panel.'
      : 'Same gray panel and same weights. Only the supplied border changes.',
    { y: 522 },
  );
}

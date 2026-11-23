import { createCanvas } from '@napi-rs/canvas';
import {
  C,
  base,
  scope,
  rect,
  line,
  num,
  text,
  note,
  cue,
  opacity,
  bits,
  arrow,
  short,
} from './bench.mjs';
import { experiment, freshGroupWorksheet } from '../../../films/low-precision-kernels/model.mjs';
import { decode8, encode8, hexByte } from '../../../films/low-precision-kernels/encoding.mjs';
import {
  input,
  size,
  sample,
} from '../../../director-cuts/lessons/low-precision-kernels/lunar-image.mjs';

export function payload(rows, logicalColumns, blockWidth, bitsPerValue = 8, tensorBytes = 0) {
  const blocks = rows * Math.ceil(logicalColumns / blockWidth);
  const elements = (blocks * blockWidth * bitsPerValue) / 8;
  return {
    blocks,
    elements,
    scaleBytes: blocks + tensorBytes,
    total: elements + blocks + tensorBytes,
  };
}
export const packed = payload(2, 32, 32),
  padded = payload(5, 33, 32),
  mx4 = payload(1, 64, 32, 4),
  nv4 = payload(1, 64, 16, 4, 4);
const wideBytes = experiment.rows.flat().length * 4;
export function traffic(k) {
  const direct = cue(k, 2, 'Feed the packed blocks directly', 0) > 0;
  const write = cue(k, 1, 'Write the wider buffer', 1.2),
    read = cue(k, 1, 'then read it back', 1.2);
  return {
    direct,
    written: direct ? 0 : 4 * Math.floor((wideBytes / 4) * write),
    read: direct ? 0 : 4 * Math.floor((wideBytes / 4) * Math.min(write, read)),
  };
}
const codeOfScale = (s) => Math.log2(s) + 127;
function codeStrip(g, x, y, width, row) {
  const vals = experiment.block[row],
    sw = width - 72;
  vals.forEach(({ code }, i) => {
    const cx = x + (sw * i) / 32,
      step = sw / 32;
    rect(g, cx, y, step - 1, 45, C.teal);
    for (let b = 0; b < 8; b++)
      if (code & (1 << (7 - b))) rect(g, cx + 2, y + 3 + b * 5, Math.max(1, step - 5), 3, C.ref);
  });
  rect(g, x + sw + 4, y, 68, 45, C.oxide);
  num(g, codeOfScale(experiment.scales[row]), x + sw + 37, y + 32, 26, C.light, 'center');
}
function transfer(g, k) {
  const state = traffic(k),
    b = k.beat.beatIndex,
    direct = state.direct;
  base(g, 'Which transfers cross device memory?', 'Memory path  /  activation operand only');
  text(g, 'Packed activation', 95, 279, 37, C.muted);
  for (let i = 0; i < 2; i++) {
    const yy = 356 + i * 138;
    text(g, 'Block ' + i + '     32 codes  +  S' + i, 97, yy - 14, 30);
    codeStrip(g, 95, yy, 473, i);
  }
  text(g, 'E8M0 scale bytes', 95, 632, 30, C.oxide);
  num(g, packed.total + ' B', 92, 732, 72);
  if (b === 0) {
    text(g, 'Element payload', 750, 381, 39, C.muted);
    num(g, packed.elements + ' × 1 B', 748, 460, 65, C.teal);
    text(g, 'Scale payload', 750, 568, 39, C.muted);
    num(g, packed.blocks + ' × 1 B', 748, 651, 65, C.oxide);
    note(
      g,
      '64 element bytes + 2 block-scale bytes = 66 bytes',
      'Each ochre end byte belongs to the 32 element codes immediately to its left.',
    );
    return;
  }
  if (direct) {
    const t = cue(k, 2, 'Feed the packed blocks directly', 2.0);
    [0, 1].forEach((i) => {
      const y = 379 + i * 138;
      arrow(g, 600, y, 1290, y, C.teal);
      const tx = 584 + t * 728;
      g.save();
      g.beginPath();
      g.rect(580, y - 34, 710, 68);
      g.clip();
      for (let j = 0; j < 32; j++) rect(g, tx + j * 4, y - 15, 3, 30, C.teal);
      rect(g, tx + 130, y - 15, 20, 30, C.oxide);
      g.restore();
    });
    scope(g, 1290, 310, 534, 344);
    text(g, 'Block-scaled GEMM', 1335, 395, 45, C.light);
    text(g, 'Block 0   ×   1/256', 1338, 489, 40, C.ref);
    text(g, 'Block 1   ×   2', 1338, 567, 40, C.decoded);
    text(g, 'Weights enter separately', 1311, 703, 29, C.muted);
    note(
      g,
      'Wider intermediate   ·   write 0 B   /   read 0 B',
      'The standalone path moved 256 B each way. This count excludes weights, output and physical cache transactions.',
    );
    return;
  }
  const yy = 409;
  for (const y of [379, 517]) line(g, 574, y, 642, y, C.teal, 4);
  line(g, 642, 379, 642, 517, C.teal, 4);
  arrow(g, 642, yy, 718, yy, C.teal);
  scope(g, 731, 328, 290, 158);
  text(g, 'Unpack', 876, 399, 41, C.light, { align: 'center' });
  num(g, 'FP32', 876, 457, 44, C.ref, 'center');
  scope(g, 1471, 328, 353, 158);
  text(g, 'Matrix kernel', 1647, 423, 42, C.light, { align: 'center' });
  const by = 642,
    x0 = 755,
    x1 = 1749;
  line(g, 875, 491, 875, 558, C.oxide, 4);
  arrow(g, 875, 558, 875, by - 14, C.oxide, 4);
  line(g, 1646, by - 12, 1646, 559, C.teal, 4);
  arrow(g, 1646, 559, 1646, 496, C.teal, 4);
  num(g, 'Write ' + state.written + ' B', 915, 584, 35, C.oxide);
  num(g, 'Read ' + state.read + ' B', 1607, 584, 35, C.teal, 'right');
  for (let j = 0; j < 64; j++) {
    const w = (x1 - x0) / 64,
      x = x0 + j * w;
    rect(g, x, by, w - 1.5, 62, j < state.written / 4 ? C.oxide : C.faint);
    if (j < state.read / 4) rect(g, x, by + 44, w - 1.5, 18, C.ref);
  }
  text(g, 'FP32 intermediate  ·  64 four-byte words', x0, 758, 33, C.muted);
  note(
    g,
    'Wide-buffer traffic so far   ' + (state.written + state.read) + ' B',
    'Logical writes and reads of this one operand. Both paths still consume packed input.',
  );
}
function paddedRows(g, k) {
  const answer = cue(k, 4, 'Three hundred thirty', 0) > 0;
  base(g, 'What occupies the padded row?', 'Physical layout  /  five rows of 33 logical values');
  for (let i = 0; i < 5; i++) {
    const y = 312 + 82 * i;
    text(g, 'Row ' + i, 93, y + 36, 29, C.muted);
    for (let j = 0; j < 64; j++) {
      const group = Math.floor(j / 32),
        x = 247 + j * 16 + group * 62;
      rect(g, x, y, 14, 46, j < 33 ? C.teal : C.faint);
      if (j >= 33) line(g, x + 1, y + 40, x + 12, y + 7, C.muted, 1.5);
    }
    for (let j = 0; j < 2; j++) rect(g, 247 + (j + 1) * 512 + j * 62 + 1, y, 41, 46, C.oxide);
  }
  text(g, '32 values + S', 248, 284, 31, C.muted);
  text(g, '1 value + 31 pads + S', 822, 284, 31, C.muted);
  text(g, 'Stored payload', 1425, 383, 34, C.muted);
  num(g, answer ? padded.total + ' B' : '?', 1419, 497, 78, answer ? C.oxide : C.ink);
  if (answer) {
    num(g, padded.elements + ' code B', 1423, 601, 43);
    num(g, '+ ' + padded.scaleBytes + ' scale B', 1423, 661, 40, C.oxide);
  }
  note(
    g,
    answer
      ? '5 rows × 2 blocks × (32 + 1) bytes = 330 bytes'
      : 'Every physical block has 32 element slots and a scale byte.',
    answer
      ? 'For finite E8M0 codes 0 through 254, the scale is 2^(code − 127).'
      : 'Hatching marks stored padding. No allocator or weight bytes are included.',
  );
}
function fpFour(g, k) {
  base(
    g,
    'What shares the four-bit payload?',
    'Two one-dimensional activation layouts  /  64 values  /  no padding',
  );
  [mx4, nv4].forEach((layout, i) => {
    const active = i === 0 ? cue(k, 5, 'MX FP four', 0) : cue(k, 5, 'N V FP four', 0);
    const y = 340 + i * 231;
    text(g, i === 0 ? 'MXFP4' : 'NVFP4', 92, y + 52, 47);
    const n = layout.blocks,
      origin = 374,
      span = 1030,
      unit = (span - n * 58) / 32;
    for (let block = 0; block < n; block++) {
      const bytes = 32 / n,
        originX = origin + block * (unit * bytes + 58);
      for (let j = 0; j < bytes; j++) {
        const x = originX + j * unit;
        rect(g, x, y, unit - 2, 73, C.teal);
        line(g, x + 1, y + 36, x + unit - 4, y + 36, C.ref, 2);
      }
      opacity(g, active, () => rect(g, originX + bytes * unit + 3, y, 43, 73, C.oxide));
    }
    if (i === 1)
      opacity(g, active, () => {
        for (let j = 0; j < 4; j++) rect(g, 1420 + j * 20, y, 18, 73, C.oxide);
      });
    opacity(g, active, () => {
      num(g, layout.total + ' B', 1540, y + 57, 61);
      text(
        g,
        i === 0 ? '2 block scales' : '4 block scales + 4-byte tensor scale',
        origin,
        y + 128,
        36,
        C.oxide,
      );
    });
  });
  note(
    g,
    'Each blue byte holds two E2M1 values.',
    'MXFP4 uses one E8M0 scale per 32. NVFP4 uses one E4M3 scale per 16 plus an FP32 tensor scale.',
  );
}
export function memory(g, k) {
  const b = k.beat.beatIndex;
  if (b <= 2) return transfer(g, k);
  if (b <= 4) return paddedRows(g, k);
  return fpFour(g, k);
}

export const srcCode = encode8(1, 'ocp').code;
export const recode = encode8(decode8(srcCode, 'ocp'), 'fnuz').code;
export const copiedGain = decode8(srcCode, 'fnuz'),
  restoredGain = decode8(recode, 'fnuz');
export const restored = Uint8Array.from(input, (v) => v * restoredGain),
  dim = Uint8Array.from(input, (v) => v * copiedGain);
function exposure(values) {
  const plate = createCanvas(size, size),
    ctx = plate.getContext('2d'),
    rgba = ctx.createImageData(size, size);
  values.forEach((v, i) => rgba.data.set([v, v, v, 255], i * 4));
  ctx.putImageData(rgba, 0, 0);
  return plate;
}
const plates = [input, dim, restored].map(exposure);
export function imageState(k) {
  const copied = cue(k, 1, 'Copy the byte unchanged', 0) > 0;
  const recoded = cue(k, 2, 'Store eight', 0) > 0;
  const firstScan = cue(k, 1, 'The crater pixel falls', 1.3);
  const secondScan = cue(k, 2, 'Run the multiplication again', 1.3);
  const row = Math.floor((recoded ? secondScan : firstScan) * size);
  const probeWritten = sample.row < row;
  const buffer = recoded ? (probeWritten ? restored : dim) : probeWritten ? dim : input;
  return {
    copied,
    recoded,
    row,
    probeWritten,
    value: buffer[sample.index],
    byte: recoded ? recode : srcCode,
  };
}
export const sameGroup = freshGroupWorksheet(false),
  apart = freshGroupWorksheet(true);
export const fullTileRows = 16,
  availableRows = experiment.rows.length;
function dispatch(g, k) {
  const tested = cue(k, 3, 'Our two-row shape fails', 0);
  base(
    g,
    'Can this kernel launch on the two-row input?',
    'Dispatch check  /  example full-tile requirement',
  );
  const y0 = 267;
  for (let i = 0; i < fullTileRows; i++) {
    const y = y0 + i * 30;
    rect(g, 105, y, 790, 24, i < availableRows ? C.teal : C.faint);
    if (i < availableRows) rect(g, 902, y, 46, 24, C.oxide);
  }
  text(g, 'Available input', 1082, 336, 37, C.muted);
  num(g, availableRows + ' rows', 1078, 431, 70, C.teal);
  text(g, 'Kernel tile', 1082, 532, 37, C.muted);
  num(g, fullTileRows + ' rows', 1078, 625, 70);
  if (tested) text(g, fullTileRows - availableRows + ' rows short', 1084, 726, 45, C.oxide);
  note(
    g,
    tested
      ? 'This layout fails the full-tile shape check.'
      : 'The example kernel accepts full 16-row tiles only.',
    tested
      ? 'Use a compatible kernel or prepare a supported shape with matching scale layout and alignment.'
      : 'Each teal stripe is an actual source row. Empty lanes show the rest of the required tile.',
  );
}
export function freshGroups(g, k) {
  const together = cue(k, 5, 'Together they get scale two', 0) > 0,
    split = cue(k, 5, 'Separate the spike', 0) > 0;
  const model = split ? apart : sameGroup,
    x0 = 110,
    width = 1053,
    step = width / 32;
  base(
    g,
    'What will the tiny-value selector read?',
    'New input  /  nearest-even E4M3  /  one power-of-two scale per 32',
  );
  for (let i = 0; i < 2; i++) {
    const y = 330 + i * 187;
    text(g, 'Block ' + i, 111, y - 18, 33, C.muted);
    for (let j = 0; j < 32; j++) {
      const val = model.groups[i][j],
        x = x0 + j * step;
      rect(g, x, y, step - 3, 75, val === 700 ? C.oxide : val === 0.001 ? C.teal : C.faint);
    }
    if (i === 0) {
      arrow(g, x0 + step / 2, y + 120, x0 + step / 2, y + 85, C.teal);
      text(g, 'select 0.001', x0 + 49, y + 126, 31, C.teal);
    }
    if (model.groups[i][3] === 700) {
      const px = x0 + step * 3.5;
      line(g, px, y - 3, px + 25, y - 27, C.oxide, 3);
      line(g, px + 25, y - 27, px + 69, y - 27, C.oxide, 3);
      num(g, '700', px + 77, y - 17, 32, C.oxide);
    }
    if (together)
      num(
        g,
        'S = ' + (model.scales[i] === 2 ** -18 ? '1/262144' : short(model.scales[i])),
        1223,
        y + 60,
        54,
      );
  }
  const read = together ? model.tiny.reconstructed : '?';
  if (split)
    num(
      g,
      'Spike:  700 / 2 = 350   →   ' + model.spike.value + ' × 2 = ' + model.spike.reconstructed,
      105,
      739,
      39,
      C.oxide,
    );
  note(
    g,
    'Selected output   ' + read,
    split
      ? 'Together: 0. In separate blocks: ' +
          model.tiny.reconstructed +
          '. The spike reconstructs to ' +
          model.spike.reconstructed +
          ' in both runs.'
      : together
        ? 'The tiny input shares the spike’s scale. The empty block uses scale 1.'
        : 'The selector has a single 1 at index 0. The two blocks contain zeros outside the marked cells.',
  );
}
export function consumer(g, k) {
  if (k.beat.beatIndex === 3) return dispatch(g, k);
  if (k.beat.beatIndex >= 4) return freshGroups(g, k);
  const s = imageState(k);
  const restoreQuestion = cue(k, 1, 'What exponent field', 0);
  base(
    g,
    restoreQuestion
      ? 'Which byte restores the crater?'
      : 'What will the copied weight do to the crater?',
    '1 × 1 image kernel  /  E4M3 weight transfer',
  );
  const src = input[sample.index],
    pan = 392;
  for (let i = 0; i < 2; i++) {
    const x = 92 + i * 903,
      y = 323;
    text(g, i ? 'Current output buffer' : 'Source image', x, y - 27, 42);
    rect(g, x, y, pan, pan, '#000');
    g.imageSmoothingEnabled = false;
    g.drawImage(plates[i && s.recoded ? 1 : 0], x, y, pan, pan);
    if (i === 1) {
      g.save();
      g.beginPath();
      g.rect(x, y, pan, (pan * s.row) / size);
      g.clip();
      g.drawImage(plates[s.recoded ? 2 : 1], x, y, pan, pan);
      g.restore();
      if (s.row > 0 && s.row < size)
        line(g, x, y + (pan * s.row) / size, x + pan, y + (pan * s.row) / size, C.decoded, 3);
    }
    const sx = x + (pan * (sample.col + 0.5)) / size,
      sy = y + (pan * (sample.row + 0.5)) / size;
    g.strokeStyle = C.decoded;
    g.lineWidth = 3;
    g.strokeRect(sx - 8, sy - 8, 16, 16);
    line(g, sx + 8, sy - 8, sx + 48, sy - 50, C.decoded, 2);
    line(g, sx + 48, sy - 50, x + pan - 18, sy - 50, C.decoded, 2);
    rect(g, x + pan - 99, sy - 100, 83, 44, C.scope);
    num(g, i ? s.value : src, x + pan - 20, sy - 66, 33, C.decoded, 'right');
    if (i) {
      const status = s.probeWritten
        ? 'Probe updated'
        : s.recoded
          ? 'Prior pass at probe'
          : 'Initial copy at probe';
      text(g, status + (s.probeWritten ? '' : '  ·  awaiting write'), x, y + pan + 52, 30, C.muted);
    }
    const bx = x + pan + 28,
      sent = i ? s.copied : true,
      code = i ? s.byte : srcCode,
      bias = i ? 8 : 7;
    text(g, (i ? 'FNUZ' : 'OCP') + ' weight  ·  bias ' + bias, bx, y + 37, 30, C.muted);
    if (sent) {
      num(g, hexByte(code), bx, y + 114, 63, C.teal);
      bits(g, code, bx, y + 145, 387, 54);
      const exp = (code >> 3) & 15;
      num(g, '2^(' + exp + ' − ' + bias + ')', bx, y + 276, 42);
    }
    const gainKnown = !i || cue(k, 1, 'Two to the minus one', 0);
    num(
      g,
      '× ' + (gainKnown ? short(decode8(code, i ? 'fnuz' : 'ocp')) : '?'),
      bx,
      y + 366,
      65,
      C.oxide,
    );
  }
  note(
    g,
    s.recoded
      ? 'Re-encode the value for the receiving bias.'
      : restoreQuestion
        ? 'Which exponent field gives a weight of one with bias eight?'
        : s.copied
          ? 'One byte, two exponent biases.'
          : 'Predict the effect of copying the weight byte unchanged.',
    s.recoded && cue(k, 2, 'The sign-only byte', 0)
      ? '0x80 is a separate special case: OCP negative zero, FNUZ NaN.'
      : 'Both probes mark the same pixel. The output probe changes when the write reaches its row.',
  );
}

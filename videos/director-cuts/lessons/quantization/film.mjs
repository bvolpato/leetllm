import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { height, pixels, response, sample, width } from './specimen.mjs';

const beats = [
  {
    id: 'emulsion',
    say: "Watch the moth's outline as the filter switches to four-bit weights. Even the rings on its wings disappear. The input on the left hasn't changed.",
    hold: 1.0,
  },
  {
    id: 'eyespot',
    say: "Look at two neighboring pixels on the rim of this eyespot. One is dark and one is light. The edge filter takes the difference in brightness and multiplies it by point seven. A change in either direction leaves a mark.",
    hold: 0.9,
  },
  {
    id: 'range',
    say: "Each filter fills one row of the layer's weight matrix. Notice the fourteen in the second row. We'll store each weight as a four-bit code. In this symmetric grid, seven is the largest code. To reach fourteen, each step has to span two.",
    hold: 0.9,
  },
  {
    id: 'round',
    say: "Where do our two edge weights land on that grid? Both are closer to zero than to the next mark. They round to the same code. Now the filter multiplies both pixels by zero, even here at the rim of the eye.",
    hold: 1.0,
  },
  {
    id: 'split',
    say: "Give each filter its own scale. The second filter keeps its step of two. The edge filter only needs to reach point seven. With a step of one tenth, it can use both ends of the code range.",
    hold: 0.8,
  },
  {
    id: 'develop',
    say: "Read those edge codes back. Multiply minus seven and plus seven by a tenth, and we get our two original weights. Now run the filter over the wing again.",
    hold: 1.1,
  },
  {
    id: 'registration',
    say: "There's the ring, in exactly the same pixels. Giving each output row its own scale is called per-channel quantization. We stored one extra scale. Each weight code still takes four bits.",
    hold: 3.0,
  },
];

const weights = [[-0.7, 0.7], [0, 14]];
const maxCode = 7;
function encode(perFilter) {
  const peaks = weights.map(row => Math.max(...row.map(Math.abs)));
  const scales = (perFilter ? peaks : [Math.max(...peaks)]).map(peak => peak / maxCode);
  const rows = weights.map((row, i) => {
    const scale = scales[perFilter ? i : 0];
    const codes = row.map(w => Math.round(w / scale) || 0);
    return { scale, codes, values: codes.map(code => code * scale) };
  });
  return { scales, rows };
}
const shared = encode(false);
const separate = encode(true);
const originalResponse = response(weights[0]);
const sharedResponse = response(shared.rows[0].values);
const separateResponse = response(separate.rows[0].values);

function check() {
  assert.deepEqual(shared.rows.map(row => row.codes), [[0, 0], [0, 7]]);
  assert.deepEqual(separate.rows.map(row => row.codes), [[-7, 7], [0, 7]]);
  assert.equal(separate.scales.length - shared.scales.length, 1);
  assert.equal(pixels[sample.index], 0);
  assert.equal(pixels[sample.index + 1], 1);
  assert.equal(originalResponse[sample.index], 0.7);
  assert(originalResponse.filter(value => value !== 0).length > 300);
  assert(sharedResponse.every(value => value === 0));
  assert.deepEqual(separateResponse, originalResponse);
}

const ink = '#30253b';
const plum = '#48324f';
const red = '#a53b2c';
const coral = '#ff9175';
const pale = '#f5e7ab';
const muted = '#66566a';
const aperture = { x: 83, y: 247, w: 812, h: 496 };
const otherX = 1025;
const bodyY = 178;
const bodyH = 637;

const clamp = v => Math.min(1, Math.max(0, v));
const smooth = v => { const t = clamp(v); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const numeric = (value, plus = false) => (value < 0 ? '−' : plus && value !== 0 ? '+' : '') +
  String(Number(Math.abs(value).toFixed(3)));

function label(ctx, value, x, y, size = 42, color = ink, options = {}) {
  const { family = 'Sans', align = 'left', weight = 400 } = options;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}
function number(ctx, value, x, y, size, color = ink, align = 'center') {
  label(ctx, value, x, y, size, color, { family: 'Mono', align });
}
function heading(ctx, value, x) {
  label(ctx, value, x, 137, 65, ink, { family: 'Serif' });
}
function line(ctx, x1, y1, x2, y2, color, thickness = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
function disk(ctx, x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();
}
function opacity(ctx, amount, draw) {
  if (amount <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(amount);
  draw();
  ctx.restore();
}

// Render a contact print from actual sample magnitudes at a fixed exposure.
function print(values, bright) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const data = ctx.createImageData(width, height);
  const dark = [49, 39, 69];
  for (let i = 0; i < values.length; i++) {
    const amount = clamp(Math.abs(values[i]));
    const x = i % width;
    const y = Math.floor(i / width);
    const light = 0.84 + 0.16 * (1 - Math.hypot((x - 65) / 150, (y - 32) / 96));
    for (let k = 0; k < 3; k++) {
      data.data[4 * i + k] = mix(dark[k], bright[k], amount) * light;
    }
    data.data[4 * i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}
const fixedExposure = values => values.map(v => Math.abs(v) / Math.abs(weights[0][1]));
const inputPrint = print(pixels, [255, 232, 169]);
const beforePrint = print(fixedExposure(originalResponse), [255, 217, 168]);
const blankPrint = print(fixedExposure(sharedResponse), [255, 217, 168]);
const afterPrint = print(fixedExposure(separateResponse), [255, 217, 168]);

function backing(longStrip) {
  const canvas = createCanvas(1920, 1080);
  const ctx = canvas.getContext('2d');
  const glow = ctx.createRadialGradient(837, 422, 60, 865, 425, 1290);
  glow.addColorStop(0, '#fff7dd');
  glow.addColorStop(0.63, '#eee8e2');
  glow.addColorStop(1, '#d6cdd9');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1920, 1080);
  let seed = 88419;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  ctx.fillStyle = 'rgba(58,37,72,.075)';
  for (let i = 0; i < 19000; i++) {
    ctx.fillRect(random() * 1920, random() * 1080, random() * 2 + 0.4, 1);
  }

  // The film's perforations let the illuminated surface show through.
  const end = longStrip ? 1970 : 944;
  const strip = createCanvas(1920, bodyH);
  const s = strip.getContext('2d');
  const base = s.createLinearGradient(0, 0, 0, bodyH);
  base.addColorStop(0, '#422e43');
  base.addColorStop(0.05, '#573c53');
  base.addColorStop(0.19, '#342638');
  base.addColorStop(0.81, '#302235');
  base.addColorStop(0.96, '#50354c');
  base.addColorStop(1, '#39293c');
  s.fillStyle = base;
  s.fillRect(0, 0, end, bodyH);
  s.fillStyle = 'rgba(241,192,151,.26)';
  s.fillRect(0, 3, end, 3);
  s.fillRect(0, bodyH - 6, end, 2);
  s.globalCompositeOperation = 'destination-out';
  for (let x = -14; x < end - 20; x += 81) {
    for (const y of [18, bodyH - 43]) {
      s.beginPath();
      s.roundRect(x, y, 37, 25, 5);
      s.fillStyle = '#000';
      s.fill();
    }
  }
  ctx.shadowColor = 'rgba(54,34,52,.27)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 9;
  ctx.drawImage(strip, 0, bodyY);
  return canvas;
}
const fullBacking = backing(true);
const cutBacking = backing(false);

function showPrint(ctx, image, x, zoom = 1) {
  const { y, w, h } = aperture;
  const amount = zoom === 1 ? 0 : 1 - 1 / zoom;
  const sourceW = width / zoom;
  const sourceH = height / zoom;
  const sx = amount * (sample.x + 1);
  const sy = amount * (sample.y + 0.5);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, sx, sy, sourceW, sourceH, x, y, w, h);
  return {
    x: x + (sample.x - sx) * w / sourceW,
    y: y + (sample.y - sy) * h / sourceH,
    cell: w / sourceW,
  };
}

function stripPair(ctx, oldPrint, newPrint, scan) {
  ctx.drawImage(fullBacking, 0, 0);
  heading(ctx, 'Input bitmap', aperture.x);
  heading(ctx, 'Edge strength', otherX);
  showPrint(ctx, inputPrint, aperture.x);
  showPrint(ctx, oldPrint, otherX);
  const { y, w, h } = aperture;
  const rows = Math.floor(smooth(scan) * height);
  if (rows > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(otherX, y, w, h * rows / height);
    ctx.clip();
    showPrint(ctx, newPrint, otherX);
    ctx.restore();
  }
  if (rows > 0 && rows < height) {
    const scanY = y + h * rows / height;
    line(ctx, otherX, scanY, otherX + w, scanY, coral, 3);
  }
}

// The two dashes sit outside the sampled pair so both input levels stay visible.
function detail(ctx, zoom, focus, image = inputPrint, edge = false) {
  ctx.drawImage(cutBacking, 0, 0);
  heading(ctx, edge ? 'Edge detail' : 'Input detail', aperture.x);
  const pos = showPrint(ctx, image, aperture.x, zoom);
  opacity(ctx, focus, () => {
    const { x, y, w, h } = aperture;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    const cellHeight = h * zoom / height;
    const firstX = pos.x - Math.ceil((pos.x - x) / pos.cell) * pos.cell;
    const firstY = pos.y - Math.ceil((pos.y - y) / cellHeight) * cellHeight;
    for (let px = firstX; px < x + w; px += pos.cell)
      line(ctx, px, y, px, y + h, 'rgba(156,131,167,.22)', 1.3);
    for (let py = firstY; py < y + h; py += cellHeight)
      line(ctx, x, py, x + w, py, 'rgba(156,131,167,.22)', 1.3);
    ctx.restore();
    const gap = 6;
    const left = pos.x - gap;
    const right = pos.x + (edge ? 1 : 2) * pos.cell + gap;
    const top = pos.y - gap;
    const bottom = pos.y + pos.cell + gap;
    ctx.strokeStyle = coral;
    ctx.lineWidth = 5;
    ctx.strokeRect(left, top, right - left, bottom - top);
    const mid = (left + right) / 2;
    line(ctx, mid, bottom, mid, bottom + 29, coral, 4);
    const legendY = aperture.y + aperture.h + 137;
    if (edge) {
      label(ctx, 'Response at the rim', aperture.x, legendY, 39, muted);
      const value = image === blankPrint ? sharedResponse[sample.index] :
        image === afterPrint ? separateResponse[sample.index] : originalResponse[sample.index];
      number(ctx, numeric(value, true), aperture.x + 569, legendY + 1, 46, red);
    } else {
      label(ctx, 'Sampled pixels', aperture.x, legendY, 39, muted);
      number(ctx, String(pixels[sample.index]) + '   ' + String(pixels[sample.index + 1]),
        aperture.x + 475, legendY + 1, 46);
    }
  });
}

const left = 1015;
const center = 1421;
function pixelCalculation(ctx, clock) {
  heading(ctx, 'Before rounding', left);
  const inputs = [pixels[sample.index], pixels[sample.index + 1]];
  const columns = [left + 191, left + 570];
  for (const [i, x] of columns.entries()) {
    label(ctx, i === 0 ? 'Left pixel' : 'Right pixel', x, 296, 40, muted, { align: 'center' });
    ctx.fillStyle = inputs[i] ? pale : plum;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.fillRect(x - 60, 344, 120, 120);
    ctx.strokeRect(x - 60, 344, 120, 120);
    number(ctx, String(inputs[i]), x, 429, 66, inputs[i] ? ink : pale);
  }
  const multiply = clock.reveal('The edge filter', 0.5);
  opacity(ctx, multiply, () => {
    number(ctx, '× ' + numeric(weights[0][0]), columns[0], 565, 65);
    number(ctx, '+', (columns[0] + columns[1]) / 2, 560, 47, muted);
    number(ctx, '× ' + numeric(weights[0][1]), columns[1], 565, 65);
    line(ctx, left + 30, 606, left + 739, 606, muted);
  });
  opacity(ctx, clock.reveal('and multiplies', 0.5), () => {
    label(ctx, 'Response', left + 50, 728, 47, ink, { family: 'Serif' });
    number(ctx, numeric(originalResponse[sample.index], true), left + 616, 744, 99, red);
  });
}

function originalMatrix(ctx, clock) {
  heading(ctx, 'Filter weights', left);
  const col = [left + 448, left + 722];
  label(ctx, 'Left pixel', col[0], 292, 38, muted, { align: 'center' });
  label(ctx, 'Right pixel', col[1], 292, 38, muted, { align: 'center' });
  for (const [i, row] of weights.entries()) {
    const y = 427 + i * 131;
    label(ctx, i === 0 ? 'Edge' : 'Second filter', left, y, 48, ink, { family: 'Serif' });
    for (const [j, value] of row.entries()) {
      const choose = i === 1 && j === 1;
      number(ctx, numeric(value), col[j], y, 69, choose ? red : ink);
      if (choose) opacity(ctx, clock.reveal('Notice the fourteen', 0.5), () =>
        line(ctx, col[j] - 51, y + 15, col[j] + 51, y + 15, red, 5));
    }
  }
  line(ctx, left, 611, 1847, 611, muted);
  opacity(ctx, clock.reveal('four-bit code', 0.5), () => {
    label(ctx, '4-bit codes', left, 703, 42);
    number(ctx, '−7   …   0   …   +7', 1834, 706, 43, ink, 'right');
  });
  opacity(ctx, clock.reveal('To reach fourteen', 0.45), () => {
    label(ctx, 'Shared step', left, 851, 43, muted);
    number(ctx, '14 ÷ 7 = ' + numeric(shared.scales[0]), 1825, 864, 68, red, 'right');
  });
}

function nearest(ctx, clock) {
  heading(ctx, 'Nearest grid mark', left);
  const step = shared.scales[0];
  const dx = 175;
  const y = 490;
  const move = smooth(clock.reveal('Both are closer', 1.45));
  const originalX = weights[0].map(w => center + w * dx);
  const ends = shared.rows[0].values.map(w => center + w * dx);
  label(ctx, 'Shared step of ' + numeric(step), left, 261, 44, muted);
  line(ctx, center - 383, y, center + 383, y, ink, 3);
  for (const w of [-step, 0, step]) {
    const x = center + w * dx;
    line(ctx, x, y - 19, x, y + 19, ink, 3);
    number(ctx, numeric(w, true), x, y + 86, 56);
  }
  for (const [i, start] of originalX.entries()) {
    const x = mix(start, ends[i], move);
    const tipY = mix(y - 17, y, move);
    number(ctx, numeric(weights[0][i], true), start, y - 102, 48, red);
    line(ctx, start, y - 79, start, y - 28, red, 2);
    line(ctx, start, y - 17, x, tipY, red, 3);
    disk(ctx, x, tipY, 12, red);
  }
  opacity(ctx, clock.reveal('They round', 0.6), () => {
    label(ctx, 'Stored edge codes', left, 700, 43, ink);
    number(ctx, shared.rows[0].codes.join('     '), 1808, 703, 63, red, 'right');
  });
  opacity(ctx, clock.reveal('Now the filter', 0.6), () => {
    line(ctx, left, 752, 1847, 752, muted);
    const row = shared.rows[0].values;
    const sum = pixels[sample.index] + ' × ' + row[0] + '  +  ' + pixels[sample.index + 1] +
      ' × ' + row[1] + '  =  ' + numeric(sharedResponse[sample.index]);
    number(ctx, sum, left + 402, 850, 51);
  });
}

function scales(ctx, clock) {
  heading(ctx, 'One scale per filter', left);
  const stepX = 1469;
  const codesX = 1732;
  label(ctx, 'Step', stepX, 301, 40, muted, { align: 'center' });
  label(ctx, '4-bit codes', codesX, 301, 40, muted, { align: 'center' });
  const changed = clock.reveal('With a step', 0.55);
  for (let i = 0; i < 2; i++) {
    const y = 437 + i * 137;
    const row = changed > 0.5 ? separate.rows[i] : shared.rows[i];
    const color = i === 0 && changed > 0.5 ? red : ink;
    label(ctx, i === 0 ? 'Edge' : 'Second filter', left, y, 48, ink, { family: 'Serif' });
    const amount = i === 0 ? Math.abs(1 - 2 * changed) : 1;
    opacity(ctx, amount, () => {
      number(ctx, numeric(row.scale), stepX, y + 2, 60, color);
      number(ctx, row.codes.map(c => numeric(c, true)).join('  '), codesX, y + 2, 59, color);
    });
  }
  line(ctx, left, 636, 1847, 636, muted);
}

function readBack(ctx, clock) {
  heading(ctx, 'Decode the edge weights', left);
  const row = separate.rows[0];
  for (let i = 0; i < row.codes.length; i++) {
    const y = 386 + i * 169;
    number(ctx, numeric(row.codes[i], true) + ' × ' + numeric(row.scale),
      left + 214, y, 70);
    opacity(ctx, clock.reveal('and we get', 0.6), () =>
      number(ctx, '= ' + numeric(row.values[i], true), left + 642, y, 70, red));
  }
}

function draw(ctx, clock) {
  const { id } = clock.beat;
  if (id === 'develop' && clock.reveal('Now run the filter', 2.1) === 0) {
    detail(ctx, 3.1, 1, afterPrint, true);
    readBack(ctx, clock);
    return;
  }
  if (id === 'emulsion' || id === 'develop' || id === 'registration') {
    const losing = id === 'emulsion';
    const scan = losing ? clamp(clock.elapsed / 3.7) :
      id === 'registration' ? 1 : clock.reveal('Now run the filter', 2.1);
    stripPair(ctx, losing ? beforePrint : blankPrint, losing ? blankPrint : afterPrint, scan);
    label(ctx, 'Pixel brightness  ·  0 or 1', aperture.x, 885, 39, muted);
    const state = losing && scan === 0 ? 'Original weights' :
      losing ? '4 bits per weight  ·  1 scale' : '4 bits per weight  ·  2 scales';
    label(ctx, state, otherX, 885, 39, muted);
    return;
  }

  const focus = id === 'eyespot' ? smooth(clock.reveal('Look at two neighboring pixels', 1.25)) : 1;
  const edge = id === 'round' || id === 'split';
  let image = inputPrint;
  if (id === 'round') image = clock.reveal('Both are closer', 1.45) === 1 ? blankPrint : beforePrint;
  if (id === 'split') image = clock.reveal('With a step', 0.55) > 0.5 ? afterPrint : blankPrint;
  detail(ctx, mix(1, 3.1, focus), focus, image, edge);
  if (id === 'eyespot') pixelCalculation(ctx, clock);
  if (id === 'range') originalMatrix(ctx, clock);
  if (id === 'round') nearest(ctx, clock);
  if (id === 'split') scales(ctx, clock);
}

export default { title: 'The missing moth outline', beats, draw, check };

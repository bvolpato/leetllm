import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {decode8, encode8, hexByte} from '../../../films/low-precision-kernels/encoding.mjs';
import {input, sample, size} from './lunar-image.mjs';

const title = 'Why did a weight of one darken the moon?';
const beats = [
  {
    id: 'overwrite',
    say: 'Watch the kernel write over this copy of the moon. It has one weight. Multiplying each pixel by one should leave the image just as bright. Look at this crater.',
    hold: 1.0,
  },
  {
    id: 'sample',
    say: 'One hundred ninety-two went in. Ninety-six came out. Follow the weight. The source wrote it as an eight-bit floating-point number. The kernel on the right received a copy of that byte.',
    hold: 0.7,
  },
  {
    id: 'source-reader',
    say: 'The sign bit and the fraction bits are zero, so this weight is a power of two. Read the four colored bits. They store seven. The source format subtracts a bias of seven. Two to the zero gives us one.',
    hold: 0.75,
  },
  {
    id: 'receiving-reader',
    say: 'Now read those same four bits on the right. This format subtracts eight. That leaves an exponent of minus one. Two to the minus one is a half. Every pixel went through that multiplication.',
    hold: 0.9,
  },
  {
    id: 'encode-the-value',
    say: 'Let’s send the weight again. Decode the source byte to get the value one, then encode that value for the receiving kernel. What should the four bits store this time?',
    hold: 1.9,
  },
  {
    id: 'second-exposure',
    say: 'Eight. Subtract the receiver’s bias of eight and the exponent comes back to zero. Run the kernel again.',
    hold: 1.45,
  },
  {
    id: 'matched-rim',
    say: 'There’s our bright crater again. Both samples read one hundred ninety-two. It took a different byte to give this kernel the same weight.',
    hold: 3.0,
  },
];

const source = encode8(1, 'ocp').code;
const recoded = encode8(decode8(source, 'ocp'), 'fnuz').code;
const correctGain = decode8(recoded, 'fnuz');
const copiedGain = decode8(source, 'fnuz');
const convertImage = gain => Uint8Array.from(input, value => value * gain);
const dim = convertImage(copiedGain);
const restored = convertImage(correctGain);

function check() {
  assert.equal(source, 0x38);
  assert.equal(recoded, 0x40);
  assert.equal(decode8(source, 'ocp'), 1);
  assert.equal(copiedGain, 0.5);
  assert.equal(correctGain, 1);
  assert.equal(sample.index, sample.row * size + sample.col);
  assert.equal(input[sample.index], 192);
  assert.equal(dim[sample.index], 96);
  assert.deepEqual(restored, input);
  assert(input.every((value, i) => dim[i] * 2 === value));
}

// The camera enlarges nearest-neighbor samples from the buffers used in check().
function photographicPlate(pixels) {
  const canvas = createCanvas(size, size);
  const context = canvas.getContext('2d');
  const rgba = context.createImageData(size, size);
  for (let i = 0; i < pixels.length; i++) {
    rgba.data.set([pixels[i], pixels[i], pixels[i], 255], i * 4);
  }
  context.putImageData(rgba, 0, 0);
  return canvas;
}
const originalPlate = photographicPlate(input);
const darkPlate = photographicPlate(dim);
const correctedPlate = photographicPlate(restored);

const paper = '#e9e6ef';
const ink = '#231e30';
const graphite = '#655d70';
const violet = '#5531ab';
const mint = '#d9ff8f';
const mono = 'Lesson Mono', sans = 'Lesson Sans', serif = 'Lesson Serif';
const clip = t => Math.max(0, Math.min(1, t));
const ease = t => { const u = clip(t); return u * u * (3 - 2 * u); };
const mix = (a, b, t) => a + (b - a) * t;

function type(ctx, text, x, y, size, face = mono, color = ink, align = 'left', weight = 400) {
  ctx.font = `${weight} ${size}px "${face}"`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(String(text), x, y);
}
function line(ctx, x, y, x2, y2, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function state(clock) {
  const {index, elapsed, reveal} = clock;
  const opened = index === 0 ? clip(0.09 + elapsed / 2.5) : 1;
  const inspected = index < 1 ? 0 : index === 1 ? ease(reveal('Follow the weight', 1.1)) : 1;
  const exposeAgain = index < 5 ? 0 : index === 5 ? reveal('Run the kernel again', 1.8) : 1;
  const finish = index === 6 ? ease(reveal('There’s our bright crater again', 1.2)) : 0;
  return {
    opened, inspected, exposeAgain, finish,
    probe: index === 0 ? ease(reveal('Look at this crater', 0.55)) : 1,
    highlight: index < 2 ? 0 : index === 2 ? ease(reveal('Read the four colored bits', 0.5)) : 1,
    sourceMath: index < 2 ? 0 : index === 2 ? ease(reveal('The source format subtracts', 0.5)) : 1,
    sourceAnswer: index < 2 ? 0 : index === 2 ? ease(reveal('Two to the zero', 0.4)) : 1,
    receiverMath: index < 3 ? 0 : index === 3 ? ease(reveal('This format subtracts eight', 0.5)) : 1,
    receiverAnswer: index < 3 ? 0 : index === 3 ? ease(reveal('Two to the minus one', 0.4)) : 1,
    predict: index === 4 ? ease(reveal('What should the four bits store', 0.5)) : 0,
    replaced: index >= 5,
    writeFlash: index === 5 ? 1 - ease(reveal('Eight', 0.65)) : 0,
  };
}

function drawMoon(ctx, x, receiver, s) {
  const detail = s.inspected * (1 - 0.66 * s.finish);
  const top = 150, height = mix(598, 447, detail), width = 875;
  const side = height - 18, px = x + (width - side) / 2 - 34, py = top + 9;
  ctx.imageSmoothingEnabled = false;
  // Zero is black in all three images, including the margin beyond the raster.
  ctx.fillStyle = '#000';
  ctx.fillRect(x, top, width, height);

  const sweeping = s.exposeAgain > 0;
  const fraction = sweeping ? s.exposeAgain : s.opened;
  const scanRow = Math.floor(size * fraction);
  ctx.drawImage(receiver && sweeping ? darkPlate : originalPlate, px, py, side, side);
  if (receiver) {
    const scanY = py + side * scanRow / size;
    ctx.save();
    ctx.beginPath(); ctx.rect(px, py, side, scanY - py); ctx.clip();
    ctx.drawImage(sweeping ? correctedPlate : darkPlate, px, py, side, side);
    ctx.restore();
    if (fraction > 0 && fraction < 1) {
      line(ctx, x + 13, scanY, x + width - 13, scanY, mint, 2.4);
      ctx.fillStyle = mint;
      ctx.fillRect(x + 9, scanY - 8, 6, 16);
    }
  }

  // A fixed probe samples the same address on each plate as the picture is resized.
  const sx = px + side * (sample.col + 0.5) / size;
  const sy = py + side * (sample.row + 0.5) / size;
  const updated = sample.row < scanRow;
  const receivedPixel = sweeping ? (updated ? restored : dim) : (updated ? dim : input);
  if (s.probe > 0) {
    ctx.save();
    ctx.globalAlpha = s.probe;
    const n = 12, tip = x + width - 117, y = sy - 67;
    ctx.strokeStyle = mint; ctx.lineWidth = 3;
    ctx.strokeRect(sx - n, sy - n, 2 * n, 2 * n);
    ctx.beginPath(); ctx.moveTo(sx + n, sy - n); ctx.lineTo(sx + n + 55, y);
    ctx.lineTo(tip + 22, y); ctx.stroke();
    type(ctx, (receiver ? receivedPixel : input)[sample.index], tip + 22, y - 10, 52, mono, mint, 'right');
    ctx.restore();
  }
  return top + height;
}

function paintByte(ctx, x, y, code, highlight, flash) {
  const bits = code.toString(2).padStart(8, '0');
  const groups = [bits[0], bits.slice(1, 5), bits.slice(5)];
  const spans = [82, 242, 186];
  let cursor = x;
  groups.forEach((digits, i) => {
    const w = spans[i], focused = i === 1 && highlight > 0;
    const gap = 6;
    ctx.fillStyle = focused ? violet : '#d9d5e0';
    ctx.fillRect(cursor, y - 64, w - gap, 78);
    if (i === 1 && flash > 0) {
      ctx.save();
      ctx.globalAlpha *= flash;
      ctx.fillStyle = '#9570ec';
      ctx.fillRect(cursor, y - 64, w - gap, 78);
      ctx.restore();
    }
    type(ctx, digits, cursor + (w - gap) / 2, y, 56, mono, focused ? '#fff' : ink, 'center');
    type(ctx, ['sign', 'exponent', 'fraction'][i], cursor + (w - gap) / 2, y + 50, 30, sans, focused ? violet : graphite, 'center');
    cursor += w;
  });
  type(ctx, hexByte(code), x + 551, y - 6, 48, mono, ink);
}

// Typeset the power separately so its exponent stays legible at phone size.
function power(ctx, x, y, exp, bias, value, answer) {
  type(ctx, '2', x, y, 73, serif);
  ctx.font = `46px "${mono}"`;
  const exponent = `(${exp} − ${bias})`;
  const w = ctx.measureText(exponent).width;
  type(ctx, exponent, x + 44, y - 36, 46, mono, violet);
  if (answer > 0) {
    ctx.save(); ctx.globalAlpha *= answer;
    type(ctx, '=  ' + (value === 0.5 ? '½' : value), x + 69 + w, y, 61, serif);
    ctx.restore();
  }
}

function drawReader(ctx, x, receiver, bottom, s) {
  const origin = x + 12;
  const detail = s.inspected * (1 - s.finish);
  if (detail < 0.46) {
    ctx.save(); ctx.globalAlpha = 1 - clip(detail / 0.46);
    const final = s.finish > 0, label = receiver ? 'Received weight' : 'Source weight';
    const gain = receiver && !final ? '?' : 1;
    type(ctx, label, origin, bottom + 68, 36, sans, graphite);
    type(ctx, '× ' + gain, origin + 327, bottom + 79, 66, serif);
    if (final) type(ctx, hexByte(receiver ? recoded : source), origin + 622, bottom + 73, 42, mono, violet);
    ctx.restore();
  }
  if (detail <= 0.46) return;
  ctx.save();
  ctx.globalAlpha = clip((detail - 0.46) / 0.54);
  const code = receiver && s.replaced ? recoded : source;
  const format = receiver ? 'E4M3FNUZ' : 'E4M3FN';
  const row = bottom + 162;
  type(ctx, format, origin, bottom + 58, 46, mono, ink);
  type(ctx, receiver ? 'kernel reader' : 'source reader', origin + 272, bottom + 56, 36, sans, graphite);
  paintByte(ctx, origin, row, code, s.highlight, receiver ? s.writeFlash : 0);
  const math = receiver ? s.receiverMath : s.sourceMath;
  if (math > 0) {
    ctx.save(); ctx.globalAlpha *= math;
    if (receiver && s.predict > 0) {
      type(ctx, 'To encode 1', origin, row + 133, 40, sans, graphite);
      type(ctx, '? − 8 = 0', origin + 264, row + 135, 54, mono, violet);
    } else {
      const gain = decode8(code, receiver ? 'fnuz' : 'ocp');
      power(ctx, origin, row + 146, (code >> 3) & 15, receiver ? 8 : 7, gain, receiver ? s.receiverAnswer : s.sourceAnswer);
    }
    ctx.restore();
  }
  ctx.restore();
}

function draw(ctx, clock) {
  const s = state(clock);
  ctx.save();
  ctx.fillStyle = paper; ctx.fillRect(0, 0, 1920, 1080);
  const positions = [70, 975];
  for (const [i, x] of positions.entries()) {
    const receiver = i === 1;
    type(ctx, receiver ? '1 × 1 kernel output' : 'Lunar test image', x, 103, 65, serif);
    line(ctx, x, 128, x + 875, 128, graphite);
    const bottom = drawMoon(ctx, x, receiver, s);
    drawReader(ctx, x, receiver, bottom, s);
  }
  ctx.restore();
}

export default {title, beats, draw, check};

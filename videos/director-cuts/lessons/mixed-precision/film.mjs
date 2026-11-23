import assert from 'node:assert/strict';
import { fp16 } from '../../../films/mixed-precision/arithmetic.mjs';
import { below, decrement, one, weightHistory } from '../../../films/mixed-precision/weight-ruler.mjs';

const title = 'The third write';
const beats = [
  {
    id: 'the-first-write',
    say: 'Subtract one ten-thousandth from this weight. The pink mark shows where the subtraction lands. Follow the blue line downhill. What number did the weight actually store?',
    hold: 1.2,
  },
  {
    id: 'rounding-to-one',
    say: 'One. These are neighboring numbers in sixteen-bit floating point. The crest is halfway between them. From our mark, one is closer. Try that subtraction again. Each write starts from one and rounds back to one.',
    hold: 1.1,
  },
  {
    id: 'keeping-the-first-step',
    say: 'Start again at one. This time the optimizer keeps the weight in thirty-two bits. The matrix multiply gets a sixteen-bit copy. Take the first step. See where the pink mark stays? That is where the next subtraction starts.',
    hold: 0.8,
  },
  {
    id: 'the-second-step',
    say: 'Take a second step. The weight has moved twice now. Its copy still rounds to one. Look at how far each step takes us. Which number will the multiply read after one more?',
    hold: 1.75,
  },
  {
    id: 'the-third-step',
    say: 'Take that step. Follow the blue line. Look up at the word. The exponent dropped by one and all ten fraction bits lit up. Together they spell the next number below one. The pink mark crossed halfway, so the copy rounded down.',
    hold: 1.2,
  },
  {
    id: 'one-multiply',
    say: 'Use that copy in one term of a matrix multiply. The input is two thousand forty-eight. With the old weight of one, the product was also two thousand forty-eight. Multiply by the new weight. Exactly one less. Three small updates reached the multiply through the same two bytes.',
    hold: 2.4,
  },
];

const history = weightHistory(3);
const halfway = (one + below) / 2;
const attempted = one - fp16(decrement);
const input = 2048;

// Every word used in the shot is already rounded to a positive normal binary16 value.
function word(value) {
  const exponent = Math.floor(Math.log2(value));
  const fraction = (value / 2 ** exponent - 1) * 1024;
  return ((exponent + 15) * 1024 + fraction).toString(2).padStart(16, '0');
}

function check() {
  assert.deepEqual(history.map(row => row.direct), [one, one, one, one]);
  assert.deepEqual(history.map(row => row.copy), [one, one, one, below]);
  assert.deepEqual(history.map(row => row.master), [
    one, 0.9998999834060669, 0.9997999668121338, 0.9996999502182007,
  ]);
  assert(attempted > halfway && fp16(attempted) === one);
  assert(history[2].master > halfway && history[3].master < halfway);
  assert.equal(word(one), '0011110000000000');
  assert.equal(word(below), '0011101111111111');
  assert.equal(input * history[2].copy, 2048);
  assert.equal(input * history[3].copy, 2047);
  assert.equal(fp16(input * below), input * below);
  return true;
}

const ink = '#211e53';
const dim = '#5d5879';
const pink = '#b12d5e';
const blue = '#3946bd';
const pale = '#f6f4fa';
const left = 245, right = 1675, mid = (left + right) / 2;
const place = value => left + (value - below) / (one - below) * (right - left);
const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => n * n * (3 - 2 * n);
const mix = (a, b, t) => a + (b - a) * t;

function label(ctx, s, x, y, size, color, align = 'left', family = 'Sans', weight = 400) {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(String(s), x, y);
}

function path(ctx, points, close = false) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  if (close) ctx.closePath();
}

function stroke(ctx, pts, color, width = 2) {
  path(ctx, pts);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function polygon(ctx, pts, fill) {
  path(ctx, pts, true);
  ctx.fillStyle = fill;
  ctx.fill();
}

function chipShape(x, y, w, h, cut) {
  return [[x + cut, y], [x + w, y], [x + w, y + h - cut], [x + w - cut, y + h],
    [x, y + h], [x, y + cut]];
}

const cellWidth = 92, cellTop = 193, cellHeight = 142;
const cellX = i => 120 + 103 * i + (i >= 1 ? 18 : 0) + (i >= 6 ? 26 : 0);

function die(ctx, stored, mixed, flash) {
  const wash = ctx.createLinearGradient(0, 0, 1920, 470);
  wash.addColorStop(0, '#29286f');
  wash.addColorStop(0.52, '#34348b');
  wash.addColorStop(1, '#262563');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, 1920, 455);

  label(ctx, mixed ? 'FP16 multiply operand' : 'FP16 weight', 120, 104, 59, '#faf6ff', 'left', 'Sans', 600);
  label(ctx, stored === one ? '1.0' : String(stored), 1800, 104, 67, '#f4f5ff', 'right', 'Mono');

  const digits = word(stored);
  for (let i = 0; i < digits.length; i++) {
    const x = cellX(i), cx = x + cellWidth / 2;
    const on = digits[i] === '1';
    // Etched leads carry the eye into each site of the sixteen-bit word.
    for (const offset of [-9, 0, 9]) {
      stroke(ctx, [[cx + offset - 11, 155], [cx + offset - 11, 165],
        [cx + offset, 176], [cx + offset, cellTop]], '#5756a1', 2);
      stroke(ctx, [[cx + offset, 333], [cx + offset, 348], [cx + offset + 11, 359],
        [cx + offset + 11, 367]], '#5756a1', 2);
    }
    polygon(ctx, chipShape(x - 3, cellTop - 3, cellWidth + 6, cellHeight + 8, 16), '#171746');
    polygon(ctx, chipShape(x, cellTop, cellWidth, cellHeight, 14), on ? '#e0f3ff' : '#393e92');
    stroke(ctx, [[x + 3, cellTop + 17], [x + 16, cellTop + 4], [x + cellWidth - 5, cellTop + 4]],
      on ? '#ffffff' : '#6471c6', 3);
    // The ink lies in short bars, like a magnified bit-cell mask.
    for (let k = 0; k < 4; k++) {
      stroke(ctx, [[x + 12, cellTop + 20 + k * 5], [x + cellWidth - 12, cellTop + 20 + k * 5]],
        on ? '#b2cfed' : '#444c9d', 2);
    }
    label(ctx, digits[i], cx, cellTop + 78, 67, on ? '#25255d' : '#c0c7ff', 'center', 'Mono');
    if (flash > 0 && digits[i] !== word(one)[i]) {
      ctx.fillStyle = 'rgba(255,255,255,' + 0.22 * flash + ')';
      ctx.fillRect(x + 9, cellTop + cellHeight - 10, cellWidth - 20, 4);
    }
  }
  for (const [i, last, name] of [[0, 0, 'sign'], [1, 5, 'exponent'], [6, 15, 'fraction']]) {
    const a = cellX(i), b = cellX(last) + cellWidth;
    stroke(ctx, [[a, 365], [a, 374], [b, 374], [b, 365]], '#9295ce', 2);
    label(ctx, name, (a + b) / 2, 407, 32, '#d7dbff', 'center');
  }
}

const floorY = 811;
// Height is proportional to the absolute error of rounding to the nearer neighbor.
const ridgeY = x => floorY - 165 * Math.min(x - left, right - x) / (mid - left);

function interval(ctx, revealMiddle, stored) {
  const crest = ridgeY(mid);
  polygon(ctx, [[left, floorY], [mid, crest], [mid, floorY]], '#d8d7ee');
  polygon(ctx, [[mid, crest], [right, floorY], [mid, floorY]], '#e4e3f0');
  stroke(ctx, [[left, floorY], [mid, crest], [right, floorY]], '#9999bb', 4);
  stroke(ctx, [[left, floorY], [right, floorY]], '#b8b6cd', 2);
  for (const [x, value] of [[left, below], [right, one]]) {
    const selected = value === stored;
    ctx.beginPath();
    ctx.arc(x, floorY, selected ? 12 : 8, 0, 2 * Math.PI);
    ctx.fillStyle = selected ? blue : pale;
    ctx.fill();
    ctx.strokeStyle = selected ? blue : '#81809f';
    ctx.lineWidth = 3;
    ctx.stroke();
    label(ctx, value === one ? '1.0' : '≈ ' + value.toFixed(5), x, 873, 49,
      selected ? blue : dim, 'center', 'Mono');
  }
  if (revealMiddle > 0) {
    ctx.save();
    ctx.globalAlpha = revealMiddle;
    ctx.setLineDash([7, 9]);
    stroke(ctx, [[mid, crest + 2], [mid, floorY + 19]], '#777494', 3);
    ctx.setLineDash([]);
    label(ctx, 'halfway', mid, 873, 39, dim, 'center');
    ctx.restore();
  }
}

function pointer(ctx, x, valueLabel) {
  const y = ridgeY(x) - 3;
  polygon(ctx, [[x - 16, y - 43], [x + 16, y - 43], [x + 16, y - 21], [x, y], [x - 16, y - 21]], pink);
  if (valueLabel) label(ctx, valueLabel, x, y - 75, 47, pink, 'center', 'Mono');
}

function stepTrail(ctx, xs, cursor) {
  const stops = xs[0] > mid && cursor < mid ? [xs[0], mid, cursor] : [xs[0], cursor];
  stroke(ctx, stops.map(x => [x, ridgeY(x) - 29]), pink, 5);
  for (const x of xs) {
    ctx.beginPath();
    ctx.arc(x, ridgeY(x) - 29, 8, 0, Math.PI * 2);
    ctx.fillStyle = pale;
    ctx.fill();
    ctx.strokeStyle = pink;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

function roundingArrow(ctx, from, to, progress) {
  if (progress <= 0 || Math.abs(from - to) < 2) return;
  const end = mix(from, to, ease(progress));
  stroke(ctx, [[from, ridgeY(from)], [end, ridgeY(end)]], blue, 9);
  ctx.beginPath();
  ctx.arc(end, ridgeY(end), 11, 0, 2 * Math.PI);
  ctx.fillStyle = blue;
  ctx.fill();
}

function direct(ctx, clock) {
  const first = clock.index === 0;
  const repeat = first ? 0 : clock.reveal('Try that subtraction again', 0.3);
  const motion = first
    ? ease(clamp(clock.elapsed / 1.1))
    : repeat ? ease(clock.reveal('Try that subtraction again', 1.0)) : 1;
  const rounded = first ? clock.reveal('The pink mark', 0.72)
    : repeat ? clock.reveal('Each write starts', 0.72) : 1;
  const cursor = mix(right, place(attempted), motion);

  label(ctx, 'Subtract 0.0001', 120, 550, 54, ink, 'left', 'Serif');
  label(ctx, repeat ? 'write 2' : 'write 1', 1800, 550, 38, dim, 'right', 'Mono');
  interval(ctx, first ? 0 : clock.reveal('The crest', 0.5), one);
  stepTrail(ctx, [right], cursor);
  pointer(ctx, cursor, motion === 1 ? '≈ 0.9999' : '');
  roundingArrow(ctx, cursor, right, rounded);
}

function mixed(ctx, clock, model) {
  const {step, move, round} = model;
  const prev = history[step - 1], current = history[step];
  const startX = place(prev.master), endX = place(current.master);
  const cursor = mix(startX, endX, move);

  label(ctx, 'Optimizer weight in FP32', 120, 550, 54, ink, 'left', 'Serif');
  label(ctx, 'step ' + (move === 0 ? step - 1 : step) + '    −0.0001', 1800, 550, 38, dim, 'right', 'Mono');
  interval(ctx, 1, round === 1 ? current.copy : prev.copy);
  const trail = history.slice(0, step).map(row => place(row.master));
  stepTrail(ctx, trail, cursor);
  pointer(ctx, cursor, move === 1 ? '≈ ' + current.master.toFixed(4) : move === 0
    ? (prev.master === one ? '1.0' : '≈ ' + prev.master.toFixed(4)) : '');
  // Leave the previous rounding decision in place during the prediction hold.
  if (move === 0) roundingArrow(ctx, startX, place(prev.copy), 1);
  else roundingArrow(ctx, endX, place(current.copy), round);
}

function product(ctx, clock) {
  const oldTerm = clock.reveal('With the old weight', 0.35);
  const productShown = clock.reveal('Multiply by the new weight', 0.45);
  const stored = history[3].copy;
  label(ctx, 'One term of the matrix multiply', 120, 548, 54, ink, 'left', 'Serif');
  label(ctx, 'step 3', 1800, 548, 38, dim, 'right', 'Mono');

  const operands = [[260, 'input', String(input)], [947, 'FP16 weight', stored === one ? '1.0' : String(stored)],
    [1675, 'product', String(input * stored)]];
  for (const [x, name, value] of operands) {
    const color = name === 'product' ? blue : ink;
    label(ctx, name, x, 684, 36, dim, 'center');
    if (name !== 'product' || productShown > 0) {
      ctx.save();
      if (name === 'product') ctx.globalAlpha = productShown;
      label(ctx, value, x, 784, name === 'FP16 weight' ? 60 : 100, color, 'center', 'Mono');
      ctx.restore();
    }
  }
  label(ctx, '×', 520, 780, 72, dim, 'center');
  label(ctx, '=', 1390, 780, 72, dim, 'center', 'Mono');
  if (oldTerm > 0) {
    ctx.save();
    ctx.globalAlpha = oldTerm;
    label(ctx, 'was ' + input * history[2].copy, 1675, 886, 34, dim, 'center', 'Mono');
    ctx.restore();
  }
}

function draw(ctx, clock) {
  ctx.fillStyle = pale;
  ctx.fillRect(0, 0, 1920, 1080);
  const index = clock.index;
  if (index < 2) {
    die(ctx, one, false, 0);
    direct(ctx, clock);
    return;
  }
  if (index === 5) {
    die(ctx, history[3].copy, true, 0);
    product(ctx, clock);
    return;
  }

  const step = index - 1;
  const cue = ['Take the first step', 'Take a second step', 'Take that step'][step - 1];
  const action = clock.reveal(cue, 1.6);
  const move = ease(clamp(action / 0.65));
  const round = clamp((action - 0.65) / 0.35);
  const stored = history[round === 1 ? step : step - 1].copy;
  // The pointer traces the subtraction. A bit pattern only changes on the write.
  die(ctx, stored, true, step === 3 && round === 1 ? 1 - clock.reveal('Look up', 0.7) : 0);
  mixed(ctx, clock, {step, move, round});
}

export default { title, beats, draw, check };

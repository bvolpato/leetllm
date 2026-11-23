import assert from 'node:assert/strict';
import { epsilon, x as token } from '../../../films/layer-normalization/fixtures.mjs';

const beats = [
  {
    id: 'lift',
    say: 'Follow the third mark. The orange copy just crossed zero. The blue one is still at minus one. We added five to every feature of the same token. Can LayerNorm tell these copies apart?',
    hold: 1.6,
  },
  {
    id: 'means',
    say: 'Each copy gets its own mean. Add the four blue features and divide by four. Their mean is two. Do the same for orange and you get seven.',
    hold: 0.8,
  },
  {
    id: 'distance',
    say: 'From the blue mean, how far down is the third feature? Three units. Now try orange. Three units again. The mean rose just as far as the mark.',
    hold: 0.9,
  },
  {
    id: 'register',
    say: 'LayerNorm subtracts the mean of each copy from all four of its features. Slide each mean down to zero. See how the orange marks fit inside the blue ones? Every distance from the mean survived the lift.',
    hold: 1.1,
  },
  {
    id: 'squares',
    say: 'These distances also give us the scale. Use each distance as the side of a square. Count the little squares inside. Twenty in all, shared across four features. The average squared distance is five.',
    hold: 0.9,
  },
  {
    id: 'scale',
    say: 'Add a tiny epsilon to the variance so the divisor stays positive even for a constant row. Take the square root. That gives us about two point two four. Divide every centered value by that number. Both copies shrink together.',
    hold: 1.0,
  },
  {
    id: 'impression',
    say: 'Keep the learned gain at one and the shift at zero. Read the third feature now. Minus one and plus four have landed at the same output, about minus one point three four.',
    hold: 2.5,
  },
];

const mean = (values) => values.reduce((sum, n) => sum + n, 0) / values.length;
function measure(values) {
  const middle = mean(values);
  const centered = values.map(value => value - middle);
  const squares = centered.map(value => value * value);
  const variance = mean(squares);
  const divisor = Math.sqrt(variance + epsilon);
  const output = centered.map(value => value / divisor);
  return { middle, centered, squares, variance, divisor, output };
}

const offset = 5;
const copy = token.map(value => value + offset);
const original = measure(token);
const shifted = measure(copy);
const blue = '#173c9c';
const blueEdge = '#112b76';
const orange = '#dc4521';
const burnt = '#a23119';
const ink = '#17223a';
const graphite = '#4e596c';
const paper = '#f9f8ee';
const left = 218;
const step = 315;
const right = left + step * token.length;
const column = i => left + (i + 0.5) * step;

const clamp = t => Math.max(0, Math.min(1, t));
function smooth(t) {
  t = clamp(t);
  return t * t * (3 - 2 * t);
}
const mix = (a, b, t) => a + (b - a) * t;
function during(clock, beat, phrase, span) {
  if (clock.index !== beat) return Number(clock.index > beat);
  return smooth(clock.reveal(phrase, span));
}
function showNumber(n, digits = 0) {
  const rounded = Number(n.toFixed(digits));
  return String(rounded).replace('-', '−');
}

function label(ctx, text, x, y, size, color = ink, align = 'left', font = 'Sans', weight = 500, halo = false) {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + font + '"';
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (halo) {
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = paper;
    ctx.strokeText(text, x, y);
  }
  ctx.fillText(text, x, y);
}
function line(ctx, x1, y1, x2, y2, color, width = 2, dash = []) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}
function dot(ctx, x, y, radius, fill) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function sheet(ctx) {
  const light = ctx.createLinearGradient(150, 50, 1700, 1080);
  light.addColorStop(0, '#e1e6ef');
  light.addColorStop(0.54, '#f9f8ed');
  light.addColorStop(1, '#dce2e8');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, 1920, 1080);

  // The two long edges and the dot screen belong to the registration sheet.
  ctx.save();
  ctx.shadowColor = 'rgba(36,40,65,0.15)';
  ctx.shadowBlur = 25;
  ctx.shadowOffsetY = 12;
  ctx.beginPath();
  ctx.moveTo(-15, 16);
  ctx.lineTo(1925, -8);
  ctx.lineTo(1940, 993);
  ctx.lineTo(-10, 1033);
  ctx.closePath();
  ctx.fillStyle = light;
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(48,58,75,0.10)';
  for (let y = 175; y <= 868; y += 26) {
    for (let x = 149; x <= 1780; x += 26) ctx.fillRect(x, y, 2, 2);
  }
}

function registrationKey(ctx, x, y, color, name, ring) {
  line(ctx, x, y, x + 60, y, color, ring ? 14 : 8);
  dot(ctx, x + 30, y, ring ? 16 : 10, color);
  if (ring) dot(ctx, x + 30, y, 8, paper);
  label(ctx, name, x + 78, y, 35, color);
}

function profilePath(ctx, values, height) {
  ctx.beginPath();
  ctx.moveTo(left, height(values[0]));
  for (const [i, value] of values.entries()) {
    const edge = left + step * (i + 1);
    ctx.lineTo(edge, height(value));
    if (i + 1 < values.length) ctx.lineTo(edge, height(values[i + 1]));
  }
}

// The continuous strip has one flat shelf per coordinate. Only the four
// registration marks are samples. The vertical folds join adjacent shelves.
function impression(ctx, values, height, foreground) {
  const color = foreground ? orange : blue;
  const width = foreground ? 19 : 42;
  ctx.save();
  ctx.lineJoin = 'bevel';
  ctx.lineCap = 'butt';
  profilePath(ctx, values, height);
  ctx.shadowBlur = foreground ? 7 : 12;
  ctx.shadowOffsetY = foreground ? 4 : 8;
  ctx.shadowColor = foreground ? 'rgba(59,19,11,0.18)' : 'rgba(18,32,72,0.24)';
  ctx.strokeStyle = foreground ? burnt : blueEdge;
  ctx.lineWidth = width + 3;
  ctx.stroke();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  for (const [i, value] of values.entries()) {
    const y = height(value);
    line(ctx, left + step * i + 17, y - width / 2 + 3,
      left + step * (i + 1) - 17, y - width / 2 + 3,
      foreground ? '#f68651' : '#5877c1', 2);
    const r = i === 2 ? 1.32 : 1;
    dot(ctx, column(i), y, (foreground ? 13 : 28) * r, color);
    if (!foreground) dot(ctx, column(i), y, 17 * r, paper);
  }
  ctx.restore();
}

function meanLine(ctx, value, height, amount, color, text) {
  if (amount <= 0) return;
  const y = height(value);
  ctx.save();
  ctx.globalAlpha *= amount;
  line(ctx, 183, y, 1540, y, color, 3, [11, 8]);
  label(ctx, text, 1556, y, 37, color);
  ctx.restore();
}

function distanceMark(ctx, mark, middle, height, t, color) {
  if (t <= 0) return;
  const x = column(2) + 94;
  const a = height(middle);
  const b = mix(a, height(mark), t);
  line(ctx, x, a, x, b, color, 4);
  line(ctx, x - 10, a, x + 10, a, color, 4);
  line(ctx, x - 10, b, x + 10, b, color, 4);
  if (t > 0.8)
    label(ctx, '3', x + 17, (a + b) / 2, 42, color, 'left', 'Mono');
}

function squareAreas(ctx, height, unit, progress) {
  if (progress === 0) return;
  ctx.save();
  for (const [i, value] of original.centered.entries()) {
    const t = smooth(progress * 1.6 - i * 0.2);
    const count = Math.abs(value);
    const side = unit * count;
    const x = column(i) - side / 2;
    const y = Math.min(height(0), height(value));
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, side * t, side);
    ctx.clip();
    ctx.fillStyle = '#f7c99e';
    ctx.fillRect(x, y, side, side);
    for (let k = 0; k <= count; k++) {
      line(ctx, x + unit * k, y, x + unit * k, y + side, '#78432f', 3);
      line(ctx, x, y + unit * k, x + side, y + unit * k, '#78432f', 3);
    }
    ctx.restore();
  }
  ctx.restore();
}

function draw(ctx, clock) {
  const lift = clock.index === 0 ? smooth(clock.elapsed / 2.4) : 1;
  const blueMean = during(clock, 1, 'Add the four blue features', 1.1);
  const orangeMean = during(clock, 1, 'Do the same for orange', 1.1);
  const blueGap = during(clock, 2, 'how far down', 0.8);
  const orangeGap = during(clock, 2, 'Now try orange', 0.8);
  const center = during(clock, 3, 'Slide each mean', 2.2);
  const squares = during(clock, 4, 'Use each distance', 2.1);
  const avg = during(clock, 4, 'Twenty in all', 0.5);
  const scale = during(clock, 5, 'Divide every centered value', 1.9);
  const finish = during(clock, 6, 'Read the third feature', 0.75);
  const zeroY = mix(692, 545, center);
  const unit = mix(46, 69, center);
  const height = v => zeroY - unit * v;
  const zoom = 1 + finish * 1.15;
  const panX = mix(column(2), 960, finish) - column(2) * zoom;
  const screenZero = mix(zeroY, 428, finish);
  const panY = screenZero - zeroY * zoom;
  const drawDivisor = mix(1, original.divisor, scale);
  const first = token.map(v => (v - center * original.middle) / drawDivisor);
  const second = token.map(v => (v + offset * lift - center * shifted.middle) / drawDivisor);
  const merged = center === 1 || lift === 0;
  sheet(ctx);
  const heading = ['Two copies of one token', 'The mean of each copy', 'Where is feature three?',
    'Center each copy', 'Four squared distances', 'Scale both copies', 'LayerNorm output'][clock.index];
  label(ctx, heading, 119, 91, 66, ink, 'left', 'Serif', 500);
  registrationKey(ctx, 1165, 93, blue, 'Original', true);
  registrationKey(ctx, 1480, 93, burnt, lift < 1 ? 'Copy' : 'Copy +5', false);
  line(ctx, 119, 149, 1800, 149, '#98a1ac', 2);

  // A fixed zero is the reference for the initial crossing. The camera recenters
  // as the two copies settle, keeping their whole extent on the sheet.
  line(ctx, 183, screenZero, mix(1538, 1810, finish), screenZero, '#687585', 3);
  label(ctx, '0', 149, screenZero, 41, graphite, 'right', 'Mono');
  ctx.save();
  ctx.beginPath();
  ctx.rect(110, 154, 1710, 707);
  ctx.clip();
  ctx.translate(panX, panY);
  ctx.scale(zoom, zoom);
  for (let n = -6; n <= 12; n++) {
    const y = height(n);
    if (y > 188 && y < 854) line(ctx, 167, y, n === 0 ? 191 : 179, y, '#8e98a8', 2);
  }

  const squareOpacity = clock.index >= 5 ? 1 - smooth(clock.elapsed / 0.65) : 1;
  if (clock.index === 4 || clock.index === 5) {
    ctx.save();
    ctx.globalAlpha = squareOpacity;
    squareAreas(ctx, height, unit, squares);
    ctx.restore();
  }
  const guide = 1 - center;
  meanLine(ctx, mean(first), height, blueMean * guide, blue, 'mean ' + showNumber(mean(first), 1));
  meanLine(ctx, mean(second), height, orangeMean * guide, burnt, 'mean ' + showNumber(mean(second), 1));
  if (clock.index === 2 || clock.index === 3) {
    ctx.save();
    ctx.globalAlpha = guide;
    distanceMark(ctx, first[2], mean(first), height, blueGap, blue);
    distanceMark(ctx, second[2], mean(second), height, orangeGap, burnt);
    ctx.restore();
  }

  impression(ctx, first, height, false);
  impression(ctx, second, height, true);
  for (let i = 0; i < token.length; i++) {
    const x = column(i);
    const focus = i === 2;
    const numericSize = focus ? 53 : 40;
    // Keep the measurement edges free while the four square areas are visible.
    if (clock.index === 4 && squares > 0.15) continue;
    ctx.save();
    if (clock.index === 6 && !focus) ctx.globalAlpha = 1 - finish;
    if (merged) {
      const precision = clock.index >= 5 ? 3 : 0;
      const side = clock.index === 0 || first[i] < 0 ? 1 : -1;
      const size = focus ? numericSize + 17 * finish : numericSize;
      label(ctx, showNumber(first[i], precision), x, height(first[i]) + side * (57 + 13 * finish * Number(focus)),
        size, blueEdge, 'center', 'Mono', focus ? 700 : 500);
    } else {
      label(ctx, showNumber(first[i], 1), x, height(first[i]) + 54, numericSize, blue, 'center', 'Mono', 500, true);
      if (Math.abs(second[i] - first[i]) * unit > 35)
        label(ctx, showNumber(second[i], 1), x, height(second[i]) - 45, numericSize, burnt, 'center', 'Mono', 500, true);
    }
    ctx.restore();
  }
  ctx.restore();

  if (clock.index === 4 && avg > 0) {
    ctx.save();
    ctx.globalAlpha = avg;
    label(ctx, 'Variance', 1545, 465, 35, graphite);
    label(ctx, '20 / 4', 1545, 525, 42, ink, 'left', 'Mono');
    label(ctx, '= ' + original.variance, 1545, 606, 69, ink, 'left', 'Serif');
    ctx.restore();
  }
  if (clock.index === 5) {
    label(ctx, 'Divisor', 1546, 453, 36, graphite);
    label(ctx, '√(5 + ε)', 1542, 518, 47, ink, 'left', 'Serif');
    label(ctx, 'ε = ' + epsilon, 1542, 652, 30, graphite, 'left', 'Mono');
    const divisorReveal = during(clock, 5, 'That gives us', 0.6);
    ctx.save();
    ctx.globalAlpha = divisorReveal;
    label(ctx, '≈ ' + original.divisor.toFixed(3), 1542, 589, 44, ink, 'left', 'Mono');
    ctx.restore();
  }
  if (clock.index === 6) {
    ctx.save();
    ctx.globalAlpha = 1 - finish;
    label(ctx, 'Gain  1', 1550, 475, 36, graphite, 'left', 'Mono');
    label(ctx, 'Shift 0', 1550, 533, 36, graphite, 'left', 'Mono');
    ctx.restore();
  }

  for (let i = 0; i < token.length; i++) {
    const color = i === 2 ? ink : graphite;
    const x = column(i) * zoom + panX;
    ctx.save();
    ctx.globalAlpha = i === 2 ? 1 : 1 - finish;
    line(ctx, x, 866, x, 879, color, i === 2 ? 4 : 2);
    label(ctx, 'Feature ' + (i + 1), x, 911, i === 2 ? 41 : 34, color, 'center', 'Sans', i === 2 ? 700 : 500);
    ctx.restore();
  }
}

function check() {
  assert.deepEqual(token, [3, 1, -1, 5]);
  assert.deepEqual(copy, [8, 6, 4, 10]);
  assert.equal(original.middle, 2);
  assert.equal(shifted.middle, 7);
  assert.deepEqual(original.centered, [1, -1, -3, 3]);
  assert.deepEqual(shifted.centered, original.centered);
  assert.deepEqual(original.squares, [1, 1, 9, 9]);
  assert.equal(original.variance, 5);
  assert.equal(original.divisor.toFixed(3), '2.236');
  assert.deepEqual(original.output, shifted.output);
  assert.equal(shifted.output[2].toFixed(3), '-1.342');
  assert.deepEqual(measure([4, 4, 4, 4]).output, [0, 0, 0, 0]);
}

export default { title: 'LayerNorm in register', beats, draw, check };

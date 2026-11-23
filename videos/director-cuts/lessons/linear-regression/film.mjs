import assert from 'node:assert/strict';
import { data } from '../../../films/linear-regression/fixtures.mjs';

// The original fixture measures x in hundreds of tokens and y in milliseconds.
const sum = (values) => values.reduce((total, value) => total + value, 0);
const mean = (values) => sum(values) / values.length;
const meanX = mean(data.map(({ x }) => x));
const meanY = mean(data.map(({ y }) => y));
const slope = sum(data.map(({ x, y }) => (x - meanX) * (y - meanY))) /
  sum(data.map(({ x }) => (x - meanX) ** 2));
const fit = { middle: meanY, slope };
const first = data[0];
const last = data.at(-1);
const chordSlope = (last.y - first.y) / (last.x - first.x);
const chord = { middle: first.y + (meanX - first.x) * chordSlope, slope: chordSlope };
const tipped = { middle: fit.middle, slope: fit.slope - 1 };
const predict = (line, x) => line.middle + line.slope * (x - meanX);
const errors = (line) => data.map(({ x, y }) => y - predict(line, x));
const area = (line) => sum(errors(line).map((r) => r * r));

const beats = [
  {
    id: 'exposure',
    say: 'Watch the last strip. There’s the fifth reply. A hundred and ninety-eight milliseconds. Each flash records the time for one request. From left to right, each request had a hundred more tokens.',
    hold: 0.8,
  },
  {
    id: 'through-the-ends',
    say: 'Stretch a straight line between the two outside flashes. It predicts both of those times exactly. Look at the middle strip. The line got there early.',
    hold: 1.1,
  },
  {
    id: 'register',
    say: 'The line predicted a hundred and fifty-eight milliseconds. The reply took a hundred and sixty-two. Bring those gaps under the magnifier. We’ll slide the strips until the blue marks line up.',
    hold: 0.9,
  },
  {
    id: 'develop',
    say: 'Take that four-millisecond gap as the side of a square. Four rows of four. The gaps either side of it each give us nine more cells. Thirty-four in all.',
    hold: 1.1,
  },
  {
    id: 'lift',
    say: 'Give every prediction two more milliseconds. Watch the middle square. It shrinks, and two little squares open at the ends. We’ve lost both exact hits. What happened to the total?',
    hold: 1.6,
  },
  {
    id: 'tip',
    say: 'Down to fourteen. Could we do better by tipping the line? Bring the right end back onto its flash. Look across at the left. That one square now costs sixteen cells.',
    hold: 1.2,
  },
  {
    id: 'seat',
    say: 'Let it settle back. Four, one, four, one, four. This is the least-squares line. Of all the straight lines we could draw, this one leaves the smallest total area on these five strips.',
    hold: 1.3,
  },
  {
    id: 'read',
    say: 'Back on the time scale, the line adds twenty milliseconds for every hundred tokens. At three hundred tokens, it predicts a hundred and sixty. See the flash just above it? Two milliseconds late, even on the best-fitting line.',
    hold: 2.7,
  },
];

const clamp = (x) => Math.max(0, Math.min(1, x));
const mix = (a, b, p) => a + (b - a) * p;
function smooth(x) {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
}
function state(clock) {
  const { index, elapsed, reveal } = clock;
  const cue = (words, seconds) => smooth(reveal(words, seconds));
  const zoom = index < 2 ? 0 : index === 2 ? cue('Bring those gaps', 2.7)
    : index === 7 ? 1 - smooth(elapsed / 2.3) : 1;
  const lift = index < 4 ? 0 : index === 4 ? smooth(elapsed / 2.2) : 1;
  const tip = index === 5 ? cue('Bring the right end', 1.6)
    : index === 6 ? 1 - smooth(elapsed / 1.4) : 0;
  const line = { middle: mix(chord.middle, fit.middle, lift), slope: mix(chord.slope, tipped.slope, tip) };
  const middleSquare = index === 3 ? cue('Take that four', 1.6) : Number(index > 3);
  const sideSquares = index === 3 ? cue('The gaps either side', 1.3) : Number(index > 3);
  return {
    line, zoom, lift, tip,
    wire: index === 0 ? 0 : index === 1 ? smooth(elapsed / 1.8) : 1,
    squareWidths: data.map(({ x }) => (x === meanX ? middleSquare : sideSquares) * zoom),
    totalVisible: index > 3 || (index === 3 && reveal('Thirty-four') > 0),
    reading: index === 1 ? cue('Look at the middle strip', 0.5)
      : index === 2 ? 1 - zoom : index === 7 ? cue('At three hundred tokens', 0.5) : 0,
    exposure: index === 0 ? clamp(elapsed / 1.5) : 1,
  };
}

const top = 253;
const bottom = 831;
const centers = data.map(({ x }) => 304 + (x - 1) * 328);
const halfWidth = 146;
const observedColor = '#fff0c8';
const predictionColor = '#7cdef0';
const cellColor = '#f0ad65';

function gradient(ctx, x1, y1, x2, y2, stops) {
  const paint = ctx.createLinearGradient(x1, y1, x2, y2);
  for (const [position, color] of stops) paint.addColorStop(position, color);
  return paint;
}
function box(ctx, x, y, w, h, color, radius = 0) {
  ctx.fillStyle = color;
  if (!radius) { ctx.fillRect(x, y, w, h); return; }
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
}
function stroke(ctx, x1, y1, x2, y2, paint, width) {
  ctx.strokeStyle = paint;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
function text(ctx, value, x, y, size, color, align = 'left', font = 'Lesson Sans', weight = 500) {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.font = weight + ' ' + size + 'px "' + font + '"';
  ctx.fillText(value, x, y);
}
function circle(ctx, x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}
function screw(ctx, x, y) {
  circle(ctx, x, y + 2, 10, '#190e15');
  circle(ctx, x, y, 8, '#936b61');
  circle(ctx, x, y - 1, 6, '#553b38');
  stroke(ctx, x - 4, y + 3, x + 4, y - 3, '#20151b', 2);
}

function housing(ctx) {
  box(ctx, 0, 0, 1920, 1080, gradient(ctx, 0, 0, 1920, 1080,
    [[0, '#231720'], [0.47, '#382127'], [1, '#120e17']]));
  box(ctx, 64, 103, 1792, 819, '#130e14', 30);
  box(ctx, 53, 86, 1814, 817, '#8c6257', 30);
  box(ctx, 55, 89, 1810, 810, gradient(ctx, 55, 90, 1650, 900,
    [[0, '#664246'], [0.28, '#50313a'], [0.73, '#422630'], [1, '#2b1c27']]), 28);
  for (const x of [83, 1837]) for (const y of [118, 867]) screw(ctx, x, y);
  text(ctx, 'Reply timer', 128, 157, 54, '#ffead7', 'left', 'Lesson Serif');
  stroke(ctx, 123, 180, 1797, 180, '#2a1923', 3);
  stroke(ctx, 123, 183, 1797, 183, '#785056', 1);
  box(ctx, 125, top - 6, 1670, bottom - top + 16, '#241923', 9);
  box(ctx, 132, top - 2, 1656, bottom - top + 6, '#100f19', 5);
  for (const [i, x] of centers.entries()) {
    text(ctx, data[i].x * 100 + ' tokens', x, 230, 39, '#f4e0d1', 'center');
  }
}

function timePosition(milliseconds, x, zoom) {
  const absolute = 751 - (milliseconds - 118) * 5.32;
  const enlarged = 650 - (milliseconds - predict(chord, x)) * 49;
  return mix(absolute, enlarged, zoom);
}

// Each strip retains its own absolute timing as it moves through the magnifier.
function negative(ctx, i, s) {
  const x = centers[i], left = x - halfWidth, w = halfWidth * 2;
  const row = data[i];
  ctx.save();
  ctx.beginPath();
  ctx.rect(left, top, w, bottom - top);
  ctx.clip();
  box(ctx, left, top, w, bottom - top, gradient(ctx, left, 0, left + w, 0,
    [[0, '#513742'], [0.07, '#49323e'], [0.09, '#1d1c2a'], [0.38, '#303046'],
      [0.78, '#282534'], [0.91, '#20202c'], [0.92, '#4e3540'], [1, '#523541']]));
  const step = timePosition(149, row.x, s.zoom) - timePosition(150, row.x, s.zoom);
  const phase = timePosition(118, row.x, s.zoom);
  // Perforations belong to the moving photographic stock; the gate stays fixed.
  const pitch = Math.min(103, 48 + 55 * s.zoom);
  for (let y = top + ((phase - top) % pitch) - pitch; y < bottom; y += pitch) {
    for (const edge of [left + 4, left + w - 19]) {
      box(ctx, edge, y, 15, 23, '#7c585b', 4);
      box(ctx, edge, y + 1, 15, 20, '#19131d', 4);
    }
  }
  const low = Math.floor(118 + (phase - bottom) / step);
  const high = Math.ceil(118 + (phase - top) / step);
  for (let t = low; t <= high; t++) {
    const y = timePosition(t, row.x, s.zoom);
    const major = t % 10 === 0;
    const tick = major ? 27 : t % 5 === 0 ? 19 : 8;
    stroke(ctx, left + 27, y, left + 27 + tick, y, major ? '#897e8b' : '#655d72', major ? 2 : 1);
  }
  for (let j = 0; j < 19; j++) {
    const sx = left + 28 + ((j * 73 + i * 53) % 234);
    const sy = top + ((j * 61 + i * 141 + phase * 0.6) % 638 + 638) % 638 - 36;
    stroke(ctx, sx, sy, sx + 0.6, sy + 3 + j % 14, 'rgba(232,207,208,0.12)', 1);
  }

  const y = timePosition(row.y, row.x, s.zoom);
  const predY = timePosition(predict(s.line, row.x), row.x, s.zoom);
  const gap = Math.abs(y - predY);
  const width = gap * s.squareWidths[i];
  if (width > 0.01) {
    const l = x - width / 2, y0 = Math.min(y, predY);
    box(ctx, l, y0, width, gap, gradient(ctx, l, y0, l + width, y0 + gap,
      [[0, '#dc9557'], [0.5, '#f7c27b'], [1, '#df9c63']]));
    ctx.save();
    ctx.beginPath();
    ctx.rect(l, y0, width, gap);
    ctx.clip();
    for (let d = step; d < gap - 0.01; d += step) {
      stroke(ctx, l, y0 + d, l + width, y0 + d, '#664744', 3);
      stroke(ctx, l + d * s.squareWidths[i], y0, l + d * s.squareWidths[i], y0 + gap, '#664744', 3);
    }
    ctx.restore();
  }

  // An exposure burns in at a fixed height, leaving a sharp center and a halo.
  const lastStrip = i === data.length - 1;
  const burn = lastStrip ? smooth((s.exposure - 0.84) / 0.16) : 1;
  if (lastStrip && s.exposure < 1) {
    const scanY = mix(bottom, y, smooth(s.exposure));
    box(ctx, left + 26, scanY - 18, w - 52, 36, gradient(ctx, 0, scanY - 18, 0, scanY + 18,
      [[0, '#bc815000'], [0.48, '#ffdc8db8'], [0.5, '#fff6d6'], [1, '#a87b3600']]));
  }
  ctx.globalAlpha = burn;
  const spread = 18 + (lastStrip ? 19 * Math.sin(s.exposure * Math.PI) : 0);
  box(ctx, left + 24, y - spread, w - 48, spread * 2,
    gradient(ctx, 0, y - spread, 0, y + spread,
      [[0, '#ffd28b00'], [0.34, '#ffc67816'], [0.5, '#ffe2ad94'], [0.73, '#f6bb790b'], [1, '#f6bb7900']]));
  stroke(ctx, left + 31, y, left + w - 31, y, observedColor, 5);
  const alpha = 1 - s.zoom;
  ctx.globalAlpha = burn * alpha;
  text(ctx, row.y + ' ms', x, y - 24, 39, observedColor, 'center', 'Lesson Sans', 600);
  ctx.restore();
}

function predictionWire(ctx, s) {
  if (s.wire === 0) return;
  const yAt = (x) => timePosition(predict(s.line, x), x, s.zoom);
  const x0 = centers[0], xe = mix(x0, centers.at(-1), s.wire);
  const y0 = yAt(first.x), ye = mix(y0, yAt(last.x), s.wire);
  stroke(ctx, x0, y0 + 3, xe, ye + 3, '#101b2a', 8);
  stroke(ctx, x0, y0, xe, ye, predictionColor, 4.5);
  for (const [i, x] of centers.entries()) {
    if (x > xe + 0.01) continue;
    const y = yAt(data[i].x);
    circle(ctx, x, y, 9.5, '#142331');
    circle(ctx, x, y, 6, predictionColor);
  }
  if (s.reading > 0) {
    ctx.save();
    ctx.globalAlpha = s.reading;
    text(ctx, predict(s.line, meanX).toFixed(0) + ' ms', centers[2], yAt(meanX) + 46, 39,
      predictionColor, 'center', 'Lesson Mono', 600);
    ctx.restore();
  }
}

function readouts(ctx, clock, s) {
  const y = 877;
  stroke(ctx, 165, y - 10, 218, y - 10, observedColor, 5);
  text(ctx, 'Measured reply', 234, y, 35, '#f1dee0');
  if (s.wire > 0) {
    ctx.save();
    ctx.globalAlpha = s.wire;
    stroke(ctx, 550, y - 10, 607, y - 10, predictionColor, 4.5);
    circle(ctx, 578, y - 10, 5.5, predictionColor);
    text(ctx, 'Line prediction', 624, y, 35, '#f1dee0');
    ctx.restore();
  }
  if (s.squareWidths[2] > 0) {
    ctx.save();
    ctx.globalAlpha = s.squareWidths[2];
    box(ctx, 1442, y - 28, 25, 25, cellColor);
    text(ctx, '1 cell = 1 ms²', 1483, y, 34, '#f1dee0', 'left', 'Lesson Mono');
    ctx.restore();
  }
  if (!s.totalVisible) return;
  const a = area(s.line);
  text(ctx, 'Total squared error', 1271, 151, 37, '#f0dad4', 'right');
  box(ctx, 1296, 102, 472, 66, '#261c26', 6);
  const live = Math.abs(a - Math.round(a)) > 0.04;
  const value = (live ? a.toFixed(1) : Math.round(a)) + ' ms²';
  if (clock.index >= 4) {
    const previous = clock.index === 5 ? fit : clock.index === 6 ? tipped : chord;
    text(ctx, area(previous) + ' →', 1325, 151, 38, '#c19e91', 'left', 'Lesson Mono');
  }
  text(ctx, value, 1744, 152, 46, '#ffca88', 'right', 'Lesson Mono', 600);
}

function draw(ctx, clock) {
  const s = state(clock);
  ctx.save();
  // Start at the exposure gate. Pull back to show the five request lengths.
  // Return to the middle strip only after the fit is locked.
  const opening = clock.index === 0 ? 1 - smooth(clock.reveal('Each flash records', 2.6)) : 0;
  const reading = clock.index === 7 ? smooth(clock.reveal('At three hundred tokens', 1.8)) : 0;
  const scale = 1 + 0.86 * opening + 0.74 * reading;
  ctx.translate(960, 540);
  ctx.scale(scale, scale);
  ctx.translate(-960 - 381 * opening, -540 + 65 * opening + 31 * reading);
  housing(ctx);
  for (let i = 0; i < data.length; i++) negative(ctx, i, s);
  predictionWire(ctx, s);
  readouts(ctx, clock, s);
  ctx.restore();
}

function check() {
  assert.deepEqual([chord.middle, chord.slope], [158, 20]);
  assert.deepEqual(errors(chord), [0, 3, 4, 3, 0]);
  assert.equal(area(chord), 34);
  assert.deepEqual([fit.middle, fit.slope], [160, 20]);
  assert.deepEqual(errors(fit), [-2, 1, 2, 1, -2]);
  assert.equal(area(fit), 14);
  assert.deepEqual(errors(tipped), [-4, 0, 2, 2, 0]);
  assert.equal(area(tipped), 24);
  // The residual is orthogonal to both design columns, so neither a shift
  // nor a tilt can lower this sum of squared errors.
  assert.equal(sum(errors(fit)), 0);
  assert.equal(sum(errors(fit).map((e, i) => e * data[i].x)), 0);
  for (const { x, y } of data) {
    assert.equal(timePosition(predict(chord, x), x, 1), 650);
    assert.equal((timePosition(predict(fit, x), x, 1) - timePosition(y, x, 1)) / 49, y - predict(fit, x));
  }
  return true;
}

export default { title: 'The line that misses all five', beats, draw, check };

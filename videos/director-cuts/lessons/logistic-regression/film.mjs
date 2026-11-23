import assert from 'node:assert/strict';

const title = 'Two climbs on the sigmoid';

const beats = [
  {
    id: 'pull',
    say: 'Watch the two pins. They went the same distance to the right. Did you catch how little the blue one climbed?',
    hold: 1.0,
  },
  {
    id: 'wind-back',
    say: "Let's take them back. Each pin stands for an access request. Logistic regression gives each clue a weight and adds the weighted clues to a starting value. That sum is the logit.",
    hold: 0.55,
  },
  {
    id: 'read-the-groove',
    say: 'Read the logit along the bottom. Find zero and go straight up to the groove. Halfway up means the model gives that request a fifty percent chance of needing review. This S-shaped groove follows the sigmoid.',
    hold: 0.8,
  },
  {
    id: 'set-the-pins',
    say: 'Red starts at minus one, on the steep part. Its chance of needing review is about twenty-seven percent. Blue starts at four, already above ninety-eight percent.',
    hold: 0.9,
  },
  {
    id: 'one-stroke',
    say: 'Suppose a new clue adds two to each logit. Look at the height each pin gains as the handle moves.',
    hold: 1.2,
  },
  {
    id: 'read-the-rise',
    say: 'Red has crossed the middle of the groove. Its estimate rose from about twenty-seven to seventy-three percent. That long red mark measures a gain of forty-six percentage points.',
    hold: 0.65,
  },
  {
    id: 'the-last-millimetres',
    say: "Look at the blue pin's two heights through the lens. Only one point six percentage points apart. The same clue gave both requests a lift, but up here the groove has almost no room left to climb.",
    hold: 2.8,
  },
];

const sigmoid = (z) => 1 / (1 + Math.exp(-z));
const pins = [
  { start: -1, paint: '#ac3d26', light: '#f8a06d', shade: '#672d21' },
  { start: 4, paint: '#175976', light: '#83c7da', shade: '#123a51' },
];
const strokeLength = 2;
const xAt = (z) => 790 + 135 * z;
const yAt = (p) => 730 - 475 * p;
const formatPercent = (p) => (100 * p).toFixed(1) + '%';
const ease = (v) => v * v * (3 - 2 * v);
const clamp = (v) => Math.max(0, Math.min(1, v));

function position(pin, slide) {
  const logit = pin.start + slide;
  const p = sigmoid(logit);
  return { logit, p, x: xAt(logit), y: yAt(p), gain: p - sigmoid(pin.start) };
}

function check() {
  assert.equal(sigmoid(0), 0.5);
  const start = pins.map(pin => position(pin, 0));
  const finish = pins.map(pin => position(pin, strokeLength));
  assert.deepEqual(start.map(v => formatPercent(v.p)), ['26.9%', '98.2%']);
  assert.deepEqual(finish.map(v => formatPercent(v.p)), ['73.1%', '99.8%']);
  assert.deepEqual(finish.map(v => (v.gain * 100).toFixed(1)), ['46.2', '1.6']);
  assert.deepEqual(finish.map(v => v.logit), [1, 6]);
  for (let i = 0; i <= 40; i++) {
    const slide = strokeLength * i / 40;
    const [a, b] = pins.map(pin => position(pin, slide));
    assert(Math.abs((b.x - a.x) - (start[1].x - start[0].x)) < 1e-8);
    assert(Math.abs((a.y - start[0].y) + 475 * a.gain) < 1e-8);
    assert(a.gain >= b.gain);
  }
  return true;
}

function gradient(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}

function round(ctx, x, y, w, h, r, paint) {
  ctx.fillStyle = paint;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function circle(ctx, x, y, r, paint) {
  ctx.fillStyle = paint;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fill();
}

function line(ctx, x1, y1, x2, y2, paint, width = 2) {
  ctx.strokeStyle = paint;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function write(ctx, value, x, y, size, color, family = 'Sans', align = 'left', weight = 400) {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.fillText(value, x, y);
}

function bolt(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  circle(ctx, 0, 2, 13, '#828678');
  circle(ctx, 0, 0, 12, gradient(ctx, -12, -10, 8, 11, [
    [0, '#ede1bd'], [0.48, '#b1b09d'], [0.53, '#979d8d'], [1, '#babdad'],
  ]));
  ctx.rotate(angle);
  round(ctx, -8, -1, 16, 4, 1.5, '#e2ddc3');
  round(ctx, -8, -2, 16, 3, 1.5, '#5c675e');
  ctx.restore();
}

function cabinet(ctx) {
  ctx.fillStyle = gradient(ctx, 0, 0, 1750, 1080, [[0, '#1e3232'], [1, '#091719']]);
  ctx.fillRect(0, 0, 1920, 1080);
  round(ctx, 50, 78, 1836, 927, 45, '#0b191a');
  round(ctx, 36, 48, 1848, 941, 44, gradient(ctx, 0, 48, 0, 989, [
    [0, '#a6b6a9'], [0.008, '#58736b'], [0.035, '#36564e'],
    [0.91, '#334e48'], [0.966, '#456258'], [0.976, '#1a3432'], [1, '#172f2e'],
  ]));
  round(ctx, 67, 78, 1786, 857, 26, '#172c2b');
  round(ctx, 72, 84, 1776, 841, 21, gradient(ctx, 130, 80, 1360, 1160, [
    [0, '#f9f1d7'], [0.4, '#ebe5cd'], [0.76, '#dfddc7'], [1, '#c5cebb'],
  ]));
  for (const [x, y, a] of [[103, 114, -0.45], [1816, 114, 0.5], [103, 894, 0.35], [1816, 894, -0.7]]) {
    bolt(ctx, x, y, a);
  }
  write(ctx, 'Chance of needing review', 157, 173, 62, '#253c37', 'Serif');
}

// The cut channel, the ends of both gauges and the score scale share a coordinate system.
function groove(ctx, left, right, color, width, dy = 0) {
  ctx.beginPath();
  const count = Math.max(2, Math.ceil((right - left) * 18));
  for (let i = 0; i <= count; i++) {
    const z = left + (right - left) * i / count;
    const x = xAt(z), y = yAt(sigmoid(z)) + dy;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function face(ctx, reference, nameOpacity) {
  for (const p of [0, 0.5, 1]) {
    const y = yAt(p);
    write(ctx, (100 * p) + '%', 212, y + 11, 32, '#465950', 'Mono', 'right');
    line(ctx, 226, y, 1782, y, '#adb6a5', 1.6);
    line(ctx, 224, y, 239, y, '#697768', 3);
  }
  groove(ctx, -4.05, 7.32, '#fff8de', 24, 2);
  groove(ctx, -4.05, 7.32, '#979c89', 22, -1);
  groove(ctx, -4.05, 7.32, '#697a6b', 16);
  groove(ctx, -4.05, 7.32, '#334e47', 10, -1);
  groove(ctx, -4.05, 7.32, '#193c37', 4, -2.5);

  const left = xAt(-4.1), right = xAt(7.36);
  round(ctx, left - 3, 784, right - left + 6, 18, 8, '#feefd1');
  round(ctx, left, 780, right - left, 18, 8, '#314943');
  round(ctx, left + 2, 783, right - left - 4, 6, 3, '#182f2a');
  for (let half = -8; half <= 14; half++) {
    const x = xAt(half / 2);
    const full = half % 2 === 0;
    line(ctx, x, 808, x, full ? 830 : 820, full ? '#657064' : '#939a87', full ? 3 : 2);
    if (full) write(ctx, String(half / 2).replace('-', '−'), x, 869, 38, '#3b5148', 'Mono', 'center');
  }
  write(ctx, 'Logit', 169, 859, 33, '#3b5148', 'Serif', 'right');
  if (nameOpacity > 0) {
    ctx.save();
    ctx.globalAlpha = nameOpacity;
    const x = xAt(1.82), y = yAt(sigmoid(1.82));
    line(ctx, x, y + 15, x + 34, y + 58, '#778272');
    write(ctx, 'Sigmoid', x + 42, y + 79, 40, '#435b50', 'Serif');
    ctx.restore();
  }
  if (reference > 0) {
    const x = xAt(0), y = yAt(0.5);
    ctx.save();
    ctx.globalAlpha = reference;
    ctx.setLineDash([7, 9]);
    line(ctx, x, 778, x, y, '#42725f', 4);
    line(ctx, 225, y, x, y, '#42725f', 4);
    ctx.setLineDash([]);
    circle(ctx, x, y, 11, '#dfd4ad');
    circle(ctx, x, y, 6, '#315348');
    ctx.restore();
  }
}

function trail(ctx, pin, slide) {
  if (slide < 0.005) return;
  const s = position(pin, 0);
  groove(ctx, pin.start, pin.start + slide, pin.light, 10);
  groove(ctx, pin.start, pin.start + slide, pin.paint, 6);
  circle(ctx, s.x, s.y, 9, pin.shade);
  circle(ctx, s.x, s.y, 5, '#f9e6be');
}

function follower(ctx, pin, at) {
  round(ctx, at.x - 4, at.y + 16, 21, 778 - at.y, 5, 'rgba(50,55,39,0.17)');
  round(ctx, at.x - 9, at.y + 7, 18, 780 - at.y, 4,
    gradient(ctx, at.x - 9, 0, at.x + 9, 0, [
      [0, '#6a674e'], [0.16, '#c3baa0'], [0.41, '#e4dfc1'], [0.57, '#b9b49a'], [1, '#6e7560'],
    ]));
  circle(ctx, at.x + 4, at.y + 6, 21, 'rgba(40,46,31,0.26)');
  circle(ctx, at.x, at.y, 22, '#49574a');
  circle(ctx, at.x, at.y - 1, 20, '#eee0b7');
  circle(ctx, at.x, at.y, 16, gradient(ctx, at.x - 9, at.y - 13, at.x + 14, at.y + 16,
    [[0, pin.light], [0.39, pin.paint], [1, pin.shade]]));
  circle(ctx, at.x, at.y, 4.2, '#f6e7c9');
}

function handle(ctx, xs) {
  const left = xs[0] - 38, right = xs[1] + 38;
  const middle = (left + right) / 2;
  round(ctx, left + 4, 778, right - left, 28, 9, 'rgba(33,45,33,0.3)');
  round(ctx, left, 769, right - left, 30, 9, gradient(ctx, 0, 769, 0, 799, [
    [0, '#816843'], [0.08, '#e0bf82'], [0.2, '#cdb580'], [0.63, '#9a885c'], [1, '#5a6048'],
  ]));
  for (const x of xs) {
    circle(ctx, x, 784, 7, '#68705b');
    circle(ctx, x - 1, 782, 4.5, '#dacda5');
  }
  round(ctx, middle - 57, 746, 122, 43, 12, 'rgba(61,63,40,.2)');
  round(ctx, middle - 66, 741, 132, 44, 13, gradient(ctx, 0, 741, 0, 785, [
    [0, '#708176'], [0.22, '#3e5a50'], [0.75, '#263e39'], [1, '#1b2c2a'],
  ]));
  for (let x = middle - 51; x <= middle + 51; x += 8) {
    line(ctx, x, 748, x - 3.5, 776, '#75867a', 1.8);
  }
}

function scoreStroke(ctx, pin, at) {
  const start = xAt(pin.start), mid = (start + at.x) / 2, y = 895;
  const pad = 31;
  line(ctx, start, y, mid - pad, y, pin.paint, 3);
  line(ctx, mid + pad, y, at.x, y, pin.paint, 3);
  for (const x of [start, at.x]) line(ctx, x, y - 6, x, y + 6, pin.paint, 3);
  write(ctx, '+' + (at.logit - pin.start), mid, y + 11, 35, pin.shade, 'Mono', 'center');
}

function measure(ctx, at, pin, labelOpacity) {
  if (at.gain <= 0) return;
  ctx.save();
  const base = position(pin, 0);
  const x = at.x + 46;
  ctx.setLineDash([6, 7]);
  line(ctx, base.x + 14, base.y, x, base.y, pin.shade, 2.5);
  ctx.setLineDash([]);
  line(ctx, x - 8, at.y, x + 8, at.y, pin.paint, 4);
  line(ctx, x - 8, base.y, x + 8, base.y, pin.paint, 4);
  line(ctx, x, at.y, x, base.y, pin.paint, 3.5);
  const labelY = (base.y + at.y) / 2;
  ctx.globalAlpha = labelOpacity;
  write(ctx, '+' + (100 * at.gain).toFixed(1), x + 24, labelY, 56, pin.shade, 'Mono');
  write(ctx, 'percentage points', x + 24, labelY + 38, 33, pin.shade);
  ctx.restore();
}

function blueLens(ctx, at, amount) {
  if (amount <= 0) return;
  const pin = pins[1], start = position(pin, 0);
  const cx = 1440, cy = 483, radius = 132;
  const magnification = 10;
  const halfRise = (start.y - at.y) * magnification / 2;
  const upper = cy - halfRise, lower = cy + halfRise;
  ctx.save();
  ctx.globalAlpha = amount;
  // The two fine lines pick up the roller's initial and final heights.
  const pickUpX = at.x + 52;
  line(ctx, at.x + 24, at.y, pickUpX + 12, at.y, pin.shade, 2);
  line(ctx, start.x, start.y, pickUpX + 12, start.y, pin.paint, 2);
  line(ctx, cx + 76, cy - 82, pickUpX, start.y + 6, '#758a7e', 3);
  circle(ctx, cx + 7, cy + 10, radius + 3, 'rgba(48,58,45,.15)');
  circle(ctx, cx, cy, radius, gradient(ctx, cx - radius, cy - radius, cx + radius, cy + radius, [
    [0, '#eee7c8'], [0.28, '#87978a'], [0.53, '#4a6158'], [0.74, '#b8c4b2'], [1, '#5b6c61'],
  ]));
  circle(ctx, cx, cy, radius - 7, '#40594f');
  circle(ctx, cx, cy, radius - 10, gradient(ctx, cx - 82, cy - 120, cx + 82, cy + 120, [
    [0, '#faf4da'], [0.5, '#edf0d9'], [1, '#cfd9c5'],
  ]));
  const bx = cx - 68;
  line(ctx, bx, upper, bx, lower, pin.shade, 4);
  for (const [y, p] of [[upper, at.p], [lower, start.p]]) {
    line(ctx, bx - 13, y, bx + 14, y, pin.paint, 4);
    write(ctx, formatPercent(p), bx + 22, y + 11, 34, pin.shade, 'Mono');
  }
  write(ctx, '10×', cx, cy - 72, 28, '#546b61', 'Mono', 'center');
  write(ctx, '+' + (at.gain * 100).toFixed(1), cx, cy + radius + 55, 56, pin.shade, 'Mono', 'center');
  write(ctx, 'percentage points', cx, cy + radius + 92, 33, pin.shade, 'Sans', 'center');
  ctx.restore();
}

function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  let slide = 0;
  if (index === 0) slide = strokeLength * ease(clamp(elapsed / 1.85));
  if (index === 1) slide = strokeLength * (1 - ease(reveal("Let's take them back", 2)));
  if (index === 4) {
    const t = reveal('Look at the height', 3.2);
    slide = ease(clamp(t / 0.43)) + ease(clamp((t - 0.57) / 0.43));
  }
  if (index > 4) slide = strokeLength;
  const at = pins.map(pin => position(pin, slide));
  let reference = 0;
  if (index === 2) reference = ease(reveal('Find zero', 0.6));
  if (index === 3) reference = 1 - ease(clamp(elapsed / 0.55));
  let name = index === 2 ? reveal('This S-shaped groove', 0.55) : 0;
  if (index === 3) name = 1 - ease(clamp(elapsed / 1.2));

  ctx.save();
  cabinet(ctx);
  face(ctx, reference, name);
  for (const pin of pins) trail(ctx, pin, slide);
  pins.forEach((pin, i) => follower(ctx, pin, at[i]));
  handle(ctx, at.map(v => v.x));
  pins.forEach((pin, i) => {
    write(ctx, formatPercent(at[i].p), at[i].x - 21, at[i].y - 36, 48, pin.shade, 'Mono', 'right');
  });
  const redMeasure = index > 5 ? 1 : index === 5 ? reveal('That long red mark', 0.55) : 0;
  if (slide === strokeLength) pins.forEach((pin, i) => scoreStroke(ctx, pin, at[i]));
  const blueMeasure = index === 6 ? ease(reveal("Look at the blue pin's two heights", 1.05)) : 0;
  if (index >= 4) measure(ctx, at[0], pins[0], redMeasure);
  blueLens(ctx, at[1], blueMeasure);
  ctx.restore();
}

export default { title, beats, draw, check };

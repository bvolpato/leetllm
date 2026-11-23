import assert from 'node:assert/strict';

const beats = [
  {
    id: 'two-dials',
    say: 'Watch the green trace while those two knobs turn. If all you had was that recording, could you tell which knob went up?',
    hold: 1.3,
  },
  {
    id: 'inputs',
    say: 'Look just above it. A sends a one-volt pulse. B sends the same pulse at the same instant. Each knob scales its own input. The green trace shows the two contributions added together.',
    hold: 0.7,
  },
  {
    id: 'inside-the-crest',
    say: 'Bring both gains back to three quarters. Look inside the pulse now. Each color accounts for three quarters of a volt. Give B half a volt more by taking the same amount from A. Watch the top edge.',
    hold: 1.5,
  },
  {
    id: 'invisible-change',
    say: 'Still one and a half volts. Sample the two inputs here. Both read one. Slide into the gap. Both read zero. Write down one column of samples for each input and the columns match. The input matrix sends our change in gains to zero at every sample. That change lies in its nullspace.',
    hold: 0.9,
  },
  {
    id: 'separate-the-pulses',
    say: 'Leave those knobs where they are. Suppose we delay the pulse on B by one beat. Which part of the green trace will belong to A?',
    hold: 3.3,
  },
  {
    id: 'read-the-gains',
    say: 'That first little pulse is A alone. A quarter of a volt. Then comes B, at one and a quarter. With the inputs separated in time, you can read both gains straight off the recording.',
    hold: 2.6,
  },
];

const copper = '#ffbc84';
const blue = '#91cdef';
const green = '#a9ffb5';
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = t => Math.min(1, Math.max(0, t));
function ease(t) {
  t = clamp(t);
  return t * t * (3 - 2 * t);
}

// Time runs in beats. Both generators emit unit pulses every two beats.
const starts = [0.22, 2.22];
const pulseWidth = 0.67;
function inputsAt(t, delay) {
  const pulse = shift => Number(starts.some(s => t >= s + shift && t < s + shift + pulseWidth));
  return [pulse(0), pulse(delay)];
}
function volts([a, b], gains) {
  return a * gains[0] + b * gains[1];
}
function pulseEdges(delay) {
  const edges = [0, 4];
  for (const start of starts) {
    edges.push(start, start + pulseWidth, start + delay, start + delay + pulseWidth);
  }
  return [...new Set(edges)].sort((a, b) => a - b);
}
function state(clock) {
  const cue = (phrase, span) => ease(clock.reveal(phrase, span));
  let gainA = 0.25;
  let delay = 0;
  let inputs = 1;
  let tint = 0;
  let values = 0;
  let cursor = 0;
  let sampleTime = 1.35;
  if (clock.index === 0) {
    gainA = lerp(0.75, 1.25, ease(clock.elapsed / 2.0));
    inputs = 0.58;
  } else if (clock.index === 1) {
    gainA = 1.25;
    inputs = lerp(0.58, 1, cue('Look just above it', 1));
  } else if (clock.index === 2) {
    gainA = 1.25 - 0.5 * cue('Bring both gains back', 1.2) - 0.5 * cue('Give B', 2);
    tint = cue('Look inside the pulse', 0.7);
  } else if (clock.index === 3) {
    cursor = cue('Sample the two inputs', 0.5);
    sampleTime = lerp(0.55, 1.35, cue('Slide into the gap', 0.85));
    tint = 1 - cue('Sample the two inputs', 0.7);
  } else if (clock.index === 4) {
    cursor = 1 - cue('Leave those knobs', 0.7);
    delay = ease((clock.elapsed - clock.speechDuration) / 1.6);
  } else {
    delay = 1;
    values = cue('That first little pulse', 0.8);
  }
  return { gains: [gainA, 1.5 - gainA], inputs, tint, delay, values, cursor, sampleTime };
}

function gradient(ctx, x1, y1, x2, y2, stops) {
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  for (const [offset, color] of stops) g.addColorStop(offset, color);
  return g;
}
function plate(ctx, x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}
function disk(ctx, x, y, radius, fill) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = fill;
  ctx.fill();
}
function line(ctx, x1, y1, x2, y2, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
function label(ctx, s, x, y, size, color, align = 'left', family = 'Sans', weight = 500) {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}
function screw(ctx, x, y, angle) {
  disk(ctx, x, y + 2, 10, '#67665f');
  disk(ctx, x, y, 9, '#bdbbb0');
  const dx = 6 * Math.cos(angle), dy = 6 * Math.sin(angle);
  line(ctx, x - dx, y - dy, x + dx, y + dy, '#59594f', 3);
}

function cabinet(ctx) {
  const bench = gradient(ctx, 0, 0, 850, 1150, [[0, '#564136'], [0.6, '#322b28'], [1, '#201b19']]);
  ctx.fillStyle = bench;
  ctx.fillRect(0, 0, 1920, 1080);
  plate(ctx, 52, 95, 1830, 858, 52, '#211f1c');
  for (const x of [185, 1555]) plate(ctx, x, 875, 162, 82, 12, '#181a18');
  plate(ctx, 35, 56, 1848, 873, 48, '#585952');
  plate(ctx, 38, 51, 1841, 857, 45, '#c8c6b9');
  const enamel = gradient(ctx, 40, 52, 1500, 1040, [
    [0, '#dfdfcf'], [0.28, '#d5d5c7'], [0.68, '#c3c3b6'], [1, '#a5a89d'],
  ]);
  plate(ctx, 42, 57, 1833, 843, 41, enamel);
  for (const [x, y, a] of [[76, 95, -0.7], [1840, 95, 0.3], [76, 864, 0.5], [1840, 864, -0.6]]) {
    screw(ctx, x, y, a);
  }
  const bezel = gradient(ctx, 80, 124, 1100, 820, [[0, '#525952'], [0.35, '#282e29'], [1, '#454b43']]);
  plate(ctx, 85, 111, 1185, 736, 55, '#eef0dd');
  plate(ctx, 84, 104, 1186, 735, 54, bezel);
  plate(ctx, 98, 119, 1156, 702, 52, '#0f1917');
  const tube = ctx.createRadialGradient(556, 403, 50, 610, 435, 713);
  tube.addColorStop(0, '#19352f');
  tube.addColorStop(0.71, '#112a25');
  tube.addColorStop(1, '#0b1c1a');
  plate(ctx, 110, 132, 1131, 676, 45, tube);
}

const xStart = 308, xEnd = 1202;
const tx = t => xStart + (xEnd - xStart) * t / 4;
const zero = 748, scale = 149;
const yOut = y => zero - scale * y;

function graticule(ctx) {
  ctx.lineCap = 'butt';
  for (let k = 0; k <= 16; k++) {
    const x = tx(k / 4);
    line(ctx, x, 169, x, 765, k % 4 ? '#254138' : '#355247', k % 4 ? 1 : 2);
  }
  for (let j = 0; j <= 6; j++) {
    const y = yOut(j / 4);
    line(ctx, xStart, y, xEnd, y, j % 2 ? '#254138' : '#375448', j % 2 ? 1 : 2);
  }
  label(ctx, 'Output', 144, 464, 41, green);
  label(ctx, '1.50 V', 283, yOut(1.5), 37, '#c8dfc9', 'right', 'Mono');
  label(ctx, '0 V', 283, zero, 37, '#c8dfc9', 'right', 'Mono');
}

function beam(ctx, points, color, weight, sweep) {
  const trace = () => {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const p of points.slice(1)) ctx.lineTo(...p);
    ctx.stroke();
  };
  const opacity = ctx.globalAlpha;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  for (const [width, alpha] of [[weight * 3.2, 0.07], [weight * 1.8, 0.13], [weight, 0.92]]) {
    ctx.lineWidth = width;
    ctx.globalAlpha = opacity * alpha;
    trace();
  }
  ctx.globalAlpha = opacity;
  ctx.save();
  ctx.beginPath();
  ctx.rect(sweep - 26, 140, 26, 656);
  ctx.clip();
  ctx.strokeStyle = '#edffe4';
  ctx.lineWidth = weight + 1;
  trace();
  ctx.restore();
}

function wave(segments, value, base, factor) {
  const pts = [[xStart, base]];
  for (const {left, right, inputs} of segments) {
    const y = base - value(inputs) * factor;
    pts.push([tx(left), y], [tx(right), y]);
  }
  return pts;
}

function screen(ctx, s, seconds) {
  graticule(ctx);
  const edges = pulseEdges(s.delay);
  const segments = edges.slice(1).map((right, i) => ({
    left: edges[i], right, inputs: inputsAt((edges[i] + right) / 2, s.delay),
  }));
  const sweep = tx((seconds * 0.72 + 0.2) % 4);
  ctx.save();
  ctx.globalAlpha = s.inputs;
  for (const [i, base, color, name] of [[0, 251, copper, 'A in'], [1, 376, blue, 'B in']]) {
    label(ctx, name, 144, base - 24, 41, color);
    beam(ctx, wave(segments, input => input[i], base, 59), color, 5, sweep);
  }
  ctx.restore();

  if (s.tint > 0) {
    ctx.save();
    for (const {left, right, inputs} of segments) {
      if (inputs[0] === 0) continue;
      const x = tx(left), w = tx(right) - x;
      const split = yOut(inputs[0] * s.gains[0]), top = yOut(volts(inputs, s.gains));
      ctx.globalAlpha = s.tint * 0.48;
      ctx.fillStyle = copper;
      ctx.fillRect(x, split, w, zero - split);
      ctx.fillStyle = blue;
      ctx.fillRect(x, top, w, split - top);
      ctx.globalAlpha = s.tint;
      line(ctx, x, split, x + w, split, '#e6e6d0', 2);
      label(ctx, 'A', x + w / 2, (zero + split) / 2, 31, '#fff4da', 'center', 'Mono');
      label(ctx, 'B', x + w / 2, (top + split) / 2, 31, '#e3f7ff', 'center', 'Mono');
    }
    ctx.restore();
  }
  beam(ctx, wave(segments, input => volts(input, s.gains), zero, scale), green, 7, sweep);
  if (s.cursor > 0) {
    const x = tx(s.sampleTime);
    const readings = inputsAt(s.sampleTime, s.delay);
    ctx.save();
    ctx.globalAlpha = s.cursor;
    line(ctx, x, 153, x, 406, '#97b5a4', 2.5);
    for (const [channel, base, color] of [[0, 251, copper], [1, 376, blue]]) {
      const reading = readings[channel];
      const y = base - 59 * reading;
      disk(ctx, x, y, 10, color);
      label(ctx, reading + ' V', x + 15, y - 24, 35, color, 'left', 'Mono');
    }
    ctx.restore();
  }
  if (s.values > 0) {
    ctx.save();
    ctx.globalAlpha = s.values;
    for (const [i, shift] of [0, s.delay].entries()) {
      const t = starts[0] + shift + pulseWidth / 2;
      const v = volts(inputsAt(t, s.delay), s.gains);
      const channel = i === 0 ? 'A' : 'B';
      label(ctx, channel + ' ' + v.toFixed(2) + ' V', tx(t), yOut(v) - 33, 37, i === 0 ? copper : blue, 'center', 'Mono');
    }
    ctx.restore();
  }
}

function knob(ctx, x, name, gain, accent) {
  const y = 391, radius = 85;
  label(ctx, name, x, 220, 54, '#30382f', 'center', 'Sans', 600);
  const angleFor = value => (0.75 + value) * Math.PI;
  for (let n = 0; n <= 18; n++) {
    const a = angleFor(n / 12);
    const outer = n % 3 ? 104 : 114;
    line(ctx, x + 96 * Math.cos(a), y + 96 * Math.sin(a),
      x + outer * Math.cos(a), y + outer * Math.sin(a), '#586053', n % 3 ? 2 : 4);
  }
  disk(ctx, x + 1, y + 8, radius + 2, '#82867a');
  disk(ctx, x, y, radius, '#292e2b');
  const angle = angleFor(gain);
  for (let n = 0; n < 48; n++) {
    const a = angle + n * Math.PI / 24;
    line(ctx, x + 70 * Math.cos(a), y + 70 * Math.sin(a),
      x + 81 * Math.cos(a), y + 81 * Math.sin(a), '#565c53', 3);
  }
  const metal = gradient(ctx, x - 52, y - 68, x + 69, y + 55, [
    [0, '#e2dfd0'], [0.21, '#b5b8ae'], [0.56, '#d3d2c6'], [1, '#8a9286'],
  ]);
  disk(ctx, x, y, 70, '#222820');
  disk(ctx, x - 1, y - 2, 68, metal);
  disk(ctx, x, y, 51, '#848c81');
  disk(ctx, x, y - 1, 50, metal);
  const px = Math.cos(angle), py = Math.sin(angle);
  ctx.lineCap = 'round';
  line(ctx, x + 29 * px, y + 29 * py, x + 75 * px, y + 75 * py, '#343a31', 16);
  line(ctx, x + 31 * px, y + 31 * py, x + 73 * px, y + 73 * py, accent, 8);
  plate(ctx, x - 94, 505, 188, 75, 9, '#e7e8d7');
  plate(ctx, x - 94, 501, 188, 75, 9, '#252e28');
  label(ctx, gain.toFixed(2), x, 539, 55, accent, 'center', 'Mono');
}

function delaySlider(ctx, value) {
  label(ctx, 'Delay B', 1558, 644, 44, '#29332c', 'center', 'Sans', 600);
  const x1 = 1435, x2 = 1682, y = 734;
  plate(ctx, x1 - 36, y - 19, x2 - x1 + 72, 41, 18, '#e2e4d4');
  plate(ctx, x1 - 36, y - 22, x2 - x1 + 72, 40, 18, '#646d61');
  plate(ctx, x1 - 28, y - 13, x2 - x1 + 56, 23, 11, '#313932');
  const x = lerp(x1, x2, value);
  plate(ctx, x - 39, y - 31, 78, 60, 8, '#3b4238');
  const handle = gradient(ctx, x - 26, y - 28, x + 18, y + 24, [
    [0, '#f7f4df'], [0.48, '#c3c7b7'], [1, '#9b9f92'],
  ]);
  plate(ctx, x - 38, y - 35, 76, 56, 8, handle);
  line(ctx, x, y - 28, x, y + 14, '#52615a', 5);
  label(ctx, '0', x1, 794, 37, '#374037', 'center', 'Mono');
  label(ctx, '1 beat', x2, 794, 37, '#374037', 'center', 'Mono');
}

function draw(ctx, clock) {
  const s = state(clock);
  const closeUp = clock.index === 5 ? ease(clock.reveal('With the inputs separated', 1.8)) : 0;
  ctx.save();
  ctx.translate(-64 * closeUp, -244 * closeUp);
  const magnification = 1 + 0.52 * closeUp;
  ctx.scale(magnification, magnification);
  cabinet(ctx);
  screen(ctx, s, clock.seconds);
  label(ctx, 'Channel gain', 1558, 134, 42, '#414b40', 'center');
  knob(ctx, 1414, 'A', s.gains[0], copper);
  knob(ctx, 1702, 'B', s.gains[1], blue);
  line(ctx, 1319, 608, 1798, 608, '#90998c', 2);
  delaySlider(ctx, s.delay);
  ctx.restore();
}

function check() {
  const samples = [0.55, 1.55, 2.55];
  const columnsTogether = samples.map(t => inputsAt(t, 0));
  assert.deepEqual(columnsTogether, [[1, 1], [0, 0], [1, 1]]);
  for (const gains of [[0.75, 0.75], [1.25, 0.25], [0.25, 1.25]]) {
    assert.deepEqual(columnsTogether.map(row => volts(row, gains)), [1.5, 0, 1.5]);
  }
  assert.deepEqual(columnsTogether.map(row => volts(row, [-0.5, 0.5])), [0, 0, 0]);

  const gains = [0.25, 1.25];
  const separated = samples.map(t => inputsAt(t, 1));
  assert.deepEqual(separated, [[1, 0], [0, 1], [1, 0]]);
  assert.deepEqual(separated.map(row => volts(row, gains)), [0.25, 1.25, 0.25]);
  assert.equal(volts(inputsAt(0.70, 0.35), gains), 1.5);
}

export default { title: 'Which dial made the pulse?', beats, draw, check };

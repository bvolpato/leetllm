import assert from 'node:assert/strict';
import { tokenProbabilities } from '../../../films/sampling/arithmetic.mjs';

// The four-word sky example and the first uniform draw from Python's Random(5).
const words = ['blue', 'clear', 'cloudy', 'green'];
const drawRank = 0.6229016948897019;
const palette = ['#649de2', '#97dfcf', '#b8a5cd', '#98af67'];
const brass = '#eac892';
const ivory = '#f7edd9';
const navy = '#132333';
const turn = Math.PI * 2;
// The recorded draw is at three o'clock, where the tip meets the reading window.
const origin = -drawRank * turn;
const center = { x: 552, y: 495 };
const radius = 371;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => { const t = clamp01(v); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

function face(temperature) {
  let end = 0;
  return tokenProbabilities(temperature).map((mass, i) => {
    const start = end;
    end += mass;
    return { name: words[i], color: palette[i], mass, start, end };
  });
}

function wordAt(sectors, rank) {
  return sectors.find(({ end }) => rank < end).name;
}

// Temperature at which the first sector ends exactly at the recorded draw.
function crossingTemperature() {
  let low = 0.3;
  let high = 1;
  for (let i = 0; i < 48; i++) {
    const middle = (low + high) / 2;
    if (face(middle)[0].end > drawRank) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

const crossing = crossingTemperature();
const beats = [
  {
    id: 'catch',
    say: 'Here comes the needle. Watch the edge of blue.',
    hold: 1.4,
  },
  {
    id: 'odds',
    say: 'The sky is clear. Each of these four slices gives one word its chance. Blue gets just over sixty percent of the wheel, so it was the likeliest word.',
    hold: 0.9,
  },
  {
    id: 'travel',
    say: 'Start at zero. The sampler draws a number uniformly between zero and one. Each tenth of the rim is equally likely. Follow this draw clockwise, just over sixty-two percent of a turn. See the sliver of clear above the tip?',
    hold: 1.3,
  },
  {
    id: 'lock',
    say: 'Let’s replay that draw. I’ll pin the needle right here. Lowering the temperature gives the highest-scoring word more room. Which word will sit under the tip?',
    hold: 1.8,
  },
  {
    id: 'cool',
    say: 'Watch the seam next to the needle. Down goes the temperature, and blue sweeps across the tip. Dividing each score by point three widens the gaps between scores. Softmax turns those new scores into probabilities.',
    hold: 0.9,
  },
  {
    id: 'read',
    say: 'The sky is blue. The seam passed the needle. Blue now covers about ninety-one percent of the wheel. See that little slice of clear? A fresh draw could still land there.',
    hold: 2.8,
  },
];

function state(clock) {
  const { index, elapsed, reveal } = clock;
  const sweep = index === 0 ? ease(elapsed / 2.15) : 1;
  const cooling = index === 4 ? ease(reveal('next to the needle', 4.4)) : Number(index > 4);
  const temperature = mix(1, 0.3, cooling);
  const sectors = face(temperature);
  return {
    sectors, temperature, sweep, rank: mix(0.12, drawRank, sweep),
    firstWord: index === 0 ? ease((elapsed - 2.15) / 0.55) : 1,
    measure: index === 1 ? reveal('Blue gets', 1.2) : Number(index > 1),
    originMark: index === 2 ? reveal('Start at zero', 0.5) : Number(index > 2),
    orbit: index === 2 ? ease(reveal('Follow this draw', 3.4)) : Number(index > 2),
    lens: index === 2 ? ease(reveal('See the sliver', 0.8))
      : index === 3 ? 1 - ease(reveal('pin the needle', 0.75)) : 0,
    latched: index === 3 ? ease(reveal('pin the needle', 0.7)) : Number(index > 3),
    controls: index === 3 ? ease(reveal('Lowering the temperature', 0.7)) : Number(index > 3),
    wordRoll: ease((crossing - temperature) / 0.06),
    finalClear: index === 5 ? reveal('little slice of clear', 0.65) : 0,
  };
}

function circle(c, x, y, r, fill, stroke, width = 1) {
  c.beginPath();
  c.arc(x, y, r, 0, turn);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.lineWidth = width; c.strokeStyle = stroke; c.stroke(); }
}

function line(c, x1, y1, x2, y2, color, width = 1) {
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2);
  c.strokeStyle = color; c.lineWidth = width; c.stroke();
}

function arc(c, r, from, to, color, width) {
  c.beginPath();
  c.arc(0, 0, r, origin + turn * from, origin + turn * to);
  c.strokeStyle = color; c.lineWidth = width; c.stroke();
}

function sectorPath(c, sector) {
  c.beginPath(); c.moveTo(0, 0);
  c.arc(0, 0, radius, origin + turn * sector.start, origin + turn * sector.end);
  c.closePath();
}

function text(c, s, x, y, size, color, family = 'Sans', align = 'left', weight = 400) {
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.fillStyle = color; c.textAlign = align; c.textBaseline = 'alphabetic';
  c.fillText(s, x, y);
}

function gradient(c, x, y, x2, y2, stops) {
  const grad = c.createLinearGradient(x, y, x2, y2);
  stops.forEach(([offset, color]) => grad.addColorStop(offset, color));
  return grad;
}

function metal(c, x, y, x2, y2) {
  return gradient(c, x, y, x2, y2, [[0, '#6c5641'], [0.24, '#e4cd9d'], [0.47, '#a98c60'], [0.73, '#655440'], [1, '#c6a87c']]);
}

function star(c, x, y, r, color) {
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = Math.PI * i / 4;
    const v = i % 2 ? r * 0.19 : r;
    const px = x + Math.cos(a) * v, py = y + Math.sin(a) * v;
    if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.closePath(); c.fillStyle = color; c.fill();
}

// Engraving on the blue enamel and stars in the clear enamel stay inside their sectors.
function engraving(c, sector) {
  c.save();
  sectorPath(c, sector); c.clip();
  if (sector.name === 'blue') {
    circle(c, -231, -155, 48, null, '#214978', 2);
    circle(c, -231, -155, 40, null, '#214978', 1);
    for (let i = 0; i < 52; i++) {
      const a = i / 52 * turn;
      const r1 = 53, r2 = i % 2 ? 99 : 118;
      line(c, -231 + r1 * Math.cos(a), -155 + r1 * Math.sin(a),
        -231 + r2 * Math.cos(a), -155 + r2 * Math.sin(a), '#305d90', i % 2 ? 1 : 1.6);
    }
  } else if (sector.name === 'clear') {
    for (let i = 0; i < 66; i++) {
      const a = i * 2.39996;
      const r = 362 * Math.sqrt((i + 0.5) / 66);
      star(c, Math.cos(a) * r, Math.sin(a) * r, i % 5 ? 2.6 : 9, '#4d9d94');
    }
  }
  c.restore();
}

function background(c) {
  c.fillStyle = gradient(c, 100, 30, 1800, 1080, [[0, '#253841'], [0.43, '#192c34'], [0.76, '#12232b'], [1, '#0c1a20']]);
  c.fillRect(0, 0, 1920, 1080);
  // Fine straight brushing is easiest to see in the raking light above the bezel.
  for (let y = 3; y < 1080; y += 9) {
    const x = (y * 17) % 910;
    line(c, x, y, x + 60 + (y % 121), y, '#c1d5d508');
  }
}

function drawFace(c, s) {
  circle(c, 3, 15, radius + 44, '#09171c');
  circle(c, 0, 0, radius + 43, metal(c, -330, -410, 260, 395));
  circle(c, 0, 0, radius + 35, navy, '#524b3c', 3);
  circle(c, 0, 0, radius + 30, null, '#827c68', 1.5);
  for (const sector of s.sectors) {
    sectorPath(c, sector); c.fillStyle = sector.color; c.fill();
    engraving(c, sector);
  }
  circle(c, 0, 0, radius, gradient(c, -170, -350, 180, 330,
    [[0, '#fff6d91a'], [0.46, '#ffffff00'], [1, '#18355320']]));
  // Scale starts at zero, always in the same place.
  for (let i = 0; i < 100; i++) {
    const angle = origin + turn * i / 100;
    const major = i % 5 === 0;
    const inner = radius + (major ? 3 : 7);
    const outer = radius + (major ? 21 : 13);
    line(c, Math.cos(angle) * inner, Math.sin(angle) * inner,
      Math.cos(angle) * outer, Math.sin(angle) * outer, i === 0 ? ivory : '#b9af96', major ? 3 : 1.8);
  }
  circle(c, 0, 0, radius - 13, null, '#19383f55', 1.3);
  circle(c, 0, 0, radius - 18, null, '#19383f44', 1);
  for (const sector of s.sectors) {
    const angle = origin + turn * sector.start;
    line(c, 60 * Math.cos(angle), 60 * Math.sin(angle), radius * Math.cos(angle),
      radius * Math.sin(angle), '#263a43', 2);
  }

  const major = s.sectors[0];
  // Blue holds this piece of the face at both temperatures.
  text(c, 'blue', 15, -157, 79, '#102f51', 'Serif', 'center');
  c.save(); c.globalAlpha = s.measure;
  text(c, (major.mass * 100).toFixed(1) + '%', 15, -104, 43, '#183857', 'Mono', 'center');
  c.restore();

  for (const sector of s.sectors.slice(1, 3)) {
    const a = origin + (sector.start + sector.mass / 2) * turn;
    const small = sector.name === 'cloudy';
    const r = small ? 305 : mix(264, 298, (1 - s.temperature) / 0.7);
    const alpha = small ? ease((sector.mass - 0.053) / 0.02) : 1;
    c.save(); c.globalAlpha = alpha;
    c.translate(r * Math.cos(a), r * Math.sin(a));
    if (small || sector.mass < 0.20) {
      const tangent = Math.atan(Math.tan(a + Math.PI / 2));
      c.rotate(tangent * (small ? 1 : ease((0.20 - sector.mass) / 0.08)));
    }
    text(c, sector.name, 0, small ? 11 : 16, small ? 38 : 57, '#153b40', 'Serif', 'center');
    c.restore();
  }
  const green = s.sectors[3];
  if (green.mass > 0.011) {
    const a = origin + (green.start + green.mass / 2) * turn;
    c.save(); c.globalAlpha = ease((green.mass - 0.011) / 0.003);
    c.translate(303 * Math.cos(a), 303 * Math.sin(a));
    c.rotate(Math.atan(Math.tan(a)));
    text(c, green.name, 0, 7, 30, '#283720', 'Serif', 'center');
    c.restore();
  }

  if (s.orbit > 0) {
    arc(c, radius + 25, 0, drawRank * s.orbit, brass, 5);
    const a = origin + turn * drawRank * s.orbit;
    circle(c, Math.cos(a) * (radius + 25), Math.sin(a) * (radius + 25), 5, ivory);
  }
  if (s.originMark > 0) {
    c.save(); c.globalAlpha = s.originMark;
    const r = radius + 66;
    text(c, '0', r * Math.cos(origin), r * Math.sin(origin) + 12, 38, brass, 'Mono', 'center');
    c.restore();
  }
  // The shrinking clear crescent gets a light along its rim at the end.
  if (s.finalClear > 0) {
    c.save(); c.globalAlpha = s.finalClear * 0.9;
    arc(c, radius - 5, s.sectors[1].start, s.sectors[1].end, '#f6f4cb', 6);
    c.restore();
  }
}

function needle(c, s) {
  const a = origin + s.rank * turn;
  c.save(); c.rotate(a);
  c.beginPath();
  c.moveTo(-65, -8); c.lineTo(61, -13); c.lineTo(radius - 26, -1);
  c.lineTo(61, 11); c.lineTo(-65, 8); c.closePath();
  c.shadowColor = '#182325aa'; c.shadowBlur = 8; c.shadowOffsetY = 5;
  c.fillStyle = brass; c.fill(); c.shadowColor = 'transparent';
  c.strokeStyle = '#594a37'; c.lineWidth = 2; c.stroke();
  line(c, 56, -4, radius - 43, -1, '#fff2cc', 3);
  c.restore();
  circle(c, 0, 0, 46, '#132936', '#564b3b', 3);
  circle(c, 0, 0, 36, metal(c, -24, -32, 26, 36));
  circle(c, 0, 0, 19, '#354b50', '#e6cfa4', 2);
  if (s.latched > 0) {
    // The jaws close around the counterweight and leave the reading tip exposed.
    const x = mix(129, 69, s.latched);
    c.save(); c.globalAlpha = s.latched; c.scale(-1, 1);
    c.beginPath(); c.moveTo(x + 36, -20); c.lineTo(x - 5, -10);
    c.lineTo(x - 15, -2); c.lineTo(x + 14, -5); c.lineTo(x + 14, 5);
    c.lineTo(x - 15, 2); c.lineTo(x - 5, 10); c.lineTo(x + 36, 20); c.closePath();
    c.fillStyle = metal(c, x, -20, x + 26, 20); c.fill(); c.restore();
  }
}

function windowWord(c, word, y) {
  c.save();
  text(c, word + '.', 1158, y, 146, ivory, 'Serif');
  c.restore();
}

// A jeweler's loupe comes over the near miss and lifts away as the jaws close.
// Its glass enlarges exactly the same coordinates the viewer can see around it.
function loupe(c, s) {
  if (!s.lens) return;
  const x = 343, y = -15;
  const r = 119;
  c.save(); c.globalAlpha = s.lens;
  c.translate(x + 25 * (1 - s.lens), y - 40 * (1 - s.lens));
  circle(c, 2, 9, r + 6, '#12263266');
  circle(c, 0, 0, r + 7, metal(c, -90, -80, 76, 101));
  c.save();
  c.beginPath(); c.arc(0, 0, r, 0, turn); c.clip();
  c.scale(2.3, 2.3);
  c.translate(-x, -y);
  drawFace(c, s);
  needle(c, s);
  c.restore();
  circle(c, 0, 0, r - 1, null, '#17282e', 3);
  arc(c, r - 6, 0.035, 0.24, '#fff9dc77', 2);
  c.restore();
}

function readingWindow(c, s) {
  const x = 1109, y = 369, w = 606, h = 182;
  text(c, 'The sky is', 1139, 325, 101, '#e8e5d8', 'Serif');
  c.fillStyle = metal(c, x, y, x + w * 0.2, y + h);
  c.beginPath(); c.roundRect(x - 4, y - 4, w + 8, h + 8, 14); c.fill();
  c.save(); c.beginPath(); c.roundRect(x, y, w, h, 11); c.clip();
  c.fillStyle = gradient(c, 0, y, 0, y + h, [[0, '#0b1a20'], [0.2, '#263841'], [0.58, '#32444b'], [1, '#15272e']]);
  c.fillRect(x, y, w, h);
  if (s.firstWord < 1) {
    line(c, 1160, 487 - s.firstWord * h, 1375, 487 - s.firstWord * h, '#a3b5b9', 3);
  }
  const first = wordAt(face(1), drawRank);
  const second = wordAt(face(0.3), drawRank);
  windowWord(c, first, 499 + (1 - s.firstWord) * h - s.wordRoll * h);
  if (s.wordRoll > 0) windowWord(c, second, 499 + (1 - s.wordRoll) * h);
  c.restore();
}

function settings(c, s) {
  if (s.orbit > 0) {
    c.save(); c.globalAlpha = s.orbit;
    text(c, 'Draw', 1142, 652, 50, '#d8ddd4');
    text(c, drawRank.toFixed(3), 1332, 652, 53, brass, 'Mono');
    c.restore();
  }
  if (s.controls > 0) {
    c.save(); c.globalAlpha = s.controls;
    text(c, 'Temperature', 1142, 756, 49, '#d8ddd4');
    text(c, s.temperature.toFixed(2), 1604, 756, 51, ivory, 'Mono', 'right');
    const left = 1151, right = 1594, y = 804;
    line(c, left - 10, y, right + 10, y, '#0c171e', 16);
    line(c, left - 10, y + 8, right + 10, y + 8, '#728286', 2);
    for (let i = 0; i <= 7; i++) {
      const tx = mix(left, right, i / 7);
      line(c, tx, y + 15, tx, y + 26, '#94a29d', 2);
    }
    const x = mix(left, right, (s.temperature - 0.3) / 0.7);
    c.fillStyle = metal(c, x - 16, y - 18, x + 11, y + 20);
    c.beginPath(); c.roundRect(x - 18, y - 19, 36, 40, 5); c.fill();
    line(c, x, y - 11, x, y + 12, '#4a453b', 3);
    c.restore();
  }
}

function draw(c, clock) {
  const s = state(clock);
  background(c);
  c.save();
  c.translate(center.x, center.y);
  drawFace(c, s);
  needle(c, s);
  loupe(c, s);
  c.restore();
  readingWindow(c, s);
  settings(c, s);
}

function check() {
  const warm = face(1), cold = face(0.3);
  for (const sectors of [warm, cold]) {
    assert(Math.abs(sectors.at(-1).end - 1) < 1e-12);
    assert(sectors.every((s) => s.end > s.start));
  }
  assert.equal(wordAt(warm, drawRank), 'clear');
  assert.equal(wordAt(cold, drawRank), 'blue');
  assert.equal((warm[0].mass * 100).toFixed(1), '60.4');
  assert.equal((cold[0].mass * 100).toFixed(1), '91.1');
  assert.equal(wordAt(cold, (cold[1].start + cold[1].end) / 2), 'clear');
  assert.equal(wordAt(warm, warm[0].end), 'clear');
  assert(Math.abs(face(crossing)[0].end - drawRank) < 1e-12);
  assert.equal(origin + drawRank * turn, 0);
}

export default { title: 'Which Word Catches the Needle?', beats, draw, check };

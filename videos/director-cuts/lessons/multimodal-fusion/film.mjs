import assert from 'node:assert/strict';
import { DASHBOARD } from '../../../films/multimodal-fusion/fixtures.mjs';

const title = 'Which service slowed after 3 pm?';
const beats = [
  {
    id: 'the-crossing',
    say: 'Watch what happens after three. One trace crosses another. If this crop is all we send the model, can we name the service that slowed down?',
    hold: 1.4,
  },
  {
    id: 'catch-the-edge',
    say: 'We can follow the green line all the way up. Its name is missing. Pull the bottom of the crop down a little. There it is, beside the green diamond.',
    hold: 1,
  },
  {
    id: 'inside-the-image',
    say: 'Checkout. We just used two parts of one picture. How does that name get into a text answer? A vision encoder reads patches of pixels together with their positions.',
    hold: 0.55,
  },
  {
    id: 'read-the-key',
    say: 'A connector gives the decoder access to those features through a visual memory. Let’s try a tiny example with three legend entries. Each key represents a swatch. Its value encodes the name beside it.',
    hold: 0.65,
  },
  {
    id: 'the-mixture',
    say: 'Suppose the decoder has picked out the rising green trace. Its text state supplies a query that matches the green key best. The query scores each visual key, and softmax turns those scores into weights.',
    hold: 1.2,
  },
  {
    id: 'the-name',
    say: 'Cross-attention mixes the values in those proportions. Eight tenths of this read comes from the green entry. The decoder can use that mixture to answer Checkout.',
    hold: 1,
  },
  {
    id: 'change-the-key',
    say: 'Here’s a second screenshot. Same question. Every point in the plot stays put. Watch the names in the legend trade places. What answer does the same read give now?',
    hold: 2.0,
  },
  {
    id: 'same-climb',
    say: 'Follow the green diamond again. The line still climbs from five point two to nine. Eight tenths of the read now goes to the name beside this swatch. Search.',
    hold: 2.9,
  },
];

const palette = {
  paper: '#d6d1f0',
  ink: '#211b42',
  shadow: '#8b7eaf',
  plate: '#25234e',
  legend: '#302a59',
  lilac: '#c6bee0',
  white: '#fcf6ff',
  blue: '#85c9ff',
  green: '#b9fb79',
  pink: '#ffacae',
};
const services = ['Search', 'Checkout', 'Login'];
const firstLegend = ['Search', 'Checkout', 'Login'];
const nextLegend = ['Checkout', 'Search', 'Login'];
const swatches = DASHBOARD.series.map(series => palette[series.tone]);
const startIndex = DASHBOARD.hours.indexOf(DASHBOARD.afterHour);
const rising = DASHBOARD.series.findIndex(({ values }) =>
  values.slice(startIndex + 1).every((value, i) => value > values[startIndex + i]));
const basis = index => services.map((_, k) => Number(k === index));
const dot = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);

// The query is given after the slope has been identified. The read below only resolves the name.
function legendRead(legend) {
  const keys = swatches.map((_, i) => basis(i));
  const values = legend.map(name => basis(services.indexOf(name)));
  const query = basis(rising).map(x => x * Math.sqrt(keys.length) * Math.log(8));
  const scores = keys.map(key => dot(query, key) / Math.sqrt(query.length));
  const mass = scores.map(score => Math.exp(score - Math.max(...scores)));
  const total = mass.reduce((sum, amount) => sum + amount, 0);
  const weights = mass.map(amount => amount / total);
  const mixed = services.map((_, col) => values.reduce((sum, v, i) => sum + weights[i] * v[col], 0));
  return { weights, mixed, answer: services[mixed.indexOf(Math.max(...mixed))] };
}
const firstRead = legendRead(firstLegend);
const nextRead = legendRead(nextLegend);

const chart = { w: 1440, h: 576, plotBottom: 350, plotHeight: 240, keyTop: 432 };
const xAt = hour => 100 + (hour - 1) * 249;
const yAt = ms => chart.plotBottom - ms * chart.plotHeight / 10;
const lerp = (a, b, k) => a + (b - a) * k;
const clamp = n => Math.max(0, Math.min(1, n));
function ease(t) {
  const k = clamp(t);
  return k * k * (3 - 2 * k);
}
function cue(clock, beat, phrase, duration) {
  if (clock.index < beat) return 0;
  if (clock.index > beat) return 1;
  return ease(clock.reveal(phrase, duration));
}
function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
function text(c, str, x, y, size, color, options = {}) {
  const { family = 'Sans', weight = 400, align = 'left' } = options;
  c.font = `${weight} ${size}px "Lesson ${family}"`;
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(str, x, y);
}
function fade(c, alpha, paint) {
  if (alpha <= 0) return;
  c.save();
  c.globalAlpha *= alpha;
  paint();
  c.restore();
}
function clip(c, x, y, w, h) {
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
}

const masks = [
  ['11111', '11111', '11111', '11111', '11111'],
  ['00100', '01110', '11111', '01110', '00100'],
  ['10001', '01010', '00100', '01010', '10001'],
];
function stamp(c, id, x, y, size, color) {
  const unit = size / 5;
  for (const [j, row] of masks[id].entries()) {
    for (let i = 0; i < row.length; i++) {
      if (row[i] === '1') rect(c, x + (i - 2.5) * unit, y + (j - 2.5) * unit, unit, unit, color);
    }
  }
}

// Traces are sampled on a coarse raster, as in an enlarged bitmap screenshot.
function rasterTrace(c, values, through, color, width) {
  const cell = 5;
  const edge = xAt(through);
  c.beginPath();
  c.moveTo(xAt(1), Math.round(yAt(values[0]) / cell) * cell);
  for (let x = xAt(1) + cell; x <= edge + cell; x += cell) {
    const end = Math.min(edge, x);
    const t = (end - xAt(1)) / 249;
    const i = Math.min(values.length - 2, Math.floor(t));
    const v = lerp(values[i], values[i + 1], t - i);
    c.lineTo(end, Math.round(yAt(v) / cell) * cell);
    if (end === edge) break;
  }
  c.lineJoin = 'bevel';
  c.lineWidth = width;
  c.strokeStyle = color;
  c.stroke();
}
function swatchX(i) { return 122 + i * 455; }

function rollingName(c, i, x, baseline, swap, size, color) {
  if (firstLegend[i] === nextLegend[i] || swap === 0 || swap === 1) {
    text(c, (swap === 1 ? nextLegend : firstLegend)[i], x, baseline, size, color, { weight: 600 });
    return;
  }
  const stride = size * 1.45;
  c.save();
  clip(c, x - 2, baseline - size, size * 6, size * 1.21);
  text(c, firstLegend[i], x, baseline - swap * stride, size, color, { weight: 600 });
  text(c, nextLegend[i], x, baseline + (1 - swap) * stride, size, color, { weight: 600 });
  c.restore();
}

function cursor(c, x, y, alpha) {
  fade(c, alpha, () => {
    c.save();
    c.translate(x, y);
    c.beginPath();
    for (const [i, [dx, dy]] of [[0,0],[0,52],[14,39],[27,62],[39,55],[25,32],[45,32]].entries()) {
      if (i === 0) c.moveTo(dx, dy);
      else c.lineTo(dx, dy);
    }
    c.closePath();
    c.strokeStyle = palette.ink;
    c.lineWidth = 7;
    c.stroke();
    c.fillStyle = palette.white;
    c.fill();
    c.restore();
  });
}
function paintChart(c, state) {
  const { crop, cropTool, hour, patches, swap, endpoints, focus } = state;
  const { w, h, keyTop } = chart;
  const edge = lerp(keyTop, h, crop);
  rect(c, 11, 14, w, h, palette.shadow);
  rect(c, -4, -4, w + 8, h + 8, palette.ink);
  // The transparent area is precisely the missing slice of the image.
  if (edge < h) {
    rect(c, 0, edge, w, h - edge, '#d4cde9');
    c.save();
    clip(c, 0, edge, w, h - edge);
    for (let row = 0; row < 4; row++) {
      for (let x = (row % 2) * 40; x < w; x += 80) {
        rect(c, x, keyTop + row * 40, 40, 40, '#bcb4d6');
      }
    }
    c.restore();
  }

  c.save();
  clip(c, 0, 0, w, edge);
  const bg = c.createLinearGradient(0, 0, w / 2, h);
  bg.addColorStop(0, '#32345f');
  bg.addColorStop(1, palette.plate);
  rect(c, 0, 0, w, h, bg);
  text(c, 'Response time (ms)', 47, 62, 38, palette.white, { family: 'Mono' });
  for (const value of [0, 5, 10]) {
    const y = yAt(value);
    rect(c, xAt(1), y, xAt(6) - xAt(1), 2, '#626087');
    text(c, String(value), xAt(1) - 16, y + 10, 28, palette.lilac, { align: 'right', family: 'Mono' });
  }
  for (const hour of [1, 3, 6]) {
    const x = xAt(hour);
    rect(c, x, yAt(0), 2, 14, '#d9d0eb');
    text(c, `${hour} pm`, x, 406, 35, hour === 3 ? palette.white : palette.lilac, { align: 'center', family: 'Mono' });
  }
  for (let y = 95; y < chart.plotBottom; y += 14) rect(c, xAt(3) - 1.5, y, 3, 7, '#9a91b2');
  for (const i of [0, 2, rising]) {
    const values = DASHBOARD.series[i].values;
    const t = hour - 1;
    const j = Math.min(4, Math.floor(t));
    const y = yAt(lerp(values[j], values[j + 1], t - j));
    fade(c, i === rising ? 1 : 1 - 0.47 * focus, () => {
      rasterTrace(c, values, hour, swatches[i], i === rising ? 10 : 6);
      stamp(c, i, xAt(hour), y, i === rising ? 35 : 23, swatches[i]);
    });
  }
  fade(c, endpoints, () => {
    const values = DASHBOARD.series[rising].values;
    for (const i of [startIndex, values.length - 1]) {
      const x = xAt(DASHBOARD.hours[i]);
      const y = yAt(values[i]);
      stamp(c, rising, x, y, 29, palette.green);
      if (i === startIndex) {
        text(c, values[i].toFixed(1), x - 18, y - 15, 36, palette.green, { family: 'Mono', align: 'right' });
      } else {
        text(c, values[i].toFixed(1), x - 18, y - 23, 39, palette.green, { family: 'Mono', align: 'right' });
      }
    }
  });
  rect(c, 0, keyTop, w, h - keyTop, palette.legend);
  rect(c, 0, keyTop, w, 3, '#777196');
  for (let i = 0; i < swatches.length; i++) {
    const chosen = i === rising ? focus : 0;
    const x = swatchX(i);
    fade(c, chosen, () => {
      const left = x - 47, top = keyTop + 20, width = 288, height = 106, cap = 23;
      rect(c, left + 2, top + 2, width - 4, height - 4, '#42465a');
      for (const cornerX of [left, left + width]) {
        for (const cornerY of [top, top + height]) {
          rect(c, cornerX === left ? left : cornerX - cap, cornerY - 3, cap, 6, palette.green);
          rect(c, cornerX - 3, cornerY === top ? top : cornerY - cap, 6, cap, palette.green);
        }
      }
    });
    fade(c, i === rising ? 1 : 1 - 0.47 * focus, () => {
      stamp(c, i, x, keyTop + 74, 47, swatches[i]);
      rollingName(c, i, x + 49, keyTop + 91, swap, 49, palette.white);
    });
  }
  fade(c, patches, () => {
    for (let x = 144; x < w; x += 144) rect(c, x - 1.5, 0, 3, h, '#c8d4fd');
    for (let y = 144; y < h; y += 144) rect(c, 0, y - 1.5, w, 3, '#c8d4fd');
  });
  c.restore();
  fade(c, cropTool, () => {
    c.save();
    c.strokeStyle = palette.ink;
    c.lineWidth = 6;
    c.strokeRect(0, 0, w, edge);
    c.setLineDash([14, 14]);
    c.strokeStyle = palette.white;
    c.lineWidth = 3;
    c.strokeRect(0, 0, w, edge);
    c.restore();
    const handle = w * 0.69;
    rect(c, handle - 22, edge - 9, 44, 18, palette.white);
    rect(c, handle - 16, edge - 4, 32, 8, palette.ink);
    cursor(c, handle + 13, edge + 4, 1);
  });
}

function workspace(c) {
  const grad = c.createLinearGradient(0, 0, 1450, 1080);
  grad.addColorStop(0, '#ece6fa');
  grad.addColorStop(1, '#c0b6df');
  rect(c, 0, 0, 1920, 1080, grad);
  // A sparse pixel pattern belongs to the desk outside the bitmap.
  c.fillStyle = 'rgba(78,55,122,.20)';
  for (let y = 4; y < 1080; y += 24) {
    for (let x = (y % 48 === 4 ? 2 : 14); x < 1920; x += 24) c.fillRect(x, y, 2, 2);
  }
}
function mixStrip(c, x, y, w, weights, progress) {
  let edge = 0;
  for (const [i, weight] of weights.entries()) {
    const end = edge + weight;
    const visible = clamp(Math.min(end, progress) - edge);
    if (visible > 0) {
      rect(c, x + edge * w, y, visible * w, 32, swatches[i]);
    }
    edge = end;
  }
  for (let k = 1; k < 10; k++) rect(c, x + k * w / 10 - 2, y, 4, 32, palette.ink);
}
function paintMemory(c, view, state) {
  const { memory, weightsIn, mixIn, swap, result, read } = state;
  if (!memory) return;
  const left = 1247, right = 1807;
  fade(c, memory, () => {
    text(c, 'Visual memory', left, 294, 52, palette.ink, { family: 'Serif' });
    text(c, 'Key', left, 361, 32, '#44395c');
    text(c, 'Value', left + 83, 361, 32, '#44395c');
    fade(c, weightsIn, () => text(c, 'Weight', right, 361, 32, '#44395c', { align: 'right' }));
    rect(c, left, 378, right - left, 3, '#9c90b7');
  });
  for (let i = 0; i < swatches.length; i++) {
    const k = ease(clamp(memory * 1.34 - i * 0.17));
    if (!k) continue;
    const fromX = view.x + swatchX(i) * view.s;
    const fromY = view.y + (chart.keyTop + 74) * view.s;
    const targetY = 438 + i * 88;
    const x = lerp(fromX, left + 25, k);
    const y = lerp(fromY, targetY, k) - Math.sin(Math.PI * k) * 86;
    const size = lerp(36, 49, k);
    stamp(c, i, x, y, size + 7, palette.ink);
    stamp(c, i, x, y, size, swatches[i]);
    fade(c, ease((k - 0.68) / 0.32), () =>
      rollingName(c, i, left + 83, targetY + 16, swap, 48, palette.ink));
    fade(c, weightsIn, () => text(c, Math.round(100 * read.weights[i]) + '%', right, targetY + 15, 42, palette.ink, { family: 'Mono', align: 'right' }));
  }
  fade(c, mixIn, () => {
    rect(c, left - 3, 688, right - left + 6, 38, palette.ink);
    mixStrip(c, left, 691, right - left, read.weights, mixIn);
  });
  fade(c, result, () => {
    text(c, 'Answer', left, 806, 33, '#483b62');
    text(c, read.answer, left, 884, 82, palette.ink, { family: 'Serif' });
  });
}

function draw(c, clock) {
  const crop = cue(clock, 1, 'Pull the bottom', 1.55);
  const patches = cue(clock, 2, 'patches of pixels', 0.9) * (1 - cue(clock, 3, 'Let’s try', 0.8));
  const room = cue(clock, 3, 'A connector', 1.4);
  const close = cue(clock, 7, 'Follow the green diamond', 1.75);
  const wideShot = room * (1 - close);
  const memory = cue(clock, 3, 'Let’s try', 1.5);
  const query = cue(clock, 4, 'Its text state supplies', 0.7);
  const swap = cue(clock, 6, 'Watch the names', 1.05);
  const firstAnswer = cue(clock, 5, 'The decoder can use', 0.6) * (1 - cue(clock, 6, 'Here’s a second', 0.4));
  const hour = 3 + 3 * ease(clock.index === 0 ? (clock.elapsed + 0.12) / 3 : 1);
  const view = { x: lerp(166, 90, wideShot), y: lerp(220, 303, wideShot), s: lerp(1.1, 0.75, wideShot) };
  c.save();
  workspace(c);
  text(c, title, 113, 148, 87, palette.ink, { family: 'Serif' });
  const answerIn = cue(clock, 7, 'the name beside this swatch', 0.9);
  if (answerIn > 0) {
    const x = 1450;
    const written = nextRead.answer.slice(0, Math.ceil(answerIn * nextRead.answer.length));
    text(c, written, x, 144, 71, palette.ink, { family: 'Mono' });
    rect(c, x, 154, c.measureText(written).width, 7, palette.ink);
  }
  c.save();
  c.translate(view.x, view.y);
  c.scale(view.s, view.s);
  paintChart(c, {
    crop, cropTool: 1 - cue(clock, 2, 'We just used', 0.6), hour, patches: patches * 0.48, swap,
    endpoints: cue(clock, 7, 'The line still climbs', 0.7),
    focus: cue(clock, 7, 'Eight tenths of the read', 0.75),
  });
  c.restore();
  fade(c, 1 - ease(close * 3.6), () => {
    fade(c, query, () => {
      text(c, 'Text query', view.x, 833, 39, palette.ink);
      stamp(c, rising, view.x + 252, 816, 60, palette.ink);
      stamp(c, rising, view.x + 252, 816, 42, palette.green);
      text(c, 'rising green trace', view.x + 303, 833, 47, palette.ink, { family: 'Mono' });
    });
    paintMemory(c, view, {
      memory, weightsIn: cue(clock, 4, 'softmax turns', 0.7), mixIn: cue(clock, 5, 'Cross-attention mixes', 0.95),
      swap, result: firstAnswer, read: swap === 1 ? nextRead : firstRead,
    });
  });
  c.restore();
}

function check() {
  const increasing = DASHBOARD.series.filter(({ values }) =>
    values.slice(startIndex + 1).every((ms, i) => ms > values[startIndex + i]));
  assert.equal(increasing.length, 1);
  assert.equal(increasing[0].tone, 'green');
  assert.deepEqual([increasing[0].values[startIndex], increasing[0].values.at(-1)], [5.2, 9]);
  const pink = DASHBOARD.series.find(row => row.tone === 'pink');
  assert(increasing[0].values[startIndex] < pink.values[startIndex] && increasing[0].values.at(-1) > pink.values.at(-1));
  for (const read of [firstRead, nextRead]) {
    assert.deepEqual(read.weights.map(w => Math.round(w * 100)), [10, 80, 10]);
    assert(Math.abs(read.weights.reduce((a, b) => a + b, 0) - 1) < 1e-12);
  }
  assert.deepEqual(firstRead.mixed.map(w => Math.round(w * 100)), [10, 80, 10]);
  assert.deepEqual(nextRead.mixed.map(w => Math.round(w * 100)), [80, 10, 10]);
  assert.equal(firstRead.answer, 'Checkout');
  assert.equal(nextRead.answer, 'Search');
}

export default { title, beats, draw, check };

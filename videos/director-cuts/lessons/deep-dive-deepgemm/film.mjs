import assert from 'node:assert/strict';

const title = 'DeepGEMM: One cell waits for its scales';

const beats = [
  {
    id: 'two-rows-land',
    say: 'Those two rows just landed together. Blue belongs to token one. Orange holds the weights for channel two. Their answer goes in this one cell. What is it waiting for?',
    hold: 0.9,
  },
  {
    id: 'two-scales-per-group',
    say: 'Look below the rows. These low-precision numbers come in groups of thirty-two. Each group has a blue scale for the activations and an orange scale for the weights. Both pairs are still in shared memory.',
    hold: 0.7,
  },
  {
    id: 'cross-the-gap',
    say: 'Follow the scales across the gap. The rows stay behind. On this Blackwell path the matrix instruction reads its scales here in tensor memory. Now it can use the rows.',
    hold: 0.7,
  },
  {
    id: 'same-position',
    say: 'Read straight down. One times two gives two. Move one place to the right. Two times one adds another two. The other thirty pairs are zero. The two scales multiply to one, so this group contributes four.',
    hold: 0.6,
  },
  {
    id: 'five-before-scaling',
    say: 'Cross to the next group. Three meets minus one. Four meets two. Minus three plus eight makes five, with zeros in all the remaining positions. How much of that five will reach the output?',
    hold: 1.1,
  },
  {
    id: 'half-the-strip',
    say: 'Watch the five. Its blue scale is two, and its orange scale is one quarter. Together they cut the contribution in half. Add those two and a half to the four from the first group. That one cell gets six and a half.',
    hold: 2.9,
  },
];

// The two nonzero pairs in each group come from the lesson's scaled dot product.
// Extending each group with zeros preserves the fixture on a 32-position scale boundary.
const widthK = 32;
const groups = [
  { a: [1, 2], b: [2, 1], sa: 0.5, sb: 2 },
  { a: [3, 4], b: [-1, 2], sa: 2, sb: 0.25 },
].map(({ a, b, sa, sb }, i) => {
  const row = (head) => Array.from({ length: widthK }, (_, k) => head[k] ?? 0);
  const activation = row(a);
  const weight = row(b);
  const products = activation.map((x, k) => x * weight[k]);
  const raw = products.reduce((sum, value) => sum + value, 0);
  return { start: i * widthK, activation, weight, products, raw, sa, sb, factor: sa * sb, scaled: raw * sa * sb };
});

const result = groups.reduce((sum, g) => sum + g.scaled, 0);
const ink = '#27233b';
const faint = '#5c516f';
const violet = '#6236af';
const blue = '#2844ac';
const orange = '#9e3b17';
const xGroups = [251, 714];
const xSlots = [1233, 1535];
// Stored E4M3 activations and E2M1 weights, in most-significant-bit order.
const encoding = [
  new Map([[1, '00111000'], [2, '01000000'], [3, '01000100'], [4, '01001000']]),
  new Map([[2, '0100'], [1, '0010'], [-1, '1010']]),
];

const clamp = (x) => Math.max(0, Math.min(1, x));
function ease(x) {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
}
const mix = (a, b, x) => a + (b - a) * x;
const pretty = (x) => String(x).replace('-', '−');

function phase(clock, beatIndex, phrase, seconds) {
  if (clock.index !== beatIndex) return Number(clock.index > beatIndex);
  return ease(clock.reveal(phrase, seconds));
}

function state(clock) {
  const arrival = ease(clock.seconds / 0.92);
  const copy = phase(clock, 2, 'Follow the scales', 2.1);
  const first = phase(clock, 3, 'Read straight down', 0.7);
  const second = phase(clock, 3, 'Move one place', 0.8);
  const third = phase(clock, 4, 'Cross to the next group', 0.7);
  const fourth = phase(clock, 4, 'Four meets two', 0.8);
  const shrink = phase(clock, 5, 'one quarter', 1.5);
  const finish = phase(clock, 5, 'Add those two and a half', 2.3);
  return { arrival, copy, first, second, third, fourth, shrink, finish };
}

function text(ctx, value, x, y, size, color = ink, align = 'left', face = 'Sans', weight = 500) {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(String(value), x, y);
}

function trace(ctx, points, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const p of points.slice(1)) ctx.lineTo(...p);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function gradient(ctx, x, y, x2, y2, stops) {
  const fill = ctx.createLinearGradient(x, y, x2, y2);
  stops.forEach(([p, color]) => fill.addColorStop(p, color));
  return fill;
}

// The masks have clipped corners, like the traces on the exposed die.
function mask(ctx, x, y, w, h, cut, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x + cut, y);
  ctx.lineTo(x + w - cut, y);
  ctx.lineTo(x + w, y + cut);
  ctx.lineTo(x + w, y + h - cut);
  ctx.lineTo(x + w - cut, y + h);
  ctx.lineTo(x + cut, y + h);
  ctx.lineTo(x, y + h - cut);
  ctx.lineTo(x, y + cut);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (edge) {
    ctx.strokeStyle = edge;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function substrate(ctx, wide) {
  ctx.fillStyle = gradient(ctx, 25, 0, 1920, 1080, [
    [0, '#dfd6f1'], [0.27, '#f5e5d7'], [0.51, '#ebe4f6'],
    [0.76, '#decbea'], [1, '#bcaed9'],
  ]);
  ctx.fillRect(0, 0, 1920, 1080);

  // Parallel runs turn together at a die boundary. Each band leaves a clear optical field.
  const band = (x, y, count, gap, points) => {
    ctx.save();
    ctx.translate(x, y);
    for (let i = 0; i < count; i++) {
      const offset = i * gap;
      const wire = points.map(([a, b]) => [a + offset, b - offset * 0.35]);
      trace(ctx, wire, i % 4 === 0 ? '#a48fb5' : '#bbb0cb', 2);
      trace(ctx, wire.map(([a,b]) => [a + 2, b + 1]), '#f7edfa', 1);
    }
    ctx.restore();
  };
  band(-180, -47, 21, 9, [[0, 165], [150, 165], [238, 77], [710, 77], [827, -40]]);
  band(1127, 0, 9, 7, [[0, -20], [0, 125], [52, 177], [52, 591], [0, 643], [0, 790]]);
  band(1750, 8, 23, 8, [[0,-90], [0,35], [88,123], [88,490], [118,520]]);
  band(-110, 862, 22, 6, [[0,-38], [102,-38], [213,73], [907,73], [1048,214]]);
  band(1195, 960, 20, 8, [[0,260],[0,139],[93,46],[444,46],[590,-100]]);
  // Long dash marks are deposited along the outer edge of the wafer.
  for (let i = 0; i < 180; i++) {
    const x = i * 11;
    ctx.fillStyle = i % 7 < 2 ? '#8f789c' : '#bba7c4';
    ctx.fillRect(x, 1052, 6, 18);
    ctx.fillStyle = '#f4e7fa';
    ctx.fillRect(x + 1, 1052, 1, 17);
  }
  ctx.save();
  ctx.globalAlpha = wide;
  text(ctx, 'DeepGEMM   /   Blackwell SM100', 85, 79, 29, faint, 'left', 'Mono');
  ctx.restore();
  text(ctx, 'Shared memory', 85, 165, 60, ink, 'left', 'Serif');
  text(ctx, 'Tensor memory', 1230, 165, 60, ink, 'left', 'Serif');
}

function operand(ctx, x, y, w, value, row, tail, selected) {
  const palette = row === 0 ? ['#2544ab', '#526bd4', '#213c90'] : ['#a04429', '#df7148', '#aa472a'];
  mask(ctx, x, y + 7, w, 96, 7, row === 0 ? '#243467' : '#703925');
  mask(ctx, x, y, w, 96, 7, gradient(ctx, x, y, x + w, y + 96, [
    [0, palette[0]], [0.54, palette[1]], [1, palette[2]],
  ]), '#fff1e270');
  if (tail) {
    for (let k = 0; k < widthK - 2; k++) {
      const tx = x + 5 + (w - 10) * (k + 0.5) / (widthK - 2);
      trace(ctx, [[tx, y + 7], [tx, y + 90]], '#ffffff33', 1.6);
    }
    mask(ctx, x + w / 2 - 31, y + 22, 62, 51, 3, palette[0]);
  } else {
    const bits = encoding[row].get(value);
    const pitch = (w - 24) / bits.length;
    for (let i = 0; i < bits.length; i++) {
      ctx.fillStyle = bits[i] === '1' ? '#ffe4bd' : '#352d5b66';
      ctx.fillRect(x + 12 + pitch * i, y + 82, pitch - 2, 7);
    }
  }
  text(ctx, pretty(value), x + w / 2, y + 48, tail ? 46 : 67, '#fff9ef', 'center', 'Mono');
  if (selected > 0) {
    ctx.save();
    ctx.globalAlpha = selected;
    trace(ctx, [[x + 10,y + 11],[x + w - 10,y + 11]], '#fff1b6', 6);
    ctx.restore();
  }
}

function rows(ctx, s, clock) {
  const yRows = [306, 458];
  const widths = [112, 112, 138];
  const offsets = [0, 122, 244];
  for (const y of yRows) {
    for (let n = 0; n < 4; n++)
      trace(ctx, [[225,y+36+n*7],[1111,y+36+n*7]], '#957e9f', 2);
  }
  const progress = [s.first - s.second, s.second - s.third, s.third - s.fourth, s.fourth * (1 - s.shrink)];
  for (let j = 0; j < 2; j++) {
    const g = groups[j];
    const gx = xGroups[j];
    for (let k = 0; k < 3; k++) {
      const w = widths[k], x = gx + offsets[k];
      const label = k === 2 ? (g.start + 2) + '–' + (g.start + widthK - 1) : String(g.start + k);
      text(ctx, label, x + w / 2, 264, 32, faint, 'center', 'Mono');
      for (let r = 0; r < 2; r++) {
        const y = yRows[r];
        const arrived = r === 0 ? s.arrival : ease((clock.seconds - 0.13) / 0.88);
        const sourceRow = r === 0 ? g.activation : g.weight;
        mask(ctx, x, y + 3, w, 103, 8, '#b5a7be', '#c4b5c8');
        ctx.save();
        ctx.globalAlpha = 0.86 + 0.14 * arrived;
        operand(ctx, x + (1 - arrived) * (r ? 44 : 28), y + (1 - arrived) * (r ? 36 : -18),
          w, sourceRow[k], r, k === 2, k < 2 ? progress[j * 2 + k] : 0);
        ctx.restore();
      }
    }
  }
  text(ctx, 'k', 197, 264, 36, faint, 'right', 'Mono');
  for (let r = 0; r < 2; r++) {
    const y = yRows[r], color = r ? orange : blue;
    text(ctx, r ? 'B[2,k]' : 'A[1,k]', 68, y + 31, 40, color, 'left', 'Mono');
    text(ctx, r ? 'channel 2' : 'token 1', 70, y + 75, 31, color);
  }
}

function coordinateCursor(ctx, s) {
  const show = s.first * (1 - s.shrink);
  if (!show) return;
  let x = mix(xGroups[0], xGroups[0] + 122, s.second);
  x = mix(x, xGroups[1], s.third);
  x = mix(x, xGroups[1] + 122, s.fourth);
  const cx = x + 56;
  ctx.save();
  ctx.globalAlpha = show;
  for (const [level, dir] of [[296,1],[566,-1]]) {
    trace(ctx, [[x-4,level+24*dir],[x-4,level],[x+26,level]], ink, 6);
    trace(ctx, [[x+86,level],[x+116,level],[x+116,level+24*dir]], ink, 6);
  }
  trace(ctx, [[cx,406],[cx,459]], ink, 6);
  mask(ctx, cx-29, 412, 58, 40, 13, ink);
  text(ctx, '×', cx, 431, 40, '#ffefb1', 'center', 'Mono');
  ctx.restore();
}

function scalePacket(ctx, x, y, w, g, opacity) {
  ctx.save();
  ctx.globalAlpha *= opacity;
  const half = w / 2;
  for (let r = 0; r < 2; r++) {
    const left = x + r * half;
    mask(ctx, left, y + 6, half - 3, 78, 5, r ? '#803a24' : '#353c6f');
    mask(ctx, left, y, half - 3, 78, 5, r ? '#ffbd93' : '#bec9ff', '#75677e');
    text(ctx, pretty(r ? g.sb : g.sa), left + half / 2 - 1, y + 39, 41,
      r ? '#64311e' : '#232f65', 'center', 'Mono');
  }
  ctx.restore();
}

function scales(ctx, s, clock) {
  const math = s.first;
  const showSource = (1 - math) * (0.35 + 0.65 * phase(clock, 1, 'Look below', 0.75));
  const stagedY = 718;
  const destinationY = 718;
  const stageW = 288, slotW = 259;
  const rightLabels = ['k 0–31', 'k 32–63'];
  text(ctx, 'Scale factors', 1232, 616, 36, ink);
  ctx.save();
  ctx.globalAlpha *= 1 - math;
  text(ctx, 'Scale factors', 85, 616, 36, ink);
  ctx.restore();
  groups.forEach((g, i) => {
    const sx = xGroups[i] + 32, tx = xSlots[i];
    ctx.save();
    ctx.globalAlpha *= showSource;
    scalePacket(ctx, sx, stagedY, stageW, g, 1 - 0.55 * s.copy);
    text(ctx, rightLabels[i], sx + stageW / 2, stagedY - 33, 32, faint, 'center', 'Mono');
    ctx.restore();

    text(ctx, rightLabels[i], tx + slotW / 2, destinationY - 33, 32, faint, 'center', 'Mono');
    for (const r of [0, 1]) {
      const w = slotW / 2 - 3;
      const x = tx + r * slotW / 2;
      mask(ctx, x - 3, destinationY - 4, w + 6, 92, 6, '#a998b6', '#f6ecfc');
      mask(ctx, x, destinationY, w, 83, 5, '#c3b3cf');
      for (let n = 8; n < w - 6; n += 8) {
        trace(ctx, [[x+n,destinationY+9],[x+n,destinationY+73]], '#a192b2', 2);
      }
    }
    if (s.copy > 0) {
      const dip = 94 * Math.sin(s.copy * Math.PI);
      scalePacket(ctx, mix(sx, tx, s.copy), mix(stagedY, destinationY, s.copy) + dip,
        mix(stageW, slotW, s.copy), g, 1);
    }
    if (math > 0) {
      const amount = i === 0
        ? phase(clock, 3, 'The two scales', 0.5)
        : s.shrink;
      ctx.save();
      ctx.globalAlpha *= amount;
      text(ctx, '× ' + pretty(g.factor), tx + slotW / 2, 849, 42, violet, 'center', 'Mono');
      ctx.restore();
    }
  });
}

function answer(ctx, s, clock) {
  const x = 1289, y = 266, w = 457, h = 215;
  // Split contacts sit outside the accumulator readout and never carry numeric values.
  for (let i = 0; i < 19; i++) {
    const left = x + 17 + i * 23;
    ctx.fillStyle = '#9280a4';
    ctx.fillRect(left, y - 17, 10, 21);
    ctx.fillRect(left, y + h - 1, 10, 21);
    ctx.fillStyle = '#f6e0d3';
    ctx.fillRect(left + 1, y - 17, 3, 19);
    ctx.fillRect(left + 1, y + h, 3, 19);
  }
  mask(ctx, x - 8, y - 8, w + 16, h + 16, 23, '#93879d', '#fff8ec');
  mask(ctx, x, y, w, h, 19, gradient(ctx, x, y, x+w, y+h, [
    [0, '#302a49'], [0.42, '#4a385e'], [1, '#29243f'],
  ]));
  text(ctx, 'D[1,2]', x + 26, y + 34, 37, '#e5d7f6', 'left', 'Mono');
  if (s.finish < 1) {
    trace(ctx, [[x+w/2-43,y+132],[x+w/2+43,y+132]], '#a48db5', 7);
  } else {
    text(ctx, pretty(result), x+w/2, y+121, 109, '#fff0ce', 'center', 'Mono');
  }
  let status = 'FP32 accumulator';
  if (clock.index > 0) status = 'Waiting for scales';
  if (s.copy === 1) status = 'Scales ready';
  if (s.finish === 1) status = groups.map(g => pretty(g.scaled)).join(' + ');
  text(ctx, status, x + w/2, 535, 36, s.copy === 1 ? violet : faint, 'center', 'Mono');
}

function contributions(ctx, s) {
  if (!s.first) return;
  ctx.save();
  ctx.globalAlpha = s.first;
  text(ctx, 'Inside the dot product', 85, 607, 36, ink);
  ctx.restore();
  const unit = 65;
  groups.forEach((g, i) => {
    const start = i === 0 ? s.first : s.third;
    if (start === 0) return;
    ctx.save();
    ctx.globalAlpha = start;
    const x = xGroups[i];
    const next = i === 0 ? s.second : s.fourth;
    const pair = (k) => pretty(g.activation[k]) + '×' + (g.weight[k] < 0 ? '(' + pretty(g.weight[k]) + ')' : pretty(g.weight[k]));
    const line = pair(0) + (next > 0.02 ? ' + ' + pair(1) : '');
    text(ctx, line, x, 659, 40, ink, 'left', 'Mono');
    // A negative product gets an explicit sign. Only the positive group sum has a length.
    if (next < 1) {
      text(ctx, pretty(g.products[0]), x, 739, 65, violet, 'left', 'Mono');
    } else {
      const scale = i === 0 ? 1 : mix(1, g.factor, s.shrink);
      const length = unit * g.raw * scale;
      const base = 707;
      mask(ctx, x, base, unit * g.raw, 58, 4, '#c6b6cf', '#8e7c9e');
      const tones = i === 0 ? ['#573396', '#8064b5', '#553091'] : ['#974289', '#b96daa', '#954387'];
      mask(ctx, x, base, length, 58, 4, gradient(ctx, x, base, x+length, base+58,
        [[0, tones[0]],[0.7, tones[1]],[1, tones[2]]]));
      for (let n = 1; n < g.raw; n++) {
        trace(ctx, [[x+unit*n,base+3],[x+unit*n,base+55]], '#fff5ef', 2.3);
      }
      trace(ctx, [[x+length,base-5],[x+length,base+63]], ink, 4);
      const shrinking = i === 1 && s.shrink > 0 && s.shrink < 1;
      if (!shrinking) text(ctx, pretty(g.raw * scale), x + length, 816, 48, ink, 'center', 'Mono');
    }
    ctx.restore();
  });
}

function collect(ctx, finish) {
  if (!finish) return;
  // A copy of each colored contribution settles beneath the number it built.
  const start = 1517 - result * 36 / 2;
  let placed = 0;
  for (const [i, g] of groups.entries()) {
    const t = ease(clamp((finish - 0.16 * i) / 0.84));
    if (!t) continue;
    const x = mix(xGroups[i], start + placed * 36, t);
    const y = mix(707, 451, t) + Math.sin(Math.PI*t) * 180;
    const unit = mix(65, 36, t);
    const h = mix(58, 13, t);
    mask(ctx, x, y, g.scaled * unit, h, 2, i === 0 ? '#9570d1' : '#e39bcf', '#5e4267');
    for (let n = 1; n < g.scaled; n++)
      trace(ctx, [[x+n*unit,y+1],[x+n*unit,y+h-1]], '#fff6ee', 2);
    placed += g.scaled;
  }
}

function draw(ctx, clock) {
  const s = state(clock);
  // Start at reading distance from the two rows. Pull back to reveal their destination.
  const wide = phase(clock, 0, 'Their answer', 1.5);
  ctx.save();
  const zoom = mix(1.69, 1, wide);
  ctx.scale(zoom, zoom);
  ctx.translate(-10*(1-wide), -73*(1-wide));
  substrate(ctx, wide);
  rows(ctx, s, clock);
  coordinateCursor(ctx, s);
  answer(ctx, s, clock);
  ctx.save();
  ctx.globalAlpha = wide;
  scales(ctx, s, clock);
  ctx.restore();
  contributions(ctx, s);
  collect(ctx, s.finish);
  ctx.restore();
}

function check() {
  assert.deepEqual(groups.map(g => g.raw), [4, 5]);
  assert.deepEqual(groups.map(g => g.products.filter(Boolean)), [[2, 2], [-3, 8]]);
  assert.deepEqual(groups.map(g => g.factor), [1, 0.5]);
  assert.deepEqual(groups.map(g => g.scaled), [4, 2.5]);
  const explicit = groups.flatMap(g => g.activation.map((a, k) => (a * g.sa) * (g.weight[k] * g.sb)));
  assert.equal(explicit.length, 64);
  assert.equal(explicit.reduce((total, v) => total + v, 0), result);
  assert.equal(result, 6.5);
  for (const [r, map] of encoding.entries()) {
    const fractionBits = r === 0 ? 3 : 1;
    const bias = r === 0 ? 7 : 1;
    for (const [value, bits] of map) {
      const exponent = parseInt(bits.slice(1, -fractionBits), 2) - bias;
      const fraction = parseInt(bits.slice(-fractionBits), 2) / 2 ** fractionBits;
      assert.equal((bits[0] === '1' ? -1 : 1) * 2 ** exponent * (1 + fraction), value);
    }
  }
  const beforeCopy = state({ index: 1, seconds: 20, reveal: () => 1 });
  const inFlight = state({ index: 2, seconds: 30, reveal: () => 0.5 });
  const ready = state({ index: 2, seconds: 33, reveal: () => 1 });
  assert.equal(beforeCopy.arrival, 1);
  assert.equal(beforeCopy.copy, 0);
  assert.ok(inFlight.copy > 0 && inFlight.copy < 1);
  assert.equal(ready.copy, 1);
  assert.equal(ready.finish, 0);
}

export default { title, beats, draw, check };

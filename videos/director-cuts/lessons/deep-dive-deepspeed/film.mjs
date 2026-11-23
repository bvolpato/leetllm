import assert from 'node:assert/strict';
import { adam } from '../../../films/deep-dive-deepspeed/arithmetic.mjs';

const title = 'DeepSpeed ZeRO: The Gradient That Crosses';
const beats = [
  {
    id: 'one-contribution',
    say: 'Watch the one land. The weight below it still reads one. All eight microbatches are finished. What is the owner waiting for?',
    hold: 1.4,
  },
  {
    id: 'the-owner',
    say: 'With DeepSpeed’s ZeRO stage three, rank zero owns this weight and the two Adam moments beside it. Rank one owns the next slice. Its worker saw different examples, and they contributed to weight zero too.',
    hold: 0.6,
  },
  {
    id: 'the-crossing',
    say: 'Follow the three from rank one. Both numbers belong to the same weight. These batches count equally, so take the mean. The owner gets a gradient of two.',
    hold: 1,
  },
  {
    id: 'two-moment-writes',
    say: 'Both moments start at zero. The first keeps a running average of the gradient. Here it takes a tenth of two. The second tracks squared gradients. Square the two here, after the contributions meet. One thousandth of four goes into the second cell.',
    hold: 1.1,
  },
  {
    id: 'one-weight-write',
    say: 'Adam corrects for starting those averages at zero. On this first step that gives two and four. Two divided by the square root of four is one. With a learning rate of one hundredth, watch the weight drop by about that much.',
    hold: 1.2,
  },
  {
    id: 'read-the-second-moment',
    say: 'About point nine nine. Using the one alone would give the same weight to two decimal places. Look at the second moment. One alone would leave one thousandth. Both ranks together left four thousandths.',
    hold: 2.7,
  },
];

const microbatches = 8;
const contributions = [1, 3];
// Each rank owns one element of each global array. The displayed subscripts
// are global indices. Both local gradient contributions concern global index 0.
const shards = [1, 0.5].map((w) => ({
  w: Float32Array.of(w),
  m: Float32Array.of(0),
  v: Float32Array.of(0),
}));
const owner = shards[0];
const initial = [owner.w[0], owner.m[0], owner.v[0]];

function reducedGradient(values, completed) {
  if (
    completed !== microbatches ||
    values.length !== contributions.length ||
    !values.every(Number.isFinite)
  )
    return null;
  return values.reduce((sum, g) => sum + g, 0) / values.length;
}

const mean = reducedGradient(contributions, microbatches);
const updated = adam(initial, mean, 1);
const localOnly = adam(initial, contributions[0], 1);
const firstCorrected = updated[1] / (1 - 0.9);
const secondCorrected = updated[2] / (1 - 0.999);
const close = (a, b) => Math.abs(a - b) < 1e-9;
const clamp = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => x * x * (3 - 2 * x);
const mix = (a, b, t) => a + (b - a) * t;

function check() {
  assert.equal(reducedGradient([1, null], 8), null);
  assert.equal(reducedGradient(contributions, 7), null);
  assert.equal(mean, 2);
  assert.equal(mean ** 2, 4);
  assert.equal(contributions.reduce((v, g) => v + g * g, 0) / 2, 5);
  assert.ok(close(updated[1], 0.2) && close(updated[2], 0.004));
  assert.ok(close(firstCorrected, 2) && close(secondCorrected, 4));
  assert.ok(close(updated[0], 1 - (0.01 * 2) / (2 + 1e-8)));
  assert.equal(updated[0].toFixed(2), '0.99');
  const before = registers({ m: 0, v: 0, write: 0 });
  const afterMoments = registers({ m: 1, v: 1, write: 0 });
  const afterWrite = registers({ m: 1, v: 1, write: 1 });
  assert.deepEqual(before, { w: 1, m: 0, v: 0 });
  assert.equal(afterMoments.w, before.w);
  assert.equal(afterMoments.m.toFixed(1), '0.2');
  assert.equal(afterMoments.v.toFixed(3), '0.004');
  assert.equal(afterWrite.w.toFixed(2), '0.99');
  assert.equal(localOnly[0].toFixed(2), afterWrite.w.toFixed(2));
  assert.equal(localOnly[2].toFixed(3), '0.001');
  assert.notEqual(localOnly[2].toFixed(3), afterWrite.v.toFixed(3));
}

function registers(p) {
  return {
    w: p.write === 1 ? Math.fround(updated[0]) : owner.w[0],
    m: p.m === 1 ? Math.fround(updated[1]) : owner.m[0],
    v: p.v === 1 ? Math.fround(updated[2]) : owner.v[0],
  };
}

// Each reveal controls one read or write. A stored value changes on a clock
// edge. Only the transfer, select lines and light on the silicon interpolate.
function signal(clock, index, phrase, span) {
  if (clock.index !== index) return Number(clock.index > index);
  return clock.reveal(phrase, span);
}
function phase(clock) {
  return {
    land: clamp(clock.seconds / 1.3),
    left: signal(clock, 1, 'rank zero owns', 0.7),
    right: signal(clock, 1, 'Rank one owns', 0.7),
    crossing: signal(clock, 2, 'Follow the three', 2.4),
    divide: signal(clock, 2, 'take the mean', 0.75),
    m: signal(clock, 3, 'Here it takes', 0.9),
    square: signal(clock, 3, 'Square the two here', 0.7),
    v: signal(clock, 3, 'One thousandth of four', 0.9),
    correct: signal(clock, 4, 'On this first step', 0.75),
    direction: signal(clock, 4, 'Two divided by', 1),
    write: signal(clock, 4, 'watch the weight drop', 0.75),
    localWeight: signal(clock, 5, 'Using the one alone', 0.6),
    localMoment: signal(clock, 5, 'Look at the second moment', 0.6),
    settle: signal(clock, 5, 'Both ranks together', 1.4),
  };
}

const C = {
  ink: '#211d44',
  dim: '#54546c',
  paper: '#f9f4f0',
  purple: '#5247a8',
  pale: '#d8d1ff',
  scarlet: '#ff9475',
  glass: '#252241',
  white: '#fffaf1',
};

function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
function stroke(c, points, color, width = 2) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
function facet(c, x, y, w, h, bevel) {
  c.beginPath();
  c.moveTo(x + bevel, y);
  c.lineTo(x + w - bevel, y);
  c.lineTo(x + w, y + bevel);
  c.lineTo(x + w, y + h - bevel);
  c.lineTo(x + w - bevel, y + h);
  c.lineTo(x + bevel, y + h);
  c.lineTo(x, y + h - bevel);
  c.lineTo(x, y + bevel);
  c.closePath();
}
function fillFacet(c, x, y, w, h, bevel, fill) {
  facet(c, x, y, w, h, bevel);
  c.fillStyle = fill;
  c.fill();
}
function gradient(c, x, y, xx, yy, stops) {
  const g = c.createLinearGradient(x, y, xx, yy);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}
function text(
  c,
  value,
  x,
  y,
  size,
  { color = C.ink, face = 'Sans', weight = 400, align = 'left' } = {},
) {
  c.font = `${weight} ${size}px "Lesson ${face}"`;
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(String(value), x, y);
}
function mono(c, value, x, y, size, color, align = 'left') {
  text(c, value, x, y, size, { color, face: 'Mono', align });
}

// The etched word in a memory cell depicts its current IEEE 754 binary32 value.
function word(c, value, x, y, w, h, on, off) {
  const bits = new DataView(new ArrayBuffer(4));
  bits.setFloat32(0, value);
  const packed = bits.getUint32(0);
  const pitch = w / 35;
  for (let i = 0; i < 32; i++) {
    const pos = (i + Math.floor(i / 8)) * pitch;
    rect(c, x + pos, y, pitch * 0.7, h, (packed >>> (31 - i)) & 1 ? on : off);
  }
}
function carrier(c) {
  rect(
    c,
    0,
    0,
    1920,
    1080,
    gradient(c, 0, 0, 1820, 950, [
      [0, '#d9dbe4'],
      [0.45, '#c9cce0'],
      [0.8, '#d9d5e3'],
      [1, '#c8c8d7'],
    ]),
  );
  // The traces fan out under the die edges, leaving the signal channel clear.
  for (let i = 0; i < 20; i++) {
    const y = 588 + i * 15;
    stroke(
      c,
      [
        [1240, y - 113],
        [1330 + i * 3, y - 113],
        [1400 + i * 3, y - 43],
        [1490, y - 43],
      ],
      '#a5a3ba',
      2.4,
    );
  }
  for (let i = 0; i < 38; i++) {
    const x = 115 + i * 32;
    stroke(
      c,
      [
        [x, 887],
        [x, 925],
        [x - 24, 949],
        [x - 24, 1080],
      ],
      '#b3b3c9',
      2.4,
    );
  }
  text(c, 'DeepSpeed   /   ZeRO-3', 69, 70, 34, { weight: 600 });
  text(c, 'Microbatches', 1310, 65, 32, { color: C.dim });
  for (let i = 0; i < microbatches; i++) rect(c, 1535 + i * 21, 43, 15, 23, C.purple);
  mono(c, '8 / 8', 1838, 67, 32, C.ink, 'right');
}
function silicon(c, x, w, rank) {
  const y = 113,
    h = 785;
  fillFacet(c, x + 1, y + 18, w, h, 36, '#9998ad');
  fillFacet(c, x, y + 8, w, h, 36, '#716f88');
  fillFacet(
    c,
    x,
    y,
    w,
    h,
    36,
    gradient(c, x, y, x + w, y + h, [
      [0, '#f5f3f8'],
      [0.25, '#e7e5ef'],
      [0.57, '#d6d3e3'],
      [1, '#ece6ea'],
    ]),
  );
  c.save();
  facet(c, x + 4, y + 4, w - 8, h - 8, 32);
  c.clip();
  // A fine saw edge and a repeated pad row give the two regions physical depth.
  for (let i = 0; i < w / 23; i++) {
    const px = x + 37 + i * 23;
    rect(c, px, y + h - 20, 13, 11, '#a9a1b5');
    rect(c, px, y + h - 19, 13, 2, '#f9f6ef');
    rect(c, px, y + 7, 10, 5, '#c7c1cf');
  }
  stroke(
    c,
    [
      [x + 23, y + 107],
      [x + w - 22, y + 107],
    ],
    '#bab6c6',
    2,
  );
  c.restore();
  text(c, 'Rank ' + rank, x + 49, y + 80, 66, { weight: 600 });
}
function socket(c, x, y) {
  fillFacet(c, x - 72, y - 54, 144, 108, 13, '#a8a2b5');
  fillFacet(c, x - 69, y - 51, 138, 102, 11, '#c4bfcd');
  for (let j = 0; j < 3; j++)
    for (let i = 0; i < 6; i++) rect(c, x - 48 + i * 17, y - 25 + j * 20, 7, 7, '#aaa1b1');
}
function packet(c, x, y, value, remote, lift = 0) {
  const [light, dark] = remote ? ['#d45b3d', '#9f3b2d'] : ['#7165c0', '#504399'];
  fillFacet(c, x - 65 + lift * 0.24, y - 40 + lift * 0.75, 130, 93, 10, '#8c829c');
  fillFacet(c, x - 65, y - 47, 130, 96, 10, dark);
  fillFacet(
    c,
    x - 65,
    y - 51,
    130,
    94,
    10,
    gradient(c, x - 65, y - 51, x + 65, y + 43, [
      [0, light],
      [1, dark],
    ]),
  );
  stroke(
    c,
    [
      [x - 52, y - 48],
      [x + 49, y - 48],
      [x + 61, y - 37],
    ],
    '#ffffff75',
    2.5,
  );
  word(c, value, x - 46, y + 30, 92, 6, '#fff1d7', '#ffffff40');
  mono(c, value, x, y + 19, 68, C.white, 'center');
}
function operands(c, p) {
  const y = 350,
    local = 245,
    remote = 515,
    donor = 1680,
    result = 1119;
  text(c, 'Gradients for w[0]', 99, 278, 39, { weight: 600 });
  text(c, 'For w[0]', 1518, 278, 39, { weight: 600 });
  for (const dy of [-14, 0, 14])
    stroke(
      c,
      [
        [mix(remote, 1322, p.divide), y + dy],
        [donor, y + dy],
      ],
      '#a27a75',
      2.5,
    );
  socket(c, local, y);
  socket(c, remote, y);
  socket(c, donor, y);
  mono(c, 'rank 0', local, y + 96, 32, C.dim, 'center');
  mono(c, 'rank 1', remote, y + 96, 32, C.dim, 'center');

  const land = smooth(p.land);
  packet(c, mix(118, local, land), y - 9 * (1 - land), contributions[0], false, 12 * (1 - land));
  const crossed = smooth(p.crossing);
  packet(
    c,
    mix(donor - 140 * smooth(p.right), remote, crossed),
    y - 14 * Math.sin(Math.PI * crossed),
    contributions[1],
    true,
    12 * Math.sin(Math.PI * crossed),
  );

  if (p.crossing === 1) {
    mono(c, '+', 380, y + 22, 62, C.ink, 'center');
  }
  if (p.divide > 0) {
    c.save();
    c.globalAlpha = p.divide;
    mono(c, '(', 133, y + 20, 60, C.dim, 'center');
    mono(c, ')', 623, y + 20, 60, C.dim, 'center');
    mono(c, '÷ 2  =', 850, y + 20, 60, C.ink, 'center');
    socket(c, result, y);
    mono(c, 'g[0]', result, y + 96, 34, C.ink, 'center');
    c.restore();
  }
  if (p.divide === 1) {
    fillFacet(c, result - 66, y - 47, 132, 94, 9, C.glass);
    mono(c, mean, result, y + 23, 67, C.white, 'center');
  }
}

function memoryWell(c, x, y, w, h, fill) {
  fillFacet(c, x - 3, y - 3, w + 6, h + 9, 15, '#beb6c7');
  fillFacet(c, x, y, w, h, 12, fill);
  stroke(
    c,
    [
      [x + 13, y + 2],
      [x + w - 13, y + 2],
    ],
    '#ffffff50',
    2,
  );
}
// The two local read paths merge at the input to the weight write.
const firstRead = [
  [696, 566],
  [665, 566],
  [632, 599],
  [632, 639],
  [586, 639],
];
const secondRead = [
  [696, 749],
  [665, 749],
  [632, 716],
  [632, 676],
  [586, 676],
];
function readPulse(c, points, p) {
  stroke(c, points, '#aaa1b9', 5);
  if (p <= 0) return;
  c.save();
  c.strokeStyle = p === 1 ? '#837ba7' : C.purple;
  c.lineWidth = 6;
  const lengths = points
    .slice(1)
    .map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  let left = p * lengths.reduce((a, b) => a + b, 0);
  c.beginPath();
  c.moveTo(...points[0]);
  for (const [i, length] of lengths.entries()) {
    const t = Math.min(1, left / length);
    c.lineTo(mix(points[i][0], points[i + 1][0], t), mix(points[i][1], points[i + 1][1], t));
    if (left <= length) break;
    left -= length;
  }
  c.stroke();
  c.restore();
}
function moment(c, y, name, symbol, value, precision, comment, lit) {
  const x = 698,
    w = 563,
    h = 151;
  memoryWell(
    c,
    x,
    y,
    w,
    h,
    gradient(c, x, y, x + w, y + h, [
      [0, '#3d395d'],
      [1, '#2b2945'],
    ]),
  );
  text(c, name, x + 24, y + 43, 35, { color: '#e4deec' });
  if (comment) mono(c, comment, x + w - 24, y + 43, 30, C.pale, 'right');
  mono(c, symbol, x + 24, y + 113, 52, '#d5cce6');
  mono(c, value === 0 ? '0' : value.toFixed(precision), x + w - 25, y + 114, 65, C.white, 'right');
  word(c, value, x + 27, y + 132, w - 54, 8, '#ece3ff', '#625c73');
  if (lit > 0 && lit < 1) {
    rect(c, x + 6, y + 13, 8, (h - 26) * lit, C.scarlet);
  }
}
function stateArrays(c, p) {
  const { m, v, w } = registers(p);

  readPulse(c, firstRead, p.write);
  readPulse(c, secondRead, p.write);
  if (p.divide === 1) {
    readPulse(
      c,
      [
        [1191, 350],
        [1287, 350],
        [1287, 566],
        [1261, 566],
      ],
      p.m,
    );
    readPulse(
      c,
      [
        [1287, 566],
        [1287, 749],
        [1261, 749],
      ],
      p.v,
    );
  }

  let mComment = '',
    vComment = '';
  if (p.m > 0) mComment = '0.1 × ' + mean;
  if (p.square > 0) vComment = mean + '² = ' + mean ** 2;
  if (p.v > 0) vComment = '0.001 × ' + mean ** 2;
  if (p.correct > 0) {
    mComment = 'corrected ' + firstCorrected.toFixed(0);
    vComment = 'corrected ' + secondCorrected.toFixed(0);
  }
  if (p.localWeight > 0) {
    mComment = '';
    vComment = '';
  }
  if (p.localMoment > 0 && p.settle < 1) vComment = '1 → ' + localOnly[2].toFixed(3);
  moment(c, 485, 'First moment', 'm[0]', m, 1, mComment, p.m);
  moment(c, 668, 'Second moment', 'v[0]', v, 3, vComment, p.v);

  const x = 100,
    y = 485,
    width = 486,
    height = 334;
  memoryWell(
    c,
    x,
    y,
    width,
    height,
    gradient(c, x, y, x + width, y + height, [
      [0, '#332957'],
      [0.55, '#463564'],
      [1, '#30283e'],
    ]),
  );
  text(c, 'Weight', x + 27, y + 58, 43, { color: C.white });
  mono(c, 'w[0]', x + width - 25, y + 59, 42, C.pale, 'right');
  mono(c, w.toFixed(2), x + width / 2, y + 210, 134, C.white, 'center');
  word(c, w, x + 30, y + 285, width - 60, 20, '#edc9a7', '#635571');
  if (p.direction > 0 && p.settle < 1) {
    const formula =
      p.localWeight > 0
        ? '1 alone → ' + localOnly[0].toFixed(2)
        : '−0.01 × ' + firstCorrected.toFixed(0) + ' / √' + secondCorrected.toFixed(0);
    c.save();
    c.globalAlpha = p.direction * (1 - p.settle) * (p.localWeight > 0 ? p.localWeight : 1);
    mono(c, formula, x + width / 2, y + 264, 39, '#ebe2ff', 'center');
    c.restore();
  }

  // Illuminate the owner's three addresses together as the viewer finds them.
  if (p.left > 0 && p.right < 1) {
    c.save();
    c.globalAlpha = p.left * (1 - p.right);
    stroke(
      c,
      [
        [100, 834],
        [100, 845],
        [1261, 845],
        [1261, 834],
      ],
      C.purple,
      4,
    );
    c.restore();
  }

  // The neighbouring shard stays in address view during the traced update.
  text(c, 'Owned arrays', 1518, 500, 36, { weight: 600, color: C.dim });
  ['w', 'm', 'v'].forEach((name, i) => {
    const yy = 531 + 96 * i;
    fillFacet(c, 1518, yy, 450, 76, 8, '#cac6d4');
    mono(c, name + '[1]', 1541, yy + 52, 44, C.dim);
    word(c, shards[1][name][0], 1694, yy + 21, 220, 34, '#7c748e', '#b5afc0');
  });
  if (p.right > 0 && p.crossing < 1) {
    c.save();
    c.globalAlpha = p.right * (1 - p.crossing);
    stroke(
      c,
      [
        [1518, 815],
        [1518, 831],
        [1905, 831],
      ],
      C.purple,
      4,
    );
    c.restore();
  }
}
function draw(c, clock) {
  const p = phase(clock);
  c.save();
  carrier(c);
  silicon(c, 52, 1270, 0);
  silicon(c, 1470, 732, 1);
  operands(c, p);
  stateArrays(c, p);
  c.restore();
}

export default { title, beats, draw, check };

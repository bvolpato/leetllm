import assert from 'node:assert/strict';
import { H, P, WORDS } from '../../../films/vectors/fixtures.mjs';

const word = WORDS[0][2];
const original = H[0][2];
const beats = [
  {
    id: 'lift',
    say: 'Watch the red axle. The brass rack just went up a whole unit. The blue one stayed put. How far did they carry the wheel?',
    hold: 1.1,
  },
  {
    id: 'word',
    say: 'Half a unit, from a half to one. The two rack heights are the coordinates of a vector for the word password. Both started at one half.',
    hold: 0.65,
  },
  {
    id: 'copies',
    say: 'This matrix turns those two numbers into three. Read down the first column. One times x plus zero times y gives us a copy of x. The second column copies y.',
    hold: 0.7,
  },
  {
    id: 'axle',
    say: 'Look at the last column. Half from each rack. The third output is their average. Trace a line between the two pointers. It passes straight through the axle at one.',
    hold: 1.0,
  },
  {
    id: 'target',
    say: 'See the red ring on the glass? That’s where the axle started. Leave the brass rack up. How far would you have to lower the blue rack to get the axle back there?',
    hold: 2.2,
  },
  {
    id: 'lower',
    say: 'Follow the blue pointer. When it reaches zero, the axle is still above the mark. A little farther. There.',
    hold: 1.0,
  },
  {
    id: 'register',
    say: 'One rack went up a unit and the other went down a unit. The sum is still one. The wheel has turned, and its axle is back at one half.',
    hold: 2.6,
  },
];

const unit = 220;
const zeroY = 681;
const centerX = 1236;
const radius = 180;
const teeth = 22;
const moduleSize = (2 * radius) / teeth;
const pitch = Math.PI * moduleSize;
const halfTurn = Math.PI;
const tau = 2 * halfTurn;
const leftPitch = centerX - radius;
const rightPitch = centerX + radius;
const heightOf = (value) => zeroY - value * unit;
const clamp = (value) => Math.max(0, Math.min(1, value));
const smooth = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const format = (n) => (Math.abs(n) < 0.005 ? '0' : String(Number(n.toFixed(2)))).replace('-', '−');

function mechanism(x, y) {
  const output = P[0].map((wx, j) => wx * x + P[1][j] * y);
  // At either pitch line the wheel and rack travel together without slipping.
  const angle = ((x - original[0] - (y - original[1])) * unit) / (2 * radius);
  return { x, y, output, axleY: heightOf(output[2]), angle };
}

function state(clock) {
  const { index, elapsed, reveal } = clock;
  const lifted = index > 0 ? 1 : smooth(elapsed / 2.8);
  let lowered = index < 5 ? 0 : 1;
  if (index === 5) {
    lowered = 0.5 * smooth(elapsed / 1.6) + 0.5 * smooth(reveal('A little farther', 1.45));
  }
  const pullback = index === 0 ? 0 : index === 1 ? smooth(reveal('The two rack heights', 1.65)) : 1;
  const showMatrix = index < 2 ? 0 : index === 2 ? smooth(elapsed / 0.7) : 1;
  let first = 0,
    second = 0,
    last = 0;
  if (index === 2) {
    second = smooth(reveal('The second column', 0.4));
    first = smooth(reveal('the first column', 0.4)) * (1 - second);
  } else if (index === 3) {
    last = smooth(reveal('the last column', 0.45));
    second = 1 - last;
  } else if (index > 3) {
    last = 1;
  }
  const line = index < 3 ? 0 : index === 3 ? smooth(reveal('Trace a line', 1.05)) : 1;
  const showMark = index < 4 ? 0 : index === 4 ? smooth(elapsed / 0.6) : 1;
  const close = index < 4 ? 0 : index === 4 ? smooth(elapsed / 1.65) : 1;
  return {
    ...mechanism(original[0] + lifted, original[1] - lowered),
    pullback,
    close,
    showMatrix,
    highlights: [first, second, last],
    line,
    showMark,
  };
}

const ink = '#24372f';
const brass = '#8e5c18';
const blue = '#235b76';
const red = '#a33227';
const paper = '#f2edda';

function gradient(ctx, x1, y1, x2, y2, stops) {
  const fill = ctx.createLinearGradient(x1, y1, x2, y2);
  stops.forEach(([at, color]) => fill.addColorStop(at, color));
  return fill;
}
function box(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}
function path(ctx, points, fill, stroke, width = 1) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  if (fill) {
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.lineWidth = width;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}
function circle(ctx, x, y, r, fill, stroke, width = 1) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, tau);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}
function text(ctx, value, x, y, size, color = ink, face = 'Sans', align = 'left', weight = 400) {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}
function bolt(ctx, x, y, angle) {
  circle(ctx, x, y + 2, 10, '#4a544a');
  circle(ctx, x, y, 9, '#879084', '#e4e4cb', 1.5);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  path(
    ctx,
    [
      [-6, 1],
      [6, 1],
    ],
    null,
    '#c6c8b9',
    3,
  );
  path(
    ctx,
    [
      [-6, 0],
      [6, 0],
    ],
    null,
    '#46504a',
    2,
  );
  ctx.restore();
}
function cabinet(ctx) {
  ctx.fillStyle = '#223a35';
  ctx.fillRect(-1950, -1100, 5800, 3300);
  box(ctx, 46, 68, 1828, 893, 49, '#142723');
  box(
    ctx,
    43,
    54,
    1828,
    893,
    49,
    gradient(ctx, 0, 54, 0, 947, [
      [0, '#abb1a0'],
      [0.02, '#e4e3cd'],
      [0.94, '#787f70'],
      [1, '#485a50'],
    ]),
  );
  box(
    ctx,
    52,
    63,
    1810,
    869,
    41,
    gradient(ctx, 52, 63, 1700, 900, [
      [0, '#f3eeda'],
      [0.51, '#e5e2cf'],
      [1, '#d3d2bd'],
    ]),
  );
  // Cast-metal face with fixed nicks, rendered identically at every time.
  ctx.fillStyle = '#514d3010';
  for (let i = 0; i < 290; i++) {
    const x = 78 + ((i * 491) % 1741),
      y = 84 + ((i * 113) % 808);
    ctx.fillRect(x, y, (i % 7) + 1, 1.4);
  }
  for (const [x, y, a] of [
    [82, 96, 0.3],
    [1828, 96, -0.6],
    [82, 898, -0.32],
    [1828, 898, 0.76],
  ])
    bolt(ctx, x, y, a);
  box(ctx, 646, 112, 1141, 758, 24, '#87958b');
  box(ctx, 648, 117, 1137, 751, 22, '#334c43');
  box(
    ctx,
    655,
    125,
    1123,
    736,
    18,
    gradient(ctx, 655, 125, 1778, 861, [
      [0, '#c5cebf'],
      [0.4, '#e7eada'],
      [1, '#ccd2bf'],
    ]),
  );
}

function brackets(ctx, x1, x2, y1, y2, color) {
  path(
    ctx,
    [
      [x1 + 11, y1],
      [x1, y1],
      [x1, y2],
      [x1 + 11, y2],
    ],
    null,
    color,
    4,
  );
  path(
    ctx,
    [
      [x2 - 11, y1],
      [x2, y1],
      [x2, y2],
      [x2 - 11, y2],
    ],
    null,
    color,
    4,
  );
}
function register(ctx, m) {
  ctx.save();
  ctx.globalAlpha = m.pullback;
  text(ctx, word, 109, 203, 83, ink, 'Serif');
  text(ctx, 'Input vector', 114, 285, 40);
  brackets(ctx, 132, 544, 327, 399, ink);
  text(ctx, format(m.x), 248, 363, 57, brass, 'Mono', 'center');
  text(ctx, format(m.y), 430, 363, 57, blue, 'Mono', 'center');
  ctx.globalAlpha *= m.showMatrix;
  path(
    ctx,
    [
      [114, 438],
      [567, 438],
    ],
    null,
    '#747f6c',
    2,
  );
  text(ctx, 'Matrix', 114, 483, 40);
  const columns = [209, 345, 483];
  const rows = [562, 635];
  const colors = [brass, blue, red];
  columns.forEach((x, i) => {
    const alpha = m.highlights[i];
    ctx.save();
    ctx.globalAlpha *= alpha;
    box(ctx, x - 53, 522, 106, 149, 12, i === 2 ? '#d9bda6' : i === 0 ? '#e6d2a5' : '#c2d3cc');
    path(
      ctx,
      [
        [x - 38, 825],
        [x + 38, 825],
      ],
      null,
      colors[i],
      5,
    );
    ctx.restore();
    rows.forEach((y, r) =>
      text(ctx, P[r][i] === 0.5 ? '½' : String(P[r][i]), x, y, 53, ink, 'Serif', 'center'),
    );
  });
  brackets(ctx, 133, 555, 523, 674, ink);
  text(ctx, 'Output vector', 114, 725, 40);
  brackets(ctx, 133, 555, 763, 826, ink);
  columns.forEach((x, i) =>
    text(ctx, format(m.output[i]), x, 795, 46, colors[i], 'Mono', 'center'),
  );
  ctx.restore();
}

const gearPoints = [];
const pressure = Math.PI / 9;
const inv = (a) => Math.tan(a) - a;
const baseR = radius * Math.cos(pressure);
const rootR = radius - 1.25 * moduleSize;
const tipR = radius + moduleSize;
const flank = (r) =>
  halfTurn / (2 * teeth) + inv(pressure) - inv(Math.acos(Math.min(1, baseR / r)));
for (let i = 0; i < teeth; i++) {
  const angle = (tau * i) / teeth;
  const radii = [rootR, baseR, radius - 3, radius + 6, tipR];
  const point = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
  radii.forEach((r) => gearPoints.push(point(r, angle - flank(r))));
  radii
    .slice()
    .reverse()
    .forEach((r) => gearPoints.push(point(r, angle + flank(r))));
}
function wheelRing(ctx, color, edge) {
  ctx.beginPath();
  gearPoints.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.moveTo(radius - 49, 0);
  ctx.arc(0, 0, radius - 49, 0, tau, true);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill('evenodd');
  if (edge) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = edge;
    ctx.stroke();
  }
}
function spokes(ctx, fill, edge) {
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.rotate((i * tau) / 6);
    ctx.beginPath();
    ctx.moveTo(22, -16);
    ctx.bezierCurveTo(72, -18, 98, -32, 135, -28);
    ctx.lineTo(141, -3);
    ctx.bezierCurveTo(101, -11, 79, 8, 25, 22);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (edge) {
      ctx.strokeStyle = edge;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }
}
function wheel(ctx, m) {
  ctx.save();
  ctx.translate(centerX, m.axleY);
  ctx.rotate(m.angle);
  ctx.save();
  ctx.translate(3, 7);
  spokes(ctx, '#5d6151');
  wheelRing(ctx, '#5d6151');
  ctx.restore();
  spokes(ctx, '#576b60', '#344a40');
  const face = gradient(ctx, -160, -175, 156, 176, [
    [0, '#b7c5b5'],
    [0.23, '#84988a'],
    [0.55, '#697f71'],
    [0.82, '#8f9d87'],
    [1, '#65796c'],
  ]);
  wheelRing(ctx, face, '#3a5045');
  circle(ctx, 0, 0, rootR - 4, null, '#e8e8ce', 2.1);
  circle(ctx, 0, 0, radius - 44, null, '#344d42', 3);
  // A single pale timing stripe makes rotation visible against the stationary axle.
  ctx.save();
  ctx.rotate(-1.7);
  path(
    ctx,
    [
      [133, -7],
      [rootR - 6, -7],
      [rootR - 6, 7],
      [133, 7],
    ],
    '#eee8ce',
  );
  ctx.restore();
  for (let i = 0; i < 6; i++) {
    const a = (i * tau) / 6 - 0.14;
    circle(ctx, 116 * Math.cos(a), 116 * Math.sin(a), 4, '#2e463a', '#aab6a2', 1.5);
  }
  circle(ctx, 0, 0, 53, face, '#364a41', 4);
  ctx.restore();
}
function rack(ctx, m, isLeft) {
  const val = isLeft ? m.x : m.y;
  const px = isLeft ? leftPitch : rightPitch,
    side = isLeft ? 1 : -1;
  const start = heightOf(val),
    inner = px - side * 1.25 * moduleSize;
  const outer = px - side * 88,
    tip = px + side * moduleSize;
  const foot = pitch / 4 + 1.25 * moduleSize * Math.tan(pressure);
  const crown = pitch / 4 - moduleSize * Math.tan(pressure);
  const points = [
    [outer, -185],
    [inner, -185],
  ];
  const offset = (start + pitch / 2) % pitch;
  for (let n = -4; n < 23; n++) {
    const y = n * pitch + offset;
    points.push([inner, y - foot], [tip, y - crown], [tip, y + crown], [inner, y + foot]);
  }
  points.push([inner, 1300], [outer, 1300]);
  const fill = gradient(
    ctx,
    outer,
    0,
    tip,
    0,
    isLeft
      ? [
          [0, '#9c783e'],
          [0.12, '#d7bb77'],
          [0.29, '#e4c888'],
          [0.75, '#c99f55'],
          [1, '#ebd19a'],
        ]
      : [
          [0, '#38647a'],
          [0.14, '#6095ab'],
          [0.34, '#5f95a9'],
          [0.82, '#407487'],
          [1, '#93b5bb'],
        ],
  );
  path(ctx, points, fill, isLeft ? '#765f39' : '#2e5664', 2.3);
  path(
    ctx,
    [
      [outer + side * 9, 125],
      [outer + side * 9, 861],
    ],
    null,
    isLeft ? '#f0d796' : '#9bbbc6',
    2.1,
  );
  // These graduations move with the rack. The grey ticks on the casting stay put.
  for (let i = -19; i <= 19; i++) {
    const y = start + (i * unit) / 8;
    path(
      ctx,
      [
        [outer + side * 2, y],
        [outer + side * (i % 4 === 0 ? 30 : 14), y],
      ],
      null,
      isLeft ? '#967136' : '#325c70',
      2.2,
    );
  }
}

function fixedScale(ctx, x, dir) {
  for (let n = -6; n <= 18; n++) {
    const y = heightOf(n / 8),
      major = n % 4 === 0;
    path(
      ctx,
      [
        [x, y],
        [x + dir * (major ? 39 : 15), y],
      ],
      null,
      major ? '#667b6d' : '#a5b0a1',
      major ? 2.8 : 1.8,
    );
  }
}
function flag(ctx, x, y, side, value, color) {
  const near = x - side * 21,
    far = x - side * 171;
  path(
    ctx,
    [
      [x, y],
      [near, y - 30],
      [far, y - 30],
      [far, y + 30],
      [near, y + 30],
    ],
    color,
    '#394a3c',
    2,
  );
  path(
    ctx,
    [
      [far + side * 3, y - 27],
      [near, y - 27],
      [x - side * 3, y],
    ],
    null,
    '#fffae38a',
    1.7,
  );
  text(ctx, format(value), (near + far) / 2, y, 43, '#fff8df', 'Mono', 'center');
}
function levelLine(ctx, m) {
  if (!m.line) return;
  const x1 = leftPitch - 81,
    x2 = rightPitch + 81,
    y1 = heightOf(m.x),
    y2 = heightOf(m.y);
  const end = [x1 + (x2 - x1) * m.line, y1 + (y2 - y1) * m.line];
  ctx.save();
  path(ctx, [[x1, y1], end], null, '#35473b', 6);
  ctx.setLineDash([9, 9]);
  path(ctx, [[x1, y1], end], null, '#fff2c8', 3);
  ctx.restore();
}
function datum(ctx, m) {
  const y = heightOf(original[0]);
  ctx.save();
  ctx.globalAlpha = 0.55 + 0.45 * m.showMark;
  ctx.setLineDash([7, 6]);
  path(
    ctx,
    [
      [centerX - 93, y],
      [centerX + 93, y],
    ],
    null,
    red,
    3,
  );
  ctx.setLineDash([]);
  // Four painted arcs form a sight around the original axle position.
  circle(ctx, centerX, y, 52, null, '#fff1cd', 6);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.arc(centerX, y, 52, a + 0.1, a + Math.PI / 2 - 0.1);
    ctx.strokeStyle = red;
    ctx.lineWidth = 4.5;
    ctx.stroke();
  }
  for (const sign of [-1, 1]) {
    const x = centerX + sign * 58;
    path(
      ctx,
      [
        [x + sign * 19, y - 8],
        [x, y],
        [x + sign * 19, y + 8],
      ],
      red,
    );
  }
  ctx.restore();
}
function machine(ctx, m) {
  const top = 199,
    bottom = 837;
  text(ctx, 'x', 872, 163, 43, brass, 'Serif', 'center');
  text(ctx, 'Axle', centerX, 164, 40, ink, 'Serif', 'center');
  text(ctx, 'y', 1600, 163, 43, blue, 'Serif', 'center');
  ctx.save();
  ctx.beginPath();
  ctx.rect(663, top, 1103, bottom - top);
  ctx.clip();
  for (const x of [leftPitch - 83, rightPitch + 18]) {
    box(ctx, x - 15, top - 4, 84, bottom - top + 8, 9, '#8b9a8a');
    box(ctx, x - 9, top - 4, 72, bottom - top + 8, 8, '#5f7264');
  }
  box(ctx, centerX - 18, top + 30, 36, bottom - top - 58, 18, '#acb6a5');
  box(ctx, centerX - 11, top + 33, 22, bottom - top - 64, 11, '#62766a');
  fixedScale(ctx, leftPitch - 101, -1);
  fixedScale(ctx, rightPitch + 101, 1);
  rack(ctx, m, true);
  rack(ctx, m, false);
  wheel(ctx, m);
  datum(ctx, m);
  levelLine(ctx, m);
  flag(ctx, leftPitch - 81, heightOf(m.x), 1, m.x, brass);
  flag(ctx, rightPitch + 81, heightOf(m.y), -1, m.y, blue);
  circle(ctx, centerX, m.axleY + 3, 43, '#293e35');
  circle(ctx, centerX, m.axleY, 41, red, '#ecd5ad', 3);
  const value = format(m.output[2]);
  text(ctx, value, centerX, m.axleY, value.length > 3 ? 26 : 34, '#fff9df', 'Mono', 'center');
  ctx.restore();
  path(
    ctx,
    [
      [675, top],
      [1757, top],
    ],
    null,
    '#9aa99a',
    2,
  );
  path(
    ctx,
    [
      [675, bottom],
      [1757, bottom],
    ],
    null,
    '#f5f5e5',
    3,
  );
}

function draw(ctx, clock) {
  const m = state(clock);
  const close = 1 - m.pullback + m.close;
  const zoom = 1 + 0.43 * close;
  const aimX = 960 + 277 * close,
    aimY = 540 - 31 * close;
  ctx.save();
  ctx.translate(960, 540);
  ctx.scale(zoom, zoom);
  ctx.translate(-aimX, -aimY);
  cabinet(ctx);
  register(ctx, m);
  machine(ctx, m);
  ctx.restore();
}

function check() {
  assert.deepEqual(original, [0.5, 0.5]);
  assert.deepEqual(mechanism(...original).output, [0.5, 0.5, 0.5]);
  assert.deepEqual(mechanism(1.5, 0.5).output, [1.5, 0.5, 1]);
  assert.deepEqual(mechanism(1.5, 0).output, [1.5, 0, 0.75]);
  assert.deepEqual(mechanism(1.5, -0.5).output, [1.5, -0.5, 0.5]);
  for (const [x, y] of [
    [0.75, 0.5],
    [1.5, 0.5],
    [1.5, 0],
    [1.5, -0.5],
  ]) {
    const m = mechanism(x, y),
      initial = heightOf(original[0]);
    assert.equal(m.axleY, (heightOf(x) + heightOf(y)) / 2);
    assert.ok(Math.abs(initial - m.axleY + radius * m.angle - (x - original[0]) * unit) < 1e-8);
    assert.ok(Math.abs(initial - m.axleY - radius * m.angle - (y - original[1]) * unit) < 1e-8);
  }
}

export default { title: 'A word vector on two racks', beats, draw, check };

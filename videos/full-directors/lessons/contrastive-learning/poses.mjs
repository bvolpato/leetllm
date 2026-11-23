import { Path2D } from '@napi-rs/canvas';

// Gallop and curled poses from the approved caption-archive motion study.

const coat = '#f5e7c5';
const shadedCoat = '#a7b7ad';
const paths = new Map();
function shape(ctx, data, fill) {
  if (!paths.has(data)) paths.set(data, new Path2D(data));
  ctx.fillStyle = fill;
  ctx.fill(paths.get(data));
}
function ellipse(ctx, x, y, rx, ry, fill, rotation = 0) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, 2 * Math.PI);
  ctx.fill();
}
function line(ctx, points, color, width) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
}
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

// Each pose runs from the upper joint through the wrist or hock to the toe.
// Two offset legs on each side give the animals a four-beat gallop.
const fore = [
  [
    [39, -8],
    [58, 9],
    [96, 24],
    [110, 22],
  ],
  [
    [39, -8],
    [50, 17],
    [67, 58],
    [79, 60],
  ],
  [
    [39, -8],
    [27, 24],
    [3, 56],
    [11, 59],
  ],
  [
    [39, -8],
    [16, 14],
    [-1, 23],
    [15, 35],
  ],
  [
    [39, -8],
    [57, 7],
    [56, 25],
    [73, 25],
  ],
];
const hind = [
  [
    [-47, 0],
    [-61, 15],
    [-106, 18],
    [-121, 33],
  ],
  [
    [-47, 0],
    [-40, 26],
    [-69, 37],
    [-65, 51],
  ],
  [
    [-47, 0],
    [-13, 21],
    [-20, 48],
    [1, 58],
  ],
  [
    [-47, 0],
    [-25, 17],
    [-46, 52],
    [-37, 59],
  ],
  [
    [-47, 0],
    [-52, 16],
    [-88, 48],
    [-84, 55],
  ],
];
function joints(keys, phase) {
  const time = (phase % 1) * keys.length;
  const k = Math.floor(time);
  return keys[k].map((point, i) =>
    point.map((v, j) => mix(v, keys[(k + 1) % keys.length][i][j], smooth(time - k))),
  );
}
function leg(ctx, keys, phase, far, stout) {
  const p = joints(keys, phase);
  const widths = [stout ? 10 : 8, 6, 2.6, 2];
  const color = far ? shadedCoat : coat;
  for (let i = 0; i < 3; i++) {
    const [x, y] = p[i],
      [u, v] = p[i + 1];
    const len = Math.hypot(u - x, v - y),
      nx = (y - v) / len,
      ny = (u - x) / len;
    const a = widths[i],
      b = widths[i + 1];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + a * nx, y + a * ny);
    ctx.lineTo(u + b * nx, v + b * ny);
    ctx.lineTo(u - b * nx, v - b * ny);
    ctx.lineTo(x - a * nx, y - a * ny);
    ctx.fill();
    ellipse(ctx, x, y, a, a, color);
  }
  ellipse(ctx, p[3][0], p[3][1], 5.4, 2.8, color, -0.08);
}

export function runner(ctx, phase, puppy) {
  const rise = 6 * Math.cos(phase * 2 * Math.PI);
  ctx.save();
  ctx.translate(0, -rise);
  ctx.scale(puppy ? 0.89 : 1, puppy ? 1.06 : 1);
  leg(ctx, hind, (phase + 0.09) % 1, true, puppy);
  leg(ctx, fore, (phase + 0.12) % 1, true, puppy);

  ctx.save();
  ctx.translate(-49, -7);
  ctx.rotate((puppy ? -0.38 : -0.06) + rise * 0.011);
  shape(
    ctx,
    'M 5 -11 C -14 -18 -33 -2 -50 -11 Q -63 -16 -71 -27 Q -71 -13 -55 -5 C -35 7 -13 -2 5 4 Z',
    coat,
  );
  ctx.restore();
  leg(ctx, hind, phase, false, puppy);
  if (puppy) {
    shape(
      ctx,
      'M -67 -4 Q -70 -29 -48 -36 C -28 -41 -5 -29 15 -35 Q 34 -39 48 -47 L 60 -30 C 57 -9 48 13 30 16 Q 9 20 -9 11 Q -28 1 -43 11 Q -63 16 -67 -4 Z',
      coat,
    );
    shape(
      ctx,
      'M -63 -22 Q -56 -38 -41 -37 Q -26 -37 -29 -25 Q -34 -12 -51 -10 Q -61 -10 -63 -22 Z',
      '#395c6c',
    );
  } else {
    shape(
      ctx,
      'M -65 -2 C -67 -21 -53 -30 -30 -32 Q -8 -33 13 -37 Q 39 -42 60 -56 L 76 -41 Q 61 -28 52 -8 C 46 15 27 23 14 10 Q 0 -6 -14 -8 C -30 -9 -41 9 -51 13 Q -63 14 -65 -2 Z',
      coat,
    );
    shape(ctx, 'M -4 -29 Q 9 -32 31 -38 Q 18 -30 14 -26 Q 8 -22 -4 -20 Z', '#bcc0ac');
  }
  leg(ctx, fore, phase, false, puppy);

  ctx.save();
  ctx.translate(puppy ? 55 : 66, puppy ? -42 : -51);
  ctx.rotate(0.04 * Math.cos(phase * 2 * Math.PI));
  if (puppy) {
    shape(
      ctx,
      'M -21 -5 Q -19 -27 0 -29 Q 17 -31 24 -14 Q 30 -9 44 -10 L 45 -2 Q 40 9 25 9 Q 20 20 -1 18 L -20 16 Z',
      coat,
    );
    shape(
      ctx,
      'M -13 -23 Q -23 -31 -36 -26 Q -44 -21 -48 -18 Q -50 -13 -39 -12 Q -26 -10 -16 -3 Q -8 0 -7 -9 Z',
      '#303d49',
    );
    ellipse(ctx, 16, -14, 2.5, 3, '#203241');
    ellipse(ctx, 42, -9, 5.4, 4.0, '#263645');
  } else {
    shape(
      ctx,
      'M -21 2 Q -16 -15 -4 -16 Q 9 -18 18 -9 Q 38 -6 56 -8 L 55 -3 Q 48 3 29 4 Q 17 12 1 12 L -17 16 Z',
      coat,
    );
    shape(ctx, 'M -6 -13 L -31 -27 Q -27 -11 -13 -7 L -22 -8 Q -20 -2 -9 0 Z', '#bac3b3');
    ellipse(ctx, 13, -8, 2.2, 2.3, '#203241');
    ellipse(ctx, 54, -7, 4.8, 2.7, '#263645');
  }
  ctx.restore();
  ctx.restore();
}

export function sleeping(ctx, time) {
  const breath = Math.sin(time * 2) * 0.014;
  ctx.save();
  ctx.scale(1, 1 + breath);
  shape(
    ctx,
    'M -107 -7 Q -114 -37 -89 -59 C -67 -82 -15 -78 12 -63 Q 37 -56 48 -37 L 62 -12 Q 53 2 27 2 L -79 2 Q -98 2 -107 -7 Z',
    coat,
  );
  shape(
    ctx,
    'M -100 -48 Q -78 -81 -43 -73 C -47 -54 -68 -56 -64 -40 Q -74 -26 -91 -33 Z',
    '#527381',
  );
  shape(
    ctx,
    'M -97 -32 Q -89 -5 -53 -7 Q -36 -6 -19 -16 Q -17 -6 -30 -1 Q -77 16 -100 0 Q -113 -9 -109 -25 Z',
    shadedCoat,
  );
  ctx.restore();
  shape(ctx, 'M -6 -19 Q 27 -25 63 -13 Q 90 -11 93 -5 Q 95 2 83 2 L 33 2 Q 6 0 -6 -9 Z', '#bdc4b5');
  shape(
    ctx,
    'M 10 -41 Q 29 -67 53 -57 Q 69 -53 74 -34 Q 81 -24 105 -20 Q 112 -18 111 -13 Q 106 -1 84 -3 L 51 -7 Q 33 1 16 -7 Q 1 -17 10 -41 Z',
    coat,
  );
  shape(
    ctx,
    'M 31 -55 Q 11 -54 5 -34 C -5 -11 6 -1 20 -7 Q 32 -11 35 -27 Q 37 -41 31 -55 Z',
    '#344e60',
  );
  line(
    ctx,
    [
      [60, -32],
      [64, -29],
      [70, -30],
    ],
    '#283948',
    2.2,
  );
  ellipse(ctx, 106, -19, 6, 4, '#213747');
  line(
    ctx,
    [
      [87, -9],
      [95, -9],
      [100, -11],
    ],
    '#879b99',
    1.5,
  );
}

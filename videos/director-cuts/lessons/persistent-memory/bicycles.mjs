// The two catalog photographs share a lens, a seamless backdrop and a tire contact line.
export const wheel = { rear: -307, front: 307, axle: 126, radius: 166 };

function path(ctx, points, color, width) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const p of points.slice(1)) {
    if (p.length === 2) ctx.lineTo(...p);
    else ctx.bezierCurveTo(...p);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function oval(ctx, x, y, rx, ry, color) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function ring(ctx, x, y, radius, color, width) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function tube(ctx, points, paint, width) {
  path(ctx, points, paint.rim, width + 2.5);
  path(ctx, points, paint.base, width);
  ctx.save();
  ctx.translate(-1, -width * 0.18);
  path(ctx, points, paint.light, width * 0.22);
  ctx.restore();
}

const chrome = { rim: '#59575c', base: '#a2a6b4', light: '#fff7ed' };
const paints = [
  { rim: '#742f27', base: '#dd592c', light: '#ffad6f' },
  { rim: '#133458', base: '#305a98', light: '#8ab6da' },
];

function wheelAt(ctx, x, city) {
  const { axle: y, radius: r } = wheel;
  ring(ctx, x, y, r - 6, '#25252e', 12);
  ring(ctx, x, y, r - 12, city ? '#d6af72' : '#c99562', 8);
  ring(ctx, x, y, r - 18, '#595768', 5);
  ring(ctx, x, y, r - 21, '#e0e0e6', 2);
  const spokeR = r - 22;
  for (let i = 0; i < 36; i++) {
    const rimAngle = (i * Math.PI) / 18;
    const hubAngle = rimAngle + (i % 2 === 0 ? 1.12 : -1.12);
    path(
      ctx,
      [
        [x + 9 * Math.cos(hubAngle), y + 9 * Math.sin(hubAngle)],
        [x + spokeR * Math.cos(rimAngle), y + spokeR * Math.sin(rimAngle)],
      ],
      i % 2 ? '#8d8c9a' : '#767588',
      1.8,
    );
  }
  path(
    ctx,
    [
      [x + 90, y - 110],
      [x + 95, y - 117],
    ],
    '#585563',
    4,
  );
  oval(ctx, x, y, 12, 12, '#343845');
  oval(ctx, x - 1, y - 1, 6, 6, '#c7c6cc');
}

function mudguard(ctx, x, start, end, paint) {
  for (const [color, width] of [
    [paint.rim, 9],
    [paint.light, 4],
  ]) {
    ctx.beginPath();
    ctx.arc(x, wheel.axle, wheel.radius + 10, start, end);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function drivetrain(ctx, crank, rear, city) {
  const [x, y] = crank;
  oval(ctx, ...rear, 23, 23, '#4c4c56');
  ring(ctx, ...rear, 17, '#aaa6a8', 2.5);
  ring(ctx, x, y, 42, '#4b4850', 7);
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5 + 0.21;
    path(
      ctx,
      [
        [x, y],
        [x + Math.cos(a) * 38, y + Math.sin(a) * 38],
      ],
      '#86838a',
      7,
    );
  }
  const chain = [
    [rear[0], rear[1] - 19],
    [x, y - 44],
    [x + 60, y - 42, x + 62, y + 42, x, y + 44],
    [rear[0], rear[1] + 20],
    [rear[0] - 27, rear[1] + 20, rear[0] - 26, rear[1] - 21, rear[0], rear[1] - 19],
  ];
  path(ctx, chain, '#393940', 4);
  ctx.setLineDash([2, 4]);
  path(ctx, chain, '#b9b2ab', 2);
  ctx.setLineDash([]);
  if (city) {
    ctx.fillStyle = '#ccc3a5';
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 49);
    ctx.bezierCurveTo(x + 33, y - 50, x + 58, y - 18, x + 47, y + 13);
    ctx.bezierCurveTo(x + 18, y - 25, x - 2, y - 26, x - 24, y - 28);
    ctx.lineTo(rear[0], rear[1] - 12);
    ctx.lineTo(rear[0], rear[1] - 25);
    ctx.closePath();
    ctx.fill();
  }
  tube(
    ctx,
    [
      [x, y],
      [x + 42, y + 41],
    ],
    chrome,
    9,
  );
  oval(ctx, x, y, 8, 8, '#dedbda');
  path(
    ctx,
    [
      [x + 24, y + 42],
      [x + 64, y + 42],
    ],
    '#30323a',
    8,
  );
  path(
    ctx,
    [
      [x + 39, y + 43],
      [x + 54, y + 43],
    ],
    '#f7b253',
    3,
  );
}

function saddle(ctx, seat, city) {
  const [x, y] = seat;
  tube(
    ctx,
    [
      [x, y],
      [x - 16, y - 59],
    ],
    chrome,
    12,
  );
  path(
    ctx,
    [
      [x - 39, y - 68],
      [x - 26, y - 51],
      [x - 9, y - 51],
      [x + 9, y - 67],
    ],
    '#777077',
    4,
  );
  ctx.beginPath();
  ctx.moveTo(x - 57, y - 81);
  ctx.bezierCurveTo(x - 45, y - 88, x - 24, y - 76, x - 9, y - 76);
  ctx.bezierCurveTo(x + 4, y - 75, x + 29, y - 80, x + 33, y - 72);
  ctx.bezierCurveTo(x + 30, y - 63, x + 16, y - 64, x + 4, y - 64);
  ctx.bezierCurveTo(x - 18, y - 64, x - 54, y - 52, x - 57, y - 73);
  ctx.closePath();
  ctx.fillStyle = city ? '#7a4633' : '#39333a';
  ctx.fill();
  path(
    ctx,
    [
      [x - 49, y - 79],
      [x - 34, y - 82, x - 25, y - 72, x - 15, y - 73],
    ],
    city ? '#b77b50' : '#70636a',
    3,
  );
}

function bars(ctx, head, city) {
  const [x, y] = head;
  tube(
    ctx,
    [
      [x, y],
      [x - 9, y - 40],
      [x + 38, y - 52],
    ],
    chrome,
    13,
  );
  if (city) {
    tube(
      ctx,
      [
        [x + 38, y - 52],
        [x + 54, y - 84, x + 54, y - 93, x + 34, y - 91],
        [x - 18, y - 80],
      ],
      chrome,
      10,
    );
    path(
      ctx,
      [
        [x + 2, y - 84],
        [x - 25, y - 78],
      ],
      '#69402f',
      14,
    );
    path(
      ctx,
      [
        [x + 8, y - 74],
        [x + 26, y - 64],
      ],
      '#56515a',
      5,
    );
  } else {
    tube(
      ctx,
      [
        [x + 38, y - 52],
        [x + 72, y - 62, x + 100, y - 53, x + 98, y - 29],
        [x + 97, y + 1, x + 77, y + 6, x + 52, y + 6],
      ],
      chrome,
      13,
    );
    path(
      ctx,
      [
        [x + 73, y - 53],
        [x + 105, y - 56, x + 114, y + 6, x + 57, y + 7],
      ],
      '#322e36',
      15,
    );
    path(
      ctx,
      [
        [x + 75, y - 56],
        [x + 83, y - 70],
        [x + 97, y - 66],
        [x + 101, y - 36],
      ],
      '#50454b',
      9,
    );
  }
  path(
    ctx,
    [
      [x + 38, y - 49],
      [x + 108, y - 42, x + 92, y + 31, x + 35, y + 97],
    ],
    '#4c4755',
    2.5,
  );
}

function bike(ctx, city) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const paint = paints[Number(city)];
  const rear = [wheel.rear, wheel.axle],
    front = [wheel.front, wheel.axle];
  const crank = [-42, 150],
    seat = [-125, city ? -89 : -129];
  const head = [city ? 174 : 160, city ? -142 : -158],
    fork = [head[0] + 19, head[1] + 74];
  wheelAt(ctx, wheel.rear, city);
  wheelAt(ctx, wheel.front, city);
  if (city) {
    mudguard(ctx, wheel.rear, 1.08 * Math.PI, 1.93 * Math.PI, chrome);
    mudguard(ctx, wheel.front, 1.02 * Math.PI, 1.82 * Math.PI, chrome);
    path(
      ctx,
      [
        [-451, -28],
        [-393, -47],
        [-244, -47],
      ],
      chrome.rim,
      7,
    );
    path(ctx, [[-444, -30], rear, [-252, -44]], chrome.rim, 4);
    path(
      ctx,
      [
        [-445, -29],
        [-390, -44],
        [-249, -44],
      ],
      chrome.light,
      2,
    );
  }
  tube(ctx, [rear, seat], paint, 9);
  tube(ctx, [rear, crank], paint, 12);
  tube(ctx, [crank, seat], paint, 17);
  tube(ctx, [crank, fork], paint, city ? 22 : 20);
  if (city) {
    tube(
      ctx,
      [
        [seat[0] + 30, seat[1] + 99],
        [22, 35, 100, -25, head[0] + 8, head[1] + 23],
      ],
      paint,
      16,
    );
  } else {
    tube(ctx, [seat, head], paint, 18);
  }
  tube(ctx, [head, fork], paint, 25);
  tube(ctx, [fork, [fork[0] + 52, 67, front[0] - 42, 121, ...front]], paint, 13);
  saddle(ctx, seat, city);
  bars(ctx, head, city);
  drivetrain(ctx, crank, rear, city);

  // A contrasting band follows the down tube as it would on an enamel frame.
  ctx.save();
  ctx.translate(...crank);
  const tubeAngle = Math.atan2(fork[1] - crank[1], fork[0] - crank[0]);
  ctx.rotate(tubeAngle);
  ctx.fillStyle = city ? '#bed6dc' : '#ffdc9e';
  ctx.fillRect(141, -9, 60, 18);
  ctx.fillRect(133, -9, 3, 18);
  ctx.restore();
  oval(ctx, ...front, 6, 6, '#dbdbe1');
}

export function paintPhoto(ctx, bounds, center, scale, city) {
  const { x, y, width, height } = bounds;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  const wall = ctx.createLinearGradient(x, y, x + width * 0.42, y + height);
  wall.addColorStop(0, '#b9badc');
  wall.addColorStop(0.5, '#e7dfed');
  wall.addColorStop(0.75, '#d3cddd');
  wall.addColorStop(1, '#b4b0cb');
  ctx.fillStyle = wall;
  ctx.fillRect(x, y, width, height);
  ctx.translate(center.x, center.y);
  ctx.scale(scale, scale);
  // Diffuse window light across the sweep, with a sharper shadow at each contact patch.
  const light = ctx.createRadialGradient(-206, -250, 0, -206, -250, 665);
  light.addColorStop(0, 'rgba(255,241,216,0.5)');
  light.addColorStop(1, 'rgba(255,242,216,0)');
  ctx.fillStyle = light;
  ctx.fillRect(-900, -800, 1800, 1600);
  for (const [sx, sy, rx, ry, alpha] of [
    [0, 297, 522, 29, 0.22],
    [-307, 291, 106, 8, 0.45],
    [307, 291, 106, 8, 0.45],
  ]) {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(rx, ry);
    const blur = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    blur.addColorStop(0, `rgba(58,48,78,${alpha})`);
    blur.addColorStop(1, 'rgba(58,48,78,0)');
    oval(ctx, 0, 0, 1, 1, blur);
    ctx.restore();
  }
  bike(ctx, city);
  ctx.restore();
}

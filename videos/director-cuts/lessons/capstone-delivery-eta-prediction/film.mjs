import assert from 'node:assert/strict';
import { estimate, noonOrder } from '../../../films/capstone-delivery-eta-prediction/shipment.mjs';

const { pickup, snapshot } = noonOrder;
// The four East-7 expedited trips eligible at the noon snapshot.
const durations = [8, 10, 12, 14];
const totalHours = estimate(pickup, durations).median;
const hoursUsed = snapshot - pickup;
const hoursLeft = totalHours - hoursUsed;
const unit = 125;
const width = 1920;
const height = 1080;

const beats = [
  {
    id: 'out-of-the-depot',
    say: "There goes the East Seven van. It picked up our parcel at ten this morning. By noon it's two hours into the trip. What time should tracking show for delivery?",
    hold: 1.0,
  },
  {
    id: 'from-pickup',
    say: "At noon we have four completed trips to go by. Same route, same service, and each van was still traveling two hours after pickup. The trips took eight, ten, twelve and fourteen hours from pickup to delivery. Halfway between the middle two is eleven. That's our estimate for the whole trip.",
    hold: 0.9,
  },
  {
    id: 'move-the-depot',
    say: 'Each panel is one hour. Try starting all eleven at noon, when we check tracking. Keep your eye on the little house at the other end.',
    hold: 1.25,
  },
  {
    id: 'two-red-roofs',
    say: 'Eleven tonight. See the red depot twice? The van already covered those first two hours. We counted them again when we laid the whole trip after noon.',
    hold: 1.0,
  },
  {
    id: 'tuck-the-fold',
    say: "Leave the van where it is. Fold those two hours out of the estimate we're adding at noon. Watch where the house lands.",
    hold: 1.4,
  },
  {
    id: 'the-same-door',
    say: "Nine tonight. From the ten o'clock pickup, that's eleven hours. From noon, the same estimate has nine hours left.",
    hold: 3.0,
  },
];

const c = {
  ink: '#263849',
  muted: '#425866',
  paper: '#fff0cd',
  rim: '#fff5db',
  brick: '#bf4331',
  darkBrick: '#7e382e',
  cream: '#f9deaa',
  blue: '#42647d',
  violet: '#424d70',
  road: '#4e5b65',
  lamp: '#ffcc5e',
  green: '#48716b',
};
const clip01 = (x) => Math.max(0, Math.min(1, x));
function ease(x) {
  const v = clip01(x);
  return v * v * (3 - 2 * v);
}
function polygon(ctx, points, color) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function ellipse(ctx, x, y, rx, ry, color) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
function line(ctx, x1, y1, x2, y2, color, weight = 2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = weight;
  ctx.stroke();
}
function type(ctx, words, x, y, size, color, family = 'Sans', weight = '400', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(words, x, y);
}

// The print stays registered to its panel. All positions below use the panel's bottom edge.
const sky = [
  '#fcdea9',
  '#fbdca7',
  '#f9d7a9',
  '#f8ceaa',
  '#f3c6ab',
  '#e8bdad',
  '#dfb8b5',
  '#ccadc0',
  '#b6a8c1',
  '#a09cbc',
  '#8991ae',
];
function depot(ctx, part) {
  ctx.save();
  ctx.translate(-part * unit, 0);
  rect(ctx, 17, -224, 218, 144, c.brick);
  const roof = [
    [12, -222],
    [12, -242],
    [70, -270],
    [70, -242],
    [129, -270],
    [129, -242],
    [188, -270],
    [188, -242],
    [236, -264],
    [236, -222],
  ];
  polygon(ctx, roof, c.darkBrick);
  for (let x = 27; x < 225; x += 31) {
    rect(ctx, x, -215, 22, 25, '#f2bb85');
    rect(ctx, x + 10, -215, 2, 25, c.darkBrick);
    line(ctx, x, -202, x + 22, -202, c.darkBrick);
  }
  for (const x of [24, 86, 148]) {
    rect(ctx, x, -163, 49, 81, c.darkBrick);
    rect(ctx, x + 3, -160, 43, 57, '#cf9671');
    for (let y = -154; y < -104; y += 7) line(ctx, x + 3, y, x + 46, y, '#ac7059', 1.4);
    rect(ctx, x + 3, -100, 43, 16, '#403f47');
  }
  rect(ctx, 204, -151, 22, 69, '#733d33');
  rect(ctx, 207, -145, 16, 22, '#edb47e');
  rect(ctx, 10, -180, 229, 7, c.cream);
  rect(ctx, 17, -172, 218, 4, '#98503c');
  // A parcel on the loading dock gives the van a place to come from.
  rect(ctx, 6, -103, 22, 20, '#dfac64');
  rect(ctx, 14, -103, 5, 11, '#f3d393');
  rect(ctx, 0, -84, unit * 2, 9, '#cbb799');
  ctx.restore();
}
function trees(ctx, count, base, tone, offset = 0) {
  for (let i = 0; i < count; i++) {
    const x = 8 + i * 43 + offset;
    const h = [62, 88, 54, 72][i % 4];
    rect(ctx, x - 2, base - h + 8, 4, h - 8, '#62574d');
    ellipse(ctx, x, base - h * 0.76, 17, h * 0.48, tone);
    line(ctx, x, base - h * 0.93, x, base - 12, '#576861', 1.5);
  }
}
function viaduct(ctx, part) {
  ctx.save();
  ctx.translate(-part * unit, 0);
  polygon(
    ctx,
    [
      [0, -170],
      [62, -192],
      [118, -172],
      [194, -200],
      [250, -188],
      [250, -77],
      [0, -77],
    ],
    '#b1b5a0',
  );
  // Bridge arches are cut from the silhouette so the riverbank shows through.
  ctx.beginPath();
  ctx.moveTo(-1, -187);
  ctx.lineTo(251, -187);
  ctx.lineTo(251, -78);
  for (let x = 245; x > 0; x -= 50) {
    ctx.lineTo(x, -78);
    ctx.lineTo(x, -124);
    ctx.bezierCurveTo(x, -163, x - 39, -163, x - 39, -124);
    ctx.lineTo(x - 39, -78);
  }
  ctx.lineTo(-1, -78);
  ctx.closePath();
  ctx.fillStyle = '#8a797b';
  ctx.fill();
  rect(ctx, 0, -191, 250, 8, '#665f67');
  for (let x = 2; x < 250; x += 15) rect(ctx, x, -210, 2, 18, '#665f67');
  rect(ctx, 0, -210, 250, 3, '#665f67');
  ctx.restore();
}
function waterTower(ctx) {
  for (const [x1, x2] of [
    [41, 30],
    [81, 91],
  ])
    line(ctx, x1, -220, x2, -83, c.violet, 5);
  line(ctx, 39, -191, 86, -120, c.violet, 3);
  line(ctx, 82, -191, 34, -120, c.violet, 3);
  rect(ctx, 33, -268, 57, 46, '#567584');
  ellipse(ctx, 61.5, -223, 28.5, 6, '#506d79');
  for (let x = 39; x < 90; x += 7) line(ctx, x, -265, x, -224, '#73919a', 1.4);
  polygon(
    ctx,
    [
      [28, -269],
      [61, -289],
      [95, -269],
    ],
    c.violet,
  );
  line(ctx, 61, -289, 61, -297, c.violet, 2.5);
}
function shop(ctx) {
  rect(ctx, 10, -200, 107, 118, '#caa072');
  rect(ctx, 5, -206, 116, 8, '#866757');
  for (const x of [23, 58, 92]) {
    rect(ctx, x, -185, 18, 23, '#665f65');
    rect(ctx, x + 3, -183, 6, 18, '#d7bf95');
  }
  rect(ctx, 22, -133, 60, 46, '#4b6570');
  rect(ctx, 88, -134, 18, 51, '#566068');
  for (let i = 0; i < 8; i++)
    polygon(
      ctx,
      [
        [17 + i * 12, -153],
        [29 + i * 12, -153],
        [32 + i * 12, -133],
        [20 + i * 12, -133],
      ],
      i % 2 ? '#668982' : '#f5deb1',
    );
}
function house(ctx, part) {
  // The last warm doorway is the moving end of the ETA.
  ctx.save();
  ctx.translate(-part * unit, 0);
  trees(ctx, 1, -79, '#536c71', 2);
  polygon(
    ctx,
    [
      [47, -82],
      [47, -218],
      [116, -276],
      [228, -239],
      [245, -209],
      [245, -82],
    ],
    '#415970',
  );
  polygon(
    ctx,
    [
      [37, -215],
      [112, -287],
      [161, -232],
      [162, -219],
      [112, -273],
      [43, -206],
    ],
    c.ink,
  );
  polygon(
    ctx,
    [
      [112, -287],
      [209, -275],
      [248, -220],
      [161, -230],
    ],
    '#576079',
  );
  polygon(
    ctx,
    [
      [191, -272],
      [191, -297],
      [207, -297],
      [207, -269],
    ],
    c.ink,
  );
  rect(ctx, 187, -301, 23, 7, '#343b52');
  for (let j = 0; j < 4; j++)
    line(ctx, 132 + 7 * j, -272 + j * 10, 206 + 8 * j, -263 + j * 10, '#6f7183', 2);
  ellipse(ctx, 110, -245, 9, 10, '#d7c49c');
  for (const x of [67, 102, 139, 195]) {
    rect(ctx, x, -205, 20, 34, '#293d52');
    rect(ctx, x + 3, -202, 14, 27, '#aeb5b3');
    rect(ctx, x + 9, -202, 2, 27, '#5b6873');
    rect(ctx, x - 2, -173, 24, 4, '#c0ada0');
  }
  rect(ctx, 62, -141, 70, 38, '#24374b');
  for (const x of [67, 90, 113]) rect(ctx, x, -137, 15, 28, '#91a6ad');
  polygon(
    ctx,
    [
      [153, -157],
      [225, -171],
      [250, -152],
      [250, -146],
      [151, -150],
    ],
    '#293a4f',
  );
  rect(ctx, 162, -150, 4, 63, '#c5bba7');
  rect(ctx, 237, -148, 4, 64, '#c5bba7');
  rect(ctx, 187, -147, 41, 63, '#25384b');
  ctx.fillStyle = c.lamp;
  ctx.beginPath();
  ctx.roundRect(192, -144, 31, 63, [13, 13, 0, 0]);
  ctx.fill();
  rect(ctx, 197, -130, 20, 20, '#fff1bc');
  ellipse(ctx, 218, -105, 2, 2, c.ink);
  rect(ctx, 174, -87, 71, 6, '#d4bfa3');
  rect(ctx, 167, -81, 83, 5, '#e5d0af');
  ctx.restore();
}
function printPanel(ctx, i) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, -358, unit, 358);
  ctx.clip();
  rect(ctx, 0, -358, unit, 358, c.paper);
  rect(ctx, 0, -350, unit, 273, sky[i]);
  // A low two-color horizon unites the separate blocks of the print.
  const ridge = (n) => -160 + 14 * Math.sin(n * 0.51);
  polygon(
    ctx,
    [
      [0, ridge(i)],
      [unit, ridge(i + 1)],
      [unit, -76],
      [0, -76],
    ],
    '#bbb1a3',
  );
  if (i === 0) ellipse(ctx, 37, -302, 18, 18, '#fff2bd');
  if (i === 10) {
    ellipse(ctx, 84, -309, 14, 14, '#f7e5bd');
    ellipse(ctx, 90, -316, 13, 13, sky[i]);
  }
  for (let j = 0; j < 5; j++) {
    const x = j * 28 - 4,
      y = -184 - 12 * Math.sin(i * 3 + j * 2);
    rect(ctx, x, y, 24, -76 - y, i > 6 ? '#8b92a1' : '#c9b39e');
  }
  if (i < 2) depot(ctx, i);
  else if (i < 4) viaduct(ctx, i - 2);
  else if (i === 4) {
    trees(ctx, 3, -83, '#879886');
    waterTower(ctx);
  } else if (i === 5 || i === 6) {
    polygon(
      ctx,
      [
        [0, -126],
        [unit, -160],
        [unit, -74],
        [0, -74],
      ],
      '#99a187',
    );
    trees(ctx, 3, -79, i === 5 ? '#668a79' : '#6f827c', i === 5 ? 0 : 10);
  } else if (i === 7) shop(ctx);
  else if (i === 8) {
    rect(ctx, 18, -236, 94, 159, '#9c8b8d');
    rect(ctx, 13, -244, 104, 8, '#726b79');
    for (let x = 28; x < 110; x += 26)
      for (let y = -222; y < -100; y += 37) {
        rect(ctx, x, y, 16, 21, '#545f72');
        rect(ctx, x + 2, y + 2, 6, 17, '#c8b7a0');
      }
  } else house(ctx, i - 9);
  rect(ctx, 0, -76, unit, 7, '#f0d6b4');
  rect(ctx, 0, -69, unit, 45, c.road);
  rect(ctx, 17, -45, 32, 2.8, '#dfc99e');
  rect(ctx, 80, -45, 32, 2.8, '#dfc99e');
  rect(ctx, 0, -24, unit, 24, '#fae4ba');
  for (let x = 9; x < unit; x += 13) line(ctx, x, -15, x + 4, -19, '#ccad86', 1.3);
  ctx.restore();
}

// Project two hinged pages toward their shared crease. At a right angle they
// consume no time on the horizontal clock. The far pages translate with them.
function panels(start, fold) {
  let x = (start - pickup) * unit;
  const angle = (ease(fold) * Math.PI) / 2;
  const result = [];
  for (let i = 0; i < totalHours; i++) {
    const folding = i < hoursUsed;
    const span = unit * (folding ? Math.cos(angle) : 1);
    const lift = 10 + (folding ? Math.sin(angle) * 80 : 0);
    const left = i % 2 ? -lift : 0;
    const right = i % 2 ? 0 : -lift;
    result.push({ i, x, span, left, right });
    x += span;
  }
  return { leaves: result, endHour: pickup + x / unit };
}
function paintLeaf(ctx, leaf) {
  const { x, i, span, left, right } = leaf;
  if (span < 0.1) return;
  ctx.save();
  ctx.transform(span / unit, (right - left) / unit, 0, 1, x, left);
  printPanel(ctx, i);
  const shade = ctx.createLinearGradient(0, 0, unit, 0);
  shade.addColorStop(0, i % 2 ? 'rgba(65,37,48,.15)' : 'rgba(255,251,214,.15)');
  shade.addColorStop(0.85, i % 2 ? 'rgba(89,60,66,.015)' : 'rgba(88,61,58,.035)');
  shade.addColorStop(1, 'rgba(69,50,64,.11)');
  rect(ctx, 0, -358, unit, 358, shade);
  line(ctx, 0, -356, 0, -1, 'rgba(255,248,218,.58)', 2);
  line(ctx, unit - 1, -357, unit - 1, -1, 'rgba(77,59,59,.21)', 1.2);
  ctx.restore();
}
function van(ctx, x, spin) {
  ctx.save();
  ctx.translate(x, -72);
  ellipse(ctx, 0, 14, 51, 7, 'rgba(28,36,47,.22)');
  polygon(
    ctx,
    [
      [-54, -41],
      [-50, -47],
      [11, -47],
      [12, -37],
      [33, -37],
      [51, -15],
      [56, -11],
      [56, 6],
      [-54, 6],
    ],
    '#283d50',
  );
  polygon(
    ctx,
    [
      [-50, -39],
      [-47, -43],
      [11, -43],
      [11, -31],
      [33, -31],
      [46, -12],
      [52, -8],
      [52, 0],
      [-50, 0],
    ],
    '#f5b847',
  );
  polygon(
    ctx,
    [
      [17, -32],
      [31, -32],
      [43, -15],
      [17, -15],
    ],
    '#dae3da',
  );
  rect(ctx, -49, -12, 64, 4, '#fcf2cb');
  polygon(
    ctx,
    [
      [-36, -31],
      [-22, -33],
      [-10, -28],
      [-24, -25],
    ],
    '#fff2c8',
  );
  polygon(
    ctx,
    [
      [-36, -29],
      [-25, -23],
      [-25, -16],
      [-36, -22],
    ],
    '#f9e4ab',
  );
  polygon(
    ctx,
    [
      [-23, -23],
      [-11, -27],
      [-11, -20],
      [-23, -16],
    ],
    '#fff7da',
  );
  rect(ctx, 48, -9, 6, 4, c.rim);
  rect(ctx, -54, -8, 5, 5, c.brick);
  for (const wx of [-31, 35]) {
    ellipse(ctx, wx, 4, 12, 12, c.ink);
    ellipse(ctx, wx, 4, 6, 6, '#c5b79b');
    line(ctx, wx, 4, wx + 4 * Math.cos(spin), 4 + 4 * Math.sin(spin), c.ink, 1.5);
  }
  ctx.restore();
}

const paperSpecks = Array.from({ length: 380 }, (_, i) => ({
  x: (i * 769) % 1927,
  y: (i * 421) % 1087,
  length: 1 + (i % 5),
}));
function table(ctx) {
  const wash = ctx.createLinearGradient(0, 0, width * 0.8, height);
  wash.addColorStop(0, '#e5f0e8');
  wash.addColorStop(0.65, '#d9e5de');
  wash.addColorStop(1, '#c1d5ce');
  rect(ctx, 0, 0, width, height, wash);
  for (const f of paperSpecks) rect(ctx, f.x, f.y, f.length, 1.5, 'rgba(47,83,82,.08)');
}
function sheetShadow(ctx, x, w, y = 0) {
  ctx.save();
  const shade = ctx.createLinearGradient(0, y - 2, 0, y + 27);
  shade.addColorStop(0, 'rgba(51,58,58,.28)');
  shade.addColorStop(0.45, 'rgba(51,58,58,.12)');
  shade.addColorStop(1, 'rgba(51,58,58,0)');
  polygon(
    ctx,
    [
      [x, y - 2],
      [x + w, y - 2],
      [x + w + 12, y + 27],
      [x + 11, y + 27],
    ],
    shade,
  );
  ctx.restore();
}
function state(clock) {
  const { index, elapsed, reveal } = clock;
  const travel = index === 0 ? ease(elapsed / 4.0) : 1;
  const wide = index === 0 ? 0 : index === 1 ? ease(elapsed / 2.8) : 1;
  const move = index < 2 ? 0 : index === 2 ? ease(reveal('Try starting', 2.15)) : 1;
  const fold = index < 4 ? 0 : index === 4 ? ease(reveal('Fold those two hours', 2.5)) : 1;
  const route = panels(pickup + hoursUsed * move, fold);
  return { travel, wide, move, fold, route };
}
function meridiem(hour) {
  if (hour === 12) return 'Noon';
  return (hour % 12 || 12) + (hour < 12 ? ' AM' : ' PM');
}
function clockMarks(ctx, zoom, showEvening, end, base) {
  line(ctx, 0, base, unit * 13, base, '#899c96', 2);
  for (let i = 0; i <= 13; i++) {
    const hour = pickup + i;
    const important =
      hour === pickup ||
      hour === snapshot ||
      (showEvening && (hour === pickup + totalHours || hour === snapshot + totalHours));
    line(
      ctx,
      i * unit,
      base - 8,
      i * unit,
      base + (important ? 17 : 6),
      important ? c.ink : '#899c96',
      important ? 3 : 1.8,
    );
    if (important) {
      const evening = hour > snapshot,
        active = evening && Math.abs(hour - end) < 0.025;
      type(
        ctx,
        meridiem(hour),
        i * unit,
        base + (evening ? 75 : 62) / Math.sqrt(zoom),
        (active ? 66 : 42) / Math.sqrt(zoom),
        active ? c.ink : evening ? c.muted : c.ink,
        'Sans',
        active ? '700' : '600',
        'center',
      );
    }
  }
}
function measure(ctx, x1, x2, y, text, color) {
  line(ctx, x1, y, x2, y, color, 3);
  line(ctx, x1, y + 2, x1, y - 12, color, 3);
  line(ctx, x2, y + 2, x2, y - 12, color, 3);
  type(ctx, text, (x1 + x2) / 2, y + 51, 41, color, 'Sans', '600', 'center');
}
function history(ctx, clock) {
  if (clock.index !== 1) return;
  ctx.save();
  ctx.globalAlpha = ease(clock.elapsed / 0.75);
  type(ctx, 'Completed trips · hours from pickup', 1097, 86, 38, c.muted);
  const center = ease(clock.reveal('the middle two'));
  const xs = [1145, 1330, 1509, 1694];
  durations.forEach((d, i) => {
    const middle = i === 1 || i === 2;
    type(ctx, String(d), xs[i], 171, 77, middle ? c.ink : c.muted, 'Serif', '400', 'center');
  });
  ctx.globalAlpha *= center;
  line(ctx, xs[1], 188, xs[2], 188, c.ink, 3);
  line(ctx, xs[1], 179, xs[1], 188, c.ink, 3);
  line(ctx, xs[2], 179, xs[2], 188, c.ink, 3);
  type(ctx, totalHours + ' h total', (xs[1] + xs[2]) / 2, 237, 35, c.ink, 'Sans', '600', 'center');
  ctx.restore();
}
function draw(ctx, clock) {
  const { index } = clock;
  const { travel, wide, route } = state(clock);
  table(ctx);
  type(ctx, 'East 7', 105, 133, 99, c.ink, 'Serif', 'italic');
  type(ctx, 'Expedited parcel', 109, 191, 37, c.muted);
  history(ctx, clock);
  const zoom = 1.55 - 0.55 * wide;
  ctx.save();
  ctx.translate(160 - 18 * wide, 798 - 101 * wide);
  ctx.scale(zoom, zoom);
  const end = (route.endHour - pickup) * unit;
  sheetShadow(ctx, 0, end);
  ctx.save();
  ctx.scale(1, 1 + 0.2 * wide);
  // The first two hours stay printed on the dispatch copy underneath the moving strip.
  route.leaves
    .slice(0, hoursUsed)
    .forEach((leaf, i) =>
      paintLeaf(ctx, {
        ...leaf,
        x: i * unit,
        span: unit,
        left: i % 2 ? -10 : 0,
        right: i % 2 ? 0 : -10,
      }),
    );
  route.leaves.forEach((leaf) => paintLeaf(ctx, leaf));
  const vanX = travel * hoursUsed * unit;
  van(ctx, vanX, (travel * hoursUsed * unit) / 12);
  ctx.restore();

  // Two matching red underlines pick out the repeated depot in the trial estimate.
  if (index === 3) {
    const show = ease(clock.reveal('See the red depot', 0.6));
    ctx.save();
    ctx.globalAlpha = show;
    for (let i = 0; i < 2; i++) {
      const x = i * hoursUsed * unit;
      line(ctx, x + 10, 14, x + hoursUsed * unit - 10, 14, c.brick, 6);
    }
    ctx.restore();
  }
  const axisY = 42 + 38 * wide;
  clockMarks(ctx, zoom, index >= 2, route.endHour, axisY);
  // The tip keeps the house registered to an hour while the map is in motion.
  if (index >= 2) {
    polygon(
      ctx,
      [
        [end - 12, -3],
        [end + 12, -3],
        [end + 12, 17],
        [end, 33],
        [end - 12, 17],
      ],
      c.ink,
    );
    line(ctx, end, 32, end, 78, c.ink, 3);
  }
  if (index === 0) {
    line(ctx, 0, axisY, vanX, axisY, c.darkBrick, 5);
    ellipse(ctx, vanX, axisY, 4, 4, c.darkBrick);
  }
  if (index === 5) {
    measure(ctx, 0, hoursUsed * unit, 193, hoursUsed + ' h traveled', c.darkBrick);
    measure(ctx, hoursUsed * unit + 3, end, 193, hoursLeft + ' h left', c.ink);
  }
  ctx.restore();
}

function check() {
  const summary = estimate(pickup, durations);
  assert.equal(summary.median, 11);
  assert.equal(summary.arrival, '21:00');
  assert.equal(hoursUsed, 2);
  assert.equal(hoursLeft, 9);
  const allFromPickup = panels(pickup, 0);
  const allFromNoon = panels(snapshot, 0);
  const unusedFromNoon = panels(snapshot, 1);
  assert.equal(allFromPickup.endHour, 21);
  assert.equal(allFromNoon.endHour, 23);
  assert.equal(allFromNoon.endHour - allFromPickup.endHour, hoursUsed);
  assert.equal(unusedFromNoon.endHour, allFromPickup.endHour);
  assert.equal(unusedFromNoon.leaves.filter((p) => p.span > 0.1).length, hoursLeft);
  const partial = panels(snapshot, 0.5);
  assert.ok(partial.endHour > unusedFromNoon.endHour && partial.endHour < allFromNoon.endHour);
  assert.equal(partial.leaves[0].x, hoursUsed * unit);
  assert.ok(partial.leaves.slice(hoursUsed).every((leaf) => leaf.span === unit));
  assert.equal(meridiem(unusedFromNoon.endHour), '9 PM');
  assert.equal(meridiem(allFromNoon.endHour), '11 PM');
}
export default { title: 'Which clock starts a delivery ETA?', beats, draw, check };

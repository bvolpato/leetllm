import assert from 'node:assert/strict';
import { forward, differenceLamp } from '../../../films/neural-networks/arithmetic.mjs';

const beats = [
  {
    id: 'four-pins',
    say: 'One switch on, and the lamp lights. Try the other switch by itself. Same brightness. These four pins record the same lamp. Both switches off or both on gave us darkness.',
    hold: 0.9,
  },
  {
    id: 'between-switches',
    say: 'Pin height shows brightness. Now give each switch a dimmer. If we stop both dimmers halfway, how high should the middle be?',
    hold: 1.8,
  },
  {
    id: 'up-to-the-fold',
    say: 'Add the two dimmer settings. The first hidden unit in this network uses a ReLU. It keeps positive inputs and turns negative ones into zero. Here the unit keeps the whole sum.',
    hold: 0.9,
  },
  {
    id: 'over-the-fold',
    say: 'The second hidden unit takes the sum minus one and applies the same ReLU. It stayed at zero all the way up this slope. Beyond the fold it starts to count the excess.',
    hold: 0.7,
  },
  {
    id: 'down-to-dark',
    say: 'The output subtracts twice that excess from the sum. Follow the paper down to the far pin. Two minus twice one gives zero. Trace the ridge between the bright pins.',
    hold: 1.1,
  },
  {
    id: 'other-fold',
    say: 'Keep all four pins in place. Another network compares the dimmers. One ReLU keeps any excess of A over B. The other keeps any excess of B over A. Add those two amounts to get the gap. Where the dimmers match, the paper touches the board.',
    hold: 1.0,
  },
  {
    id: 'halfway-test',
    say: 'Put the two sheets side by side. Follow the crease in each one to the middle. Both dimmers are halfway up. Which network would keep the lamp lit?',
    hold: 1.7,
  },
  {
    id: 'the-reading',
    say: 'The sum reaches one, right on the ridge. The gap is zero, down in the valley. We have two predictions for the same setting. That’s where I’d take the next reading on the real lamp.',
    hold: 2.3,
  },
];

const corners = [
  { a: 0, b: 0, label: 'Both off' },
  { a: 1, b: 0, label: 'A only' },
  { a: 0, b: 1, label: 'B only' },
  { a: 1, b: 1, label: 'Both on' },
];
const midpoint = [0.5, 0.5];
const networks = {
  sum: {
    evaluate: forward,
    crease: [
      [1, 0],
      [0, 1],
    ],
    sides: [
      [-1, -1, 1],
      [1, 1, -1],
    ],
    faces: [
      ['#ffbd93', '#dc704f'],
      ['#fce4ba', '#efa66e'],
    ],
    edge: '#944735',
    ink: '#983e2b',
  },
  gap: {
    evaluate: differenceLamp,
    crease: [
      [0, 0],
      [1, 1],
    ],
    sides: [
      [1, -1, 0],
      [-1, 1, 0],
    ],
    faces: [
      ['#d5c6ff', '#9b84c2'],
      ['#a18eb8', '#6c638e'],
    ],
    edge: '#514362',
    ink: '#604f7c',
  },
};
const dark = '#302838';
const muted = '#645869';
const clamp = (t) => Math.max(0, Math.min(1, t));
const smooth = (t) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
const mix = (a, b, t) => a + (b - a) * t;
const lerp = (p, q, t) => [mix(p[0], q[0], t), mix(p[1], q[1], t)];
const square = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];
const makeView = (x, y, scale) => ({ x, y, scale });

// The board is an orthographic graph. A and B run along its edges, and height is brightness.
function project(v, [a, b], h = 0) {
  return [
    v.x + v.scale * (515 * (b - a) + 186 * (a + b - 1)),
    v.y + v.scale * (286 * (1 - a - b) + 76 * (b - a) - 200 * h),
  ];
}
function path(ctx, points, fill, stroke, width = 1, closed = true) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const p of points.slice(1)) ctx.lineTo(...p);
  if (closed) ctx.closePath();
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
function line(ctx, p, q, color, width) {
  path(ctx, [p, q], null, color, width, false);
}
function ellipse(ctx, x, y, rx, ry, color) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
function glow(ctx, x, y, radius, inside, outside) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, inside);
  g.addColorStop(1, outside);
  ellipse(ctx, x, y, radius, radius, g);
}
function label(ctx, text, x, y, size, options = {}) {
  ctx.font = `${options.weight ?? 500} ${size}px "Lesson ${options.family ?? 'Sans'}"`;
  ctx.textAlign = options.align ?? 'left';
  ctx.fillStyle = options.color ?? dark;
  ctx.fillText(text, x, y);
}
function backdrop(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 1480, 1100);
  sky.addColorStop(0, '#fff7ec');
  sky.addColorStop(0.53, '#e9deda');
  sky.addColorStop(1, '#cabbc8');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1920, 1080);
}
function board(ctx, v) {
  const rim = [
    [-0.075, -0.075],
    [1.075, -0.075],
    [1.075, 1.075],
    [-0.075, 1.075],
  ].map((p) => project(v, p));
  ctx.save();
  ctx.shadowColor = '#60495855';
  ctx.shadowBlur = 24 * v.scale;
  ctx.shadowOffsetY = 13 * v.scale;
  path(
    ctx,
    rim.map(([x, y]) => [x, y + 10 * v.scale]),
    '#bcb2b4',
  );
  ctx.restore();
  path(ctx, rim, '#f6f0e9', '#d5c8c8', 2);
  for (let i = 0; i <= 10; i++) {
    const f = i / 10;
    const color = i % 5 ? '#ded6d4' : '#bfb2b8';
    line(ctx, project(v, [f, 0]), project(v, [f, 1]), color, v.scale * (i % 5 ? 1.5 : 2.6));
    line(ctx, project(v, [0, f]), project(v, [1, f]), color, v.scale * (i % 5 ? 1.5 : 2.6));
  }
}

// Clip in input space so the unfolding edge has the exact output height along its entire length.
function cut(poly, [wa, wb, bias]) {
  const value = (p) => wa * p[0] + wb * p[1] + bias;
  const result = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i],
      q = poly[(i + 1) % poly.length];
    const dp = value(p),
      dq = value(q);
    if (dp >= 0) result.push(p);
    if ((dp > 0 && dq < 0) || (dp < 0 && dq > 0)) result.push(lerp(p, q, dp / (dp - dq)));
  }
  return result;
}
function sheet(ctx, v, kind, sweep = 2, alpha = 1, wings = [1, 1]) {
  if (alpha <= 0 || sweep <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  const net = networks[kind];
  const height = (p) => net.evaluate(p).y;
  const point = (p) => project(v, p, height(p));
  const slices = net.sides.map((side, i) => {
    const half = cut(square, side);
    if (kind === 'sum') return cut(half, [-1, -1, sweep]);
    if (wings[i] <= 0) return [];
    return cut(half, [-side[0], -side[1], wings[i]]);
  });
  for (const poly of slices) {
    // Light falls from the upper left. Only the elevated corners cast a long shadow.
    if (poly.length < 3) continue;
    const shadow = poly.map((p) => {
      const [x, y] = project(v, p);
      return [x + height(p) * 60 * v.scale, y + height(p) * 28 * v.scale];
    });
    path(ctx, shadow, '#50405224');
  }
  for (const face of [1, 0]) {
    const poly = slices[face];
    if (poly.length < 3) continue;
    const pts = poly.map(point);
    const wash = ctx.createLinearGradient(
      v.x - 250 * v.scale,
      v.y - 260 * v.scale,
      v.x + 260 * v.scale,
      v.y + 150 * v.scale,
    );
    net.faces[face].forEach((c, i) => wash.addColorStop(i, c));
    path(
      ctx,
      pts.map(([x, y]) => [x, y + 5 * v.scale]),
      net.edge,
    );
    path(ctx, pts, wash, '#fff6e6', 2 * v.scale);
    ctx.save();
    ctx.clip();
    // Fibres and ruled squares follow the plane of each piece of paper through its fold.
    const [wa, wb, bias] = net.sides[face];
    const plane = (p) => {
      const a = p[0],
        b = p[1];
      const h = kind === 'sum' ? (face === 0 ? a + b : 2 - a - b) : wa * a + wb * b + bias;
      return project(v, p, h);
    };
    for (let i = 1; i < 16; i++) {
      const t = i / 16;
      line(ctx, plane([t, 0]), plane([t, 1]), '#48303c20', 1.7 * v.scale);
      line(ctx, plane([0, t]), plane([1, t]), '#fffcf146', 1.8 * v.scale);
    }
    for (let i = 1; i <= 120; i++) {
      const a = (i * 0.61803398875) % 1,
        b = (i * 0.754877666) % 1;
      line(ctx, plane([a, b]), plane([a + 0.006, b + 0.003]), '#fff7e944', 1.3 * v.scale);
    }
    ctx.restore();
  }
  const [a, b] = net.crease;
  if (kind === 'sum' && sweep >= 1) line(ctx, point(a), point(b), '#fff0ce', 5 * v.scale);
  if (kind === 'gap' && wings.some((w) => w > 0))
    line(ctx, point(a), point(b), '#4d3b69', 4 * v.scale);
  ctx.restore();
}
function feet(ctx, v, heights) {
  for (const [i, p] of corners.entries()) {
    const [x, y] = project(v, [p.a, p.b]);
    const h = heights[i],
      s = v.scale;
    ellipse(ctx, x, y + 2 * s, 17 * s, 8 * s, '#63546456');
    ellipse(ctx, x, y, 13 * s, 6 * s, '#f8eee3');
    if (h > 0) {
      const top = project(v, [p.a, p.b], h);
      line(ctx, [x, y], top, '#726977', 6 * s);
      line(ctx, [x - 1 * s, y], [top[0] - s, top[1]], '#d6ced1', 2 * s);
    }
  }
}
function bulb(ctx, point, height, scale) {
  const [x, y] = point;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const on = clamp(height);
  if (on > 0) glow(ctx, 0, -17, 57, `rgba(255,192,87,${0.44 * on})`, 'rgba(255,189,80,0)');
  ellipse(ctx, 2, 3, 13, 4, '#66535758');
  const glass = ctx.createRadialGradient(-7, -30, 2, 0, -20, 24);
  glass.addColorStop(0, on > 0.03 ? '#fffcdd' : '#aa9bb2');
  glass.addColorStop(
    0.5,
    `rgb(${Math.round(mix(85, 255, on))},${Math.round(mix(76, 220, on))},${Math.round(mix(97, 117, on))})`,
  );
  glass.addColorStop(1, on > 0.03 ? '#d58d4a' : '#4d4252');
  ctx.beginPath();
  ctx.moveTo(-8, -3);
  ctx.bezierCurveTo(-8, -10, -20, -15, -20, -25);
  ctx.bezierCurveTo(-20, -50, 20, -50, 20, -25);
  ctx.bezierCurveTo(20, -15, 8, -10, 8, -3);
  ctx.closePath();
  ctx.fillStyle = glass;
  ctx.fill();
  ctx.strokeStyle = on > 0.03 ? '#a68158' : '#504454';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  path(
    ctx,
    [
      [-6, -5],
      [-9, -25],
      [-3, -20],
      [0, -24],
      [5, -20],
      [9, -25],
      [6, -5],
    ],
    null,
    on > 0.03 ? '#d57629' : '#c4b9c7',
    1.7,
    false,
  );
  ctx.fillStyle = '#5e5162';
  ctx.fillRect(-9, -5, 18, 6);
  ellipse(ctx, 0, 1, 9, 3, '#483e4a');
  ellipse(ctx, -9, -32, 3, 4.6, '#ffffffbd');
  ctx.restore();
}
function pins(ctx, v, heights, names, installed = [1, 1, 1, 1]) {
  for (const i of [3, 1, 2, 0]) {
    const { a, b, label: name } = corners[i];
    const p = project(v, [a, b], heights[i]);
    ctx.save();
    ctx.globalAlpha *= installed[i];
    bulb(ctx, p, Number(a !== b), 1.12 * v.scale);
    ctx.restore();
    if (names) {
      const dy = i === 0 ? 75 : -68;
      label(ctx, name, p[0], p[1] + dy * v.scale, 40 * v.scale, { align: 'center' });
    }
  }
}
function cursor(ctx, v, p, height) {
  const [x, y] = project(v, p, height);
  const s = v.scale;
  ellipse(ctx, x, y + 4 * s, 19 * s, 8 * s, '#5b344847');
  ellipse(ctx, x, y, 17 * s, 10 * s, '#64233f');
  ellipse(ctx, x - 1 * s, y - 3 * s, 11 * s, 5 * s, '#fff8e7');
}
function readout(ctx, name, items, color) {
  label(ctx, name, 95, 257, 70, { family: 'Serif', color });
  items.forEach(([key, value], i) => {
    const y = 381 + i * 89;
    label(ctx, key, 99, y, 37, { color: muted });
    label(ctx, value, 502, y + 1, 44, { family: 'Mono', align: 'right' });
  });
}
function single(ctx, v, { heights = [0, 1, 1, 0], names = false, papers = [], probe, installed }) {
  board(ctx, v);
  feet(ctx, v, heights);
  papers.forEach((p) => sheet(ctx, v, ...p));
  pins(ctx, v, heights, names, installed);
  if (probe) cursor(ctx, v, ...probe);
}
function paired(ctx, clock) {
  const ready = clock.index === 7;
  // Match the boards at the same scale and angle so all four pins stay comparable.
  for (const [i, kind] of ['sum', 'gap'].entries()) {
    const v = makeView(i ? 1418 : 502, 577, 0.71);
    const net = networks[kind];
    const name = i ? 'Gap network' : 'Sum network';
    label(ctx, name, v.x, 207, 62, { align: 'center', family: 'Serif', color: net.ink });
    single(ctx, v, { papers: [[kind]] });
    const t = ready ? 1 : smooth(clock.reveal('Follow the crease', 2.1));
    const p = lerp(net.crease[0], midpoint, t);
    const height = net.evaluate(p).y;
    if (!ready) cursor(ctx, v, p, height);
    else {
      const pos = project(v, p, height);
      bulb(ctx, pos, height, 2);
      label(ctx, height === 1 ? '1  ·  Full light' : '0  ·  Dark', v.x, 875, 49, {
        align: 'center',
        color: net.ink,
      });
    }
  }
  if (ready || clock.reveal('Both dimmers are halfway up') > 0)
    label(ctx, 'Both dimmers halfway', 960, 104, 48, { align: 'center' });
}
function draw(ctx, clock) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  backdrop(ctx);
  const i = clock.index;
  if (i >= 6) {
    paired(ctx, clock);
    ctx.restore();
    return;
  }
  const center = makeView(960, 535, 1.04);
  if (i <= 1) {
    const heights =
      i === 0
        ? [0, smooth(clock.elapsed / 0.75), smooth(clock.reveal('Try the other', 0.8)), 0]
        : [0, 1, 1, 0];
    single(ctx, center, {
      heights,
      names: true,
      installed: [1, clamp(heights[1] * 4), clamp(heights[2] * 4), 1],
    });
    if (i === 1) {
      const alpha = smooth(clock.reveal('If we stop', 0.5));
      ctx.globalAlpha = alpha;
      const [x, y] = project(center, midpoint);
      ctx.setLineDash([6, 9]);
      line(ctx, [x, y], [x, y - 130], '#7f455c', 3);
      ctx.setLineDash([]);
      cursor(ctx, center, midpoint, 0);
      label(ctx, 'Both halfway', x + 20, y - 87, 40, { color: '#74364e' });
    }
    ctx.restore();
    return;
  }
  const move = i === 2 ? smooth(clock.elapsed / 1.3) : 1;
  const v = makeView(
    mix(center.x, 1250, move),
    mix(center.y, 560, move),
    mix(center.scale, 0.92, move),
  );
  const decimal = (n) => n.toFixed(1);
  if (i <= 4) {
    let sum;
    if (i === 2)
      sum =
        0.5 * smooth(clock.reveal('Add the two', 2.0)) +
        0.5 * smooth(clock.reveal('Here the unit keeps', 2.0));
    if (i === 3) sum = 1 + 0.5 * smooth(clock.reveal('Beyond the fold', 2.1));
    if (i === 4) sum = 1.5 + 0.5 * smooth(clock.reveal('Follow the paper down', 2));
    const p = [sum / 2, sum / 2];
    const model = forward(p);
    single(ctx, v, { papers: [['sum', sum]], probe: [p, model.y], names: true });
    const items = [['Sum', decimal(model.sum)]];
    if (i >= 3) items.push(['Excess over 1', decimal(model.h[1])]);
    if (i === 4) items.push(['Brightness', decimal(model.y)]);
    ctx.globalAlpha = move;
    readout(ctx, 'Sum network', items, networks.sum.ink);
    if (i === 4 && sum === 2) {
      const calculation = `${model.h[0]} − 2 × ${model.h[1]} = ${model.y}`;
      label(ctx, calculation, 98, 708, 48, { family: 'Serif', color: networks.sum.ink });
    }
    if (i === 4) {
      const trace = smooth(clock.reveal('Trace the ridge', 1.2));
      if (trace > 0) {
        const [a, b] = networks.sum.crease;
        line(ctx, project(v, a, 1), project(v, lerp(a, b, trace), 1), '#fff7d9', 7 * v.scale);
      }
    }
  } else {
    const clear = smooth(clock.reveal('Keep all four pins', 1.0));
    const first = smooth(clock.reveal('One ReLU', 2.1));
    const second = smooth(clock.reveal('The other keeps', 2.1));
    const back = smooth(clock.reveal('Where the dimmers match', 1.6));
    const diff = first - 2 * second + back;
    const p = [(1 + diff) / 2, (1 - diff) / 2];
    const model = differenceLamp(p);
    board(ctx, v);
    feet(ctx, v, [0, 1, 1, 0]);
    sheet(ctx, v, 'sum', 2, 1 - clear);
    sheet(ctx, v, 'gap', 2, 1, [first, second]);
    pins(ctx, v, [0, 1, 1, 0], true);
    if (first > 0) cursor(ctx, v, p, model.y);
    const items = [];
    if (first > 0) items.push(['A above B', decimal(model.h[0])]);
    if (second > 0) items.push(['B above A', decimal(model.h[1])]);
    if (clock.reveal('Add those two amounts') > 0) items.push(['Brightness', decimal(model.y)]);
    readout(ctx, 'Gap network', items, networks.gap.ink);
  }
  ctx.restore();
}
function check() {
  for (const { a, b } of corners) {
    const reading = Number(a !== b);
    for (const model of Object.values(networks)) assert.equal(model.evaluate([a, b]).y, reading);
  }
  assert.deepEqual(forward(midpoint).h, [1, 0]);
  assert.deepEqual(differenceLamp(midpoint).h, [0, 0]);
  assert.equal(forward(midpoint).y, 1);
  assert.equal(differenceLamp(midpoint).y, 0);
  for (let ia = 0; ia <= 20; ia++)
    for (let ib = 0; ib <= 20; ib++) {
      const a = ia / 20,
        b = ib / 20,
        s = a + b;
      assert.ok(Math.abs(forward([a, b]).y - Math.min(s, 2 - s)) < 1e-12);
      assert.equal(differenceLamp([a, b]).y, Math.abs(a - b));
    }
  assert.ok(Math.abs(forward([0.8, 0.5]).y - 0.7) < 1e-12);
  assert.ok(Math.abs(differenceLamp([0.8, 0.5]).y - 0.3) < 1e-12);
}
export default { title: 'Two Folds for the Same Lamp', beats, draw, check };

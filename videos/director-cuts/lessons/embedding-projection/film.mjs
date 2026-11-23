import assert from 'node:assert/strict';
import { DROP_FIXTURE } from '../../../films/embedding-projection/fixtures.mjs';

// These are the question and the two rules compared in the original opening.
const byId = Object.fromEntries(DROP_FIXTURE.map(({ id, point }) => [id, point]));
const question = byId.A;
const rules = [
  { name: 'Merge', point: byId.D, ink: '#2944ad', stock: '#d4dcff', lines: ['A failed scan', 'blocks a merge.'] },
  { name: 'Rotation', point: byId.B, ink: '#ae3725', stock: '#ffd6b7', lines: ['Over 14 days?', 'Open a rotation ticket.'] },
];

const beats = [
  {
    id: 'the-ring',
    say: "Follow the blue ring down. See the black dot through the hole? That's our question about an eighteen-day-old key.",
    hold: 0.9,
  },
  {
    id: 'the-returned-rule',
    say: "Each rule has an embedding, a point in space. The search picks the closest point by straight-line distance. Here's the rule it sent back.",
    hold: 1.7,
  },
  {
    id: 'the-address',
    say: 'A failed scan blocks a merge. How did a question about a key lead us there? Look where the blue ring landed.',
    hold: 0.8,
  },
  {
    id: 'two-coordinates',
    say: "This projection keeps just two coordinates, x and y. The merge rule and the question both land at zero, zero. Rotation is still one step away. What if we put the missing height back?",
    hold: 1.1,
  },
  {
    id: 'the-third-coordinate',
    say: 'Watch the folds open. Each pleat adds one unit of the third coordinate, z. Keep an eye on the dot and the red ring. They stay on the page.',
    hold: 1.2,
  },
  {
    id: 'which-rule',
    say: 'From the question, it takes eight steps straight up to reach merge. Which rule is closest now? Run the same search with all three coordinates.',
    hold: 1.3,
  },
  {
    id: 'the-ticket',
    say: "There's the rotation rule, just one step away. Eighteen days is over fourteen, so open a ticket. When you shorten embeddings, try questions with known answers and check which rules come back.",
    hold: 2.8,
  },
];

const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const ink = '#252735';

function project(point, height) {
  return [point[0], point[1], point[2] * height];
}

function distance(rule, height) {
  const point = project(rule.point, height);
  const q = project(question, height);
  return Math.hypot(...point.map((v, axis) => v - q[axis]));
}

function nearest(height) {
  return rules.reduce((best, rule) => distance(rule, height) < distance(best, height) ? rule : best);
}

// Oblique book illustration. The x and y directions run along the paper.
function position([x, y, z]) {
  return [1288 + x * 180 + y * 39 - z * 8, 726 - x * 8 - y * 59 - z * 65];
}

function polygon(ctx, pts, fill) {
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  pts.slice(1).forEach(p => ctx.lineTo(...p));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function line(ctx, a, b, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(...a);
  ctx.lineTo(...b);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function type(ctx, value, x, y, size, family = 'Serif', color = ink, align = 'left', weight = 'normal') {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function gradient(ctx, x1, y1, x2, y2, stops) {
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  stops.forEach(([offset, color]) => g.addColorStop(offset, color));
  return g;
}

function pagePath(ctx, side, lift = 0) {
  ctx.beginPath();
  ctx.moveTo(788, 121 + lift);
  if (side === 'left') {
    ctx.bezierCurveTo(640, 56 + lift, 305, 76 + lift, 84, 51 + lift);
    ctx.lineTo(47, 871 + lift);
    ctx.bezierCurveTo(358, 881 + lift, 621, 872 + lift, 808, 941 + lift);
  } else {
    ctx.bezierCurveTo(1027, 59 + lift, 1510, 76 + lift, 1816, 49 + lift);
    ctx.lineTo(1877, 870 + lift);
    ctx.bezierCurveTo(1433, 895 + lift, 1004, 867 + lift, 808, 941 + lift);
  }
  ctx.closePath();
}

const fibers = [];
let seed = 61;
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}
for (let i = 0; i < 1750; i++) fibers.push([random() * 1920, random() * 1080, 1 + random() * 4]);

function book(ctx) {
  ctx.fillStyle = gradient(ctx, 0, 0, 1920, 1080, [[0, '#b75746'], [0.52, '#d58469'], [1, '#ac5146']]);
  ctx.fillRect(-200, -200, 2320, 1480);
  ctx.save();
  ctx.shadowColor = '#65392d80';
  ctx.shadowBlur = 25;
  ctx.shadowOffsetY = 15;
  polygon(ctx, [[56, 59], [783, 111], [1839, 48], [1915, 904], [811, 985], [17, 907]], '#7b2430');
  ctx.restore();
  polygon(ctx, [[56, 59], [783, 111], [1839, 48], [1911, 897], [811, 976], [17, 900]], '#aa3541');
  for (const side of ['left', 'right']) {
    for (const [dy, color] of [[17, '#b69572'], [13, '#e4c79d'], [10, '#c9a881'], [7, '#ecd4ac'], [4, '#d0b491']]) {
      pagePath(ctx, side, dy);
      ctx.fillStyle = color;
      ctx.fill();
    }
    pagePath(ctx, side);
    ctx.fillStyle = side === 'left'
      ? gradient(ctx, 58, 0, 815, 0, [[0, '#ffefd1'], [0.68, '#ffefcf'], [0.93, '#f0d8ae'], [1, '#bd9c77']])
      : gradient(ctx, 790, 0, 1876, 0, [[0, '#b59a77'], [0.03, '#e3caa6'], [0.14, '#fff0d4'], [0.7, '#fff3d7'], [1, '#f7e4c2']]);
    ctx.fill();
  }
  ctx.save();
  ctx.fillStyle = '#49311613';
  ctx.beginPath();
  for (const [x, y, w] of fibers) ctx.rect(x, y, w, 1);
  ctx.fill();
  ctx.restore();
}

function pencil(ctx, start, end, progress) {
  if (!progress) return;
  const tip = lerp(start[0], end[0], progress);
  ctx.beginPath();
  ctx.moveTo(...start);
  ctx.quadraticCurveTo((start[0] + tip) / 2, start[1] + progress * 3, tip, lerp(start[1], end[1], progress));
  ctx.strokeStyle = '#a83426';
  ctx.lineWidth = 3.8;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function answerSlip(ctx, rule, insertion, limitMark) {
  const x = 145, y = 566, w = 555, h = 208;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (insertion > 0) {
    ctx.save();
    ctx.translate(0, (1 - insertion) * (h + 6));
    ctx.fillStyle = rule.stock;
    ctx.fillRect(x, y + 2, w, h);
    ctx.fillStyle = rule.ink;
    ctx.fillRect(x, y + 2, 11, h);
    type(ctx, 'Closest rule', x + 30, y + 46, 32, 'Sans', rule.ink);
    type(ctx, rule.lines[0], x + 30, y + 114, 52);
    type(ctx, rule.lines[1], x + 30, y + 174, 52);
    pencil(ctx, [x + 29, y + 125], [x + 343, y + 122], limitMark);
    ctx.restore();
  }
  ctx.restore();
  line(ctx, [x - 7, y + h - 2], [x + w + 7, y + h - 2], '#9c7c5f', 3);
  line(ctx, [x, y + h + 1], [x + w, y + h + 1], '#fffae8', 4);
}

function questionPage(ctx, rule, insertion, ageMark, limitMark) {
  ctx.save();
  ctx.transform(1, 0.035, -0.026, 1, 4, -7);
  type(ctx, 'API key policy', 144, 208, 40, 'Sans');
  line(ctx, [145, 231], [687, 231], '#675b4b', 2);
  type(ctx, 'My key is', 137, 348, 91);
  type(ctx, '18 days old.', 137, 441, 91);
  pencil(ctx, [141, 452], [234, 449], ageMark);
  type(ctx, 'Can I keep using it?', 144, 516, 48, 'Serif', ink, 'left', 'italic');
  answerSlip(ctx, rule, insertion, limitMark);
  ctx.restore();
}

function ground(ctx) {
  ctx.save();
  pagePath(ctx, 'right');
  ctx.clip();
  const onPage = (x, y) => position([x, y, 0]);
  for (let y = 0; y <= 7; y++) {
    line(ctx, onPage(-2.2, y), onPage(2.35, y), '#98815b25', 1.5);
  }
  for (let x = -2; x <= 2; x++) {
    line(ctx, onPage(x, -0.54), onPage(x, 7), '#98815b25', 1.5);
  }
  line(ctx, onPage(-2.2, 0), onPage(2.39, 0), '#9f8b6c', 2.5);
  line(ctx, onPage(0, 0), onPage(0, 6.1), '#9f8b6c', 2.5);
  type(ctx, 'x', ...onPage(2.43, -0.06), 37, 'Serif', '#736759', 'center', 'italic');
  type(ctx, 'y', ...onPage(0, 6.28), 37, 'Serif', '#736759', 'center', 'italic');
  ctx.restore();
}

// Each strip has a light face and a dark return. All eight hinges share the
// same extension. The eyelet at the top carries the merge rule's position.
function pleats(ctx, height) {
  const [bx, by] = position(question);
  const z = rules[0].point[2];
  const [tx, ty] = position(project(rules[0].point, height));
  const shadowX = bx - 7 + 170 * height;
  const shadowY = by + 4 - 73 * height;
  polygon(ctx, [[bx - 269, by], [bx - 24, by - 12], [shadowX, shadowY],
    [shadowX - 238, shadowY + 13]], '#67472c22');
  for (let i = 0; i < z; i++) {
    const y = lerp(by, ty, i / z), x = lerp(bx, tx, i / z);
    const nextY = lerp(by, ty, (i + 1) / z), nextX = lerp(bx, tx, (i + 1) / z);
    const back = [x - 41, y - 3];
    const ridge = [(x + nextX) / 2 - 30, (y + nextY) / 2 + 8];
    const top = [nextX - 41, nextY - 3];
    const left = p => [p[0] - 220, p[1] + 13];
    polygon(ctx, [left(back), back, ridge, left(ridge)], '#354a9e');
    polygon(ctx, [left(ridge), ridge, top, left(top)],
      gradient(ctx, 0, top[1], 0, ridge[1] + 13, [[0, '#7083ca'], [0.85, '#a8baf2'], [1, '#d7e1ff']]));
    line(ctx, left(ridge), ridge, '#d6e4ff', 2);
    line(ctx, left(top), top, '#223981', 1.8);
  }
}

function tab(ctx, rule, height, side) {
  const [x, y] = position(project(rule.point, height));
  ctx.save();
  ctx.translate(x, y);
  ctx.transform(1, -0.05, -0.14, 0.94, 0, 0);
  const left = side < 0 ? -281 : -37, right = side < 0 ? 37 : 232;
  ctx.beginPath();
  ctx.roundRect(left, -40, right - left, 80, [side < 0 ? 5 : 35, side < 0 ? 35 : 5, side < 0 ? 35 : 5, side < 0 ? 5 : 35]);
  ctx.moveTo(23, 0);
  ctx.arc(0, 0, 23, 0, Math.PI * 2);
  ctx.fillStyle = rule.ink;
  ctx.fill('evenodd');
  ctx.beginPath();
  ctx.arc(0, 0, 27.5, 0, 2 * Math.PI);
  ctx.strokeStyle = '#ffefbdad';
  ctx.lineWidth = 2.3;
  ctx.stroke();
  type(ctx, rule.name, side < 0 ? -151 : 126, 17, 49, 'Serif', '#fff5dd', 'center');
  ctx.restore();
}

function bracket(ctx, start, end) {
  const color = '#504b46';
  line(ctx, start, end, color, 2);
  const angle = Math.atan2(end[1] - start[1], end[0] - start[0]) + Math.PI / 2;
  const dx = Math.cos(angle) * 9, dy = Math.sin(angle) * 9;
  for (const [px, py] of [start, end]) line(ctx, [px - dx, py - dy], [px + dx, py + dy], color, 2.5);
}

function drawIndex(ctx, height, addresses, span, vertical) {
  ground(ctx);
  const [qx, qy] = position(question);
  const [rx, ry] = position(rules[1].point);
  ellipse(ctx, qx, qy, 15, 13.5, ink);
  ellipse(ctx, rx, ry, 7, 6, rules[1].ink);
  tab(ctx, rules[1], 0, 1);
  pleats(ctx, height);
  tab(ctx, rules[0], height, -1);
  type(ctx, 'Key question', qx - 14, qy + 101, 40, 'Serif', ink, 'right');
  line(ctx, [qx - 18, qy + 62], [qx - 4, qy + 37], ink, 2);

  if (addresses > 0) {
    ctx.save();
    ctx.globalAlpha = addresses;
    type(ctx, '(0, 0)', qx - 130, qy - 66, 35, 'Mono', ink, 'center');
    type(ctx, '(1, 0)', rx + 112, ry - 66, 35, 'Mono', ink, 'center');
    ctx.restore();
  }
  if (span > 0) {
    ctx.save();
    ctx.globalAlpha = span;
    bracket(ctx, [qx, qy + 63], [rx, ry + 63]);
    type(ctx, '1 unit', (qx + rx) / 2, (qy + ry) / 2 + 112, 42, 'Sans', ink, 'center');
    ctx.restore();
  }
  if (vertical > 0) {
    ctx.save();
    ctx.globalAlpha = vertical;
    const [tx, ty] = position(project(rules[0].point, height));
    bracket(ctx, [qx - 310, qy + 15], [tx - 310, ty + 15]);
    const cx = (tx + qx) / 2 - 369, cy = (ty + qy) / 2;
    type(ctx, '8', cx, cy, 72, 'Serif', ink, 'center');
    type(ctx, 'units', cx, cy + 43, 36, 'Sans', ink, 'center');
    ctx.restore();
  }
}

function state(clock) {
  const { index, elapsed, reveal } = clock;
  let height = 0, close = 0, addresses = 0, span = 0, vertical = 0, insertion = 0;
  if (index === 0) height = 1 - ease(elapsed / 1.95);
  if (index === 1) insertion = ease(reveal('picks the closest point', 0.75));
  if (index === 2) {
    insertion = 1;
    close = ease(reveal('Look where', 1.55));
  }
  if (index === 3) {
    close = 1;
    addresses = ease(reveal('two coordinates', 0.65));
    span = ease(reveal('Rotation is still', 0.55));
    insertion = 1;
  }
  if (index === 4) {
    const open = reveal('Watch the folds open', 3.3);
    close = 1 - ease(open / 0.87);
    height = ease((open - 0.15) / 0.85);
    addresses = 1 - ease(open / 0.23);
    insertion = 1 - ease(open / 0.32);
    span = 1;
  }
  if (index >= 5) {
    height = span = 1;
    vertical = index === 5 ? ease(elapsed / 0.7) : 1;
    insertion = index === 5 ? ease(reveal('Run the same search', 0.85)) : 1;
  }
  const ageMark = index === 6 ? ease(reveal('Eighteen days', 0.55)) : 0;
  const limitMark = index === 6 ? ease(reveal('over fourteen', 0.55)) : 0;
  return { height, close, addresses, span, vertical, insertion, ageMark, limitMark };
}

function draw(ctx, clock) {
  const s = state(clock);
  const scale = lerp(1, 2.03, s.close);
  const cameraX = lerp(960, 1334, s.close), cameraY = lerp(540, 673, s.close);
  ctx.save();
  ctx.translate(960, 540);
  ctx.scale(scale, scale);
  ctx.translate(-cameraX, -cameraY);
  book(ctx);
  questionPage(ctx, nearest(s.height), s.insertion, s.ageMark, s.limitMark);
  drawIndex(ctx, s.height, s.addresses, s.span, s.vertical);
  ctx.restore();
}

function check() {
  assert.deepEqual(project(rules[0].point, 0), project(question, 0));
  assert.deepEqual(rules.map(rule => distance(rule, 0)), [0, 1]);
  assert.deepEqual(rules.map(rule => distance(rule, 1)), [8, 1]);
  assert.equal(nearest(0).name, 'Merge');
  assert.equal(nearest(1).name, 'Rotation');
  assert.equal(distance(rules[0], 1 / 8), distance(rules[1], 1 / 8));
  assert.deepEqual(position(project(rules[0].point, 0)), position(question));
  assert(18 > 14);
}

export default { title: 'The Rule in the Fold', beats, draw, check };

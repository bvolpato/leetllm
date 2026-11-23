import assert from 'node:assert/strict';
import { adapterMergeExample } from '../../../films/model-merging/fixtures.mjs';

const example = adapterMergeExample();
const [code, math] = example.factors;
const product = (b, a) => b.map(row => a.map(col => row * col));
const midpoint = (a, b) => a.map((v, i) => (v + b[i]) / 2);
const codeUpdate = product(code.b, code.a);
const mathUpdate = product(math.b, math.a);
const mixedB = midpoint(code.b, math.b);
const mixedA = midpoint(code.a, math.a);
const crossed = product(mixedB, mixedA);
const paired = codeUpdate.map((row, i) => midpoint(row, mathUpdate[i]));
const baseWeight = 3;
const corner = matrix => matrix[0][1];

const beats = [
  {
    id: 'stray-thread',
    say: 'Watch the upper right. The base weight there was three. Both adapters left it alone, yet the merge just changed it. Where did that extra quarter come from?',
    hold: 1.25,
  },
  {
    id: 'red-pair',
    say: "Follow the red row. Code's B vector picks the top row. Its A vector picks the left column. Multiply them, and their crossing fills one cell. These two vectors describe the weight change for this rank-one adapter.",
    hold: 0.85,
  },
  {
    id: 'blue-pair',
    say: 'Math picks the bottom row and the right column. Its update lands at the other end of the diagonal. We want half of each update, both applied to the same base model.',
    hold: 0.85,
  },
  {
    id: 'two-averages',
    say: 'Try averaging the factors first. Average the two B vectors. Now each row gets a half. Average the two A vectors, and each column gets a half.',
    hold: 0.85,
  },
  {
    id: 'crossing',
    say: "Follow Code's red row across to the blue column from Math. Multiply those halves and you get a quarter. This pair of threads came from different adapters. That is how we changed a weight both adapters left alone.",
    hold: 1.2,
  },
  {
    id: 'two-products',
    say: "Let's keep the pairs together this time. Take Code's own product and give it half the weight. Add half of Math's own product. Watch the upper right as that second patch goes in.",
    hold: 1.5,
  },
  {
    id: 'untouched',
    say: 'Each diagonal weight gains half a unit. The upper right gets zero. Add that to the base weight of three, and the three comes through unchanged.',
    hold: 2.3,
  },
];

const ink = '#202538';
const secondary = '#47526b';
const cotton = '#f6f1df';
const red = { main: '#bc3e25', light: '#ff9771', shade: '#8d2c1e' };
const blue = { main: '#334eac', light: '#92aaff', shade: '#252c79' };
const mx = 1090, my = 279, cell = 282;
const clamp = v => Math.min(1, Math.max(0, v));
const ease = v => { const t = clamp(v); return t * t * (3 - 2 * t); };
const fraction = v => ({ 0: '0', 0.25: '¼', 0.5: '½', 1: '1', 3: '3', 3.25: '3¼' })[v];

function text(ctx, str, x, y, size, color = ink, family = 'Sans', align = 'left', weight = 400) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Lesson ${family}"`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function line(ctx, x, y, endX, endY, color, width = 1) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}

function cloth(ctx, x, y, w, h, step) {
  ctx.save();
  ctx.shadowColor = 'rgba(42,39,65,.25)';
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 9;
  ctx.shadowBlur = 15;
  ctx.fillStyle = cotton;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  // The fringe continues the same threads that run through the body of the cloth.
  ctx.beginPath();
  for (let col = 0; col * step < w; col++) {
    const u = x + col * step + 1;
    const len = 5 + 6 * (0.5 + 0.5 * Math.sin(col * 7.1 + Math.sin(col * 0.2)));
    ctx.moveTo(u + Math.sin(col), y - len * 0.45);
    ctx.lineTo(u, y);
    ctx.moveTo(u, y + h);
    ctx.lineTo(u + 2 * Math.cos(col), y + h + len);
  }
  for (let row = 0; row * step < h; row++) {
    const v = y + row * step;
    const len = 4 + 5 * (0.5 + 0.5 * Math.cos(row * 9.3));
    ctx.moveTo(x - len, v + Math.sin(row));
    ctx.lineTo(x, v);
    ctx.moveTo(x + w, v);
    ctx.lineTo(x + w + len, v + Math.cos(row));
  }
  ctx.strokeStyle = '#e6dfc9';
  ctx.lineWidth = step * 0.62;
  ctx.stroke();

  const light = ctx.createLinearGradient(x, y, x + w, y + h);
  light.addColorStop(0, '#fffcec');
  light.addColorStop(0.68, '#f1eddb');
  light.addColorStop(1, '#e9e4d0');
  ctx.fillStyle = light;
  ctx.fillRect(x, y, w, h);
  ctx.beginPath();
  for (let u = x + step; u < x + w; u += step) {
    ctx.moveTo(u, y);
    ctx.lineTo(u, y + h);
  }
  ctx.strokeStyle = 'rgba(118,107,79,.09)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.beginPath();
  for (let v = y + step; v < y + h; v += step) {
    ctx.moveTo(x, v);
    ctx.lineTo(x + w, v);
  }
  ctx.strokeStyle = 'rgba(118,107,79,.065)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

// The width and height of a woven area encode A and B independently.
// A contrasting weft passes over alternate warp threads in successive rows.
function weave(ctx, x, y, w, h, warp, weft, pitch = 14) {
  if (w < 0.5 || h < 0.5) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = warp.shade;
  ctx.fillRect(x, y, w, h);
  const u0 = Math.floor(x / pitch) * pitch;
  const v0 = Math.floor(y / pitch) * pitch;
  for (let u = u0; u < x + w; u += pitch) {
    ctx.fillStyle = warp.main;
    ctx.fillRect(u + 1, y, pitch - 2, h);
    ctx.fillStyle = warp.light;
    ctx.fillRect(u + 2, y, 1.6, h);
  }
  const shuttle = (offset, width, color) => {
    ctx.beginPath();
    ctx.setLineDash([pitch, pitch]);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    for (let j = 0, v = v0; v < y + h + pitch; j++, v += pitch) {
      ctx.moveTo(u0 - 2 * pitch + (j % 2) * pitch, v + offset);
      ctx.lineTo(x + w + pitch, v + offset);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  };
  shuttle(4, pitch * 0.81, weft.shade);
  shuttle(3, pitch * 0.69, weft.main);
  shuttle(1, 1.8, weft.light);
  ctx.restore();
}

function outline(ctx, x, y, side, color, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.strokeRect(x, y, side, side);
}

function swatch(ctx, { x, y, angle, dye, matrix, name }, pointAtCorner) {
  const s = 216;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  text(ctx, name, -s / 2, -s / 2 - 38, 46, dye.shade, 'Serif');
  cloth(ctx, -s / 2 - 13, -s / 2 - 13, s + 26, s + 26, 5);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
    const u = (c - 1) * s / 2, v = (r - 1) * s / 2;
    outline(ctx, u, v, s / 2, '#aaa795', 1.6);
    if (matrix[r][c]) weave(ctx, u + 4, v + 4, s / 2 - 8, s / 2 - 8, dye, dye, 9);
  }
  brackets(ctx, 2, -s / 2 + 2, s / 2 - 4, pointAtCorner);
  ctx.restore();
}

function brackets(ctx, x, y, s, alpha) {
  if (!alpha) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  const d = 25;
  ctx.beginPath();
  for (const [cx, cy, dx, dy] of [
    [x, y, d, d], [x + s, y, -d, d], [x, y + s, d, -d], [x + s, y + s, -d, -d],
  ]) {
    ctx.moveTo(cx + dx, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + dy);
  }
  ctx.strokeStyle = '#32364c';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.restore();
}

function makeShot(clock) {
  const cue = (words, span = 0.8) => ease(clock.reveal(words, span));
  const start = span => ease(clock.elapsed / span);
  const state = {
    name: 'Merged update', note: 'Upper-right weight', detail: '', sub: '',
    widths: mixedA, heights: mixedB, rows: [red, blue], cols: [red, blue],
    a: 1, b: 1, sweep: 1, guides: 1, focus: 0, matrix: crossed,
    pairedMix: null, active: null, trace: null,
  };
  switch (clock.beat.id) {
    case 'stray-thread':
      state.sweep = ease(0.21 + clock.elapsed / 2.2);
      state.focus = start(0.6);
      state.detail = state.sweep === 1 ? '3 → ' + fraction(baseWeight + corner(crossed)) : '3';
      break;
    case 'red-pair':
    case 'blue-pair': {
      const isCode = clock.beat.id === 'red-pair';
      const name = isCode ? 'Code' : 'Math';
      const adapter = isCode ? code : math, dye = isCode ? red : blue;
      state.name = name + ' update';
      state.note = 'One adapter';
      state.detail = 'ΔW = B × A';
      state.sub = 'Scale = 1';
      state.widths = adapter.a;
      state.heights = adapter.b;
      state.active = name;
      state.rows = [dye, dye];
      state.cols = [dye, dye];
      state.matrix = isCode ? codeUpdate : mathUpdate;
      state.b = start(0.75);
      state.a = cue(isCode ? 'Its A vector' : 'right column');
      state.sweep = cue(isCode ? 'Multiply them' : 'Its update lands', 0.95);
      break;
    }
    case 'two-averages':
      state.name = 'Average the factors';
      state.note = 'Factor averages';
      state.detail = 'B̄ × Ā';
      state.a = cue('Average the two A');
      state.b = cue('Average the two B');
      state.sweep = 0;
      break;
    case 'crossing':
      state.name = 'Product of the averages';
      state.note = 'Upper-right update';
      state.detail = '½ × ½';
      state.focus = start(0.55);
      state.trace = [start(1.4), cue('blue column', 0.8)];
      state.sweep = cue('Multiply those halves', 1.25);
      if (state.sweep === 1) state.detail += ' = ' + fraction(corner(crossed));
      break;
    case 'two-products':
    case 'untouched': {
      const end = clock.beat.id === 'untouched';
      state.name = 'Mean of the updates';
      state.note = end ? 'Upper-right weight' : 'Updates to add';
      state.detail = end ? '3 + 0 = ' + fraction(baseWeight + corner(paired)) : '½ Code + ½ Math';
      state.guides = 0;
      state.matrix = paired;
      state.pairedMix = end ? [1, 1] : [cue("Code's own product", 2.3), cue("half of Math's", 2.3)];
      state.focus = end ? 1 : cue('Watch the upper right');
      break;
    }
  }
  return state;
}

function band(ctx, x, y, w, h, color, vertical) {
  if (w < 1 || h < 1) return;
  ctx.fillStyle = color.main;
  ctx.fillRect(x, y, w, h);
  ctx.beginPath();
  if (vertical) {
    for (let i = x + 2; i < x + w; i += 8) {
      ctx.moveTo(i, y); ctx.lineTo(i, y + h);
    }
  } else {
    for (let i = y + 2; i < y + h; i += 8) {
      ctx.moveTo(x, i); ctx.lineTo(x + w, i);
    }
  }
  ctx.strokeStyle = color.light;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function factors(ctx, state) {
  if (!state.guides) return;
  const inner = cell - 24;
  for (let i = 0; i < 2; i++) {
    const cx = mx + cell * (i + 0.5), cy = my + cell * (i + 0.5);
    const w = state.widths[i] * inner, h = state.heights[i] * inner;
    const x = cx - w / 2, y = cy - h / 2;
    ctx.save();
    ctx.globalAlpha = state.a;
    band(ctx, x, my - 15, w, 19, state.cols[i], true);
    ctx.fillStyle = state.cols[i].main + '12';
    ctx.fillRect(x, my + 4, w, (cell * 2 - 4) * state.a);
    text(ctx, fraction(state.widths[i]), cx, my - 30, 43, ink, 'Serif', 'center');
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = state.b;
    band(ctx, mx - 15, y, 19, h, state.rows[i], false);
    ctx.fillStyle = state.rows[i].main + '15';
    ctx.fillRect(mx + 4, y, (cell * 2 - 4) * state.b, h);
    text(ctx, fraction(state.heights[i]), mx - 37, cy + 15, 43, ink, 'Serif', 'right');
    ctx.restore();
  }
  text(ctx, 'A · columns', mx + cell, my - 74, 34, secondary, 'Sans', 'center');
  text(ctx, 'B · rows', mx - 120, my + cell + 12, 34, secondary, 'Sans', 'center');
}

// Lift a copy of the product already visible on its source swatch.
// It lands at full strength before the half weighting shortens the patch.
function placeProduct(ctx, index, progress, amount) {
  if (progress <= 0) return;
  const fromCode = index === 0;
  const tilt = fromCode ? -0.055 : 0.052;
  const offset = fromCode ? -54 : 54;
  const originX = (fromCode ? 231 : 569) + offset * (Math.cos(tilt) - Math.sin(tilt));
  const originY = (fromCode ? 435 : 431) + offset * (Math.cos(tilt) + Math.sin(tilt));
  const targetX = mx + (index + 0.5) * cell, targetY = my + (index + 0.5) * cell;
  const travel = ease(progress / 0.65);
  const weight = ease((progress - 0.65) / 0.35);
  const lift = Math.sin(Math.PI * travel);
  const x = originX + (targetX - originX) * travel;
  const y = originY + (targetY - originY) * travel - lift * (fromCode ? 220 : 165);
  const side = 100 + (cell - 24 - 100) * travel;
  const h = side * (1 + (amount - 1) * weight);
  const color = fromCode ? red : blue;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt * (1 - travel) - 0.1 * lift);
  if (lift > 0) {
    ctx.save();
    ctx.shadowColor = 'rgba(31,33,55,.42)';
    ctx.shadowBlur = 20 * lift;
    ctx.shadowOffsetY = 18 * lift;
    ctx.fillStyle = color.shade;
    ctx.fillRect(-side / 2, -h / 2, side, h);
    ctx.restore();
  }
  weave(ctx, -side / 2, -h / 2, side, h, color, color, 9 + 5 * travel);
  ctx.restore();
}

function patches(ctx, s) {
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
    const x = mx + c * cell, y = my + r * cell;
    const cx = x + cell / 2, cy = y + cell / 2;
    outline(ctx, x, y, cell, '#aaa794');
    const value = s.matrix[r][c];
    const shown = s.pairedMix ? s.pairedMix[r] : s.sweep;
    if (!s.pairedMix) {
      const width = s.widths[c] * (cell - 24), height = s.heights[r] * (cell - 24);
      weave(ctx, cx - width / 2, cy - height / 2, width * shown, height, s.cols[c], s.rows[r]);
    } else if (r === c && shown === 1) {
      placeProduct(ctx, r, 1, value);
    }
    const readValue = s.pairedMix && value === 0 ? s.pairedMix[1] === 1 : shown === 1;
    if (readValue) {
      ctx.save();
      if (value) {
        ctx.shadowColor = 'rgba(20,20,35,.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
      }
      text(ctx, fraction(value), cx, cy + 23, 69, value ? '#fffdf0' : '#7d7c74', 'Serif', 'center', 600);
      ctx.restore();
    }
  }
  if (s.trace && s.sweep < 1) {
    const rx = mx - 12, ry = my + cell / 2, bx = mx + cell * 1.5, by = my - 12;
    ctx.save();
    ctx.globalAlpha = 1 - s.sweep;
    ctx.lineCap = 'round';
    if (s.trace[0]) {
      const tip = rx + s.trace[0] * (bx - rx);
      line(ctx, rx, ry, tip, ry, red.shade, 12);
      line(ctx, rx, ry - 2, tip, ry - 2, red.light, 3);
    }
    if (s.trace[1]) {
      const tip = by + s.trace[1] * (ry - by);
      line(ctx, bx, by, bx, tip, blue.shade, 12);
      line(ctx, bx - 2, by, bx - 2, tip, blue.light, 3);
    }
    ctx.restore();
  }
  brackets(ctx, mx + cell + 3, my + 3, cell - 6, s.focus);
  s.pairedMix?.forEach((p, i) => {
    if (p > 0 && p < 1) placeProduct(ctx, i, p, s.matrix[i][i]);
  });
}

function draw(ctx, clock) {
  const state = makeShot(clock);
  const mat = ctx.createLinearGradient(0, 0, 1750, 1080);
  mat.addColorStop(0, '#dce2f1');
  mat.addColorStop(0.55, '#b9c3df');
  mat.addColorStop(1, '#9ca8cf');
  ctx.fillStyle = mat;
  ctx.fillRect(0, 0, 1920, 1080);

  text(ctx, 'LoRA adapters', 94, 194, 79, ink, 'Serif');
  swatch(ctx, { x: 231, y: 435, angle: -0.055, dye: red, matrix: codeUpdate, name: 'Code' }, clock.beat.id === 'stray-thread' ? state.focus : 0);
  swatch(ctx, { x: 569, y: 431, angle: 0.052, dye: blue, matrix: mathUpdate, name: 'Math' }, clock.beat.id === 'stray-thread' ? state.focus : 0);
  if (state.active) {
    const isCode = state.active === 'Code', x = isCode ? 231 : 569;
    ctx.save();
    ctx.translate(x, isCode ? 435 : 431);
    ctx.rotate(isCode ? -0.055 : 0.052);
    line(ctx, -104, 139, 104, 139, isCode ? red.shade : blue.shade, 5);
    ctx.restore();
  }
  text(ctx, state.note, 94, 701, 41, secondary);
  text(ctx, state.detail, 90, 802, 74, ink, 'Serif');
  if (state.sub) text(ctx, state.sub, 96, 866, 32, secondary);

  cloth(ctx, 838, 64, 951, 872, 6);
  text(ctx, state.name, 1305, 146, 53, ink, 'Serif', 'center');
  factors(ctx, state);
  patches(ctx, state);
}

function check() {
  assert.deepEqual(codeUpdate, [[1, 0], [0, 0]]);
  assert.deepEqual(mathUpdate, [[0, 0], [0, 1]]);
  assert.deepEqual(mixedA, [0.5, 0.5]);
  assert.deepEqual(mixedB, [0.5, 0.5]);
  assert.deepEqual(crossed, example.wrong);
  assert.deepEqual(paired, example.desired);
  const upperRightCrossTerm = code.b[0] * math.a[1] / 4;
  assert.equal(upperRightCrossTerm, 0.25);
  assert.equal(corner(crossed), upperRightCrossTerm);
  assert.equal(corner(paired), 0);
  assert.equal(baseWeight + corner(crossed), 3.25);
  assert.equal(baseWeight + corner(paired), 3);
}

export default { title: 'Model merging: Where did the extra quarter come from?', beats, draw, check };

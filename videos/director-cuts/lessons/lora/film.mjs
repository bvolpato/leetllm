import assert from 'node:assert/strict';
import { matvec } from '../../../films/lora/arithmetic.mjs';

// A four-code vowel layer in a bitmap sign. Each column of W draws one glyph.
// A and B are one exact rank-one fit to the missing ink. alpha / rank = 1.
const codes = ['A', 'Á', 'E', 'É'];
const width = 7;
const height = 10;
const size = width * height;
const shapes = {
  A: ['0011100', '0110110', '1100011', '1100011', '1111111', '1100011', '1100011'],
  C: ['0111110', '1100011', '1100000', '1100000', '1100000', '1100011', '0111110'],
  E: ['1111111', '1100000', '1100000', '1111110', '1100000', '1100000', '1111111'],
  F: ['1111111', '1100000', '1100000', '1111110', '1100000', '1100000', '1100000'],
  P: ['1111110', '1100011', '1100011', '1111110', '1100000', '1100000', '1100000'],
  R: ['1111110', '1100011', '1100011', '1111110', '1101100', '1100110', '1100011'],
};
function plainGlyph(code) {
  const letter = code.normalize('NFD')[0];
  return [...('0'.repeat(3 * width) + shapes[letter].join(''))].map(Number);
}
const outlines = codes.map(plainGlyph);
const W = Array.from({ length: size }, (_, i) => outlines.map(glyph => glyph[i]));
const A = [[0, 1, 0, 1]];
const accent = ['0000110', '0001100', ...Array(height - 2).fill('0000000')].join('');
const B = [...accent].map(bit => [Number(bit)]);
function readCode(code) {
  const x = codes.map(key => Number(key === code));
  const base = matvec(W, x);
  const z = matvec(A, x);
  const change = matvec(B, z);
  return { base, z: z[0], change, adapted: base.map((value, i) => value + change[i]) };
}
const entries = Object.fromEntries(codes.map(code => [code, readCode(code)]));

const beats = [
  {
    id: 'cafe-para',
    say: 'Read the painted name. Now read the sign. Can we bring back those two accents without redrawing the letters?',
    hold: 0.9,
  },
  {
    id: 'the-empty-rows',
    say: 'Take the last letter of café. The sign receives the code for an accented E. The frozen layer draws a plain E. Look at those empty cells above it.',
    hold: 0.8,
  },
  {
    id: 'one-number',
    say: 'Low-rank adaptation, or LoRA, gives that input a second path. Each vowel selects one of four weights in a learned row called A. For accented E, the weight is one.',
    hold: 0.7,
  },
  {
    id: 'unfold-the-column',
    say: 'That one multiplies a column of seventy weights called B. Lay them out in the same grid as the letter. Four weights carry ink. Can you see the stroke they make?',
    hold: 0.9,
  },
  {
    id: 'land-the-stroke',
    say: 'Watch the space above the E. Adding the correction fills those four cells. The adapter trains just seventy-four weights. All two hundred eighty weights in the base stay frozen.',
    hold: 0.8,
  },
  {
    id: 'the-first-a',
    say: 'Now try the two vowels in Pará. Which one should get that stroke? The first A selects zero. Multiply the whole pattern by zero and the plain A comes through.',
    hold: 1.2,
  },
  {
    id: 'the-last-a',
    say: 'The last A selects one. Look above it. The very same pixels fit a different letter. Every correction this adapter can make is a multiple of that one column. That is rank one.',
    hold: 1.1,
  },
  {
    id: 'back-on-the-street',
    say: 'There are the two accents. And there, between the P and the R, is the A we wanted to keep.',
    hold: 2.2,
  },
];

const ink = '#263f74';
const coral = '#b84024';
const slate = '#445674';
const cream = '#fff1cb';
const unit = n => Math.max(0, Math.min(1, n));
const ease = n => { const t = unit(n); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

function rect(ctx, x, y, w, h, color, radius = 0) {
  ctx.fillStyle = color;
  if (!radius) { ctx.fillRect(x, y, w, h); return; }
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
}
function gradient(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}
function path(ctx, points, fill) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const p of points.slice(1)) ctx.lineTo(...p);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}
function stroke(ctx, points, color, weight) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const p of points.slice(1)) ctx.lineTo(...p);
  ctx.strokeStyle = color;
  ctx.lineWidth = weight;
  ctx.stroke();
}
function oval(ctx, x, y, rx, ry, angle, color) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
function label(ctx, text, x, baseline, px, color = ink, face = 'Sans', align = 'left', weight = 'normal') {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.font = weight + ' ' + px + 'px "Lesson ' + face + '"';
  ctx.fillText(text, x, baseline);
}

// The painted coffee branch belongs to the facade. Tile seams interrupt the glaze.
function leaf(ctx, x, y, angle, length, breadth) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(length * 0.34, -breadth, length * 0.64, -breadth * 0.62, length, 0);
  ctx.bezierCurveTo(length * 0.63, breadth * 0.14, length * 0.48, breadth, 0, 0);
  ctx.fillStyle = ink;
  ctx.fill();
  stroke(ctx, [[2, 0], [length * 0.58, -breadth * 0.09], [length * 0.92, 0]], '#d6dac5', 2.8);
  ctx.restore();
}
function coffeeSprig(ctx, x, y, scale, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(40, -100, 105, -170, 118, -290);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 6;
  ctx.stroke();
  for (const [px, py, a, len] of [[27,-64,-2.1,95],[44,-95,0.32,111],[73,-151,-2.6,112],[87,-177,0.04,99],[103,-224,-2.4,72],[113,-264,-0.8,65]])
    leaf(ctx, px, py, a, len, len * 0.4);
  for (const [px, py] of [[47,-101],[65,-111],[54,-124],[83,-163],[96,-171],[99,-190]]) {
    oval(ctx, px, py, 12, 15, 0.35, coral);
    oval(ctx, px - 3, py - 6, 2, 3.5, 0.5, '#f8d9b7');
  }
  ctx.restore();
}
function facade(ctx) {
  rect(ctx, 0, 0, 1920, 1080, '#e7ddbf');
  const tile = 152;
  const glazes = ['#ede4c8', '#f3e9cf', '#ebe3ce', '#efe8d7', '#f6ead0'];
  for (let r = 0; r < 7; ++r) for (let c = 0; c < 14; ++c)
    rect(ctx, c * tile - 62, r * tile - 51, tile, tile, glazes[(3 * r + c * c) % glazes.length]);
  coffeeSprig(ctx, 1412, 358, 0.95, -0.42);
  coffeeSprig(ctx, 1645, 770, 0.93, 0.84);
  label(ctx, 'Café', 1570, 452, 138, ink, 'Serif', 'center', 'italic');
  label(ctx, 'Pará', 1570, 580, 138, ink, 'Serif', 'center', 'italic');
  for (let y = -51; y < 950; y += tile) {
    rect(ctx, 0, y, 1920, 3, '#a5937c8c');
    rect(ctx, 0, y + 3, 1920, 3, '#fffcdeae');
  }
  for (let x = -62; x < 1920; x += tile) {
    rect(ctx, x, 0, 3, 910, '#9e907b85');
    rect(ctx, x + 3, 0, 3, 910, '#fffbe496');
  }
  // Low afternoon light catches the glazed surface in the upper right.
  path(ctx, [[1240,0],[1820,0],[1105,814],[685,814]], '#fffff11c');
  path(ctx, [[1840,0],[1920,0],[1920,116],[1318,814],[1128,814]], '#fffdf41c');
  // The projecting canopy throws a narrow shadow over the shop window.
  rect(ctx, 0, 870, 1920, 210, '#2d4058');
  rect(ctx, 0, 1000, 1920, 80, '#364f61');
  for (const x of [285, 377, 1280, 1373]) {
    oval(ctx, x + 27, 993, 16, 12, 0, '#bda989');
    oval(ctx, x + 27, 992, 9, 6, 0, '#425363');
    ctx.beginPath();
    ctx.moveTo(x - 34, 977);
    ctx.lineTo(x + 29, 977);
    ctx.quadraticCurveTo(x + 26, 1010, x + 8, 1010);
    ctx.lineTo(x - 12, 1010);
    ctx.quadraticCurveTo(x - 33, 1006, x - 34, 977);
    ctx.fillStyle = '#c5b49b';
    ctx.fill();
    oval(ctx, x - 4, 1012, 45, 4, 0, '#948e82');
  }
  rect(ctx, 0, 1017, 1920, 9, '#7c6b5e');
  for (const x of [120, 600, 1135, 1700]) rect(ctx, x, 900, 15, 180, '#795344');
  for (let i = -1; i < 16; i++) {
    const x = i * 149;
    const tint = i % 2 === 0 ? '#d97141' : '#ffe9bd';
    path(ctx, [[x,816],[x+149,816],[x+118,902],[x-31,902]], tint);
    ctx.beginPath();
    ctx.moveTo(x-31,899);
    ctx.lineTo(x+118,899);
    ctx.lineTo(x+118,929);
    ctx.bezierCurveTo(x+96,959,x-8,959,x-31,929);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? '#b75130' : '#e4c999';
    ctx.fill();
  }
  rect(ctx, 0, 814, 1920, 5, '#a58262');
}

const signPitch = 22;
function signPosition(row, col) {
  return { x: 221 + col * 9 * signPitch, y: 125 + row * 292, p: signPitch };
}
const words = ['CAFÉ', 'PARÁ'];
function pixel(ctx, x, y, pitch, color) {
  const gap = pitch * 0.074;
  rect(ctx, x + gap / 2, y + gap / 2, pitch - gap, pitch - gap, color, pitch * 0.065);
}
function bitmap(ctx, grid, getColor) {
  for (let i = 0; i < size; i++) {
    const color = getColor(i);
    if (color) pixel(ctx, grid.x + (i % width) * grid.p, grid.y + Math.floor(i / width) * grid.p, grid.p, color);
  }
}
const fixedGlyphs = Object.fromEntries(['C', 'F', 'P', 'R'].map(key => [key, plainGlyph(key)]));
function street(ctx, accentedCodes, wake, skip) {
  facade(ctx);
  // An enamel cabinet sits proud of the tile. The paired lines below are its shadow and bevel.
  rect(ctx, 140, 102, 992, 617, '#45434d35', 34);
  rect(ctx, 120, 79, 992, 620, ink, 32);
  rect(ctx, 122, 75, 983, 612, '#95a7b0', 30);
  rect(ctx, 130, 71, 966, 607, '#fff2cf', 26);
  rect(ctx, 158, 96, 910, 550, '#a59781', 12);
  rect(ctx, 162, 100, 902, 542, '#f6e6bf', 9);
  for (const [row, word] of words.entries()) for (const [col, key] of [...word].entries()) {
    if (skip && skip[0] === row && skip[1] === col) continue;
    const glyph = entries[key];
    const base = glyph?.base ?? fixedGlyphs[key];
    bitmap(ctx, signPosition(row, col), i => {
      const front = (row * 35 + col * 9 + (i % width)) / 69;
      if (front > wake) return '#e9d8b5';
      if (base[i]) return ink;
      if (accentedCodes.includes(key) && glyph?.change[i]) return coral;
      return '#e9d8b5';
    });
  }
}

const output = { x: 1392, y: 285, p: 47 };
const closeUp = { x: 1082, y: 253, p: 57 };
const pattern = { x: 849, y: 285, p: output.p };
function bench(ctx) {
  rect(ctx, 0, 0, 1920, 1080, gradient(ctx, 0, 0, 1550, 1080, [[0,'#f9ead6'],[0.62,'#f0e2d4'],[1,'#dacdc3']]));
  // Mat ruled like the ceramic mounting surface, kept clear of type and cells.
  for (let x = 38; x < 1920; x += 94) rect(ctx, x, 0, 2, 1080, '#b5a99b22');
  for (let y = 45; y < 1080; y += 94) rect(ctx, 0, y, 1920, 2, '#b5a99b22');
}
function plate(ctx, g, light) {
  const w = width * g.p, h = height * g.p;
  rect(ctx, g.x - 17, g.y - 10, w + 40, h + 40, '#50455728', 13);
  rect(ctx, g.x - 22, g.y - 21, w + 42, h + 42, light ? '#ccb79a' : '#99a3a8', 13);
  rect(ctx, g.x - 22, g.y - 24, w + 42, h + 40, light ? cream : '#e6e9dd', 13);
}
function gridInk(ctx, grid, code, added) {
  const { base, change } = entries[code];
  bitmap(ctx, grid, i => base[i] ? ink : added && change[i] ? coral : '#e9dabc');
}
function keys(ctx, key, rowVisibility, scoreVisibility) {
  const left = 99, stride = 137, keyY = 335;
  label(ctx, 'Vowel input x', left, 253, 47);
  for (const [index, code] of codes.entries()) {
    const selected = key === code;
    const x = left + index * stride;
    const top = keyY + (selected ? 8 : 0);
    rect(ctx, x + 3, keyY + 7, 113, 123, '#817969', 11);
    rect(ctx, x, top, 113, 114, selected ? ink : '#fbefda', 11);
    rect(ctx, x + 6, top + 5, 101, 3, selected ? '#576b94' : '#fffae9', 1);
    label(ctx, code, x + 56, top + 81, 68, selected ? '#fff2cf' : ink, 'Serif', 'center');
  }
  if (!rowVisibility) return;
  ctx.save();
  ctx.globalAlpha *= rowVisibility;
  label(ctx, 'Learned row A', left, 541, 41);
  stroke(ctx, [[left+13,563],[left,563],[left,651],[left+13,651]], slate, 4);
  stroke(ctx, [[631,563],[644,563],[644,651],[631,651]], slate, 4);
  for (const [i, value] of A[0].entries()) {
    const x = left + i * stride + 56;
    if (codes[i] === key) oval(ctx, x, 607, 38, 36, 0, '#f4b79c');
    label(ctx, String(value), x, 626, 53, codes[i] === key ? '#823117' : slate, 'Mono', 'center');
  }
  if (scoreVisibility) {
    ctx.globalAlpha *= scoreVisibility;
    label(ctx, 'Ax = ' + entries[key].z, 372, 747, 60, coral, 'Mono', 'center');
  }
  ctx.restore();
}
function column(ctx, unfold, visibility) {
  if (!visibility) return;
  ctx.save();
  ctx.globalAlpha *= visibility;
  const center = pattern.x + width * pattern.p / 2;
  label(ctx, 'Column B', center, 232, 44, ink, 'Sans', 'center');
  if (unfold) {
    ctx.save();
    ctx.globalAlpha *= unfold;
    plate(ctx, pattern, false);
    ctx.restore();
  }
  B.forEach(([value], i) => {
    const pitch = mix(6.55, pattern.p, unfold);
    const x = mix(center - 7, pattern.x + i % width * pattern.p, unfold);
    const y = mix(pattern.y + i * 6.55, pattern.y + Math.floor(i / width) * pattern.p, unfold);
    rect(ctx, x + 1, y + 0.5, mix(16, pitch - 3, unfold), pitch - 1.5, value ? coral : '#c4cdc5', pitch * 0.045);
  });
  ctx.restore();
}
function flyingInk(ctx, travel) {
  if (travel <= 0 || travel >= 1) return;
  B.forEach(([value], i) => {
    if (!value) return;
    const x = (i % width) * pattern.p;
    const y = Math.floor(i / width) * pattern.p;
    pixel(ctx, mix(pattern.x, output.x, travel) + x, pattern.y + y - Math.sin(Math.PI * travel) * 65, pattern.p, coral);
  });
}
function macro(ctx, clock, { visible = 1, hero = true } = {}) {
  const { index, elapsed, reveal } = clock;
  const weightRow = index < 2 ? 0 : index === 2 ? ease(reveal('one of four weights', 0.65)) : 1;
  const score = index < 2 ? 0 : index === 2 ? ease(reveal('For accented E', 0.5)) : 1;
  const exposed = index < 3 ? 0 : index === 3 ? ease(elapsed / 0.5) : 1;
  const unfold = index < 3 ? 0 : index === 3 ? ease(reveal('Lay them out', 1.35)) : 1;
  let key = 'É', travel = 0;
  if (index === 4) travel = ease(reveal('the space above', 1.05));
  if (index > 4) travel = 1;
  if (index === 5) key = 'A';
  if (index === 6) {
    key = reveal('last A', 0.08) > 0 ? 'Á' : 'A';
    travel = ease(reveal('Look above it', 0.95));
  }
  if (index === 7) key = 'Á';
  ctx.save();
  ctx.globalAlpha *= visible;
  bench(ctx);
  keys(ctx, key, weightRow, score);
  column(ctx, unfold, exposed);
  const slide = index < 3 ? 0 : index === 3 ? ease(elapsed / 0.85) : 1;
  const current = interpolateGrid(closeUp, output, slide);
  const heading = index < 4 ? 'Frozen base · W₀x' : 'Sign output';
  label(ctx, heading, current.x + width * current.p / 2, current.y - 53, 49, ink, 'Sans', 'center');
  plate(ctx, current, true);
  if (hero) gridInk(ctx, current, key, travel === 1);
  if (index >= 4) {
    flyingInk(ctx, travel);
    label(ctx, 'W₀x + B(Ax)', output.x + width * output.p / 2, 832, 42, ink, 'Mono', 'center');
  }
  if (index === 4) {
    ctx.save();
    ctx.globalAlpha *= ease(reveal('seventy-four weights', 0.45));
    label(ctx, '4 + 70 trainable', 640, 885, 42, slate, 'Sans', 'center');
    ctx.restore();
    ctx.save();
    ctx.globalAlpha *= ease(reveal('base stay frozen', 0.45));
    label(ctx, '4 × 70 frozen', output.x + width * output.p / 2, 885, 42, slate, 'Sans', 'center');
    ctx.restore();
  }
  ctx.restore();
}
function interpolateGrid(a, b, t) {
  return { x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), p: mix(a.p, b.p, t) };
}
function draw(ctx, clock) {
  const { index, elapsed } = clock;
  if (index === 0) {
    street(ctx, '', ease((elapsed + 0.36) / 1.45));
  } else if (index === 1 && elapsed < 1.2) {
    const t = ease(elapsed / 1.2);
    street(ctx, '', 1, [0, 3]);
    macro(ctx, clock, { visible: t, hero: false });
    gridInk(ctx, interpolateGrid(signPosition(0, 3), closeUp, t), 'É', false);
  } else if (index === 5 && clock.reveal('The first A', 1.0) < 1) {
    const t = ease(clock.reveal('The first A', 1.0));
    if (!t) street(ctx, 'É', 1);
    else {
      street(ctx, 'É', 1, [1, 1]);
      macro(ctx, clock, { visible: t, hero: false });
      gridInk(ctx, interpolateGrid(signPosition(1, 1), output, t), 'A', false);
    }
  } else if (index === 7) {
    const t = ease(elapsed / 1.5);
    if (t < 1) {
      macro(ctx, clock, { hero: false });
      ctx.save();
      ctx.globalAlpha *= t;
      street(ctx, 'ÉÁ', 1, [1, 3]);
      ctx.restore();
      gridInk(ctx, interpolateGrid(output, signPosition(1, 3), t), 'Á', true);
    } else street(ctx, 'ÉÁ', 1);
  } else macro(ctx, clock);
}
function check() {
  const delta = B.map(([value]) => A[0].map(coefficient => value * coefficient));
  const marks = [4, 5, 10, 11];
  assert.deepEqual([A[0].length + B.length, W.length * W[0].length], [74, 280]);
  for (const [j, code] of codes.entries()) {
    const { base, change, z, adapted } = entries[code];
    const acute = code !== code.normalize('NFD')[0];
    assert.equal(z, Number(acute));
    assert.deepEqual(change.flatMap((v, i) => v ? [i] : []), acute ? marks : []);
    assert.deepEqual(adapted, base.map((value, i) => value + delta[i][j]));
    assert.deepEqual(adapted, base.map((value, i) => Number(value || (acute && marks.includes(i)))));
  }
  assert.deepEqual(entries['É'].change, entries['Á'].change);
  assert.notDeepEqual(entries['É'].base, entries['Á'].base);
  assert.deepEqual(entries.A.base, entries.A.adapted);
  return true;
}

export default { title: 'LoRA and the missing accents', beats, draw, check };

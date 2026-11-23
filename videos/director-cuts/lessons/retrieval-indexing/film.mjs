import assert from 'node:assert/strict';
import { createCanvas, Path2D } from '@napi-rs/canvas';
import { DOCS, QUERY } from '../../../films/retrieval-indexing/fixtures.mjs';
import { tokenize } from '../../../films/retrieval-indexing/analysis.mjs';

const beats = [
  {
    id: 'the-menu',
    say: "You're looking for a way to make soup. Let's try page four. What can you get from this page?",
    hold: 1.35,
  },
  {
    id: 'two-mentions',
    say: "Tomato soup with bread. It's a lunch menu. Follow that four back to the word soup. The menu says soup twice. One page number in the index covers both mentions.",
    hold: 0.85,
  },
  {
    id: 'the-other-number',
    say: "Follow the other number. Page one has a recipe. Now look under make. You get page one again. If either search word counts, those two pages are all the index can give you.",
    hold: 0.9,
  },
  {
    id: 'change-the-word',
    say: "There's another cooking instruction in this file. Think about what goes in the pot. Look up beans. There's page one again. Which other page can we turn to now?",
    hold: 2.9,
  },
  {
    id: 'the-instruction',
    say: "Cook beans and vegetables together until soft. You could follow that step to make soup. Can you find either of our first two search words on this page?",
    hold: 1.8,
  },
  {
    id: 'the-way-in',
    say: "The writer used neither. An inverted index lists the pages for each word. We found this instruction through beans.",
    hold: 2.8,
  },
];

const entries = Object.entries(DOCS).map(([id, passage]) => ({
  page: Number(id.slice(1)),
  passage,
  terms: tokenize(passage),
}));
const index = new Map();
for (const { page, terms } of entries) {
  for (const term of new Set(terms)) {
    if (!index.has(term)) index.set(term, []);
    index.get(term).push(page);
  }
}
const termsOnFlap = ['beans', 'make', 'soup'];
const typeset = {
  1: ['Soup recipe.', 'Make a pot with beans,', 'carrots, and onions.', 'Simmer until tender.'],
  2: ['Cook beans and', 'vegetables together', 'until soft.'],
  4: ['Soup lunch menu.', 'Tomato soup with bread', 'is served daily.'],
};
function check() {
  const query = tokenize(QUERY);
  assert.deepEqual(query, ['make', 'soup']);
  assert.deepEqual(index.get('make'), [1]);
  assert.deepEqual(index.get('soup'), [1, 4]);
  assert.deepEqual([...new Set(query.flatMap((word) => index.get(word)))], [1, 4]);
  assert.deepEqual(index.get('beans'), [1, 2]);
  assert.equal(entries.find((doc) => doc.page === 4).terms.filter((word) => word === 'soup').length, 2);
  for (const [page, lines] of Object.entries(typeset)) {
    assert.equal(lines.join(' '), DOCS['d' + page]);
  }
}

const W = 1920;
const H = 1080;
const leaf = { x: 905, y: 147, w: 823, h: 722 };
const green = '#213f34';
const tomato = '#a33020';
const clamp = (t) => Math.min(1, Math.max(0, t));
function smooth(t) {
  const s = clamp(t);
  return s * s * (3 - 2 * s);
}
function rect(c, x, y, w, h, color, radius = 0) {
  c.fillStyle = color;
  c.beginPath();
  c.roundRect(x, y, w, h, radius);
  c.fill();
}
function oval(c, x, y, rx, ry, color, angle = 0) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
  c.fill();
}
function curve(c, d, color, stroke, width = 2) {
  const p = new Path2D(d);
  if (color) { c.fillStyle = color; c.fill(p); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(p); }
}
function line(c, x1, y1, x2, y2, color, width = 2) {
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
function label(c, s, x, y, px, color = green, family = 'Lesson Serif', weight = 400, align = 'left') {
  c.font = weight + ' ' + px + 'px "' + family + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.fillText(s, x, y);
}
function random(seed) {
  let v = seed;
  return () => {
    v = (Math.imul(v, 1664525) + 1013904223) >>> 0;
    return v / 4294967296;
  };
}
function flecks(c, w, h, count, seed, light, dark) {
  const rng = random(seed);
  for (let i = 0; i < count; i++) {
    c.fillStyle = i % 3 ? dark : light;
    c.fillRect(rng() * w, rng() * h, 0.7 + 3 * rng(), 0.75 + 1.6 * rng());
  }
}
function slab(c, x, y, w, h, top, side, depth, radius) {
  rect(c, x, y + depth, w, h, side, radius);
  rect(c, x, y, w, h, top, radius);
}
function linen(c) {
  c.save();
  c.translate(1530, -190);
  c.rotate(0.28);
  rect(c, 7, 13, 460, 1370, '#3d3a2c66');
  rect(c, 0, 0, 460, 1370, '#e4c8a1');
  for (let x = 0; x < 460; x += 66) rect(c, x, 0, 30, 1370, '#a43d2b69');
  for (let y = 0; y < 1370; y += 66) rect(c, 0, y, 460, 30, '#a43d2b69');
  for (let x = 0; x < 460; x += 7) rect(c, x, 0, 0.8, 1370, '#fff1c24d');
  c.restore();
}
const rowY = [444, 586, 728];
const pageXs = [642, 751];
function worktop(c) {
  const wood = c.createLinearGradient(0, 0, W, H);
  wood.addColorStop(0, '#8c6949');
  wood.addColorStop(0.6, '#ad8964');
  wood.addColorStop(1, '#795b41');
  rect(c, 0, 0, W + 256, H, wood);
  const rng = random(72);
  for (let i = 0; i < 240; i++) {
    const x = rng() * (W + 256) - 230, y = rng() * H, len = 40 + rng() * 600;
    c.beginPath();
    c.moveTo(x, y);
    c.bezierCurveTo(x + len / 3, y - 2, x + 2 * len / 3, y + 7, x + len, y + 3);
    c.strokeStyle = i % 4 ? '#562f1e24' : '#fce0b73b';
    c.lineWidth = rng() * 2 + 0.5;
    c.stroke();
  }
  linen(c);
  flecks(c, W + 256, H, 4300, 73, '#fff3bf21', '#493e3017');
}
function binder(c) {
  c.save();
  c.shadowBlur = 30; c.shadowOffsetY = 28; c.shadowColor = '#221b15a8';
  rect(c, 104, 75, 1680, 840, '#38291c', 43);
  c.restore();
  slab(c, 104, 74, 1680, 838, '#743c2a', '#493025', 16, 42);
  rect(c, 116, 85, 1656, 812, '#a65538', 34);
  for (let i = 0; i < 2; i++) {
    const x = i ? 879 : 133;
    rect(c, x, 100, i ? 876 : 714, 780, '#263d34', 26);
    rect(c, x + 6, 106, i ? 864 : 702, 768, '#406055', 23);
  }
  rect(c, 851, 85, 26, 810, '#683c2a', 8);
  for (const y of [241, 653]) {
    slab(c, 832, y, 64, 95, '#c89555', '#553a28', 4, 9);
    for (const x of [841, 887]) {
      for (const yy of [y + 15, y + 81]) {
        oval(c, x, yy, 4, 4, '#493626');
        line(c, x - 2, yy + 2, x + 2, yy - 2, '#b99b69', 1.3);
      }
    }
    slab(c, 855, y - 5, 17, 104, '#e3b971', '#64472e', 2, 5);
  }
  // A word index pasted into the left cover. The page stack turns independently.
  slab(c, 161, 137, 650, 705, '#e3c78e', '#26352c', 6, 3);
  rect(c, 169, 143, 634, 691, '#f1dbac', 2);
  line(c, 209, 319, 757, 319, tomato, 5);
  line(c, 209, 328, 757, 328, tomato, 1.6);
  label(c, 'Word index', 207, 277, 91, green);
  for (let i = 0; i < termsOnFlap.length; i++) {
    const word = termsOnFlap[i], y = rowY[i];
    label(c, word, 227, y + 19, 66);
    const start = 243 + c.measureText(word).width;
    for (let x = start; x < 580; x += 17) oval(c, x, y + 9, 2.6, 2.6, '#8d7955');
    index.get(word).forEach((page, j) => label(c, String(page), pageXs[j], y + 18, 62, green, 'Lesson Serif', 400, 'center'));
    if (i < termsOnFlap.length - 1) line(c, 221, y + 63, 761, y + 63, '#aa906348', 2);
  }
  rect(c, 175, 379, 8, 394, '#b3905d', 4);
  rect(c, 176, 379, 3, 394, '#6f5e41', 2);
  for (let i = 5; i >= 0; i--) {
    slab(c, leaf.x + (i % 2), leaf.y + 2 + i * 3.1, leaf.w, leaf.h, i % 2 ? '#dfc490' : '#efe0b7', '#ac936c', 2, 4);
  }
  c.save();
  c.globalCompositeOperation = 'source-atop';
  flecks(c, W, H, 6800, 38, '#fff3bf21', '#493e3017');
  c.restore();
}

function basil(c, x, y, scale, angle) {
  c.save(); c.translate(x, y); c.rotate(angle); c.scale(scale, scale);
  curve(c, 'M0 0 Q-47 -44 -2 -87 Q35 -55 0 0Z', '#385e44');
  curve(c, 'M0 -3 Q-8 -44 -2 -78 M-5 -35 L-20 -52 M-6 -49 L9 -63', null, '#a5ad6d', 3);
  c.restore();
}
function roll(c) {
  c.save(); c.translate(254, 115); c.rotate(-0.30);
  curve(c, 'M-94 -12 C-86 -62 -16 -78 59 -56 Q117 -40 106 3 Q98 40 26 47 Q-85 67 -94 -12Z', '#a45530', green, 4);
  curve(c, 'M-90 -20 C-61 -67 37 -72 86 -43 Q113 -25 84 -5 Q22 33 -58 23 Q-89 18 -90 -20Z', '#dca55c');
  for (let i = 0; i < 3; i++) {
    const x = -56 + i * 47;
    c.save(); c.translate(x, 0);
    curve(c, 'M0 -46 Q29 -36 38 -16 Q14 -24 0 -46Z', '#efce8b');
    c.restore();
  }
  c.restore();
}
function bowl(c) {
  c.save(); c.translate(375, 307);
  oval(c, 33, 93, 233, 20, '#806a3735');
  roll(c);
  curve(c, 'M-224 -22 C-210 51 -143 103 -37 108 C96 119 183 62 211 -24Z', '#42634f', green, 5);
  curve(c, 'M-196 8 Q-134 73 -9 79 Q105 83 177 34 Q98 101 -23 98 Q-137 93 -196 8Z', '#1e453d');
  for (let i = -7; i <= 6; i++) {
    const x = i * 25;
    c.beginPath(); c.moveTo(x, 23 - Math.abs(i) * 1.7);
    c.quadraticCurveTo(x * 0.92, 51, x * 0.82, 64 - Math.abs(i) * 3.6);
    c.strokeStyle = '#c1bc86'; c.lineWidth = 3; c.stroke();
  }
  oval(c, -6, -24, 220, 74, '#f6e6b9', -0.015);
  oval(c, -6, -22, 204, 59, '#9e3e24');
  oval(c, -7, -18, 195, 49, '#ce6037');
  const r = random(41);
  for (let i = 0; i < 38; i++) {
    const a = r() * Math.PI * 2, radius = Math.sqrt(r());
    oval(c, -7 + radius * 183 * Math.cos(a), -18 + radius * 43 * Math.sin(a), 2 + r() * 4, 1.4, i % 3 ? '#a94527' : '#e8a055', -0.2);
  }
  basil(c, -11, -12, 0.55, -1.05); basil(c, -10, -14, 0.49, 0.85);
  c.restore();
}
function pot(c) {
  c.save(); c.translate(387, 281);
  oval(c, 6, 107, 204, 18, '#756d3d30');
  curve(c, 'M-155 -35 C-260 -77 -241 33 -151 18 M152 -37 C260 -81 247 28 151 16', null, '#31483b', 19);
  curve(c, 'M-171 -36 L-153 67 Q-143 102 -12 107 Q131 111 153 72 L172 -38Z', '#b75235', green, 5);
  curve(c, 'M-148 54 Q8 95 151 54 L146 73 Q18 130 -138 83Z', '#823c2c');
  oval(c, 0, -40, 175, 49, '#263f34');
  oval(c, 0, -37, 159, 34, '#d3964c');
  const r = random(91);
  for (let i = 0; i < 23; i++) {
    const a = r() * 6.28, z = Math.sqrt(r());
    oval(c, Math.cos(a) * 146 * z, -38 + Math.sin(a) * 26 * z, 6 + r() * 9, 4, i % 2 ? '#994730' : '#dbb66e', -0.25);
  }
  curve(c, 'M70 -39 L155 -148 Q161 -158 172 -152 Q180 -147 173 -137 L89 -35Z', '#8e623a', '#4c4932', 3.5);
  for (let i = 0; i < 4; i++) line(c, -130 + 9*i, 2, -123 + 9*i, 58, '#e4b276', 3);
  c.restore();
}
function bean(c, x, y, scale, angle, shade) {
  c.save(); c.translate(x, y); c.rotate(angle); c.scale(scale, scale);
  curve(c, 'M-71 -22 C-62 -61 -10 -68 30 -56 C84 -42 99 11 65 43 C42 66 14 56 6 29 Q0 11 -23 22 C-49 38 -81 17 -71 -22Z', shade, '#683c2d', 4);
  curve(c, 'M-52 -24 Q-30 -61 23 -44 M-43 -25 Q-20 -49 5 -43 M24 15 Q26 39 47 40', null, '#e9ac78', 4);
  const r = random(101);
  for (let i = 0; i < 32; i++) {
    const px = -42 + r() * 102;
    const py = -35 + r() * 30;
    line(c, px, py, px + 3 + r() * 6, py - 2, '#813e2e84', 2);
  }
  c.restore();
}
function beanBranch(c) {
  c.save(); c.translate(478, 525);
  curve(c, 'M-249 89 Q-167 40 -102 -37 Q-58 -94 -4 -91 Q-53 -33 -95 1 Q-144 44 -249 89Z', '#64805b', green, 4);
  curve(c, 'M-238 82 Q-142 36 -83 -32 L-13 -84', null, '#f0d7a4', 3.5);
  bean(c, -102, 35, 0.86, -0.55, '#b86244');
  bean(c, 39, -10, 0.94, 0.43, '#a54c37');
  bean(c, 150, 72, 0.69, -0.31, '#bd6d4f');
  c.restore();
}
function paperNumber(c, page, ink) {
  const x = 739;
  c.strokeStyle = ink; c.lineWidth = 2.5;
  c.beginPath(); c.arc(x, 83, 43, 0, Math.PI * 2); c.stroke();
  label(c, String(page), x, 104, 64, ink, 'Lesson Serif', 400, 'center');
}
function underline(c, x, y, w, fraction, color) {
  if (fraction <= 0) return;
  const k = clamp(fraction);
  c.strokeStyle = color; c.lineCap = 'round'; c.lineWidth = 6;
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w*k/2, y + 4*k, x + w*k, y - 1.5*k); c.stroke();
}
function makePage(page) {
  const surface = createCanvas(leaf.w, leaf.h);
  const c = surface.getContext('2d');
  const pageTone = page === 4 ? '#f8dfac' : page === 2 ? '#e3e8c8' : '#f5e5bb';
  rect(c, 0, 0, leaf.w, leaf.h, pageTone, 3);
  if (page !== 0) {
    const copy = typeset[page];
    const ink = page === 4 ? tomato : green;
    paperNumber(c, page, ink);
    if (page === 2) {
      let y = 207;
      for (const row of copy) { label(c, row, 66, y, 76, green); y += 96; }
      beanBranch(c);
    } else {
      label(c, copy[0], 52, 155, 73, ink);
      line(c, 55, 180, 766, 180, ink, 2.5);
      if (page === 4) {
        bowl(c);
        label(c, copy[1], 60, 529, 54);
        label(c, copy[2], 60, 599, 54);
        line(c, 58, 655, 762, 655, tomato, 3);
        line(c, 58, 665, 762, 665, tomato, 1.5);
      } else {
        pot(c);
        for (let i = 1; i <= 3; i++) label(c, copy[i], 61, 481 + (i - 1) * 65, 53);
      }
    }
  }
  flecks(c, leaf.w, leaf.h, 4700, 80 + page, '#fff9d958', '#53462c18');
  const shade = c.createLinearGradient(0, 0, 0, 82);
  shade.addColorStop(0, '#8c73452f'); shade.addColorStop(1, '#8c734500');
  rect(c, 0, 0, leaf.w, 82, shade);
  return surface;
}

let set;
function getSet() {
  if (set) return set;
  const counter = createCanvas(W + 256, H);
  worktop(counter.getContext('2d'));
  const caseArt = createCanvas(W, H);
  binder(caseArt.getContext('2d'));
  const pages = new Map([0, 1, 2, 4].map((n) => [n, makePage(n)]));
  const marked = new Map();
  for (const n of [1, 4]) {
    const surface = createCanvas(leaf.w, leaf.h);
    const ink = surface.getContext('2d');
    ink.drawImage(pages.get(n), 0, 0);
    if (n === 4) {
      underlineWord(ink, typeset[n][0], 'soup', 52, 155, 73, 1);
      underlineWord(ink, typeset[n][1], 'soup', 60, 529, 54, 1);
    } else {
      underlineWord(ink, typeset[n][1], 'beans', 61, 481, 53, 1);
    }
    marked.set(n, surface);
  }
  set = { counter, caseArt, pages, marked };
  return set;
}

function rings(c) {
  for (const offset of [112, 289, 533, 710]) {
    const x = leaf.x + offset;
    oval(c, x + 3, leaf.y + 20, 10, 11, '#7a6b46');
    oval(c, x + 1, leaf.y + 17, 8, 9, '#3a3327');
    c.save(); c.translate(x, leaf.y);
    const loop = 'M-10 -12 C-28 -55 17 -57 12 -15 Q10 4 1 18';
    curve(c, loop, null, '#524535', 12);
    curve(c, loop, null, '#c79d62', 7.5);
    curve(c, 'M-15 -29 Q-15 -49 -2 -43 M13 -26 Q13 -8 5 8', null, '#fae6ae', 3);
    c.restore();
  }
}
function slider(c, y) {
  c.save(); c.translate(175, y);
  curve(c, 'M-29 -15 L14 -15 L37 0 L14 15 L-29 15 Q-35 0 -29 -15Z', '#704e32', '#493d2b', 2);
  curve(c, 'M-29 -18 L12 -18 L35 -3 L12 10 L-29 10 Q-35 -3 -29 -18Z', '#ce9d58');
  line(c, -27, -13, 11, -13, '#f2d094', 3);
  for (let x = -20; x < -3; x += 5) line(c, x, -9, x, 5, '#85603d', 1.5);
  c.restore();
}
function pencilCircle(c, x, y, r, amount) {
  if (amount <= 0) return;
  c.save();
  c.translate(x, y);
  c.rotate(-0.17);
  c.beginPath();
  const segments = Math.ceil(52 * amount);
  for (let i = 0; i <= segments; i++) {
    const a = -2.1 + 6.47 * amount * i / segments;
    const x = (r + 1.6 * Math.sin(3 * a)) * Math.cos(a);
    const y = r * 1.08 * Math.sin(a);
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.lineCap = 'round'; c.lineWidth = 5; c.strokeStyle = tomato; c.stroke();
  c.restore();
}
function underlineWord(c, full, word, x, y, size, amount) {
  const start = full.toLowerCase().indexOf(word);
  if (start < 0) return;
  c.font = '400 ' + size + 'px "Lesson Serif"';
  const before = c.measureText(full.slice(0, start)).width;
  const width = c.measureText(full.slice(start, start + word.length)).width;
  underline(c, x + before, y + 9, width, amount, tomato);
}

// The leaves hang from the top wire. Each strip projects at a different angle
// while the lower edge curls toward the viewer.
function turning(c, surface, open) {
  if (open <= 0) return;
  if (open >= 1) { c.drawImage(surface, leaf.x, leaf.y); return; }
  const s = smooth(open), lift = Math.sin(Math.PI * s);
  const edge = leaf.y + leaf.h * s;
  const shadow = c.createLinearGradient(0, edge, 0, edge + 46 * lift + 1);
  shadow.addColorStop(0, '#4b322f60'); shadow.addColorStop(1, '#4b322f00');
  rect(c, leaf.x + 3, edge, leaf.w - 6, 46 * lift, shadow);
  const count = 36;
  for (let i = 0; i < count; i++) {
    const a = i / count, b = (i + 1) / count;
    const project = (v) => leaf.h * s * (v + 0.12 * lift * v * (1 - v));
    const y = leaf.y + project(a);
    const height = project(b) - project(a);
    const flare = 14 * lift * a;
    c.drawImage(surface, 0, a * leaf.h, leaf.w, leaf.h / count,
      leaf.x - flare, y, leaf.w + 2 * flare, height + 0.7);
  }
  const curl = c.createLinearGradient(0, leaf.y, 0, Math.max(leaf.y + 1, edge));
  curl.addColorStop(0, '#50362200'); curl.addColorStop(0.76, '#50362206');
  curl.addColorStop(0.92, '#ffedbd39'); curl.addColorStop(1, '#67472c58');
  rect(c, leaf.x, leaf.y, leaf.w, edge - leaf.y, curl);
}
function draw(c, clock) {
  const { index: beat, elapsed, reveal, speechDuration } = clock;
  const { counter, caseArt, pages, marked } = getSet();
  const soup = rowY[2], make = rowY[1], beans = rowY[0];
  let finger = soup;
  let page = 4;
  let circledNumber = 4, circledWord = 'soup', circled = 1;
  let mentions = 0, ingredient = 0, finalWord = 0, both = 0;
  let unfold = 1;
  let turn;
  if (beat === 0) {
    unfold = 0;
    page = 0;
    turn = { page: 4, open: 0.14 + 0.86 * clamp(elapsed / 1.08) };
  } else if (beat === 1) {
    unfold = smooth(reveal('Follow that four back', 1.65));
    mentions = reveal('The menu says soup twice', 0.9);
  } else if (beat === 2) {
    const flip = clamp(elapsed / 1.05);
    const move = smooth(reveal('Now look under make', 0.7));
    both = smooth(reveal('If either search word counts', 1.15));
    page = 1;
    turn = { page: 4, open: 1 - flip, marked: true };
    finger = soup + (make - soup) * move;
    circledWord = move >= 0.5 ? 'make' : 'soup';
    circledNumber = 1;
    circled = smooth(flip) * Math.abs(2 * move - 1);
  } else if (beat === 3) {
    const move = smooth(reveal('Look up beans', 0.75));
    both = 1 - move;
    const second = smooth((elapsed - speechDuration - 0.1) / 0.64);
    finger = make + (beans - make) * move;
    circledWord = move >= 0.5 ? 'beans' : 'make';
    circledNumber = second >= 0.5 ? 2 : 1;
    circled = Math.abs(2 * move - 1) * Math.abs(2 * second - 1);
    // The answer lands in the quiet after the question, before the next line.
    const flip = clamp((elapsed - speechDuration - 1.0) / 1.05);
    ingredient = reveal('Think about what goes in the pot', 0.85);
    page = 2;
    turn = { page: 1, open: 1 - flip, marked: flip > 0 };
  } else {
    page = 2;
    finger = beans;
    circledWord = 'beans';
    circledNumber = 2;
    if (beat === 5) finalWord = reveal('We found this instruction', 1.0);
  }
  c.save();
  const close = 1 - unfold;
  c.translate(-920 * close, -154 * close);
  c.scale(1 + 0.42 * close, 1 + 0.42 * close);
  c.drawImage(counter, 0, 0);
  const hinge = 862;
  c.drawImage(caseArt, hinge, 0, W - hinge, H, hinge, 0, W - hinge, H);
  c.save();
  c.translate(hinge, 0);
  // The index flap opens from behind the recipe stand.
  c.scale(Math.max(0.001, unfold), 1);
  c.translate(-hinge, 0);
  c.drawImage(caseArt, 0, 0, hinge, H, 0, 0, hinge, H);
  slider(c, finger);
  const row = termsOnFlap.indexOf(circledWord);
  const slot = index.get(circledWord).indexOf(circledNumber);
  pencilCircle(c, pageXs[slot], rowY[row] - 2, 38, circled);
  if (both > 0) {
    for (const i of index.get('soup').keys()) pencilCircle(c, pageXs[i], soup - 2, 38, both);
  }
  c.restore();
  c.drawImage(pages.get(page), leaf.x, leaf.y);
  if (turn) turning(c, (turn.marked ? marked : pages).get(turn.page), turn.open);
  c.save(); c.translate(leaf.x, leaf.y);
  if (mentions) {
    underlineWord(c, typeset[4][0], 'soup', 52, 155, 73, clamp(mentions * 2));
    underlineWord(c, typeset[4][1], 'soup', 60, 529, 54, clamp(mentions * 2 - 1));
  }
  if (ingredient && turn.open === 1) underlineWord(c, typeset[1][1], 'beans', 61, 481, 53, ingredient);
  if (finalWord) underlineWord(c, typeset[2][0], 'beans', 66, 207, 76, finalWord);
  c.restore();
  rings(c);
  c.restore();
}

export default { title: 'How a word finds a page', beats, draw, check };

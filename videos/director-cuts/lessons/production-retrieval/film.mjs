import assert from 'node:assert/strict';
import { governingRecall } from '../../../films/production-retrieval/arithmetic.mjs';
import { ROTATION_RULE } from '../../../films/production-retrieval/fixtures.mjs';

const title = 'The passage on the shelf';
const beats = [
  { id: 'red-binding', say: 'Luna wants to know whether a stale service key can rotate automatically. This red volume holds the only passage that gives her the rule. Keep an eye on it.', hold: 1.0 },
  { id: 'shelve-by-distance', say: 'Each book stands for a passage Luna can read. Exact search scores them all. The shelf puts the ten nearest to her question in order. Her rule comes ninth.', hold: 1.2 },
  { id: 'collection', say: 'Now a faster, approximate search picks ten from the same collection, using the same distance measure. Its picks go on the cart.', hold: 2.1 },
  { id: 'count-the-gaps', say: 'Look at the gaps on the upper shelf. Eight of the ten nearest passages came down. The two striped books came from farther along. That gives the approximate search a nearest-neighbor recall of eight out of ten.', hold: 0.9 },
  { id: 'left-behind', say: 'Where did the red book end up? It stayed on the shelf. Luna needed one passage, and the search missed it. Even if every book on that cart fits in the prompt, the model still lacks her rule.', hold: 1.4 },
  { id: 'exchange', say: 'Try one change to the search results. Send volume eight back. Take the red book in its place. Which count will change?', hold: 2.0 },
  { id: 'same-overlap', say: 'Both books belonged to the ten nearest, so eight of those ten are still on the cart. This time the search recovered the one required passage. For this question, candidate recall went from zero to one.', hold: 1.1 },
  { id: 'open-to-the-rule', say: 'Open the policy. The key can rotate automatically up to fourteen days after it goes stale, provided the risk signal is at most forty-eight hours old. Luna can now check both conditions.', hold: 2.8 },
];

const exact = Array.from({ length: 10 }, (_, i) => i + 1);
const required = [9];
const catalogue = [...exact, 'X', 'Y'];
const firstReturn = [...exact.slice(0, 8), 'X', 'Y'];
const secondReturn = firstReturn.map(id => id === 8 ? required[0] : id);

function check() {
  for (const returned of [firstReturn, secondReturn]) {
    assert.equal(new Set(returned).size, 10);
    assert.ok(returned.every(id => catalogue.includes(id)));
  }
  assert.deepEqual(governingRecall(exact, firstReturn, required), { ann: 0.8, task: 0 });
  assert.deepEqual(governingRecall(exact, secondReturn, required), { ann: 0.8, task: 1 });
  assert.deepEqual(firstReturn.filter(id => !secondReturn.includes(id)), [8]);
  assert.deepEqual(secondReturn.filter(id => !firstReturn.includes(id)), required);
  assert.match(ROTATION_RULE, /up to 14 days after becoming stale, provided the risk signal is at most 48 hours old/);
}

const ink = '#2c293c';
const paper = '#fff1d2';
const red = '#bc342f';
const colors = ['#35568a', '#517999', '#283f69', '#476886', '#46618d', '#325777', '#4b6c96', '#354f83', red, '#496889', '#695779', '#715d7b'];
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => { const t = clamp(x); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const shelfX = i => i < 10 ? 220 + 129 * i : 1570 + 124 * (i - 10);
const cartX = slot => 233 + 154 * slot;
const pad = id => typeof id === 'number' ? String(id).padStart(2, '0') : id;

function box(c, x, y, w, h, fill) {
  c.fillStyle = fill;
  c.fillRect(x, y, w, h);
}
function round(c, x, y, w, h, r, fill) {
  c.fillStyle = fill;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
function polygon(c, points, fill) {
  c.fillStyle = fill;
  c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath();
  c.fill();
}
function line(c, x, y, x2, y2, color, width = 2) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x2, y2);
  c.stroke();
}
function label(c, text, x, y, size, color, family = 'Sans', weight = 500, align = 'left') {
  c.fillStyle = color;
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(text, x, y);
}
function disc(c, x, y, r, fill) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
}

// A stamped key appears on the binding, the front board and the policy leaf.
function key(c, x, y, size, color, angle = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(size, size);
  c.lineWidth = 4.5;
  c.strokeStyle = color;
  c.beginPath();
  c.ellipse(-17, 0, 10, 12, 0, 0, 2 * Math.PI);
  c.stroke();
  box(c, -7, -2.5, 36, 5, color);
  box(c, 18, 0, 4.8, 8, color);
  box(c, 25, 0, 4.8, 11, color);
  c.restore();
}

function room(c) {
  const wall = c.createLinearGradient(120, 0, 1790, 1000);
  wall.addColorStop(0, '#f1dfd0');
  wall.addColorStop(0.58, '#e6cfcb');
  wall.addColorStop(1, '#c7b6c7');
  box(c, -500, -500, 3000, 2000, wall);
  polygon(c, [[-480,-400],[835,-400],[189,1090],[-480,1090]], '#f6e6d7');
  polygon(c, [[904,-400],[1052,-400],[406,1090],[258,1090]], '#f4e3d5');
  box(c, -500, 921, 3000, 300, '#beb0b4');
  box(c, -500, 913, 3000, 8, '#cfc0c0');
  for (let i = 0; i < 200; i++) {
    const x = (i * 691) % 1963;
    const y = (i * 433) % 914;
    line(c, x, y, x + 1 + i % 6, y - 1, '#65586a0b', 1.4);
  }
}

function shelf(c, headers) {
  // The two strips of birch ply end at the cut between ranks ten and eleven.
  for (const [left, width] of [[121, 1370], [1503, 305]]) {
    polygon(c, [[left,443],[left+width,443],[left+width+35,487],[left+33,487]], '#55415a26');
    polygon(c, [[left,429],[left+23,402],[left+width+20,402],[left+width,429]], '#ecd3ad');
    box(c, left, 428, width, 43, '#ddba93');
    for (let y = 430; y < 471; y += 8) line(c, left, y, left+width, y, '#84625738', 1.5);
    box(c, left, 468, width, 3, '#967262');
  }
  for (let i = 0; i < catalogue.length; i++) {
    const x = shelfX(i);
    polygon(c, [[x-49,420],[x-38,405],[x+51,405],[x+40,420]], '#bba38d');
    line(c, x-48, 420, x+40, 420, '#fae3bf', 2);
    label(c, pad(catalogue[i]), x, 458, 24, '#4e3d42', 'Mono', 500, 'center');
  }
  if (headers > 0) {
    c.save();
    c.globalAlpha = headers;
    label(c, 'Exact search', 136, 127, 53, ink, 'Serif');
    label(c, '10 nearest passages', 459, 126, 35, ink);
    line(c, 137, 150, 1457, 150, '#756375', 2);
    line(c, 1457, 149, 1457, 168, '#756375', 2);
    label(c, 'Farther away', 1658, 127, 32, ink, 'Sans', 500, 'center');
    line(c, 1510, 150, 1802, 150, '#756375', 2);
    c.restore();
  }
}

function wheel(c, x, y) {
  polygon(c, [[x-26,y-56],[x+20,y-56],[x+8,y-1],[x-19,y-1]], '#74474b');
  disc(c, x, y, 32, '#3c3744');
  disc(c, x, y, 21, '#877677');
  disc(c, x, y, 10, '#483c45');
}

function cart(c, travel, answers, annOpacity, ruleOpacity) {
  c.save();
  c.translate(-2050 * (1 - travel), 0);
  c.beginPath();
  c.ellipse(982, 979, 817, 22, 0, 0, 2*Math.PI);
  c.fillStyle = '#73616d3b';
  c.fill();
  wheel(c, 260, 952);
  wheel(c, 1636, 952);
  box(c, 186, 887, 1532, 32, '#9a5955');
  // Uprights and the push handle sit behind the books.
  round(c, 143, 634, 31, 189, 12, '#a86461');
  round(c, 1676, 576, 31, 258, 12, '#93545a');
  round(c, 1680, 577, 144, 24, 12, '#9a6160');
  round(c, 1777, 574, 66, 29, 13, '#5b4a50');
  polygon(c, [[137,772],[194,734],[1756,734],[1711,772]], '#efb0a0');
  polygon(c, [[1711,772],[1756,734],[1756,869],[1711,904]], '#a96262');
  round(c, 137, 769, 1576, 135, 8, '#d98c82');
  line(c, 150, 782, 1700, 782, '#f4beb0', 3);
  line(c, 155, 892, 1698, 892, '#b77470', 3);
  label(c, 'Approximate search', 184, 850, 45, '#342b39', 'Serif');
  const readings = [
    { name: 'Exact neighbors', x: 743, opacity: annOpacity, n: answers.ann * exact.length, d: exact.length },
    { name: 'Required passage', x: 1263, opacity: ruleOpacity, n: answers.task * required.length, d: required.length },
  ];
  for (const r of readings) {
    if (r.opacity <= 0) continue;
    c.save();
    c.globalAlpha = r.opacity;
    line(c, r.x-27, 803, r.x-27, 871, '#925e61', 2);
    label(c, r.name, r.x, 820, 38, ink);
    label(c, r.n + ' / ' + r.d, r.x, 877, 63, ink, 'Mono', 600);
    c.restore();
  }
  c.restore();
}

function spine(c, i, h) {
  const id = catalogue[i];
  const color = colors[i];
  const w = id === 9 ? 94 : 84 + ((i * 7) % 13);
  const l = -w / 2;
  polygon(c, [[l,-h],[l+13,-h-8],[w/2+13,-h-8],[w/2,-h]], '#f4d7af');
  line(c, l+11, -h-5, w/2+5, -h-5, '#bca488', 1.5);
  polygon(c, [[w/2,-h],[w/2+13,-h-8],[w/2+13,-7],[w/2,0]], '#334055');
  round(c, l, -h, w, h, 4, color);
  const curve = c.createLinearGradient(l, 0, w/2, 0);
  curve.addColorStop(0, '#231d313f');
  curve.addColorStop(0.14, '#ffffff1b');
  curve.addColorStop(0.5, '#ffffff00');
  curve.addColorStop(1, '#241d3047');
  box(c, l, -h, w, h, curve);
  for (let row = 0; row < 16; row++) {
    let u = (row*37+i*11)%65;
    line(c, l+7+u, -h+12+row*10, l+12+u, -h+11+row*10, '#fff2d21b', 1);
  }
  for (const y of [-h+15, -h+19, -19, -14]) line(c, l+5, y, w/2-5, y, '#f8debc9c', 1.5);
  if (id === 9) {
    key(c, 0, -h+64, 0.95, paper, -Math.PI/2);
  } else if (i >= 10) {
    c.save();
    c.beginPath();
    c.rect(l+2, -h+27, w-4, 48);
    c.clip();
    for (let s = -120; s < 100; s += 20)
      line(c, s, -h+80, s+60, -h+20, '#d4b6c9', 6);
    c.restore();
  } else {
    const y = -h+52;
    for (let n = 0; n < 3; n++) {
      line(c, -18+n*3, y+n*6, 18-n*3, y+n*6, '#d6dfdf95', 1.7);
    }
  }
  label(c, pad(id), 0, -42, 37, paper, 'Serif', 500, 'center');
}

function cover(c, openness, leaf) {
  // Turn the broad front board towards the camera about its sewn hinge.
  if (openness <= 0) return;
  c.save();
  c.translate(40, -2);
  c.scale(openness, 1);
  const w = 334, h = 238;
  round(c, -w+3, -h+5, w, h, 4, '#692c37');
  box(c, -w+7, -h+5, w-9, h-5, '#e9caaa');
  round(c, -w, -h, w, h-2, 3, red);
  box(c, -17, -h, 11, h-3, '#9f2f32');
  box(c, -20, -h, 3, h-3, '#ed7861');
  c.strokeStyle = '#e5a181';
  c.lineWidth = 1.2;
  c.strokeRect(-w+11, -h+12, w-42, h-28);
  if (!leaf) {
    label(c, 'EU ACCESS POLICY', -w+30, -h+46, 16, paper, 'Mono');
    label(c, 'Key', -w+28, -h+110, 51, paper, 'Serif');
    label(c, 'rotation', -w+28, -h+161, 51, paper, 'Serif');
    key(c, -87, -49, 1.2, paper, -0.25);
  } else {
    // The book opens at the rule. Its flyleaf keeps the identity visible.
    const gutter = -w+140;
    const right = gutter+310;
    round(c, -w-2, -h+2, right+w+8, h, 4, red);
    polygon(c, [[-w+3,-h+4],[gutter,-h+1],[right,-h+5],[right,-5],[gutter,-1],[-w+3,-4]], '#ddc5a6');
    const page = c.createLinearGradient(gutter-35, 0, gutter+42, 0);
    page.addColorStop(0, '#f5dfb9');
    page.addColorStop(0.45, '#ebcea5');
    page.addColorStop(0.49, '#bd9d82');
    page.addColorStop(0.52, '#eed6b2');
    page.addColorStop(1, '#fff1d2');
    polygon(c, [[-w+5,-h+2],[gutter,-h+5],[right-2,-h+1],[right-2,-9],[gutter,-4],[-w+5,-10]], page);
    label(c, 'EU POLICY', -w+25, -h+46, 16, ink, 'Mono');
    key(c, -w+71, -h+111, 1.15, red, -0.5);
    label(c, 'Key rotation', -w+70, -h+163, 19, ink, 'Serif', 500, 'center');
    const tx = gutter+23;
    label(c, 'Automatic rotation', tx, -h+44, 28, ink, 'Serif');
    line(c, tx, -h+57, right-18, -h+57, '#bda595');
    label(c, 'Time since key went stale', tx, -h+88, 22, ink);
    label(c, 'Up to 14 days', tx, -h+123, 34, red, 'Serif');
    label(c, 'Age of risk signal', tx, -h+161, 22, ink);
    label(c, 'Up to 48 hours', tx, -h+199, 34, red, 'Serif');
    polygon(c, [[right-28,-h+1],[right-17,-h+1],[right-17,-h+29],[right-22,-h+25],[right-28,-h+30]], red);
  }
  c.restore();
}

function draw(c, clock) {
  const b = clock.index;
  const cue = (index, phrase, span) => b < index ? 0 : b > index ? 1 : ease(clock.reveal(phrase, span));
  const unfold = b === 0 ? ease((clock.elapsed + 0.14) / 1.4) : 1;
  const wide = cue(1, 'Each book', 2.5);
  const trolley = cue(2, 'Now a faster', 1.7);
  const pick = cue(2, 'Its picks', 2.55);
  const giveBack = cue(5, 'Send volume eight back', 1.05);
  const fetch = cue(5, 'Take the red book', 1.45);
  const end = cue(7, 'Open the policy', 2.05);
  const score = governingRecall(exact, fetch === 1 ? secondReturn : firstReturn, required);
  const exchanging = b === 5 && giveBack > 0;
  const nearest = b < 6 ? cue(3, 'Eight of the ten', 0.5) : cue(6, 'Both books', 0.5);
  const found = b < 6 ? cue(4, 'It stayed on the shelf', 0.6) : cue(6, 'This time', 0.5);

  const followRed = cue(4, 'Where did the red book', 1.8) * (1-cue(6, 'Both books', 1.8));
  const focusX = mix(mix(shelfX(8)-96, 960+315*followRed, wide), 1156, end);
  const focusY = mix(mix(316, 540-17*followRed, wide), 742, end);
  const zoom = mix(mix(2.8, 1+0.42*followRed, wide), 2.12, end);
  c.save();
  c.translate(960, 540);
  c.scale(zoom, zoom);
  c.translate(-focusX, -focusY);
  room(c);
  shelf(c, wide * (1-end));
  cart(c, trolley, score, exchanging ? 0 : nearest, exchanging ? 0 : found);

  const books = catalogue.map((id, i) => {
    let slot = firstReturn.indexOf(id);
    let travel = slot < 0 ? 0 : ease((pick * 1.55 - slot*0.058));
    if (id === 8) travel *= 1 - giveBack;
    if (id === 9) { slot = secondReturn.indexOf(id); travel = fetch; }
    const arc = Math.sin(Math.PI * travel);
    const open = id === 9 ? Math.max(unfold * (1-wide), end) : 0;
    return {
      i, open, travel,
      x: mix(shelfX(i), cartX(slot), travel) + arc*24,
      y: mix(418, 756, travel) - 48*arc - 20*open,
      tilt: arc*0.095 - 0.034*open,
      h: id === 9 ? 240 : 191 + (i*17 % 43),
    };
  });
  books.sort((a, d) => a.open - d.open || a.y - d.y || a.i - d.i);
  for (const book of books) {
    const { x, y, i, open, h, tilt, travel } = book;
    c.save();
    c.translate(x, y);
    c.rotate(tilt);
    const shrink = mix(1, 0.86, travel);
    c.scale(shrink, shrink);
    polygon(c, [[-38,-h],[38,-h],[65,-h+24],[65,1],[-22,2]], '#49314520');
    spine(c, i, h);
    if (i === 8) cover(c, open, b === 7);
    c.restore();
  }
  c.restore();
}

export default { title, beats, draw, check };

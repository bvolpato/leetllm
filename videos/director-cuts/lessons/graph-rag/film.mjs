import assert from 'node:assert/strict';
import { Path2D } from '@napi-rs/canvas';
import { EDGES, RECORDS, REVIEWED_SUPPORT } from '../../../films/graph-rag/fixtures.mjs';

const catalog = {
  'person:lena': 'Lena',
  'book:river': 'River Walk',
  'place:river': 'River Walk',
  'publisher:willow': 'Willow Press',
};
const shelf = ['book:river', 'place:river'];

// The catalogue has a reviewed, directed index. Each hop retrieves its own passage.
function retrieve(seed, relations, records = RECORDS) {
  let current = seed;
  const path = [];
  for (const relation of relations) {
    const edge = EDGES.find(e => e.from === current && e.relation === relation);
    if (!edge) break;
    const passage = records[edge.source];
    const supported = REVIEWED_SUPPORT.some(e =>
      e.from === edge.from && e.to === edge.to && e.relation === edge.relation &&
      e.source === edge.source && e.version === passage?.version && e.text === passage?.text);
    if (!supported || !passage.allowed || passage.version !== passage.currentVersion) break;
    path.push({ ...edge, text: passage.text });
    current = edge.to;
  }
  return path;
}

const route = ['wrote', 'published by'];
const [authorship, publication] = retrieve('person:lena', route);
const bookID = authorship.to;
const bookName = catalog[bookID];
const publisher = catalog[publication.to];
const parkID = shelf.find(id => id !== bookID);
const authorLead = authorship.text.slice(0, authorship.text.indexOf(bookName)).trim();
const publisherLead = publication.text.slice(bookName.length, publication.text.indexOf(publisher)).trim();

const beats = [
  {
    id: 'two-river-walks',
    say: 'River Walk. The catalog found a book and a park under that name. Which entry will help us find the publisher of Lena’s book?',
    hold: 0.8,
  },
  {
    id: 'the-author-entry',
    say: 'Look at Lena’s author record. It says she wrote River Walk. The catalog kept a work ID with that sentence. Can you find the same ID on the desk?',
    hold: 2,
  },
  {
    id: 'follow-wrote',
    say: 'There it is, on the blue spine. Follow the link marked wrote, and you reach this particular book. The park has its own ID.',
    hold: 0.8,
  },
  {
    id: 'inside-the-binding',
    say: 'Follow the book’s next link. Open at the ribbon and read the line beneath the title.',
    hold: 1.4,
  },
  {
    id: 'the-imprint',
    say: 'Willow Press. Try the right-hand page alone. It tells you who published River Walk. Where does it say whose book this is? Turn the author record back over. There’s Lena.',
    hold: 1,
  },
  {
    id: 'both-passages',
    say: 'Our graph search follows those two relationships. Lena wrote the book. The book was published by Willow Press. It brings both passages to the language model, so the answer can cite a source for each step.',
    hold: 2.6,
  },
];

const ink = '#162a4f', blue = '#234695', red = '#c84630', ivory = '#fff1d7';
const blush = '#ecc4b4', mapInk = '#245347', water = '#7bbdbe';
const clamp = n => Math.max(0, Math.min(1, n));
const smooth = n => { const t = clamp(n); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function line(ctx, x1, y1, x2, y2, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}
function ellipse(ctx, x, y, rx, ry, color) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
function label(ctx, string, x, y, size, color = ink, family = 'Sans', align = 'left', style = '') {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.font = (style ? style + ' ' : '') + size + 'px "Lesson ' + family + '"';
  ctx.fillText(string, x, y);
}
const shapes = new Map();
function shape(ctx, d, color, stroke = 0) {
  if (!shapes.has(d)) shapes.set(d, new Path2D(d));
  if (stroke) {
    ctx.strokeStyle = color;
    ctx.lineWidth = stroke;
    ctx.stroke(shapes.get(d));
  } else {
    ctx.fillStyle = color;
    ctx.fill(shapes.get(d));
  }
}
function shade(ctx, x, y, width, height, amount = 1) {
  ctx.save();
  ctx.shadowOffsetX = 9 * amount;
  ctx.shadowOffsetY = 15 * amount;
  ctx.shadowBlur = 26 * amount;
  ctx.shadowColor = 'rgba(40,32,42,.28)';
  rect(ctx, x, y, width, height, '#bc9e98');
  ctx.restore();
}

function table(ctx) {
  const g = ctx.createLinearGradient(0, 0, 1560, 1080);
  g.addColorStop(0, '#f0d6ce');
  g.addColorStop(0.65, '#dbc1c2');
  g.addColorStop(1, '#c1a8b1');
  rect(ctx, 0, 0, 1920, 1080, g);
  // Sparse, fixed flecks give the tabletop a matte surface.
  for (let i = 1; i <= 290; i++) {
    const x = (i * 883 + i * i * 23) % 1920;
    const y = (i * 587 + i * i * 13) % 1080;
    rect(ctx, x, y, 2 + i % 4, 1.6, i % 2 ? '#c5aaac55' : '#f8e6d955');
  }
}

// A two-ink woodcut on the dust jacket. The white cuts describe the current and the heron's wing.
function heron(ctx) {
  shape(ctx, 'M57 485 C102 434 141 410 193 397 C243 385 277 384 291 353 C302 327 260 322 276 287 C284 267 308 264 325 270 L364 279 L323 283 C308 283 297 286 297 298 C297 312 332 330 323 358 C311 402 268 416 256 448 C218 455 181 462 134 466 Z', ivory);
  shape(ctx, 'M319 271 L393 273 L324 282 Z', '#efb444');
  ellipse(ctx, 316, 275, 3.4, 3.4, ink);
  shape(ctx, 'M141 450 Q195 416 249 408 M127 460 Q194 438 241 424 M201 451 Q233 438 252 420 M280 287 Q266 307 291 327', blue, 2.2);
  shape(ctx, 'M222 455 L211 498 L237 514 M237 453 L239 495 L263 507', '#ffc96b', 3.5);
}

function jacket(ctx, match) {
  rect(ctx, 0, 0, 530, 660, red);
  ctx.save();
  ctx.beginPath(); ctx.rect(36, 0, 494, 660); ctx.clip();
  rect(ctx, 36, 0, 494, 660, '#ed7953');
  ellipse(ctx, 432, 322, 88, 88, '#ffca68');
  shape(ctx, 'M20 370 Q104 307 195 346 T380 336 Q485 304 552 337 L552 680 L20 680 Z', '#303769');
  shape(ctx, 'M16 402 Q111 340 203 373 T404 362 Q473 344 541 361 L545 681 L16 681 Z', '#273f87');
  shape(ctx, 'M0 514 Q114 491 209 502 T410 457 Q478 441 537 454 L541 662 L0 665 Z', '#386caa');
  for (let i = 0; i < 23; i++) {
    const x = 48 + (i * 83) % 454, y = 475 + (i * 17) % 172;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 15, y + 4, x + 33, y - 5, x + 50 + i % 5 * 7, y - 4);
    ctx.strokeStyle = i % 3 ? '#7cb9c4' : ivory; ctx.lineWidth = i % 3 + 1; ctx.stroke();
  }
  heron(ctx);
  for (let i = 0; i < 15; i++) {
    const x = 385 + i * 12, top = 610 - (i * 29) % 91;
    line(ctx, x, 660, x - 30, top, ink, 2);
    line(ctx, x - 31, top, x - 36, top - 22, ink, 4);
  }
  label(ctx, 'River', 62, 112, 100, ink, 'Serif');
  label(ctx, 'Walk', 124, 208, 110, ink, 'Serif', 'left', 'italic');
  ctx.restore();
  rect(ctx, 0, 0, 39, 660, blue);
  for (let x = 3; x < 39; x += 5) line(ctx, x, 0, x, 660, '#ffffff19', 1.2);
  rect(ctx, -2, 539, 303, 79, ivory);
  rect(ctx, -2, 539, 9, 79, ink);
  label(ctx, bookID, 26, 594, 44, ink, 'Mono');
  if (match > 0) rect(ctx, 26, 604, 266 * match, 5, red);
}

const river = 'M-55 449 C62 430 18 320 142 314 C265 307 302 380 360 328 C427 268 337 227 465 190 C546 168 565 123 660 139';
const trail = 'M-20 338 C62 228 171 238 246 263 C357 298 255 187 337 156 Q390 129 426 91';
function mapPrint(ctx) {
  rect(ctx, 0, 0, 636, 492, '#e5e6c7');
  shape(ctx, 'M-10 245 Q88 183 186 209 Q252 226 287 209 Q369 197 354 258 Q319 331 246 298 Q122 239 6 367 Z', '#b4c995');
  shape(ctx, 'M425 122 Q492 67 639 74 L639 318 Q583 283 567 232 Q544 174 402 208 Z', '#b5c995');
  for (let i = 0; i < 7; i++) {
    ctx.save(); ctx.translate(-3 * i, 13 * i);
    shape(ctx, 'M-40 272 C118 163 203 255 280 219 S379 98 487 92 Q565 98 666 41', '#98b294', 1.6);
    ctx.restore();
  }
  shape(ctx, river, '#558e9b', 44);
  shape(ctx, river, water, 39);
  ctx.save(); ctx.setLineDash([8, 8]); shape(ctx, trail, '#a95b40', 4.5); ctx.restore();
  for (const [x, y] of [[33, 208], [60, 207], [74, 226], [104, 198], [149, 208], [271, 227], [467, 118], [526, 119], [552, 104], [485, 143]]) {
    shape(ctx, 'M' + x + ' ' + y + ' l8 -20 8 20 h-6 v7 h-4 v-7 Z', '#6d906b');
  }
  ctx.save(); ctx.translate(293, 343); ctx.rotate(0.32);
  rect(ctx, -17, -39, 34, 78, '#d4ad7b');
  for (let i = -36; i < 37; i += 8) line(ctx, -14, i, 14, i, '#886b55', 2);
  line(ctx, -18, -43, -18, 43, mapInk, 4); line(ctx, 18, -43, 18, 43, mapInk, 4);
  ctx.restore();
  label(ctx, 'PARK MAP', 28, 44, 29, mapInk, 'Sans', 'left', '600');
  label(ctx, bookName, 25, 127, 81, mapInk, 'Serif');
  rect(ctx, 0, 404, 636, 88, '#f3f0d9');
  label(ctx, parkID, 30, 463, 43, mapInk, 'Mono');
}
function parkMap(ctx, land, arrival, leave) {
  const x = mix(981, 1238, arrival) + 830 * leave;
  ctx.save(); ctx.translate(x, mix(282, 326, arrival) - 45 * leave);
  ctx.rotate(0.048 + 0.055 * (1 - land) + 0.08 * leave);
  ctx.scale(mix(1.08, 0.92, arrival), mix(1.08, 0.92, arrival));
  const fold = (1 - land) * 0.85 + leave * 0.8;
  const width = 212 * (1 - fold * 0.57);
  // Three hinged panels retain their print registration as the sheet concertinas.
  for (let i = 0; i < 3; i++) {
    const tilt = (i === 1 ? -1 : 1) * (0.025 + 0.27 * fold);
    ctx.save();
    ctx.translate(i * width, i % 2 * width * tilt * -1);
    ctx.transform(width / 212, tilt * width / 212, 0, 1, 0, 0);
    shade(ctx, 0, 0, 212, 492, 0.52);
    ctx.beginPath(); ctx.rect(0, 0, 212, 492); ctx.clip();
    ctx.translate(-i * 212, 0);
    mapPrint(ctx);
    rect(ctx, i * 212, 0, 212, 492, i === 1 ? '#34373412' : '#ffffff08');
    line(ctx, i * 212, 0, i * 212, 492, '#78846b75', 2);
    ctx.restore();
  }
  ctx.restore();
}

function authorCard(ctx, match, face) {
  // Turn the loose catalogue record in place. Its blank reverse isolates the second passage.
  ctx.translate(220, 0);
  ctx.transform(Math.abs(Math.cos(Math.PI * face)) + 0.0001, -0.075 * Math.sin(Math.PI * face), 0, 1, 0, 0);
  ctx.translate(-220, 0);
  shade(ctx, 0, 0, 440, 330, 0.6);
  rect(ctx, 0, 0, 440, 330, '#fff3d9');
  if (face > 0.5) {
    rect(ctx, 0, 0, 440, 330, '#e3d6bf');
    for (let y = 35; y < 321; y += 32) line(ctx, 20, y, 418, y, '#afa795', 1.4);
    return;
  }
  rect(ctx, 0, 0, 440, 9, red);
  label(ctx, 'A', 27, 63, 41, red, 'Serif', 'left', 'italic');
  label(ctx, 'Author record', 81, 61, 31);
  line(ctx, 25, 80, 414, 80, '#ccbaa5');
  label(ctx, authorLead, 25, 148, 53, ink, 'Serif');
  label(ctx, bookName + '.', 25, 210, 60, ink, 'Serif', 'left', 'italic');
  label(ctx, 'Work ID', 25, 260, 24);
  label(ctx, bookID, 25, 308, 41, ink, 'Mono');
  if (match > 0) rect(ctx, 25, 317, 246 * match, 4, red);
}

function colophon(ctx) {
  rect(ctx, 0, 0, 529, 660, '#f8e8c9');
  label(ctx, 'B', 57, 76, 43, red, 'Serif', 'left', 'italic');
  label(ctx, 'Publisher record', 114, 73, 32);
  line(ctx, 54, 97, 483, 97, '#baae99', 2);
  label(ctx, bookName, 270, 196, 70, ink, 'Serif', 'center', 'italic');
  label(ctx, publisherLead, 271, 253, 37, ink, 'Serif', 'center');
  label(ctx, publisher + '.', 271, 327, 61, blue, 'Serif', 'center');
  // A willow printer's device, cut from the same blue ink as the jacket spine.
  ctx.save(); ctx.translate(270, 423);
  ellipse(ctx, 0, 0, 71, 56, blue);
  shape(ctx, 'M-28 44 Q-3 37 -5 -10 L1 -30 L4 -6 Q7 36 30 43 Z', ivory);
  for (let i = -5; i <= 5; i++) {
    const x = i * 10;
    ctx.beginPath(); ctx.moveTo(0, -2);
    ctx.bezierCurveTo(x / 2, -48 + Math.abs(i), x * 0.93, -40, x, 6 + Math.abs(i) * 2);
    ctx.strokeStyle = '#e8e5bd'; ctx.lineWidth = 2.7; ctx.stroke();
  }
  ctx.restore();
}

function book(ctx, clock, pose) {
  const { arrival, open, center, match, binding, face } = pose;
  ctx.save(); ctx.translate(pose.x, pose.y);
  ctx.rotate(pose.rotation); ctx.scale(pose.scale, pose.scale);
  shade(ctx, 0, 5, 536, 663);
  rect(ctx, -5, 0, 543, 672, blue);
  rect(ctx, 0, 4, 532, 656, '#e3cea7');
  for (let i = 0; i < 6; i++) line(ctx, 7, 660 + i * 1.25, 529, 660 + i * 1.25, '#a89778', 0.9);
  shape(ctx, 'M393 648 h27 v54 l-13 -10 -14 10 Z', red);
  colophon(ctx);
  const angle = Math.PI * open;
  const projection = Math.cos(angle);
  if (Math.abs(projection) > 0.002) {
    ctx.save(); ctx.transform(projection, -0.12 * Math.sin(angle), 0, 1, 0, 0);
    if (projection > 0) {
      jacket(ctx, match);
    } else {
      rect(ctx, 0, 0, 530, 660, blue);
      rect(ctx, 5, 6, 517, 647, '#b1c5d1');
      ctx.save(); ctx.beginPath(); ctx.rect(5, 6, 517, 647); ctx.clip();
      // Printed endpaper: the jacket's river current repeated at binding scale.
      for (let row = -1; row < 27; row++) {
        ctx.save(); ctx.translate(0, row * 28);
        shape(ctx, 'M0 0 Q60 22 121 3 T261 8 T408 5 T560 0', '#7d9fb5', 1.8);
        ctx.restore();
      }
      ctx.restore();
    }
    ctx.restore();
  }
  if (open > 0) {
    const g = ctx.createLinearGradient(0, 0, 47, 0);
    g.addColorStop(0, '#503c3673'); g.addColorStop(1, '#503c3600');
    ctx.globalAlpha = open; rect(ctx, 0, 0, 47, 660, g); ctx.globalAlpha = 1;
  }
  ctx.restore();

  if (arrival <= 0) return;
  const settled = smooth((open - 0.55) / 0.45);
  ctx.save();
  ctx.translate(mix(mix(-510, 82, arrival), pose.x - 477 * pose.scale, settled),
    mix(mix(433, 382, arrival) - 14 * center, pose.y + 115 * pose.scale, settled));
  ctx.rotate(mix(-0.045, -0.018, settled));
  const cardScale = mix(1.08, pose.scale, settled);
  ctx.scale(cardScale, cardScale);
  authorCard(ctx, match, face);
  ctx.restore();

  if (match > 0 && center < 1) {
    // Trace the two underlined IDs while the author card and jacket share the table.
    ctx.save();
    ctx.globalAlpha = 1 - center;
    const spineX = pose.x + pose.scale * (26 * Math.cos(pose.rotation) - 604 * Math.sin(pose.rotation));
    const spineY = pose.y + pose.scale * (26 * Math.sin(pose.rotation) + 604 * Math.cos(pose.rotation));
    const startY = 711 - 14 * center;
    const span = Math.hypot(spineX - 390, spineY - startY) + 50;
    ctx.setLineDash([span, span + 10]);
    ctx.lineDashOffset = span * (1 - match);
    ctx.beginPath();
    ctx.moveTo(390, startY);
    ctx.bezierCurveTo(486, startY - 4, 527, startY - 22, 576, startY + 13);
    ctx.bezierCurveTo(624, startY + 47, spineX - 63, spineY + 5, spineX, spineY);
    ctx.strokeStyle = red;
    ctx.lineWidth = 5.5;
    ctx.stroke();
    ctx.restore();
  }

  if (binding > 0) {
    ctx.save(); ctx.translate(pose.x, pose.y); ctx.scale(pose.scale, pose.scale);
    graphInMargin(ctx, clock, binding);
    ctx.restore();
  }
}

// The finished spread is an annotated edition. The two margin arrows use the same sources as the text above.
function graphInMargin(ctx, clock, show) {
  const first = smooth(clock.reveal('Lena wrote', 0.8));
  const second = smooth(clock.reveal('The book was published', 1.0));
  ctx.globalAlpha = show;
  rect(ctx, -509, 505, 1017, 129, '#f9eccf');
  line(ctx, -509, 506, 508, 506, '#9b846c', 1.4);
  line(ctx, -509, 633, 508, 633, '#9b846c', 1.4);
  label(ctx, catalog[authorship.from], -424, 595, 43, ink, 'Serif', 'center');
  function arrow(x, end, progress, name) {
    if (!progress) return;
    const tip = mix(x, end, progress);
    line(ctx, x, 584, tip, 584, red, 3.5);
    line(ctx, tip - 8, 579, tip, 584, red, 3);
    line(ctx, tip - 8, 589, tip, 584, red, 3);
    ctx.globalAlpha = show * progress;
    label(ctx, name, (x + end) / 2, 557, 30, ink, 'Sans', 'center');
    ctx.globalAlpha = show;
  }
  arrow(-355, -113, first, authorship.relation + ' · A');
  if (first > 0) {
    ctx.globalAlpha = first * show;
    label(ctx, bookName, -9, 595, 40, ink, 'Serif', 'center');
    ctx.globalAlpha = show;
  }
  arrow(96, 270, second, publication.relation + ' · B');
  if (second > 0) {
    ctx.globalAlpha = show * second;
    label(ctx, publisher, 389, 595, 38, blue, 'Serif', 'center');
  }
}

function draw(ctx, clock) {
  table(ctx);
  const stage = (index, phrase, seconds) => clock.index < index ? 0 :
    clock.index > index ? 1 : smooth(clock.reveal(phrase, seconds));
  const land = smooth((clock.seconds + 0.07) / 1.6);
  const arrival = stage(1, 'Look at Lena’s author record', 1.3);
  const match = stage(2, 'There it is', 0.95);
  const center = stage(3, 'Follow the book', 1.6);
  const open = stage(3, 'Open at the ribbon', 1.65);
  const face = stage(4, 'Try the right-hand page alone', 0.8) - stage(4, 'Turn the author record', 0.8);
  const binding = stage(5, 'Our graph search', 0.7);
  parkMap(ctx, land, arrival, center);
  const pose = {
    x: mix(mix(313, 619, arrival), 960, center),
    y: mix(mix(174, 176, arrival), 105, center),
    rotation: mix(-0.045, 0, center),
    scale: mix(mix(1.10, 1.05, arrival), 1.24, center),
    arrival, center, open, match, binding, face,
  };
  book(ctx, clock, pose);
}

function check() {
  assert.deepEqual(shelf.filter(id => catalog[id] === bookName), ['book:river', 'place:river']);
  assert.deepEqual(retrieve('person:lena', route).map(e => [e.to, e.source]), [
    ['book:river', 'author'], ['publisher:willow', 'publisher'],
  ]);
  assert.equal(authorLead + ' ' + bookName + '.', authorship.text);
  assert.equal(bookName + ' ' + publisherLead + ' ' + publisher + '.', publication.text);
  assert.deepEqual(retrieve(parkID, ['published by']), []);
  const stale = { ...RECORDS, publisher: { ...RECORDS.publisher, currentVersion: 2 } };
  assert.deepEqual(retrieve('person:lena', route, stale).map(e => e.source), ['author']);
  assert.equal(retrieve('person:lena', ['published by']).length, 0);
  return true;
}

export default { title: 'Who published Lena’s book?', beats, draw, check };

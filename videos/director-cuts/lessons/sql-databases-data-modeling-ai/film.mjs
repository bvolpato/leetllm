import assert from 'node:assert/strict';
import { corpus } from '../../../films/sql-databases-data-modeling-ai/model.mjs';

const { documents, chunks } = corpus(true);
const rack = [
  { edition: 'July', chunkId: 'c7a', x: 527, wool: ['#303132', '#56574b', '#757561'] },
  { edition: 'August', chunkId: 'c7c', x: 1393, wool: ['#182f39', '#2e5261', '#517384'] },
].map((hanger) => {
  const chunk = chunks.find((row) => row.id === hanger.chunkId);
  const document = documents.find((row) => row.id === chunk.document);
  return { ...hanger, chunk, document };
});
const [july, august] = rack;
const ink = '#282c26';
const mono = 'Lesson Mono';
const serif = 'Lesson Serif';
const sans = 'Lesson Sans';
const seamY = 569;
const halfWidth = 245;

const beats = [
  {
    id: 'the-return-counter',
    say: "Bob's search brings back a paragraph from Harbor. “Return items within fourteen days.” He wants to give the customer a link to the edition he quoted.",
    hold: 0.9,
  },
  {
    id: 'two-editions',
    say: "Look up at the rail. Each coat carries an edition of Harbor's return policy. Here's the line in July. Now read it in August. Even the title stayed the same.",
    hold: 1.2,
  },
  {
    id: 'the-other-side',
    say: "Turn the paragraph over. It has its own ID, and it carries the ID of the document it came from. That second field is a foreign key. Which edition does it point to?",
    hold: 1.6,
  },
  {
    id: 'fit-the-stub',
    say: "Try the July tag first. Read the whole ID on each half. Now take the same ticket over to August.",
    hold: 1.65,
  },
  {
    id: 'one-citation',
    say: "Those IDs match. A SQL join pairs the paragraph with the document whose ID equals its foreign key. Bob can link straight to this paragraph in the August policy.",
    hold: 1.0,
  },
  {
    id: 'a-saved-answer',
    say: "Here's an older answer Bob saved. It quotes the very same sentence. Turn its paragraph over. Where does the citation take you?",
    hold: 1.7,
  },
  {
    id: 'back-to-july',
    say: "Back to the July edition. Open either citation and you can find the exact paragraph that answer used.",
    hold: 3.0,
  },
];

const clamp = (n) => Math.max(0, Math.min(1, n));
const ease = (n) => clamp(n) ** 2 * (3 - 2 * clamp(n));
const mix = (a, b, n) => a + (b - a) * n;
function cue(clock, beatIndex, phrase, span) {
  if (clock.index !== beatIndex) return Number(clock.index > beatIndex);
  return ease(clock.reveal(phrase, span));
}

function gradient(ctx, x0, y0, x1, y1, stops) {
  const fill = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [at, color] of stops) fill.addColorStop(at, color);
  return fill;
}
function rect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}
function form(ctx, path, fill, edge, weight = 1) {
  ctx.beginPath();
  path(ctx);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (edge) { ctx.strokeStyle = edge; ctx.lineWidth = weight; ctx.stroke(); }
}
function lines(ctx, points, color, width) {
  form(ctx, (p) => {
    p.moveTo(...points[0]);
    for (const point of points.slice(1)) p.lineTo(...point);
  }, null, color, width);
}
function oval(ctx, x, y, rx, ry, fill) {
  form(ctx, (p) => p.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2), fill);
}
function print(ctx, value, x, y, size, family, color = ink, weight = 400) {
  ctx.font = weight + ' ' + size + 'px "' + family + '"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function cloakroom(ctx) {
  const wall = ctx.createRadialGradient(940, 360, 90, 920, 410, 1260);
  wall.addColorStop(0, '#40544d');
  wall.addColorStop(0.62, '#243d3a');
  wall.addColorStop(1, '#101d20');
  rect(ctx, -600, -300, 3200, 1900, wall);
  for (let x = 12; x < 1990; x += 119) {
    rect(ctx, x, 0, 3, 880, '#102924');
    rect(ctx, x + 3, 0, 2, 880, '#47605a');
  }
  rect(ctx, 0, 109, 1920, 28, 'rgba(8,16,15,.45)');
  rect(ctx, 0, 80, 1920, 34, gradient(ctx, 0, 80, 0, 114,
    [[0, '#574c36'], [.16, '#dab882'], [.27, '#f3d49b'], [.45, '#ad8c5b'], [.8, '#73583c'], [1, '#2e3028']]));
}

function hanger(ctx) {
  const hook = (p) => {
    p.moveTo(-17, 94);
    p.bezierCurveTo(-18, 59, 29, 60, 26, 94);
    p.bezierCurveTo(25, 113, 1, 117, 1, 146);
    p.lineTo(1, 184);
  };
  form(ctx, hook, null, '#302e25', 12);
  form(ctx, hook, null, '#cab289', 6);
  form(ctx, (p) => {
    p.moveTo(-231, 279); p.quadraticCurveTo(-218, 249, -44, 182);
    p.quadraticCurveTo(0, 145, 44, 182); p.quadraticCurveTo(200, 238, 231, 276);
    p.lineTo(223, 293); p.quadraticCurveTo(65, 227, 0, 215);
    p.quadraticCurveTo(-75, 227, -221, 294); p.closePath();
  }, gradient(ctx, -20, 175, 22, 287, [[0, '#e0a771'], [.36, '#925f40'], [1, '#4a3029']]), '#382c25', 3);
}

function coatOutline(p) {
  p.moveTo(-66, 201);
  p.bezierCurveTo(-100, 224, -191, 243, -237, 275);
  p.bezierCurveTo(-281, 301, -289, 382, -305, 467);
  p.lineTo(-360, 799); p.quadraticCurveTo(-339, 829, -272, 828);
  p.lineTo(-210, 582); p.lineTo(-230, 905);
  p.quadraticCurveTo(-118, 945, -1, 922);
  p.quadraticCurveTo(115, 940, 232, 903); p.lineTo(216, 571);
  p.lineTo(274, 828); p.quadraticCurveTo(337, 832, 363, 803);
  p.bezierCurveTo(324, 607, 295, 348, 259, 296);
  p.quadraticCurveTo(232, 256, 98, 219); p.lineTo(68, 201);
  p.quadraticCurveTo(5, 236, -66, 201); p.closePath();
}
function coat(ctx, item) {
  const [shade, wool, light] = item.wool;
  ctx.save();
  ctx.translate(item.x, 0);
  hanger(ctx);
  ctx.save();
  ctx.translate(12, 13);
  form(ctx, coatOutline, 'rgba(7,18,18,.35)');
  ctx.restore();
  form(ctx, coatOutline, gradient(ctx, -334, 520, 340, 425,
    [[0, shade], [.11, light], [.22, wool], [.34, shade], [.53, wool], [.78, light], [.87, shade], [1, wool]]), shade, 3);
  ctx.save();
  ctx.clip();
  ctx.beginPath();
  for (let i = -1100; i < 950; i += 11) {
    ctx.moveTo(i, 170); ctx.lineTo(i + 440, 946);
  }
  ctx.strokeStyle = 'rgba(238,219,180,.078)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath();
  for (let i = -500; i < 1250; i += 44) {
    ctx.moveTo(i, 170); ctx.lineTo(i - 415, 946);
    ctx.moveTo(i + 6, 170); ctx.lineTo(i - 409, 946);
  }
  ctx.strokeStyle = 'rgba(20,29,24,.15)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
  for (const sign of [-1, 1]) {
    ctx.save(); ctx.scale(sign, 1);
    form(ctx, (p) => {
      p.moveTo(7, 421); p.lineTo(119, 299); p.lineTo(94, 280); p.lineTo(139, 274);
      p.lineTo(87, 199); p.lineTo(60, 194); p.quadraticCurveTo(58, 257, 7, 421); p.closePath();
    }, gradient(ctx, 2, 315, 109, 291, [[0, shade], [1, light]]), shade, 3);
    lines(ctx, [[251, 326], [239, 379], [210, 559]], shade, 3);
    lines(ctx, [[278, 803], [350, 787]], shade, 4);
    lines(ctx, [[269, 742], [336, 724]], 'rgba(247,227,195,.16)', 2);
    lines(ctx, [[95, 737], [189, 707]], shade, 13);
    lines(ctx, [[94, 733], [189, 703]], light, 3);
    ctx.restore();
  }
  lines(ctx, [[0, 425], [-8, 895]], shade, 3);
  for (let y = 457; y <= 858; y += 109) {
    oval(ctx, 7, y + 2, 11, 12, shade); oval(ctx, 6, y, 9, 10, '#343331');
    lines(ctx, [[3, y - 3], [8, y + 3]], '#9a8a72', 2);
  }
  ctx.restore();
}

function counter(ctx) {
  form(ctx, p => { p.moveTo(0, 860); p.lineTo(1920, 860); p.lineTo(1980, 940); p.lineTo(-60, 940); p.closePath(); },
    gradient(ctx, 0, 860, 0, 940, [[0, '#79543c'], [.12, '#926749'], [.7, '#73503b'], [1, '#593e2e']]));
  rect(ctx, -300, 940, 2550, 420, gradient(ctx, 0, 940, 0, 1100, [[0, '#cb9b66'], [.03, '#77513b'], [.14, '#3d2e26'], [.21, '#654432'], [1, '#372e29']]));
  for (let y = 870; y < 935; y += 7) {
    form(ctx, p => {p.moveTo(0, y); p.bezierCurveTo(600, y-5, 1050, y+6, 1920, y-3);}, null, 'rgba(37,26,15,.2)', 1.3);
  }
}

// Both ticket halves use the same cut for a document. A different cut stays visibly apart.
function cut(item) {
  const notch = item.document.id === july.document.id ? -101 : 109;
  return [[-halfWidth, 0], [notch - 56, 0], [notch - 21, -39], [notch + 25, -39],
    [notch + 56, 0], [halfWidth, 0]];
}
function ticketShape(p, item, top) {
  const contour = cut(item);
  p.moveTo(...contour[0]);
  for (const point of contour.slice(1)) p.lineTo(...point);
  if (top) {
    p.lineTo(halfWidth, -217); p.lineTo(halfWidth - 24, -241);
    p.lineTo(-halfWidth + 24, -241); p.lineTo(-halfWidth, -217);
  } else {
    p.lineTo(halfWidth, 178); p.lineTo(halfWidth - 12, 191);
    p.lineTo(-halfWidth + 12, 191); p.lineTo(-halfWidth, 178);
  }
  p.closePath();
}
function stock(ctx, item, top, face, match) {
  const make = p => ticketShape(p, item, top);
  ctx.save(); ctx.translate(5, 8); form(ctx, make, 'rgba(11,20,17,.33)'); ctx.restore();
  const pale = top || !face;
  const color = pale ? '#f3e6c9' : '#e6ca93';
  form(ctx, make, gradient(ctx, -245, -210, 170, 191,
    [[0, color], [.60, pale ? '#e9dcbe' : '#eddbb2'], [1, pale ? '#d5c7a6' : '#d8c59e']]), '#8f7e60', 2);
  ctx.save(); ctx.clip();
  for (let i = 0; i < 50; i++) {
    const x = -245 + (i * 139) % 490;
    const y = (top ? -240 : 0) + ((i * 37) % (top ? 231 : 184));
    lines(ctx, [[x, y], [x + 5 + (i % 17), y - 1]], 'rgba(139,102,65,.13)', 1);
  }
  if (face) {
    const stamp = match ? '#377267' : '#9c6853';
    form(ctx, p => p.arc(-193, 0, 22, 0, Math.PI * 2), null, stamp, 4);
    form(ctx, p => p.arc(-193, 0, 16, 0, Math.PI * 2), null, stamp, 1.5);
  }
  ctx.restore();
}
function wordsOnTag(ctx, quote, firstLineY, size) {
  const split = quote.indexOf('fourteen');
  print(ctx, quote.slice(0, split).trimEnd(), 0, firstLineY, size, serif);
  print(ctx, quote.slice(split), 0, firstLineY + size + 2, size, serif);
}
function archiveTag(ctx, item, flip, glow, swing) {
  ctx.save(); ctx.translate(item.x, 221); ctx.rotate(swing);
  form(ctx, p => {
    p.moveTo(-26, -5); p.bezierCurveTo(-34, 41, -8, 96, 0, 126);
    p.bezierCurveTo(12, 98, 38, 35, 27, -4);
  }, null, '#bf9b68', 4);
  ctx.translate(0, seamY - 221);
  ctx.scale(Math.max(.012, Math.abs(Math.cos(Math.PI * flip))), 1);
  const back = flip >= .5;
  stock(ctx, item, true, back, glow > .5);
  oval(ctx, 0, -222, 11, 11, '#a18a62'); oval(ctx, 0, -222, 6, 6, '#3e473b');
  if (back) {
    print(ctx, item.edition + ' edition', 0, -151, 52, serif);
    print(ctx, 'documents.id', 0, -99, 36, mono, '#4f5749');
    print(ctx, item.document.id, 0, -40, 60, mono, '#173f3a', 600);
  } else {
    print(ctx, item.edition + ' edition', 0, -178, 32, sans, '#605740', 600);
    print(ctx, item.document.title, 0, -126, 52, serif);
    lines(ctx, [[-151, -114], [151, -114]], '#a69c81', 1.5);
    wordsOnTag(ctx, item.chunk.text, -78, 35);
  }
  ctx.restore();
}
function paragraphTicket(ctx, item, x, top, scale, angle, flip, match) {
  ctx.save(); ctx.translate(x, top); ctx.rotate(angle); ctx.scale(scale, scale);
  ctx.scale(Math.max(.012, Math.abs(Math.cos(Math.PI * flip))), 1);
  const back = flip >= .5;
  stock(ctx, item, false, back, match);
  if (back) {
    print(ctx, item.chunk.document, 0, 54, 60, mono, '#173f3a', 600);
    print(ctx, 'chunks.document_id', 0, 99, 35, mono, '#4f5749');
    lines(ctx, [[-192, 114], [192, 114]], '#a49777', 1.6);
    print(ctx, 'Paragraph  ' + item.chunk.id, 0, 159, 36, sans);
  } else {
    print(ctx, 'Retrieved paragraph  ·  ' + item.chunk.id, 0, 47, 31, sans, '#535b4d', 600);
    lines(ctx, [[-182, 62], [182, 62]], '#998970', 1.4);
    wordsOnTag(ctx, item.chunk.text, 113, 44);
  }
  ctx.restore();
}

function draw(ctx, clock) {
  const arrival = ease(clock.elapsed / 1.4);
  const landed = clock.index === 0 ? arrival : 1;
  const rackView = cue(clock, 1, 'Look up at the rail', 1.25);
  const julyLight = cue(clock, 1, "Here's the line in July", .75);
  const augustLight = cue(clock, 1, 'Now read it in August', .75);
  const stubFlip = cue(clock, 2, 'Turn the paragraph over', .92);
  const archiveFlip = cue(clock, 2, 'Which edition', 1.1);
  const tryJuly = cue(clock, 3, 'Try the July tag', 1.35);
  const cross = cue(clock, 3, 'take the same ticket', 1.8);
  const seat = cue(clock, 3, 'over to August', .95);
  const join = cue(clock, 4, 'A SQL join', .65);
  const oldTicket = cue(clock, 5, 'an older answer', 1.3);
  const oldFlip = cue(clock, 5, 'Turn its paragraph over', .95);
  const toJuly = cue(clock, 5, 'Where does the citation', 1.65);
  const settle = cue(clock, 6, 'Back to the July edition', .85);
  const neutralX = mix(276, 960, landed);
  const ticketX = mix(mix(neutralX, july.x, tryJuly), august.x, cross);
  const follow = tryJuly - oldTicket;
  const zoom = 1 + .69 * follow + .13 * (1-rackView);
  ctx.save();
  ctx.translate(960, 540);
  ctx.scale(zoom, zoom);
  ctx.translate(-960 - .90 * (ticketX - 960) * follow, -540 - 96 * follow - 60 * (1-rackView));
  cloakroom(ctx);
  for (const item of rack) coat(ctx, item);
  const tagSwing = .019 * Math.sin(rackView * Math.PI * 2) * (1 - rackView);
  for (const item of rack) {
    const isJuly = item === july;
    const lit = isJuly ? settle : seat;
    archiveTag(ctx, item, archiveFlip, lit, tagSwing * (isJuly ? -1 : 1));
    const light = isJuly ? julyLight : augustLight;
    if (rackView > 0 && light < 1) {
      ctx.save();
      ctx.translate(item.x, seamY);
      form(ctx, p => ticketShape(p, item, true), 'rgba(46,49,38,' + (.23 * rackView * (1-light)) + ')');
      ctx.restore();
    }
  }
  const shade = .5 * (1 - rackView);
  rect(ctx, 0, 0, 1920, 865, 'rgba(15,26,24,' + shade + ')');
  ctx.save();
  ctx.translate(0, -52);
  counter(ctx);
  ctx.restore();
  // The eye follows the retrieved half from the desk to each of the hanging source labels.
  const atDesk = mix(798, 614, landed) + 42 * rackView;
  const ticketY = mix(atDesk, seamY + 39, tryJuly) + 104 * Math.sin(cross * Math.PI) - 39 * seat;
  const scale = mix(mix(1.48, 1.13, rackView), 1, tryJuly);
  const rotation = -.20 * (1 - landed) + .024 * Math.sin(Math.PI * tryJuly) - .034 * Math.sin(Math.PI * 2 * cross);
  paragraphTicket(ctx, august, ticketX, ticketY, scale, rotation, stubFlip, seat > .5);
  if (oldTicket > 0) {
    const x = mix(mix(-280, 808, oldTicket), july.x, toJuly);
    const y = mix(745, 647, oldTicket) - 43 * toJuly - 35 * settle;
    paragraphTicket(ctx, july, x, y, 1, -.054 * (1-oldTicket), oldFlip, settle > .5);
  }
  if (join > 0 && oldTicket < 1) {
    ctx.save(); ctx.globalAlpha = join * (1-oldTicket);
    print(ctx, 'ON chunks.document_id = documents.id', august.x, 854, 35, mono, '#fff0d2');
    ctx.restore();
  }
  ctx.restore();
}

function check() {
  assert.equal(august.chunk.text, 'Return items within fourteen days.');
  const quoted = chunks.filter(row => row.text === august.chunk.text);
  assert.deepEqual(quoted.map(row => row.id).sort(), ['c7a', 'c7c']);
  assert.equal(july.document.title, august.document.title);
  assert.notEqual(july.document.id, august.document.id);
  const citation = id => chunks.filter(row => row.id === id).flatMap(chunk =>
    documents.filter(doc => doc.id === chunk.document).map(doc => [doc.id, doc.from, chunk.id]));
  assert.deepEqual(citation(august.chunk.id), [['d7-next', '2026-08-12T12:00:00Z', 'c7c']]);
  assert.deepEqual(citation(july.chunk.id), [['d7', '2026-07-01T00:00:00Z', 'c7a']]);
}

export default { title: 'Which edition did Bob quote?', beats, draw, check };

import assert from 'node:assert/strict';
import { answerabilityFixture } from '../../../films/document-chunking/model.mjs';

const rule = answerabilityFixture().find(({ id }) => id === 'complete-rule').text;
const archive = 'Routine deploy notes archive within 14 days.';
const page = rule + ' ' + archive;
const words = [...page.matchAll(/\S+/g)];
const locator = 'Runbook v3  /  p. 7';

// The two exposures have the same end on the same source page.
const fragment = { start: words[5].index, end: rule.length };
const whole = { start: 0, end: rule.length };
const sheetLines = [
  { first: 0, last: 2, y: 308, size: 93, cut: 211 },
  { first: 2, last: 5, y: 402, size: 80 },
  { first: 5, last: 7, y: 526, size: 112, cut: 432 },
  { first: 7, last: 10, y: 620, size: 80 },
  { first: 10, last: 13, y: 764, size: 65 },
  { first: 13, last: 17, y: 846, size: 65 },
].map(line => {
  const start = words[line.first].index;
  const end = words[line.last - 1].index + words[line.last - 1][0].length;
  return { ...line, start, end, text: page.slice(start, end) };
});

function copyLines(span) {
  return sheetLines.filter(line => line.start >= span.start && line.end <= span.end);
}

const beats = [
  { id: 'the-hit', say: 'Read what came back from the runbook. Fifteen minutes. If this is the only passage you get, when do you start counting?', hold: 1.3 },
  { id: 'the-glass', say: 'Here’s the page it came from. Before search, the runbook was split into passages called chunks. Search can return each one on its own. The blue corners show the chunk you just got.', hold: 0.7 },
  { id: 'read-up', say: 'Read up from the number. There’s the person to page. One line higher, there’s the event that starts the clock. Where would you put the cut?', hold: 1.7 },
  { id: 'move-one-edge', say: 'Start the chunk at “rollback failure.” Leave the bottom edge where it is. The fourteen days below belong to a different instruction.', hold: 0.85 },
  { id: 'pull-again', say: 'Index the passage between those edges as one chunk. Now suppose the same search returns it. Take a look at what the model gets.', hold: 1.35 },
  { id: 'one-rule', say: 'A failed rollback starts the clock. Page on-call within fifteen minutes and include the deploy ID. You can trace the whole instruction back to page seven.', hold: 2.35 },
];

const C = {
  shell: '#ffbd38', shellLight: '#ffe39b', shellShadow: '#b77529',
  ink: '#252c66', blue: '#384beb', glass: '#313b65', steel: '#8285aa',
  paper: '#fffbed', slot: '#1c1f42', blueGrey: '#6671a2',
};
const clamp = x => Math.max(0, Math.min(1, x));
function smooth(x) {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
}

function rect(ctx, x, y, w, h, color, radius = 0) {
  ctx.fillStyle = color;
  if (!radius) { ctx.fillRect(x, y, w, h); return; }
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
}

function polygon(ctx, pts, color) {
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  for (const p of pts.slice(1)) ctx.lineTo(...p);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function text(ctx, value, x, y, size, family = 'Sans', color = C.ink, weight = 500) {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.fillText(value, x, y);
}

function gradient(ctx, x1, y1, x2, y2, stops) {
  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  for (const [offset, color] of stops) grad.addColorStop(offset, color);
  return grad;
}

const sourceX = 508;
const slotY = 1200;
const trayCamera = 997;
const cutBottom = 654;
const edgeY = span => copyLines(span)[0].cut;

function printedLine(ctx, line, x, y) {
  text(ctx, line.text, x, y, line.size, 'Serif', C.ink, 500);
}

function housing(ctx) {
  rect(ctx, -220, -220, 2390, 2700, gradient(ctx, 0, 0, 1900, 540, [
    [0, '#f7a72f'], [0.37, '#ffd175'], [0.8, C.shell], [1, '#ec9b2d'],
  ]));
  // Soft window light rakes across the cast housing.
  for (const x of [-1080, -470]) {
    polygon(ctx, [[x,-220],[x+230,-220],[x+1430,2520],[x+1200,2520]], '#fff0b832');
  }
  // A chamfer, corner radii and the gasket seat the glass in the molded case.
  rect(ctx, 260, -118, 1450, 1107, C.shellLight, 58);
  rect(ctx, 260, -128, 1450, 1108, C.shellShadow, 58);
  rect(ctx, 283, -114, 1404, 1073, C.slot, 42);
  rect(ctx, 300, -98, 1370, 1040, C.glass, 31);
  rect(ctx, 321, -87, 1328, 1008, '#677590', 24);

  // Narrow air intakes follow the housing down to the output side.
  for (let i = 0; i < 12; i++) {
    rect(ctx, 1780, 151 + 21 * i, 173, 10, C.shellLight, 5);
    rect(ctx, 1781, 149 + 21 * i, 176, 8, '#ab782f', 4);
  }
  rect(ctx, -20, 1021, 1960, 4, C.shellShadow);
  rect(ctx, -20, 1026, 1960, 5, C.shellLight);
}

function corners(ctx, left, right, y, lower = false) {
  const dy = lower ? -30 : 30;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 9;
  for (const [x, dx] of [[left, 44], [right, -44]]) {
    ctx.beginPath();
    ctx.moveTo(x + dx, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy);
    ctx.stroke();
  }
}

function pencil(ctx, x, y, length, amount) {
  if (!amount) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 5, y - 14, (length + 10) * amount, 30);
  ctx.clip();
  ctx.strokeStyle = '#bc492c';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + length * 0.54, y - 6, x + length, y - 2);
  ctx.stroke();
  ctx.restore();
}

function platen(ctx, top, scan, who, when) {
  rect(ctx, 387, -45, 1172, 966, '#46516c');
  rect(ctx, 374, -51, 1174, 964, C.paper);
  polygon(ctx, [[374,-51],[403,-51],[403,913],[374,913]], '#e8e2cf');
  for (const y of [94, 439, 802]) {
    ctx.beginPath();
    ctx.arc(418, y, 13, 0, 2 * Math.PI);
    ctx.fillStyle = '#637188';
    ctx.fill();
  }
  text(ctx, 'Incident runbook', sourceX, 112, 60, 'Sans', C.ink, 700);
  text(ctx, 'v3  /  p. 7', 1255, 110, 37, 'Mono');
  rect(ctx, sourceX, 146, 925, 4, C.ink);
  for (const line of sheetLines) printedLine(ctx, line, sourceX, line.y);
  rect(ctx, sourceX, 676, 925, 3, '#a6a3ad');

  // Transparent masks leave the neighboring lines legible on the original.
  rect(ctx, 374, -51, 1174, top + 51, '#6562ab38');
  rect(ctx, 374, cutBottom, 1174, 913 - cutBottom, '#6562ab38');
  rect(ctx, 374, top, 1174, 3, '#394cca95');
  rect(ctx, 374, cutBottom, 1174, 3, '#394cca95');
  corners(ctx, 472, 1471, top);
  corners(ctx, 472, 1471, cutBottom, true);
  polygon(ctx, [[302,top-18],[343,top-18],[368,top],[343,top+18],[302,top+18]], C.blue);

  // These marks live on the glass, outside the copy. Trace the actual glyph widths.
  ctx.font = '500 80px "Lesson Serif"';
  pencil(ctx, sourceX + ctx.measureText('page ').width, 417, ctx.measureText('on-call').width, who);
  ctx.font = '500 93px "Lesson Serif"';
  pencil(ctx, sourceX, 323, ctx.measureText('Rollback failure').width, when);

  // One highlight stays on the glass while the crop guides move beneath it.
  polygon(ctx, [[1545,-50],[1619,-50],[1430,921],[1365,921]], '#ffffff15');
  if (scan > 0 && scan < 1) {
    const y = top + (cutBottom - top) * scan;
    rect(ctx, 320, y - 35, 1330, 46, gradient(ctx, 0, y - 35, 0, y + 11, [
      [0, '#bdffff00'], [0.65, '#bcffff53'], [0.86, '#ffffffec'], [1, '#bbffff00'],
    ]));
  }
  text(ctx, 'SOURCE PAGE', 390, 959, 32, 'Mono', '#ced2ec', 600);
}

function tray(ctx) {
  // The deep blue well and the feed rollers stay fixed as each copy travels out.
  rect(ctx, 209, slotY - 43, 1505, 1110, C.shellLight, 122);
  rect(ctx, 206, slotY - 53, 1505, 1110, C.shellShadow, 122);
  rect(ctx, 216, slotY - 52, 1480, 1075, C.ink, 112);
  rect(ctx, 236, slotY + 30, 1440, 965, gradient(ctx, 0, slotY, 0, slotY + 830, [
    [0, '#353a73'], [0.34, '#626eaf'], [1, '#8c99c3'],
  ]), 85);
  for (const x of [323, 372, 421, 1487, 1536, 1585]) {
    rect(ctx, x, slotY + 137, 12, 665, '#414f8980', 6);
    rect(ctx, x + 9, slotY + 139, 5, 658, '#c3cded81', 3);
  }
  rect(ctx, 298, slotY - 24, 1315, 61, C.slot, 28);
  for (const x of [443, 871, 1299]) {
    rect(ctx, x, slotY - 16, 172, 50, '#4f547d', 14);
    for (let j = 0; j < 18; j++) rect(ctx, x + 8 + j * 9, slotY - 12, 3, 41, '#333854');
  }
  text(ctx, 'SEARCH RESULT', 357, slotY - 76, 41, 'Mono', C.ink, 700);
}

function copy(ctx, span, feed) {
  const lines = copyLines(span);
  const firstBaseline = lines[0].y;
  const lastBaseline = lines.at(-1).y;
  const bottomLine = lastBaseline - firstBaseline + 208;
  const h = bottomLine + 127;
  const x = 424;
  const w = 1120;
  const y = slotY + 14 - h * (1 - feed);
  ctx.save();
  ctx.beginPath();
  ctx.rect(250, slotY + 7, 1400, 1400);
  ctx.clip();
  ctx.translate(x, y);
  ctx.transform(1, 0.009, -0.018, 1, 0, 0);
  polygon(ctx, [[13,3],[w+13,4],[w+24,h+16],[19,h+26]], '#24294c71');
  rect(ctx, 0, 0, w, h, gradient(ctx, 0, 0, w, h, [
    [0, '#ece6d4'], [0.15, C.paper], [0.84, '#fffdf2'], [1, '#e8e2d5'],
  ]));
  for (const line of lines) printedLine(ctx, line, 86, line.y - firstBaseline + 176);
  rect(ctx, 86, bottomLine + 4, w - 172, 3, '#9c96a4');
  text(ctx, locator, 86, bottomLine + 76, 40, 'Mono');
  polygon(ctx, [[w-80,h],[w,h-44],[w,h]], '#c9c4b7');
  ctx.restore();
  rect(ctx, 385, slotY + 7, 1200, 44, gradient(ctx, 0, slotY+7, 0, slotY+51, [
    [0, '#25253d53'], [1, '#25253d00'],
  ]));
}

function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  const moveCut = index < 3 ? 0 : index > 3 ? 1 : smooth(elapsed / 1.45);
  const top = edgeY(fragment) + (edgeY(whole) - edgeY(fragment)) * moveCut;
  let camera = trayCamera;
  if (index === 1) camera *= 1 - smooth(elapsed / 1.6);
  if (index === 2 || index === 3) camera = 0;
  const returnToTray = index === 4 ? smooth(reveal('Now suppose', 1.45)) : 0;
  if (index === 4) camera *= returnToTray;
  const scan = index === 4 ? smooth(reveal('Index the passage', 1.65)) : 0;
  const newCopy = index >= 4;
  const feed = newCopy ? (index === 4 ? smooth(reveal('the same search', 1.4)) : 1)
    : (index === 0 ? 0.55 + 0.45 * smooth(elapsed / 1.25) : 1);
  const who = index === 2 ? smooth(reveal('the person to page', 0.6)) : index === 3 ? 1 - moveCut : 0;
  const when = index === 2 ? smooth(reveal('the event that starts', 0.65)) : index === 3 ? 1 - moveCut : 0;

  ctx.save();
  rect(ctx, 0, 0, 1920, 1080, C.shell);
  // The camera travels along the case from the return tray to the glass and back.
  ctx.translate(960, 540);
  ctx.rotate(-0.027);
  ctx.translate(-960, -540 - camera);
  housing(ctx);
  platen(ctx, top, scan, who, when);
  tray(ctx);
  copy(ctx, newCopy ? whole : fragment, feed);
  ctx.restore();
}

function check() {
  assert.equal(page.slice(fragment.start, fragment.end), '15 minutes with deploy ID.');
  assert.equal(page.slice(whole.start, whole.end), rule);
  for (const span of [fragment, whole]) {
    assert.equal(copyLines(span).map(line => line.text).join(' '), page.slice(span.start, span.end));
  }
  assert.equal(copyLines(fragment).length, 2);
  assert.equal(copyLines(whole).length, 4);
  assert.equal(whole.end, fragment.end);
  assert.ok(edgeY(whole) < edgeY(fragment));
  assert.equal(page.slice(whole.end).trim(), archive);
}

export default { title: 'What Starts the Fifteen-Minute Clock?', beats, draw, check };

import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { CURRENT_RECORD, draftClaims, EVIDENCE } from '../../../films/hallucination-evidence/fixtures.mjs';
import { renderIncident } from '../../../films/hallucination-evidence/arithmetic.mjs';

const title = 'Which time can we post?';
const beats = [
  {
    id: 'the-draft-lands',
    say: "The draft gives customers a time to expect the embedding API back. Fourteen thirty. There's a citation to the incident runbook. Which of these two times can we post?",
    hold: 1.8,
  },
  {
    id: 'lift-the-left-edge',
    say: "Lift the left edge of the draft. See the eight fourteen underneath? The runbook records a completed database failover on May twenty-sixth at eight fourteen UTC. That checks out.",
    hold: 1.2,
  },
  {
    id: 'lift-the-promise',
    say: "Follow the other time as the sheet comes up. Fourteen thirty goes with it. The draft cites the right incident and version. Look where the recovery estimate would have to come from.",
    hold: 1.8,
  },
  {
    id: 'first-update',
    say: "There's no estimate in that record. We can still send the reader the failover time. Check each claim on its own, and build the update from the fields that support it.",
    hold: 1.15,
  },
  {
    id: 'the-next-entry',
    say: "Later, the incident team files a new version. Look at the same spot on the page. Now there's a recovery estimate. What would you change in the reader's update?",
    hold: 2,
  },
  {
    id: 'what-the-reader-gets',
    say: "With version two as our source, we can post fifteen ten UTC. Keep the word estimate beside it. That's when the team expects recovery. We'll need another entry to say when the service actually recovered.",
    hold: 3,
  },
];

const [service, event, eventTime, estimate] = draftClaims;
const laterClaims = [service, event, eventTime, estimate].map(claim => ({
  ...claim,
  version: CURRENT_RECORD.version,
  value: CURRENT_RECORD.facts[claim.field],
}));
const firstUpdate = renderIncident(draftClaims, EVIDENCE);
const secondUpdate = renderIncident(laterClaims, CURRENT_RECORD);

const ink = '#183d71';
const carmine = '#a92742';
const xColumns = [343, 1035];
const sheet = { x: 267, y: 242, w: 1478, h: 439 };
const ease = v => {
  const t = Math.max(0, Math.min(1, v));
  return t * t * (3 - 2 * t);
};
function timeParts(value) {
  const m = value.match(/^(?:(May 26) at )?(\d\d:\d\d) UTC$/);
  if (!m) throw new Error('Unexpected incident time: ' + value);
  return { time: m[2], detail: m[1] ? '26 May  ·  UTC' : 'UTC' };
}
function posted(claims, result) {
  return Object.fromEntries(claims.filter((c, i) => result.verdicts[i] === 'supported')
    .map(c => [c.field, c.value]));
}
const firstPosted = posted(draftClaims, firstUpdate);
const secondPosted = posted(laterClaims, secondUpdate);
function check() {
  assert.deepEqual(firstUpdate.verdicts, ['supported', 'supported', 'supported', 'not_supported']);
  assert.equal(firstUpdate.route, 'shorten');
  assert.equal(timeParts(firstPosted.last_event_at).time, '08:14');
  assert.equal(timeParts(estimate.value).time, '14:30');
  assert.equal(Object.hasOwn(firstPosted, 'recovery_eta'), false);
  assert.equal(Object.hasOwn(EVIDENCE.facts, 'recovery_eta'), false);
  assert.equal(renderIncident(draftClaims, CURRENT_RECORD).route, 'abstain');
  assert.equal(secondUpdate.route, 'serve');
  assert.equal(timeParts(secondPosted.recovery_eta).time, '15:10');
  assert.equal(secondPosted.last_event_at, firstPosted.last_event_at);
  assert.equal(firstUpdate.text.includes(estimate.value), false);
  assert.ok(secondUpdate.text.includes(secondPosted.recovery_eta));
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function rounded(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}
function line(ctx, x, y, endX, endY, color, width = 1) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}
function label(ctx, value, x, y, size, color = ink, face = 'Sans', weight = 400) {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}
function circle(ctx, x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}
function gradient(ctx, x, y, x1, y1, stops) {
  const g = ctx.createLinearGradient(x, y, x1, y1);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}
function shadow(ctx, color, blur, x, y) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = x;
  ctx.shadowOffsetY = y;
}
function background(ctx) {
  rect(ctx, 0, 0, 1920, 1080, gradient(ctx, 200, 70, 1580, 1080,
    [[0, '#f5eae1'], [.62, '#e1ccd0'], [1, '#c8b4bf']]));
  // A broad oblique window reflection sets the light for the clear sheet and its shadow.
  rect(ctx, 0, 0, 1920, 1080, gradient(ctx, 1130, 240, 1650, 540,
    [[0, '#ffffff00'], [.16, '#fff6e753'], [.7, '#fff6e75f'], [.96, '#ffffff00']]));
}

function book(ctx) {
  ctx.save();
  shadow(ctx, '#2a183d50', 33, 13, 24);
  rounded(ctx, 121, 147, 1677, 725, 26, '#283e82');
  ctx.restore();
  rounded(ctx, 124, 141, 1671, 723, 24, '#425a9b');
  // Fine crosshatching on the visible bookcloth, with a blind stitch near the edge.
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(124, 141, 1671, 723, 24);
  ctx.clip();
  for (let y = 144; y < 865; y += 5) line(ctx, 124, y, 1796, y + 5, '#fff9fb17');
  for (let x = 128; x < 1794; x += 5) line(ctx, x, 141, x + 3, 864, '#121b5a25');
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 7]);
  ctx.strokeStyle = '#b2b4d0';
  ctx.beginPath();
  ctx.roundRect(138, 151, 1644, 698, 18);
  ctx.stroke();
  ctx.restore();
  for (let i = 5; i >= 0; i--) {
    rounded(ctx, 163 - i, 159 + 3 * i, 1592, 661, 5, i % 2 ? '#c9bfc4' : '#eee6dc');
  }
}

function field(ctx, index, value, overlay = false) {
  if (!value) return;
  const x = xColumns[index];
  const { time, detail } = timeParts(value);
  const color = overlay ? carmine : ink;
  label(ctx, index ? 'Recovery estimate' : 'Failover completed', x + 3, 421, 43, color, 'Sans', 600);
  ctx.font = '400 160px "Lesson Serif"';
  if (overlay) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.65;
    ctx.strokeStyle = carmine;
    ctx.fillStyle = '#bf41556d';
    ctx.fillText(time, x, 575);
    ctx.strokeText(time, x, 575);
  } else {
    ctx.fillStyle = ink;
    ctx.fillText(time, x, 575);
  }
  label(ctx, detail, x + 6, 632, 34, color, 'Mono');
}

function paper(ctx, record) {
  const version = record === EVIDENCE ? 1 : 2;
  rect(ctx, 162, 158, 1592, 662, gradient(ctx, 165, 158, 1710, 805,
    [[0, '#e4e2db'], [.085, '#fbf8ed'], [.65, '#f9f5e9'], [1, '#ede8db']]));
  for (let y = 273; y <= 757; y += 67) line(ctx, 276, y, 1683, y, '#9caec04e', 1.5);
  line(ctx, 293, 241, 293, 789, '#afc2d0', 1.2);
  field(ctx, 0, record.facts.last_event_at);
  field(ctx, 1, record.facts.recovery_eta);
  line(ctx, 315, 694, 1683, 694, ink, 2);
  label(ctx, 'Incident runbook', 338, 768, 49, ink, 'Serif');
  label(ctx, 'INC-48291   /   v' + version, 1029, 764, 39, ink, 'Mono');
}

function rings(ctx) {
  for (const y of [280, 399, 518, 637, 756]) {
    circle(ctx, 206, y, 13, '#9a96aa');
    circle(ctx, 206, y - 1, 9, '#31354c');
    ctx.save();
    ctx.lineCap = 'round';
    for (const [width, color, offset] of [[13, '#333e67', 3], [11, '#8b99b2', 0], [3, '#f6f5f3', -2]]) {
      ctx.beginPath();
      ctx.moveTo(204, y + offset);
      ctx.bezierCurveTo(169, y - 21 + offset, 136, y - 19 + offset, 124, y - 2 + offset);
      ctx.bezierCurveTo(115, y + 12 + offset, 128, y + 22 + offset, 143, y + 23 + offset);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    }
    ctx.restore();
  }
}

function acetateStock(ctx) {
  const { x, y, w, h } = sheet;
  // The folded grip is part of the same transparency as the two red claims.
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 23);
  ctx.lineTo(x + w - 69, y + 2);
  ctx.quadraticCurveTo(x + w - 26, y + 3, x + w - 3, y + 37);
  ctx.lineTo(x + w - 9, y + h - 12);
  ctx.lineTo(x + 17, y + h - 1);
  ctx.closePath();
  ctx.fillStyle = gradient(ctx, x, y, x + w, y + h,
    [[0, '#ef65832b'], [.25, '#ffe2d82e'], [.48, '#ef6e7638'],
     [.73, '#ffe7de22'], [.92, '#f27d963c'], [1, '#c8586675']]);
  ctx.fill();
  ctx.strokeStyle = '#a637526e';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.save();
  ctx.clip();
  const gloss = gradient(ctx, 810, 240, 1070, 570,
    [[0, '#ffffff00'], [.43, '#ffffff00'], [.47, '#ffffff55'],
     [.5, '#ffffff20'], [.65, '#ffffff00'], [1, '#ffffff00']]);
  rect(ctx, x, y, w, h, gloss);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(x + w - 70, y + 2);
  ctx.lineTo(x + w - 53, y + 48);
  ctx.quadraticCurveTo(x + w - 30, y + 42, x + w - 3, y + 37);
  ctx.quadraticCurveTo(x + w - 19, y + 9, x + w - 70, y + 2);
  ctx.fillStyle = '#df8795';
  ctx.fill();
  field(ctx, 0, eventTime.value, true);
  field(ctx, 1, estimate.value, true);
  rounded(ctx, x + 28, y + 39, 484, 70, 4, '#a62b47');
  label(ctx, 'Draft  /  cites v1', x + 48, y + 88, 39, '#fff5ee', 'Mono');
}

let acetate;
function draftSurface() {
  if (!acetate) {
    acetate = createCanvas(sheet.w, sheet.h);
    const surface = acetate.getContext('2d');
    surface.translate(-sheet.x, -sheet.y);
    acetateStock(surface);
  }
  return acetate;
}

function drawDraft(ctx, leftLift, rightLift, leave) {
  if (leave >= 1) return;
  const { x, y, w, h } = sheet;
  const surface = draftSurface();
  ctx.save();
  ctx.translate(leave * 455, -leave * 780);
  ctx.rotate(-leave * .065);
  // Each strip stays attached to its neighbours. The bend travels across the space between the times.
  function edge(u) {
    const cross = ease((u - .32) / .26);
    const lift = leftLift * (1 - cross) + rightLift * cross;
    const top = y - lift * 187;
    const bottom = y + h - lift * 282;
    return { top, bottom };
  }
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    const { bottom } = edge(u);
    if (!i) ctx.moveTo(x, bottom);
    else ctx.lineTo(x + u * w, bottom);
  }
  ctx.strokeStyle = '#4f23412a';
  ctx.lineWidth = 3;
  ctx.save();
  shadow(ctx, '#51294063', 13 + Math.max(leftLift, rightLift) * 15, 6, 10 + Math.max(leftLift, rightLift) * 23);
  ctx.stroke();
  ctx.restore();
  if (leftLift === rightLift) {
    const { top, bottom } = edge(0);
    ctx.drawImage(surface, x, top, w, bottom - top);
  } else {
    for (let start = 0; start < w; start += 8) {
      const width = Math.min(8, w - start);
      const { top, bottom } = edge((start + width / 2) / w);
      const slope = (edge((start + width) / w).top - edge(start / w).top) / width;
      ctx.save();
      ctx.transform(1, slope, 0, (bottom - top) / h, x + start, top - slope * width / 2);
      ctx.drawImage(surface, start, 0, width, h, 0, 0, width + .09, h);
      ctx.restore();
    }
  }
  ctx.restore();
}

function changePage(ctx, amount) {
  if (amount === 0) return paper(ctx, EVIDENCE);
  paper(ctx, CURRENT_RECORD);
  if (amount === 1) return;
  const fold = 1756 - amount * 1630;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(156, 154);
  ctx.lineTo(fold - 14, 154);
  ctx.lineTo(fold + 36, 825);
  ctx.lineTo(156, 825);
  ctx.clip();
  paper(ctx, EVIDENCE);
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(fold - 14, 158);
  ctx.bezierCurveTo(fold - 64, 245, fold - 83, 340, fold - 59, 532);
  ctx.lineTo(fold - 42, 797);
  ctx.quadraticCurveTo(fold - 3, 818, fold + 36, 820);
  ctx.closePath();
  ctx.fillStyle = gradient(ctx, fold - 68, 480, fold + 23, 475,
    [[0, '#b0aba4'], [.25, '#ece6da'], [.68, '#fffdf4'], [1, '#d0cbc2']]);
  shadow(ctx, '#281d3429', 10, 9, 5);
  ctx.fill();
  ctx.restore();
}

function phone(ctx, entry, mix) {
  if (entry === 0) return;
  ctx.save();
  ctx.translate(340 - (1 - entry) * 235, 128 + (1 - entry) * 1030);
  ctx.rotate(.052 + .08 * (1 - entry));
  ctx.save();
  shadow(ctx, '#201e3963', 36, 16, 25);
  rounded(ctx, 0, 0, 558, 777, 57, '#373c53');
  ctx.restore();
  rounded(ctx, 2, 2, 553, 771, 55, '#797e8c');
  rounded(ctx, 6, 6, 546, 763, 51, '#191f35');
  rounded(ctx, 17, 17, 524, 738, 42, '#fffdf7');
  rounded(ctx, 221, 32, 116, 15, 8, '#262b40');
  rounded(ctx, 207, 727, 145, 7, 4, '#30364a');
  const x = 52;
  label(ctx, 'Status page', x, 122, 37, ink, 'Sans', 600);
  label(ctx, 'Embedding API', x, 213, 59, '#223048', 'Serif');
  line(ctx, x, 245, 506, 245, '#a5b6c9', 2);
  label(ctx, 'Failover completed', x, 334, 39, ink);
  const firstTime = timeParts(firstPosted.last_event_at);
  label(ctx, '26 May, ' + firstTime.time + ' UTC', x, 395, 39, '#222c44', 'Mono');
  label(ctx, 'Recovery estimate', x, 494, 39, ink);
  const published = mix >= .5;
  const reader = published ? secondPosted : firstPosted;
  ctx.save();
  ctx.globalAlpha = Math.abs(2 * mix - 1);
  label(ctx, reader.recovery_eta ?? 'None recorded', x, 575, published ? 75 : 54, '#222c44', 'Serif');
  label(ctx, 'Incident runbook v' + (published ? 2 : 1), x, 665, 36, ink);
  ctx.restore();
  ctx.restore();
}

function overhead(ctx) {
  ctx.translate(960, 535);
  ctx.rotate(-.0235);
  ctx.translate(-960, -535);
}

let desk;
function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  if (!desk) {
    desk = createCanvas(1920, 1080);
    const still = desk.getContext('2d');
    background(still);
    overhead(still);
    book(still);
  }
  ctx.drawImage(desk, 0, 0);
  ctx.save();
  overhead(ctx);
  const page = index < 4 ? 0 : index > 4 ? 1 : ease(reveal('Later', 1.7));
  changePage(ctx, page);
  rings(ctx);
  const landing = 1 - ease(elapsed / 1.05);
  let left = 1;
  let right = 1;
  if (index === 0) { left = 0; right = landing; }
  if (index === 1) { left = ease(reveal('Lift the left edge', 1.8)); right = 0; }
  if (index === 2) right = ease(reveal('Follow the other time', 1.55));
  const leave = index < 3 ? 0 : index > 3 ? 1 : ease(reveal("There's no estimate", 1.35));
  drawDraft(ctx, left, right, leave);
  const entry = index < 3 ? 0 : index > 3 ? 1 : ease(reveal('We can still send', 1.25));
  const update = index < 5 ? 0 : ease(reveal('With version two', .8));
  phone(ctx, entry, update);
  ctx.restore();
}

export default { title, beats, draw, check };

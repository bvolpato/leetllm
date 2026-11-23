import assert from 'node:assert/strict';
import { conflictingSwap } from '../../../films/llm-judge/fixtures.mjs';
import { aggregateSwaps, identity } from '../../../films/llm-judge/arithmetic.mjs';

const title = 'Did the judge choose the same reply twice?';
const beats = [
  {
    id: 'first-impression',
    say: 'Watch the end of the yellow ballot. That punched letter is a language model’s vote. We asked which rollback instructions would be easier for Maya to follow. The judge chose B.',
    hold: 0.85,
  },
  {
    id: 'two-replies',
    say: 'Read the two replies. Both tell Maya to stop the rollout, then run the rollback. The yellow one breaks those actions into steps.',
    hold: 0.6,
  },
  {
    id: 'change-the-order',
    say: 'For a fresh call, swap the replies. The hole travels with our copy of the steps. The model sees the original words in reverse order, with the same question and settings.',
    hold: 0.75,
  },
  {
    id: 'where-next',
    say: 'Suppose the judge still prefers the steps. Which letter would it have to send back now?',
    hold: 2.1,
  },
  {
    id: 'second-impression',
    say: 'It would take an A. Watch what actually comes back in this example. Another B. Where did this one land?',
    hold: 1.5,
  },
  {
    id: 'file-the-pair',
    say: 'One B went through the steps. The other went through the sentence. The judge picked the same position twice and chose a different reply each time. We record this pair as unresolved.',
    hold: 2.8,
  },
];

const calls = conflictingSwap;
const replies = {
  compact: { label: 'Sentence', stock: '#f7f2e8', shade: '#d8dfde', ink: '#192947' },
  stepwise: { label: 'Steps', stock: '#ffdb73', shade: '#f4b84c', ink: '#3e2a25' },
};
const status = aggregateSwaps(...calls);
const top = 224;
const bottom = 552;
const left = 298;
const sheetWidth = 1350;
const sheetHeight = 256;
const punchX = 1508;
const stampX = punchX - left;
const stampY = 129;

// The die makes separate pinholes. Even the counters of the B remain attached.
const dies = {
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
};
function pins(letter) {
  return dies[letter].flatMap((line, y) => [...line].flatMap((bit, x) =>
    bit === '1' ? [{ x: (x - 2) * 22, y: (y - 3) * 20 }] : []));
}
const impressions = calls.map((call, i) => ({
  owner: identity(call), letter: call.verdict, number: i + 1, pins: pins(call.verdict),
}));
function check() {
  assert.deepEqual(calls.map(c => c.order), [['compact', 'stepwise'], ['stepwise', 'compact']]);
  assert.deepEqual(impressions.map(v => [v.letter, v.owner]), [['B', 'stepwise'], ['B', 'compact']]);
  assert.equal(status, 'unresolved');
  const picksStepsAgain = { ...calls[1], verdict: 'A' };
  assert.equal(aggregateSwaps(calls[0], picksStepsAgain), 'stepwise');
}

const clamp = value => Math.max(0, Math.min(1, value));
function smooth(value) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}
const segment = (t, from, to) => smooth((t - from) / (to - from));

function text(ctx, value, x, y, style, color, align = 'left') {
  ctx.font = style;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}
function line(ctx, x1, y1, x2, y2, color, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
function disc(ctx, x, y, radius, color) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
function polygon(ctx, points, color) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function folder(ctx) {
  // The worn fold at the foot and the angled cut-out belong to a single blue file.
  const blue = ctx.createLinearGradient(0, 200, 1840, 1180);
  blue.addColorStop(0, '#354f9c');
  blue.addColorStop(0.62, '#2b478c');
  blue.addColorStop(1, '#20376f');
  ctx.fillStyle = blue;
  ctx.fillRect(0, 0, 1920, 1080);
  for (let i = 0; i < 740; i++) {
    const x = (i * 677 + i * i * 17) % 1920;
    const y = (i * 359 + i * i * 11) % 1080;
    line(ctx, x, y, x + 2 + i % 9, y + (i % 3 - 1), i % 2 ? '#ffffff11' : '#0e22511a', 1.2);
  }
  polygon(ctx, [[0, 940], [1325, 940], [1410, 896], [1920, 896], [1920, 1080], [0, 1080]], '#243c79');
  line(ctx, 0, 942, 1325, 942, '#6175aa', 2);
  line(ctx, 1325, 942, 1410, 898, '#6175aa', 2);
  line(ctx, 1410, 898, 1920, 898, '#6175aa', 2);
  text(ctx, 'LLM JUDGE  /  MAYA’S ROLLBACK', 104, 70, '32px "Lesson Mono"', '#d7e2f1');
  text(ctx, 'Which reply is easier to follow?', 102, 155, '66px "Lesson Serif"', '#fffbec');
  for (const [label, y] of [['A', top], ['B', bottom]]) {
    text(ctx, label, 162, y + 164, 'bold 113px "Lesson Sans"', '#f3ecda', 'center');
    line(ctx, 211, y + 127, 270, y + 127, '#a0b2dd', 3);
  }
}

function outline(ctx) {
  // Cut corners and the feeding perforations give the two ballots a common stock size.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(sheetWidth - 35, 0);
  ctx.lineTo(sheetWidth, 35);
  ctx.lineTo(sheetWidth, sheetHeight - 34);
  ctx.lineTo(sheetWidth - 34, sheetHeight);
  ctx.lineTo(0, sheetHeight);
  ctx.closePath();
}
function hole(ctx, x, y, radius) {
  ctx.moveTo(x + radius, y);
  ctx.arc(x, y, radius, 0, Math.PI * 2, true);
}

function ballot(ctx, id, centerX, centerY, angle, lift, impression, action) {
  const { label, stock, shade, ink } = replies[id];
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  ctx.scale(1 + lift * 0.035, 1 + lift * 0.035);
  ctx.translate(-sheetWidth / 2, -sheetHeight / 2);
  const paper = ctx.createLinearGradient(0, 0, 80, sheetHeight);
  paper.addColorStop(0, stock);
  paper.addColorStop(0.79, stock);
  paper.addColorStop(1, shade);
  outline(ctx);
  // A single clip cuts through everything printed on the sheet, including the stock.
  const feedY = [30, 79, 128, 177, 226];
  for (const y of feedY) hole(ctx, 25, y, 7);
  if (impression) {
    for (const p of impression.pins) hole(ctx, stampX + p.x, stampY + p.y, 9);
  }
  ctx.shadowColor = 'rgba(10,19,59,0.41)';
  ctx.shadowOffsetY = 9 + 26 * lift;
  ctx.shadowBlur = 10 + 28 * lift;
  ctx.fillStyle = paper;
  ctx.fill('evenodd');
  ctx.shadowColor = 'transparent';
  ctx.clip('evenodd');
  line(ctx, 52, 0, 52, sheetHeight, '#22314d45', 1.5);
  ctx.setLineDash([6, 8]);
  line(ctx, 1070, 0, 1070, sheetHeight, '#22314d66', 2);
  ctx.setLineDash([]);
  for (let i = 0; i < 70; i++) {
    const x = (i * 421) % sheetWidth;
    const y = (i * 97) % sheetHeight;
    line(ctx, x, y, x + 4 + i % 11, y - 1, '#54401e12');
  }
  text(ctx, label, stampX, 42, 'bold 36px "Lesson Sans"', ink, 'center');
  if (id === 'compact') {
    text(ctx, 'Stop the rollout, then run', 83, 117, '68px "Lesson Serif"', ink);
    text(ctx, 'the DEP-27 rollback.', 83, 193, '68px "Lesson Serif"', ink);
  } else {
    text(ctx, '1', 88, 111, 'bold 48px "Lesson Mono"', ink);
    text(ctx, '2', 88, 191, 'bold 48px "Lesson Mono"', ink);
    text(ctx, 'Stop the rollout.', 155, 111, '58px "Lesson Sans"', ink);
    text(ctx, 'Run the DEP-27 rollback.', 155, 191, '58px "Lesson Sans"', ink);
  }
  for (const [i, amount] of action.entries()) {
    if (!amount) continue;
    const sentence = id === 'compact';
    ctx.font = sentence ? '68px "Lesson Serif"' : '58px "Lesson Sans"';
    const words = sentence ? ['Stop the rollout', 'the DEP-27 rollback.'] : ['Stop the rollout.', 'Run the DEP-27 rollback.'];
    const x = sentence ? 84 : 155;
    const y = (sentence ? [129, 205] : [124, 204])[i];
    line(ctx, x, y, x + ctx.measureText(words[i]).width * amount, y, '#b64d32', 4);
  }
  if (impression) {
    for (const p of impression.pins) {
      ctx.beginPath();
      ctx.arc(stampX + p.x, stampY + p.y, 10.4, 0.04, Math.PI * 0.94);
      ctx.strokeStyle = '#fff9db';
      ctx.lineWidth = 2.4;
      ctx.stroke();
    }
    text(ctx, 'CALL ' + impression.number, stampX, 241, 'bold 34px "Lesson Mono"', ink, 'center');
  }
  ctx.restore();
}

function punch(ctx, t) {
  if (t >= 1) return;
  const reach = segment(t, 0, 0.28) * (1 - segment(t, 0.64, 1));
  const press = segment(t, 0.28, 0.45) * (1 - segment(t, 0.58, 0.75));
  ctx.save();
  ctx.translate(punchX + 555 * (1 - reach), bottom + stampY - 14);
  ctx.rotate(-0.13 + 0.06 * press);
  // A fork under the die, a steel knuckle and a long enamel lever.
  ctx.shadowColor = '#10173366';
  ctx.shadowOffsetY = 15 - press * 9;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(-62, 70); ctx.quadraticCurveTo(-76, 77, -68, 94);
  ctx.quadraticCurveTo(-65, 104, -44, 106); ctx.lineTo(147, 95);
  ctx.quadraticCurveTo(215, 80, 268, 101); ctx.lineTo(412, 146);
  ctx.quadraticCurveTo(448, 149, 451, 121); ctx.quadraticCurveTo(449, 103, 427, 96);
  ctx.lineTo(224, 25); ctx.lineTo(122, 33); ctx.closePath();
  ctx.fillStyle = '#8c9aac'; ctx.fill();
  ctx.shadowColor = 'transparent';
  const steel = ctx.createLinearGradient(-65, -88, 100, 80);
  steel.addColorStop(0, '#ebf1ea'); steel.addColorStop(0.39, '#b0bdc6'); steel.addColorStop(0.62, '#ebede5'); steel.addColorStop(1, '#627181');
  ctx.save();
  ctx.translate(178, 24); ctx.rotate(0.13 * (1 - press)); ctx.translate(-178, -24);
  ctx.beginPath();
  ctx.moveTo(-72, -60); ctx.quadraticCurveTo(-78, -89, -52, -93); ctx.lineTo(28, -97);
  ctx.quadraticCurveTo(97, -84, 168, -29); ctx.lineTo(360, -82);
  ctx.quadraticCurveTo(397, -81, 398, -48); ctx.lineTo(220, 47);
  ctx.quadraticCurveTo(156, 85, 116, 37); ctx.lineTo(37, -1);
  ctx.lineTo(35, 56); ctx.lineTo(-62, 60); ctx.closePath();
  ctx.fillStyle = steel; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#6b7781'; ctx.stroke();
  const red = ctx.createLinearGradient(0, -100, 0, -15);
  red.addColorStop(0, '#fa8765'); red.addColorStop(0.33, '#f76643'); red.addColorStop(1, '#ab352c');
  ctx.beginPath();
  ctx.moveTo(210, -43); ctx.lineTo(497, -148); ctx.bezierCurveTo(541, -160, 560, -119, 520, -96);
  ctx.lineTo(245, 22); ctx.quadraticCurveTo(214, 26, 203, 6); ctx.quadraticCurveTo(192, -22, 210, -43);
  ctx.fillStyle = red; ctx.fill();
  line(ctx, 226, -40, 499, -139, '#ffac87', 4);
  disc(ctx, 170, 20, 25, '#647183'); disc(ctx, 168, 17, 18, '#e2e6df');
  line(ctx, 158, 24, 179, 10, '#657487', 4);
  ctx.restore();
  ctx.restore();
}

function chads(ctx, t, vote) {
  if (t < 0.47 || t > 0.98) return;
  const fall = (t - 0.47) / 0.51;
  const dots = vote.pins.filter((_, i) => i % 3 === 0);
  ctx.save();
  for (const [i, p] of dots.entries()) {
    const x = punchX + p.x + (70 + (i % 4) * 31) * fall;
    const y = bottom + stampY + p.y + 280 * fall * fall - (140 + 16 * (i % 3)) * fall;
    ctx.globalAlpha = 1 - segment(fall, 0.74, 1);
    ctx.fillStyle = replies[vote.owner].stock;
    ctx.beginPath();
    ctx.ellipse(x, y, 8, 2 + 5 * Math.abs(Math.cos(fall * 7 + i)), fall * 2 + i, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  ctx.save();
  // Start at the die. Pull back once the isolated B needs its ballot and slot.
  const close = index === 0 ? 1 - smooth(reveal('We asked which rollback instructions', 2.4)) : 0;
  const zoom = 1 + close * 1.5;
  ctx.translate(960, 540);
  ctx.scale(zoom, zoom);
  ctx.translate(-(960 + 572 * close), -(540 + 166 * close));
  folder(ctx);
  const swap = index < 2 ? 0 : index > 2 ? 1 : smooth(reveal('swap the replies', 2.6));
  const first = index > 0 ? 1 : clamp((elapsed + 0.28) / 2.5);
  const second = index < 4 ? 0 : index > 4 ? 1 : reveal('Watch what actually comes back', 2.7);
  const arc = Math.sin(Math.PI * swap);
  const fade = index === 1 ? 1 - smooth(reveal('The yellow one', 0.7)) : 0;
  const action = fade > 0
    ? [smooth(reveal('stop the rollout', 0.5)) * fade, smooth(reveal('run the rollback', 0.5)) * fade]
    : [0, 0];
  for (const [row, id] of calls[0].order.entries()) {
    const target = calls[1].order.indexOf(id);
    const y = top + (row + (target - row) * swap) * (bottom - top);
    const sign = row === 1 ? 1 : -1;
    const vote = impressions.find((v, i) => v.owner === id && [first, second][i] >= 0.47);
    ballot(ctx, id, left + sheetWidth / 2 + sign * 118 * arc, y + sheetHeight / 2,
      sign * 0.113 * arc, arc * (row === 1 ? 1 : 0.12), vote, action);
  }
  if (first < 1) { punch(ctx, first); chads(ctx, first, impressions[0]); }
  if (second > 0 && second < 1) { punch(ctx, second); chads(ctx, second, impressions[1]); }
  if (index === 5) {
    const ink = reveal('We record this pair', 0.4);
    ctx.save();
    ctx.globalAlpha = ink;
    ctx.translate(1505, 135); ctx.rotate(-0.045);
    ctx.strokeStyle = '#ffe2a5'; ctx.lineWidth = 4;
    ctx.strokeRect(-196, -53, 392, 77);
    text(ctx, status.toUpperCase(), 0, 3, 'bold 50px "Lesson Mono"', '#ffe2a5', 'center');
    ctx.restore();
  }
  ctx.restore();
}

export default { title, beats, draw, check };

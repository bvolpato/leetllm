import assert from 'node:assert/strict';
import { createCanvas, Path2D } from '@napi-rs/canvas';
import { scaledCosine } from '../../../films/semantic-cache/arithmetic.mjs';

// The two directions come from the lesson's paraphrase and high-scoring exception.
// Here they are illustrative product-help embeddings, not measurements of these sentences.
const garment = { product: 'Poppy pullover', edition: 'autumn', wash: '30°C', dry: 'Dry flat.' };
const saved = {
  question: 'Which wash temperature?',
  vector: [1, 0],
  product: garment.product,
  edition: garment.edition,
  fields: ['wash'],
  answer: 'Wash at ' + garment.wash + ' or cooler.',
};
const shoppers = [
  { lines: ['How hot can I wash', 'this pullover?'], vector: [.99, .04], fields: ['wash'] },
  { lines: ['How do I wash and dry', 'this pullover?'], vector: [.9999, .01], fields: ['wash', 'dry'] },
];
const score = (question) => scaledCosine(saved.vector, question.vector);
const uncovered = (question) => question.fields.filter((field) => !saved.fields.includes(field));
function canReuse(question, item, cutoff = .995) {
  return item.product === saved.product && item.edition === saved.edition
    && score(question) >= cutoff && uncovered(question).length === 0;
}

const beats = [
  { id: 'pull-the-reply', say: 'How hot can I wash this pullover? The shop pulls up an answer it gave yesterday.', hold: .9 },
  { id: 'find-the-neighbor', say: 'Yesterday the question was, “Which wash temperature?” The wording changed, so an exact text lookup misses. A semantic cache compares vectors that represent the questions and retrieves the reply to a close match.', hold: .65 },
  { id: 'send-the-strip', say: 'Both shoppers want the temperature. Same pullover, same public care instructions. The shop can send the whole saved reply.', hold: 1.25 },
  { id: 'one-extra-instruction', say: 'Try this next question against the very same answer. Where on the blue strip would you look for the drying instructions?', hold: 1.45 },
  { id: 'loose-threads', say: 'The blue thread runs out after the wash temperature. In this example, the question about washing and drying actually scores closer to the saved question. Raising the cutoff would lose the good match first.', hold: .9 },
  { id: 'inside-the-seam', say: 'The shop keeps that saved reply for wash-temperature questions about this pullover. When someone asks about drying too, it turns to the current care label.', hold: .85 },
  { id: 'finish-the-reply', say: 'There, inside the seam. Wash at thirty degrees Celsius or cooler. Dry flat.', hold: 3 },
];

const ink = '#1d2538';
const blue = '#27489c';
const cream = '#fff5d7';
const red = '#a12f35';
const clamp = (v) => Math.min(1, Math.max(0, v));
function ease(v) { const t = clamp(v); return t * t * (3 - 2 * t); }
function during(clock, index, phrase, span) {
  if (clock.index !== index) return Number(clock.index > index);
  return ease(clock.reveal(phrase, span));
}
function label(ctx, value, x, y, size, color = ink, family = 'Sans', weight = 500) {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}
function stroke(ctx, path, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke(new Path2D(path));
}
function pigment(ctx, path, color) {
  ctx.fillStyle = color;
  ctx.fill(new Path2D(path));
}
function gradient(ctx, x1, y1, x2, y2, stops) {
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  for (const [position, color] of stops) g.addColorStop(position, color);
  return g;
}
function layer(w, h, paint) {
  const canvas = createCanvas(w, h);
  paint(canvas.getContext('2d'));
  return canvas;
}

const outline = 'M-103-294 Q-171-277-211-259 Q-251-242-270-198 L-388 134 Q-387 147-375 154 L-297 180 Q-287 183-282 169 L-208-7 L-204 300 Q-202 327-175 331 Q3 347 176 327 Q193 325 193 307 L197-7 L262 186 Q266 197 279 194 L364 170 Q374 167 369 153 L266-197 Q249-241 211-254 L104-294 Q0-265-103-294 Z';

// A repeat of interlocking yarn loops. The ribs and colorwork follow the garment.
const stocking = layer(18, 24, (c) => {
  c.lineCap = 'round';
  for (const [dx, dy] of [[0, 0], [9, 12], [-9, 12], [0, 24]]) {
    c.save(); c.translate(dx, dy);
    stroke(c, 'M1-8 Q0 0 8 8 Q14 0 15-8', 'rgba(83,16,24,.42)', 6);
    stroke(c, 'M1-8 Q2 0 8 6 M15-8 Q13 0 9 5', 'rgba(255,180,150,.55)', 3.6);
    c.restore();
  }
});
const satin = layer(12, 8, (c) => {
  for (let y = 0; y < 8; y += 2) {
    c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect((y * 2) % 5, y, 7, 1);
    c.fillStyle = 'rgba(6,15,40,.17)'; c.fillRect((y + 5) % 8, y + 1, 6, 1);
  }
});
function ribs(c, path, x, y, width, height, tilt = 0) {
  c.save(); c.clip(new Path2D(path));
  c.fillStyle = '#c03e32'; c.fillRect(x, y, width, height);
  for (let px = x - 30; px <= x + width + 30; px += 9) {
    c.beginPath(); c.moveTo(px, y); c.lineTo(px + tilt, y + height);
    c.strokeStyle = '#96302e'; c.lineWidth = 4; c.stroke();
    c.beginPath(); c.moveTo(px + 3, y); c.lineTo(px + 3 + tilt, y + height);
    c.strokeStyle = '#eb6147'; c.lineWidth = 2.5; c.stroke();
  }
  c.restore();
}
function pullover(c) {
  c.save();
  c.translate(363, 533); c.rotate(-.14); c.scale(1.18, 1.18);
  c.shadowColor = 'rgba(40,47,66,.24)'; c.shadowBlur = 17;
  c.shadowOffsetX = 10; c.shadowOffsetY = 15;
  pigment(c, outline, '#b73932');
  c.shadowColor = 'transparent';
  c.save(); c.clip(new Path2D(outline));
  c.fillStyle = gradient(c, -340, -280, 370, 220, [
    [0, '#d65a43'], [.22, '#ed6649'], [.46, '#cf4738'], [.7, '#e85a40'], [1, '#a43533'],
  ]);
  c.fillRect(-400, -320, 800, 680);
  // Loose folds at the two underarms.
  for (const [px, angle, w] of [[-209, .14, 31], [192, -.18, 39], [142, -.13, 30]]) {
    c.save(); c.translate(px, -110); c.rotate(angle);
    c.fillStyle = gradient(c, -w, 0, w, 0, [[0, '#992a2900'], [.48, '#962f304d'], [1, '#ff9a6400']]);
    c.fillRect(-w, -20, 2 * w, 470); c.restore();
  }
  c.fillStyle = c.createPattern(stocking, 'repeat'); c.fillRect(-405, -345, 815, 710);
  // Stranded colorwork bends around the yoke in rows of individual stitches.
  c.lineCap = 'round';
  for (let row = 0; row < 16; row++) {
    for (let col = -37; col < 38; col++) {
      const phase = ((col % 12) + 12) % 12;
      const diamond = Math.abs(phase - 6) + Math.abs(row - 7);
      const fleck = (row === 1 || row === 13) && phase % 3 === 0;
      if (diamond !== 4 && diamond !== 5 && !fleck && row !== 15) continue;
      const x = col * 8.6, y = -184 + row * 6.4 - .00118 * x * x;
      c.beginPath(); c.moveTo(x - 3.3, y - 2.7); c.lineTo(x, y + 2.4); c.lineTo(x + 3.3, y - 2.7);
      c.lineWidth = 4.4; c.strokeStyle = row === 15 || diamond === 5 ? '#ffb995' : '#fff0cd'; c.stroke();
    }
  }
  ribs(c, 'M-205 285 Q-10 302 195 281 L194 342 L-210 354 Z', -208, 280, 410, 75);
  ribs(c, 'M-398 119 L-294 157 L-272 108 L-377 71 Z', -402, 70, 135, 120, -38);
  ribs(c, 'M251 148 L358 118 L382 190 L270 218 Z', 239, 108, 159, 115, 31);
  c.restore();
  // The back neck, inner shadow, and the raised ribbing on the front of the collar.
  pigment(c, 'M-108-294 Q-9-328 106-294 Q89-214 6-210 Q-80-205-108-294Z', '#802527');
  stroke(c, 'M-103-291 Q0-326 102-292', '#da5842', 14);
  const collar = 'M-114-293 Q-69-183 14-194 Q92-201 116-287 L95-296 Q70-239 10-230 Q-64-222-92-301Z';
  pigment(c, collar, '#de5540');
  c.save(); c.clip(new Path2D(collar));
  for (let i = -17; i <= 17; i++) {
    c.beginPath(); c.moveTo(2 + i * 5, -280 - Math.abs(i) * 2.4);
    c.lineTo(8 + i * 8.6, -185 - Math.abs(i) * 3.2); c.strokeStyle = '#a03630'; c.lineWidth = 3.5; c.stroke();
  }
  c.restore();
  stroke(c, 'M-111-293 Q-65-183 12-197 Q88-204 115-286', '#f9926c', 2.6);
  c.restore();
}

let tabletop;
function table() {
  if (!tabletop) tabletop = layer(1920, 1080, (c) => {
    c.fillStyle = gradient(c, 0, 0, 1920, 1080, [[0, '#e3efef'], [.5, '#d1e3e6'], [1, '#c1d6dc']]);
    c.fillRect(0, 0, 1920, 1080);
    pullover(c);
  });
  return tabletop;
}

function washMark(c, x, y, scale, color) {
  c.save(); c.translate(x, y); c.scale(scale, scale); c.lineCap = 'round'; c.lineJoin = 'round';
  c.setLineDash([]);
  stroke(c, 'M-65-35 L-53 44 L53 44 L65-35 M-61-16 Q-45-29-29-17 Q-14-4 1-17 Q17-29 32-17 Q47-4 61-18', color, 6);
  c.textAlign = 'center'; label(c, '30', 0, 28, 43, color, 'Sans', 700); c.restore();
}
function flatMark(c, x, y, scale, color) {
  c.save(); c.translate(x, y); c.scale(scale, scale); c.lineCap = 'square'; c.lineJoin = 'round';
  c.setLineDash([]);
  stroke(c, 'M-46-46 H46 V46 H-46 Z M-29 0 H29', color, 6);
  c.restore();
}

function cloth(c, x, y, w, h, col) {
  c.fillStyle = col; c.fillRect(x, y, w, h);
  c.fillStyle = c.createPattern(satin, 'repeat'); c.fillRect(x, y, w, h);
}
function washAnswer(c, color) {
  washMark(c, 93, 105, .93, color);
  label(c, 'Wash at', 185, 61, 39, color);
  label(c, garment.wash, 181, 132, 72, color, 'Serif');
  label(c, 'or cooler.', 185, 176, 39, color);
}
const washPanel = layer(466, 206, (c) => {
  cloth(c, 0, 0, 466, 206, gradient(c, 0, 10, 460, 190, [[0, '#253f87'], [.34, '#3958a6'], [1, '#233e83']]));
  c.setLineDash([9, 5]); c.strokeStyle = '#8799c5'; c.lineWidth = 2;
  c.strokeRect(11, 12, 444, 182);
  washAnswer(c, cream);
});
const questionPanel = layer(466, 206, (c) => {
  cloth(c, 0, 0, 466, 206, '#d7deec');
  c.setLineDash([9, 5]); c.strokeStyle = '#8596b4'; c.lineWidth = 2;
  c.strokeRect(11, 12, 444, 182);
  label(c, 'Which wash', 38, 91, 58, blue, 'Serif');
  label(c, 'temperature?', 38, 157, 58, blue, 'Serif');
});
const freshPanel = layer(916, 206, (c) => {
  cloth(c, 0, 0, 916, 206, gradient(c, 0, 0, 916, 110, [[0, '#fae9bb'], [.48, '#fff6dc'], [1, '#ebd8a9']]));
  c.setLineDash([9, 5]); c.strokeStyle = '#bfaf86'; c.lineWidth = 2; c.strokeRect(11, 12, 894, 182);
  washAnswer(c, ink);
  flatMark(c, 547, 104, .94, ink);
  label(c, garment.dry, 630, 128, 60, ink, 'Serif');
});

function sewnLabel(c, open) {
  // A loop of ivory tape turns out of the right side seam. The seam stays fixed.
  c.save(); c.translate(606, 688); c.rotate(-.16 - .23 * open);
  c.shadowColor = 'rgba(47,30,36,.27)'; c.shadowBlur = 8; c.shadowOffsetY = 8;
  const w = 29 + 213 * open;
  cloth(c, -w, -62, w, 122, cream);
  c.shadowColor = 'transparent';
  c.save(); c.beginPath(); c.rect(-w, -62, w, 122); c.clip();
  c.translate(-w, 0);
  if (open > 0) {
    label(c, 'Care label', 25, -20, 29, ink, 'Sans', 600);
    washMark(c, 61, 20, .57, ink); flatMark(c, 164, 20, .62, ink);
  }
  c.restore();
  c.setLineDash([5, 4]); c.lineWidth = 2; c.strokeStyle = '#9d9279';
  c.beginPath(); c.moveTo(-10, -60); c.lineTo(-10, 60); c.stroke();
  c.restore();
}

function threads(c, x, y, spread, time) {
  const reach = 450 * spread;
  if (reach < 1) return;
  c.save(); c.translate(x, y);
  for (let row = 0; row < 42; row++) {
    const yy = row * 4.78 + 6;
    const tail = (10 + 15 * Math.sin(row * 3.33) ** 2) * spread;
    const end = reach - tail;
    const wave = 5 * Math.sin(row * .55 + time * 1.4) * (1 - spread);
    c.beginPath(); c.moveTo(-2, yy);
    c.bezierCurveTo(.25 * end, yy + 1, .78 * end, yy + 1, end, yy + 3 + wave + 5 * Math.sin(row * 1.2));
    c.lineWidth = row % 3 === 0 ? 2.7 : 2; c.strokeStyle = row % 3 === 0 ? '#abc1c4' : '#f6f4e9'; c.stroke();
  }
  c.restore();
}

function reply(c, { open, turn, spread, sent, fresh, time }) {
  c.save(); c.translate(862, 526);
  threads(c, 464, 0, spread, time);
  c.save(); c.shadowColor = 'rgba(33,43,61,.26)'; c.shadowBlur = 10; c.shadowOffsetY = 8;
  const w = Math.max(1, 466 * open);
  const cosine = Math.cos(Math.PI * turn);
  const h = Math.max(2, 206 * Math.abs(cosine));
  const face = cosine < 0 ? questionPanel : washPanel;
  c.drawImage(face, 0, 0, w, 206, 0, (206 - h) / 2, w, h);
  c.restore();
  // The roll has a lit lip and throws a narrow shadow as the stored answer opens.
  if (open < 1) {
    const rim = Math.min(w, 57 * Math.sin(Math.PI * open) + 4);
    c.fillStyle = gradient(c, w - rim, 0, w, 0, [[0, '#263f8600'], [.46, '#9aaedc'], [.7, '#617ab4'], [1, '#1d356c']]);
    c.fillRect(w - rim, 0, rim, 206);
  }
  if (spread > .5 && fresh < 1) {
    c.save(); c.globalAlpha = ease((spread - .5) * 2) * (1 - fresh);
    const mid = 676;
    c.fillStyle = '#d8e6e7'; c.beginPath(); c.ellipse(mid, 102, 119, 43, 0, 0, 2 * Math.PI); c.fill();
    c.textAlign = 'center'; label(c, 'Drying?', mid, 119, 54, '#354857', 'Serif');
    c.restore();
  }
  if (fresh > 0) {
    // A fresh reply replaces the entire cached sentence, including its wash field.
    c.save(); c.beginPath(); c.rect(0, -12, 916 * fresh, 236); c.clip();
    c.shadowColor = 'rgba(33,43,61,.20)'; c.shadowBlur = 9; c.shadowOffsetY = 7;
    c.drawImage(freshPanel, 0, 0); c.restore();
  }
  if (sent > 0) {
    c.save(); c.globalAlpha = sent;
    stroke(c, 'M2 257 L16 270 L38 243', blue, 5);
    label(c, 'Sent from cache', 55, 271, 41, blue, 'Sans', 600); c.restore();
  }
  c.restore();
}

function scoreLine(c, visible) {
  if (!visible) return;
  c.save(); c.globalAlpha = visible;
  label(c, 'Example cosine similarity', 862, 812, 39, '#344853');
  label(c, 'Wash', 862, 882, 43, ink);
  label(c, score(shoppers[0]).toFixed(5), 989, 882, 48, blue, 'Mono');
  label(c, 'Wash + dry', 1290, 882, 43, ink);
  label(c, score(shoppers[1]).toFixed(5), 1543, 882, 48, red, 'Mono');
  c.restore();
}
function questionText(c, shopper, alpha, dy) {
  if (!alpha) return;
  c.save(); c.globalAlpha = alpha; c.translate(0, dy);
  const [first, second] = shopper.lines;
  label(c, first, 852, 219, 85, ink, 'Serif');
  label(c, second, 852, 312, 85, ink, 'Serif');
  c.restore();
}

function draw(c, clock) {
  const { index, elapsed } = clock;
  const open = index === 0 ? ease((elapsed + .15) / 1.3) : 1;
  const next = index === 3 ? ease(elapsed / .8) : Number(index > 3);
  const spread = index === 3 ? ease((elapsed - .55) / 1.3) : Number(index > 3);
  const tag = during(clock, 5, 'it turns to', 1.55);
  const closeup = during(clock, 5, 'When someone asks', 2.25);
  const fresh = during(clock, 6, 'Wash at', 1.45);
  const turn = during(clock, 1, 'Yesterday the question was', .85)
    * (1 - during(clock, 1, 'retrieves the reply', .85));
  const send = during(clock, 2, 'The shop can send', .65) * (1 - next);
  const numbers = during(clock, 4, 'In this example', .6) * (1 - tag);
  // Move in on the actual label before returning a fresh answer to the shopper.
  c.save();
  c.translate(606 - 137 * closeup, 688 - 139 * closeup);
  c.scale(1 + .81 * closeup, 1 + .81 * closeup);
  c.translate(-606, -688);
  c.drawImage(table(), 0, 0);
  sewnLabel(c, tag);
  c.restore();
  c.save(); c.globalAlpha = 1 - closeup;
  label(c, garment.product, 69, 104, 50, ink, 'Serif'); c.restore();
  label(c, 'Shopper asks', 859, 113, 42, '#3b5262', 'Sans', 600);
  questionText(c, shoppers[0], 1 - next, -15 * next);
  questionText(c, shoppers[1], next, 16 * (1 - next));
  const caption = fresh > .5 ? 'Reply from the care label' : turn > .5 ? 'Asked before' : 'Saved reply';
  label(c, caption, 862, 495, 42, fresh > .5 ? ink : blue, 'Sans', 600);
  reply(c, { open, turn, spread, sent: send, fresh, time: clock.seconds });
  scoreLine(c, numbers);
}

function check() {
  const [wash, both] = shoppers;
  assert.notEqual(wash.lines.join(' '), saved.question);
  assert.equal(score(wash).toFixed(5), '0.99918');
  assert.equal(score(both).toFixed(5), '0.99995');
  assert.ok(score(both) > score(wash));
  assert.deepEqual(uncovered(wash), []);
  assert.deepEqual(uncovered(both), ['dry']);
  assert.ok(canReuse(wash, garment));
  assert.equal(canReuse(both, garment), false);
  assert.equal(canReuse(wash, { ...garment, edition: 'revised' }), false);
  assert.ok(both.fields.every((field) => Object.hasOwn(garment, field)));
  assert.equal(saved.answer + ' ' + garment.dry, 'Wash at 30°C or cooler. Dry flat.');
}

export default { title: 'Does the Saved Reply Cover the Whole Question?', beats, draw, check };

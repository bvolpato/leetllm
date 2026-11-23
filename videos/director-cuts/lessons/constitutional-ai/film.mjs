import assert from 'node:assert/strict';
import { revisionDistribution } from '../../../films/constitutional-ai/construction.mjs';

const title = 'Constitutional AI: The Training Copy';
const beats = [
  {
    id: 'promise',
    say: 'Look what the assistant just promised. The engineer asked for a private timeline. What does the application say about this engineer’s access?',
    hold: 0.9,
  },
  {
    id: 'margin',
    say: 'There’s no grant. Our written principle says to check it before promising a read. Ask the model to critique its own draft. It catches the promise in those three words.',
    hold: 0.8,
  },
  {
    id: 'rewrite',
    say: 'With that critique in view, the model tries again. “Please request access through the support portal.” Which words should the model learn to say?',
    hold: 1.6,
  },
  {
    id: 'lift',
    say: 'Watch the margin as the sheets come apart. The critique goes with the draft. On the training copy, the engineer’s original question lines up with the revised answer.',
    hold: 1,
  },
  {
    id: 'word',
    say: 'Take the words “Please request.” Given the question and those first two words, what should the model predict next? There’s the target in the revision. It’s “access.”',
    hold: 0.9,
  },
  {
    id: 'impression',
    say: 'Imagine three possible next words. “Details” starts out ahead. The blue strip shows how likely “access” is. Take one step to reduce the prediction loss on that target.',
    hold: 1.1,
  },
  {
    id: 'weight',
    say: 'Now “access” leads. Its probability went from about twenty-one percent to fifty-five. In the supervised stage of Constitutional AI, each token of the revised answer supplies a target for updating the model’s weights.',
    hold: 2.7,
  },
];

const record = {
  request: 'Can I see the incident timeline?',
  draft: 'I’ll get the timeline for you.',
  critique: ['The promise assumes', 'permission.'],
  tokens: revisionDistribution(2, 0).words,
};
const example = { input: record.request, target: record.tokens };
const left = 144;
const sheetWidth = 1670;
const blue = '#24258b';
const ink = '#262235';
const muted = '#615965';
const red = '#ad321f';
const stock = '#fff5e2';
const gold = '#ffe07f';

const limit = n => Math.max(0, Math.min(1, n));
function ease(n) {
  const t = limit(n);
  return t * t * (3 - 2 * t);
}
function cue(clock, index, phrase, duration) {
  if (clock.index !== index) return Number(clock.index > index);
  return ease(clock.reveal(phrase, duration));
}
function font(ctx, size, family = 'Sans', style = '') {
  ctx.font = (style ? style + ' ' : '') + size + 'px "Lesson ' + family + '"';
}
function text(ctx, value, x, y, size, color = ink, family = 'Sans', style = '') {
  font(ctx, size, family, style);
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}
function rule(ctx, x1, y1, x2, y2, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}
function box(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function fading(ctx, amount, draw) {
  if (amount <= 0) return;
  ctx.save();
  ctx.globalAlpha *= amount;
  draw();
  ctx.restore();
}

// Fibers stay registered to their sheet as it moves.
let seed = 935;
function noise() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}
const fibers = Array.from({ length: 1300 }, () => [
  noise(), noise(), 1 + 6 * noise(), noise() * 1.6 - 0.8,
]);
function grain(ctx, width, height, color) {
  ctx.beginPath();
  for (const [u, v, dx, dy] of fibers) {
    ctx.moveTo(u * width, v * height);
    ctx.lineTo(u * width + dx, v * height + dy);
  }
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function table(ctx) {
  const light = ctx.createLinearGradient(0, 0, 1650, 1080);
  light.addColorStop(0, '#67627d');
  light.addColorStop(0.52, '#47445e');
  light.addColorStop(1, '#302e45');
  box(ctx, 0, 0, 1920, 1080, light);
  grain(ctx, 1920, 1080, 'rgba(255,248,231,0.09)');
}

// The two plies register along the same perforation. The transfer film lies between them.
function page(ctx, height, fill, shadow = true) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, sheetWidth, height);
  for (let y = 45; y < height - 22; y += 84) {
    ctx.moveTo(47, y);
    ctx.arc(36, y, 11, 0, Math.PI * 2);
  }
  if (shadow) {
    ctx.shadowColor = 'rgba(20,13,37,0.27)';
    ctx.shadowOffsetY = 9;
    ctx.shadowBlur = 11;
  }
  ctx.fillStyle = fill;
  ctx.fill('evenodd');
  ctx.restore();
  ctx.save();
  ctx.setLineDash([4, 9]);
  rule(ctx, 74, 0, 74, height, '#7d6a6c77', 1.8);
  ctx.restore();
}
function registration(ctx, x, y, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.stroke();
  rule(ctx, x - 17, y, x + 17, y, color, 1.4);
  rule(ctx, x, y - 17, x, y + 17, color, 1.4);
  ctx.restore();
}

function heading(ctx, copy) {
  const color = copy ? blue : muted;
  text(ctx, copy ? 'SUPERVISED TRAINING COPY' : 'MODEL REVIEW COPY', left, 73, 29, color, 'Mono');
  text(ctx, 'Case 17', 1420, 73, 31, color, 'Mono');
  rule(ctx, left, 98, 1550, 98, color);
  text(ctx, copy ? 'Original request' : 'Request', left, 156, 29, color);
  text(ctx, example.input, left, 233, 60, ink, 'Serif');
}
function grant(ctx) {
  const x = 1184;
  rule(ctx, x, 137, x, 242, red, 4);
  text(ctx, 'Incident grant', x + 26, 172, 31, muted);
  text(ctx, 'Absent', x + 24, 229, 53, red, 'Serif');
}

function revision(ctx, targetY, reveal, highlight, prefix, copy) {
  const words = example.target;
  const color = copy ? blue : ink;
  const count = Math.floor(limit(reveal) * words.length + 0.0001);
  text(ctx, copy ? 'Target answer' : 'Revised answer', left, targetY - 81, 30, copy ? blue : muted);
  const size = 72;
  font(ctx, size, 'Serif');
  const given = words.slice(0, 2).join(' ');
  const x = left + ctx.measureText(given + ' ').width;
  const w = ctx.measureText(words[2]).width;
  const y = targetY;
  if (count > 0) text(ctx, words.slice(0, Math.min(count, 2)).join(' '), left, y, size, color, 'Serif');
  if (count >= 3) {
    fading(ctx, highlight, () => box(ctx, x - 7, y - 66, w + 16, 84, blue));
    text(ctx, words[2], x, y, size, color, 'Serif');
    fading(ctx, highlight, () => text(ctx, words[2], x, y, size, '#fff8de', 'Serif'));
  }
  if (count > 3)
    text(ctx, words.slice(3, count).join(' '), left, y + 85, size, prefix > 0.5 ? '#706048' : color, 'Serif');

  fading(ctx, prefix, () => {
    rule(ctx, left + 1, y + 13, x - 28, y + 13, blue, 2.5);
  });
  fading(ctx, highlight, () => text(ctx, 'Next target', x, y - 81, 30, blue));
}

function proof(ctx, clock, height, extend) {
  page(ctx, height, stock);
  grain(ctx, sheetWidth, height, 'rgba(107,79,41,0.11)');
  heading(ctx, false);
  grant(ctx);
  text(ctx, 'Assistant draft', left, 318, 30, muted);
  const entered = clock.index > 0 ? 1 : ease(0.26 + clock.elapsed / 1.8);
  const typed = record.draft.slice(0, Math.ceil(record.draft.length * entered));
  text(ctx, typed, left, 419, 80, ink, 'Serif');
  if (entered < 1) {
    const x = left + ctx.measureText(typed).width + 6;
    box(ctx, x, 351, 5, 76, ink);
  }

  const principle = cue(clock, 1, 'Our written principle', 0.55);
  fading(ctx, principle, () => {
    rule(ctx, left, 479, left + 32, 479, blue, 5);
    text(ctx, 'Principle', left + 50, 490, 31, blue, 'Sans', 'bold');
    text(ctx, 'Check the grant before promising a read.', left + 210, 490, 40, blue, 'Serif');
  });
  const mark = cue(clock, 1, 'Ask the model', 1.3);
  font(ctx, 80, 'Serif');
  const x1 = left + ctx.measureText('I’ll ').width;
  const x2 = x1 + ctx.measureText('get the timeline').width;
  if (mark > 0) {
    ctx.beginPath();
    ctx.moveTo(x1, 438);
    ctx.quadraticCurveTo(x1 + (x2 - x1) * mark * 0.54, 430, x1 + (x2 - x1) * mark, 433);
    ctx.strokeStyle = red;
    ctx.lineWidth = 5;
    ctx.stroke();
  }
  const note = cue(clock, 1, 'critique its own draft', 0.7);
  fading(ctx, note, () => {
    ctx.beginPath();
    ctx.moveTo(x2 + 13, 436);
    ctx.bezierCurveTo(x2 + 205, 466, 1050, 465, 1148, 371);
    ctx.strokeStyle = red;
    ctx.lineWidth = 2.6;
    ctx.stroke();
    text(ctx, 'Model critique', 1170, 337, 30, red);
    text(ctx, record.critique[0], 1168, 390, 41, red, 'Serif', 'italic');
    text(ctx, record.critique[1], 1168, 439, 41, red, 'Serif', 'italic');
  });
  const write = cue(clock, 2, 'the model tries again', 1.8);
  if (extend > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(98, 524, 1510, Math.max(0, height - 541));
    ctx.clip();
    rule(ctx, left, 541, 1550, 541, '#aaa2a4', 1.5);
    revision(ctx, 696, write, 0, 0, false);
    ctx.restore();
  }
  registration(ctx, 1589, height - 38, '#8a7d79');
}

const percent = value => Math.round(value * 100) + '%';
function inkStrip(ctx, state, step) {
  const x = left;
  const y = 640;
  const width = 1388;
  const colors = [blue, '#a18cb8', '#edd2c3'];
  text(ctx, 'Next word probability', x, y - 26, 39, ink);
  let start = x;
  state.choices.forEach((word, i) => {
    const w = width * state.probabilities[i];
    box(ctx, start, y, w, 138, colors[i]);
    const color = i === 0 ? '#fff9e7' : '#261f39';
    text(ctx, word, start + 19, y + 48, 42, color, 'Sans', 'bold');
    text(ctx, percent(state.probabilities[i]), start + 17, y + 117, 62, color, 'Mono');
    if (i > 0) rule(ctx, start, y, start, y + 138, gold, 4);
    start += w;
  });
  const initial = x + width * state.before[0];
  fading(ctx, step, () => {
    rule(ctx, initial, y + 109, initial, y + 158, '#fff6d9', 3);
    rule(ctx, initial, y + 140, initial, y + 158, blue, 3);
    text(ctx, percent(state.before[0]) + ' before', initial - 95, y + 192, 34, blue, 'Mono');
  });
}

function trainingCopy(ctx, clock, height) {
  page(ctx, height, gold);
  grain(ctx, sheetWidth, height, 'rgba(125,88,39,0.12)');
  heading(ctx, true);
  const focus = cue(clock, 3, 'the engineer’s original question', 1.4);
  const prefix = cue(clock, 4, 'given the question', 0.9);
  const highlight = cue(clock, 4, 'what should the model', 0.6);
  revision(ctx, 696 - 276 * focus, 1, highlight, prefix, true);
  const strip = cue(clock, 5, 'Imagine three possible next words', 0.8);
  const step = cue(clock, 5, 'Take one step', 1.65);
  fading(ctx, strip, () => inkStrip(ctx, revisionDistribution(2, step), step));
  registration(ctx, 1589, height - 38, '#8d671b');
}

// An oblique fold removes the draft and its margin first. Both copied fields
// stay in register until the camera can concentrate on the target word.
function turningPage(ctx, clock, h, extend, lift) {
  if (lift >= 1) return;
  const edge = sheetWidth + 340 - lift * (sheetWidth + 680);
  const skew = 0.27;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-100, -60);
  ctx.lineTo(edge, -60);
  ctx.lineTo(edge - skew * (h + 60), h + 60);
  ctx.lineTo(-100, h + 60);
  ctx.closePath();
  ctx.clip();
  ctx.save();
  ctx.translate(7, 10);
  page(ctx, h, '#302865', false);
  ctx.restore();
  proof(ctx, clock, h, extend);
  ctx.restore();
  if (lift <= 0) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, sheetWidth + 8, h + 12);
  ctx.clip();
  ctx.transform(1, 0, -skew, 1, edge - 16, 0);
  const band = ctx.createLinearGradient(-88, 0, 41, 0);
  band.addColorStop(0, 'rgba(80,58,79,0)');
  band.addColorStop(0.23, '#d2bac0');
  band.addColorStop(0.59, '#fff7dd');
  band.addColorStop(0.76, '#5960a4');
  band.addColorStop(0.80, '#30275e');
  band.addColorStop(0.82, 'rgba(61,42,65,0.32)');
  band.addColorStop(1, 'rgba(81,64,47,0)');
  box(ctx, -88, -12, 129, h + 32, band);
  ctx.restore();
}

function draw(ctx, clock) {
  table(ctx);
  const extend = cue(clock, 2, 'With that critique', 1.25);
  const lift = cue(clock, 3, 'Watch the margin', 3.2);
  const height = 550 + 335 * extend;
  ctx.save();
  const close = cue(clock, 5, 'Imagine three possible next words', 1.4);
  ctx.translate(120 - 77 * close, 246 - 141 * extend - 118 * close);
  ctx.scale(1 + 0.09 * close, 1 + 0.09 * close);
  ctx.rotate(-0.018 * (1 - close));
  // A little of the yellow ply remains visible under the top sheet.
  ctx.save();
  ctx.translate(13 * (1 - lift), 26 * (1 - lift));
  if (lift > 0) trainingCopy(ctx, clock, height);
  else page(ctx, height, gold);
  ctx.restore();
  turningPage(ctx, clock, height, extend, lift);
  ctx.restore();
}

function check() {
  assert.deepEqual(Object.keys(example), ['input', 'target']);
  assert.equal(example.input, record.request);
  const answer = example.target.join(' ');
  assert.equal(answer, 'Please request access through the support portal.');
  assert.ok(!answer.includes(record.draft) && !answer.includes(record.critique.join(' ')));
  const before = revisionDistribution(2, 0);
  const after = revisionDistribution(2, 1);
  assert.equal(after.prefix.join(' '), 'Please request');
  assert.equal(after.choices[0], example.target[2]);
  for (const state of [before, after]) {
    assert.ok(Math.abs(state.probabilities.reduce((a, b) => a + b, 0) - 1) < 1e-10);
  }
  assert.equal(percent(before.probabilities[0]), '21%');
  assert.equal(percent(after.probabilities[0]), '55%');
  assert.equal(before.choices[before.probabilities.indexOf(Math.max(...before.probabilities))], 'details');
  assert.equal(after.choices[after.probabilities.indexOf(Math.max(...after.probabilities))], 'access');
  assert.ok(after.loss < before.loss);
}

export default { title, beats, draw, check };

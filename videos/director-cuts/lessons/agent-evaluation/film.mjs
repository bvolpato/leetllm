import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { garden, runHolds } from '../../../films/agent-evaluation/circulation.mjs';

const request = garden;
const firstKey = 'op-41';
const empty = runHolds(request, []);
const duplicate = runHolds(request, [firstKey, 'op-42']);
const replay = runHolds(request, [firstKey, firstKey]);
const serial = id => id.slice(id.lastIndexOf('-') + 1);

const beats = [
  {
    id: 'reserved',
    say: '“Reserved.” That’s what Mira sees on her phone. She asked the agent for one hold on The Night Garden. Would you give this run a pass?',
    hold: 1.45,
  },
  {
    id: 'open-the-file',
    say: 'Let’s read her account directly from the library, after the run. Each slip stands for one saved hold. Count the ones with Mira’s name and book B nine.',
    hold: 1.7,
  },
  {
    id: 'the-extra-hold',
    say: 'Look at the hold numbers. Forty-one and forty-two. Both belong to Mira. That’s one too many. Which call created the extra hold?',
    hold: 1.1,
  },
  {
    id: 'follow-forty-two',
    say: 'The evaluator recorded both calls. The first call placed a hold, then its reply got lost. Look at the retry. It carried a new request key. The library created hold forty-two.',
    hold: 1.0,
  },
  {
    id: 'reset-the-account',
    say: 'Let’s reset Mira’s test account. Same book, same request. Once again the library saves the first hold, and the reply goes missing.',
    hold: 0.75,
  },
  {
    id: 'reuse-forty-one',
    say: 'This time the agent retries with the original key. This library recognizes the request and sends back its saved confirmation. What will a fresh read of Mira’s account show?',
    hold: 1.75,
  },
  {
    id: 'count-again',
    say: 'Pull the slips again. There’s forty-one. That’s the whole stack. Two calls left exactly one hold for Mira on book B nine. This run passes the reservation check.',
    hold: 3.3,
  },
];

const ink = '#292740';
const night = '#292b56';
const ivory = '#ffedca';
const iris = '#a9a7e1';
const coral = '#f59376';
const clamp = x => Math.max(0, Math.min(1, x));
function ease(x) {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
}

function rectangle(ctx, x, y, w, h, fill, radius = 0) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
}

function line(ctx, x1, y1, x2, y2, color, width) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function letter(ctx, value, x, y, size, face = 'Sans', color = ink, align = 'left', weight = 400) {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y);
}

function ellipse(ctx, x, y, rx, ry, rotation, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  ctx.fill();
}

function shadow(ctx, x, y, blur, color, paint) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowOffsetX = x;
  ctx.shadowOffsetY = y;
  ctx.shadowBlur = blur;
  paint();
  ctx.restore();
}

function seeded(seed) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

// The jacket is a two-ink botanical print. All its paths are in book coordinates.
function leaf(ctx, x, y, length, width, angle, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-width, -length * 0.3, -width * 0.65, -length * 0.75, 0, -length);
  ctx.bezierCurveTo(width, -length * 0.66, width, -length * 0.25, 0, 0);
  ctx.fillStyle = color;
  ctx.fill();
  line(ctx, 0, -5, 0, -length * 0.78, night, 2.5);
  ctx.restore();
}

function gardenSprig(ctx, x, y, scale, rotation, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(17, -82, -18, -132, 8, -234);
  ctx.lineWidth = 5;
  ctx.strokeStyle = color;
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const stem = 4 * Math.sin(i * 1.8);
    leaf(ctx, stem, -i * 39 - 12, 85 - i * 7, 19 - i, -0.96 + 0.06 * i, color);
    leaf(ctx, stem, -i * 39 - 23, 72 - i * 6, 17 - i, 0.90 - 0.05 * i, color);
  }
  leaf(ctx, 5, -202, 53, 13, 0.18, color);
  ctx.restore();
}

function moth(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.12);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.fillStyle = coral;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.bezierCurveTo(18, -37, 55, -57, 109, -61);
    ctx.bezierCurveTo(103, -28, 83, 1, 52, 12);
    ctx.bezierCurveTo(47, 34, 50, 51, 26, 68);
    ctx.bezierCurveTo(27, 38, 7, 26, 0, 12);
    ctx.fill();
    line(ctx, 8, 2, 94, -50, night, 3);
    ellipse(ctx, 58, -23, 12, 9, -0.6, ivory);
    ellipse(ctx, 58, -23, 5, 5, 0, night);
    ellipse(ctx, 28, 19, 9, 5, -0.6, iris);
    line(ctx, 2, -12, 14, -32, ivory, 3);
    ctx.restore();
  }
  ellipse(ctx, 0, 3, 7, 29, 0, ivory);
  ctx.restore();
}

function jacket(ctx) {
  const w = 678, h = 829;
  // Page edges and boards cast a single shadow onto the reading table.
  shadow(ctx, 12, 21, 24, '#492d4260', () => rectangle(ctx, 0, 5, w + 9, h + 12, '#292436', 9));
  rectangle(ctx, 8, 12, w + 1, h + 1, '#d1ae91', 7);
  for (let i = 0; i < 5; i++) line(ctx, 30, h + 2 + i * 2, w - 2, h + 2 + i * 2, '#a48e80', 1);
  rectangle(ctx, 0, 0, w, h, night, 7);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, 7);
  ctx.clip();
  for (let y = 3; y < h; y += 4) line(ctx, 0, y, w, y, '#eee6ff0b', 1);
  for (let x = 1; x < w; x += 5) line(ctx, x, 0, x, h, '#0b092314', 1);
  const hinge = ctx.createLinearGradient(0, 0, 49, 0);
  hinge.addColorStop(0, '#1e1c38');
  hinge.addColorStop(0.51, '#3d3d65');
  hinge.addColorStop(0.78, '#21223e');
  hinge.addColorStop(1, night);
  rectangle(ctx, 0, 0, 49, h, hinge);
  ctx.strokeStyle = '#ada7c899';
  ctx.lineWidth = 2;
  ctx.strokeRect(67, 31, 579, 763);

  const stars = seeded(47);
  for (let i = 0; i < 94; i++) {
    const x = 84 + stars() * 542, y = 328 + stars() * 437;
    ellipse(ctx, x, y, 1 + stars() * 2.1, 1.5, 0, '#e1d5af');
  }
  // A moon cut from the same field of ink as the night sky.
  ctx.beginPath();
  ctx.arc(407, 427, 91, -1.2, 1.85);
  ctx.bezierCurveTo(407, 490, 463, 421, 440, 342);
  ctx.fillStyle = ivory;
  ctx.fill();
  for (const [x, y, s, a, c] of [
    [115, 810, 1.12, -0.22, iris], [207, 820, 0.79, -0.09, coral],
    [269, 819, 1.13, -0.56, iris], [361, 828, 0.62, 0.04, coral],
    [410, 833, 0.86, 0.16, iris], [496, 826, 1.04, 0.42, iris],
    [580, 830, 0.75, -0.04, coral], [635, 812, 1.32, 0.23, iris],
  ]) gardenSprig(ctx, x, y, s, a, c);
  moth(ctx, 302, 431);

  letter(ctx, 'The Night', 355, 169, 99, 'Serif', ivory, 'center');
  letter(ctx, 'Garden', 355, 269, 120, 'Serif', ivory, 'center');
  ctx.restore();
  rectangle(ctx, 0, 696, 126, 73, '#e8ddc6', 2);
  letter(ctx, request.book, 63, 749, 48, 'Mono', ink, 'center', 600);
}

let table;
function readingTable() {
  if (table) return table;
  table = createCanvas(1920, 1080);
  const ctx = table.getContext('2d');
  const light = ctx.createLinearGradient(120, 0, 1770, 1080);
  light.addColorStop(0, '#f0d5bd');
  light.addColorStop(0.52, '#e5c2b1');
  light.addColorStop(1, '#cfa89f');
  rectangle(ctx, 0, 0, 1920, 1080, light);
  const fleck = seeded(878);
  for (let i = 0; i < 27000; i++) {
    const x = fleck() * 1920, y = fleck() * 1080;
    ctx.fillStyle = i % 3 ? '#6d415515' : '#fff3e353';
    ctx.fillRect(x, y, 1 + fleck() * 4, 0.8 + fleck() * 1.6);
  }
  ctx.translate(174, 95);
  ctx.rotate(-0.044);
  jacket(ctx);
  return table;
}

function phone(ctx, t, entry) {
  ctx.save();
  ctx.translate(1072 + 940 * t, 100 - 125 * t);
  ctx.rotate(0.042 + 0.13 * t);
  shadow(ctx, 13, 21, 29, '#382b4750', () => rectangle(ctx, 0, 0, 526, 803, '#3f3e53', 61));
  rectangle(ctx, 4, 3, 516, 790, '#222335', 58);
  rectangle(ctx, 16, 15, 491, 765, '#f8f1e5', 47);
  rectangle(ctx, 207, 36, 106, 20, '#262637', 13);
  letter(ctx, 'Library agent', 259, 144, 43, 'Sans', ink, 'center', 600);
  line(ctx, 34, 184, 486, 184, '#d4c9c6', 2);
  letter(ctx, request.reader, 449, 270, 31, 'Sans', '#6f626d', 'right');
  rectangle(ctx, 91, 291, 370, 132, '#e0daee', 28);
  letter(ctx, 'One hold, please.', 119, 349, 38);
  letter(ctx, request.title, 119, 395, 32, 'Serif');
  ctx.globalAlpha = entry;
  const y = 501 + 35 * (1 - entry);
  rectangle(ctx, 48, y, 365, 115, night, 32);
  ctx.fillStyle = night;
  ctx.beginPath();
  ctx.moveTo(66, y + 83);
  ctx.quadraticCurveTo(63, y + 103, 41, y + 116);
  ctx.lineTo(100, y + 105);
  ctx.fill();
  letter(ctx, 'Reserved.', 229, y + 78, 65, 'Serif', ivory, 'center');
  ctx.globalAlpha = 1;
  rectangle(ctx, 177, 744, 167, 8, '#6f6570', 5);
  ctx.restore();
}

// The card is a record from the independent read. Its header stays visible
// when another card comes to the front of the pocket.
function underline(ctx, x, y, length, progress) {
  if (!progress) return;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + length * progress / 2, y - progress * 3, x + length * progress, y + progress);
  ctx.strokeStyle = '#7a4b82';
  ctx.lineCap = 'round';
  ctx.lineWidth = 5;
  ctx.stroke();
}

function holdSlip(ctx, row, lift, index, mark) {
  if (!lift) return;
  ctx.save();
  ctx.translate(104 + 9 * index, 563 - (index ? 253 : 449) * lift);
  ctx.rotate(index ? 0.014 * lift : -0.012 * lift);
  shadow(ctx, 2, 6, 9, '#54454d55', () => rectangle(ctx, 0, 0, 602, 505, index ? '#f6dfac' : '#fff0d3', 8));
  rectangle(ctx, 0, 16, 602, 7, '#61577c');
  letter(ctx, 'Hold ' + serial(row.id), 31, 95, 67, 'Serif');
  underline(ctx, 33, 109, ctx.measureText('Hold ' + serial(row.id)).width, mark);
  letter(ctx, row.reader + '   /   ' + row.book, 36, 163, 47, 'Mono', '#48415b');
  for (let y = 182; y < 495; y += 44) line(ctx, 27, y, 570, y, '#b3a9ac8a', 2);
  ctx.restore();
}

function pocket(ctx) {
  ctx.beginPath();
  ctx.moveTo(52, 534);
  ctx.lineTo(203, 534);
  ctx.bezierCurveTo(258, 534, 275, 572, 329, 572);
  ctx.lineTo(458, 572);
  ctx.bezierCurveTo(511, 572, 519, 534, 574, 534);
  ctx.lineTo(742, 534);
  ctx.lineTo(742, 804);
  ctx.quadraticCurveTo(741, 813, 730, 813);
  ctx.lineTo(62, 813);
  ctx.quadraticCurveTo(52, 812, 52, 800);
  ctx.closePath();
  ctx.fillStyle = '#e57e62';
  ctx.fill();
  ctx.save();
  ctx.clip();
  const shade = ctx.createLinearGradient(50, 0, 745, 0);
  shade.addColorStop(0, '#92513b44');
  shade.addColorStop(0.11, '#f48e6b00');
  shade.addColorStop(0.86, '#f48e6b00');
  shade.addColorStop(1, '#93524540');
  rectangle(ctx, 0, 520, 800, 320, shade);
  for (let y = 536; y < 814; y += 5) line(ctx, 52, y, 742, y, '#ffede00f', 1);
  ctx.strokeStyle = '#ab5a4d';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 7]);
  ctx.strokeRect(65, 514, 664, 286);
  ctx.restore();
}

function file(ctx, state) {
  if (state.file <= 0) return;
  ctx.save();
  ctx.translate(937, 95 + 1020 * (1 - state.file));
  ctx.rotate(0.023);
  shadow(ctx, 10, 17, 25, '#4b334b50', () => rectangle(ctx, 22, 26, 755, 812, '#b6a09c', 12));
  rectangle(ctx, 18, 18, 755, 815, '#d2b99f', 10);
  rectangle(ctx, 13, 9, 756, 818, '#efdbb7', 8);
  letter(ctx, 'Library account', 68, 82, 47, 'Serif');
  if (state.version) letter(ctx, 'v' + state.version, 721, 78, 29, 'Mono', '#69606a', 'right');
  ctx.save();
  ctx.beginPath();
  ctx.rect(42, 97, 705, 681);
  ctx.clip();
  state.run.read.ids.forEach((id, i) => {
    const row = state.run.account.holds.find(item => item.id === id);
    holdSlip(ctx, row, state.lifts[i], i, i === 1 ? state.match : 0);
  });
  ctx.restore();
  pocket(ctx);
  letter(ctx, 'Mira’s holds', 394, 683, 76, 'Serif', ink, 'center');
  if (state.note) {
    ctx.save();
    ctx.globalAlpha = state.noteOpacity;
    letter(ctx, state.note, 394, 755, 41, 'Sans', ink, 'center', 600);
    ctx.restore();
  }
  ctx.restore();
}

function logStrip(ctx, state) {
  if (state.log <= 0) return;
  ctx.save();
  ctx.translate(117, 608 + 590 * (1 - state.log));
  ctx.rotate(-0.022);
  shadow(ctx, 4, 8, 15, '#392b4757', () => rectangle(ctx, 0, 0, 735, 321, '#ece7f5', 3));
  for (let x = 22; x < 730; x += 27) {
    ellipse(ctx, x, 13, 4, 4, 0, '#928b9b');
    ellipse(ctx, x, 308, 4, 4, 0, '#928b9b');
  }
  letter(ctx, 'Tool calls', 34, 82, 52, 'Serif');
  letter(ctx, 'Call', 35, 143, 32);
  letter(ctx, 'Key', 312, 143, 32);
  letter(ctx, 'Reply', 437, 143, 32);
  line(ctx, 32, 159, 697, 159, '#8e859c', 2);
  const rows = state.run.attempts;
  for (let i = 0; i < 2; i++) {
    const opacity = state.logRows[i];
    if (!opacity || !rows[i]) continue;
    const { receipt } = rows[i];
    const y = 213 + 65 * i;
    ctx.save();
    ctx.globalAlpha = opacity;
    if (i === 1) rectangle(ctx, 300, y - 43, 84, 52, '#c7b6e1', 4);
    letter(ctx, i ? 'Retry' : 'Place hold', 35, y, 41);
    letter(ctx, serial(receipt.operation), 311, y, 43, 'Mono');
    ctx.globalAlpha = opacity * (i ? state.reply : state.lost);
    const reply = i ? 'Hold ' + serial(receipt.hold) : 'Lost';
    letter(ctx, reply, 437, y, 41);
    if (i) underline(ctx, 437, y + 9, ctx.measureText(reply).width, state.match);
    ctx.restore();
  }
  ctx.restore();
}

function frameState(clock) {
  const { index, elapsed } = clock;
  const cue = (words, span = 0.65) => ease(clock.reveal(words, span));
  const open = index === 0 ? 0 : index === 1 ? ease(elapsed / 1.15) : 1;
  const state = {
    file: open, phone: open, run: duplicate, lifts: [0, 0], version: null,
    log: 0, logRows: [0, 0], lost: 1, reply: 1, match: 0, note: '', noteOpacity: 1,
  };

  if (index === 1) {
    const pull = clock.reveal('Each slip', 2.0);
    state.lifts = [ease(2 * pull), ease(2 * pull - 1)];
    if (pull > 0) state.version = duplicate.read.version;
  }
  if (index === 2 || index === 3) {
    state.lifts = [1, 1];
    state.version = duplicate.read.version;
    state.note = verdict(duplicate);
    state.noteOpacity = index === 2 ? cue('one too many') : 1;
    state.match = index === 2 ? cue('Which call') : 1;
  }
  if (index === 3) {
    state.log = ease(elapsed / 1.05);
    state.logRows = [cue('The first call'), cue('Look at the retry')];
    state.lost = cue('its reply got lost');
    state.reply = cue('a new request key');
  }
  if (index === 4) {
    const reset = ease(elapsed / 1.15);
    if (reset < 1) {
      state.lifts = [1 - reset, 1 - reset];
      state.log = 1 - reset;
      state.logRows = [1, 1];
      state.match = 1 - reset;
      return state;
    }
    const first = cue('Once again');
    state.run = replay;
    state.log = first;
    state.logRows = [first, 0];
    state.lost = cue('the reply goes missing');
    state.note = first ? 'Awaiting account read' : 'Empty at start';
    if (!first) state.version = empty.account.version;
  }
  if (index >= 5) {
    state.run = replay;
    state.log = 1;
    state.logRows = [1, index === 5 ? cue('the agent retries') : 1];
    state.reply = index === 5 ? cue('This library recognizes') : 1;
    state.note = 'Awaiting account read';
    if (index === 6) {
      const pull = ease(elapsed / 1.35);
      state.lifts = [pull];
      state.version = replay.read.version;
      state.note = verdict(replay);
      state.noteOpacity = cue('This run passes');
    }
  }
  return state;
}

function draw(ctx, clock) {
  ctx.save();
  // Move in with the account reader. Widen when the evaluator opens the log.
  const inspect = clock.index === 1 ? ease(clock.elapsed / 2) : clock.index === 2 ? 1
    : clock.index === 3 ? 1 - ease(clock.elapsed / 1.2) : 0;
  const zoom = 1 + 0.14 * inspect;
  ctx.translate(1390 * (1 - zoom), 470 * (1 - zoom));
  ctx.scale(zoom, zoom);
  ctx.drawImage(readingTable(), 0, 0);
  const state = frameState(clock);
  file(ctx, state);
  logStrip(ctx, state);
  if (state.phone < 1) {
    const arrival = clock.index === 0 ? ease((clock.elapsed + 0.04) / 0.42) : 1;
    phone(ctx, state.phone, arrival);
  }
  ctx.restore();
}

function verdict(run) {
  const { count } = run.read;
  return count + (count === 1 ? ' hold' : ' holds') + '  ·  ' + (run.passed ? 'Pass' : 'Fail');
}

function check() {
  assert.equal(new Set(beats.map(beat => beat.id)).size, beats.length);
  assert.equal(empty.read.count, 0);
  for (const run of [duplicate, replay]) {
    assert.equal(run.attempts.length, 2);
    assert.equal(run.read.reader, request.reader);
    assert.equal(run.read.book, request.book);
    assert.equal(run.read.version, run.account.version);
    assert.equal(run.attempts[0].receipt.version, empty.read.version + 1);
  }
  assert.deepEqual(duplicate.read.ids, ['hold-41', 'hold-42']);
  assert.equal(duplicate.read.count, 2);
  assert.equal(duplicate.attempts[1].replay, false);
  assert.equal(duplicate.passed, false);
  assert.deepEqual(replay.read.ids, ['hold-41']);
  assert.equal(replay.read.count, 1);
  assert.equal(replay.attempts[1].replay, true);
  assert.deepEqual(replay.attempts[1].receipt, replay.attempts[0].receipt);
  assert.equal(replay.passed, true);
}

export default { title: 'How many holds did the agent leave?', beats, draw, check };

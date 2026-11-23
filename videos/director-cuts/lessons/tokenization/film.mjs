import assert from 'node:assert/strict';
import { FIRST_VOCAB, TRAP_VOCAB, wordpiece } from '../../../films/tokenization/model.mjs';

const word = 'rainbow';
const runs = [FIRST_VOCAB, TRAP_VOCAB].map((vocabulary) => wordpiece(word, vocabulary));
const [[rain, bow], [rainb]] = runs.map((run) => run.attempts.filter((a) => a.found));

const beats = [
  {
    id: 'the-join',
    say: 'Follow the blue stripe. When the ends meet, read across the join. Rain, then bow. Together they spell rainbow.',
    hold: 1.2,
  },
  {
    id: 'the-pieces',
    say: 'Our WordPiece vocabulary has two entries. The hash marks mean bow can follow another piece inside a word. Both tokens reach the model.',
    hold: 0.9,
  },
  {
    id: 'one-more-piece',
    say: 'Keep both entries and add one more. It spells rain with a B on the end. Where does the next piece start if we use it?',
    hold: 1.8,
  },
  {
    id: 'longest-fit',
    say: 'Start at the R. BERT’s WordPiece tokenizer takes the longest piece in its vocabulary that matches here. This time the B goes with rain.',
    hold: 0.9,
  },
  {
    id: 'the-overlap',
    say: 'Line up the old ending. Its B lands on a letter we’ve already used. The next match has to start one letter farther along.',
    hold: 1.2,
  },
  {
    id: 'stranded',
    say: 'Look at the O. Is there a continuation for O W? How about O alone? Neither is in the vocabulary. WordPiece won’t go back to try rain.',
    hold: 1.25,
  },
  {
    id: 'whole-word',
    say: 'The model gets one unknown token. Follow the bracket. It covers the whole word, including the five letters on the painted piece.',
    hold: 2.6,
  },
];

function check() {
  assert.deepEqual(FIRST_VOCAB, ['rain', '##bow']);
  assert.deepEqual(TRAP_VOCAB, [...FIRST_VOCAB, 'rainb']);
  assert.deepEqual(runs[0].pieces, ['rain', '##bow']);
  assert.equal(runs[0].pieces.join('').replace('##', ''), word);
  assert.deepEqual([rain.start, rain.end, bow.start, bow.end], [0, 4, 4, 7]);
  assert.deepEqual([rainb.start, rainb.end, runs[1].stuckAt], [0, 5, 5]);
  assert.equal(word.slice(bow.start, rainb.end), 'b');
  assert.deepEqual(runs[1].attempts.filter((a) => a.start === rainb.end).map((a) => a.candidate), ['##ow', '##o']);
  assert.deepEqual(runs[1].pieces, ['[UNK]']);
}

const ink = '#30253b';
const muted = '#695344';
const berry = '#962e4d';
const left = 295;
const cell = 190;
const center = 960;
const radius = cell * word.length / 2;
const archY = 596;
const rise = 315;
const bottom = 721;
const xAt = (i) => left + i * cell;
const letterX = (i) => xAt(i + 0.5);
const clamp = (n) => Math.max(0, Math.min(1, n));
const ease = (n) => n * n * (3 - 2 * n);

function label(ctx, value, x, y, size, family, color, align = 'left', weight = 400) {
  ctx.font = `${weight} ${size}px "Lesson ${family}"`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function stroke(ctx, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function rect(ctx, x, y, w, h, radius, color) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = color;
  ctx.fill();
}

function board(ctx) {
  const ground = ctx.createLinearGradient(0, 0, 1600, 1080);
  ground.addColorStop(0, '#b9a3c4');
  ground.addColorStop(1, '#876c89');
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, 1920, 1080);
  // The end grain stays visible below the face of the beech puzzle board.
  ctx.save();
  ctx.shadowColor = '#4e375a80';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 19;
  rect(ctx, 74, 66, 1772, 908, 62, '#9d6d52');
  ctx.restore();
  for (let ply = 0; ply < 3; ply++) {
    rect(ctx, 74, 60 - ply * 4, 1772, 906, 62, ['#cfa379', '#ad7e62', '#e1bd97'][ply]);
  }
  ctx.beginPath();
  ctx.roundRect(74, 48, 1772, 904, 62);
  const wood = ctx.createLinearGradient(270, 50, 1250, 960);
  wood.addColorStop(0, '#fff2d9');
  wood.addColorStop(0.6, '#f7e2c1');
  wood.addColorStop(1, '#efd2ab');
  ctx.fillStyle = wood;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // Long shallow grain lines stop and turn at different points in the veneer.
  for (let i = 0; i < 67; i++) {
    const y = 28 + i * 14.6;
    const start = -80 + (i * 379) % 1560;
    const width = 260 + (i * 853) % 1120;
    ctx.beginPath();
    ctx.moveTo(start, y);
    ctx.bezierCurveTo(start + 0.31 * width, y - 14, start + 0.67 * width, y + 16, start + width, y - 3);
    stroke(ctx, i % 4 ? '#a96f3a13' : '#fffdf13c', i % 3 ? 1.6 : 3.1);
  }
  ctx.restore();
}

function vocabulary(ctx, newPiece, markHashes) {
  label(ctx, 'WordPiece vocabulary', 220, 174, 50, 'Serif', ink);
  const positions = [835, 1110, 1445];
  for (const [i, name] of TRAP_VOCAB.entries()) {
    ctx.save();
    if (i === 2) {
      ctx.globalAlpha = newPiece;
      ctx.translate(0, -22 * (1 - newPiece));
    }
    label(ctx, name, positions[i], 175, 61, 'Mono', i === 2 ? berry : ink, 'center');
    if (i === 1 && markHashes > 0) {
      const start = positions[1] - ctx.measureText(name).width / 2;
      ctx.beginPath();
      ctx.moveTo(start, 188);
      ctx.quadraticCurveTo(start + 25, 193, start + ctx.measureText('##').width * markHashes, 189);
      stroke(ctx, berry, 5);
    }
    ctx.restore();
  }
}

// Each range has its own piece of the same arch. A convex tab on its right
// follows exactly the same curve as the socket in the next piece on its left.
function edge(ctx, i, down) {
  const x = xAt(i);
  if (i === 0 || i === word.length) {
    ctx.lineTo(x, down ? bottom : archY);
    return;
  }
  if (down) {
    ctx.lineTo(x, 542);
    ctx.bezierCurveTo(x, 569, x + 7, 562, x + 18, 559);
    ctx.bezierCurveTo(x + 54, 548, x + 54, 621, x + 18, 610);
    ctx.bezierCurveTo(x + 7, 607, x, 600, x, 628);
    ctx.lineTo(x, bottom);
  } else {
    ctx.lineTo(x, 628);
    ctx.bezierCurveTo(x, 600, x + 7, 607, x + 18, 610);
    ctx.bezierCurveTo(x + 54, 621, x + 54, 548, x + 18, 559);
    ctx.bezierCurveTo(x + 7, 562, x, 569, x, 542);
    ctx.lineTo(x, archY - rise * Math.sqrt(1 - ((x - center) / radius) ** 2));
  }
}

function outline(ctx, start, end) {
  const angle = (i) => Math.PI * 2 - Math.acos((xAt(i) - center) / radius);
  ctx.beginPath();
  ctx.ellipse(center, archY, radius, rise, 0, angle(start), angle(end));
  edge(ctx, end, true);
  ctx.lineTo(xAt(start), bottom);
  edge(ctx, start, false);
  ctx.closePath();
}

const bandColors = ['#bf4b59', '#e7864e', '#f0bc53', '#5da69e', '#437fa7', '#565488'];
function rainbowPaint(ctx, engraved) {
  ctx.fillStyle = engraved ? '#d1b895' : '#ffebbb';
  ctx.fillRect(left - 1, archY - rise - 2, radius * 2 + 2, bottom - archY + rise + 5);
  for (let i = 0; i <= bandColors.length; i++) {
    ctx.beginPath();
    ctx.ellipse(center, archY, radius - i * 60, rise - i * 34, 0, Math.PI, 2 * Math.PI);
    if (engraved) {
      stroke(ctx, '#ac8d6a', 3);
    } else {
      ctx.fillStyle = bandColors[i] ?? '#ffebbb';
      ctx.fill();
    }
  }
  if (!engraved) {
    // Two little swallows are part of the painted landscape. They move with the wood.
    for (const [x, y, s] of [[905, 557, 1], [995, 539, 0.68]]) {
      ctx.beginPath();
      ctx.moveTo(x - 25 * s, y - 9 * s);
      ctx.quadraticCurveTo(x - 7 * s, y - 10 * s, x, y);
      ctx.quadraticCurveTo(x + 4 * s, y - 13 * s, x + 24 * s, y - 17 * s);
      ctx.quadraticCurveTo(x + 10 * s, y - 6 * s, x, y + 6 * s);
      ctx.closePath();
      ctx.fillStyle = '#5b4458';
      ctx.fill();
    }
    for (let i = 0; i < 122; i++) {
      const x = left + (i * 293) % (radius * 2);
      const y = archY - rise + (i * 157) % (rise + 110);
      ctx.fillStyle = i % 2 ? '#fff5cf55' : '#70445720';
      ctx.fillRect(x, y, 3 + i % 6, 2);
    }
  }
  for (const [i, ch] of [...word].entries()) {
    label(ctx, ch, letterX(i), 690, 134, 'Serif', engraved ? '#705c50' : ink, 'center');
  }
}

function socket(ctx, start, end) {
  outline(ctx, start, end);
  ctx.fillStyle = '#7b6655';
  ctx.fill();
  ctx.save();
  ctx.clip();
  rainbowPaint(ctx, true);
  outline(ctx, start, end);
  stroke(ctx, '#8a7059', 12);
  ctx.restore();
}

function piece(ctx, match, { dx = 0, dy = 0, rotation = 0, opacity = 1, altitude = 0 } = {}) {
  if (opacity <= 0) return;
  const { start, end } = match;
  const pivot = (xAt(start) + xAt(end)) / 2;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(pivot + dx, archY + dy);
  ctx.rotate(rotation);
  ctx.translate(-pivot, -archY);
  ctx.save();
  ctx.translate(0, 6);
  ctx.shadowColor = '#46324c66';
  ctx.shadowBlur = 3 + altitude * 16;
  ctx.shadowOffsetX = 3 + altitude * 10;
  ctx.shadowOffsetY = 3 + altitude * 21;
  outline(ctx, start, end);
  ctx.fillStyle = '#856249';
  ctx.fill();
  ctx.restore();
  outline(ctx, start, end);
  ctx.save();
  ctx.clip();
  rainbowPaint(ctx, false);
  outline(ctx, start, end);
  stroke(ctx, '#f7dfae', 10);
  ctx.restore();
  outline(ctx, start, end);
  stroke(ctx, '#785744', 3);
  ctx.restore();
}

function brace(ctx, start, end) {
  ctx.beginPath();
  ctx.moveTo(xAt(start) + 8, 751);
  ctx.quadraticCurveTo(xAt(start) + 8, 768, xAt(start) + 26, 768);
  ctx.lineTo(xAt(end) - 26, 768);
  ctx.quadraticCurveTo(xAt(end) - 8, 768, xAt(end) - 8, 751);
  stroke(ctx, muted, 3.5);
}

function output(ctx, failed, alpha) {
  if (alpha <= 0) return;
  const results = failed ? runs[1].pieces : runs[0].pieces;
  const spans = failed ? [[0, word.length]] : [[rain.start, rain.end], [bow.start, bow.end]];
  ctx.save();
  ctx.globalAlpha = alpha;
  label(ctx, 'To model', 129, 837, 43, 'Sans', muted);
  for (const [i, [start, end]] of spans.entries()) {
    brace(ctx, start, end);
    label(ctx, results[i], (xAt(start) + xAt(end)) / 2, 848, failed ? 78 : 66, 'Mono', failed ? berry : ink, 'center');
  }
  ctx.restore();
}

function compareEnding(ctx, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(0, (1 - alpha) * 25);
  label(ctx, 'Old ending', xAt(bow.start) - 130, 841, 43, 'Serif', muted, 'right');
  label(ctx, '##', xAt(bow.start) - 17, 831, 44, 'Mono', muted, 'center');
  for (let i = bow.start; i < bow.end; i++) {
    label(ctx, word[i], letterX(i), 838, 80, 'Serif', i < rainb.end ? berry : muted, 'center');
  }
  const b = letterX(bow.start);
  ctx.beginPath();
  ctx.moveTo(b, 787);
  ctx.lineTo(b, 714);
  ctx.moveTo(b - 9, 725);
  ctx.lineTo(b, 714);
  ctx.lineTo(b + 9, 725);
  stroke(ctx, berry, 5);
  ctx.restore();
}

const missing = runs[1].attempts.filter((a) => a.start === runs[1].stuckAt);

function searchEnding(ctx, alpha, single) {
  if (alpha <= 0) return;
  const [both, first] = missing;
  ctx.save();
  ctx.globalAlpha = alpha;
  const end = both.end + (first.end - both.end) * single;
  brace(ctx, both.start, end);
  label(ctx, 'Looking for', xAt(both.start) - 50, 838, 44, 'Serif', muted, 'right');
  const entry = single < 0.5 ? both : first;
  ctx.globalAlpha *= Math.abs(1 - 2 * single);
  label(ctx, entry.candidate, (xAt(both.start) + xAt(end)) / 2, 845, 65, 'Mono', berry, 'center');
  ctx.restore();
}

function draw(ctx, clock) {
  const cue = (beat, phrase, duration) => {
    if (clock.index < beat) return 0;
    if (clock.index > beat) return 1;
    return ease(clock.reveal(phrase, duration));
  };
  const land = clock.index === 0 ? ease(clamp(clock.elapsed / 1.55)) : 1;
  const success = cue(0, 'read across', 0.55);
  const hashes = cue(1, 'The hash marks', 0.5);
  const add = cue(2, 'add one more', 0.65);
  const clear = cue(2, 'Where does', 1.05);
  const nextPiece = cue(2, 'if we use it', 0.8);
  const place = cue(3, 'Start at the R', 1.45);
  const overlay = cue(4, 'Line up', 0.7);
  const lift = cue(5, 'Look at the O', 0.55);
  const search = cue(5, 'Is there', 0.55);
  const single = cue(5, 'How about', 0.6);
  const finishSearch = cue(5, 'go back', 0.4);
  const fail = cue(5, 'to try rain', 0.65);

  ctx.save();
  board(ctx);
  vocabulary(ctx, add, hashes * (1 - add));
  socket(ctx, 0, word.length);
  piece(ctx, rain, { dx: -95 * clear, dy: -75 * clear, rotation: -0.065 * clear, opacity: 1 - clear, altitude: clear });
  const floating = 1 - land;
  piece(ctx, bow, {
    dx: 125 * floating + 88 * clear,
    dy: -104 * floating - 78 * clear,
    rotation: 0.1 * floating + 0.055 * clear,
    opacity: 1 - clear,
    altitude: floating + clear,
  });
  if (nextPiece > 0) {
    const air = 1 - place;
    piece(ctx, rainb, { dx: -75 * air, dy: -74 * air, rotation: -0.043 * air, opacity: nextPiece, altitude: air });
  }
  output(ctx, false, success * (1 - clear));
  compareEnding(ctx, overlay * (1 - lift));
  searchEnding(ctx, search * (1 - finishSearch), single);
  output(ctx, true, fail);
  ctx.restore();
}

export default { title: 'WordPiece and the missing end of rainbow', beats, draw, check };

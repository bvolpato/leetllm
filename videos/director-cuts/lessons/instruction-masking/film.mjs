import assert from 'node:assert/strict';
import { ASSISTANT_TARGETS, TOKEN_IDS, TOKENS } from '../../../films/instruction-masking/fixtures.mjs';
import { drawComic, ink, shape, stock } from './comic.mjs';

// Keep one exchange from the lesson's illustrative tokenization, including its turn boundary.
const exchange = TOKENS.slice(0, 10).map((text, i) => ({
  text,
  id: TOKEN_IDS[i],
  label: ASSISTANT_TARGETS[i] ? TOKEN_IDS[i] : -100,
}));
const predictions = exchange.slice(1).map((target, i) => ({
  prefix: exchange.slice(0, i + 1),
  target,
}));
const scored = predictions.filter(({ target }) => target.label !== -100);
const ownerWords = exchange.slice(1, 5);
const replyWords = exchange.slice(6);
const rose = '#99263f';
const wash = '#ffa89b';
const quiet = '#5b5269';
const clamp = (n) => Math.max(0, Math.min(1, n));
function ease(n) {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
}

const beats = [
  {
    id: 'catch',
    say: 'Her owner texts, “How is my dog?” Look at that catch. The sitter writes back, “She is happy.”',
    hold: 0.9,
  },
  {
    id: 'two-copies',
    say: 'Find the word “is” in each message. In this example, the tokenizer gives both copies the number one hundred two. Which prediction should count when we train the assistant to write the reply?',
    hold: 2,
  },
  {
    id: 'mark',
    say: 'Follow the pink mark. It lands on the second “is.” We keep its token ID as the training label. The first “is” gets minus one hundred. That tells the loss to skip this prediction.',
    hold: 1.1,
  },
  {
    id: 'behind-the-fold',
    say: 'Cover the rest of the reply. The model can read the whole question and the word “She.” From there it predicts “is.” The probability it assigned to that token determines the loss for this prediction.',
    hold: 0.8,
  },
  {
    id: 'turn-end',
    say: 'Now “is” joins the context. Slide the paper one word further. The next target is “happy,” with its period. One more move reveals the end-of-turn token. The assistant practices ending its reply here.',
    hold: 1.3,
  },
  {
    id: 'four-marks',
    say: 'Count the pink marks. Three tokens spell the reply and the fourth closes it. We average those four prediction losses. The question stays here for the assistant to read.',
    hold: 2.7,
  },
];

function check() {
  assert.deepEqual(ownerWords.map((t) => t.text), ['How', 'is', 'my', 'dog?']);
  assert.equal(ownerWords[1].id, 102);
  assert.equal(ownerWords[1].id, replyWords[1].id);
  assert.equal(ownerWords[1].label, -100);
  assert.equal(replyWords[1].label, 102);
  assert.deepEqual(scored.map(({ target }) => target.text), ['She', 'is', 'happy.', '<EOT>']);
  assert.deepEqual(scored.map(({ prefix, target }) => [prefix.at(-1).text, target.label]), [
    ['<A>', replyWords[0].id],
    ['She', replyWords[1].id],
    ['is', replyWords[2].id],
    ['happy.', replyWords[3].id],
  ]);
  assert.deepEqual(scored[1].prefix.slice(1, 5), ownerWords);
}

function font(ctx, size, face = 'Sans', weight = 600) {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
}

function write(ctx, text, x, y, color, align = 'left') {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function line(ctx, x, y, toX, toY, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(toX, toY);
  ctx.stroke();
}

function paintMark(ctx, w, strength) {
  if (strength <= 0) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(w.x - 3, w.base - 34, (w.width + 6) * strength, 46);
  ctx.clip();
  const x = w.x;
  const y = w.base;
  const r = x + w.width;
  ctx.fillStyle = wash;
  ctx.beginPath();
  ctx.moveTo(x - 2, y - 28);
  ctx.lineTo(r + 2, y - 31);
  ctx.lineTo(r + 3, y + 5);
  ctx.lineTo(x - 2, y + 7);
  ctx.closePath();
  ctx.fill();
  line(ctx, x - 2, y + 6, r + 3, y + 4, rose, 1.6);
  ctx.restore();
}

function wordFont(ctx, token) {
  if (token.text === '<EOT>') font(ctx, 23, 'Mono', 600);
  else font(ctx, 43, 'Serif', 400);
}

function typeset(ctx, tokens, x) {
  const gap = 13;
  return tokens.map((token) => {
    wordFont(ctx, token);
    const display = token.text === '<EOT>' ? 'EOT' : token.text;
    const width = ctx.measureText(display).width + (token.text === '<EOT>' ? 12 : 0);
    const word = { token, x, base: 117, width, display };
    x += width + gap;
    return word;
  });
}

function lettering(ctx, words, marks, endAlpha) {
  words.forEach((word, i) => {
    ctx.save();
    const special = word.token.text === '<EOT>';
    if (special) ctx.globalAlpha *= endAlpha;
    paintMark(ctx, word, marks[i] || 0);
    wordFont(ctx, word.token);
    if (special) {
      ctx.strokeStyle = rose;
      ctx.lineWidth = 1.7;
      ctx.strokeRect(word.x - 1, word.base - 26, word.width + 2, 30);
      write(ctx, word.display, word.x + 6, word.base - 2, rose);
    } else {
      write(ctx, word.display, word.x, word.base, ink);
    }
    ctx.restore();
  });
}

const ownerBalloon = 'M51 61 Q59 43 105 43 L377 42 Q426 42 432 69 L430 148 Q428 167 406 170 L237 171 Q220 193 182 208 Q197 191 195 172 L100 171 Q53 170 49 147Z';
const sitterBalloon = 'M486 66 Q490 43 527 43 L873 42 Q908 44 911 68 L913 146 Q909 169 879 170 L571 171 Q554 193 509 206 Q523 190 524 171 Q489 169 485 149Z';

function balloon(ctx, right) {
  const contour = right ? sitterBalloon : ownerBalloon;
  ctx.save();
  ctx.translate(1.2, 3.4);
  shape(ctx, contour, '#987f84', null);
  ctx.restore();
  shape(ctx, contour, stock, ink, 2.6);
  font(ctx, 19, 'Sans', 700);
  write(ctx, right ? 'ASSISTANT' : 'USER', right ? 509 : 76, 70, quiet);
}

function underWord(ctx, word, progress) {
  if (progress <= 0) return;
  line(ctx, word.x, 122, word.x + word.width * progress, 121, '#8b687a', 2.5);
}

function note(ctx, text, x, opacity, color = quiet) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha *= opacity;
  font(ctx, 23, 'Sans', 600);
  write(ctx, text, x, 154, color);
  ctx.restore();
}

function targetNote(ctx, word, text, opacity, color) {
  if (opacity <= 0) return;
  const anchor = word.x + word.width / 2;
  ctx.save();
  ctx.globalAlpha *= opacity;
  line(ctx, anchor, 126, anchor + 7, 146, color, 1.5);
  note(ctx, text, anchor + 13, 1, color);
  ctx.restore();
}

// A folded strip covers the words ahead of the causal prediction. Its left edge is the reading position.
function fold(ctx, left) {
  if (left >= 935) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(482, 76, 450, 76);
  ctx.clip();
  ctx.shadowColor = '#60555d45';
  ctx.shadowOffsetX = -2;
  ctx.shadowOffsetY = 3;
  ctx.shadowBlur = 3;
  ctx.fillStyle = '#e7ddc9';
  ctx.beginPath();
  ctx.moveTo(left + 2, 80);
  ctx.lineTo(951, 77);
  ctx.lineTo(951, 142);
  ctx.lineTo(left - 1, 145);
  ctx.closePath();
  ctx.fill();
  ctx.shadowColor = 'transparent';
  const roll = ctx.createLinearGradient(left - 1, 0, left + 16, 0);
  roll.addColorStop(0, '#ae9d92');
  roll.addColorStop(0.22, '#f6eddb');
  roll.addColorStop(0.6, '#fff9ea');
  roll.addColorStop(1, '#e7ddc9');
  ctx.fillStyle = roll;
  ctx.fillRect(left - 1, 80, 17, 64);
  line(ctx, left, 82, left - 1, 144, '#756578', 1.3);
  for (let k = 0; k < 6; k++) {
    line(ctx, left + 24 + k * 26, 139, left + 37 + k * 26, 138.7, '#cfc5b6', 0.8);
  }
  ctx.restore();
}

function paper(ctx) {
  ctx.fillStyle = '#bab0c4';
  ctx.fillRect(-1400, -900, 3800, 2300);
  shape(ctx, 'M-120 -200 L1100 -200 L1100 475 Q666 513 401 495 L-120 508Z', '#8e839b', null);
  shape(ctx, 'M-120 -200 L1100 -200 L1100 470 Q663 503 400 488 L-120 499Z', '#f7edd6', null);
  const crease = ctx.createLinearGradient(448, 0, 465, 0);
  crease.addColorStop(0, '#f7edd600');
  crease.addColorStop(0.5, '#ab99a64a');
  crease.addColorStop(0.8, '#fff7de');
  crease.addColorStop(1, '#f7edd600');
  ctx.fillStyle = crease;
  ctx.fillRect(448, 0, 17, 490);
}

function draw(ctx, clock) {
  const { index, elapsed, seconds, reveal } = clock;
  const wide = index === 0 ? ease(reveal('How is my dog', 1.5)) : 1;
  // Follow the folded strip into the reply. Pull back to see the marks beside the question.
  let close = 0;
  if (index === 4) close = ease(reveal('Slide the paper', 1.5));
  if (index === 5) close = 1 - ease(reveal('Count the pink marks', 1.5));
  const zoom = 1.85 - 0.85 * wide + 0.8 * close;
  const focusX = 704 - 224 * wide + 206 * close;
  const focusY = 316 - 46 * wide - 92 * close;
  const inHold = index === 5 ? Math.max(0, elapsed - clock.speechDuration) : 0;
  const motionTime = seconds - inHold + 0.4 * (1 - Math.exp(-inHold / 0.4));
  ctx.save();
  ctx.scale(2, 2);
  ctx.translate(480, 270);
  ctx.scale(zoom, zoom);
  ctx.translate(-focusX, -focusY);
  paper(ctx);
  drawComic(ctx, motionTime, clamp(seconds / 1.05));

  const owner = typeset(ctx, ownerWords, 76);
  const reply = typeset(ctx, replyWords, 509);
  const sitterIn = index === 0 ? ease(reveal('The sitter writes back', 0.28)) : 1;
  balloon(ctx, false);
  lettering(ctx, owner, [], 0);
  ctx.save();
  ctx.globalAlpha = sitterIn;
  balloon(ctx, true);

  const marks = [0, 0, 0, 0];
  let endAlpha = 0;
  let cover = 940;
  if (index === 2) {
    marks[1] = ease(elapsed / 0.65);
  } else if (index === 3) {
    const slideIn = ease(elapsed / 0.8);
    const predictIs = ease(reveal('From there', 0.95));
    const hideIs = reply[1].x - 5;
    cover = 940 + (hideIs - 940) * slideIn + (reply[2].x - reply[1].x) * predictIs;
    marks[1] = 1;
  } else if (index === 4) {
    const happy = ease(reveal('one word further', 0.85));
    const end = ease(reveal('One more move', 0.9));
    marks[1] = 1 - ease(elapsed / 0.6);
    marks[2] = happy * (1 - end);
    marks[3] = end;
    endAlpha = end;
    cover = reply[2].x - 5 + (reply[3].x - reply[2].x) * happy + (945 - reply[3].x) * end;
  } else if (index === 5) {
    endAlpha = 1;
    scored.forEach(({ target }, i) => {
      marks[replyWords.indexOf(target)] = i === 3 ? 1 : ease((elapsed - i * 0.27) / 0.45);
    });
  }
  lettering(ctx, reply, marks, endAlpha);
  ctx.restore();

  if (index === 1 || index === 2) {
    const find = index === 1 ? ease(reveal('the word', 0.4)) : 1;
    const number = index === 1 ? ease(reveal('the tokenizer', 0.45)) : 1;
    const labelL = index === 2 ? ease(reveal('The first', 0.35)) : 0;
    const labelR = index === 2 ? ease(reveal('We keep', 0.35)) : 0;
    for (const [word, labeled] of [[owner[1], labelL], [reply[1], labelR]]) {
      underWord(ctx, word, find);
      targetNote(ctx, word, 'ID ' + word.token.id, number * (1 - labeled), quiet);
    }
    const ignored = String(owner[1].token.label).replace('-', '−');
    targetNote(ctx, owner[1], 'Label ' + ignored + ' · skip', labelL, quiet);
    targetNote(ctx, reply[1], 'Label ' + reply[1].token.label + ' · score', labelR, rose);
  }
  if (index === 3 || index === 4) {
    fold(ctx, cover);
    const context = index === 3 ? ease(reveal('The model can read', 0.4)) : 1;
    note(ctx, 'Context', 76, context);
  }
  if (index === 5) {
    note(ctx, 'Context', 76, 1);
    note(ctx, scored.length + ' scored targets', 509, ease((elapsed - 0.9) / 0.6), rose);
  }
  ctx.restore();
}

export default { title: 'Which “is” counts?', beats, draw, check };

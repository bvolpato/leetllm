import assert from 'node:assert/strict';
import { firstSnippetWords as words, sequence0 as input } from '../../../films/tensor-shapes/fixtures.mjs';

// A frame on the strip is one feature of the course fixture's first sentence.
const features = input.flat();
const heads = 2;
const width = input[0].length;
const pairWidth = width / heads;
const pairs = Array.from({ length: features.length / pairWidth }, (_, i) => ({
  frame: i * pairWidth,
  values: features.slice(i * pairWidth, (i + 1) * pairWidth),
}));
const byWord = input.map((_, w) => pairs.slice(w * heads, (w + 1) * heads));
const byHead = Array.from({ length: heads }, (_, h) => byWord.map(row => row[h]));
const direct = Array.from({ length: heads }, (_, h) => pairs.slice(h * words.length, (h + 1) * words.length));

function check() {
  assert.equal(width % heads, 0);
  assert.deepEqual(words, ['Birds', 'migrate', 'south']);
  for (const layout of [direct, byHead]) {
    assert.deepEqual(layout.map(row => row.map(pair => pair.values.length)), [[2, 2, 2], [2, 2, 2]]);
  }
  for (const [w, row] of input.entries()) {
    assert.deepEqual(byHead.flatMap(head => head[w].values), row);
  }
  const wanted = input[1].slice(0, pairWidth);
  assert.deepEqual(wanted, [4, 5]);
  assert.deepEqual(direct[0][1].values, input[0].slice(pairWidth));
  assert.notDeepEqual(direct[0][1].values, wanted);
  assert.deepEqual(byHead[0][1].values, wanted);
  assert.deepEqual(byHead[1][1].values, [6, 7]);
  assert.equal(byHead[0][1].frame - byHead[0][0].frame, 4);
  assert.equal(byHead[1][1].frame - byHead[0][1].frame, 2);
}

const beats = [
  {
    id: 'one-click',
    say: 'Follow the word dial one click. It says migrate. Which word supplied the two numbers in the glass?',
    hold: 1.6,
  },
  {
    id: 'read-the-strip',
    say: 'Two and three are the tail end of Birds. Look one frame farther along. Migrate begins at four. This strip holds one sentence, four features per word.',
    hold: 0.85,
  },
  {
    id: 'six-frames',
    say: 'Each of our two attention heads needs a pair from every word. A direct reshape makes room for exactly that. Watch head zero fill its three slots with consecutive pairs. It takes all of Birds and only half of migrate.',
    hold: 1.35,
  },
  {
    id: 'split-each-word',
    say: 'Wind back to Birds. First, reshape the four features inside each word into two pairs. The left pair goes to head zero and the right pair to head one.',
    hold: 1.0,
  },
  {
    id: 'follow-one-head',
    say: 'Transpose the word and head axes. Now choose a head and follow its pairs across the words. Keep head zero selected. Where will the window land when the dial advances to migrate?',
    hold: 2.5,
  },
  {
    id: 'the-middle-word',
    say: 'Four and five. The window traveled four frames, one whole word. Leave the dial on migrate and switch to head one.',
    hold: 1.35,
  },
  {
    id: 'the-other-half',
    say: 'Six and seven. This time the window moved two frames. Both pairs came from inside migrate.',
    hold: 2.65,
  },
];

const clamp = n => Math.max(0, Math.min(1, n));
function ease(n) {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
}
const mix = (a, b, t) => a + (b - a) * t;
const metal = ['#233b3a', '#172c2c', '#0c1a1c'];
const stocks = [
  { light: '#b6d9da', middle: '#83b8be', dark: '#629399', ink: '#153d47' },
  { light: '#f5d998', middle: '#ddba75', dark: '#b18b56', ink: '#543c2b' },
  { light: '#d4bfbd', middle: '#bf9d9f', dark: '#a27f83', ink: '#533a45' },
];
const edge = '#e8c784';
const cream = '#f0e9cf';
const stripX = 156, cellW = 134, stripY = 588;
const pictureY = stripY + 28, pictureH = 120, nameY = pictureY + pictureH;

function fill(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function plate(ctx, x, y, w, h, radius, color) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = color;
  ctx.fill();
}
function gradient(ctx, x, y, dx, dy, stops) {
  const paint = ctx.createLinearGradient(x, y, x + dx, y + dy);
  stops.forEach((c, i) => paint.addColorStop(i / (stops.length - 1), c));
  return paint;
}
function label(ctx, value, x, y, size, color, family = 'Sans', align = 'left') {
  ctx.font = `${size}px "Lesson ${family}"`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(String(value), x, y);
}
function line(ctx, x1, y1, x2, y2, color, stroke = 2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineWidth = stroke;
  ctx.strokeStyle = color;
  ctx.stroke();
}

// This flight study is printed on the emulsion. The enlarged view crops the same exposures.
function flight(ctx, phase, ink) {
  const wing = Math.sin(phase);
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.moveTo(-0.02, 0.01);
  ctx.bezierCurveTo(-0.14, -0.11, -0.33, -0.30 * wing, -0.55, -0.42 * wing);
  ctx.bezierCurveTo(-0.39, -0.35 * wing + 0.11, -0.27, -0.11 * wing + 0.08, -0.10, 0.08);
  ctx.lineTo(-0.29, 0.19);
  ctx.lineTo(-0.19, 0.22);
  ctx.lineTo(0.07, 0.105);
  ctx.bezierCurveTo(0.19, 0.08, 0.23, 0.035, 0.29, 0.04);
  ctx.lineTo(0.38, 0.026);
  ctx.quadraticCurveTo(0.27, -0.035, 0.23, -0.005);
  ctx.quadraticCurveTo(0.16, 0.02, 0.11, -0.006);
  ctx.bezierCurveTo(0.18, -0.16 * wing, 0.31, -0.30 * wing - 0.03, 0.51, -0.49 * wing - 0.05);
  ctx.bezierCurveTo(0.38, -0.44 * wing - 0.12, 0.20, -0.22 * wing - 0.12, -0.02, 0.01);
  ctx.fill();
}

function exposure(ctx, i, x, y, w, h) {
  const stock = stocks[Math.floor(i / width)];
  ctx.save();
  ctx.translate(x, y);
  fill(ctx, 0, 0, w, h, gradient(ctx, 0, 0, w * 0.7, h, [stock.light, stock.middle, stock.dark]));
  // Faint development streaks are fixed to the frame as it passes the glass.
  for (let k = 0; k < 7; k++) {
    const stripe = ((i * 31 + k * 13) % 97) / 100;
    fill(ctx, stripe * w, 0, w * 0.003, h, 'rgba(255,250,219,0.14)');
  }
  ctx.save();
  ctx.translate(w * 0.68, h * 0.34);
  ctx.scale(w * 0.52, h * 0.73);
  flight(ctx, 0.41 + i * 0.71, stock.ink);
  ctx.restore();
  label(ctx, features[i], w * 0.14, h * 0.69, Math.min(h * 0.65, w * 0.51), stock.ink, 'Mono');
  fill(ctx, w - 3, 0, 3, h, '#312f28');
  ctx.restore();
}

function screw(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, 2 * Math.PI);
  ctx.fillStyle = gradient(ctx, -5, -5, 10, 10, ['#80938a', '#384a46', '#182420']);
  ctx.fill();
  line(ctx, -4, 0, 4, 0, '#172322', 2.5);
  ctx.restore();
}

function bench(ctx) {
  fill(ctx, 0, 0, 1920, 1080, gradient(ctx, 0, 0, 500, 1080, metal));
  const light = ctx.createRadialGradient(1060, 550, 25, 960, 510, 1120);
  light.addColorStop(0, '#334a44');
  light.addColorStop(1, 'rgba(8,20,20,0.82)');
  fill(ctx, 0, 0, 1920, 1080, light);
  plate(ctx, 66, 68, 1788, 459, 52, '#0a1315');
  plate(ctx, 67, 65, 1786, 455, 49, gradient(ctx, 0, 65, 0, 455, ['#62746b', '#304340', '#253633']));
  plate(ctx, 72, 71, 1776, 442, 45, gradient(ctx, 72, 71, 920, 442, ['#354d47', '#243b38', '#172c2c']));
  for (const [x, y, a] of [[103, 109, -0.5], [1816, 109, 0.8], [103, 477, 0.7], [1816, 477, -0.6]]) {
    screw(ctx, x, y, a);
  }
}

function dial(ctx, word, head) {
  label(ctx, 'Output word', 168, 148, 48, '#d5d9c8');
  plate(ctx, 151, 194, 483, 146, 16, '#5b6860');
  plate(ctx, 154, 190, 477, 145, 14, '#0e1a1b');
  ctx.save();
  ctx.beginPath();
  ctx.rect(164, 200, 455, 126);
  ctx.clip();
  fill(ctx, 164, 200, 455, 126, gradient(ctx, 0, 200, 0, 126, ['#20302e', '#32413b', '#162625']));
  words.forEach((name, i) => label(ctx, name, 391, 260 + (i - word) * 153, 97, cream, 'Serif', 'center'));
  ctx.restore();
  label(ctx, 'Head', 169, 418, 53, '#d5d9c8');
  plate(ctx, 347, 377, 215, 83, 41, '#101e1f');
  plate(ctx, 354 + head * 100, 383, 99, 71, 35, gradient(ctx, 0, 383, 0, 71, ['#eed299', '#c0a26c']));
  for (let h = 0; h < heads; h++) {
    label(ctx, h, 403 + h * 100, 419, 53, Math.abs(head - h) < 0.5 ? '#26322d' : '#a3afa5', 'Mono', 'center');
  }
}

function projection(ctx, firstFrame) {
  const x = 724, y = 131, w = 1008, h = 321;
  plate(ctx, x - 27, y - 25, w + 54, h + 53, 36, gradient(ctx, x, y - 25, 300, h + 53, ['#82918a', '#293a37', '#78877f']));
  plate(ctx, x - 21, y - 18, w + 42, h + 38, 31, '#0a1617');
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.clip();
  for (let i = Math.floor(firstFrame); i < Math.min(features.length, Math.ceil(firstFrame + 2)); i++) {
    exposure(ctx, i, x + (i - firstFrame) * w / 2, y, w / 2, h);
  }
  const shade = ctx.createRadialGradient(x + w * 0.48, y + h * 0.4, 115, x + w / 2, y + h / 2, 565);
  shade.addColorStop(0, 'rgba(50,40,22,0)');
  shade.addColorStop(0.78, 'rgba(37,37,24,0.04)');
  shade.addColorStop(1, 'rgba(17,29,27,0.40)');
  fill(ctx, x, y, w, h, shade);
  ctx.restore();
}

function beam(ctx, left, right) {
  const light = gradient(ctx, 0, 520, 0, 79, ['rgba(236,218,149,0.02)', 'rgba(236,218,149,0.18)']);
  ctx.beginPath();
  ctx.moveTo(783, 520);
  ctx.lineTo(1689, 520);
  ctx.lineTo(right, stripY);
  ctx.lineTo(left, stripY);
  ctx.closePath();
  ctx.fillStyle = light;
  ctx.fill();
}

function strip(ctx, firstFrame, split, shade, trace) {
  plate(ctx, 91, stripY - 18, 1738, 240, 18, '#081417');
  plate(ctx, 96, stripY - 15, 1728, 233, 16, gradient(ctx, 0, stripY - 15, 0, 233, ['#64756c', '#283a34', '#718175']));
  fill(ctx, 0, stripY, 1920, 203, '#433c30');
  for (let x = -28; x < 1950; x += 67) {
    plate(ctx, x, stripY + 7, 27, 12, 3, '#142625');
    plate(ctx, x, stripY + 183, 27, 12, 3, '#142625');
  }
  for (let i = 0; i < features.length; i++) {
    const x = stripX + i * cellW;
    exposure(ctx, i, x, pictureY, cellW, pictureH);
    if (shade[i] > 0) {
      ctx.save();
      ctx.globalAlpha = shade[i];
      // The frosted mask covers the pairs outside the current head's view.
      fill(ctx, x, pictureY, cellW, pictureH, 'rgba(18,32,32,0.72)');
      ctx.restore();
    }
  }
  for (const [i, word] of words.entries()) {
    const x = stripX + i * width * cellW;
    fill(ctx, x, nameY, width * cellW - 3, 57, stocks[i].ink);
    label(ctx, word, x + width * cellW / 2, nameY + 28, 52, '#fff0d9', 'Serif', 'center');
    if (i > 0) fill(ctx, x - 3, pictureY, 6, pictureH + 57, '#332f29');
    if (split > 0) {
      ctx.save();
      ctx.globalAlpha = split;
      const seam = x + pairWidth * cellW;
      line(ctx, seam, pictureY, seam, pictureY + pictureH, '#171f1b', 8);
      ctx.restore();
    }
  }
  if (trace > 0) {
    const x = stripX + width * cellW;
    ctx.save();
    ctx.globalAlpha = trace;
    line(ctx, x + 5, nameY - 8, x + cellW - 7, nameY - 8, cream, 9);
    ctx.restore();
  }
  const left = stripX + firstFrame * cellW;
  const right = left + pairWidth * cellW;
  // Four sprung brass corners leave the exposure and its owner's name uncovered.
  const y1 = pictureY - 6, y2 = nameY - 3;
  for (const [x, dir] of [[left + 3, 1], [right - 3, -1]]) {
    for (const [y, up] of [[y1, 1], [y2, -1]]) {
      ctx.beginPath();
      ctx.moveTo(x, y + up * 38);
      ctx.lineTo(x, y);
      ctx.lineTo(x + dir * 38, y);
      ctx.strokeStyle = '#33352c';
      ctx.lineWidth = 16;
      ctx.stroke();
      ctx.strokeStyle = '#ffe2a4';
      ctx.lineWidth = 8;
      ctx.stroke();
    }
  }
}

function bracket(ctx, first, count, text, color, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  const x = stripX + first * cellW + 7;
  const end = x + count * cellW - 14;
  const y = 818;
  ctx.beginPath();
  ctx.moveTo(x, y - 13);
  ctx.lineTo(x, y);
  ctx.lineTo(end, y);
  ctx.lineTo(end, y - 13);
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.stroke();
  label(ctx, text, (x + end) / 2, 850, 43, color, 'Sans', 'center');
  ctx.restore();
}

function readout(clock) {
  const { index, elapsed, speechDuration, reveal } = clock;
  const start = byHead[0][0].frame;
  const wrong = direct[0][1].frame;
  let frame = wrong, word = 1, head = 0, split = 0, longBrackets = 0, chooseHead = 0, trace = 0;
  if (index === 0) {
    const click = ease(elapsed / 1.35);
    word = click;
    frame = mix(start, wrong, click);
  }
  if (index === 1) {
    trace = ease(reveal('Look one frame', 0.6)) * (1 - ease(reveal('This strip', 0.8)));
  }
  if (index === 2) longBrackets = ease(reveal('A direct reshape', 1.15));
  if (index === 3) {
    const rewind = ease(reveal('Wind back', 1.1));
    word = 1 - rewind;
    frame = mix(wrong, start, rewind);
    longBrackets = 1 - rewind;
    split = ease(reveal('reshape the four features', 0.9));
  }
  if (index >= 4) {
    split = 1;
    chooseHead = index === 4 ? ease(reveal('Transpose', 0.8)) : 1;
    const nextWord = index === 4 ? ease((elapsed - speechDuration - 0.55) / 1.25) : 1;
    word = nextWord;
    frame = mix(start, byHead[0][1].frame, nextWord);
  }
  if (index >= 5) {
    head = index === 5 ? ease(reveal('switch to head one', 0.9)) : 1;
    frame = mix(byHead[0][1].frame, byHead[1][1].frame, head);
  }
  return { frame, word, head, split, longBrackets, chooseHead, trace };
}

function draw(ctx, clock) {
  const { frame, word, head, split, longBrackets, chooseHead, trace } = readout(clock);
  bench(ctx);
  const left = stripX + frame * cellW;
  beam(ctx, left, left + pairWidth * cellW);
  dial(ctx, word, head);
  projection(ctx, frame);
  const filled = clock.index === 2 ? words.length * clock.reveal('Watch head zero', 2.7) : words.length;
  const shade = features.map((_, i) => {
    if (longBrackets > 0) {
      if (i >= direct[1][0].frame) return longBrackets;
      const slot = Math.floor(i / pairWidth);
      return 0.58 * longBrackets * (1 - ease(filled - slot));
    }
    const pairHead = Math.floor((i % width) / pairWidth);
    return Math.abs(pairHead - head) * chooseHead;
  });
  strip(ctx, frame, split, shade, trace);
  for (let h = 0; h < heads; h++) {
    bracket(ctx, direct[h][0].frame, words.length * pairWidth, 'Head ' + h, h ? '#bec8b7' : edge, longBrackets);
  }
  for (const token of byWord) {
    for (const [h, pair] of token.entries()) {
      const visible = 1 - 0.46 * chooseHead * Math.abs(head - h);
      bracket(ctx, pair.frame, pairWidth, 'Head ' + h, h ? '#d5e6dc' : edge, split * visible);
    }
  }
  if (longBrackets > 0 || split > 0) {
    const code = longBrackets > 0 ? 'sentence.reshape(2, 3, 2)' : 'sentence.reshape(3, 2, 2)';
    ctx.save();
    ctx.globalAlpha = Math.max(longBrackets, split);
    const swap = '.transpose(1, 0, 2)';
    ctx.font = '48px "Lesson Mono"';
    const total = ctx.measureText(code).width + chooseHead * ctx.measureText(swap).width;
    const x = (1920 - total) / 2;
    label(ctx, code, x, 925, 48, cream, 'Mono');
    if (chooseHead > 0) {
      ctx.globalAlpha = chooseHead;
      label(ctx, swap, x + ctx.measureText(code).width, 925, 48, edge, 'Mono');
    }
    ctx.restore();
  }
}

export default { title: 'Which Word Is in the Glass?', beats, draw, check };

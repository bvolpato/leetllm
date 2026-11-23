import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { sampleModel } from '../../../films/deep-dive-transformers/model.mjs';

const title = 'Which position finishes “Birds sing”?';
const beats = [
  {
    id: 'make-room',
    say: 'Watch the gap after “Birds sing.” The longer prompt takes four tokens, so two pads fill the short row. Which position will this decoder use to continue “Birds sing”?',
    hold: 2.1,
  },
  {
    id: 'take-the-slice',
    say: 'Follow the orange slice. Each position has a set of next-token scores, called logits. Minus one takes the last column of those scores from both rows. Look where it lands above “today.”',
    hold: 1.2,
  },
  {
    id: 'under-the-words',
    say: 'It lands on a pad. Look underneath. In the attention mask, each zero keeps that pad out of the context the model can attend to. The pad still occupies a position in the batch.',
    hold: 0.9,
  },
  {
    id: 'read-the-pad',
    say: 'Open the scores from that pad position. In our tiny example model, “again” scores two. “Softly” gets one and a half. A greedy decoder takes the highest score, so it picks “again.”',
    hold: 1.0,
  },
  {
    id: 'move-the-words',
    say: 'Run the same step again. This time, put both pads on the left. Watch the words move with their mask. What sits inside the orange slice now?',
    hold: 1.6,
  },
  {
    id: 'read-the-word',
    say: 'There’s “sing.” Look at its scores. Now “softly” wins with three and a half. The long row still gives us “too.” Both prompts continue from their own last word.',
    hold: 2.7,
  },
];

const layouts = [0, 1].map(beat => sampleModel('padding', { beat, beatP: 0.5 }));
const vocabulary = ['PAD', 'Birds', 'sing', 'The', 'sun', 'shines', 'today', 'again', 'softly', 'too'];
const embeddings = [
  [2, 0, 0], [0, 1, 0], [0, 2, 0], [0, 0, 1], [0, 0, 1],
  [0, 0, 1], [0, 0, 2], [1, 0, 0], [0, 1, 0], [0, 0, 1],
];

// A fixed teaching model. Zero queries and keys give equal attention weights to the
// visible prefix. The residual carries the current position's own embedding.
function forward(row, mask) {
  const sum = [0, 0, 0];
  let visible = 0;
  return row.map((word, position) => {
    const token = embeddings[vocabulary.indexOf(word)];
    if (mask[position]) {
      visible++;
      token.forEach((v, d) => { sum[d] += v; });
    }
    const hidden = token.map((v, d) => v + sum[d] / Math.max(visible, 1));
    return [...Array(vocabulary.length - hidden.length).fill(-1), ...hidden];
  });
}

function greedy(scores) {
  return vocabulary[scores.indexOf(Math.max(...scores))];
}

const logits = layouts.map(({ rows, masks }) => rows.map((row, i) => forward(row, masks[i])));
const picks = logits.map(batch => batch.map(row => greedy(row.at(-1))));
const shortLength = layouts[0].rows[0].filter((_, col) => layouts[0].masks[0][col]).length;
const width = layouts[0].rows[1].length;
const padCount = width - shortLength;

function check() {
  const [right, left] = layouts;
  for (let r = 0; r < 2; r++) {
    const real = side => side.rows[r].filter((_, c) => side.masks[r][c] === 1);
    assert.deepEqual(real(right), real(left));
    assert.deepEqual(real(right), r === 0 ? ['Birds', 'sing'] : ['The', 'sun', 'shines', 'today']);
    const solo = forward(real(right), real(right).map(() => 1)).at(-1);
    assert.deepEqual(logits[1][r].at(-1), solo);
  }
  assert.deepEqual(right.masks[0], [1, 1, 0, 0]);
  assert.deepEqual(left.masks[0], [0, 0, 1, 1]);
  assert.equal(right.rows[0].at(-1), 'PAD');
  assert.equal(left.rows[0].at(-1), 'sing');
  assert.deepEqual(logits[0][0].at(-1).slice(-3), [2, 1.5, 0]);
  assert.deepEqual(logits[1][0].at(-1).slice(-3), [0, 3.5, 0]);
  assert.deepEqual(picks, [['again', 'too'], ['softly', 'too']]);
}

const ink = '#211d46';
const orange = '#ba3e15';
const left = 240;
const pitch = 280;
const tileW = 266;
const tileH = 142;
const rowsY = [353, 620];
const smooth = n => {
  const t = Math.max(0, Math.min(1, n));
  return t * t * (3 - 2 * t);
};

function text(ctx, value, x, y, size, color, face = 'Mono', align = 'left', weight = 400) {
  ctx.font = `${weight} ${size}px "Lesson ${face}"`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function polygon(ctx, points, color) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const p of points.slice(1)) ctx.lineTo(...p);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function line(ctx, x1, y1, x2, y2, color, thickness = 3) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.stroke();
}

function wash(ctx) {
  const light = ctx.createLinearGradient(145, 0, 1450, 1260);
  light.addColorStop(0, '#fff9e9');
  light.addColorStop(0.55, '#f7ecd9');
  light.addColorStop(1, '#e3d4bf');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, 1920, 1080);
}

// The tiny raster labels make each word a single continuous piece when it moves.
const faces = new Map();
function face(word) {
  if (faces.has(word)) return faces.get(word);
  const pad = word === 'PAD';
  const cols = 64, lines = 34, step = tileW / cols;
  const mask = createCanvas(cols, lines);
  const m = mask.getContext('2d');
  m.font = '700 24px "Lesson Sans"';
  const bounds = m.measureText(word);
  const fontSize = Math.min(24, Math.floor(24 * (cols - 8) / bounds.width));
  text(m, word, cols / 2, lines / 2, fontSize, '#fff', 'Sans', 'center', 700);
  const rgba = m.getImageData(0, 0, cols, lines).data;

  const img = createCanvas(tileW, tileH);
  const g = img.getContext('2d');
  const light = g.createLinearGradient(0, 0, tileW, tileH);
  light.addColorStop(0, pad ? '#f2e7d6' : '#514dba');
  light.addColorStop(1, pad ? '#e8d9c5' : '#34267f');
  g.fillStyle = light;
  g.fillRect(0, 0, tileW, tileH);
  for (let r = 0; r < lines; r++) {
    for (let c = 0; c < cols; c++) {
      const alpha = rgba[4 * (r * cols + c) + 3];
      const mark = alpha > 105;
      if (mark) g.fillStyle = pad ? '#76685d' : '#fff8db';
      else if (pad) g.fillStyle = (c + r) % 8 < 2 ? '#d5c3af' : '#e7dac7';
      else g.fillStyle = (c + r) % 3 === 0 ? '#51459c' : '#4a3e97';
      const inset = mark ? 0.32 : 0.9;
      g.fillRect(c * step + inset, r * tileH / lines + inset, step - inset * 1.6, tileH / lines - inset * 1.6);
    }
  }
  faces.set(word, img);
  return img;
}

const bird = [
  '...........###...', '..........#####..', '.........###.##..', '.........#######.',
  '..#....########..', '..##.#########...', '...###########...', '....#########....',
  '.....#######.....', '......####.......', '.......#.#.......', '......##.##......',
];
function rowGlyph(ctx, row, y) {
  ctx.save();
  ctx.translate(71, y + 26);
  if (row === 0) {
    ctx.fillStyle = '#393366';
    for (const [r, chars] of bird.entries()) {
      for (let c = 0; c < chars.length; c++) {
        if (chars[c] === '#') ctx.fillRect(c * 7, r * 7, 7.3, 7.3);
      }
    }
  } else {
    // The two stamps stay attached to their rows as the short prompt is repacked.
    const unit = 7;
    ctx.fillStyle = '#a35d15';
    for (let r = -7; r <= 7; r++) {
      for (let c = -7; c <= 7; c++) {
        const d2 = c * c + r * r;
        if (d2 <= 16 || (d2 >= 34 && d2 <= 54 && (c === 0 || r === 0 || Math.abs(c) === Math.abs(r)))) {
          ctx.fillRect(55 + unit * c, 42 + unit * r, unit + 0.3, unit + 0.3);
        }
      }
    }
  }
  ctx.restore();
}

function tile(ctx, word, bit, x, y, maskAmount) {
  const pad = !bit;
  const d = 12;
  ctx.save();
  ctx.translate(x, y);
  polygon(ctx, [[0, tileH], [tileW, tileH], [tileW + d, tileH - d], [tileW + 27, tileH + 8], [17, tileH + 20]], '#2b19441b');
  polygon(ctx, [[0, 0], [d, -d], [tileW + d, -d], [tileW, 0]], pad ? '#fff9e9' : '#938bd4');
  polygon(ctx, [[tileW, 0], [tileW + d, -d], [tileW + d, tileH - d], [tileW, tileH]], pad ? '#b5a893' : '#29215a');
  ctx.drawImage(face(word), 0, 0);
  if (maskAmount > 0) {
    ctx.globalAlpha *= maskAmount;
    const cy = tileH + 42 - 12 * (1 - maskAmount);
    const mid = tileW / 2;
    line(ctx, 12, cy, mid - 31, cy, '#bcb09e', 2);
    line(ctx, mid + 31, cy, tileW - 4, cy, '#bcb09e', 2);
    ctx.fillStyle = bit ? ink : '#f6ecdb';
    ctx.fillRect(mid - 27, cy - 24, 54, 48);
    ctx.strokeStyle = bit ? ink : '#94826c';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(mid - 27, cy - 24, 54, 48);
    text(ctx, String(bit), mid, cy, 42, bit ? '#fff7e7' : ink, 'Mono', 'center');
  }
  ctx.restore();
}

function slice(ctx, amount, detail) {
  if (!amount) return;
  const x = left + (width - 1) * pitch - 7;
  const w = tileW + 27;
  const top = 290, bottom = 840 - detail * 265;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 12, top - 14, w + 24, (bottom - top + 28) * amount);
  ctx.clip();
  ctx.fillStyle = '#ff74101a';
  ctx.fillRect(x, top, w, bottom - top);
  ctx.fillStyle = orange;
  ctx.fillRect(x, top, w, 8);
  ctx.fillRect(x, bottom - 8, w, 8);
  for (const xx of [x, x + w - 3]) {
    ctx.fillRect(xx, top, 3, bottom - top);
    for (const yy of [top, bottom - 26]) ctx.fillRect(xx - 2, yy, 7, 26);
  }
  ctx.restore();
}

function drawExpression(ctx, amount) {
  const x = left, y = 175;
  if (amount < 1) {
    ctx.save();
    ctx.globalAlpha *= 1 - amount;
    text(ctx, 'Prompt tokens', x, y, 65, ink, 'Sans', 'left', 600);
    ctx.restore();
  }
  if (!amount) return;
  ctx.save();
  ctx.globalAlpha *= amount;
  text(ctx, 'logits[:, ', x, y, 65, ink);
  const minusX = x + ctx.measureText('logits[:, ').width;
  text(ctx, '-1', minusX, y, 65, orange);
  const tailX = minusX + ctx.measureText('-1').width;
  text(ctx, ', :]', tailX, y, 65, ink);
  const mid = left + (width - 1) * pitch + tileW / 2;
  line(ctx, tailX + ctx.measureText(', :]').width + 26, y + 4, mid, y + 4, orange);
  line(ctx, mid, y + 4, mid, 226, orange);
  polygon(ctx, [[mid - 8, 221], [mid + 8, 221], [mid, 232]], orange);
  ctx.restore();
}

function pick(ctx, word, y, amount) {
  if (!amount) return;
  ctx.save();
  ctx.globalAlpha *= amount;
  const start = left + (width - 1) * pitch + tileW + 27;
  const end = start + 83 * amount;
  const cy = y + tileH / 2;
  line(ctx, start, cy, end, cy, orange, 5);
  polygon(ctx, [[end, cy - 10], [end + 17, cy], [end, cy + 10]], orange);
  text(ctx, word, end + 41, cy - 3, 92, ink, 'Serif');
  ctx.restore();
}

function showScores(ctx, side, amount) {
  const scores = logits[side][0].at(-1);
  ctx.save();
  ctx.globalAlpha = amount;
  const x = 1430, w = 368;
  text(ctx, 'next-token scores', x, 266, 34, ink);
  for (const [i, word] of ['again', 'softly'].entries()) {
    const score = scores[vocabulary.indexOf(word)];
    const y = 358 + i * 113;
    text(ctx, word, x, y, 47, ink, 'Serif');
    text(ctx, String(score), x + w, y, 40, ink, 'Mono', 'right');
    ctx.fillStyle = '#d8cbb9';
    ctx.fillRect(x, y + 34, w, 15);
    ctx.fillStyle = word === picks[side][0] ? orange : '#625aa1';
    ctx.fillRect(x, y + 34, w * score / 4, 15);
    for (let tick = 0; tick <= 4; tick++) {
      const at = x + w * tick / 4;
      line(ctx, at, y + 50, at, y + 57, '#998e7f', 1.5);
    }
  }
  ctx.restore();
}

function draw(ctx, clock) {
  wash(ctx);
  const { index, elapsed, reveal } = clock;
  const read = index > 1 ? 1 : index === 1 ? smooth(elapsed / 0.85) : 0;
  const mask = index > 2 ? 1 : index === 2 ? smooth(reveal('Look underneath', 0.8)) : 0;
  const repack = index > 4 ? 1 : index === 4 ? smooth(reveal('put both pads', 2.15)) : 0;
  const firstPick = index < 3 ? 0 : index === 3 ? smooth(reveal('A greedy decoder', 1.0)) : 1;
  const newPick = index === 5 ? smooth(reveal('The long row', 1.1)) : 0;
  const shortPick = index < 4 ? firstPick : index === 4 ? 1 - smooth(elapsed / 0.6) : newPick;

  // Inspect the same pair of scores at the same magnification on both passes.
  const approach = smooth(elapsed / 1.1);
  const detail = index === 3 ? approach * (1 - firstPick) : index === 5 ? approach * (1 - newPick) : 0;
  const room = index > 3 ? 1 : index === 3 ? approach : 0;
  ctx.save();
  ctx.scale(1 + detail, 1 + detail);
  ctx.translate(-980 * detail, -114 * detail);
  ctx.translate(165 * (1 - room), 0);
  ctx.scale(1 + 0.04 * (1 - room), 1);
  ctx.save();
  ctx.globalAlpha = 1 - detail;
  drawExpression(ctx, read);
  ctx.restore();
  text(ctx, 'position', left - 36, 266, 40, '#65596c', 'Mono', 'right');
  for (let c = 0; c < width; c++) {
    ctx.save();
    ctx.globalAlpha = 1 - detail;
    text(ctx, String(c), left + c * pitch + tileW / 2, 266, 40, c === width - 1 && read ? orange : ink, 'Mono', 'center');
    ctx.restore();
  }
  if (detail) {
    ctx.save();
    ctx.globalAlpha = detail;
    text(ctx, 'position ' + (width - 1), left + (width - 1) * pitch + tileW / 2, 266, 34, orange, 'Mono', 'center');
    ctx.restore();
  }
  for (const [r, y] of rowsY.entries()) {
    rowGlyph(ctx, r, y);
    const order = r === 0 ? [2, 3, 0, 1] : [0, 1, 2, 3];
    for (const c of order) {
      const word = layouts[0].rows[r][c];
      const bit = layouts[0].masks[r][c];
      let column = c, dy = 0, opacity = 1, land = 1;
      if (r === 0) {
        column += (bit ? padCount : -shortLength) * repack;
        if (!bit) {
          land = index === 0 ? smooth((elapsed - (c - shortLength) * 0.68) / 2.15) : 1;
          dy = -142 * Math.sin(repack * Math.PI);
          opacity = 1 - 0.74 * Math.sin(repack * Math.PI);
        }
      }
      ctx.save();
      ctx.globalAlpha = opacity * (r === 0 && column === width - 1 ? 1 : 1 - detail);
      const x = left + column * pitch;
      if (land < 1) {
        ctx.fillStyle = '#c9bba9';
        ctx.fillRect(x, y, tileW, tileH);
        ctx.fillStyle = '#a89a8a';
        ctx.fillRect(x, y, tileW, 8);
        ctx.translate(0, y + tileH);
        ctx.scale(1, 0.06 + 0.94 * land);
        ctx.translate(0, -y - tileH);
      }
      tile(ctx, word, bit, x, y + dy, mask);
      ctx.restore();
    }
    if (mask) {
      ctx.save();
      ctx.globalAlpha = mask;
      text(ctx, 'mask', left - 41, y + tileH + 42, 41, '#665d57', 'Mono', 'right');
      ctx.restore();
    }
  }
  slice(ctx, read, detail);
  if (firstPick) {
    ctx.save();
    ctx.globalAlpha = firstPick * (1 - detail);
    text(ctx, 'next token', 1494, 266, 43, ink, 'Mono');
    ctx.restore();
    pick(ctx, picks[index === 5 ? 1 : 0][0], rowsY[0], shortPick);
    pick(ctx, picks[0][1], rowsY[1], firstPick * (1 - detail));
  }
  if (detail) showScores(ctx, index === 5 ? 1 : 0, detail);
  ctx.restore();
}

export default { title, beats, draw, check };

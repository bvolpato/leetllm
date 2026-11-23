import assert from 'node:assert/strict';
import { SCORES, VALUES } from '../../../films/flash-attention/fixtures.mjs';
import { summarize, merge } from '../../../films/flash-attention/model.mjs';

const title = 'FlashAttention: The shape of one row';
const beats = [
  {
    id: 'two-slots',
    say: 'The second score lands. Both slots are full, and the query, test, still has to score its own key. What can we keep when we clear these slots?',
    hold: 1.0,
  },
  {
    id: 'read-the-print',
    say: 'Each piece of ink belongs to one key. Read their heights. Fix has a value of ten. This has a value of twenty. Width tells us how much weight each key gets.',
    hold: 0.6,
  },
  {
    id: 'width',
    say: 'Two is the highest score. Subtract it from each score, then exponentiate. The second key gets a width of one. The first gets a little over a third.',
    hold: 0.85,
  },
  {
    id: 'save-the-ink',
    say: 'Watch the low spot fill. We can level the ink and keep every drop. Its area is the sum of weight times value. Its width is the total weight.',
    hold: 1.0,
  },
  {
    id: 'wipe',
    say: 'Save the area, the width, and the reference score. Now wipe the scores. We can use these same slots for the next tile.',
    hold: 0.85,
  },
  {
    id: 'higher-score',
    say: 'Here comes the last key. Test scores three. If we measure the old weights from three now, which way should the blue edge move?',
    hold: 1.75,
  },
  {
    id: 'squeeze',
    say: 'Follow the right edge. Every old weight shrinks by the same factor, e to the power of two minus three. Width and area shrink together. Their ratio, the height, stays put.',
    hold: 1.15,
  },
  {
    id: 'last-key',
    say: 'Give test its ink. Three minus three is zero, so its weight is one. Its value is forty. Where will the ink settle this time?',
    hold: 1.5,
  },
  {
    id: 'level',
    say: 'Watch the low side fill. Total area divided by total width gives us the height, about thirty-two point four. Full-row softmax lands right there too.',
    hold: 1.0,
  },
  {
    id: 'write',
    say: 'All three keys contributed. FlashAttention can write this one result to GPU memory and reuse the tile. It never had to store the full table of scores or probabilities there.',
    hold: 2.4,
  },
];

// Show one scalar value coordinate of the query-resident forward pass.
const first = summarize(SCORES.slice(0, 2), VALUES.slice(0, 2));
const last = summarize(SCORES.slice(2), VALUES.slice(2));
const full = merge(first, last);
const factor = Math.exp(first.m - full.m);
const weights = SCORES.slice(0, 2).map((score) => Math.exp(score - first.m));
const oldHeight = first.u / first.l;
const output = full.u / full.l;
const denseDenominator = SCORES.reduce((sum, score) => sum + Math.exp(score), 0);
const dense = VALUES.reduce(
  (sum, value, i) => sum + (value * Math.exp(SCORES[i])) / denseDenominator,
  0,
);

// The high piece gives up exactly the area that spreads over the low one.
function levelInk(leftWidth, low, rightWidth, high, progress) {
  const average = (leftWidth * low + rightWidth * high) / (leftWidth + rightWidth);
  const reach = Math.sqrt(progress);
  return {
    tongueWidth: leftWidth * reach,
    tongueHeight: (average - low) * reach,
    rightHeight: high + (average - high) * progress,
  };
}

function check() {
  const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-10, `Expected ${a} to match ${b}`);
  assert.deepEqual([...SCORES], [1, 2, 3]);
  assert.deepEqual([...VALUES], [10, 20, 40]);
  close(first.l * factor, Math.exp(-2) + Math.exp(-1));
  close(first.u * factor, VALUES[0] * Math.exp(-2) + VALUES[1] * Math.exp(-1));
  close((first.u * factor) / (first.l * factor), oldHeight);
  close(output, dense);
  assert.equal(output.toFixed(3), '32.405');
  for (const [wl, lo, wr, hi] of [
    [weights[0], VALUES[0], weights[1], VALUES[1]],
    [first.l * factor, oldHeight, last.l, last.u / last.l],
  ]) {
    for (const p of [0, 0.1, 0.5, 0.9, 1]) {
      const { tongueWidth, tongueHeight, rightHeight } = levelInk(wl, lo, wr, hi, p);
      close(wl * lo + tongueWidth * tongueHeight + wr * rightHeight, wl * lo + wr * hi);
      if (p === 1) close(lo + tongueHeight, rightHeight);
    }
  }
}

const paper = '#f6f0df',
  ink = '#222a38',
  muted = '#555e69';
const blue = '#234bab',
  lightBlue = '#456cb7',
  orange = '#d35225';
const x0 = 270,
  floor = 782,
  unitW = 920,
  unitH = 11.9;
const X = (w) => x0 + w * unitW;
const Y = (h) => floor - h * unitH;
const fmt = (n) => n.toFixed(3);
const clamp = (x) => Math.min(1, Math.max(0, x));
const ease = (x) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};

function text(
  ctx,
  s,
  x,
  y,
  size,
  { color = ink, face = 'Sans', align = 'left', bold = false } = {},
) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? 'bold' : 'normal'} ${size}px "Lesson ${face}"`;
  ctx.textAlign = align;
  ctx.fillText(s, x, y);
}
function line(ctx, x, y, endX, endY, color, weight = 2, dash = []) {
  ctx.beginPath();
  ctx.setLineDash(dash);
  ctx.strokeStyle = color;
  ctx.lineWidth = weight;
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.setLineDash([]);
}
function fade(ctx, alpha, draw) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  draw();
  ctx.restore();
}

// A fine screen of unprinted dots follows the page through every change of shape.
let inkScreen;
function screen(ctx) {
  if (inkScreen) return inkScreen;
  const sheet = new ctx.canvas.constructor(96, 96);
  const c = sheet.getContext('2d');
  for (let i = 0; i < 12; i++) {
    for (let j = 0; j < 12; j++) {
      const seed = (i * 13 + j * 31 + i * j * 17) % 29;
      c.fillStyle = `rgba(255,251,225,${0.07 + seed / 230})`;
      c.beginPath();
      c.arc(i * 8 + 2 + (j % 2) * 3, j * 8 + 3, 0.8 + seed / 20, 0, Math.PI * 2);
      c.fill();
    }
  }
  inkScreen = ctx.createPattern(sheet, 'repeat');
  return inkScreen;
}
function slab(ctx, start, bottom, width, height, color) {
  if (width <= 0 || height <= 0) return;
  const x = X(start),
    y = Y(bottom + height),
    w = width * unitW,
    h = height * unitH;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = screen(ctx);
  ctx.fillRect(x, y, w, h);
}

function slot(ctx, x, word, score, strength, color) {
  const w = 239,
    y = 103,
    h = 85;
  ctx.fillStyle = '#e9e5d7';
  ctx.fillRect(x, y, w, h);
  line(ctx, x, y + h, x + w, y + h, muted, 2);
  for (let i = 0; i < w - 11; i += 17)
    line(ctx, x + i + 5, y + h - 6, x + i + 12, y + h - 15, '#c8c4ba', 2);
  if (!strength) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const top = y - (1 - strength) * h;
  ctx.fillStyle = color;
  ctx.fillRect(x, top, w, h);
  text(ctx, word, x + 21, top + 57, 36, { color: paper, face: 'Mono' });
  text(ctx, String(score), x + w - 20, top + 60, 49, {
    color: paper,
    face: 'Mono',
    align: 'right',
  });
  ctx.restore();
}

function ruler(ctx) {
  text(ctx, 'Value', x0 - 36, Y(40) - 37, 35, { align: 'right', color: muted });
  for (let v = 0; v <= 40; v += 5) {
    const y = Y(v);
    if (v % 10 === 0) {
      line(ctx, x0 - 14, y, 1770, y, '#c5c4b8', 1.7);
      text(ctx, String(v), x0 - 37, y + 12, 36, { face: 'Mono', align: 'right', color: muted });
    } else line(ctx, x0 - 8, y, x0 + 4, y, muted);
  }
  line(ctx, x0 - 1, Y(40) - 12, x0 - 1, floor + 2, '#92958f');
}
function dimension(ctx, start, width, label, color = ink) {
  if (width <= 0) return;
  const x = X(start),
    right = X(start + width),
    y = floor + 32;
  line(ctx, x + 2, y, right - 2, y, color, 2.4);
  line(ctx, x + 2, y - 9, x + 2, y + 9, color, 2.4);
  line(ctx, right - 2, y - 9, right - 2, y + 9, color, 2.4);
  text(ctx, label, (x + right) / 2, y + 54, 38, { face: 'Mono', align: 'center', color });
}
function levelPair(ctx, leftWidth, low, rightWidth, high, progress, leftInk, rightInk) {
  const s = levelInk(leftWidth, low, rightWidth, high, progress);
  slab(ctx, 0, 0, leftWidth, low, leftInk);
  slab(ctx, leftWidth - s.tongueWidth, low, s.tongueWidth, s.tongueHeight, rightInk);
  slab(ctx, leftWidth, 0, rightWidth, s.rightHeight, rightInk);
}

function draw(ctx, clock) {
  const { index: i, elapsed, reveal } = clock;
  const cue = (phrase, span) => ease(reveal(phrase, span));
  const second = i === 0 ? ease((elapsed + 0.06) / 1.4) : 1;
  const flat = i < 3 ? 0 : i === 3 ? ease(elapsed / 2.4) : 1;
  const wipe = i < 4 ? 0 : i === 4 ? cue('Now wipe', 0.95) : 1;
  const third = i < 5 ? 0 : i === 5 ? ease(elapsed / 0.75) : 1;
  const squeeze = i < 6 ? 0 : i === 6 ? ease(elapsed / 2.1) : 1;
  const append = i < 7 ? 0 : i === 7 ? ease(elapsed / 1.1) : 1;
  const settle = i < 8 ? 0 : i === 8 ? ease(elapsed / 2.45) : 1;
  const compare = i < 8 ? 0 : i === 8 ? cue('Full-row softmax', 0.7) : 1;
  const write = i === 9 ? cue('write this one result', 0.9) : 0;
  const mergedLabel = i < 3 ? 0 : i === 3 ? ease((elapsed - 2.45) / 0.55) : 1;
  const finalLabel = i < 8 ? 0 : i === 8 ? ease((elapsed - 2.45) / 0.55) : 1;
  const oldWidth = first.l * Math.exp((first.m - full.m) * squeeze);
  const oldArea = oldWidth * oldHeight;
  const originY = Y(oldHeight);

  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, 1920, 1080);
  // The header follows the two reusable score slots. The print below follows one row.
  text(ctx, 'Prompt', 128, 88, 35, { color: muted });
  text(ctx, 'fix this ', 128, 170, 72, { face: 'Serif', color: muted });
  const queryX = 128 + ctx.measureText('fix this ').width;
  text(ctx, 'Query', queryX, 88, 35);
  text(ctx, 'test', queryX, 170, 72, { face: 'Serif' });
  line(ctx, queryX, 182, queryX + ctx.measureText('test').width, 182, ink, 5);
  const maxVisible = i < 2 ? 0 : i === 2 ? cue('Two is the highest score', 0.5) : 1;
  fade(ctx, maxVisible, () => {
    text(ctx, 'Reference score', 562, 93, 35, { color: muted });
    const ref = squeeze > 0 && squeeze < 1 ? '2 → 3' : String(squeeze === 1 ? full.m : first.m);
    text(ctx, ref, 557, 178, 76, { face: 'Mono' });
  });
  fade(ctx, 1 - clamp(write * 2), () => {
    text(ctx, 'On-chip score tile', 1295, 83, 36, { color: muted });
    slot(ctx, 1295, 'fix', SCORES[0], 1 - wipe, lightBlue);
    slot(ctx, 1546, 'this', SCORES[1], second * (1 - wipe), blue);
    if (third > 0) slot(ctx, 1295, 'test', SCORES[2], third, orange);
  });
  fade(ctx, clamp(write * 2 - 1), () => {
    text(ctx, 'Output in GPU memory', 1295, 83, 36, { color: muted });
    ctx.fillStyle = ink;
    ctx.fillRect(1295, 103, 490, 85);
    text(ctx, 'test', 1320, 159, 36, { face: 'Mono', color: paper });
    text(ctx, fmt(output), 1763, 162, 49, { face: 'Mono', color: paper, align: 'right' });
  });
  line(ctx, 128, 218, 1785, 218, '#919691');
  ruler(ctx);

  if (i < 4) {
    const w0 = weights[0],
      w1 = weights[1] * second;
    levelPair(ctx, w0, VALUES[0], w1, VALUES[1], flat, lightBlue, blue);
    if (flat < 1) {
      fade(ctx, 1 - flat, () =>
        text(ctx, 'fix', X(weights[0] / 2), Y(VALUES[0]) - 24, 49, {
          face: 'Serif',
          align: 'center',
          color: blue,
        }),
      );
      fade(ctx, second * (1 - flat), () =>
        text(ctx, 'this', X(weights[0] + weights[1] / 2), Y(VALUES[1]) - 24, 49, {
          face: 'Serif',
          align: 'center',
          color: blue,
        }),
      );
      if (i === 1) {
        const heightMark = (w, value, opacity) =>
          fade(ctx, opacity, () => {
            const x = X(w),
              y = Y(value);
            line(ctx, x, y + 4, x, floor - 4, paper, 3);
            line(ctx, x - 9, y + 4, x + 9, y + 4, paper, 3);
            line(ctx, x - 9, floor - 4, x + 9, floor - 4, paper, 3);
            text(ctx, String(value), x + 20, (y + floor) / 2 + 15, 44, {
              color: paper,
              face: 'Mono',
            });
          });
        heightMark(0.06, VALUES[0], cue('Read their heights', 0.5));
        heightMark(weights[0] + 0.06, VALUES[1], cue('This has a value', 0.5));
      }
      if (i >= 1)
        fade(ctx, 1 - flat, () => {
          text(ctx, 'Weight', x0 - 35, floor + 86, 33, { color: muted, align: 'right' });
          dimension(ctx, 0, weights[0], fmt(weights[0]));
          dimension(ctx, weights[0], weights[1], '1');
        });
    }
    if (i === 2)
      fade(ctx, cue('then exponentiate', 0.6), () => {
        text(ctx, 'exp(1 − 2)', X(weights[0] / 2), Y(VALUES[0] / 2) + 11, 32, {
          face: 'Mono',
          align: 'center',
          color: paper,
        });
        text(ctx, 'exp(2 − 2)', X(weights[0] + weights[1] / 2), Y(VALUES[1] / 2) + 11, 37, {
          face: 'Mono',
          align: 'center',
          color: paper,
        });
      });
    // The shared silhouette is the retained statistic. The internal boundary can disappear.
    fade(ctx, mergedLabel, () => slab(ctx, 0, 0, first.l, oldHeight, blue));
  } else if (append === 0) {
    slab(ctx, 0, 0, oldWidth, oldHeight, blue);
  } else {
    levelPair(ctx, oldWidth, oldHeight, last.l * append, last.u / last.l, settle, blue, orange);
  }

  if (flat > 0 && append < 1)
    fade(ctx, mergedLabel * (1 - append), () => {
      text(ctx, `area ${fmt(oldArea)}`, X(oldWidth / 2), Y(oldHeight / 2) + 15, 46, {
        align: 'center',
        color: paper,
        face: 'Mono',
      });
      dimension(ctx, 0, oldWidth, `width ${fmt(oldWidth)}`);
    });
  if (i >= 5 && append < 1)
    fade(ctx, third * (1 - append), () => {
      text(ctx, '≈ ' + oldHeight.toFixed(2), x0 + 12, originY - 19, 49, {
        color: blue,
        bold: true,
      });
    });
  if (squeeze > 0 && append < 1)
    fade(ctx, squeeze * (1 - append), () => {
      // This outline has the old width and the same top as the squeezed print.
      line(ctx, X(oldWidth) + 2, originY, X(first.l), originY, blue, 3, [10, 10]);
      line(ctx, X(first.l), originY, X(first.l), floor, blue, 3, [10, 10]);
      if (squeeze === 1) {
        const a = X(oldWidth) + 22,
          b = X(first.l) - 20,
          y = originY + 130;
        line(ctx, a, y, b, y, blue, 3);
        line(ctx, a, y, a + 16, y - 10, blue, 3);
        line(ctx, a, y, a + 16, y + 10, blue, 3);
        text(ctx, '× ' + fmt(factor), (a + b) / 2, y - 24, 50, {
          face: 'Mono',
          color: blue,
          align: 'center',
        });
      }
    });
  if (append > 0) {
    fade(ctx, append * (1 - settle), () => {
      text(ctx, 'test', X(oldWidth + last.l / 2), Y(VALUES[2]) - 21, 52, {
        face: 'Serif',
        align: 'center',
        color: orange,
      });
      dimension(ctx, 0, oldWidth, fmt(oldWidth), blue);
      dimension(ctx, oldWidth, last.l, '1', orange);
    });
    fade(ctx, finalLabel, () => {
      text(ctx, `area ${fmt(full.u)}`, X(oldWidth + last.l / 2), Y(output / 2) + 15, 47, {
        color: paper,
        face: 'Mono',
        align: 'center',
      });
      dimension(ctx, 0, full.l, `width ${fmt(full.l)}`);
      text(ctx, `≈ ${fmt(output)}`, x0 + 12, Y(output) - 21, 57, { bold: true });
    });
    fade(ctx, compare, () => {
      const y = Y(dense);
      line(ctx, X(full.l) + 1, y, 1790, y, ink, 3.5, [8, 7]);
      text(ctx, 'Full-row softmax', 1775, y - 29, 38, { align: 'right' });
    });
  }
  line(ctx, x0, floor + 1.5, 1770, floor + 1.5, '#4c5360', 3);
}

export default { title, beats, draw, check };

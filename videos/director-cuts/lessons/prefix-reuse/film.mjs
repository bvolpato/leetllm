import assert from 'node:assert/strict';
import { commonPrefix, reusableTokens } from '../../../films/prefix-reuse/arithmetic.mjs';
import { requestTokens, storedTokens } from '../../../films/prefix-reuse/fixtures.mjs';

const beats = [
  {
    id: 'the-middle-block',
    say: 'Watch the third token come in. Twenty. Now look one block to the right. Both requests say five, six, seven, eight. Could the new request use that middle block?',
    hold: 1.4,
  },
  {
    id: 'inside-the-block',
    say: 'These blue sheets hold keys and values from the earlier request. We’re looking at one head in a tiny example model. Each token gets a column in each sheet. This worker shares the state across layers in blocks of four tokens.',
    hold: 0.6,
  },
  {
    id: 'different-history',
    say: 'Look under the five. A fresh pair is forming there too. At this deeper layer, five already carries information from earlier tokens, including that twenty. The worker has to process all twelve inputs.',
    hold: 1.2,
  },
  {
    id: 'one-correction',
    say: 'Try the lookup again against the same blue blocks. Same session, same model settings. Change twenty back to three. Run your eye along the two rows. Where do they first disagree?',
    hold: 1.4,
  },
  {
    id: 'shared-pages',
    say: 'Follow the orange line. It picks up the first block, then the second. Both requests now point to the same two blocks. The second request skips the input work for those eight tokens. Look at the two nines. Which block do they belong to?',
    hold: 1.2,
  },
  {
    id: 'the-ninth-token',
    say: 'Nine sits beside thirteen in the new request. The worker needs a whole matching block to reuse it. Fresh work starts at nine. Those four tokens can attend to all eight cached positions. Once the model has processed the four, it can generate the next token.',
    hold: 2.4,
  },
];

const blockSize = 4;
const edited = requestTokens.map((id, i) => (i === 2 ? 20 : id));
const clamp = (value) => Math.max(0, Math.min(1, value));
const ease = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;

// A four-component toy attention head. A fixed positional attention bias gives
// the third position extra weight. The next layer projects the resulting states.
function attentionSheets(ids) {
  const vectors = ids.map((id) => [1, 2, 3, 4].map((d) => Math.sin(id * (d + 0.7))));
  return vectors.map((vector, i) => {
    const earlier = vectors.slice(0, i + 1);
    const weights = earlier.map((_, j) => Math.exp(j === 2 ? 2 : 0));
    const total = weights.reduce((sum, w) => sum + w, 0);
    const state = vector.map(
      (v, d) => v + earlier.reduce((sum, row, j) => sum + weights[j] * row[d], 0) / total,
    );
    const [a, b, c, d] = state;
    return { K: [a, c, -b, d], V: [(a + b) / 2, d, (a - c) / 2, -b] };
  });
}

function lookup(ids) {
  const reused = reusableTokens(storedTokens, ids, blockSize);
  const fresh = ids.length - reused;
  return {
    ids,
    sheets: attentionSheets(ids),
    exact: commonPrefix(storedTokens, ids),
    reused,
    fresh,
  };
}
const stored = { ids: storedTokens, sheets: attentionSheets(storedTokens) };
const miss = lookup(edited);
const hit = lookup(requestTokens);

function check() {
  assert.deepEqual([miss.exact, miss.reused, miss.fresh], [2, 0, 12]);
  assert.deepEqual([hit.exact, hit.reused, hit.fresh], [9, 8, 4]);
  assert.deepEqual(stored.sheets.slice(0, 9), hit.sheets.slice(0, 9));
  assert.notDeepEqual(stored.sheets[9], hit.sheets[9]);
  assert.equal(stored.ids[4], miss.ids[4]);
  assert.notDeepEqual(stored.sheets[4], miss.sheets[4]);
  assert.equal(edited[2], 20);
  assert.equal(requestTokens[2], 3);
  assert.equal(requestTokens[hit.reused], 9);
}

const ink = '#262443';
const blue = '#4743aa';
const orange = '#b34326';
const ground = '#f6f3f8';
const left = 195;
const pitch = 553;
const width = 446;
const stride = width / blockSize;
const upper = 231;
const lower = 596;
const groups = stored.ids.length / blockSize;

function label(ctx, value, x, y, size, color = ink, face = 'Sans', align = 'left', weight = 400) {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(String(value), x, y);
}

function polygon(ctx, points, fill) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function line(ctx, points, color, thickness) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.stroke();
}

const coldPigment = ['#e6e4f9', '#bfc0f0', '#9798e1', '#7477d0', '#5056b6', '#373e98', '#292b75'];
const warmPigment = ['#ffe4ce', '#ffc79e', '#f4a775', '#df865b', '#cc6646', '#ad4d35', '#813624'];

function sheetColor(value, warm) {
  const palette = warm ? warmPigment : coldPigment;
  const fraction = clamp((value + 2) / 4);
  return palette[Math.round(fraction * (palette.length - 1))];
}

// One sheared plane has one vector per token column. K and V use separate planes.
function sheet(ctx, x, y, columns, field, warm, filled) {
  const h = 59;
  const bevel = 10;
  const skew = 27;
  const front = warm ? '#a4442e' : '#43458b';
  const side = warm ? '#cc6747' : '#6868af';
  ctx.save();
  ctx.translate(x, y);
  const opacity = ctx.globalAlpha;
  polygon(
    ctx,
    [
      [0, h],
      [width, h],
      [width, h + bevel],
      [0, h + bevel],
    ],
    front,
  );
  polygon(
    ctx,
    [
      [width, h],
      [width + skew, 0],
      [width + skew, bevel],
      [width, h + bevel],
    ],
    side,
  );
  ctx.transform(1, 0, -skew / h, 1, skew, 0);
  ctx.fillStyle = warm ? '#f4c0a6' : '#b1aeda';
  ctx.fillRect(0, 0, width, h);
  for (let col = 0; col < columns.length; col++) {
    const intensity = ease(filled - col);
    for (let row = 0; row < 4; row++) {
      ctx.globalAlpha = opacity * intensity;
      ctx.fillStyle = sheetColor(columns[col][field][row], warm);
      ctx.fillRect(col * stride + 2, (row * h) / 4 + 0.9, stride - 4, h / 4 - 1.8);
    }
  }
  ctx.globalAlpha = opacity * 0.74;
  line(
    ctx,
    [
      [0, 0],
      [width, 0],
    ],
    '#ffffff',
    3,
  );
  ctx.restore();
}

function plate(ctx, x, y, columns, warm, fill, spread) {
  if (fill <= 0) return;
  ctx.save();
  ctx.globalAlpha *= ease(fill * 2);
  const gap = 18 + 22 * spread;
  const kTop = 66 - gap / 2;
  const vTop = 132 + gap / 2;
  // These four hairlines keep the columns registered while the two planes separate.
  for (let col = 0; col <= blockSize; col++) {
    line(
      ctx,
      [
        [x + col * stride + 1, y + kTop + 65],
        [x + col * stride + 28, y + vTop],
      ],
      warm ? '#e3b09c' : '#b8b5d6',
      2,
    );
  }
  sheet(ctx, x, y + vTop, columns, 'V', warm, fill);
  sheet(ctx, x, y + kTop, columns, 'K', warm, fill);
  ctx.restore();
}

function idStrip(ctx, ids, x, y, warm, focus, changedIndex, flip) {
  const color = warm ? orange : blue;
  ctx.save();
  const base = warm ? '#f9e8df' : '#e5e3f5';
  polygon(
    ctx,
    [
      [x + 9, y - 8],
      [x + width + 9, y - 8],
      [x + width, y + 45],
      [x, y + 45],
    ],
    base,
  );
  line(
    ctx,
    [
      [x, y + 45],
      [x + width, y + 45],
    ],
    warm ? '#d6a68f' : '#b0abcf',
    2.5,
  );
  ids.forEach((id, col) => {
    const cx = x + stride * (col + 0.5) + 5;
    if (focus === col) {
      ctx.beginPath();
      ctx.roundRect(cx - 43, y - 8, 86, 53, 13);
      ctx.fillStyle = color;
      ctx.fill();
    }
    ctx.save();
    if (changedIndex === col) {
      ctx.translate(0, -48 * (1 - flip));
      ctx.globalAlpha *= flip;
    }
    label(ctx, id, cx, y + 18, 47, focus === col ? '#ffffff' : ink, 'Mono', 'center', 500);
    ctx.restore();
  });
  ctx.restore();
}

function route(ctx, ys, color, thickness) {
  ctx.beginPath();
  // The entry and exit stay fixed while the middle segments follow their blocks.
  const start = color === blue ? upper + 217 : lower + 226;
  ctx.moveTo(55, start);
  ctx.bezierCurveTo(85, start, 57, ys[0], 116, ys[0]);
  ctx.lineTo(left, ys[0]);
  for (let b = 0; b < groups; b++) {
    const end = left + b * pitch + width;
    ctx.lineTo(end, ys[b]);
    if (b + 1 < groups) {
      const next = left + (b + 1) * pitch;
      ctx.bezierCurveTo(end + 65, ys[b], next - 65, ys[b + 1], next, ys[b + 1]);
    }
  }
  ctx.lineTo(1832, ys[groups - 1]);
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(55, start, thickness, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function bracket(ctx, from, to, y, text, color) {
  line(
    ctx,
    [
      [from, y - 11],
      [from, y],
      [to, y],
      [to, y - 11],
    ],
    color,
    2.5,
  );
  label(ctx, text, (from + to) / 2, y + 38, 44, color, 'Serif', 'center');
}

function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  const background = ctx.createLinearGradient(0, 0, 680, 1080);
  background.addColorStop(0, '#fdfcf8');
  background.addColorStop(0.64, ground);
  background.addColorStop(1, '#ece9f3');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 1920, 1080);

  const correction =
    index === 3 ? ease(reveal('Change twenty back to three', 0.9)) : Number(index > 3);
  const trial = correction > 0.48 ? hit : miss;
  const sharing = Array.from({ length: groups }, (_, b) => {
    if (b * blockSize >= trial.reused || index < 4) return 0;
    if (index > 4) return 1;
    const start = b === 0 ? 0 : 2.05;
    return ease((elapsed - start) / 1.25);
  });
  const incomingY = sharing.map((shared) => mix(lower, upper, shared));
  const initialBuild = index === 2 ? clamp(elapsed / 1.65) : Number(index > 2);
  const clear = index === 3 ? ease(elapsed / 0.8) : Number(index > 3);
  const suffixBuild =
    index === 5
      ? (ease(elapsed / 0.85) + (blockSize - 1) * ease(reveal('The worker needs', 2.2))) / blockSize
      : 0;
  const spread =
    index === 1
      ? ease(reveal('keys and values', 0.75)) * (1 - ease(reveal('This worker', 0.8)))
      : 0;
  const columnFocus =
    index === 1
      ? ease(reveal('Each token gets a column', 0.55)) * (1 - ease(reveal('This worker', 0.7)))
      : 0;
  let arrive = 1;
  if (index === 0) arrive = ease(elapsed / 1.05);
  if (index === 3) arrive = clamp(Math.abs(correction - 0.48) / 0.48);
  const thirdFocus =
    (index === 0 && reveal('Now look', 0.6) < 0.5) ||
    (index === 3 && correction > 0.1 && reveal('Run your eye', 0.75) < 0.6);
  const middleFocus = index === 0 ? ease(reveal('one block to the right', 0.5)) : 0;
  const nines = index === 4 ? reveal('Look at the two nines', 0.35) > 0.45 : index === 5;
  const different = index === 3 && reveal('first disagree', 0.5) > 0.5;

  // Begin close enough to compare the edit with the next four IDs. Pull back
  // for the full prefill, then keep the camera fixed through the second lookup.
  const close = index < 2 ? 1 : index === 2 ? 1 - ease(elapsed / 1.85) : 0;
  const zoom = 1 + 0.53 * close;
  if (close < 0.99) {
    ctx.save();
    ctx.globalAlpha = 1 - close;
    label(ctx, 'Worker memory', 94, 95, 69, ink, 'Serif');
    label(ctx, '4 tokens per block', 1810, 101, 37, ink, 'Mono', 'right');
    ctx.restore();
  }
  ctx.save();
  ctx.translate(94 * (1 - zoom), -134 * close);
  ctx.scale(zoom, zoom);
  label(ctx, 'Cached request', 95, 196, 40, blue, 'Sans', 'left', 600);
  label(ctx, 'New request', 108, 559, 40, orange, 'Sans', 'left', 600);

  route(ctx, Array(groups).fill(upper + 217), blue, 6);
  route(
    ctx,
    incomingY.map((y) => y + 226),
    orange,
    8,
  );
  for (let b = 0; b < groups; b++) {
    const from = b * blockSize;
    const to = from + blockSize;
    const x = left + b * pitch;
    const selected = nines && b === 2 ? 0 : different && b === 2 ? 1 : -1;
    plate(ctx, x, upper, stored.sheets.slice(from, to), false, blockSize, spread);
    idStrip(ctx, stored.ids.slice(from, to), x, upper, false, selected, -1, 1);

    if (b === 1 && columnFocus > 0) {
      ctx.save();
      ctx.globalAlpha = columnFocus;
      const gap = 18 + 22 * spread;
      for (const top of [upper + 66 - gap / 2, upper + 132 + gap / 2]) {
        line(
          ctx,
          [
            [x, top + 59],
            [x + 27, top],
            [x + stride + 27, top],
            [x + stride, top + 59],
            [x, top + 59],
          ],
          ink,
          5,
        );
      }
      ctx.restore();
    }
    const y = incomingY[b];
    ctx.save();
    ctx.globalAlpha *= 1 - ease(sharing[b]);
    const grow = clamp(initialBuild * groups - b) * (1 - clear);
    const fill = b * blockSize >= trial.reused ? Math.max(grow, suffixBuild) * blockSize : 0;
    plate(ctx, x, y, trial.sheets.slice(from, to), true, fill, 0);
    const incomingFocus = b === 0 && thirdFocus ? 2 : selected;
    idStrip(ctx, trial.ids.slice(from, to), x, y, true, incomingFocus, b === 0 ? 2 : -1, arrive);
    ctx.restore();
    if (b === 1 && middleFocus > 0) {
      ctx.save();
      ctx.globalAlpha = middleFocus;
      line(
        ctx,
        [
          [x + 3, lower + 55],
          [x + width, lower + 55],
        ],
        orange,
        5,
      );
      ctx.restore();
    }
  }
  label(ctx, 'K', left - 43, upper + 86 - 11 * spread, 39, blue, 'Mono', 'center');
  label(ctx, 'V', left - 43, upper + 174 + 11 * spread, 39, blue, 'Mono', 'center');

  const shownBuild = index === 2 ? ease((elapsed - 1.7) / 0.6) : index === 3 ? 1 - clear : 0;
  const shownSuffix = index === 5 ? ease((suffixBuild - 0.98) / 0.02) : 0;
  const right = left + (groups - 1) * pitch + width;
  if (shownBuild > 0 || shownSuffix > 0) {
    const result = shownBuild > 0 ? miss : hit;
    ctx.save();
    ctx.globalAlpha = Math.max(shownBuild, shownSuffix);
    bracket(
      ctx,
      left + (result.reused / blockSize) * pitch,
      right,
      857,
      result.fresh + ' fresh tokens',
      orange,
    );
    ctx.restore();
  }
  if (index >= 4 && sharing[1] > 0) {
    ctx.save();
    ctx.globalAlpha = sharing[1];
    bracket(
      ctx,
      left + 5,
      left + (hit.reused / blockSize - 1) * pitch + width,
      upper + 257,
      hit.reused + ' tokens reused',
      blue,
    );
    ctx.restore();
  }
  ctx.restore();
}

export default { title: 'Why token nine runs again', beats, draw, check };

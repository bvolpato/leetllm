import assert from 'node:assert/strict';

const beats = [
  {
    id: 'three-twos',
    say: 'Watch the bottom row. Three twos disappear from the labels. The input above stays put. Which of those twos came from the reply?',
    hold: 1.1,
  },
  {
    id: 'reply',
    say: 'Look a little further left. This example shows how to answer a question about an old service key. Open and ticket stand for the words in the approved reply. The two just after ticket marks the end of the turn.',
    hold: 0.7,
  },
  {
    id: 'padding',
    say: 'The batch builder needed two more places. Here’s where padding starts. Both added places got the same ID as the end token.',
    hold: 0.9,
  },
  {
    id: 'next-token',
    say: 'The model reads the conversation up through open. Follow open down to the right. In supervised fine-tuning, we score that prediction against the next token in the approved reply, ticket. Now start at ticket. What label do we find?',
    hold: 1.4,
  },
  {
    id: 'missing-target',
    say: 'Minus one hundred. The loss function skips that label. Say the model gave the end token an eighty percent chance after ticket. With this mask, that prediction contributes nothing to the loss.',
    hold: 0.7,
  },
  {
    id: 'restore',
    say: 'Use the length recorded before padding. Slide the mask back to that edge. Both padding labels stay covered. Look what’s back under the end of the reply.',
    hold: 1.1,
  },
  {
    id: 'stop',
    say: 'Follow ticket again. The loss now includes the negative log of point eight, about point two two. Giving the end token a lower probability here would cost more. That’s how this reply teaches the model where to stop.',
    hold: 2.8,
  },
];

// The tail of the original T102 teaching row, including its assistant header.
const example = [
  { word: 'assistant', id: 43 },
  { word: 'open', id: 7 },
  { word: 'ticket', id: 8 },
  { word: 'end', id: 2 },
];
const endId = example.at(-1).id;
const padId = endId;
const row = [...example, { word: 'pad', id: padId }, { word: 'pad', id: padId }];
const ignore = -100;
const byId = row.map(({ id }, i) => i === 0 || id === padId ? ignore : id);
const byPosition = row.map(({ id }, i) => i === 0 || i >= example.length ? ignore : id);

function scoredPairs(labels) {
  return labels.flatMap((target, i) => i > 0 && target !== ignore ? [[i - 1, i]] : []);
}

function startOfIgnoredTail(labels) {
  return labels.findLastIndex(label => label !== ignore) + 1;
}

const wrongEdge = startOfIgnoredTail(byId);
const trueEdge = startOfIgnoredTail(byPosition);
const pairs = scoredPairs(byPosition);
const ticketPair = pairs[1];
const stopPair = pairs[2];
const stopProbability = 0.8;
function stopLoss(labels) {
  return labels[stopPair[1]] === ignore ? null : -Math.log(stopProbability);
}

function check() {
  assert.deepEqual(row.map(token => token.id), [43, 7, 8, 2, 2, 2]);
  assert.deepEqual(byId, [ignore, 7, 8, ignore, ignore, ignore]);
  assert.deepEqual(byPosition, [ignore, 7, 8, 2, ignore, ignore]);
  assert.deepEqual(scoredPairs(byId), [[0, 1], [1, 2]]);
  assert.deepEqual(pairs, [[0, 1], [1, 2], [2, 3]]);
  assert.deepEqual([wrongEdge, trueEdge], [3, 4]);
  assert.deepEqual(stopPair.map(i => row[i].word), ['ticket', 'end']);
  assert.equal(stopLoss(byId), null);
  assert.equal(stopLoss(byPosition).toFixed(3), '0.223');
  return true;
}

// The digits are drawn on the same dot grid at both magnifications.
const digits = {
  0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  7: ['11111', '00001', '00010', '00010', '00100', '01000', '01000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
};

const ink = '#302141';
const signal = '#923043';
const muted = '#62585a';
const mix = (a, b, t) => a + (b - a) * t;
function ease(x) {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
}

function label(ctx, str, x, y, size, color, family = 'Sans', align = 'left', weight = 500) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Lesson ${family}"`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function gradient(ctx, x1, y1, x2, y2, stops) {
  const fill = ctx.createLinearGradient(x1, y1, x2, y2);
  stops.forEach(([offset, color]) => fill.addColorStop(offset, color));
  return fill;
}

function screenPath(ctx, x, y, w, h, radius, notch) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - notch, y);
  ctx.lineTo(x + w, y + notch);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function instrument(ctx) {
  // Plum enamel around a single amber display. Its bottom lip leaves room for captions.
  ctx.fillStyle = gradient(ctx, 150, 0, 1560, 1100, [
    [0, '#59466d'], [0.4, '#493453'], [0.78, '#36283f'], [1, '#302338'],
  ]);
  ctx.fillRect(0, 0, 1920, 1080);
  label(ctx, 'Approved reply', 98, 84, 33, '#eddced', 'Sans', 'left', 600);
  label(ctx, 'Open a rotation ticket for security review.', 408, 80, 53, '#fff2e7', 'Serif');

  screenPath(ctx, 48, 147, 1824, 752, 33, 76);
  ctx.fillStyle = gradient(ctx, 0, 147, 0, 899, [
    [0, '#211927'], [0.24, '#322338'], [0.94, '#47344b'], [1, '#aa89b0'],
  ]);
  ctx.fill();
  screenPath(ctx, 61, 161, 1798, 721, 24, 67);
  ctx.fillStyle = gradient(ctx, 225, 161, 1390, 900, [
    [0, '#ffe7a2'], [0.35, '#f8da8d'], [0.75, '#edd296'], [1, '#e1c18b'],
  ]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  // A shallow shadow at the glass edge gives the two rows a common surface.
  ctx.fillStyle = gradient(ctx, 0, 162, 0, 196, [[0, '#71526d65'], [1, '#71526d00']]);
  ctx.fillRect(61, 161, 1798, 36);
  ctx.strokeStyle = '#fff4cd36';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = 164; y < 883; y += 6) {
    ctx.moveTo(62, y);
    ctx.lineTo(1859, y);
  }
  ctx.stroke();
  ctx.restore();
}

function dotNumber(ctx, value, x, y, pitch, pigment) {
  const chars = String(value);
  const left = x - ((6 * chars.length - 1) * pitch) / 2;
  const top = y - 3.5 * pitch;
  for (const on of [false, true]) {
    ctx.fillStyle = on ? pigment : '#6240560e';
    ctx.beginPath();
    for (let c = 0; c < chars.length; c++) {
      digits[chars[c]].forEach((line, r) => {
        for (let col = 0; col < line.length; col++) {
          if ((line[col] === '1') !== on) continue;
          const cx = left + (c * 6 + col + 0.5) * pitch;
          const cy = top + (r + 0.5) * pitch;
          ctx.moveTo(cx + pitch * 0.472, cy);
          ctx.arc(cx, cy, pitch * 0.472, 0, Math.PI * 2);
        }
      });
    }
    ctx.fill();
  }
}

function state(clock) {
  const cue = (beat, phrase, span) => {
    if (clock.index !== beat) return Number(clock.index > beat);
    return ease(clock.reveal(phrase, span));
  };
  const wide = cue(1, 'Look a little further left', 1.6);
  const close = cue(6, 'Follow ticket again', 1.65);
  const pitch = mix(mix(24.8, 13.8, wide), 18.9, close);
  const stride = mix(mix(470, 251, wide), 371, close);
  const origin = mix(mix(613 - 3 * 470, 440, wide), 520 - 2 * 371, close);
  const revealEdge = cue(2, 'Here’s where padding starts', 0.75);
  const repair = cue(5, 'Slide the mask back', 1.25);
  const cover = clock.index === 0 ? ease(clock.elapsed / 1.85) : 1;
  const edgeIndex = mix(row.length + 0.5, mix(wrongEdge, trueEdge, repair) - 0.5, cover);
  return {
    pitch, wide, revealEdge, repair,
    x: i => origin + stride * i,
    edgeX: origin + stride * edgeIndex,
    names: [
      wide, cue(1, 'Open and ticket', 0.5), cue(1, 'Open and ticket', 0.75),
      cue(1, 'The two just after ticket', 0.5), revealEdge, revealEdge,
    ],
    probability: cue(4, 'Say the model gave', 0.55),
    ticketTrace: cue(3, 'Follow open down', 0.85) * (1 - cue(3, 'Now start at ticket', 0.5)),
    stopTrace: cue(3, 'Now start at ticket', 1.0),
  };
}

function mask(ctx, left, right) {
  if (right <= left) return;
  ctx.fillStyle = '#caba92';
  ctx.fillRect(left, 557, right - left, 203);
  ctx.save();
  ctx.beginPath();
  ctx.rect(left, 557, right - left, 203);
  ctx.clip();
  ctx.strokeStyle = '#503a5923';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 70; x < 2150; x += 15) {
    ctx.moveTo(x, 557);
    ctx.lineTo(x - 135, 760);
  }
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#655770';
  ctx.fillRect(left, 557, 4, 203);
  ctx.fillStyle = '#ffedb0';
  ctx.fillRect(left + 4, 557, 3, 203);
}

function ignoreText(ctx, x, size) {
  label(ctx, '−100', x, 654, size, '#534756', 'Mono', 'center');
}

function boundary(ctx, s) {
  const x = s.x(trueEdge - 0.5);
  ctx.save();
  ctx.globalAlpha = s.revealEdge;
  ctx.strokeStyle = '#6e5268';
  ctx.lineWidth = 3;
  ctx.setLineDash([7, 8]);
  ctx.beginPath();
  ctx.moveTo(x, 244);
  ctx.lineTo(x, 758);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#6e5268';
  ctx.beginPath();
  ctx.moveTo(x - 10, 237);
  ctx.lineTo(x + 10, 237);
  ctx.lineTo(x, 252);
  ctx.fill();
  label(ctx, 'Right padding', x + 24, 217, 36, muted, 'Sans', 'left', 600);
  ctx.restore();
}

function prediction(ctx, s, pair, amount, color, ignored) {
  if (amount <= 0) return;
  const x1 = s.x(pair[0]), x2 = s.x(pair[1]);
  const y1 = 384 + s.pitch * 3.5 + 11;
  const y2 = ignored ? 617 : 654 - s.pitch * 3.5 - 10;
  const x = mix(x1, x2, amount), y = mix(y1, y2, amount);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(3, 0);
  ctx.lineTo(-21, -12);
  ctx.lineTo(-21, 12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function draw(ctx, clock) {
  const s = state(clock);
  ctx.save();
  instrument(ctx);
  label(ctx, 'Input IDs', 96, 380, 43, ink, 'Sans', 'left', 600);
  label(ctx, 'Loss labels', 96, 651, 43, ink, 'Sans', 'left', 600);

  ctx.save();
  ctx.beginPath();
  ctx.rect(310, 190, 1511, 603);
  ctx.clip();
  boundary(ctx, s);
  row.forEach(({ word, id }, i) => {
    const x = s.x(i);
    if (x < 200 || x > 1960) return;
    ctx.globalAlpha = s.names[i];
    label(ctx, word, x, 275, 46, ink, 'Mono', 'center');
    ctx.globalAlpha = 1;
    dotNumber(ctx, id, x, 384, s.pitch, ink);
    if (i === 0) ignoreText(ctx, x, 48);
    else dotNumber(ctx, id, x, 654, s.pitch, signal);
  });

  // Only the labels are covered. The input IDs remain readable above the mask.
  const left = Math.max(310, s.edgeX);
  const right = Math.min(1821, s.x(row.length - 0.5));
  mask(ctx, left, right);
  if (right > left) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, 557, right - left, 203);
    ctx.clip();
    row.forEach((_, i) => ignoreText(ctx, s.x(i), s.wide < 1 ? mix(70, 49, s.wide) : 49));
    ctx.restore();
  }
  const stopIgnored = s.edgeX <= s.x(stopPair[1]);
  prediction(ctx, s, ticketPair, s.ticketTrace, signal, false);
  prediction(ctx, s, stopPair, s.stopTrace, stopIgnored ? '#68566a' : signal, stopIgnored);
  ctx.restore();

  ctx.globalAlpha = 1 - s.probability;
  label(ctx, 'Padding rule    Ignore every ID 2', 96, 820, 39, ink, 'Mono');
  ctx.globalAlpha = s.probability;
  label(ctx, 'After ticket', 96, 820, 43, ink, 'Sans', 'left', 600);
  label(ctx, `P(end) = ${stopProbability.toFixed(2)}`, 473, 820, 41, ink, 'Mono');
  const term = stopLoss(stopIgnored ? byId : byPosition);
  const value = term === null ? 'skipped' : `−ln(${stopProbability.toFixed(2)}) = ${term.toFixed(3)}`;
  label(ctx, 'Loss', 1024, 820, 43, ink, 'Sans', 'left', 600);
  label(ctx, value, 1173, 820, 41, term === null ? muted : signal, 'Mono');
  ctx.restore();
}

export default { title: 'Which 2 teaches the model to stop?', beats, draw, check };

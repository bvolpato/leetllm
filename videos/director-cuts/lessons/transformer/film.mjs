import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { CACHE_RUNS } from '../../../films/transformer/model.mjs';
import { VOCAB, WORDS } from '../../../films/transformer/fixtures.mjs';

// The two proof lines and the illuminated values come from the same one-head decoder.
const { full, upperLeft, aligned } = CACHE_RUNS[0];
const title = 'Which mask row belongs to the last word?';
const beats = [
  {
    id: 'two-impressions',
    say: 'Read those two endings. Same three words, same little transformer. Both times it picked the next word with the highest score. What changed its choice?',
    hold: 1.2,
  },
  {
    id: 'the-stencil',
    say: 'Start with the full prompt. Each word makes a query. Follow the cuts. The first query can read one position. The second can read two. This staircase is the causal mask. Each query can look as far as its own word.',
    hold: 0.7,
  },
  {
    id: 'third-row',
    say: 'Follow the lit row for “the.” Light comes through all three openings. Attention compares the query with each visible key. Better matches give their values a bigger share in the mixture.',
    hold: 1.0,
  },
  {
    id: 'full-impression',
    say: 'That mixture updates the last word’s features. The decoder uses those features to score six possible next words. See the tallest mark? That’s how “result” got on the page.',
    hold: 0.7,
  },
  {
    id: 'one-query',
    say: 'Now run just the query for “the.” The cache saved the first two keys and values. Add the pair for “the” and we have all three. This call has just one query.',
    hold: 0.8,
  },
  {
    id: 'wrong-cut',
    say: 'Watch the sheet slip. We used row zero of the mask because the query came in alone. Only “function” comes through. Its value gets the entire weight. Now “None” wins.',
    hold: 0.9,
  },
  {
    id: 'count-back',
    say: 'Keep your eye on “the.” Count from the beginning of the prompt. Zero, one, two. Which cut would let that query read everything up to its own position?',
    hold: 2.0,
  },
  {
    id: 'register',
    say: 'Slide row two into the light. The two missing values contribute again. Look up at the scores. All six marks on the second line match the first. There’s our word.',
    hold: 3.0,
  },
];

const W = 1920;
const H = 1080;
const ink = '#21373e';
const blue = '#114fa5';
const ruby = '#9c1739';
const slots = [674, 1060, 1446];
const readY = 747;
const pitch = 110;
const halfHole = 150;
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => { const t = clamp(x); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

function label(ctx, value, x, y, size, color = ink, face = 'Sans', align = 'left', weight = 400) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Lesson ${face}"`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function rule(ctx, x, y, x2, y2, color, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function gradient(ctx, x1, y1, x2, y2, stops) {
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  for (const [offset, color] of stops) g.addColorStop(offset, color);
  return g;
}

function surfaceTexture() {
  const c = createCanvas(192, 192);
  const ctx = c.getContext('2d');
  let seed = 25;
  function random() {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  for (let i = 0; i < 3200; i++) {
    ctx.fillStyle = random() < 0.5 ? '#ffffff40' : '#34344624';
    ctx.fillRect(random() * 192, random() * 192, 1 + random() * 3, 1);
  }
  return c;
}
const grain = surfaceTexture();

function proofPaper(ctx) {
  // A translucent witness sheet, fixed while the register beneath it travels.
  ctx.save();
  ctx.translate(955, 187);
  ctx.rotate(-0.009);
  const left = -904;
  const right = 904;
  ctx.beginPath();
  ctx.moveTo(left, -151);
  ctx.lineTo(right - 32, -151);
  ctx.lineTo(right, -122);
  ctx.lineTo(right, 134);
  for (let x = right; x >= left; x -= 16) {
    ctx.lineTo(x, 137 + 1.5 * Math.sin(x * 0.21));
  }
  ctx.closePath();
  ctx.fillStyle = gradient(ctx, left, -150, right, 140, [
    [0, '#fffbee'], [0.63, '#f9f2e5'], [1, '#eee5d2'],
  ]);
  ctx.shadowColor = '#1e35443d';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 9;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  rule(ctx, -843, -2, 842, -2, '#b9b3a2', 1.4);
  // Fold at the clipped corner and two strips of translucent mounting tape.
  ctx.beginPath();
  ctx.moveTo(right - 32, -151);
  ctx.lineTo(right - 34, -119);
  ctx.lineTo(right, -122);
  ctx.closePath();
  ctx.fillStyle = '#dfd8c7';
  ctx.fill();
  for (const x of [left + 115, right - 210]) {
    ctx.save();
    ctx.translate(x, -146);
    ctx.rotate(x < 0 ? -0.13 : 0.09);
    ctx.fillStyle = '#ead59962';
    ctx.fillRect(-75, -16, 150, 32);
    rule(ctx, -75, 16, 75, 16, '#a59b7060', 1);
    ctx.restore();
  }
  ctx.restore();
}

function scoreMarks(ctx, logits, x, y, color, selected) {
  const spacing = 38;
  const scale = 26;
  const peak = logits.indexOf(Math.max(...logits));
  rule(ctx, x - 20, y, x + 5 * spacing + 21, y, '#aca99a', 2);
  logits.forEach((v, i) => {
    const px = x + i * spacing;
    const end = y - v * scale;
    rule(ctx, px, y, px, end, i === peak ? color : '#65787d', i === peak ? 10 : 6);
    if (i === peak) {
      ctx.beginPath();
      ctx.arc(px, end, 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      if (selected > 0) {
        ctx.save();
        ctx.globalAlpha = selected;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(px, end, 17, 13, -0.19, 0.14, Math.PI * 2 - 0.11);
        ctx.stroke();
        ctx.restore();
      }
    }
  });
}

function impressions(ctx, state) {
  proofPaper(ctx);
  ctx.save();
  ctx.translate(955, 187);
  ctx.rotate(-0.009);
  const live = state.fixed ? aligned : upperLeft;
  const readout = VOCAB[live.choice];
  const rows = [
    { y: -48, name: 'Full prefix', value: VOCAB[full.choice], color: blue, scores: full.logits, circle: state.firstPeak },
    { y: 65, name: 'Cached', value: readout, color: state.fixed ? blue : ruby, scores: live.logits, circle: state.lastPeak },
  ];
  label(ctx, 'next word', 205, -117, 32, '#566363', 'Sans');
  label(ctx, 'six scores', 599, -117, 32, '#566363', 'Sans');
  for (const row of rows) {
    const { y, color, value } = row;
    label(ctx, row.name, -835, y, 40, ink);
    label(ctx, WORDS.join(' '), -553, y - 1, 58, ink, 'Mono');
    rule(ctx, 202, y + 38, 489, y + 38, '#c4bbaa', 2);
    ctx.save();
    if (row.name === 'Cached') {
      // A removable contact print keeps the first run in place while the cached run is repeated.
      ctx.beginPath();
      ctx.rect(161, 0, 737, 136);
      ctx.clip();
      ctx.translate((1 - state.insert) * 750, (1 - state.insert) * -8);
      ctx.rotate((1 - state.insert) * -0.018);
      ctx.shadowColor = '#302b353d';
      ctx.shadowOffsetY = 3;
      ctx.shadowBlur = 4;
      ctx.fillStyle = gradient(ctx, 162, 10, 867, 123, [
        [0, '#f7f0e3'], [0.4, '#fcf6eb'], [0.86, '#f1ecdf'], [1, '#e6dfcf'],
      ]);
      ctx.fillRect(166, 11, 706, 111);
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = color;
      ctx.fillRect(166, 11, 6, 111);
    }
    label(ctx, value, 204, y - 4, 72, color, 'Serif');
    scoreMarks(ctx, row.scores, 601, y + 15, color, row.circle);
    ctx.restore();
  }
  ctx.restore();
}

function stencilPath(ctx, top) {
  ctx.beginPath();
  ctx.roundRect(318, top - 110, 1488, 480, [15, 9, 32, 8]);
  for (let row = 0; row < 3; row++) {
    const y = top + row * pitch;
    for (let col = 0; col <= row; col++) {
      ctx.roundRect(slots[col] - halfHole, y - 39, 2 * halfHole, 78, 9);
    }
  }
  for (let y = top - 83; y < top + 354; y += 48) {
    ctx.roundRect(1754, y, 27, 17, 4);
  }
}

function stencil(ctx, position) {
  const top = readY - position * pitch;
  ctx.save();
  // Cut the openings out of the shadow as well as the sheet.
  ctx.translate(8, 10);
  stencilPath(ctx, top);
  ctx.fillStyle = '#29444839';
  ctx.fill('evenodd');
  ctx.restore();

  stencilPath(ctx, top);
  ctx.fillStyle = gradient(ctx, 330, top - 110, 1800, top + 345, [
    [0, '#781539'], [0.14, '#a51943'], [0.44, '#cc2943'],
    [0.73, '#ba1e3f'], [0.89, '#aa1c3e'], [1, '#681532'],
  ]);
  ctx.fill('evenodd');
  ctx.save();
  ctx.clip('evenodd');
  // Light grazing the thin lip distinguishes the cut edge from the frosted glass below it.
  ctx.fillStyle = gradient(ctx, 321, 0, 349, 0, [[0, '#ffc68f88'], [0.14, '#f5796f5c'], [1, '#e0545333']]);
  ctx.fillRect(318, top - 110, 31, 482);
  ctx.fillStyle = gradient(ctx, 337, top - 95, 1180, top + 312, [
    [0, '#ffe2b400'], [0.38, '#ffe4c00c'], [0.49, '#ffd3a527'], [0.50, '#ffd3a51a'], [0.79, '#ffb49000'],
  ]);
  ctx.fillRect(318, top - 110, 1488, 480);
  rule(ctx, 1728, top - 110, 1728, top + 369, '#5a0e3385', 3);
  for (let row = 0; row < 3; row++) {
    const y = top + row * pitch;
    label(ctx, 'row ' + row, 430, y, 38, '#fff0d9', 'Mono', 'center');
    for (let col = 0; col <= row; col++) {
      ctx.strokeStyle = '#630c2c';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.roundRect(slots[col] - halfHole, y - 39, 2 * halfHole, 78, 9);
      ctx.stroke();
      rule(ctx, slots[col] - halfHole + 10, y + 41, slots[col] + halfHole - 10, y + 41, '#ffb49a', 2.8);
    }
  }
  ctx.restore();
}

function workspace(ctx, state) {
  ctx.fillStyle = gradient(ctx, 90, 0, 1710, 1080, [
    [0, '#a4b8b9'], [0.26, '#dee5de'], [0.53, '#e6ebe4'], [1, '#9cafb1'],
  ]);
  ctx.fillRect(-W, -H, 3 * W, 3 * H);
  const glow = ctx.createRadialGradient(890, readY, 110, 890, readY, 1000);
  glow.addColorStop(0, '#fffef5bf');
  glow.addColorStop(1, '#ffffff00');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 300, W, 780);

  // This fixed field is a single query. The sheet can travel independently over it.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 452, W, 463);
  ctx.clip();
  ctx.fillStyle = gradient(ctx, 320, 460, 1742, 895, [
    [0, '#9bb8bd'], [0.45, '#baced1'], [1, '#a3b9b9'],
  ]);
  ctx.fillRect(317, 452, 1488, 463);
  // The darker glass in the idle apertures sets off the one illuminated scan line.
  ctx.fillStyle = gradient(ctx, 0, readY - 72, 0, readY + 72, [
    [0, '#fffff000'], [0.24, '#fffedf88'], [0.5, '#fffdee'], [0.76, '#fffedf88'], [1, '#fffff000'],
  ]);
  ctx.fillRect(317, readY - 72, 1488, 144);
  slots.forEach((x) => {
    rule(ctx, x, 465, x, 920, '#758b9161', 2);
  });
  ctx.fillStyle = '#ffffee';
  ctx.fillRect(316, readY - 39, 1450, 78);
  ctx.fillStyle = '#b4cdc8';
  ctx.fillRect(316, readY + 36, 1450, 3);
  const shares = state.position > 1 ? aligned.weights : upperLeft.weights;
  if (state.shareInk > 0) {
    ctx.save();
    ctx.globalAlpha = state.shareInk;
    slots.forEach((x, i) => {
      label(ctx, (100 * shares[i]).toFixed(shares[i] === 1 ? 0 : 1) + '%',
        x, readY, 51, blue, 'Mono', 'center');
    });
    ctx.restore();
  }
  stencil(ctx, state.position);
  if (state.trace > 0) {
    const top = readY - 2 * pitch;
    const points = [[834, top - 34], [834, top + 52], [1220, top + 52],
      [1220, top + pitch + 52], [1606, top + pitch + 52], [1606, readY + 38]];
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    let remaining = state.trace * (points.length - 1);
    for (let i = 0; i < points.length - 1 && remaining > 0; i++, remaining--) {
      const t = Math.min(remaining, 1);
      ctx.lineTo(lerp(points[i][0], points[i + 1][0], t), lerp(points[i][1], points[i + 1][1], t));
    }
    ctx.strokeStyle = '#ffd7b5';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ctx.restore();

  // The mask slides under the keeper. Token identities stay registered to the glass.
  ctx.fillStyle = gradient(ctx, 0, 332, 0, 453, [[0, '#d8e1dc'], [0.86, '#e6e9df'], [1, '#c5cfca']]);
  ctx.fillRect(30, 336, 1856, 118);
  rule(ctx, 30, 454, 1886, 454, '#7c929397', 3);
  label(ctx, 'Keys', 385, 393, 38, ink);
  slots.forEach((x, i) => {
    const selected = state.counted === i;
    const id = String(i);
    label(ctx, id, x - 122, 392, 36, selected ? blue : '#4e6771', 'Mono', 'center');
    if (selected) {
      ctx.strokeStyle = blue;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(x - 122, 392, 25, 28, -0.11, 0, 2 * Math.PI);
      ctx.stroke();
    }
    label(ctx, WORDS[i], x + 23, 393, 44, ink, 'Serif', 'center');
    if (state.cacheNames) label(ctx, i < 2 ? 'saved' : 'new', x + 23, 435, 30, '#435d66', 'Sans', 'center');
  });

  // The porcelain arrow stays with the query while the red sheet moves.
  ctx.beginPath();
  ctx.moveTo(24, readY - 60);
  ctx.lineTo(255, readY - 60);
  ctx.lineTo(319, readY);
  ctx.lineTo(255, readY + 60);
  ctx.lineTo(24, readY + 60);
  ctx.closePath();
  ctx.fillStyle = '#f6f6e9';
  ctx.shadowColor = '#31495035';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 0;
  label(ctx, 'query', 148, readY - 20, 32, '#4e666c', 'Sans', 'center');
  label(ctx, '“the”', 148, readY + 21, 52, ink, 'Serif', 'center');
  rule(ctx, 252, readY, 308, readY, blue, 3.5);

  ctx.fillStyle = gradient(ctx, 0, 914, 0, H, [[0, '#9aa9a2'], [0.035, '#d8e1d9'], [1, '#c6d3ce']]);
  ctx.fillRect(0, 914, W, H - 914);
  rule(ctx, 0, 916, W, 916, '#f0f0de', 4);
  impressions(ctx, state);
}

function exposure(clock) {
  const b = clock.index;
  const cue = (phrase, span) => ease(clock.reveal(phrase, span));
  let position = 2;
  if (b === 0) position = 0;
  if (b === 1) position = 2 * cue('Start with the full prompt', 1.5);
  if (b === 5) position = 2 * (1 - cue('Watch the sheet slip', 1.45));
  if (b === 6) position = 0;
  if (b === 7) position = 2 * cue('Slide row two', 1.4);
  let shareInk = 0;
  if (b === 2) shareInk = cue('Light comes through', 0.7);
  if (b === 3 || b === 4 || b === 6) shareInk = 1;
  if (b === 5 || b === 7) {
    const movement = b === 5 ? 1 - position / 2 : position / 2;
    shareInk = Math.max(clamp(1 - movement * 8), clamp((movement - 0.88) / 0.12));
  }
  let counted = -1;
  if (b === 6) {
    for (const [i, word] of ['Zero', 'one', 'two'].entries()) {
      if (clock.reveal(word, 0.2) > 0) counted = i;
    }
  }
  const fixed = b === 7 && position === 2;
  let insert = 0;
  if (b === 0) insert = ease(clock.elapsed / 0.9);
  if (b === 1) insert = 1 - cue('Start with the full prompt', 0.75);
  if (b === 5) insert = ease((clock.reveal('Watch the sheet slip', 2.3) * 2.3 - 1.45) / 0.85);
  if (b === 6) insert = 1;
  if (b === 7) {
    const travel = clock.reveal('Slide row two', 2.3) * 2.3;
    insert = fixed ? ease((travel - 1.4) / 0.9) : 1 - ease(travel / 0.65);
  }
  const firstPeak = b === 3 ? cue('See the tallest mark', 0.35) : 0;
  const lastPeak = b === 5 ? cue('Its value gets the entire weight', 0.5) : 0;
  let trace = 0;
  if (b === 1) {
    trace = (cue('The first query', 0.8) + 2 * cue('The second', 0.9) + 2 * cue('This staircase', 0.9)) / 5;
  }
  return { position, shareInk, counted, fixed, insert, firstPeak, lastPeak, trace, cacheNames: b >= 4 };
}

// The three framings are details of one exposure table. The two sheets never trade places.
function framing(clock) {
  const wide = [960, 540, 1];
  const endings = [1491, 153, 2.72];
  const mask = [984, 646, 1.46];
  const between = (from, to, t) => from.map((v, i) => lerp(v, to[i], t));
  const move = (phrase, duration) => ease(clock.reveal(phrase, duration));
  switch (clock.index) {
    case 0: return between(endings, wide, move('Same three words', 2.0));
    case 1: return between(wide, mask, move('Follow the cuts', 1.35));
    case 2: return mask;
    case 3: {
      const pull = move('The decoder uses', 1.45);
      const look = move('See the tallest mark', 1.25);
      return between(between(mask, wide, pull), endings, look);
    }
    case 4: return between(endings, wide, move('Now run', 1.6));
    case 5: return wide;
    case 6: return between(wide, mask, move('Count from the beginning', 1.2));
    case 7: return between(mask, wide, move('Look up at the scores', 1.55));
    default: return wide;
  }
}

function draw(ctx, clock) {
  const state = exposure(clock);
  const [cx, cy, scale] = framing(clock);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);
  workspace(ctx, state);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = ctx.createPattern(grain, 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function check() {
  assert.deepEqual(WORDS, ['function', 'returns', 'the']);
  assert.deepEqual(full.weights.map(row => row.filter(w => w > 0).length), [1, 2, 3]);
  assert.deepEqual(upperLeft.weights, [1, 0, 0]);
  assert.deepEqual(upperLeft.read, full.V[0]);
  assert.deepEqual(aligned.weights.map(v => (v * 100).toFixed(1)), ['25.7', '37.7', '36.6']);
  const mixture = full.V[0].map((_, j) => full.V.reduce((acc, v, i) => acc + aligned.weights[i] * v[j], 0));
  assert.deepEqual(mixture, aligned.read);
  assert.deepEqual(aligned.read, full.A.at(-1));
  assert.equal(VOCAB[upperLeft.logits.indexOf(Math.max(...upperLeft.logits))], 'None');
  assert.equal(VOCAB[full.logits.indexOf(Math.max(...full.logits))], 'result');
  assert.equal(aligned.logits.length, 6);
  assert.deepEqual(aligned.logits, full.logits);
  return true;
}

export default { title, beats, draw, check };

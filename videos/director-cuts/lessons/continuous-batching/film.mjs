import assert from 'node:assert/strict';
import { schedule, useful } from '../../../films/continuous-batching/model.mjs';

// Each prompt ends at its prefix. The fixture gives the remaining decode lengths.
const fields = [
  { id: 'A', part: 'Nose', prefix: 'r', letters: 'ed', color: [255, 0, 0] },
  { id: 'B', part: 'Flame', prefix: '', letters: 'gold', color: [255, 215, 0] },
  { id: 'C', part: 'Hull', prefix: '', letters: 'silver', color: [192, 192, 192] },
  { id: 'D', part: 'Fins', prefix: '', letters: 'coral', color: [255, 127, 80] },
  { id: 'E', part: 'Window', prefix: '', letters: 'blue', color: [0, 0, 255] },
];
const traces = { fixed: schedule(false), refill: schedule(true) };
const title = 'Who gets the next decode slot?';
const beats = [
  {
    id: 'red',
    say: 'Watch the nose. Someone typed the r. Two generated letters finish the color.',
    hold: 0.9,
  },
  {
    id: 'three-cursors',
    say: 'Each row is a request. This model writes one letter per token. Three requests can decode together. When can the fins get a turn?',
    hold: 1.1,
  },
  {
    id: 'fixed',
    say: 'Keep the batch fixed for the next step. Two letters appear. The fins are still waiting. Follow silver to the end. Six steps, twelve letters.',
    hold: 1.2,
  },
  {
    id: 'handoff',
    say: 'Back to step two. The server has processed the fin prompt. Its cached state fits in memory. Watch slot one move between decode steps.',
    hold: 1.2,
  },
  {
    id: 'three-letters',
    say: "There's the C for coral. In that same step, gold and silver each got an L. That's continuous batching. The other replies keep their histories when slot one changes hands.",
    hold: 0.7,
  },
  {
    id: 'second-slot',
    say: 'Gold gets its final D. Follow slot two down to the waiting window request. The next pass gives us the B in blue.',
    hold: 0.8,
  },
  {
    id: 'six-extra',
    say: "Six steps again. Look at the extra letters. Four in the fins, two in the window. That's eighteen letters where the fixed batch wrote twelve.",
    hold: 1.1,
  },
  {
    id: 'blue',
    say: 'One more letter colors the fins. Keep your eye on the window for the last E.',
    hold: 3.2,
  },
];

const clamp = (n) => Math.max(0, Math.min(1, n));
const ease = (n) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const mix = (a, b, f) => a + (b - a) * f;
const colorMix = (a, b, f) => a.map((n, i) => Math.round(mix(n, b[i], f)));
const rgb = (v) => 'rgb(' + v.join(',') + ')';

function snapshot(policy, step) {
  const past = traces[policy].slice(0, step);
  const counts = Object.fromEntries(fields.map(({ id }) => [id, 0]));
  for (const iteration of past) {
    for (const entry of iteration.slots) {
      if (entry) counts[entry.id] = entry.generated;
    }
  }
  return {
    counts,
    total: useful(past),
    current: past.at(-1)?.slots ?? [],
  };
}

// The camera stays put for both runs. Only the policy and the decode frontier move.
function moment(clock) {
  const cue = (phrase, span) => clock.reveal(phrase, span);
  const { index, elapsed } = clock;
  let policy = index === 2 ? 'fixed' : 'refill';
  let step = 2;
  let ink = 1;
  let firstMove = index >= 4 ? 1 : 0;
  let secondMove = index >= 6 ? 1 : 0;
  let extra = 0;
  let sharedStep = 0;
  function land(pass, phase) {
    if (phase > 0) {
      step = pass;
      ink = ease(phase);
    }
  }
  if (index === 0) {
    step = 0;
    land(1, clamp((elapsed - 0.12) / 0.32));
    land(2, clamp((elapsed - 1.12) / 0.38));
  } else if (index === 2) {
    land(3, cue('the next step', 0.35));
    const run = cue('Follow silver', 2.15) * 3;
    for (let i = 0; i < 3; i++) land(4 + i, clamp((run - i) * 2.1));
  } else if (index === 3) {
    const rewind = cue('Back to step two', 1.1);
    step = 6 - Math.min(4, Math.floor(rewind * 4.99));
    if (step > 2) policy = 'fixed';
    firstMove = ease(cue('Watch slot one', 1.1));
    land(3, clamp((elapsed - clock.speechDuration) / 0.35));
  } else if (index === 4) {
    step = 3;
    sharedStep = ease(cue('In that same step', 0.35));
  } else if (index === 5) {
    step = 3;
    land(4, cue('Gold gets its final D', 0.35));
    secondMove = ease(cue('Follow slot two', 0.95));
    land(5, cue('The next pass', 0.35));
  } else if (index === 6) {
    step = 5;
    land(6, clamp(elapsed / 0.35));
    extra = ease(cue('Look at the extra letters', 0.45));
  } else if (index === 7) {
    step = 6;
    land(7, clamp(elapsed / 0.38));
    land(8, cue('the last E', 0.38));
  }
  return { policy, step, ink, firstMove, secondMove, extra, sharedStep, ...snapshot(policy, step) };
}

// An indexed pixel drawing. The five named materials take their colors directly
// from the completed replies. The other indices supply the rim, glass glint and nozzle.
const pattern = [
  '.......N.......',
  '......NNN......',
  '......NNN......',
  '.....NNNNN.....',
  '.....NNNNN.....',
  '....HHHHHHH....',
  '....HHHHHHH....',
  '...HHHHHHHHH...',
  '...HHHKKKHHH...',
  '...HHKWWWKHH...',
  '...HHKGWWKHH...',
  '...HHKWWWKHH...',
  '...HHHKKKHHH...',
  '...HHHHHHHHH...',
  '..FHHHHHHHHHF..',
  '..FHHHHHHHHHF..',
  '.FFHHHHHHHHHFF.',
  '.FFHHHHHHHHHFF.',
  'FFF.HHHHHHH.FFF',
  'FF..HHHHHHH..FF',
  'F....XXXXX....F',
  '.....XXXXX.....',
  '.....TTTTT.....',
  '.....TTTTT.....',
  '......TTT......',
  '......TTT......',
  '.......T.......',
  '.......T.......',
];
const spriteSize = 32;
const material = { N: 'A', T: 'B', H: 'C', F: 'D', W: 'E' };
const tones = { K: [63, 47, 93], G: [252, 249, 255], X: [103, 90, 127] };
const edge = '#282044';
const pixels = [];
const grid = [];
for (let y = 0; y < spriteSize; y++) {
  grid[y] = [];
  for (let x = 0; x < spriteSize; x++) {
    // Sample the upright sprite once onto its final square pixel grid.
    const u = Math.round(7 + (x - 15.5) * 0.8 + (y - 15.5) * 0.6);
    const v = Math.round(13.5 - (x - 15.5) * 0.6 + (y - 15.5) * 0.8);
    const mark = pattern[v]?.[u] ?? '.';
    if (mark === '.') continue;
    grid[y][x] = mark;
    pixels.push({ x, y, u, v, mark });
  }
}
const outline = [];
for (let y = 0; y < spriteSize; y++) {
  for (let x = 0; x < spriteSize; x++) {
    if (grid[y][x]) continue;
    if (grid[y - 1]?.[x] || grid[y + 1]?.[x] || grid[y]?.[x - 1] || grid[y]?.[x + 1]) {
      outline.push({ x, y });
    }
  }
}

function text(ctx, value, x, y, size, color, family = 'Lesson Sans', weight = 500, align = 'left') {
  ctx.font = weight + ' ' + size + 'px "' + family + '"';
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(value, x, y);
  ctx.textAlign = 'left';
}

function rowColor(f, shot) {
  if (shot.counts[f.id] !== f.letters.length) return 0;
  return shot.current.some((entry) => entry?.id === f.id) ? shot.ink : 1;
}

function paintSprite(ctx, shot) {
  const pitch = 26;
  const originX = 14;
  const originY = 87;
  const tile = (x, y, fill) => {
    ctx.fillStyle = fill;
    ctx.fillRect(originX + x * pitch, originY + y * pitch, pitch, pitch);
  };
  ctx.fillStyle = '#d4d0eb';
  ctx.fillRect(0, 0, 876, 1080);
  ctx.fillStyle = '#cbc6e3';
  for (let y = -4; y <= 38; y++) {
    for (let x = -1; x < 34; x++) {
      if ((x + y) % 2 === 0) ctx.fillRect(originX + x * pitch, originY + y * pitch, pitch, pitch);
    }
  }
  const progress = Object.fromEntries(fields.map((f) => [f.id, rowColor(f, shot)]));
  for (const p of [...outline, ...pixels]) tile(p.x + 1, p.y + 1, '#a69fc3');
  for (const p of outline) tile(p.x, p.y, edge);
  for (const { x, y, u, v, mark } of pixels) {
    const id = material[mark];
    let base = tones[mark];
    if (id) {
      const f = fields.find((field) => field.id === id);
      const unpainted = (x + y) % 4 === 0 ? [189, 179, 202] : [222, 214, 227];
      base = colorMix(unpainted, f.color, progress[id]);
    }
    // Stable pixel facets keep the silhouette legible before the palette fills.
    let shadow = u >= 9 ? 0.28 : u === 8 ? 0.12 : 0;
    if (mark === 'F') shadow = u >= 7 ? 0.18 : 0.03;
    if (mark === 'T') shadow = u > 7 ? 0.15 : 0;
    if (mark === 'W') shadow = v >= 11 ? 0.18 : 0;
    let shaded = colorMix(base, [52, 38, 82], shadow);
    if ((u === 5 && (mark === 'H' || mark === 'N')) || (u === 7 && mark === 'T')) {
      shaded = colorMix(shaded, [255, 253, 244], 0.58);
    }
    tile(x, y, rgb(shaded));
  }
  text(ctx, 'Rocket sprite', 64, 109, 50, edge, 'Lesson Sans', 700);
}

// Each token uses one bitmap glyph. Its advance is constant, so the extra six
// letters occupy exactly the same width per token in either run.
const glyph = {
  a: ['00000','00000','01110','00001','01111','10001','01111'],
  b: ['10000','10000','10110','11001','10001','10001','11110'],
  c: ['00000','00000','01111','10000','10000','10000','01111'],
  d: ['00001','00001','01101','10011','10001','10001','01111'],
  e: ['00000','00000','01110','10001','11111','10000','01111'],
  g: ['00000','01111','10001','10001','01111','00001','01110'],
  i: ['00100','00000','01100','00100','00100','00100','01110'],
  l: ['01100','00100','00100','00100','00100','00100','01110'],
  o: ['00000','00000','01110','10001','10001','10001','01110'],
  r: ['00000','00000','10110','11001','10000','10000','10000'],
  s: ['00000','00000','01111','10000','01110','00001','11110'],
  u: ['00000','00000','10001','10001','10001','10011','01101'],
  v: ['00000','00000','10001','10001','10001','01010','00100'],
};
function letter(ctx, char, x, y, color) {
  const dot = 8;
  ctx.fillStyle = color;
  glyph[char].forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      if (row[dx] === '1') ctx.fillRect(x + dot * dx, y + dot * dy, dot, dot);
    }
  });
}

const baseY = 304;
const leading = 110;
const tokenX = 1376;
const advance = 58;
const inkColor = '#261e3e';
const plum = '#6b3aa4';
const dim = '#645c70';

function drawOutput(ctx, f, i, shot) {
  const y = baseY + i * leading;
  const n = shot.counts[f.id];
  const word = f.prefix + f.letters.slice(0, n);
  const paint = rowColor(f, shot);
  const swatch = colorMix([224, 218, 231], f.color, paint);
  ctx.fillStyle = '#51455e';
  ctx.fillRect(1067, y - 26, 32, 32);
  ctx.fillStyle = rgb(swatch);
  ctx.fillRect(1071, y - 22, 24, 24);
  text(ctx, f.part, 1120, y + 7, 42, inkColor);
  if (shot.extra && (f.id === 'D' || f.id === 'E')) {
    ctx.fillStyle = 'rgba(220,191,250,' + shot.extra + ')';
    ctx.fillRect(tokenX - 9, y - 59, advance * word.length + 1, 78);
  }
  if (word.length) {
    const gotToken = shot.current.some((entry) => entry?.id === f.id);
    Array.from(word).forEach((char, pos) => {
      const stamped = gotToken && pos === word.length - 1;
      const dy = stamped ? -10 * (1 - shot.ink) : 0;
      if (stamped && shot.sharedStep > 0) {
        ctx.fillStyle = 'rgba(220,191,250,' + shot.sharedStep + ')';
        ctx.fillRect(tokenX + pos * advance - 6, y - 57, 52, 75);
      }
      letter(ctx, char, tokenX + pos * advance, y - 48 + dy, pos < f.prefix.length ? '#82798c' : inkColor);
    });
  } else if (f.id === 'D' || (f.id === 'E' && shot.step >= 3)) {
    const entering = f.id === 'D' ? shot.firstMove : shot.secondMove;
    if (entering < 0.98) text(ctx, 'ready', tokenX, y + 6, 35, plum, 'Lesson Mono');
  } else {
    ctx.fillStyle = '#c3bbca';
    ctx.fillRect(tokenX, y - 6, 30, 4);
  }
  // The small insertion point stays with the reply while the numbered slot moves.
  const admitted = f.id === 'D' ? shot.firstMove >= 0.98 : f.id === 'E' ? shot.secondMove >= 0.98 : true;
  if (admitted && n < f.letters.length) {
    ctx.fillStyle = plum;
    ctx.fillRect(tokenX + word.length * advance, y + 10, 31, 6);
  }
  ctx.fillStyle = '#d6cfdb';
  ctx.fillRect(948, y + 41, 877, 2);
}

function slot(ctx, number, from, to, amount, hollow) {
  const x = 958 - 58 * Math.sin(Math.PI * amount);
  const y = baseY + mix(from, to, amount) * leading - 12;
  ctx.fillStyle = hollow ? '#f7f4f8' : plum;
  ctx.strokeStyle = hollow ? '#988aa5' : plum;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y - 23);
  ctx.lineTo(x + 47, y - 23);
  ctx.lineTo(x + 69, y);
  ctx.lineTo(x + 47, y + 23);
  ctx.lineTo(x, y + 23);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, number, x + 26, y + 12, 32, hollow ? dim : '#fffaff', 'Lesson Mono', 500, 'center');
}

function draw(ctx, clock) {
  const shot = moment(clock);
  paintSprite(ctx, shot);
  ctx.fillStyle = '#f7f4f8';
  ctx.fillRect(876, 0, 1044, 1080);
  ctx.fillStyle = '#746782';
  ctx.fillRect(873, 0, 3, 1080);
  text(ctx, 'Decode step ' + shot.step, 948, 110, 60, inkColor, 'Lesson Sans', 700);
  if (clock.index >= 2) {
    const policy = shot.policy === 'fixed' ? 'Fixed batch' : 'Continuous batching';
    text(ctx, policy, 1828, 106, 32, plum, 'Lesson Sans', 600, 'right');
  }
  text(ctx, 'Slot', 956, 201, 32, dim);
  text(ctx, 'Palette', 1067, 201, 32, dim);
  text(ctx, 'Reply', tokenX, 201, 32, dim);
  ctx.fillStyle = '#51455e';
  ctx.fillRect(948, 224, 877, 3);
  fields.forEach((f, i) => drawOutput(ctx, f, i, shot));
  const rowFinished = (id) => shot.counts[id] === fields.find((field) => field.id === id).letters.length;
  slot(ctx, '1', 0, 3, shot.firstMove, shot.firstMove === 0 ? rowFinished('A') : rowFinished('D'));
  slot(ctx, '2', 1, 4, shot.secondMove, shot.secondMove === 0 ? rowFinished('B') : rowFinished('E'));
  slot(ctx, '3', 2, 2, 0, rowFinished('C'));
  const fixedTotal = snapshot('fixed', shot.step).total;
  const tally = shot.extra > 0
    ? fixedTotal + ' fixed + ' + (shot.total - fixedTotal) + ' extra = ' + shot.total + ' letters'
    : shot.total + ' letters generated';
  text(ctx, tally, 1827, 874, 40, inkColor, 'Lesson Mono', 500, 'right');
}

function check() {
  for (const [policy, trace] of Object.entries(traces)) {
    const words = Object.fromEntries(fields.map((f) => [f.id, f.prefix]));
    for (const { slots } of trace) {
      for (const token of slots.filter(Boolean)) {
        const field = fields.find((f) => f.id === token.id);
        assert.equal(token.length, field.letters.length);
        assert.equal(words[token.id].length - field.prefix.length + 1, token.generated);
        words[token.id] += field.letters[token.generated - 1];
      }
    }
    assert.deepEqual(Object.values(words), ['red', 'gold', 'silver', 'coral', 'blue']);
    assert.equal(trace.length, policy === 'fixed' ? 11 : 8);
  }
  for (const f of fields) {
    for (const char of f.prefix + f.letters) assert.ok(glyph[char], 'Missing glyph ' + char);
    assert.ok(pixels.some((p) => material[p.mark] === f.id));
  }
  const fixed = snapshot('fixed', 6);
  const refill = snapshot('refill', 6);
  assert.deepEqual(traces.refill[2].slots.map((token) => token.id + token.generated), ['D1', 'B3', 'C3']);
  assert.deepEqual(traces.refill[4].slots.map((token) => token.id + token.generated), ['D3', 'E1', 'C5']);
  assert.equal(traces.fixed[2].slots[0], null);
  assert.deepEqual([fixed.total, refill.total], [12, 18]);
  assert.deepEqual(refill.counts, { A: 2, B: 4, C: 6, D: 4, E: 2 });
  return true;
}

export default { title, beats, draw, check };

import assert from 'node:assert/strict';
import { r0, r1 } from '../../../films/deep-dive-vllm/fixtures.mjs';
import { references, vvReleaseRequest } from '../../../films/deep-dive-vllm/model.mjs';

const title = 'Who still needs block twelve?';
const beats = [
  {
    id: 'two-twelves',
    say: "Follow the two pointers. Both prompts start here, with the words “the little bird sat.” When the orange request finishes, which of its two blocks can vLLM use for another request?",
    hold: 2.3,
  },
  {
    id: 'released-suffix',
    say: "Forty-one lost its only reader. You can still see the old contents, right down to “green branch.” That slot is on the free queue now. vLLM can overwrite it when it needs the space.",
    hold: 0.65,
  },
  {
    id: 'one-reader',
    say: "Blue's pointer is still there. In block twelve, each word marks a token position. The top row holds its key, and the bottom row holds its value. Blue needs both on the next step.",
    hold: 0.6,
  },
  {
    id: 'next-position',
    say: "Blue has sampled the word “and.” Watch its next decode step. The model computes a new key and value for that word. They fit right beside “today,” in block ninety.",
    hold: 0.8,
  },
  {
    id: 'read-again',
    say: "See which blocks light up together. Attention reads all ten positions, including the first four. Blue is still reading the copy in twelve.",
    hold: 2.4,
  },
];

const blockSize = 4;
const tables = { R0: [12, 41], R1: [12, 73, 90] };
const initial = { tables, refs: references(tables), free: [] };
const released = vvReleaseRequest(tables, new Set([12, 41, 73]), 'R0');
const nextWord = 'and';

function locate(table, position) {
  return { id: table[Math.floor(position / blockSize)], offset: position % blockSize };
}

// One illustrated attention head. The cell shades identify components of toy vectors.
function entryFor(prefix) {
  let hash = 2166136261;
  for (const ch of prefix.join(' ')) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619);
  function vector() {
    return Array.from({ length: 16 }, () => {
      hash = (Math.imul(hash, 1664525) + 1013904223) >>> 0;
      return hash >>> 28;
    });
  }
  return { word: prefix.at(-1), key: vector(), value: vector() };
}

const pool = new Map();
for (const [words, table] of [[r0, tables.R0], [r1, tables.R1]]) {
  words.forEach((_, pos) => {
    const { id, offset } = locate(table, pos);
    if (!pool.has(id)) pool.set(id, []);
    pool.get(id)[offset] ??= entryFor(words.slice(0, pos + 1));
  });
}
const destination = locate(released.tables.R1, r1.length);
const decoded = new Map(pool);
decoded.set(destination.id, [...pool.get(destination.id), entryFor([...r1, nextWord])]);

function readHistory(cache, table, length) {
  return Array.from({ length }, (_, pos) => {
    const { id, offset } = locate(table, pos);
    return cache.get(id)[offset];
  });
}

function check() {
  assert.deepEqual([...initial.refs], [[12, 2], [41, 1], [73, 1], [90, 1]]);
  assert.deepEqual(released.tables, { R1: [12, 73, 90] });
  assert.deepEqual(released.free, [41]);
  assert.equal(released.refs.get(12), 1);
  assert.equal(released.refs.get(41), 0);
  assert.deepEqual(destination, { id: 90, offset: 1 });
  assert.equal(pool.get(90).length, destination.offset);
  assert.equal(decoded.get(12), pool.get(12));
  assert.equal(decoded.get(41), pool.get(41));
  const input = [...r1, nextWord];
  assert.deepEqual(readHistory(decoded, released.tables.R1, input.length),
    input.map((_, i) => entryFor(input.slice(0, i + 1))));
}

const ink = '#20284a';
const blue = '#214cc3';
const orange = '#bb482b';
const muted = '#596880';
const paper = '#e8edf1';
const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => { const t = clamp(v); return t * t * (3 - 2 * t); };
const mix = (a, b, v) => a + (b - a) * v;

function label(ctx, words, x, y, size, color = ink, family = 'Sans', align = 'left', weight = 500) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Lesson ${family}"`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(words, x, y);
}

function line(ctx, x1, y1, x2, y2, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function polygon(ctx, points, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (const [i, [x, y]] of points.entries()) {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function disc(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

const keyInks = ['#9edcde', '#82cacc', '#64b6c0', '#469eac', '#317f98', '#295e80', '#254467', '#1c3357'];
const valueInks = ['#e4c9ef', '#cfb3e4', '#ba97d5', '#a37cc5', '#8e68b4', '#754f96', '#59427d', '#3e335e'];

// A block in section. Each of the four columns holds one position.
// The two mosaics on top are its key and value. The cut edge carries the token labels.
function chip(ctx, x, y, w, depth, face, entries, options = {}) {
  const { hero = false, free = false, read = 0, newOffset = -1, write = 1,
    nameKeys = 0, nameValues = 0, retainedSuffix = 0 } = options;
  const skew = 0.28, shift = depth * skew, cell = w / blockSize;
  const top = y + depth, front = top + face;
  ctx.save();
  ctx.shadowColor = free ? '#384a5f22' : '#283e6260';
  ctx.shadowBlur = hero ? 30 : 12;
  ctx.shadowOffsetY = hero ? 18 : 8;
  polygon(ctx, [[x + shift, y], [x + w + shift, y], [x + w, front], [x, front], [x, top]], '#566780');
  ctx.restore();

  const side = ctx.createLinearGradient(x + w, top, x + w + shift, y);
  side.addColorStop(0, '#344567');
  side.addColorStop(1, '#93a6b9');
  polygon(ctx, [[x+w, top], [x+w+shift, y], [x+w+shift, y+face], [x+w, front]], side);

  ctx.save();
  ctx.transform(1, 0, -skew, 1, x + shift, y);
  ctx.fillStyle = free ? '#9aa6af' : '#4d6381';
  ctx.fillRect(0, 0, w, depth);
  const margin = hero ? 9 : 5;
  for (let pos = 0; pos < blockSize; pos++) {
    const entry = entries[pos];
    const left = pos * cell + margin;
    const inner = cell - 2 * margin;
    if (!entry) {
      ctx.fillStyle = '#d1dbe1';
      ctx.fillRect(left, margin, inner, depth - 2 * margin);
      for (let dy = margin + 5; dy < depth - margin; dy += 6) {
        line(ctx, left + 3, dy, left + inner - 3, dy, '#b5c4ce', 1.1);
      }
      continue;
    }
    for (const [band, values] of [entry.key, entry.value].entries()) {
      const palette = band ? valueInks : keyInks;
      const y0 = margin + band * (depth / 2 - margin * 0.4);
      const rowH = (depth / 2 - 1.45 * margin) / 2;
      const colW = inner / 8;
      for (const [component, shade] of values.entries()) {
        const sx = left + (component % 8) * colW, sy = y0 + Math.floor(component / 8) * rowH;
        const opacity = pos === newOffset ? write : 1;
        ctx.fillStyle = '#c3cfd8';
        ctx.fillRect(sx, sy, colW - 1, rowH - 1);
        ctx.globalAlpha = opacity * (free ? 0.39 : 1);
        ctx.fillStyle = palette[shade >> 1];
        ctx.fillRect(sx, sy, colW - 1, rowH - 1);
        ctx.globalAlpha = 1;
      }
    }
  }
  // The read strobe washes across every participating block in the same step.
  if (read > 0 && read < 1) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, cell * entries.length, depth);
    ctx.clip();
    const scan = mix(-110, cell * entries.length + 110, read);
    const gleam = ctx.createLinearGradient(scan - 100, 0, scan + 50, 0);
    gleam.addColorStop(0, '#ffffff00');
    gleam.addColorStop(0.65, '#edffffbd');
    gleam.addColorStop(1, '#ffffff00');
    ctx.fillStyle = gleam;
    ctx.fillRect(0, 0, w, depth);
    ctx.restore();
  }
  ctx.restore();

  const edge = ctx.createLinearGradient(0, top, 0, front);
  edge.addColorStop(0, free ? '#788691' : '#394a67');
  edge.addColorStop(1, free ? '#616e7b' : '#242f4b');
  ctx.fillStyle = edge;
  ctx.fillRect(x, top, w, face);
  line(ctx, x, top, x+w, top, '#cadbe4', 2);
  for (let pos = 0; pos < blockSize; pos++) {
    const cx = x + (pos + 0.5) * cell;
    if (pos > 0) line(ctx, x + pos*cell, top, x + pos*cell, front, '#ffffff45', 2);
    if (entries[pos]) {
      if (read > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, read * 4);
        ctx.fillStyle = blue;
        ctx.fillRect(cx-cell/2+2, top+2, cell-4, face-2);
        ctx.restore();
      }
      ctx.save();
      if (pos === newOffset) ctx.globalAlpha = write;
      if (retainedSuffix && pos >= 2) {
        ctx.fillStyle = `rgba(38, 49, 68, ${0.75 * retainedSuffix})`;
        ctx.fillRect(cx-cell/2+2, top+2, cell-4, face-2);
      }
      label(ctx, entries[pos].word, cx, top + face * 0.69, hero ? 48 : 36, '#f5f7ff', 'Serif', 'center');
      ctx.restore();
      if (read > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, read * 4);
        line(ctx, cx - cell/2 + 4, front - 3, cx + cell/2 - 4, front - 3, '#58dfff', hero ? 8 : 6);
        ctx.restore();
      }
    } else {
      line(ctx, cx - 11, top + face / 2, cx + 11, top + face / 2, '#bac4d1', 2);
    }
  }
  if (hero) {
    label(ctx, nameKeys > 0.5 ? 'keys' : 'K', x + 0.73*shift - 18, y + depth*0.33, 35, ink, 'Sans', 'right');
    label(ctx, nameValues > 0.5 ? 'values' : 'V', x + 0.24*shift - 18, y + depth*0.81, 35, ink, 'Sans', 'right');
  }
}

function pointer(ctx, x1, y1, x2, y2, color, length, pulse) {
  const point = (t) => ({
    x: mix(x1, x2, ease(t)),
    y: mix(y1, y2, t),
  });
  if (length <= 0) return;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let n = 1; n <= 36; n++) {
    const p = point(length * n / 36);
    ctx.lineTo(p.x, p.y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.stroke();
  if (length > 0.999) {
    disc(ctx, x2, y2, 10, color);
    disc(ctx, x2, y2, 4, '#ffffff');
  }
  if (pulse > 0 && pulse < length && pulse < 1) {
    const p = point(pulse);
    disc(ctx, p.x, p.y, 10, color);
    disc(ctx, p.x, p.y, 4, '#ffffff');
  }
}

function blockTable(ctx, id, x, y, release) {
  const color = id === 'R0' ? orange : blue;
  label(ctx, id, x, y, 46, color, 'Mono');
  if (release < 1) {
    ctx.save();
    ctx.globalAlpha = clamp(1 - 2*release);
    for (const [i, address] of tables[id].entries()) {
      const bx = x + 106 + 79*i;
      label(ctx, String(address), bx, y - release*13, 40, i ? muted : color, 'Mono', 'center');
      if (i === 0) line(ctx, bx-29, y+10, bx+29, y+10, color, 4);
    }
    ctx.restore();
  }
  if (release > 0) {
    ctx.save();
    ctx.globalAlpha = clamp(2*release-1);
    label(ctx, 'finished', x+83, y, 38, muted);
    ctx.restore();
  }
}

function cue(clock, beat, phrase, span) {
  if (clock.index < beat) return 0;
  if (clock.index > beat) return 1;
  return ease(clock.reveal(phrase, span));
}

function draw(ctx, clock) {
  // Give the viewer a moment to choose while both of R0's addresses are visible.
  const release = clock.index === 0 ? ease((clock.elapsed - clock.speechDuration - 0.55) / 0.75) : 1;
  const wide = cue(clock, 0, 'When the orange request', 1.9);
  const oldSuffix = cue(clock, 1, 'the old contents', 0.55) * (1-cue(clock, 1, 'on the free queue', 0.75));
  const returnToPrefix = cue(clock, 2, "Blue's pointer", 1.25);
  const returnToPool = cue(clock, 3, 'Blue has sampled', 1.2);
  const keyLabel = cue(clock, 2, 'The top row', 0.36);
  const valueLabel = cue(clock, 2, 'the bottom row', 0.36);
  const releasedNow = release >= 1;
  const state = releasedNow ? released : initial;
  const token = cue(clock, 3, 'sampled the word', 0.4);
  const write = cue(clock, 3, 'a new key', 1.05);
  const read = cue(clock, 4, 'See which blocks', 1.8);
  const cache = write > 0 ? decoded : pool;
  const paperLight = ctx.createLinearGradient(0, 0, 1480, 1080);
  paperLight.addColorStop(0, '#f7f9fa');
  paperLight.addColorStop(0.63, paper);
  paperLight.addColorStop(1, '#d2dfe8');
  ctx.fillStyle = paperLight;
  ctx.fillRect(0, 0, 1920, 1080);

  label(ctx, 'vLLM', 93, 106, 57, ink, 'Sans', 'left', 700);
  label(ctx, 'KV cache', 279, 106, 51);
  label(ctx, '4 positions per block', 1826, 103, 34, muted, 'Mono', 'right');
  line(ctx, 94, 146, 1826, 146, '#acbac8', 1.5);

  ctx.save();
  const close = 1-wide + returnToPrefix*(1-returnToPool);
  ctx.translate(190*close, -139*close);
  ctx.scale(1+0.26*close, 1+0.26*close);
  label(ctx, 'Request block tables', 100, 270, 37, muted);
  blockTable(ctx, 'R0', 105, 330, release);
  blockTable(ctx, 'R1', 548, 330, 0);

  const hero = { x: 145, y: 490, w: 811, depth: 174, face: 90 };
  const entryPulse = ease(clock.seconds / 1.45);
  const bluePulse = clock.index === 4 ? read : ease((clock.seconds - 0.18) / 1.55);
  chip(ctx, hero.x, hero.y, hero.w, hero.depth, hero.face, cache.get(12), {
    hero: true, read, nameKeys: keyLabel, nameValues: valueLabel,
  });
  pointer(ctx, 211, 344, 318, hero.y+6, orange, 1-release, entryPulse);
  pointer(ctx, 654, 344, 599, hero.y+6, blue, 1, bluePulse);

  label(ctx, 'Block 12', hero.x, 858, 66, ink, 'Sans', 'left', 700);
  const count = state.refs.get(12);
  label(ctx, count + (count === 1 ? ' reader' : ' readers'), 963, 854, 45, releasedNow ? blue : ink, 'Mono', 'right');

  const sideX = 1149+500*close, sideW = 609, sideD = 60, sideFace = 52;
  for (const [i, address] of [41, 73, 90].entries()) {
    const y = 257 + i * 236;
    const free = state.free.includes(address);
    const owner = Object.keys(state.tables).find((name) => state.tables[name].includes(address));
    label(ctx, 'Block ' + address, sideX + 5, y-25, 40, free ? muted : ink, 'Sans', 'left', 700);
    const tag = free ? '0 readers · free queue' : owner;
    const color = free ? muted : owner === 'R0' ? orange : blue;
    label(ctx, tag, sideX + sideW + 12, y-25, 34, color, free ? 'Sans' : 'Mono', 'right');
    const writingHere = address === destination.id;
    chip(ctx, sideX, y, sideW, sideD, sideFace, cache.get(address), {
      free,
      retainedSuffix: free ? oldSuffix : 0,
      read: released.tables.R1.includes(address) ? read : 0,
      newOffset: writingHere ? destination.offset : -1,
      write,
    });
    if (writingHere && token > 0 && write < 1) {
      const cx = sideX + (destination.offset+0.5) * sideW / blockSize;
      const end = y + sideD + sideFace;
      ctx.save();
      ctx.globalAlpha = token * (1-write);
      label(ctx, nextWord, cx, end+74-write*88, 42, blue, 'Serif', 'center');
      line(ctx, cx, end+7, cx, end+29-write*16, blue, 3);
      ctx.restore();
    }
  }
  if (read > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, read * 3);
    const positions = readHistory(decoded, released.tables.R1, r1.length+1).length;
    label(ctx, 'R1 reads ' + positions + ' positions', hero.x, 923, 34, blue, 'Mono');
    ctx.restore();
  }
  ctx.restore();
}

export default { title, beats, draw, check };

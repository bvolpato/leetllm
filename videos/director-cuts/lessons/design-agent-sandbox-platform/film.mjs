import assert from 'node:assert/strict';
import { cowSnapshot } from '../../../films/design-agent-sandbox-platform/arithmetic.mjs';

const title = 'Who changed the moth?';
const beats = [
  {
    id: 'orange-wings',
    say: 'Watch the wings. An agent is trying a new ink on this moth.',
    hold: 0.7,
  },
  {
    id: 'the-neighbor',
    say: 'The job next door draws the same moth. Both sandboxes started from the same memory snapshot. How did these wings stay blue?',
    hold: 1.3,
  },
  {
    id: 'before-the-stroke',
    say: 'Go back one stroke. Here are six pages of the saved memory. Follow the two lines to page two. Both sandboxes read the same byte there. Thirty selects blue.',
    hold: 1.1,
  },
  {
    id: 'lift-a-copy',
    say: 'Reading leaves that page shared. On the first write from A, the host copies the whole page. Look at the ink in the copy. It still holds thirty.',
    hold: 1.0,
  },
  {
    id: 'land-the-stroke',
    say: 'The host points A at its private copy. Now the write can finish. Ninety-nine selects orange. B still reads thirty from the snapshot.',
    hold: 1.0,
  },
  {
    id: 'the-price',
    say: 'That is copy-on-write. Changing one byte added a four-kibibyte page. For the pages here, that takes us from twenty-four kibibytes to twenty-eight.',
    hold: 0.8,
  },
  {
    id: 'one-more-ink',
    say: 'Watch the page count while A tries one more ink. The wings turn pink. A already owns the page it writes to. Seven pages, and the neighbor still has its blue moth.',
    hold: 3.0,
  },
];

const pageBytes = 4096;
const wingPage = 2;
const inkOffset = 136;
const wingInks = {
  30: ['#202745', '#26497c', '#3278bd', '#5aaae5', '#94d9f1'],
  99: ['#30233b', '#813d46', '#c55a3b', '#f3944e', '#ffd491'],
  76: ['#34233e', '#783454', '#bd427b', '#ee7fab', '#ffc7db'],
};

// Each view maps the same six pages from the lesson's snapshot fixture.
const base = cowSnapshot(0, 0).base.map((value, page) => {
  const bytes = new Uint8Array(pageBytes);
  for (let i = 0; i < bytes.length; i++) {
    const row = Math.floor(i / 64);
    const col = i % 64;
    bytes[i] = (value + 11 * row + (col ^ (row >> 2)) * (page + 4)) & 255;
  }
  bytes[inkOffset] = value;
  return bytes;
});

function newJobs() {
  return { A: [...base], B: [...base], privateWingPage: null };
}

function allocateCopy(jobs) {
  jobs.privateWingPage ??= base[wingPage].slice();
  return jobs.privateWingPage;
}

function wingPageForWrite(jobs) {
  jobs.A[wingPage] = allocateCopy(jobs);
  return jobs.A[wingPage];
}

function pageCount(jobs) {
  const physical = new Set([...base, ...jobs.A, ...jobs.B]);
  if (jobs.privateWingPage) physical.add(jobs.privateWingPage);
  return physical.size;
}

const same = newJobs();
const pending = newJobs();
const blueCopy = allocateCopy(pending);
const mapped = newJobs();
wingPageForWrite(mapped);
const orange = newJobs();
wingPageForWrite(orange)[inkOffset] = 99;
const pink = newJobs();
const firstPrivate = wingPageForWrite(pink);
firstPrivate[inkOffset] = 99;
wingPageForWrite(pink)[inkOffset] = 76;

function check() {
  const original = cowSnapshot(0, 1);
  assert.equal(pending.A[wingPage], pending.B[wingPage]);
  assert.equal(pageCount(pending), 7);
  assert.equal(mapped.A[wingPage], mapped.privateWingPage);
  assert.notEqual(mapped.A[wingPage], mapped.B[wingPage]);
  assert.equal(mapped.A[wingPage][inkOffset], 30);
  assert.equal(blueCopy.length, pageBytes);
  assert.deepEqual(blueCopy, base[wingPage]);
  assert.notEqual(blueCopy, base[wingPage]);
  assert.equal(pageCount(same) * pageBytes / 1024, 24);
  assert.equal(pageCount(orange) * pageBytes, original.residentBytes);
  assert.equal(pageCount(orange) * pageBytes / 1024, 28);
  assert.equal(orange.A[wingPage][inkOffset], original.a[wingPage]);
  assert.equal(orange.B[wingPage][inkOffset], original.b[wingPage]);
  assert.equal(orange.A[wingPage].filter((byte, i) => byte !== base[wingPage][i]).length, 1);
  assert.equal(pink.A[wingPage], firstPrivate);
  assert.equal(pink.A[wingPage][inkOffset], 76);
  assert.equal(pink.B[wingPage][inkOffset], 30);
  assert.equal(pageCount(pink), pageCount(orange));
  for (const state of [same, pending, mapped, orange, pink]) {
    base.forEach((page, i) => {
      assert.equal(state.B[i], page);
      if (i !== wingPage) assert.equal(state.A[i], page);
    });
  }
}

const clamp = x => Math.max(0, Math.min(1, x));
const lerp = (a, b, p) => a + (b - a) * p;
function ease(t) {
  const p = clamp(t);
  return p * p * (3 - 2 * p);
}

const surface = '#f3eced';
const grid = '#eae1e7';
const ink = '#332c43';
const dark = '#30283c';
const white = '#fff9f2';
const muted = '#c9bdd0';

function label(ctx, str, x, y, size, color, { align = 'left', mono = false, weight = 500 } = {}) {
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.font = weight + ' ' + size + 'px "' + (mono ? 'Lesson Mono' : 'Lesson Sans') + '"';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function inside(x, y, pts) {
  let hit = false;
  for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) {
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    if ((ay > y) !== (by > y) && x < ax + (y - ay) * (bx - ax) / (by - ay)) hit = !hit;
  }
  return hit;
}

function distanceToLine(x, y, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const p = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy));
  return Math.hypot(x - ax - p * dx, y - ay - p * dy);
}

// Draw the atlas once as runs of palette indices. Both jobs use this same sprite.
const forewing = [[2,24],[10,16],[24,11],[43,7],[57,1],[55,10],[50,18],[42,26],[31,31],[17,32],[6,30]];
const hindwing = [[3,28],[19,25],[33,25],[45,21],[44,31],[40,37],[33,41],[25,43],[22,51],[19,55],[19,47],[17,41],[12,41],[7,38],[4,33]];
const foreVeins = [[5,27,48,9],[7,27,47,17],[9,29,36,24]];
const hindVeins = [[5,29,39,31],[6,30,25,39],[7,31,18,39]];
const fixedColors = ['#312a41', '#51405a', '#8a697f', '#f6e3bc', '#fff6de'];
function marking(x, y) {
  for (const [cx, cy, rx, ry] of [[34,17,4.8,3.8],[26,34,4.6,3.6]]) {
    const ring = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
    if (ring < 0.15) return 9;
    if (ring < 0.46) return 5;
    if (ring < 0.8) return 8;
    if (ring < 1.25) return 1;
  }
  return null;
}
function mothPixel(px, y) {
  const x = Math.abs(px);
  if (x < 1.2 && y >= 16 && y < 40) return y % 4 === 0 ? 8 : 6;
  if (x < 2.5 && y >= 17 && y < 24) return y < 19 ? 8 : 7;
  if (x < 2 && y >= 23 && y < 35) return 5;
  if (y >= 5 && y < 17) {
    const stem = (17 - y) * 0.74 + 0.7;
    if (Math.abs(x - stem) < 0.75 || (y % 3 === 0 && x >= stem && x < stem + 3.3)) return 6;
  }
  const front = inside(x, y, forewing);
  const back = inside(x, y, hindwing);
  if (!front && !back) return -1;
  const shape = front ? forewing : hindwing;
  if (!inside(x + 1.15, y + 1, shape) || !inside(x - 1, y - 0.7, shape)) return 0;
  const spot = marking(x, y);
  if (spot !== null) return spot;
  const veins = front ? foreVeins : hindVeins;
  if (veins.some(v => distanceToLine(x, y, ...v) < 0.65)) return 1;
  const stripe = front ? x + 1.6 * y : x + 0.72 * y;
  if (front && stripe > 67 && stripe < 71) return (x + y) % 4 ? 8 : 4;
  if (!front && stripe > 56 && stripe < 60) return 4;
  if (front && stripe >= 71) return (x + 2 * y) % 9 < 2 ? 8 : 1;
  if (x < 8 || (!front && y > 38)) return 1;
  if (front && y < 17 - x / 9) return 4;
  return (Math.floor(x / 5) + Math.floor(y / 4)) % 5 === 0 ? 2 : 3;
}

const runs = [];
for (let y = 0; y < 56; y++) {
  let start = -57, color = -1;
  for (let x = -57; x <= 58; x++) {
    const next = mothPixel(x, y);
    if (next !== color) {
      if (color >= 0) runs.push([start, y, x - start, color]);
      start = x;
      color = next;
    }
  }
}

function moth(ctx, cx, cy, width, value) {
  const scale = width / 114;
  const colors = [...wingInks[value], ...fixedColors];
  const left = x => Math.round(cx + x * scale);
  const top = y => Math.round(cy + (y - 28) * scale);
  for (const [x,y,n,color] of runs) {
    ctx.fillStyle = colors[color];
    ctx.fillRect(left(x), top(y), left(x + n) - left(x), top(y + 1) - top(y));
  }
}

// The bucket's hotspot is the drop to the left of the pail.
const bucketStamp = [
  '      xxxx       ',
  '     x....x      ',
  '     x.xx.x      ',
  '    xx.xx.xxx    ',
  '   xoooxxooooX   ',
  '  xoooooooooooX  ',
  ' xoooooo.....ooX ',
  ' xxoooo......ooX ',
  'xoxxoo......ooX  ',
  'xox xx.....ooX   ',
  ' x   xx...ooX    ',
  '      xxxxXX     ',
];
function bucket(ctx, x, y, size, value, opacity) {
  ctx.save();
  ctx.globalAlpha *= opacity;
  const colors = { x: ink, X: ink, '.': white, o: wingInks[value][3] };
  bucketStamp.forEach((row, j) => [...row].forEach((ch, i) => {
    if (ch === ' ') return;
    ctx.fillStyle = colors[ch];
    ctx.fillRect(Math.round(x + i * size), Math.round(y + j * size), Math.ceil(size), Math.ceil(size));
  }));
  ctx.restore();
}

function inkSample(ctx, value, x, y) {
  ctx.fillStyle = ink;
  ctx.fillRect(x, y - 17, 34, 34);
  ctx.fillStyle = wingInks[value][3];
  ctx.fillRect(x + 4, y - 13, 26, 26);
  label(ctx, String(value), x + 47, y + 1, 33, ink, { mono: true });
}

function spriteArea(ctx, jobs, spread, openMemory, brush) {
  const edge = lerp(1920, 960, spread);
  const bottom = lerp(1080, 506, openMemory);
  const width = lerp(lerp(1170, 710, spread), 485, openMemory);
  const centerY = lerp(lerp(556, 566, spread), 326, openMemory);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 90, 1920, bottom - 90);
  ctx.clip();
  ctx.fillStyle = surface;
  ctx.fillRect(0, 90, 1920, bottom);
  ctx.fillStyle = grid;
  for (let y = 90, row = 0; y < bottom; y += 36, row++) {
    for (let x = 36 * (row % 2); x < 1920; x += 72) ctx.fillRect(x, y, 36, 36);
  }
  ctx.fillStyle = '#b3a5b7';
  ctx.fillRect(edge - 2, 90, 4, bottom - 90);
  for (const [i, job] of ['A', 'B'].entries()) {
    const left = i * edge;
    const val = jobs[job][wingPage][inkOffset];
    const cx = left + edge / 2;
    ctx.fillStyle = '#f7f0f0';
    ctx.fillRect(left, 90, edge - 2, 89);
    label(ctx, 'Sandbox ' + job, left + 64, 135, 43, ink, { weight: 700 });
    inkSample(ctx, val, left + edge - 156, 135);
    moth(ctx, cx, centerY, width, val);
    if (i === 0 && brush) {
      bucket(ctx, cx + width * 0.22 + brush.dx, centerY - width * 0.13 + brush.dy,
        lerp(8, 5, spread), brush.value, brush.opacity);
    }
  }
  ctx.restore();
}

const pageX = i => 665 + i * 217;
const privateX = 303;
const tile = 146;
const tileY = 723;

function thread(ctx, startX, endX, endY, color, offset, read) {
  ctx.beginPath();
  ctx.moveTo(startX, 494);
  ctx.bezierCurveTo(startX, 620 + offset, endX, 555 + offset, endX, endY);
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(startX, 494, 8, 0, Math.PI * 2);
  ctx.fill();
  if (read && read.progress > 0 && read.progress < 1) {
    const t = 1 - read.progress, u = 1 - t;
    const x = (u ** 3 + 3 * u * u * t) * startX + (3 * u * t * t + t ** 3) * endX;
    const y = u ** 3 * 494 + 3 * u * u * t * (620 + offset)
      + 3 * u * t * t * (555 + offset) + t ** 3 * endY;
    ctx.fillStyle = white;
    ctx.fillRect(x - 12, y - 12, 24, 24);
    ctx.fillStyle = wingInks[read.value][3];
    ctx.fillRect(x - 8, y - 8, 16, 16);
  }
}

function byteTile(ctx, bytes, x, y, selected) {
  const left = x - tile / 2, top = y - tile / 2;
  ctx.fillStyle = selected ? '#fbebd8' : '#94869f';
  ctx.fillRect(left - 3, top - 3, tile + 6, tile + 6);
  ctx.fillStyle = '#51465f';
  ctx.fillRect(left, top, tile, tile);
  // A thumbnail of the page, sampled at eight-byte intervals along each axis.
  const shades = ['#54495e', '#62566d', '#75657e', '#88758e', '#ab98ae'];
  const step = (tile - 16) / 8;
  for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
    const i = 8 * row * 64 + 8 * col;
    ctx.fillStyle = shades[Math.floor(bytes[i] * shades.length / 256)];
    ctx.fillRect(left + 8 + col * step, top + 8 + row * step, step - 1, step - 1);
  }
  if (selected) {
    const val = bytes[inkOffset];
    ctx.fillStyle = ink;
    ctx.fillRect(left + 9, y - 32, tile - 18, 64);
    ctx.fillStyle = wingInks[val][3];
    ctx.fillRect(left + 21, y - 15, 21, 30);
    label(ctx, String(val), x + 14, y, 46, white, { align: 'center', mono: true });
  }
}

function memory(ctx, state, lift, openMemory, emphasis, reads) {
  const shift = 595 * (1 - openMemory);
  ctx.save();
  ctx.translate(0, shift);
  ctx.fillStyle = dark;
  ctx.fillRect(0, 506, 1920, 584);
  ctx.fillStyle = '#a693ae';
  ctx.fillRect(0, 506, 1920, 4);
  label(ctx, 'Host memory', 56, 550, 42, white, { weight: 700 });
  const count = pageCount(state);
  label(ctx, count + ' pages  ·  ' + (count * pageBytes / 1024) + ' KiB',
    1854, 604, 43, emphasis ? '#ffda9c' : white, { align: 'right', mono: true });
  const sharedX = pageX(wingPage);
  const top = tileY - tile / 2;
  thread(ctx, 1440, sharedX + 21, top, '#9cbeed', 8, reads.B);
  const targetA = state.A[wingPage] === base[wingPage] ? sharedX - 21 : privateX;
  thread(ctx, 480, targetA, top, '#f0cfab', -18, reads.A);
  base.forEach((bytes, index) => {
    byteTile(ctx, bytes, pageX(index), tileY, index === wingPage);
    label(ctx, String(index), pageX(index), 836, 33, index === wingPage ? white : muted,
      { align: 'center', mono: true });
  });

  if (lift > 0) {
    const x = lerp(sharedX, privateX, lift);
    const y = tileY - 65 * Math.sin(Math.PI * lift);
    ctx.fillStyle = 'rgba(18,12,27,0.32)';
    ctx.fillRect(x - tile / 2 + 8, y - tile / 2 + 9, tile, tile);
    byteTile(ctx, state.privateWingPage, x, y, true);
    ctx.save();
    ctx.globalAlpha *= clamp((lift - 0.65) / 0.35);
    label(ctx, '4 KiB', privateX, 836, 35, muted, { align: 'center', mono: true });
    label(ctx, 'A’s private copy', privateX, 893, 43, '#f0cfab', { align: 'center' });
    ctx.restore();
  }

  ctx.beginPath();
  ctx.moveTo(pageX(0) - tile / 2, 862);
  ctx.lineTo(pageX(0) - tile / 2, 877);
  ctx.lineTo(pageX(base.length - 1) + tile / 2, 877);
  ctx.lineTo(pageX(base.length - 1) + tile / 2, 862);
  ctx.strokeStyle = '#a797ac';
  ctx.lineWidth = 3;
  ctx.stroke();
  label(ctx, 'Read-only snapshot', (pageX(0) + pageX(base.length - 1)) / 2, 915, 39, white,
    { align: 'center' });
  ctx.restore();

  // Keep the page connections behind the image surface while its cutaway opens.
  if (openMemory < 1) {
    ctx.fillStyle = dark;
    const boundary = lerp(1080, 506, openMemory);
    ctx.fillRect(0, boundary, 1920, Math.max(0, 506 + shift - boundary));
  }
}

function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  let spread = 1, openMemory = 1, lift = 0;
  let jobs = same;
  let brush;
  const reads = {};
  if (index === 0) {
    spread = 0;
    openMemory = 0;
    const tap = ease(elapsed / 0.55);
    jobs = elapsed < 0.55 ? same : orange;
    brush = { value: 99, dx: 70 * (1 - tap), dy: -84 * (1 - tap),
      opacity: 1 - ease((elapsed - 1.4) / 0.45) };
  } else if (index === 1) {
    openMemory = 0;
    spread = ease(elapsed / 1.35);
    jobs = orange;
  } else if (index === 2) {
    openMemory = ease(elapsed / 1.18);
    const read = { value: 30, progress: reveal('Both sandboxes read', 1.05) };
    reads.A = read;
    reads.B = read;
  } else if (index === 3) {
    lift = ease(reveal('On the first write', 1.7));
    jobs = lift > 0 ? pending : same;
  } else if (index === 4) {
    lift = 1;
    jobs = reveal('points A', 0.22) === 1 ? mapped : pending;
    if (reveal('Now the write', 0.16) === 1) jobs = orange;
    reads.B = { value: 30, progress: reveal('B still reads', 0.9) };
  } else {
    lift = 1;
    jobs = orange;
    if (index === 6) {
      openMemory = 1 - ease(reveal('and the neighbor', 1.25));
      const change = reveal('one more ink', 0.34);
      if (change === 1) jobs = pink;
      brush = { value: 76, dx: 34 * (1 - change), dy: -48 * (1 - change),
        opacity: reveal('while A tries', 0.3) * (1 - reveal('The wings turn', 0.35)) };
    }
  }

  ctx.fillStyle = dark;
  ctx.fillRect(0, 0, 1920, 1080);
  spriteArea(ctx, jobs, spread, openMemory, brush);
  if (openMemory > 0) memory(ctx, jobs, lift, openMemory, index === 5, reads);

  ctx.fillStyle = '#382e47';
  ctx.fillRect(0, 0, 1920, 90);
  // The file glyph uses the same two wing tips as the work on the canvas.
  ctx.fillStyle = '#eabdb0';
  for (const [x, y, w] of [[0,0,9],[29,0,9],[0,8,38],[8,16,22],[13,24,12]]) {
    ctx.fillRect(66 + x, 29 + y, w, 7);
  }
  label(ctx, 'moth.sprite', 128, 46, 37, white, { mono: true });
  const mode = ['Wing ink', 'Wing ink', 'Before the write', 'First write',
    'First write', 'Wing ink', 'Wing ink'][index];
  label(ctx, mode, 1855, 46, 35, '#e0ccdb', { align: 'right' });
}

export default { title, beats, draw, check };

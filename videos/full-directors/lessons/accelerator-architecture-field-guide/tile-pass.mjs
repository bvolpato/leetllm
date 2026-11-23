import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';

// Two passes of a BF16 projection, both starting with empty local storage.
// Only input transfers are charged. Each tile spans the full reduction axis.
const M = 32;
const K = 32;
const N = 128;
const rows = M / 2;
const columns = N / 2;
const kib = { X: (rows * K * 2) / 1024, W: (K * columns * 2) / 1024 };
const matrix = (h, w, fn) =>
  Array.from({ length: h }, (_, i) => Array.from({ length: w }, (_, j) => fn(i, j)));

// The projection smooths the rows of a two-source ripple field. The operands
// contain only small integers and binary fractions, all representable in BF16.
const X = matrix(M, K, (i, k) => {
  const d = Math.abs(i - k);
  return d === 0 ? 0.5 : d === 1 || d === K - 1 ? 0.25 : 0;
});
const W = matrix(K, N, (k, j) => {
  const a = Math.hypot(j - 36, (k - 22) * 1.25);
  const b = Math.hypot(j - 91, (k - 8) * 1.25);
  return Math.round(48 * Math.cos(a * 0.39) + 32 * Math.cos(b * 0.34));
});
function dot(i, j) {
  return X[i].reduce((sum, activation, k) => sum + activation * W[k][j], 0);
}
const output = matrix(M, N, dot);

function run(route) {
  let residentX = null;
  let residentW = null;
  let bytesReadKiB = 0;
  const reads = [];
  const tiles = route.map(([i, j]) => {
    const incoming = [];
    for (const [kind, id, resident] of [
      ['X', i, residentX],
      ['W', j, residentW],
    ]) {
      if (id === resident) continue;
      const repeat = reads.some((read) => read.kind === kind && read.id === id);
      const read = { kind, id, start: bytesReadKiB, size: kib[kind], repeat };
      incoming.push(read);
      reads.push(read);
      bytesReadKiB += read.size;
    }
    const tile = { i, j, previous: { X: residentX, W: residentW }, incoming, bytesReadKiB };
    residentX = i;
    residentW = j;
    return tile;
  });
  return { tiles, reads, bytesReadKiB };
}
const across = run([
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
]);
const down = run([
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
]);

const ink = '#252344';
const dim = '#514f6c';
const paper = '#f5f1e9';
const color = { X: ['#28549c', '#3f62b6'], W: ['#a13d26', '#bc502c'] };
const tint = { X: '#aecbf3', W: '#ffbd86' };
const clamp = (n) => Math.max(0, Math.min(1, n));
const ease = (n) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};

function label(ctx, text, x, y, size, options = {}) {
  ctx.font =
    (options.bold ? '600 ' : '400 ') + size + 'px "Lesson ' + (options.face ?? 'Sans') + '"';
  ctx.fillStyle = options.color ?? ink;
  ctx.textAlign = options.align ?? 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}
function rect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}
function line(ctx, points, stroke, width = 1) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}
function rim(ctx, x, y, w, h, stroke, width = 2) {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.strokeRect(x, y, w, h);
}

// The copper and blue dies share a pixel pitch, so their face areas
// show their actual byte ratio. The local slots stay still in both passes.
const sockets = {
  X: { x: 274, y: 282, w: 124, h: 62 },
  W: { x: 212, y: 408, w: 248, h: 124 },
};
const screen = { x: 684, y: 258, pitch: 9 };
const tileWidth = columns * screen.pitch;
const tileHeight = rows * screen.pitch;
const trace = { x: 324, pitch: 67, y: [728, 823], height: 64 };

function substrate(ctx) {
  const base = ctx.createLinearGradient(0, 0, 1620, 1080);
  base.addColorStop(0, '#e6deef');
  base.addColorStop(0.4, '#e8e7f1');
  base.addColorStop(1, '#c2c8e1');
  rect(ctx, 0, 0, 1920, 1080, base);

  // Diced edge with exposed bond pads and nested metal traces.
  rect(ctx, 0, 0, 1920, 39, '#33345a');
  for (let i = 0; i < 45; i++) {
    const x = -13 + i * 45;
    const metal = ctx.createLinearGradient(x, 0, x + 24, 34);
    metal.addColorStop(0, '#e3a99a');
    metal.addColorStop(0.42, '#f1d7a9');
    metal.addColorStop(1, '#916c84');
    rect(ctx, x, 0, 29, 26, metal);
    rim(ctx, x + 4, -2, 21, 22, '#5c526c', 1.3);
  }
  for (let i = 0; i < 8; i++) {
    const d = i * 6;
    line(
      ctx,
      [
        [0, 50 + d],
        [439 - d, 50 + d],
        [477 - d, 88 + d],
        [737 + d, 88 + d],
        [775 + d, 50 + d],
        [1920, 50 + d],
      ],
      '#9793b144',
      1.5,
    );
  }

  // The two slot outlines include their contact fingers.
  for (const [kind, s] of Object.entries(sockets)) {
    for (let i = 4; i < s.w; i += 11) {
      rect(ctx, s.x + i, s.y - 9, 4, s.h + 18, '#9692ad');
    }
    rect(ctx, s.x - 5, s.y - 5, s.w + 10, s.h + 10, '#9594ac');
    rect(ctx, s.x - 2, s.y - 2, s.w + 4, s.h + 4, '#58556e');
    rect(ctx, s.x, s.y, s.w, s.h, '#c9c7d6');
    const center = s.y + s.h / 2;
    for (let i = 0; i < 7; i++) {
      const yy = center + (i - 3) * 5;
      line(
        ctx,
        [
          [0, yy + 18],
          [82 - i * 3, yy + 18],
          [100 - i * 3, yy],
          [s.x - 10, yy],
        ],
        '#87849c77',
        1.5,
      );
    }
    label(
      ctx,
      kind === 'X' ? 'Activations  ·  1 KiB' : 'Weights  ·  4 KiB',
      336,
      s.y + s.h + 36,
      35,
      { align: 'center', color: dim },
    );
  }

  label(ctx, 'Local memory', 92, 166, 64, { face: 'Serif' });
  label(ctx, 'Projection output', screen.x, 165, 64, { face: 'Serif' });
  const { x, y, pitch } = screen;
  const w = N * pitch,
    h = M * pitch;
  rect(ctx, x - 6, y - 6, w + 12, h + 12, '#88869d');
  rect(ctx, x - 2, y - 2, w + 4, h + 4, '#f7f4ff');
  rect(ctx, x, y, w, h, '#423e60');
  for (let xx = 0; xx < N; xx += 2) {
    for (let yy = 0; yy < M; yy += 2) {
      rect(ctx, x + xx * pitch + 3, y + yy * pitch + 3, 4, 4, '#686481');
    }
  }
  for (let j = 0; j < 2; j++) {
    label(ctx, 'W' + j, x + (j + 0.5) * tileWidth, y - 37, 36, {
      face: 'Mono',
      align: 'center',
      color: dim,
    });
  }
  for (let i = 0; i < 2; i++) {
    label(ctx, 'X' + i, x - 9, y + (i + 0.5) * tileHeight, 36, {
      face: 'Mono',
      align: 'right',
      color: dim,
    });
  }
  line(
    ctx,
    [
      [0, 631],
      [505, 631],
      [536, 600],
      [1920, 600],
    ],
    '#9490ac',
    2,
  );
  line(
    ctx,
    [
      [0, 637],
      [509, 637],
      [540, 606],
      [1920, 606],
    ],
    '#ffffffaa',
    2,
  );

  label(ctx, 'Input reads', 92, 679, 54, { face: 'Serif' });
  label(ctx, 'Across first', 92, trace.y[0] + 32, 36, { bold: true });
  // Each etch is one KiB. The photographed traces share the same origin.
  for (const yTrace of trace.y) {
    for (let i = 0; i <= across.bytesReadKiB; i++) {
      const xx = trace.x + i * trace.pitch;
      rect(ctx, xx, yTrace + trace.height + 4, 2, i % 4 === 0 ? 11 : 6, '#9993ae');
    }
  }
}

function makeDie(kind, id) {
  const s = sockets[kind];
  const c = createCanvas(s.w, s.h);
  const ctx = c.getContext('2d');
  rect(ctx, 0, 0, s.w, s.h, color[kind][id]);
  // Etch the stored values into the surface of each tile.
  const h = kind === 'X' ? rows : K;
  const w = kind === 'X' ? K : columns;
  const dx = s.w / w,
    dy = s.h / h;
  for (let i = 0; i < h; i++) {
    for (let j = 0; j < w; j++) {
      const value = kind === 'X' ? X[id * rows + i][j] * 2 : (W[i][id * columns + j] + 80) / 160;
      ctx.globalAlpha = 0.15 + value * 0.8;
      rect(ctx, j * dx, i * dy, dx - 0.7, dy - 0.6, tint[kind]);
    }
  }
  ctx.globalAlpha = 1;
  const tagWidth = kind === 'X' ? 80 : 103;
  rect(ctx, 0, 0, tagWidth, Math.min(s.h, 62), color[kind][id]);
  label(ctx, kind + id, tagWidth / 2, 29, 43, { face: 'Mono', align: 'center', color: '#fff7e7' });
  rim(ctx, 1, 1, s.w - 2, s.h - 2, tint[kind]);
  return c;
}

const heat = [
  '#212346',
  '#35346d',
  '#59528b',
  '#7e70aa',
  '#ac90b0',
  '#e4aea4',
  '#ffd7a4',
  '#ffeed0',
];
function prepareArt() {
  const wafer = createCanvas(1920, 1080);
  substrate(wafer.getContext('2d'));
  const field = createCanvas(N, M);
  const ctx = field.getContext('2d');
  output.forEach((row, i) =>
    row.forEach((value, j) => {
      rect(
        ctx,
        j,
        i,
        1,
        1,
        heat[Math.min(heat.length - 1, Math.floor(((value + 80) / 160) * heat.length))],
      );
    }),
  );
  return {
    wafer,
    field,
    dies: { X: [makeDie('X', 0), makeDie('X', 1)], W: [makeDie('W', 0), makeDie('W', 1)] },
  };
}

function cueState(clock) {
  const { index, elapsed, reveal } = clock;
  switch (index) {
    case 0:
      return {
        route: across,
        position: 0.55 * ease(0.32 + elapsed / 2.8) + 0.45 * reveal('Look over to the right', 1.35),
        closeup: 1 - ease(reveal('one kibibyte of activations', 2.0)),
      };
    case 1:
      return {
        route: across,
        position: 1 + reveal('Move one patch', 1.8) + reveal('Now watch the copper slot', 2.2),
      };
    case 2:
      return { route: across, position: 3 + reveal('Finish the row', 2.0) };
    case 3:
      return { route: down, position: reveal('Start again', 2.1), erase: 1 - ease(elapsed / 0.72) };
    case 4:
      return {
        route: down,
        position:
          1 +
          reveal('Try the patch below', 1.65) +
          reveal('Cross to the next column', 1.6) +
          reveal('go down again', 1.65),
      };
    default:
      return {
        route: down,
        position: 4,
        acrossRepeats: reveal('Across repeated', 0.45, { captionStart: false }),
        downRepeats: reveal('Down repeated', 0.45, { captionStart: false }),
        saving: reveal('That saves six kibibytes', 0.45, { captionStart: false }),
      };
  }
}

function putDie(ctx, art, kind, id, x, y, lift, opacity = 1) {
  if (id === null || opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha *= opacity;
  ctx.shadowColor = 'rgba(42,35,70,0.40)';
  ctx.shadowBlur = 3 + lift * 10;
  ctx.shadowOffsetX = lift * 6;
  ctx.shadowOffsetY = 3 + lift * 13;
  ctx.drawImage(art.dies[kind][id], x, y - lift * 8);
  ctx.restore();
}

function slots(ctx, art, route, position) {
  const step = Math.min(3, Math.floor(position));
  const t = position - step;
  const tile = route.tiles[step];
  for (const [kind, id] of [
    ['X', tile.i],
    ['W', tile.j],
  ]) {
    const s = sockets[kind];
    const old = tile.previous[kind];
    if (id === old) {
      putDie(ctx, art, kind, id, s.x, s.y, 0);
      continue;
    }
    const incoming = ease(t / 0.55);
    if (incoming < 1) putDie(ctx, art, kind, old, s.x, s.y, 0, 1 - ease(t / 0.28));
    const x = -s.w + (s.x + s.w) * incoming;
    putDie(ctx, art, kind, id, x, s.y, 1 - incoming);
  }
}

function patches(ctx, art, route, position) {
  ctx.imageSmoothingEnabled = false;
  route.tiles.forEach(({ i, j }, index) => {
    const fill = ease((position - index - 0.55) / 0.45);
    if (!fill) return;
    const x = screen.x + j * tileWidth,
      y = screen.y + i * tileHeight;
    const width = Math.min(columns, Math.ceil(columns * fill));
    ctx.drawImage(
      art.field,
      j * columns,
      i * rows,
      width,
      rows,
      x,
      y,
      width * screen.pitch,
      tileHeight,
    );
    if (fill < 1) rect(ctx, x + (width - 1) * screen.pitch, y, 4, tileHeight, '#fff6ce');
  });
  const cx = screen.x + tileWidth,
    cy = screen.y + tileHeight;
  line(
    ctx,
    [
      [cx, screen.y],
      [cx, cy + tileHeight],
    ],
    '#e5deed',
    4,
  );
  line(
    ctx,
    [
      [screen.x, cy],
      [cx + tileWidth, cy],
    ],
    '#e5deed',
    4,
  );
  const active = route.tiles[Math.max(0, Math.ceil(position) - 1)];
  if (position < 4) {
    const px = screen.x + active.j * tileWidth,
      py = screen.y + active.i * tileHeight;
    for (const [x, sx] of [
      [px + 5, 1],
      [px + tileWidth - 5, -1],
    ]) {
      for (const [y, sy] of [
        [py + 5, 1],
        [py + tileHeight - 5, -1],
      ]) {
        line(
          ctx,
          [
            [x + sx * 20, y],
            [x, y],
            [x, y + sy * 20],
          ],
          '#fff3cd',
          5,
        );
      }
    }
  }
}

// Record a read when the tile is seated. Width always measures input bytes,
// independent of the time allowed for the illustrated motion.
function printTrace(ctx, route, row, position, repeats) {
  const y = trace.y[row];
  let total = 0;
  for (const [index, tile] of route.tiles.entries()) {
    if (position - index < 0.55 - 1e-8) break;
    for (const read of tile.incoming) {
      const x = trace.x + read.start * trace.pitch;
      const w = read.size * trace.pitch;
      ctx.save();
      if (!read.repeat) ctx.globalAlpha *= 1 - 0.53 * repeats;
      rect(ctx, x, y, w - 3, trace.height, color[read.kind][read.id]);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w - 3, trace.height);
      ctx.clip();
      for (let xx = x + 4; xx < x + w + 50; xx += 13) {
        line(
          ctx,
          [
            [xx, y + 1],
            [xx - 23, y + trace.height - 1],
          ],
          '#ffd9b921',
          2,
        );
      }
      ctx.restore();
      for (let k = 1; k < read.size; k++) {
        line(
          ctx,
          [
            [x + k * trace.pitch, y + 4],
            [x + k * trace.pitch, y + 15],
          ],
          '#ffd9b9',
          2,
        );
      }
      label(ctx, read.kind + read.id, x + w / 2, y + trace.height / 2, 39, {
        face: 'Mono',
        align: 'center',
        color: '#fff8ee',
      });
      ctx.restore();
    }
    total = tile.bytesReadKiB;
  }
  if (total > 0)
    label(ctx, total + ' KiB', trace.x + total * trace.pitch + 25, y + trace.height / 2, 45, {
      bold: true,
    });
}

let art;
function draw(ctx, clock) {
  art ??= prepareArt();
  const {
    route, position, erase = 0, saving = 0, acrossRepeats = 0, downRepeats = 0, closeup = 0,
  } = cueState(clock);
  ctx.save();
  if (closeup > 0) {
    // Start at the memory boundary. Pull back once to include the output
    // and both read histories, then keep that scale for the comparison.
    const scale = 1 + 2.06 * closeup;
    ctx.scale(scale, scale);
    ctx.translate(0, -255 * closeup);
  }
  ctx.drawImage(art.wafer, 0, 0);
  if (erase > 0) {
    ctx.save();
    ctx.globalAlpha = erase;
    slots(ctx, art, across, 4);
    patches(ctx, art, across, 4);
    ctx.restore();
  }
  if (erase === 0 || position > 0) {
    slots(ctx, art, route, position);
    patches(ctx, art, route, position);
  }
  printTrace(ctx, across, 0, route === across ? position : 4, acrossRepeats);
  if (route === down) {
    label(ctx, clock.index === 3 ? 'Replay' : 'Down first', 92, trace.y[1] + 32, 36, {
      bold: true,
    });
    printTrace(ctx, down, 1, position, downRepeats);
  }
  if (saving > 0) {
    ctx.globalAlpha = saving;
    const a = trace.x + down.bytesReadKiB * trace.pitch;
    const b = trace.x + across.bytesReadKiB * trace.pitch;
    const y = 710;
    line(
      ctx,
      [
        [a, y + 12],
        [a, y],
        [b, y],
        [b, y + 12],
      ],
      ink,
      3,
    );
    label(ctx, across.bytesReadKiB - down.bytesReadKiB + ' KiB saved', (a + b) / 2, y - 35, 46, {
      face: 'Serif',
      align: 'center',
    });
  }
  ctx.restore();
}

function check() {
  assert.deepEqual(kib, { X: 1, W: 4 });
  assert.deepEqual(
    across.tiles.map((tile) => tile.bytesReadKiB),
    [5, 9, 14, 18],
  );
  assert.deepEqual(
    down.tiles.map((tile) => tile.bytesReadKiB),
    [5, 6, 11, 12],
  );
  const weights = (route) => route.reads.filter((read) => read.kind === 'W').map((read) => read.id);
  assert.deepEqual(weights(across), [0, 1, 0, 1]);
  assert.deepEqual(weights(down), [0, 1]);
  for (const route of [across, down]) {
    const result = matrix(M, N, () => null);
    let localX, localW;
    for (const tile of route.tiles) {
      for (const read of tile.incoming) {
        if (read.kind === 'X') localX = X.slice(read.id * rows, (read.id + 1) * rows);
        else localW = W.map((row) => row.slice(read.id * columns, (read.id + 1) * columns));
      }
      for (let i = 0; i < rows; i++)
        for (let j = 0; j < columns; j++) {
          const row = result[tile.i * rows + i],
            col = tile.j * columns + j;
          assert.equal(row[col], null);
          row[col] = localX[i].reduce((s, x, k) => s + x * localW[k][j], 0);
        }
    }
    assert.deepEqual(result, output);
  }
  const repeatKiB = (route) =>
    route.reads.reduce((sum, read) => sum + (read.repeat ? read.size : 0), 0);
  assert.equal(repeatKiB(across), 8);
  assert.equal(repeatKiB(down), 2);
  assert.equal(across.bytesReadKiB - down.bytesReadKiB, 6);
}

export { draw as drawTilePass, check as checkTilePass };

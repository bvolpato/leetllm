import assert from 'node:assert/strict';
import { place } from '../../../films/local-llm-placement/model.mjs';

const split = place(8);
const reference = place(16);
const seam = split.cpuBlocks;
const blocks = split.blocks;
const perBlock = split.deviceWeightGB / split.gpuBlocks;
const fixedGB = split.budget - split.deviceWeightGB;

const beats = [
  {
    id: 'the-waiting-block',
    say: 'Watch those two numbers change. Block sixteen just finished on the CPU. The next block is on the GPU, across the board. What has to travel for that block to start?',
    hold: 1.5,
  },
  {
    id: 'where-the-weights-live',
    say: 'Look above the processors. Each blue slice stands for one block’s weights. Our thirty-two blocks are all the same size, three tenths of a gigabyte each. On this eight gigabyte GPU, other allocations take the striped part.',
    hold: 0.8,
  },
  {
    id: 'sixteen-on-each-side',
    say: 'Four point eight gigabytes left for weights. Sixteen blocks fit. We put the last sixteen there. The CPU runs the first sixteen using weights in host RAM. Now watch the gap.',
    hold: 1.35,
  },
  {
    id: 'the-handoff',
    say: "Follow that pair across. Block seventeen takes it just as it came out of sixteen. That’s the activation, the intermediate result for this token. We've given it just two entries so you can follow both. Now the GPU reads its own weights and changes those numbers again.",
    hold: 1.05,
  },
  {
    id: 'finish-the-token-step',
    say: 'Follow it through the remaining blocks. Each one takes the previous block’s output. Look back at host RAM. All sixteen sets of weights are still there.',
    hold: 1,
  },
  {
    id: 'same-calculation',
    say: 'Here’s the final pair for the same input with all thirty-two blocks on the GPU. The numbers match. Splitting this calculation added one transfer, from block sixteen to block seventeen.',
    hold: 2.3,
  },
];

const white = '#fff7e5';
const ink = '#121c3a';
const ice = '#bbdcec';
const amber = '#ffc45f';
const cpuX = 464;
const gpuX = 1456;
const pairY = 607;
const clamp = (n) => Math.max(0, Math.min(1, n));
const smooth = (n) => {
  const p = clamp(n);
  return p * p * (3 - 2 * p);
};
const mix = (a, b, t) => a + (b - a) * t;
const digits = (n) => n.toFixed(4);

function vectorAfter(count) {
  return blocks[count - 1].output;
}

function state(clock) {
  const { index, elapsed, reveal } = clock;
  let count = seam;
  if (index === 0) count = seam - 3 + Math.min(3, Math.floor(elapsed / 0.46));
  if (index === 4) {
    const run = smooth(reveal('Follow it', 4.8));
    count = seam + 1 + Math.floor(run * (blocks.length - seam - 1));
  }
  if (index === 3 && reveal('reads its own weights', 1.5) === 1) count = seam + 1;
  if (index >= 5) count = blocks.length;

  let cross = 0;
  if (index === 2) cross = 0.5 * smooth(reveal('Now watch the gap', 2.2));
  if (index === 3) cross = 0.5 + 0.5 * smooth(elapsed / 1.25);
  if (index > 3) cross = 1;

  const fadeBudget = index === 3 ? 1 - smooth(elapsed / 1.4) : Number(index === 2);
  const measure = index === 1 ? smooth(reveal('On this eight gigabyte GPU', 1)) : fadeBudget;
  const showFixed = index === 1 ? smooth(reveal('other allocations', 0.75)) : fadeBudget;
  const available = index === 2 ? smooth(reveal('Four point eight', 0.8)) : fadeBudget;
  const comparison = index === 5 ? smooth(reveal('the same input', 1)) : 0;

  // A macro view of block 16 opens out to show the waiting processor.
  const opening = index === 0 ? 1 - smooth(reveal('The next block', 2.1)) : 0;
  const capacity =
    index === 1
      ? smooth(reveal('On this eight gigabyte GPU', 1.9))
      : index === 2
        ? 1 - smooth(reveal('The CPU runs', 2.1))
        : 0;
  const finish = index === 5 ? smooth(reveal('Here’s the final pair', 1.9)) : 0;
  const scale = 1.04 + 1.58 * opening + 0.49 * capacity + 0.68 * finish;
  const cameraX = 960 + (cpuX - 960) * opening + 425 * capacity + 390 * finish;
  const cameraY = 490 + 125 * opening - 40 * capacity + 202 * finish;
  return { count, cross, measure, showFixed, available, comparison, scale, cameraX, cameraY };
}

function path(ctx, points, color, width = 1) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const pt of points.slice(1)) ctx.lineTo(...pt);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function box(ctx, x, y, w, h, radius, color, edge) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = color;
  ctx.fill();
  if (edge) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = edge;
    ctx.stroke();
  }
}

function grad(ctx, x, y, endX, endY, stops) {
  const g = ctx.createLinearGradient(x, y, endX, endY);
  for (const [at, col] of stops) g.addColorStop(at, col);
  return g;
}

function label(ctx, text, x, y, size, color, align = 'left', mono = false, weight = 500) {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + (mono ? 'Mono' : 'Sans') + '"';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  // Let annotations leave with their objects during a camera move.
  const view = ctx.getTransform();
  const width = ctx.measureText(text).width * view.a;
  const start =
    view.a * x + view.e - width * (align === 'center' ? 0.5 : Number(align === 'right'));
  const centerY = view.d * y + view.f;
  const margin = Math.min(
    start,
    1920 - start - width,
    centerY - (size * view.d) / 2,
    1080 - centerY - (size * view.d) / 2,
  );
  ctx.save();
  ctx.globalAlpha *= smooth(margin / 25);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function via(ctx, x, y, r = 5) {
  ctx.fillStyle = '#5291b0';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = '#203b6c';
  ctx.beginPath();
  ctx.arc(x + 0.6, y + 0.7, r * 0.54, 0, 2 * Math.PI);
  ctx.fill();
}

function capacitor(ctx, x, y, vertical) {
  ctx.save();
  ctx.translate(x, y);
  if (vertical) ctx.rotate(Math.PI / 2);
  box(ctx, -18, -8, 38, 22, 4, '#173563');
  box(ctx, -20, -10, 40, 18, 3, '#b1c1cc');
  box(ctx, -12, -11, 24, 19, 2, '#b7a591');
  path(
    ctx,
    [
      [-10, -9],
      [10, -9],
    ],
    '#e2d5c3',
    2.5,
  );
  ctx.restore();
}

function board(ctx) {
  ctx.fillStyle = grad(ctx, 0, 40, 1700, 1100, [
    [0, '#4079aa'],
    [0.36, '#325d94'],
    [0.8, '#263d79'],
    [1, '#354584'],
  ]);
  ctx.fillRect(-700, -550, 3320, 2180);

  // The low-contrast copper routes keep the data link recognizable at its bends.
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side < 0 ? 0 : 1920, 0);
    ctx.scale(side < 0 ? 1 : -1, 1);
    for (let i = 0; i < 11; i++) {
      const d = i * 13;
      path(
        ctx,
        [
          [-40, 334 + d],
          [55 + d, 334 + d],
          [138 + d, 417 + d],
          [138 + d, 807 + d],
          [70 + d, 875 + d],
          [-40, 875 + d],
        ],
        '#2b5788',
        5,
      );
      path(
        ctx,
        [
          [430 + d, -20],
          [430 + d, 55 - i * 3],
          [358 + d, 127 - i * 3],
        ],
        '#366897',
        4,
      );
      via(ctx, 358 + d, 127 - i * 3, 3.4);
    }
    for (let i = 0; i < 6; i++) {
      capacitor(ctx, 140 + (i % 2) * 25, 680 + Math.floor(i / 2) * 54, true);
      capacitor(ctx, 760 + (i % 3) * 60, 65 + Math.floor(i / 3) * 29, false);
    }
    for (let i = 0; i < 10; i++) via(ctx, 130 + 25 * i, 994, 4);
    ctx.restore();
  }
}

function signalLink(ctx, s) {
  for (let i = 0; i < 9; i++) {
    const dy = (i - 4) * 7;
    const pts = [
      [cpuX, pairY + dy],
      [721 - dy / 2, pairY + dy],
      [778 - dy / 2, pairY + dy + 57],
      [1140 + dy / 2, pairY + dy + 57],
      [1197 + dy / 2, pairY + dy],
      [gpuX, pairY + dy],
    ];
    path(ctx, pts, '#182d59', 5.5);
    path(ctx, pts, '#89a4ba', 2.4);
    if (s.cross > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(cpuX, 452, (gpuX - cpuX) * s.cross, 290);
      ctx.clip();
      path(ctx, pts, i % 2 ? '#d79452' : '#f6c17c', 2.5);
      ctx.restore();
    }
  }
  label(ctx, 'Host–device link', 960, 752, 33, ice, 'center');
}

const slotW = 27;
const arrayW = slotW * seam;
const gpuMemoryLeft = 1090;
const hostMemoryLeft = cpuX - arrayW / 2;
const memoryY = 210;
const memoryH = 98;

function memory(ctx, side, s) {
  const host = side === 'CPU';
  const x = host ? hostMemoryLeft : gpuMemoryLeft;
  const count = host ? split.cpuBlocks : split.gpuBlocks;
  const w = count * slotW;
  const otherW = host ? 0 : (fixedGB / perBlock) * slotW;
  const right = x + w + otherW;
  const chipX = host ? cpuX : gpuX;
  const firstBlock = host ? 1 : seam + 1;
  const lastBlock = firstBlock + count - 1;
  const pinY = memoryY + memoryH + 14;
  for (let i = -5; i <= 5; i++) {
    const startX = x + w / 2 + i * 12;
    const endX = chipX + i * 12;
    const midY = 385 - i * 3;
    path(
      ctx,
      [
        [startX, pinY],
        [startX, midY],
        [endX, midY + Math.abs(endX - startX)],
        [endX, 475],
      ],
      '#203c70',
      5,
    );
  }
  label(ctx, host ? 'Host RAM' : 'GPU memory', x, memoryY - 58, 51, white, 'left', false, 700);

  // This window maps allocations. The divisions are block weights, not DRAM chips.
  box(ctx, x - 12, memoryY - 6, w + otherW + 24, memoryH + 21, 7, '#193152');
  box(ctx, x - 12, memoryY - 12, w + otherW + 24, memoryH + 20, 7, '#a2b9c5');
  box(ctx, x - 7, memoryY - 8, w + otherW + 14, memoryH + 12, 4, '#141d36');
  for (let i = 0; i < count; i++) {
    const xx = x + i * slotW;
    const active = s.count === firstBlock + i;
    const tone = active ? '#b9f8ff' : '#71bdde';
    ctx.fillStyle = grad(ctx, 0, memoryY, 0, memoryY + memoryH, [
      [0, tone],
      [0.45, active ? '#a2eaff' : '#4c9ac8'],
      [1, active ? '#9cceec' : '#3874aa'],
    ]);
    ctx.fillRect(xx + 1, memoryY, slotW - 3, memoryH);
    for (let n = 1; n < 7; n++) {
      ctx.fillStyle = n % 3 === 0 ? '#4382a7' : '#5999bb';
      ctx.fillRect(xx + 4, memoryY + n * 13, slotW - 9, 2);
    }
    if (active) {
      ctx.fillStyle = '#fff3c6';
      ctx.fillRect(xx + 1, memoryY + memoryH - 7, slotW - 3, 7);
    }
  }
  if (otherW) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + w, memoryY, otherW, memoryH);
    ctx.clip();
    ctx.fillStyle = '#354363';
    ctx.fillRect(x + w, memoryY, otherW, memoryH);
    for (let j = -memoryH; j < otherW + 20; j += 16)
      path(
        ctx,
        [
          [x + w + j, memoryY + memoryH],
          [x + w + j + memoryH, memoryY],
        ],
        '#657391',
        6,
      );
    if (s.showFixed > 0) {
      ctx.globalAlpha = s.showFixed;
      box(ctx, x + w + otherW / 2 - 84, memoryY + 24, 168, 50, 3, '#283650');
      label(
        ctx,
        fixedGB.toFixed(1) + ' GB',
        x + w + otherW / 2,
        memoryY + 50,
        34,
        white,
        'center',
        true,
      );
    }
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = s.measure;
    label(ctx, split.budget + ' GB', right, memoryY - 58, 43, white, 'right', true);
    ctx.restore();
  }
  const range =
    !host && s.available > 0.5
      ? split.deviceWeightGB.toFixed(1) + ' GB  ·  ' + count + ' blocks'
      : 'Weights ' + firstBlock + '–' + lastBlock;
  label(ctx, range, x + w / 2, memoryY + memoryH + 47, 34, white, 'center', false, 600);
}

function packageBody(ctx, cx, gpu) {
  const y = 440,
    w = 506,
    h = 348,
    x = cx - w / 2;
  box(ctx, x + 6, y + 15, w, h, 16, '#1a3258');
  box(ctx, x, y, w, h, 16, '#273f50', '#89a4ab');
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 23; i++) {
      const px = x + 33 + i * 20,
        py = y + 13 + row * 7;
      ctx.fillStyle = row % 2 ? '#839a97' : '#afc3b9';
      ctx.fillRect(px, py, 7, 3);
      ctx.fillRect(px, y + h - (py - y) - 3, 7, 3);
    }
  }
  const metal = grad(ctx, x, y, x + w, y + h, [
    [0, '#f6f4e8'],
    [0.19, '#bfc8cf'],
    [0.42, '#e2e7e2'],
    [0.75, '#b6c1c9'],
    [1, '#9ba8b6'],
  ]);
  const rim = [
    [x + 48, y + 37],
    [x + w - 60, y + 37],
    [x + w - 32, y + 65],
    [x + w - 32, y + h - 56],
    [x + w - 53, y + h - 35],
    [x + 54, y + h - 35],
    [x + 32, y + h - 57],
    [x + 32, y + 55],
  ];
  ctx.beginPath();
  ctx.moveTo(...rim[0]);
  for (const pt of rim.slice(1)) ctx.lineTo(...pt);
  ctx.closePath();
  ctx.fillStyle = metal;
  ctx.fill();
  ctx.strokeStyle = '#f0ead7';
  ctx.lineWidth = 2;
  ctx.stroke();

  const dieX = cx - 184,
    dieY = y + 113,
    dieW = 368,
    dieH = 145;
  box(ctx, dieX - 3, dieY - 3, dieW + 6, dieH + 6, 4, '#889ca5');
  box(
    ctx,
    dieX,
    dieY,
    dieW,
    dieH,
    2,
    grad(ctx, dieX, dieY, dieX + dieW, dieY + dieH, [
      [0, '#55496b'],
      [0.42, '#423d68'],
      [0.72, '#52677e'],
      [1, '#526d80'],
    ]),
  );
  for (let r = 0; r < (gpu ? 4 : 2); r++) {
    const columns = gpu ? 10 : 6,
      rows = gpu ? 4 : 2;
    for (let col = 0; col < columns; col++) {
      const wx = (dieW - 14) / columns,
        hy = (dieH - 14) / rows;
      const tx = dieX + 7 + col * wx,
        ty = dieY + 7 + r * hy;
      ctx.strokeStyle = '#9c94ad';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(tx + 1, ty + 1, wx - 5, hy - 5);
      ctx.fillStyle = (col + r) % 3 === 0 ? '#7a788e' : '#697d91';
      for (let n = 0; n < 4; n++)
        ctx.fillRect(tx + 5 + (n * (wx - 10)) / 4, ty + 5, (wx - 10) / 4 - 2, hy - 14);
    }
  }
  label(ctx, gpu ? 'GPU' : 'CPU', cx, y + 75, 60, ink, 'center', false, 700);
}

function packet(ctx, cx, cy, v, opacity = 1, referencePair = false) {
  ctx.save();
  ctx.globalAlpha *= opacity;
  const w = 368,
    h = 72,
    x = cx - w / 2,
    y = cy - h / 2;
  if (!referencePair) box(ctx, x + 3, y + 6, w, h, 5, '#332c3b');
  box(ctx, x, y, w, h, 5, referencePair ? '#314572' : amber, referencePair ? ice : '#ffdc8b');
  const col = referencePair ? white : '#31273a';
  for (const sign of [-1, 1]) {
    const edge = cx + sign * 172;
    path(
      ctx,
      [
        [edge - sign * 9, y + 15],
        [edge, y + 15],
        [edge, y + h - 15],
        [edge - sign * 9, y + h - 15],
      ],
      col,
      3,
    );
  }
  label(ctx, digits(v[0]), cx - 84, cy + 1, 39, col, 'center', true, 600);
  label(ctx, digits(v[1]), cx + 84, cy + 1, 39, col, 'center', true, 600);
  ctx.restore();
}

function draw(ctx, clock) {
  const s = state(clock);
  ctx.save();
  ctx.translate(960, 540);
  ctx.scale(s.scale, s.scale);
  ctx.translate(-s.cameraX, -s.cameraY);
  board(ctx);
  signalLink(ctx, s);
  memory(ctx, 'CPU', s);
  memory(ctx, 'GPU', s);
  packageBody(ctx, cpuX, false);
  packageBody(ctx, gpuX, true);
  const hostOrdinal = Math.min(s.count, seam);
  const gpuReady = s.cross === 1;
  const gpuOrdinal = Math.max(seam + 1, s.count);
  label(ctx, 'Block ' + hostOrdinal, cpuX, 724, 36, ink, 'center', false, 700);
  label(
    ctx,
    'Block ' + gpuOrdinal + (gpuReady ? '' : ' waits'),
    gpuX,
    724,
    36,
    ink,
    'center',
    false,
    700,
  );
  const x = mix(cpuX, gpuX, s.cross);
  const bendY = Math.min(clamp((x - 721) / 57), clamp((1197 - x) / 57)) * 57;
  packet(ctx, x, pairY + bendY, vectorAfter(s.count));

  if (s.cross > 0) {
    ctx.save();
    ctx.globalAlpha = smooth(s.cross * 3);
    const named = clock.index > 3 || (clock.index === 3 && clock.reveal('the activation') > 0.5);
    label(
      ctx,
      named ? 'Activation' : 'Block ' + seam + ' output',
      960,
      pairY - 65,
      40,
      white,
      'center',
      false,
      700,
    );
    if (named) label(ctx, '16 → 17', 960, pairY - 17, 31, amber, 'center', true);
    ctx.restore();
  }
  if (s.comparison > 0) {
    ctx.save();
    ctx.globalAlpha = s.comparison;
    label(ctx, 'All-GPU result', gpuX - 210, 859, 33, white, 'right');
    packet(ctx, gpuX, 859, reference.output, 1, true);
    ctx.restore();
  }
  ctx.restore();
}

function check() {
  assert.equal(blocks.length, 32);
  assert.equal(fixedGB.toFixed(1), '3.2');
  assert.equal(perBlock, 0.3);
  assert.equal(Math.round((split.budget - fixedGB) / perBlock), split.gpuBlocks);
  assert.deepEqual([split.cpuBlocks, split.gpuBlocks, split.boundaries], [16, 16, 1]);
  assert.deepEqual([blocks[15].device, blocks[16].device], ['CPU', 'GPU']);
  assert.deepEqual(vectorAfter(seam), blocks[seam].input);
  assert.deepEqual(vectorAfter(seam).map(digits), ['0.8071', '0.6929']);
  assert.deepEqual(vectorAfter(seam + 1).map(digits), ['0.7979', '0.7021']);
  assert.equal(reference.gpuBlocks, 32);
  assert.deepEqual(reference.output, split.output);
  assert.deepEqual(split.output.map(digits), ['0.6887', '0.8113']);
  return true;
}

export default { title: 'What crosses from block 16 to block 17?', beats, draw, check };

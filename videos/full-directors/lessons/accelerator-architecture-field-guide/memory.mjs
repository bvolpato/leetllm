import assert from 'node:assert/strict';
import {
  sequentialOffload,
  localMemorySpills,
} from '../../../films/accelerator-architecture-field-guide/arithmetic.mjs';
import { C, arrow, base, box, chip, cue, foot, lerp, path, txt } from './drawing.mjs';

const pool = [
  ['Weights', 16, C.paleGold],
  ['KV pool', 4, C.paleBlue],
  ['Temps', 3, C.mint],
  ['OS + apps', 6, '#cfc6df'],
];
const poolCap = 32;
function offload(g, k) {
  const i = k.beat.beatIndex;
  const f =
    i === 0
      ? 0
      : i === 1
        ? 0.01 * k.reveal('Move one percent', 1.2)
        : lerp(0.01, 0.1, k.reveal('Now move ten percent', 1.5));
  const d = sequentialOffload(f),
    baseTime = sequentialOffload(0).total;
  base(
    g,
    'Memory path   /   sequential reads',
    'How long does the host slice take?',
    '16 decimal GB of weights per step   •   3.35 TB/s resident   •   64 GB/s host',
  );
  const x = 290,
    w = 1340;
  txt(g, 'Bytes', 90, 357, 50, C.ink, 'left', 'Serif');
  box(g, x, 316, w, 82, C.paleGold, C.brass);
  box(g, x + w * (1 - f), 316, w * f, 82, C.fault);
  txt(g, (d.residentBytes / 1e9).toFixed(2) + ' GB resident', x, 447, 34, C.brass, 'left', 'Mono');
  txt(g, (d.hostBytes / 1e9).toFixed(2) + ' GB host', x + w, 447, 34, C.fault, 'right', 'Mono');
  txt(g, 'Time', 90, 602, 50, C.ink, 'left', 'Serif');
  const scale = w / 32,
    a = d.residentMs * scale,
    b = d.hostMs * scale;
  for (let t = 0; t <= 32; t += 4) {
    const xx = x + t * scale;
    path(
      g,
      [
        [xx, 535],
        [xx, 658],
      ],
      C.line,
      2,
    );
    txt(g, t + ' ms', xx, 692, 27, C.dim, 'center', 'Mono');
  }
  box(g, x, 562, a, 82, C.gold, C.brass);
  box(g, x + a, 562, b, 82, C.fault);
  txt(
    g,
    d.residentMs.toFixed(2) +
      ' ms resident   +   ' +
      d.hostMs.toFixed(2) +
      ' ms host   =   ' +
      d.total.toFixed(2) +
      ' ms',
    x,
    769,
    41,
    C.ink,
    'left',
    'Mono',
  );
  foot(
    g,
    i === 0
      ? 'If 1% of the weights move to the host, what fraction of time follows?'
      : ((100 * d.hostMs) / d.total).toFixed(1) +
          '% of transfer time on the host path     •     ' +
          (d.total / baseTime).toFixed(2) +
          '× resident-only time',
    'Sequential transfer model • excludes arithmetic, KV traffic, prefetching, and overlap.',
  );
}
function unified(g, k) {
  const fallback = cue(k, 'fallback', 'this unsupported operation', 0) > 0;
  const reject = cue(k, 'fallback', 'A separate request', 0) > 0;
  const used = pool.reduce((s, [, gb]) => s + gb, 0);
  base(
    g,
    'Apple silicon   /   execution trace',
    'Which processor ran this operation?',
    'Illustrative Mac • shared physical capacity, separate command targets',
  );
  const x = 428,
    end = 1690;
  for (const [n, y] of [
    ['GPU · MPS', 363],
    ['CPU', 487],
  ]) {
    txt(g, n, 90, y, 45, C.ink, 'left', 'Serif');
    path(
      g,
      [
        [x, y],
        [end, y],
      ],
      C.line,
      3,
    );
  }
  chip(g, x + 20, 321, 263, 80, C.paleBlue, C.blue, 'projection');
  if (fallback) {
    path(
      g,
      [
        [x + 283, 363],
        [x + 337, 363],
        [x + 407, 487],
        [x + 438, 487],
      ],
      C.fault,
      4,
    );
    chip(g, x + 442, 448, 259, 78, C.rose, C.fault, 'CPU op');
    path(
      g,
      [
        [x + 701, 487],
        [x + 748, 487],
        [x + 817, 363],
        [x + 850, 363],
      ],
      C.fault,
      4,
    );
    txt(g, 'synchronize', x + 716, 549, 29, C.fault, 'center');
    chip(g, x + 860, 321, 220, 80, C.paleBlue, C.blue, 'resume');
  } else {
    chip(g, x + 408, 321, 213, 80, C.paleBlue, C.blue, 'GPU op');
    chip(g, x + 758, 321, 245, 80, C.paleBlue, C.blue, 'next op');
  }
  txt(g, 'Physical memory', 92, 620, 41, C.ink, 'left', 'Serif');
  let usedX = 101;
  for (const [s, v, color] of [...pool, ['Free', poolCap - used, C.white]]) {
    const ww = v * 53;
    box(g, usedX, 667, ww, 109, color, C.dim);
    txt(g, s, usedX + ww / 2, 700, 30, C.ink, 'center');
    txt(g, v + ' GB', usedX + ww / 2, 745, 32, C.ink, 'center', 'Mono');
    usedX += ww;
  }
  foot(
    g,
    reject
      ? 'Separate allocation request     float64 → MPS     •     dtype rejected'
      : used + ' GB occupied in one ' + poolCap + ' GB pool',
    fallback
      ? 'Fallback adds CPU execution and a synchronization boundary for this operation.'
      : 'GPU kernels and host applications share the same physical capacity.',
  );
}
export function memory(g, k) {
  if (k.beat.beatIndex < 3) offload(g, k);
  else unified(g, k);
}

export function spill(g, k) {
  const second = k.beat.id === 'spill';
  const extended = second || k.reveal('Extend the accumulator lifetime', 0) > 0;
  const arrived = second && k.reveal('The transfer ends in SBUF', 0) > 0;
  const fused = cue(k, 'spill', 'Now fuse another operation', 0) > 0;
  const d = localMemorySpills({ psumLive: extended ? 6 : 4, sbufLive: fused ? 8 : 6 });
  base(
    g,
    'Trainium   /   live tile storage',
    'Which buffer receives the spill?',
    'Schematic equal-sized tiles • hold the PSUM and SBUF capacities fixed',
  );
  const psx = 180,
    sx = 693,
    hx = 1392,
    y = 426;
  for (const [x, label, cap] of [
    [psx, 'PSUM', 4],
    [sx, 'SBUF', 8],
    [hx, 'HBM', null],
  ]) {
    txt(g, label, x, y - 101, 58, C.ink, 'left', 'Serif');
    txt(g, cap ? cap + ' local slots' : 'large memory', x, y - 44, 31, C.dim);
  }
  for (let i = 0; i < 4; i++)
    chip(g, psx + (i % 2) * 83, y + Math.floor(i / 2) * 88, 62, 60, C.paleGold, C.brass, 'Σ');
  arrow(g, 399, 506, 613, 506, arrived ? C.brass : C.line, 5);
  txt(
    g,
    arrived ? d.psumToSbuf + ' sent' : extended ? '2 waiting' : '0 sent',
    504,
    564,
    32,
    C.brass,
    'center',
  );
  if (extended && !arrived)
    for (let i = 0; i < 2; i++) chip(g, 417 + i * 80, 418, 62, 53, C.paleGold, C.brass, 'Σ');
  // The fused intermediates extend the native SBUF live set. Two displaced tiles move on.
  for (let i = 0; i < 8; i++) {
    const fromPsum = arrived && i >= 6;
    const occupied = i < 6 || fromPsum;
    chip(
      g,
      sx + (i % 4) * 85,
      y + Math.floor(i / 4) * 88,
      62,
      60,
      fromPsum ? C.paleGold : occupied ? C.paleBlue : C.white,
      fromPsum ? C.brass : C.blue,
      fromPsum ? 'Σ' : occupied ? 'x' : '',
    );
  }
  arrow(g, 1085, 506, 1329, 506, d.sbufToHbm ? C.fault : C.line, 5);
  txt(g, d.sbufToHbm + ' tiles', 1204, 564, 33, d.sbufToHbm ? C.fault : C.dim, 'center');
  box(g, hx, y - 8, 321, 171, C.white, C.line);
  for (let i = 0; i < d.sbufToHbm; i++)
    chip(g, hx + 30 + i * 94, y + 40, 72, 58, C.paleBlue, C.blue, 'x');
  txt(g, 'Live demand', 88, 681, 39, C.ink, 'left', 'Serif');
  txt(g, d.psumLive + ' / ' + d.psumCapacity + ' PSUM', 375, 681, 38, C.brass, 'left', 'Mono');
  txt(
    g,
    d.sbufLive +
      ' native + ' +
      (arrived ? d.psumToSbuf : 0) +
      ' received = ' +
      (arrived ? d.sbufTotal : d.sbufLive) +
      ' / ' +
      d.sbufCapacity +
      ' SBUF',
    830,
    681,
    35,
    C.blue,
    'left',
    'Mono',
  );
  if (fused) {
    path(
      g,
      [
        [1452, 718],
        [1452, 753],
        [977, 753],
      ],
      C.blue,
      4,
      true,
    );
    arrow(g, 977, 753, 977, 720, C.blue);
    txt(g, 'Later refill', 1160, 786, 29, C.blue, 'center');
  }
  foot(
    g,
    fused
      ? 'Two overflow tiles reach HBM and must return before use.'
      : second
        ? 'Two PSUM tiles enter SBUF. HBM spill traffic stays at zero.'
        : 'Follow each excess tile to the next memory level.',
  );
}
export function checkMemory() {
  for (const [f, ms, host] of [
    [0, '4.78', 0],
    [0.01, '7.23', 2.5],
    [0.1, '29.30', 25],
  ]) {
    const d = sequentialOffload(f);
    assert.equal(d.hostMs, host);
    assert.equal(d.total.toFixed(2), ms);
    assert.equal(d.residentBytes + d.hostBytes, 16e9);
  }
  assert.equal(
    pool.reduce((s, [, v]) => s + v, 0),
    29,
  );
  for (const [p, s, extra, outer] of [
    [4, 6, 0, 0],
    [6, 6, 2, 0],
    [6, 8, 2, 2],
  ]) {
    const d = localMemorySpills({ psumLive: p, sbufLive: s });
    assert.equal(d.psumToSbuf, extra);
    assert.equal(d.sbufToHbm, outer);
  }
}

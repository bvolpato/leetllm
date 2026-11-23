import assert from 'node:assert/strict';
import { ringTraffic } from '../../../films/accelerator-architecture-field-guide/arithmetic.mjs';
import { C, arrow, base, box, chip, cue, dot, foot, lerp, path, txt } from './drawing.mjs';

const ranks = 4,
  ring = ringTraffic(8 * 8192 * 2, ranks);
const nodes = [
  [265, 372],
  [741, 372],
  [741, 656],
  [265, 656],
];
const calls = 80 * 2;
const startup = (n, us) => (n * us) / 1000;
function chunkId(rank, t) {
  return (rank + (t < 3 ? -t : 1 - (t - 3)) + 8) % 4;
}
function drawRing(g, k) {
  const s = k.beat.id === 'sends';
  const rs = cue(k, 'sends', 'In reduce-scatter', 3.1),
    ag = cue(k, 'sends', 'In all-gather', 3.1);
  const step = 3 * rs + 3 * ag,
    n = Math.floor(step);
  base(
    g,
    'Interconnect   /   four-rank ring',
    'What crosses one outgoing link?',
    'One call • logical BF16 payload = 8 × 8,192 × 2 B = ' + ring.payloadBytes / 1024 + ' KiB',
  );
  for (let j = 0; j < ranks; j++) {
    const [x, y] = nodes[j],
      [xx, yy] = nodes[(j + 1) % ranks],
      dx = xx - x,
      dy = yy - y,
      len = Math.hypot(dx, dy);
    const ux = dx / len,
      uy = dy / len;
    const off = dy === 0 ? 95 : 55,
      a = [x + ux * off, y + uy * off],
      b = [xx - ux * off, yy - uy * off];
    const color = j === 0 ? C.brass : C.dim;
    arrow(g, ...a, ...b, color, 4);
    if (s && step > 0 && step < 6 && step % 1 !== 0) {
      const t = step - n;
      const mx = lerp(a[0], b[0], t),
        my = lerp(a[1], b[1], t);
      box(g, mx - 22, my - 21, 44, 42, C.paleGold, C.brass);
      txt(g, chunkId(j, n), mx, my, 28, C.brass, 'center', 'Mono', 600);
    }
  }
  nodes.forEach(([x, y], i) =>
    chip(
      g,
      x - 85,
      y - 42,
      170,
      84,
      i === 0 ? C.paleGold : C.paleBlue,
      i === 0 ? C.brass : C.blue,
      'Rank ' + i,
    ),
  );
  txt(g, 'Rank 0 sends', 1005, 320, 54, C.ink, 'left', 'Serif');
  for (let j = 0; j < 6; j++) {
    const xx = 1008 + (j % 3) * 240,
      yy = 427 + Math.floor(j / 3) * 179;
    box(g, xx, yy, 212, 90, j < n ? C.paleGold : C.white, j < n ? C.brass : C.line, 3);
    txt(
      g,
      j < n ? 'chunk ' + chunkId(0, j) : '·',
      xx + 106,
      yy + 46,
      34,
      j < n ? C.brass : C.dim,
      'center',
      'Mono',
    );
  }
  txt(g, 'Reduce-scatter', 1008, 387, 29, C.dim);
  txt(g, 'All-gather', 1008, 568, 29, C.dim);
  txt(
    g,
    n +
      (n === 1 ? ' send  ×  ' : ' sends  ×  ') +
      ring.chunkBytes / 1024 +
      ' KiB   =   ' +
      (n * ring.chunkBytes) / 1024 +
      ' KiB',
    1008,
    759,
    38,
    C.ink,
    'left',
    'Mono',
  );
  foot(
    g,
    n === ring.sends
      ? 'Sent per rank = 2(P − 1) / P × payload     •     four-rank ring'
      : 'Each rank has four chunks of 32 KiB. Follow rank 0 → rank 1.',
    'A ring round sends one chunk per rank. The count here measures one outgoing link.',
  );
}
function chassis(g, x, y, w, h, label, ids) {
  box(g, x, y, w, h, C.white, C.dim, 3);
  for (const corner of [
    [x + 12, y + 12],
    [x + w - 12, y + 12],
    [x + 12, y + h - 12],
    [x + w - 12, y + h - 12],
  ])
    dot(g, ...corner, 3, C.dim);
  txt(g, label, x + 20, y + 29, 25, C.dim, 'left', 'Mono');
  const cw = (w - 40) / ids.length;
  ids.forEach((r, i) => chip(g, x + 22 + i * cw, y + 69, cw - 12, 53, C.paleBlue, C.blue, 'R' + r));
}
function routes(g, k) {
  const replay = k.beat.id === 'routes';
  const n = Math.floor(calls * cue(k, 'routes', 'Count all the starts', 1.05));
  base(
    g,
    'Tensor parallelism   /   exposed startup',
    'How often does the route pay startup?',
    'Classic dense example • 80 layers × 2 dependent reductions = 160 calls per iteration',
  );
  for (const [i, cost, yy] of [
    [0, 5, 332],
    [1, 20, 594],
  ]) {
    txt(g, i === 0 ? 'Local ring' : 'Cross-node ring', 85, yy - 43, 39, C.ink, 'left', 'Serif');
    if (i === 0) chassis(g, 87, yy, 643, 143, 'Node A', [0, 1, 2, 3]);
    else {
      chassis(g, 87, yy, 287, 143, 'Node A', [0, 1]);
      chassis(g, 439, yy, 287, 143, 'Node B', [2, 3]);
      arrow(g, 375, yy + 85, 437, yy + 85, C.fault, 3);
      arrow(g, 437, yy + 105, 375, yy + 105, C.fault, 3);
    }
    txt(g, cost + ' µs per call', 804, yy + 22, 40, i ? C.brass : C.blue);
    const x = 809,
      y = yy + 79,
      pitch = (cost / 20) * 5.9,
      ms = startup(n, cost);
    path(
      g,
      [
        [x, y + 58],
        [x + 944, y + 58],
      ],
      C.line,
      2,
    );
    for (let j = 0; j < n; j++)
      box(g, x + j * pitch, y, pitch, pitch < 2 ? 43 : j % 2 === 0 ? 51 : 43, i ? C.gold : C.blue);
    if (replay) txt(g, ms.toFixed(2) + ' ms', 1750, yy + 22, 44, C.ink, 'right', 'Mono', 600);
  }
  foot(
    g,
    replay
      ? n + ' / ' + calls + ' calls counted   •   serialized, exposed startup only'
      : 'If each call must wait for its predecessor, what time accumulates?',
    'Startup assumptions belong to these example routes. Add payload transfer and account for overlap in a measured trace.',
  );
}
function pipeline(g, k) {
  base(
    g,
    'Parallel layout   /   stage boundary',
    'What changes when the stages split?',
    'Tensor-parallel groups stay inside their nodes. Activations cross the stage boundary.',
  );
  chassis(g, 117, 323, 594, 150, 'Stage A • node A', [0, 1]);
  chassis(g, 1209, 323, 594, 150, 'Stage B • node B', [2, 3]);
  arrow(g, 730, 403, 1192, 403, C.brass, 5);
  txt(g, 'activations', 960, 355, 32, C.brass, 'center');
  const active = k.reveal('A stage can wait', 0) > 0;
  const start = 427,
    w = 258;
  for (const [r, y] of [
    [0, 593],
    [1, 700],
  ]) {
    txt(g, 'Stage ' + (r ? 'B' : 'A'), 107, y + 30, 38, C.ink, 'left', 'Serif');
    for (let j = 0; j < 4; j++) {
      const batch = j - r;
      const work = batch >= 0 && batch < 3;
      box(
        g,
        start + j * w,
        y,
        w - 6,
        66,
        work ? [C.paleBlue, C.paleGold, C.mint][batch] : C.white,
        C.line,
      );
      txt(
        g,
        work ? 'Batch ' + (batch + 1) : active ? 'Idle' : '',
        start + (j + 0.5) * w,
        y + 33,
        32,
        work ? C.ink : C.dim,
        'center',
      );
    }
  }
  arrow(g, 1521, 696, 1704, 696, C.dim);
  txt(g, 'time', 1612, 744, 30, C.dim, 'center');
  foot(
    g,
    'Fewer cross-node exchanges can come with pipeline bubbles.',
    'Illustrative equal-duration stages. Measure fit, first-token time, later gaps, and useful output at the target load.',
  );
}
export function fabric(g, k) {
  if (k.beat.beatIndex < 2) drawRing(g, k);
  else if (k.beat.id === 'pipeline') pipeline(g, k);
  else routes(g, k);
}
export function checkFabric() {
  assert.deepEqual([ring.payloadBytes, ring.chunkBytes, ring.sentPerRank], [131072, 32768, 196608]);
  assert.equal(ring.sends, 6);
  assert.deepEqual(
    Array.from({ length: 6 }, (_, i) => chunkId(0, i)),
    [0, 3, 2, 1, 0, 3],
  );
  assert.equal(calls, 160);
  assert.deepEqual(
    [5, 20].map((c) => startup(calls, c)),
    [0.8, 3.2],
  );
}

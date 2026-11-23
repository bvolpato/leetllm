import assert from 'node:assert/strict';
import { bf16 } from '../../../films/deep-dive-deepep/arithmetic.mjs';
import {
  C,
  cue,
  alpha,
  text,
  mono,
  rect,
  path,
  dot,
  card,
  board,
  chip,
  row,
  linePoint,
  hatch,
  scene,
  note,
  fmt,
} from './bench.mjs';

const terms = [256, 1, -256],
  exact = terms[0] + terms[1],
  stored = bf16(exact);
const staged = bf16(stored + terms[2]),
  wide = bf16(Math.fround(exact + terms[2]));
export function rounding(g, c) {
  const atTie = cue(c, 1, 'Find it halfway', 0.6);
  const snapped = cue(c, 2, 'Store that neighbor', 0.65);
  const zero = cue(c, 2, 'The middle store', 0);
  const replay = cue(c, 3, 'Replay the same three inputs', 0);
  const one = cue(c, 3, 'Cast that final result', 0);
  scene(g, 'Reduction precision', 'Which subtotal survives cancellation?');
  text(g, 'Already weighted', 140, 300, 33, C.muted);
  mono(g, terms.join('    +    ').replace('+    -256', '−    256'), 1125, 306, 55);
  const x = (n) => 240 + (n - 256) * 355,
    y = 552;
  text(g, 'BF16 store   /   round to nearest, ties to even', 145, 412, 39);
  path(
    g,
    [
      [190, y],
      [1750, y],
    ],
    C.ink,
    4,
  );
  for (const n of [256, 258, 260]) {
    path(
      g,
      [
        [x(n), y - 24],
        [x(n), y + 24],
      ],
      C.ink,
      4,
    );
    mono(g, n, x(n), y + 78, 44);
    text(g, n === 258 ? 'odd low bit' : 'even low bit', x(n), y + 133, 29, C.muted, 'center');
  }
  const marker = (n, color, label) => {
    dot(g, x(n), y, 17, color, C.ink, 2);
    mono(g, label, x(n), y - 63, 35, color === C.gold ? C.rust : C.teal);
  };
  alpha(g, atTie, () => marker(exact, C.gold, '257 exact'));
  if (snapped) {
    alpha(g, snapped, () => marker(stored, C.teal, '256 stored'));
    path(
      g,
      [
        [x(stored) + 28, y + 1],
        [x(exact) - 23, y + 1],
      ],
      C.teal,
      7,
    );
  }
  if (zero) mono(g, 'BF16 subtotal    ' + stored + ' − 256 = ' + staged, 535, 776, 38, C.teal);
  if (replay)
    mono(g, 'FP32 subtotal    ' + exact + ' − 256 = ' + (one ? wide : '?'), 1397, 776, 38, C.rust);
  note(
    g,
    one
      ? 'Same three inputs and final BF16 cast. Only the intermediate store changes.'
      : zero
        ? 'A cast at the local reduction can discard the term that would survive the subtraction.'
        : snapped
          ? 'Use the stored subtotal for the next addition.'
          : atTie
            ? '257 sits equally far from the two neighboring BF16 values.'
            : 'Compare a BF16 intermediate store with one FP32 accumulation.',
  );
}

const source = 0,
  peer = 2,
  destination = 3;
const physical = [
  [490, 458],
  [490, 663],
  [1395, 458],
  [1395, 663],
];
const direct = [physical[source], [850, 458], [1070, 663], physical[destination]];
const rail = [physical[source], physical[peer]],
  local = [physical[peer], physical[destination]];
function worldBarrier(c) {
  const writes = cue(c, 3, 'writes data directly', 1.0);
  const fence = writes === 1 && cue(c, 3, 'a system-scope fence', 0);
  const signal = fence && cue(c, 3, 'sends the Gin barrier signal', 1.0);
  return { writes, fence, signal };
}
export function topology(g, c) {
  if (c.beat.beatIndex === 3) {
    const { writes, fence, signal } = worldBarrier(c);
    scene(
      g,
      'Historical V2   /   flat mixed-fabric domain',
      'What must be visible at the world barrier?',
    );
    text(g, 'World team    /    flush-stores path', 128, 309, 39, C.muted);
    board(g, 116, 383, 542, 350, 'Publishing rank');
    board(g, 1239, 383, 565, 350, 'World-team peers');
    const wire = (y, label, amount, tag, color) => {
      path(
        g,
        [
          [525, y],
          [1410, y],
        ],
        C.line,
        5,
        [8, 8],
      );
      text(g, label, 947, y - 54, 32, C.ink, 'center');
      if (amount)
        row(
          g,
          ...linePoint(
            [
              [520, y],
              [1497, y],
            ],
            amount,
          ),
          tag,
          color,
          223,
        );
    };
    wire(522, 'Direct NVLink write', writes, 'data', C.gold);
    wire(661, 'Gin barrier signal', signal, 'signal', C.sky);
    if (fence) {
      path(
        g,
        [
          [231, 537],
          [231, 647],
        ],
        C.pale,
        4,
      );
      chip(g, 143, 559, 468, 65, 'system-scope fence', C.pale);
    }
    note(
      g,
      signal === 1
        ? 'World-team barrier published after the NVLink writes were ordered.'
        : fence
          ? 'The publisher orders its prior writes before sending the world-team signal.'
          : 'A flat logical group can mix direct NVLink writes with network signaling.',
    );
    return;
  }
  const hybrid = c.beat.beatIndex > 0;
  const flat = cue(c, 0, 'exchange the row', 1.6);
  const across = cue(c, 1, 'Cross the network rail', 1.7);
  const forward = cue(c, 2, 'Forward it', 1.3);
  scene(g, 'Interconnect', 'How does the row from R0 reach R3?');
  board(g, 108, 286, 666, 476, 'Node A');
  board(g, 1145, 286, 666, 476, 'Node B');
  path(g, [physical[0], physical[1]], '#c4b481', 8);
  path(g, [physical[2], physical[3]], '#c4b481', 8);
  for (const [i, p] of physical.entries()) {
    const x = p[0] - 114,
      y = p[1] - 40;
    chip(g, x, y, 228, 80, '', i === source || i === destination ? C.white : '#90a4a0');
  }
  const trace = (p, amount, color) => {
    path(g, p, '#b1a995', 4, [8, 11]);
    if (amount > 0) {
      const now = linePoint(p, amount);
      row(g, ...now, '0 → 3', color, 148);
    }
  };
  if (hybrid) {
    path(g, rail, '#b1a995', 4, [8, 11]);
    if (forward > 0) trace(local, forward, C.gold);
    else trace(rail, across, C.gold);
  } else trace(direct, flat, C.gold);
  if ((hybrid && across === 0) || (!hybrid && flat === 0))
    row(g, ...physical[0], '0 → 3', C.gold, 148);
  text(g, hybrid ? 'RDMA rail' : 'Direct RDMA', 962, 362, 34, C.ink, 'center');
  if (hybrid) text(g, 'NVLink', 1630, 564, 32, C.white, 'center');
  text(g, 'R0', 239, 458, 33, C.white, 'center');
  text(g, 'R1', 239, 663, 33, C.white, 'center');
  text(g, 'R2', 1667, 458, 33, C.white, 'center');
  text(g, 'R3', 1667, 663, 33, C.white, 'center');
  note(
    g,
    forward === 1
      ? 'Final owner R3    /    origin R0    /    forwarding peer R2'
      : hybrid
        ? 'Hybrid route    /    global destination remains R3'
        : 'Direct route    /    one flat logical domain',
  );
}

const traffic = { blockMiB: 10, localBlocks: 5, interNodeBlocks: 5, crossingsPerBlock: 1, ms: 1 };
const nicMiB = traffic.blockMiB * traffic.interNodeBlocks * traffic.crossingsPerBlock;
const logicalMiB = traffic.blockMiB * (traffic.localBlocks + traffic.interNodeBlocks);
const gbps = (mib) => (mib * 2 ** 20) / (traffic.ms * 1e-3) / 1e9;
export function meters(g, c) {
  const diverted = cue(c, 1, 'Count the inter-node blocks', 1.65);
  const logicalRate = cue(c, 2, 'The NIC payload rate', 0);
  const rates = cue(c, 2, 'Compare the two readings', 0);
  scene(g, 'Link accounting', 'What did the NIC actually carry?');
  text(g, 'Logical payload', 121, 321, 43);
  text(g, '100 MiB in 1 ms', 1790, 321, 42, C.ink, 'right', 'Mono');
  const left = 143,
    dx = 155,
    w = 139,
    top = 384,
    n = traffic.localBlocks + traffic.interNodeBlocks;
  for (let i = 0; i < n; i++) {
    const remote = i >= traffic.localBlocks;
    const y = top + (remote ? diverted * 206 : 0);
    rect(g, left + i * dx, y, w, 112, remote ? C.sky : C.pale, remote ? C.blue : C.teal, 2, 9);
    if (remote && y > top + 124)
      path(
        g,
        [
          [left + i * dx + w / 2, top + 116],
          [left + i * dx + w / 2, y - 7],
        ],
        C.line,
        2,
        [6, 9],
      );
    mono(g, traffic.blockMiB, left + i * dx + w / 2, y + 55, 37);
  }
  text(g, 'Stays on source GPU', 147, 554, 34, C.teal);
  text(
    g,
    'Inter-node NIC payload',
    left + traffic.localBlocks * dx,
    548 + diverted * 180,
    34,
    C.blue,
  );
  if (logicalRate) text(g, gbps(logicalMiB).toFixed(1) + ' GB/s logical', 150, 787, 43, C.teal);
  if (rates) text(g, gbps(nicMiB).toFixed(1) + ' GB/s at NIC', 1755, 787, 43, C.blue, 'right');
  note(
    g,
    rates
      ? 'Same 1 ms interval. Each blue block crosses this NIC once. Payload only.'
      : diverted === 1
        ? '50 MiB stays on the source. The other 50 MiB crosses this NIC once. Payload only.'
        : 'Each blue block crosses this NIC once in 1 ms. Each block is 10 MiB. Ignore overhead.',
  );
}

const width = 7168,
  groupSize = 128,
  scaleSize = 4,
  groups = width / groupSize;
const scales = groups * scaleSize,
  fp8 = width + scales,
  bfBytes = width * 2;
const q = { index: 42, value: 10, scales: [0.5, 2] };
const rightGroup = Math.floor(q.index / groupSize);
export function wire(g, c) {
  if (c.beat.beatIndex >= 3) {
    const wrong = cue(c, 3, 'Which scale belongs', 0);
    const fixed = cue(c, 4, 'Use group zero', 1);
    const decoded = cue(c, 4, 'The byte count', 0);
    scene(g, 'Scale addressing', 'Which scale belongs to coordinate 42?');
    const centers = [555, 1365];
    centers.forEach((x, i) => {
      board(
        g,
        x - 361,
        300,
        722,
        284,
        'Group ' + i + '    /    coordinates ' + i * 128 + ' to ' + (i * 128 + 127),
      );
      chip(g, x - 175, 421, 350, 80, 'scale   ' + q.scales[i], i ? C.sky : C.pale);
    });
    const xx = centers[1] + (centers[0] - centers[1]) * fixed;
    path(
      g,
      [
        [xx, 694],
        [xx, 589],
      ],
      C.rust,
      5,
    );
    dot(g, xx, 589, 8, C.rust);
    row(g, xx, 711, 'read scale', C.gold, 300);
    const scale = fixed === 1 ? q.scales[rightGroup] : q.scales[1];
    note(
      g,
      'Received FP8 value 10     /     ' +
        (fixed > 0 && fixed < 1
          ? 'correcting the scale address'
          : '10 × ' +
            scale +
            ' = ' +
            (fixed === 1
              ? decoded
                ? fmt(q.value * scale)
                : '?'
              : wrong
                ? fmt(q.value * scale)
                : '?')),
    );
    return;
  }
  const tagged = cue(c, 1, 'Attach one scale', 1.8);
  const baseline = cue(c, 0, 'The FP eight values', 0);
  const sum = cue(c, 2, 'Add any routing header', 0);
  scene(g, 'Wire format', 'What travels with 7,168 FP8 values?');
  text(g, '128 values per strip', 123, 301, 40);
  const left = 125,
    top = 365,
    dx = 207,
    dy = 57;
  for (let i = 0; i < groups; i++) {
    const x = left + (i % 8) * dx,
      y = top + Math.floor(i / 8) * dy;
    rect(g, x, y, 179, 37, C.teal);
    for (let j = 1; j < 8; j++)
      path(
        g,
        [
          [x + j * 22.4, y + 8],
          [x + j * 22.4, y + 29],
        ],
        '#78aaa1',
        2,
      );
    alpha(g, tagged, () => rect(g, x + 180, y, (179 * 4) / 128, 37, C.rust));
  }
  text(g, 'FP8 values    ' + fmt(width) + ' B', 127, 785, 37, C.teal);
  if (tagged)
    text(
      g,
      sum ? 'FP32 scales    ' + fmt(scales) + ' B' : 'One 4-byte scale per strip',
      1790,
      785,
      37,
      C.rust,
      'right',
    );
  note(
    g,
    sum
      ? '7,168 + 224 = 7,392 B     /     BF16 values alone: 14,336 B     /     ratio ' +
          (bfBytes / fp8).toFixed(2) +
          '×'
      : baseline
        ? 'BF16 baseline    7,168 × 2 B = 14,336 B'
        : 'BF16 uses two bytes per coordinate.',
  );
}

export function checkMeasurements() {
  const barrier = (...cues) =>
    worldBarrier({ beat: { beatIndex: 3 }, reveal: (p) => Number(cues.includes(p)) });
  const write = 'writes data directly',
    fence = 'a system-scope fence',
    signal = 'sends the Gin barrier signal';
  assert(!barrier(write, signal).signal);
  assert(!barrier(fence, signal).signal);
  assert.deepEqual(barrier(write, fence, signal), { writes: 1, fence: 1, signal: 1 });
  assert.deepEqual([bf16(terms[0]), bf16(terms[1]), bf16(terms[2])], terms);
  assert.deepEqual([exact, stored, staged, wide], [257, 256, 0, 1]);
  assert.equal(bf16(259), 260);
  assert.deepEqual([rail[0], rail.at(-1), local.at(-1)], [physical[0], physical[2], physical[3]]);
  assert.equal(direct.at(-1), local.at(-1));
  assert.deepEqual(
    [nicMiB, gbps(logicalMiB).toFixed(1), gbps(nicMiB).toFixed(1)],
    [50, '104.9', '52.4'],
  );
  assert.deepEqual([groups, scales, fp8, bfBytes], [56, 224, 7392, 14336]);
  assert.deepEqual(
    q.scales.map((s) => s * q.value),
    [5, 20],
  );
  assert.equal(rightGroup, 0);
}

import assert from 'node:assert/strict';
import {
  sharedBound,
  waveReduction,
} from '../../../films/accelerator-architecture-field-guide/arithmetic.mjs';
import { C, base, box, cue, foot, lerp, num, path, txt } from './drawing.mjs';

const width = 64,
  half = width / 2;
const values = Array.from({ length: width }, (_, i) => i + 1);
function scan(count) {
  const included = values.slice(0, count);
  const a = included.slice(0, half).reduce((s, n) => s + n, 0);
  const b = included.slice(half).reduce((s, n) => s + n, 0);
  return { count, a, b, total: a + b };
}
function wave(g, k) {
  const i = k.beat.beatIndex,
    open = i ? 1 : k.reveal('Unfold one physical wave', 1.7);
  const n =
    i === 0
      ? 0
      : i === 1
        ? Math.floor(half * k.reveal('Run the inherited helper', 2.2))
        : half + Math.floor(half * k.reveal('Sweep the remaining lanes', 2.5));
  const m = scan(n);
  const publish = cue(k, 'repair', 'Combine both halves', 0) > 0;
  base(
    g,
    'AMD CDNA   /   reduction',
    'Which lanes have contributed?',
    'One physical wave owns 64 values. The printed numbers are inputs 1 through 64.',
  );
  const pitch = 105,
    x0 = 125;
  for (let row = 3; row >= 0; row--) {
    const y = lerp(380 + row * 7, 324 + row * 94, open);
    for (let col = 0; col < 16; col++) {
      const idx = row * 16 + col,
        done = idx < m.count,
        omitted = idx >= half && i > 0 && !done;
      const x = x0 + pitch * col;
      const bg = done ? C.ink : omitted ? C.paleGold : C.white;
      box(g, x + 3, y + 5, 92, 76, '#c4c7bb');
      box(g, x, y, 92, 76, bg, omitted ? C.brass : done ? C.ink : C.dim, done ? 2 : 3);
      if (!done)
        for (let j = 0; j < 5; j++) box(g, x + 13 + 15 * j, y + 5, 5, 5, omitted ? C.gold : C.line);
      txt(
        g,
        values[idx],
        x + 46,
        y + 41,
        42,
        done ? C.white : omitted ? C.brass : C.ink,
        'center',
        'Mono',
        600,
      );
      if (idx === m.count - 1) box(g, x + 4, y + 68, 84, 6, C.gold);
    }
  }
  txt(g, 'Consumed   ' + m.count + ' / 64', 123, 748, 37, C.ink, 'left', 'Mono');
  txt(g, 'Lower half   ' + num(m.a), 738, 748, 34, C.teal, 'left', 'Mono');
  txt(g, 'Upper half   ' + num(m.b), 1300, 748, 34, C.brass, 'left', 'Mono');
  const label = publish
    ? 'Published sum   ' + num(m.total)
    : i === 2
      ? 'Retained first partial   ' + num(m.a) + '      +      second partial   ' + num(m.b)
      : i === 1 && n === 32
        ? 'Helper returns   ' + num(m.total) + '      •      32 owned values still waiting'
        : 'Running partial   ' + num(m.total);
  foot(
    g,
    label,
    publish
      ? 'Both half-wave results reach the same output exactly once.'
      : 'Dark cells have entered a partial sum. Each illuminated input still belongs to this wave.',
  );
}
function boundary(g, k) {
  const last = k.reveal('The sixty-fifth starts', 0) > 0;
  base(
    g,
    'AMD CDNA   /   boundary test',
    'Does the next wave repair the first?',
    'One wave emits one partial sum. Compare outputs against the sum of every input.',
  );
  const xs = [109, 399, 820, 1262, 1641],
    ys = [444, 565, 686];
  ['Inputs', 'Wave 1 • faulty', 'Wave 2 • faulty', 'Faulty sum', 'Reference'].forEach((s, i) =>
    txt(g, s, xs[i], 343, 31, C.dim),
  );
  [63, 64, 65].forEach((n, i) => {
    if (n === 65 && !last) return;
    const fail = waveReduction(n, 32),
      ok = waveReduction(n, 64);
    const t = [
      n,
      num(fail.waves[0].total),
      fail.waves[1]?.total ?? 'None',
      num(fail.total),
      num(ok.total),
    ];
    path(
      g,
      [
        [104, ys[i] + 51],
        [1823, ys[i] + 51],
      ],
      C.line,
      2,
    );
    t.forEach((s, j) =>
      txt(
        g,
        s,
        xs[j],
        ys[i],
        48,
        j === 3 ? C.fault : j === 4 ? C.teal : C.ink,
        'left',
        'Mono',
        600,
      ),
    );
  });
  foot(
    g,
    last
      ? 'Wave 2 adds 65. Values 33 through 64 are still missing.'
      : 'The helper consumes at most 32 values from each 64-lane wave.',
  );
}
function sm(g, k) {
  const upgraded = cue(k, 'larger', 'Give each block', 0) > 0;
  const build = k.beat.id === 'larger' || k.reveal('Once a build runs correctly', 0) > 0;
  const cap = 192,
    reservation = upgraded ? 96 : 64,
    blocks = sharedBound(cap, reservation);
  base(
    g,
    'NVIDIA   /   port and retune',
    'How many thread blocks fit on one SM?',
    'Shared-memory-only bound • hypothetical usable capacity 192 KiB',
  );
  txt(g, 'Build for the target', 91, 324, 48, C.ink, 'left', 'Serif');
  txt(g, 'Hopper compute_90a PTX', 93, 408, 34, C.ink, 'left', 'Mono');
  txt(g, 'Blackwell  ×  incompatible', 93, 476, 32, C.fault);
  txt(g, 'Target-native or compatible PTX', 93, 578, 33, C.ink);
  if (build) txt(g, 'Launch and verify outputs  ✓', 93, 644, 34, C.teal);
  const x = 730,
    y = 382,
    w = 1050;
  txt(g, 'One streaming multiprocessor', x, 326, 40, C.ink, 'left', 'Serif');
  for (let i = 0; i < blocks; i++) {
    const bw = (w * reservation) / cap;
    box(g, x + i * bw, y, bw - 4, 180, i % 2 === 0 ? C.paleBlue : C.mint, C.ink);
    txt(g, 'Block ' + (i + 1), x + (i + 0.5) * bw, y + 66, 43, C.ink, 'center', 'Serif');
    txt(g, reservation + ' KiB', x + (i + 0.5) * bw, y + 127, 32, C.ink, 'center', 'Mono');
  }
  for (let t = 0; t <= cap; t += 32) {
    const xx = x + (w * t) / cap;
    path(
      g,
      [
        [xx, 573],
        [xx, 595],
      ],
      C.dim,
      2,
    );
    txt(g, t, xx, 625, 28, C.dim, 'center', 'Mono');
  }
  txt(g, '192 / ' + reservation + ' → ' + blocks + ' resident blocks at most', x, 721, 40, C.blue);
  foot(
    g,
    upgraded
      ? 'Lower memory traffic and fewer resident blocks can occur together.'
      : 'A successful launch lets us measure the kernel on this target.',
    'Use measured eligible warps, HBM bytes and kernel time to decide.',
  );
}
export function lanes(g, k) {
  if (k.beat.beatIndex < 3) wave(g, k);
  else if (k.beat.id === 'boundary') boundary(g, k);
  else sm(g, k);
}
export function checkLanes() {
  for (let n = 0; n <= 64; n++) {
    const m = scan(n);
    assert.equal(m.total, (n * (n + 1)) / 2);
    assert.equal(m.count, n);
  }
  assert.deepEqual(scan(64), { count: 64, a: 528, b: 1552, total: 2080 });
  assert.deepEqual(
    [63, 64, 65].map((n) => waveReduction(n, 32).total),
    [528, 528, 593],
  );
  assert.deepEqual(
    [63, 64, 65].map((n) => waveReduction(n, 64).total),
    [2016, 2080, 2145],
  );
  assert.deepEqual(
    [64, 96].map((n) => sharedBound(192, n)),
    [3, 2],
  );
}

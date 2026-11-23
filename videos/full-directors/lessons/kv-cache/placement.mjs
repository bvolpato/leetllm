import {
  P,
  heading,
  box,
  line,
  txt,
  mono,
  cap,
  chip,
  slot,
  bar,
  footer,
  metric,
  arrow,
  hatch,
  block,
  bno,
  cue,
  on,
} from './drawing.mjs';
import {
  TABLE,
  PAIRS,
  reference,
  kernel,
  address,
  allocation,
  HOLES,
  NEEDED,
  sum,
  fmt,
} from './mechanics.mjs';
import { storage } from '../../../films/kv-cache/model.mjs';

function pool(g, packed, arrives) {
  const owners = packed
    ? ['A', 'A', null, null, null, null, 'B', 'B', null, null, null, null]
    : Array.from({ length: 12 }, (_, i) => (i < 6 ? 'A' : 'B'));
  if (packed && arrives) {
    owners[2] = 'C';
    owners[9] = 'C';
  }
  const contents = packed ? owners.map(Boolean) : owners.map((v, i) => i % 6 < 2);
  cap(g, 'Physical pool   ·   twelve equal blocks', 90, 347);
  for (let i = 0; i < 12; i++) {
    const x = 90 + i * 145;
    const fill = owners[i] === 'B' ? P.vPale : owners[i] === 'C' ? P.goldPale : P.kPale;
    box(g, x, 428, 135, 170, owners[i] ? fill : P.empty, P.rail);
    if (!contents[i]) hatch(g, x + 3, 431, 129, 164, owners[i] ? P.muted : P.line);
    if (owners[i]) chip(g, x + 43, 475, 51, 53, owners[i], fill, { size: 32 });
    mono(g, i, x + 68, 643, 29, { align: 'center' });
  }
  cap(g, 'Hatching marks space with no live data.', 90, 734);
}
export function waste(g, c) {
  const n = bno(c);
  if (n < 4) {
    heading(g, 'Contiguous reservations', 'Can C take two of the blank blocks?');
    pool(g, false, false);
    footer(
      g,
      n === 3 && on(c, 3, 'must wait')
        ? 'C waits. All twelve blocks are reserved.'
        : 'A reserved six. B reserved six. C needs two.',
      'Each current request has live data in just two blocks.',
    );
  } else if (n === 4 || (n === 5 && !on(c, 5, 'A different problem'))) {
    const used = 300,
      limit = 4096,
      known = on(c, 4, 'stops at three hundred');
    heading(
      g,
      n === 4 ? 'Internal fragmentation' : 'Reservation waste',
      n === 4
        ? 'How many slots did the finished request never use?'
        : 'Who can use a reserved slot while the request grows?',
    );
    cap(g, 'One contiguous reservation', 90, 362);
    const x = 92,
      y = 455,
      w = 1730;
    bar(g, x, y, w, 126, used / limit, P.k);
    hatch(g, x + (w * used) / limit, y, w * (1 - used / limit), 126);
    mono(g, '0', x, 625, 33);
    mono(g, fmt(limit), x + w, 625, 33, { align: 'right' });
    cap(g, '300 used', x, 705);
    if (known)
      txt(g, fmt(limit - used) + ' slots inside the reservation', x + 370, 716, 48, { f: 'Serif' });
    footer(
      g,
      n === 4
        ? 'Internal fragmentation when the request stops early'
        : 'Reservation waste while those future positions sit idle',
      'The reserved tail is unavailable to other requests.',
    );
  } else {
    heading(g, 'External fragmentation', 'Does a 20-slot buffer fit in these free runs?');
    const runs = [HOLES[0], 5, HOLES[1], 5, HOLES[2]],
      scale = 34;
    let x = 94;
    runs.forEach((r, i) => {
      const free = i % 2 === 0;
      box(g, x, 445, r * scale - 4, 125, free ? P.surface : P.k, P.rail);
      for (let j = 1; j < r; j++)
        line(g, x + j * scale, 450, x + j * scale, 563, free ? P.line : '#549d96', 1);
      mono(g, free ? r + ' free' : 'live', x + (r * scale) / 2, 620, 34, { align: 'center' });
      x += r * scale;
    });
    const end = 94 + NEEDED * scale;
    line(g, 94, 744, end, 744, P.gold, 8);
    cap(g, '20 consecutive slots required', end + 26, 744, { col: P.gold });
    const solved = on(c, 6, 'Thirty six free');
    footer(
      g,
      solved
        ? '36 slots are free. The longest run holds only 14.'
        : 'Compare each run with the requested length.',
      n === 7
        ? 'In 2023 the vLLM team reported 60–80% waste in the systems it studied.'
        : 'The same number of free slots can have different usable capacity.',
    );
  }
}
export function mapping(g, c) {
  const n = bno(c);
  if (n === 6) {
    const admitted = on(c, 6, 'C takes two');
    heading(g, 'On-demand allocation', 'Where can C go in the same pool?');
    pool(g, true, admitted);
    footer(
      g,
      admitted
        ? 'C occupies two scattered blocks. Six blocks remain free.'
        : 'A and B occupy four blocks altogether.',
      'Allocation follows present demand within this uniform pool.',
    );
    return;
  }
  if (n >= 7) {
    const compare = n >= 8,
      ts = compare ? 17 : 1;
    const sizes = compare ? [8, 16] : [16];
    heading(g, 'Tail waste', 'What changes when the block size changes?');
    cap(g, ts + ' processed ' + (ts === 1 ? 'position' : 'positions') + ' per request', 89, 328);
    sizes.forEach((size, row) => {
      const a = allocation(ts, size),
        y = 424 + row * 203;
      cap(g, size + ' slots / block', 88, y + 32);
      const width = 37;
      for (let j = 0; j < a.blocks * size; j++) {
        const x = 411 + j * width + Math.floor(j / size) * 18;
        box(g, x, y, width - 3, 63, j < ts ? P.k : P.empty, P.rail, 1);
        if (j >= ts) hatch(g, x + 1, y + 1, width - 5, 61);
      }
      const show =
        n === 7
          ? on(c, 7, 'fifteen slots unused')
          : on(c, 8, row ? 'Two large ones' : 'Three small blocks');
      if (show)
        mono(
          g,
          a.blocks +
            ' ' +
            (a.blocks === 1 ? 'block' : 'blocks') +
            '    ' +
            a.empty +
            ' empty slots',
          411,
          y + 106,
          31,
        );
    });
    footer(
      g,
      'Unused slots = allocated blocks × block size − live positions',
      'Round up per request. Smaller blocks trade a shorter tail for more table entries.',
    );
    return;
  }
  const replay = n === 4 || n === 5;
  const allocated = !replay || on(c, 5, 'allocator take');
  const count = replay
    ? allocated
      ? 5
      : n === 4
        ? 1 + Math.floor(3 * cue(c, 4, 'Each processed token', 1.4))
        : 4
    : 6;
  const target = !replay && on(c, 3, 'Table entry one');
  heading(
    g,
    'PagedAttention  /  address translation',
    replay ? 'Which append needs a new block?' : 'Where is position five?',
  );
  cap(g, 'REQUEST A  /  block table', 90, 339);
  [7, ...(allocated ? [2] : [])].forEach((id, i) => {
    mono(g, 'logical ' + i, 90, 432 + i * 143, 34);
    arrow(g, 286, 431 + i * 143, 378, 431 + i * 143);
    chip(g, 407, 383 + i * 143, 165, 88, id, target && i === 1 ? P.goldPale : P.kPale);
  });
  block(
    g,
    816,
    390,
    935,
    7,
    Array.from({ length: Math.min(count, 4) }, (_, i) => 'pos ' + i),
  );
  if (allocated)
    block(
      g,
      816,
      632,
      935,
      2,
      Array.from({ length: Math.max(0, count - 4) }, (_, i) => 'pos ' + (i + 4)),
      '',
      target ? 1 : count === 5 ? 0 : -1,
    );
  cap(g, '4 slots per physical block', 90, 742);
  footer(
    g,
    target
      ? '5 ÷ 4 gives logical block 1 and slot 1. Table[1] = 2.'
      : replay
        ? 'Processed positions: ' + count + '    Allocated blocks: ' + (allocated ? 2 : 1)
        : 'Start at zero. Divide the position by the block size.',
    target
      ? 'The physical address is block 2, slot 1.'
      : 'The quotient selects the table entry. The remainder selects the slot.',
  );
}
function numericBlock(g, x, y, id, active, bound) {
  const pitch = 200,
    w = 4 * pitch;
  cap(g, 'Physical block ' + id, x, y - 45, { col: P.ink });
  const base = id === TABLE[0] ? 0 : 4;
  box(g, x - 8, y - 8, w + 11, 200, P.rail);
  storage.get(id).forEach(([key, value], i) => {
    const pos = base + i,
      valid = pos < PAIRS.length,
      xx = x + i * pitch;
    box(g, xx, y, pitch - 4, 175, valid ? P.surface : P.badPale);
    if (!valid) hatch(g, xx, y, pitch - 4, 43, '#b77681');
    txt(g, valid ? 'pos ' + pos : 'test slot', xx + pitch / 2, y + 25, 30, {
      align: 'center',
      weight: 600,
    });
    mono(g, 'K ' + key.join(' '), xx + pitch / 2, y + 83, 27, {
      align: 'center',
      max: pitch - 12,
      col: P.k,
    });
    mono(g, 'V ' + value.join(' '), xx + pitch / 2, y + 136, 27, {
      align: 'center',
      max: pitch - 12,
      col: P.v,
    });
    if (active === pos) box(g, xx + 2, y + 2, pitch - 9, 170, null, P.gold, 7);
    cap(g, 'slot ' + i, xx + pitch / 2, y + 224, { align: 'center' });
  });
  if (bound && id === 2) {
    const xx = x + pitch * 2 - 2;
    line(g, xx, y - 19, xx, y + 185, P.ink, 9);
    txt(g, 'Stop', xx + 8, y - 46, 30, { col: P.gold });
  }
}
export function reading(g, c) {
  const n = bno(c);
  if (n <= 4) {
    const over = on(c, 4, 'Read seven') && !on(c, 4, 'Restore the valid length');
    const bound = on(c, 4, 'Restore the valid length');
    const t = cue(c, 2, 'Four pairs come', 1.55);
    const pos =
      n < 2
        ? -1
        : over
          ? 6
          : n === 2 && !on(c, 2, 'Jump to block two')
            ? Math.min(3, Math.floor(t * 4))
            : n === 2 && !on(c, 2, 'then slot one')
              ? 4
              : 5;
    const result = on(c, 2, 'Their weighted values'),
      r = kernel(over ? 7 : 6);
    heading(
      g,
      'Attention kernel  /  one-head fixture',
      n <= 2
        ? 'Can scattered pairs reproduce the contiguous read?'
        : 'What changes if the kernel reads one extra slot?',
    );
    cap(g, 'A’s block table    0 → 7     1 → 2', 89, 303);
    cap(g, 'Query  (1, 0.5)     •     valid length 6', 1834, 303, { align: 'right' });
    numericBlock(g, 93, 415, 2, pos, bound);
    numericBlock(g, 1012, 415, 7, pos, bound);
    if (result) {
      const x = 91,
        y = 746,
        w = 1150;
      let dx = x;
      r.weights.forEach((weight, i) => {
        const width = weight * w;
        if (width < 0.5) return;
        box(g, dx, y, width - 2, 52, i === 6 ? P.bad : i % 2 === 0 ? P.k : P.rail);
        if (width > 45)
          mono(g, i === 6 ? 'test slot' : i, dx + width / 2, y + 26, 26, {
            align: 'center',
            col: '#fff',
          });
        dx += width;
      });
      cap(g, 'Softmax weight by position', x, y - 32);
      cap(g, 'All weights sum to 1', 1304, y + 26);
    }
    const out = (v) => '(' + v.map((x) => x.toFixed(2)).join(', ') + ')';
    footer(
      g,
      result
        ? 'Paged ' + out(r.out) + '       Contiguous ' + out(reference)
        : 'Trace the table in logical order.',
      bound
        ? 'The read ends at block 2, slot 1. The striped slots remain physically present.'
        : over
          ? 'Overread: the seventh key takes essentially all the weight.'
          : 'A test key and value were planted beyond the six valid positions.',
    );
  } else if (n <= 6) {
    heading(
      g,
      'Serving evidence  /  vLLM paper, 2023',
      'How can a slower kernel serve more requests?',
    );
    cap(g, 'Kernel time in isolation   ·   relative to contiguous', 90, 329);
    bar(g, 95, 412, 940, 50, 1 / 1.26, P.k);
    txt(g, 'Contiguous    1.00×', 1073, 438, 38);
    bar(g, 95, 509, 940, 50, 1, P.v);
    txt(g, 'Paged    1.20–1.26×', 1073, 533, 38);
    if (on(c, 6, 'overall throughput')) {
      metric(g, 'END-TO-END THROUGHPUT', '2–4×', 95, 659, 550);
      txt(g, 'Larger batches fit in the recovered space.', 550, 730, 49, { f: 'Serif' });
    }
    footer(
      g,
      'Two measurements with different denominators',
      'Throughput was compared with reimplemented Orca on the paper’s workloads. Benchmark your own stack.',
    );
  } else {
    heading(
      g,
      'vAttention  /  virtual memory',
      'Can a contiguous kernel keep its address contract?',
    );
    cap(g, 'Contiguous virtual addresses', 90, 338);
    const xs = [200, 600, 1000, 1400],
      physical = [2, 0, 3, 1],
      backed = [0, 1, 2];
    xs.forEach((x, i) => {
      chip(g, x, 390, 310, 81, 'Page ' + i, i < 3 ? P.kPale : P.empty);
      if (backed.includes(i)) arrow(g, x + 155, 490, xs[physical[i]] + 155, 655, P.muted, 3);
    });
    xs.forEach((x, i) => chip(g, x, 680, 310, 76, 'Frame ' + i, i === 1 ? P.empty : P.vPale));
    footer(
      g,
      'Virtual page 3 has an address and still needs physical backing.',
      'Page mapping supplies physical storage on demand. The kernel sees a continuous virtual range.',
    );
  }
}
export function lifetime(g, c) {
  const done = on(c, 2, 'When the pending read completes'),
    taken = on(c, 2, 'C can take'),
    retain = bno(c) === 3;
  heading(
    g,
    'Block lifetime',
    retain ? 'What if the policy retains finished state?' : 'Which block can C overwrite?',
  );
  if (retain) {
    block(g, 98, 480, 745, 7, ['0', '1', '2', '3'], '0 live owners');
    arrow(g, 880, 520, 1060, 520, P.muted);
    metric(g, 'AFTER THE FINAL READ', 'Retained', 1130, 422, 610, P.k);
    txt(g, 'Reusable on a compatible hit', 1130, 615, 39, { max: 650 });
    footer(
      g,
      'After B also finishes, the policy can retain its full block 7.',
      'Live references, pending GPU work and policy retention have separate lifetimes.',
    );
  } else {
    block(g, 96, 439, 800, 7, ['0', '1', '2', '3'], 'B still owns it');
    block(g, 1018, 439, 793, 2, taken ? ['C · 0'] : ['4', '5'], taken ? 'Owner C' : '0 owners');
    chip(g, 100, 668, 790, 76, 'B continues', P.kPale);
    chip(
      g,
      1020,
      668,
      790,
      76,
      taken ? 'C writes its first pair' : done ? 'GPU read complete' : 'GPU read in flight',
      taken ? P.kPale : done ? P.surface : P.goldPale,
    );
    footer(
      g,
      taken
        ? 'C reuses block 2. B keeps its original address.'
        : done
          ? 'Block 2 is now available.'
          : 'A released its references to both blocks.',
      'Overwriting requires zero remaining owners and completion of prior accesses.',
    );
  }
}

import assert from 'node:assert/strict';
import {
  cachePayload,
  fullPairs,
  localPairs,
  GiB,
} from '../../../films/context-packing/arithmetic.mjs';
import {
  C,
  alpha,
  box,
  circle,
  cue,
  endCue,
  foot,
  layout,
  lerp,
  line,
  mono,
  paper,
  rows,
  serif,
  stamp,
  txt,
} from './drawing.mjs';

const n = 10,
  w = 4,
  early = 1,
  last = n - 1;
const visible = (q, k, band) => k <= q && k >= Math.max(0, q - band + 1);
function pairs(g, k) {
  const b = k.beat.beatIndex;
  const local = cue(k, 3, 'Switch this layer', 0.8) > 0;
  const decode = b === 2 && cue(k, 2, 'During decode', 0.6) > 0;
  const sink = cue(k, 4, 'Here a sink', 0.5) > 0;
  const scale = b <= 2 && cue(k, 1, 'Increase the prompt length', 0.5) > 0 && !decode;
  const ratio = (64000 / 8000) ** 2;
  layout(
    g,
    local ? 'ATTENTION ACCESS' : 'ATTENTION WORK',
    local
      ? 'Can the last query read the approval?'
      : decode
        ? 'What does the next token read?'
        : 'How many pairs does prefill compare?',
  );
  const x = 160,
    y = 324,
    cell = 44;
  const countRows = b === 0 ? 1 + Math.floor(9 * cue(k, 0, 'Each row', 1.6)) : 10;
  const gridN = decode ? n + 1 : n;
  for (let r = 0; r < gridN; r++)
    for (let c = 0; c < gridN; c++) {
      const on =
        r < (decode ? gridN : countRows) && (visible(r, c, local ? w : n + 1) || (sink && c === 0));
      const interest = (r === last || r === n) && c === early;
      const color = on
        ? interest
          ? C.ochre
          : r === n
            ? C.ochre
            : sink && c === 0
              ? C.pale
              : C.green
        : C.empty;
      box(g, x + c * cell, y + r * cell, cell - 4, cell - 4, color);
      if (local && interest && !on) {
        line(
          g,
          x + c * cell + 8,
          y + r * cell + 8,
          x + (c + 1) * cell - 12,
          y + (r + 1) * cell - 12,
          C.red,
          4,
        );
        line(
          g,
          x + c * cell + 8,
          y + (r + 1) * cell - 12,
          x + (c + 1) * cell - 12,
          y + r * cell + 8,
          C.red,
          4,
        );
      }
    }
  mono(g, 'Key position →', x, 296, 28);
  mono(g, decode ? 'Q10' : 'Q9', x - 12, y + (gridN - 0.35) * cell, 26, { align: 'right' });
  if (!decode)
    mono(g, 'D1', x + 1.5 * cell, y + gridN * cell + 44, 26, {
      align: 'center',
      color: C.gold,
    });
  if (local) {
    serif(g, 'Last query', 827, 390, 63);
    const ids = Array.from({ length: n }, (_, i) => i).filter(
      (i) => visible(last, i, w) || (sink && i === 0),
    );
    ids.forEach((id, i) => {
      const xx = 832 + i * 151;
      box(g, xx, 461, 125, 120, sink && id === 0 ? C.pale : C.mint, C.ink);
      mono(g, id, xx + 62, 538, 49, { align: 'center' });
    });
    mono(
      g,
      sink ? 'Sink at 0   +   four local keys' : 'Four local keys   ·   direct access in one layer',
      827,
      655,
      28,
    );
    txt(g, 'Approval at position 1', 827, 755, 39, { color: C.red });
    foot(
      g,
      sink
        ? 'The initial sink can aid stability. Position 1 still has no direct entry.'
        : 'The last row ends with four accessible keys.',
      sink
        ? 'Fixed band plus a retained sink'
        : 'Width 4 including the query   ·   ' + localPairs(n, w) + ' pairs',
    );
  } else if (scale) {
    mono(g, n + ' positions   ·   ' + fullPairs(n) + ' pairs', x + 220, 808, 29);
    const painted = cue(k, 2, 'FlashAttention', 0.55);
    for (let j = 0; j < 8; j++) {
      line(g, 860 + j * 46, 716, 901 + j * 46, 716, C.ink, 3);
      line(g, 850, 342 + j * 46, 850, 383 + j * 46, C.ink, 3);
    }
    box(g, 860, 342, 41, 41, C.green);
    alpha(g, painted, () => {
      for (let i = 0; i < 8; i++)
        for (let j = 0; j < 8; j++)
          if (i + j > 0) box(g, 860 + j * 46, 342 + i * 46, 41, 41, C.mint);
    });
    mono(g, '8 × row length', 1040, 757, 29, { align: 'center' });
    serif(g, '8K → 64K', 1325, 439, 58);
    mono(g, '8 × both axes', 1326, 508, 32);
    const answer = painted > 0;
    if (answer) serif(g, '≈ ' + ratio + '×', 1315, 658, 96);
    foot(
      g,
      answer
        ? 'Full causal prefill has quadratic leading work.'
        : 'How does the leading pair count change?',
      'Causal pairs = n(n + 1) / 2   ·   fixed architecture',
    );
  } else {
    serif(g, decode ? 'One new query' : 'Ten input positions', 833, 415, 70);
    mono(g, decode ? 'Read the cached prefix + current key' : '1 + 2 + 3 + … + 10', 839, 522, 40);
    if (!decode) txt(g, 'Each row ends at its own position.', 836, 641, 38);
    if (decode) mono(g, 'New row highlighted', 839, 641, 33, { color: C.gold });
    foot(
      g,
      decode
        ? 'Cached projections let the old rows stay computed.'
        : 'Every filled square is one query-key comparison.',
      'Causal attention   ·   rows are queries, columns are keys',
    );
  }
}
const full = { layers: 80, heads: 8, width: 128, tokens: 131072, bytes: 2 };
const gib = (spec) => cachePayload(spec) / GiB;
const weightGiB = (70e9 * 2) / GiB;
const queryHeads = 64;
const cacheRows = [
  {
    name: 'MHA',
    heads: queryHeads,
    start: 'In multi-head attention',
    amount: 'three hundred twenty',
  },
  { name: 'GQA', heads: full.heads, start: 'Grouped-query attention', amount: 'forty gibibytes' },
  { name: 'MQA', heads: 1, start: 'Multi-query attention', amount: 'five gibibytes' },
];
const cacheOrigin = 251;
const pxPerGiB = 4.45;
function cacheAxis(g) {
  const y = 728;
  line(g, cacheOrigin, y, cacheOrigin + 320 * pxPerGiB, y, C.ink, 3);
  for (const value of [0, 80, 160, 240, 320]) {
    const x = cacheOrigin + value * pxPerGiB;
    line(g, x, y, x, y + 12, C.ink, 2);
    mono(g, value, x, y + 49, 27, { align: 'center' });
  }
}
function compareCaches(g, k) {
  const shown = cacheRows.filter((row) => k.reveal(row.start, 0) === 1);
  const current = shown.at(-1);
  const latent = k.reveal('Multi-head latent attention', 0) === 1;
  layout(
    g,
    'CACHE RESIDENCY',
    latent
      ? 'What does MLA retain at each position?'
      : 'How does head sharing change one sequence’s cache?',
  );
  if (latent) {
    for (const [i, name] of ['Compressed latent vector', 'Positional key'].entries()) {
      const x = 120 + i * 865;
      paper(g, x, 291, 788, 108, C.ochre);
      serif(g, name, x + 394, 360, 49, { align: 'center' });
    }
    mono(g, '+', 947, 358, 45, { align: 'center' });
    mono(g, 'Reference caches below use separate K and V arrays.', 120, 474, 30);
  } else {
    mono(
      g,
      'One sequence  ·  80 layers  ·  width 128  ·  131,072 positions  ·  2 bytes per element',
      116,
      319,
      30,
    );
    const sharing = queryHeads / current.heads;
    serif(
      g,
      current.name +
        '   ' +
        sharing +
        (sharing === 1 ? ' query head' : ' query heads') +
        ' per KV head',
      114,
      425,
      60,
    );
  }
  cacheRows.forEach((row, i) => {
    // The eight-head GQA result was already measured before this replay.
    const known = row.name === 'GQA';
    if (!known && !shown.includes(row)) return;
    const y = 509 + i * 71;
    const amount = gib({ ...full, heads: row.heads });
    const width = amount * pxPerGiB;
    mono(g, row.name, cacheOrigin - 23, y + 22, 33, { align: 'right', weight: 600 });
    mono(
      g,
      row.heads + (row.heads === 1 ? ' KV head' : ' KV heads'),
      cacheOrigin - 23,
      y + 49,
      23,
      { align: 'right' },
    );
    const reveal = known ? 1 : k.reveal(row.amount, 0.4);
    if (reveal > 0) {
      alpha(g, reveal, () => {
        box(g, cacheOrigin, y, width, 51, row === current && !latent ? C.mint : C.pale, C.ink);
      });
      // Keep the value legible beside even the five-GiB strip.
      mono(g, amount + ' GiB', cacheOrigin + width + 12, y + 38, 30);
    }
  });
  cacheAxis(g);
  foot(
    g,
    latent
      ? 'Use the checkpoint’s latent and positional widths and its cache precision.'
      : '2 arrays × layers × KV heads × width × positions × bytes per element',
    latent
      ? 'MHA, GQA and MQA   ·   one-sequence reference payloads in GiB'
      : current.name +
          '   ·   ' +
          queryHeads +
          ' query heads   ·   ' +
          current.heads +
          (current.heads === 1 ? ' stored KV head' : ' stored KV heads'),
  );
}
function cache(g, k) {
  const b = k.beat.beatIndex;
  if (b === 3 && k.reveal(cacheRows[0].start, 0) === 1) return compareCaches(g, k);
  const many = b === 2;
  const spec = full;
  const one = gib(spec),
    copies = many ? 4 : 1;
  layout(g, 'CACHE RESIDENCY', 'How much state must decode retain?');
  mono(
    g,
    'GQA   ·   separate K and V   ·   64 query heads   ·   ' +
      queryHeads / spec.heads +
      ' per KV head',
    100,
    314,
    30,
  );
  const x = 111,
    top = 377;
  const axes = [
    ['Arrays', '2'],
    ['Layers', spec.layers],
    ['KV heads', spec.heads],
    ['Width', spec.width],
    ['Positions', spec.tokens.toLocaleString('en-US')],
    ['B / element', spec.bytes],
  ];
  axes.forEach(([name, v], i) => {
    const xx = x + i * 291;
    paper(g, xx, top, 244, 157, i === 2 ? C.mint : C.white);
    mono(g, name, xx + 122, top + 48, 28, { align: 'center', max: 215 });
    serif(g, v, xx + 122, top + 122, 61, { align: 'center' });
    if (i < 5) mono(g, '×', xx + 269, top + 96, 35, { align: 'center', color: C.mute });
  });
  const ux = pxPerGiB,
    left = cacheOrigin;
  const appear = many ? cue(k, 2, 'one hundred sixty', 0.65) : cue(k, 1, 'forty gibibytes', 0.65);
  const weights = many && k.reveal('two-byte weights', 0) === 1;
  mono(g, 'Logical KV', left, 622, 30, { color: C.green });
  for (let i = 0; i < copies; i++)
    alpha(g, many && i === 0 ? 1 : appear, () => {
      box(g, left + i * one * ux, 655, one * ux - 3, 65, i % 2 ? C.pale : C.mint, C.ink);
      mono(g, one, left + (i + 0.5) * one * ux, 700, 32, { align: 'center' });
    });
  cacheAxis(g);
  if (weights) line(g, left + weightGiB * ux, 637, left + weightGiB * ux, 728, C.red, 4, [7, 5]);
  const total = one * copies;
  foot(
    g,
    appear > 0
      ? copies +
          ' independent ' +
          (copies === 1 ? 'sequence' : 'sequences') +
          '   ·   ' +
          total +
          ' GiB of raw cache'
      : many
        ? 'Each independent sequence needs its own copy of the retained state.'
        : 'Multiply the six axes to obtain bytes for one sequence.',
    weights
      ? 'Dashed mark   ≈ 130 GiB of two-byte weights'
      : 'Scale in GiB   ·   1 GiB = 2³⁰ bytes   ·   excludes overhead',
  );
}
const layerGroups = [
  { name: 'Local layers', layers: 40, heads: 8, width: 256, tokens: 1024, bytes: 2 },
  { name: 'Global layers', layers: 8, heads: 1, width: 512, tokens: 131072, bytes: 2 },
];
function layers(g, k) {
  layout(g, 'MIXED CACHE', 'How much does each layer retain?');
  const amounts = layerGroups.map(gib),
    sum = amounts.reduce((a, b) => a + b, 0);
  const terms = cue(k, 1, 'Add the two terms', 0.4) > 0,
    total = cue(k, 2, 'A shared projection', 0.4) > 0;
  layerGroups.forEach((s, i) => {
    const x = 116 + i * 884;
    paper(g, x, 299, 806, 477, i ? C.white : C.mint);
    mono(g, s.name, x + 35, 360, 36, { weight: 600 });
    rows(
      g,
      x + 35,
      431,
      [
        ['Layers', s.layers],
        ['KV heads × width', s.heads + ' × ' + s.width],
        ['Positions retained', s.tokens.toLocaleString('en-US')],
      ],
      736,
      73,
    );
    if (terms) {
      serif(g, amounts[i] + ' GiB', x + 35, 695, 60);
      box(g, x + 35, 721, 728, 29, C.empty);
      box(g, x + 35, 721, (728 * amounts[i]) / Math.max(...amounts), 29, i ? C.blue : C.green);
    }
  });
  foot(
    g,
    total
      ? amounts[0] + ' + ' + amounts[1] + ' = ' + sum + ' GiB of logical KV'
      : 'Compute each group using its own retained length and head shape.',
    '2 arrays × layers × KV heads × width × retained positions × 2 bytes   ·   local eviction enabled',
  );
}
const cacheBudget = 64;
const prefix = 48000,
  suffixes = [800, 1200, 600];
const work = (reuse) => suffixes.map((s, i) => s + (reuse && i > 0 ? 0 : prefix));
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
function serving(g, k) {
  const b = k.beat.beatIndex;
  const paging = b === 1 && cue(k, 1, 'When free space', 0.5) > 0;
  if (b <= 1 && !paging) {
    layout(g, 'CACHE PRECISION', 'How many complete requests fit in 64 GiB?');
    [2, 1].forEach((bytes, i) => {
      const y = 381 + i * 210,
        payload = gib({ ...full, bytes }),
        x = 506,
        unit = 19;
      const count = Math.floor(cacheBudget / payload),
        filled = cue(k, 1, 'These are upper bounds', 0.45) > 0;
      mono(g, bytes === 2 ? 'BF16' : 'FP8', 105, y + 44, 40);
      txt(g, payload + ' GiB each', 105, y + 102, 37);
      box(g, x, y, cacheBudget * unit, 105, C.empty, C.ink);
      for (let j = 0; j < (filled ? count : 1); j++) {
        box(g, x + j * payload * unit, y, payload * unit - 3, 105, i ? C.mint : C.pale, C.ink);
        mono(g, payload + ' GiB', x + (j + 0.5) * payload * unit, y + 66, 36, { align: 'center' });
      }
      line(g, x + unit * cacheBudget, y - 22, x + unit * cacheBudget, y + 130, C.red, 5);
    });
    foot(
      g,
      b === 0
        ? 'Predict the two admission counts.'
        : 'Raw payload fits before scales, headroom and rounding.',
      'GQA   ·   8 KV heads   ·   same 131,072 positions   ·   separate K and V   ·   supported cache dtype',
    );
    return;
  }
  if (paging) {
    layout(g, 'CACHE ALLOCATION', 'Can free pages hold a growing request?');
    mono(g, 'Physical pages on one device', 110, 354, 34);
    const free = [1, 4, 6],
      admitted = cue(k, 1, 'as requests grow', 1.2);
    const num = Math.floor(admitted * free.length);
    const logical = free.slice(0, num);
    for (let i = 0; i < 8; i++) {
      const x = 114 + i * 213,
        slot = logical.indexOf(i),
        vacant = free.includes(i);
      box(g, x, 418, 193, 148, slot >= 0 ? C.ochre : vacant ? C.white : C.pale, C.ink);
      mono(g, i, x + 18, 459, 29);
      txt(g, slot >= 0 ? 'KV ' + (slot + 1) : vacant ? 'Free' : 'In use', x + 96, 526, 38, {
        align: 'center',
      });
    }
    mono(g, 'Request page table', 114, 677, 33);
    logical.forEach((p, i) => {
      box(g, 578 + i * 292, 611, 266, 108, C.ochre, C.ink);
      mono(g, i + 1 + ' → p' + p, 711 + i * 292, 677, 33, { align: 'center' });
    });
    foot(g, 'One logical request can use nonadjacent physical pages.');
    return;
  }
  layout(g, 'PREFIX REUSE', 'Which tokens need a new prefill?');
  const reused = cue(k, 2, 'With a retained matching prefix', 0.7) > 0;
  const newWork = work(reused);
  mono(g, 'Request', 110, 337);
  mono(g, 'Identical prefix', 491, 337);
  mono(g, 'Suffix', 1270, 337);
  for (let i = 0; i < 3; i++) {
    const y = 382 + i * 119;
    mono(g, 'Q' + (i + 1), 116, y + 55, 41);
    const hit = reused && i > 0;
    box(g, 362, y, 800, 91, hit ? C.empty : C.mint, C.ink);
    txt(g, '48,000   ' + (hit ? 'cached' : 'prefill'), 760, y + 59, 39, { align: 'center' });
    box(g, 1200, y, 410, 91, C.mint, C.ink);
    mono(g, suffixes[i] + ' new', 1405, y + 57, 36, { align: 'center' });
  }
  foot(
    g,
    'Newly processed prompt tokens   ' + sum(newWork).toLocaleString('en-US'),
    b === 3
      ? 'All three decodes still read their prefix.'
      : 'Sequential requests   ·   exact, retained shared prefix   ·   no eviction',
  );
}
const parallel = { ranks: 4, physical: 16, history: 1025 };
const grid = parallel.ranks * parallel.physical,
  blocks = Math.ceil(parallel.history / grid);
function devices(g, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    layout(g, 'CONTEXT PARALLELISM', 'How does a local query read remote keys?');
    const points = [
      [330, 443],
      [914, 443],
      [914, 652],
      [330, 652],
    ];
    const colors = [C.ochre, C.pale, C.mint, C.rose];
    const first = cue(k, 0, 'Follow the highlighted block', 1.25);
    const next = cue(k, 1, 'Ring Attention exchanges', 2.1);
    const steps = first + 2 * next;
    const round = Math.floor(steps),
      frac = steps - round;
    points.forEach(([x, y], i) => {
      const [nx, ny] = points[(i + 1) % 4];
      line(g, x, y, nx, ny, C.line, 5);
    });
    points.forEach(([x, y], i) => {
      const top = i < 2,
        labelY = top ? y - 131 : y + 60;
      box(g, x - 147, labelY, 294, 72, C.white, C.ink, 3);
      mono(g, 'Device ' + (i + 1) + ' · Q' + (i + 1), x, labelY + 46, 29, { align: 'center' });
      line(g, x, top ? labelY + 72 : labelY, x, top ? y - 34 : y + 34, C.mute, 2);
    });
    points.forEach((_, i) => {
      const a = points[(i + round) % 4],
        bb = points[(i + round + 1) % 4];
      const x = lerp(a[0], bb[0], frac),
        y = lerp(a[1], bb[1], frac);
      box(g, x - 57, y - 30, 114, 60, colors[i], C.ink);
      mono(g, 'KV' + (i + 1), x, y + 10, 30, { align: 'center' });
    });
    serif(g, 'Local queries', 1230, 438, 58);
    serif(g, 'Traveling KV', 1230, 623, 58);
    mono(g, 'stay with the owner', 1231, 493, 30);
    mono(g, 'visits each owner', 1231, 678, 30);
    foot(
      g,
      'Block exchange lets a query owner process a remote part of the sequence.',
      'Illustrative four-way ring   ·   communication and compute can overlap',
    );
    return;
  }
  layout(g, 'DISTRIBUTED CACHE', 'Which block grid covers 1,025 positions?');
  const settled = cue(k, 3, 'Rounding to the physical', 0.4) > 0;
  const x = 110,
    y = 535,
    step = 97;
  mono(g, '1 logical block', 111, 331, 35);
  for (let j = 0; j < 4; j++) {
    box(g, 111 + j * 126, 367, 120, 78, j % 2 ? C.pale : C.mint, C.ink);
    mono(g, 16, 171 + j * 126, 418, 34, { align: 'center' });
  }
  serif(g, '= 64 positions', 658, 423, 61);
  mono(g, 'Block 17 at token scale', 1229, 330, 29);
  for (let row = 0; row < parallel.ranks; row++)
    for (let col = 0; col < parallel.physical; col++) {
      const slot = (blocks - 1) * grid + row * parallel.physical + col;
      box(g, 1232 + col * 30, 354 + row * 24, 26, 20, slot < parallel.history ? C.ochre : C.empty);
    }
  for (let i = 0; i < blocks; i++) {
    const xx = x + i * step;
    box(g, xx, y, step - 4, 119, C.white, C.ink);
    for (let j = 0; j < 4; j++) {
      const occupied = Math.min(16, Math.max(0, parallel.history - (i * 64 + j * 16)));
      box(
        g,
        xx + 2 + (j * (step - 8)) / 4,
        y + 4,
        (((step - 8) / 4) * occupied) / 16,
        111,
        i === 16 ? C.ochre : C.green,
      );
    }
    if (i === 16 || i === 0 || i === 15)
      mono(g, '#' + (i + 1), xx + (step - 4) / 2, y + 164, 27, { align: 'center' });
  }
  txt(g, 'One more position spills into a new logical block.', 110, 790, 45);
  foot(
    g,
    settled
      ? blocks + ' × ' + grid + ' = ' + blocks * grid + ' positions of logical capacity.'
      : 'Round the history up to a whole logical block.',
    'Four ranks   ·   16 physical positions per rank per logical block',
  );
}
const rope = { train: 4096, target: 16384, m: 12288 };
const mapped = (rope.m * rope.train) / rope.target;
function dial(g, x, y, r, theta, ink, label, stem = 1) {
  circle(g, x, y, r, null, C.line, 3);
  line(g, x - r - 10, y, x + r + 10, y, C.line, 2);
  line(g, x, y - r - 10, x, y + r + 10, C.line, 2);
  const xx = x + r * Math.cos(theta) * stem,
    yy = y - r * Math.sin(theta) * stem;
  line(g, x, y, xx, yy, ink, 8);
  circle(g, xx, yy, 9, ink);
  circle(g, x, y, 7, C.ink);
  if (label) mono(g, label, x, y + r + 56, 30, { align: 'center' });
}
function position(g, k) {
  const b = k.beat.beatIndex;
  if (b === 0) {
    layout(g, 'ROTARY POSITIONS', 'How does a token offset become an angle?');
    const p = cue(k, 0, 'each pair turns', 1.6);
    dial(g, 533, 547, 177, 2 * p, C.green, 'Fast pair   ·   ω = 1');
    dial(g, 1379, 547, 177, 0.5 * p, C.gold, 'Slow pair   ·   ω = ¼');
    foot(
      g,
      'Angle = position × angular frequency',
      'Two schematic dimension pairs   ·   ' + (2 * p).toFixed(2) + ' positions from the origin',
    );
    return;
  }
  if (b <= 2) {
    const selective = cue(k, 2, 'YaRN preserves', 0.8);
    if (selective > 0) {
      layout(g, 'ROTARY POSITIONS', 'Which frequency bands keep their local step?');
      const x = 310,
        y = 672,
        w = 1260,
        h = 280;
      [0, 0.25, 0.5, 0.75, 1].forEach((v) => {
        line(g, x, y - v * h, x + w, y - v * h, C.line, 2);
        mono(g, v.toFixed(2), x - 24, y - v * h + 10, 28, { align: 'right' });
      });
      line(g, x, y - 0.25 * h, x + w, y - 0.25 * h, C.blue, 5, [11, 8]);
      const profile = [
        [0, 0.25],
        [0.2, 0.25],
        [0.78, 1],
        [1, 1],
      ];
      alpha(g, selective, () => {
        for (let i = 1; i < profile.length; i++)
          line(
            g,
            x + w * profile[i - 1][0],
            y - h * profile[i - 1][1],
            x + w * profile[i][0],
            y - h * profile[i][1],
            C.green,
            8,
          );
      });
      mono(g, 'Slow bands', x, y + 52);
      mono(g, 'Fast bands', x + w, y + 52, 29, { align: 'right' });
      mono(g, 'Fraction of original angular step', x, 319, 32);
      foot(
        g,
        'YaRN blends the bands and separately rescales attention logits.',
        'Solid   schematic selective scaling     ·     Dashed   uniform interpolation',
      );
      return;
    }
    layout(g, 'POSITION INTERPOLATION', 'Where does extended position 12,288 land?');
    const x = 240,
      w = 1435,
      t = rope.m / rope.target;
    const show = cue(k, 2, 'Every frequency band', 0.5);
    for (const [i, len, name] of [
      [0, rope.target, 'Extended scale'],
      [1, rope.train, 'Training scale'],
    ]) {
      const y = 434 + i * 235;
      mono(g, name, x, y - 69, 33);
      line(g, x, y, x + w, y, C.ink, 4);
      for (let j = 0; j <= 4; j++) {
        const xx = x + (w * j) / 4;
        line(g, xx, y - 12, xx, y + 13, C.ink, 3);
        if (j === 0 || j === 4)
          mono(g, ((len * j) / 4).toLocaleString('en-US'), xx, y + 58, 29, { align: 'center' });
      }
      if (i === 0 || show > 0) {
        circle(g, x + w * t, y, 14, i === 0 ? C.gold : C.green);
        mono(g, (i === 0 ? rope.m : mapped).toLocaleString('en-US'), x + w * t, y - 29, 36, {
          align: 'center',
        });
      }
    }
    alpha(g, show, () => line(g, x + w * t, 455, x + w * t, 601, C.gold, 3, [9, 6]));
    foot(
      g,
      'Mapped coordinate = extended position × training length / target length',
      'Uniform interpolation   ·   4,096 trained   ·   16,384 target',
    );
    return;
  }
  layout(g, 'CACHED ROTATIONS', 'Does the cached key use the current basis?');
  const move = cue(k, 4, 'The key turns back', 1.45);
  const key = lerp(1, 0.5, move),
    query = 1,
    score = Math.cos(query - key);
  const x = 564,
    y = 551,
    r = 190;
  dial(g, x, y, r, query, C.blue, 'Query at position 2');
  const ex = x + r * Math.cos(key),
    ey = y - r * Math.sin(key);
  line(g, x, y, ex, ey, C.gold, 4);
  circle(g, ex, ey, 7, C.ochre);
  const result = cue(k, 4, 'Compare cached and uncached', 0.3) > 0;
  mono(g, 'Unit query and key', 938, 348, 35, { weight: 600 });
  rows(
    g,
    938,
    458,
    [
      ['Query angle', query.toFixed(2) + ' rad'],
      ['Key angle', key.toFixed(2) + ' rad'],
      ['Dot product', result || move === 0 ? score.toFixed(3) : 'cos(Δ angle)'],
    ],
    784,
    98,
  );
  foot(
    g,
    result
      ? 'Recomputing the key changes the score on the very same tokens.'
      : 'Hold the query fixed while inspecting the stored key.',
    'Query frequency ½   ·   cached key initially used 1   ·   intended key frequency ½',
  );
}
const releaseCounts = [
    [90, 90, 90],
    [100, 70, 100],
  ],
  floor = 85,
  cases = 100;
function release(g, k) {
  const b = k.beat.beatIndex;
  layout(g, 'RELEASE TEST', 'Can the same average conceal a failed depth?');
  const reveal = cue(k, 1, 'Unfold the average', 1.4);
  const judge = cue(k, 2, 'Its seventy correct', 0.4) > 0;
  const x = 612,
    y = 698,
    h = 310,
    step = 349;
  const names = ['Head', 'Middle', 'Tail'];
  const overall = releaseCounts.map((cs) => sum(cs) / cs.length);
  if (b === 0) {
    paper(g, 117, 318, 1690, 452);
    mono(g, 'Paired test case', 159, 388, 32, { color: C.green });
    const items = [
      ['Source', 'D1 / v3'],
      ['Length', '24 units'],
      ['Depth', '50% of filler'],
      ['Expected', 'Incident lead'],
    ];
    items.forEach(([a, v], i) => {
      const xx = 156 + i * 409;
      mono(g, a, xx, 494, 29, { color: C.mute });
      serif(g, v, xx, 584, 50, { max: 381 });
    });
    line(g, 156, 641, 1740, 641, C.line);
    txt(
      g,
      'Save the generated answer and scorer result for this same case in each run.',
      157,
      719,
      37,
    );
    foot(g, 'Repeat across lengths, depths, distractors, absent facts and linked facts.');
    return;
  }
  mono(g, 'Overall', 112, 373, 33, { color: C.mute });
  for (let i = 0; i < 2; i++) {
    const yy = 459 + i * 158;
    mono(g, i ? 'Candidate' : 'Baseline', 111, yy, 31);
    serif(g, overall[i] + '%', 111, yy + 85, 76, { color: i ? C.gold : C.green });
  }
  line(g, x - 40, y, x + 1024, y, C.ink, 3);
  const fy = y - (h * floor) / 100;
  line(g, x - 40, fy, x + 1024, fy, C.red, 3, [12, 9]);
  mono(g, '85% floor', x + 1035, fy + 12, 28, { color: C.red, max: 195 });
  for (let i = 0; i < 3; i++) {
    const xx = x + i * step;
    for (let j = 0; j < 2; j++)
      alpha(g, reveal, () => {
        const v = releaseCounts[j][i],
          ht = (h * v) / 100,
          xx2 = xx + j * 117;
        box(g, xx2, y - ht, 100, ht, j ? C.ochre : C.mint, C.ink);
        mono(g, v, xx2 + 50, y - ht - 19, 31, { align: 'center' });
      });
    mono(g, names[i], xx + 112, y + 56, 33, { align: 'center' });
  }
  mono(g, 'Baseline', x, 307, 30, { color: C.green });
  mono(g, 'Candidate', x + 283, 307, 30, { color: C.gold });
  if (judge) stamp(g, 'HOLD CANDIDATE', 109, 750, 415, C.red);
  foot(
    g,
    judge
      ? 'Middle depth falls below the declared floor.'
      : 'Would the candidate pass a floor at every depth?',
    'Synthetic results   ·   ' + cases + ' paired cases at each depth   ·   85% required per depth',
  );
}
export const longScenes = { pairs, cache, layers, serving, devices, position, release };
export function checkLong() {
  const cells = (band) =>
    Array.from({ length: n }, (_, q) =>
      Array.from({ length: n }, (_, kk) => Number(visible(q, kk, band))).reduce((a, b) => a + b),
    ).reduce((a, b) => a + b);
  assert.equal(cells(n), fullPairs(n));
  assert.equal(cells(w), localPairs(n, w));
  assert.equal(cells(w), 34);
  assert.ok(visible(last, early, n));
  assert.ok(!visible(last, early, w));
  assert.ok(Math.abs(fullPairs(64000) / fullPairs(8000) - 64) < 0.01);
  assert.equal(gib(full), 40);
  assert.equal(gib(full) * 4, 160);
  assert.deepEqual(
    cacheRows.map(({ name, heads }) => [name, heads, queryHeads / heads, gib({ ...full, heads })]),
    [
      ['MHA', 64, 1, 320],
      ['GQA', 8, 8, 40],
      ['MQA', 1, 64, 5],
    ],
  );
  assert.deepEqual(layerGroups.map(gib), [0.3125, 2]);
  assert.equal(sum(layerGroups.map(gib)), 2.3125);
  assert.deepEqual(
    [2, 1].map((bytes) => Math.floor(cacheBudget / gib({ ...full, bytes }))),
    [1, 3],
  );
  assert.deepEqual(
    [work(false), work(true)],
    [
      [48800, 49200, 48600],
      [48800, 1200, 600],
    ],
  );
  assert.equal(sum(work(false)) - sum(work(true)), 96000);
  assert.equal(blocks, 17);
  assert.equal(blocks * grid, 1088);
  assert.equal(Math.ceil(parallel.history / parallel.physical) * parallel.physical, 1040);
  assert.equal(mapped, 3072);
  assert.equal(Math.cos(1 - 0.5).toFixed(3), '0.878');
  assert.deepEqual(
    releaseCounts.map((cs) => sum(cs) / cs.length),
    [90, 90],
  );
  assert.deepEqual(
    releaseCounts.map((cs) => cs.every((c) => c >= floor)),
    [true, false],
  );
}

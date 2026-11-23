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
  footer,
  metric,
  bno,
  cue,
  on,
} from './drawing.mjs';
import { promptLength, steps, sum, bill, fmt, KIB, MIB, GIB } from './mechanics.mjs';

export function opening(g, c) {
  const n = bno(c);
  const entered = on(c, 3, 'Its key and value join');
  const feed = cue(c, 3, 'Feed it back in', 0.85);
  const sweep = cue(c, 3, 'Its query sweeps', 2.4);
  const visited = Math.floor(sweep * (promptLength + 1));
  heading(
    g,
    'Decode  /  one KV head',
    n === 1 ? 'Has the sampled token reached the cache?' : 'Which positions need a fresh pair?',
  );
  for (let i = 2; i >= 0; i--)
    box(g, 90 + 8 * i, 279 + 8 * i, 988, 146, i ? P.empty : P.surface, P.line);
  box(g, 103, 289, 8, 126, P.k);
  cap(g, 'SUBSCRIPTION AGREEMENT', 137, 312);
  txt(g, '“The subscription renews in March.”', 137, 374, 49, { f: 'Serif' });
  chip(g, 1338, 286, 420, 90, 'March', P.goldPale, { size: 53 });
  cap(g, entered ? 'Processed answer token' : 'Sampled answer token', 1548, 412, {
    align: 'center',
  });
  line(g, 1550, 433, 1550, 542, P.line, 3);
  if (feed > 0 && !entered) {
    const y = 432 + 102 * feed;
    box(g, 1537, y - 7, 13, 14, P.k);
    box(g, 1550, y - 7, 13, 14, P.v);
  }
  cap(g, '512 prompt positions', 87, 494);
  box(g, 665, 481, 28, 12, P.k);
  cap(g, 'Key', 708, 491);
  box(g, 838, 481, 28, 12, P.v);
  cap(g, 'Value', 882, 491);
  const x = 89,
    y = 548,
    dx = 34,
    dy = 14;
  box(g, x - 10, y - 10, 1103, 239, '#c5cbbb', P.rail, 3);
  for (let i = 0; i < promptLength; i++) {
    const tx = x + (i % 32) * dx,
      ty = y + Math.floor(i / 32) * dy;
    box(g, tx, ty, 29, 5, P.k);
    box(g, tx, ty + 5, 29, 5, P.v);
    if (i < visited) box(g, tx, ty + 10, 29, 3, P.bright);
    if (i + 1 === visited) box(g, tx - 3, ty - 3, 35, 16, null, P.gold, 4);
  }
  slot(g, 1438, 548, 226, 138, entered ? 'March' : null, entered, entered);
  mono(g, 'position 512', 1550, 737, 31, { align: 'center' });
  if (sweep > 0) {
    mono(g, 'Q read ' + visited + ' / 513 positions', 90, 808, 28, { col: P.gold });
    if (visited > promptLength) line(g, 1438, 694, 1664, 694, P.gold, 6);
  }
  if (n < 3)
    footer(
      g,
      'The prompt is already in the cache.',
      n === 2 ? 'The sampled word waits for the next forward pass.' : '',
    );
  else
    footer(
      g,
      entered ? '1 newly projected position' : 'March enters the model.',
      sweep === 1
        ? 'The query scores keys and mixes values across all 513 valid positions.'
        : 'One head is shown. Each attention layer maintains its own state.',
    );
}

export function projection(g, c) {
  const n = bno(c);
  const cached = on(c, 5, 'With a cache'),
    mark = on(c, 4, 'first column');
  const count =
    n < 3
      ? 1
      : n > 3
        ? 6
        : 1 +
          ['two, three', 'three, four', 'four, five', 'five, six', 'six. How'].filter((s) =>
            on(c, 3, s),
          ).length;
  heading(g, 'Full causal attention', 'How often do we project the same position?');
  const x = 270,
    y = 365,
    dx = 149,
    dy = 68;
  const words = ['The', 'contract', 'renews', 'in', 'March', '.'];
  words.forEach((w, i) => txt(g, w, x + (i + 0.47) * dx, y - 39, 33, { align: 'center' }));
  for (let r = 0; r < 6; r++) {
    mono(g, 'Pass ' + (r + 1), 93, y + r * dy + 25, 30);
    for (let j = 0; j <= r; j++) {
      if (r >= count) {
        box(g, x + j * dx, y + r * dy, 132, 52, null, P.line);
        continue;
      }
      if (cached && j < r) {
        box(g, x + j * dx, y + r * dy, 132, 52, P.empty);
        if (r === 5)
          line(g, x + j * dx + 10, y + r * dy + 37, x + j * dx + 122, y + r * dy + 37, P.gold, 5);
      } else slot(g, x + j * dx, y + r * dy, 132, 52, 'K   V', true, mark && !cached && j === 0);
    }
  }
  metric(g, 'POSITIONS PROJECTED', cached ? '6' : n < 4 ? '?' : String(sum(steps)), 1250, 414, 520);
  cap(g, cached ? 'One new pair per pass' : 'Fresh computation', 1250, 574);
  if (cached) {
    metric(g, 'POSITIONS READ ON PASS 6', '6', 1250, 661, 500, P.gold);
  }
  footer(
    g,
    cached
      ? 'Earlier pairs stay stored. The query still reads them.'
      : mark
        ? 'The first column repeats the same pair.'
        : 'Each row shows a pass through the model.',
    cached
      ? 'The final query uses six keys to weight six values.'
      : 'Each position can attend to itself and the prefix to its left.',
  );
}

function mask(g, x, y) {
  for (let r = 0; r < 4; r++)
    for (let j = 0; j < 4; j++) box(g, x + j * 53, y + r * 41, 46, 34, j <= r ? P.k : P.empty);
  cap(g, 'Query rows × key columns', x, y + 200);
}
export function phases(g, c) {
  const n = bno(c),
    sample = on(c, 1, 'sample March'),
    march = on(c, 2, 'Its key and value join'),
    period = on(c, 2, 'samples a period');
  const prefilled = on(c, 1, 'That fills the cache');
  heading(g, 'Generation phases', 'When does a sampled token enter the cache?');
  cap(g, 'PREFILL  /  four illustrative prompt tokens', 88, 325);
  const tokens = ['March', 'renewal.', 'Which', 'month?', 'March', '.'];
  tokens.forEach((t, i) => {
    const x = 88 + i * 200,
      available = i < 4 || (i === 4 && sample) || (i === 5 && period);
    if (available) chip(g, x, 390, 178, 82, t, i < 4 ? P.surface : P.goldPale);
    const stored = i < 4 ? prefilled : i === 4 && march;
    slot(g, x, 552, 178, 97, stored ? 'K   V' : null, stored);
  });
  cap(g, 'Cache entries', 90, 708);
  if (n <= 2) mask(g, 1440, 389);
  else {
    cap(g, 'Typical limiting resource', 1415, 374);
    txt(g, 'Prompt math', 1415, 461, 46, { f: 'Serif' });
    txt(g, 'Decode traffic', 1415, 591, 46, { f: 'Serif' });
    cap(g, 'Weights + growing KV', 1415, 664);
  }
  if (n === 4) {
    footer(
      g,
      'Time to first token   =   queue + prefill + delivery overhead',
      'Inter-token latency measures the gaps between subsequent outputs. Scheduling can affect both.',
    );
  } else
    footer(
      g,
      n === 1
        ? 'Known prompt positions run together under a causal mask.'
        : period
          ? 'The period is visible. Its cache entry is still empty.'
          : 'Decode processes the previous choice to produce the next.',
      n === 3
        ? 'Large prefills favor parallel computation. Decode often stresses memory bandwidth.'
        : 'A colored pair marks one processed position at this head.',
    );
}

export function sizing(g, c) {
  const n = bno(c),
    large = n >= 6,
    layers = large ? 80 : 32,
    bytes = bill(layers);
  const numeric = large
    ? on(c, 7, 'three hundred twenty')
    : on(c, 3, 'one hundred thirty one thousand');
  const conv = large ? on(c, 7, 'one and a quarter') : on(c, 5, 'five hundred twelve');
  const batch = large ? on(c, 7, 'one hundred sixty') : on(c, 5, 'eighty of those');
  heading(
    g,
    'KV payload  /  FP16',
    large ? 'How much does the 80-layer model store?' : 'What does one cached position weigh?',
  );
  cap(g, large ? 'LLAMA 3 70B  /  64 query heads' : 'LLAMA 3 8B  /  32 query heads', 88, 314);
  const x = 92,
    y = 397;
  for (let j = 0; j < 8; j++) {
    const sx = x + j * 62;
    box(g, sx, y, 51, 111, P.k);
    box(g, sx, y + 129, 51, 111, P.v);
    for (let k = 1; k < 8; k++) {
      line(g, sx + 3, y + 13 * k, sx + 47, y + 13 * k, '#71a59c', 1);
      line(g, sx + 3, y + 129 + 13 * k, sx + 47, y + 129 + 13 * k, '#ad98c1', 1);
    }
  }
  txt(g, 'K', 605, y + 55, 46, { col: P.k });
  txt(g, 'V', 605, y + 184, 46, { col: P.v });
  cap(g, '8 KV heads in one layer', 91, 706);
  const factors = [
    ['2', 'K and V'],
    [layers, 'layers'],
    [8, 'KV heads'],
    [128, 'width'],
    [2, 'B / value'],
  ];
  for (let i = 0; i < 5; i++) {
    let sx = 746 + i * 211;
    mono(g, factors[i][0], sx + 64, 419, 63, { align: 'center' });
    cap(g, factors[i][1], sx + 64, 490, { align: 'center' });
    if (i < 4) mono(g, '×', sx + 167, 417, 37, { col: P.muted });
  }
  if (numeric) {
    metric(g, 'RAW PAYLOAD PER POSITION', fmt(bytes / KIB) + ' KiB', 757, 588, 900, P.k);
    if (!large) cap(g, fmt(bytes) + ' bytes   ·   1 KiB = 1,024 B', 757, 753);
  } else txt(g, '=  ?  bytes per position', 757, 652, 53, { f: 'Serif' });
  if (batch)
    footer(
      g,
      large
        ? '128 × 1.25 GiB = ' + fmt((bytes * 4096 * 128) / GIB) + ' GiB'
        : '40 GiB ÷ 0.5 GiB = 80 requests at most',
      '4,096 processed positions per request. Allow separate room for weights, buffers and metadata.',
    );
  else if (conv)
    footer(
      g,
      '4,096 positions × ' + fmt(bytes / KIB) + ' KiB = ' + fmt((bytes * 4096) / MIB) + ' MiB',
      'Raw per-request payload. Real serving capacity depends on the usable cache budget.',
    );
  else
    footer(
      g,
      large
        ? 'Try the multiplication with 80 layers.'
        : 'One key and one value at every KV head in every layer.',
      'Each vector holds 128 numbers. FP16 uses two bytes per number.',
    );
}

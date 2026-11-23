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
  block,
  bno,
  on,
} from './drawing.mjs';
import { bill, KIB, GIB, fmt, C_TABLE, address, occupancy } from './mechanics.mjs';
import { occupancyRows } from './ownership.mjs';

function headArray(g, heads, bytes) {
  const x = 95,
    dx = 20;
  cap(g, '64 query heads', x, 327);
  for (let i = 0; i < 64; i++) {
    box(g, x + i * dx, 382, 15, 44, P.goldPale, P.gold, 1);
  }
  const group = 64 / heads;
  for (let h = 0; h < heads; h++) {
    const cx = x + (h * group + group / 2) * dx - 2;
    for (let j = 0; j < group; j++)
      line(g, x + (h * group + j) * dx + 7, 426, cx, 530, '#98a69d', 1);
    box(g, cx - 7, 535, 14, 32 * bytes, P.k);
    box(g, cx - 7, 535 + 32 * bytes + 7, 14, 32 * bytes, P.v);
  }
  cap(
    g,
    heads + ' KV ' + (heads === 1 ? 'head' : 'heads') + '   ·   ' + bytes * 8 + '-bit cache values',
    x,
    728,
  );
  metric(g, 'PER POSITION', fmt(bill(80, heads, bytes) / KIB) + ' KiB', 1450, 478, 378, P.k);
}
export function shrink(g, c) {
  const n = bno(c);
  if (n <= 2) {
    heading(g, 'Payload limit  /  independent histories', 'Where is the unused space?');
    const x = 93,
      y = 416;
    ['A', 'B', 'C', 'D'].forEach((r, i) => {
      cap(g, 'Request ' + r, x + i * 443, y - 40);
      for (let j = 0; j < 16; j++)
        slot(g, x + i * 443 + (j % 4) * 90, y + Math.floor(j / 4) * 70, 83, 59, '', true);
    });
    footer(
      g,
      '16 of 16 slots hold live K/V in each allocation.',
      n === 2 ? 'When every position is needed, packing alone recovers no payload bytes.' : '',
    );
  } else if (n <= 8) {
    const h =
      n === 4 && !on(c, 4, 'Grouped query attention')
        ? 64
        : (n === 5 && on(c, 5, 'single key value head')) || n === 6
          ? 1
          : 8;
    const bytes = on(c, 8, 'eight bit cache values') ? 1 : 2;
    heading(g, '70B shape  /  80 layers, width 128', 'Which factor changes the cache bill?');
    headArray(g, h, bytes);
    footer(
      g,
      '2 × 80 layers × ' +
        h +
        ' KV ' +
        (h === 1 ? 'head' : 'heads') +
        ' × 128 × ' +
        bytes +
        ' B  =  ' +
        fmt(bill(80, h, bytes) / KIB) +
        ' KiB / position',
      n >= 7
        ? 'Cache precision has its own kernel and accuracy requirements.'
        : n === 6
          ? 'Changing the head layout requires compatible model weights and quality checks.'
          : 'Query heads do the scoring. KV heads own the stored vectors.',
    );
  } else if (n === 9) {
    const drop = on(c, 9, 'evicting the tokens');
    heading(g, 'Approximate retention', 'What can a later query lose?');
    cap(g, 'Illustrative retained positions', 91, 356);
    for (let i = 0; i < 10; i++)
      slot(g, 92 + i * 173, 439, 158, 105, drop && i === 3 ? '' : i, !(drop && i === 3), i === 9);
    if (drop) {
      arrow(g, 1710, 682, 695, 682);
      line(g, 695, 682, 695, 558, P.gold, 4);
      cap(g, 'A later query needs position 3', 1000, 752);
    }
    footer(
      g,
      drop
        ? 'Position 3 has been evicted. Its value is unavailable.'
        : 'A full-attention query can use every earlier valid position.',
      'Dropping selected history reduces retained bytes and can change the answer.',
    );
  } else if (n === 10) {
    const positions = 131072;
    heading(g, 'Long context  /  Llama 3.1 70B shape', 'What does one 128K context occupy?');
    cap(g, 'Raw FP16 payload, 320 KiB per processed position', 90, 353);
    for (let i = 0; i < 32; i++) {
      const xx = 90 + (i % 16) * 104,
        yy = 450 + Math.floor(i / 16) * 108;
      box(g, xx, yy, 94, 85, P.kPale, P.rail);
      for (let k = 0; k < 8; k++)
        line(g, xx + 8 + k * 10, yy + 12, xx + 8 + k * 10, yy + 73, P.k, 3);
    }
    footer(
      g,
      '32 groups × 4,096 positions × 320 KiB = ' + fmt((bill(80) * positions) / GIB) + ' GiB',
      'The context limit permits a sequence length. Available GPU memory decides whether the state fits.',
    );
  } else if (n <= 12) {
    heading(g, 'Tensor parallelism  /  even head sharding', 'What fraction lives on each GPU?');
    ['Rank 0', 'Rank 1'].forEach((rank, i) => {
      const x = 95 + i * 885;
      cap(g, rank + '   ·   logical block 1, physical block 2', x, 346);
      for (let h = 0; h < 4; h++)
        chip(g, x + h * 203, 447, 182, 153, 'Head ' + (h + 4 * i), i ? P.vPale : P.kPale, {
          size: 34,
        });
      mono(g, '4 of 8 KV heads', x, 679, 40);
    });
    footer(
      g,
      'A 131,072-position request occupies 20 GiB per rank in this layout.',
      'Evenly split KV tensors only. Replication and unequal headroom change the per-rank admission limit.',
    );
  } else {
    heading(g, 'Allocation and attention math', 'Where does each optimization act?');
    block(g, 95, 439, 630, 7, ['0', '1', '2', '3']);
    block(g, 95, 655, 630, 2, ['4', '5']);
    arrow(g, 760, 551, 1000, 551);
    cap(g, 'On-chip attention tiles', 1091, 369);
    for (let i = 0; i < 4; i++)
      chip(g, 1092 + (i % 2) * 251, 431 + Math.floor(i / 2) * 131, 228, 96, 'Tile ' + i, P.vPale);
    footer(
      g,
      'PagedAttention supplies the addresses. FlashAttention tiles the computation.',
      'Tiling reduces memory traffic for attention. The two techniques can coexist in a serving stack.',
    );
  }
}

export function growing(g, c) {
  const short = 6;
  const long = short * 2;
  const shortReady = on(c, 1, 'Try a six-position history');
  const projected = on(c, 1, 'One new position needs projections');
  const predict = bno(c) === 1 &&
    c.reveal('What changes if the history doubles', 0, { captionStart: false });
  let doubled = false;
  let sweep = 0;
  if (bno(c) === 2) {
    const phrase = 'Six reads become twelve';
    const { start, end } = c.wordCue(phrase);
    doubled = c.reveal(phrase, end - start, { captionStart: phrase }) === 1;
    sweep = doubled ? Math.min(1, (c.elapsed - end) / 0.95) : 0;
  }
  heading(g, 'Full causal attention  /  one decode step', 'If history doubles, what changes?');
  cap(g, 'Key', 88, 310, { col: P.k });
  cap(g, 'Value', 174, 310, { col: P.v });
  cap(g, 'Older positions on the left', 448, 310);
  txt(g, 'Same query token: March', 1824, 310, 46, { col: P.gold, align: 'right', weight: 600 });

  const cell = 108;
  const pitch = 116;
  const origin = 438;
  const current = origin + (long - 1) * pitch + cell / 2;
  const row = (count, y, addedReadCoverage = 0) => {
    for (let i = long - count; i < long; i++) {
      const x = origin + i * pitch;
      const isCurrent = i === long - 1;
      slot(g, x, y, cell, 88, isCurrent ? 'March' : '−' + (long - 1 - i), true, isCurrent);
      if (i < long - short && i >= long - short - addedReadCoverage * short)
        box(g, x, y + 83, cell, 5, P.gold);
    }
  };

  if (shortReady) {
    txt(g, short + ' positions', 86, 423, 46, { f: 'Serif' });
    row(short, 384);
    arrow(g, current, 506, origin + (long - short) * pitch + cell / 2, 506, P.gold, 5);
    cap(g, short + ' logical reads', 1824, 549, { col: P.gold, align: 'right' });
  }
  if (!shortReady)
    slot(g, current - cell / 2, 384, cell, 88, 'March', true, true);
  if (projected)
    cap(g, 'K/V for 1 new position', 88, 468, { col: P.k });
  if (predict)
    txt(g, 'Which work grows?', 1820, 687, 50, { f: 'Serif', align: 'right' });
  if (doubled) {
    txt(g, long + ' positions', 86, 655, 46, { f: 'Serif' });
    cap(g, 'K/V for 1 new position', 88, 700, { col: P.k });
    row(long, 616, sweep);
    const left = origin + (long - short - sweep * short) * pitch + cell / 2;
    arrow(g, current, 738, left, 738, P.gold, 5);
    cap(g, long + ' logical reads', 1824, 780, { col: P.gold, align: 'right' });
    line(g, 85, 824, 1835, 824, P.line, 2);
    txt(g, 'Logical coverage only. Traffic and latency depend on execution.', 86, 866, 36, {
      col: P.muted,
      max: 1740,
    });
  }
}

export function practice(g, c) {
  const n = bno(c);
  if (n <= 3) {
    const moved = n === 3,
      entries = moved
        ? [
            ['B', 32],
            ['C', 70],
          ]
        : [
            ['A', 100],
            ['B', 32],
          ];
    heading(
      g,
      'Capacity exercise  /  32-slot blocks',
      moved
        ? 'How many blocks after A leaves and C joins?'
        : 'How many physical blocks do A and B occupy?',
    );
    const answer = on(c, 2, 'A needs four') && !moved;
    if (n === 1 || moved) {
      entries.forEach(([v, t]) => {
        if (moved && v === 'B') {
          occupancyRows(g, occupancy([['B', 32]], 32), 32, { stableLanes: true, showTotal: false });
          return;
        }
        if (moved && v === 'C' && !on(c, 3, 'C joins')) return;
        const y = 385 + Number(v === 'B') * 163,
          x = 404;
        txt(g, 'Request ' + v, 90, y + 36, 49, { f: 'Serif' });
        for (let j = 0; j < t; j++)
          box(
            g,
            x + (j % 50) * 17,
            y + Math.floor(j / 50) * 35,
            13,
            27,
            v === 'B' ? P.v : v === 'C' ? P.gold : P.k,
          );
        mono(g, t + ' positions', 1324, y + 31, 38);
      });
    } else
      occupancyRows(g, occupancy(entries, 32), 32, {
        results: answer,
        totals: on(c, 2, "That's five"),
      });
    footer(
      g,
      answer
        ? 'A leaves 28 empty slots in its fourth block. B fills one block exactly.'
        : 'A physical block holds 32 positions from one request.',
      'Divide each request’s length by 32 and round up before adding.',
    );
  } else if (n <= 5) {
    const a = address(40, C_TABLE, 32),
      solved = on(c, 5, 'Entry one points');
    heading(g, 'Address exercise  /  C owns 70 positions', 'Where does C store position 40?');
    cap(g, 'Request C’s block table', 91, 344);
    C_TABLE.forEach((id, i) => {
      const x = 91 + i * 570;
      cap(g, 'Logical block ' + i, x, 427);
      chip(
        g,
        x,
        468,
        494,
        96,
        'Physical ' + id,
        solved && i === a.logical ? P.goldPale : P.surface,
      );
      for (let j = 0; j < 32; j++) {
        const valid = i * 32 + j < 70,
          active = solved && i === a.logical && j === a.slot;
        box(
          g,
          x + (j % 16) * 30,
          610 + Math.floor(j / 16) * 40,
          25,
          32,
          active ? P.bright : valid ? P.gold : P.empty,
          active ? P.ink : P.line,
          active ? 4 : 1,
        );
      }
    });
    footer(
      g,
      solved
        ? '40 ÷ 32 = 1 remainder 8. Block 11, slot 8.'
        : 'B uses 1 block. C uses 3. The live total is 4.',
      'Slots start at zero. Within each block the upper row holds slots 0 through 15.',
    );
  } else {
    const answer = on(c, 7, 'switch the cache');
    const full = on(c, 6, 'C now fills'),
      cTokens = full ? 96 : 70;
    const sizeMiB = ((32 + cTokens) * bill(80, 8, answer ? 1 : 2)) / 1024 ** 2;
    heading(g, 'Payload exercise  /  70B shape', 'What can halve the raw payload?');
    occupancyRows(
      g,
      occupancy(
        [
          ['B', 32],
          ['C', cTokens],
        ],
        32,
      ),
      32,
      { stableLanes: true },
    );
    cap(g, answer ? 'FP8 payload' : 'FP16 payload', 92, 757);
    bar(g, 530, 735, 730, 40, sizeMiB / 40, answer ? P.v : P.k);
    mono(g, fmt(sizeMiB) + ' MiB', 1311, 759, 40);
    footer(
      g,
      answer
        ? 'FP8 KV: 160 KiB / position. FP16 KV: 320 KiB / position.'
        : full
          ? 'Every one of the 128 positions holds live state.'
          : 'B holds 32 positions. C has 70, with room to grow.',
      '80 layers, 8 KV heads, width 128. Compare raw payload, then check kernel support and task quality.',
    );
  }
}

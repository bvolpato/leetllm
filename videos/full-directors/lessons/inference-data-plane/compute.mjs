import {
  C,
  title,
  label,
  mono,
  line,
  box,
  chassis,
  socket,
  foot,
  bar,
  cue,
  index,
  ledger,
  arrow,
} from './workbench.mjs';
import {
  KiB,
  MiB,
  GiB,
  partials,
  collective,
  toy,
  rowsPerBand,
  budget,
  base,
  perToken,
  sharedMs,
  fractions,
  demand,
  sustainable,
} from './examples.mjs';

function values(ctx, x, y, nums, color, w = 105, h = 82) {
  nums.forEach((v, i) => {
    box(ctx, x + i * (w + 8), y, w, h, color, C.ink, 3);
    mono(ctx, v, x + i * (w + 8) + w / 2, y + h * 0.68, 38, C.ink, 'center');
  });
}
export function ranks(ctx, c) {
  title(ctx, c, 'TENSOR PARALLELISM   /   TWO RANKS');
  const i = index(c);
  if (i === 0) {
    const cache = cue(c, 0, 'network carries', 1.1);
    for (const [col, name] of ['Prefill group  P7', 'Decode group  D3'].entries()) {
      const x = 112 + col * 1030;
      chassis(ctx, x, 267, 650, 506, name);
      for (let r = 0; r < 2; r++) {
        label(ctx, 'Rank ' + r, x + 50, 421 + r * 197, 35, C.bright);
        socket(ctx, x + 242, 368 + r * 197, 350, 76, col ? cache : 1, r ? C.blue : C.copper);
      }
      arrow(ctx, x + 121, 456, x + 121, 552, C.soft);
      arrow(ctx, x + 153, 552, x + 153, 456, C.soft);
      label(ctx, 'collective', x + 215, 517, 26, C.soft);
    }
    for (let r = 0; r < 2; r++) {
      arrow(ctx, 792, 405 + r * 197, 1113, 405 + r * 197, r ? C.teal : C.rust);
    }
    mono(ctx, 'KV shards', 953, 516, 30, C.ink, 'center');
    foot(
      ctx,
      'One control-plane owner reserves the destination. The data plane carries the state.',
    );
  } else if (i <= 2) {
    const mode = cue(c, 2, 'Gather those')
      ? 'gather sums'
      : cue(c, 2, 'Reduce-scatter gives')
        ? 'scatter'
        : cue(c, 2, 'All-gather on')
          ? 'raw gather'
          : 'sum';
    const result = cue(c, 2, 'Eleven and');
    label(
      ctx,
      mode === 'gather sums' ? 'Reduced chunks' : 'Partial activations',
      111,
      305,
      49,
      C.ink,
      'Serif',
    );
    label(
      ctx,
      result
        ? {
            'sum': 'Sum all-reduce',
            'raw gather': 'All-gather on inputs',
            'scatter': 'Reduce-scatter',
            'gather sums': 'Gather the reduced chunks',
          }[mode]
        : 'Sum all-reduce',
      947,
      305,
      48,
      C.ink,
      'Serif',
    );
    for (let r = 0; r < 2; r++) {
      const y = 404 + r * 194,
        col = r ? C.blue : C.copper;
      mono(ctx, 'Rank ' + r, 113, y + 55, 34);
      values(ctx, 370, y, mode === 'gather sums' ? collective('scatter')[r] : partials[r], col);
      arrow(ctx, 688, y + 40, 886, y + 40, C.dim);
      mono(ctx, 'Rank ' + r, 946, y + 55, 34);
      if (result) values(ctx, 1174, y, collective(mode)[r], C.green);
      else {
        box(ctx, 1174, y, 215, 82, null, C.line, 3);
        mono(ctx, '?', 1280, y + 55, 35, C.dim, 'center');
      }
    }
    foot(
      ctx,
      mode === 'raw gather'
        ? 'Concatenate the original rank contributions in order.'
        : mode === 'scatter'
          ? 'Each rank holds its assigned sum.'
          : mode === 'gather sums'
            ? 'Gather [11] and [22] in rank order.'
            : 'Align index 0 with index 0, and index 1 with index 1.',
    );
  } else if (i === 3) {
    const swapped = cue(c, 3, 'swap the two'),
      fixed = cue(c, 3, 'Restore the matching'),
      skips = cue(c, 3, 'skips a collective');
    label(ctx, 'Issue slot 1', 700, 297, 40, C.ink, 'Serif', 500, 'center');
    label(ctx, 'Issue slot 2', 1260, 297, 40, C.ink, 'Serif', '500', 'center');
    for (let r = 0; r < 2; r++) {
      const y = 360 + r * 194;
      mono(ctx, 'Rank ' + r, 116, y + 81, 43);
      for (let j = 0; j < 2; j++) {
        const l = r === 1 && swapped && !fixed ? 4 - j : 3 + j,
          gap = skips && r === 1 && j === 1;
        box(ctx, 463 + j * 557, y, 469, 132, gap ? null : l === 3 ? C.copper : C.blue, C.ink, 7);
        mono(ctx, gap ? 'skipped' : 'Layer ' + l, 699 + j * 557, y + 69, 41, C.ink, 'center');
        if (!gap) mono(ctx, 'SUM   ·   2 × FP32', 699 + j * 557, y + 110, 24, C.ink, 'center');
      }
    }
    foot(
      ctx,
      skips
        ? 'Rank 0 waits for its peer. Group recovery must coordinate both ranks.'
        : swapped && !fixed
          ? 'The first slot would join different layers.'
          : 'Matching slots refer to the same layer on both ranks.',
    );
  } else {
    const names = [
      'Host call returns',
      'Group end',
      'Issue succeeds',
      'GPU dependency',
      'Consumer reads',
    ];
    const thresholds = [
      'grouped call',
      'group end',
      'issuing succeeds',
      'stream dependency',
      'read the result',
    ];
    thresholds.forEach((phrase, j) => {
      const lit = cue(c, 4, phrase);
      const x = 134 + j * 361;
      box(ctx, x, 429, 260, 141, lit ? C.well : null, lit ? C.well : C.line, 12);
      mono(ctx, String(j + 1).padStart(2, '0'), x + 128, 522, 51, lit ? C.bright : C.dim, 'center');
      label(ctx, names[j], x + 129, 641, 30, C.ink, 'Sans', 600, 'center');
      if (j < 4) arrow(ctx, x + 274, 498, x + 345, 498, C.dim);
    });
    foot(ctx, 'A consumer on another stream needs the required ordering or completion event.');
  }
}
export function smallPayload(ctx, c) {
  title(ctx, c, 'KV CACHE   /   UNPADDED TOY MODEL');
  const doubled = cue(c, 2, 'Double the positions'),
    positions = doubled ? 256 : 128;
  const counted = doubled ? cue(c, 2, 'For production') : cue(c, 1, 'of prompt history');
  for (let k = 0; k < 2; k++) {
    const x = 126 + k * 541,
      y = 334,
      w = 452,
      h = doubled ? 387 : 290;
    for (let layer = 3; layer >= 0; layer--) {
      box(ctx, x + layer * 15, y - layer * 17, w, h, C.well, C.line, 6);
    }
    label(ctx, k ? 'Values' : 'Keys', x + 24, y + 53, 36, C.bright, 'Serif');
    for (let j = 0; j < 16; j++) {
      const xx = x + 25 + Math.floor(j / 8) * 14 + j * 24;
      const color = k ? C.blue : C.copper;
      for (let r = 0; r < positions / rowsPerBand; r++) {
        box(ctx, xx, y + 82 + r * (doubled ? 32 : 38), 19, doubled ? 24 : 30, color, null, 2);
      }
    }
    mono(ctx, 'head 0      head 1', x + 25, y + h - 17, 26, C.soft);
  }
  label(
    ctx,
    `One colored band = ${rowsPerBand} tensor rows = ${rowsPerBand} token positions.`,
    129,
    804,
    28,
    C.dim,
  );
  label(ctx, 'Layer stack', 1253, 313, 46, C.ink, 'Serif');
  ledger(
    ctx,
    1254,
    399,
    539,
    [
      ['Layers', '4'],
      ['Positions', positions],
      ['KV heads', '2'],
      ['Head width', '8'],
      ['Bytes / value', '2'],
    ],
    69,
  );
  if (counted) mono(ctx, toy(positions) / KiB + ' KiB', 1252, 793, 69, C.teal);
  foot(ctx, '2 tensors × 4 layers × ' + positions + ' positions × 2 heads × 8 values × 2 bytes');
}

function sizeAndReserve(ctx, c) {
  const i = index(c),
    extra = cue(c, 3, 'One extra token'),
    future = cue(c, 2, 'Reserve another') ? 128 : 0;
  const b = budget(8192 + extra, future);
  if (i === 0 || i === 1) {
    const split = cue(c, 1, 'two-way head sharding');
    chassis(ctx, 107, 259, 954, 521, 'Prompt cache   /   8,192 positions');
    for (let r = 0; r < 8; r++) {
      const x = 155 + (r % 4) * 214,
        y = 365 + Math.floor(r / 4) * 144;
      socket(ctx, x, y, 187, 68, 1, split && r >= 4 ? C.blue : C.copper, 8);
      mono(ctx, 'head ' + r, x + 92, y + 109, 25, C.bright, 'center');
    }
    label(ctx, split ? 'Two head shards' : 'Bytes per token', 1133, 315, 48, C.ink, 'Serif');
    if (!split) {
      mono(ctx, '2 × 80 × 8 × 128 × 2', 1134, 400, 31);
      mono(ctx, perToken / KiB + ' KiB', 1132, 509, 69, C.teal);
      if (cue(c, 0, 'two and a half'))
        label(
          ctx,
          (base.bytes / GiB).toFixed(2) + ' GiB per prompt',
          1133,
          658,
          48,
          C.ink,
          'Serif',
        );
    } else {
      ledger(
        ctx,
        1133,
        408,
        671,
        [
          ['Rank 0', '1.25 GiB'],
          ['Rank 1', '1.25 GiB'],
          ['Together', '2.50 GiB'],
        ],
        88,
      );
      if (cue(c, 1, 'A block holds')) mono(ctx, '512 blocks × 5 MiB', 1133, 733, 33);
    }
    foot(
      ctx,
      split
        ? 'Both ranks cover every position. Each holds four of the eight heads.'
        : '80 layers  ·  8 KV heads  ·  width 128  ·  BF16',
    );
    return;
  }
  label(ctx, 'Allocator boundary', 110, 272, 43, C.ink, 'Serif');
  mono(
    ctx,
    'Prompt  ' + b.positions.toLocaleString('en-US') + '     +     output budget  ' + future,
    110,
    334,
    33,
    C.dim,
  );
  const blockCount = 3;
  for (let j = 0; j < blockCount; j++) {
    const bid = [513, 520, 521][j],
      x = 117 + j * 560;
    const active = bid <= b.blocks;
    label(ctx, 'Block ' + bid, x, 453, 35, active ? C.ink : C.dim);
    for (let k = 0; k < 16; k++) {
      const pos = (bid - 1) * 16 + k;
      const filled = pos < b.positions,
        held = pos < b.positions + b.future;
      box(
        ctx,
        x + (k % 8) * 57,
        479 + Math.floor(k / 8) * 62,
        49,
        51,
        !active ? null : filled ? C.copper : held ? C.gray : C.paper,
        active ? C.ink : C.line,
        3,
      );
    }
  }
  label(ctx, 'Copper holds prompt KV. Shaded cells reserve output positions.', 114, 695, 29, C.dim);
  mono(
    ctx,
    b.blocks + ' blocks    /    ' + (b.capacity / MiB).toLocaleString('en-US') + ' MiB reserved',
    110,
    790,
    48,
    C.ink,
  );
  foot(
    ctx,
    extra
      ? 'Prompt KV: 2,560 MiB + 320 KiB. Fifteen reserved positions are slack.'
      : 'Prompt KV: 2,560 MiB. Future positions carry no prompt bytes.',
  );
}

function bandwidth(ctx, c) {
  const t = cue(c, 4, 'Freeze the assumed', 1.2),
    twin = cue(c, 4, 'On two independent links', 1.0);
  const finish = cue(c, 4, 'entire transfer takes', 1.3);
  const half = sharedMs / 2;
  label(ctx, 'Two shards, 1.25 GiB each', 111, 272, 40, C.ink, 'Serif');
  for (let row = 0; row < 2; row++) {
    const y = 345 + row * 222,
      independent = row === 1;
    const ms = independent ? half * twin : half * (t + finish);
    const fr = fractions(ms, independent);
    mono(ctx, independent ? 'Independent' : 'Shared', 110, y + 40, 36);
    mono(ctx, independent ? '2 × 25 GB/s' : '1 × 25 GB/s', 110, y + 94, 29, C.dim);
    for (let r = 0; r < 2; r++) {
      const yy = y + r * 67;
      socket(ctx, 649, yy, 723, 48, fr[r], r ? C.blue : C.copper, 16);
      line(ctx, 1011, yy - 3, 1011, yy + 51, C.ink, 3);
    }
    if (!independent || twin) mono(ctx, ms.toFixed(1) + ' ms', 1440, y + 75, 50, C.ink);
    else mono(ctx, 'ready to replay', 1410, y + 71, 29, C.dim);
  }
  foot(
    ctx,
    'Ideal payload serialization at the assumed effective rates. Each notch marks half a shard.',
  );
}
export function bigPayload(ctx, c) {
  title(ctx, c, 'REQ-8K-017   /   MODEL-WIDE BUDGET');
  const i = index(c);
  if (i < 4) return sizeAndReserve(ctx, c);
  if (i === 4) return bandwidth(ctx, c);
  if (i === 5) {
    const known = cue(c, 5, 'requires about'),
      cap = cue(c, 5, 'can carry only');
    label(ctx, 'Shared transfer path', 110, 317, 52, C.ink, 'Serif');
    const width = 1070;
    for (const [j, name, v, col] of [
      [0, 'Offered load', demand, C.rust],
      [1, 'Path capacity', 25, C.teal],
    ]) {
      const y = 408 + j * 165;
      label(ctx, name, 112, y + 45, 35, C.dim);
      bar(ctx, 514, y, width, 58, ((j === 0 ? known : 1) * v) / 120, col);
      if (j === 1 || known)
        mono(ctx, v.toFixed(j === 0 ? 1 : 0) + ' GB/s', 1775, y + 47, 36, C.ink, 'right');
    }
    if (cap)
      mono(
        ctx,
        '40 arriving  /  ' + sustainable.toFixed(2) + ' transferable per second',
        111,
        782,
        40,
      );
    foot(ctx, 'Demand = 40 requests/s × 2.50 GiB/request. Both bars use decimal GB/s.');
  } else {
    const n = cue(c, 6, 'Three fit') ? Math.floor((8 * GiB) / base.capacity) : 0,
      wait = cue(c, 6, 'fourth waits'),
      cap = base.capacity / MiB,
      pool = 8192;
    label(ctx, 'Decode KV pool', 114, 321, 51, C.ink, 'Serif');
    mono(
      ctx,
      'Pool capacity ' + pool.toLocaleString('en-US') + ' MiB',
      1803,
      317,
      34,
      C.dim,
      'right',
    );
    const w = 1660;
    box(ctx, 130, 392, w, 137, C.gray, C.ink, 6);
    for (let j = 0; j < n; j++) {
      const x = 131 + (j * w * cap) / pool;
      box(ctx, x, 394, (w * cap) / pool - 5, 133, C.well, null, 5);
      mono(ctx, '2,600 MiB', x + (w * cap) / pool / 2, 481, 37, C.bright, 'center');
    }
    mono(
      ctx,
      (pool - n * cap).toLocaleString('en-US') + ' MiB free',
      1790,
      589,
      37,
      C.ink,
      'right',
    );
    if (wait) {
      box(ctx, 131, 649, (w * cap) / pool, 104, null, C.rust, 6, 3);
      mono(ctx, 'Request 4   /   2,600 MiB', 154, 717, 30, C.rust);
      label(ctx, 'Waiting for credit', 774, 719, 42, C.ink, 'Serif');
    }
    foot(
      ctx,
      i === 7
        ? '128 future positions per request. Growth beyond that cap requires more credit.'
        : 'Each grant charges the prompt and its future output against the same pool.',
    );
  }
}

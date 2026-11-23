import { C, mix, series } from './bench.mjs';
import { tokenValues, extendedValues } from '../../../films/cuda-execution/fixtures.mjs';
import {
  threadMap,
  warpMap,
  memoryRequests,
  addressReceipt,
  sharedTrace,
  reduction,
  sum,
} from '../../../films/cuda-execution/arithmetic.mjs';

export function mapping(v) {
  const { b, cue, wafer, text, box, readout } = v;
  const extra = cue(2, 'two more tokens'),
    vals = extra ? extendedValues : tokenValues,
    blocks = threadMap(vals.length);
  const split = cue(0, 'row separates', 1.3),
    owner = cue(1, 'you reach position six');
  blocks.forEach((threads, g) => {
    const x = 50 + g * 291;
    if (split > 0) {
      text('Block ' + g, x, 161, 22, C.dim);
      box(x - 4, 198, 273, 116, C.deep, 7);
    } else if (g === 0) text('Eight token positions', 50, 161, 22, C.dim);
    threads.forEach((t, i) => {
      const xx = mix(50 + t.index * 66, x + 5 + i * 66, split);
      const chosen = t.index === 6;
      wafer(xx, 216, 56, 51, t.valid ? 'T' + t.index : '×', t.valid ? (chosen ? C.gold : C.paper) : null, 19);
      if (owner || (!chosen && split === 1)) text('t' + i, xx + 28, 291, 16, C.dim, 'center', 'Mono');
    });
  });
  readout(
    extra
      ? 'i < 10    ·    skip global reads at 10 and 11'
      : owner
        ? 'Block 1 × 4 + thread 2 = token 6'
        : 'Which local thread reads token 6?',
    extra
      ? 'Guard the read. The whole block may still need to meet at a barrier.'
      : 'Each complete block runs on one streaming multiprocessor.',
  );
}
export function warps(v) {
  const { b, cue, box, text, readout } = v;
  const long = b >= 1,
    rows = warpMap(long ? [36] : [4, 4]);
  const splitPath = cue(2, 'Watch the odd lanes', 0.9) > 0;
  const second = long ? cue(1, 'remaining four') : cue(0, 'It starts a new warp');
  text('Lane', 55, 136, 18, C.dim);
  [0, 4, 8, 16, 24, 31].forEach((i) => text(i, 179 + i * 23, 136, 16, C.dim, 'center', 'Mono'));
  rows.forEach((w, r) => {
    const y = 188 + r * 109;
    const identified = r === 0 || second > 0;
    text(identified ? 'Block ' + w.block : '···', 51, y + 9, 19, C.mint);
    if (identified) text('Warp ' + w.warp, 51, y + 38, 17, C.dim);
    w.lanes.forEach((id, i) => {
      const active = id !== null && (r === 0 || second > 0);
      const masked = splitPath && i % 2 === 1;
      box(169 + i * 23, y, 19, 55, active && !masked ? (r ? C.gold : C.mint) : C.edge, 3);
      if (active) text(id, 178.5 + i * 23, y + 28, 14, masked ? C.dim : C.ink, 'center', 'Mono', 18);
    });
  });
  readout(
    long
      ? splitPath
        ? 'Only the even lanes take this example branch'
        : '36 threads in one block occupy two warps'
      : second
        ? 'Each block starts its own warp'
        : 'Where will the next block put its first thread?',
    long
      ? 'Thread 31 ends warp 0. Thread 32 starts warp 1.'
      : 'A warp has 32 lane positions. Each row belongs to one block.',
  );
}

export function wiring(v, receipt, global, progress = 1, laneValues) {
  const { text, wafer, trace, dot, box } = v;
  const dest = global ? receipt.segments : [...new Set(receipt.rows.map((r) => r.bank))];
  const xs = (i) => 96 + i * 107;
  const target = (i) => (dest.length === 1 ? 470 : xs(i));
  const title = global ? 'Warp load   /   byte addresses' : 'Shared tile   /   word addresses';
  text(laneValues ? title + '     (lane · value above each address)' : title, 53, 123, 21, C.dim);
  receipt.rows.forEach((r, i) => {
    const x = xs(i),
      y = 188,
      n = global ? r.segment : r.bank,
      to = target(dest.indexOf(n));
    text('L' + i + (laneValues ? ' · ' + laneValues[i] : ''), x, 157, 15, C.dim, 'center', 'Mono');
    wafer(x - 40, y, 80, 40, global ? r.address : r.word, i === 1 ? C.gold : C.paper, 21);
    trace(x, y + 44, to, 298, i === 1 ? C.gold : '#5b9987', progress);
  });
  dest.forEach((n, i) => {
    if (laneValues && progress < 1) return;
    const x = target(i);
    box(x - 48, 300, 96, 55, progress === 1 ? C.mint : C.deep, 4);
    text(global ? 'seg ' + n : 'bank ' + n, x, 326, 18, progress === 1 ? C.ink : C.dim, 'center', 'Mono', 90);
    dot(x, 301, 3, C.ink);
  });
  return receipt;
}
export function coalescing(v) {
  const { b, cue, said, readout } = v;
  const strided = b >= 2 && !(b === 4 && cue(4, 'Restore adjacent') > 0);
  const route =
    b === 0
      ? cue(0, 'Follow the addresses')
      : b === 2
        ? cue(2, 'Spread the same', 1.4)
        : b === 4
          ? cue(4, 'Restore adjacent', 1.1)
          : 1;
  const r = wiring(v, memoryRequests(strided ? 32 : 1), true, route);
  const footprintReady = route >= 1 && (b < 2 ? said(0) : b === 4 || cue(3, 'Caches affect', 0));
  readout(
    b === 1
      ? 'Keep the same values. Change the stride to 32 words.'
      : footprintReady
        ? r.requested + ' useful bytes   /   ' + r.footprint + ' B of aligned segments'
        : 'Trace one four-byte load per active lane',
    b === 3
      ? 'Caches determine how much of this footprint reaches device memory.'
      : b === 4
        ? 'Load rows into a tile, then read the column in shared memory.'
        : 'Compute capability 6.0+   ·   32-byte aligned base',
  );
}
export function banks(v) {
  const { b, cue, readout } = v;
  const broadcast = b === 2 && cue(2, 'Trace eight requests') > 0,
    padded = b > 0 && cue(1, 'Add one padding') > 0;
  const route =
    b === 0
      ? cue(0, 'Send these different', 1.3)
      : b === 1
        ? cue(1, 'Move each request', 1.2)
        : cue(2, 'Trace eight requests', 1);
  const r = wiring(v, memoryRequests(padded ? 33 : 32, broadcast), false, route);
  if (route === 1) {
    const distinct = r.maxDistinctWords;
    v.text('Service rounds', 50, 383, 16, C.dim);
    for (let i = 0; i < distinct; i++) v.box(213 + i * 34, 373, 27, 18, C.gold, 2);
    v.text(distinct === 1 ? '1 round' : distinct + ' rounds', 231 + 34 * distinct, 383, 17, C.gold);
  }
  readout(
    route < 1
      ? 'Follow each distinct word to its bank'
      : broadcast
        ? 'Eight lanes read word 0   ·   one broadcast'
        : r.maxDistinctWords === 1
          ? 'Padding spreads the eight words across eight banks'
          : 'Bank 0 serves eight different words in turn',
    '32 banks, four-byte words   ·   bank = word index mod 32   ·   word 0 starts at bank 0',
  );
}
export function storage(v) {
  const { b, cue, wafer, row, text, trace, box, readout } = v;
  if (b <= 3) {
    text('Device global memory', 55, 119, 18, C.dim);
    row(
      tokenValues,
      56,
      149,
      850,
      49,
      tokenValues.map((_, i) => (b >= 2 && i === 7 ? C.gold : C.paper)),
    );
    const n = b === 3 ? 8 : 4,
      t = cue(0, 'Load the first four', 1.2);
    for (let i = 0; i < n; i++) {
      const x = 106 + i * 107;
      trace(x, 203, x, 272, b >= 2 && i === 7 ? C.gold : C.edge, t);
      wafer(x - 39, 276, 78, 40, t * n >= i + 1 ? tokenValues[i] : '·', t * n >= i + 1 ? C.mint : null, 19);
    }
    text('Block’s shared tile', 60, 346, 18, C.dim);
    if (b < 2) {
      wafer(645, 282, 184, 43, 'sum in register', C.gold, 16);
      text('Private to one thread', 645, 346, 18, C.dim);
    }
    readout(
      [
        'A block stages a tile. A thread keeps its partial sum.',
        'Caches are managed by hardware. The kernel loads the tile.',
        'Global word 7  →  byte 28  →  segment 0',
        'Shared word 7  →  7 mod 32  →  bank 7',
      ][b],
    );
  } else if (b <= 5) {
    const n = Math.round(7 * cue(5, 'Slide the window', 1.3)),
      r = addressReceipt(series(32).map((i) => i + n));
    text('One warp   /   32 consecutive words', 55, 140, 23);
    for (let seg = 0; seg < 5; seg++) {
      const x = 55 + seg * 173;
      text('Segment ' + seg, x, 192, 18, C.dim);
      for (let j = 0; j < 8; j++) {
        const w = 8 * seg + j;
        box(x + j * 20, 222, 18, 82, w >= n && w < n + 32 ? C.mint : C.edge, 2);
      }
      text('byte ' + seg * 32, x, 337, 17, C.dim, 'left', 'Mono');
    }
    readout(
      b === 4
        ? 'Move the first byte from 0 to 28. How many segments?'
        : r.segments.length + ' segments × 32 B = ' + r.footprint + ' B',
      r.requested +
        ' useful bytes   ·   first address ' +
        r.rows[0].address +
        '   ·   last address ' +
        r.rows.at(-1).address,
    );
  } else {
    const r = addressReceipt(series(32).map((i) => 34 * i)),
      t = cue(6, 'Send the lanes', 2),
      count = Math.floor(t * 32);
    text('32 lanes   ·   stride 34 words   ·   bank = (34 × lane) mod 32', 55, 128, 22);
    series(32).forEach((i) => {
      const x = 55 + 53 * (i % 16),
        y = 192 + 91 * Math.floor(i / 16);
      const hits = r.rows.slice(0, count).filter((q) => q.bank === i);
      box(x, y, 46, 52, hits.length ? C.mint : C.edge, 3);
      text(i, x + 23, y - 14, 14, C.dim, 'center', 'Mono');
      hits.forEach((h, j) => text('L' + h.lane, x + 23, y + 14 + j * 23, 14, C.ink, 'center', 'Mono'));
    });
    readout(
      b === 7 ? '16 even banks × 2 distinct words   ·   two-way conflict' : 'Track the second visit to bank 0',
      'Lane 0 reads word 0. Lane 16 reads word 544.',
    );
  }
}
export function barrier(v) {
  const { b, cue, wafer, text, box, line, dot, readout } = v,
    r = reduction(tokenValues);
  if (b <= 2) {
    const replay = cue(1, 'Replay those same writes') > 0;
    const undefinedSum = cue(1, "Thread zero's reads", 0);
    const raceExplained = cue(1, 'One run could give', 0);
    const t = replay
      ? 2 * cue(1, 'Each thread writes', 1.8) + 0.2 * cue(2, 'let the reader through', 0.7)
      : 0.58 * cue(0, 'Let thread zero read', 1);
    const s = sharedTrace(t, replay);
    text(
      replay ? 'Replay with a block barrier' : 'First run   /   thread zero reads early',
      54,
      133,
      22,
      C.dim,
    );
    tokenValues.slice(0, 4).forEach((value, i) => {
      const x = 98 + i * 208;
      wafer(x, 174, 129, 46, 'T' + i + '   ' + value, C.paper, 19);
      line(x + 64, 224, x + 64, 288, C.edge);
      dot(x + 64, s.slots[i] == null ? 242 : 277, 5, s.slots[i] == null ? C.gold : C.mint);
      wafer(x, 292, 129, 46, s.slots[i] ?? '···', s.slots[i] != null ? C.mint : null);
    });
    if (s.attempted) {
      line(77, 361, 862, 361, s.ready ? C.mint : C.red, 3);
      text(
        s.ready ? 'Read sum  ' + s.result : raceExplained ? 'Read attempted   /   data race' : 'Read attempted',
        470,
        383,
        19,
        s.ready ? C.mint : C.red,
        'center',
      );
    }
    readout(
      replay
        ? s.arrivals + ' of 4 threads at barrier'
        : s.attempted
          ? 'Some writes are still pending'
          : 'The four shared writes arrive at different times',
      replay
        ? 'All four writes must be visible before thread zero reads.'
        : undefinedSum
          ? 'An early read has no defined sum.'
          : 'Compare the probe with the four shared writes.',
    );
  } else {
    r.blocks.forEach((blk, i) => {
      const x = 73 + i * 432;
      v.row(
        blk.threads.map((t) => t.value),
        x,
        158,
        356,
        51,
      );
      const show = i === 0 || cue(3, 'second block produces') > 0;
      if (show) wafer(x + 102, 264, 151, 53, 'Σ ' + blk.subtotal, C.mint, 23);
      v.trace(x + 179, 212, x + 179, 259, C.edge, 1);
    });
    readout(
      cue(3, 'divides by eight') === 1
        ? 'Second kernel   (' + r.blocks.map((x) => x.subtotal).join(' + ') + ') / 8 = ' + r.mean
        : 'Block subtotals are independent',
      'A later kernel on the same stream can read both completed outputs.',
    );
  }
}

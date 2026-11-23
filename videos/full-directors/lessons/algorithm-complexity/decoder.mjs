import { C, count, cue, cueAfter, fmt } from './press.mjs';
import { CACHE_SHAPE } from '../../../films/algorithm-complexity/fixtures.mjs';
import { decodeCostTrace } from '../../../films/algorithm-complexity/arithmetic.mjs';
import { cacheValueBytes } from '../../../films/algorithm-complexity/model.mjs';

export const decode = decodeCostTrace();
const { layers, kvHeads, queryHeads, width, bytes, streams } = CACHE_SHAPE;
export const bytesPerToken = 2 * layers * kvHeads * width * bytes;
export const causalCells = (n) => (n * (n + 1)) / 2;
export function continuationCost(history, inputs) {
  const old = inputs * history;
  const added = causalCells(inputs);
  return { old, added, total: old + added };
}
export function attention(p, t) {
  const b = t.beat.beatIndex + 1;
  if (b <= 3) {
    const side = 4 + count(4, cue(t, 2, 'new rows and columns arrive', 1.9));
    const visible =
      b === 1 ? Math.max(1, count(16, cue(t, 1, 'Watch four positions', 1.6))) : side ** 2;
    const mask = b === 3 ? count(side, cue(t, 3, 'itself and earlier keys', 1.5)) : 0;
    let allowed = 0;
    p.title('One query row for each prompt position');
    p.label('Key position', 165, 175);
    for (let c = 0; c < side; c++) p.mono(c + 1, 180 + c * 62, 217, 22, p.mid, { align: 'center' });
    for (let r = 0; r < side; r++) {
      p.mono('q' + (r + 1), 93, 268 + r * 48, 23, p.mid);
      for (let c = 0; c < side; c++) {
        const has = r * side + c < visible,
          masked = r < mask && c > r;
        if (has && !masked) allowed++;
        p.rect(
          154 + c * 62,
          246 + r * 48,
          53,
          40,
          has && !masked ? (r < 4 && c < 4 ? C.pale : C.mint) : null,
          p.grid,
          1,
        );
        if (masked) p.line(158 + c * 62, 282 + r * 48, 202 + c * 62, 250 + r * 48, p.grid, 1);
      }
    }
    p.label(mask ? 'Unmasked scores shown' : 'Score positions shown', 855, 229);
    p.value(allowed, 'query–key pairs', 852, 340);
    p.mono(mask ? 'Causal attention' : side + ' queries × ' + side + ' keys', 857, 488, 33, p.fg);
    p.foot(
      b === 3
        ? 'Each permitted score needs a dot product. A fused kernel can avoid storing the grid.'
        : 'Dense prefill grows a square of potential scores.',
    );
    return;
  }
  if (b === 9 || b === 10) {
    const history = decode.initialKeys + count(8, cue(t, 10, 'Doubling the starting history', 1.5));
    const inputs = decode.consumedInputs + count(1, cue(t, 10, 'Extending the continuation', 1.0));
    const ledger = continuationCost(history, inputs);
    p.title('Change the history, then the continuation');
    p.label('T = ' + history + ' starting keys', 107, 198);
    for (let i = 0; i < inputs; i++) {
      const y = 256 + i * 76;
      p.mono(i + 1, 57, y + 25, 27, p.mid);
      for (let j = 0; j < history + i + 1; j++)
        p.rect(107 + j * 52, y, 46, 52, j < history ? C.pale : C.mint);
    }
    p.label('G = ' + inputs + ' consumed inputs', 107, 604);
    p.mono(
      ledger.old + ' old + ' + ledger.added + ' appended = ' + ledger.total + ' key reads',
      596,
      604,
      25,
      p.fg,
    );
    p.foot('[G × T + G(G + 1)/2] × head width  =  query–key coordinate products per head', '', { raised: true });
    return;
  }
  if (b === 11 && cue(t, 11, 'If you return that output and stop', 0.5) === 1) {
    p.title('Stop after the first sampled output');
    p.label('Finished prompt', 65, 218);
    for (let i = 0; i < decode.initialKeys; i++)
      p.tag(i + 1, 65 + i * 89, 262, 76, 64, C.pale, C.ink, 27);
    p.arrow(791, 294, 877, 294, p.good);
    p.tag('Output sampled', 897, 250, 383, 91, C.mint, C.ink, 34);
    p.label('New decode rows', 65, 465);
    p.value(0, 'inputs fed back', 64, 551);
    p.mono('G = 0     →     0 additional key reads', 536, 554, 29, p.fg);
    p.foot('Prefill supplied the logits for that output.');
    return;
  }
  const cached = decode.initialKeys;
  const started = [
    cue(t, 4, 'appends its key and value', 0.45) === 1,
    cue(t, 6, 'Consume a second input', 0.55) === 1,
    cueAfter(t, 7, 'Append the third input'),
  ].filter(Boolean).length;
  const showOld = cueAfter(t, 7, "That's twenty-four reads");
  const showNew = cueAfter(t, 7, 'One new key, then two, then three contribute another six');
  const showTotal = cueAfter(t, 8, 'Together the rows cost thirty key reads');
  const blueSweep = Math.max(Number(showOld), cue(t, 7, 'Look down the blue columns', 1.7));
  const greenRows = [
    cueAfter(t, 7, 'One new key', { captionStart: false }),
    cueAfter(t, 7, 'then two', { captionStart: false }),
    cueAfter(t, 7, 'then three', { captionStart: false }),
  ].filter(Boolean).length;
  const thirdRow = decode.rows[2];
  const rowCounts = [
    count(decode.rows[0].keysRead, cue(t, 4, 'Follow its query', 1.8)),
    count(decode.rows[1].keysRead, cue(t, 6, 'Its query reads', 1.55)),
    count(cached, blueSweep) + (greenRows >= thirdRow.step ? thirdRow.keysRead - cached : 0),
  ];
  const splitReads = b === 7 || b === 8;
  const total = rowCounts.reduce((a, n) => a + n, 0);
  const oldReads = rowCounts.reduce((a, n) => a + Math.min(cached, n), 0);
  const newReads = total - oldReads;
  const gridX = 224;
  const rowY = 326;
  const columnStep = 96;
  const rowStep = 84;
  const cellWidth = 82;
  const cellHeight = 51;
  const appendedX = gridX + cached * columnStep;
  p.title(
    splitReads ? 'Count the starting keys and the appended keys' : 'One new query reads the cache',
  );
  p.label('Eight keys already cached', gridX, 179);
  p.label('Appended', appendedX, 179);
  for (let j = 0; j < cached + started; j++) {
    const x = gridX + j * columnStep;
    p.tag(j + 1, x, 218, cellWidth, 60, j < cached ? C.pale : C.mint, C.ink, 28);
  }
  for (let i = 0; i < started; i++) {
    const y = rowY + i * rowStep;
    p.mono('q' + (cached + i + 1), 72, y + 25, 32, p.fg);
    for (let j = 0; j < decode.rows[i].keysRead; j++)
      p.rect(
        gridX + j * columnStep,
        y,
        cellWidth,
        cellHeight,
        j < rowCounts[i] ? (j < cached ? C.pale : C.mint) : null,
        p.grid,
        1,
      );
    if (splitReads && i < greenRows) {
      const appendedReads = decode.rows[i].keysRead - cached;
      const end = appendedX + (appendedReads - 1) * columnStep + cellWidth;
      p.mono(appendedReads, end + 17, y + cellHeight / 2, 26, C.mint);
    }
  }
  if (splitReads && blueSweep === 1) {
    p.rect(
      gridX - 6,
      rowY - 9,
      (cached - 1) * columnStep + cellWidth + 12,
      (started - 1) * rowStep + cellHeight + 18,
      null,
      C.pale,
      2,
    );
  }
  if (splitReads) {
    for (const [x, label, reads, color, visible] of [
      [gridX, 'Starting-key reads', oldReads, C.pale, showOld],
      [610, 'Appended-key reads', newReads, C.mint, showNew],
      [1002, 'Total key reads', total, p.fg, showTotal],
    ]) {
      p.mono(label, x, 585, 23, p.mid);
      p.mono(visible ? reads : '·', x, 628, 43, visible ? color : p.mid);
    }
    if (showNew) p.mono('+', 432, 628, 31, p.mid);
    if (showTotal) p.mono('=', 817, 628, 31, p.mid);
  } else {
    const readsY = b === 11 ? 604 : 628;
    p.label('Key reads', 66, readsY);
    p.mono(total, gridX, readsY - 1, 44, p.fg);
    p.mono(oldReads + ' old  +  ' + newReads + ' appended', 467, readsY, 29, p.fg);
  }
  const foot =
    b === 6 && rowCounts[1] === decode.rows[1].keysRead
      ? 'How many keys can the third input read?'
      : 'Each filled cell pays for a dot product across the head width.';
  p.foot(
    b === 11
      ? 'The first sampled output already has logits from prefill. A new row starts when an input is consumed.'
      : foot,
    '',
    { raised: b === 11 },
  );
}

export function cache(p, t) {
  const b = t.beat.beatIndex + 1;
  if (b === 1) {
    p.title('Look inside one stored key');
    p.label('One layer   /   one KV head   /   one token', 66, 183);
    p.shape(
      [
        [67, 259],
        [92, 234],
        [796, 234],
        [796, 531],
        [770, 553],
        [67, 553],
      ],
      C.iron,
      C.brass,
      3,
    );
    for (let i = 0; i < width; i++) {
      const x = 100 + (i % 16) * 41,
        y = 264 + Math.floor(i / 16) * 32;
      p.rect(x, y, 32, 22, C.pale);
      p.line(x + 16, y, x + 16, y + 22, C.iron, 2);
    }
    p.mono('16 columns × 8 rows', 70, 608, 26, p.fg);
    p.label('One key', 899, 246);
    const known = cue(t, 1, 'Each coordinate uses two bytes', 1.1) === 1;
    p.value(
      known ? fmt(width * bytes) : width,
      known ? 'bytes per head per layer' : 'coordinates',
      896,
      345,
    );
    p.mono(known ? '128 × 2 bytes' : '128 coordinates', 898, 494, 26, p.mid);
    p.foot('Each blue tile is one coordinate. Its two halves are bytes.');
    return;
  }
  if (b <= 3) {
    const heads = 1 + count(kvHeads - 1, cue(t, 2, 'eight key-value heads', 1.15, {
      captionStart: 'Stack eight key-value heads',
    }));
    const layerCount = 1 + count(layers - 1, cue(t, 2, 'thirty-two layers', 1.25));
    const planes = 1 + count(1, cue(t, 2, 'room for the values', 0.65, {
      captionStart: 'Now make room for the values',
    }));
    p.title('Build the cache for one token');
    p.label('Each tile stores one head at one layer', 63, 178);
    for (let side = 0; side < planes; side++) {
      const x = 73 + side * 390;
      p.mono(side ? 'Values' : 'Keys', x, 210, 29, p.fg);
      for (let r = 0; r < layerCount; r++)
        for (let h = 0; h < heads; h++)
          p.rect(x + h * 38, 242 + r * 11.5, 32, 8, side ? C.mint : C.pale);
    }
    p.mono(layerCount + ' layers × ' + heads + ' KV heads', 74, 625, 24, p.mid);
    p.label('Bytes in the tiles shown', 895, 211);
    const amount = planes * heads * layerCount * width * bytes;
    p.value(fmt(amount), 'raw bytes', 892, 310);
    p.mono(width + ' coordinates × ' + bytes + ' bytes', 894, 438, 24, p.mid);
    if (b === 3) {
      p.label('One group of query heads', 890, 510);
      for (let q = 0; q < queryHeads / kvHeads; q++) {
        const x = 895 + q * 69;
        p.disc(x + 21, 580, 22, C.orange);
        p.mono(q + 1, x + 21, 580, 19, C.ink, { align: 'center' });
        p.line(x + 21, 605, 1020, 624, p.grid, 2);
      }
      p.mono('one KV head', 1117, 614, 23, p.good);
    }
    p.foot(
      b === 3
        ? '32 query heads share 8 KV heads in groups of four. Each query still scores its own row.'
        : 'K and V each need storage at every layer and KV head.',
      amount === bytesPerToken ? '128 KiB / token' : '',
      { raised: true },
    );
    return;
  }
  const factor = 1 + count(3, cue(t, 5, 'Each bar stretches fourfold', 1.5)),
    length = 1024 * factor;
  const size = cacheValueBytes(length) / 1024 ** 3;
  p.title('Stretch the context across sixteen streams');
  p.label('Raw K and V by stream', 66, 177);
  p.label('Dense prefill score area', 823, 177);
  for (let i = 0; i < streams; i++) {
    const y = 221 + i * 20;
    p.rect(67, y, 150 * factor, 14, C.mint);
    p.line(217, y, 217, y + 14, C.dark, 1);
  }
  p.mono(fmt(length) + ' tokens / stream', 67, 588, 28, p.fg);
  const edge = 74;
  for (let i = 0; i < factor; i++)
    for (let j = 0; j < factor; j++)
      p.rect(849 + j * edge, 220 + i * edge, edge - 4, edge - 4, C.pale);
  p.mono('Relative area   ' + factor ** 2 + '×', 848, 588, 27, p.fg);
  p.foot(
    b === 6
      ? 'Budget separately for weights, workspace, metadata and unused block space.'
      : 'Storage grows with length. The dense prefill square grows with length squared.',
    size + ' GiB raw KV',
    { raised: true },
  );
}

export const scheduler = { arrivals: [0, 40], target: 8, timer: 10, busyUntil: 30 };
export const arrivalsBy = (ms) => scheduler.arrivals.filter((arrival) => arrival <= ms).length;
export const executionStart = Math.max(scheduler.timer, scheduler.busyUntil);
const pipeline = [
  ['R1 preprocess', 0, 8, C.mint],
  ['R1 queue', 8, 25, C.orange],
  ['R1 execute', 25, 50, C.pale],
  ['R2 preprocess', 25, 40, C.mint],
];
export function queue(p, t) {
  const b = t.beat.beatIndex + 1;
  if (b === 4) {
    p.title('Where did a slow request spend its time?');
    p.label('Example trace of a slow request', 65, 192);
    const y = 344,
      x = 65;
    [
      [176, 'prepare', C.mint],
      [117, 'wait', C.orange],
      [238, 'pause', C.rose],
      [224, 'run', C.pale],
    ].reduce((left, [w, s, color]) => {
      p.tag(s, left, y, w - 3, 86, color, C.ink, 27);
      return left + w;
    }, x);
    p.mono('Instrument the pause', 65, 496, 27, p.mid);
    p.label('Unreachable cycle', 925, 199);
    const show = cue(t, 4, 'two unreachable objects', 0.75, {
      captionStart: 'Here two unreachable objects',
    });
    p.disc(972, 381, 53, C.light, p.grid);
    p.disc(1264, 381, 53, C.light, p.grid);
    p.mono('A', 972, 381, 44, C.ink, { align: 'center' });
    p.mono('B', 1264, 381, 44, C.ink, { align: 'center' });
    if (show > 0) {
      p.arrow(1033, 360, 1202, 360, p.hot, 4);
      p.arrow(1202, 404, 1033, 404, p.good, 4);
    }
    p.text('Each keeps a reference.', 925, 512, 30, p.fg);
    p.foot(
      'In CPython, reference counting continues when automatic cyclic collection is disabled.',
      '',
      { raised: true },
    );
    return;
  }
  const X = (ms) => 270 + ms * 21.5;
  const two = b === 3;
  p.title(two ? 'Separate the clocks for a second trace' : 'When can the first request start?');
  p.label('Illustrative trace   /   milliseconds', 64, 182);
  for (let ms = 0; ms <= 50; ms += 10) {
    const x = X(ms);
    p.line(x, 246, x, 615, p.grid, 1);
    p.mono(ms, x, 218, 23, p.mid, { align: 'center' });
  }
  if (two) {
    const show = cue(t, 3, 'one worker prepares', 2);
    pipeline.forEach(([name, start, end, color], i) => {
      const y = 274 + i * 84;
      p.text(name, 64, y + 25, 26, p.fg);
      const hi = i === 3 ? start + (end - start) * show : end;
      p.rect(X(start), y, (hi - start) * 21.5, 50, color);
    });
    p.foot('R2 preparation overlaps R1 execution. Measure scheduling and transfer costs too.');
  } else {
    const first = cue(t, 1, 'request one arrives at zero', 0);
    const second = cue(t, 1, 'forty milliseconds later', 0);
    const timed = cue(t, 1, 'Replay the same arrivals', 0);
    const release = cue(t, 2, 'ten milliseconds after', 0);
    const busy = cue(t, 2, 'executor is already busy', 1.3, {
      captionStart: 'If the executor is already busy',
    });
    const finish = cue(t, 2, 'another twenty milliseconds', 0.85);
    p.mono('Arrivals', 64, 288, 25, p.fg);
    scheduler.arrivals.forEach((ms, i) => {
      if (!(i === 0 ? first : second)) return;
      p.disc(X(ms), 286, 15, p.hot);
      p.mono('R' + (i + 1), X(ms) + 28, 286, 24, p.hot);
    });
    ['Form batch', 'Queue', 'Executor'].forEach((s, i) => p.text(s, 64, 379 + i * 92, 26, p.fg));
    if (b === 1) {
      scheduler.arrivals.forEach((ms, i) => {
        if (!(i === 0 ? first : second && !timed)) return;
        p.disc(X(ms), 377, 13, C.green);
        p.mono(
          timed ? 'R1' : arrivalsBy(ms) + ' of ' + scheduler.target,
          X(ms) + 25,
          377,
          24,
          p.good,
        );
      });
    } else {
      if (release) {
        p.rect(X(0), 352, X(scheduler.timer) - X(0), 50, C.mint);
        p.mono('R1 only', X(1), 378, 22, C.ink);
      } else {
        p.disc(X(0), 377, 13, C.green);
        p.mono('R1', X(0) + 25, 377, 24, p.good);
      }
      p.rect(X(0), 536, 21.5 * scheduler.busyUntil * busy, 50, C.iron);
      if (busy === 1) p.mono('another job', X(1), 560, 22, C.light);
      p.rect(
        X(scheduler.timer),
        444,
        (X(executionStart) - X(scheduler.timer)) * finish,
        50,
        C.orange,
      );
      if (release) p.mono('release', X(scheduler.timer) + 8, 378, 23, p.good);
      if (finish === 1) p.mono('R1 starts', X(executionStart) + 8, 558, 23, p.hot);
    }
    p.foot(
      b === 1
        ? timed
          ? 'Replay with a 10 ms timer. When can R1 leave formation?'
          : 'The worker waits for a batch of eight.'
        : finish === 1
          ? '10 ms in batch formation + 20 ms in the execution queue.'
          : release === 1
            ? 'The batch can leave formation. Is the executor free?'
            : 'Watch the timer release a partial batch.',
    );
  }
}

import {
  fmt,
  layout,
  perPosition,
  GiB,
  MiB,
  roof,
  h100,
  dense,
  ridge,
  weightRate,
  cost,
  recurrent,
  liveBytes,
  pool,
  demand,
  roundPages,
  scheduling as sched,
  workerTurns,
  handoffPositions,
  handoffKvBytes,
  linkGBps,
  kvTransferMs,
  remaining,
  pagesPerUser,
} from './model.mjs';
import { C, cue, lerp, rect, line, dot, txt, mono, bracket, panel, note } from './art.mjs';

export function rows(c, k) {
  const pending = cue(k, 1, 'at thirty-two rows') && !cue(k, 2, 'The compute ceiling');
  const n = cue(k, 1, 'at thirty-two rows')
    ? 32
    : Math.round(1 + 7 * cue(k, 1, 'Use eight rows', 1.15));
  const lower = roof(n);
  mono(c, 'One BF16 weight', 100, 271);
  panel(c, 111, 380, 203, 198);
  mono(c, 'W', 213, 464, 81, C.gold, 'center');
  mono(c, '2 bytes', 213, 535, 26, C.dim, 'center');
  const activeY = (i) => 331 + i * 13;
  line(c, 314, 475, 402, 475, C.teal, 3);
  line(c, 402, activeY(0), 402, Math.max(475, activeY(n - 1)), C.teal, 3);
  for (let i = 0; i < 32; i++) {
    const y = activeY(i),
      col = i < n ? C.teal : C.shade;
    if (i < n) line(c, 402, y, 468, y, C.teal, 2);
    rect(c, 468, y - 4, 249, 8, col);
  }
  mono(c, n + ' token ' + (n === 1 ? 'row' : 'rows'), 465, 793, 34, C.teal);
  const x = (v) => 957 + v * 21.4,
    y = (v) => 713 - v * 1.66;
  mono(c, 'Projection ceiling   /   TFLOP/s', 932, 268, 30);
  for (let v = 0; v <= 200; v += 50) {
    line(c, x(0), y(v), x(38), y(v), C.grid, 2);
    mono(c, v, x(0) - 20, y(v), 26, C.muted, 'right');
  }
  for (const v of [0, 8, 20, 32]) mono(c, v, x(v), y(0) + 41, 27, C.muted, 'center');
  line(c, x(0), y(0), x(20), y(200), C.teal, 6);
  line(c, x(20), y(200), x(38), y(200), C.teal, 6);
  mono(c, '200 TFLOP/s', x(32), y(200) - 34, 30, C.teal, 'center');
  if (pending) {
    line(c, x(n), y(0) - 12, x(n), y(0) + 9, C.rust, 5);
    mono(c, '?', x(n), y(0) - 45, 41, C.rust, 'center');
  } else dot(c, x(n), y(lower), 14, C.rust);
  mono(c, 'Weight-only intensity   /   FLOPs per byte', 950, 817, 27);
  note(
    c,
    n +
      ' × 2 FLOPs / 2 weight bytes = ' +
      n +
      ' FLOPs/byte     ·     ' +
      (pending ? 'Which roof sets the limit?' : 'upper bound ' + lower + ' TFLOP/s'),
  );
}
export function hardware(c, k) {
  const b = k.beat.beatIndex;
  if (b === 0) {
    mono(c, 'H100 SXM   /   BF16 arithmetic ceiling', 103, 278);
    const half = cue(k, 0, 'halve that peak');
    const scale = 0.72,
      w = h100.sparse * scale;
    txt(c, 'Structured sparse', 104, 404, 41);
    rect(c, 107, 452, w, 63, C.blue);
    mono(c, fmt(h100.sparse) + ' TFLOP/s', 109, 555, 32, C.blue);
    if (half) {
      txt(c, 'Dense', 105, 644, 41);
      rect(c, 107, 692, dense * scale, 63, C.teal);
      mono(c, fmt(dense) + ' TFLOP/s', 107 + dense * scale + 34, 726, 38, C.teal);
    }
    note(
      c,
      cue(k, 0, 'Dividing the dense peak')
        ? 'Dense ridge   ' +
            dense +
            ' TFLOP/s ÷ ' +
            h100.bandwidth +
            ' TB/s ≈ ' +
            ridge.toFixed(1) +
            ' FLOPs/byte'
        : 'The physical memory bandwidth is 3.35 TB/s.',
    );
    return;
  }
  const priced = cue(k, 2, 'About sixty-two'),
    stretched = cue(k, 2, 'to thirty-two thousand positions', 1.25);
  if (!cue(k, 1, 'Suppose one stream')) {
    mono(c, 'Dense BF16   /   same device', 105, 265);
    const width = 1390;
    mono(c, 'Dense compute peak', 107, 381, 34);
    rect(c, 108, 427, width, 74, C.teal);
    mono(c, dense + ' TFLOP/s', 138, 464, 39, C.light);
    mono(c, 'At 1 FLOP per byte', 107, 600, 34);
    rect(c, 108, 649, width, 72, C.shade);
    rect(c, 108, 649, (width * h100.bandwidth) / dense, 72, C.rust);
    mono(c, h100.bandwidth + ' TFLOP/s', 153, 689, 40, C.rust);
    note(
      c,
      'Arithmetic rate at the memory roof   ≈ ' +
        ((100 * h100.bandwidth) / dense).toFixed(2) +
        '% of dense peak',
    );
    return;
  }
  mono(c, 'One stream   /   budget for one second at peak bandwidth', 105, 265);
  const budget = h100.bandwidth * 1000,
    reads = Math.floor(weightRate);
  panel(c, 80, 325, 1760, 273);
  mono(c, fmt(budget) + ' GB available', 128, 378, 35, C.light);
  const scale = 1645 / budget;
  for (let i = 0; i < reads; i++)
    rect(c, 129 + i * h100.weights * scale, 444, h100.weights * scale - 3, 74, C.mint);
  mono(c, 'Each division   54 GB of weight reads', 130, 557, 27, C.dim);
  if (priced)
    txt(
      c,
      budget.toLocaleString('en-US') +
        ' / ' +
        h100.weights +
        ' ≈ ' +
        Math.round(weightRate) +
        ' tokens/s',
      110,
      669,
      57,
      C.teal,
      'Serif',
    );
  if (cue(k, 2, 'Stretch a full-attention history')) {
    const len = Math.round(lerp(4000, 32000, stretched));
    mono(c, 'KV positions read per step', 110, 767, 31);
    rect(c, 667, 745, len / 32, 42, C.blue);
    mono(c, fmt(len), 690 + len / 32, 768, 32, C.blue);
  }
  note(c, 'Weight-only ceiling   ·   one complete weight read per token at peak bandwidth');
}
export function payload(c, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    const solved = cue(k, 1, 'Four stored heads'),
      dimensions = cue(k, 1, 'Stack that arrangement');
    mono(c, 'Query heads', 100, 273);
    mono(c, 'Stored KV heads in one attention layer', 829, 273);
    for (let g = 0; g < layout.heads; g++) {
      const yy = 367 + g * 110;
      for (let j = 0; j < layout.readers / layout.heads; j++) {
        const xx = 126 + 91 * j;
        dot(c, xx, yy, 20, C.blue);
        mono(c, 'q', xx, yy, 22, C.light, 'center');
        line(c, xx, yy + 22, xx, yy + 35, C.grid, 2);
        line(c, xx, yy + 35, 705, yy + 35, C.grid, 2);
      }
      line(c, 705, yy + 35, 784, yy, C.muted, 3);
      rect(c, 791, yy - 30, 175, 61, C.teal);
      rect(c, 974, yy - 30, 175, 61, C.blue);
      mono(c, 'K' + (g + 1), 878, yy, 32, C.light, 'center');
      mono(c, 'V' + (g + 1), 1060, yy, 32, C.light, 'center');
    }
    if (solved) {
      mono(c, 'Each vector', 1257, 368, 28);
      txt(c, '256 entries', 1256, 444, 54, C.ink, 'Serif');
      mono(c, '2 bytes / entry', 1256, 508, 30);
    }
    if (dimensions) {
      for (let j = 0; j < 16; j++)
        rect(c, 1257 + j * 5, 658 - j * 5, 337, 8, j === 15 ? C.teal : '#a7b8ae');
      mono(c, '16 attention layers', 1256, 727, 30);
    }
    note(
      c,
      dimensions
        ? '2 × 4 heads × 256 entries × 2 bytes × 16 layers = ' +
            fmt(perPosition()) +
            ' B per position'
        : 'Six query heads read each stored pair.',
    );
    return;
  }
  const eight = cue(k, 2, 'Eight such sequences'),
    extra = cue(k, 2, 'other forty-eight layers');
  const count = eight ? 8 : 1;
  mono(c, '4,096 positions per sequence', 105, 280);
  for (let j = 0; j < 8; j++) {
    const x = 111 + (j % 4) * 257,
      y = 399 + Math.floor(j / 4) * 182;
    rect(c, x, y, 224, 120, j < count ? C.teal : C.shade);
    if (j < count) {
      for (let z = 1; z < 16; z++) line(c, x + z * 14, y, x + z * 14, y + 120, '#368680', 2);
      txt(c, '¼ GiB', x + 112, y + 62, 40, C.light, 'Mono', 'center');
    }
  }
  line(c, 1197, 320, 1197, 763, C.grid);
  mono(c, 'Raw growing KV', 1258, 398, 31);
  txt(c, fmt((count * 4096 * perPosition()) / GiB) + ' GiB', 1254, 495, 88, C.teal, 'Serif');
  if (extra) {
    mono(c, '48 recurrent layers', 1255, 640, 30);
    mono(c, 'separate state budget', 1255, 697, 28);
  }
  note(c, 'Add retained positions across requests and account for each layer’s layout.');
}
export function pages(c, k) {
  const b = k.beat.beatIndex;
  if (b === 3) {
    const users = cue(k, 3, 'Double the users') ? 100 : 50;
    const count = pagesPerUser(users);
    mono(c, 'Equal reservations   /   18 GB dedicated to growing KV', 104, 267, 32);
    txt(c, users + ' users', 104, 379, 63, C.ink, 'Serif');
    mono(c, 'Pool share for one user', 105, 477, 31);
    rect(c, 105, 537, 1500, 126, C.shade);
    for (let i = 0; i < count; i++) rect(c, 105 + i * 4.2, 537, 3.3, 126, C.teal);
    mono(c, count + ' whole pages × 16 positions', 105, 727, 36, C.teal);
    note(c, fmt(count * 16) + ' positions per user   ·   each full page costs 1 MiB');
    return;
  }
  if (b === 0) {
    const appended = cue(k, 0, 'then append');
    const n = 16 + appended,
      slots = 16 * roundPages(n);
    mono(c, 'Logical history', 103, 285, 33);
    for (let page = 0; page < roundPages(n); page++) {
      const x = 107 + page * 856;
      rect(c, x, 373, 801, 212, null, C.ink, 3);
      for (let j = 0; j < 16; j++)
        rect(
          c,
          x + 12 + (j % 8) * 98,
          386 + Math.floor(j / 8) * 93,
          89,
          81,
          page * 16 + j < n ? C.teal : C.shade,
        );
      mono(c, 'Physical page ' + (page ? 42 : 7), x, 637, 32, C.ink);
    }
    note(
      c,
      n + ' used   /   ' + slots + ' reserved positions     ·     ' + (slots - n) + ' unused slots',
    );
    return;
  }
  const candidate = cue(k, 1, 'Try adding') ? 16384 : 0;
  const large = cue(k, 2, 'try sixty-five thousand'),
    n = large ? 65536 : candidate,
    total = demand(n);
  const verdict = large || cue(k, 2, 'They fit');
  const x = (gb) => 140 + gb * 100,
    cap = x(pool / 1e9);
  mono(c, 'Growing KV pool   /   decimal GB', 104, 269);
  mono(c, '40 live × 4,096 positions', 138, 378, 32);
  if (n) mono(c, 'Proposed addition   ' + fmt(n) + ' positions', 138, 466, 33, C.ink);
  const y = 545;
  rect(c, x(0), y, (liveBytes / 1e9) * 100, 102, C.teal);
  if (n) rect(c, x(liveBytes / 1e9), y, ((total - liveBytes) / 1e9) * 100, 102, C.gold);
  for (let i = 1; i < 40; i++)
    line(
      c,
      x(((liveBytes / 1e9) * i) / 40),
      y + 70,
      x(((liveBytes / 1e9) * i) / 40),
      y + 102,
      '#8bb7a5',
      2,
    );
  mono(c, (liveBytes / 1e9).toFixed(2) + ' GB live', x(0) + 27, y + 47, 34, C.light);
  line(c, cap, 416, cap, 680, C.rust, 5);
  mono(c, '12 GB pool', cap, 382, 34, C.rust, 'center');
  bracket(
    c,
    x(0),
    x(total / 1e9),
    708,
    verdict
      ? (total / 1e9).toFixed(2) + ' GB reserved'
      : n
        ? 'proposed reservation'
        : 'live reservations',
    C.ink,
  );
  note(
    c,
    verdict
      ? (total <= pool ? 'Admit   ·   ' : 'Queue   ·   ') +
          fmt(n) +
          ' new positions at ' +
          fmt(perPosition()) +
          ' bytes each'
      : 'Price the newcomer together with the pages already promised.',
  );
}

const [wholePrompt] = workerTurns(1);
const chunkedPrompt = workerTurns(sched.chunks);

function afterSpoken(k, phrase, captionStart) {
  if (captionStart) k.reveal(phrase, 0, { captionStart });
  return k.elapsed + 1e-9 >= k.wordCue(phrase).end;
}

function sharedWorker(c, k) {
  const replay = k.beat.beatIndex === 1;
  const cut = replay ? k.reveal('Cut prefill into four equal chunks', 0.85) : 0;
  const insert = replay ? k.reveal('Give the chat a decode turn', 1.65) : 0;
  const spread = Math.min(1, insert / 0.6);
  const decodeOpacity = Math.max(0, (insert - 0.6) / 0.4);
  const wholeGap =
    replay && afterSpoken(k, 'Two hundred thirty-five milliseconds', 'Two hundred thirty-five');
  const chunkDuration = replay && afterSpoken(k, 'each chunk takes fifty milliseconds');
  const chunkedGap = replay && afterSpoken(k, 'to eighty-five', 'eighty-five');
  const latePrefill = replay && afterSpoken(k, 'The newcomer finishes prefill later');
  const chunked = chunkedPrompt[0];
  const chunkedFinish = chunkedPrompt.at(-1).prefillEnd;
  const x = (ms) => 136 + ms * 4.69;
  const barHeight = 68;
  const upper = 394;
  const lower = 632;

  function span(start, end, y, color, label) {
    rect(c, x(start), y, x(end) - x(start), barHeight, color);
    if (label) mono(c, label, x((start + end) / 2), y + 34, 32, C.light, 'center');
  }
  function token(time, y) {
    dot(c, x(time), y + barHeight + 11, 9, C.teal);
  }
  function prefillFinish(time, y) {
    line(c, x(time), y - 20, x(time), y, C.rust, 4);
    mono(c, 'Prefill done   ' + time + ' ms', x(time), y - 42, 30, C.rust, 'center');
  }

  rect(c, 106, 247, 33, 33, C.blue);
  mono(c, 'New prompt prefill', 158, 264, 31);
  rect(c, 629, 247, 33, 33, C.teal);
  mono(c, 'Live chat decode', 682, 264, 31);
  dot(c, 1122, 263, 9, C.teal);
  mono(c, 'Live chat token', 1146, 264, 31);
  for (let t = 0; t <= 350; t += 50) {
    line(c, x(t), 373, x(t), 486, C.grid, 2);
    if (cut > 0) line(c, x(t), 611, x(t), 724, C.grid, 2);
    line(c, x(t), 794, x(t), 807, C.grid, 2);
    mono(c, t === 350 ? t + ' ms' : t, x(t), 830, 29, C.muted, 'center');
  }
  mono(c, fmt(sched.prompt) + '-token prompt, uninterrupted', x(0), 352, 33, C.ink);
  span(0, wholePrompt.prefillEnd, upper, C.blue, wholePrompt.prefillEnd + ' ms');
  span(wholePrompt.prefillEnd, wholePrompt.decodeEnd, upper, C.teal, sched.decode + ' ms');
  token(0, upper);
  token(wholePrompt.decodeEnd, upper);
  bracket(
    c,
    x(0),
    x(wholePrompt.decodeEnd),
    494,
    wholeGap ? 'First gap   ' + wholePrompt.decodeEnd + ' ms' : 'First gap   ?',
    C.teal,
  );

  if (cut > 0) {
    mono(c, 'Same prompt in ' + sched.chunks + ' chunks', x(0), 590, 33, C.ink);
    for (const [i, turn] of chunkedPrompt.entries()) {
      const duration = turn.prefillEnd - turn.start;
      const start = lerp(i * duration, turn.start, spread);
      span(start, start + duration, lower, C.blue, chunkDuration ? duration + ' ms' : '');
      if (i < chunkedPrompt.length - 1 && spread < 1) {
        const seam = x(start + duration);
        line(c, seam - 4 * cut, lower, seam - 4 * cut, lower + barHeight, C.paper, 7 * cut);
      }
    }
    token(0, lower);
    if (decodeOpacity > 0) {
      c.save();
      c.globalAlpha = decodeOpacity;
      for (const turn of chunkedPrompt) {
        span(turn.prefillEnd, turn.decodeEnd, lower, C.teal, sched.decode + ' ms');
        token(turn.decodeEnd, lower);
      }
      c.restore();
    }
    if (insert === 1)
      bracket(
        c,
        x(0),
        x(chunked.decodeEnd),
        732,
        chunkedGap ? 'First gap   ' + chunked.decodeEnd + ' ms' : 'First gap',
        C.teal,
      );
  }
  if (latePrefill) {
    prefillFinish(wholePrompt.prefillEnd, upper);
    prefillFinish(chunkedFinish, lower);
  }
  note(
    c,
    latePrefill
      ? 'Prefill finishes ' + (chunkedFinish - wholePrompt.prefillEnd) + ' ms later with the same cache demand.'
      : insert > 0
        ? 'Decode can take a turn between prefill chunks.'
        : cut > 0
          ? 'The four chunks still add up to ' + wholePrompt.prefillEnd + ' ms of prefill.'
          : 'The next chat token waits for prefill and its own decode turn.',
  );
}

export function schedule(c, k) {
  const b = k.beat.beatIndex;
  if (b === 2) {
    const move = cue(k, 2, 'Move its growing keys', 1.55);
    const priced = afterSpoken(k, 'ten point seven milliseconds', 'ten point seven milliseconds');
    const needsRecurrent = cue(k, 2, 'this hybrid’s recurrent state');
    const moveRecurrent = cue(k, 2, 'Sending it adds bytes', 1.55);
    mono(c, 'Prefill-to-decode handoff', 103, 270);
    const left = 173,
      right = 1435;
    for (const [x, name] of [
      [left, 'Prefill'],
      [right, 'Decode'],
    ]) {
      panel(c, x, 381, 313, 296);
      txt(c, name, x + 156, 442, 49, C.light, 'Serif', 'center');
      for (let i = 0; i < 9; i++)
        rect(c, x + 39 + (i % 3) * 80, 504 + Math.floor(i / 3) * 38, 70, 22, '#48636a');
    }
    const linkY = 550;
    line(c, left + 313, linkY, right, linkY, C.muted, 6);
    function packet(label, color, progress, slotY) {
      const start = left + 156, end = right + 156;
      const x = lerp(start, end, progress);
      const nearWorker = Math.max(0, 1 - Math.min(x - start, end - x) / 190);
      const y = lerp(linkY, slotY, nearWorker);
      rect(c, x - 137, y - 30, 274, 60, color);
      txt(c, label, x, y, 35, C.light, 'Sans', 'center');
    }
    packet('Growing KV', C.teal, move, 515);
    if (needsRecurrent) packet('Recurrent state', C.blue, moveRecurrent, 608);
    mono(c, sched.link + ' Gbit/s = ' + linkGBps + ' GB/s at peak', 958, 433, 33, C.ink, 'center');
    mono(
      c,
      'Growing KV   ·   ' + fmt(handoffPositions) + ' positions × ' +
        perPosition() / 1024 + ' KiB = ' + handoffKvBytes / GiB + ' GiB',
      958, 789, 35, C.teal, 'center',
    );
    note(
      c,
      priced
        ? 'At peak link speed, this prompt’s growing KV alone takes ' + kvTransferMs.toFixed(1) + ' ms to transmit.'
        : 'How long would the link take to carry the growing KV?',
    );
    return;
  }
  sharedWorker(c, k);
}

export function precision(c, k) {
  const b = k.beat.beatIndex;
  mono(c, '80 GB device   /   decimal units', 106, 268);
  const gx = 110,
    scale = 21.2;
  let left = gx;
  for (const [size, name, color] of [
    [54, '54 GB weights', C.ink],
    [8, '8 GB', C.blue],
    [remaining / 1e9, '18 GB pool', C.teal],
  ]) {
    rect(c, left, 333, size * scale - 3, 98, color);
    mono(c, name, left + (size * scale) / 2, 383, 30, C.light, 'center');
    left += size * scale;
  }
  mono(c, 'Runtime reserve', gx + (54 + 4) * scale, 463, 26, C.blue, 'center');
  const state = cue(k, 2, 'charge a hundred forty-four') ? recurrent : 0;
  const one = cue(k, 1, 'Change the cache');
  const solve = cue(k, 1, 'Fifty-three users');
  const colX = 1356;
  for (const [idx, bytes] of (one ? [2, 1] : [2]).entries()) {
    const y = 584 + idx * 145,
      v = cost(bytes, state);
    mono(c, bytes + (bytes === 1 ? ' byte' : ' bytes') + ' / value', 111, y + 22, 32);
    const x = 545,
      f = 1.46;
    rect(c, x, y - 19, (v.raw / MiB) * f, 74, C.teal);
    mono(c, v.raw / MiB + ' MiB', x + ((v.raw / MiB) * f) / 2, y + 17, 29, C.light, 'center');
    if (state) {
      const start = x + (v.raw / MiB) * f;
      rect(c, start, y - 19, (state / MiB) * f, 74, C.blue);
      mono(c, state / MiB + ' MiB', start + ((state / MiB) * f) / 2, y + 17, 27, C.light, 'center');
    }
    if (solve) txt(c, v.count + ' users', colX, y + 19, 58, C.ink, 'Serif');
  }
  note(
    c,
    state
      ? 'Per user   ·   growing KV plus 144 MiB of recurrent state'
      : 'Each user reserves 5,120 positions. The bars measure raw KV bytes per user.',
  );
}

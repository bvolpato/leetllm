import assert from 'node:assert/strict';
import { cache, prefillRequest } from '../../../films/local-llm-placement/model.mjs';
import {
  ink,
  paper,
  teal,
  blue,
  mint,
  fog,
  gold,
  red,
  white,
  dark,
  pale,
  mono,
  serif,
  sans,
  rect,
  line,
  label,
  dot,
  plate,
  hatch,
  header,
  foot,
  chip,
  trace,
  strip,
  clamp,
  cue,
} from './art.mjs';

const weights = 7.6,
  card = 24,
  history = 16384,
  perLog = cache(history, 1).total;
export function opening(c) {
  const incoming = cue(c, 0, 'Four incident logs arrive', 2.6);
  const lengths = Array.from({ length: 4 }, (_, i) =>
    Math.round(clamp(incoming * 4 - i) * history),
  );
  const caches = lengths.map((tokens) => cache(tokens, 1));
  const live = weights + caches.reduce((n, row) => n + row.total, 0);
  const retry = cue(c, 3, 'six gigabytes') === 1;
  const amount = retry ? 6 : 15;
  const outlined = cue(c, 2, 'Follow the outline', 1.2);
  const decision = retry ? cue(c, 3, 'It fits') : cue(c, 2, 'The allocation fails');
  return {
    lengths,
    caches,
    live,
    free: card - live,
    retry,
    amount,
    outlined,
    decision,
    fits: live + amount <= card,
    allocated: decision && live + amount <= card ? live + amount : live,
  };
}
function rack(g, c) {
  const s = opening(c),
    b = c.beat.beatIndex;
  header(
    g,
    'LOCAL RUNBOOK ASSISTANT',
    'Where can this buffer go?',
    'Illustrated allocator trace  /  one worker  /  ordinary GPU allocation',
    true,
  );
  plate(g, 82, 302, 435, 563, '#1d4549');
  label(g, 'HOST RAM', 115, 355, 34, white, mono, 600);
  chip(g, 125, 425, 341, 88, '32 GB');
  strip(g, 125, 558, 341, 45, [[8, blue]], 32, '#52716e');
  label(g, '8 GB in use', 125, 648, 33, white);
  label(g, '24 GB free', 125, 714, 43, gold, serif, 600);
  rect(g, 112, 765, 375, 74, '#142e34', '#5b8179', 2, 7);
  dot(g, 136, 802, 7, mint);
  label(g, 'Short query answered', 155, 801, 24, white, mono);
  plate(g, 544, 302, 1294, 563);
  label(g, 'GPU MEMORY', 589, 355, 34, white, mono, 600);
  label(g, '24 GB device', 1780, 354, 34, white, mono, 500, 'right');
  chip(g, 605, 433, 270, 108, 'WEIGHTS');
  label(g, '7.600 GB resident', 740, 595, 27, white, mono, 500, 'center');
  for (let i = 0; i < 4; i++) {
    const y = 402 + i * 57,
      x = 1240,
      k = s.caches[i],
      w = 245;
    label(g, 'Log ' + (i + 1), 925, y + 18, 28, white, mono);
    label(
      g,
      s.lengths[i].toLocaleString('en-US') + ' tokens',
      1206,
      y + 18,
      23,
      fog,
      mono,
      500,
      'right',
    );
    strip(
      g,
      x,
      y + 4,
      w,
      30,
      [
        [k.sliding, mint],
        [k.full, '#4ca9bb'],
      ],
      perLog,
      '#294d51',
    );
    label(g, k.total.toFixed(3) + ' GB', 1763, y + 18, 27, white, mono, 500, 'right');
  }
  const x = 610,
    w = 1143,
    scale = w / 27.4,
    y = 691,
    wall = x + card * scale;
  label(g, 'Live ' + s.allocated.toFixed(3) + ' GB', x, 654, 28, white, mono);
  label(g, 'Device limit', wall, 654, 26, gold, mono, 500, 'center');
  const end = strip(
    g,
    x,
    y,
    w,
    56,
    [
      [weights, blue],
      ...s.caches.map((k) => [k.total, mint]),
      ...(s.retry && s.decision ? [[s.amount, gold]] : []),
    ],
    27.4,
    '#284b4d',
  );
  if (s.outlined && !(s.retry && s.decision)) {
    const span = s.amount * scale,
      col = s.decision && !s.fits ? '#ffa38a' : gold;
    g.save();
    g.beginPath();
    g.rect(end - 3, y - 4, span * s.outlined + 6, 64);
    g.clip();
    rect(g, end, y, span, 56, null, col, 4);
    hatch(g, end, y, span, 56, col, 22);
    g.restore();
  }
  line(
    g,
    [
      [wall, y - 16],
      [wall, y + 76],
    ],
    gold,
    4,
  );
  let msg = 'Blue  ·  shared weights       Green  ·  histories';
  if (b >= 1)
    msg = s.free.toFixed(3) + ' GB free before request   /   ' + s.amount + ' GB scratch requested';
  if (s.retry && s.decision)
    msg =
      s.allocated.toFixed(3) +
      ' GB live   /   ' +
      (card - s.allocated).toFixed(3) +
      ' GB still free';
  label(g, msg, x, 801, 29, white, mono, 500, 'left', 1140);
  foot(
    g,
    b === 0
      ? 'The card holds one copy of the weights. Each log owns its history.'
      : s.retry && s.decision
        ? 'Smaller chunk allocated. Same device, weights and histories.'
        : s.retry
          ? 'Replay the same prefill with a smaller temporary buffer.'
          : s.decision
            ? 'Allocation failed at the GPU boundary. The requested 15 GB never became live.'
            : 'Can this GPU grant the prefill request?',
    true,
  );
}
const pack = { count: 6, bits: 6, extra: [0.3, 0.4, 0.8] };
const codes = (pack.count * pack.bits) / 8,
  loaded = codes + pack.extra.reduce((a, b) => a + b);
const bus = { channels: 4, transfers: 6, bytes: 8, read: 6.4, batch: 4 };
const bandwidth = bus.channels * bus.transfers * bus.bytes,
  steps = bandwidth / bus.read;
function pools(g, c) {
  const b = c.beat.beatIndex;
  if (b <= 2) {
    const unified = b > 0;
    const title = unified ? 'Will the 24 GB request fit?' : 'Which allocator gets the request?';
    header(
      g,
      'MEMORY TOPOLOGY',
      title,
      unified
        ? 'Shared physical storage  /  one 32 GB budget'
        : 'Discrete machine  /  budgets in decimal GB',
    );
    function pool(x, y, w, name, capacity, used, requested, showRequest, resolve) {
      plate(g, x, y, w, 385);
      label(g, name, x + 44, y + 56, 36, white, sans, 600);
      label(g, capacity + ' GB', x + w - 42, y + 55, 36, gold, mono, 500, 'right');
      const left = x + 45,
        rail = w - 90,
        scale = rail / 38;
      const end = strip(
        g,
        left,
        y + 154,
        capacity * scale,
        72,
        [[used, blue]],
        capacity,
        '#35565a',
      );
      const fits = used + requested <= capacity;
      if (requested && showRequest) {
        rect(
          g,
          end,
          y + 154,
          requested * scale,
          72,
          fits && resolve ? mint : null,
          resolve && !fits ? '#ffa38a' : gold,
          4,
        );
        if (!fits) hatch(g, end, y + 154, requested * scale, 72, resolve ? '#ffa38a' : gold, 18);
      }
      line(
        g,
        [
          [left + capacity * scale, y + 127],
          [left + capacity * scale, y + 253],
        ],
        gold,
        4,
      );
      label(
        g,
        used + ' GB before request    +    ' + requested + ' GB requested',
        left,
        y + 285,
        28,
        white,
        mono,
        500,
        'left',
        w - 90,
      );
      label(
        g,
        resolve
          ? fits
            ? 'Allocated'
            : 'Request exceeds capacity'
          : unified
            ? ''
            : 'Available ' + (capacity - used) + ' GB',
        left,
        y + 340,
        34,
        resolve && !fits ? '#ffad95' : mint,
        sans,
        600,
      );
    }
    if (unified) {
      const request = cue(c, 2, 'Place the request'),
        rejected = cue(c, 2, 'CPU and GPU share');
      const capacity = 32,
        occupied = 10,
        requested = 24;
      pool(210, 357, 1500, 'System + CPU + GPU', capacity, occupied, requested, request, rejected);
      foot(
        g,
        request
          ? capacity + ' GB − ' + occupied + ' GB = ' + (capacity - occupied) + ' GB available'
          : 'Subtract the occupied bytes. How much room is left for the model?',
      );
    } else {
      const host = cue(c, 0, 'Place eight gigabytes');
      const device = cue(c, 0, 'twenty-eight gigabytes');
      pool(84, 357, 850, 'Host RAM', 32, 0, host ? 8 : 0, host, host);
      pool(982, 357, 850, 'Discrete GPU', 24, 0, 28, device, device);
      foot(g, 'Each request must fit in the pool named by its allocator.');
    }
  } else if (b === 3) {
    const packed = cue(c, 3, 'The packed codes'),
      extra = cue(c, 3, 'Add the loaded'),
      total = cue(c, 3, 'Together they need');
    header(
      g,
      'LOADED ARTIFACT',
      'What comes out of the weight file?',
      'Toy artifact  /  six billion weights  /  six bits per code',
    );
    const pieces = [
      ['Packed codes', codes, blue],
      ['Metadata', pack.extra[0], gold],
      ['Projector', pack.extra[1], mint],
      ['Draft weights', pack.extra[2], '#bf9370'],
    ];
    const left = 124,
      scale = 1617 / loaded;
    let pos = left;
    for (const [i, [name, n, col]] of pieces.entries()) {
      if (i === 0 || extra) {
        rect(g, pos, 430, n * scale - 4, 167, col, ink, 2, 4);
        hatch(g, pos + 4, 435, n * scale - 12, 43, '#ffffff54', i ? 13 : 28);
        label(
          g,
          i || packed ? n.toFixed(1) : '6-bit codes',
          pos + (n * scale) / 2,
          540,
          i ? 34 : 68,
          ink,
          mono,
          600,
          'center',
          n * scale - 17,
        );
        const yy = i === 1 ? 706 : i === 2 ? 785 : 658;
        line(
          g,
          [
            [pos + (n * scale) / 2, 606],
            [pos + (n * scale) / 2, yy - 26],
          ],
          ink,
          2,
        );
        label(g, name, pos + (n * scale) / 2, yy, i ? 27 : 34, ink, sans, 600, 'center');
      }
      pos += n * scale;
    }
    label(
      g,
      pack.count +
        ' billion × ' +
        pack.bits +
        ' bits ÷ 8' +
        (packed ? ' = ' + codes.toFixed(1) + ' GB' : ''),
      124,
      349,
      40,
      ink,
      mono,
      600,
    );
    foot(
      g,
      total
        ? 'Loaded subtotal  ' +
            loaded.toFixed(1) +
            ' GB. Cache and workspace need their own allocations.'
        : 'Dense packing keeps a slot for every code, including zero.',
    );
  } else {
    const shared = cue(c, 5, 'Share each weight read');
    const n = shared ? bus.batch : 1,
      peak = cue(c, 4, 'combined theoretical peak'),
      rate = cue(c, 4, 'thirty times');
    header(
      g,
      'DECODE BANDWIDTH',
      'How many tokens can one read serve?',
      'Theoretical weight-only step  /  no cache or compute cost',
      true,
    );
    plate(g, 85, 325, 1750, 480);
    for (let i = 0; i < bus.channels; i++) {
      const y = 369 + 90 * i;
      chip(g, 143, y, 360, 53, 'Channel ' + (i + 1));
      for (let wire = 0; wire < 3; wire++) {
        const from = y + 19 + wire * 6,
          to = 506 + i * 25 + wire * 5;
        line(
          g,
          [
            [503, from],
            [580 + i * 22, from],
            [687, to],
            [747, to],
          ],
          '#a4b997',
          3,
        );
      }
    }
    chip(g, 745, 486, 375, 126, '6.4 GB / step');
    for (let i = 0; i < n; i++) {
      const y = shared ? 392 + 80 * i : 523;
      line(
        g,
        [
          [1122, 550],
          [1220, 550],
          [1320, y],
          [1400, y],
        ],
        gold,
        4,
      );
      rect(g, 1400, y - 26, 350, 54, '#245558', mint, 2, 6);
      label(g, 'Sequence ' + (i + 1) + '  +1', 1575, y, 29, white, mono, 500, 'center');
    }
    label(
      g,
      bus.channels +
        ' × ' +
        bus.transfers +
        ' GT/s × ' +
        bus.bytes +
        ' B' +
        (peak ? ' = ' + bandwidth.toFixed(1) + ' GB/s' : ''),
      142,
      755,
      37,
      white,
      mono,
      500,
    );
    foot(
      g,
      rate
        ? steps +
            ' steps/s × ' +
            n +
            ' token' +
            (n > 1 ? 's' : '') +
            ' per step = ' +
            steps * n +
            ' aggregate tokens/s'
        : 'Each populated channel supplies eight bytes per transfer.',
      true,
    );
  }
}
const toy = { layers: 16, heads: 2, width: 64, bytes: 2, len: 4096, logs: 2 };
const tokenBytes = 2 * toy.layers * toy.heads * toy.width * toy.bytes;
const toyMiB = (tokenBytes * toy.len * toy.logs) / 2 ** 20;
export function retention(c) {
  const b = c.beat.beatIndex;
  const long = b === 3 && !!cue(c, 3, 'The full layers keep the extra history');
  const more = b === 4 && !!cue(c, 4, 'double concurrency');
  const full = b === 5 && !!cue(c, 5, 'Fill the earlier slots');
  const sessions = more ? 8 : 4,
    tokens = long ? 32768 : 16384;
  const k = cache(tokens, sessions, !full);
  return { tokens, sessions, full, k, total: weights + 2 + k.total };
}
function historyScene(g, c) {
  const b = c.beat.beatIndex;
  if (b < 2) {
    header(
      g,
      'CACHE ANATOMY',
      'What does one token leave behind?',
      'Toy full-attention layer  /  two KV heads  /  width 64  /  two bytes per entry',
    );
    const result = cue(c, 0, 'Each token leaves'),
      multi = cue(c, 1, 'Multiply by both histories');
    for (let i = 0; i < 2; i++) {
      const x = 110 + i * 886;
      label(g, i ? 'VALUES' : 'KEYS', x, 350, 34, teal, mono, 600);
      for (let j = 0; j < 2; j++) {
        label(g, 'Head ' + (j + 1), x, 423 + 106 * j, 31, ink);
        for (let n = 0; n < 64; n++)
          rect(g, x + 140 + n * 10.4, 390 + 106 * j, 8, 68, i ? teal : blue);
      }
    }
    line(
      g,
      [
        [105, 609],
        [1808, 609],
      ],
      '#9daea4',
      2,
    );
    label(
      g,
      '2 arrays × ' +
        toy.layers +
        ' layers × ' +
        toy.heads +
        ' heads × ' +
        toy.width +
        ' entries × ' +
        toy.bytes +
        ' B',
      108,
      683,
      43,
      ink,
      mono,
      500,
    );
    if (result)
      label(g, tokenBytes.toLocaleString('en-US') + ' B per token', 108, 786, 64, teal, serif, 600);
    foot(
      g,
      multi
        ? tokenBytes.toLocaleString('en-US') +
            ' B × ' +
            toy.len.toLocaleString('en-US') +
            ' tokens × ' +
            toy.logs +
            ' sessions = ' +
            toyMiB +
            ' MiB of raw cache'
        : 'Count configured KV heads and width for every layer that retains this token.',
    );
    return;
  }
  const s = retention(c),
    cols = s.tokens / 1024,
    sx = 435,
    pitch = 1298 / cols;
  header(
    g,
    'RETENTION LAB',
    'Which positions occupy memory?',
    s.sessions +
      ' logs × ' +
      s.tokens.toLocaleString('en-US') +
      ' tokens  /  tiles show one log  /  1,024 positions per column',
  );
  for (const [i, [name, shape, gb]] of [
    ['Sliding', '40 layers · 8 × 256', s.k.sliding],
    ['Full', '8 layers · 1 × 512', s.k.full],
  ].entries()) {
    const y = 378 + i * 178;
    label(g, name, 86, y + 25, 44, ink, serif, 600);
    label(g, shape, 86, y + 76, 25, ink, mono);
    label(g, gb.toFixed(3) + ' GB', 86, y + 124, 30, teal, mono, 600);
    for (let row = 0; row < 2; row++) {
      label(g, row ? 'V' : 'K', sx - 15, y + 25 + row * 55, 28, ink, mono, 600, 'right');
      for (let j = 0; j < cols; j++) {
        const kept = i === 1 || s.full || j === cols - 1;
        rect(
          g,
          sx + j * pitch,
          y + row * 55,
          pitch - 4,
          48,
          kept ? (i ? blue : mint) : '#e1e5d9',
          '#a0b6a8',
          1,
          3,
        );
      }
    }
  }
  const last = sx + (cols - 1) * pitch;
  line(
    g,
    [
      [last, 366],
      [last, 348],
      [sx + 1294, 348],
      [sx + 1294, 366],
    ],
    red,
    4,
  );
  label(g, 'Last query · sliding window', sx + 1296, 322, 29, red, sans, 600, 'right');
  const x = 180,
    w = 1540,
    cap = 34,
    y = 810;
  label(
    g,
    'Device demand    7.6 GB weights  +  2 GB work  +  ' + s.k.total.toFixed(3) + ' GB cache',
    x,
    759,
    31,
    ink,
    mono,
  );
  strip(
    g,
    x,
    y,
    w,
    45,
    [
      [weights, '#45616e'],
      [2, gold],
      [s.k.sliding, mint],
      [s.k.full, blue],
    ],
    cap,
  );
  for (const [v, col] of [
    [19.2, teal],
    [24, red],
  ]) {
    line(
      g,
      [
        [x + (w * v) / cap, y - 15],
        [x + (w * v) / cap, y + 54],
      ],
      col,
      3,
    );
    label(g, v + ' GB', x + (w * v) / cap, y + 69, 22, col, mono, 600, 'center');
  }
  let message =
    s.total.toFixed(3) +
    ' GB total   /   ' +
    (s.total > 24
      ? 'Exceeds the physical card. Earlier sliding positions still occupy storage.'
      : 'Inside the 19.2 GB planning limit. Weights and workspace are counted once.');
  if (b === 3 && !cue(c, 3, 'The full layers keep the extra history'))
    message = 'Predict the next run at 32,768 tokens per log. Which row will grow?';
  foot(g, message);
}
export const memoryPainters = [rack, pools, historyScene];
export function checkMemory(clock) {
  assert.equal(loaded.toFixed(1), '6.0');
  assert.deepEqual([bandwidth, steps, steps * bus.batch], [192, 30, 120]);
  assert.deepEqual([tokenBytes, toyMiB], [8192, 64]);
  const idle = opening(clock(0, 0)),
    full = opening(clock(2, 1)),
    retry = opening(clock(3, 1));
  assert.deepEqual(idle.lengths, [0, 0, 0, 0]);
  assert.equal(idle.live, weights);
  for (const [s, request] of [
    [full, prefillRequest(15)],
    [retry, prefillRequest(6)],
  ]) {
    assert.equal(s.live, request.liveGB);
    assert.equal(s.free, request.freeGB);
    assert.equal(s.amount, request.temporaryGB);
    assert.equal(s.fits, request.fits);
    assert.equal(s.allocated, s.live + (s.fits ? s.amount : 0));
  }
  const states = [2, 3, 4, 5].map((b) => retention(clock(b, 1)));
  assert.deepEqual(
    states.map((s) => [s.tokens, s.sessions, s.full, s.total.toFixed(3)]),
    [
      [16384, 4, false, '12.016'],
      [32768, 4, false, '13.090'],
      [16384, 8, false, '14.432'],
      [16384, 4, true, '32.149'],
    ],
  );
}

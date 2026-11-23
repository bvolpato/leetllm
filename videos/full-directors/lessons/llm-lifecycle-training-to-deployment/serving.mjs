import { lerp, travel } from './art.mjs';
import {
  admission,
  allow,
  blocks,
  callers,
  draft,
  gaps,
  pool,
  route,
  schedule,
  timestamps,
  verifyDraft,
} from './examples.mjs';

export function batch(a) {
  const { c, beat: b, cue } = a;
  if (b === 3) {
    a.title(
      'PagedAttention  /  long request B',
      'Where can token seventeen go?',
    );
    const add = cue(3, 'Add one token', 1.3),
      tokens = 16 + Math.floor(add);
    a.text('Logical blocks of four tokens', 75, 214, 23, c.muted);
    const logicalX = (i) => 86 + i * 226,
      physX = (i) => 83 + i * 144;
    const n = blocks(tokens).count;
    for (let i = 0; i < n; i++) {
      const lx = logicalX(i),
        px = physX(pool[i]);
      a.mono('L' + i, lx, 265, 23, i === 4 ? c.gold : c.cyan);
      a.box(lx, 286, 176, 54, c.bed, c.line, 4);
      for (let j = 0; j < 4; j++)
        a.box(
          lx + 4 + j * 43,
          291,
          40,
          44,
          i * 4 + j < tokens ? (i === 4 ? c.gold : c.cyan) : c.bed,
          null,
          2,
        );
      a.path(
        [
          [lx + 85, 344],
          [lx + 85, 365 + 9 * i],
          [px + 55, 410 + 9 * i],
          [px + 55, 466],
        ],
        i === 4 ? c.gold : c.line,
        3,
      );
    }
    for (let i = 0; i < 8; i++) {
      const used = pool.slice(0, n).includes(i);
      a.tile(
        physX(i),
        465,
        112,
        71,
        'P' + i,
        used ? c.bed : c.bg,
        used ? (i === 7 ? c.gold : c.ink) : c.muted,
        25,
      );
    }
    a.text('Physical pool', 80, 587, 24, c.muted);
    a.mono(
      tokens +
        ' live tokens   ·   ' +
        n +
        ' blocks   ·   ' +
        blocks(tokens).slack +
        ' unused slots',
      337,
      588,
      23,
      c.ink,
    );
    return;
  }
  const { shortRequest: short, longRequest: long, staticIdle: gap } = schedule;
  const finish = cue(1, 'Each step adds a token', 2.2);
  const running = cue(2, 'slot sits idle', 1.9);
  const rewound = cue(2, 'Replay the finish', 1.1);
  const checked = cue(2, 'both fit and policy permits', 0);
  const admit =
    admission(1, 4, 4, checked === 1, true) && cue(2, 'admit it', 0) === 1;
  const staticStep = short * finish + gap * running;
  const replayStep = admit ? short + 1 + 20 * cue(2, 'admit it', 2) : short;
  const tick = Math.round(lerp(staticStep, replayStep, rewound));
  const afterFinish = Math.max(0, tick - short);
  a.title(
    rewound === 1
      ? 'Continuous batching  /  decode iterations'
      : 'Static batch  /  decode iterations',
    b === 1
      ? 'What happens to A’s slot after iteration 15?'
      : rewound === 0
        ? 'Follow B to its last token.'
        : rewound < 1
          ? 'Rewind to iteration 15.'
          : admit
            ? 'C takes the next slot.'
            : 'Can C enter the freed slot?',
  );
  const left = 224,
    right = 1175,
    pos = (i) => left + ((right - left) * i) / 40;
  a.text('First 40 iterations', 76, 217, 22, c.muted);
  const rows = ['Slot A', 'Request B'];

  for (let i = 0; i < 2; i++) {
    const y = 260 + i * 104;
    a.text(rows[i], 71, y + 38, 25, c.ink);
    for (let j = 0; j < 40; j++) {
      let col = c.bed;
      if (j < tick) {
        col = i ? c.cyan : j < short ? c.violet : admit ? c.green : c.line;
      }
      a.box(pos(j), y, pos(1) - pos(0) - 2, 54, col, c.line, 2);
    }
  }
  a.line(pos(short), 234, pos(short), 429, c.gold, 3);
  a.mono(short, pos(short), 220, 25, c.gold, 'center');
  if (tick >= short)
    a.text(
      admit ? 'C admitted' : 'A finished',
      pos(short) + 11,
      344,
      22,
      admit ? c.green : c.gold,
    );
  a.text('Full timeline', 70, 509, 22, c.muted);

  const scale = a.axis(
    left,
    566,
    right - left,
    0,
    long,
    [0, 150, 300, 450, 600],
  );
  a.box(left, 534, scale(Math.min(short, tick)) - left, 17, c.violet, null, 2);
  if (afterFinish)
    a.box(
      scale(short),
      534,
      scale(tick) - scale(short),
      17,
      admit ? c.green : c.line,
      null,
      2,
    );
  a.line(left, 558, scale(long), 558, c.line, 3);
  a.line(left, 558, scale(tick), 558, c.cyan, 5);
  a.dot(scale(tick), 558, 7, c.cyan);
  a.text(
    'Request B   ' + tick + ' / ' + long + ' iterations',
    left,
    513,
    25,
    c.ink,
  );
  if (afterFinish && !admit)
    a.mono(
      'A idle   ' + afterFinish + ' iterations',
      right,
      511,
      23,
      c.muted,
      'right',
    );
  if (rewound === 1) {
    const status = admit
      ? 'C starts in slot A. B continues.'
      : checked
        ? 'Cache and prefill fit. Policy permits C.'
        : 'Waiting request C   ·   check cache space and prefill budget';
    a.text(status, left, 658, 23, admit ? c.green : c.gold);
  }
}

export function measurements(a) {
  const { c, beat: b, cue } = a;
  if (b <= 4) {
    a.title(
      'Serving measurements  /  one stream',
      'When did each token leave the server?',
    );
    const x = (n) => 93 + 3.48 * n,
      y = 374;
    a.line(x(0), y, x(310), y, c.line, 4);
    const visibility = [
      1,
      cue(1, 'first token at'),
      cue(3, 'two hundred forty'),
      cue(3, 'three hundred'),
    ];
    timestamps.forEach((t, i) => {
      a.fade(visibility[i], () => {
        a.dot(x(t), y, 11, i ? c.cyan : c.gold);
        a.line(x(t), y - 15, x(t), y - 61, i ? c.cyan : c.gold, 3);
        a.mono(
          i ? 'T' + i : 'Arrival',
          x(t),
          y - 80,
          25,
          i ? c.cyan : c.gold,
          'center',
        );
        a.mono(t + ' ms', x(t), y + 49, 21, c.ink, 'center');
        if (i) {
          const prev = x(timestamps[i - 1]);
          a.line(prev + 5, y + 92, x(t) - 5, y + 92, c.line, 2);
          a.mono(
            gaps[i - 1] + ' ms',
            (x(t) + prev) / 2,
            y + 136,
            25,
            i === 1 ? c.gold : c.cyan,
            'center',
          );
        }
      });
    });
    const bottom =
      b === 1
        ? 'Server TTFT includes queueing, prefill and the first generation step.'
        : b === 2
          ? 'A network chunk can contain several tokens.'
          : b === 3
            ? 'Throughput = all streams’ output tokens / elapsed seconds.'
            : 'At the same load, measure weights, KV state, activations and workspace.';
    a.text(bottom, 76, 622, 27, c.ink, { face: 'Serif' });
    return;
  }
  if (b === 5) {
    a.title(
      'Paged cache  /  four slots per physical block',
      'How much space do six tokens reserve?',
    );
    const filled = 4 + Math.round(2 * cue(5, 'next two', 1));
    [3, 9].forEach((physical, i) => {
      const x = 86 + i * 623,
        active = i < blocks(filled).count;
      a.text(
        'Physical block ' + physical,
        x,
        259,
        29,
        active ? c.ink : c.muted,
      );
      a.box(x, 301, 483, 132, active ? c.bed : c.bg, c.line, 8);
      for (let j = 0; j < 4; j++) {
        const idx = i * 4 + j;
        const on = idx < filled;
        a.tile(
          x + 12 + 115 * j,
          320,
          105,
          91,
          on ? 't' + (idx + 1) : '·',
          on ? c.cyan : c.bg,
          on ? c.reverse : c.muted,
          31,
        );
      }
    });
    a.mono(
      filled + ' live  /  ' + 4 * blocks(filled).count + ' allocated',
      87,
      544,
      32,
      c.ink,
    );
    a.text(blocks(filled).slack + ' unused slots', 88, 611, 32, c.gold, {
      face: 'Serif',
    });
    return;
  }
  a.title(
    'Shared partial prefix  /  copy-on-write',
    'Which request gets the private block?',
  );
  const copy = cue(6, 'copy it first', 1.1);
  const point = (y) => [
    [359, y],
    [509, y],
    [615, 307],
    [731, 307],
  ];
  a.text('Reader A', 88, 284, 35, c.cyan, { face: 'Serif' });
  a.text('A keeps the original prefix.', 88, 335, 27, c.ink, { face: 'Serif' });
  a.text('Writer B', 88, 477, 35, c.violet, { face: 'Serif' });
  a.path(point(275), c.cyan, 4);
  a.path(
    copy > 0
      ? [
          [359, 467],
          [731, 467],
        ]
      : point(467),
    c.violet,
    4,
  );
  const drawBlock = (y, values, col) => {
    values.forEach((token, i) =>
      a.tile(756 + i * 100, y, 90, 68, token, c.bed, col, 26),
    );
  };
  drawBlock(274, ['t1', 't2', '·', '·'], c.cyan);
  a.mono('Readers   ' + (copy > 0 ? 1 : 2), 756, 387, 24, c.cyan);
  a.fade(copy, () => {
    drawBlock(435, ['t1', 't2', 't3', '·'], c.violet);
    a.mono('Private block   ·   writer B', 756, 549, 20, c.violet);
  });
}

export function speculation(a) {
  const { c, beat: b, cue } = a;
  const passAll = b === 2 ? cue(2, 'all five pass') : b === 3 ? 1 : 0;
  const failAt = b === 4 ? 1 : 4;
  const flags = draft.map((_, i) => passAll > 0 || i !== failAt);
  const emitted = verifyDraft(flags, b === 4 ? 'request' : 'ineligible');
  const accepted = b === 1 ? cue(1, 'first four pass', 1.4) : 1;
  const emit =
    b === 1
      ? cue(1, 'sample a correction', 1.1)
      : b === 2
        ? cue(2, 'bonus token', 1.1)
        : 1;
  a.title(
    'Speculative decoding  /  one target verification pass',
    b === 4
      ? 'What does an early rejection cost?'
      : 'How much of the draft can the target emit?',
  );
  a.text('Draft proposals', 78, 228, 22, c.muted);
  draft.forEach((token, i) => {
    const rejected = i === failAt && !flags[i] && accepted > 0;
    const acceptedIdx = passAll ? 5 : failAt;
    const col = rejected
      ? c.red
      : accepted > 0 && i < acceptedIdx
        ? c.green
        : c.muted;
    const x = 82 + i * 206;
    a.tile(x, 260, 187, 86, token, c.bed, col, 24);
    if (rejected) {
      a.line(x + 8, 336, x + 176, 268, c.red, 4);
      a.text('Rejected', x + 93, 386, 21, c.red, { align: 'center' });
    }
  });
  a.text('Emitted sequence', 79, 432, 22, c.muted);
  if (emit > 0)
    emitted.forEach((token, i) => {
      const extra = i === emitted.length - 1;
      a.tile(
        81 + i * 191,
        480,
        182,
        80,
        token,
        extra ? c.gold : c.green,
        c.reverse,
        23,
      );
    });
  const count = emitted.length;
  a.fade(emit, () =>
    a.text(
      b === 4
        ? 'Time the draft and target work together for ' +
            count +
            ' emitted tokens.'
        : passAll
          ? 'Five accepted proposals + one bonus token.'
          : 'Four accepted proposals + one target correction.',
      375,
      432,
      28,
      c.ink,
      { face: 'Serif' },
    ),
  );
}

export function gateway(a) {
  const { c, beat: b, cue } = a;
  if (b <= 2) {
    a.title(
      'Gateway  /  production route · now = 100',
      'Which credential may pass?',
    );
    ['Credential', 'Scope', 'Expiry', 'Route'].forEach((v, i) =>
      a.text(v, [73, 371, 692, 952][i], 241, 22, c.muted),
    );
    callers.forEach((caller, i) => {
      const y = 333 + i * 118;
      a.text(caller.name, 73, y, 32, c.ink, { face: 'Serif' });
      a.mono(caller.scope, 372, y, 25, c.ink);
      a.mono(caller.expires, 693, y, 27, c.ink);
      const show =
        b === 2 || (i === 2 && cue(1, 'lacks production access') > 0);
      a.text(
        show ? (allow(caller) ? 'Allow' : 'Deny') : '?',
        953,
        y,
        32,
        show ? (allow(caller) ? c.green : c.red) : c.muted,
        { face: 'Serif' },
      );
      a.line(73, y + 34, 1188, y + 34, c.line);
    });
    return;
  }
  const limited = b === 4;
  const outcome = route(limited ? 429 : 503, 100);
  a.title(
    'Gateway  /  authorized production request',
    limited
      ? 'The gateway returns the primary’s 429.'
      : b === 3
        ? 'Where can a request go during cooldown?'
        : b === 5
          ? 'Before opening a backup route'
          : 'When may the primary take traffic again?',
  );
  if (b >= 5) {
    if (b === 5) {
      const labels = ['Data approval', 'Capacity', 'Case scores'];
      const cues = ['which data', 'how much load', 'how its answers score'];
      a.text('Request', 76, 299, 25, c.muted);
      a.key(127, 366, 0.52);
      a.text('Backup', 1069, 302, 25, c.muted);
      a.box(1058, 339, 121, 72, c.bed, c.line, 8);
      a.line(174, 375, 1058, 375, c.line, 4);
      labels.forEach((label, i) => {
        const x = 326 + i * 260,
          inspect = cue(5, cues[i], 0.7);
        a.dot(x, 375, 15, inspect ? c.cyan : c.line);
        a.line(
          x,
          373,
          x + 38 * inspect,
          318 + 57 * inspect,
          inspect ? c.cyan : c.line,
          8,
        );
        a.text(label, x, 460, 23, c.ink, { align: 'center' });
      });
      a.fade(cue(5, 'reusing a request trace'), () =>
        a.text(
          'Trace review   ·   who received the facts, and what did they retain?',
          75,
          542,
          27,
          c.ink,
          { face: 'Serif' },
        ),
      );
    } else {
      a.text('Recovery after cooldown', 77, 244, 28, c.muted);
      const x = a.axis(135, 421, 1000, 100, 115, [100, 105, 110, 115]);
      a.box(x(100), 337, x(110) - x(100), 61, c.bed, c.line, 3);
      a.text('Primary cools down', x(100) + 24, 378, 28, c.muted);
      const probe = cue(6, 'limit concurrent recovery probes', 1.15);
      a.fade(probe, () => {
        a.arrow(x(110), 370, x(113), 370, c.cyan, 6);
        a.mono('Probe', x(110), 312, 25, c.cyan);
      });
      a.fade(cue(6, 'deadline'), () => {
        a.line(x(113), 337, x(113), 403, c.gold, 4);
        a.text('Deadline', x(113), 310, 22, c.gold);
      });
      a.text(
        'Recheck caller scope and revocation before routing.',
        78,
        578,
        32,
        c.ink,
        { face: 'Serif' },
      );
    }
    return;
  }
  a.text('Production primary', 81, 282, 30, c.ink);
  a.mono(limited ? '429' : '503', 81, 363, 70, c.red);
  const fork = [
      [294, 332],
      [450, 332],
      [532, 272],
      [765, 272],
    ],
    ret = [
      [294, 332],
      [450, 332],
      [532, 431],
      [765, 431],
    ];
  a.path(fork, c.line, 3);
  a.path(ret, c.line, 3);
  a.text('Approved backup', 804, 286, 33, !limited ? c.green : c.muted, {
    face: 'Serif',
  });
  a.text('Return rate limit', 804, 445, 33, limited ? c.gold : c.muted, {
    face: 'Serif',
  });
  const q = limited
    ? cue(4, 'rate limit to the caller', 1)
    : cue(3, 'picks the approved', 1);
  if (q > 0) travel(a, limited ? ret : fork, q, limited ? c.gold : c.green);
  if (!limited) {
    a.axis(295, 553, 692, 100, outcome.probeAt, [100, 105, 110]);
    a.text('Primary cooldown', 82, 531, 23, c.gold);
    a.text('Probe allowed', 1014, 563, 21, c.muted);
  } else
    a.text(
      'The same project or model quota may apply to both pools.',
      82,
      601,
      28,
      c.ink,
      { face: 'Serif' },
    );
}

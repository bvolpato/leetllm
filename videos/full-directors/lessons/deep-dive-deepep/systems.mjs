import assert from 'node:assert/strict';
import {
  communicationBudget,
  destinationExpectation,
  deferredWaitTrace,
  sum,
} from '../../../films/deep-dive-deepep/arithmetic.mjs';
import {
  C,
  cue,
  alpha,
  mix,
  text,
  mono,
  rect,
  path,
  dot,
  hatch,
  card,
  chip,
  row,
  scene,
  note,
} from './bench.mjs';

const event = deferredWaitTrace(2);
export function ownership(c) {
  const waitA = cue(c, 1, 'A waits for the dispatch event', 0);
  const copy = cue(c, 1, 'queues a copy', 1.3);
  const keep = cue(c, 1, 'Keep the four objects', 0);
  const ready = cue(c, 1, 'Record a ready event', 0);
  const readA = cue(c, 1, 'A can queue its own read', 0);
  const waitB = cue(c, 2, 'B calls the wrapper again', 0);
  const none = cue(c, 3, 'because A already ran', 0);
  const waitReady = cue(c, 3, "Make B wait for A's ready event", 0);
  const readB = ready && waitReady && cue(c, 3, 'Now B can read', 0);
  const finishA = cue(c, 3, 'After A finishes', 0);
  const finishB = cue(c, 4, 'Now the caller may release', 0);
  return {
    waitA,
    copy,
    keep,
    ready,
    readA,
    waitB,
    none,
    waitReady,
    readB,
    finishA,
    finishB,
    retained: Boolean(keep && finishB < 1),
  };
}
export function lifetime(g, c) {
  const st = ownership(c);
  const returned = cue(c, 0, 'returns an event wrapper', 0);
  if (!returned) {
    scene(g, 'Historical V2   /   ElasticBuffer', 'What does a fresh dispatch return?');
    text(g, 'Direct return', 138, 345, 45);
    [...event.results[0], 'event'].forEach((f, i) =>
      chip(g, 140 + i * 331, 430, 294, 109, f, i === 4 ? C.sky : C.white),
    );
    const counts = cue(c, 0, 'waits on the host', 0);
    if (counts)
      text(g, 'Fresh route by default    /    host waits for exact receive counts', 150, 635, 37);
    if (cue(c, 0, 'With count synchronization disabled', 0))
      text(g, 'Count sync disabled    /    consume valid ranges on device', 150, 724, 37, C.teal);
    note(
      g,
      counts
        ? 'Receive counts describe the layout. The stream order determines when data can be read.'
        : 'Historical V2 returns all five items directly.',
    );
    return;
  }
  scene(g, 'V2.5 deferred dispatch', 'What must B wait for to read the saved rows?');
  const recorded = cue(c, 0, 'records its event', 0);
  const overlap = cue(c, 1, 'Launch independent work', 1);
  const dispatchX = 800,
    readyX = 1320;
  const [dispatchY, aY, bY] = [327, 465, 609];
  const bar = (x, y, w, color, label) => {
    rect(g, x, y - 30, w, 60, color, null, 0, 6);
    text(g, label, x + w / 2, y, 30, C.white, 'center');
  };
  ['Dispatch stream', 'Stream A', 'Stream B'].forEach((name, i) => {
    const y = [dispatchY, aY, bY][i];
    text(g, name, 110, y, 37);
    path(
      g,
      [
        [430, y],
        [1800, y],
      ],
      C.line,
      3,
    );
  });
  bar(430, dispatchY, dispatchX - 450, C.blue, 'dispatch kernels');
  text(g, 'Host holds the wrapper', 1475, 300, 33, C.muted, 'center');
  if (recorded) {
    dot(g, dispatchX, dispatchY, 11, C.blue);
    text(g, 'dispatch event', dispatchX + 23, dispatchY - 30, 31, C.blue);
  }
  if (overlap) alpha(g, overlap, () => bar(430, aY, 305, C.muted, 'independent work'));
  if (st.waitA) {
    path(
      g,
      [
        [dispatchX, dispatchY + 13],
        [dispatchX, aY],
      ],
      C.blue,
      4,
      [7, 7],
    );
    dot(g, dispatchX, aY, 11, C.gold, C.blue);
    text(g, 'wait', dispatchX - 26, aY + 53, 30, C.blue, 'right');
  }
  if (st.copy) alpha(g, st.copy, () => bar(885, aY, 385, C.rust, 'copy to result tensors'));
  if (st.ready) {
    dot(g, readyX, aY, 12, C.teal);
    text(g, 'ready event', readyX, aY - 58, 31, C.teal, 'center');
  }
  if (st.readA) bar(readyX + 35, aY, 233, C.teal, st.finishA ? 'A finished' : 'A reads');
  if (st.waitB) {
    // Both wrapper waits observe the event on the dispatch stream.
    path(
      g,
      [
        [dispatchX, dispatchY + 12],
        [847, dispatchY + 61],
        [847, bY],
      ],
      C.blue,
      3,
      [7, 7],
    );
    dot(g, 847, bY, 11, C.gold, C.blue);
    text(g, st.none ? 'wrapper → None' : 'wrapper → ?', 823, bY + 46, 31, C.blue, 'center');
  }
  if (st.waitReady) {
    path(
      g,
      [
        [readyX, aY + 14],
        [readyX, bY],
      ],
      C.teal,
      5,
    );
    dot(g, readyX, bY, 11, C.gold, C.teal);
    text(g, 'wait for ready', readyX, bY + 46, 31, C.teal, 'center');
  }
  if (st.readB)
    bar(readyX + 36, bY, 414, C.teal, st.finishB === 1 ? 'B finished' : 'B reads the first set');

  if (st.retained) {
    rect(g, 235, 708, 1450, 97, C.pale, C.teal, 3, 14);
    text(g, 'Retained first set', 265, 756, 34, C.teal);
    event.results[0].forEach((name, i) => chip(g, 600 + i * 258, 729, 224, 53, name));
  } else if (st.finishB === 1) {
    rect(g, 235, 708, 1450, 97, null, C.line, 3, 14);
    text(g, 'Storage available for reuse', 960, 756, 41, C.teal, 'center');
  }
  let caption = 'The wrapper holds the event recorded on the dispatch stream.';
  if (st.copy)
    caption = 'The first wrapper wait queues the deferred copy on the current stream, A.';
  if (st.ready) caption = 'A records ready after its copy writes the result tensors.';
  if (st.waitB)
    caption = 'B waits on the original dispatch event. What does that say about the copy on A?';
  if (st.none)
    caption =
      'The hook has run once. The original dispatch event covers only the upstream kernels.';
  if (st.waitReady) caption = 'B waits on A’s ready event before reading the retained tensors.';
  if (st.finishA) caption = 'A has finished. The four objects stay alive for B’s last read.';
  if (st.finishB === 1)
    caption = 'Both readers have finished. The caller can reuse the allocation.';
  note(g, caption);
}

const capacity = { size: 12, owned: 8, request: 5 };
const versions = [
  { name: 'V1', api: 'Buffer', transport: 'NVSHMEM', mode: 'Separate low-latency path' },
  { name: 'V2', api: 'ElasticBuffer', transport: 'NCCL Gin', mode: 'Unified EP buffer' },
  { name: 'V2.5', api: 'EPBuffer', transport: 'NCCL Gin', mode: 'Dedicated buffers' },
];
export function setup(g, c) {
  const i = c.beat.beatIndex;
  if (i >= 2) {
    if (i === 2) {
      scene(g, 'Integration boundary', 'Which API owns expert dispatch?');
      const emphasis = cue(c, 2, 'V two point five split', 0);
      versions.forEach((v, j) => {
        const x = 115 + j * 577;
        card(g, x, 353, 530, 346, j === 2 && emphasis ? C.pale : C.white);
        text(g, v.name, x + 34, 412, 51, C.ink, 'left', 'Serif');
        mono(g, v.api, x + 265, 511, 43);
        text(g, v.transport, x + 265, 587, 37, C.teal, 'center');
        text(g, v.mode, x + 265, 648, 30, C.muted, 'center');
      });
      note(
        g,
        emphasis
          ? 'EPBuffer   /   BucketBuffer   /   PPBuffer   /   EngramBuffer'
          : 'Historical API snapshots from the course walkthrough',
      );
    } else {
      scene(g, 'First use', 'What gets compiled on the worker?');
      const change = cue(c, 3, 'A new alignment', 0),
        warm = cue(c, 3, 'Warm the actual shapes', 1);
      const items = [
        ['Install', 'host extension'],
        ['First dispatch', 'compile kernel'],
        ['Repeat shape', 'cached kernel'],
      ];
      items.forEach(([n, s], j) => {
        const x = 130 + j * 575;
        if (j)
          path(
            g,
            [
              [x - 80, 502],
              [x + 4, 502],
            ],
            C.ink,
            5,
          );
        card(g, x, 364, 489, 268, j === 2 && warm === 1 ? C.pale : C.white);
        text(g, n, x + 244, 435, 39, C.ink, 'center', 'Serif');
        chip(g, x + 51, 497, 387, 76, s);
      });
      text(
        g,
        change ? 'New alignment → new specialization' : 'Cache key includes shape and GPU target',
        960,
        743,
        40,
        C.teal,
        'center',
      );
      note(
        g,
        warm === 1
          ? 'Compare warm runs on the same GPU target, compiler and loaded NCCL runtime.'
          : 'V2.5 builds runtime kernels through DeepJIT.',
      );
    }
    return;
  }
  scene(g, 'Symmetric allocation', 'Will the next session fit?');
  const probe = cue(c, 0, 'asks for five', 0.6),
    show = cue(c, 1, 'One row would overrun', 0.8);
  const dx = 124,
    left = 125,
    y = 432;
  for (let j = 0; j < capacity.size; j++) {
    const x = left + j * dx,
      used = j < capacity.owned;
    rect(g, x, y, dx - 7, 145, used ? C.teal : C.white, C.ink, 2.5, 6);
    mono(g, j, x + (dx - 7) / 2, y + 74, 36, used ? C.white : C.muted);
  }
  text(g, 'Allocated window    /    12 row slots', 125, 322, 46);
  path(
    g,
    [
      [left, y + 174],
      [left + capacity.owned * dx - 9, y + 174],
    ],
    C.teal,
    5,
  );
  text(g, '8 slots still owned', left + (capacity.owned * dx) / 2, 674, 41, C.teal, 'center');
  if (probe)
    alpha(g, probe, () => {
      const start = mix(895, left + capacity.owned * dx, show);
      const requestY = y + 159 + (1 - show) * 66;
      for (let j = 0; j < capacity.request; j++) {
        const x = start + j * dx;
        rect(
          g,
          x,
          requestY,
          dx - 7,
          56,
          show === 1 && j >= capacity.size - capacity.owned ? C.rose : C.gold,
          C.ink,
          2,
          5,
        );
        if (show === 1 && j >= capacity.size - capacity.owned)
          hatch(g, x, requestY, dx - 7, 56, C.rust);
      }
      text(
        g,
        '5 requested',
        start + (capacity.request * dx) / 2,
        requestY + 93,
        40,
        C.rust,
        'center',
      );
    });
  note(
    g,
    show === 1
      ? '12 allocated − 8 live = 4 free. One requested slot falls outside the window.'
      : 'The allocation stays fixed until the current sessions release their storage.',
  );
}

const pairs = [];
for (let a = 0; a < 4; a++)
  for (let b = a + 1; b < 4; b++) {
    const owners = [a, b].map((e) => Math.floor(e / 2));
    pairs.push({ ids: [a, b], owners, count: new Set(owners).size });
  }
const visits = sum(pairs.map((p) => p.count));
const budget = communicationBudget(9.6, { pool: 128 });
export function planning(g, c) {
  if (c.beat.beatIndex < 2) {
    const counted = cue(c, 1, 'That makes ten', 0);
    const result = cue(c, 1, 'Skew or a group', 0);
    scene(g, 'Route distribution', 'How many pairs stay on one rank?');
    pairs.forEach((p, i) => {
      const x = 129 + (i % 3) * 565,
        y = 306 + Math.floor(i / 3) * 228;
      card(g, x, y, 513, 186, counted && p.count === 1 ? C.pale : C.white);
      p.ids.forEach((e, j) => {
        const xx = x + 60 + j * 236;
        chip(g, xx, y + 47, 155, 65, 'E' + e, p.owners[j] ? C.sky : C.pale);
        text(g, 'Rank ' + p.owners[j], xx + 78, y + 148, 30, C.muted, 'center');
      });
    });
    note(
      g,
      result
        ? '(2 × 1 + 4 × 2) ÷ 6 = 5/3 destinations per token under uniform distinct pairs'
        : counted
          ? cue(c, 1, 'The mean is', 0)
            ? visits + ' visits across 6 equally likely pairs'
            : '2 pairs visit one rank each. The other 4 pairs visit both ranks.'
          : 'Choose 2 distinct experts uniformly. R0 owns E0 and E1. R1 owns E2 and E3.',
    );
  } else {
    const known = cue(c, 3, 'The request for', 0);
    scene(g, 'Historical V2 sizing', 'How many queue pairs are available?');
    const base = 335,
      unit = 6.7,
      limit = base + unit * budget.pool;
    text(g, '12 communication SMs', 139, 314, 42);
    text(g, 'Allocated pool    128', limit, 347, 32, C.rust, 'center');
    [
      [budget.directRequest, 'Direct', 'min(12, 9)'],
      [budget.hybridRequest, 'Hybrid', '16 × 12 + 1'],
    ].forEach(([n, name, formula], i) => {
      const y = 465 + i * 204,
        used = Math.min(n, budget.pool);
      text(g, name, 120, y + 40, 43);
      rect(g, base, y, unit * n, 83, i ? C.sky : C.pale, C.ink, 2);
      if (known) {
        rect(g, base, y, unit * used, 83, C.teal);
        if (n > used) hatch(g, limit, y, unit * (n - used), 83, C.blue);
      }
      mono(
        g,
        formula + ' = ' + n + ' requested' + (known ? '   /   ' + used + ' used' : ''),
        base,
        y + 122,
        36,
        C.ink,
        'left',
      );
    });
    path(
      g,
      [
        [limit, 377],
        [limit, 760],
      ],
      C.rust,
      3,
      [8, 8],
    );
    note(
      g,
      known
        ? 'The helper caps each request at the allocated pool. It cannot create missing queues.'
        : 'Direct and hybrid use separate request formulas for this same pool.',
    );
  }
}

const schedules = [
  [1, 4, 1],
  [0.7, 4.5, 0.8],
];
export function timing(g, c) {
  const base = cue(c, 0, 'It finishes', 1.1);
  const second = c.beat.beatIndex > 0;
  const go = cue(c, 2, 'The half millisecond saved', 1.6);
  scene(g, 'Warm serial timing', 'Does setting B finish the layer sooner?');
  const left = 312,
    unit = 224,
    colors = [C.teal, C.blue, C.rust],
    names = ['Dispatch', 'Experts', 'Combine'];
  names.forEach((name, i) => {
    rect(g, 345 + i * 493, 302, 38, 38, colors[i], null, 0, 6);
    text(g, name, 405 + i * 493, 322, 36);
  });
  schedules.forEach((parts, i) => {
    if (i === 1 && !second) return;
    const y = 417 + i * 198,
      end = sum(parts);
    text(g, 'Set ' + (i ? 'B' : 'A'), 127, y + 48, 45);
    let pos = 0;
    const fraction = i ? go : base;
    for (const [j, d] of parts.entries()) {
      const x = left + unit * pos;
      const amount = Math.max(0, Math.min(d, end * fraction - pos));
      if (amount > 0) rect(g, x, y, unit * amount, 95, colors[j]);
      pos += d;
    }
    mono(
      g,
      parts.map((v, j) => names[j] + ' ' + v).join('    /    ') + ' ms',
      left,
      y + 143,
      32,
      C.muted,
      'left',
    );
    if (fraction === 1 && (i || c.beat.beatIndex > 0 || c.elapsed >= c.speechDuration))
      mono(g, end + ' ms', 1777, y + 49, 36);
  });
  note(
    g,
    go === 1
      ? 'Communication saves 0.5 ms. Expert computation takes 0.5 ms longer.'
      : 'Same warm routes and correct source rows     /     serial stages     /     one time scale',
  );
}

export function checkSystems() {
  assert.deepEqual(event, {
    dependencyCalls: 2,
    hookCalls: 1,
    results: [['rows', 'indices', 'gates', 'handle'], null],
  });
  assert.equal(capacity.request - (capacity.size - capacity.owned), 1);
  assert.equal(pairs.length, 6);
  assert.equal(pairs.filter((p) => p.count === 1).length, 2);
  assert.equal(visits, 10);
  assert(Math.abs(visits / 6 - destinationExpectation(4, 2, 2)) < 1e-12);
  assert.deepEqual(
    [
      budget.sms,
      budget.pool,
      budget.directRequest,
      budget.hybridRequest,
      budget.direct,
      budget.hybrid,
    ],
    [12, 128, 9, 193, 9, 128],
  );
  assert.deepEqual(schedules.map(sum), [6, 6]);
  assert.equal(schedules[1][1] - schedules[0][1], 0.5);
}

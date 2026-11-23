import {
  bench,
  rect,
  chip,
  line,
  dot,
  txt,
  mono,
  pill,
  frame,
  foot,
  ruler,
  timeBar,
  poly,
  opacity,
  cue,
  on,
  mix,
  smooth,
  paper,
  ink,
  muted,
  teal,
  gold,
  coral,
  lilac,
  blue,
  grid,
} from './bench.mjs';
import {
  original,
  pipeline,
  schedule,
  defaultTimes,
  issueB,
  waitSnapshots,
  eventCalls,
} from './fixtures.mjs';
const math = pipeline(original);
const ops = ['copy', 'affine', 'square', 'reduce'];
const opLabels = ['Copy', '2x + 1', 'Square', 'Sum'];
const opColors = [blue, teal, lilac, gold];

export function pipelineProbe(c, k) {
  const copied = cue(k, 0, 'The copy puts'),
    affine = cue(k, 0, 'That gives five'),
    squared = cue(k, 0, 'you get twenty-five'),
    total = on(k, 1, 'One hundred sixty-four');
  bench(c, 'memory', 'When can the CPU take the sum?', 'VALUE PROBE   /   four-word pipeline');
  const cx = (i) => 486 + i * 179,
    ys = [298, 409, 520, 631];
  rect(c, cx(1) - 65, 250, 130, 456, '#af80484d', 16);
  const data = [math.input, math.input, math.affine, math.squares];
  for (let row = 0; row < 4; row++) {
    txt(c, ['Source', 'Device copy', '2x + 1', 'Square'][row], 116, ys[row] + 29, 39);
    for (let i = 0; i < 4; i++) {
      const a = [1, copied, affine, squared][row];
      chip(c, cx(i) - 52, ys[row], 104, 62, null, { selected: i === 1, empty: a === 0 });
      opacity(c, a, () => mono(c, data[row][i], cx(i), ys[row] + 32, 44, ink));
      if (row < 3)
        line(
          c,
          [
            [cx(i), ys[row] + 71],
            [cx(i), ys[row] + 104],
          ],
          i === 1 ? gold : '#809b97',
          i === 1 ? 6 : 2,
        );
    }
  }
  frame(c, 1176, 271, 605, 441);
  const p = cue(k, 2, 'Move the cursor there', 1.05),
    read = k.beat.beatIndex === 2 && k.elapsed >= k.speechDuration;
  if (k.beat.beatIndex === 0) {
    txt(c, 'Reference sum', 1226, 331, 37, muted);
    mono(c, '?', 1480, 472, 112, paper);
    if (squared) mono(c, math.squares.join(' + '), 1480, 609, 39, paper);
  } else {
    txt(c, 'Reference sum', 1220, 329, 33, muted);
    mono(c, total ? math.result : '?', 1688, 329, 48, gold);
    line(
      c,
      [
        [1220, 379],
        [1733, 379],
      ],
      '#6a8681',
      2,
    );
    txt(c, 'GPU output O', 1220, 441, 37, paper);
    mono(c, p === 1 ? math.result : '·', 1643, 449, 72, p === 1 ? teal : muted);
    txt(c, 'CPU receipt', 1220, 589, 37, paper);
    mono(c, read ? math.result : '·', 1643, 596, 72, read ? teal : muted);
  }
  const showCursor = k.beat.beatIndex >= 1;
  if (!showCursor) {
    foot(c, 'Trace one contribution down the copper column.');
    return;
  }
  const x = 339,
    sc = 128,
    y = 822;
  const times = schedule(true);
  Object.entries(times).forEach(([op, t], i) => {
    const left = x + sc * t.start;
    rect(c, left, y - 40, (t.end - t.start) * sc - 3, 32, opColors[i], 4);
    txt(
      c,
      opLabels[i],
      left + sc * (t.end - t.start) * 0.5,
      y - 24,
      25,
      ink,
      'center',
      'Sans',
      600,
    );
  });
  ruler(c, x, y, sc * 10, 10);
  txt(c, 'Logical ticks', 95, y + 19, 31, muted);
  const cursor = mix(4, times.reduce.end, smooth(p)),
    pos = x + cursor * sc;
  poly(
    c,
    [
      [pos - 12, y - 60],
      [pos + 12, y - 60],
      [pos, y - 44],
    ],
    gold,
  );
  txt(c, 'CPU read', pos, y - 83, 28, gold, 'center');
  foot(
    c,
    read
      ? 'CPU copy complete     ·     caller holds ' + math.result
      : p === 1
        ? 'Device output ready     ·     item() waits and copies O to the CPU'
        : 'Launch return at 4     ·     follow the remaining device work',
    read ? teal : gold,
  );
}
export function traces(c, k) {
  if (k.beat.beatIndex >= 4) {
    gapTrace(c, k);
    return;
  }
  const unplug = cue(k, 2, 'Remove the wait');
  const advance =
    k.beat.beatIndex === 2
      ? k.reveal('start at one', 0.9, { captionStart: 'The transform can start at one' })
      : 0;
  const restore = cue(k, 2, 'Restore the wait', 1.1);
  const shift = smooth(advance) * (1 - smooth(restore));
  const waitOpacity = restore === 1 ? 1 : 1 - unplug;
  const explainOverlap = on(k, 2, 'For two ticks');
  const scoped = k.beat.beatIndex === 3,
    scopeB = on(k, 3, 'Another stream'),
    all = on(k, 3, 'Synchronizing the device');
  const ordered = schedule(true),
    withoutWait = schedule(false),
    x = 355,
    sc = 104;
  bench(
    c,
    'scope',
    scoped ? 'Which work does the CPU wait for?' : 'How early can the reader start?',
    'LOGIC ANALYZER   /   logical ticks',
  );
  const ys = [300, 432, 567, 704],
    max = scoped ? 13 : 10;
  for (let i = 0; i <= max; i++)
    line(
      c,
      [
        [x + i * sc, 278],
        [x + i * sc, 795],
      ],
      '#66837c55',
      1.5,
    );
  const overlapStart = Math.max(
    ordered.copy.start,
    mix(ordered.affine.start, withoutWait.affine.start, shift),
  );
  const overlapEnd = Math.min(
    ordered.copy.end,
    mix(ordered.affine.end, withoutWait.affine.end, shift),
  );
  if (overlapStart < overlapEnd) {
    const left = x + sc * overlapStart;
    const right = x + sc * overlapEnd;
    rect(c, left, ys[1] - 11, right - left, ys[2] - ys[1] + 82, '#a851426b');
    for (const edge of [left, right])
      line(c, [[edge, ys[1] - 11], [edge, ys[2] + 71]], coral, 3);
    if (shift === 1 && explainOverlap)
      txt(c, 'Read / write', (left + right) / 2, ys[1] + 97, 30, coral, 'center');
  }
  for (let j = 0; j < 3 + (scopeB ? 1 : 0); j++)
    txt(c, ['Host issue', 'Copy stream', 'Compute', 'Other stream'][j], 96, ys[j] + 30, 35);
  for (let i = 0; i < 4; i++) timeBar(c, x, ys[0], sc, i, i + 1, opColors[i], i + 1);
  const workShown = on(k, 0, 'The transform runs') || k.beat.beatIndex > 0;
  for (const [i, op] of ops.entries()) {
    if (i > 0 && !workShown) continue;
    const a = ordered[op],
      b = withoutWait[op];
    timeBar(
      c,
      x,
      ys[i ? 2 : 1],
      sc,
      mix(a.start, b.start, shift),
      mix(a.end, b.end, shift),
      opColors[i],
      opLabels[i],
    );
  }
  const edgeX = x + sc * ordered.copy.end;
  opacity(c, waitOpacity, () => {
    line(
      c,
      [
        [edgeX, ys[1] + 60],
        [edgeX, ys[2] - 10],
      ],
      teal,
      6,
    );
    poly(
      c,
      [
        [edgeX - 9, ys[2] - 16],
        [edgeX + 9, ys[2] - 16],
        [edgeX, ys[2] - 1],
      ],
      teal,
    );
    txt(c, 'ready', edgeX + 17, ys[1] + 95, 30, teal);
  });
  if (scopeB) timeBar(c, x, ys[3], sc, 0, 13, '#789798', 'Independent work');
  ruler(c, x, 798, sc * max, max);
  if (scoped)
    foot(
      c,
      all
        ? 'Device synchronization   ·   prior work through tick 13'
        : 'Wait for the event after the sum   ·   tick 10',
    );
  else if (shift === 1 && explainOverlap)
    foot(
      c,
      `Possible overlap at ticks ${overlapStart}–${overlapEnd}   ·   output indeterminate`,
      coral,
    );
  else if (restore > 0 && restore < 1)
    foot(c, 'Restoring the wait moves the first read back to copy completion.', gold);
  else if (unplug > 0 && restore === 0)
    foot(c, `Copy keeps writing until tick ${ordered.copy.end}.`);
  else if (k.beat.beatIndex === 1)
    foot(c, 'Keep the four calls. What changes if this wait comes out?', gold);
  else
    foot(
      c,
      workShown
        ? 'Host 0–4    /    device 0–10    /    through completion 0–10'
        : 'Earliest start = latest of issue, stream availability and producer completion',
    );
}
function jack(c, x, y, color) {
  dot(c, x, y, 20, '#758781');
  dot(c, x, y, 15, '#10252a');
  dot(c, x, y, 8, color);
}
export function events(c, k) {
  const simple = k.beat.beatIndex === 0;
  let actions;
  if (simple) {
    actions = [];
    if (on(k, 0, 'record ready')) actions.push(['record', 3]);
    if (on(k, 0, 'submit a wait')) actions.push(['wait']);
  } else {
    const count = [
      on(k, 1, 'Submit a wait'),
      on(k, 1, 'Now record the copy'),
      on(k, 1, 'submit a second wait'),
      on(k, 2, 'Record again'),
      on(k, 2, 'submit the third wait'),
    ].filter(Boolean).length;
    actions = eventCalls.slice(0, count);
  }
  const state = waitSnapshots(actions);
  bench(
    c,
    'scope',
    'Which recording did this wait see?',
    'EVENT PATCH BAY   /   one handle named ready',
  );
  txt(c, 'Producer recordings', 116, 278, 42);
  txt(c, 'Consumer wait calls', 1170, 278, 42);
  const sy = (i) => 394 + i * 151,
    dy = (i) => 394 + i * 151;
  const names = ['Empty at creation', 'Copy complete', 'Later work complete'];
  for (let i = 0; i < 3; i++) {
    const active = i < state.recordings.length;
    rect(c, 110, sy(i) - 45, 550, 90, active ? '#304e50' : '#223c40', 12);
    mono(c, 'E' + i, 167, sy(i), 40, active ? gold : muted);
    txt(c, names[i], 233, sy(i), 32, active ? paper : muted);
    jack(c, 709, sy(i), active ? gold : '#425f62');
    if (active && i > 0) mono(c, 'tick ' + state.recordings[i], 492, sy(i) + 61, 27, teal);
  }
  for (let i = 0; i < (simple ? 1 : 3); i++) {
    const pick = state.waits[i],
      endX = 1178,
      y = dy(i);
    jack(c, endX, y, pick ? teal : '#425f62');
    if (pick) {
      const startY = sy(pick.generation);
      const color = [gold, teal, lilac][i];
      c.beginPath();
      c.moveTo(709, startY);
      c.bezierCurveTo(897, startY + 106, 997, y + 106, endX, y);
      c.strokeStyle = '#0a2229';
      c.lineWidth = 14;
      c.stroke();
      c.strokeStyle = color;
      c.lineWidth = 7;
      c.stroke();
      jack(c, 709, startY, color);
      jack(c, endX, y, color);
    }
    mono(c, simple ? 'W' : 'W' + i, 1260, y, 43, pick ? paper : muted);
    if (
      pick &&
      (simple ||
        [on(k, 2, 'It can let'), on(k, 2, 'Only the third'), on(k, 2, 'Each wait keeps')][i])
    ) {
      txt(
        c,
        pick.end ? 'through tick ' + pick.end : 'empty work',
        1350,
        y,
        35,
        pick.end ? teal : gold,
      );
    }
  }
  const current = state.recordings.length - 1;
  foot(
    c,
    'Handle now holds E' +
      current +
      '     /     ' +
      (simple
        ? 'record on producer, then wait on consumer'
        : k.beat.beatIndex === 1
          ? 'follow each cable back to its socket'
          : 'earlier waits retain their recordings'),
  );
}
export function streams(c, k) {
  if (k.beat.beatIndex === 2) {
    storageOverlap(c, k);
    return;
  }
  bench(
    c,
    'scope',
    'Which streams can overlap?',
    'DEFAULT STREAM   /   same context, no contention',
  );
  const x = 390,
    sc = 129,
    starts = defaultTimes(),
    ys = [309, 432, 555, 678];
  for (let i = 0; i <= 10; i++)
    line(
      c,
      [
        [x + i * sc, 267],
        [x + i * sc, 794],
      ],
      '#63847c55',
      2,
    );
  const visible = [
    true,
    on(k, 0, 'then runs from five'),
    on(k, 0, 'Then B runs'),
  ];
  const wait = cue(k, 0, 'B waits from tick two', 1.3);
  const runN = cue(k, 1, 'from one to three', 0.95);
  const explainN = on(k, 1, 'opts out of the legacy edges');
  if (wait > 0) {
    const left = x + sc * issueB,
      right = x + sc * starts[2][0],
      y = ys[2] + 31;
    line(c, [[left, y - 9], [left, y], [right, y], [right, y - 9]], muted, 3);
    const front = mix(left, right, smooth(wait));
    line(c, [[left, y], [front, y]], blue, 4);
    dot(c, front, y, 7, blue);
    txt(c, 'Waiting for legacy', (left + right) / 2, y - 28, 32, muted, 'center');
    if (visible[2]) line(c, [[right, ys[1] + 60], [right, ys[2] - 8]], lilac, 4);
  }
  ['Blocking A', 'Legacy', 'Blocking B', 'Nonblocking N'].forEach((s, i) => {
    txt(c, s, 92, ys[i] + 32, 36, i === 3 ? gold : paper);
    const [a, b] = starts[i];
    if (i < 3 && visible[i]) {
      timeBar(c, x, ys[i], sc, a, b, [teal, lilac, blue][i], a + '–' + b);
    }
    if (i !== 3) return;
    const issue = x + sc * a;
    const y = ys[i];
    if (runN === 0) {
      dot(c, issue, y + 30, 9, gold);
      txt(c, 'Issued at ' + a + '   /   duration ' + (b - a), issue + 25, y + 30, 35, gold);
      return;
    }
    if (runN === 1) {
      timeBar(c, x, y, sc, a, b, gold, a + '–' + b);
    } else {
      const front = mix(issue, x + sc * b, smooth(runN));
      line(c, [[issue, y + 30], [front, y + 30]], gold, 18);
      dot(c, front, y + 30, 11, gold);
    }
    if (explainN) txt(c, 'No implicit legacy dependency', x + sc * b + 30, y + 30, 35, gold);
  });
  ruler(c, x, 798, sc * 10, 10);
  txt(
    c,
    runN === 1
      ? 'N can run during A if resources permit.'
      : 'A precedes legacy work. Later blocking work waits for legacy.',
    92, 858, 35, teal,
  );
}
function storageOverlap(c, k) {
  bench(
    c,
    'memory',
    'Where can the next transfer land?',
    'OVERLAP PROBE   /   two disjoint buffer regions',
  );
  const copy = cue(k, 2, 'Copy into disjoint slot B', 1.1),
    release = cue(k, 2, 'after its last reader finishes', 0.7);
  function socket(y, name, words, owner, color) {
    frame(c, 582, y, 766, 161);
    txt(c, 'Slot ' + name, 609, y + 80, 39);
    for (let i = 0; i < 4; i++)
      chip(c, 774 + i * 137, y + 45, 98, 66, words ? words[i] : null, { empty: !words });
    pill(c, 1391, y + 56, 376, owner, color);
  }
  txt(c, 'Pinned host batch', 120, 558, 37, blue);
  frame(c, 116, 610, 260, 122);
  mono(c, 'H2', 246, 673, 55, blue);
  line(
    c,
    [
      [376, 672],
      [572, 672],
    ],
    blue,
    4,
  );
  socket(
    342,
    'A',
    ['a₁', 'a₂', 'a₃', 'a₄'],
    release === 1 ? 'Reader finished' : 'Kernel reading A',
    release === 1 ? teal : gold,
  );
  socket(
    604,
    'B',
    copy === 1 ? ['b₁', 'b₂', 'b₃', 'b₄'] : null,
    copy === 1 ? 'Copy landed in B' : copy > 0 ? 'Transfer in flight' : 'Available',
    blue,
  );
  if (copy > 0 && copy < 1) {
    const x = mix(392, 555, copy);
    dot(c, x, 672, 15, blue);
  }
  foot(c, 'Pinned host source   ·   asynchronous copy   ·   copy engine available');
}
function gapTrace(c, k) {
  bench(
    c,
    'scope',
    'Which five-microsecond gap can the host close?',
    'PROFILER TRACE   /   same device gap, different cause',
  );
  const x = 387,
    sc = 125,
    reveal = on(k, 5, 'The first one'),
    second = on(k, 4, 'In the second');
  const yA = 390,
    yB = 677;
  for (const [row, y] of [
    [0, yA],
    [1, yB],
  ]) {
    if (row && !second) continue;
    const issue = row ? 2 : 8;
    txt(c, row ? 'Trace B' : 'Trace A', 105, y + 30, 44);
    const xx = x + issue * sc;
    line(
      c,
      [
        [xx, y - 12],
        [xx, y - 59],
      ],
      gold,
      5,
    );
    dot(c, xx, y - 59, 8, gold);
    txt(c, 'CPU issue at ' + issue, xx, y - 94, 32, gold, 'center');
    timeBar(c, x, y, sc, 0, 3, teal, 'Kernel');
    timeBar(c, x, y, sc, 8, 10, teal, 'Next kernel');
    line(
      c,
      [
        [x + 3 * sc + 3, y + 32],
        [x + 8 * sc - 4, y + 32],
      ],
      '#678480',
      2,
    );
    if (row) {
      line(
        c,
        [
          [x + 2 * sc, y + 86],
          [x + 8 * sc, y + 86],
          [x + 8 * sc, y + 63],
        ],
        lilac,
        4,
      );
      txt(c, 'copy in progress', x + 5 * sc, y + 110, 28, lilac, 'center');
    }
    if (reveal)
      txt(
        c,
        row ? 'Waiting on copy' : 'Waiting for host',
        x + 5.5 * sc,
        y + 9,
        35,
        row ? lilac : gold,
        'center',
      );
  }
  ruler(c, x, 819, 10 * sc, 10);
  foot(
    c,
    reveal
      ? 'A   ·   try graph replay        /        B   ·   trace the producer event'
      : 'Device time (µs)    /    a gap alone does not identify its cause',
  );
}

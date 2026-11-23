import {
  C,
  fmt,
  text,
  mono,
  fill,
  line,
  dot,
  path,
  strip,
  pointer,
  ticks,
  bracket,
  words,
  heading,
  cue,
} from './recorder.mjs';
import {
  deadline,
  overhead,
  baseline,
  lost,
  saved,
  firstAdaptiveMovement,
  owner,
  hostGB,
  reader,
} from './run.mjs';

export function timingBench(g, s, phase, answer, sweep = null, showMargin = answer) {
  const x = 120,
    w = 1660,
    y = 515,
    scale = w / s.total;
  const ends = [0, s.finish, s.finish + s.save, s.total];
  strip(g, x - 20, y - 75, w + 40, 220);
  const parts = [
    ['Finish window', s.finish, C.sky],
    ['Save through publication', s.save, C.mint],
    ['Margin', s.margin, C.straw],
  ];
  parts.forEach(([name, v, col], i) => {
    if (i >= phase) return;
    const left = x + scale * ends[i],
      width = scale * v;
    fill(g, left, y, width - 2, 84, col);
    mono(g, v + ' s', left + width / 2, y + 56, width < 185 ? 37 : 47, C.ink, 'center');
    text(
      g,
      name,
      left + width / 2,
      y + (i === 2 ? -107 : -104),
      width < 185 ? 29 : 36,
      C.ink,
      'center',
    );
  });
  ticks(g, x, y + 96, w, 12, 12);
  if (phase >= 4) {
    const stop = x + s.warning * scale;
    line(g, stop, y - 41, stop, y + 139, C.red, 5);
    pointer(g, stop, y - 35);
    mono(g, 'Warning ends at ' + s.warning + ' s', stop, y + 202, 38, C.red, 'right');
  }
  if (sweep !== null) {
    const t = s.total * sweep;
    fill(g, x, y + 84, scale * t, 9, C.ink);
    dot(g, x + scale * t, y + 88, 9, C.ink);
  }
  if (answer) {
    mono(
      g,
      s.finish + ' + ' + s.save + ' + ' + s.margin + ' = ' + s.total + ' s',
      119,
      819,
      54,
      C.ink,
    );
  }
  if (showMargin) {
    text(
      g,
      s.fit
        ? 'Fits at the estimate'
        : 'Margin available  ' + s.spare + ' s  /  ' + s.margin + ' s required',
      120,
      909,
      42,
      s.fit ? C.teal : C.red,
    );
  }
}
export function warning(g, k) {
  const b = k.beat.beatIndex,
    shortened = cue(k, 2, 'one second'),
    s = deadline(shortened ? 119 : 120, 20, 90, 10);
  heading(
    g,
    'AFTER ROUND E   /   all workers healthy',
    shortened ? 'The warning now lasts 119 seconds' : 'Does the save leave its required margin?',
  );
  const phase = cue(k, 0, 'two minutes')
    ? 4
    : cue(k, 0, 'ten seconds')
      ? 3
      : cue(k, 0, 'ninety')
        ? 2
        : cue(k, 0, 'twenty seconds')
          ? 1
          : 0;
  timingBench(g, s, phase, b === 1 || b === 3);
  if (b === 2) mono(g, '20 + 90 + 10 = 120 s', 119, 819, 54, C.ink);
}
export function intervals(g, k) {
  const b = k.beat.beatIndex;
  if (b < 3) {
    heading(
      g,
      'PERIODIC CHECKPOINTS   /   blocking save costs 90 s',
      b === 0 ? 'Abrupt loss between two saves' : 'How much wall time goes to saves?',
    );
    if (b === 0) {
      const x = 158,
        y = 535,
        w = 1525;
      ticks(g, x, y, w, 5, 29);
      for (let i = 0; i <= 5; i++)
        mono(g, i + ' min', x + (i * w) / 5, y + 84, 34, C.dim, 'center');
      dot(g, x, y, 17, C.teal);
      text(g, 'Published', x, y - 62, 40, C.teal);
      if (cue(k, 0, 'three minutes')) {
        fill(g, x, y - 24, w * 0.6, 15, C.straw);
        pointer(g, x + w * 0.6, y - 27);
        text(g, 'Node lost', x + w * 0.6, y - 93, 46, C.red, 'center');
        bracket(g, x, y + 120, w * 0.6, '3 minutes to replay', C.gold);
      }
      return;
    }
    const second = cue(k, 1, 'Wait twenty minutes');
    [300, 1200].slice(0, second ? 2 : 1).forEach((v, i) => {
      const y = 375 + i * 236,
        start = 143,
        scale = 1.14;
      text(g, 'Compute ' + fmt(v) + ' s', start, y - 24, 38, C.ink);
      fill(g, start, y, v * scale, 82, C.sky);
      fill(g, start + v * scale, y, 90 * scale, 82, C.straw);
      mono(g, '90 s', start + (v + 45) * scale, y + 53, 32, C.ink, 'center');
      mono(
        g,
        '90 / ' + fmt(v + 90) + ' = ' + (100 * overhead(v)).toFixed(1) + '%',
        start,
        y + 142,
        36,
        C.teal,
      );
    });
    if (b === 2)
      text(g, 'The live run stays exposed until the upload is published.', 142, 948, 40, C.dim);
  } else {
    heading(
      g,
      'INTERRUPTION RECORD   /   Llama 3 report',
      'What sets the interval on your cluster?',
    );
    const n = [419, 47];
    ['Unexpected', 'Planned'].forEach((s, i) => {
      const y = 369 + i * 138;
      text(g, s, 126, y + 53, 41, C.ink);
      fill(g, 495, y, 2.38 * n[i], 69, i ? C.sky : C.straw);
      mono(g, n[i], 525 + 2.38 * n[i], y + 53, 48, C.ink);
    });
    text(g, '54 days observed   ·   configurations up to 16,384 H100s', 128, 682, 38, C.dim);
    if (b === 4)
      words(
        g,
        [
          'MTBF(job) = MTBF(device) / device count',
          'Identical independent constant rates. Any one failure stops the job.',
          'Shared power, network or software faults require a different model.',
        ],
        128,
        788,
        38,
      );
  }
}

export function trajectory(g, k) {
  const b = k.beat.beatIndex,
    step =
      b === 0
        ? Math.floor(7 * cue(k, 0, 'Watch one weight', 2))
        : b === 1
          ? 7
          : 7 + Math.floor(5 * cue(k, 2, 'Trace their weights', 2.4));
  heading(
    g,
    'SCALAR ADAM   /   same targets, same learning rates',
    b < 2 ? 'Stop the trace at update seven' : 'Five updates from the same weight',
  );
  const x = 180,
    y = 815,
    w = 1128,
    h = 438,
    xx = (i) => x + (w * i) / 12,
    yy = (v) => y - (v * h) / 0.15;
  for (const v of [0, 0.05, 0.1, 0.15]) {
    line(g, x, yy(v), x + w, yy(v), C.edge, 2);
    mono(g, v.toFixed(2), x - 20, yy(v) + 11, 29, C.dim, 'right');
  }
  for (const i of [0, 4, 7, 12]) mono(g, i, xx(i), y + 55, 33, C.dim, 'center');
  text(g, 'Weight', x, 312, 35, C.dim);
  text(g, 'Successful update', x + 420, y + 135, 36, C.dim);
  line(g, xx(7), y - h, xx(7), y, C.gold, 3);
  const pts = baseline.slice(0, step + 1).map((s, i) => [xx(i), yy(s.w)]);
  path(g, pts, C.teal, false, 7);
  pts.forEach(([a, b]) => dot(g, a, b, 6, C.teal));
  if (b >= 2) {
    const p = lost.slice(0, step - 7 + 1).map((s, i) => [xx(i + 7), yy(s.w)]);
    path(g, p, C.red, false, 4);
    p.forEach(([a, b]) => dot(g, a, b, 4, C.red));
  }
  mono(g, 'UPDATE ' + step, 1398, 393, 36, C.dim);
  text(g, 'Full state', 1398, 494, 40, C.teal);
  mono(g, baseline[step].w.toFixed(6), 1398, 563, 54, C.teal);
  const cleared = cue(k, 1, 'clear them');
  if (b === 1) {
    mono(g, 'm  ' + saved.m.toFixed(4) + '  v  ' + saved.v.toFixed(4), 1398, 608, 26, C.teal);
    if (cleared) mono(g, 'm = v = 0', 1398, 800, 30, C.red);
  }
  if (cleared) {
    text(g, 'Moments cleared', 1398, 674, 38, C.red);
    mono(g, lost[step - 7].w.toFixed(6), 1398, 746, 54, C.red);
  }
}
export function adam(g, k) {
  const b = k.beat.beatIndex;
  if (b < 3) {
    heading(
      g,
      'CHECKPOINT CONTENTS',
      b === 0
        ? 'Start a new run from saved weights'
        : b === 1
          ? 'Reopen an experiment'
          : 'Serving an adapter or continuing it',
    );
    const items =
      b === 0
        ? [
            ['Weights', 'Reuse compatible parameters'],
            ['Moments + step', 'Initialize optimizer state'],
            ['Data + schedule', 'New sampler and warmup'],
          ]
        : b === 1
          ? [
              ['Model', 'Architecture, weights and buffers'],
              ['Optimizer', 'Moments, counters and parameter groups'],
              ['Next input', 'Schedule, sampler, cursor, RNG and scaler'],
            ]
          : [
              ['Tuning', 'Base revision + adapter configuration'],
              ['Continuation', 'Adapter, optimizer and data state'],
              ['Inference', 'Merged weights + serving assets'],
            ];
    items.forEach(([t, d], i) => {
      const y = 330 + i * 165;
      strip(g, 120, y, 1665, 123);
      text(g, t, 155, y + 78, 46, C.teal, 'left', 'Serif');
      text(g, d, 688, y + 78, 39, C.ink);
    });
    if (b === 2)
      text(g, 'Kernel or topology changes can affect bitwise replay.', 129, 919, 35, C.dim);
    return;
  }
  if (b < 6) {
    heading(g, 'FRESH ADAM   /   moments and step reset', 'How far can one adaptive step move?');
    text(g, 'First gradient g   ·   weight decay excluded', 124, 312, 39, C.dim);
    mono(g, 'Corrected moments:  g  and  g²', 125, 450, 59, C.ink);
    if (cue(k, 3, 'Add epsilon')) mono(g, '√(g²) + ε = |g| + ε', 123, 560, 55, C.ink);
    if (b >= 4) mono(g, '|Δw| = η |g| / (|g| + ε) ≤ η', 122, 692, 53, C.teal);
    if (b === 5) {
      const rate = 0.002,
        eps = 1e-8;
      [1e-9, 1e-6].slice(0, cue(k, 5, 'a hundred times') ? 2 : 1).forEach((v, i) => {
        const y = 815 + i * 107,
          val = firstAdaptiveMovement(v, rate, eps);
        mono(g, 'g = ' + (i ? '100ε' : '0.1ε'), 125, y, 38, C.ink);
        fill(g, 490, y - 31, 688, 33, C.pale);
        fill(g, 490, y - 31, (688 * val) / rate, 33, C.teal);
        mono(g, val.toFixed(6) + '   (η = 0.002)', 1215, y, 34, C.teal);
      });
    }
    return;
  }
  heading(g, 'STEP COUNTER RETAINED   /   update 7 → 12', 'Read the fork under magnification');
  const x = 217,
    w = 1345,
    y = (v) => 787 - (v - 0.084) * 9510;
  for (const v of [0.09, 0.1, 0.11, 0.12, 0.13]) {
    line(g, x, y(v), x + w, y(v), C.edge, 2);
    mono(g, v.toFixed(2), x - 17, y(v) + 10, 29, C.dim, 'right');
  }
  for (const [i, use] of [baseline.slice(7), lost].entries()) {
    if (i === 1 && b === 6) continue;
    path(
      g,
      use.map((s, j) => [x + (w * j) / 5, y(s.w)]),
      i ? C.red : C.teal,
      false,
      6,
    );
    use.forEach((s, j) => dot(g, x + (w * j) / 5, y(s.w), 6, i ? C.red : C.teal));
    mono(g, use[5].w.toFixed(6), x + w + 12, y(use[5].w) + (i ? -15 : 39), 31, i ? C.red : C.teal);
  }
  for (let i = 0; i <= 5; i++) mono(g, i + 7, x + (w * i) / 5, 858, 32, C.dim, 'center');
  text(g, 'Full state', 122, 949, 35, C.teal);
  if (b === 7) text(g, 'Moments cleared, step retained', 573, 949, 35, C.red);
}

// The cell centres never move. A new bracket is the only change of owner.
export function tensor(
  g,
  { n, oldWidth, newWidth, probe, showNew = 0, mark = false, caption, values = false },
) {
  const x = 113,
    y = 466,
    w = 1694,
    dx = w / n;
  const focus = n === 16 ? [6, 7] : [probe];
  text(g, 'Saved rank', x, 312, 33, C.dim);
  for (let i = 0; i < n; i += oldWidth)
    bracket(
      g,
      x + i * dx + 3,
      y - 24,
      oldWidth * dx - 6,
      'R' + owner(i, oldWidth),
      C.blue,
      true,
      32,
    );
  strip(g, x - 12, y - 8, w + 24, values ? 205 : 152);
  for (let i = 0; i < n; i++) {
    const xx = x + i * dx,
      hit = focus.includes(i);
    fill(g, xx + 2, y + 32, dx - 4, values ? 122 : 66, hit ? C.straw : C.pale);
    mono(g, i, xx + dx / 2, y + 81, n > 20 ? 35 : 43, C.ink, 'center');
    if (values) mono(g, (i - 5).toFixed(1), xx + dx / 2, y + 135, 30, C.dim, 'center');
  }
  const bottom = y + (values ? 203 : 157);
  if (showNew) {
    g.save();
    g.globalAlpha = showNew;
    for (let i = 0; i < n; i += newWidth)
      bracket(
        g,
        x + i * dx + 3,
        bottom,
        newWidth * dx - 6,
        'R' + owner(i, newWidth),
        C.teal,
        false,
        32,
      );
    g.restore();
    text(g, 'Replacement rank', x, bottom + 128, 34, C.teal);
  }
  if (mark) text(g, caption, x, 934, 47, C.ink, 'left', 'Serif');
}
export function reshard(g, k) {
  const b = k.beat.beatIndex;
  heading(
    g,
    'GLOBAL TENSOR   /   coordinates above, values below',
    b === 1 ? 'Eight ranks will reopen the tensor' : 'Follow coordinates six and seven',
  );
  const reveal = cue(k, 2, 'Each new owner', 0.65),
    named = cue(k, 2, 'Destination rank three');
  tensor(g, {
    n: 16,
    oldWidth: 4,
    newWidth: 2,
    probe: 6,
    showNew: reveal,
    mark: named,
    caption: 'Saved R1 [4, 8)     →     replacement R3 [6, 8)',
    values: true,
  });
}
export function readerMemory(g, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    heading(
      g,
      'CONSOLIDATED SAVE   /   70 billion parameters',
      'Gather the weights and both Adam moments',
    );
    const count = cue(k, 0, 'two moments and the weights')
      ? 3
      : cue(k, 0, 'Each four-byte Adam moment')
        ? 2
        : 1;
    let x = 120;
    hostGB.forEach((v, i) => {
      if (i >= count) return;
      const w = v * 2.4;
      fill(g, x, 442, w - 3, 235, [C.sky, C.pale, C.straw][i]);
      text(g, ['BF16 weights', 'FP32 moment 1', 'FP32 moment 2'][i], x + 24, 525, 34, C.ink);
      mono(g, v + ' GB', x + 24, 626, 57, C.ink);
      x += w;
    });
    if (count === 3) {
      bracket(
        g,
        120,
        700,
        1680,
        '700 decimal GB before master weights and buffers',
        C.teal,
        false,
        37,
      );
    }
    return;
  }
  heading(
    g,
    'DISTRIBUTED CHECKPOINT   /   source coordinates 8–15',
    'Read two coordinates from an eight-value source',
  );
  const x = 128,
    dx = 204,
    y = 422;
  text(g, 'Serialized source tensor', x, 344, 39, C.dim);
  reader.source.forEach((v, i) => {
    const use = reader.destination.includes(v);
    fill(g, x + i * dx, y, dx - 5, 117, use ? C.straw : C.pale);
    mono(g, v, x + i * dx + dx / 2, y + 81, 54, C.ink, 'center');
  });
  bracket(g, x + 2 * dx, y + 129, 2 * dx - 5, 'destination [10, 12)', C.teal);
  if (cue(k, 4, 'loads the serialized source tensor')) {
    bracket(g, x, y - 9, 8 * dx - 5, 'CPU deserialization buffer: 8 values', C.blue, true);
    words(
      g,
      [
        'The reader narrows the loaded tensor to return 2 values.',
        b === 5
          ? 'Test the reader, optimizer mapping and data partition on the target stack.'
          : 'Physical reads and peak RAM depend on the reader and format.',
      ],
      127,
      796,
      39,
    );
  } else if (b === 3)
    text(g, 'Intersect global ranges. Check for gaps and overlaps.', 127, 819, 41, C.dim);
}

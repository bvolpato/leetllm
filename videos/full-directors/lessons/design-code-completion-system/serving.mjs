import {
  C,
  box,
  cap,
  txt,
  mono,
  line,
  headline,
  strip,
  cue,
  ease,
  badge,
  mid,
  bar,
  num,
} from './drawing.mjs';
import {
  stages,
  immediate,
  objective,
  debounce,
  completeTraceQuantiles,
  cache,
  service,
  p,
  q,
  accepted,
  correction,
  loads,
  promptLengths,
  incomingTokens,
  batchSteps,
} from './model.mjs';

const palette = ['#7d799b', '#4b75bd', '#4f918a', '#e3a755', '#cd8371'];
export function timing(g, c) {
  headline(g, c, 'SINGLE-LINE EXPRESSION   /   latency worksheet');
  const visible = stages.map((_, i) =>
    cue(
      c,
      0,
      [
        'client handling',
        'on transport',
        'on context',
        'through a usable span',
        'checking and painting',
      ][i],
    ),
  );
  const first = cue(c, 0, 'seventeen inside'),
    wait = cue(c, 1, 'before submitting'),
    last = cue(c, 2, 'The wait crosses');
  const x = 375,
    scale = 4,
    limit = x + objective * scale;
  stages.forEach((s, i) => {
    if (!visible[i]) return;
    const xx = 103 + i * 347;
    box(g, xx, 295, 14, 78, palette[i]);
    cap(g, s.label, xx + 28, 323);
    mono(g, s.ms + ' ms', xx + 28, 372, 39);
  });
  line(g, x, 447, x + 350 * scale, 447);
  for (const n of [0, 50, 100, 150, 200, 250, 300, 350]) {
    line(g, x + n * scale, 442, x + n * scale, 456);
    mid(g, n, x + n * scale, 430, 26, C.muted);
  }
  function path(y, debounced, complete) {
    txt(g, debounced ? 'Typing pause' : 'Immediate', 100, y + 45, 39);
    let t = 0;
    if (debounced) {
      bar(g, x, y, debounce * scale, 64, '#b4adc9');
      mid(g, 'wait 150', x + (debounce * scale) / 2, y + 43, 33, C.ink);
      t = debounce;
    }
    if (!debounced || complete)
      stages.forEach((s, i) => {
        if (!visible[i]) return;
        bar(g, x + t * scale, y, s.ms * scale, 64, palette[i]);
        t += s.ms;
      });
    if (complete) {
      const end = x + t * scale;
      line(g, end, y - 6, end, y + 70, C.ink, 3);
      mono(g, t + ' ms', end - 139, y + 113, 37);
    } else if (debounced) mono(g, '+ same five stages', x + 65, y + 108, 35, C.muted);
  }
  path(483, false, first);
  if (wait) path(660, true, last);
  line(g, limit, 454, limit, 755, C.red, 4);
  cap(g, objective + ' ms scenario target', limit + 16, 796, C.red);
  strip(
    g,
    last
      ? '333 ms from edit to paint. The 150 ms timer consumes the original 17 ms of headroom.'
      : wait
        ? 'Start both clocks at the qualifying edit. Where does the second bar end?'
        : first
          ? '183 ms from edit to paint leaves 17 ms in this allocation.'
          : 'One clock runs until a fresh span reaches the screen.',
  );
}
const traces = completeTraceQuantiles();
export function quantiles(g, c) {
  headline(g, c, 'OBSERVED REQUESTS   /   synthetic trace sample');
  const sorted = cue(c, 1, 'Sort the twenty'),
    answer = cue(c, 2, 'Eighteen requests'),
    stage = cue(c, 2, 'gives only two milliseconds');
  const x = 134,
    y = 341,
    cell = 79,
    unit = cell - 6;
  cap(g, sorted ? 'TWENTY TOTALS IN ASCENDING ORDER' : 'TWENTY REQUESTS IN ARRIVAL ORDER', x, 290);
  const entries = sorted ? [...traces.rows].sort((a, b) => a.total - b.total) : traces.rows;
  for (const [i, row] of entries.entries()) {
    const xx = x + i * cell;
    box(g, xx, y, unit, 236, C.sheet, 6);
    const scale = 1.55,
      base = y + 191;
    bar(g, xx + 14, base - row.a * scale, unit - 28, row.a * scale, C.blue);
    bar(g, xx + 14, base - row.total * scale, unit - 28, row.b * scale, C.orange);
    mid(g, sorted ? i + 1 : '#' + row.id, xx + unit / 2, y + 225, 24, C.muted);
    if (sorted && i === traces.rank - 1) {
      line(g, xx, y + 247, xx + unit, y + 247, C.red, 6);
    }
  }
  box(g, 134, 653, 21, 31, C.blue);
  txt(g, 'A', 171, 680, 35);
  box(g, 244, 653, 21, 31, C.orange);
  txt(g, 'B', 281, 680, 35);
  mono(g, '#1   100 + 1', 405, 681, 36);
  mono(g, '#2   1 + 100', 837, 681, 36);
  mono(g, '18 others   1 + 1', 1279, 681, 36);
  if (sorted) cap(g, 'Rank 19 of 20', 134, 786);
  if (answer) txt(g, 'Whole-request p95    ' + traces.complete + ' ms', 463, 788, 48, C.green);
  if (stage) txt(g, 'Stage p95s    1 + 1 = ' + traces.stageSum + ' ms', 1201, 788, 38, C.muted);
  strip(
    g,
    answer
      ? 'Two different requests are slow. Both land in the tail of the sum.'
      : sorted
        ? 'Read the nineteenth complete request on the sorted strip.'
        : 'Each column stacks the two durations from one request.',
  );
}
export function cached(g, c) {
  headline(g, c, 'INFERENCE ROUTER   /   compatible workers');
  const warm = cue(c, 0, 'On the warm worker'),
    dec = cue(c, 0, 'decoding the output'),
    totals = cue(c, 1, 'Now put');
  const wait = cue(c, 1, 'Now put seventy milliseconds');
  let shift = 0;
  if (c.beat.beatIndex === 2) {
    const comparison = 'less than the extra wait';
    c.reveal(comparison, 0, { captionStart: comparison });
    const phrase = 'one hundred five milliseconds';
    const { start, end } = c.wordCue(phrase);
    const reached = c.reveal(phrase, end - start, {
      captionStart: 'The warm route now takes',
    }) === 1;
    shift = reached ? ease(Math.min(1, Math.max(0, (c.elapsed - end) / 1.1))) : 0;
  }
  const settled = shift === 1;
  const edited = cue(c, 2, 'An early token edit'),
    other = cue(c, 2, 'A different tenant');
  const x = 385;
  const detail = (message) => {
    g.save();
    g.translate(0, -45);
    strip(g, message);
    g.restore();
  };
  cap(
    g,
    other
      ? 'CACHE ELIGIBILITY   /   another tenant'
      : edited
        ? 'CACHE ELIGIBILITY   /   token changed in block 3'
        : 'INPUT   /   100 header tokens per tile',
    100,
    310,
  );
  for (let i = 0; i < 12; i++) {
    const usable = warm && !other && (!edited || i < 2);
    box(g, 100 + i * 120, 339, 114, 74, usable ? C.mint : C.sky, 5);
    mid(
      g,
      i === 2 && edited ? 'edit' : String(i + 1),
      157 + i * 120,
      390,
      33,
      usable ? C.green : C.blue,
    );
  }
  box(g, 1540, 339, 96, 74, C.gold, 4);
  mid(g, '+80', 1588, 389, 31, C.ink);
  if (edited || other) {
    txt(
      g,
      other
        ? 'A new tenant has no permitted blocks here.'
        : 'Only the first two whole blocks still match.',
      105,
      563,
      62,
      C.ink,
      { font: 'Serif' },
    );
    mono(
      g,
      other ? '0 of 1,200 header tokens reusable' : '200 of 1,200 header tokens reusable',
      105,
      674,
      46,
      C.green,
    );
    detail('Prefill the unmatched input and verify the editor snapshot before a result paints.');
    return;
  }
  const scale = 10.7;
  const coldService = service(false);
  const warmService = service(true);
  const warmExtra = cache.extra;
  const saving = cache.miss - cache.hit;
  const coldEnd = x + coldService * scale;
  const originalWarmEnd = x + warmService * scale;

  if (wait) {
    g.save();
    g.setLineDash([8, 8]);
    line(g, coldEnd, 553, coldEnd, 751, C.blue, 3);
    g.restore();
  }
  function row(y, isWarm) {
    const extra = isWarm ? shift * warmExtra : 0;
    const pre = isWarm ? cache.hit : cache.miss;
    txt(g, isWarm ? 'Warm worker' : 'Cold worker', 103, y + 48, 42);
    let at = x + extra * scale;
    if (extra > 0) {
      box(g, x, y, extra * scale, 67, '#b8abc7');
      if (extra > 21)
        mid(g, settled ? 'queue ' + warmExtra : 'queue', x + (extra * scale) / 2, y + 43, 32, C.ink);
    }
    const parts = [
      [pre, 'prefill', '#aec8f6'],
      ...(dec ? [[cache.decode, 'decode', '#f5cb88']] : []),
    ];
    for (const [ms, label, color] of parts) {
      box(g, at, y, ms * scale, 67, color);
      mid(g, label + ' ' + ms, at + (ms * scale) / 2, y + 43, 32, C.ink, ms * scale - 9);
      at += ms * scale;
    }
    if (totals && (!isWarm || shift === 0 || settled)) {
      const result = isWarm ? service(true, settled ? warmExtra : 0) : coldService;
      mono(
        g,
        result + (isWarm && wait && !settled ? ' ms service' : ' ms'),
        at + 20,
        y + 48,
        40,
        settled && !isWarm ? C.green : C.ink,
      );
    }
    if (isWarm && wait && shift === 0)
      badge(g, 'Extra queue    +' + warmExtra + ' ms', 1295, y + 3, 449, '#ddd5e7', C.ink);
  }
  row(485, false);
  if (warm) row(655, true);
  if (shift > 0) {
    line(g, originalWarmEnd, 727, originalWarmEnd, 749, C.rule, 4);
    mid(g, warmService + ' ms without extra wait', originalWarmEnd, 785, 29, C.muted);
  }
  detail(
    settled
      ? 'Choose cold. The extra ' + warmExtra + ' ms wait exceeds the ' + saving + ' ms prefill saving.'
      : shift > 0
        ? 'Same prefill and decode. The queue shifts the warm finish time.'
        : wait
          ? 'Add the warm queue to the same service times. Which route finishes first?'
          : 'A compatible hit reuses input computation. Both workers generate the proposed output.',
  );
}
export function speculative(g, c) {
  headline(g, c, 'SPECULATIVE DECODING   /   target verification');
  if (c.beat.beatIndex === 0) {
    const check = cue(c, 0, 'keeps four'),
      fix = cue(c, 0, 'corrects the fifth');
    const toks = ['graph', '.', 'allows', '(', 'user'];
    for (const [i, tok] of toks.entries()) {
      const x = 304 + 291 * i;
      box(g, x, 376, 269, 115, C.sky, 10);
      mid(g, tok, x + 134, 452, 50, C.blue);
      if ((check && i < 4) || (fix && i === 4)) {
        box(g, x, 575, 269, 115, i === 4 ? C.gold : C.mint, 10);
        mid(g, i === 4 ? 'request' : tok, x + 134, 650, 50, C.ink);
      }
    }
    cap(g, 'DRAFT', 104, 444);
    cap(g, 'EMIT', 104, 646);
    strip(
      g,
      fix
        ? 'Four verified draft tokens plus one correction produce five output tokens.'
        : 'The target checks a run of proposed tokens in one pass.',
    );
    return;
  }
  const ans = cue(c, 2, 'On rejection'),
    diff = cue(c, 2, 'keep the positive differences'),
    norm = cue(c, 2, 'Sampling the correction');
  const colors = [C.blue, C.green, C.orange],
    labels = ['A', 'B', 'C'];
  cap(g, 'SAME THREE TOKEN IDS', 102, 300);
  const rr = [
    ['Draft   q', q],
    ['Target   p', p],
    ...(diff ? [['Positive (p − q)', correction.residual]] : []),
    ...(norm ? [['Correct   ÷ ' + correction.mass.toFixed(1), correction.probabilities]] : []),
  ];
  rr.forEach(([name, vs], j) => {
    const yy = 345 + 113 * j;
    txt(g, name, 101, yy + 54, 37);
    vs.forEach((v, i) => {
      const xx = 496 + i * 439;
      box(g, xx, yy + 12, 390, 63, C.sheet, 5);
      bar(g, xx, yy + 68, 390 * v, 8, colors[i]);
      mono(
        g,
        labels[i] + '  ' + (j === 3 ? ['0', '1/3', '2/3'][i] : v.toFixed(1)),
        xx + 24,
        yy + 57,
        39,
        i === 0 && j < 2 ? C.blue : C.ink,
      );
    });
  });
  strip(
    g,
    ans
      ? 'Proposed A  •  min(1, p(A) / q(A)) = min(1, 0.2 / 0.5) = ' +
          Math.round(accepted * 5) +
          '/5'
      : 'The draft selected A. What is min(1, p(A) / q(A)) for this proposal?',
  );
}
function batch(g, c) {
  const cancelled = cue(c, 4, 'That frees one slot');
  const joined = cue(c, 5, 'C starts prefill');
  const done = cue(c, 5, 'The requests share');
  const stage = done ? 3 : joined ? 2 : cancelled ? 1 : 0;
  const { slots, waiting } = batchSteps[stage];
  headline(
    g,
    c,
    'CONTINUOUS BATCHING   /   one worker',
    false,
    'When can the waiting request start?',
  );
  cap(
    g,
    done
      ? 'END OF STEP 9'
      : joined
        ? 'STEP 9    /    WORK SCHEDULED'
        : 'END OF STEP 8    /    TWO SLOTS',
    103,
    302,
  );
  const colors = { A: C.blue, B: C.green, C: '#955421' };
  slots.forEach((request, i) => {
    const x = 99 + 875 * i;
    box(g, x, 343, 847, 292, C.sheet, 16);
    cap(g, 'SLOT ' + (i + 1), x + 34, 403);
    if (!request) {
      txt(g, 'Available', x + 34, 507, 65);
      txt(g, 'A cancelled after decoding 2 tokens', x + 34, 592, 34, C.muted);
      return;
    }
    const { id, decoded, operation } = request;
    txt(g, 'Request ' + id, x + 34, 509, 65, colors[id]);
    const label = {
      prefill: 'Prefill C’s prompt',
      ready: 'Ready for first decode',
      decode: 'Decode B’s next token',
    };
    txt(g, label[operation] ?? 'Decoded so far', x + 34, 589, 34, C.muted);
    for (let k = 0; k < decoded; k++) box(g, x + 435 + k * 49, 552, 40, 46, colors[id], 6);
    if (decoded === 0) mono(g, decoded + ' decoded', x + 435, 588, 35, colors[id]);
  });
  cap(g, 'WAITING FOR A SLOT', 103, 750);
  if (waiting.length) badge(g, 'Request ' + waiting[0], 495, 702, 347, C.gold, colors.C);
  else txt(g, 'Queue empty', 495, 751, 40, C.muted);
  strip(
    g,
    done
      ? 'B added one token while C prefilled. Measure the queue and edit-to-paint tail under mixed load.'
      : joined
        ? 'C starts with its own prompt. B keeps its six decoded tokens and continues.'
        : cancelled
          ? 'B has more to generate. When can C start?'
          : 'Each filled mark is one token already decoded for that request.',
  );
}

export function fleet(g, c) {
  if (c.beat.beatIndex >= 4) return batch(g, c);
  headline(g, c, 'CAPACITY WORKSHEET   /   prefill only');
  const split = cue(c, 1, 'Split the survivors'),
    swap = cue(c, 2, 'Swap the two prompt lengths'),
    complete = swap ? cue(c, 3, 'At twenty thousand') : cue(c, 1, 'That is the work');
  const end = cue(c, 3, 'Decode');
  if (!split) {
    const raw = cue(c, 0, 'requests arrive every second'),
      cut = cue(c, 0, 'Eight hundred survive');
    cap(g, '5,000 ACTIVE EDITORS   ×   0.4 REQUESTS PER SECOND EACH', 111, 316);
    for (let i = 0; i < 50; i++) box(g, 115 + i * 33.2, 347, 29, 39, C.blue, 4);
    txt(g, '100 editors per mark', 115, 420, 30, C.muted);
    if (raw) {
      box(g, 115, 433, 1660, 102, C.sky, 9);
      mid(g, '2,000 requests/s', 945, 500, 48, C.blue);
    }
    if (cut) {
      box(g, 115, 575, 996, 102, C.blush, 9);
      box(g, 1111, 575, 664, 102, C.mint, 9);
      mid(g, '1,200 cancel before admission', 612, 642, 42, C.red);
      mid(g, '800 admitted', 1443, 642, 46, C.green);
    }
    strip(g, 'Only cancellation before admission removes all GPU work for that request.');
    return;
  }
  const mix = Number(Boolean(swap));
  const l = loads[mix],
    [hl, ml] = promptLengths[mix];
  cap(
    g,
    '800 REQUESTS/S    ×    2,048 PROMPT TOKENS ON AVERAGE    =    ' +
      num(incomingTokens[mix]) +
      ' INCOMING TOKENS/S',
    108,
    304,
  );
  const groups = [
    ['Hits', hl, 0.25, l.hit, C.green],
    ['Misses', ml, 1, l.miss, C.blue],
  ];
  groups.forEach(([name, len, fraction, total, color], j) => {
    const yy = 385 + j * 173;
    txt(g, name, 105, yy + 28, 49, color);
    const calc = '400/s × ' + num(len) + ' tokens × ' + fraction;
    mono(g, calc, 366, yy + 26, 40);
    if (complete) {
      mono(g, '= ' + num(total) + ' tokens/s', 1100, yy + 26, 39, color);
      bar(g, 366, yy + 60, (total / 1250000) * 1310, 37, color);
    }
  });
  if (swap)
    txt(
      g,
      'Previous load with long hits     ' +
        num(loads[0].total) +
        ' tokens/s' +
        (end ? '   ·   ' + loads[0].gpus + ' GPUs at 20,000 tokens/GPU-second' : ''),
      107,
      754,
      35,
      C.muted,
    );
  strip(
    g,
    complete
      ? end
        ? 'Prefill envelope    ' + num(l.total) + ' ÷ 20,000, rounded up = ' + l.gpus + ' GPUs'
        : 'Remaining prefill    ' +
          num(l.hit) +
          ' + ' +
          num(l.miss) +
          ' = ' +
          num(l.total) +
          ' tokens/s'
      : swap
        ? 'The lengths traded places. Does the unchanged hit rate imply unchanged work?'
        : 'Sum the remaining token work within each cohort.',
  );
}

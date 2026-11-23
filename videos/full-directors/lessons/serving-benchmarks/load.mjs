import {
  C,
  after,
  at,
  blend,
  box,
  bracket,
  clamp,
  dot,
  foot,
  headline,
  light,
  mono,
  panel,
  path,
  txt,
} from './bench.mjs';
import {
  cohort,
  paced,
  clumped,
  lifetimeMs,
  arrivalWindow,
  scheduleSpans,
  slotProbeMs,
  spansAt,
  desk,
  rowAtSend,
  servingRequestMetrics,
  averageResidenceMs,
  timedArrivalsMs,
  inFlightAt,
  meanInFlight,
  counts,
  lagLimit,
} from './samples.mjs';

function dial(c, x, y, t) {
  const angle = (v) => -Math.PI / 2 + 2 * Math.PI * v;
  dot(c, x, y, 156, C.deep);
  dot(c, x, y, 147, C.brass);
  dot(c, x, y, 134, C.paper);
  for (let i = 0; i < 30; i++) {
    const a = angle(i / 30),
      major = i % 10 === 0;
    path(
      c,
      [
        [x + Math.cos(a) * (major ? 98 : 116), y + Math.sin(a) * (major ? 98 : 116)],
        [x + Math.cos(a) * 125, y + Math.sin(a) * 125],
      ],
      C.dim,
      major ? 7 : 3,
    );
  }
  const a = angle(t / 1000);
  path(
    c,
    [
      [x - Math.cos(a) * 18, y - Math.sin(a) * 18],
      [x + Math.cos(a) * 100, y + Math.sin(a) * 100],
    ],
    C.red,
    8,
  );
  dot(c, x, y, 13, C.ink);
}
function handset(c, x, y) {
  c.save();
  c.translate(x, y);
  c.rotate(-0.19);
  c.beginPath();
  c.moveTo(-120, 10);
  c.bezierCurveTo(-94, -95, 82, -95, 119, 10);
  c.lineWidth = 30;
  c.strokeStyle = C.deep;
  c.stroke();
  box(c, -151, -16, 77, 56, C.deep, 15);
  box(c, 78, -16, 77, 56, C.deep, 15);
  box(c, -146, 22, 67, 8, C.brass, 3);
  box(c, 83, 22, 67, 8, C.brass, 3);
  c.restore();
}
export function opening(c, k) {
  const b = k.beat.beatIndex;
  const send = b === 1 && after(k, 'Send it');
  const wait = b === 2 && after(k, 'with one client that waits for a reply');
  const decided = send || b === 2;
  const ask = b > 0 || at(k, 'For a capacity test');
  const progress = b === 0
    ? at(k, 'Watch the clock', arrivalWindow / 1000)
    : send
      ? after(k, 'Send it', 2)
      : wait
        ? after(k, 'with one client that waits for a reply', 2)
        : 1;
  const ms = Math.floor(arrivalWindow * progress);
  const v = desk(ms, !wait);
  const callX = (index) => 686 + index * 110;
  headline(c, 0, 'Who sets the arrival clock?', 'dark');
  panel(c, 90, 258, 1740, 550);
  mono(c, 'SCHEDULE MOTOR', 185, 338, 29, C.mint);
  dial(c, 352, 524, ms);
  txt(c, '3 calls per second', 352, 713, 35, C.pale, { align: 'center' });
  mono(c, (Math.floor(ms / 100) / 10).toFixed(1) + ' s', 352, 760, 28, C.amber, 'center');
  path(
    c,
    [
      [568, 335],
      [568, 741],
    ],
    C.ridge,
    3,
  );
  mono(c, 'CALLS DUE', 645, 333, 28, C.mint);
  paced.forEach((_, i) => {
    const x = callX(i);
    light(c, x, 411, i < v.due, C.amber, 24);
    mono(c, String(i + 1).padStart(2, '0'), x, 466, 25, i < v.due ? C.pale : C.mint, 'center');
  });
  if (!decided && ask) {
    box(c, 645, 605, 529, 90, C.deep, 10);
    txt(c, 'Send on tick or wait?', 910, 650, 34, C.pale, { align: 'center' });
  }
  if (decided) {
    mono(c, 'QUEUE', 645, 650, 28, C.mint);
    for (let i = 1; i < paced.length; i++) {
      const x = callX(i);
      box(c, x - 36, 605, 72, 90, C.deep, 10);
      if (i <= v.waiting) {
        const y = blend(528, 650, (ms - paced[i]) / 180);
        box(c, x - 28, y - 33, 56, 66, C.amber, 5);
        mono(c, String(i + 1).padStart(2, '0'), x, y, 27, C.ink, 'center');
      }
    }
  }
  path(
    c,
    [
      [1306, 337],
      [1306, 741],
    ],
    C.ridge,
    3,
  );
  handset(c, 1554, 470);
  light(c, 1431, 592, true, C.mint);
  txt(c, 'Line 1 busy', 1473, 592, 34, C.pale);
  txt(c, 'First reply unfinished', 1556, 688, 32, C.mint, { align: 'center' });
  const policy = wait ? 'WAIT FOR REPLY' : 'SEND ON TICK';
  const readout = decided
    ? policy + '   /   ' + v.sent + ' sent   /   ' + v.waiting + ' waiting'
    : v.due + ' due   /   first reply in progress';
  mono(c, readout, 960, 850, 32, C.amber, 'center');
  foot(
    c,
    decided
      ? wait
        ? 'The ticks are the same. The next send waits for the first reply.'
        : 'Each tick sends a call while the operator is busy.'
      : ask
        ? 'When the next call comes due, send it or wait for the reply?'
        : 'Follow the clock while the first call stays open.',
    true,
  );
}
function card(c, r, x, y, w, featured) {
  box(c, x + 5, y + 7, w, 157, C.rule, 8);
  box(c, x, y, w, 157, featured ? C.pale : '#e8dfc8', 8);
  for (let i = 0; i < 7; i++) dot(c, x + 21 + i * 23, y + 18, 4, C.rule);
  mono(c, r.id.toUpperCase(), x + 24, y + 59, 34, C.green);
  txt(c, r.prompt.toLocaleString('en-US') + ' input tokens', x + 24, y + 110, 32, C.ink, {
    bold: true,
  });
  mono(c, r.scheduled + ' ms', x + w - 24, y + 52, 26, C.dim, 'right');
  mono(c, 'cap ' + r.cap, x + w - 24, y + 112, 25, C.dim, 'right');
}
export function generator(c, k) {
  const b = k.beat.beatIndex;
  headline(c, 1, b === 0 ? 'Freeze the calls in arrival order' : 'What changed on request four?');
  if (b === 0) {
    txt(c, 'Synthetic incident-assistant workload', 104, 285, 39, C.green);
    cohort.forEach((r, i) =>
      card(c, r, 104 + (i % 3) * 583, 356 + Math.floor(i / 3) * 223, 540, i === 2 || i === 3),
    );
    foot(c, 'R03 arrives at 700 ms. R04 follows at 760 ms. Preserve that 60 ms separation.');
    return;
  }
  const shifted = b === 3 ? at(k, 'Move just the send', 1) : 0;
  const row = rowAtSend(Math.round(blend(765, 800, shifted))),
    m = servingRequestMetrics(row);
  const x = (t) => 230 + (t - 740) * 4.75;
  const y = 545,
    valid = m.lag <= lagLimit;
  const showDue = b > 1 || at(k, 'Request four was due');
  const showSend = b > 1 || at(k, 'It went out');
  const showFirst = b > 1 || at(k, 'Its first token arrived');
  const showLag = b === 1
    ? after(k, 'five milliseconds of schedule lag')
    : shifted === 0 || after(k, 'forty milliseconds late');
  const showTtft = b === 1
    ? after(k, 'two hundred eighty-five milliseconds')
    : shifted === 0 || after(k, 'two hundred fifty milliseconds');
  const lagColor = showLag && !valid ? C.red : C.green;
  txt(c, 'R04   /   monotonic client clock', 106, 278, 37, C.green, { bold: true });
  txt(c, 'Maximum schedule lag  ' + lagLimit + ' ms', 1785, 278, 33, C.dim, { align: 'right' });
  box(c, x(row.scheduled), 418, x(row.scheduled + lagLimit) - x(row.scheduled), 245, '#d4dfbf');
  for (let t = 740; t <= 1060; t += 20) {
    path(
      c,
      [
        [x(t), y - 8],
        [x(t), y + 9],
      ],
      C.dim,
      2,
    );
    if ((t - 760) % 80 === 0) mono(c, t, x(t), y + 43, 25, C.dim, 'center');
  }
  path(
    c,
    [
      [x(740), y],
      [x(1060), y],
    ],
    C.dim,
    3,
  );
  const dueX = x(row.scheduled);
  const sendX = x(row.sent);
  const firstX = x(row.tokens[0]);
  if (showDue) {
    path(c, [[dueX, y - 4], [dueX, 410], [dueX - 70, 410]], C.green, 4);
    mono(c, 'Due ' + row.scheduled, dueX - 4, 366, 34, C.green, 'center');
  }
  if (showSend) {
    dot(c, sendX, y, 14, lagColor);
    path(c, [[sendX, y], [sendX, 642], [sendX + 33, 661]], lagColor, 4);
    mono(c, 'Sent ' + row.sent, sendX + 40, 670, 33, lagColor);
    bracket(c, dueX, sendX, 729, '', lagColor);
  }
  if (showFirst) {
    const dueToFirst = row.tokens[0] - row.scheduled;
    dot(c, firstX, y, 14, C.ink);
    mono(c, 'First token ' + row.tokens[0], firstX + 65, 414, 33, C.ink, 'right');
    bracket(c, dueX, firstX, 334, dueToFirst + ' ms from due', C.dim, 30);
    if (showSend) {
      bracket(c, sendX, firstX, 470, showTtft ? m.ttft + ' ms from send' : '', C.green);
    }
  }
  mono(c, 'Schedule lag' + (showLag ? '   ' + m.lag + ' ms' : ''), dueX, 787, 39, lagColor);
  if (showLag) {
    mono(c, valid ? 'WITHIN LIMIT' : 'OVER LIMIT', 1775, 787, 43, lagColor, 'right');
  }
  foot(
    c,
    b === 2
      ? 'If the send moves to 800 ms, which wait gets shorter?'
      : showLag && !valid
        ? 'The wait from the due time stays fixed. Keep the request and flag the schedule.'
        : 'The due time and first token are separate anchors for the two waits.',
  );
}
const scheduleX = (t) => 260 + (1430 * t) / 3000;
const schedules = [paced, clumped].map((arrivals) => scheduleSpans(arrivals, lifetimeMs));
function compareSpacing(c, k) {
  const answer = k.beat.id === 'c03-overlap';
  const trace = answer ? at(k, 'Trace the time', 2.4) : 0;
  const inspectBurst = answer && at(k, 'At eight hundred');
  const showReplayNeed = answer && after(k, 'three slots');
  const showRegularNeed = answer && after(k, 'just one');
  const showDelay = answer && after(k, 'would delay the third overlapping send');
  const slotLimit = 2;
  const x = (t) => 383 + t * 0.67;
  const cursor = x(slotProbeMs);
  txt(c, '6 scheduled sends per row in 2 seconds', 101, 262, 35, C.ink);
  mono(
    c,
    lifetimeMs + ' ms per call   /   ' + slotLimit + ' client slots',
    1816,
    262,
    32,
    C.green,
    'right',
  );
  for (const [i, spans] of schedules.entries()) {
    const y = 443 + i * 252;
    const slotY = (lane) => y - 35 * (lane + 1);
    const showNeed = i ? showReplayNeed : showRegularNeed;
    const highlight = inspectBurst && (i === 1 || showNeed);
    const open = highlight ? spansAt(spans, slotProbeMs, Boolean(showNeed)) : [];
    const overLimit = open.length > slotLimit;
    txt(c, i ? 'Replayed trace' : 'Regular clock', 96, y, 34, C.ink);
    path(c, [[x(0), y], [x(2050), y]], C.rule, 3);
    if (inspectBurst) {
      path(c, [[cursor, y - 123], [cursor, y + 6]], C.brass, 4, [5, 6]);
      mono(c, slotProbeMs + ' ms', cursor, y + 39, 26, C.ink, 'center');
    }
    for (const span of spans) {
      const { start, end, lane } = span;
      const crossing = open.includes(span);
      const overflow = crossing && overLimit && start === slotProbeMs;
      dot(c, x(start), y, 8, C.green);
      const visibleEnd = Math.min(end, 2050 * trace);
      if (visibleEnd <= start || (i && start === slotProbeMs && !showNeed)) continue;
      path(c, [[x(start), y - 8], [x(start), slotY(lane)]], C.rule, 2);
      const color = overflow ? C.red : C.green;
      path(
        c,
        [[x(start), slotY(lane)], [x(visibleEnd), slotY(lane)]],
        highlight && !crossing ? C.rule : color,
        crossing ? 13 : 9,
      );
      if (crossing && visibleEnd >= slotProbeMs) {
        dot(c, cursor, slotY(lane), 14, C.paper);
        dot(c, cursor, slotY(lane), 9, color);
      }
    }
    if (showNeed || (i && inspectBurst)) {
      const status = showNeed
        ? open.length + (open.length === 1 ? ' slot needed' : ' slots needed')
        : open.length + ' slots already busy';
      mono(c, status, 1795, y - 83, 39, overLimit ? C.red : C.green, 'right');
    }
    if (i && showDelay) {
      const occupiedBeforeSend = spansAt(spans, slotProbeMs, false);
      const release = Math.min(...occupiedBeforeSend.map((span) => span.end));
      box(c, cursor, y - 14, x(release) - cursor, 13, C.amber);
      dot(c, x(release), y - 8, 8, C.ink);
      mono(c, 'Send at ' + release + ' ms', x(release) + 20, y - 30, 34, C.ink);
    }
    for (const t of [0, 1000, 2000]) mono(c, t / 1000 + ' s', x(t), y + 39, 26, C.dim, 'center');
  }
  mono(c, 'Replayed sends (ms)    ' + clumped.join('   '), 960, 824, 31, C.ink, 'center');
  foot(c, showDelay
    ? 'With two slots, the 800 ms arrival waits until the first occupied slot opens.'
    : answer
      ? 'Each bar spans 150 ms from its send. The cursor counts open calls at one instant.'
      : 'Which schedule would make a caller wait for a free slot?');
}
function spanPlot(c, k, b) {
  const ms = b === 0 ? Math.round(2999 * at(k, 'Slide the measuring line', 4)) : 2999;
  const x = scheduleX;
  const starts = timedArrivalsMs.filter((t) => t + averageResidenceMs > 0 && t < 3000);
  starts.forEach((t, i) => {
    const yy = 320 + i * 38,
      active = t <= ms && ms < t + averageResidenceMs;
    path(
      c,
      [
        [x(Math.max(0, t)), yy],
        [x(Math.min(3000, t + averageResidenceMs)), yy],
      ],
      active ? C.green : C.rule,
      14,
    );
    if (t >= 0) dot(c, x(t), yy, 8, C.green);
    if (t + averageResidenceMs <= 3000) dot(c, x(t + averageResidenceMs), yy, 8, C.red);
  });
  path(
    c,
    [
      [x(ms), 290],
      [x(ms), 753],
    ],
    C.red,
    4,
  );
  mono(c, ms + ' ms   /   ' + inFlightAt(ms) + ' in flight', 1775, 261, 30, C.green, 'right');
  for (let i = 0; i < 4; i++) mono(c, i + ' s', x(i * 1000), 771, 30, C.dim, 'center');
  mono(
    c,
    b === 1 && at(k, 'The mean is')
      ? '8.1 request·s ÷ 3 s = ' + meanInFlight(0, 3000).toFixed(1) + ' mean active'
      : 'Residence per request   0.9 s',
    960,
    841,
    40,
    C.ink,
    'center',
  );
}
export function traffic(c, k) {
  const b = k.beat.beatIndex;
  headline(
    c,
    2,
    [
      'How many calls are open right now?',
      'Average the occupied time',
      'Two seconds, six arrivals',
      'How many slots do the scheduled sends need?',
      'Close arrivals. Follow the outstanding work.',
    ][b],
  );
  if (b < 2) {
    spanPlot(c, k, b);
    foot(
      c,
      b === 0
        ? 'Each horizontal stroke is one request. A vertical slice counts simultaneous open calls.'
        : 'Steady window   ·   mean in flight = admitted requests/s × mean seconds in the system',
    );
    return;
  }
  if (b === 2 || b === 3) {
    compareSpacing(c, k);
    return;
  }
  const now = Math.round(blend(2000, 2500, at(k, 'let the outstanding work drain', 1.25)));
  const v = counts(cohort, now),
    x = (t) => 242 + t * 0.537;
  box(c, x(2000), 320, x(2500) - x(2000), 373, '#e3cfa9');
  mono(c, 'ARRIVALS   [0, 2 s)', x(0), 279, 31, C.green);
  mono(c, 'DRAIN', x(2000), 279, 31, C.red);
  cohort.forEach((r, i) => {
    const y = 350 + i * 57;
    mono(c, r.id, 110, y, 26, C.dim);
    path(
      c,
      [
        [x(r.sent), y],
        [x(Math.min(now, r.terminal)), y],
      ],
      C.green,
      9,
    );
    dot(c, x(r.sent), y, 8, C.ink);
    if (r.terminal <= now) dot(c, x(r.terminal), y, 11, r.status === 'timeout' ? C.red : C.green);
  });
  path(
    c,
    [
      [x(now), 319],
      [x(now), 705],
    ],
    C.red,
    3,
  );
  mono(c, (now / 1000).toFixed(2) + ' s', x(now), 747, 30, C.red, 'center');
  mono(
    c,
    v.scheduled +
      ' scheduled    ' +
      v.sent +
      ' sent    ' +
      v.completed +
      ' terminal    ' +
      v.pending +
      ' pending',
    960,
    827,
    37,
    C.ink,
    'center',
  );
  foot(c, 'The drain clock keeps running after the last scheduled arrival.');
}

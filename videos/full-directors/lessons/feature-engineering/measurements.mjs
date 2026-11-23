import {
  C,
  rect,
  line,
  dot,
  poly,
  txt,
  num,
  cap,
  panel,
  labelValue,
  jobs,
  job,
  register,
  strip,
  rail,
  head,
  cue,
  end,
  ease,
  mix,
  hhmm,
  decimal,
} from './drawing.mjs';
import {
  historical,
  pings,
  revisions,
  pingAt,
  waitTimes,
  standard,
  robust,
  mean,
  std,
  median,
  iqr,
  trace,
  readBay,
} from './examples.mjs';

export function intake(g, k) {
  const four = cue(k, 1, 'Try a rule');
  if (!four) {
    const back = cue(k, 1, 'Wind the record', 0.75),
      later = cue(k, 0, 'Look at the record');
    head(g, 'J-204   /   CLUSTER SCHEDULER', 'The waiting queue');
    panel(g, 110, 281, 990, 567, C.pale);
    cap(g, 'QUEUE SENSOR', 155, 335);
    jobs(g, historical[0].count, 173, 420, 6, 130, 70, 21);
    rail(g, 158, 704, 896);
    txt(g, '18 jobs recorded at 09:00', 161, 774, 43);
    strip(g, 1190, 292, 598, 548);
    cap(g, 'JOB HISTORY', 1240, 360);
    txt(
      g,
      back === 1 ? 'May 1' : 'May ' + (later ? '3' : '1'),
      1240,
      490,
      82,
      C.ink,
      'left',
      'Serif',
    );
    txt(g, back === 1 || !later ? '09:00 decision' : 'After the deadline', 1242, 574, 39);
    if (later && back < 1) {
      g.save();
      g.globalAlpha = 1 - back;
      g.translate(1479, 692 - 90 * back);
      g.rotate(-0.055);
      rect(g, -220, -50, 440, 100, C.rust, 7);
      txt(g, 'ESCALATED', 0, 0, 52, C.white, 'center', 'Mono', 700);
      g.restore();
    }
    return;
  }
  const pred = cue(k, 2, 'Their backlogs'),
    actual = cue(k, 2, 'Compare each prediction'),
    count = cue(k, 2, 'Copying escalation'),
    copy = end(k, 2);
  head(g, 'SCHEDULER HISTORY   /   FOUR COMPLETED JOBS', 'Try backlog greater than ten');
  const start = 293,
    step = 34;
  cap(g, 'WAITING AT THE DECISION', start, 280);
  cap(g, 'PREDICT MISS', 1240, 280, C.slate, 'center');
  cap(g, 'MISSED', 1490, 280, C.slate, 'center');
  if (copy) cap(g, 'ESCALATED', 1720, 280, C.rust, 'center');
  line(g, start + 10 * step, 330, start + 10 * step, 784, C.gold, 6);
  historical.forEach((r, i) => {
    const y = 381 + i * 119;
    txt(g, 'Job ' + (i + 1), 112, y, 39);
    for (let j = 0; j < r.count; j++)
      job(g, start + j * step, y - 18, 30, 32, pred && j >= 10 ? C.teal : C.slate);
    num(g, r.count, 1084, y, 40);
    num(g, pred ? (r.flag ? 'yes' : 'no') : '?', 1240, y, 36, pred && r.flag ? C.teal : C.slate);
    num(
      g,
      actual ? (r.miss ? 'yes' : 'no') : '·',
      1490,
      y,
      36,
      actual && r.miss ? C.rust : C.slate,
    );
    if (copy) num(g, r.miss ? 'yes' : 'no', 1720, y, 36, C.rust);
  });
  if (count) txt(g, 'Queue rule   2 / 4 correct', 110, 908, 48, C.teal);
  if (copy) txt(g, 'Later escalation   4 / 4', 1070, 908, 48, C.rust);
}

export function ledger(g, events, cutoff, entity, show, age, heading, kicker = 'HEARTBEAT LOG') {
  head(g, kicker, heading);
  // Each strip carries the event and its actual availability time together.
  const result = pingAt(events, cutoff, entity),
    xs = [164, 480, 890, 1280];
  ['JOB', 'PING SENT', 'FIRST READABLE', 'AT ' + hhmm(cutoff)].forEach((s, i) =>
    cap(g, s, xs[i], 282),
  );
  events.forEach((r, i) => {
    const y = 329 + i * 105,
      win = result.ping === r;
    strip(g, 110, y, 1695, 91);
    txt(g, r.job, xs[0], y + 45, 33);
    num(g, hhmm(r.event), xs[1], y + 45, 39, C.ink, 'left');
    num(g, hhmm(r.available), xs[2], y + 45, 39, C.ink, 'left');
    line(g, 658, y + 45, 830, y + 45, C.line, 3);
    const status = win
      ? 'selected'
      : r.job !== entity
        ? 'other job'
        : r.event > cutoff
          ? 'future event'
          : r.available > cutoff
            ? 'arrived late'
            : 'earlier eligible';
    txt(g, show ? status : '?', xs[3], y + 45, 35, show ? (win ? C.teal : C.slate) : C.slate);
  });
  if (age) {
    const s = decimal(result.age, 4);
    txt(
      g,
      hhmm(cutoff) +
        '  −  ' +
        hhmm(result.ping.event) +
        '  =  ' +
        Math.round(result.age * 60) +
        ' min',
      154,
      851,
      47,
    );
    register(g, 1278, 780, 450, 120, s + ' h');
  }
}

export function heartbeats(g, k) {
  const chosen = cue(k, 1, 'From eight thirty'),
    age = cue(k, 1, 'Put that age');
  const transit = ease(cue(k, 1, 'Follow each ping', 1.25));
  head(g, 'J-204   /   HEARTBEAT TELEMETRY', 'Trace the ping to the scorer');
  // A common zoomed time axis shows the 08:50 event arriving across the cutoff.
  const axis = (t) => 284 + (t - 505) * 27;
  rect(g, axis(540) - 5, 300, 10, 449, C.gold);
  cap(g, '09:00 DECISION', axis(540), 271, C.ink, 'center');
  const selected = pingAt(pings, 540, 'J-204');
  pings.slice(1, 3).forEach((r, i) => {
    const y = 432 + i * 205,
      from = axis(r.event),
      to = axis(r.available);
    line(g, from, y, to, y, C.slate, 5);
    dot(g, from, y, 14, C.ink);
    dot(g, to, y, 19, C.line);
    dot(g, mix(from, to, transit), y, 12, chosen && r === selected.ping ? C.teal : C.ink);
    num(g, hhmm(r.event) + ' sent', from, y - 61, 35, C.ink, 'center');
    num(
      g,
      hhmm(r.available) + ' readable',
      to,
      y + 70,
      35,
      chosen ? (r === selected.ping ? C.teal : C.rust) : C.slate,
    );
  });
  cap(g, 'EARLIER  01:00 → 01:01', 112, 834);
  cap(g, 'LATER  12:00 → 12:01', 112, 892);
  if (age) {
    register(g, 1002, 806, 720, 121, '30 min = 0.5 h');
  }
  if (k.beat.beatIndex === 2)
    txt(g, 'Using the noon ping at 09:00 would give −3 h.', 112, 969, 32, C.rust);
}

export function history(g, k) {
  const b = k.beat.beatIndex;
  if (b < 3) {
    const show = cue(k, 1, 'Filter to the same job');
    head(g, 'J-204   /   AS OF 09:00', 'One ping, two revisions');
    ['ENTITY', 'PING', 'REVISION', 'READABLE', 'SELECTION'].forEach((s, i) =>
      cap(g, s, [163, 435, 733, 1003, 1330][i], 284),
    );
    const winner = pingAt(revisions, 540, 'J-204').ping;
    revisions.forEach((r, i) => {
      const y = 330 + i * 101;
      rect(g, 109, y, 1690, 83, show && r === winner ? C.mint : i % 2 ? C.pale : C.white, 7);
      const why =
        r === winner
          ? 'use revision 1'
          : r.job !== 'J-204'
            ? 'other job'
            : r.event > 540
              ? 'future ping'
              : 'arrived late';
      [r.job, hhmm(r.event), r.revision, hhmm(r.available), show ? why : '?'].forEach((s, j) =>
        txt(
          g,
          s,
          [163, 435, 733, 1003, 1330][j],
          y + 42,
          35,
          show && r === winner ? C.teal : C.ink,
        ),
      );
    });
    if (b === 2) txt(g, 'Windowed count: aggregate eligible events in the window.', 112, 931, 39);
    return;
  }
  head(
    g,
    'J-204   /   OUTCOME HISTORY',
    b === 3 ? 'When the label becomes known' : 'Fit on the past, score later jobs',
  );
  const show = cue(k, 3, 'Keep that label');
  rail(g, 215, 569, 1480);
  [
    ['May 1 · 09:00', 'Score J-204', 250],
    ['May 2 · 09:00', 'Deadline', 930],
    ['May 3', 'Completion', 1600],
  ].forEach(([s, t, x], i) => {
    if (i === 2 && !show) return;
    dot(g, x, 573, 28, [C.teal, C.gold, C.rust][i]);
    txt(g, s, x, 464, 42, C.ink, 'center');
    txt(g, t, x, 663, 35, C.slate, 'center');
  });
  if (show) {
    panel(g, 1190, 753, 601, 123, C.blush);
    num(g, 'missed = 1', 1490, 814, 50, C.ink);
  }
  if (b === 4) txt(g, 'Train after the label is readable.', 126, 813, 37, C.teal);
}

export function scale(g, k) {
  const b = k.beat.beatIndex,
    known = cue(k, 1, 'Zoom in'),
    useRobust = cue(k, 1, 'Now forty'),
    out = end(k, 2);
  head(g, 'TRAINING PARTITION   /   QUEUED MINUTES', 'One long wait changes the ruler');
  waitTimes.forEach((v, i) => {
    const x = 119 + i * 213;
    job(g, x, 269, 160, 80, v === 42 ? C.teal : v === 12000 ? C.rust : C.slate);
    num(g, v, x + 81, 398, 40);
  });
  if (known) {
    const transform = useRobust ? robust : standard,
      low = useRobust ? -1 : -0.385,
      high = useRobust ? 1.2 : -0.37;
    const at = (v) => 185 + ((v - low) / (high - low)) * 1495;
    cap(
      g,
      useRobust ? 'SAME TWO JOBS  /  ROBUST UNITS' : 'MAGNIFIED DETAIL  /  STANDARD UNITS',
      124,
      500,
    );
    rail(g, 185, 659, 1495);
    [5, 42].forEach((v) => {
      const xx = at(transform(v));
      dot(g, xx, 663, 16, v === 42 ? C.teal : C.slate);
      txt(g, v + ' min', xx, 593, 35, C.ink, 'center');
      num(g, transform(v).toFixed(3), xx, 735, 34, C.slate);
    });
    const gap = transform(42) - transform(5);
    labelValue(
      g,
      148,
      856,
      useRobust ? 'ROBUST SEPARATION' : 'STANDARD SEPARATION',
      decimal(gap, 4) + ' units',
      C.teal,
      48,
    );
    if (useRobust) labelValue(g, 735, 856, '42 MIN  /  ROBUST', robust(42).toFixed(3), C.teal, 48);
    if (out || (b === 2 && cue(k, 2, 'Robust scaling centers')))
      labelValue(g, 1278, 856, '12,000 MIN  /  ROBUST', robust(12000).toFixed(3), C.rust, 48);
    return;
  }
  cap(g, 'STANDARD SCORE', 124, 519);
  // The row index keeps coincident readings individually visible on the same scale.
  const x = (v) => 270 + (v + 0.5) * 447;
  rail(g, x(-0.5), 715, x(3) - x(-0.5));
  [-0.5, 0, 1, 2, 3].forEach((t) => {
    line(g, x(t), 718, x(t), 738, C.slate);
    num(g, t, x(t), 770, 28, C.slate);
  });
  waitTimes.forEach((v, i) => {
    const xx = x(standard(v)),
      y = 566 + i * 17;
    dot(g, xx, y, 8, v === 12000 ? C.rust : v === 42 ? C.teal : C.slate);
  });
  txt(g, '5 min and 42 min', 120, 880, 36);
  num(g, 'Δ = ?', 545, 880, 48);
}

const runningCues = [
  {
    arrival: [2, 'The first reading is two'],
    mean: ['Move the mean', 'Move the mean all the way to two'],
    newDistance: [3, 'The reading now sits on the mean'],
    increment: [3, 'it adds zero to M two', 'so it adds zero to M two'],
  },
  {
    arrival: [4, 'Here comes four'],
    oldDistance: [4, 'Its distance from the old mean is two'],
    mean: ['then add one to the mean', 'The new mean is three'],
    shift: [4, 'then add one to the mean'],
    newDistance: [4, 'Four is now one unit above it'],
    increment: [4, 'add two times one to M two', 'so add two times'],
  },
  {
    arrival: [5, 'Bring in six'],
    oldDistance: [5, 'Its old and new distances are three', 'Its old and new distances'],
    mean: ['The mean moves', 'The mean moves to four'],
    newDistance: [5, 'The mean moves to four'],
    increment: [5, 'taking M two from two to eight', 'That adds six more'],
  },
];

function distance(g, x0, x1, y, label, color) {
  if (x0 === x1) dot(g, x0, y, 7, color);
  else {
    line(g, x0, y, x1, y, color, 4);
    for (const x of [x0, x1]) line(g, x, y - 12, x, y + 12, color, 4);
  }
  txt(g, label, (x0 + x1) / 2, y - 33, 42, color, 'center');
}

export function running(g, k) {
  const b = k.beat.beatIndex;
  head(
    g,
    'FITTED NUMERICAL TRANSFORM',
    b < 2 ? 'Fit once inside each training fold' : 'Update the running mean',
  );
  if (b < 2) {
    cap(g, 'TRAINING READINGS', 160, 339);
    [2, 4, 6].forEach((v, i) => {
      job(g, 155 + i * 230, 405, 185, 123);
      num(g, v, 246 + i * 230, 600, 64);
    });
    panel(g, 920, 294, 844, 453, C.pale);
    labelValue(g, 1001, 365, 'MEAN', 4);
    labelValue(g, 1340, 365, 'POPULATION SD', Math.sqrt(trace[2].population).toFixed(3));
    cap(g, 'NEXT READING  /  8', 1001, 563);
    num(g, '(8 − 4) / σ ≈ 2.449', 1001, 647, 44, C.ink, 'left');
    if (b === 1) txt(g, 'Reject a nonfinite reading before the update.', 153, 900, 44, C.rust);
    return;
  }
  function after(beat, phrase, captionStart) {
    if (b !== beat) return b > beat;
    if (captionStart) k.reveal(phrase, 0, { captionStart });
    return k.elapsed >= k.wordCue(phrase).end - 1e-8;
  }
  const index = runningCues.findLastIndex(({ arrival }) => after(...arrival));
  const step = runningCues[index];
  const reading = trace[index];
  const previous = trace[index - 1];
  const oldMean = reading?.oldMean ?? 0;
  let travel = 0;
  if (step) {
    const [beat] = step.arrival;
    const [startPhrase, settledPhrase] = step.mean;
    travel = Number(b > beat);
    if (b === beat) {
      k.reveal(settledPhrase, 0, { captionStart: settledPhrase });
      const { start } = k.wordCue(startPhrase);
      const { end: finish } = k.wordCue(settledPhrase);
      travel =
        k.elapsed >= finish - 1e-8 ? 1 : ease(Math.max(0, (k.elapsed - start) / (finish - start)));
    }
  }
  const x = (value) => 295 + value * 210;
  rail(g, x(0), 452, x(6) - x(0));
  [0, 1, 2, 3, 4, 5, 6].forEach((v) => {
    line(g, x(v), 450, x(v), 477, C.slate);
    num(g, v, x(v), 509, 34, C.slate);
  });
  for (const point of trace.slice(0, index + 1)) {
    const active = point === reading;
    const px = x(point.value);
    line(g, px, 408, px, 449, active ? C.teal : C.line, 4);
    dot(g, px, 408, active ? 19 : 12, active ? C.teal : C.slate);
  }
  if (step && (!step.oldDistance || after(...step.oldDistance))) {
    distance(
      g,
      x(oldMean),
      x(reading.value),
      345,
      'Old distance  ' + decimal(reading.delta),
      C.indigo,
    );
    dot(g, x(oldMean), 455, 10, C.indigo);
  }
  if (step && after(...step.newDistance)) {
    distance(
      g,
      x(reading.mean),
      x(reading.value),
      708,
      'New distance  ' + decimal(reading.second),
      C.teal,
    );
  }
  if (travel === 1 || (step?.shift && after(...step.shift))) {
    const shift = `${decimal(reading.delta)} ÷ ${reading.n} = ${decimal(reading.delta / reading.n)}`;
    txt(g, 'Mean step   ' + shift, 130, 266, 39, C.rust);
  }
  const meanX = x(reading ? mix(oldMean, reading.mean, travel) : oldMean);
  poly(
    g,
    [
      [meanX - 18, 569],
      [meanX + 18, 569],
      [meanX, 540],
    ],
    C.rust,
  );
  const moving = travel > 0 && travel < 1;
  const shownMean = travel === 1 ? reading.mean : oldMean;
  txt(g, moving ? 'Mean' : 'Mean ' + decimal(shownMean), meanX, 608, 43, C.rust, 'center');
  const added = step && after(...step.increment);
  const oldM2 = previous?.m2 ?? 0;
  labelValue(g, 130, 769, 'READINGS', index + 1);
  labelValue(
    g,
    535,
    769,
    'M2 INCREMENT',
    added ? `${reading.delta} × ${reading.second} = ${reading.increment}` : '·',
    C.ink,
    48,
  );
  labelValue(
    g,
    1180,
    769,
    'M2 TOTAL',
    added ? `${oldM2} + ${reading.increment} = ${reading.m2}` : oldM2,
  );
  if (index === 1 && cue(k, 4, 'Predict the update'))
    txt(g, 'Next reading   ' + trace[2].value, 1770, 266, 39, C.teal, 'right');
  if (b === 3 && after(3, 'sample variance is undefined'))
    txt(g, 'Sample variance is undefined with one reading.', 130, 923, 37, C.slate);
  if (after(5, 'divide eight by three readings', 'For population variance'))
    txt(g, `Population variance = ${reading.m2}/${reading.n}`, 130, 923, 37, C.slate);
  if (after(5, 'For sample variance, divide by two', 'For sample variance'))
    txt(g, `Sample variance = ${reading.m2}/${reading.n - 1}`, 978, 923, 37, C.slate);
}
export function rulers(g, k) {
  const b = k.beat.beatIndex;
  head(g, 'EIGHT TRAINING WAITS   /   FITTED ARTIFACT', 'Compare transforms on the same waits');
  const ranks = [
    ['Standard', '(x − μ) / σ', standard],
    ['Robust', '(x − median) / IQR', robust],
    ['Log', 'log(1 + x)', Math.log1p],
  ];
  ranks.slice(0, b === 3 ? 3 : 2).forEach(([title, rule, fn], i) => {
    const y = 315 + i * 182;
    panel(g, 108, y, 1698, 149, i === 1 ? C.mint : C.white);
    txt(g, title, 157, y + 53, 42);
    txt(g, rule, 157, y + 111, 29, C.slate, 'left', 'Mono');
    [5, 42, 12000].forEach((v, j) => {
      const x = 835 + 360 * j;
      cap(g, v + ' MIN', x, y + 40, C.slate, 'center');
      num(g, fn(v).toFixed(3), x, y + 100, 46, v === 12000 ? C.rust : C.ink);
    });
  });
  if (b < 3) {
    labelValue(
      g,
      160,
      765,
      'STANDARD FIT',
      'μ ' + decimal(mean, 2) + '   σ ' + decimal(std, 1),
      C.ink,
      37,
    );
    labelValue(g, 967, 765, 'ROBUST FIT', 'median ' + median + '   IQR ' + iqr, C.teal, 37);
    if (b >= 1)
      txt(g, 'Inclusive quartiles    45.25 − 16.5 = 28.75', 962, 952, 34, C.slate, 'center');
  } else txt(g, 'Even the compressed tail continues to grow.', 149, 950, 40, C.slate);
}

export function missing(g, k) {
  const lost = cue(k, 0, 'its counter goes quiet'),
    filled = cue(k, 0, 'fill that blank'),
    flags = cue(k, 1, 'Read each pair');
  head(g, 'BACKLOG TELEMETRY', 'Two queue monitors');
  [readBay(0, true), readBay(3, !lost)].forEach((s, i) => {
    const x = 115 + 875 * i;
    panel(g, x, 282, 806, 386, C.pale);
    cap(g, 'BAY ' + (i ? 'B' : 'A'), x + 39, 335);
    register(g, x + 490, 318, 239, 96, s.raw ?? '···');
    rect(g, x + 40, 446, 722, 153, C.ink, 10);
    jobs(g, s.n, x + 65, 473, 4, 144, 87, 20);
    rail(g, x + 51, 600, 699);
    strip(g, x + 30, 719, 746, 205);
    cap(g, 'BACKLOG', x + 113, 774);
    num(g, s.raw === null && !filled ? '·' : s.slots[0], x + 180, 850, 62);
    if (flags) {
      line(g, x + 384, 759, x + 384, 889);
      cap(g, 'MISSING', x + 479, 774);
      num(g, s.slots[1], x + 555, 850, 62, s.slots[1] ? C.rust : C.teal);
    }
  });
}

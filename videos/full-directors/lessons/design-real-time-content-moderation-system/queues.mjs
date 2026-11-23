import { C, box, clockCue, dot, fmt, label, line, page, text } from './art.mjs';
import { benchmark, population as pop, queue, tie, traffic, trayState } from './decisions.mjs';

function request(c, x, y, id, filled, w = 150, h = 126) {
  box(c, x, y, w, h, filled ? C.mint : '#385653', 14);
  if (filled) {
    c.beginPath();
    c.moveTo(x + 23, y + h - 2);
    c.lineTo(x + 24, y + h + 13);
    c.lineTo(x + 52, y + h - 2);
    c.fillStyle = C.mint;
    c.fill();
    text(c, id, x + w / 2, y + h * 0.7, h * 0.6, C.dark, 'serif', 400, 'center');
  } else {
    line(c, x + w * 0.4, y + h * 0.52, x + w * 0.6, y + h * 0.52, '#72918a', 4);
  }
}
export function batching(c, k) {
  const b = k.beat.beatIndex,
    boundary = b >= 3,
    input = boundary ? tie : traffic;
  if (b === 5) {
    page(
      c,
      'Classifier throughput  /  full-batch example',
      'How many workers does the full-batch rate imply?',
      true,
    );
    label(c, benchmark.items + ' items in one call', 109, 356, true);
    for (let i = 0; i < benchmark.items; i++) {
      const x = 110 + (i % 8) * 86,
        y = 414 + Math.floor(i / 8) * 86;
      box(c, x, y, 69, 65, C.mint, 10);
      line(c, x + 16, y + 24, x + 52, y + 24, C.pine, 4);
      line(c, x + 16, y + 39, x + 41, y + 39, C.pine, 4);
    }
    label(c, 'Assumed service time', 930, 355, true);
    text(c, benchmark.ms + ' ms = ' + benchmark.serviceSeconds + ' s', 927, 462, 60, C.white, 'serif');
    line(c, 930, 529, 1799, 529, '#67827b');
    if (clockCue(k, 5, 'four thousand items per second'))
      text(c, benchmark.items + ' ÷ ' + benchmark.serviceSeconds + ' = ' + fmt(benchmark.itemsPerSecond) + '/s', 927, 617, 50, C.gold, 'mono');
    if (clockCue(k, 5, 'Two thousand items arrive'))
      label(c, 'Incoming rate   ' + fmt(benchmark.arrivals) + ' items/s', 930, 713, true);
    if (clockCue(k, 5, 'One worker is the ideal lower bound'))
      text(c, 'ceil(' + fmt(benchmark.arrivals) + '/' + fmt(benchmark.itemsPerSecond) + ') = ' + benchmark.workers + ' worker', 927, 807, 43, C.gold, 'mono');
    text(c, 'Full batches  /  continuously available worker', 110, 925, 37, C.white);
    return;
  }
  let t;
  if (boundary) {
    t = 4.9 * clockCue(k, 3, 'Y arrives at exactly five', 1.15);
    if (b === 4) t = 5 + 5 * clockCue(k, 4, 'leaves alone at ten', 1.12);
  } else {
    t = clockCue(k, 0, 'B joins at one', 0.6) + clockCue(k, 0, 'When C arrives at two', 1.05);
    t += 18 * clockCue(k, 1, 'Jump to twenty milliseconds', 0.85);
    t += 4.9 * clockCue(k, 1, 'Two slots are empty', 1.8);
    t += 0.1 * clockCue(k, 2, 'D leaves alone');
    t +=
      2 * clockCue(k, 2, 'E starts a new clock', 0.85) +
      5 * clockCue(k, 2, 'leaves at thirty-two', 0.75);
  }
  // Keep the clock, occupied slots, oldest age and dispatches on the same tenth-ms tick.
  t = Math.floor((t + 1e-7) * 10) / 10;
  const { sent, waiting, age } = trayState(input, t);
  page(
    c,
    'Micro-batching  /  available worker',
    boundary ? 'Who leaves on the expiry tick?' : 'When does the oldest request leave?',
    true,
  );
  text(
    c,
    boundary
      ? 'New arrivals    X  0     Y  5 ms'
      : 'Arrivals    A  0     B  1     C  2     D  20     E  27 ms',
    100,
    314,
    36,
    C.white,
    'mono',
  );
  label(c, 'Waiting tray  /  limit 3', 108, 432, true);
  for (let i = 0; i < 3; i++)
    request(c, 116 + 205 * i, 476, waiting[i]?.id, Boolean(waiting[i]), 175);
  line(c, 105, 646, 720, 646, '#78948b', 4);
  text(
    c,
    age === null ? 'Oldest clock idle' : 'Oldest age   ' + age.toFixed(1) + ' ms',
    110,
    724,
    40,
    C.white,
  );
  box(c, 110, 761, 599, 27, '#58716a', 4);
  if (age !== null) box(c, 110, 761, (599 * age) / 5, 27, C.gold, 4);
  text(c, '0', 110, 830, 27, C.mint, 'mono');
  text(c, '5 ms expiry', 712, 830, 27, C.gold, 'mono', 400, 'right');
  line(c, 821, 384, 821, 868, '#617b73', 2);
  label(c, 'Dispatches to the worker', 922, 427, true);
  sent.forEach((g, i) => {
    const y = 475 + i * 134;
    text(c, g.at + ' ms', 925, y + 63, 42, C.white, 'mono');
    g.rows.forEach((r, j) => request(c, 1132 + j * 112, y, r.id, true, 95, 82));
    text(c, g.rows.length === 3 ? 'Size limit' : 'Age limit', 1510, y + 57, 35, C.gold);
  });
  text(c, 'Clock   ' + t.toFixed(1) + ' ms', 110, 935, 43, C.gold, 'mono');
  if (boundary) text(c, 'Same tick  /  expire first, then admit', 922, 934, 35, C.mint);
}
export function overload(c, k) {
  const b = k.beat.beatIndex;
  const t =
    Math.round(
      (20 * clockCue(k, 0, 'Run that burst', 3.9) +
        60 * clockCue(k, 2, 'Follow the longer downslope', 5.2)) *
        10,
    ) / 10;
  const backlog = Math.round(queue(t));
  const arrivalDrop = clockCue(k, 1, 'Arrivals fall', 0.95);
  const arrivals = arrivalDrop === 1 ? 500 : 900;
  const arrivalMark = 900 - 400 * arrivalDrop;
  const answered = b === 2 && k.reveal('Only a hundred completions', 0, { captionStart: false });
  page(c, 'Judge pool  /  fluid queue', 'How long does the queue remember the burst?', true);
  const x0 = 250,
    y0 = 770,
    w = 1090,
    h = 382,
    X = (v) => x0 + (w * v) / 80,
    Y = (v) => y0 - (h * v) / 6000;
  label(c, 'Waiting requests', 103, 319, true);
  for (const v of [0, 3000, 6000]) {
    line(c, x0, Y(v), X(80), Y(v), '#4a6962', 2);
    text(c, fmt(v), x0 - 24, Y(v) + 10, 31, C.mint, 'mono', 400, 'right');
  }
  for (const v of [0, 20, 40, 60, 80]) {
    line(c, X(v), y0, X(v), y0 + 15, C.mint);
    text(c, v, X(v), y0 + 57, 31, C.white, 'mono', 400, 'center');
  }
  c.beginPath();
  c.moveTo(x0, y0);
  if (t >= 20) c.lineTo(X(20), Y(queue(20)));
  c.lineTo(X(t), Y(backlog));
  c.lineTo(X(t), y0);
  c.closePath();
  c.fillStyle = '#3d675f';
  c.fill();
  line(c, x0, y0, X(Math.min(20, t)), Y(queue(Math.min(20, t))), C.gold, 7);
  if (t > 20) line(c, X(20), Y(6000), X(t), Y(backlog), C.mint, 7);
  dot(c, X(t), Y(backlog), 13, C.white);
  text(c, 'Seconds since the burst began', x0, 870, 34, C.mint);
  const ratesX = 1430,
    ratesWidth = 350,
    rateX = (rate) => ratesX + (rate * ratesWidth) / 900,
    service = 600;
  label(c, 'Arrivals / s', ratesX, 358, true);
  const changing = arrivalDrop > 0 && arrivalDrop < 1;
  text(c, changing ? '900 → 500' : arrivals, ratesX, 423, 57, C.white, 'mono');
  box(c, ratesX, 439, ratesWidth, 17, '#39554f', 3);
  box(c, ratesX, 439, rateX(arrivalMark) - ratesX, 17, C.gold, 3);
  label(c, 'Service / s', ratesX, 510, true);
  text(c, service, ratesX, 575, 57, C.white, 'mono');
  box(c, ratesX, 591, ratesWidth, 17, '#39554f', 3);
  box(c, ratesX, 591, rateX(service) - ratesX, 17, '#72918a', 3);
  if (arrivalDrop === 1) {
    box(c, rateX(arrivals), 591, rateX(service) - rateX(arrivals), 17, C.mint, 3);
    line(c, rateX(arrivals), 456, rateX(arrivals), 591, C.mint, 2);
    text(c, service - arrivals + ' / s spare', ratesX, 655, 34, C.mint, 'mono');
  }
  label(c, 'Waiting now', ratesX, 735, true);
  text(c, fmt(backlog), ratesX, 796, 63, C.gold, 'mono');
  if (b === 2 && answered) {
    const crest = queue(20);
    const drain = service - arrivals;
    text(c, fmt(crest) + ' ÷ ' + drain + '/s = ' + crest / drain + ' s', 1248, 869, 42, C.gold, 'mono');
  }
}

export function errors(c, k) {
  const b = k.beat.beatIndex;
  const trueBlocks = clockCue(k, 0, 'catches ninety-five'),
    falseBlocks = clockCue(k, 1, 'blocks nine hundred'),
    pooled = clockCue(k, 2, 'All the blocked posts');
  page(c, 'Reviewed sample  /  synthetic rates', 'Who is in the blocked population?');
  label(c, 'All ' + fmt(pop.total) + ' items', 103, 306);
  const x = 108,
    w = 1696;
  box(c, x, 344, w, 54, '#91adb1', 4);
  box(c, x, 344, (w * pop.violations) / pop.total, 54, C.red);
  line(c, x + 1, 398, 167, 442, C.red, 3);
  text(c, fmt(pop.violations) + ' violations', 111, 495, 48, C.red, 'serif');
  text(c, fmt(pop.legitimate) + ' legitimate posts', 943, 495, 48, C.sea, 'serif');
  text(c, 'Recall  95%', 111, 561, 36, C.muted);
  text(c, 'False-positive rate  1%', 943, 561, 36, C.muted);
  if (trueBlocks) text(c, pop.tp + ' blocked   /   ' + pop.fn + ' missed', 111, 636, 42, C.ink);
  if (falseBlocks)
    text(c, pop.fp + ' blocked   /   ' + fmt(pop.tn) + ' allowed', 943, 636, 40, C.ink);
  if (pooled) {
    const all = pop.tp + pop.fp,
      part = w * pop.precision;
    label(c, 'Only blocked items  /  enlarged to fill the width', 110, 734);
    box(c, x, 770, w, 48, C.blue, 4);
    box(c, x, 770, part, 48, C.red, 4);
    text(c, pop.tp + ' true', x, 868, 38, C.red);
    text(c, pop.fp + ' wrongful', x + part + 56, 868, 38, C.sea);
    text(
      c,
      pop.tp + ' / ' + fmt(all) + ' = ' + (100 * pop.precision).toFixed(1) + '% precision',
      1800,
      932,
      49,
      C.ink,
      'serif',
      400,
      'right',
    );
  } else if (b === 1 && falseBlocks) {
    text(c, 'Of all the blocks, how many were correct?', 110, 856, 55, C.ink, 'serif');
  }
}

import {
  P,
  frame,
  label,
  rect,
  line,
  dot,
  footer,
  faceplate,
  mono,
  center,
  ruler,
  phase,
} from './art.mjs';
import { replay, phases, startup, practice, practiceBurst } from './examples.mjs';

function clockLabel(t) {
  return Number.isInteger(t) ? String(t) : (Math.floor(10 * t) / 10).toFixed(1);
}
export function opening(c, k) {
  if (k.beat.beatIndex === 3) return twoClocks(c, k);
  const now =
    4 * phase(k, 0, 'five requests can run', 1.6) +
    6 * phase(k, 1, 'At ten seconds', 1.2) +
    10 * phase(k, 1, 'At twenty seconds', 1.3) +
    9 * phase(k, 1, 'Follow your line', 1.2) +
    phase(k, 2, 'Here comes the last refill', 1.2) +
    phase(k, 2, 'Your wait expires', 0.8);
  const run = replay(1, now);
  const expired = run.expired.length > 0;
  frame(
    c,
    'Incident summaries   /   First come, first served',
    'Will R21 get one of these five slots?',
    '09:00   /   100 arrivals',
  );
  const x = (t) => 315 + 35.9 * t,
    y0 = 367;
  faceplate(c, 90, 296, 1740, 459);
  label(c, 'GPU 01', 138, 335, 30, P.pale, mono);
  for (const t of [0, 10, 20, 30, 40]) {
    line(c, x(t), 354, x(t), 719, t === 30 ? P.gold : P.metal, t === 30 ? 4 : 2, [6, 7]);
    label(
      c,
      t === 30 ? '30 s · last start' : t + ' s',
      x(t),
      335,
      27,
      t === 30 ? P.gold : P.light,
      center,
    );
  }
  for (let slot = 1; slot <= 5; slot++) {
    const y = y0 + (slot - 1) * 72;
    label(c, 'Slot ' + slot, 139, y + 29, 30, P.light);
    line(c, x(0), y + 30, x(40), y + 30, P.metal);
    for (const row of run.admitted.filter((r) => r.slot === slot)) {
      const left = x(row.start) + 3,
        w = x(row.end) - left - 3,
        active = row.end > now;
      rect(c, left, y, w, 56, active ? P.pale : '#698077', 7);
      rect(
        c,
        left,
        y + 49,
        Math.min(w, Math.max(0, now - row.start) * 35.9),
        6,
        active ? P.run : P.light,
        2,
      );
      label(c, row.id, left + 18, y + 26, 31, active ? P.ink : P.white, mono);
    }
  }
  label(c, 'R21', 139, 803, 39, expired ? P.fail : P.wait, { font: 'Mono', bold: true });
  line(c, x(0), 803, x(40), 803, P.grid, 2, [4, 9]);
  line(c, x(0), 803, x(Math.min(now, 30)), 803, expired ? P.fail : P.wait, 7);
  dot(c, x(Math.min(now, 30)), 803, 10, expired ? P.fail : P.wait);
  label(
    c,
    expired ? 'Expired' : 'Waiting  ' + clockLabel(Math.min(now, 30)) + ' s',
    x(Math.min(now, 30)) + 21,
    803,
    31,
    expired ? P.fail : P.wait,
  );
  line(c, 88, 877, 1832, 877);
  label(c, 'Arrival order', 97, 935, 31, P.sub);
  for (let i = 0; i < 21; i++) {
    const row = run.rows[i],
      started = row.start !== null && row.start <= now;
    const fill = i === 20 ? (expired ? P.blush : P.gold) : started ? P.pale : P.light;
    const xx = 323 + i * 62 + (i >= 20 ? 17 : 0);
    rect(c, xx, 906, 56, 58, fill, 6, P.grid);
    label(c, i + 1, xx + 28, 936, 27, P.ink, center);
  }
  label(c, '+79', 1714, 936, 32, P.sub, mono);
}

function twoClocks(c, k) {
  frame(
    c,
    'Incident summaries   /   Two clocks',
    'What arrived in time for R21?',
    '19 more workers requested',
  );
  const x = (t) => 255 + 7.06 * t;
  label(c, 'Request 21', 103, 329, 43, P.ink, { font: 'Serif' });
  line(c, x(0), 431, x(207), 431, P.grid, 3, [6, 8]);
  line(c, x(0), 431, x(30), 431, P.wait, 13);
  dot(c, x(30), 431, 15, P.fail);
  label(c, 'Wait expired at 30 s', x(30) + 31, 431, 37, P.fail);
  label(c, 'First new worker', 103, 544, 43, P.ink, { font: 'Serif' });
  const colors = [P.metal, '#597882', '#456786', P.run];
  let t = 0;
  phases.forEach(([name, d], i) => {
    rect(c, x(t), 604, 7.06 * d - 3, 75, colors[i], 5);
    label(c, name, x(t + d / 2), 643, i === 3 ? 20 : 30, P.white, center);
    t += d;
  });
  ruler(
    c,
    x(0),
    x(207),
    727,
    0,
    207,
    [0, 30, 95, 117, 195, 207].filter((t) => t !== 195),
    (t) => t + ' s',
  );
  footer(c, '20 started. R21 and 79 others expired before the first new worker was ready.');
}

export function startupChart(c, k) {
  const row2 = phase(k, 1, 'Start the same chain'),
    row3 = phase(k, 3, 'Try a four');
  const p = [
    phase(k, 0, 'Provision the node', 1.1),
    phase(k, 0, 'Pull the image', 1),
    phase(k, 0, 'Load the weights', 1),
    phase(k, 0, 'Warm the engine', 0.8),
  ];
  const paint2 = phase(k, 2, 'That is fifty-seven', 1.3);
  const paint3 = phase(k, 3, 'Compare the two endpoints', 1.4);
  frame(
    c,
    'Cold start   /   Serial trace',
    'Where does the worker become ready?',
    '0 s = burst arrival',
  );
  const x = (t) => 967 + 3.17 * t;
  const colors = [P.metal, '#597882', '#456786', P.run];
  let legendX = 112;
  phases.forEach(([name, d], i) => {
    rect(c, legendX, 294, 28, 28, colors[i], 5);
    label(c, name + '  ' + d + ' s', legendX + 42, 308, 33);
    legendX += 370;
  });
  const top = 407;
  [0, 120, 240].forEach((lead, i) => {
    const shown = i === 0 || (i === 1 && row2) || (i === 2 && row3);
    if (!shown) return;
    const y = top + i * 144,
      progress = i === 0 ? 1 : i === 1 ? paint2 : paint3;
    label(c, lead === 0 ? 'At the burst' : lead + ' s lead', 100, y - 22, 29, P.sub, {
      font: 'Sans',
      bold: true,
    });
    line(c, x(-lead), y + 69, x(207), y + 69, P.grid, 2, [4, 8]);
    let cursor = -lead;
    phases.forEach(([, d], j) => {
      const amount =
        i === 0 ? d * p[j] : Math.min(d, Math.max(0, progress * startup - (cursor + lead)));
      rect(c, x(cursor), y + 8, 3.17 * amount, 48, colors[j], 3);
      cursor += d;
    });
    dot(c, x(-lead), y + 69, 7, P.ink);
    const complete = i === 0 ? p[3] >= 1 : progress >= 1;
    if (complete) {
      dot(c, x(cursor), y + 68, 9, P.run);
      label(
        c,
        'Ready ' + (cursor > 0 ? '+' : '') + cursor + ' s',
        x(cursor) + (i === 2 ? -12 : 0),
        y + 96,
        28,
        P.run,
        { align: i === 2 ? 'right' : 'center' },
      );
    } else if (i > 0 && progress === 0) label(c, 'Start', x(-lead), y + 94, 27, P.sub, center);
  });
  for (const [t, name] of [
    [0, 'Burst'],
    [30, 'Last start'],
  ]) {
    line(c, x(t), 365, x(t), 792, t === 0 ? P.ink : P.wait, 2, [7, 8]);
    label(c, name, x(t) + (t === 0 ? -8 : 8), 814, 28, t === 0 ? P.ink : P.wait, {
      align: t === 0 ? 'right' : 'left',
    });
  }
  const end3 = paint3 >= 1,
    end2 = paint2 >= 1;
  footer(
    c,
    end3
      ? '33 s of warm capacity before arrival'
      : row3
        ? 'Move the start to −240 s. Keep all four durations.'
        : end2
          ? 'Ready at +87 s. The queue closed at +30 s.'
          : row2
            ? 'The same 207-second chain starts at −120 s.'
            : 'Each phase waits for the previous one to finish.',
  );
}

function grid(c, run, x, y) {
  const { rows, now } = run;
  rows.forEach((r, i) => {
    const ix = i % 10,
      iy = Math.floor(i / 10),
      left = x + ix * 61,
      top = y + iy * 49;
    const missed = r.expired && now > 30,
      started = r.start !== null && r.start <= now,
      done = started && r.end <= now;
    const fill = missed ? P.blush : done ? P.pale : started ? P.run : P.light;
    rect(c, left, top, 54, 40, fill, 5, i === 20 ? P.wait : P.grid, i === 20 ? 5 : 1.5);
    label(c, i + 1, left + 27, top + 20, 23, started && !done ? P.white : P.ink, center);
  });
}
export function pool(c, k) {
  const three = phase(k, 1, 'Replay the same arrivals'),
    twenty = phase(k, 3, 'Put twenty warm');
  const n = twenty ? 20 : three ? 3 : 1;
  const elapsed =
    n === 1
      ? 40
      : n === 20
        ? 0
        : 10 * phase(k, 2, 'At ten seconds', 1.1) +
          10 * phase(k, 2, 'Its reply finishes', 1.1) +
          10 * phase(k, 2, 'At thirty seconds', 1.25) +
          phase(k, 2, 'and forty miss the deadline', 0.8);
  const t = Math.floor(elapsed * 10) / 10;
  const run = replay(n, t),
    tracked = run.rows[20];
  frame(
    c,
    'Incident summaries   /   Replay',
    'When does R21 start in this pool?',
    n + ' warm   /   ' + 5 * n + ' slots',
  );
  label(c, '100 arrivals in queue order', 104, 304, 34, P.sub);
  grid(c, run, 106, 349);
  const x = 851;
  label(c, 'Started by time ' + t + ' s', x, 319, 34, P.sub);
  label(c, run.admitted.length + ' / 100', x, 417, 94, P.ink, { font: 'Serif' });
  const groups = [
    ['Running', run.active.length, P.run],
    ['Finished', run.complete.length, P.pale],
    ['Waiting', run.waiting.length, P.light],
    ['Expired', run.expired.length, P.blush],
  ];
  for (const [i, [name, count, color]] of groups.entries()) {
    const left = x + (i % 2) * 420,
      top = 522 + Math.floor(i / 2) * 68;
    rect(c, left, top - 16, 28, 28, color, 4, P.grid);
    label(c, name + '   ' + count, left + 44, top, 33);
  }
  let status = 'waiting';
  if (tracked.start !== null && tracked.start <= t)
    status =
      t >= tracked.end ? 'finished at ' + tracked.end + ' s' : 'started at ' + tracked.start + ' s';
  if (tracked.expired && t > 30) status = 'expired';
  rect(c, x, 703, 912, 101, P.gold, 10);
  label(c, 'R21   ' + status, x + 34, 751, 44, P.ink, { font: 'Mono' });
  footer(
    c,
    n === 1
      ? 'One warm GPU starts 5 requests on each of four legal ticks.'
      : n === 3
        ? 'Three warm GPUs share the same queue and the same 30 s deadline.'
        : 'Twenty warm GPUs start every request on the first tick.',
  );
}

export function morning(c, k) {
  const five = phase(k, 1, 'Five warm workers suffice');
  const countTicks = phase(k, 1, 'four legal start ticks', 0.7);
  const four = phase(k, 1, 'Four workers could cover only eighty', 0.7);
  const start = phase(k, 1, 'starts right at thirty seconds', 0.8);
  const finish = phase(k, 1, 'finishes ten seconds later', 0.6);
  const tracked = replay(5, 40).rows.at(-1);
  const legalTicks = [...new Set(replay(5, 40).rows.map((row) => row.start))];
  frame(
    c,
    'Warm pool   /   Morning decision',
    'How few warm workers get R100 in?',
    '100 requests   /   last start 30 s',
  );
  label(c, 'Requests started within the deadline', 466, 285, 35, P.sub);
  [1, 3, 20, 4, 5].forEach((n, i) => {
    if ((n === 4 && !four) || (n === 5 && !five)) return;
    const y = 345 + i * 72;
    const run = replay(n, 40);
    const known = n === 4 ? four : n === 5 ? Math.max(countTicks, start) : 1;
    const revealed = Math.ceil(known * (n === 4 ? 100 : run.admitted.length));
    label(c, n + ' warm', 118, y + 22, 36, P.ink);
    for (let j = 0; j < 100; j++) {
      const started = run.rows[j].start !== null;
      const fill = j < revealed ? (started ? P.run : P.blush) : P.quiet;
      rect(c, 464 + j * 12, y, 9.5, 43, fill, 2, n === 5 && j === 99 && start ? P.wait : null, 3);
    }
    if (known >= 1) label(c, String(run.admitted.length), 1740, y + 20, 40, P.ink, center);
  });

  if (!five) return;
  const x = (t) => 500 + t * 29;
  const y = 815;
  label(c, 'R100', 118, y, 36, P.ink, { bold: true });
  ruler(c, x(0), x(tracked.end), y, 0, tracked.end, [...legalTicks, tracked.end], (t) => t + ' s');
  line(c, x(tracked.start), y - 31, x(tracked.start), y + 8, P.wait, 3);
  if (!start) {
    for (const [i, tick] of legalTicks.entries()) {
      if (countTicks * legalTicks.length > i) dot(c, x(tick), y, 9, P.run);
    }
    if (countTicks >= 1) label(c, '5 GPUs × 5 slots × 4 start ticks = 100', x(0), y - 49, 33, P.ink);
    return;
  }
  const admissionX = x(tracked.start * start);
  line(c, x(0), y, admissionX, y, P.wait, 9);
  dot(c, admissionX, y, 10, P.wait);
  if (start >= 1) label(c, 'Starts at ' + tracked.start + ' s', x(tracked.start) - 18, y - 47, 36, P.wait, { align: 'right' });
  if (finish) {
    const finishX = x(tracked.start + (tracked.end - tracked.start) * finish);
    line(c, x(tracked.start), y, finishX, y, P.run, 9);
    dot(c, finishX, y, 10, P.run);
  }
  if (finish >= 1) label(c, 'Finishes at ' + tracked.end + ' s', x(tracked.end), y - 47, 36, P.run, { align: 'right' });
}

function practiceCue(k, beatIndex, phrase, seconds = 0) {
  if (k.beat.beatIndex !== beatIndex) return Number(k.beat.beatIndex > beatIndex);
  k.reveal(phrase, 0, { captionStart: phrase });
  const elapsed = k.elapsed - k.wordCue(phrase).end + 1e-9;
  if (elapsed < 0) return 0;
  return seconds ? Math.min(1, elapsed / seconds) : 1;
}

function practiceQueue(c, rows, lastId) {
  const pitch = 62;
  const left = 127;
  const columns = Math.ceil(rows.length / 2);
  for (let offset = 0; offset < rows.length; offset += columns) {
    const y = 611 + (offset / columns) * 126;
    const row = rows.slice(offset, offset + columns);
    for (let first = 0; first < row.length; ) {
      const { start, expired } = row[first];
      let end = first + 1;
      while (end < row.length && row[end].start === start && row[end].expired === expired) end++;
      if (start !== null || expired) {
        const x1 = left + first * pitch;
        const x2 = left + end * pitch - 5;
        const color = expired ? P.fail : P.run;
        label(c, expired ? 'Expired' : start + ' s start', (x1 + x2) / 2, y - 33, 29, color, center);
        line(c, x1, y - 12, x2, y - 12, color, 3);
      }
      first = end;
    }
    row.forEach(({ id, start, expired }, i) => {
      const x = left + i * pitch;
      const tracked = id === lastId;
      const fill = expired ? P.blush : start === null ? P.light : P.pale;
      rect(c, x, y, pitch - 5, 61, fill, 5, tracked ? P.wait : P.grid, tracked ? 4 : 1.5);
      label(c, id.slice(1), x + (pitch - 5) / 2, y + 30, 30, expired ? P.fail : P.ink, {
        align: 'center',
        bold: tracked,
        font: 'Mono',
      });
    });
  }
}

const originalDeadline = 10;
const earlierDeadline = originalDeadline - 1;
const originalWarm = practice(originalDeadline, 1).minimum;
const minimum = practice(earlierDeadline, 1).minimum;
const originalPractice = practice(originalDeadline, originalWarm);
const lastPracticeId = originalPractice.rows.at(-1).id;
const unassignedPracticeRows = originalPractice.rows.map(({ id }) => ({
  id,
  start: null,
  expired: false,
}));

export function finalPractice(c, k) {
  const { requests, slots, service, cold } = practiceBurst;
  const sixShown = practiceCue(k, 9, 'At ten seconds, six workers suffice');
  const startsShown = practiceCue(k, 9, 'Each starts three requests at zero, five, and ten');
  const moveCutoff = practiceCue(k, 9, 'Now move only the deadline to nine seconds', 0.8);
  const lost = practiceCue(k, 10, 'The final eighteen lose their start');
  const resize = practiceCue(k, 10, 'Nine workers give each of those waves twenty-seven places', 1.8);
  const lastShown = practiceCue(k, 10, 'The last request gets a slot at five seconds');
  const warm = originalWarm + Math.floor(resize * (minimum - originalWarm));
  const cutoff = originalDeadline - moveCutoff;
  const run = lost ? practice(earlierDeadline, warm) : originalPractice;
  const rows = startsShown ? run.rows : unassignedPracticeRows;

  frame(
    c,
    'Practice   /   Warm pool sizing',
    'How many warm workers does this burst need?',
    'Cold capacity at ' + cold + ' s',
  );
  label(
    c,
    requests + ' arrivals at 0 s   /   ' + slots + ' slots per worker   /   ' + service + ' s per request',
    104,
    307,
    36,
    P.sub,
  );
  const x = (t) => 156 + 145 * t;
  const tickY = 421;
  const ticks = Array.from({ length: originalPractice.waves }, (_, i) => i * service);
  ruler(c, x(0), x(originalDeadline + 1), tickY, 0, originalDeadline + 1, ticks, (t) => t + ' s');
  line(c, x(cutoff), tickY - 38, x(cutoff), tickY, P.wait, 5);
  dot(c, x(cutoff), tickY, 9, P.wait);
  const cutoffLabel = moveCutoff === 1 ? 'Last legal start · ' + earlierDeadline + ' s' : 'Last legal start';
  label(c, cutoffLabel, x(cutoff), tickY - 58, 32, P.wait, center);

  const previous = moveCutoff > 0 && !lost;
  const queueLabel = previous
    ? 'Previous starts in queue order'
    : warm > originalWarm
      ? 'Replay from 0 s · Same queue order'
      : 'Requests in queue order';
  label(c, queueLabel, 128, 527, 34, P.sub);
  if (sixShown) label(c, warm + ' warm workers', 1795, 527, 34, P.ink, { align: 'right', bold: true });
  practiceQueue(c, rows, lastPracticeId);

  const slotsPerTick = warm * slots;
  const equation =
    run.waves + ' start ticks × ' + slotsPerTick + ' slots per tick = ' + run.admitted + ' starts';
  const outcome = run.expired
    ? '   /   ' + run.expired + ' expired'
    : lastShown
      ? '   /   ' + lastPracticeId + ' starts at ' + run.rows.at(-1).start + ' s'
      : '';
  footer(
    c,
    previous
      ? 'Keep the same workers and compare their previous starts with the cutoff.'
      : startsShown
        ? equation + outcome
        : 'Which start ticks can each slot use?',
  );
}

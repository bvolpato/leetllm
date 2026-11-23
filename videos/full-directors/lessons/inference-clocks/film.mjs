import { C, cue, lerp, rect, line, dot, txt, mono, bracket, panel, note, frame, spot } from './art.mjs';
import {
  practice,
  metrics,
  fmt,
  handoffPositions,
  reserves,
  perPosition,
  MiB,
  sum,
  finalBytes,
  offered,
  fraction,
  checkModel,
} from './model.mjs';
import { opening, prefill, decode, firstClock, cadence, delivery } from './clocks.mjs';
import { rows, hardware, payload, pages, schedule, precision } from './resources.mjs';

function finalTrace(c, k) {
  const m = metrics(practice);
  const answer = k.beat.beatIndex === 1;
  const said = (phrase) => answer && k.elapsed + 1e-9 >= k.wordCue(phrase).end;
  const firstLimit = 450;
  const gapLimit = 50;
  const longest = Math.max(...m.gaps);
  const longestIndex = m.gaps.indexOf(longest);
  const pass = said('It passes both') && m.first <= firstLimit && longest <= gapLimit;
  const scan = cue(k, 1, 'The longest gap was forty-seven', 0.8);
  const showLongest = said('The longest gap was forty-seven');
  const showMean = said('averaged forty-four milliseconds per later token');
  mono(c, 'Worker limits   /   first wait ≤ ' + firstLimit
    + ' ms   ·   every later gap ≤ ' + gapLimit + ' ms', 103, 265, 31);
  // Magnify the emissions and give the arrival time as a separate reference.
  const x = (t) => 300 + (t - 400) * 9.4,
    y = 445;
  line(c, 236, y, 1756, y, C.muted, 3);
  practice.forEach((t, i) => spot(c, x(t), y, t, 'T' + (i + 1), C.ink, 53, 41));
  for (const [i, g] of m.gaps.entries()) {
    const start = x(practice[i]);
    const end = x(practice[i + 1]);
    bracket(c, start, end, 584, '', C.grid);
    if (i === longestIndex && scan) {
      bracket(c, start, lerp(start, end, scan), 584, showLongest ? longest + ' ms' : '', C.teal);
      if (showLongest) {
        const ceiling = x(practice[i] + gapLimit);
        line(c, start, 670, ceiling, 670, C.muted, 2);
        line(c, ceiling, 658, ceiling, 682, C.muted, 3);
        mono(c, gapLimit + ' ms allowed', (start + ceiling) / 2, 708, 28, C.muted, 'center');
      }
    } else if (showMean) {
      bracket(c, start, end, 584, g + ' ms', C.muted);
    }
  }
  mono(c, 'Server arrival = 0 ms', 106, 742, 32, C.muted);
  if (said('four hundred ten milliseconds'))
    mono(c, 'First wait   ' + m.first + ' ms', 106, 796, 34, C.teal);
  if (pass) mono(c, 'Both limits pass', 676, 796, 34, C.teal);
  if (showMean)
    mono(c, 'Mean later gap   ' + m.mean + ' ms   ·   ' + m.rate.toFixed(1)
      + ' tokens/s', 106, 856, 34, C.teal);
}
function reservations(c, k) {
  const small = cue(k, 2, 'Halve the raw cache bytes'),
    b = small ? 1 : 2;
  const pageBytes = 16 * perPosition(b),
    unit = 142,
    scale = unit / MiB,
    start = 165,
    cap = start + 8 * unit;
  const used = finalBytes(b),
    admitted = used <= 8 * MiB;
  mono(c, 'Raw KV pool   /   16 positions per page', 104, 269, 33);
  const lanes = small ? [2, 1] : [2];
  lanes.forEach((bytes, row) => {
    const y = 389 + row * 247,
      w = 16 * perPosition(bytes) * scale;
    let page = 0;
    for (const [i, count] of reserves.entries()) {
      for (let j = 0; j < count; j++) {
        const x = start + (page + j) * w;
        const fill = i === 0 ? C.blue : i === 1 ? C.teal : bytes === 2 ? C.paper : C.gold;
        rect(c, x + 2, y, w - 4, 76, fill, i === 2 ? C.rust : null, 4);
      }
      bracket(
        c,
        start + page * w,
        start + (page + count) * w,
        y + 108,
        ['56', '40', '24'][i] + ' pos.',
        C.muted,
      );
      page += count;
    }
    mono(
      c,
      bytes +
        (bytes === 1 ? ' byte' : ' bytes') +
        '/value    ' +
        (16 * perPosition(bytes)) / MiB +
        ' MiB/page',
      start,
      y - 42,
      31,
    );
  });
  line(c, cap, 347, cap, 481, C.rust, 5);
  if (small) line(c, cap, 565, cap, 779, C.rust, 5);
  mono(c, '8 MiB limit', cap + 19, 347, 32, C.rust);
  if (!small) {
    mono(c, '7 pages held   +   2 requested', start, 683, 39, C.ink);
  } else mono(c, fmt(used / MiB) + ' MiB used', start + used * scale + 31, 683, 34, C.teal);
  note(
    c,
    admitted
      ? 'Admit all three reservations   ·   ' +
          sum(reserves) +
          ' pages × ' +
          pageBytes / MiB +
          ' MiB = ' +
          used / MiB +
          ' MiB'
      : 'Two more pages would bring total demand to 9 MiB.',
  );
}
function outcomes(c, k) {
  const cells = [
    ['Correct and on time', offered.onTime, C.teal],
    ['Rejected', offered.rejected, C.rust],
    ['Failed', offered.failed, C.blue],
  ];
  mono(c, 'Offered traffic   /   20-second trial', 103, 267);
  let count = 0;
  for (const [i, [name, n, col]] of cells.entries()) {
    const y = 390 + i * 140;
    mono(c, name, 109, y + 22, 33, C.ink);
    for (let j = 0; j < n; j++) {
      const x = 615 + 92 * j;
      rect(c, x, y - 18, 74, 79, col);
      mono(c, String(count + j + 1).padStart(2, '0'), x + 36, y + 22, 28, C.light, 'center');
    }
    count += n;
  }
  const rate = cue(k, 3, 'Goodput is'),
    pct = cue(k, 3, 'Sixty percent');
  const good = offered.onTime;
  if (rate)
    txt(
      c,
      good + ' / ' + offered.seconds + ' s = ' + good / offered.seconds + ' requests/s',
      109,
      797,
      46,
      C.teal,
      'Serif',
    );
  if (pct)
    txt(
      c,
      good + ' / ' + count + ' offered = ' + fraction * 100 + '%',
      1084,
      797,
      46,
      C.teal,
      'Serif',
    );
  note(c, 'Measure correct, on-time replies against all offered work.');
}
function transfer(c, k) {
  const b = k.beat.beatIndex;
  if (b === 3) return outcomes(c, k);
  if (b === 2 || cue(k, 1, 'Open its reservation')) return reservations(c, k);
  finalTrace(c, k);
}
const scenes = {
  c01: ['Output cursors', opening],
  c02: ['Causal attention', prefill],
  c03: ['Generation loop', decode],
  c04: ['First-token trace', firstClock],
  c05: ['Emission dividers', cadence],
  c06: ['Delivery replay', delivery],
  c07: ['Projection weights', rows],
  hardware: ['Bandwidth worksheet', hardware],
  payload: ['Cache cross section', payload],
  pages: ['Page allocator', pages],
  schedule: ['Worker schedule', schedule],
  precision: ['Memory formats', precision],
  c08: ['Worker under load', transfer],
};
export default {
  title: 'The Two Clocks of a Generated Answer',
  draw(c, k) {
    const [tag, paint] = scenes[k.beat.chapterId];
    const focusTitles = {
      'c03-b04': 'What if the saved pairs disappear?',
      'c05-b04': 'What happens if we average first?',
      'schedule-b03': 'A different prompt with ' + fmt(handoffPositions) + ' tokens',
      'c08-b04': 'How many offered requests succeeded on time?',
    };
    frame(c, k, tag, focusTitles[k.beat.id]);
    paint(c, k);
  },
  check: checkModel,
};

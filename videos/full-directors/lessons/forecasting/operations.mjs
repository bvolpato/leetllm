import { C, signed, mean, mix, sum } from './instrument.mjs';
import {
  baseline,
  observed,
  width,
  forecast,
  actual,
  errors,
  holdout,
  routineErrors,
  weekdayNames,
  covered,
  mae,
  docket,
  route,
  checks,
  hasFields,
  eventRows,
  deduplicateEvents,
  labels,
  auditLabels,
  diagonalProjection,
  stateTrace,
  streams,
} from './observatory.mjs';
import { recorder } from './origin.mjs';

export function routing(p) {
  const outcome = p.at(0, null),
    first = p.at(2, 'Check the job'),
    urgent = p.at(3, 'With urgent impact now true'),
    second = p.at(4, 'The new evidence');
  p.title('Follow Friday’s record', 'fc-a.batch_jobs   /   one-day forecast');
  const stages = [
    ['Jan 23', 'Source', baseline + ' jobs'],
    ['Jan 25', 'Band fixed', '±' + width + ' jobs'],
    ['Jan 29', 'Issued', baseline + ' jobs'],
    ['Jan 30', 'Observed', outcome ? observed + ' jobs' : 'Awaiting'],
  ];
  stages.forEach(([date, kind, v], i) => {
    const xx = 83 + 300 * i;
    p.ticket(xx, 185, 241, 174);
    p.mono(date, xx + 41, 220, 23, C.muted);
    p.text(kind, xx + 41, 257, 23, C.ink);
    p.text(v, xx + 41, 312, 35, i === 3 ? C.red : C.blue, 'left', 'Serif');
    if (i < 3) p.arrow(xx + 248, 271, xx + 287, 271, C.edge);
  });
  p.mono('weekly-lag-v1    /    empirical-absolute-error-p95-v1', 87, 399, 21, C.muted);
  if (p.beat > 0) {
    p.text('Planned launch', 91, 473, 24, C.ink);
    p.mono('YES', 318, 473, 23, C.teal);
    p.text('Urgent impact', 91, 534, 24, C.ink);
    p.mono(urgent ? 'TRUE' : 'FALSE', 318, 534, 23, urgent ? C.red : C.teal);
    p.arrow(434, 500, 554, 500, C.edge);
    p.text(
      (urgent ? second : first) ? route(docket, urgent) : 'Which route?',
      610,
      483,
      37,
      (urgent ? second : first) ? (urgent ? C.red : C.teal) : C.ink,
      'left',
      'Serif',
    );
    if (first && !urgent) p.text('Owner   capacity-ops', 610, 540, 24, C.ink);
    if (second) p.text('Delivery acknowledgment   ·   unknown', 610, 540, 23, C.muted);
  }
}
export function volume(p) {
  const latch = p.beat >= 4;
  p.title(
    latch
      ? 'A latch with two thresholds'
      : p.beat >= 2
        ? 'One spike over four hours'
        : 'From one band to a fleet',
  );
  if (p.beat < 2) {
    const large = p.at(0, 'That gives fifty'),
      n = large ? 1000 : 100;
    const columns = large ? 50 : 20,
      step = large ? 19 : 37,
      r = large ? 5 : 10;
    for (let i = 0; i < n; i++)
      p.dot(110 + (i % columns) * step, 195 + Math.floor(i / columns) * step, r, C.edge);
    p.text(n + ' daily forecasts   ×   0.05 miss probability', 90, 610, 30, C.ink, 'left', 'Serif');
    p.mono('E[crossings] = ' + Math.round(n * 0.05), 90, 659, 25, C.teal);
  } else if (!latch) {
    for (let h = 0; h < 4; h++) {
      const y = 228 + h * 78;
      p.text('Hour ' + (h + 1), 91, y, 24, C.muted);
      for (let i = 0; i < 60; i++) p.line(218 + i * 15.4, y - 14, 218 + i * 15.4, y + 14, C.red, 3);
    }
    p.bracket(212, 1133, 528, 'One active review spans the 240 evaluations', C.teal);
    if (p.beat === 3)
      p.text('Paging on every crossing would request 240 notifications.', 100, 646, 26, C.muted);
  } else {
    const show6 = p.at(4, 'At six'),
      askFour = p.at(4, 'Now read four'),
      four = p.at(5, 'At four it stays open'),
      one = p.at(5, 'At one it clears');
    const done = one ? 3 : four ? 2 : show6 ? 1 : 0;
    const vals = [6, 4, 1],
      x = [302, 657, 1010],
      y = (v) => 464 - v * 40;
    p.graph(128, 175, 1024, 339);
    for (const [v, l] of [
      [5, 'Enter above 5'],
      [2, 'Clear below 2'],
    ]) {
      p.line(128, y(v), 1152, y(v), C.edge, 2, [6, 5]);
      p.text(l, 143, y(v) - 21, 19, C.muted);
    }
    vals.forEach((v, i) => {
      if (i < done) {
        if (i) p.line(x[i - 1], y(vals[i - 1]), x[i], y(v), C.blue, 3);
        p.dot(x[i], y(v), 9, C.blue);
        p.mono(v, x[i] + 20, y(v) - 10, 25, C.ink);
      }
    });
    if (askFour && !four) {
      p.dot(x[1], y(4), 9, C.gold, true);
      p.mono('4', x[1] + 23, y(4), 26, C.gold);
    }
    p.text(
      done === 0
        ? 'Start inactive'
        : done === 3
          ? 'Review cleared'
          : askFour && !four
            ? 'At 4 jobs   ·   what happens?'
            : four
              ? 'Review stays open'
              : 'Review opened',
      640,
      602,
      34,
      done === 3 ? C.teal : C.ink,
      'center',
      'Serif',
    );
  }
}

// A relay reads one sample at a time. Future readings can be shown as a worksheet
// while the counters, contacts and output trace stop at the last processed sample.
const traceCues = [
  [
    [1, 'Five gives'],
    [1, 'While it stays'],
    [2, 'Keep the review'],
    [2, 'Two jobs over'],
    [2, null],
  ],
  [
    [0, 'The second opens'],
    [0, null],
    [1, 'At fifteen'],
    [1, 'At twenty'],
    [1, 'The next reading'],
    [2, 'At thirty'],
    [2, 'At thirty-five'],
    [2, null],
  ],
  [
    [2, 'Five starts a breach run'],
    [2, 'The gap at minute five breaks it'],
    [2, 'Six starts another run'],
    [2, 'Seven is the second breach, so the review opens at minute fifteen'],
    [3, 'That starts a clean run'],
    [3, 'The gap at twenty-five wipes out that run'],
    [3, 'Zero starts the count again'],
    [3, 'The review clears at minute thirty-five'],
  ],
];
export function relay(p, which) {
  const values = streams[which],
    states = stateTrace(values),
    cues = traceCues[which];
  const readCue = which === 2 ? p.after : p.at;
  const read = cues.filter(([beat, phrase]) => readCue(beat, phrase)).length,
    cur = states[read - 1];
  const headings = [
    'A relay that needs two readings',
    'One review, eight checks',
    'A fresh five-minute stream',
  ];
  p.rect(0, 0, 1280, 720, C.night);
  p.text(headings[which], 73, 45, 45, C.light, 'left', 'Serif');
  p.text(
    'One cluster   /   inclusive ±3-job band   /   5 minutes per check',
    75,
    94,
    23,
    '#b4cfc0',
  );
  p.ctx.save();
  p.ctx.translate(0, -40);
  const left = 103,
    step = values.length === 5 ? 146 : 105,
    x = (i) => left + i * step,
    y = (v) => 318 - v * 17,
    xxEnd = x(values.length - 1);
  p.rect(65, 154, xxEnd - 23, 275, '#e9efdc');
  p.rect(65, y(3), xxEnd - 23, 102, '#bfd9c4');
  for (let v of [-3, 0, 3])
    p.line(65, y(v), xxEnd + 42, y(v), v === 0 ? C.edge : C.teal, v === 0 ? 1 : 2);
  const showInput = (i) => {
    if (which === 2)
      return i === 0 ? p.at(0, 'That gives the first error') : p.at(0, 'Two readings are missing');
    if (which === 1)
      return (
        i < read ||
        (i === 5 && p.at(1, 'Will the review')) ||
        (i === read && p.beat === 0 && i === 0)
      );
    return i < read;
  };
  values.forEach((v, i) => {
    const xx = x(i);
    p.mono(i * 5 + 'm', xx, 455, 20, C.light, 'center');
    if (!showInput(i)) return;
    if (v === null) {
      p.line(xx - 10, 324, xx + 10, 306, C.muted, 3);
      p.text('gap', xx, 383, 20, C.muted, 'center');
    } else {
      const col = i < read ? (Math.abs(v) > width ? C.red : C.teal) : C.ink;
      p.line(xx, y(0), xx, y(v), col, 3);
      p.dot(xx, y(v), 6, col);
      p.mono(signed(v), xx, y(v) + (v < 0 ? 35 : -22), 23, col, 'center');
    }
  });
  if (read) {
    p.line(x(read - 1) + 15, 159, x(read - 1) + 15, 419, C.gold, 2, [5, 5]);
    p.poly(
      [
        [x(read - 1) + 7, 155],
        [x(read - 1) + 23, 155],
        [x(read - 1) + 15, 166],
      ],
      C.gold,
    );
  }
  const openY = 511,
    shutY = 561;
  p.text('Open', 68, openY, 16, '#b7d8c4', 'right');
  p.text('Idle', 68, shutY, 16, '#b7d8c4', 'right');
  p.line(80, shutY, x(0), shutY, C.mint, 3);
  for (let i = 0; i < read; i++) {
    const s = states[i],
      prev = states[i - 1]?.active ? openY : shutY,
      now = s.active ? openY : shutY;
    if (i) p.line(x(i - 1), prev, x(i), prev, C.mint, 4);
    p.line(x(i), prev, x(i), now, C.mint, 4);
    p.dot(x(i), now, 5, C.mint);
    if (s.transition)
      p.mono(
        s.transition === 'review' ? 'OPEN' : 'CLEAR',
        x(i),
        now + (s.active ? -19 : 23),
        17,
        C.amber,
        'center',
      );
  }
  const rx = 952,
    ry = 182,
    rw = 257;
  p.rect(rx, ry, rw, 374, '#254340');
  p.text('Review relay', rx + 22, ry + 40, 30, C.light, 'left', 'Serif');
  // A closed contact completes the circuit when a review is active.
  const active = cur?.active ?? false;
  p.line(rx + 29, ry + 120, rx + 82, ry + 120, C.light, 5);
  p.line(rx + 157, ry + 120, rx + 226, ry + 120, C.light, 5);
  p.line(rx + 82, ry + 120, rx + 157, ry + (active ? 120 : 81), active ? C.amber : C.mint, 6);
  p.dot(rx + 82, ry + 120, 6, C.light);
  p.dot(rx + 157, ry + 120, 6, C.light);
  p.text(active ? 'Active review' : 'Inactive', rx + 24, ry + 168, 27, active ? C.amber : C.mint);
  p.line(rx + 20, ry + 204, rx + rw - 20, ry + 204, C.edge, 1);
  [
    ['Breach run', cur?.breaches ?? 0],
    ['Clean run', cur?.clean ?? 0],
  ].forEach(([n, v], i) => {
    p.text(n, rx + 22, ry + 246 + i * 56, 21, C.light);
    p.mono(v, rx + rw - 25, ry + 246 + i * 56, 31, C.amber, 'right');
  });
  for (const v of [-3, 0, 3]) p.mono(signed(v), 55, y(v), 17, C.light, 'right');
  p.ctx.restore();
  let caption = 'Two consecutive breaches open a review. Two clean readings clear it.';
  if (which === 2 && p.beat === 0) caption = 'Minute 0    Forecast 150 jobs    Observed 155 jobs';
  if (which === 2 && p.beat === 1) caption = 'When does review open? When does it clear?';
  if (which === 1 && read === 5 && p.at(1, 'Will the review'))
    caption = 'Minute 25 brings +4. Will the review clear?';
  if (cur?.error === null)
    caption = 'Missing reading    /    both counters reset    /    review state retained';
  if (cur?.transition)
    caption =
      (cur.transition === 'review' ? 'Review opens' : 'Review clears') +
      ' at minute ' +
      cur.minute +
      '.';
  if (which === 2 && p.beat >= 4) {
    const requests = states.filter(({ transition }) => transition === 'review');
    const unknown = p.after(5, 'Delivery is unknown');
    p.line(78, 555, 1194, 555, C.edge, 1);
    p.mono('Request', 78, 577, 20, C.mint);
    p.mono(requests.length + ' at ' + requests[0].minute + 'm', 190, 577, 22, C.amber);
    p.mono('Delivery ACK', 420, 577, 20, C.mint);
    p.line(618, 592, 805, 592, C.edge, 2);
    if (unknown) p.text('Unknown', 626, 573, 25, C.amber);
    p.text(
      unknown ? 'Match the request ID.' : 'Did it arrive?',
      859,
      577,
      23,
      C.light,
    );
    return;
  }
  p.text(caption, 77, 571, 25, C.light);
}
export function joint(p) {
  const project = p.at(1, 'Squared reconstruction'),
    first = p.at(1, 'Separate range'),
    b = p.at(2, 'both coordinates'),
    zero = p.at(2, null);
  p.title('How far from the diagonal?', 'Two standardized metrics   /   equal scale on both axes');
  const ox = 399,
    oy = 405,
    scale = 37,
    x = (v) => ox + v * scale,
    y = (v) => oy - v * scale;
  p.graph(x(-6), y(6), 12 * scale, 12 * scale, scale);
  p.rect(x(-1), y(1), 2 * scale, 2 * scale, C.band);
  p.line(x(-6), y(0), x(6), y(0), C.edge, 2);
  p.line(x(0), y(6), x(0), y(-6), C.edge, 2);
  p.line(x(-6), y(-6), x(6), y(6), C.teal, 4);
  for (const v of [-5, 0, 5]) {
    p.mono(v, x(v), y(-6) + 25, 19, C.muted, 'center');
    p.mono(v, x(-6) - 16, y(v), 19, C.muted, 'right');
  }
  p.text('x₁', 650, 636, 22, C.muted);
  p.text('x₂', 129, 187, 22, C.muted);
  const a = diagonalProjection([1, -1]),
    other = diagonalProjection([5, 5]);
  p.dot(x(1), y(-1), 9, C.red);
  p.mono('A', x(1) + 13, y(-1) + 14, 21, C.red);
  if (project) {
    p.line(x(1), y(-1), ox, oy, C.red, 4);
    p.dot(ox, oy, 6, C.ink);
  }
  if (b) {
    p.dot(x(5), y(5), 10, C.blue);
    p.mono('B', x(5) + 16, y(5) - 7, 22, C.blue);
  }
  p.text('A    (1, −1)', 728, 217, 34, C.red, 'left', 'Serif');
  p.text('Inside both ranges', 729, 267, 24, C.muted);
  if (project) p.mono('Foot   (0, 0)', 729, 316, 24, C.ink);
  if (first) p.mono('1² + (−1)² = ' + a.score, 729, 362, 26, C.red);
  if (b) {
    p.text('B    (5, 5)', 728, 451, 34, C.blue, 'left', 'Serif');
    p.text('Outside both ranges', 729, 501, 24, C.muted);
  }
  if (zero) p.mono('0² + 0² = ' + other.score, 729, 551, 26, C.blue);
  if (p.beat >= 3) {
    p.text('Fit on earlier healthy pairs.', 728, 603, 21, C.muted);
    p.text('Test on later labeled periods.', 728, 640, 21, C.muted);
  }
}
export function usefulness(p) {
  const r = auditLabels(labels),
    prec = p.at(1, 'Now form a different'),
    rec = p.at(1, 'With five periods');
  p.title('Find the third member of each group', 'Five illustrative periods with known outcomes');
  p.text('Period', 94, 217, 22, C.muted);
  p.text('Alerted?', 94, 309, 22, C.muted);
  p.text('Actionable?', 94, 397, 22, C.muted);
  labels.forEach(([a, b], i) => {
    const xx = 325 + i * 187;
    p.text('ABCDE'[i], xx, 216, 38, C.ink, 'center', 'Serif');
    [a, b].forEach((v, j) => {
      const yy = 310 + j * 88;
      p.rect(xx - 51, yy - 24, 102, 48, v ? (j ? C.band : C.blush) : '#e5e3d4');
      p.text(v ? 'Yes' : 'No', xx, yy, 23, v ? (j ? C.teal : C.red) : C.muted, 'center');
    });
  });
  p.line(91, 465, 1185, 465, C.edge, 2);
  if (prec) {
    for (const [i, [alert, actionable]] of labels.entries()) {
      const member = rec ? actionable : alert;
      if (member) {
        const xx = 325 + i * 187,
          yy = rec ? 426 : 339;
        p.line(xx - 50, yy, xx + 50, yy, rec ? C.teal : C.red, 5);
      }
    }
  }
  if (prec)
    p.text(
      'Precision    A, E  /  A, B, E    =    ' + r.caught + '/' + r.alerted,
      94,
      535,
      30,
      C.red,
      'left',
      'Serif',
    );
  if (rec)
    p.text(
      'Recall         A, E  /  A, C, E    =    ' + r.caught + '/' + r.actionable,
      94,
      607,
      30,
      C.teal,
      'left',
      'Serif',
    );
  if (!prec)
    p.text(
      'Which periods belong in the denominator for precision?',
      92,
      559,
      29,
      C.ink,
      'left',
      'Serif',
    );
}
export function identity(p) {
  const conflict = p.at(1, 'When the same event'),
    accepted = p.at(0, null),
    review = p.at(1, null);
  const rows = eventRows(conflict),
    d = deduplicateEvents(rows);
  p.title('Line up the event IDs', 'Outbound job starts   /   retained source snapshot');
  p.text('Incoming event', 97, 188, 26, C.muted);
  p.text('Payload', 392, 188, 26, C.muted);
  p.text('Disposition', 840, 188, 26, C.muted);
  rows.forEach((r, i) => {
    const yy = 251 + i * 95,
      col = i === 1 && conflict ? C.red : C.ink;
    p.rect(86, yy - 32, 1097, 70, i === 1 ? (conflict ? C.blush : C.band) : '#fffbea');
    p.mono(r.event_id, 104, yy, 25, col);
    p.mono(r.job_id + '   ' + r.type, 393, yy, 24, col);
    if (accepted)
      p.text(
        i === 1
          ? conflict
            ? review
              ? 'Quarantine conflict'
              : 'Compare payloads'
            : 'Collapse copy'
          : 'Keep first event',
        842,
        yy,
        24,
        col,
      );
  });
  if (accepted)
    p.text(
      d.raw + ' rows   →   ' + d.unique.length + ' accepted IDs',
      92,
      566,
      36,
      C.teal,
      'left',
      'Serif',
    );
  if (review) {
    const conflictRow = d.conflicts[0].incoming;
    p.rect(88, 602, 1095, 57, C.blush);
    p.text('Set aside', 106, 629, 23, C.red);
    p.mono(
      conflictRow.event_id + '   ' + conflictRow.job_id + '   ' + conflictRow.type,
      393,
      629,
      24,
      C.red,
    );
  }
}
export function gates(p) {
  const empty = p.beat === 1 && p.at(1, 'Python’s all'),
    inspect = empty ? p.at(1, 'Read the count') : true;
  p.title(
    p.beat === 0
      ? 'What did the fixture actually check?'
      : p.beat === 1
        ? empty
          ? 'Run the same predicate on the empty tray'
          : 'Inspect the tray before removal'
        : 'Restore Friday’s record',
  );
  if (p.beat === 0) {
    checks.forEach(([label, pass], i) => {
      const col = i % 3,
        row = Math.floor(i / 3),
        xx = 95 + col * 385,
        yy = 238 + row * 108;
      p.dot(xx, yy, 12, pass ? C.teal : C.red);
      p.text(label, xx + 27, yy, 24, C.ink);
    });
    p.text(
      'Remove Friday’s only alert. Will the field check pass?',
      93,
      617,
      30,
      C.ink,
      'left',
      'Serif',
    );
  } else {
    const items = empty ? [] : [docket];
    p.ticket(96, 216, 467, 273);
    p.text('Alert tray', 146, 262, 26, C.muted);
    p.text(
      empty ? '[    ]' : 'Friday   ·   capacity-ops',
      146,
      338,
      31,
      empty ? C.muted : C.teal,
      'left',
      'Serif',
    );
    p.mono('Rows   ' + items.length, 146, 423, 24, C.ink);
    p.arrow(576, 352, 691, 352, C.edge);
    p.text('All rows have the fields?', 733, 263, 27, C.ink);
    p.text(
      inspect ? (hasFields(items) ? 'True' : 'False') : '?',
      729,
      354,
      64,
      C.teal,
      'left',
      'Serif',
    );
    p.text(inspect ? 'Rows missing fields   0' : 'Checking rows', 733, 429, 23, C.muted);
    if (p.at(2, 'To reproduce it'))
      p.text('Recorded run   c4e1172858f1     /     keep its inputs and code', 96, 618, 25, C.ink);
  }
}
export function narrower(p) {
  const proposedWidth = 2;
  const proposal = p.after(1, 'Suppose we tighten the half-width to two jobs'),
    joined = p.after(2, 'Tuesday joins Friday'),
    slide = p.move(2, 'Bring the edges in', 1.6),
    outside = p.after(2, 'Tuesday’s plus three is outside'),
    onEdge = p.after(2, 'Wednesday’s minus two sits right on the edge and stays covered'),
    coverage = p.after(2, 'Coverage falls from six days out of seven to five'),
    queue = p.after(2, 'One crossing becomes two');
  const w = mix(width, proposedWidth, slide),
    previousCoverage = covered(width),
    nextCoverage = covered(proposedWidth);
  p.title(
    'Move the edges, keep the observations',
    'Daily forecast errors in jobs   /   Jan 26 to Feb 1   /   both edges included',
  );
  const x = (v) => 440 + v * 68,
    yy = (i) => 194 + i * 53;
  p.rect(x(-w), 167, 2 * w * 68, 369, C.band);
  if (proposal && slide === 0) {
    for (const edge of [-proposedWidth, proposedWidth])
      p.line(x(edge), 167, x(edge), 536, C.gold, 2, [7, 6]);
    p.text('Proposed edges at ±' + proposedWidth, 833, 150, 21, C.gold);
  }
  for (const edge of [-w, w]) p.line(x(edge), 167, x(edge), 536, C.blue, 3);
  for (let i = -4; i <= 5; i++) p.mono(signed(i), x(i), 568, 20, C.muted, 'center');
  p.line(x(5) + 42, 166, x(5) + 42, 534, C.edge, 2, [5, 7]);
  errors.forEach((e, i) => {
    const y = yy(i),
      alreadyOutside = Math.abs(e) > width,
      added = !alreadyOutside && Math.abs(e) > proposedWidth,
      edge = Math.abs(e) === proposedWidth,
      color = alreadyOutside || (added && outside) ? C.red : added && joined ? C.gold : C.teal,
      xx = e > 5 ? 1009 : x(e);
    p.text(weekdayNames[holdout[i].weekday], 73, y, 24, C.ink);
    p.line(144, y, 1088, y, C.grid, 1);
    if (e > 5) p.arrow(822, y, 978, y, C.red);
    if ((added && joined) || (edge && onEdge)) p.dot(xx, y, 15, color, true);
    p.dot(xx, y, 9, color);
    p.mono(signed(e), xx + 22, y, 23, color === C.teal ? C.ink : color);
  });
  const total = errors.length;
  if (!joined || coverage) {
    const before = previousCoverage + '/' + total;
    const count = coverage ? before + ' → ' + nextCoverage + '/' + total : before;
    p.text('Within band   ' + count, 111, 621, 31, C.teal, 'left', 'Serif');
  }
  if (!joined || queue) {
    const before = total - previousCoverage;
    const count = queue ? before + ' → ' + (total - nextCoverage) + ' days' : before + ' day';
    p.text('Review queue   ' + count, 756, 621, 31, C.red, 'left', 'Serif');
  }
}
export function wrap(p) {
  const out = p.at(0, null);
  if (p.beat === 0) {
    p.title('Reconstruct Friday from its issue time');
    recorder(p, 1, true, out, false);
    p.text(
      'Jan 23 source    /    Jan 25 cutoff    /    Jan 29 issue    /    Jan 30 target',
      97,
      636,
      26,
      C.muted,
    );
    return;
  }
  p.title('Score the week containing Friday’s launch');
  p.text(
    'Daily one-step forecast errors in jobs, Jan 26 to Feb 1',
    87,
    160,
    31,
    C.ink,
    'left',
    'Serif',
  );
  p.text('Error = observed − forecast', 88, 204, 23, C.muted);
  errors.forEach((e, i) => {
    const xx = 115 + i * 159;
    const row = holdout[i];
    p.rect(xx, 239, 126, 147, row.launch_event ? C.blush : C.band);
    p.text(
      weekdayNames[row.weekday] + ' ' + Number(row.date.slice(-2)),
      xx + 63,
      273,
      24,
      C.muted,
      'center',
    );
    p.mono(signed(e), xx + 63, 333, 36, row.launch_event ? C.red : C.teal, 'center');
  });
  if (p.after(1, 'six observations landed inside the band')) {
    p.text('Within ±' + width + ' jobs', 724, 456, 26, C.ink);
    p.mono(covered(width) + ' / ' + errors.length, 1001, 456, 30, C.blue);
  }
  if (p.after(1, 'five point three jobs')) {
    p.text('All days', 110, 456, 26, C.ink);
    p.mono('MAE ' + mae(errors).toFixed(1) + ' jobs', 372, 456, 30, C.ink);
  }
  if (p.after(1, 'one and a half jobs')) {
    p.text('Routine days', 110, 515, 26, C.teal);
    p.mono('MAE ' + mae(routineErrors).toFixed(1) + ' jobs', 372, 515, 30, C.teal);
  }
  if (p.after(2, 'capacity operations a review')) {
    const pending = p.after(2, 'Its resolution is pending');
    p.text(
      'Friday   /   owner ' + docket.owner + (pending ? '   /   resolution ' + docket.resolution : ''),
      107,
      567,
      33,
      C.red,
      'left',
      'Serif',
    );
  }
}

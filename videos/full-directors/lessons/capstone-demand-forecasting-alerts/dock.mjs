import {
  P,
  box,
  path,
  line,
  dot,
  text,
  num,
  label,
  title,
  sheet,
  paper,
  head,
  alpha,
  stamp,
  arrow,
  carton,
  clockFace,
  calendar,
  tick,
  cue,
  beat,
  f,
} from './art.mjs';
import {
  fri,
  wed,
  windows,
  counts,
  eligible,
  origins,
  sourceDay,
  scenarios,
  booking,
  features,
  fridayTerms,
  replay,
} from './forecast.mjs';

function depot(g) {
  box(g, 0, 0, 960, 540, '#c7dcdc');
  for (let i = 0; i < 6; i++) {
    const x = i * 184 - 65;
    path(
      g,
      [
        [x, 88],
        [x + 166, 31],
        [x + 166, 88],
      ],
      '#a9c7c9',
      '#697f80',
      2,
    );
    line(g, x + 113, 51, x + 113, 88, '#78999a', 3);
  }
  box(g, 0, 86, 960, 272, '#e6dbc4');
  box(g, 0, 86, 960, 7, '#667877');
  for (let x = 0; x < 960; x += 20) line(g, x, 94, x, 350, '#d7ceba', 1);
  box(g, 32, 119, 509, 147, '#b3b9a8', '#637574', 3);
  for (let y = 125; y < 265; y += 11) line(g, 34, y, 539, y, '#8f9e90', 1.6);
  box(g, 0, 351, 960, 189, '#c9bda7');
  for (let x = -130; x < 1100; x += 125)
    line(g, x, 540, 410 + (x - 410) * 0.6, 352, '#b8ad98', 1.5);
}
function roster(g, open) {
  g.save();
  g.translate(681, 109);
  g.rotate(0.025);
  sheet(g, 0, 0, 222, 131, open ? P.white : '#48655d');
  box(g, 67, -5, 86, 13, '#687976');
  if (open) {
    label(g, 'FRIDAY  /  SHIFT ROSTER', 14, 33);
    line(g, 14, 42, 207, 42, P.edge);
    text(g, 'Crew capacity', 14, 66, 15);
    num(g, fri.cap, 205, 67, 19, P.ink, 'right');
    stamp(g, 'Review staffing', 22, 110, P.rust, 21);
  } else {
    label(g, 'SHIFT ROSTER', 111, 65, P.white, 19, 'center');
    text(g, 'Friday, 6 February', 111, 94, 16, P.light, 'Serif', 500, 'center');
  }
  g.restore();
}
export function opening(g, k) {
  depot(g);
  const x0 = 47,
    unit = 4.32,
    edge = x0 + fri.cap * unit;
  const laid = cue(k, 1, 'Lay out', 1.65),
    opened = cue(k, 2, 'Open the roster');
  const sat = cue(k, 3, 'At six'),
    verified = cue(k, 3, 'One hundred seventy-six', 0.48);
  const scored = cue(k, 3, 'almost thirteen parcels low');
  box(g, 51, 135, 465, 109, '#213e3e');
  label(g, 'FC-A     /     STANDARD PARCELS', 67, 160, '#c1d5bc');
  text(g, sat ? 'Saturday audit' : 'Friday loading dock', 65, 205, 35, P.white, 'Serif');
  roster(g, opened);
  box(g, 0, 334, edge, 44, '#6e7d6f');
  box(g, 0, 334, edge, 8, '#e2c16a');
  for (let x = 10; x < edge - 8; x += 28)
    path(
      g,
      [
        [x, 341],
        [x + 11, 341],
        [x + 1, 355],
        [x - 10, 355],
      ],
      '#344c47',
    );
  line(g, edge, 271, edge, 399, P.rust, 3);
  label(g, '150  /  crew limit', edge - 9, 399, P.ink, 15, 'right');
  const packages = Math.ceil(fri.forecast / 10);
  for (let i = 0; i < packages; i++) {
    const a = i === 0 ? 1 : Math.min(1, Math.max(0, laid * packages - i));
    const n = Math.min(10, fri.forecast - i * 10);
    const span = n * unit;
    const face = span - Math.min(6, (span * 0.18) / 1.18);
    const glide = i === 0 && beat(k) === 1 ? Math.max(0, 1 - k.elapsed / 1.1) : 0;
    alpha(g, a, () => carton(g, x0 + i * unit * 10 - 34 * glide, 290 - (1 - a) * 19, face, 42, i));
  }
  const fx = x0 + fri.forecast * unit;
  if (laid >= 1) {
    tick(g, fx, 285, 19, P.blue);
    label(g, 'Issued  ' + f(fri.forecast, 3), fx - 4, 258, P.blue, 16, 'right');
  }
  if (beat(k) === 2 && k.reveal('thirteen parcels past', 0, { captionStart: false })) {
    const y = 365;
    line(g, edge, y, fx, y, P.rust, 3);
    tick(g, edge, y, 8, P.rust);
    tick(g, fx, y, 8, P.rust);
    label(g, '+' + f(fri.forecast - fri.cap) + ' parcels', fx + 12, y + 5, P.rust, 19);
  }
  if (sat) {
    box(g, fx - 6 * unit, 420, 12 * unit, 16, P.sky);
    line(g, x0, 428, 884, 428, P.dim, 1.5);
    tick(g, edge, 428, 10, P.rust);
    tick(g, fx, 428, 13, P.blue);
    const ax = x0 + fri.actual * unit;
    alpha(g, verified, () => {
      tick(g, ax, 428, 15, P.teal);
      label(g, '176 final', ax + 8, 421, P.teal, 16);
      if (scored) {
        line(g, fx, 456, ax, 456, P.teal, 3);
        text(
          g,
          '+' + f(fri.actual - fri.forecast) + ' parcels',
          fx - 5,
          453,
          20,
          P.teal,
          'Mono',
          600,
        );
      }
    });
    label(g, 'SAT 7 FEB   /   06:00 UTC', 48, 408, P.ink);
    text(
      g,
      beat(k) === 4
        ? 'Data or model owner: investigate the miss.'
        : 'Blue band: within six parcels of the issued point.',
      48,
      471,
      18,
      P.ink,
      'Serif',
    );
  } else {
    label(g, 'SUN 1 FEB   /   08:00 UTC', 47, 433, P.ink);
    text(g, 'One full carton represents ten forecast parcels.', 47, 466, 20, P.ink, 'Serif');
  }
}
function truck(g, x, y) {
  box(g, x, y, 256, 73, '#315b68', P.ink, 2);
  box(g, x + 4, y + 6, 246, 52, '#d7ded0');
  for (let i = 0; i < 15; i++)
    carton(g, x + 14 + (i % 5) * 47, y + 10 + Math.floor(i / 5) * 16, 40, 12, i);
  path(
    g,
    [
      [x + 256, y + 18],
      [x + 297, y + 18],
      [x + 321, y + 43],
      [x + 321, y + 70],
      [x + 256, y + 70],
    ],
    '#b75a3b',
    P.ink,
    2,
  );
  path(
    g,
    [
      [x + 270, y + 24],
      [x + 294, y + 24],
      [x + 310, y + 42],
      [x + 270, y + 42],
    ],
    '#aacbcc',
  );
  for (const a of [41, 224, 285]) {
    dot(g, x + a, y + 75, 13, P.ink);
    dot(g, x + a, y + 75, 5, '#c4c6ab');
  }
}
export function target(g, k) {
  head(g, 'FC-A   /   REQUESTS AND COMPLETIONS', 'Two days at the same dock');
  label(g, 'Truck load: 15 bundles × 10 parcels', 48, 126, P.blue, 13);
  const extra = cue(k, 1, 'Another twenty-six', 0.7),
    depart = cue(k, 1, 'truck pulls away', 1.05);
  const answer = cue(k, 3, 'Count requests'),
    closed = cue(k, 3, 'ordering closes');
  for (let i = 0; i < 2; i++) {
    const y = 145 + i * 151;
    label(g, i ? 'DAY B' : 'DAY A', 46, y + 17);
    box(g, 45, y + 24, 570, 83, '#dfdfcc');
    box(g, 45, y + 105, 570, 10, '#778779');
    if (i) {
      alpha(g, extra, () => {
        for (let a = 0; a < 26; a++)
          carton(
            g,
            122 + Math.floor(a / 10) * 32 + (a % 2) * 12,
            y + 95 - Math.floor((a % 10) / 2) * 13,
            11,
            10,
            a,
          );
      });
    }
    g.save();
    g.beginPath();
    g.rect(45, y + 14, 570, 94);
    g.clip();
    truck(g, 105 + (i ? depart : 0) * 520, y + 17);
    g.restore();
    text(g, 'Shipped', 648, y + 38, 17, P.dim);
    num(g, 150, 901, y + 41, 27, P.blue, 'right');
    line(g, 648, y + 51, 906, y + 51);
    text(g, 'Requested', 648, y + 81, 17, answer ? P.teal : P.dim);
    num(g, i ? (extra >= 1 ? 176 : '…') : 150, 901, y + 83, 27, answer ? P.teal : P.ink, 'right');
    if (i && depart >= 1) label(g, '26 waiting', 260, y + 95, P.rust, 16);
  }
  if (closed)
    text(
      g,
      'If ordering closes, customers who leave can disappear from both logs.',
      46,
      475,
      21,
      P.rust,
      'Serif',
    );
}
export function cost(g, k) {
  const b = beat(k),
    found = cue(k, 3, 'One hundred sixty'),
    pricing = cue(k, 3, 'price that smaller booking');
  const moved = cue(k, 4, 'Move the booking'),
    high = cue(k, 4, 'Book all two hundred forty');
  const a = high ? 240 : moved ? 160 : 100,
    priced = booking(a);
  head(g, 'BOOKING WORKSHEET   /   ONE INDEPENDENT DAY', 'What is an empty place worth?');
  const pin = cue(k, 5, 'quantile loss');
  const xs = [63, 211, 346, 532, 724],
    heads = ['Demand', 'Chance', 'Cumulative', 'Gap at booking', 'Weighted cost'];
  heads.forEach((s, i) => label(g, s, xs[i], 145));
  let cum = 0;
  scenarios.forEach(([y, p], i) => {
    const row = priced.rows[i],
      ry = 162 + i * 57;
    cum += p;
    box(g, 48, ry, 860, 50, i % 2 ? P.paper : P.white);
    if (found && i === 1) box(g, xs[2] - 9, ry + 2, 140, 46, P.mint);
    num(g, y, xs[0], ry + 34, 24);
    num(g, f(p, 2), xs[1], ry + 34, 20);
    box(g, xs[2], ry + 37, 113, 4, '#d8dccd');
    box(g, xs[2], ry + 37, 113 * cum, 4, P.teal);
    num(g, f(cum), xs[2], ry + 28, 19, P.teal);
    if (pricing) {
      text(
        g,
        row.short ? row.short + ' short' : row.spare ? row.spare + ' spare' : 'Exact fit',
        xs[3],
        ry + 32,
        19,
        row.short ? P.rust : P.dim,
      );
      num(g, f(row.term, row.term % 1 ? 1 : 0), xs[4], ry + 33, 23);
    }
  });
  if (!pricing) {
    text(g, 'Short by one parcel', 52, 383, 19);
    num(g, '3 units', 284, 383, 23, P.rust);
    text(g, 'One spare place', 485, 383, 19);
    num(g, '1 unit', 745, 383, 23, P.teal);
    if (cue(k, 2, 'Three over four'))
      text(g, 'One day, constant unit costs      3 / (3 + 1) = 0.75', 52, 445, 25, P.ink, 'Serif');
  } else {
    label(g, 'BOOKED PLACES', 52, 366);
    num(g, a, 52, 412, 40, P.blue);
    label(g, 'MEAN ABSOLUTE GAP', 320, 366);
    num(g, priced.mae + ' parcels', 320, 412, 31);
    label(g, 'EXPECTED COST', 655, 366);
    num(g, priced.cost + ' units', 655, 412, 31, P.rust);
    if (moved)
      text(
        g,
        pin
          ? 'Pinball loss   /   100: ' +
              f(booking(100).cost / 4) +
              '     160: ' +
              f(booking(160).cost / 4) +
              '     240: ' +
              f(booking(240).cost / 4)
          : 'Booking     100 → 129 units       160 → 81 units' +
              (high ? '       240 → 97 units' : ''),
        52,
        463,
        19,
        P.teal,
        'Serif',
      );
    if (b === 6) text(g, 'Measured savings require actual bookings and fees.', 52, 498, 16, P.dim);
  }
}
export function horizons(g, k) {
  const b = beat(k);
  const shared = b >= 5 && cue(k, 5, 'one calendar regression');
  const joint = b === 5 && !shared && cue(k, 5, 'A joint model');
  head(
    g,
    'FC-A   /   SEVEN UTC CALENDAR DAYS',
    b <= 2
      ? 'Seven dates leave together'
      : b <= 4
        ? 'Yesterday becomes an input'
        : shared
          ? 'Seven rows share one fit'
          : joint
            ? 'A joint fit predicts a vector'
            : 'One fit for each horizon',
  );
  if (b <= 2) {
    for (let j = 0; j < 2; j++) {
      const y = 165 + j * 144;
      label(g, 'SUN ' + (1 + 7 * j) + ' FEB  /  08:00', 45, y - 17, P.teal);
      for (let i = 0; i < 7; i++) {
        const r = windows[i + 7 * j],
          x = 48 + i * 125;
        box(g, x, y, 115, 89, i === 2 ? P.sky : P.white, P.edge);
        label(
          g,
          ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] + ' ' + r.date,
          x + 8,
          y + 22,
        );
        num(g, 'h' + r.h, x + 8, y + 48, 20, P.ink);
        label(g, 'Room for ' + r.cap, x + 8, y + 76, P.dim, 12);
      }
    }
    if (b === 2)
      text(
        g,
        'Choose the lead time for changing a shift. Define the facility’s business day.',
        48,
        463,
        20,
        P.ink,
        'Serif',
      );
  } else if (b <= 4) {
    const first = cue(k, 3, 'first prediction is sixty'),
      second = cue(k, 3, 'Now we get forty');
    const v = [100, 100 * 0.5 + 10, (100 * 0.5 + 10) * 0.5 + 10];
    for (let i = 0; i < 3; i++) {
      const x = 70 + i * 296;
      label(g, ['OBSERVED', 'HORIZON 1', 'HORIZON 2'][i], x, 218, P.dim);
      box(g, x, 235, 156, 92, i ? P.sky : P.mint, P.edge);
      num(
        g,
        i === 0 || (i === 1 ? first : second) ? v[i] : '?',
        x + 78,
        301,
        48,
        i ? P.blue : P.teal,
        'center',
      );
      if (i < 2) {
        arrow(g, x + 160, 280, x + 280, 280, P.dim, 2);
        text(g, '× ½ + 10', x + 218, 262, 16, P.dim, 'Mono', 500, 'center');
      }
    }
    if (b === 4)
      text(
        g,
        'An error in the first prediction enters the second calculation.',
        70,
        402,
        25,
        P.rust,
        'Serif',
      );
  } else {
    label(g, shared ? 'FUTURE FEATURES' : 'HORIZON', 56, 159);
    for (let i = 0; i < 7; i++) {
      const x = 58 + i * 123,
        r = windows[i];
      box(g, x, 184, 104, 115, P.white, P.edge);
      label(g, 'h' + r.h, x + 12, 212);
      text(g, r.day.slice(5), x + 12, 245, 22, P.ink, 'Mono');
      if (shared)
        label(g, i === 2 || i === 4 ? 'Campaign 1' : 'Campaign 0', x + 7, 279, P.blue, 12);
      line(g, x + 51, 299, x + 51, 329, P.teal, 2);
    }
    if (shared || joint) {
      box(g, 58, 329, 841, 56, shared ? P.teal : P.ink);
      text(
        g,
        shared
          ? 'Weekday, time and known plan  ×  shared weights'
          : 'Joint model   /   one vector of seven predictions',
        478,
        365,
        23,
        P.white,
        'Serif',
        500,
        'center',
      );
    } else {
      for (let i = 0; i < 7; i++) {
        const x = 58 + i * 123;
        box(g, x, 329, 104, 56, P.ink);
        label(g, 'Fit ' + (i + 1), x + 52, 364, P.white, 17, 'center');
      }
    }
    if (b === 6)
      text(g, 'Evaluate each horizon on its own target dates.', 58, 441, 22, P.ink, 'Serif');
  }
}
export function origin(g, k) {
  const second = cue(k, 2, 'Sunday the eighth'),
    passed = cue(k, 3, 'six newly available');
  const cutoff = origins[second ? 1 : 0],
    mature = eligible(counts, cutoff);
  head(g, 'AUDIT ROOM   /   EXPANDING TRAINING WINDOW', 'Which counts have cleared audit?');
  clockFace(g, 92, 169, 32, 8);
  label(g, 'FIT AT 08:00 UTC', 150, 157);
  title(g, second ? 'Sunday, 8 February' : 'Sunday, 1 February', 149, 191, 28);
  for (let i = 0; i < 7; i++) {
    const x = 49 + i * 124,
      day = '2026-02-0' + (i + 1),
      row = counts.find((r) => r.day === day);
    const ok = row.final && row.at <= cutoff;
    sheet(g, x, 232, 109, 99, ok && passed ? P.mint : P.white);
    label(g, 'FEB ' + (i + 1), x + 11, 258);
    text(
      g,
      ok
        ? passed
          ? 'In fit'
          : 'Final'
        : second
          ? passed
            ? 'Withheld'
            : 'In audit'
          : i === 0
            ? 'Day open'
            : 'Upcoming',
      x + 11,
      293,
      17,
      ok ? P.teal : P.dim,
      'Serif',
      600,
    );
    if (ok && passed) box(g, x, 322, 109, 9, P.teal);
  }
  text(g, 'Training rows', 49, 394, 19);
  if (!second || passed) num(g, mature.length, 49, 454, 50, P.teal);
  else num(g, '62 + ?', 49, 454, 45, P.teal);
  if (second) {
    label(g, 'FEB 7 BATCH', 413, 393, P.rust);
    text(g, 'Available Monday, 9 February at 06:00 UTC', 413, 428, 20, P.ink, 'Serif');
  } else text(g, 'Latest final day     31 January', 365, 433, 24, P.dim, 'Serif');
}
export function copyDay(g, k) {
  const sat = beat(k) === 3;
  const pick = sat ? cue(k, 3, 'January thirty-first had') : cue(k, 2, 'January twenty-fifth');
  const copied = sat ? cue(k, 3, 'Copy eighty-eight') : cue(k, 2, 'Copy its eighty-six');
  const day = sat ? '2026-02-14' : '2026-02-08',
    r = sourceDay(day, origins[sat ? 1 : 0]);
  head(
    g,
    'SEASONAL NAIVE   /   SAME WEEKDAY',
    sat ? 'Find the last final Saturday' : 'Find the last final Sunday',
  );
  const dates = sat ? ['31', '7', '14'] : ['25', '1', '8'];
  const months = sat ? ['JANUARY', 'FEBRUARY', 'FEBRUARY'] : ['JANUARY', 'FEBRUARY', 'FEBRUARY'];
  for (let i = 0; i < 3; i++) {
    const x = 70 + i * 300;
    calendar(
      g,
      x,
      180,
      214,
      156,
      months[i],
      dates[i],
      i === 0
        ? 'Verified count'
        : i === 1
          ? sat
            ? 'Audit pending'
            : 'Day still open'
          : 'Forecast target',
      i === 1 ? '#806d58' : P.teal,
    );
  }
  if (pick) {
    num(g, r.y, 178, 388, 38, P.teal, 'center');
    line(g, 177, 402, 177, 422, P.teal, 3);
    line(g, 177, 422, 777, 422, P.teal, 3);
    arrow(g, 777, 422, 777, 398, P.teal, 3);
    if (copied) num(g, r.y, 778, 388, 38, P.blue, 'center');
    text(g, 'Source date    ' + r.day, 478, 474, 21, P.dim, 'Mono', 500, 'center');
  } else
    text(
      g,
      'Standing at the ' + (sat ? '8' : '1') + ' February issue, 08:00 UTC',
      480,
      426,
      23,
      P.dim,
      'Serif',
      500,
      'center',
    );
}

export function fitScene(g, k) {
  const b = beat(k),
    night = b <= 3;
  head(
    g,
    'CALENDAR REGRESSION   /   FIRST SUNDAY FIT',
    night ? 'A column for each weekday' : 'Assemble the Friday forecast',
    night,
  );
  if (night) {
    const train = eligible(counts, origins[0]);
    const X = train.map((r) => features(r.day, origins[0]));
    for (let j = 0; j < 9; j++) {
      const x = 51 + j * 60;
      label(
        g,
        ['M', 'T', 'W', 'T', 'F', 'S', 'S', 'Weeks', 'Plan'][j],
        x + 21,
        144,
        P.light,
        13,
        'center',
      );
      X.forEach((r, i) =>
        box(
          g,
          x,
          155 + i * 4.8,
          42,
          3.8,
          r[j] ? (j === 8 ? P.gold : j === 7 ? '#80ada8' : '#bad8c1') : '#295253',
        ),
      );
    }
    label(g, '62 final days', 632, 183, P.light, 17);
    if (b >= 2)
      label(g, 'Least squares minimizes the sum of squared residuals', 50, 486, P.light, 15);
    text(g, '9 features', 630, 235, 37, P.white, 'Serif');
    text(g, 'One weekday active per row', 632, 283, 18, P.light);
    if (cue(k, 2, 'rank nine')) {
      num(g, 'rank = 9', 631, 350, 29, P.gold);
      text(g, 'An intercept repeats the sum', 631, 396, 17, P.light);
      text(g, 'of the weekday columns.', 631, 422, 17, P.light);
      label(g, 'Fit requires finite weights', 631, 468, P.gold, 14);
    }
  } else {
    const trend = cue(k, 4, 'trend adds'),
      camp = cue(k, 5, 'announced campaign'),
      total = cue(k, 6, 'point two eight four');
    const flagOff = b === 5 && cue(k, 5, 'flag were zero');
    const terms = [fridayTerms[4], fridayTerms[7], flagOff ? 0 : fridayTerms[8]];
    const operands = ['1 × 131.312', '67/7 × 1.157', (flagOff ? '0' : '1') + ' × 20.900'];
    let run = 0;
    ['Friday offset', 'Elapsed weeks', 'Announced plan'].forEach((s, i) => {
      const y = 160 + 72 * i,
        on = i === 0 || (i === 1 && trend) || (i === 2 && camp);
      label(g, s, 53, y + 18, P.dim, 16);
      if (on) {
        text(g, operands[i], 53, y + 43, 14, P.dim, 'Mono');
        const left = 275 + run * 2.95;
        box(g, left, y, terms[i] * 2.95, 27, [P.blue, P.teal, P.gold][i]);
        num(g, f(terms[i], 3), 887, y + 23, 20, P.ink, 'right');
        run += terms[i];
      }
    });
    line(g, 50, 369, 908, 369);
    if (flagOff) {
      text(g, 'Replay with campaign off', 51, 408, 23, P.ochre, 'Serif');
      num(g, f(fri.forecast - fridayTerms[8], 3) + ' parcels', 905, 440, 30, P.ochre, 'right');
    } else if (total) {
      text(g, 'max(0, sum of full-precision products)', 51, 406, 20, P.dim);
      num(g, f(fri.forecast, 3) + ' parcels', 905, 440, 30, P.blue, 'right');
    } else
      text(
        g,
        'Friday × 1     +     weekly trend × 67/7     +     campaign × flag',
        51,
        412,
        19,
        P.ink,
        'Serif',
      );
    if (b === 7)
      label(
        g,
        'Plan cutoff: issue time for future dates  •  Earlier of fit and day start for history',
        51,
        481,
        P.teal,
        15,
      );
  }
}
export function campaign(g, k) {
  const filed = cue(k, 1, 'a hundred forty-five point', 0.5),
    copy = cue(k, 2, 'Open a separate replay'),
    calc = cue(k, 2, 'about a hundred twenty-four', 0.4);
  const arrived = cue(k, 2, 'One hundred twenty-three requests', 0.45),
    score = cue(k, 3, 'Score the filed forecast');
  head(
    g,
    'WEDNESDAY 4 FEBRUARY   /   PROMOTION ANNOUNCED 28 JANUARY',
    'Keep Sunday’s issue on its own rail',
  );
  const x = (n) => 278 + (n - 110) * 13;
  const capx = x(wed.cap);
  for (const n of [110, 120, 130, 140, 150]) {
    line(g, x(n), 162, x(n), 384, '#cbd0bd', 0.7);
    num(g, n, x(n), 408, 12, P.dim, 'center');
  }
  line(g, capx, 139, capx, 383, P.ochre, 1.5);
  label(g, '140 crew limit', capx + 6, 146, P.ochre);
  const lanes = [
    ['Filed on Sunday', wed.forecast, filed, P.blue],
    ['Replay with flag off', replay, calc, P.ochre],
    ['Thursday audit', wed.actual, arrived, P.teal],
  ];
  lanes.forEach(([s, v, a, color], i) => {
    if ((i === 1 && !copy) || (i === 2 && !arrived)) return;
    const y = 216 + i * 76;
    text(g, s, 48, y + 6, 21, color, 'Serif', 600);
    line(g, x(110), y, x(158), y, P.edge);
    alpha(g, a, () => {
      box(g, x(110), y - 5, x(v) - x(110), 10, color);
      tick(g, x(v), y, 9, color);
      num(g, i === 2 ? v : f(v, 3), x(v) + 9, y - 11, 18, color);
    });
  });
  if (arrived >= 1) {
    if (score) {
      const y = 425;
      line(g, x(wed.actual), y, x(wed.forecast), y, P.rust, 3);
      tick(g, x(wed.actual), y, 6, P.rust);
      tick(g, x(wed.forecast), y, 6, P.rust);
      text(
        g,
        'Filed miss: ' + f(wed.forecast - wed.actual, 2) + ' parcels',
        48,
        473,
        24,
        P.rust,
        'Serif',
        600,
      );
      if (cue(k, 3, 'just one parcel'))
        text(
          g,
          'Replay miss: ' + f(replay - wed.actual, 2) + ' parcels',
          504,
          473,
          22,
          P.ochre,
          'Serif',
        );
    } else text(g, 'Which mark did the planner have on Sunday?', 48, 453, 25, P.ink, 'Serif');
  } else if (filed >= 1)
    label(g, 'ISSUED  1 FEB 08:00 UTC    /    CAMPAIGN FLAG 1', 49, 460, P.blue, 15);
}
